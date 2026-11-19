---
title: 최소 완전 해시 고르기 (ShockHash vs PTHash · PHOBIC vs PtrHash)
aka: [MPHF Selection, PtrHash, ShockHash vs PTHash, PTHash vs PtrHash, CacheLineEF, Streaming Queries, 최소 완전 해시 선택]
category: algorithms
group: data-structure
level: advanced
summary: 공간 하한에 다가가는 ShockHash 계열, 질의가 빠른 PTHash·PHOBIC, 질의를 메모리 대역폭 한계 근처까지 끌어올린 PtrHash 를 같은 논문 표 안의 수치로 비교해, 비트/키·구성 시간·질의 시간 중 무엇이 병목인지에 따라 고르는 기준을 정리한다.
tags: [perfect-hashing, mphf, ptrhash, pthash, phobic, shockhash, benchmark, space-time-tradeoff]
related: [algorithms/shockhash, algorithms/perfect-hashing-pthash, algorithms/pthash-vs-recsplit-benchmarks, algorithms/recsplit-vs-bbhash, algorithms/hash-table, algorithms/space-time-tradeoff, algorithms/static-filter-xor-fuse-ribbon-benchmarks, cs-fundamentals/cpu-cache-locality, algorithms/consensus-recsplit]
sources:
  - https://arxiv.org/abs/2502.15539
  - https://github.com/RagnarGrootKoerkamp/PtrHash
  - https://arxiv.org/abs/2310.14959
  - https://arxiv.org/abs/2404.18497
  - https://arxiv.org/abs/2104.10402
updatedAt: 2026-11-19
---

[ShockHash](/develop-wiki/knowledge/algorithms/shockhash/) 노트는 공간 하한 쪽, [PTHash 와 RecSplit 벤치마크](/develop-wiki/knowledge/algorithms/pthash-vs-recsplit-benchmarks/) 노트는 질의 쪽을 다뤘다. 이 노트는 그 뒤에 나온 **PtrHash**(Groot Koerkamp, SEA 2025, arXiv 2502.15539)를 더해, 세 계열 중 무엇을 고를지를 정리한다.

## 문제

최소 완전 해시 함수(MPHF)는 고정 키 n 개를 0..n−1 에 겹침 없이 대응시킨다. 고르는 축은 셋이다.

- **비트/키**: 이론 하한 약 1.44비트. 키가 수십억 개면 0.5비트 차이도 수백 MB 다.
- **구성 시간**: 한 번이지만, 키가 바뀔 때마다 다시 만든다.
- **질의 시간**: 대부분 메모리 접근 횟수로 결정된다.

세 축을 동시에 이기는 구성은 없다. 논문마다 기계·키 종류가 달라 숫자를 섞으면 안 된다.

## PtrHash 가 바꾼 것 (PTHash·PHOBIC 대비)

PTHash 계열은 키를 버킷으로 나누고 버킷마다 "파일럿" 정수를 찾아 저장한다. PtrHash 는 질의 경로를 줄이는 쪽으로 구조를 단순화했다.

- 파일럿을 **고정 8비트**로 두고 압축 없이 배열에 넣는다.
- 모든 파트가 같은 수의 버킷·슬롯을 가져 파트 오프셋 조회가 없다.
- 파일럿 탐색이 막히면 충돌한 버킷을 쫓아내고 다시 찾는다(쿠쿠 방식 축출).
- 범위를 벗어난 슬롯을 되돌리는 재매핑 표를 전역 하나로 두고, 캐시 라인 단위 Elias-Fano(**CacheLineEF**)로 저장해 조회가 캐시 라인 하나만 건드리게 했다.
- **스트리밍 질의**: 키를 미리 알 때 프리페치로 여러 질의를 겹쳐 처리한다.

## 같은 표 안의 비교 (PtrHash 논문 Table 2)

환경: Intel i7-10750H, 무작위 문자열 3억 개(길이 10~50), 구성 6스레드(*표시는 단일 스레드 측정, 괄호는 6스레드 환산 추정).

| 구성 | 비트/키 | 구성 ns/키 | 질의 ns |
| --- | --- | --- | --- |
| Consensus-RecSplit k=512 | 1.49 | 1199* (200) | 528 |
| Bipartite ShockHash-Flat n=64 | 1.62 | 2140* (357) | 201 |
| SIMDRecSplit n=8, b=100 | 1.81 | 66 | 258 |
| PHOBIC λ=7.0, IC-R | 1.86 | 446 | 157 |
| PTHash λ=5.0, EF | 2.17 | 765 | 156 |
| PtrHash Compact (λ=4.0) | 2.12 | 63 | 35 (스트리밍 23) |
| PtrHash Default (λ=3.5) | 2.40 | 32 | 37 (스트리밍 23) |
| PHOBIC λ=6.5, IC-C | 2.44 | 220 | 108 |
| PtrHash Fast (λ=3.0) | 2.99 | 27 | 33 (스트리밍 16) |
| PTHash λ=4.0, C-C | 3.19 | 403 | 77 |

- 비슷한 공간(약 2.1~2.4비트)에서 PtrHash 는 PTHash·PHOBIC 보다 질의가 약 3~4.5배 빠르고(35 대 156ns, 37 대 108ns) 구성도 빠르다. 논문은 Default 가 가장 빠른 PTHash 구성보다 질의 2.1배(스트리밍 3.3배), 구성 5배 이상 빠르다고 적는다.
- 공간은 PtrHash 가 지지 않는 축이 아니다. 1.5~1.9비트 영역은 Consensus-RecSplit·ShockHash·SIMDRecSplit·PHOBIC 몫이고, 대신 PtrHash Default(37ns) 대비 질의가 약 4~14배 느리다(157~528ns).
- 정수 키 10억 개(Table 1)에서는 루프 질의 약 12~21ns, 스트리밍 약 8.6~8.8ns 로 논문이 계산한 캐시 라인당 메모리 한계 7.4ns 에 가깝다.

ShockHash 논문 자체의 표(1천만 키, i7-11700, 단일 스레드)에서는 Bipartite ShockHash-RS 가 1.489비트/키에 구성 188,041ns/키, 질의 113ns, PTHash(c=6, EF)는 2.345비트/키에 구성 247ns/키, 질의 34ns 였다. 기계·키 수가 다르므로 위 표와 섞지 않는다.

## 고르는 기준

| 병목 | 후보 | 이유 |
| --- | --- | --- |
| 질의 처리량(특히 일괄 질의) | PtrHash | 질의 30ns대, 스트리밍으로 메모리 대역폭 근처 |
| 질의 + 기존 C++ 생태계 | PTHash / PHOBIC | 같은 표에서 질의 77~179ns, 공간은 PHOBIC 이 1.86비트까지 |
| 공간이 최우선(정적, 거대한 키 집합) | ShockHash 계열, Consensus-RecSplit | 1.5비트 부근. 구성·질의 모두 비쌈 |
| 구성 시간이 짧아야 하고 공간 1.8비트 근처 | SIMDRecSplit | 같은 표에서 66ns/키 구성 |
| 키가 메모리에 다 안 들어감 | PtrHash 샤딩 | 논문은 64GB 노트북에서 키 500억 개를 2.40비트/키로 구성(하이브리드 샤딩 2494초) |

## 언제 쓰나

- 정적 키 → 위치 색인(사전, k-mer·minimizer 색인, 읽기 전용 키-값 저장소)에서 MPHF 라이브러리를 고를 때.
- 질의가 루프 안의 핫 패스인지, 키 집합이 디스크를 넘는지, 재구성이 얼마나 잦은지를 먼저 정하고 위 표에서 줄을 고른다.

## 주의 (비용)

- **스트리밍 수치는 질의 키를 미리 알 때만 나온다.** 요청 하나씩 오는 온라인 조회에서는 루프 수치(30ns대)를 본다.
- **문자열 키에서는 해시 계산이 병목**이 된다. 논문도 문자열 입력에서 질의 시간이 늘었다고 적는다.
- PtrHash Compact(2.12비트)는 논문 스스로 축출이 끝나지 않는 경우가 가끔 있다고 밝히며 λ=3.9 를 대안으로 든다. 축출 전략의 이론 분석은 아직 없다고 적는다.
- CacheLineEF 는 값이 40비트(약 10¹² 항목)까지이고 α ≤ 0.99 일 때만 쓴다.
- GitHub 저장소 기준 PtrHash 는 Rust(MIT), PTHash·ShockHash 는 C++ 다. 다른 언어 바인딩과 유지보수 상태는 확인하지 않았다.
- 모든 수치는 논문 저자 기계의 값이다. 이 노트에서 재현하지 않았다. 구성 중 메모리 사용량도 비교하지 않았다.

> 출처 확인 범위: PtrHash 논문 arXiv 2502.15539v2(2025-05-27, SEA 2025) HTML 판에서 설계 절, Table 1(정수 키 구성별 비트·질의), Table 2(문자열 3억 개 비교 전체), 샤딩 실험과 한계 서술을 읽었다. ShockHash 수치는 기존 [ShockHash 노트](/develop-wiki/knowledge/algorithms/shockhash/)가 Table 1 에서 옮긴 값을 인용했다. PHOBIC·PTHash 의 원 논문 수치는 기존 벤치마크 노트를 따랐고 이번에 다시 읽지 않았다. FiPS·SicHash·FMPH 의 원논문은 읽지 않았다. Consensus-RecSplit 원논문은 [별도 노트](/develop-wiki/knowledge/algorithms/consensus-recsplit/)에서 읽었다(2026-11-19 추가, 위 표의 행은 PtrHash 논문 측정값 그대로). PtrHash·PTHash·ShockHash 저장소는 GitHub API 로 언어·라이선스만 확인했다(2026-11-19).
