---
title: 두 후보 중 고르기(Power of Two Choices) 로드 밸런싱
aka: [Power of Two Choices, P2C, Two Random Choices, Least Request, random two least_conn, Balanced Allocations, Supermarket Model, 쏠림(herding)]
category: performance
level: advanced
summary: 백엔드를 무작위로 두 개만 뽑아 부하가 적은 쪽에 보내는 방식. 전체를 훑는 최소 부하 선택에 가까운 균형을 O(1) 비용으로 얻고, 부하 정보가 낡아도 쏠림(herding)이 덜하다.
tags: [load-balancing, p2c, least-request, herding, balls-into-bins, envoy, nginx, tail-latency, randomized-algorithm]
related: [performance/load-balancing, performance/queueing-theory-utilization-latency, performance/concurrency-limits-littles-law, performance/hedged-requests-tied-requests, performance/backpressure-load-shedding, performance/mg1-service-time-variance-tail-latency, performance/connection-pool]
sources:
  - https://doi.org/10.1137/S0097539795288490
  - https://doi.org/10.1109/71.963420
  - https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers
  - https://nginx.org/en/docs/http/ngx_http_upstream_module.html
updatedAt: 2026-11-19
---

## 문제

- **무작위 분배**는 구현이 가장 쉽지만 서버마다 대기열이 독립적으로 흔들린다. 한 서버는 놀고 다른 서버는 쌓인다.
- **전체 최소 부하 선택**(Join-the-Shortest-Queue, JSQ)은 이론상 가장 균형이 좋다. 하지만 모든 백엔드의 현재 부하를 알아야 하고, 서버가 많으면 매 요청마다 O(N) 이다.
- 더 큰 문제는 **정보가 낡는다**는 점이다. 로드 밸런서가 보는 부하는 주기적 보고나 다른 로드 밸런서의 요청을 반영하지 못한다. 모두가 "지금 가장 한가한 서버"로 몰리면 그 서버가 곧바로 과부하가 된다(쏠림).

## 해법

요청마다 서버 **두 개를 무작위로** 뽑아 그중 부하(진행 중 요청 수 등)가 **적은 쪽**을 고른다.

- 수학적 배경은 balls-into-bins 문제다. Azar 등의 "Balanced Allocations"(SIAM J. Comput. 1999)는 공 n 개를 통 n 개에 넣을 때, 무작위 한 곳이면 가장 찬 통이 high probability 로 (1+o(1))·ln n / ln ln n 개인데, **두 곳을 뽑아 덜 찬 쪽**에 넣으면 ln ln n / ln 2 + O(1) 개로 줄어든다고 보였다(초록 기준. 지수적 개선). 공을 지우는 무한 과정에도 비슷한 격차가 있다고 한다.
- 이를 큐잉 모델(서버마다 큐, 도착·서비스가 확률적)로 확장해 분석한 대표 글이 Mitzenmacher 의 "The Power of Two Choices in Randomized Load Balancing"(IEEE TPDS 2001)이다. 이 노트에서 논문 본문은 읽지 않았고(초록 메타데이터만 확인), 아래 수치는 직접 시뮬레이션이다.

```ts
type Backend = { id: string; inflight: number };

function pickP2C(pool: Backend[], rnd: () => number = Math.random): Backend {
  if (pool.length === 1) return pool[0];
  const i = Math.floor(rnd() * pool.length);
  let j = Math.floor(rnd() * (pool.length - 1));
  if (j >= i) j++; // 서로 다른 두 후보
  return pool[j].inflight < pool[i].inflight ? pool[j] : pool[i]; // 동률이면 첫 후보
}
```

(백엔드 5개, inflight 0·10·20·30·40 으로 10 만 번 뽑아 실행했다. 서로 다른 두 후보 쌍 10 개 중 가장 한가한 쪽이 이기는 쌍이 4, 3, 2, 1 개이므로 기대 비율 40·30·20·10·0% 인데, 관측은 39.8·30.2·20.0·10.0·0% 였다.)

## 직접 실행: 시뮬레이션

난수 시드를 고정한 Node 스크립트다. 외부 라이브러리 없음.

**1) 정적 balls-into-bins**: 공 n 개, 통 n 개, 시드 10 개의 최댓값 범위. d 는 후보 수(d=1 은 무작위).

| n | d=1 | d=2 | d=3 |
| --- | --- | --- | --- |
| 1,000 | 5~6 | 3 | 2~3 |
| 10,000 | 6~8 | 3 | 3 |
| 100,000 | 7~9 | 3~4 | 3 |
| 1,000,000 | 8~10 | 4 | 3 |

d=1 은 n 이 커질수록 계속 자라고, d=2 는 거의 제자리다. d=2 → 3 의 추가 개선은 한 칸 정도다. 이 표는 위 이론의 점근식과 방향이 같다. 상수까지 일치하는지는 확인하지 않았다.

**2) 동적 큐(서버 50 대, 서비스 시간 지수분포 평균 1, 도착은 포아송)**: 서버당 도착률 λ 가 이용률이다. 평균 응답 시간 / p99. 시드 3 개 범위(무작위는 시드 편차가 커서 범위로 적는다). 시뮬레이션 시간은 4,000 단위, 처음 20% 는 버렸다.

| λ | 무작위 | P2C (d=2) | d=3 | JSQ (전체, 최신 정보) |
| --- | --- | --- | --- | --- |
| 0.7 | 3.3~3.4 / 15 | 1.6 / 6.6 | 1.4 / 5.8 | 1.0 / 4.6 |
| 0.9 | 9.1~10.8 / 40~50 | 2.7 / 8.9 | 2.1 / 7.6 | 1.2 / 5.3 |
| 0.95 | 17~22 / 71~94 | 3.5 / 10.6 | 2.7 / 8.8 | 1.4 / 6.0 |

- 무작위는 서버 하나가 독립된 M/M/1 이므로 평균 응답이 1/(1-λ)(3.3, 10, 20)에 가깝다. 시뮬레이션이 이를 따른다.
- P2C 는 이용률이 높을수록 무작위와의 격차가 커진다. λ=0.9 에서 평균은 약 1/4, p99 는 약 1/4~1/5.
- JSQ 는 최신 정보를 가정하면 가장 좋다. P2C 는 그 사이에 있다.

**3) 부하 정보가 낡을 때(λ=0.9)**: 로드 밸런서가 보는 큐 길이를 주기적으로만 갱신한다(갱신 주기는 평균 서비스 시간 단위). 평균 응답 / p99.

| 갱신 주기 | P2C | JSQ (동률 시 서버 번호 순) | JSQ (동률 시 무작위) |
| --- | --- | --- | --- |
| 0 (실시간) | 2.7 / 8.9 | 1.2 / 5.3 | 1.2 / 5.2 |
| 0.5 | 2.8 / 9.5 | 12.4 / 34 | 3.0 / 13.5 |
| 2 | 3.3 / 10.8 | 45 / 105 | 6.5 / 27 |
| 5 | 4.0 / 13.3 | 111 / 240 | 12.8 / 53 |

- JSQ 는 정보가 조금만 낡아도 무너진다. 같은 "가장 한가한" 서버에 요청이 한꺼번에 몰리기 때문이다(동률 처리를 서버 번호 순으로 하면 극단적이고, 무작위로 풀어도 악화된다).
- P2C 는 낡은 정보에서도 서서히 나빠질 뿐이다. 매 요청이 서로 다른 두 후보를 보므로 모두가 같은 서버를 고르지 않는다. Envoy 문서도 P2C 의 장점으로 쏠림에 대한 저항을 든다.
- 단일 프로세스의 단순화 모델이다. 실제 로드 밸런서는 요청 비용 분산, 재시도, 연결 수립 비용, 다수의 밸런서 인스턴스가 얽힌다.

## 실제 구현

- **Envoy**: weighted least request 의 가중치가 모두 같으면 무작위로 N 개(기본 2)를 뽑아 활성 요청이 가장 적은 호스트를 고른다. 문서가 이를 P2C 라고 부르며 전체 스캔 O(N) 대비 O(1) 이라고 설명한다. 가중치가 다르면 다른 알고리즘(가중 라운드 로빈 기반)으로 바뀐다.
- **NGINX**: `upstream` 의 `random two [method]` 는 서버 두 개를 무작위로 뽑은 뒤 지정한 방식(기본 `least_conn`, 유료 판의 `least_time` 등)으로 하나를 고른다. 이 노트에서는 오픈소스 문서의 설명만 확인했다.

## 언제 쓰나

- 백엔드가 수십~수천이고 요청 비용이 비슷하며, 연결 수·진행 중 요청 수 같은 **값싼 부하 신호**가 있을 때.
- 로드 밸런서가 **여러 인스턴스**여서 서로의 상태를 공유하지 못할 때(각자 자기 시야만 있는 상황에서 JSQ 는 쏠림이 크다).
- 서버 풀이 자주 바뀌어(오토스케일링) 라운드 로빈의 순서 상태·가중치 관리가 번거로울 때.
- 라운드 로빈이 요청 비용 편차(긴 요청 몇 개) 때문에 한쪽을 쌓이게 할 때 → [꼬리 지연과 서비스 시간 분산](/develop-wiki/knowledge/performance/mg1-service-time-variance-tail-latency/).

## 주의 (비용)

- **부하 신호의 질이 상한이다.** 진행 중 요청 수는 요청 비용이 균일해야 의미가 있다. 가벼운 요청 100 개와 무거운 요청 1 개를 같은 한 칸으로 센다. 비용 편차가 크면 가중 신호(예측 비용, EWMA 응답 시간)를 쓰되 신호가 낡는 문제가 되돌아온다.
- **관측 범위가 밸런서 인스턴스 하나다.** 인스턴스가 여럿이면 각자 자기가 보낸 요청만 센다. P2C 는 이 부분 정보에서도 쏠림이 덜하지만, 전역 정보를 가진 것과 같지는 않다.
- **빨리 실패하는 백엔드가 끌어들인다.** 오류를 즉시 반환하는 서버는 진행 중 요청이 적어서 계속 이긴다(블랙홀). 헬스 체크·이상치 제거(outlier ejection)·오류 응답 가중이 별도로 필요하다. 이 지적은 이 노트의 추론이며 실험하지 않았다.
- **새 서버(진행 중 0)는 한동안 이긴다.** 후보로 뽑힐 때마다 이기므로 공정 몫(1/N)의 약 두 배를 받을 수 있다. 느린 시작(slow start)·워밍업이 필요한 서버(JIT, 캐시)에는 별도 완화를 둔다. 역시 추론이다.
- 두 후보가 같은 서버가 되지 않게 뽑는다(위 코드). 복원 추출이면 풀이 작을 때 효과가 줄어든다. 풀이 매우 작으면(2~3 대) 전체 비교가 더 싸다.
- 후보를 늘린다고 계속 좋아지지 않는다. 위 표에서 d=3 의 개선은 d=2 대비 작았고, 더 보는 만큼 신호가 쏠릴 여지와 비용이 는다.
- **친화성(세션 고정, 캐시 지역성)이 필요한 라우팅에는 안 맞는다.** 이 경우는 일관된 해시가 맞고, 해시에 부하 상한을 거는 변형(bounded loads)을 쓴다. 이 변형은 이 노트에서 다루지 않았다.
- 과부하 자체를 해결하지 않는다. 평균 이용률이 100% 근처면 P2C 도 소용없으므로 [백프레셔·로드 셰딩](/develop-wiki/knowledge/performance/backpressure-load-shedding/)과 용량이 따로 필요하다.

## 비교

| 방식 | 비용(요청당) | 필요한 정보 | 낡은 정보에서 | 약점 |
| --- | --- | --- | --- | --- |
| 무작위 | O(1) | 없음 | 해당 없음 | 대기열이 독립적으로 쌓임 |
| 라운드 로빈 | O(1) + 순서 상태 | 없음 | 해당 없음 | 요청 비용 편차에 약함 |
| 전체 최소 부하 (JSQ) | O(N) | 모든 서버의 현재 부하 | 쏠림으로 급격히 악화(위 시뮬레이션) | 비용, 쏠림 |
| P2C | O(1) | 후보 두 개의 부하 | 완만히 악화 | 부하 신호 품질, 블랙홀 |
| 일관된 해시 | O(log N) 또는 O(1) | 없음 | 해당 없음 | 균형 보장 약함, 핫키 |

일반 개요와 헬스 체크·드레이닝은 [로드 밸런싱](/develop-wiki/knowledge/performance/load-balancing/)에서 다룬다. 요청이 겹칠 때의 지연은 [큐잉 이론](/develop-wiki/knowledge/performance/queueing-theory-utilization-latency/), 서버별 동시성 한도는 [동시성 한도와 리틀의 법칙](/develop-wiki/knowledge/performance/concurrency-limits-littles-law/)이 이어진다. P2C 는 첫 선택의 균형을, [요청 헤징](/develop-wiki/knowledge/performance/hedged-requests-tied-requests/)은 그 뒤 남은 꼬리를 줄이는 별개의 수단이다.

## 검증 범위

Azar 등 논문의 초록(Crossref 메타데이터)과 Mitzenmacher 논문의 서지 정보(제목·연도)를 확인했고 본문은 읽지 못했다. Envoy 로드 밸런서 개요 문서와 NGINX upstream 모듈 문서의 해당 절을 읽었다. 위 세 표와 코드 확인은 직접 쓴 Node 스크립트(시드 고정)로 실행했다. 동적 시뮬레이션은 서버 50 대, 시간 4,000 단위, 시드 3 개의 소규모 실험이라 소수점 수치는 참고용이다. 실제 프록시(Envoy·NGINX)를 띄워 측정하지는 않았다.
