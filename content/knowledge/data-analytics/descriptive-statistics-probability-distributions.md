---
title: 기술통계와 확률분포·표본분포 (Descriptive Statistics & Distributions)
aka: [Descriptive Statistics, Mean Median Mode, Variance, Standard Deviation, IQR, Skewness, Kurtosis, Normal Distribution, Central Limit Theorem, Standard Error, 표준오차]
category: data-analytics
group: statistics
level: beginner
summary: 중심·산포·모양 통계량의 정의(왜도·첨도의 표본 보정 구분 포함), 대표 확률분포, 표준화, 중심극한정리와 표준오차를 분산과 구분해 정리한다.
tags: [statistics, descriptive, distribution, normal, binomial, poisson, clt, standard-error, skewness, kurtosis]
related: [data-analytics/sampling-methods-measurement-scales, data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/t-test-anova-f-test, data-analytics/outlier-detection-methods, data-analytics/eda-exploratory-data-analysis-visual, data-analytics/scaling-encoding-transformation-derived-features]
sources:
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.skew.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.kurtosis.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.norm.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.poisson.html
  - https://openintro-ims.netlify.app/foundations-mathematical
  - https://openintro-ims.netlify.app/inference-one-mean
updatedAt: 2026-11-23
---

## 개요

- **기술통계**는 자료를 요약하는 숫자(중심, 산포, 모양)다. **확률분포**는 변수가 어떤 값을 얼마의 확률로 갖는지의 모형이다. **표본분포**는 "같은 방식으로 표본을 반복해서 뽑았을 때 통계량이 어떻게 흩어지는가"다.
- 추론통계(구간추정·검정)는 표본분포 위에서 움직인다. 그래서 "자료의 흩어짐(분산·표준편차)"과 "추정치의 흩어짐(표준오차)"을 구분하는 것이 이 노트의 핵심이다.

## 시험 범위 대응

- 빅데이터분석기사 2과목 "통계기법 이해 – 기술통계: 데이터 요약·확률분포·표본분포", "데이터 탐색 – 기초통계량 추출 및 이해".
- ADsP 데이터분석 "통계학 개론·기초 통계분석", ADP 필기·실기의 "기술통계량" 항목.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 평균 | mean | 값의 합 / 개수 |
| 중앙값 | median | 크기순으로 놓았을 때 가운데 값(짝수 개면 가운데 두 값의 평균) |
| 최빈값 | mode | 가장 자주 나오는 값 |
| 표본분산 | sample variance | 평균에서의 편차 제곱의 합 / (n−1) |
| 표준편차 | standard deviation | 분산의 양의 제곱근. 원자료와 같은 단위 |
| 사분위범위 | IQR | 3사분위수 − 1사분위수 |
| 왜도 | skewness | 분포의 비대칭 정도. 정규분포는 0 |
| 첨도 | kurtosis | 분포 꼬리의 두께와 관련된 4차 적률 지표 |
| 표준정규화(z 점수) | standardization, z-score | (x − 평균) / 표준편차. 평균 0, 표준편차 1 로 옮긴 값 |
| 표본분포 | sampling distribution | 통계량을 반복 추출했을 때의 분포 |
| 표준오차 | standard error (SE) | 통계량(예: 표본평균)의 표본분포의 표준편차 |

## 중심·산포·모양 통계량

예제 자료 x = [2, 3, 3, 4, 5, 5, 5, 7, 9, 20] (n = 10)를 직접 계산했다.

| 통계량 | 값 | 비고 |
| --- | --- | --- |
| 평균 | 6.3 | 20 하나가 끌어올림 |
| 중앙값 | 5.0 | 이상값에 강건 |
| 최빈값 | 5 | |
| 표본분산 (n−1) | 27.34 | 모분산식(÷n)은 24.61 |
| 표본표준편차 | 5.23 | |
| IQR | 3.25 | numpy 기본(선형 보간) 사분위수: Q1 = 3.25, Q3 = 6.5. 사분위수 정의는 소프트웨어마다 다르다 |

- **n−1 로 나누는 이유**: 평균을 자료에서 추정했기 때문에 편차 제곱합이 모분산을 과소추정한다. n−1 로 나누면 분산 추정량이 불편(unbiased)이 된다. 수험서에서 "표본분산은 n−1"이라고 외우는 근거가 이것이다.
- 중심 통계량 선택: 대칭에 가까우면 평균, 치우치거나 이상값이 있으면 중앙값. 척도가 명목이면 최빈값만 의미가 있다([척도](/develop-wiki/knowledge/data-analytics/sampling-methods-measurement-scales/) 참고).

### 왜도·첨도: 보정 여부와 정의를 구분

NIST Handbook 의 정의: 표본 왜도 g₁ = [Σ(Yᵢ−Ȳ)³/N] / s³, 첨도 = [Σ(Yᵢ−Ȳ)⁴/N] / s⁴ (여기서 s 는 N 으로 나눈 표준편차). 정규분포의 왜도는 0, 이 정의의 첨도는 3 이다. 많은 소프트웨어는 보정판 G₁ = √(N(N−1))/(N−2) × g₁ 을 쓴다.

| 정의 | 정규분포 값 | scipy 옵션 | 예제 자료 |
| --- | --- | --- | --- |
| 왜도, 보정 없음(biased) | 0 | `skew(x)` | 1.98 |
| 왜도, 보정(`bias=False`) | 0 | `skew(x, bias=False)` | 2.35 |
| 첨도 Pearson 정의(정규=3) | 3 | `kurtosis(x, fisher=False)` | 5.93 |
| 초과첨도 Fisher 정의(정규=0, 기본값) | 0 | `kurtosis(x)` | 2.93 |
| 초과첨도, 보정(`bias=False`) | 0 | `kurtosis(x, bias=False)` | 6.14 |

- **같은 "첨도"라도 3 을 빼느냐에 따라 값이 3 차이**난다. 시험 문제·소프트웨어 출력에서 정의를 먼저 확인한다.
- 왜도 > 0 이면 오른쪽 꼬리가 길다(위 예제). 예제는 n=10 이라 보정 유무에 따라 값이 크게 달라진다.
- 첨도가 크다는 것은 "뾰족하다"보다 "꼬리가 두껍다(극단값이 많다)"에 가깝다. 이 해석은 NIST 가 초과첨도 양수를 heavy tail 로 설명한 것과 맞는다.

## 대표 확률분포

| 분포 | 유형 | 모수 | 쓰임 |
| --- | --- | --- | --- |
| 정규 N(μ, σ²) | 연속 | 위치 μ, 척도 σ | 측정 오차, 표본평균의 근사 분포. 평균·중앙값·최빈값이 모두 μ, 왜도 0, 첨도 3 (NIST) |
| 이항 B(n, p) | 이산 | 시행 수 n, 성공확률 p | 독립 시행 n 번 중 성공 횟수 |
| 포아송 Poisson(μ) | 이산 | 평균 발생 수 μ | 단위 시간·공간당 사건 수. pmf = e^(−μ) μ^k / k! (scipy 문서) |
| 균등 U(a, b) | 연속 | 구간 a, b | 구간 안 모든 값이 같은 밀도 |
| 지수 Exp(λ) | 연속 | 비율 λ | 사건 사이의 대기시간 |

직접 계산한 값(scipy): B(10, 0.5)에서 P(X=3) = 0.1172, Poisson(3)에서 P(X=2) = 0.2240, 평균 대기시간 2(비율 0.5)인 지수분포에서 P(X>2) = 0.3679.

- 정규분포 표준화: 평균 70, 표준편차 10 인 분포에서 85 는 z = 1.5. 표준정규에서 P(Z ≤ 1.96) = 0.9750.
- t, 카이제곱, F 분포는 "자료의 분포"가 아니라 **통계량의 표본분포**로 나온다. t 는 평균 검정(정규 모집단에서 표본평균을 s 로 표준화), 카이제곱은 분산·범주형 검정, F 는 분산 비 검정이다([t·F·ANOVA](/develop-wiki/knowledge/data-analytics/t-test-anova-f-test/), [카이제곱](/develop-wiki/knowledge/data-analytics/categorical-data-contingency-chi-square/)). 분포의 정의식은 이 노트에서 1차 출처로 읽지 않았다.
- 이항·균등·지수의 확률식은 일반 교과서식이며, 위 수치는 scipy 로 계산했다.

## 중심극한정리와 표본분포

OpenIntro 설명을 풀면: 독립성과 충분한 표본 크기 조건이 맞으면 표본 통계량(비율, 평균 등)의 표본분포는 **원자료가 정규가 아니어도** 근사적으로 종 모양이 된다. 비율에서는 기대 성공·실패가 각각 10 이상이라는 조건(success-failure condition)을 쓴다. 평균에서는 표본이 작을 때 이상값이 없어야 하고(대략 n≈15 약한 비대칭, n≈30 중간, n≈60 강한 비대칭까지 허용), 표본이 크면 극단 이상값만 없으면 된다.

### 직접 계산: 지수분포 표본평균

지수분포(평균 1, 표준편차 1, 왜도 약 2.0)에서 크기 n 표본을 20,000번 뽑아 표본평균의 분포를 보았다(seed 42 계열, seed 의존).

| n | 표본평균들의 표준편차 | σ/√n | 표본평균 분포의 왜도 |
| --- | --- | --- | --- |
| 5 | 0.447 | 0.447 | 0.94 |
| 30 | 0.183 | 0.183 | 0.34 |
| 200 | 0.071 | 0.071 | 0.18 |

n 이 커질수록 표본평균의 흩어짐은 σ/√n 으로 줄고, 분포는 대칭에 가까워진다(왜도 감소).

### 헷갈리는 구분: 분산·표준편차 vs 표준오차

| 구분 | 표준편차 (s) | 표준오차 (SE) |
| --- | --- | --- |
| 대상 | 자료 값 하나하나의 흩어짐 | 추정량(표본평균 등)의 흩어짐 |
| 평균의 경우 식 | s = √[Σ(x−x̄)²/(n−1)] | SE = σ/√n, σ 를 모르면 s/√n |
| n 이 커지면 | 모집단 σ 로 수렴(줄지 않음) | 줄어든다(1/√n) |
| 용도 | 자료의 변동 서술 | 신뢰구간·검정통계량의 분모 |
| 표본평균 SE 반으로 줄이기 | | n 을 4 배로 |

- 분산은 표준편차의 제곱(단위 제곱), 표준오차는 표준편차와 같은 단위다. "분산 vs 표준오차"를 묻는 문제는 대부분 위 두 줄(자료 vs 추정량, n 과의 관계)로 풀린다.
- SE = s/√n 식과 단일 평균의 t 분포(자유도 n−1)는 OpenIntro 및 NIST 일표본 t 검정 설명에서 확인했다.

## 언제 쓰나 / 주의

- 분석 시작 시 기술통계와 분포 모양을 먼저 본다. 평균만 보고하지 말고 중앙값·IQR 과 함께 본다.
- 정규성 가정이 필요한 방법은 n 이 작고 비대칭이 강하면 위험하다. CLT 는 "표본평균이 정규에 가깝다"이지 "자료가 정규다"가 아니다.
- 표본이 크면 정규에 가깝다는 말은 이상값이 심하거나 꼬리가 매우 두꺼운 분포에서는 필요 표본 수가 훨씬 커진다. 필요 n 의 일반 공식은 없다.
- 정규화라는 말은 문맥에 따라 min-max 스케일링, z 표준화, DB 정규화로 다르다. 여기서 "표준화"는 z 점수다.
- 척도·표본추출 조건이 틀리면 SE 계산이 무너진다(독립성 가정, [표본추출](/develop-wiki/knowledge/data-analytics/sampling-methods-measurement-scales/) 참고).

## 검증 범위

- NIST Handbook(eda35b: 표본 왜도·첨도 정의, eda3661: 정규분포), scipy 문서(skew·kurtosis 옵션, norm, poisson 식), OpenIntro IMS(CLT 조건, 단일 평균 SE·자유도)를 읽었다.
- 평균·중앙값·분산·IQR 의 정의, 이항·균등·지수 분포식, t·카이제곱·F 가 표본분포라는 설명은 일반 교과서 내용이며 이 노트에서 1차 출처로 읽지 않았다.
- 모든 수치는 Python 3.15.0, numpy 2.5.5, scipy 1.18.1 로 직접 계산했다(스크래치 `w3/a.py`). 시뮬레이션 값은 seed 의존.
- 시험에서 쓰는 "표준정규화=정규화" 용어 구분은 수험서별로 달라 확인하지 못했다(미확인).
