---
title: 요청 헤징(hedged requests)과 tied requests
aka: [Hedged Requests, Tied Requests, Backup Requests, Speculative Retry, Tail at Scale, 꼬리 지연 완화, 중복 요청]
category: performance
level: advanced
summary: 같은 읽기 요청을 느린 꼬리에 걸린 복제본 대신 다른 복제본에도 늦게 보내 먼저 오는 응답을 쓰는 기법. 지연 기준(예 p95)과 취소가 없으면 부하만 두 배가 되어 오히려 무너진다.
tags: [tail-latency, hedging, tied-requests, replication, cancellation, resilience, p99, dean-barroso]
related: [performance/timeout-retry-circuit-breaker, performance/adaptive-throttling-retry-budget, performance/deadline-propagation-cancellation, performance/metastable-failures-retry-storm, performance/load-balancing, performance/mg1-service-time-variance-tail-latency, performance/queueing-theory-utilization-latency, performance/backpressure-load-shedding, distributed-systems/idempotency]
simulation: hedged-requests
sources:
  - https://doi.org/10.1145/2408776.2408794
  - https://www.barroso.org/publications/TheTailAtScale.pdf
updatedAt: 2026-11-19
---

## 문제

요청 하나가 서버 수백 대의 응답을 모아야 하는 구조(검색, 캐시 샤드 다중 조회)에서는 **서버 하나의 드문 느림이 요청 전체의 흔한 느림**이 된다. 서버 1 대의 느린 요청이 1% 여도 100 대를 모으면 대부분의 상위 요청이 그 한 건을 만난다. 느림의 원인은 요청 자체보다 GC, 백그라운드 작업, 큐 대기 같은 **일시적 간섭**인 경우가 많다. 그러면 같은 일을 다른 복제본에 시키면 보통 빨리 끝난다.

타임아웃 후 재시도도 비슷하지만 "포기하고 다시"라서 이미 늦은 시간이 사라지지 않는다. 헤징은 **원래 요청을 살려 둔 채** 보조 요청을 더한다.

## 해법

### 1. 헤징 (Dean & Barroso, CACM 2013)

1. 가장 적절하다고 믿는 복제본 하나에 먼저 보낸다.
2. 일정 지연 안에 응답이 없으면 **다른 복제본에 같은 요청**을 보낸다.
3. 먼저 도착한 응답을 쓰고 남은 요청은 취소한다.

논문의 요점은 **순진한 구현은 부하를 크게 늘린다**는 것이다. 지연을 "이 종류 요청의 95번째 백분위 지연"으로 잡으면 추가 부하가 약 5% 로 제한된다. 논문의 BigTable 벤치마크(100대에 분산된 1,000 키 읽기)에서는 10ms 뒤 헤징만으로 전체 99.9번째 백분위 지연이 1,800ms 에서 74ms 로, 요청은 2% 늘었다고 보고한다. 보조 요청을 낮은 우선순위로 표시하면 부담이 더 준다.

### 2. tied requests

헤징에는 **같은 요청이 두 서버에서 불필요하게 실행되는 틈**이 있다. 논문은 요청을 두 서버 큐에 동시에 넣되 서로 상대를 알려 두고, **한쪽이 실행을 시작하는 순간 상대에게 취소 메시지**를 보내게 한다. 상대 큐에 아직 남아 있으면 즉시 버리거나 우선순위를 크게 낮춘다. 두 서버가 동시에 시작할 수 있는 창은 네트워크 왕복 정도이므로, 두 번째 요청을 평균 메시지 지연의 2 배(데이터센터에서 1ms 이하)만큼 늦춰 보내라고 한다.

논문 표 2(콜드 읽기, 복제본 3개)에서 1ms 뒤 tied request 는 한가한 클러스터에서 중앙값 -16%, 99.9번째 백분위 -38% 였고, 디스크 사용 증가는 1% 미만이었다.

효과는 느림의 원인이 **여러 복제본에 동시에 퍼지지 않을 때만** 난다는 것이 논문의 전제다.

```ts
async function hedged<T>(replicas: string[], call: (r: string, s: AbortSignal) => Promise<T>, delayMs: number): Promise<T> {
  const ac = new AbortController();
  const attempt = (r: string) => call(r, ac.signal);
  const first = attempt(replicas[0]);
  const timer = new Promise<'late'>((res) => setTimeout(() => res('late'), delayMs));
  try {
    if ((await Promise.race([first, timer])) !== 'late') return await first;
    return await Promise.any([first, attempt(replicas[1])]);   // 먼저 온 쪽
  } finally { ac.abort(); }                                       // 남은 쪽 취소
}
```

(단순화한 스케치다. 실제로는 지연값을 최근 지연 분포에서 갱신하고, 재시도 예산 안에서만 보낸다.)

## 직접 실행으로 확인

서버 10 대, 서버당 워커 1 개(FIFO 큐). 서비스 시간은 실행마다 독립으로 98% 는 약 10ms, 2% 는 약 200ms(각 ×U(0.5,1.5)). 포아송 도착, 조건당 30 만 요청, 시드 고정 1 회 실행. 요청은 무작위 서버 하나에 보내고, 헤징 지연은 **헤징 없을 때의 p95**(또는 p90)로 잡았다. "취소"는 아직 큐에 있는 사본을 시작 전에 버리는 경우다(실행 중인 사본은 끝까지 간다). util 은 헤징 전 기준 가동률이다.

| util | 설정 | p99 (ms) | p99.9 (ms) | 요청당 실행 수 |
| --- | --- | --- | --- | --- |
| 0.02 | 헤징 없음 | 208 | 291 | 1.000 |
| 0.02 | 지연=p95(14.8ms) | 26 | 30 | 1.051 |
| 0.1 | 헤징 없음 | 231 | 296 | 1.000 |
| 0.1 | 지연=p95, 취소 없음 | 40 | 144 | 1.050 |
| 0.1 | 지연=p95, 큐 취소 | 40 | 131 | 1.024 |
| 0.3 | 헤징 없음 | 274 | 433 | 1.000 |
| 0.3 | 지연=p95(161ms), 큐 취소 | 176 | 259 | 1.021 |
| 0.3 | 지연=p90(66ms), 큐 취소 | 92 | 213 | 1.029 |
| 0.5 | 헤징 없음 | 362 | 552 | 1.000 |
| 0.5 | 지연=p95(230ms), 큐 취소 | 250 | 333 | 1.015 |
| 0.7 | 헤징 없음 | 642 | 1,042 | 1.000 |
| 0.7 | 지연=p95(383ms), **취소 없음** | **p50 106,000 (발산)** | - | 1.968 |
| 0.7 | 지연=p95(383ms), 큐 취소 | 407 | 532 | 1.006 |

- **한가한 구간**(util 0.02)에서는 추가 요청 5% 로 p99 가 208 → 26ms 로 줄었다. 논문이 말한 "간섭성 느림" 모형과 맞는다.
- **가동률이 오르면 이득이 급감**한다. util 0.3 이상에서는 느림의 상당 부분이 "느린 요청 뒤에서 기다린 큐 지연"이고, 헤징 기준(p95)이 이미 160ms 를 넘어서 보조 요청이 늦게 나간다. 다른 복제본도 비슷하게 밀려 있어 효과가 작다.
- **취소 없는 헤징은 util 0.7 에서 발산**했다(응답 시간 수 분). 헤지 사본이 실행되며 부하가 1.97 배가 되어 큐가 더 길어지고, 그래서 헤지가 더 늘어나는 되먹임이다. 취소(큐 사본 폐기)가 있으면 같은 조건에서 안정이었다. → [메타안정 실패](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/)와 같은 구조.
- 이 모사는 서버·서비스 시간 분포를 내가 정한 것이고 한 번의 시드 실행이다. 경향을 보이는 용도이며 실제 시스템 수치가 아니다.

## 언제 쓰나

- 읽기 위주, 복제본이 이미 있고, **느림이 복제본마다 독립적**인 팬아웃 조회(검색 샤드, 키-값 읽기).
- 평균 가동률이 낮아 여유가 있고, 취소를 전파할 수 있는 RPC 계층이 있을 때.
- p99 가 SLO 를 결정하는 서비스.

## 주의 (비용)

- **부하 증가가 곧 위험이다.** 지연 기준을 너무 낮추면 거의 모든 요청이 두 배가 된다(표에 싣지 않은 예비 실행에서 지연을 중앙값(약 12ms) 근처인 10ms 로 잡았더니 util 0.3 에서 요청의 74% 가 헤지됐다). 헤지 비율에 **상한(예산)** 을 둔다 → [재시도 예산](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/).
- **취소 전파가 없으면 쓰지 않는 편이 낫다.** 위 발산이 그 예다 → [취소 전파](/develop-wiki/knowledge/performance/deadline-propagation-cancellation/).
- **같은 원인이 모든 복제본에 걸리면 소용없다**(공유 디스크, 같은 느린 쿼리, 과부하). 논문도 이 전제를 명시한다.
- **부작용 있는 요청에는 쓰지 않는다.** 같은 요청이 두 번 실행될 수 있으므로 읽기나 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/) 연산에 한정한다(이 부분은 논문이 아니라 이 노트의 의견).
- 과부하 중에는 헤징을 꺼야 한다. 서버가 "이미 느림"을 알리는 신호가 있으면 그때 헤지를 멈춘다 → [백프레셔](/develop-wiki/knowledge/performance/backpressure-load-shedding/).
- 지연 기준(p95 등)은 **측정된 최근 분포**에서 정해야 하고, 값이 오래되면 헤지 비율이 어긋난다.

## 비교

| 방법 | 원 요청 | 추가 요청 시점 | 낭비를 막는 수단 |
| --- | --- | --- | --- |
| 타임아웃 후 재시도 | 포기 | 타임아웃 뒤 | 재시도 예산 |
| 헤징 | 유지 | 지연(예 p95) 뒤 | 기준 지연, 완료 후 취소 |
| tied request | 유지 | 동시(또는 ~1ms 뒤) | 서로 취소 메시지 |
| 큐 길이 조사 후 최단 큐 선택 | 1 개 | 없음 | 조사와 도착 사이에 부하가 바뀜(논문이 지적) |

[로드 밸런싱](/develop-wiki/knowledge/performance/load-balancing/)이 "어디로 보낼지"라면 헤징은 "늦으면 어디에 또 보낼지"다. 꼬리의 근원(서비스 시간 분산)은 [M/G/1](/develop-wiki/knowledge/performance/mg1-service-time-variance-tail-latency/)과 [가동률-지연 관계](/develop-wiki/knowledge/performance/queueing-theory-utilization-latency/)에서 다룬다.

## 검증 범위

Dean & Barroso, "The Tail at Scale"(CACM 56(2), 2013)의 PDF 사본(barroso.org)을 텍스트로 추출해 헤징·tied request·표 2 부분을 읽었다(수치는 그 텍스트 기준). 후속 구현(gRPC hedging 정책, 각 DB 드라이버의 speculative execution)의 세부는 읽지 않았다. 위 표는 직접 작성한 이산 사건 모사의 결과다.
