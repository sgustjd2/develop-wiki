---
title: 결정적 서브세팅 (Deterministic Subsetting)
aka: [Deterministic Subsetting, subsetting, 서브세팅, connection subsetting, Deterministic Aperture, Aperture load balancer, Finagle Aperture, random subsetting]
category: performance
level: advanced
summary: 클라이언트가 모든 백엔드에 연결하지 않고 일부(서브셋)에만 연결하되, 백엔드마다 연결 수가 고르게 나오도록 서브셋을 결정적으로 나누는 방법. Google SRE 책의 알고리즘과 Finagle Deterministic Aperture 를 비교하고 직접 시뮬레이션했다.
tags: [load-balancing, subsetting, deterministic-subsetting, aperture, finagle, google-sre, connection-management, rpc]
related: [performance/load-balancing, performance/power-of-two-choices-load-balancing, performance/peak-ewma-load-balancing, performance/envoy-outlier-detection, performance/connection-pool, algorithms/consistent-hashing, algorithms/rendezvous-hashing, algorithms/consistent-hashing-bounded-loads]
sources:
  - https://sre.google/sre-book/load-balancing-datacenter/
  - https://twitter.github.io/finagle/guide/ApertureLoadBalancers.html
  - https://twitter.github.io/finagle/guide/Clients.html
updatedAt: 2026-11-19
---

## 문제

클라이언트 수천 개가 백엔드 수천 개에 모두 연결하면 연결 수가 곱으로 늘어난다. SRE 책은 연결마다 양쪽에 메모리와 헬스 체크 CPU 비용이 든다고 설명한다. 그래서 클라이언트마다 백엔드 일부(서브셋)에만 연결한다.

문제는 **서브셋을 어떻게 고르느냐**다. 각 클라이언트가 백엔드 목록을 무작위로 섞어 앞에서 k 개를 고르면(무작위 서브세팅) 백엔드마다 연결된 클라이언트 수가 크게 차이 난다. 책의 예(클라이언트 300, 백엔드 300):

- 서브셋 30%(90 개): 가장 적은 백엔드가 평균의 63%, 가장 많은 백엔드가 121%.
- 서브셋 10%(30 개): 50% 와 150%.
- 고르게 하려면 서브셋이 75% 정도로 커져야 해서 의미가 없다.

책은 이 불균형만큼 과잉 프로비저닝이 필요하다고 지적한다(10% 과부하면 10% 더 준비).

## 해법

### SRE 책의 결정적 서브세팅

클라이언트에 0 부터 시작하는 연속 ID 가 있다고 가정한다.

1. `subset_count = 백엔드 수 / subset_size` — 한 "라운드"에 들어가는 클라이언트 수.
2. `round = client_id / subset_count` — 같은 라운드의 클라이언트는 **같은 순서로 섞인** 백엔드 목록을 쓴다. 섞는 난수의 시드가 라운드 번호다.
3. `subset_id = client_id % subset_count` — 섞인 목록에서 `subset_id × subset_size` 부터 `subset_size` 개를 가져간다.

한 라운드 안에서 백엔드는 정확히 한 클라이언트에게만 배정되므로, 라운드가 꽉 차면 모든 백엔드의 연결 수가 같다. 라운드마다 다르게 섞는 이유: 백엔드 하나가 죽었을 때 그 부하가 같은 서브셋의 동료에게만 몰리지 않고 남은 백엔드 전체로 퍼지게 하려는 것이다.

```ts
// SRE 책 알고리즘을 옮긴 것. seededShuffle 은 시드가 같으면 같은 순서를 돌려주는 셔플.
function subset<T>(backends: T[], clientId: number, subsetSize: number,
                   seededShuffle: (xs: T[], seed: number) => T[]): T[] {
  const subsetCount = Math.floor(backends.length / subsetSize);
  const round = Math.floor(clientId / subsetCount);
  const shuffled = seededShuffle(backends, round);
  const start = (clientId % subsetCount) * subsetSize;
  return shuffled.slice(start, start + subsetSize);
}
```

책은 서브셋 크기를 보통 20~100 으로 잡는다고 하고, 클라이언트가 백엔드보다 훨씬 적거나 클라이언트 사이 요청량이 자주 불균형할 때(상위의 fan-out 이 큰 요청 때문에 버스트를 보내는 클라이언트) 더 키우라고 한다.

### Finagle Deterministic Aperture

Finagle(트위터 JVM RPC 라이브러리)의 Aperture 밸런서는 같은 목표를 **링** 모델로 푼다(Finagle 문서 기준).

- 클라이언트 집합(피어 링)과 백엔드 집합(목적지 링)을 같은 둘레의 두 원으로 놓는다. 각 클라이언트는 자기 위치에 해당하는 목적지 링의 **연속 구간(slice)** 을 맡는다. 구간은 백엔드 경계와 맞지 않아도 되고(분수 단위), 그래서 링을 연속체로 다룬다.
- 클라이언트마다 구간이 달라 백엔드 부하가 고르게 퍼진다. 구간 크기는 클러스터 정보와 가중치로 정하고, 동시성·중복을 위해 **최소 12 개 연결**을 둔다.
- 각 클라이언트는 피어 수와 자기 위치를 알아야 한다. `ProcessCoordinate` 에 인스턴스 번호와 전체 인스턴스 수를 넣고, 현재 구현은 **0 부터 시작하는 연속·고유 ID** 를 요구한다.
- 문서는 이것이 트위터의 기본 로드 밸런서라고 하고, 도입 후 대상 서비스의 RPS 분산과 총 연결 수가 줄었다고 보고한다(구체 수치는 문서에 없음).
- 구간 안에서의 선택은 P2C 계열이다 → [P2C](/develop-wiki/knowledge/performance/power-of-two-choices-load-balancing/). 비가중 구간 안의 세부 선택 방식은 이 노트에서 소스로 확인하지 않았다.
- 무작위 Aperture 에 대해 문서는 백엔드당 클라이언트 수를 이항분포(n = 클라이언트 수 × 클라이언트당 연결 수, p = 1/백엔드 수)로 보고, 1,000 노드가 5,000 노드에 연결할 때 aperture 1·10·100 이면 평균 5·50·500, 표준편차 약 2.5·7·22 라는 예를 든다.

## 직접 실행: 시뮬레이션

Node 스크립트, 시드 고정 PRNG, SRE 책 목록을 그대로 옮긴 결정적 방식과 "각 클라이언트가 따로 섞어 앞 k 개" 무작위 방식을 비교. 표는 백엔드별 연결 수의 최소·최대(평균 대비 %).

| 클라이언트 | 백엔드 | k | 무작위 | 결정적 |
| --- | --- | --- | --- | --- |
| 300 | 300 | 10 | 2~22 (20%~220%) | 10~10 (100%) |
| 300 | 300 | 30 | 15~50 (50%~167%) | 30~30 (100%) |
| 300 | 300 | 90 | 70~112 (78%~124%) | 79~97 (88%~108%) |
| 100 | 300 | 10 | 0~10 (0%~300%) | 3~4 (90%~120%) |
| 301 | 300 | 10 | 2~22 | 10~11 (100%~110%) |

- 무작위 k=30 의 50%~167% 는 책의 50%~150% 와 같은 경향이다(시드 하나라 정확히 일치하지는 않음).
- **책의 코드 목록을 그대로 옮기면** k 가 백엔드 수를 나누지 못할 때 고르지 않다. k=90 이면 `subset_count = 3`, 한 라운드가 270 개만 쓰고 30 개는 그 라운드에서 빠진다(88%~108%). 본문은 이때 일부 서브셋을 조금 크게 해 백엔드당 클라이언트 수 차이를 대개 1 이내로 맞춘다고 설명하지만, 목록에는 그 처리가 없다.
- 클라이언트가 라운드를 다 채우지 못하면(100 개, 301 개) 마지막 라운드만큼 차이가 생긴다. 차이는 연결 1 개 수준이다.

**백엔드 장애와 변경:**

| 상황(클라이언트 300, 백엔드 300, k=10) | 결과 |
| --- | --- |
| 백엔드 0 장애, 라운드별 시드 | 그 백엔드를 쓰던 클라이언트들의 나머지 연결이 76 개 백엔드에 퍼져 있음 |
| 같은 상황, 모든 라운드에 같은 시드 | 9 개 백엔드에만 몰림 |
| 백엔드 1 개 추가(301 개) | 전체 연결 3,000 개 중 2,311 개(77%)가 새 백엔드로 바뀜 |
| 백엔드 0 제거(299 개) | 2,821 개(94%)가 바뀜 |

- 마지막 두 줄이 이 알고리즘의 비용이다. 목록 길이가 바뀌면 `subset_count` 와 섞인 순서가 모두 바뀌어 **연결 대부분이 갈아엎어진다**. 책은 선택 알고리즘이 "최소한의 연결 변동으로 크기 변화를 다뤄야 한다"고 요구 사항으로 적지만, 이 목록이 그것을 어떻게 만족하는지는 설명하지 않는다. 백엔드가 자주 늘고 주는 환경이면 목록을 그대로 쓰지 말고 변경을 일괄 반영하거나, 링 기반(Aperture)·[일관 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/) 류를 검토한다. Aperture 의 변경 시 연결 변동량은 재지 않았다.

실행: `node subset.mjs`. 스크립트는 저장소에 넣지 않았다.

## 언제 쓰나

- 클라이언트·백엔드 수가 모두 커서 전체 연결(풀 메시)이 메모리·헬스 체크·핸드셰이크 비용으로 문제가 될 때.
- 장기 연결(HTTP/2, gRPC, Thrift 멀티플렉싱)을 쓰는 RPC 계층. 연결이 비싸고 오래 산다.
- 클라이언트에 안정적인 연속 번호를 줄 수 있을 때(StatefulSet 순번, 작업 스케줄러의 태스크 인덱스 등).

## 주의 (비용)

- **클라이언트 ID 가 필요하다.** 결정적 방식은 0..N−1 의 연속 ID 와 전체 수 N 을 알아야 한다. 오토스케일링으로 ID 가 비거나 겹치면 분배가 무너진다. Finagle 문서도 연속·고유 ID 를 요구한다.
- **백엔드 목록 변경 시 연결 변동**(위 시뮬레이션). 배포 중 백엔드가 하나씩 교체되면 매번 대부분의 클라이언트가 재연결할 수 있다. 목록의 순서·길이를 안정적으로 유지하는 방법(교체 시 같은 자리 재사용 등)을 함께 설계한다.
- **연결 수가 고르다고 부하가 고른 것은 아니다.** 클라이언트마다 트래픽이 다르면 백엔드 부하도 다르다. Finagle 문서는 서브세팅이 요청 속도와 요청 비용이 고른 "매끄러운" 트래픽에서 잘 맞고, 타이머로 몰아치는 캐시 무효화 같은 버스트는 일부 구간만 과부하시키므로 그런 경우엔 P2C(전체 백엔드 사용)가 나을 수 있다고 적는다.
- **서브셋이 작을수록 장애 영향이 크다.** 서브셋 10 개 중 하나가 죽으면 그 클라이언트 용량의 10% 가 사라진다. 서브셋 안의 헬스 체크·[이상치 감지](/develop-wiki/knowledge/performance/envoy-outlier-detection/)가 더 중요해진다.
- 책의 코드 목록을 그대로 쓴다면 k 를 백엔드 수를 나누도록 고르거나, 본문 설명처럼 나머지를 일부 서브셋에 더 붙인다(k=90 사례).
- Finagle 문서는 Aperture 가 P2C 계열보다 이해하기 어렵고 설정을 바꿀 일이 드물어야 한다고 적는다. 문서는 주요 지표로 `loadbalancer/vector_hash`, `aperture/coordinate` 등을 든다. 기본값을 바꾸기 전에 이 지표를 보는 것은 필자 제안이다.

## 비교

| 방식 | 백엔드별 연결 균형 | 클라이언트 ID 필요 | 백엔드 변경 시 변동 | 비고 |
| --- | --- | --- | --- | --- |
| 풀 메시 | 완전 | 아니오 | 없음 | 연결 수 = 클라이언트 × 백엔드 |
| 무작위 서브세팅 | 나쁨(위 표 20%~220%) | 아니오 | 작음(클라이언트별 독립) | 서브셋을 키워야 균형 |
| SRE 결정적 서브세팅 | 라운드가 차면 완전 | 예(연속) | 큼(시뮬레이션 77~94%) | 구현 단순 |
| Finagle Deterministic Aperture | 링 구간으로 균형 | 예(연속) | 이 노트에서 재지 않음 | 분수 구간, 가중치 지원 |

## 검증 범위

Google SRE 책 "Load Balancing in the Datacenter"(서브세팅 절과 코드 목록), Finagle 문서 Aperture Load Balancers 와 Clients(로드 밸런서 절)를 2026-11-19 에 읽었다. 시뮬레이션은 SRE 책 목록을 TypeScript 로 옮긴 Node 스크립트로 직접 실행했다(시드 1 개). Finagle Aperture 는 문서만 읽었고 소스·동작은 확인하지 않았다. 구간 크기 계산식, 기본 aperture 크기, 백엔드 변경 시 Aperture 의 연결 변동은 미확인이다.
