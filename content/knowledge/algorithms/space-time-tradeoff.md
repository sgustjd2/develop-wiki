---
title: 공간-시간 트레이드오프
aka: [Space-Time Tradeoff, Time-Memory Tradeoff, 시간-메모리 트레이드오프]
category: algorithms
group: complexity
level: intermediate
summary: 메모리를 더 써서 계산 시간을 줄이거나, 반대로 시간을 더 써서 메모리를 아끼는 선택. 캐시·인덱스·메모이제이션·압축이 모두 이 축 위의 결정이다.
tags: [complexity, memoization, caching, precomputation]
related: [algorithms/big-o-complexity, algorithms/dynamic-programming, algorithms/hash-table, algorithms/bloom-filter, data-modeling/index-design, algorithms/hyperloglog-count-min-sketch]
sources:
  - https://en.wikipedia.org/wiki/Space%E2%80%93time_tradeoff
  - https://www.postgresql.org/docs/current/indexes-index-only-scans.html
  - https://en.wikipedia.org/wiki/Bloom_filter
updatedAt: 2026-11-18
---

## 문제

같은 계산을 반복하거나, 매번 전체 데이터를 훑으면 느리다. 결과를 저장해 두면 빨라지지만 메모리·디스크·일관성 유지 비용이 생긴다. **무엇을 미리 계산해 저장할지**가 설계의 핵심 질문이다.

## 패턴별 정리

| 기법 | 공간을 더 써서 | 시간이 줄어드는 곳 | 예 |
| --- | --- | --- | --- |
| 조회 테이블(lookup table) | 결과표 저장 | 매번 계산 → 인덱스 한 번 | CRC 테이블, 비트 카운트 표 |
| 메모이제이션 / DP 표 | 부분 문제 답 저장 | 지수 → 다항 | 피보나치, 편집 거리 |
| 인덱스 | 정렬된 사본 | O(n) 스캔 → O(log n) | DB B-tree 인덱스 |
| 캐시 | 계산·조회 결과 사본 | 재계산·원격 호출 생략 | CDN, Redis 캐시 |
| 누적 합(prefix sum) | 길이 n 배열 하나 | 구간 합 O(n) → O(1) | 통계 대시보드 |
| 비정규화 | 중복 칼럼·집계 칼럼 | 조인·집계 생략 | 주문 테이블의 total |

반대 방향(시간을 써서 공간 절약)도 흔하다.

| 기법 | 아끼는 것 | 대가 |
| --- | --- | --- |
| 압축 | 저장·전송 공간 | 압축·해제 CPU |
| 확률적 자료구조 | 정확한 집합 저장 공간 | 오탐 허용, 일부 연산 불가 → [블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/) |
| 재계산(rematerialization) | 중간 결과 메모리 | 필요할 때 다시 계산 |
| 스트리밍 처리 | 전체 데이터 적재 메모리 | 여러 번 읽기·근사 |

## 예: 누적 합

```ts
// 전처리 O(n), 공간 O(n) → 이후 구간 합 질의 O(1)
function buildPrefix(xs: readonly number[]): number[] {
  const p = new Array<number>(xs.length + 1).fill(0);
  for (let i = 0; i < xs.length; i++) p[i + 1] = p[i] + xs[i];
  return p;
}

// [l, r) 구간 합
const rangeSum = (p: readonly number[], l: number, r: number): number => p[r] - p[l];

const p = buildPrefix([3, 1, 4, 1, 5, 9]);
console.log(rangeSum(p, 1, 4)); // 1+4+1 = 6
```

질의가 한두 번이면 전처리가 손해다. **질의 수 × 절약 시간 > 전처리 + 유지 비용**일 때만 이득이다.

## 예: 메모이제이션

```ts
function memoize<A extends string | number, R>(fn: (a: A) => R): (a: A) => R {
  const cache = new Map<A, R>();
  return (a) => {
    const hit = cache.get(a);
    if (hit !== undefined || cache.has(a)) return hit as R;
    const r = fn(a);
    cache.set(a, r);
    return r;
  };
}
```

이 캐시는 상한이 없어 **메모리 누수**가 된다. 실제로는 크기 제한(LRU)·TTL 이 필요하다 → [연결 리스트](/develop-wiki/knowledge/algorithms/linked-list/)의 LRU 예.

## 언제 쓰나

- 같은 입력에 대한 질의가 반복되고, 입력이 자주 바뀌지 않을 때 (읽기 >> 쓰기)
- 계산이 비싸거나 원격 호출이라 지연이 큰 경우
- 메모리가 빠듯하고 약간의 오차·CPU 비용을 감수할 수 있을 때는 반대 방향(압축·확률 구조)

## 주의 (비용)

- **무효화가 진짜 비용이다.** 원본이 바뀌면 저장해 둔 사본(캐시·인덱스·비정규화 칼럼)도 갱신해야 한다. 쓰기 경로가 느려지고 불일치 버그가 생긴다.
- 메모리가 늘면 캐시 적중률이 떨어져 오히려 느려질 수 있다(큰 조회 테이블이 L1/L2 캐시를 밀어낸다).
- 전처리 비용과 저장 공간이 질의 이득보다 클 수 있다. 질의 수를 먼저 추정한다.
- 보안 관점의 예: 레인보우 테이블은 공격자가 공간을 써서 해시 역산 시간을 줄이는 기법이다. 비밀번호에 **솔트**를 붙이면 미리 계산한 표가 무용해진다.

## 실무에서

- PostgreSQL 커버링 인덱스(`INCLUDE`)는 테이블 데이터 일부를 인덱스에 복제해 힙 접근을 없앤다. 대가는 쓰기와 공간 → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).
- Cassandra·HBase·RocksDB 등 LSM 계열 저장소는 SSTable 마다 블룸 필터를 메모리에 두어, 키가 없는 파일의 디스크 읽기를 건너뛴다.
- 프론트엔드의 `useMemo`, 백엔드의 결과 캐시, 빌드 시스템의 증분 캐시 모두 같은 결정이다.
