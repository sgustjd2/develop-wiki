---
title: 큐잉 이론 입문 — 사용률과 지연 곡선 (M/M/1, M/M/c)
aka: [Queueing Theory, M/M/1, M/M/c, Erlang C, Utilization, Hockey Stick Curve, Pollaczek-Khinchine, 사용률-지연 곡선]
category: performance
level: advanced
summary: 서버 사용률 ρ 가 오를수록 평균 지연이 1/(1-ρ) 로 비선형 폭증하는 이유와, 서버 수 c 가 늘면 같은 사용률에서도 대기가 줄어드는 이유를 M/M/c 공식과 시뮬레이션으로 보여 준다.
tags: [queueing, mm1, mmc, erlang-c, utilization, latency, capacity-planning, littles-law]
related: [performance/concurrency-limits-littles-law, performance/backpressure-load-shedding, performance/connection-pool, performance/load-balancing, performance/adaptive-throttling-retry-budget, performance/priority-load-shedding, performance/profiling]
sources:
  - https://en.wikipedia.org/wiki/M/M/c_queue
  - https://sre.google/sre-book/handling-overload/
updatedAt: 2026-11-19
---

## 문제

"CPU 가 70% 면 괜찮다, 90% 면 위험하다"는 경험칙은 맞지만 이유를 모르면 용량 계획에서 틀린다. 평균 사용률이 낮아도 지연이 크게 변하는 시스템이 있고, 서버를 두 배로 늘렸는데 지연이 두 배 이상 줄기도 한다. 큐잉 이론이 이 모양을 설명한다. [리틀의 법칙](/develop-wiki/knowledge/performance/concurrency-limits-littles-law/)이 "안에 몇 개 있나"를 주는 반면, 이 노트는 "**왜 지연이 이만큼 되나**"를 다룬다.

## 모델: M/M/c

기호는 켄달 표기다. 첫 M: 도착이 포아송(무작위·독립), 둘째 M: 서비스 시간이 지수분포, c: 서버 수. 대기열은 무한 FIFO 로 둔다.

- λ = 도착률, μ = 서버 하나의 서비스율(평균 서비스 시간 = 1/μ)
- **사용률 ρ = λ / (c·μ).** ρ ≥ 1 이면 대기열이 끝없이 자란다(안정 조건 ρ < 1).

### c = 1 (M/M/1)

평균 체류 시간(대기 + 서비스) W = 1 / (μ − λ) = (1/μ) / (1 − ρ).

서비스 시간 1/μ 단위로 보면 W = 1/(1−ρ). ρ = 0.5 → 2배, 0.8 → 5배, 0.9 → 10배, 0.95 → 20배, 0.99 → 100배다. 1 에 가까워질수록 곡선이 세로로 선다(하키 스틱). 사용률이 50% 에서 90% 로 1.8배 오를 때 지연은 5배 오른다.

### c > 1 (Erlang C)

제공 부하 a = λ/μ(얼랑 단위)일 때, 요청이 **대기해야 할 확률**은 얼랑 C 공식으로 구한다.

> C(c, a) = [ (a^c / c!) · c/(c−a) ] / [ Σ_{k=0}^{c−1} a^k/k! + (a^c / c!) · c/(c−a) ]

평균 대기 시간 Wq = C(c, a) / (c·μ − λ), 평균 체류 시간 W = Wq + 1/μ.

### 실행으로 확인

공식과 이산 사건 시뮬레이션(40만 건, 앞 10% 버림)을 비교했다. 서비스 시간 평균 = 1 로 정규화했다.

```ts
function erlangC(c: number, a: number): number {
  let term = 1, sum = 1;                                  // sum = Σ_{k<c} a^k/k!
  for (let k = 1; k < c; k++) { term *= a / k; sum += term; }
  const top = (term * a / c) * (c / (c - a));
  return top / (sum + top);
}
const W = (c: number, rho: number, mu = 1) => { const a = rho * c; return erlangC(c, a) / (c * mu - a * mu) + 1 / mu; };
```

| c | ρ | 이론 W | 시뮬 W | 시뮬 p99 |
| --- | --- | --- | --- | --- |
| 1 | 0.50 | 2.00 | 1.99 | 9.1 |
| 1 | 0.80 | 5.00 | 5.02 | 23.7 |
| 1 | 0.90 | 10.00 | 9.88 | 43.6 |
| 1 | 0.95 | 20.00 | 20.39 | 104.4 |
| 8 | 0.50 | 1.01 | 1.02 | 4.7 |
| 8 | 0.80 | 1.29 | 1.28 | 5.2 |
| 8 | 0.90 | 1.88 | 1.90 | 7.6 |
| 8 | 0.95 | 3.11 | 3.13 | 11.9 |

관찰:

1. 이론과 시뮬레이션이 잘 맞는다.
2. **같은 ρ 에서 서버가 많으면 대기가 훨씬 적다.** ρ = 0.9 에서 c = 1 은 W = 10, c = 8 은 1.88. 서버가 많으면 한 서버가 막혀도 다른 서버가 받는다(통계적 다중화). 그래서 큰 풀은 높은 사용률까지 버틴다.
3. **꼬리는 평균보다 훨씬 나쁘다.** c = 1, ρ = 0.9 에서 p99 는 평균의 4배가 넘는다. 목표가 p99 이면 평균 기준 사용률 한도는 더 낮아야 한다.
4. 총 용량이 같을 때 **느린 서버 8대**(W = 1.88)보다 **8배 빠른 서버 1대**(W = 1.25)가 낮다(ρ = 0.9, 서비스 시간 단위). 분할은 다중화 이득을 주지만 서비스 시간이 길어지는 손해가 더 크다.

## 실무로 번역

- **목표 사용률은 서버 수에 따라 다르다.** 작은 풀(서버·스레드 한두 개)은 50~70% 에서도 지연이 두 배가 되고, 큰 풀은 80~90% 까지 완만하다. 모든 서비스에 "70%" 를 일률적으로 쓰지 않는다.
- **오토스케일링 신호는 지연이 폭증하기 전**(ρ 곡선의 무릎 앞)에 걸어야 한다. 곡선이 서 있는 구간에서는 스케일 아웃이 완료되기 전에 이미 타임아웃이 난다.
- **커넥션 풀·스레드 풀**도 M/M/c 서버다. 풀 크기 c 와 평균 점유 시간으로 ρ 를 계산해 대기를 예측한다 → [커넥션 풀](/develop-wiki/knowledge/performance/connection-pool/).
- **과부하 방어의 근거**: ρ → 1 에서는 작은 트래픽 증가가 지연을 크게 키운다. 그래서 대기열을 무한히 두지 않고 동시성·큐 길이를 제한한다 → [백프레셔](/develop-wiki/knowledge/performance/backpressure-load-shedding/). SRE 책도 CPU 사용률 같은 자원 기준으로 임계를 두고 거절한다.

## 언제 쓰나

- 용량 계획(예상 트래픽에서 서버·풀 크기 산정), 오토스케일 임계값 설정, "왜 90% 에서 갑자기 느려지나" 설명.
- 풀 크기·큐 길이를 정하는 대략의 근거. 정밀 예측이 아니라 **곡선의 모양**을 아는 것이 목적이다.

## 주의 (한계)

- **가정이 현실과 다르다.** 도착은 버스트라 포아송보다 몰려서 오고, 서비스 시간은 지수분포보다 꼬리가 길다(캐시 미스, GC, 락). 서비스 시간의 변동이 크면 대기가 더 길다(M/G/1 의 Pollaczek-Khinchine 공식. 이 노트에서 직접 다루지 않았다). 공식 값은 **낙관적 하한**으로 본다.
- 정상 상태 평균이다. 급증 직후의 과도 상태나 대기열이 비는 데 걸리는 시간은 따로 본다.
- 재시도와 타임아웃은 도착 과정을 바꾼다. 지연이 늘면 재시도로 λ 가 오르는 **양성 되먹임**이 모델 밖에 있다 → [적응형 스로틀링과 재시도 예산](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/).
- 의존 서비스가 직렬로 이어진 시스템은 각 단계의 대기가 더해진다. 단계별 ρ 를 따로 본다.
- 이론은 병목을 찾는 것이 아니라 병목에서의 반응을 설명한다. 실제 병목은 [프로파일링](/develop-wiki/knowledge/performance/profiling/)으로 찾는다.
