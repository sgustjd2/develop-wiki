---
title: 쿠쿠 필터와 카운팅 블룸 필터
aka: [Cuckoo Filter, Counting Bloom Filter, Deletable Bloom Filter, 삭제 가능한 필터, Partial-Key Cuckoo Hashing]
category: algorithms
group: data-structure
level: advanced
summary: 블룸 필터에 삭제를 더한 두 변형. 카운팅 블룸 필터는 비트를 카운터로 바꾸고, 쿠쿠 필터는 지문을 쿠쿠 해시 표에 담는다. 오탐률 3% 이하에서는 쿠쿠 필터가 보통 더 작다.
tags: [probabilistic, bloom-filter, cuckoo-hashing, fingerprint, deletion, membership]
related: [algorithms/bloom-filter, algorithms/hash-table, algorithms/hyperloglog-count-min-sketch, algorithms/space-time-tradeoff, algorithms/lsm-tree, algorithms/hash-functions-hashdos]
sources:
  - https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf
  - https://en.wikipedia.org/wiki/Cuckoo_filter
  - https://en.wikipedia.org/wiki/Counting_Bloom_filter
  - https://redis.io/docs/latest/develop/data-types/probabilistic/cuckoo-filter/
updatedAt: 2026-11-19
---

## 문제

[블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/)는 작고 빠르지만 **삭제가 안 된다.** 한 비트를 여러 원소가 공유하므로 끄면 다른 원소가 사라진다. 캠페인에 가입한 사용자를 목록에서 빼거나, 사용한 쿠폰을 무효화하거나, 캐시에서 퇴출된 키를 반영해야 하는 용도에서는 필터를 통째로 다시 만들어야 한다.

## 해법 1: 카운팅 블룸 필터

비트 배열을 **카운터 배열**로 바꾼다. 추가는 k 개 카운터를 +1, 삭제는 −1, 질의는 k 개가 모두 0 보다 큰지 본다.

- 카운터가 넘치면 안 되므로 실무에서는 4비트 이상을 쓴다. 쿠쿠 필터 논문은 이 때문에 표준 블룸 필터보다 약 **4배** 공간이 든다고 요약한다.
- 삭제는 **실제로 넣었던 원소만** 해야 한다. 없던 원소(또는 이미 지운 원소)를 지우면 다른 원소의 카운터가 줄어 **거짓 음성**이 생긴다(Wikipedia 도 이 위험을 지적한다).
- 구조가 [Count-Min Sketch](/develop-wiki/knowledge/algorithms/hyperloglog-count-min-sketch/)와 사실상 같고, 용도가 "임계값 이상인가"일 뿐이다.

## 해법 2: 쿠쿠 필터

Fan, Andersen, Kaminsky, Mitzenmacher(CoNEXT 2014)가 제안했다. 원소 대신 **지문(fingerprint, 몇 비트의 해시)**만 쿠쿠 해시 표에 저장한다.

- 버킷마다 슬롯 b 개(논문과 Redis 구현은 4개가 기본 선택), 원소는 후보 버킷 **두 곳**을 가진다.
- 지문만 있고 원래 키가 없는데 쫓아낼 때 다른 버킷을 어떻게 알까? 이것이 핵심 트릭인 **부분 키 쿠쿠 해싱**이다.

```
i1 = hash(x)
i2 = i1 XOR hash(fingerprint(x))      // XOR 은 대칭이므로 i2 에서 같은 식으로 i1 이 나온다
```

지문과 현재 버킷 번호만 있으면 반대편 버킷을 계산할 수 있어 키 없이 재배치가 가능하다.

- **질의**: 두 버킷에서 지문을 찾는다(최대 2b 슬롯 비교). **삭제**: 찾은 지문 하나를 지운다.
- **삽입**: 두 버킷이 차면 한 지문을 쫓아내 그 지문의 반대편 버킷으로 보내는 과정을 반복한다. 논문 구현은 최대 500회까지 쫓고, 그래도 자리가 없으면 "가득 참"으로 실패한다.

```ts
class CuckooFilter {
  private readonly buckets: Uint8Array; // 버킷 × 슬롯 4개, 0 = 빈 슬롯
  private readonly mask: number;
  count = 0;
  constructor(bucketCount: number, private readonly maxKicks = 500) {
    if ((bucketCount & (bucketCount - 1)) !== 0) throw new Error('bucketCount must be a power of 2');
    this.buckets = new Uint8Array(bucketCount * 4);
    this.mask = bucketCount - 1;
  }
  private fp(key: string): number { return (hash32(key, 1) & 0xff) || 1; } // 8비트 지문, 0 은 예약
  private i1(key: string): number { return hash32(key) & this.mask; }
  private alt(i: number, f: number): number { return (i ^ hash32(String(f), 2)) & this.mask; }
  private put(i: number, f: number): boolean {
    for (let s = 0; s < 4; s++) if (this.buckets[i * 4 + s] === 0) { this.buckets[i * 4 + s] = f; return true; }
    return false;
  }
  add(key: string): boolean {
    let f = this.fp(key), i = this.i1(key);
    const j = this.alt(i, f);
    if (this.put(i, f) || this.put(j, f)) { this.count++; return true; }
    i = Math.random() < 0.5 ? i : j;
    for (let n = 0; n < this.maxKicks; n++) {
      const s = Math.floor(Math.random() * 4);
      const victim = this.buckets[i * 4 + s];
      this.buckets[i * 4 + s] = f; f = victim;   // 쫓아내기
      i = this.alt(i, f);
      if (this.put(i, f)) { this.count++; return true; }
    }
    return false; // 가득 참 (마지막으로 쫓겨난 지문은 이미 사라졌다 — 아래 주의 참고)
  }
  // mightContain / delete 는 두 버킷에서 지문을 찾아 비교/제거
}
```

`hash32` 는 FNV-1a 에 murmur3 마무리를 섞은 32비트 해시(시드 인자 포함)로, [블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/) 노트의 것과 같은 계열이다. 위 코드를 `tsc --strict` 로 컴파일해 10만 키를 넣어 보니(버킷 32,768개 × 4슬롯 = 131,072슬롯, 8비트 지문):

| 측정 | 결과 |
| --- | --- |
| 삽입 성공 | 100,000 / 100,000 (적재율 76.3%) |
| 없는 키 20만 개 질의 오탐률 | 2.33% (상한 근사 2b/2⁸ = 3.1%) |
| 넣은 키의 거짓 음성 | 0 |
| 1,000개 삭제 후 여전히 "있음" | 21개 (지문이 같은 다른 원소 때문. 오탐과 같은 이유) |
| 카운터 8비트 카운팅 블룸(m=100만, k=7) 오탐률 | 0.80% |

## 수치로 비교 (ε = 목표 오탐률, α = 적재율)

논문(Table 2)에 따르면 원소당 비트는 다음과 같다.

| 구조 | 원소당 비트 | 삭제 |
| --- | --- | --- |
| 공간 최적 블룸 필터 | 1.44·log₂(1/ε) | 불가 |
| 카운팅 블룸 | 위의 약 3~4배 | 가능 |
| 쿠쿠 필터 (b=4) | (log₂(1/ε) + 3) / α, α ≈ 95.5% | 가능 |
| 쿠쿠 + semi-sort | (log₂(1/ε) + 2) / α | 가능 |

- 논문은 semi-sort 를 쓴 쿠쿠 필터가 **ε < 3%** 에서 삭제 불가 블룸 필터보다도 작다고 한다. 3%보다 느슨한 오탐을 허용하면 블룸 필터가 더 작다.
- 위 식으로 ε = 1% 를 계산하면 블룸 약 9.6비트, 쿠쿠 약 10.1비트, semi-sort 약 9.1비트다. ε = 0.1% 는 각각 14.4 / 13.6 / 12.5 정도로 쿠쿠 쪽이 유리해진다.
- 양성 질의에서 블룸은 k 개의 임의 위치(ε=1% 면 k=7)를 읽지만, 쿠쿠는 **항상 버킷 두 개**만 본다. 캐시 미스가 적다.
- 논문은 쿠쿠 필터가 점근적으로는 오히려 불리하다고 인정한다. 지문 크기가 원소 수에 로그로 늘어야 하기 때문이다(실무 규모인 수십억 개 이하에서는 문제 없다고 한다).

## 언제 쓰나

- **삭제가 필요한 멤버십 검사**: 캠페인 대상자 목록에서 가입자 제거, 쿠폰 코드 사용 처리(Redis 문서의 예시), 캐시 퇴출 반영.
- 오탐률을 1% 이하로 낮추고 조회 지연이 중요한 곳.
- 삭제가 필요 없고 삽입이 아주 잦다면 일반 [블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/)가 단순하다. Redis 문서도 삽입이 많으면 블룸, 조회와 삭제가 많으면 쿠쿠를 권한다.

## 주의

- **실제로 넣은 원소만 삭제한다.** 두 구조 모두 안 넣은 원소를 지우면 다른 원소를 지운다. 쿠쿠 필터에서 지문이 우연히 같은 다른 원소의 지문을 지울 수 있다. 위 카운팅 블룸 실험에서 이미 지운 키를 한 번 더 지웠더니 남은 키에서 거짓 음성이 6개 나왔다. 원본 저장소에서 존재를 확인한 뒤에만 삭제한다.
- **같은 원소를 반복 삽입하지 못한다.** 같은 키는 같은 지문·같은 두 버킷에 쌓이므로 2b회를 넘기면 버킷이 넘친다. 논문은 중복 삽입을 막거나, 삭제가 필요 없으면 지문을 하나만 저장하거나, 버킷에 카운터를 두라고 한다. Redis 도 같은 원소를 여러 번 넣으면 여러 항목이 생겨 채워진다고 경고한다.
- **삽입이 실패할 수 있다.** 적재율이 95%에 가까워질수록 쫓아내기가 길어진다. 실패 시 재구성(더 큰 표로 다시 만들기)이나 Redis 처럼 서브필터를 늘리는 확장이 필요하다. 실패한 삽입이 마지막 쫓겨난 지문을 이미 잃은 상태일 수 있어, 구현에 따라 롤백(victim 복원)을 지원하는지 확인한다.
- 버킷 크기가 클수록 적재율은 오르지만 오탐률도 선형으로 오른다(Redis 문서: 버킷 4개 기준 오탐 약 3.1%, 적재율 95%).
- 블룸 필터의 장점인 **합집합 비트 OR** 같은 병합 연산이 쉽지 않다(Wikipedia).
- 버킷 수가 2의 거듭제곱이어야 하는 변형이 많다(XOR 로 범위를 벗어나지 않게). 크기 조절이 불연속이다.

## 실무에서

- Redis Stack/RedisBloom 의 `CF.RESERVE`, `CF.ADD`, `CF.EXISTS`, `CF.DEL`. 문서의 지문은 8비트, `BUCKETSIZE` 와 `EXPANSION` 으로 적재율·확장 방식을 정한다.
- 쿠쿠 논문은 카운팅 블룸, d-left 카운팅 블룸, quotient 필터를 "삭제 가능한 대안"으로 비교한다. 새로 고른다면 쿠쿠 필터를 먼저 본다.
