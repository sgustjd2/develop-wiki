---
title: 정적 필터 비교 (XOR · 이진 퓨즈 · Ribbon, 논문 표로 고르기)
aka: [Static Filter Comparison, Xor Filter vs Binary Fuse vs Ribbon, Xor+ Filter, Homogeneous Ribbon, Balanced Ribbon, 정적 필터 벤치마크]
category: algorithms
group: data-structure
level: advanced
summary: 만든 뒤 바뀌지 않는 집합의 근사 소속 필터 세 계열을 원 논문 표의 수치로 비교한다. 같은 논문·같은 기계 안에서만 숫자를 비교하고, 공간 오버헤드·구성 시간·질의 시간 중 무엇을 우선할지에 따라 고르는 기준을 정리한다.
tags: [filter, amq, xor-filter, binary-fuse, ribbon-filter, static-filter, benchmark, space-time-tradeoff]
related: [algorithms/ribbon-binary-fuse-filters, algorithms/quotient-xor-filter, algorithms/bloom-filter, algorithms/prefix-filter, algorithms/cuckoo-counting-bloom-filter, algorithms/lsm-tree, algorithms/space-time-tradeoff, algorithms/pthash-vs-recsplit-benchmarks]
sources:
  - https://arxiv.org/abs/1912.08258
  - https://arxiv.org/abs/2103.02515
  - https://arxiv.org/abs/2201.01174
updatedAt: 2026-11-19
---

[Ribbon 필터와 이진 퓨즈 필터](/develop-wiki/knowledge/algorithms/ribbon-binary-fuse-filters/) 노트가 두 구조의 원리와 직접 구현 실험을 다뤘다면, 이 노트는 **원 논문들이 보고한 수치**를 나란히 놓고 고르는 기준을 정리한다. 원리는 그 노트와 [XOR 필터](/develop-wiki/knowledge/algorithms/quotient-xor-filter/) 노트를 본다.

## 문제: 숫자를 섞으면 틀린다

세 논문은 기계·컴파일러·키 수·오탐률 설정이 다르다.

| 논문 | 기계 | 키 수 | 수치 형태 |
| --- | --- | --- | --- |
| XOR 필터 (Graf·Lemire, 2019, arXiv 1912.08258) | Intel i7-6700(Skylake) 3.4GHz, GCC 8.1 | 1천만·1억 개 64비트 키 | 표(Table 2·3) |
| Ribbon (Dillinger·Walzer, 2021, arXiv 2103.02515) | Intel Xeon D-2191(Skylake DE), GCC 8.4.1 | n=10⁶ 과 10⁸ 열 | 표(Table 1·2) |
| 이진 퓨즈 (Graf·Lemire, 2022, arXiv 2201.01174) | Intel i7-6700, GCC 10 (보조로 AMD EPYC 7262) | 1억 개 | **그림만**, 수치 표는 크기 공식(Table 1)뿐 |

그래서 아래 비교는 **한 표 안의 행끼리만** 한다. 이진 퓨즈는 논문 본문의 서술과 이론 오버헤드로만 비교한다.

## 1) XOR 논문 Table 3 (1억 키, 25% 존재 질의)

| 필터 | 질의 ns | 비트/키 | 오탐률(%) | 구성 ns/키 (Table 2) |
| --- | --- | --- | --- | --- |
| Blocked Bloom | 20 | 10.7 | 0.941 | 20 |
| Bloom 12 | 58 | 12.0 | 0.339 | 90 |
| Cuckoo 12 | 38 | 12.8 | 0.184 | 130 |
| Xor 8 | 32 | 9.8 | 0.391 | 130 |
| Xor+ 8 | 64 | 9.2 | 0.389 | 180 |
| Xor 16 | 33 | 19.7 | 0.001 | 130 |

- 비슷한 오탐률(약 0.39%)에서 XOR 8 은 9.8비트/키, Bloom 계열은 10.7~12비트를 쓴다. 논문 결론은 XOR 필터가 Bloom 대비 메모리를 약 15% 아낀다는 것이다.
- Xor+ 는 압축으로 0.6비트를 더 줄이지만 질의가 두 배 느려진다(32→64ns).
- Blocked Bloom 은 구성·질의가 가장 빠르지만 공간이 크고 오탐률이 높다.
- 표의 FPP 열에는 단위가 적혀 있지 않다. 값의 크기(8비트 Bloom 이 약 2.2)로 보아 퍼센트로 읽었다.

## 2) Ribbon 논문 Table 2 (오탐률 약 1%, n=10⁸ 열)

XOR·Cuckoo·Blocked Bloom 이 같은 표 안에 함께 있어 직접 대조할 수 있다. 오버헤드는 이론 하한 `log₂(1/ε)` 대비 추가 공간이다.

| 구성 | 공간 오버헤드 | 구성 ns/키 | 질의 ns/키 |
| --- | --- | --- | --- |
| BlockedBloom (Lang 외) | 52.0% | 32 | 37 |
| Cuckoo12 | 40.3% | 205 | 58 |
| Xor, r=8 | 23.0% | 211 | 50 |
| Xor+, r=8 | 14.5% | 299 | 104 |
| Homogeneous Ribbon, w=32 | 20.6% | 116 | 85 |
| Standard Ribbon, w=64 | 14~20% (n 에 따라) | 130 | 94 |
| Homogeneous Ribbon, w=64 | 10.1% | 160 | 90 |
| Standard Ribbon, w=128 | 6~8% | 235 | 140 |
| Balanced Ribbon, w=64 | 0.7% | 516 | 111 |
| Balanced Ribbon, w=128 | 0.3% | 1335 | 162 |

- **구성은 Ribbon 이 XOR 보다 빠를 수 있다.** w=32·64 Ribbon 은 XOR(211ns)보다 빨리 만들면서 공간도 작다.
- **질의는 XOR 가 빠르다.** n=10⁸ 에서 XOR 50ns 대 Ribbon 85~162ns. 큰 집합에서 메모리 접근이 늘어나는 차이가 드러난다(n=10⁶ 열에서는 XOR r=8 15ns, Ribbon 38~66ns).
- **공간은 폭 w 와 맞바꾼다.** Homogeneous w=32→64 로 20.6%→10.1%, Balanced 는 1% 미만까지 내려가지만 같은 폭의 Homogeneous·Standard 보다 구성이 약 3~6배 느리다(w=64: 516 대 160ns, w=128: 1335 대 235ns). 논문 초록의 "1% 미만"은 실험적 변형인 Balanced Ribbon 의 결과다.
- 논문은 Ribbon 이 특히 오탐률이 큰 영역(초록: f ≥ 2⁻⁷, 1절: 대략 f > 2⁻⁸)에서 XOR 대비 이점이 크다고 말한다. 같은 표의 오탐률 약 10% 구간에서 Homogeneous w=32 는 오버헤드 16.1%, 질의 55ns 로 XOR(r=3, 23.1%, 55ns)와 질의 속도가 같다.

## 3) 이진 퓨즈 논문 (수치는 서술과 이론값)

- 공간: 큰 n 에서 3-wise 약 `1.125n` 칸(오버헤드 약 12.5%), 4-wise 약 `1.075n`(약 7.5%). 같은 8비트 지문에서 XOR 9.84비트/키 대비 3-wise 약 9비트, 4-wise 약 8.6비트.
- 구성: 8비트에서 같은 조건의 XOR 보다 두 배 이상 빠르다고 보고.
- 질의: 4-wise 는 XOR 보다 약 30% 느리고, 3-wise 와 XOR 는 Blocked Bloom 다음으로 빠르다. Ribbon 은 그보다 느리다고 적는다.
- 결론: 저자들은 이진 퓨즈가 XOR 필터를 실질적으로 대체한다고 쓰고, Ribbon 에 대해서는 설정 폭과 다양한 오탐률 지원을 장점으로 인정한다. 둘 사이의 전체 순위는 매기지 않는다.

## 고르는 기준

| 우선순위 | 후보 | 근거 |
| --- | --- | --- |
| 질의 속도가 최우선, 공간 약간 희생 | 이진 퓨즈 3-wise (또는 XOR) | 질의는 메모리 접근 3곳. 퓨즈가 XOR 보다 작고 빨리 만들어짐 |
| 공간을 10% 안쪽으로 | 이진 퓨즈 4-wise 또는 Ribbon w=64~128 | 4-wise 약 7.5%, Standard w=128 6~8%. 질의는 둘 다 느려짐 |
| 공간 1% 안쪽, 구성 시간 여유 | Balanced Ribbon (w=64·128) | Table 2 기준 0.3~0.8%, 구성 500ns/키 이상 |
| 오탐률을 비트 단위가 아니게(예: r=7, 10.67) 맞춰야 | Ribbon | 지문 비트를 자유롭게 고를 수 있음(XOR·퓨즈는 보통 8·16비트) |
| 오탐률 10% 근처 대형 필터 | Homogeneous Ribbon w=32 | 같은 표에서 XOR 와 질의 같고 공간 작음 |
| 삽입·삭제 필요 | 정적 필터 아님 | [프리픽스](/develop-wiki/knowledge/algorithms/prefix-filter/)·[쿠쿠](/develop-wiki/knowledge/algorithms/cuckoo-counting-bloom-filter/)·쿼션트 계열 |

## 언제 쓰나

- LSM 트리 SST 필터처럼 **한 번 만들어 오래 읽는** 대형 필터의 형식을 고를 때. 필터 메모리를 줄이면 그만큼 블록 캐시가 커진다.
- 이미 쓰는 라이브러리가 여러 형식을 지원할 때(RocksDB 에는 Ribbon 이 실험적 옵션으로 추가됐다, 6.15.0) 기본값을 바꿀지 판단할 때.

## 주의 (비용)

- **표의 숫자는 그 논문의 구현·기계 기준이다.** 다른 논문의 숫자와 섞어 순위를 매기면 안 된다. 이 노트에서도 직접 재현하지 않았다.
- n=10⁶ 과 10⁸ 의 질의 시간 차이가 크다(Ribbon 논문은 앞 열이 CPU 시간, 뒤 열이 메모리 접근 비용을 포함한다고 설명). 내 데이터 크기가 캐시에 들어가는지부터 본다.
- 세 계열 모두 구성이 확률적으로 실패할 수 있어 재시도가 필요하고, 구성 때 전체 키가 메모리에 있어야 한다.
- 공간 오버헤드 몇 %는 필터가 전체 메모리에서 차지하는 비중이 클 때만 의미가 있다. 작은 필터에서는 구현 단순성과 질의 속도가 앞선다.

> 출처 확인 범위: XOR 논문은 ar5iv 판에서 Table 2(구성)·Table 3(25% 존재 질의)·Table 4·5 와 결론 문장을, Ribbon 논문은 Table 1(Standard Ribbon 오버헤드)·Table 2(세 오탐률 구간 전체)와 초록·1·6·7절의 오버헤드 서술을, 이진 퓨즈 논문은 Table 1(크기 공식)과 실험 절의 서술을 읽었다. 이진 퓨즈의 벤치마크는 그림(Figure 3~6)으로만 제시돼 수치를 옮기지 못했다. 표 해석(같은 표 안 비교, 비율)은 내가 했고 실행 재현은 하지 않았다. 25% 이외의 존재 비율 결과, 다중 스레드 구성, 각 라이브러리의 현재 버전 성능은 확인하지 않았다.
