---
title: Envoy 이상치 감지 (Outlier Detection)
aka: [Outlier Detection, passive health checking, 수동 헬스 체크, consecutive_5xx, success rate outlier, failure percentage, max_ejection_percent, base_ejection_time, ejection, 이젝션]
category: performance
level: advanced
summary: 실제 트래픽의 응답 결과로 동료보다 나쁜 업스트림 호스트를 잠시 로드 밸런싱에서 빼는 Envoy 의 수동 헬스 체크. 감지 방식 다섯 가지, 제외 시간 계산, 제외 비율 상한의 함정을 문서와 소스로 정리한다.
tags: [envoy, outlier-detection, passive-health-check, load-balancing, service-mesh, ejection, resilience]
related: [performance/load-balancing, performance/power-of-two-choices-load-balancing, performance/peak-ewma-load-balancing, performance/timeout-retry-circuit-breaker, performance/deterministic-subsetting, distributed-systems/gossip-failure-detection, performance/metastable-failures-retry-storm]
sources:
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier
  - https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/outlier_detection.proto
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
  - https://github.com/envoyproxy/envoy/blob/main/source/common/upstream/outlier_detection_impl.cc
  - https://github.com/envoyproxy/envoy/blob/main/source/common/upstream/outlier_detection_impl.h
updatedAt: 2026-11-19
---

## 문제

능동 헬스 체크(`/healthz` 를 주기적으로 호출)는 "프로세스가 살아 있는가"만 본다. 헬스 엔드포인트는 200 을 주면서 실제 요청에는 500 을 내거나, 특정 호스트만 연결이 끊기는 경우를 놓친다. 또 체크 주기만큼 늦게 반응한다.

[P2C least loaded](/develop-wiki/knowledge/performance/power-of-two-choices-load-balancing/)나 [Peak EWMA](/develop-wiki/knowledge/performance/peak-ewma-load-balancing/)는 **빨리 실패하는 호스트를 오히려 더 고른다**(진행 중 요청이 적고 RTT 가 짧다). 오류 자체를 신호로 쓰는 장치가 따로 필요하다.

## 해법

Envoy 는 실제 요청의 결과를 호스트별로 모아, 동료보다 나쁜 호스트를 **일정 시간 제외(eject)** 한다. 문서는 이를 수동(passive) 헬스 체크라고 부르고 능동 체크와 함께 또는 따로 쓸 수 있다고 설명한다. HTTP 라우터, TCP 프록시, Redis 프록시, Thrift 프록시가 지원한다.

### 오류의 두 종류

- **외부 발생**: 업스트림이 돌려준 오류(HTTP 5xx, 해석 불가 Redis 응답).
- **로컬 발생**: 통신 자체가 실패(타임아웃, TCP 리셋, 연결 불가).
- 기본(`split_external_local_origin_errors: false`)은 둘을 한 통에 센다. `true` 면 따로 센다.

### 감지 방식 (기본값은 API 문서·소스 상수 기준)

| 방식 | 조건 | 기본 임계 | 기본 적용률(enforcing) |
| --- | --- | --- | --- |
| 연속 5xx | 연속 오류 `consecutive_5xx` 회. 기본 모드에선 로컬 오류 포함 | 5 | 100% |
| 연속 게이트웨이 실패 | 연속 502·503·504(기본 모드에선 로컬 오류 포함) | 5 | **0%**(감지만, 제외 안 함) |
| 연속 로컬 실패 | 분리 모드에서만. 타임아웃·리셋 등 | 5 | 100% |
| 성공률 | 주기마다 클러스터 평균과 표준편차로 이상치 판정 | 계수 1.9(`1900/1000`) | 100% |
| 실패율 | 고정 임계 `failure_percentage_threshold` 이상 실패 | 85% | **0%** |

- `enforcing_*` 는 감지됐을 때 실제로 제외할 확률(%)이다. 기본 0% 인 방식은 통계만 쌓인다. 켜려면 명시적으로 올린다.
- **성공률 방식**(소스 `successRateEjectionThreshold`): 요청 수가 `success_rate_request_volume`(기본 100) 이상인 호스트만 모아 평균 성공률 μ, 표준편차 σ 를 구하고 `μ − 계수·σ` 보다 낮은 호스트를 제외한다. 소스 주석의 예: 성공률 {50, 100, 100, 100, 100} → μ 90, σ 20, 임계 52(계수 1.9). 자격 호스트가 `success_rate_minimum_hosts`(기본 5) 미만이면 그 주기는 건너뛴다.
- **실패율 방식**: 평균과 비교하지 않고 `(100 − 성공률) ≥ 85` 면 제외. 최소 호스트 5, 최소 요청 50.
- 주기 `interval` 기본 10 초.

### 제외 시간

- 제외 시간 = `base_ejection_time × 연속 제외 횟수`, 상한 `max_ejection_time`. 기본 30 초, 상한 기본 300 초(소스 상수: 기본 base 30 초 × 10. 설정한 base 의 10 배가 아니다). 설정한 `base_ejection_time` 이 300 초보다 크면 base 값.
- 소스상 제외될 때마다 배수가 1 씩 오르고, 제외되지 않은 채 `interval` 이 지날 때마다 1 씩 내려간다. 문서는 기본 제외 시간으로 돌아오는 데 약 `max_ejection_time / base_ejection_time × interval` 이 걸린다고 설명한다(기본값이면 약 100 초).
- `max_ejection_time_jitter`(기본 0)를 주면 제외 해제 시점에 무작위 지연을 더한다. 소스 주석은 여러 호스트가 동시에 복귀하며 연결이 몰리는 것을 막는 용도라고 적는다.

### 제외 비율 상한 — 작은 클러스터의 함정

소스 `ejectHost`:

```
ejected_percent = 100 × (현재 제외 수 + 1) / 호스트 수
should_eject    = ejected_percent ≤ max_ejection_percent      // 기본 10
always_eject_one_host 이면: 현재 제외 수 == 0 이거나 위 조건
```

- 기본 10% 에서 호스트가 **9 대 이하**면 첫 제외부터 `100 × 1 / 9 ≈ 11% > 10%` 라 **아무 호스트도 제외되지 않는다**(제외는 일어나지 않고 `ejections_overflow` 가 오른다. 감지 통계 `ejections_detected_*` 는 그대로 오른다). 10 대면 1 대까지, 20 대면 2 대까지다.
- API 문서는 `always_eject_one_host`(기본 false)를 켜면 비율 상한과 무관하게 최소 1 대는 제외한다고 설명한다. 작은 클러스터라면 이 옵션이나 상한 상향을 검토한다.
- 소스 주석: 비율은 우선순위(priority) 수준별로 따지지 않아서, 한 우선순위 수준의 호스트가 모두 제외될 수 있다.

### 능동 헬스 체크·패닉 임계와의 관계

- 능동 헬스 체크가 성공하면 제외가 풀리고 이상치 카운터가 초기화된다(`successful_active_health_check_uneject_host` 기본 true). 헬스 엔드포인트가 실제 트래픽 경로를 타지 않으면, 실제 요청은 계속 실패하는데 제외만 풀리는 일이 생긴다. 문서는 이때 false 로 두라고 안내한다.
- 제외된 호스트는 비정상으로 표시되어 로드 밸런싱에서 빠지지만, **패닉 모드**에서는 예외다. 패닉 임계 기본값은 50% 로, 가용 호스트 비율이 그 밑으로 떨어지면 Envoy 는 헬스 상태를 무시하고 전체(또는 아무에게도 안) 보낸다.
- 같은 클러스터를 여러 필터 체인이 공유하면, 한 체인에서의 제외가 다른 체인에도 적용된다.

## 언제 쓰나

- 서비스 메시·사이드카에서 호스트 하나의 오류가 전체 오류율을 끌어올리는 경우. 특히 "빨리 실패하는 호스트"가 지연 기반 밸런서에 끌려가는 문제를 막을 때.
- 능동 헬스 체크가 잡지 못하는 부분 장애(특정 의존성 실패, 잘못된 배포 한 대)를 줄이고 싶을 때.
- 호스트가 많아 통계적 비교가 의미 있는 클러스터. 성공률 방식은 최소 5 대, 각 100 요청이 기본 요건이다.

## 주의 (비용)

- **용량을 줄인다.** 제외된 호스트의 트래픽은 나머지가 받는다. 전체가 과부하로 오류를 내는 상황이면 제외가 남은 호스트를 더 밀어 넣는다. `max_ejection_percent` 가 이를 막는 상한이고, 그래서 기본값이 낮다 → [메타안정 실패](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/).
- **작은 클러스터에서는 기본 설정으로 동작하지 않을 수 있다**(위 9 대 계산). 설정만 넣고 끝내지 말고 `ejections_enforced_*`, `ejections_overflow` 통계를 확인한다.
- **요청 종류가 섞이면 오판한다.** 특정 호스트가 무거운 요청을 몰아 받아 5xx 를 내면, 호스트 문제가 아닌데도 제외된다. 문서상 연속 5xx 방식은 HTTP 에서 5xx 만 센다. 성공률 방식에서 4xx 를 어떻게 세는지는 확인하지 않았다.
- **트래픽이 적으면 통계 방식이 꺼진다.** 요청 수가 최소량 미만인 호스트는 비교 대상에서 빠진다. 저트래픽 서비스는 연속 오류 방식이 주력이다.
- **로컬 오류의 의미**: 기본 모드에선 타임아웃도 연속 5xx 에 들어간다. 클라이언트 타임아웃이 너무 짧으면 멀쩡한 호스트가 제외된다. 분리 모드로 원인을 구분하는 편이 진단에 낫다.
- **관측 범위는 Envoy 인스턴스 하나다.** 각 사이드카가 자기 트래픽으로 따로 판단하므로, 같은 호스트가 어떤 클라이언트에는 제외되고 다른 클라이언트에는 아니다.
- 제외 이벤트 로그(`OutlierDetectionEvent`)를 켜야 어떤 호스트가 왜 빠졌는지 알 수 있다. 전역 통계만으로는 호스트를 특정할 수 없다고 문서가 설명한다.

## 비교

| 장치 | 신호 | 반응 | 범위 |
| --- | --- | --- | --- |
| 능동 헬스 체크 | 별도 프로브 결과 | 체크 주기 | 모든 클라이언트가 같은 결론(중앙 체커일 때) |
| 이상치 감지(이 노트) | 실제 요청 결과 | 연속 오류는 즉시, 통계 방식은 `interval` 마다 | 각 Envoy 인스턴스 |
| [서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/) | 오류율·동시성 | 즉시 | 대상 서비스 전체 |
| [Peak EWMA](/develop-wiki/knowledge/performance/peak-ewma-load-balancing/) | 지연 | 응답마다 | 호스트 선택 가중치(제외 아님) |

## 검증 범위

Envoy 아키텍처 문서의 Outlier detection, 패닉 임계 문서, `outlier_detection.proto` API 문서(필드 기본값)를 2026-11-19 에 읽었다. 제외 비율 계산·배수 증감·성공률 임계 공식은 envoyproxy/envoy main 브랜치의 `source/common/upstream/outlier_detection_impl.cc`·`.h`(2026-11-19 조회)를 직접 읽고 확인했다. Envoy 를 실행해 동작을 재현하지는 않았다. 패닉 모드에서 제외 호스트가 정확히 어떻게 쓰이는지, 버전별 기본값 변화는 확인하지 않았다.
