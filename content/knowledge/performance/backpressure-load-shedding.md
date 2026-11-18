---
title: 백프레셔와 부하 차단
aka: [Backpressure, Load Shedding, Retry Budget, Bounded Queue, Graceful Degradation, 배압, 과부하 처리]
category: performance
level: advanced
summary: 처리 능력보다 많은 요청이 들어올 때 무한정 쌓지 않고, 생산자에게 속도를 늦추라고 알리거나(백프레셔) 덜 중요한 요청부터 버려서(부하 차단) 시스템을 살리는 방법.
tags: [backpressure, load-shedding, overload, retry, queue, sre, reactive-streams]
related: [performance/rate-limiting, performance/load-balancing, performance/connection-pool, architecture/event-driven, distributed-systems/idempotency]
sources:
  - https://sre.google/sre-book/handling-overload/
  - https://www.reactive-streams.org/
  - https://stripe.com/blog/rate-limiters
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern
updatedAt: 2026-11-18
---

## 문제

과부하에서 시스템이 무너지는 전형적인 경로:

1. 처리 속도보다 유입이 빠르다 → 큐·스레드·메모리가 쌓인다.
2. 대기 시간이 클라이언트 타임아웃을 넘는다 → 서버는 **이미 버려진 요청**을 계속 처리한다.
3. 클라이언트가 재시도한다 → 유입이 더 늘어난다.
4. 메모리 부족·GC 폭주로 처리량이 오히려 떨어지고, 복구돼도 밀린 재시도 때문에 다시 넘어간다.

핵심: **무한한 버퍼는 지연을 늘릴 뿐 처리량을 늘리지 않는다.**

## 해법 1: 백프레셔 — 소비자가 속도를 정한다

생산자가 밀어 넣는 대신, 소비자가 감당할 만큼만 **요청(pull)** 한다.

- Reactive Streams 는 비동기 경계에서 **비차단 백프레셔**를 표준화했다. 구독자가 "n개 더 줘"라고 수요를 알리고, 발행자는 그 이상 보내지 않는다. JDK 9 의 `java.util.concurrent.Flow` 가 같은 인터페이스다.
- Node.js 스트림의 `write()` 반환값·`drain` 이벤트, TCP 흐름 제어, 크기 제한 큐가 모두 같은 원리다.

```ts
// 크기 제한 큐: 가득 차면 생산자가 기다린다 (또는 즉시 거절)
async function pipe(src: AsyncIterable<Job>, worker: (j: Job) => Promise<void>, concurrency = 8) {
  const running = new Set<Promise<void>>();
  for await (const job of src) {               // 소비 속도만큼만 꺼낸다
    const p = worker(job).finally(() => running.delete(p));
    running.add(p);
    if (running.size >= concurrency) await Promise.race(running);
  }
  await Promise.all(running);
}
```

동기 HTTP 처럼 생산자를 기다리게 할 수 없는 경로에서는 **빨리 거절하는 것**이 백프레셔 신호다(429/503 + `Retry-After`).

## 해법 2: 부하 차단 — 덜 중요한 것부터 버린다

- **용량을 요청 수가 아닌 자원(CPU 등)으로 잰다.** 요청마다 비용이 달라 QPS 는 움직이는 표적이다(SRE 책).
- **중요도 등급**: Google 은 `CRITICAL_PLUS`, `CRITICAL`, `SHEDDABLE_PLUS`, `SHEDDABLE` 4단계를 두고 과부하 때 낮은 등급부터 거절하며, 등급을 하위 호출로 전파한다.
- Stripe 는 핵심 메서드(결제 생성)용 용량을 예약하고, 최후 방어선으로 워커 사용률이 높으면 테스트 모드 트래픽부터 서서히 버린다.
- **큐 대기 시간 기반 차단**: 큐에서 너무 오래 기다린 요청은 처리하지 않고 버린다(어차피 클라이언트는 떠났다). 데드라인을 요청과 함께 전파한다.

## 해법 3: 재시도를 통제한다

| 규칙 | 내용 (SRE 책) |
| --- | --- |
| 요청당 상한 | 최대 3회 시도 후 호출자에게 실패 반환 |
| 클라이언트 재시도 예산 | 재시도가 전체 요청의 10% 미만일 때만 재시도 → 최악에도 부하 약 1.1배 |
| 한 층에서만 재시도 | 여러 층이 각각 3번씩 재시도하면 3×3×3 으로 증폭 |
| 지수 백오프 + 지터 | 동시에 몰려 재시도하지 않게 |

재시도 가능한 요청은 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)해야 한다.

## 언제 쓰나

- 큐·스트림 파이프라인(생산 속도 ≠ 소비 속도), 배치 수집.
- 트래픽 급증이 예상되는 공개 서비스, 다른 서비스에 팬아웃하는 게이트웨이.

## 주의 (비용)

- 버리는 요청을 고르는 기준(중요도)을 미리 정해 두지 않으면, 과부하 때는 무작위로 실패한다.
- 차단 임계값이 너무 민감하면 흔들림(flapping)이 생긴다. 점진적으로 차단하고 히스테리시스를 둔다.
- 큐를 크게 잡는 것은 백프레셔가 아니다. 지연을 숨겼다가 한꺼번에 터뜨린다. 큐 크기와 대기 시간 상한을 둘 다 둔다.
- 비동기 메시지 큐는 유입을 흡수해 주지만, 소비자 지연(lag)을 모니터링하지 않으면 문제가 몇 시간 뒤에 드러난다.
- 서킷 브레이커·타임아웃·[레이트 리미팅](/develop-wiki/knowledge/performance/rate-limiting/)과 함께 설계해야 한다. 하나만으로는 연쇄 장애를 못 막는다.
