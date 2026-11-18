---
title: LSM 트리
aka: [Log-Structured Merge-Tree, LSM-tree, Memtable, SSTable, Compaction, 컴팩션]
category: algorithms
group: data-structure
level: advanced
summary: 쓰기를 메모리에 모았다가 정렬된 불변 파일로 한꺼번에 내리고, 백그라운드 병합(컴팩션)으로 정리하는 저장 구조. 무작위 쓰기를 순차 쓰기로 바꿔 쓰기 처리량을 높이는 대신 읽기·공간 비용을 낸다.
tags: [lsm-tree, storage, database, compaction, write-amplification]
related: [algorithms/b-tree, algorithms/bloom-filter, algorithms/skip-list, algorithms/space-time-tradeoff, algorithms/binary-search, data-modeling/index-design, data-modeling/sharding-partitioning]
sources:
  - https://en.wikipedia.org/wiki/Log-structured_merge-tree
  - https://github.com/facebook/rocksdb/wiki/RocksDB-Overview
  - https://github.com/facebook/rocksdb/wiki/Leveled-Compaction
  - https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/overview.html
updatedAt: 2026-11-18
---

## 문제

[B-트리](/develop-wiki/knowledge/algorithms/b-tree/)는 키 하나를 바꿔도 그 키가 있는 페이지를 **제자리에서** 다시 쓴다. 키가 무작위로 들어오면 디스크 곳곳의 페이지를 건드리는 무작위 쓰기가 된다. 로그·이벤트·시계열·메시지처럼 **쓰기가 압도적인** 워크로드에서는 이 무작위 I/O 가 병목이다. 디스크와 SSD 모두 순차 쓰기가 훨씬 싸다.

## 해법

Patrick O'Neil 등이 1996년 Acta Informatica 에 발표했다. 핵심은 **제자리 수정을 하지 않는 것**이다.

1. **WAL**: 쓰기를 먼저 로그 파일 끝에 순차로 덧붙인다(장애 복구용).
2. **Memtable**: 같은 쓰기를 메모리의 정렬 구조(보통 [스킵 리스트](/develop-wiki/knowledge/algorithms/skip-list/))에 넣는다. 여기까지가 쓰기 경로의 전부라 빠르다.
3. **Flush**: memtable 이 차면 불변으로 바꾸고, 정렬된 순서 그대로 디스크에 **SSTable**(Sorted String Table) 파일 하나로 내린다. 순차 쓰기다.
4. **읽기**: memtable → 최신 SSTable → 오래된 SSTable 순으로 찾고, **처음 찾은 값이 정답**이다. 파일마다 [블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/)를 두어 키가 없는 파일은 디스크를 읽지 않고 건너뛴다.
5. **삭제**: 지울 수 없으니(파일이 불변) **툼스톤**(삭제 표시)을 새로 쓴다.
6. **컴팩션**: 백그라운드에서 SSTable 여러 개를 병합 정렬해, 키마다 최신 값만 남기고 덮어써진 값과 (조건이 맞으면) 툼스톤을 버린 새 파일을 만든다.

```text
쓰기 → [WAL append] → [memtable (정렬)] ──flush──→ L0: SST SST SST (범위 겹침 가능)
                                                       │ compaction
                                                  L1: [a─f][g─m][n─z]   (한 정렬 런)
                                                       │
                                                  L2: 10배 더 큼 ...
```

### 장난감 구현

```ts
const TOMBSTONE = Symbol('tombstone');
type Val = string | typeof TOMBSTONE;
interface SSTable { keys: string[]; vals: Val[]; min: string; max: string }

function lowerBound(a: readonly string[], x: string): number {
  let lo = 0, hi = a.length;
  while (lo < hi) { const m = (lo + hi) >>> 1; if (a[m] < x) lo = m + 1; else hi = m; }
  return lo;
}

class TinyLSM {
  private mem = new Map<string, Val>(); // 실제 엔진은 스킵 리스트 같은 정렬 구조
  private tables: SSTable[] = [];       // 0번이 가장 최신. 한 번 쓰면 바꾸지 않는다
  constructor(private memLimit = 4) {}

  put(k: string, v: string) { this.write(k, v); }
  delete(k: string) { this.write(k, TOMBSTONE); } // 지우지 않고 "삭제 표시"를 쓴다

  private write(k: string, v: Val) {
    this.mem.set(k, v); // 실제 엔진은 그 전에 WAL 에 순차 append
    if (this.mem.size >= this.memLimit) this.flush();
  }

  private flush() {
    if (this.mem.size === 0) return;
    const keys = [...this.mem.keys()].sort();
    const vals = keys.map((k) => this.mem.get(k) as Val);
    this.tables.unshift({ keys, vals, min: keys[0], max: keys[keys.length - 1] });
    this.mem.clear();
  }

  get(k: string): string | undefined {
    const v = this.mem.has(k) ? this.mem.get(k) : this.searchTables(k);
    return v === TOMBSTONE ? undefined : v;
  }

  private searchTables(k: string): Val | undefined {
    for (const t of this.tables) {          // 최신 → 과거 순. 처음 찾은 값이 정답
      if (k < t.min || k > t.max) continue; // 실제 엔진은 여기서 블룸 필터도 확인
      const i = lowerBound(t.keys, k);
      if (t.keys[i] === k) return t.vals[i];
    }
    return undefined;
  }

  // 전체 병합: 키마다 최신 값만 남기고, 맨 아래로 내려가는 병합이므로 툼스톤도 버린다
  compact() {
    this.flush();
    const merged = new Map<string, Val>();
    for (const t of [...this.tables].reverse()) t.keys.forEach((k, i) => merged.set(k, t.vals[i]));
    for (const [k, v] of merged) if (v === TOMBSTONE) merged.delete(k);
    this.tables = [];
    this.mem = merged;
    this.flush();
  }

  get tableCount() { return this.tables.length; }
}

const db = new TinyLSM(2);
db.put('a', '1'); db.put('b', '2'); // flush → 테이블 1
db.put('a', '3'); db.delete('b');   // flush → 테이블 2 (a 갱신, b 툼스톤)
console.log(db.get('a'), db.get('b'), db.tableCount); // 3 undefined 2
db.compact();
console.log(db.get('a'), db.get('b'), db.tableCount); // 3 undefined 1
```

툼스톤은 **더 오래된 파일에 같은 키가 남아 있지 않을 때만** 버릴 수 있다. 일부 파일만 병합하면서 툼스톤을 버리면 지운 값이 되살아난다. 위 예는 전체를 병합하므로 안전하다.

## 세 가지 증폭

LSM 튜닝은 세 비용 사이의 줄다리기다. 하나를 줄이면 다른 것이 는다.

| 증폭 | 뜻 | LSM 에서 생기는 이유 |
| --- | --- | --- |
| 쓰기 증폭 | 사용자 1바이트 쓰기당 디스크에 실제로 쓰는 바이트 | 같은 데이터가 컴팩션으로 여러 번 다시 쓰임 |
| 읽기 증폭 | 조회 1회당 읽는 파일·블록 수 | 키가 여러 레벨·파일에 흩어져 있음 |
| 공간 증폭 | 실제 데이터 대비 디스크 사용량 | 덮어쓴 옛 값·툼스톤이 컴팩션 전까지 남음 |

### 컴팩션 전략

| | 레벨드(leveled) | 티어드/사이즈 티어드(tiered, size-tiered) |
| --- | --- | --- |
| 구조 | 레벨마다 **정렬 런 하나**, 레벨 크기는 배수(보통 10배)로 증가 | 비슷한 크기 파일이 여러 개 모이면 한꺼번에 병합 |
| 쓰기 증폭 | 높음 | 낮음 |
| 읽기 증폭 | 낮음(레벨당 파일 하나만 보면 됨) | 높음(같은 레벨에 여러 런) |
| 공간 증폭 | 낮음 | 높음(병합 중 임시 공간, 중복 값) |
| 맞는 곳 | 읽기 많음, 갱신·삭제 많음 | 쓰기 위주, 덮어쓰기 적음 |

- RocksDB 위키는 레벨드 컴팩션의 쓰기 증폭이 **흔히 10 을 넘는다**고 적는다. 동적 레벨 크기(`level_compaction_dynamic_level_bytes`, 8.4 부터 기본)에서는 데이터의 약 90%가 마지막 레벨, 약 9%가 그 위 레벨에 있게 된다.
- RocksDB 의 universal 컴팩션은 레벨드보다 쓰기 증폭이 낮은 대신 공간·읽기 증폭이 높다. FIFO 컴팩션은 가장 오래된 파일을 통째로 지우는 방식으로 캐시성 데이터에 쓴다.

## 복잡도 (T = 레벨 크기 배수, L = 레벨 수 ≈ log_T(N/메모리), B = 페이지당 항목 수)

| 연산 | 비용 |
| --- | --- |
| 쓰기 | 메모리 삽입 O(log n) + 상각 디스크 I/O 약 O(T·L/B) (레벨드) |
| 점 조회 | 최악 O(L) 파일. 블룸 필터가 있으면 없는 키는 거의 0회, 있는 키는 대개 1회 디스크 읽기 |
| 범위 조회 | 모든 레벨의 런을 병합하며 읽어야 함 → 점 조회보다 상대적으로 비쌈 |

## 언제 쓰나

- 쓰기 비율이 높은 저장소: 로그·이벤트 수집, 시계열, 메시징, 메트릭, 키-값 캐시의 영속 계층.
- SSD 수명(쓰기 횟수)과 순차 쓰기 대역폭을 잘 쓰고 싶을 때. 데이터를 압축 블록으로 저장하므로 공간 효율도 좋다.
- 데이터가 크게 늘어 쓰기 지연이 B-트리 페이지 분할과 무작위 I/O 에 묶일 때.

## 주의

- **컴팩션은 공짜가 아니다.** 백그라운드에서 CPU·디스크 대역폭을 쓴다. 쓰기 속도가 컴팩션 처리량을 넘으면 L0 파일이 쌓이고, 엔진이 쓰기를 늦추거나(stall) 읽기 지연이 튄다. 지연 꼬리(p99)를 꼭 측정한다.
- **툼스톤 문제**: 삭제가 많은 워크로드는 툼스톤을 수없이 건너뛰며 읽어야 해 느려진다. 큐처럼 넣고 지우기를 반복하는 패턴은 LSM 과 상극이다.
- 범위 스캔과 "없는 키" 조회가 많은 워크로드는 B-트리보다 불리할 수 있다(블룸 필터는 범위 질의에 잘 안 맞는다).
- 튜닝 손잡이가 많다(memtable 크기, 레벨 배수, L0 트리거, 블룸 비트 수, 압축). 기본값을 믿되 워크로드로 벤치마크한다.

## B-트리와 비교

| | B-트리 (제자리 갱신) | LSM 트리 (덧붙이기 + 병합) |
| --- | --- | --- |
| 쓰기 경로 | 페이지 찾아 수정 → 무작위 I/O | 로그 + 메모리 → 순차 I/O |
| 쓰기 처리량 | 보통 | 높음 |
| 점 조회 | 예측 가능, 페이지 몇 개 | 여러 파일 확인(블룸 필터로 완화) |
| 범위 스캔 | 리프 순차 읽기로 유리 | 여러 런 병합 필요 |
| 공간 | 페이지 채움률 50~100% | 압축 효율 좋음, 단 옛 값이 일시적으로 남음 |
| 지연 예측성 | 비교적 안정 | 컴팩션 때문에 튈 수 있음 |
| 대표 | PostgreSQL, SQLite | RocksDB, Cassandra |

어느 쪽도 항상 낫지 않다. 읽기 위주·범위 질의·트랜잭션 중심이면 B-트리, 쓰기 위주·대용량 수집이면 LSM 이 출발점이다.

## 실무에서

- **RocksDB**: 위키에 따르면 memtable 기본 구현은 스킵 리스트이고, 쓰기는 WAL 에 선택적으로 기록되며, flush 된 memtable 은 L0 의 SST 파일이 된다. L0 파일끼리는 키 범위가 겹칠 수 있고 그 아래 레벨은 각각 하나의 정렬 런이다. 컴팩션은 Level(기본)·Universal·FIFO 세 방식을 제공한다.
- **Cassandra**: 쓰기는 memtable 에 들어갔다가 불변 SSTable 로 flush 되고, 갱신·삭제는 기존 SSTable 을 고치지 않는다. 문서는 컴팩션 전략으로 새 워크로드에 권장되는 UCS(Unified), 기본값인 STCS(Size-Tiered), 읽기 많거나 갱신·삭제가 많을 때의 LCS(Leveled), TTL 을 쓰는 시계열용 TWCS(Time Window)를 설명한다.
- **Cassandra 의 툼스톤과 `gc_grace_seconds`**: 툼스톤은 기본 864000초(10일) 동안 유지된 뒤 컴팩션에서 지워진다. 그 사이 장애 노드가 삭제를 전달받게 하기 위해서다. 노드가 이 기간보다 오래 내려가 있다가 복구되면, repair 과정에서 지운 데이터가 되살아날("좀비") 수 있다. 분산 환경에서 LSM 의 삭제가 왜 까다로운지 보여 주는 예다.

> 원 논문: P. O'Neil, E. Cheng, D. Gawlick, E. O'Neil, "The Log-Structured Merge-Tree (LSM-Tree)", Acta Informatica 33(4), 1996.
