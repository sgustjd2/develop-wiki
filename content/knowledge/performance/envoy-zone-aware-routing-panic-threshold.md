---
title: Envoy zone-aware 라우팅과 패닉 임계 (Zone-Aware Routing and Panic Threshold)
aka: [Envoy zone aware routing, zone-aware load balancing, 지역 인지 로드 밸런싱, locality weighted load balancing, panic threshold, healthy_panic_threshold, fail_traffic_on_panic, overprovisioning factor, min_cluster_size, 패닉 모드]
category: performance
level: advanced
summary: Envoy 가 같은 zone 의 업스트림을 우선하는 계산 방식과 켜지는 조건, 가용 호스트가 모자랄 때 건강 상태를 무시하는 패닉 모드, 과잉 프로비저닝 계수와 우선순위의 상호작용을 문서·소스로 정리한다.
tags: [envoy, zone-aware-routing, panic-threshold, overprovisioning-factor, locality-weighted, load-balancing, priority, resilience]
related: [performance/load-balancing, performance/envoy-outlier-detection, performance/deterministic-subsetting, performance/peak-ewma-load-balancing, performance/power-of-two-choices-load-balancing, performance/timeout-retry-circuit-breaker, performance/metastable-failures-retry-storm]
sources:
  - https://github.com/envoyproxy/envoy/blob/main/api/envoy/extensions/load_balancing_policies/common/v3/common.proto
  - https://github.com/envoyproxy/envoy/blob/main/source/common/upstream/outlier_detection_impl.cc
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/zone_aware
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/locality_weight
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/overprovisioning
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/priority
  - https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/cluster.proto
  - https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/endpoint/v3/endpoint.proto
  - https://www.envoyproxy.io/docs/envoy/latest/configuration/upstream/cluster_manager/cluster_runtime
  - https://github.com/envoyproxy/envoy/blob/main/source/extensions/load_balancing_policies/common/load_balancer_impl.cc
updatedAt: 2026-11-24
---

## 문제

두 가지 상황을 다룬다.

1. **zone 을 건너는 호출은 비싸다.** 지연이 늘고, 클라우드에 따라 zone 간 전송 비용이 든다. 그렇다고 항상 같은 zone 으로만 보내면, zone 마다 호스트 수·트래픽이 다를 때 호스트별 부하가 틀어진다.
2. **건강한 호스트가 모자랄 때 어떻게 하나.** 헬스 체크나 [이상치 감지](/develop-wiki/knowledge/performance/envoy-outlier-detection/)가 호스트를 빼기만 하면, 남은 호스트로 부하가 몰려 또 쓰러진다. 연쇄 실패다.

Envoy 는 앞의 문제에 zone-aware 라우팅, 뒤의 문제에 패닉 임계를 둔다. 둘은 같은 설정 묶음(`CommonLbConfig`)에 붙어 있고 서로 영향을 준다.

## 해법

### zone-aware 라우팅: 무엇을 하나

문서는 "업스트림 클러스터의 호스트 중 로컬 zone 에 있는 호스트로 요청을 최선 노력으로 보내는 것"이라고 정의한다. 목표는 로컬 zone 으로 최대한 보내되 **업스트림 호스트별 RPS 는 거의 같게** 유지하는 것이다. 정확한 결과는 로드 밸런싱 정책에 따른다.

문서가 말하는 켜지는 조건은 셋이다. 호스트가 서로 다른 zone 에 있고, 그중에서:

1. 요청을 보내는 쪽(originating) 클러스터와 업스트림 클러스터가 **둘 다 패닉 모드가 아니다**.
2. zone-aware 라우팅이 켜져 있다.
3. 업스트림 클러스터가 충분히 크다.

문서 본문은 3번의 수치를 적지 않고 런타임 문서로 넘긴다. 수치는 아래 설정 절에 있다.

### 분배 계산

각 zone 의 **건강한 호스트 비율**만 쓴다. 로컬(발신) 클러스터에서 우리 zone 의 비율을 L, 업스트림에서 우리 zone 의 비율을 U 라 하면:

- **U ≥ L**: 업스트림의 로컬 zone 이 이 zone 의 모든 요청을 받고도 여유가 있다. 전부 로컬로 보낸다(소스의 `LocalityDirect`).
- **U < L**: 전부 로컬로 보내면 그 zone 호스트가 과부하된다. 로컬로 보낼 수 있는 몫만 `U / L` 로 보내고, 나머지는 다른 zone 으로 보낸다(`LocalityResidual`). 다른 zone 은 "업스트림 비율이 로컬 비율보다 큰 만큼"(잔여 용량)에 비례해 고른다.

직접 계산한 예(Python 으로 소스의 정수 계산을 따라 해 확인. Envoy 를 실행한 것이 아니다).

| zone | 로컬 클러스터 건강 호스트 | 비율 L | 업스트림 건강 호스트 | 비율 U |
| --- | --- | --- | --- | --- |
| A | 4 | 40% | 2 | 20% |
| B | 4 | 40% | 5 | 50% |
| C | 2 | 20% | 3 | 30% |

- A 의 Envoy: U < L 이라 `20/40 = 50%` 만 A 로 보낸다. 나머지 50% 의 잔여 용량은 B 가 50−40=10, C 가 30−20=10 이므로 B·C 에 절반씩 간다.
- B, C 의 Envoy: U ≥ L 이라 전부 자기 zone 으로 보낸다.
- 전체 트래픽 중 업스트림이 받는 몫은 A 20%, B 40+10=50%, C 20+10=30%. 업스트림의 호스트 비율(20/50/30)과 일치한다. 호스트당 부하가 같아지도록 설계됐음을 숫자로 확인한 셈이다.

소스 주석은 이 비율이 "그 우선순위가 받는 부하"와는 독립이라고 밝힌다. 우선순위 안에서의 공정성만 보장하고, 우선순위를 가로지르는 공정성은 보장하지 않는다.

### 설정과 수치

API 문서(`CommonLbConfig.zone_aware_lb_config`)와 런타임 문서 기준:

| 항목 | 기본값 | 뜻 |
| --- | --- | --- |
| `routing_enabled` (런타임 `upstream.zone_routing.enabled`) | 100% | zone-aware 를 적용 대상으로 고려할 요청의 비율 |
| `min_cluster_size` (런타임 `upstream.zone_routing.min_cluster_size`) | 6 | 업스트림 클러스터가 이보다 작으면 건너뜀 |
| `fail_traffic_on_panic` | 문서에 기본값 명시 없음(false 로 추정) | true 면 패닉 때 호스트를 하나도 고르지 않음 |
| `healthy_panic_threshold` | 50% | 패닉 임계. 0% 로 두면 패닉 비활성 |

- 소스는 `min_cluster_size` 를 **업스트림 P=0 의 건강한 호스트 수**와 비교한다(`healthyHosts().size() < min_cluster_size` 면 건너뜀). 전체 호스트 수가 아니라는 점에 주의한다.
- 소스에는 이 밖에 `force_local_zone`(로컬 zone 건강 호스트가 최소 수 이상이면 비율 계산 없이 항상 로컬로)과 `locality_basis`(비율을 호스트 수 대신 호스트 가중치 합으로 계산)가 있다. 이 두 필드는 `cluster.proto` 가 아니라 확장 정책 proto `extensions/load_balancing_policies/common/v3/common.proto` 의 `LocalityLbConfig.ZoneAwareLbConfig` 에 있다(`force_local_zone.min_size` 기본 1, `locality_basis` 는 `HEALTHY_HOSTS_NUM`(기본)·`HEALTHY_HOSTS_WEIGHT`, 런타임 `upstream.zone_routing.force_local_zone.min_size`).
- 문서: 우선순위가 여럿일 때 zone-aware 는 **P=0 만** 지원한다. 소스도 P≠0 은 `NoLocalityRouting` 으로 고정한다.
- 소스상 zone-aware 를 건너뛰는 경우는 (a) 업스트림 건강 호스트의 locality 가 2 개 미만, (b) 로컬 클러스터의 locality 가 2 개 미만(`force_local_zone` 이면 이 검사는 생략), (c) 로컬 클러스터에 우리 locality 의 호스트가 없음(통계 `lb_local_cluster_not_ok`), (d) 업스트림 건강 호스트가 `min_cluster_size` 미만(통계 `lb_zone_cluster_too_small`)이다.

### locality weighted LB 와의 차이

| | zone-aware | locality weighted |
| --- | --- | --- |
| 비율을 정하는 쪽 | Envoy 가 로컬·업스트림의 건강 호스트 분포에서 계산 | 관리 서버가 EDS `LocalityLbEndpoints` 에 준 명시적 가중치 |
| 발신 위치 | 쓴다(요청을 보내는 Envoy 가 어느 zone 인지) | 안 쓴다(모든 Envoy 가 같은 가중치) |
| 설정 | `zone_aware_lb_config` | `locality_weighted_lb_config` |

문서와 API 문서 모두 둘을 **동시에 쓸 수 없다**고 한다. locality weighted 는 서브셋 로드 밸런싱과도 호환되지 않는다. 소스는 locality weighted 가 켜져 있으면 zone-aware 분기보다 먼저 locality 를 고르게 되어 있다.

locality 의 유효 가중치(문서 식): `availability = 140 × 건강/전체`, `유효 가중치 = 가중치 × min(100, availability)`. 문서 예(X 가중치 1, Y 가중치 2, Y 는 100% 건강)를 직접 계산하면 X 의 건강 비율 100%·70% 에서 X 33%, 50% 에서 26%, 25% 에서 15%, 0% 에서 0% 가 나와 문서 표와 맞는다. 69% 는 실수로 계산하면 32.6% 인데 문서 표는 32 로 적는다. availability 를 정수로 버린 값(`int(140×0.69)=96`)으로 계산하면 96/(96+200)=32.4% 로 문서와 맞고 나머지 행도 같은 방식으로 일치한다(locality 쪽 정수 처리 코드는 읽지 못했다).

### 과잉 프로비저닝 계수와 "유효 가용성"

우선순위 수준과 locality 모두 **과잉 프로비저닝 계수**(기본 140, 즉 1.4)로 건강도를 부풀려 계산한다. API 문서는 이 값을 `ClusterLoadAssignment.Policy.overprovisioning_factor` 로 둔다.

```
health(수준) = min(100, 1.4 × 100 × 건강 호스트 / 전체 호스트)
```

- 건강 호스트가 72% 면 `0.72×140 = 100.8` 이라 100 으로 잘려 "완전히 건강"하다. 70% 면 98 이라 부족으로 친다.
- 경계는 정확히 `100/140 ≈ 71.4%`. 문서의 "72% 미만"은 반올림한 표현이다(직접 계산: 71.4% 에서 99.96).
- 의도: 호스트 몇 대가 빠져도 남은 호스트가 평소 용량의 1.4 배까지 받아낼 수 있다고 가정해, 우선순위를 곧바로 넘기지 않는다. 이 가정이 틀리면(수준마다 호스트 수가 다를 때 등) 문서도 위험하다고 경고한다.

### 우선순위와 정규화

여러 우선순위가 있으면 Envoy 는 P=0 부터 부하를 채운다.

```
normalized_total_health = min(100, Σ health(P_i))
load(P_0) = health(P_0) × 100 / normalized_total_health
load(P_X) = min(100 − Σ load(앞 수준들), health(P_X) × 100 / normalized_total_health)
```

P=1 이 100% 건강할 때, 직접 계산한 P=0 의 부하:

| P=0 건강 호스트 | P=0 부하 | P=1 부하 |
| --- | --- | --- |
| 100% | 100% | 0% |
| 72% | 100% | 0% |
| 71% | 99.4%(문서 표는 99) | 0.6%(문서 표는 1) |
| 50% | 70% | 30% |
| 25% | 35% | 65% |
| 0% | 0% | 100% |

### 패닉 모드

정상일 때 Envoy 는 **가용 호스트(건강 + degraded)** 에만 보낸다. 가용 호스트 비율이 패닉 임계(기본 50%) 밑으로 내려가면 건강 상태를 무시하고 **전체 호스트**에 분산한다. 호스트 장애가 부하 증가와 함께 연쇄하는 것을 막기 위함이다. 건강 표시가 남은 소수에 전부 몰아 보내면 그 호스트까지 쓰러질 수 있다는 것이 이 장치의 전제다.

- 임계는 런타임(`upstream.healthy_panic_threshold`)·클러스터 설정으로 바꾸고, 문서는 우선순위별 설정도 가능하다고 한다. 0% 로 두면 패닉이 없다. 이때 모든 호스트가 비정상이면 즉시 "503 - no healthy upstream" 을 돌려준다(문서).
- **`fail_traffic_on_panic: true`** 면 패닉 때 아무 호스트도 고르지 않아 요청이 실패한다. 문서는 이것이 이미 망가진 업스트림에 부하를 더하지 않고, 전부 아니면 전무 식으로 실패하는 서비스에 어울린다고 설명한다. 일부 요청만 처리하며 버티는 서비스에는 도움이 덜하다. 건강한 호스트가 일부 있어도 요청이 전부 실패한다는 대가가 있다.
- 소스(`isHostSetInPanic`)는 `(건강 + degraded) / (전체 − excluded)` 를 임계와 비교한다. 정확히 임계와 같으면 패닉이 아니다(`<` 비교).

### 우선순위와 패닉의 상호작용

문서·소스(`recalculatePerPriorityPanic`)가 일치하는 규칙:

- **정규화 총 건강도가 100 이면 패닉 판정을 아예 하지 않는다.** 한 수준의 건강 호스트가 아주 적어도, 다른 수준이 메워 주면 패닉이 아니다.
- 100 미만이면 수준별로 임계와 비교해 패닉 여부를 정한다. 패닉인 수준은 그 수준의 전체 호스트(또는 호스트 없음)로 간다.
- **모든 수준이 패닉**이면 건강도가 아니라 **호스트 수 비율**로 부하를 나눈다. 문서 예: P=0 2 대, P=1 8 대면 20%/80%.

문서 예를 직접 계산해 확인: P=0 25%, P=1 25% 건강이면 각 건강도 35, 합 70(100 미만), 둘 다 임계 50% 미만이라 전체 패닉. 부하는 호스트 수 기준. 문서의 "정규화 총 건강도 70%"와 일치한다.

**한 수준만 쓰는 클러스터**로 단순화해 보면(직접 계산) 두 임계가 서로 다른 지점에서 작동함을 알 수 있다.

| 건강 호스트 | 유효 건강도 | 정규화 총 건강도 | 패닉(임계 50%) |
| --- | --- | --- | --- |
| 80% | 100(잘림) | 100 | 아니오 |
| 70% | 98 | 98 | 아니오(70% ≥ 50%) |
| 50% | 70 | 70 | 아니오(50% 는 `<` 가 아님) |
| 49% | 68.6 | 68.6 | 예 |

즉 71.4% 미만부터는 우선순위 이동이 시작되지만 패닉은 50% 미만에서야 켜진다. 둘은 별개의 문턱이다.

### zone-aware 와 패닉

- 문서 조건 1: 발신·업스트림 중 하나라도 패닉이면 zone-aware 는 꺼진다.
- 소스(`hostSourceToUse`): 먼저 업스트림 수준의 패닉을 보고(전체 호스트 또는 `fail_traffic_on_panic` 이면 없음), 다음에 locality weighted, 그다음 zone-aware 순이다. **로컬(발신) 클러스터가 패닉**이면 zone-aware 를 포기하고 일반 선택으로 가는데, 소스는 이때 `fail_traffic_on_panic` 이 true 면 **호스트를 고르지 않는다**. 문서에서는 이 동작을 확인하지 못했다(소스에서만 확인).
- zone-aware 비율은 건강 호스트 기준이라, zone 하나가 통째로 헬스 체크에 실패하면 비율이 즉시 바뀐다. 기존 호스트 수와 맞지 않으면 다른 zone 의 부담이 커진다.

### 이상치 감지와의 관계

[이상치 감지](/develop-wiki/knowledge/performance/envoy-outlier-detection/)로 제외된 호스트는 건강하지 않은 것으로 취급되어 위 계산(건강 비율, 우선순위 부하, zone 비율, 패닉)에 그대로 들어간다. 따라서 `max_ejection_percent`(기본 10%)가 사실상 패닉과 우선순위 이동이 일찍 일어나지 않게 막는 장치이기도 하다. `outlier_detection_impl.cc` 의 소스 주석은 제외 비율을 우선순위별로 따지지 않는다고 적으므로, 제외가 몰린 수준의 건강도가 먼저 떨어질 수 있다. Envoy 의 이상치 감지 문서는 제외된 호스트가 unhealthy 로 표시되며 패닉 상황이 아니면 쓰이지 않는다고 적는다. 패닉 식의 `excluded` 는 이와 별개로 `EXCLUDED_VIA_IMMEDIATE_HC_FAIL`(프로토콜 신호로 순환에서 뺀 호스트)이다.

## 언제 쓰나

- **zone-aware**: 여러 zone 에 걸친 서비스 메시에서 zone 간 지연·비용을 줄이고 싶고, 업스트림이 zone 마다 고르게(6 대 이상) 퍼져 있을 때.
- **locality weighted**: zone 간 비율을 중앙에서 의도적으로 정하고 싶을 때(점진적 이전, 용량이 다른 지역). Envoy 가 어느 zone 에서 요청하는지는 쓰지 않는다.
- **패닉 임계 기본값 유지**: 대부분의 서비스. 부하 때문에 건강 표시가 줄어드는 상황에서 "남은 소수에 몰아 쓰러뜨리는" 것보다 낫다.
- **`fail_traffic_on_panic`**: 부분 처리가 의미 없는 서비스, 그리고 실패를 빨리 드러내 클라이언트가 다른 곳(다른 클러스터, 캐시)으로 우회할 수 있을 때.
- **패닉 0%**: 비정상 호스트에는 절대 보내지 않아야 하는 경우. 모두 비정상이면 503 이다.

## 주의 (비용)

- **zone-aware 는 호스트 수가 적으면 꺼진다.** 건강 호스트가 6 대 미만이면 건너뛴다. 작은 클러스터에서 "zone 우선이 안 먹는다"면 먼저 `min_cluster_size` 와 건강 호스트 수를 본다.
- **로컬 클러스터 정의가 필요하다.** 발신 쪽 호스트 분포(로컬 클러스터)를 알아야 비율을 계산한다. 로컬 클러스터에 우리 zone 호스트가 없거나 zone 이 하나뿐이면 꺼진다(소스). 구성이 이 가정을 깨면 zone-aware 가 조용히 빠진다.
- **P=0 에만 적용된다**(문서). 우선순위를 쓰는 클러스터에서 P≥1 로 넘어간 트래픽에는 zone 우선이 없다.
- **패닉은 건강 검사를 덮는다.** 패닉 중에는 죽은 호스트에도 요청이 간다. 오류율이 높아 보이는 것은 정상 동작일 수 있다. 통계(`lb_healthy_panic`)로 패닉 여부부터 확인한다.
- **`fail_traffic_on_panic` 은 가용성을 의도적으로 포기한다.** 건강한 호스트가 절반 가까이 남아 있어도 임계 아래면 전 요청이 실패한다. 임계를 같이 조정하지 않으면 작은 장애가 전면 장애로 보인다.
- **임계 근처에서는 출렁인다.** 가용 비율이 50% 를 오르내리면 "건강한 호스트에만"과 "전체 호스트"가 번갈아 적용된다. 히스테리시스가 있다는 설명은 문서에서 찾지 못했다(미확인).
- **과잉 프로비저닝 가정을 검증해야 한다.** 1.4 배를 못 받아내는 수준(호스트 수가 P=0 10 대 대 P=1 2 대 같은 경우)에서는 우선순위 이동이 과부하를 만든다 → [메타안정 실패](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/).
- **계산식은 건강 비율 기반이다.** 호스트 용량이 제각각이면 `locality_basis` 나 가중치 설정을 검토한다(위의 미확인 필드).
- 요청 분배 방식 자체는 별개다. 호스트를 고르는 알고리즘은 [P2C](/develop-wiki/knowledge/performance/power-of-two-choices-load-balancing/)·[Peak EWMA](/develop-wiki/knowledge/performance/peak-ewma-load-balancing/) 등이 맡고, 연결 수 제한은 [결정적 서브세팅](/develop-wiki/knowledge/performance/deterministic-subsetting/)이 맡는다. 서브셋 로드 밸런싱은 locality weighted 와 호환되지 않는다(문서).

## 비교

| 장치 | 하는 일 | 기준 |
| --- | --- | --- |
| zone-aware | 로컬 zone 우선, 호스트 부하 균등 유지 | zone 별 건강 호스트 비율 |
| locality weighted | 관리 서버 지정 비율로 zone 간 분배 | 명시 가중치 × 건강도 |
| 우선순위 | 상위 수준이 부족할 때 하위로 넘김 | 과잉 프로비저닝 적용 건강도 |
| 패닉 임계 | 가용 호스트가 모자라면 건강 상태 무시 | 가용 비율 < 임계(50%) |
| [이상치 감지](/develop-wiki/knowledge/performance/envoy-outlier-detection/) | 오류 낸 호스트를 일시 제외 | 실제 요청 결과 |
| [서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/) | 동시성·재시도 상한 | 연결·요청 수 |

## 검증 범위

Envoy 공식 문서(최신판, 페이지에 표시된 버전 1.41.0-dev-331b8c)의 Zone aware routing, Locality weighted load balancing, Panic threshold, Overprovisioning factor, Priority levels, `cluster.proto`·`endpoint.proto` API 문서, 클러스터 런타임 문서를 2026-11-24 에 읽었다. 분배 계산·패닉 판정·`min_cluster_size` 비교·로컬 클러스터 패닉 처리는 envoyproxy/envoy main 의 `source/extensions/load_balancing_policies/common/load_balancer_impl.cc`(2026-11-24 조회)에서 읽어 문서와 대조했다. 이 파일은 예전의 `source/common/upstream/` 아래에서 옮겨진 위치다. `thread_aware_lb_impl` 은 읽지 않았다. 숫자 예는 문서의 식과 소스의 정수 계산을 Python 으로 직접 계산한 것이며, Envoy 를 실행해 재현하지 않았다. 미확인: `fail_traffic_on_panic`·`routing_enabled` 외 필드의 정확한 기본값 표기, 패닉 임계 근처 히스테리시스, 문서 대비 이전 버전의 차이.
