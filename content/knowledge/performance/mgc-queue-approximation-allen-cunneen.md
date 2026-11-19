---
title: 다중 서버 큐 근사 — Kingman·Allen–Cunneen (G/G/c)
aka: [G/G/c Approximation, Allen-Cunneen, Kingman Formula, VUT Equation, M/G/c, Lee-Longton, Erlang C, SCV, 다중 서버 대기 근사]
category: performance
level: advanced
summary: M/M/c 의 평균 대기에 (도착 SCV + 서비스 SCV)/2 를 곱해 변동성을 반영하는 근사식. 서버 1대는 Kingman 과 같고, 서버가 많고 사용률이 낮은 영역에서는 과대 추정하는 경향을 시뮬레이션으로 보인다.
tags: [queueing, ggc, kingman, allen-cunneen, erlang-c, scv, capacity-planning, thread-pool]
related: [performance/queueing-theory-utilization-latency, performance/mg1-service-time-variance-tail-latency, performance/concurrency-limits-littles-law, performance/connection-pool, performance/load-balancing, performance/bulkhead, performance/profiling]
sources:
  - https://en.wikipedia.org/wiki/Kingman%27s_formula
  - https://en.wikipedia.org/wiki/M/G/k_queue
  - https://www.johndcook.com/blog/2022/01/15/ggs/
  - https://doi.org/10.1017/S0305004100036094
updatedAt: 2026-11-19
---

## 문제

앞선 노트들은 두 극단을 다뤘다. [M/M/c](/develop-wiki/knowledge/performance/queueing-theory-utilization-latency/)는 서버 여러 대지만 도착·서비스가 모두 지수분포라 가정하고, [M/G/1](/develop-wiki/knowledge/performance/mg1-service-time-variance-tail-latency/)은 서비스 시간 변동을 담지만 서버가 1대다. 스레드 풀·커넥션 풀·워커 군은 **서버 여러 대 + 변동이 큰 서비스 시간 + 버스트한 도착**이다. M/G/c 는 정확한 닫힌 형태 해가 알려져 있지 않다(위키백과는 대부분의 성능 지표가 미해결이라고 쓴다). 그래서 근사를 쓴다.

## 근사식

변동성은 **변동계수 제곱(SCV)** `c² = Var/평균²` 로 잰다. 도착 간격의 SCV 를 `ca²`, 서비스 시간의 SCV 를 `cs²`, 서버 수 c, 사용률 ρ, 평균 서비스 시간 E[S] 라 하자.

- **Kingman (G/G/1)**: `Wq ≈ ρ/(1−ρ) · (ca²+cs²)/2 · E[S]`. "사용률 × 변동성 × 시간" 세 인수의 곱이라 VUT 식이라고도 부른다. 1961 년 중부하(heavy traffic) 논문에서 나왔고, 포화에 가까운 곳에서 정확한 편으로 알려져 있다.
- **M/G/c 근사 (도착이 포아송, ca²=1)**: `Wq(M/G/c) ≈ (1+cs²)/2 · Wq(M/M/c)`. 위키백과가 1959 년 결과를 서비스 시간 SCV 로 M/M/c 대기를 보정한 근사로 소개한다(Lee–Longton 으로도 불린다는 표기는 확인하지 못했다).
- **Allen–Cunneen (G/G/c)**: 같은 구조에 도착 변동까지 넣는다.

> `Wq ≈ Wq(M/M/c) · (ca² + cs²) / 2`, 여기서 `Wq(M/M/c) = ErlangC(c, cρ) / (c·μ·(1−ρ))`

이 식은 지수분포(`ca²=cs²=1`)에서 정확히 M/M/c 로 돌아간다. 출처로 확인한 것은 John D. Cook 의 글(Allen 교재를 인용해 M/M/s 대기에 변동계수 인수를 곱한다고 설명)과 단일 서버 형태이며, **Allen 의 원 교재는 읽지 못했다.** 위 다중 서버 식은 표준 형태로 알려진 것을 쓴 것이고, 아래 시뮬레이션으로 정합성을 직접 점검했다.

```ts
function erlangC(c: number, a: number): number {           // a = c·ρ (제공 부하)
  let sum = 0, term = 1;
  for (let k = 0; k < c; k++) { if (k > 0) term *= a / k; sum += term; }
  const top = (term * a / c) * c / (c - a);                 // a^c/c! · c/(c−a)
  return top / (sum + top);
}
// E[S]=1 로 정규화한 평균 대기
const wqMMc = (c: number, rho: number) => erlangC(c, c * rho) / (c * (1 - rho));
const wqAC = (c: number, rho: number, ca2: number, cs2: number) => wqMMc(c, rho) * (ca2 + cs2) / 2;
```

## 직접 실행으로 확인

FIFO, 서버 c 대, 평균 서비스 시간 1, 200만 건(앞 10% 버림, 시드 고정). 서비스 시간은 로그정규(cs²=4), 도착은 지수(ca²=1)·얼랑-2(0.5)·로그정규(4). Wq 는 서비스 시간 단위. AC 는 위 근사값, 오차 = (AC−시뮬)/시뮬.

| c | ρ | ca² | cs² | M/M/c | AC 근사 | 시뮬 | 오차 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.8 | 1 | 1 | 4.00 | 4.00 | 4.03 | −0.7% |
| 1 | 0.8 | 1 | 4 | 4.00 | 10.00 | 9.86 | +1.4% |
| 1 | 0.8 | 4 | 4 | 4.00 | 16.00 | 15.15 | +5.6% |
| 4 | 0.8 | 1 | 4 | 0.746 | 1.864 | 1.595 | +16.9% |
| 4 | 0.8 | 0.5 | 4 | 0.746 | 1.677 | 1.386 | +21.0% |
| 4 | 0.8 | 4 | 4 | 0.746 | 2.982 | 2.764 | +7.9% |
| 16 | 0.8 | 1 | 4 | 0.095 | 0.238 | 0.170 | +40.3% |
| 16 | 0.8 | 0.5 | 4 | 0.095 | 0.214 | 0.126 | +70.7% |
| 16 | 0.8 | 4 | 4 | 0.095 | 0.381 | 0.376 | +1.2% |
| 4 | 0.95 | 1 | 4 | 4.457 | 11.14 | 10.48 | +6.3% |
| 16 | 0.95 | 1 | 4 | 0.975 | 2.438 | 2.402 | +1.5% |

읽는 법:

- **서버 1대나 사용률이 높은 곳(ρ=0.95)** 에서는 오차가 몇 % 이내다.
- **서버가 많고(16) 사용률이 중간(0.8)** 이며 서비스 변동이 큰데 도착이 평범하면, 근사가 대기를 **크게 과대 추정**한다(+40~70%). 이 영역은 대기 자체가 서비스 시간의 0.1~0.2 배로 작아서 절대 오차는 작지만, 비율로는 크다.
- 어느 쪽이든 근사는 M/M/c 보다 훨씬 낫다: 16대, ρ=0.8, cs²=4 에서 M/M/c 는 0.095, 시뮬은 0.17 이므로 변동을 무시하면 거의 절반으로 과소 평가한다.
- 이 표의 오차 경향(서버가 많을수록 과대)은 이 한 가지 분포 조합의 결과다. 다른 분포(예: 하이퍼지수)에서는 달라질 수 있어 일반화하지 않았다.

## 언제 쓰나

- 풀 크기·워커 수를 정하기 전에 "변동성이 크면 같은 사용률에서 대기가 몇 배인가"를 어림할 때. 서비스 시간의 평균·SCV 는 히스토그램에서 얻는다 → [프로파일링](/develop-wiki/knowledge/performance/profiling/).
- "사용률 70% 면 안전" 같은 규칙을 변동성으로 보정해 반박·조정할 때.
- 서버 추가 대 변동성 감소 중 어느 쪽이 더 효과적인지 비교할 때. 근사식에서 대기는 (ca²+cs²) 에 선형 비례하므로, 서비스 SCV 를 줄이는 효과를 바로 계산할 수 있다.

## 주의 (비용)

- **평균 대기 근사일 뿐이다.** p99 같은 분위수, 최악 지연은 알려주지 않는다. SLO 가 꼬리라면 시뮬레이션·실측이 필요하다.
- 도착 간 독립·서비스 시간 독립(renewal) 가정이 있다. 실제 트래픽의 자기상관 버스트, 부하 시 서비스 시간 증가(락 경합·GC)는 모델 밖이라 실제가 더 나쁘다 → [메타안정 장애](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/).
- 위키백과는 평균과 분산 두 모멘트만으로 모든 경우에 정확한 근사는 불가능하다고 적는다. 위 표처럼 오차는 구간별로 다르다.
- `E[S²]` 가 무한한 꼬리(분산 없음)면 의미가 없다.
- ρ≥1 에서는 성립하지 않는다(대기가 무한). 재시도·타임아웃이 끼면 유효 도착률이 달라져 식이 틀린다.
- Erlang C 는 c 가 크면 팩토리얼 계산이 넘치므로 위 코드처럼 누적 곱으로 계산한다. 그래도 매우 큰 c 는 로그 공간이 필요하다.

## 비교

| 모델 | 도착 | 서비스 | 서버 | 평균 대기 |
| --- | --- | --- | --- | --- |
| M/M/c | 포아송 | 지수 | c | Erlang C 기반 정확식 |
| M/G/1 | 포아송 | 일반 | 1 | 정확식(P-K) |
| G/G/1 | 일반 | 일반 | 1 | Kingman 근사 |
| M/G/c | 포아송 | 일반 | c | M/M/c × (1+cs²)/2 근사 |
| G/G/c | 일반 | 일반 | c | M/M/c × (ca²+cs²)/2 근사 |

## 검증 범위

위키백과의 Kingman 공식·M/G/k 항목과 Cook 의 블로그 글을 읽었다. Kingman 원 논문, Allen 의 교재, Allen–Cunneen 식의 1차 출처는 읽지 못했다. 표의 시뮬 값은 직접 만든 이산 사건 시뮬레이션(Node)으로 구한 것이다.
