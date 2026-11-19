---
title: ShockHash (쿠쿠 해시 과적재로 만드는 거의 최적 공간 최소 완전 해시)
aka: [ShockHash, Bipartite ShockHash, ShockHash-RS, ShockHash-Flat, Pseudoforest MPHF, Cuckoo Overloading, 의사숲 완전 해시]
category: algorithms
group: data-structure
level: advanced
summary: 키마다 해시 함수 두 개 중 하나를 고르는 1비트 선택을 별도 검색 구조에 저장해, 무차별 시드 탐색보다 지수적으로 적은 시도로 최소 완전 해시 이론 하한(약 1.44비트/키)에 다가가는 구성법.
tags: [perfect-hashing, mphf, shockhash, cuckoo-hashing, pseudoforest, retrieval, recsplit, space-optimal]
related: [algorithms/perfect-hashing-pthash, algorithms/pthash-vs-recsplit-benchmarks, algorithms/recsplit-vs-bbhash, algorithms/hash-table, algorithms/union-find, algorithms/space-time-tradeoff, algorithms/ribbon-binary-fuse-filters, algorithms/quotient-xor-filter, algorithms/mphf-selection-shockhash-pthash-ptrhash]
sources:
  - https://arxiv.org/abs/2310.14959
  - https://github.com/ByteHamster/ShockHash
updatedAt: 2026-11-19
---

[PTHash 와 RecSplit 벤치마크](/develop-wiki/knowledge/algorithms/pthash-vs-recsplit-benchmarks/) 노트 끝에서 "후속 연구가 이 균형을 바꾼다"고 했다. ShockHash 는 그중 **공간 하한 쪽**의 사례다. 이 노트는 논문(arXiv 2310.14959)의 구성 아이디어와, 작은 n 에서 직접 확인한 성질, 논문 표의 수치를 정리한다.

## 문제

최소 완전 해시 함수(MPHF)는 n 개 키를 겹침 없이 정확히 0..n−1 에 대응시킨다. 키 자체를 저장하지 않으므로 필요한 공간에 이론 하한이 있다. 논문은 `n·log₂e − O(log n) ≈ 1.44n` 비트라고 적는다. 이 하한에 닿는 가장 단순한 방법은 **무차별 탐색**이다. 시드를 바꿔 가며 해시를 만들어 보고 충돌 없는 첫 시드를 저장한다. 성공 확률이 대략 `n!/nⁿ ≈ e⁻ⁿ` 라서 평균 `eⁿ` 번 시도해야 한다. RecSplit 처럼 공간 효율이 좋은 구성이 모두 이 무차별 탐색을 "작은 조각" 단위로 쓰는데, 조각 크기를 키울수록 공간은 줄지만 시간이 지수적으로 는다.

## 해법

핵심은 한 시드에서 **한 번의 시도로 2ⁿ 가지를 동시에 검사**하는 것이다.

1. 시드 하나가 해시 함수 두 개 `h₀, h₁` 을 정한다. 키 x 는 `h₀(x)`, `h₁(x)` 두 후보 칸을 가진다.
2. 키마다 둘 중 하나를 고르는 함수 `f(x) ∈ {0,1}` 가 있어서 `x ↦ h_{f(x)}(x)` 가 전단사(MPHF)가 되면 성공이다.
3. 그래프로 보면 칸이 노드, 키가 두 후보 칸을 잇는 간선이다. n 노드·n 간선 그래프의 모든 연결 요소가 **간선 수 ≤ 노드 수**(의사숲, pseudoforest)이면 간선마다 한 노드를 배정하는 방향이 존재한다(쿠쿠 해싱이 성공하는 조건과 같다). 방향이 곧 `f` 이다.
4. 저장물은 **성공한 시드**와 **`f`**(키마다 1비트) 둘이다. `f` 는 1비트 retrieval 구조(키를 저장하지 않고 함수값만 `n + o(n)` 비트로 보관)에 넣는다. 질의는 retrieval 로 `f(x)` 를 얻고 `h_{f(x)}(x)` 를 계산한다.
5. 시드를 몇 번 시도해야 하는지는 논문이 약 `(e/2)ⁿ ≈ 1.359ⁿ` 번(다항 요소 제외)으로 분석한다. 시드 저장에 필요한 공간이 약 `n·log₂(e/2) ≈ 0.44n` 비트이고 `f` 에 `n` 비트가 들어 합계가 1.44n 근처다. 무차별 탐색은 시드에 1.44n 비트를 쓰던 것이 시도 횟수는 2ⁿ 배 가까이 줄어든다는 뜻이다.

작은 코드로 구조를 옮기면 이렇다(직접 작성, 키·해시는 예시용).

```ts
// 시드 s 에서 n 개 키가 "의사숲"이면 f(비트)를 돌려준다. 아니면 null.
function tryShock(keys: number[], n: number, s: number, h: (s:number,w:0|1,k:number)=>number) {
  const adj = keys.map(k => [h(s,0,k) % n, h(s,1,k) % n]);   // 간선 = [후보0, 후보1]
  if (new Set(adj.flat()).size < n) return null;              // 빠른 필터: 어느 칸도 후보가 아니면 불가
  const cellOf = Array(n).fill(-1);                           // 칸 -> 키 (이분 매칭)
  const place = (k: number, seen: boolean[]): boolean => {
    for (const c of adj[k]) { if (seen[c]) continue; seen[c] = true;
      if (cellOf[c] < 0 || place(cellOf[c], seen)) { cellOf[c] = k; return true; } }
    return false; };
  for (let k = 0; k < n; k++) if (!place(k, Array(n).fill(false))) return null;
  return keys.map((_, k) => (adj[k][0] === cellOf.indexOf(k) ? 0 : 1)); // 이 비트들이 retrieval 에 저장됨
}
```

위 코드는 n=10 키 200 집합에서 실제로 전단사를 만드는 것을 확인했다. 실제 구현은 매칭 대신 선형 시간의 쿠쿠 삽입이나 연결 요소 검사를 쓴다. 위 코드는 구조 설명용이며 성능은 의도하지 않았다.

### 두 가지 가속

- **비트 마스크 필터**: 어떤 칸도 어느 키의 후보가 아니면 쿠쿠 구성이 불가능하다. 이를 시프트·비교 몇 번으로 먼저 걸러, 비싼 의사숲 검사를 하는 시드를 지수적으로 적게 만든다. 논문은 시드가 필터를 통과할 확률이 `(1 − e⁻²)ⁿ ≈ 0.864ⁿ` 이하라고 보이고, 더 정밀한 분석으로 약 `0.836ⁿ` 이라고 인용한다.
- **Bipartite ShockHash**: 두 해시 함수의 치역을 서로소 구간으로 나누어(이분 그래프) 각 함수가 따로 전사여야 한다는 조건으로 후보를 **따로 걸러 놓고 짝만 맞춘다.** 후보 풀의 모든 쌍을 검사해 기대 시간이 약 `1.166ⁿ` 로 줄어든다(논문은 상한 `O(1.166ⁿ)` 로 말한다).

### 실전 구성: ShockHash-RS

지수 시간 알고리즘이라 키 전체에 쓰지 않는다. RecSplit 의 틀(키를 버킷으로 나누고 재귀 분할한 뒤 작은 리프에서 무차별 탐색)에서 **리프의 탐색을 ShockHash 로 바꾼 것**이 ShockHash-RS 다. k-완전 해시로 입력을 나누는 변형은 ShockHash-Flat 이다.

## 직접 돌려 본 것 (작은 n 모형)

- n=3,4,5 에서 가능한 모든 해시 조합(`n²ⁿ` 가지)을 세었다. 의사숲이 될 확률은 0.716/0.569/0.444 이고 무차별 방식(단일 해시가 전단사)은 0.222/0.094/0.038 로, 비율이 3.2/6.1/11.6 배로 커졌다.
- n=6,8,10,12 에서 무작위 실험(200만~600만 번): 의사숲 확률 0.342/0.201/0.115/0.065, 비율은 22/83/330/1176 배로 n 이 2 늘 때마다 약 4배, 즉 `2ⁿ` 에 비례해 커졌다. 모든 칸이 후보로 덮일 확률(필터 통과)은 n=12 에서 0.150 으로 `0.864¹²≈0.17` 이하다.
- 키 집합 150개마다 시드를 실제로 찾고, 찾은 매핑이 전단사인지 검증했다. 평균 시도 횟수(시드 수):

| n | 무차별 탐색 | ShockHash | 비율 |
| --- | --- | --- | --- |
| 8 | 412 | 5 | 79배 |
| 10 | 2,844 | 9 | 330배 |
| 12 | 20,165 | 16 | 1,253배 |

무차별 쪽 평균은 이론값 `nⁿ/n!`(416/2756/18614)과 일치했다. 비율이 지수적으로 커지는 것은 확인했다. 이 모형은 시드 시도 횟수만 센 것이고 시도당 비용(의사숲 검사가 더 비싸다)과 retrieval 구조 공간은 포함하지 않았다.

## 논문이 보고한 수치 (N=1000만 키, Intel i7-11700, 단일 스레드, 길이 10~50 문자열)

| 구성 | 비트/키 | 구성 ns/키 | 질의 ns |
| --- | --- | --- | --- |
| PTHash (c=6, EF) | 2.345 | 247 | 34 |
| RecSplit (n=14, b=2000) | 1.585 | 125,521 | 97 |
| SIMDRecSplit (n=16, b=2000) | 1.560 | 137,902 | 100 |
| ShockHash-RS (n=58, b=2000) | 1.523 | 112,072 | 121 |
| Bipartite ShockHash-RS (n=128, b=2000) | 1.489 | 188,041 | 113 |
| Bipartite ShockHash-Flat (n=100) | 1.547 | 9,620 | 62 |

- 같은 공간(약 1.56비트/키) 비교에서 논문은 ShockHash-RS 가 SIMDRecSplit 보다 약 76배 빠르게 구성된다고 쓰고, 1.53비트/키 부근에서 SIMDRecSplit 이 15시간 넘게 걸리는 구성을 bipartite 버전이 57초에 만든다고 보고한다.
- 질의는 RecSplit 계열보다 조금 느리다(retrieval 접근이 하나 더). 표에서 ShockHash-RS 는 121~123ns, Bipartite 변형은 113~131ns, RecSplit 계열은 74~108ns(b=2000 구성은 94~108ns)이다. 구성에 따라 차이가 달라 일률적으로 느리다고 하긴 어렵다. Flat 은 공간을 약간 더 쓰는 대신 질의가 빠르다.
- 이론 하한 1.442비트/키에서 1.489비트/키는 3.3% 이내라고 논문이 적는다.

## 언제 쓰나

- 키 집합이 **고정**이고 **비트/키 단위 절약**이 의미 있을 만큼 키가 많은 읽기 전용 색인(정적 키-값 저장소, 사전, 대규모 인덱스의 키→위치 함수). 구성은 한 번, 질의는 수없이 하는 경우다.
- 구성 시간을 몇 시간씩 쓸 수 있어 RecSplit 계열을 이미 검토했던 경우의 대안.

## 주의 (비용)

- **구성이 느리다.** 가장 좋은 공간 구성은 키당 수백 µs 규모(위 표 188µs/키)다. 질의 위주 PTHash(키당 수백 ns)와 약 3자릿수 차이이므로 "더 새 것이 낫다"가 아니라 공간 하한을 쫓을 때만 의미가 있다.
- **질의가 PTHash 보다 느리다**(위 표 113~131ns 대 34ns). 질의가 병목이면 부적합하다.
- 정적 구조라 키가 바뀌면 다시 만든다. 구성 중 키 집합이 필요하며, 적대적 입력이면 [해시 함수 선택](/develop-wiki/knowledge/algorithms/hash-functions-hashdos/) 문제도 따른다.
- 수치는 논문 저자들이 한 대의 기계와 자체 구현·설정으로 낸 것이다. 다른 하드웨어·데이터·라이브러리 버전에서의 재현은 이 노트에서 하지 않았다. 구성 중 메모리 사용량도 읽지 않았다.
- 논문은 평균 시도 횟수 측정값이 자신의 분석 상한보다 좋다고 하며(분석이 촘촘하지 않다고), 이를 추측으로만 적는다. 이론은 아직 앞서 나가는 단계다.

> 출처 확인 범위: arXiv 2310.14959 의 HTML 판에서 초록, 서론(기여·실험 요약), 2절(쿠쿠 해시·의사숲·retrieval·SicHash·RecSplit), 4절(ShockHash·필터 보조정리), 5절 도입, 9절(9.1~9.4, Table 1 전체)을 읽었다. 6절 증명, 7·8절(분할 방식·개선), 부록, 10절은 읽지 않았다. 표의 수치는 Table 1 에서 옮겼다. 작은 n 실험은 직접 작성해 실행했고 논문 구현(C++)은 실행하지 않았다. 논문은 ALENEX 2024 학회 논문을 기반으로 한 저널 판 사전 공개본으로 표기돼 있다.
