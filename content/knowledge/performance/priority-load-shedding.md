---
title: 우선순위 기반 부하 차단 (중요도 등급과 큐 임계)
aka: [Priority Load Shedding, Criticality, Selective Shedding, Deadline Propagation, Admission Control, 중요도 기반 거절, SHEDDABLE]
category: performance
level: advanced
summary: 과부하 때 요청을 무작위로 버리지 않고 중요도 등급별로 서로 다른 임계에서 거절해, 핵심 요청의 성공률을 지키고 이미 쓸모없어진 요청에 일하지 않게 하는 설계.
tags: [load-shedding, criticality, overload, sre, deadline, admission-control, queue]
related: [performance/backpressure-load-shedding, performance/adaptive-throttling-retry-budget, performance/queueing-theory-utilization-latency, performance/concurrency-limits-littles-law, performance/rate-limiting, performance/bulkhead, performance/timeout-retry-circuit-breaker]
sources:
  - https://sre.google/sre-book/handling-overload/
  - https://sre.google/sre-book/addressing-cascading-failures/
updatedAt: 2026-11-19
---

## 문제

[백프레셔와 부하 차단](/develop-wiki/knowledge/performance/backpressure-load-shedding/)은 "과부하에서는 버려야 한다"는 원칙을 다뤘다. 남는 질문은 **무엇을, 언제, 어떤 순서로** 버리느냐다. 순서를 정하지 않으면 두 가지가 생긴다.

- 모든 요청이 같은 확률로 실패해, 결제 같은 핵심 요청과 백그라운드 동기화가 함께 무너진다.
- 큐에 오래 있던 요청이 클라이언트가 포기한 뒤에 처리돼, 서버가 **아무도 받지 않을 응답**을 만드느라 용량을 쓴다.

## 해법: 중요도 + 큐 기준 + 데드라인

### 1. 요청에 중요도를 붙인다

SRE 책(21장)은 4단계를 소개한다. 과부하 때 낮은 등급이 먼저 거절된다.

| 등급 | 용도(책의 설명을 요약) |
| --- | --- |
| `CRITICAL_PLUS` | 실패하면 사용자에게 심각하게 보이는 요청 |
| `CRITICAL` | 운영 작업의 기본값. 이 이상 등급의 용량은 항상 확보해 둔다 |
| `SHEDDABLE_PLUS` | 부분적 불가용을 견딜 수 있는 트래픽. 배치의 기본값 |
| `SHEDDABLE` | 빈번한 부분 불가용과 가끔의 전면 불가용도 견디는 트래픽 |

중요도는 **RPC 메타데이터로 하위 호출에 전파**된다. 기본적으로 하위 요청은 원 요청의 등급을 물려받는다. 그래서 사용자 요청이 만든 내부 호출은 같이 보호된다.

### 2. 사용률 임계를 등급마다 다르게

서버는 CPU 사용률 같은 **자원 기준**(요청 수가 아니라)으로 과부하를 판단하고, 임계에 가까워지면 낮은 등급부터 거절한다. 높은 등급일수록 더 높은 임계를 갖는다(책).

### 3. 큐와 데드라인

[cascading failures 장](https://sre.google/sre-book/addressing-cascading-failures/)이 설명하는 요점:

- 큐를 길게 두면 지속적인 과부하에서 지연과 메모리만 는다. 작은 큐(스레드 풀의 약 50% 이하)로 초과분을 일찍 거절한다.
- FIFO 대신 **LIFO 나 CoDel** 을 쓰면 이미 포기됐을 가능성이 높은 오래된 요청을 버린다.
- **데드라인을 호출 체인 위에서 정해 아래로 전파**하고, 서버는 단계마다 남은 시간을 확인한다. 클라이언트가 포기한 일은 점수가 없다.
- 선택적 차단의 예: 백그라운드 동기화는 버리고 대화형 세션은 유지. 사고 중에는 프리페치 같은 덜 중요한 트래픽부터 끈다.

### 실행으로 확인

서버 1대(요청당 10ms, 용량 100/s)에 150/s 가 도착한다(과부하 1.5배). 클라이언트 데드라인은 500ms, 구성은 critical 20% / normal 30% / sheddable 50%. 300초를 모의했다.

```ts
// admit(큐 길이, 등급) 이 false 면 즉시 거절. skipExpired 면 "데드라인 안에 못 끝낼 요청"은 꺼내서 건너뜀
const THRESH = { critical: 40, normal: 25, sheddable: 10 };
run('D', (q, c) => q < THRESH[c], true);
```

| 정책 | critical | normal | sheddable | 데드라인 내 완료 |
| --- | --- | --- | --- | --- |
| A. 무제한 FIFO, 만료돼도 처리 | 0% | 0% | 0% | **0/s** (모두 늦게 끝남) |
| B. 무제한 FIFO, 못 끝낼 요청은 건너뜀 | 68% | 67% | 66% | 100/s |
| C. 큐 길이 30 초과 시 전부 거절 | 67% | 68% | 67% | 100/s |
| D. 등급별 임계(40/25/10) | **100%** | **100%** | 34% | 100/s |

- A: 대기열이 무한히 자라 모든 응답이 데드라인을 넘긴다. 서버는 쉬지 않고 일하지만 **유용한 처리량이 0** 이다(용량 100/s 가 전부 낭비).
- B, C: 쓸모없는 일을 줄이면 처리량은 용량(100/s)에 도달하지만 **성공 확률은 등급과 무관**하다. 결제와 백그라운드가 같이 실패한다.
- D: 같은 처리량에서 핵심 두 등급(합 75/s)이 100%, 남은 용량을 sheddable 이 나눠 갖는다(약 34%). 처리량은 같고 **누가 실패하느냐**가 달라진다.

모의는 서비스 시간 고정(10ms), 단일 큐라는 단순화를 쓴다. 실제는 등급별 큐나 가중 스케줄링이 필요할 수 있다.

## 언제 쓰나

- 여러 종류의 트래픽(사용자 대화형, 배치, 내부 동기화)이 **같은 서비스를 공유**할 때. SRE 책은 공유 서비스에서 선택적 차단이 특히 중요하다고 말한다.
- 용량을 못 늘리는 짧은 급증이나 부분 장애 중에 핵심 기능을 유지해야 할 때.
- 하위 호출이 많은 팬아웃 구조에서 상위 요청의 중요도를 일관되게 보호해야 할 때.

## 주의 (비용)

- **등급 인플레이션.** 모든 팀이 자기 요청을 `CRITICAL` 로 표시하면 구분이 사라진다. 기본값을 보수적으로 두고, 등급 부여 기준과 승인 절차, 등급별 트래픽 비율 모니터링이 필요하다.
- **공급자 쪽 용량은 critical 합계를 감당해야 한다.** 책도 `CRITICAL` 이상의 용량은 항상 확보하라고 한다. critical 만으로 용량을 넘으면 등급 설계로 해결되지 않는다 → 증설이나 [동시성 제한](/develop-wiki/knowledge/performance/concurrency-limits-littles-law/).
- **차단 신호가 재시도로 돌아온다.** 거절된 sheddable 이 곧바로 재시도하면 부하를 되돌린다. 과부하 거절은 "재시도 말 것"을 명시하고 클라이언트는 [재시도 예산과 적응형 스로틀링](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/)을 쓴다.
- **임계 흔들림(flapping).** 임계 부근에서 거절과 수락이 번갈아 나오면 불안정하다. 점진적으로 거절 확률을 올리고 히스테리시스를 둔다.
- **우선순위 역전.** 낮은 등급 요청이 높은 등급 요청이 필요한 락·커넥션을 쥐고 있으면 높은 등급이 막힌다. 자원 격리와 함께 설계한다 → [벌크헤드](/develop-wiki/knowledge/performance/bulkhead/).
- **LIFO 의 부작용.** 오래된 요청이 영원히 처리되지 않을 수 있다. 데드라인이 있는 요청에만 적용한다.
- **그레이스풀 디그레이드와 구분한다.** 요청을 버리는 것이 아니라 응답 품질을 낮춰 요청당 비용을 줄이는 방법도 있다(cascading failures 장). 이 방법은 평소에 거의 안 쓰이는 경로라 정기적으로 실행해 검증하지 않으면 망가진다.
