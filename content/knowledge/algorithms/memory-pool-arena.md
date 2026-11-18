---
title: 메모리 풀과 아레나 할당기
aka: [Memory Pool, Arena Allocator, Region-based Memory, Bump Allocator, Linear Allocator, Free List, APR Pool, 리전 기반 메모리 관리]
category: algorithms
group: complexity
level: intermediate
summary: 객체를 하나씩 해제하지 않고, 수명이 같은 객체를 한 덩어리에서 포인터만 올려 할당하다가 통째로 반환하는 아레나와, 같은 크기 슬롯을 재활용하는 메모리 풀의 원리와 비용.
tags: [memory, allocator, arena, pool, bump-allocator, region, performance]
related: [design-patterns/object-pool, cs-fundamentals/garbage-collection, cs-fundamentals/virtual-memory, cs-fundamentals/cpu-cache-locality, algorithms/stack-queue-deque, algorithms/linked-list, algorithms/space-time-tradeoff]
sources:
  - https://docs.rs/bumpalo/latest/bumpalo/
  - https://apr.apache.org/docs/apr/1.7/group__apr__pools.html
  - https://www.cs.princeton.edu/research/techreps/719
updatedAt: 2026-11-19
---

## 문제

`malloc`/`new` 와 `free`/GC 는 범용이라서 비용이 있다. 객체마다 빈 공간을 찾고(할당), 개별로 해제하고(해제), 단편화와 포인터 추적이 생긴다. 그런데 많은 프로그램의 객체는 **같이 태어나서 같이 죽는다**. 요청 하나를 처리하며 만든 임시 객체들, 컴파일러가 한 파일을 분석하며 만든 트리 노드들이 그렇다. 이런 객체를 일일이 해제하는 일이 낭비이자 누수의 원인이다.

## 해법 1: 아레나 (범프 할당기)

큰 덩어리 하나와 **다음 빈 곳을 가리키는 포인터** 하나만 둔다.

- 할당: 남은 공간을 확인하고 포인터를 객체 크기(정렬 포함)만큼 올린다.
- 개별 해제: **없다.**
- 반환: 포인터를 처음으로 되돌리거나 덩어리를 통째로 반납한다. 한 번에 전부 해제된다.

Rust 의 `bumpalo` 문서가 이 방식의 장단을 요약한다. 할당은 경계 검사와 포인터 증가뿐이라 빠르고, 전체 해제도 포인터 리셋 하나로 빠르다. 반면 **개별 객체를 해제하거나 그 메모리를 되찾을 수 없다.** 함께 할당되고 함께 해제되는 객체에 적합하다.

```ts
// 바이트 버퍼 하나 위에서 포인터만 올리는 범프 할당기. 개별 해제는 없고 reset 으로 한 번에 비운다
class Arena {
  private buf: ArrayBuffer; private top = 0;
  constructor(size: number) { this.buf = new ArrayBuffer(size); }
  alloc(bytes: number, align = 8): number {            // 오프셋을 돌려준다
    const start = (this.top + align - 1) & ~(align - 1);
    if (start + bytes > this.buf.byteLength) throw new Error('arena full');
    this.top = start + bytes; return start;
  }
  f64(n: number): Float64Array { return new Float64Array(this.buf, this.alloc(n * 8, 8), n); }
  u8(n: number): Uint8Array { return new Uint8Array(this.buf, this.alloc(n, 1), n); }
  reset() { this.top = 0; }
  get used() { return this.top; }
}

const arena = new Arena(1 << 20);
for (let request = 0; request < 3; request++) {
  const flags = arena.u8(3);        // 3바이트
  const xs = arena.f64(100);        // 8바이트 정렬이라 오프셋 8 에서 시작 (패딩 5바이트)
  xs.fill(request); flags[0] = 1;
  console.log(`요청 ${request}: 사용 ${arena.used}B`);   // 808B = 3 + 패딩 5 + 800
  arena.reset();                    // 요청이 끝나면 전부 한 번에 반환
}
try { new Arena(16).f64(3); } catch (e) { console.log((e as Error).message); }   // arena full
```

실행하면 요청마다 808B 를 쓰고 `reset()` 후 같은 공간을 재사용하며, 용량을 넘기면 에러가 난다. (GC 언어의 TypedArray 예시는 원리 시연이다. 실제 이득은 `malloc` 을 쓰는 언어에서 크다.)

## 해법 2: 메모리 풀 (고정 크기 슬롯 재활용)

같은 크기의 객체를 자주 만들고 버리는 경우, 미리 큰 배열을 슬롯으로 나누고 **빈 슬롯 목록(free list)** 을 둔다. 할당은 목록 머리를 떼고, 해제는 목록 머리에 붙인다. 둘 다 O(1) 이고 단편화가 없다. 풀 용도는 [객체 풀 패턴](/develop-wiki/knowledge/design-patterns/object-pool/) 노트가 다룬다.

## 아레나와 풀의 차이

| | 아레나(범프) | 풀(free list) |
| --- | --- | --- |
| 객체 크기 | 제각각 | 같은 크기(보통) |
| 개별 해제 | 불가 | 가능 |
| 전체 해제 | 포인터 리셋 한 번 | 슬롯별 해제 또는 풀 폐기 |
| 수명 가정 | 모두 비슷한 시점에 죽음 | 각자 다르게 죽어도 됨 |
| 대표 용도 | 요청 단위 임시 객체, 파서·컴파일러 | 연결·노드·이벤트 객체 |

## 역사와 변형: 리전, APR 풀

Hanson 의 프린스턴 기술 보고서 TR-191-88(1988, 이후 1990년 *Software: Practice and Experience* 에 게재)은 같은 수명을 공유하는 객체를 큰 **아레나** 목록에서 할당하고 그 목록을 한 번에 해제하는 알고리즘을 설명한다. 초록에 따르면 바이트당 비용은 quick fit 의 절반에 가깝고 스택 할당의 두 배 미만이다. (이 노트는 초록만 확인했고 본문은 열람하지 못했다.) 같은 아이디어는 **리전(region) 기반 메모리 관리**라고도 부른다.

Apache Portable Runtime(APR)의 풀(`apr_pool_t`)은 실제 사례다.

- `apr_palloc` 은 풀에서 메모리를 잘라 주고, **개별 해제 호출은 없다.**
- `apr_pool_clear` 는 정리 콜백을 실행하고 하위 풀을 파괴하지만 메모리는 운영체제에 돌려주지 않고 **다음 할당에 재사용**한다. `apr_pool_destroy` 는 같은 일을 한 뒤 메모리를 해제한다.
- 풀은 부모-자식으로 겹쳐 쓴다(서브풀). 요청 풀 아래에 하위 작업 풀을 두는 식으로 수명 계층을 표현한다.

## 언제 쓰나

- **수명이 같은 객체 묶음**이 뚜렷할 때: 요청·트랜잭션 단위 임시 객체, 한 번 파싱하고 버리는 구문 트리, 게임 프레임 단위 임시 데이터.
- 할당 횟수가 많고 `malloc` 비용·단편화가 프로파일에서 보일 때 → [프로파일링](/develop-wiki/knowledge/performance/profiling/)으로 먼저 확인.
- 객체를 연속 메모리에 모아 [CPU 캐시 지역성](/develop-wiki/knowledge/cs-fundamentals/cpu-cache-locality/)을 얻고 싶을 때(일반 원리).

## 주의 (비용)

- **개별 해제가 없으므로 오래 사는 객체를 섞으면 메모리가 계속 쌓인다.** 아레나의 수명을 가장 오래 사는 객체에 맞춰야 하고, 수명이 다른 객체는 다른 아레나로 나눈다.
- **소멸자·정리 로직이 자동으로 돌지 않을 수 있다.** bumpalo 문서는 일괄 해제 시 할당된 객체의 `Drop` 이 호출되지 않는다고 명시하며, 필요하면 별도 `Box` 래퍼를 쓰라고 한다. 파일·소켓 같은 자원을 아레나 안 객체가 쥐고 있으면 누수가 된다. APR 은 이를 정리 콜백으로 푼다.
- 아레나 안의 **포인터를 아레나 밖으로 내보내면** reset 후 허상 포인터가 된다. 수명 규칙을 언어(Rust 의 수명)나 규약으로 강제해야 한다.
- 크기를 미리 알기 어렵다. 가득 차면 새 덩어리를 이어 붙이는 구현이 흔하지만 한 번에 큰 객체는 낭비가 된다.
- GC 언어에서는 이득이 작거나 없다. GC 가 쓰는 힙과 별개 구조를 만들면 오히려 복잡해진다. 먼저 [가비지 컬렉션](/develop-wiki/knowledge/cs-fundamentals/garbage-collection/) 비용이 실제 병목인지 측정한다.
