---
title: Consensus-RecSplit (시드 검색과 부호화를 합쳐 공간 하한에 다가가는 최소 완전 해시)
aka: [Consensus-RecSplit, CONSENSUS, Combined Search and Encoding for Successful Seeds, Seed Search and Encoding Problem, SSEP, Bucketed Consensus-RecSplit, 시드 부호화, 합의 RecSplit]
category: algorithms
group: data-structure
level: advanced
summary: 무작위 자료구조가 저장하는 "성공한 시드" 여러 개를 각자 최소값으로 찾지 않고 백트래킹으로 함께 골라 고정 폭으로 부호화해, 시드당 낭비를 Ω(1)비트에서 ε비트로 줄이는 기법과, 이를 이진 분할 RecSplit 에 적용해 약 1.444비트/키에 이른 최소 완전 해시.
tags: [perfect-hashing, mphf, recsplit, consensus, seed-encoding, backtracking, space-optimal, succinct]
related: [algorithms/shockhash, algorithms/recsplit-vs-bbhash, algorithms/perfect-hashing-pthash, algorithms/pthash-vs-recsplit-benchmarks, algorithms/mphf-selection-shockhash-pthash-ptrhash, algorithms/backtracking, algorithms/space-time-tradeoff, algorithms/hash-table]
sources:
  - https://arxiv.org/abs/2502.05613
  - https://github.com/ByteHamster/ConsensusRecSplit
  - https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.ESA.2025.109
updatedAt: 2026-11-19
---

[ShockHash](/develop-wiki/knowledge/algorithms/shockhash/) 노트는 최소 완전 해시(MPHF)의 공간 하한(키당 log₂e ≈ 1.443비트)에 다가가는 한 방법을 다뤘고, [MPHF 고르기](/develop-wiki/knowledge/algorithms/mphf-selection-shockhash-pthash-ptrhash/) 노트는 Consensus-RecSplit 을 표 한 줄로만 인용했다. 이 노트는 그 원논문(Lehmann·Sanders·Walzer·Ziegler, *Combined Search and Encoding for Seeds, with an Application to Minimal Perfect Hashing*, arXiv 2502.05613v2, 2025-07-02)을 읽고 정리한다.

## 문제: 최소 시드를 저장하면 시드마다 손해를 본다

- 많은 MPHF(RecSplit, PTHash, ShockHash 등)는 키를 작은 버킷으로 나누고, 버킷마다 "이 해시 시드로 하면 잘 나뉜다"는 **성공 시드**를 시행착오로 찾아 저장한다. 시드가 전체 공간의 대부분을 차지할 수 있다.
- 논문은 이를 **SSEP**(시드 검색·부호화 문제)로 추상화한다. i 번째 시드가 성공할 확률이 pᵢ 일 때, 비트열 길이의 하한은 Σ log₂(1/pᵢ), 검사 횟수의 하한은 시드마다 1/pᵢ 이다.
- 흔한 방법 **MIN**(각자 가장 작은 성공 시드를 찾아 최적 부호화)은 검사 횟수는 최적이지만, 하한보다 Σ(1−pᵢ) 비트 이상 더 쓴다(보조정리 2). pᵢ 가 1 에서 떨어져 있으면 시드마다 상수 비트 손해다.
- 반대 극단 **UNI**(모든 버킷에 동시에 통하는 시드 하나)는 공간이 최적이지만 검사 횟수가 지수적이다.

## 해법: CONSENSUS

- 각 시드 i 에 대해 고정 폭 조각 σᵢ(ℓᵢ 비트)만 저장한다. 폭은 누적으로 Σℓⱼ = ⌈εi + Σ log₂(1/pⱼ)⌉ 이 되게 정한다. 그러면 σᵢ 의 후보 수는 대략 2^ε/pᵢ 개로, **기대 성공 후보가 1 개보다 약간 많다.**
- 실제 시드 Sᵢ 는 σ₀∘σ₁∘…∘σᵢ, 즉 **앞 조각들을 이어 붙인 값**(구현에서는 그 마지막 w 비트, w=64 면 충분하다고 논문은 예상)이다. 그래서 σᵢ 에서 성공 후보가 하나도 없으면 앞 조각을 바꿔 다시 시도할 수 있다.
- 탐색은 트리 깊이 우선 탐색(백트래킹)이다. 맨 앞 σ₀ 만 가변이고 나머지는 고정 폭이라 i 번째 시드의 위치가 미리 정해진다. 질의 때 상수 시간에 꺼낼 수 있다.
- 결과(정리 7): 높은 확률로 길이 ⌈Σlog₂(1/pᵢ) + εn + w⌉, 시드당 기대 검사 횟수 O((1/pᵢ)/ε). 즉 **공간 낭비를 시드당 ε 비트로 줄이는 대가로 작업이 1/ε 배 는다.**

```ts
// 시드 조각 폭: 누적 길이가 ceil(eps*i + b*i) 가 되도록 (모든 p 가 같을 때 b = log2(1/p))
export function fragmentWidths(n: number, b: number, eps: number): number[] {
  const out: number[] = [];
  let prev = 0;
  for (let i = 1; i <= n; i++) {
    const total = Math.ceil(eps * i + b * i - 1e-9);
    out.push(total - prev); // 조각 i 의 비트 수
    prev = total;
  }
  return out; // p=1/4, eps=0.5 → [3,2,3,2,...] 평균 2.5비트
}
```

### 직접 실행: MIN vs CONSENSUS

모든 pᵢ = 1/4(하한 2비트/시드), n = 4000, 성공 여부를 해시로 흉내 낸 모형(`consensus-sim.mjs`).

| 방식 | 비트/시드 | 검사/시드 |
| --- | --- | --- |
| MIN(기하분포 엔트로피로 최적 부호화한 경우) | 3.245 | 3.98 |
| CONSENSUS ε=1 | 3.000 | 4.77 |
| CONSENSUS ε=0.5 | 2.500 | 6.87 |
| CONSENSUS ε=0.25 | 2.250 | 11.13 |
| CONSENSUS ε=0.1 | 2.100 | 20.88 |

ε 를 줄일수록 공간이 하한 2비트에 붙고 작업이 대략 1/ε 에 비례해 는다. MIN 은 엔트로피 부호화를 해도 하한보다 1.2비트 넘게 쓴다(맨 앞 σ₀ 몇 비트는 전체에 한 번이라 표에서 뺐다).

## MPHF 에 적용: Consensus-RecSplit

- **단일(monolithic) 판**: n = 2^d 개 키를 균형 이진 트리로 반씩 나눈다. 내부 노드마다 "정확히 반으로 가르는" 2갈래 분할 함수의 시드가 필요하다. 층마다 CONSENSUS 구조 하나를 둔다. 성공 확률이 층마다 같아 시드 위치 계산이 쉽다.
  - 분할 성공 확률 곱이 n!/nⁿ 이 되어 주항이 정확히 n·log₂e − O(log n), 즉 하한과 같다(정리 12). 공간은 하한 + O(εn + log²n), 구성 O(max(n^1.5, n/ε)), 질의 O(log n).
- **버킷 판**: 위쪽 층(분할이 가장 비싼 곳)을 최소 k-완전 해시로 대체한다. k 개씩 버킷으로 나눈 뒤 각 버킷만 이진 분할한다. 공간 (1+O(ε))·하한, 기대 구성 O(n/ε), 질의 O(log 1/ε)(정리 5, ε ∈ [n^(−3/7), 1]).
- 논문은 이것이 "구성 시간이 1/ε 에 **선형**으로만 느는" 첫 MPHF 라고 주장한다. 기존 RecSplit·ShockHash 계열은 1/ε 에 지수적으로 는다.

### 논문 표 (부록 F, 1억 개 무작위 문자열 키, i7-11700 단일 스레드)

| 구성 | 비트/키 | 구성 ns/키 | 질의 ns |
| --- | --- | --- | --- |
| Bipartite ShockHash-RS ℓ=128 | 1.489 | 183,691 | 133 |
| SIMDRecSplit ℓ=16 | 1.560 | 126,772 | 133 |
| RecSplit ℓ=12 | 1.613 | 25,667 | 139 |
| CONSENSUS k=512, ε=0.03 | 1.494 | 584 | 150 |
| CONSENSUS k=32768, ε=0.006 | 1.452 | 2,815 | 217 |
| CONSENSUS k=32768, ε=0.0005 | 1.444 | 30,245 | 199 |

- 같은 1.49비트 부근에서 구성이 수백 배 빠르고(논문: 1.489비트에서 350배 넘게), 1.444비트는 기존 최소 공간 구성(1.489)보다 작으면서 구성 시간은 그 약 15%다.
- 질의는 150~250ns 로 RecSplit(약 100ns)·Bipartite ShockHash-RS(약 125ns)보다 느리다. 분할 트리 깊이만큼 시드를 여러 곳에서 꺼내기 때문이다.
- [MPHF 고르기](/develop-wiki/knowledge/algorithms/mphf-selection-shockhash-pthash-ptrhash/) 노트의 Consensus-RecSplit 행(1.49비트, 질의 528ns)은 PtrHash 논문이 다른 기계·다른 설정으로 잰 값이다. 두 표를 섞어 비교하지 않는다.

## 언제 쓰나

- 키 집합이 정적이고 매우 크며, 구조를 오래 두고 쓰거나 네트워크·디스크로 배포해서 **비트/키가 가장 비싼** 경우(예: 압축 인덱스, 대형 사전).
- ShockHash 계열로 1.5비트 아래를 노렸지만 구성 시간이 감당이 안 될 때.
- 해시 자료구조를 직접 설계하며 "버킷마다 시드를 따로 저장"하고 있다면, 그 시드 저장에만 이 기법을 따로 적용할 수 있는지 검토할 때. 논문도 k-완전 해시·retrieval·필터로의 확장을 언급한다.

## 주의 (비용)

- **질의가 느리다.** 질의 지연이 중요하면 [PtrHash·PTHash](/develop-wiki/knowledge/algorithms/mphf-selection-shockhash-pthash-ptrhash/) 쪽이 맞다. 논문은 시드를 버킷 단위로 모으면 질의가 최대 30% 빨라진다는 예비 결과만 적는다.
- **구성이 순차적이다.** 백트래킹은 앞 조각에 의존하므로 병렬화가 어렵다. 논문은 병렬화를 향후 과제로 둔다. 실험도 단일 스레드다.
- **ε 를 아주 작게 하면 여전히 비싸다.** 1.444비트 지점은 키당 약 30µs 로, 1억 개면 단일 스레드 약 50분이다(표 값으로 계산).
- **정적 구조다.** 키를 추가·삭제하면 다시 만든다.
- **성숙도.** 구현 저장소는 GPL-3.0 이고, 논문은 실험 구현이 본문 설명과 다른 k-완전 해시를 쓴다고 밝힌다. ESA 2025(LIPIcs 351, 109:1–109:18)에 게재됐고, arXiv v2 는 확장판이다. 운영 투입 전 라이선스와 유지 상태를 확인한다.
- 이론 결과에는 "단순 균등 해싱 가정"(시드마다 독립 균등 해시 함수)이 깔려 있다.

> 검증 범위: arXiv 2502.05613v2 PDF 를 텍스트로 추출해 1~5절, 정리 4~7·12·5, 부록 E(k-완전 해시 개요)와 부록 F 표를 읽었다. 3·4절 증명은 흐름만 따라갔고 검증하지 않았다. 저장소는 GitHub API 로 라이선스(GPL-3.0)·언어(C++)만 확인했다(2026-11-19). MIN 대 CONSENSUS 표는 논문 알고리즘을 Node 로 옮겨 직접 실행한 모형이다(스크래치 `dist/consensus-sim.mjs`, 성공 판정은 SHA-256 해시로 흉내). 실제 Consensus-RecSplit 구현을 빌드·실행하지 않았다. 미확인: 저장소의 최신 성능, 병렬 버전 존재 여부.
