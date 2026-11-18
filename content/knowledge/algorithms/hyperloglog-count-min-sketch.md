---
title: HyperLogLog 와 Count-Min Sketch
aka: [HyperLogLog, HLL, HLL++, Count-Min Sketch, CMS, 확률적 스케치, Probabilistic Sketch, Cardinality Estimation, 카디널리티 추정]
category: algorithms
group: data-structure
level: advanced
summary: 스트림 전체를 저장하지 않고 고정된 작은 메모리로 근사 답을 내는 확률적 스케치 둘. HyperLogLog 는 서로 다른 원소 수를, Count-Min Sketch 는 원소별 빈도를 추정하며 둘 다 병합할 수 있다.
tags: [probabilistic, sketch, streaming, hash, cardinality, frequency, analytics]
related: [algorithms/bloom-filter, algorithms/hash-table, algorithms/space-time-tradeoff, algorithms/heap-priority-queue, algorithms/big-o-complexity, algorithms/top-k-heavy-hitters-space-saving, algorithms/cuckoo-counting-bloom-filter]
sources:
  - https://en.wikipedia.org/wiki/HyperLogLog
  - https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch
  - https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/
  - https://redis.io/docs/latest/develop/data-types/probabilistic/count-min-sketch/
updatedAt: 2026-11-18
---

## 문제

- "오늘 이 페이지의 **순 방문자 수**는?" 정확히 세려면 본 방문자 ID 를 전부 저장해야 한다. 페이지 10만 개 × 하루 수백만 ID 면 수십 GB 다. 시간대별·국가별로 쪼개 합치려면 더 커진다.
- "이 검색어는 **몇 번** 들어왔나?" 단어마다 카운터를 두면 긴 꼬리(한 번만 나온 검색어)가 메모리를 다 먹는다.

둘 다 **정확한 답이 꼭 필요하지는 않은** 질문이다. 1~2% 오차면 충분하다면, 메모리를 수천 배 줄일 수 있다. 같은 계열의 [블룸 필터](/develop-wiki/knowledge/algorithms/bloom-filter/)가 "있나 없나"를 답한다면, 이 둘은 "몇 개인가"와 "몇 번인가"를 답한다.

## HyperLogLog: 서로 다른 원소 수

Flajolet 등이 2007년 발표했다. LogLog, Flajolet–Martin 알고리즘의 후속이다.

**직관**: 원소를 해시하면 고른 무작위 비트가 나온다. 앞에서부터 0 이 k 개 연속으로 나올 확률은 1/2ᵏ⁺¹ 이다. 서로 다른 원소를 많이 볼수록 "가장 긴 선행 0" 기록이 길어진다. 최대 기록이 k 면 대략 2ᵏ 개를 봤다고 추정할 수 있다. 같은 원소는 같은 해시를 내므로 **중복은 자동으로 무시된다**.

**분산 줄이기**: 기록 하나는 운에 크게 좌우된다. 그래서

1. 해시의 앞 b 비트로 m = 2ᵇ 개 **레지스터** 중 하나를 고른다.
2. 나머지 비트에서 처음 1 이 나오는 위치(선행 0 개수 + 1)를 구해 그 레지스터의 최댓값을 갱신한다.
3. 추정은 레지스터 값들의 **조화 평균**에 보정 상수 α_m 을 곱해 계산한다. 조화 평균은 운 좋게 튄 큰 값의 영향을 줄인다.
4. 추정치가 작고(약 2.5m 이하) 비어 있는 레지스터가 있으면, 빈 레지스터 비율로 세는 **linear counting** 으로 바꾼다.

표준 오차는 약 **1.04/√m** 이다. 레지스터는 몇 비트(보통 6비트)면 되므로 메모리는 원소 수와 무관하다.

| 레지스터 수 m | 표준 오차 | 메모리(6비트 레지스터) |
| --- | --- | --- |
| 2¹⁰ = 1,024 | 약 3.25% | 약 768B |
| 2¹² = 4,096 | 약 1.63% | 약 3KB |
| 2¹⁴ = 16,384 | 약 0.81% | 약 12KB |

**병합**: 두 HLL 의 레지스터별 **최댓값**을 취하면 합집합의 HLL 이 된다. 시간대별 HLL 을 저장해 두고 "이번 주 순방문자"를 그때그때 합칠 수 있다. 교집합은 포함-배제(|A|+|B|−|A∪B|)로 구할 수는 있지만 오차가 커진다.

**HLL++**(Heule 등, Google, 2013)은 64비트 해시로 큰 범위 보정을 없애고, 작은 범위의 편향을 경험적으로 보정하며, 원소가 적을 때는 희소 표현을 쓰다가 커지면 조밀 표현으로 바꾼다.

## Count-Min Sketch: 원소별 빈도

Graham Cormode 와 S. Muthukrishnan 이 2003년에 고안하고 2005년 논문으로 발표했다.

- d 행 × w 열 카운터 표. 행마다 서로 다른 해시 함수.
- **추가**: 원소를 행마다 해시해 그 칸을 1(또는 가중치만큼) 올린다.
- **질의**: 행마다 해당 칸을 읽어 **최솟값**을 답한다.
- 다른 원소와 칸을 공유(충돌)하면 값이 **부풀기만** 하고 줄지는 않는다. 그래서 최솟값이 가장 덜 오염된 추정이고, **과소 추정은 절대 없다**.
- w = ⌈e/ε⌉, d = ⌈ln(1/δ)⌉ 로 잡으면, 전체 스트림 크기가 N 일 때 오차가 εN 이하일 확률이 1−δ 이상이다.
- **병합**: 같은 크기·같은 해시라면 칸별로 **더하면** 된다(선형 스케치). 분산 집계에 맞다.

### 구현

```ts
// FNV-1a + murmur3 fmix32. seed 로 서로 다른 해시 함수를 흉내 낸다 (설명용)
function hash32(s: string, seed = 0): number {
  let h = (2166136261 ^ Math.imul(seed + 1, 0x9e3779b1)) >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

class HyperLogLog {
  private readonly m: number;
  private readonly reg: Uint8Array;
  constructor(private readonly b = 12) { // 레지스터 2^12 = 4096 개, 표준 오차 ≈ 1.04/√4096 ≈ 1.6%
    this.m = 1 << b;
    this.reg = new Uint8Array(this.m);
  }
  add(x: string): void {
    const h = hash32(x);
    const idx = h >>> (32 - this.b);                                // 앞 b 비트 → 레지스터 번호
    const rest = (h << this.b) >>> 0;                               // 나머지 비트
    const rank = Math.min(Math.clz32(rest) + 1, 32 - this.b + 1);  // 처음 1 이 나오는 위치
    if (rank > this.reg[idx]) this.reg[idx] = rank;
  }
  count(): number {
    const m = this.m, alpha = 0.7213 / (1 + 1.079 / m);
    let sum = 0, zeros = 0;
    for (const r of this.reg) { sum += 2 ** -r; if (r === 0) zeros++; }
    const e = (alpha * m * m) / sum;                                  // 조화 평균 기반 추정
    return e <= 2.5 * m && zeros > 0 ? m * Math.log(m / zeros) : e;  // 작을 땐 linear counting
  }
  merge(o: HyperLogLog): void { // 합집합 = 레지스터별 최댓값
    for (let i = 0; i < this.m; i++) this.reg[i] = Math.max(this.reg[i], o.reg[i]);
  }
}

class CountMinSketch {
  readonly w: number;
  readonly d: number;
  private readonly table: Uint32Array;
  constructor(eps: number, delta: number) { // 오차 ≤ eps·N 일 확률 ≥ 1 - delta
    this.w = Math.ceil(Math.E / eps);
    this.d = Math.ceil(Math.log(1 / delta));
    this.table = new Uint32Array(this.w * this.d);
  }
  private cell(x: string, row: number): number { return row * this.w + (hash32(x, row) % this.w); }
  add(x: string, c = 1): void { for (let r = 0; r < this.d; r++) this.table[this.cell(x, r)] += c; }
  estimate(x: string): number { // 행마다 충돌로 부풀 수만 있으므로 최솟값이 가장 정확
    let min = Infinity;
    for (let r = 0; r < this.d; r++) min = Math.min(min, this.table[this.cell(x, r)]);
    return min;
  }
}

const a = new HyperLogLog(), b = new HyperLogLog();
for (let i = 0; i < 1_000_000; i++) a.add(`user:${i}`);
for (let i = 500_000; i < 1_500_000; i++) b.add(`user:${i}`);
console.log(Math.round(a.count()));  // 990829 (참값 1,000,000, 약 -0.9%)
a.merge(b);
console.log(Math.round(a.count()));  // 1486434 (참값 1,500,000)

const cms = new CountMinSketch(0.001, 0.01); // w = 2719, d = 5 → 카운터 13,595 개
for (let i = 0; i < 100_000; i++) cms.add(`item:${i % 1000 === 0 ? 'hot' : i}`);
console.log(cms.w, cms.d, cms.estimate('item:hot'), cms.estimate('item:7'));
// 2719 5 131 30 — 참값은 100 과 1. 과대 추정만 있고, 오차는 εN = 100 이내
```

32비트 해시는 원소가 수억 개를 넘으면 충돌로 HLL 추정이 틀어진다(원 논문의 큰 범위 보정, 또는 HLL++ 처럼 64비트 해시가 필요). 실제로는 검증된 라이브러리를 쓴다.

출력에서 보듯 **CMS 는 작은 빈도에 약하다.** 참값 1 인 원소가 30 으로 나왔다. 오차가 εN(전체 합 기준)이라서, 전체에서 비중이 작은 원소는 상대 오차가 매우 크다.

## 복잡도

| | HyperLogLog | Count-Min Sketch | (참고) 블룸 필터 |
| --- | --- | --- | --- |
| 답하는 질문 | 서로 다른 원소가 **몇 개**? | 이 원소가 **몇 번**? | 이 원소가 **있나**? |
| 추가 | O(1) | O(d) | O(k) |
| 질의 | O(m) (레지스터 수, 고정) | O(d) | O(k) |
| 메모리 | O(m), 원소 수와 무관 | O(w·d), 원소 수와 무관 | O(n), 원소당 비트 |
| 오차 방향 | 위아래 모두(표준 오차 1.04/√m) | **과대만**(εN 이내, 확률 1−δ) | 거짓 양성만 |
| 병합 | 레지스터별 max (합집합) | 칸별 합 | 비트별 OR (합집합) |
| 삭제 | 불가 | 음수 증가로 가능하나 보장이 깨질 수 있음 | 불가 |

## 언제 쓰나

**HyperLogLog**
- 순 방문자(UV), 고유 사용자·기기·IP 수, 고유 검색어 수.
- 대시보드에서 기간·차원별로 미리 만든 스케치를 **합쳐서** 보여 줄 때. 정확한 `COUNT(DISTINCT)` 는 합칠 수 없다(구간별 고유 수를 더하면 중복이 이중으로 세진다).
- 분산 쿼리 엔진의 근사 `COUNT DISTINCT` 함수.

**Count-Min Sketch**
- 빈도가 높은 원소(heavy hitter) 찾기: 인기 검색어, 트래픽이 큰 IP·URL, 네트워크의 큰 흐름(elephant flow). 보통 상위 k 개를 [힙](/develop-wiki/knowledge/algorithms/heap-priority-queue/)으로 따로 유지한다.
- 레이트 리밋·남용 탐지에서 키별 대략적인 요청 수.
- 데이터베이스 질의 최적화기의 빈도 통계, 캐시 입장 정책(자주 요청된 키만 캐시에 넣기).

## 주의

- **근사치임을 사용자에게 밝힌다.** 과금·정산·감사처럼 정확해야 하는 수치에는 쓰지 않는다.
- HLL 은 작은 카디널리티에서 편향이 있다(그래서 linear counting·HLL++ 보정이 있다). 원소가 몇 개뿐이면 그냥 집합을 쓰는 편이 정확하고 작다.
- HLL 교집합·차집합은 포함-배제로 구하면 오차가 커진다. 교집합 비중이 작을수록 상대 오차가 폭발한다.
- **CMS 의 작은 빈도 값은 버린다.** Redis 문서는 오차율 × 전체 개수(임계값)보다 작은 결과는 무시하거나 0 으로 보라고 권한다. 고르게 분포된 스트림에는 CMS 가 잘 맞지 않고, 치우친(skewed) 분포에서 큰 값을 찾을 때 강하다.
- **보수적 갱신**(conservative update: 현재 추정치보다 낮은 칸만 끌어올림)은 과대 추정을 줄이지만 선형성이 깨져 음수 갱신을 못 한다.
- 해시가 좋아야 한다. 공격자가 해시를 예측할 수 있으면 의도적으로 충돌을 만들어 특정 원소의 빈도를 부풀릴 수 있다. 외부 입력에는 시드를 비밀로 둔다.
- 병합하려는 스케치는 **같은 파라미터(m 또는 w·d)와 같은 해시 함수**로 만들어야 한다.
- 개인정보: HLL 은 원소를 저장하지 않아 집계용으로 유리하지만, 레지스터에서 특정 ID 의 포함 여부를 추측하는 공격이 연구돼 있다. 익명화의 대체물로 보지 않는다.

## 실무에서

- **Redis HyperLogLog**: `PFADD`·`PFCOUNT`·`PFMERGE` 명령. 공식 문서에 따르면 키 하나가 최대 12KB 를 쓰고 표준 오차는 0.81% 이며(m = 16,384 와 일치), 원소가 적을 때는 훨씬 작게 저장된다. 최대 2⁶⁴ 개까지 추정한다. 내부적으로 문자열로 인코딩돼 `GET`/`SET` 으로 직렬화할 수 있다. 문서는 하루·페이지별 HLL 을 두고 방문마다 IP 를 넣는 순방문자 집계를 예로 든다.
- **Redis Count-Min Sketch**: `CMS.INITBYPROB key error probability` 로 오차율과 확률을 주면 크기를 정한다. 문서 예시는 오차 0.001, 확률 0.002 로 폭 2000, 깊이 9 를 만든다. `CMS.INCRBY`·`CMS.QUERY`·`CMS.MERGE` 를 제공한다.
- 블룸 필터 → HLL → CMS 순으로 "있나 → 몇 개 → 몇 번"이 이어진다. 세 구조 모두 해시와 비트/카운터 배열로 [공간과 정확도를 맞바꾸는](/develop-wiki/knowledge/algorithms/space-time-tradeoff/) 같은 발상이다.

> 원 논문: P. Flajolet, É. Fusy, O. Gandouet, F. Meunier, "HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm", AofA 2007. G. Cormode, S. Muthukrishnan, "An improved data stream summary: the count-min sketch and its applications", Journal of Algorithms 55(1), 2005.
