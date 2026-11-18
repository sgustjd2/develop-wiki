---
title: 해시 테이블
aka: [Hash Table, Hash Map, Dictionary, 해시맵, Separate Chaining, Open Addressing]
category: algorithms
group: data-structure
level: beginner
summary: 키를 해시 함수로 배열 위치에 대응시켜 조회·삽입·삭제를 평균 O(1)에 하는 자료구조. 충돌 처리 방식과 적재율, 리사이즈가 성능을 결정한다.
tags: [hash, hashmap, dictionary, collision, load-factor]
related: [algorithms/array-dynamic-array, algorithms/amortized-analysis, algorithms/bloom-filter, algorithms/bst-balanced-tree, algorithms/linked-list]
sources:
  - https://en.wikipedia.org/wiki/Hash_table
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html
  - https://go.dev/blog/swisstable
  - https://www.131002.net/siphash/
updatedAt: 2026-11-18
---

## 개념

1. 키 → 해시 함수 → 정수 `h`
2. `h mod 용량` → 버킷(배열 칸) 위치
3. 서로 다른 키가 같은 칸에 오는 **충돌**을 처리하는 규칙

**적재율(load factor)** α = 원소 수 / 버킷 수. α 가 커지면 충돌이 늘어 느려지므로, 기준을 넘으면 버킷 배열을 대략 2배로 늘리고 전부 다시 배치(rehash)한다.

## 충돌 처리 두 갈래

| 방식 | 구조 | 장점 | 단점 | 권장 최대 α |
| --- | --- | --- | --- | --- |
| 분리 체이닝 | 버킷마다 리스트(또는 트리) | 구현 단순, 삭제 쉬움, α>1 가능 | 포인터 추적으로 캐시 미스 | 1~3 |
| 개방 주소법 | 모든 원소가 배열 안, 빈 칸을 탐사(선형·이차·이중 해싱) | 연속 메모리, 캐시 친화 | 삭제 시 묘비(tombstone) 필요, α→1 이면 급격히 느려짐 | 0.6~0.75 |

변형: Robin Hood 해싱(탐사 거리 분산을 줄임), Swiss Table(8칸 그룹 + 해시 7비트 제어 바이트를 SIMD/비트 연산으로 한 번에 비교).

## 연산 복잡도

| 연산 | 평균 | 최악 |
| --- | --- | --- |
| 조회·삽입·삭제 | O(1) | O(n) (전부 한 버킷에 몰릴 때) |
| 삽입 중 리사이즈 | 상각 O(1) | 그 한 번은 O(n) |
| 순회 | O(n + 버킷 수) | |
| 정렬 순서 순회·범위 질의 | 지원 안 함 | → [균형 트리](/develop-wiki/knowledge/algorithms/bst-balanced-tree/) |

## 구현 스케치 (분리 체이닝)

```ts
class ChainedMap<V> {
  private buckets: Array<Array<[string, V]>> = Array.from({ length: 8 }, () => []);
  private count = 0;

  private index(key: string, cap = this.buckets.length): number {
    let h = 2166136261; // FNV-1a 32bit
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % cap;
  }

  get(key: string): V | undefined {
    for (const [k, v] of this.buckets[this.index(key)]) if (k === key) return v;
    return undefined;
  }

  set(key: string, value: V): void {
    const bucket = this.buckets[this.index(key)];
    const hit = bucket.find((e) => e[0] === key);
    if (hit) { hit[1] = value; return; }
    bucket.push([key, value]);
    if (++this.count > this.buckets.length * 0.75) this.resize();
  }

  private resize(): void {
    const next: Array<Array<[string, V]>> = Array.from({ length: this.buckets.length * 2 }, () => []);
    for (const b of this.buckets) for (const e of b) next[this.index(e[0], next.length)].push(e);
    this.buckets = next;
  }
}
```

FNV-1a 는 설명용이다. 외부 입력을 키로 받는 서버에서는 아래 "해시 플러딩"을 고려한 해시를 쓴다.

## 언제 쓰나

- 키로 정확히 찾는 조회가 대부분일 때: 캐시, 중복 제거, 빈도 세기, 조인(해시 조인), 인덱스 역참조.
- 두 컬렉션의 교집합·차집합, "본 적 있나" 확인.

## 주의

- **해시 플러딩(algorithmic complexity attack)**: 공격자가 같은 버킷에 떨어지는 키를 대량으로 보내면 O(1)이 O(n)으로 무너져 서버 CPU 가 마비된다. 대책은 프로세스마다 무작위 시드를 쓰는 키 있는 해시(SipHash 등), 버킷이 길어지면 트리로 바꾸는 방식(Java `HashMap` 은 키가 `Comparable` 이면 비교 순서로 동점을 처리), 요청당 키 수 제한.
- 키의 `equals`/`hashCode`(또는 언어별 동등성 규칙)가 일관돼야 한다. 맵에 넣은 뒤 키 객체를 변경하면 다시 찾을 수 없다.
- 순서 보장은 언어마다 다르다. JS `Map`·Python `dict` 는 삽입 순서를 보존하지만 Go `map` 은 순회 순서가 무작위, Java `HashMap` 은 순서 없음.
- 리사이즈 순간 지연과 메모리 2배. 예상 크기를 알면 초기 용량을 준다(Java 19+ `HashMap.newHashMap(n)`).
- JS 에서 객체 리터럴을 맵으로 쓰면 `__proto__` 같은 키 문제와 프로토타입 오염 위험이 있다. 동적 키는 `Map` 을 쓴다.

## 실무에서

- Java `HashMap` 기본값은 용량 16, 적재율 0.75이며, 넘으면 버킷 수를 약 2배로 늘려 rehash 한다고 문서에 적혀 있다. 순회 비용은 용량 + 크기에 비례한다.
- Go 1.24 는 내장 `map` 을 Swiss Table 기반으로 바꿨다(8칸 그룹, 제어 워드로 후보를 병렬 비교).
- DB 의 해시 조인, 해시 인덱스(PostgreSQL `USING hash`, 등호 조회만 가능), 분산 시스템의 샤드 배치(일관 해싱)가 같은 원리를 쓴다.
