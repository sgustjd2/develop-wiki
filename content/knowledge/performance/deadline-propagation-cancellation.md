---
title: 데드라인 전파와 취소 전파
aka: [Deadline Propagation, Cancellation Propagation, gRPC Deadline, grpc-timeout, AbortSignal, context.Context, DEADLINE_EXCEEDED, 요청 예산]
category: performance
level: intermediate
summary: 요청 전체의 마감 시각을 호출 체인 아래로 "남은 시간"으로 넘기고, 상위가 포기하면 하위 작업도 취소해 이미 소용없는 일에 자원을 쓰지 않게 하는 설계.
tags: [deadline, timeout, cancellation, grpc, sre, cascading-failure, abortsignal, resilience]
related: [performance/timeout-retry-circuit-breaker, performance/priority-load-shedding, performance/metastable-failures-retry-storm, performance/adaptive-throttling-retry-budget, performance/backpressure-load-shedding, performance/concurrency-limits-littles-law, performance/bulkhead]
sources:
  - https://grpc.io/docs/guides/deadlines/
  - https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
  - https://sre.google/sre-book/addressing-cascading-failures/
updatedAt: 2026-11-19
---

## 문제

호출 체인 A → B → C 에서 홉마다 자기 타임아웃만 갖고 있으면 두 가지가 샌다.

- **마감 초과 후의 일**: 사용자(또는 A)는 200 ms 에 포기했는데 B·C 는 각자 타임아웃(예: 500 ms)까지 계속 일한다. 그 결과는 아무도 받지 않는다.
- **타임아웃의 합**: A 가 10 s, B 가 같은 10 s 를 쓰면 B 는 A 가 이미 포기한 뒤에도 답을 기다린다. 부하가 높을수록 이런 "죽은 요청"이 큐와 스레드를 차지하고, 재시도까지 겹치면 [메타안정 장애](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/)로 이어진다.

## 해법

### 1. 데드라인은 "절대 시각"으로 정하고 하위에는 "남은 시간"을 준다

gRPC 문서의 정의는 이렇다. 데드라인은 클라이언트가 더는 기다리지 않을 **시각**이고, 타임아웃은 **기간**이다. 타임아웃에 호출 시작 시각을 더하면 데드라인이 된다. 기본값은 데드라인이 **없다**(사실상 무한 대기)이므로 클라이언트는 항상 명시해야 한다.

전파 시에는 시각을 그대로 넘기지 않는다. 서버 시계가 다를 수 있어서, gRPC 는 이미 소비한 시간을 뺀 **타임아웃**으로 바꿔 보낸다. 와이어 상으로는 `grpc-timeout` 헤더(정수 최대 8자리 + 단위 H/M/S/m/u/n)이고, 없으면 서버는 무한으로 본다. Java·Go 는 들어온 RPC 의 데드라인을 나가는 RPC 에 자동 전파하고, C++ 은 명시적으로 켜야 한다고 문서에 있다.

SRE 책의 예: A 가 30 초 데드라인을 잡고 7 초 쓴 뒤 B 를 부르면 B 에는 23 초, B 가 4 초 쓰고 C 를 부르면 19 초가 남는다. 요청 트리 전체가 같은 절대 마감을 공유한다.

### 2. 마감이 지나면 하위 작업을 취소한다

- gRPC 서버는 클라이언트 데드라인이 지나면 호출을 자동 취소(`CANCELLED`)한다. 그러나 **서버 애플리케이션이 자기가 띄운 작업을 멈출 책임**이 있다. 긴 작업은 주기적으로 취소 여부를 확인한다.
- 상위가 포기하거나 하위에서 치명 오류가 나면 취소를 트리 전체로 전파한다. 단순 데드라인 전파만 쓰면 이미 실패가 확정된 초기 RPC 가 타임아웃까지 자원을 쥔다(SRE 책).
- 단계가 여러 개인 서버는 **각 단계 시작 전에 남은 시간을 확인**하고, 부족하면 시작하지 않는다.

### 3. 코드 (TypeScript, `AbortSignal`)

```ts
// B: 앞단 작업 후 남은 시간으로 C 를 호출. 부모가 취소되면 같이 취소.
async function B(parent: AbortSignal, start: number, budgetMs: number) {
  await work(150, parent);
  const left = budgetMs - (performance.now() - start);
  if (left < 100) return;                  // C 가 최소 100ms 필요 → 시작하지 않음
  return C(AbortSignal.any([parent, AbortSignal.timeout(Math.ceil(left))]));
}
```

(`AbortSignal.timeout` 은 정수 밀리초만 받는다. 소수를 넘기면 예외가 나서 조용히 삼켜지기 쉽다 — 아래 실험 중 실제로 겪었다.)

## 직접 실행으로 확인

요청 200 ms 마감, B 앞단 150 ms, C 작업 100 ms 인 체인을 요청 200개로 실행(Node, 3회 반복해 비슷한 값).

| 방식 | C 가 쓴 시간(요청당) | 마감 이후에 쓴 시간(요청당) |
| --- | --- | --- |
| 전파·취소 없음 | 약 101 ms | 약 52 ms |
| 남은 시간 전파 + 취소 | 약 50 ms | 약 3 ms |
| 전파 + "최소 필요 시간 미만이면 시작 안 함" | 0 ms | 0 ms |

- 전파·취소만으로도 마감 이후 낭비는 사라지지만, C 는 50 ms 를 쓰고도 끝내지 못한다. **최소 필요 시간 검사**까지 넣어야 헛수고 자체가 없다.
- 이 수치는 슬립으로 만든 단일 프로세스 모사다. 실제 서비스의 효과는 부하·큐 길이에 달려 있다.

## 언제 쓰나

- 호출 깊이가 2단 이상인 모든 마이크로서비스 체인. 특히 fan-out 이 있는 곳.
- 과부하 시 큐에서 오래 기다린 요청을 **실행 전에 버릴** 때(마감 지난 요청은 처리하지 않는다 → [중요도 기반 로드 셰딩](/develop-wiki/knowledge/performance/priority-load-shedding/)).
- 재시도 정책과 함께: 재시도는 **남은 시간 안에서만** 한다.

## 주의 (비용)

- **취소는 협조적이다.** DB 쿼리, 외부 HTTP 호출, 스레드 풀 작업은 취소 신호를 받아도 계속 실행될 수 있다. 쿼리 취소(`statement_timeout`, 드라이버의 cancel)까지 연결해야 자원이 풀린다.
- **취소 후 부작용**: 쓰기 요청이 취소된 시점에 이미 반영됐을 수 있다. 데드라인 초과는 "실패"가 아니라 "모름"이라서 재시도에는 [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/)이 필요하다.
- 데드라인이 너무 짧으면 서버가 영원히 시간 안에 못 끝내는 요청을 받아 자원만 쓴다(gRPC 문서도 경고). 값은 지연 분포와 부하 테스트로 정한다 → [타임아웃·재시도](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/).
- 프록시·메시·게이트웨이가 헤더를 떼거나 기본 타임아웃으로 덮으면 전파가 끊긴다. 계층마다 값이 일관한지 점검한다.
- 취소 신호 처리가 복잡도를 늘리고, 취소 경로의 정리 코드(롤백, 락 해제)가 가장 버그가 많다(경험적 의견).

## 비교

| 개념 | 단위 | 어디서 정함 | 하위에 전달되나 |
| --- | --- | --- | --- |
| 홉별 타임아웃 | 기간 | 각 호출자 | 아니오 |
| 데드라인 전파 | 남은 기간(절대 시각에서 계산) | 요청 진입점 | 예 |
| 취소 전파 | 신호 | 상위 포기·오류 시 | 예(트리 전체) |
| [서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/) | 상태 | 호출자 측 의존성별 | 아니오 |

## 검증 범위

gRPC 공식 데드라인 가이드, gRPC HTTP/2 프로토콜 문서의 `grpc-timeout` 정의, SRE 책 cascading failures 장의 데드라인·취소 전파 절을 읽었다. 위 표는 Node 24 에서 직접 실행한 값이다. 각 언어 구현(Go `context`, Java `Context`)의 세부 동작은 읽지 않았다.
