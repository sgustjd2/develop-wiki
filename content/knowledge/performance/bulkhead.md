---
title: 벌크헤드 패턴
aka: [Bulkhead, Bulkhead Isolation, Cell-based Architecture, Resource Partitioning, Semaphore Bulkhead, Thread Pool Bulkhead]
category: performance
level: intermediate
summary: 자원(스레드·커넥션·인스턴스·큐)을 칸막이처럼 나눠 한 의존성이나 한 소비자의 장애·과부하가 전체로 번지지 않게 하는 격리 패턴.
tags: [resilience, isolation, bulkhead, concurrency, microservices, multi-tenant]
related: [performance/timeout-retry-circuit-breaker, performance/backpressure-load-shedding, performance/connection-pool, performance/rate-limiting, cs-fundamentals/semaphore-condition-variable, engineering-practice/observability-basics]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead
  - https://resilience4j.readme.io/docs/bulkhead
updatedAt: 2026-11-18
---

이름은 선체를 여러 격실로 나눈 칸막이(bulkhead)에서 왔다. 한 칸에 물이 차도 배는 가라앉지 않는다.

## 문제

자원을 **공유**하면 장애도 공유된다.

- 주문 서비스가 결제·재고·추천 API 를 같은 HTTP 커넥션 풀(또는 같은 스레드 풀)로 호출한다.
- 추천 API 가 응답 없이 매달리면, 그 호출들이 풀을 점점 다 차지한다.
- 풀이 바닥나면 **멀쩡한 결제·재고 호출까지** 커넥션을 못 얻어 실패한다. 부가 기능 하나가 핵심 기능을 죽인 것.

반대 방향도 같다. 서비스 하나를 여러 고객(테넌트)이 쓰는데 한 고객이 요청을 쏟아내면 나머지 고객 모두가 느려진다.

타임아웃과 회로 차단기는 "느린 호출을 빨리 끊는" 장치지만, 끊기 전까지 쌓이는 동시 호출 수 자체에는 상한이 없다. 벌크헤드는 그 **상한을 의존성·소비자 단위로 따로** 둔다.

## 해법

나눌 대상과 단위를 정해 각 칸에 독립된 자원 한도를 준다.

| 어디서 | 무엇을 나누나 | 예 |
| --- | --- | --- |
| 호출하는 쪽(소비자) | 의존성별 동시 호출 수 | 의존 서비스마다 별도 커넥션 풀·세마포어·스레드 풀 |
| 호출받는 쪽(서비스) | 소비자 그룹별 인스턴스 | 중요 고객 전용 인스턴스 풀, 테넌트별 셀(cell) |
| 비동기 처리 | 작업 종류별 큐·워커 | 결제 큐와 메일 큐를 다른 워커 그룹이 처리 |
| 인프라 | CPU·메모리 | 컨테이너 리소스 limit, 프로세스 분리 |

호출 쪽 벌크헤드의 가장 단순한 형태는 **의존성별 세마포어**다.

```ts
class Bulkhead {
  private active = 0;
  constructor(private readonly name: string, private readonly maxConcurrent: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      // 기다리지 않고 즉시 거절 → 호출자는 폴백(캐시, 기본값)으로
      throw new BulkheadFullError(this.name);
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
    }
  }
}

const payment = new Bulkhead('payment', 50);
const recommend = new Bulkhead('recommend', 10); // 부가 기능은 작게

// 추천이 매달려도 최대 10개만 묶이고, 결제용 50개는 그대로 남는다
const items = await recommend.run(() => fetchRecommendations(userId, AbortSignal.timeout(300)))
  .catch(() => []);
```

라이브러리 구현은 대개 두 종류다(Resilience4j 기준).

- **세마포어 방식**: 호출 스레드에서 그대로 실행하고 동시 실행 수만 센다. 가볍다. 가득 차면 일정 시간 대기 또는 즉시 거절(`maxWaitDuration`, 기본 0).
- **고정 스레드 풀 방식**: 의존성마다 전용 스레드 풀 + 유한 큐. 호출 스레드와 완전히 분리되지만 스레드·큐 비용이 든다.

.NET 은 Polly, JVM 은 Resilience4j 가 소비자 쪽 벌크헤드를 제공한다. Node.js 처럼 단일 스레드 이벤트 루프에서는 스레드 풀 대신 위와 같은 동시 실행 카운터(또는 `p-limit` 류)와 **의존성별 HTTP Agent(소켓 풀) 분리**가 실질적인 벌크헤드다.

## 언제 쓰나

- 여러 의존성을 호출하는데 그중 일부가 불안정하거나 덜 중요할 때 (핵심 경로와 부가 경로 분리).
- 중요 소비자(유료 고객, 내부 결제 흐름)를 일반 소비자와 격리해야 할 때.
- 멀티 테넌트 서비스에서 "시끄러운 이웃(noisy neighbor)"이 다른 테넌트에 영향을 주면 안 될 때.
- 연쇄 장애를 이미 겪었고, 포스트모템에서 "공유 풀 고갈"이 원인으로 나왔을 때.

## 주의 (비용)

- **자원 효율이 떨어진다.** 나눈 칸은 서로 빌려 쓰지 못한다. 한 칸이 놀아도 다른 칸이 꽉 차면 거절한다. 여유 자원을 감당할 수 없는 환경이면 Microsoft 문서도 맞지 않을 수 있다고 한다.
- **칸 크기 정하기가 어렵다.** 너무 작으면 평상시에도 거절, 너무 크면 격리 효과가 없다. 의존성의 지연 × 목표 처리량(리틀의 법칙)으로 시작하고, 거절 수·사용률을 메트릭으로 보며 조정한다.
- **입도.** 테넌트마다 칸을 둘지, 여러 테넌트를 한 칸에 묶을지 정해야 한다. 칸이 많을수록 운영·모니터링 대상이 늘어난다.
- **혼자 쓰지 않는다.** 칸이 가득 찬 이유는 대개 느린 호출이다. [타임아웃·재시도·회로 차단기](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/)를 함께 걸어야 칸이 빨리 비워진다. 재시도가 같은 칸을 다시 채우는 점도 고려한다.
- **거절 이후를 설계한다.** `BulkheadFullError` 를 받았을 때의 폴백(캐시, 기본값, 기능 숨김) 없이 500 을 돌려주면 격리의 의미가 줄어든다.
- 플랫폼이 이미 주는 격리(API 게이트웨이 속도 제한, Kubernetes 리소스 limit, DB 리소스 그룹)를 애플리케이션 코드로 다시 만들지 않는다.
- 공유 자원이 **아래층**에 숨어 있으면 위층 격리가 무력하다. 칸을 나눠도 모두 같은 DB [커넥션 풀](/develop-wiki/knowledge/performance/connection-pool/)을 쓰면 DB 가 느려질 때 전부 같이 막힌다.

## 비교

| | 벌크헤드 | 회로 차단기 | 속도 제한 | 부하 차단(load shedding) |
| --- | --- | --- | --- | --- |
| 묻는 것 | 이 칸에 동시 몇 개까지? | 이 의존성이 지금 건강한가? | 이 소비자가 시간당 몇 번까지? | 지금 서버 전체가 감당 가능한가? |
| 단위 | 의존성·소비자별 동시성 | 의존성별 실패율 | 소비자별 요청 빈도 | 서버 전체 |
| 막는 것 | 장애의 **전파** | 실패하는 호출 **반복** | 한 소비자의 **독점** | 전체 **과부하** |

관련: [백프레셔·부하 차단](/develop-wiki/knowledge/performance/backpressure-load-shedding/), [속도 제한](/develop-wiki/knowledge/performance/rate-limiting/).
