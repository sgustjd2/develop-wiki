---
title: Envoy 재시도 정책 - retry_budget 과 retry_host_predicate
aka: [Envoy retry policy, retry_budget, budget_percent, min_retry_concurrency, retry_host_predicate, host_selection_retry_max_attempts, previous_hosts, retry_on, 재시도 예산, 재시도 호스트 선택]
category: performance
level: advanced
summary: Envoy 의 재시도를 제어하는 세 축. 어떤 실패를 다시 시도할지(retry_on), 몇 개까지 동시에 재시도할지(클러스터 retry_budget), 재시도를 어느 호스트로 보낼지(retry_host_predicate)를 v1.40 문서와 소스로 정리한다.
tags: [envoy, retry, retry-budget, retry-host-predicate, circuit-breaker, retry-storm, load-balancing, resilience]
related: [performance/timeout-retry-circuit-breaker, performance/adaptive-throttling-retry-budget, performance/metastable-failures-retry-storm, performance/envoy-outlier-detection, performance/envoy-zone-aware-routing-panic-threshold]
sources:
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/http/http_routing
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/api/envoy/config/route/v3/route_components.proto
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/api/envoy/config/cluster/v3/circuit_breaker.proto
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/docs/root/configuration/http/http_filters/router_filter.rst
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/docs/root/intro/arch_overview/upstream/circuit_breaking.rst
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/source/common/upstream/resource_manager_impl.h
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/source/extensions/load_balancing_policies/common/load_balancer_impl.cc
  - https://github.com/envoyproxy/envoy/blob/v1.40.2/source/extensions/retry/host/previous_hosts/previous_hosts.h
updatedAt: 2026-11-23
---

## 문제

재시도는 일시적 실패에는 약이지만 과부하 때는 독이다. 요청이 실패하는 이유가 용량 부족이면 재시도가 부하를 더 늘려 장애를 붙든다([메타안정 장애](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/)). 또 재시도가 방금 실패한 같은 호스트로 가면 같은 이유로 또 실패할 확률이 높다. Envoy 는 이 둘을 서로 다른 설정으로 푼다. 이 노트는 Envoy v1.40.2 문서·API proto·소스를 읽고, 일반 이론은 [타임아웃·재시도·회로 차단기](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/)와 [적응형 스로틀링·재시도 예산](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/)에 맡긴다. (조사 시점 최신 릴리스는 v1.40.2, 2026-10-27. 문서 사이트의 "latest" 는 1.41 계열로 보였다.)

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 재시도 정책 | `RetryPolicy` | 라우트·가상 호스트에 두는 설정. `retry_on`, `num_retries`, `per_try_timeout`, `retry_host_predicate` 등 |
| 재시도 예산 | `retry_budget` | **클러스터**(우선순위별 `Thresholds`)에 두는, 동시 재시도 수의 상한 |
| 호스트 술어 | `retry_host_predicate` | 재시도 때 고른 호스트를 거절해 다시 고르게 하는 플러그인 목록 |
| 재시도 우선순위 | `retry_priority` | 재시도의 우선순위(priority) 부하 분배를 바꾸는 플러그인. 이 노트에서는 개요만 |

## 세 축

### 1. 무엇을 재시도하나: retry_on

기본값은 **재시도 안 함**이다. 정책이나 `x-envoy-retry-on` 헤더가 없으면 실패를 재시도하지 않는다(router_filter 문서). 조건은 쉼표로 여러 개 쓴다.

| 조건 | 문서의 의미 |
| --- | --- |
| `5xx` | 5xx 응답, 또는 응답 없음(연결 끊김·리셋·읽기 타임아웃). `connect-failure`, `refused-stream` 포함 |
| `gateway-error` | 502·503·504 또는 응답 없음 |
| `reset` / `reset-before-request` | 응답 없음 / 요청이 업스트림으로 아직 안 나간 경우만 |
| `connect-failure` | 연결 실패(TCP 수준). 요청 타임아웃은 해당 안 됨 |
| `retriable-4xx` | 현재 409 만. 낙관적 락 충돌이면 재시도해도 항상 409 이므로 조심하라는 NOTE 가 있다 |
| `retriable-status-codes`, `retriable-headers` | 정책(`retriable_status_codes`, `retriable_headers`) 또는 헤더로 지정 |
| `envoy-ratelimited`, `refused-stream`, `http3-post-connect-failure` | 각각 전용 조건 |

gRPC 는 `x-envoy-retry-grpc-on` 과 `retry_on` 의 gRPC 상태 조건이 따로 있고, **응답 헤더의 상태 코드만** 대상이다(트레일러는 재시도 판단에 쓰이지 않는다고 문서가 적음). 재시도 횟수 `num_retries` 의 기본은 1 이다. 중요한 상호작용 두 가지.

- 라우트 타임아웃은 **모든 재시도를 포함**한다. 3초 타임아웃에서 첫 시도가 2.7초면 재시도에 0.3초(백오프 포함)가 남는다. 설계 의도는 재시도·타임아웃의 지수적 폭발 방지라고 쓴다.
- `5xx` 조건으로 요청 전체 타임아웃은 재시도되지 않는다(전체 시간 예산이 소진됐으므로). 시도별로 끊고 싶으면 `per_try_timeout` 을 쓴다. 이 값을 안 정하면 라우트 타임아웃이 쓰여 시도 타임아웃 재시도가 사실상 안 일어난다고 proto 주석이 설명한다.
- 기본 백오프는 완전 지터 지수 방식이고 기본 base 25ms, 상한은 base 의 10배(250ms)다. 재시도 N 번째 지연은 구간 `[0, (2^N − 1)·B)` 이다.

### 2. 몇 개까지: retry_budget (클러스터 `CircuitBreakers.Thresholds`)

`retry_budget` 은 라우트가 아니라 **클러스터의 회로 차단 설정**이다. 필드(proto 주석):

| 필드 | 의미 | 기본값 |
| --- | --- | --- |
| `budget_percent` | 활성 요청 + 대기(pending) 요청 합의 몇 %까지 동시 재시도를 허용 | 20% |
| `min_retry_concurrency` | 동시 재시도 허용 하한. 이 값 아래로는 안 내려간다 | 3 |
| `budget_interval` | 0 이면 현재 진행 중인 요청만 센다. 양수이면 그 시간 창 안에 **시작된** 요청도 센다(완료 여부 무관) | 0ms |

예산을 설정하면 기존 정적 `max_retries` 회로 차단기를 **대체한다**(proto 의 note). 소스(`resource_manager_impl.h`)상 예산 경로는 `budget_percent` 또는 `min_retry_concurrency` 가 설정됐을 때 쓰이며, `budget_interval` 만 둔 구성의 동작은 확인하지 못했다. 문서는 "일반적으로 예산을 쓰길 권하지만 정적 방식을 원하면 재시도를 공격적으로 차단하라"고 쓰고, `x-envoy-overloaded` 가 있을 때도 재시도가 일어나므로 예산(권장)이나 최대 활성 재시도 차단기를 적절히 설정해 재시도 폭풍을 피하라고 경고한다. 예산이 소진되면 재시도는 일어나지 않고 `upstream_rq_retry_overflow` 가 증가한다(정적 차단기 설명 기준이며, 예산 경로의 통계 이름은 이 노트에서 따로 확인하지 못했다). 예산을 쓰면 `track_remaining` 의 남은 재시도 통계는 추적되지 않는다.

소스(`resource_manager_impl.h`)에서 확인한 계산:

```
max = max( floor(budget_percent / 100 × requests_for_budget), min_retry_concurrency )
requests_for_budget = (budget_interval 이 0 이면) 활성 + pending, (양수면) 창 안에 시작된 요청 수
허용 조건: 현재 활성 재시도 수 < max
```

proto 주석의 예(활성 100, 25% → 활성 재시도 25 허용)와 일치한다. 이 한도는 **비율 제한이 아니라 동시성 한도**이다. 요청 100개가 실패해 재시도하더라도 한 번에 20개만 진행할 수 있다는 뜻이지, 장기적인 재시도/요청 비율 20% 보장은 아니다(필자 정리). 또한 문서는 Envoy 의 회로 차단이 워커 스레드 간 "결과적으로 일관(eventually consistent)"이어서 경쟁 상태에서 한도를 일부 넘길 수 있다고 쓴다. 한도는 클러스터·우선순위별이다.

### 3. 어디로: retry_host_predicate 와 host_selection_retry_max_attempts

- `retry_host_predicate`: 재시도 때 로드 밸런서가 호스트를 고른 뒤, **술어 중 하나라도 거절하면 호스트 선택을 다시 시도**한다(proto 주석).
- `host_selection_retry_max_attempts`: 선택을 다시 시도하는 최대 횟수. 다 쓰고도 거절되면 **마지막에 고른 호스트로 보낸다**. 미지정이면 "한 번 재시도"라고 주석에 있다.
- 소스(`load_balancer_impl.cc`, `chooseHost`): `max_attempts = hostSelectionRetryCount() + 1` 번 고르고, 호스트가 거절되지 않으면 즉시 반환, 끝까지 거절되면 마지막 호스트를 반환한다. 라우터 소스는 **첫 시도(재시도 아닌 요청)에는 이 횟수를 1 로 고정**해 반환하고, 재시도에서만 정책 값을 쓴다.
- 내장 술어(소스·proto 에서 확인한 것):

| 확장 이름 | 거절 기준 |
| --- | --- |
| `envoy.retry_host_predicates.previous_hosts` | 이미 시도한 호스트(포인터 비교로 목록에서 찾음) |
| `envoy.retry_host_predicates.omit_canary_hosts` | `canary` 로 표시된 호스트 |

`omit_host_metadata` 등 다른 술어와 `retry_priority`(예: `previous_priorities`)도 있으나 이 노트는 이름·역할만 짚는다. `previous_priorities` 는 proto 주석에 따르면 이전 시도의 우선순위를 제외해 재시도를 우선순위 사이에 퍼뜨리며, 우선순위가 많으면 부하 재계산이 O(우선순위 수)라 오버헤드가 될 수 있다.

## 직접 계산

Python 으로 두 가지를 확인했다. (스크립트는 스크래치 디렉터리, 위 소스 식을 그대로 옮긴 것이며 Envoy 를 실행한 것은 아니다.)

**예산 식.** `budget_percent = 20`, `min_retry_concurrency = 3`.

| 활성 + pending | 동시 재시도 상한 |
| --- | --- |
| 0, 10, 15 | 3 (하한이 지배: 15 의 20% = 3, 10 의 20% = 2 → 3) |
| 100 | 20 |
| 80 + pending 20 | 20 |
| 1000 + pending 50 | 210 |
| 100 (`budget_percent = 25`) | 25 (proto 예와 일치) |

트래픽이 적을 때(수 건)는 하한 3 이 사실상 전부를 재시도로 허용하는 경우가 있다. 요청 5개가 전부 실패하면 3개가 동시 재시도 가능하다.

**백오프 구간(ms, B=25).** 1회 [0, 25), 2회 [0, 75), 3회 [0, 175), 4회부터 상한 250(비상한 375, 775 …). 문서 예시(0–24, 0–74, 0–174ms)와 일치한다.

**previous_hosts 가 같은 호스트로 돌아갈 확률.** 호스트 n 개에서 균등 무작위로 고른다고 가정하고, 정책의 최대 선택 횟수 k 일 때 k+1 번 뽑은 뒤 마지막이 이전 호스트일 확률은 이론상 (1/n)^(k+1) 이다. 시뮬레이션(20만 회)은 n=3 일 때 k=0: 0.334, k=1: 0.111, k=3: 0.012 로 식과 일치했다. 즉 기본(k=1)이어도 3개 호스트에서 약 11% 는 같은 호스트에 재시도가 간다. 로드 밸런서가 균등 무작위가 아니면(예: [피크 EWMA](/develop-wiki/knowledge/performance/peak-ewma-load-balancing/) 같은 편향 선택) 이 확률은 달라진다. 이 계산은 필자의 단순 모형이고, 반복 선택이 독립이라는 가정이 실제 LB 에서는 성립하지 않을 수 있다.

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 재시도 예산 대 `num_retries` | `num_retries` 는 요청 하나가 몇 번 더 시도하는지, 예산은 클러스터 전체에서 **동시에** 몇 개 재시도하는지 |
| 예산 대 회로 차단 `max_retries` | 같은 자리를 놓고 경쟁한다. 예산이 설정되면 `max_retries` 차단기는 무시된다 |
| 호스트 술어 대 [이상치 감지](/develop-wiki/knowledge/performance/envoy-outlier-detection/) | 술어는 한 요청의 재시도에서 호스트를 피하고, 이상치 감지는 여러 요청 결과로 호스트를 풀에서 일정 시간 뺀다 |
| 술어 대 패닉 임계 | 건강한 호스트가 모자라 [패닉 모드](/develop-wiki/knowledge/performance/envoy-zone-aware-routing-panic-threshold/)이거나 호스트가 1개면 거절할 후보가 없어 마지막 호스트로 간다(소스 구조에서의 필자 추론) |
| 재시도 대 헤징 | 헤징(hedge)은 동시 요청을 경주시키며, 응답이 재시도 대상인지 판단에 재시도 정책을 쓴다(문서) |

## 언제 쓰나

- 멱등한 요청이 대부분이고 실패가 일부 호스트·연결 문제일 때: `connect-failure`/`reset`/`gateway-error` + `previous_hosts` 로 다른 호스트에 보낸다.
- 업스트림이 포화되는 사고를 겪었거나 겪을 수 있을 때: 재시도 예산으로 증폭 상한을 건다.

## 주의·비용

- 비멱등 요청(POST 등)에 `5xx` 재시도를 건다면 중복 처리를 감당해야 한다. 문서가 멱등성 고려를 권한다. 409 재시도도 같은 문제가 있다.
- 예산은 **시작점에서 꺼 주는 안전장치**일 뿐 재시도가 서비스 체인 전체에서 곱해지는 문제는 못 막는다(필자 추론: 예산은 클러스터·Envoy 인스턴스 단위, 서로 조정되지 않음. 회로 차단 문서가 "fully distributed (not coordinated)"라고 밝힌다).
- 술어를 켜면 선택 횟수만큼 LB 호출이 늘고, 호스트가 적은 클러스터에서는 효과가 작다.
- `retriable-4xx`·`5xx` 같은 넓은 조건과 큰 `num_retries` 를 함께 쓰면 예산이 없을 때 부하가 (1 + num_retries)배까지 늘 수 있다(산술적 상한).
- 문서 한 곳(arch overview 의 재시도 의미)에는 "최대 재시도 횟수: Envoy 는 임의 횟수만큼 재시도를 계속한다"는 문장이 있는데, 같은 문서군의 기본값(1회)과 어긋난다. 기본·상한은 API proto 와 router 문서를 따랐다.

## 검증 범위

Envoy v1.40.2 태그의 `route_components.proto`(RetryPolicy), `circuit_breaker.proto`(RetryBudget), router_filter 문서(`x-envoy-retry-on`·`x-envoy-max-retries`), 회로 차단·HTTP 라우팅 arch 문서, `resource_manager_impl.h`, `load_balancer_impl.cc`, `previous_hosts.h`, `omit_canary_hosts.h` 와 `previous_priorities` proto 를 읽었다. Envoy 를 실제로 구동해 재시도를 관찰하지는 않았다. `host_selection_retry_max_attempts` 미지정 시 기본값 1 은 proto 주석이고, `retry_policy_impl.h` 의 `host_selection_attempts_{1}` 과도 일치한다. 예산 경로에서 증가하는 통계 이름, `omit_host_metadata`, 터널링·HTTP/3 재시도 조건, Istio 등 상위 계층의 기본 재시도 설정은 조사하지 않았다.
