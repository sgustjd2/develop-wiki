---
title: 객체 풀 패턴
aka: [Object Pool Pattern, Resource Pool, Free List, 오브젝트 풀링]
category: design-patterns
group: creational
level: intermediate
summary: 만들기 비싸거나 자주 생성·폐기되는 객체를 미리 만들어 두고 빌려 쓴 뒤 돌려받아 재사용하는 생성 패턴. 커넥션·스레드 풀이 대표 예이고, 메모리만 쥔 작은 객체에는 오히려 손해일 수 있다.
tags: [creational, performance, memory, pooling, resource-management, gc]
related: [performance/connection-pool, design-patterns/flyweight, design-patterns/singleton, design-patterns/factory-method, design-patterns/prototype, cs-fundamentals/garbage-collection, algorithms/stack-queue-deque]
sources:
  - https://en.wikipedia.org/wiki/Object_pool_pattern
  - https://gameprogrammingpatterns.com/object-pool.html
  - https://learn.microsoft.com/en-us/dotnet/standard/collections/thread-safe/how-to-create-an-object-pool
updatedAt: 2026-11-18
---

> GoF 23 패턴에는 없다. 생성 패턴과 같은 질문("객체를 어떻게 얻는가")에 답하므로 생성 그룹에 둔다.

## 문제

- DB 연결 하나를 맺는 데 TCP·TLS 핸드셰이크와 인증으로 수 ms 가 든다. 요청마다 새로 맺고 끊으면 응답 시간 대부분이 연결 비용이다.
- 게임에서 폭발 한 번에 파티클 수백 개가 생기고 1초 뒤 사라진다. 매 프레임 할당·해제를 반복하면 힙이 잘게 쪼개지고(단편화), GC 언어라면 GC 정지가 프레임을 끊는다.

공통점은 **같은 종류의 객체를 짧게 쓰고 버리는 일이 매우 잦고, 생성 비용이 사용 비용보다 크다**는 점이다.

## 해법

- 풀이 객체를 미리(또는 처음 요청 때) 만들어 **유휴 목록**에 둔다.
- 클라이언트는 `acquire()` 로 빌리고, 다 쓰면 `release()` 로 돌려준다. 생성은 유휴 목록이 비었을 때만 한다.
- 돌려받을 때 **상태를 초기화하는 책임은 풀**에 둔다. 클라이언트가 깜빡해도 다음 사용자가 이전 상태를 보지 않게 한다.
- 풀이 비었을 때의 정책을 정해야 한다: 실패(예외) / 새로 만들기(상한까지) / 반납될 때까지 대기 / 덜 중요한 객체를 회수.

```ts
class Pool<T> {
  private free: T[] = [];
  private created = 0;
  constructor(
    private readonly create: () => T,
    private readonly reset: (obj: T) => void, // 반납 시 상태를 지운다 (풀의 책임)
    private readonly max: number,
  ) {}

  acquire(): T {
    const obj = this.free.pop();
    if (obj !== undefined) return obj;
    if (this.created >= this.max) throw new Error('pool exhausted'); // 정책: 실패 / 대기 / 확장 중 선택
    this.created++;
    return this.create();
  }

  release(obj: T): void { this.reset(obj); this.free.push(obj); }

  // acquire/release 짝을 강제한다. 반납 누락(누수)을 막는 가장 쉬운 방법
  async use<R>(fn: (obj: T) => Promise<R> | R): Promise<R> {
    const obj = this.acquire();
    try { return await fn(obj); } finally { this.release(obj); }
  }
}

interface Particle { x: number; y: number; vx: number; vy: number; alive: boolean }
const particles = new Pool<Particle>(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, alive: false }),
  (p) => { p.x = p.y = p.vx = p.vy = 0; p.alive = false; },
  1000,
);
// 100 프레임 × 50개를 빌리고 반납하면: 5,000번 사용, 실제 생성은 50개
```

유휴 목록은 [스택](/develop-wiki/knowledge/algorithms/stack-queue-deque/)(LIFO)이 보통이다. 방금 반납된 객체가 CPU 캐시에 남아 있을 가능성이 높다. Game Programming Patterns 는 고정 크기 배열 안에 "다음 빈 칸" 포인터를 엮는 **free list** 로 추가 메모리 없이 O(1) 할당·반납을 구현하는 방법을 소개한다.

## 언제 쓰나

- 생성·파괴 비용이 큰 **외부 자원**을 감싼 객체: DB·HTTP 커넥션, 스레드, 소켓, GPU 버퍼 → [커넥션 풀](/develop-wiki/knowledge/performance/connection-pool/).
- 같은 크기의 객체가 **매우 자주** 생기고 사라지며, 프로파일러로 할당·GC 비용이 병목임을 확인한 경우(게임 파티클, 네트워크 버퍼, 대용량 배열).
- 동시에 쓸 수 있는 자원 수 자체를 **제한**하고 싶은 경우(외부 API 동시 연결 수 상한).

## 주의

- **GC 언어에서 메모리만 쥔 작은 객체는 풀링하지 않는다.** Wikipedia 는 Java 처럼 할당이 빠른 언어에서는 쓰지 않는 객체를 오래 살려 두는 것이 오히려 GC 시간을 늘릴 수 있다고 지적한다. 세대별 GC 는 짧게 사는 객체를 싸게 치운다 → [가비지 컬렉션](/develop-wiki/knowledge/cs-fundamentals/garbage-collection/).
- **상태 누수**: 초기화를 빠뜨리면 다음 사용자가 이전 값을 본다. 결제 정보 같은 민감 데이터가 다른 요청으로 새는 보안 문제가 될 수 있다. 오염된 객체가 쌓인 풀은 그 자체로 안티패턴으로 불린다.
- **반납 누락 = 누수**: 예외 경로에서 `release` 를 못 하면 풀이 서서히 말라 결국 모두가 대기한다. `try/finally`, `using`, 위 예시의 `use()` 같은 스코프 헬퍼로 짝을 강제한다.
- **반납 후 사용(use-after-release)**: 반납한 참조를 계속 쓰면 다른 사용자가 빌린 객체를 건드린다. 디버그 빌드에서 반납 시 필드를 이상한 값으로 채워 두면 빨리 드러난다.
- **크기 튜닝**: 너무 작으면 대기·실패, 너무 크면 유휴 자원 낭비. 커넥션 풀은 크다고 빨라지지 않는다.
- **동시성**: 여러 스레드가 공유하면 유휴 목록에 동기화가 필요하다. 락 경합이 새 병목이 될 수 있어 스레드 로컬 캐시를 두는 구현이 많다.
- 객체 크기가 제각각이면 가장 큰 크기에 슬롯을 맞추게 돼 낭비가 커진다. 크기별로 풀을 나눈다.

## 실무에서

- **DB 커넥션 풀**: HikariCP, PgBouncer, 각 언어 드라이버의 풀. 크기 산정이 핵심이다.
- **스레드 풀**: Java `ExecutorService`, .NET `ThreadPool`. 스레드 생성 비용과 동시 실행 수를 함께 관리한다.
- **.NET**: Microsoft 문서는 `ConcurrentBag<T>` 로 직접 풀을 만드는 예를 보여 주면서도, 기능이 더 많은 `Microsoft.Extensions.ObjectPool.ObjectPool<T>` 를 먼저 쓰라고 권한다.
- **게임 엔진**: 파티클·탄환·사운드 채널. 풀이 가득 차면 새 효과를 그냥 버리거나, 가장 조용한 사운드를 끊고 새 것을 재생하는 식의 회수 정책을 쓴다.
- **바이트 버퍼**: 네트워크 서버가 요청마다 큰 버퍼를 할당하지 않도록 버퍼를 재사용한다(Go `sync.Pool`, .NET `ArrayPool<T>`, Netty 의 풀링 할당기 등).

## 비교

| | 객체 풀 | [플라이웨이트](/develop-wiki/knowledge/design-patterns/flyweight/) | [싱글턴](/develop-wiki/knowledge/design-patterns/singleton/) | [프로토타입](/develop-wiki/knowledge/design-patterns/prototype/) |
| --- | --- | --- | --- | --- |
| 재사용 방식 | **배타적** 대여: 한 번에 한 사용자 | **동시** 공유: 여러 사용자가 같은 객체 | 전역에 하나를 모두 공유 | 원본을 복제해 새로 만듦 |
| 상태 | 가변, 반납 시 초기화 | 불변(내재 상태) | 가변일 수 있음 | 복제본은 독립 |
| 목적 | 생성 비용·자원 수 제한 | 메모리 중복 제거 | 유일성 | 생성 절차 단순화 |

- 풀 자체는 보통 [팩토리 메서드](/develop-wiki/knowledge/design-patterns/factory-method/)(`create` 콜백)로 새 객체를 만든다.
- 풀 객체를 전역 싱글턴으로 두는 일이 흔하지만, 테스트를 위해 의존성 주입으로 넘기는 편이 낫다 → [서비스 로케이터 vs 의존성 주입](/develop-wiki/knowledge/design-patterns/service-locator-vs-dependency-injection/).
