---
title: 타임아웃·재시도·회로 차단기
aka: [Timeout, Retry, Exponential Backoff, Jitter, Circuit Breaker, Retry Budget, Retry Storm, Resilience Patterns]
category: performance
level: intermediate
summary: 원격 호출 실패에 대응하는 세 장치. 타임아웃 값 정하기, 지수 백오프와 지터, 재시도 증폭을 막는 예산, 계속 실패하는 의존성을 끊는 회로 차단기의 상태 전이.
tags: [resilience, retry, backoff, jitter, circuit-breaker, timeout, microservices]
related: [performance/backpressure-load-shedding, performance/rate-limiting, performance/connection-pool, performance/load-balancing, distributed-systems/idempotency, engineering-practice/observability-basics]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/retry
  - https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter
  - https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  - https://martinfowler.com/bliki/CircuitBreaker.html
updatedAt: 2026-11-18
---

## 문제

원격 호출은 실패한다. 실패의 모양이 둘이다.

- **일시적 실패**: 패킷 유실, 연결 재설정, 잠깐의 과부하. 다시 하면 된다.
- **지속적 실패**: 의존 서비스 다운, DB 포화. 다시 해 봐야 안 되고, 오히려 회복을 방해한다.

그리고 가장 나쁜 실패는 **느린 실패**다. 응답이 안 오는 호출이 스레드·커넥션·메모리를 쥔 채 쌓이면, 무관한 기능까지 같은 자원 부족으로 함께 죽는다(연쇄 장애).

## 1. 타임아웃: 모든 원격 호출에

- 연결 타임아웃과 요청(읽기) 타임아웃을 **둘 다** 건다. 기본값이 "무한"인 클라이언트가 많다.
- 값 정하기(AWS 권장 방식): 허용할 **오탐 비율**을 정하고(예: 0.1%), 의존 서비스 지연의 해당 백분위수(p99.9)를 기준으로 삼는다. 망 지연·TLS 핸드셰이크 포함 여부를 고려해 여유를 둔다.
- **데드라인 전파**: 사용자 요청 전체에 남은 시간을 하위 호출에 넘긴다(gRPC deadline, `AbortSignal`). 상위가 이미 포기한 요청을 하위가 계속 처리하지 않게.

```ts
const res = await fetch(url, { signal: AbortSignal.timeout(800) }); // 800ms 후 중단
```

## 2. 재시도: 지수 백오프 + 지터

같은 간격으로 즉시 재시도하면 실패한 클라이언트들이 **같은 순간에 다시 몰린다.** 대기 시간을 지수적으로 늘리고, 무작위성(지터)으로 흩는다.

```ts
// Full Jitter: sleep = random(0, min(cap, base * 2^attempt))
async function withRetry<T>(fn: (signal: AbortSignal) => Promise<T>, max = 3) {
  const base = 100, cap = 5_000;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(AbortSignal.timeout(800));
    } catch (e) {
      if (attempt >= max || !isRetryable(e)) throw e;
      const backoff = Math.min(cap, base * 2 ** attempt);
      await sleep(Math.random() * backoff);
    }
  }
}
// isRetryable: 연결 오류, 타임아웃, 429/503(+Retry-After 존중), 502/504
// 재시도 금지: 400/401/403/404/409/422 등 다시 해도 같은 결과인 오류
```

AWS 실험에서 지터 없는 지수 백오프가 가장 나빴고, Full Jitter 와 Decorrelated Jitter(`sleep = min(cap, random(base, prev*3))`)가 서버 부하를 크게 줄였다. Equal Jitter(절반은 고정, 절반은 무작위)는 그보다 조금 못했다.

### 재시도의 규칙

- **멱등한 작업만** 재시도한다. 결제·생성은 멱등 키가 있어야 안전하다. [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) 참고.
- **한 계층에서만** 재시도한다. 5계층이 각각 3회 재시도하면 맨 아래 DB 는 3^5 = 243배 부하를 받는다(AWS 예).
- **재시도 예산**: 토큰 버킷으로 "재시도는 정상 요청의 10%까지" 같은 상한을 둔다. 장애 시 재시도가 부하를 몇 배로 키우는 재시도 폭풍을 막는다. AWS SDK 가 이 방식을 쓴다.
- 서버가 `Retry-After` 를 주면 그 이상 기다린다.

## 3. 회로 차단기

지속적 실패에는 재시도가 아니라 **빨리 실패**가 필요하다. 회로 차단기는 호출을 감싸는 프록시로, 최근 실패를 세다가 문턱을 넘으면 호출 자체를 막는다(Nygard 의 *Release It!* 에서 널리 알려졌다).

```
          실패율/횟수가 문턱 초과
  CLOSED ─────────────────────────▶ OPEN ── 모든 호출 즉시 실패(또는 대체 응답)
    ▲                                 │
    │ 시험 호출 성공(정해진 횟수)       │ 대기 시간 경과
    │                                 ▼
    └──────────────────────────── HALF-OPEN ── 제한된 수의 시험 호출만 통과
                                      │ 하나라도 실패
                                      └──────▶ OPEN (타이머 재시작)
```

```ts
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0; private openedAt = 0;
  constructor(private threshold = 5, private coolDownMs = 10_000) {}

  async call<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt < this.coolDownMs) return fallback();
      this.state = 'half-open';
    }
    try {
      const r = await fn();
      this.state = 'closed'; this.failures = 0;
      return r;
    } catch (e) {
      if (this.state === 'half-open' || ++this.failures >= this.threshold) {
        this.state = 'open'; this.openedAt = Date.now();
      }
      throw e;
    }
  }
}
```

실제 구현(resilience4j, Polly, opossum 등)은 **시간 창 안의 실패율**과 최소 호출 수를 기준으로 열고, half-open 에서 동시 시험 호출 수를 제한한다. 위 예시는 원리만 보인다.

- 열린 동안의 대응: 캐시된 값, 기본값, 기능 축소(추천 영역 숨기기), 사용자에게 "잠시 후 다시". 
- 상태 전이를 이벤트·메트릭으로 내보내 경보에 쓴다.

## 셋을 함께 놓는 순서

```
요청 ─▶ [재시도(예산 있음)] ─▶ [회로 차단기] ─▶ [타임아웃] ─▶ 원격 호출
```

재시도는 회로 차단기의 "열림" 예외를 **재시도하지 않아야** 한다(Azure 패턴 문서). 동시 호출 수 제한(벌크헤드)을 더하면 한 의존성이 모든 스레드·커넥션을 먹는 것을 막는다.

## 언제 쓰나

- 타임아웃: **모든** 네트워크 호출. 예외 없음.
- 재시도: 일시적 오류가 흔하고 작업이 멱등한 호출(조회, 멱등 키가 있는 쓰기).
- 회로 차단기: 핵심 경로가 의존하는 원격 서비스, 느려지면 자원을 묶어 버리는 의존성, 대체 응답이 가능한 기능.

## 주의 (비용)

- **회로 차단기가 맞지 않는 곳**: 메모리 내 자원 접근, 메시지 기반 처리(실패 메시지는 DLQ 로 보내고 나중에 처리하는 편이 낫다), 서비스 메시·로드 밸런서가 이미 같은 일을 하는 경우. 비즈니스 예외 처리 대용으로 쓰지 않는다.
- 차단기 하나를 여러 독립 대상(샤드, 리전, 테넌트)에 공유하면, 일부 장애로 정상 대상까지 막힌다. 대상별로 나눈다.
- 문턱·대기 시간을 잘못 잡으면 회복 후에도 오래 막히거나, 열림-닫힘을 반복(flapping)한다. 운영자가 강제로 열고 닫을 수 있게 한다.
- 인스턴스마다 차단기가 따로 있으면 상태가 제각각이다. 대부분은 그래도 괜찮지만, 인스턴스가 아주 많으면 half-open 시험 호출이 모여 회복 중인 서비스를 다시 누른다.
- 타임아웃이 너무 길면 차단기가 열리기 전에 이미 자원이 고갈된다. 타임아웃이 먼저 짧아야 차단기도 의미가 있다.
- 사용자 대면 요청에서 백오프를 길게 기다리면 결국 사용자 쪽 타임아웃이 먼저 난다. 남은 데드라인 안에서만 재시도한다.
- 과부하 자체를 다루는 것은 [백프레셔·로드 셰딩](/develop-wiki/knowledge/performance/backpressure-load-shedding/)과 [레이트 리밋](/develop-wiki/knowledge/performance/rate-limiting/)이다. 이 노트의 장치들은 **호출하는 쪽**의 방어다.
