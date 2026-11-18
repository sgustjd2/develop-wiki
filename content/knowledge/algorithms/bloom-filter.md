---
title: 블룸 필터
aka: [Bloom Filter, Probabilistic Set, 확률적 집합, Counting Bloom Filter, Cuckoo Filter]
category: algorithms
group: data-structure
level: intermediate
summary: 비트 배열과 해시 함수 k 개로 "확실히 없음" 또는 "아마 있음"을 답하는 확률적 집합. 원소당 10비트 안팎으로 1% 오탐률을 내며, 비싼 조회를 앞에서 걸러 내는 데 쓴다.
tags: [bloom-filter, probabilistic, hash, lsm-tree, caching]
related: [algorithms/hash-table, algorithms/space-time-tradeoff, algorithms/b-tree, algorithms/hyperloglog-count-min-sketch, algorithms/lsm-tree]
sources:
  - https://en.wikipedia.org/wiki/Bloom_filter
  - https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter
  - https://cassandra.apache.org/doc/latest/cassandra/managing/operating/bloom_filters.html
  - https://www.postgresql.org/docs/current/bloom.html
updatedAt: 2026-11-18
---

## 문제

"이 키가 디스크에 있나?"를 확인하려면 디스크를 읽어야 한다. 대부분의 답이 "없음"이라면 그 읽기는 낭비다. 정확한 집합(해시 셋)을 메모리에 두면 원소마다 키 전체를 저장해야 해서 너무 크다.

## 해법

- m 비트 배열(처음엔 전부 0)과 서로 다른 해시 함수 k 개.
- **추가**: 원소를 k 개 해시로 k 개 위치를 구해 1 로 켠다.
- **질의**: k 개 위치가 **모두 1 이면 "아마 있음"**, 하나라도 0 이면 **"확실히 없음"**.

거짓 음성(있는데 없다고 함)은 없고, 거짓 양성(없는데 있다고 함)만 있다.

```ts
class BloomFilter {
  private bits: Uint8Array;
  constructor(private readonly m: number, private readonly k: number) {
    this.bits = new Uint8Array(Math.ceil(m / 8));
  }

  // 원소 n, 목표 오탐률 p 로 m·k 계산
  static forCapacity(n: number, p: number): BloomFilter {
    const m = Math.ceil((-n * Math.log(p)) / Math.LN2 ** 2);
    const k = Math.max(1, Math.round((m / n) * Math.LN2));
    return new BloomFilter(m, k);
  }

  // 이중 해싱: h_i = h1 + i·h2 로 해시 k 개를 흉내 낸다 (Kirsch–Mitzenmacher)
  private positions(key: string): number[] {
    let h1 = 2166136261, h2 = 5381;
    for (let i = 0; i < key.length; i++) {
      const c = key.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619);
      h2 = (Math.imul(h2, 33) + c) | 0;
    }
    const out: number[] = [];
    for (let i = 0; i < this.k; i++) out.push(((h1 + Math.imul(i, h2 | 1)) >>> 0) % this.m);
    return out;
  }

  add(key: string): void {
    for (const p of this.positions(key)) this.bits[p >> 3] |= 1 << (p & 7);
  }

  mightContain(key: string): boolean {
    return this.positions(key).every((p) => (this.bits[p >> 3] & (1 << (p & 7))) !== 0);
  }
}

const bf = BloomFilter.forCapacity(1000, 0.01); // m ≈ 9586 비트(약 1.2KB), k = 7
bf.add("user:42");
console.log(bf.mightContain("user:42"), bf.mightContain("user:43")); // true, (대개) false
```

FNV·djb2 는 설명용이다. 실제로는 MurmurHash·xxHash 같은 분포 좋은 해시를 쓴다.

## 수치 (n = 원소 수, m = 비트 수, k = 해시 수)

| 항목 | 식 |
| --- | --- |
| 오탐률 | ε ≈ (1 − e^(−kn/m))^k |
| 최적 k | (m/n)·ln 2 |
| 목표 ε 에 필요한 원소당 비트 | m/n = −ln ε / (ln 2)² |

| 목표 오탐률 | 원소당 비트 | 최적 k |
| --- | --- | --- |
| 10% | 약 4.8 | 3 |
| 1% | 약 9.6 | 7 |
| 0.1% | 약 14.4 | 10 |

원소 크기와 무관하다. URL 1억 개를 1% 오탐으로 담는 데 약 120MB 면 된다.

| 연산 | 복잡도 |
| --- | --- |
| 추가·질의 | O(k) |
| 삭제 | 기본 블룸 필터는 불가 |
| 공간 | O(m), 원소 수에 비례하지만 키 크기와 무관 |

## 언제 쓰나

- 비싼 조회(디스크, 네트워크, DB) 앞의 1차 필터: "없음"이 대부분인 질의.
- 이미 본 것 걸러내기: 크롤러의 방문 URL, 추천 피드의 이미 노출한 항목.
- 분산 조인에서 상대 노드로 보낼 키를 줄이기(semi-join).

## 주의

- **"있음"은 믿으면 안 된다.** 오탐이 나면 반드시 원본으로 확인하는 경로가 있어야 한다. 반대로 "없음"이 틀리면 안 되는 용도에만 쓴다.
- **삭제가 안 된다.** 비트를 끄면 다른 원소도 지워질 수 있다. 삭제가 필요하면 카운팅 블룸 필터(비트 대신 카운터, 메모리 3~4배)나 쿠쿠 필터를 검토한다.
- **용량을 넘기면 오탐률이 급격히 오른다.** 처음에 n 을 추정해 크기를 정해야 하고, 나중에 늘릴 수 없다(재생성 또는 확장형 블룸 필터).
- 해시 함수가 서로 독립적이지 않거나 분포가 나쁘면 이론 오탐률이 안 나온다.
- 프라이버시: 필터 자체에서 원소를 추측할 수 있는 경우가 있다(Bitcoin 경량 지갑의 블룸 필터 사용이 프라이버시 문제로 비판받았다).

## 실무에서

- RocksDB·Cassandra·HBase 같은 LSM 트리 저장소는 SSTable 마다 블룸 필터를 두어, 키가 없는 파일의 디스크 읽기를 건너뛴다. Cassandra 문서는 테이블별 `bloom_filter_fp_chance` 로 오탐률과 메모리를 조절한다고 설명한다.
- PostgreSQL 은 `bloom` 확장으로 여러 칼럼 임의 조합의 등호 검색용 블룸 인덱스를 제공한다.
- Wikipedia 에 따르면 Chrome 이 과거 악성 URL 사전 검사에, Akamai 가 한 번만 요청되는 객체를 캐시에서 거르는 데 썼다.

> 원 논문: Burton H. Bloom, "Space/Time Trade-offs in Hash Coding with Allowable Errors", CACM 1970.
