---
title: 쿼션트 필터와 XOR 필터
aka: [Quotient Filter, Xor Filter, Xor+ Filter, Bloomier Filter, Approximate Membership Query, AMQ, 정적 필터]
category: algorithms
group: data-structure
level: advanced
summary: 블룸 필터의 대안인 두 확률적 집합. 쿼션트 필터는 삭제·병합·크기 조절이 되는 캐시 친화 구조이고, XOR 필터는 만들어진 뒤 바꿀 수 없지만 더 작고 빠른 정적 구조다.
tags: [probabilistic, quotient-filter, xor-filter, bloom-filter, membership, lsm-tree]
related: [algorithms/bloom-filter, algorithms/cuckoo-counting-bloom-filter, algorithms/hash-table, algorithms/lsm-tree, algorithms/hyperloglog-count-min-sketch, algorithms/space-time-tradeoff, cs-fundamentals/cpu-cache-locality]
sources:
  - https://arxiv.org/abs/1912.08258
  - https://arxiv.org/abs/1208.0290
updatedAt: 2026-11-19
---

## 문제

[블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/)는 "확실히 없음/아마 있음"만 알려 주는 작은 집합이다. 그래도 다음 불만이 남는다.

- 원소당 해시를 여러 번 계산하고 **임의 메모리를 여러 곳** 건드린다. 오탐률 ε 에 맞춘 최적 해시 수는 약 −log₂ε 개이고, ε = 1% 이면 7개다.
- 이론적 하한은 원소당 **−log₂ε 비트**인데, 최적으로 만든 블룸 필터도 이보다 약 44% 더 쓴다(XOR 필터 논문의 계산).
- **삭제가 안 된다.** 카운팅 블룸 필터로 삭제를 지원하면 공간이 약 4배가 된다(쿼션트 필터 논문).
- 비트 배열이 뒤죽박죽 접근되므로 디스크·SSD 에 두기 어렵다.

[쿠쿠·카운팅 필터](/develop-wiki/knowledge/algorithms/cuckoo-counting-bloom-filter/)가 일부를 푼다. 여기서는 다른 두 갈래를 본다.

## 쿼션트 필터 (Bender 외, VLDB 2012)

원소의 p 비트 지문(해시)을 **몫(quotient, 상위 q 비트)** 과 **나머지(remainder, 하위 r 비트)** 로 쪼갠다. 몫은 해시 테이블의 버킷 번호, 나머지는 그 버킷에 저장하는 값이다. 몫이 같은 지문들의 나머지는 정렬해 연속으로 저장한다(**run**). 몫이 칸 번호와 다르게 밀려난 항목을 구분하려고 슬롯마다 메타데이터 **3비트**를 쓴다.

| 비트 | 의미 |
| --- | --- |
| `is_occupied` | 이 번호를 몫으로 갖는 지문이 존재하는가 |
| `is_shifted` | 이 슬롯의 나머지가 원래 자기 버킷이 아닌 곳으로 밀려났는가 |
| `is_continuation` | 직전 슬롯과 같은 run 에 속하는가 |

슬롯 크기는 `r + 3` 비트, 슬롯 수는 2^q 이다. 이 3비트로 원래의 열린 해시 테이블을 완벽히 복원할 수 있고, 연속된 run 들의 묶음(**cluster**)만 읽으면 조회·삽입·삭제가 된다.

- **오탐**: 서로 다른 원소의 지문이 완전히 같을 때(hard collision)만 생긴다. 확률 상한이 2^−r 정도다(논문의 상계).
- **삭제**: 지문 하나를 제거하면 된다. 정확한 삭제가 된다.
- **크기 조절**: 나머지의 비트 하나를 몫으로 옮기거나 반대로 해서 **다시 해시하지 않고** 키우고 줄인다.
- **병합**: 두 필터를 병합 정렬처럼 순차 스캔으로 합친다.
- **캐시 친화**: 한 연산이 보통 한두 캐시 라인(SSD 에서는 한 페이지) 안의 cluster 만 본다. 블룸 필터는 삽입이 k 개의 임의 위치 쓰기다.
- **cluster 크기**: 적재율 α 에서 평균 길이가 `1/(1 − α·e^(1−α))` 미만이다. α = 3/4 면 평균 27, α = 1/2 면 cluster 의 99% 가 24 미만이다. 그래서 적재율을 너무 높이면 연산이 느려진다.

논문은 이를 바탕으로 SSD 용 buffered quotient filter 와 cascade filter 도 제안한다. 병합이 가능해 [LSM 트리](/develop-wiki/knowledge/algorithms/lsm-tree/)처럼 쓰기를 모았다가 합치는 구조와 어울린다.

## XOR 필터 (Graf·Lemire, 2019)

"집합이 **고정**돼 있다"는 조건을 받아들이고 공간·속도를 최대화한 필터다. Dietzfelbinger 와 Pagh 의 Bloomier 필터 변형을 실용화했다.

### 구조

- 배열 `B` 의 크기는 약 `1.23 × |S| + 32` 칸이고 k 비트 지문을 칸마다 저장한다. 3등분한 구간에서 해시 3개가 각각 한 칸씩 고른다.
- 조건: **원소 x 에 대해 `B[h0(x)] ^ B[h1(x)] ^ B[h2(x)] == fingerprint(x)`**.
- 조회는 해시 3번과 메모리 접근 3번이고 `fingerprint(x)` 가 세 칸의 xor 와 같은지 비교하면 끝이다.
- 오탐률은 `2^−k`. k = 8 이면 약 0.39% 이고, 칸 수가 1.23 배라 원소당 **8 × 1.23 = 9.84 비트**다. 하한 대비 약 23% 이상이다(블룸의 44% 보다 낮음).

### 만들기: 껍질 벗기기(peeling)

모든 원소의 조건을 만족하는 `B` 를 찾아야 한다.

1. 원소마다 세 칸에 등록한다. 칸별로 **하나의 원소만 등록된 칸**이 생긴다.
2. 그런 칸을 하나 고르고 (원소, 그 칸)을 스택에 쌓은 뒤 그 원소를 세 칸에서 모두 뺀다. 새로 하나만 남은 칸이 생기면 이어서 반복한다.
3. 모든 원소가 스택에 쌓이면 성공이다(그래프가 순환이 없다는 뜻). 아니면 **새 해시 시드로 다시 시작**한다. 논문에 따르면 집합이 크면 성공 확률이 거의 1 이고, 작은 집합에서도 이 크기 설정으로 0.8 이상이다.
4. 스택을 **거꾸로** 꺼내며 그 원소가 담당하는 칸 값을 `fingerprint ^ (나머지 두 칸)` 로 채운다. 그 칸은 이후 다른 원소가 쓰지 않기 때문에 이미 채운 원소의 조건이 안 깨진다.

```ts
import { hash32 } from './common.ts';

// 3-분할 xor 필터 (8비트 지문). 정적 집합 전용
function build(keys: string[]) {
  for (let seed = 1; ; seed++) {
    const c = Math.floor(1.23 * keys.length) + 32, part = Math.floor(c / 3);
    const h = (k: string): [number, number, number] =>
      [hash32(k, seed) % part, part + (hash32(k, seed + 1000) % part), 2 * part + (hash32(k, seed + 2000) % part)];
    const cnt = new Array(c).fill(0), mask = new Array(c).fill(0); // 칸별 키 개수, 키 인덱스 xor
    keys.forEach((k, i) => h(k).forEach((p) => { cnt[p]++; mask[p] ^= i; }));
    const queue = cnt.flatMap((n, p) => (n === 1 ? [p] : []));
    const order: [number, number][] = []; // [키 인덱스, 그 키가 담당할 칸]
    while (queue.length) {
      const p = queue.pop()!;
      if (cnt[p] !== 1) continue;
      const i = mask[p]; order.push([i, p]);
      h(keys[i]).forEach((q) => { cnt[q]--; mask[q] ^= i; if (cnt[q] === 1) queue.push(q); });
    }
    if (order.length < keys.length) continue; // 순환(peeling 실패) → 시드를 바꿔 재시도
    const B = new Uint8Array(c);
    for (const [i, p] of order.reverse()) {
      const [a, b, d] = h(keys[i]);
      B[p] = (hash32(keys[i], seed + 3000) & 255) ^ B[a] ^ B[b] ^ B[d]; // B[p] 는 아직 0 이라 나머지 두 칸의 xor 만 남는다
    }
    return { has: (k: string) => { const [a, b, d] = h(k); return (hash32(k, seed + 3000) & 255) === (B[a] ^ B[b] ^ B[d]); }, bytes: c, seed };
  }
}
```

원소 10만 개로 실행한 결과: **거짓 음성 0**, 다른 키 20만 개 조회 시 **오탐률 0.375%**(이론 0.391%), **키당 9.84 비트**. 칸마다 개수와 인덱스 xor 만 유지해 껍질 벗기기가 선형 시간에 끝난다(논문의 구현 요령과 같다).

더 줄인 **xor+ 필터**는 빈 칸을 압축해 원소당 `1.0824k + 0.5125` 비트까지 낮춘다(k = 지문 비트). 논문은 이때 속도가 블룸 필터와 비슷한 수준이라고 보고한다.

## 비교

| | 블룸 | 쿠쿠 필터 | 쿼션트 필터 | XOR 필터 |
| --- | --- | --- | --- | --- |
| 삽입 | O | O | O | **불가**(전체 재구성) |
| 삭제 | X | O | O | X |
| 병합·크기 조절 | 같은 크기만 OR 병합 | 어려움 | 가능(재해시 없이) | 재구성 |
| 공간(오탐 1% 안팎) | 하한 +44% | 원소당 +2~3비트 정도 오버헤드(논문 서술) | `r+3` 비트 슬롯, 적재율에 따라 | 하한 +23% 근처(k=8) |
| 메모리 접근 | k 곳 임의 | 2곳 | cluster 연속 | 3곳 |
| 맞는 곳 | 범용, 구현 단순 | 삭제 필요 | SSD·병합 필요 | 읽기 전용 대량 집합 |

## 언제 쓰나

- **XOR**: 한 번 만들고 읽기만 하는 큰 집합. 예를 들어 LSM 트리의 SSTable 하나에 붙는 필터는 SSTable 이 불변이므로 맞는 구조다. 논문도 LSM 계열 저장소의 필터를 주요 사례로 든다.
- **쿼션트**: 삭제·병합이 필요하거나, 디스크·SSD 에 둬야 하거나, 크기가 미리 정해지지 않은 집합.
- 둘 다 [공간·시간 교환](/develop-wiki/knowledge/algorithms/space-time-tradeoff/) 문제다. 필터가 거짓 양성을 내므로 뒤에 정확한 확인(디스크 조회)이 있어야 의미가 있다.

## 주의 (비용)

- **XOR 필터는 만든 뒤 고칠 수 없다.** 원소가 바뀌면 새로 짓는다. 한 번 짓는 시간은 블룸보다 느릴 수 있고(논문의 구성 시간 표), 짓는 동안 원소 전체와 임시 배열이 메모리에 있어야 한다.
- 작은 집합에서는 껍질 벗기기가 실패해 재시도가 필요하다. 시드를 바꿔 재시도하는 루프가 필수다.
- 같은 원소를 **중복해서 넣으면** 구성이 실패한다(같은 세 칸이라 서로 벗겨 낼 수 없다). 위 코드로 중복 키를 넣어 시드를 3000개까지 바꿔 봐도 성공하지 못했다. 먼저 중복을 제거한다.
- **쿼션트 필터는 적재율 관리**가 필요하다. 높은 적재율에서 cluster 가 길어지고, 해시 품질이 나쁘면 cluster 가 커진다.
- 두 필터 모두 **해시 품질**에 의존한다. [해시 함수와 HashDoS](/develop-wiki/knowledge/algorithms/hash-functions-hashdos/)처럼 공격자가 입력을 고를 수 있으면 시드를 비밀로 두는 등의 방어가 필요하다.
- 오탐률은 **지문 비트 수**로만 정해진다(k 비트 → 2^−k). 필요한 ε 가 정해지면 k 도 정해진다.
