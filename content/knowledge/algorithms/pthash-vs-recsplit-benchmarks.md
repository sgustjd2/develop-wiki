---
title: PTHash 와 RecSplit 벤치마크 비교 (논문 표로 읽는 최소 완전 해시 선택)
aka: [PTHash vs RecSplit, MPHF Benchmark, PHOBIC, SIMDRecSplit, Minimal Perfect Hash Comparison, 최소 완전 해시 벤치마크]
category: algorithms
group: data-structure
level: advanced
summary: 같은 논문·같은 기계의 표 안에서만 비교해 보면 PTHash 는 룩업이 2~4배 빠른 대신 공간이 더 크고, RecSplit 은 공간이 작은 대신 룩업이 느리다. 후속 논문이 이 균형을 어떻게 바꿨는지까지 읽는다.
tags: [perfect-hashing, mphf, pthash, recsplit, phobic, benchmark, space-time-tradeoff, pareto]
related: [algorithms/perfect-hashing-pthash, algorithms/recsplit-vs-bbhash, algorithms/hash-table, algorithms/space-time-tradeoff, algorithms/hash-functions-hashdos, algorithms/quotient-xor-filter, cs-fundamentals/cpu-cache-locality]
sources:
  - https://arxiv.org/abs/2104.10402
  - https://doi.org/10.1145/3404835.3462849
  - https://arxiv.org/abs/1910.06416
  - https://arxiv.org/abs/2404.18497
updatedAt: 2026-11-19
---

[PTHash](/develop-wiki/knowledge/algorithms/perfect-hashing-pthash/)의 구조와 [RecSplit·BBHash](/develop-wiki/knowledge/algorithms/recsplit-vs-bbhash/)의 구조는 각 노트에 있다. 앞 노트는 "PTHash 와의 수치 비교를 확인하지 못했다"고 남겼다. 이 노트가 그 빈칸을 **논문의 표를 직접 읽어** 채운다.

## 문제

MPHF 논문들은 각자 자기 기계·키 종류·구현으로 측정한다. 서로 다른 논문의 숫자를 한 표에 섞으면 거짓 결론이 나온다. 같은 표 안에서 비교하고, 환경이 다른 표는 방향만 본다.

## 해법: 세 논문의 표를 따로 읽는다

### 1. PTHash 논문(SIGIR 2021)의 Table 5: 같은 기계·같은 코드로 모두 측정

환경: Intel i9-9900K 3.6GHz 단일 코어, 모든 구조가 메모리에 상주, 균등 난수 64비트 키, 구성은 3회·룩업은 5회 평균, gcc 9.2.1 `-O3 -march=native`. 저자들은 각 방법의 원저자 코드를 쓰고 공개 벤치마크로 묶었다고 밝힌다(FCH 만 직접 구현).

n=1억 키 (구성은 초, 룩업은 ns/키):

| 방법 | 비트/키 | 룩업 | 구성(초) | 구성(ns/키로 환산) |
| --- | --- | --- | --- | --- |
| BBHash γ=1 | 3.06 | 119 | 14 | 140 |
| RecSplit ℓ=5, b=5 | 2.95 | 157 | 20 | 200 |
| RecSplit ℓ=8, b=100 | 1.80 | 124 | 92 | 920 |
| RecSplit ℓ=12, b=9 | 2.23 | 110 | 569 | 5,690 |
| CHD λ=5 | 2.07 | 204 | 358 | 3,580 |
| GOV | 2.23 | 110 | 85 | 850 |
| PTHash (i) C-C, α=0.99, c=7 | 3.36 | 28 | 42 | 420 |
| PTHash (iv) D-D, α=0.94, c=7 | 3.23 | 37 | 26 | 260 |
| PTHash (iii) EF, α=0.99, c=6 | 2.26 | 49 | 45 | 450 |

n=10억 키에서 같은 구성은 구조가 캐시에 안 들어가 룩업이 길어진다. PTHash (iii) 는 101ns/2.17비트/1,799초, RecSplit ℓ=8 은 204ns/1.80비트/936초, BBHash γ=1 은 170ns, CHD λ=5 는 417ns 다.

(표의 숫자를 코드로 옮겨 계산한 결과)

```ts
const dominated = (a: Row) => rows.some(b => b !== a && b.bits <= a.bits && b.lookup <= a.lookup && (b.bits < a.bits || b.lookup < a.lookup));
rows.filter(r => !dominated(r))   // (공간, 룩업) 파레토 전선
```

발췌한 9개 행 기준으로 전선에 남는 구성은 RecSplit ℓ=8(1.80비트, 124ns), GOV(2.23, 110), RecSplit ℓ=12(2.23, 110), PTHash (iii)(2.26, 49), PTHash (iv)(3.23, 37), PTHash (i)(3.36, 28)다. 공간과 룩업 양쪽에서 다른 모든 구성을 이긴 단일 구성은 없다. 논문 Table 5 전체에는 FCH c=3(3.00비트, 30ns, 구성 4,286초) 같은 행도 있어 이 전선은 발췌 행에 한정된다.

- **PTHash (iii) vs RecSplit ℓ=8**: 공간 +0.46 비트(약 26% 큼), 룩업 2.5배 빠름(49 대 124ns), 구성 시간은 PTHash 가 2.0배 빠름(45초 대 92초).
- **PTHash (iii) vs RecSplit ℓ=12**: 공간은 거의 같고(+0.03 비트), 룩업 2.2배 빠름, 구성은 12.6배 빠름.
- **n=10억에서는 구성이 뒤집힌다**: PTHash (iii) 1,799초가 RecSplit ℓ=8 936초보다 느리다(1.9배). 같은 PTHash 구성 시간이 키 수에 따라 초선형으로 늘어나기 때문이다. 논문 Theorem 1 은 탐색 단계의 기대 시간을 `O(n^(1+Θ(1/c)))` 로 서술한다(α<1 이면 Theorem 2 의 `O(n^(1+Θ(α/c)))`).
- 논문의 요약: PTHash 가 가장 간결한 방법들과 공간이 비슷한 구성에서 룩업이 2~4배 빠르다는 것이 결론이다. 우리의 계산도 같은 범위(2.2~2.5배)다.

### 2. RecSplit 논문의 표: 다른 기계, 다른 질문

RecSplit 원논문은 PTHash 를 비교 대상에 넣지 않았다(PTHash 가 나중에 나왔다). 표는 키 100만 개와 10억 개의 BBHash·CHD·GOV 와의 비교다. 100만 개에서 RecSplit ℓ=8, b=100 은 1.79 비트, 구성 1,027ns/키, 룩업 67ns 다. 같은 구성의 PTHash 논문 수치(1억 개)는 구성 920ns/키, 룩업 124ns 로, 키 수·기계·측정이 달라 **절대값은 못 맞대고**, 구성이 키당 약 1µs 대라는 점만 일치한다. 10억 개 표에서 RecSplit ℓ=8 은 룩업 227ns, 1.80 비트다.

### 3. PHOBIC 논문(2024): 후속 연구로 균형이 바뀐 부분

PHOBIC 은 PTHash 를 개선한 후속 연구이며 SIMDRecSplit 도 같은 기계에서 비교한다. 환경: Intel i7-11700, 1억 키, **임의 길이 10~50 문자의 난수 문자열**, 단일 스레드 열. PTHash 논문과 기계·키 종류가 달라 숫자를 직접 비교하지 않는다.

| 방법 | 비트/키 | 질의(ns) | 구성(ns/키, 1스레드) |
| --- | --- | --- | --- |
| SIMDRecSplit n=8, b=100 | 1.81 | 124 | 109 |
| SIMDRecSplit n=14, b=2000 | 1.58 | 143 | 11,062 |
| PTHash λ=5, EF | 2.11 | 54 | 525 |
| PTHash λ=10.5, EF | 1.86 | 49 | 82,721 |
| PHOBIC λ=4.5 | 2.11 | 57 | 254 |
| PHOBIC λ=6.5 | 1.85 | 52 | 992 |
| PHOBIC λ=9.0 | 1.74 | 50 | 9,171 |

- 같은 공간 약 1.85 비트에서 PTHash 는 구성에 82,721ns/키, PHOBIC 은 992ns/키가 들어 약 83배 차이(논문 본문의 "최대 83배"와 일치). 시사점은 PTHash 를 2 비트 아래로 내리려면 구성 시간이 폭발한다는 것이다.
- **SIMDRecSplit 은 약 1.8 비트에서 구성이 가장 빠르다**(109ns/키). 그 대신 질의는 124ns 로 PHOBIC·PTHash 의 약 2.4배(124 대 52) 느리다. 구성은 SIMD 로 RecSplit 의 무차별 탐색을 가속한 결과다.
- 논문은 PTHash·PHOBIC 이 질의 성능의 명확한 승자이고, RecSplit 계열·ShockHash 계열은 공간이 더 작은 대신 질의가 느리다고 정리한다.
- PTHash 논문 시점의 "RecSplit ℓ=8 은 구성에 920ns/키(1억 개)" 가 SIMD 구현으로 109ns/키가 된 셈이다(기계·키 종류가 달라 배율은 참고만).

### 4. 키가 길어지면 룩업이 달라진다 (PTHash 논문 Table 6)

PTHash 는 룩업마다 키를 한 번만 해시한다. 구성 (iv) 로 문자열 집합을 측정하니, 구성 시간은 거의 안 변하고 룩업이 늘었다. 구글 북스 1-gram 은 22ns(64비트 키 16ns), URL(ClueWeb09)은 49ns(64비트 키 24ns). 해시에 쓰는 시간이 룩업의 대부분이라는 해석이다. 논문은 키를 여러 번 해시하는 방법(BBHash 등)은 더 크게 느려진다고 밝힌다.

## 비교: 무엇을 고르나

| 우선순위 | 고르는 쪽 | 근거 |
| --- | --- | --- |
| 룩업 속도 최우선, 구조가 약간 커도 됨(약 3 비트) | PTHash C-C 또는 D-D (후속이면 PHOBIC) | 28~37ns(발췌 행 중 가장 빠른 쪽, C-C 28ns) |
| 룩업과 공간의 균형(약 2.2 비트) | PTHash EF / PHOBIC | RecSplit ℓ=12 와 공간이 같고 룩업 2배 이상 |
| 최소 공간(1.6~1.8 비트), 룩업 100ns 대 허용 | RecSplit 또는 SIMDRecSplit | 같은 공간대에서 PTHash 구성이 훨씬 느림 |
| 수십억 키를 빨리 만들어야 함 | BBHash 류 | 가장 빠른 구성(공간 3+ 비트) |
| 키가 문자열로 길다 | 해시 1회짜리 구조 | 해시 시간이 룩업을 지배 |

## 언제 쓰나

- 오프라인 인덱스, 사전·URL 테이블처럼 **키 집합이 고정**되고 룩업이 뜨거운 경로일 때. 키 자체를 저장하지 않으므로 소속 판정은 별도로 한다.
- 구조를 한 번 만들어 오래 쓰며 비트/키 하나가 비용인 경우.

## 주의

- **절대값을 믿지 말고 같은 표 안의 비율을 본다.** 기계(i9-9900K, i7-11700), 키(난수 64비트, 난수 문자열), 구현(PTHash 는 C++, SIMDRecSplit), 스레드 수가 다르다.
- 이 노트의 구성 시간 환산(초→ns/키)은 단순 나눗셈이다.
- 구성 시간은 공간을 줄일수록 폭발한다(PTHash λ=10.5 는 82,721ns/키). "공간 N 비트 달성 가능"과 "실용적으로 만들 수 있다"는 다른 말이다.
- 구성 중 메모리, 병렬 구성, 키 순서 의존성은 이 노트가 읽은 표에 없다. 대규모 구성 전에 측정한다.
- 후속 연구(PHOBIC, SIMDRecSplit, ShockHash 계열)가 계속 나오므로 "PTHash 는 룩업, RecSplit 은 공간"이라는 도식은 시점 의존적이다.
- 구조가 정적이라 키가 바뀌면 다시 만든다. 적대적 입력에는 [해시 함수 선택](/develop-wiki/knowledge/algorithms/hash-functions-hashdos/)이 필요하다.

> 출처 확인 범위: PTHash 논문 PDF(arXiv 2104.10402, 10쪽)의 5절 실험 환경, Table 3~6 중 Table 5·6 과 5.2·5.3절 본문을 직접 읽었다. RecSplit 논문(arXiv 1910.06416)은 Table 1·2 와 비교 서술을, PHOBIC 논문(arXiv 2404.18497)은 5절 실험 환경, Figure 7 설명, Table 1 을 읽었다(부록 D 의 다중 코어 표와 GPU 구현은 읽지 않음). 환산·파레토·비율 계산은 표를 코드로 옮겨 실행했다. 미확인: 각 표의 재현 실행, SIMDRecSplit 원논문(ESA 2023)과 ShockHash 계열 논문의 수치, 구성 시 메모리 사용량, PHOBIC 의 정식 게재처.
