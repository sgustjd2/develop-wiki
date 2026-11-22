---
title: 공분산과 상관분석 — Pearson·Spearman·Kendall (Correlation)
aka: [Covariance, Pearson Correlation, Spearman Rank Correlation, Kendall Tau, Partial Correlation, Correlation Test, 피어슨, 스피어만, 켄달, 편상관]
category: data-analytics
group: statistics
level: intermediate
summary: 공분산과 상관계수의 정의·범위, Pearson(선형)·Spearman(단조)·Kendall(쌍 일치) 상관의 차이, 상관 검정, 이상값 민감도, 부분상관과 상관≠인과를 직접 계산으로 보인다.
tags: [statistics, correlation, covariance, pearson, spearman, kendall, partial-correlation, outlier, causation]
related: [data-analytics/descriptive-statistics-probability-distributions, data-analytics/nonparametric-tests-rank-based, data-analytics/linear-regression-diagnostics-multicollinearity, data-analytics/outlier-detection-methods, data-analytics/eda-exploratory-data-analysis-visual, data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/categorical-data-contingency-chi-square]
sources:
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.spearmanr.html
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.kendalltau.html
  - https://openintro-ims.netlify.app/model-slr
updatedAt: 2026-11-23
---

## 개요

- **상관분석**은 두 변수가 함께 움직이는 정도를 하나의 수로 요약한다. 회귀분석 전 변수 간 관계 탐색, 다중공선성 점검, 특성 선택에 쓴다.
- 상관계수마다 "어떤 관계"를 재는지가 다르다. Pearson 은 직선, Spearman 은 단조(항상 오르거나 항상 내리는), Kendall 은 쌍의 순서 일치 비율이다.
- 상관이 높다고 인과가 있는 것은 아니다. 이 노트의 마지막 계산으로 보인다.

## 시험 범위 대응

- 빅데이터분석기사 2과목 "데이터 탐색(기초) – 상관관계 분석", ADsP "기초 통계분석", ADP 실기 "상관·회귀".
- 편상관·Kendall 의 시험 포함 여부는 공식 출제범위 항목명만으로는 확인되지 않는다(미확인).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 공분산 | covariance | 두 변수의 편차 곱의 평균적 크기. 표본 공분산은 Σ(xᵢ−x̄)(yᵢ−ȳ)/(n−1) |
| Pearson 상관계수 r | Pearson correlation | 공분산 / (sₓ·s_y). 선형 관계의 강도와 방향. −1 ~ +1 (scipy, OpenIntro) |
| Spearman ρ | Spearman rank correlation | 값의 순위에 Pearson 을 적용한 것으로 단조 관계의 강도. −1 ~ +1 |
| Kendall τ | Kendall tau | 일치쌍(P)과 불일치쌍(Q)의 차이로 정의. tau-b 는 동점 보정 |
| 편상관 | partial correlation | 제3의 변수의 영향을 제거한 뒤의 두 변수 상관 |
| 단조 관계 | monotonic relationship | 한 변수가 커질 때 다른 변수가 항상 커지거나(또는 항상 작아지거나) 하는 관계 |

## 공분산과 상관계수

- 공분산은 **단위에 의존**한다(cm·kg 으로 바꾸면 값이 변함). 상관계수는 공분산을 두 표준편차로 나눠 단위를 없앤 값이라 −1 ~ 1 안에 들어온다(OpenIntro: 상관은 단위가 없고 선형 변환에 불변).
- r = ±1 은 완전한 직선 관계, 0 근처는 **직선** 관계가 거의 없다는 뜻이다. 직선이 아닌 강한 관계는 r 이 작게 나올 수 있다(OpenIntro).
- 공분산의 n−1 과 n 중 어느 쪽으로 나누느냐는 소프트웨어마다 다르다. 예: x=1..10, y=[2.1, 3.9, 6.2, 7.8, 10.1, 12.2, 13.8, 16.1, 18.0, 19.9] 의 표본 공분산(n−1)은 18.25, 모공분산(n)은 16.425 다(numpy `cov`의 기본은 n−1, `ddof=0` 이면 n).
- 상관계수에서는 분자·분모의 n 이 약분돼 어느 쪽을 써도 r 은 같다(같은 규약을 쓸 때).

## 세 상관계수의 차이

| 구분 | Pearson | Spearman | Kendall (tau-b) |
| --- | --- | --- | --- |
| 재는 것 | 선형 관계 | 단조 관계(순위 상관) | 쌍의 일치·불일치 |
| 입력 | 연속형(정규 가정은 p-값에서) | 서열 이상 | 서열 이상 |
| 이상값 | 매우 민감 | 덜 민감 | 덜 민감 |
| 식 | cov/(sₓ s_y) | 순위의 Pearson | (P−Q)/√[(P+Q+T)(P+Q+U)] |
| 동점 | 해당 없음 | 순위 계산 방식에 따라 달라짐(이 노트에서 미확인) | tau-b 가 T·U 로 보정 (scipy) |

- tau-b: P 일치쌍, Q 불일치쌍, T 는 x 에서만 동점인 쌍, U 는 y 에서만 동점인 쌍(둘 다 동점이면 제외). scipy 는 tau-c 도 제공하며 tau-b 와 p-값은 같고 척도만 다르다.
- Pearson 이 아닌 상관을 쓰는 이유는 [비모수 검정](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/)과 같다. 순위로 바꾸면 이상값·비선형 단조 관계에 강하다.

## 직접 계산

Python 3.15.0, scipy 1.18.1(스크래치 `w3/c.py`).

### 이상값 하나의 영향

x = 1..10, y 는 위 값(거의 직선). 마지막 y(19.9)를 −30 으로 바꾼 경우:

| | Pearson r (p) | Spearman ρ (p) | Kendall τ (p) |
| --- | --- | --- | --- |
| 원자료 | 0.9997 (4×10⁻¹⁴) | 1.000 | 1.000 (5.5×10⁻⁷) |
| 마지막 값 −30 | **−0.162** (0.655) | 0.455 (0.187) | 0.600 (0.017) |

- 점 하나로 Pearson 은 강한 양에서 약한 음으로 뒤집혔다. 순위 기반은 양의 방향을 유지했다. 이것이 "상관계수 전에 산점도부터"의 이유다.
- Spearman 의 p-값은 점근 근사이며 scipy 문서는 대략 500 개 초과에서 정확하다고 안내하고 작은 표본에는 순열 검정을 권한다. n=10 의 p 는 참고용이다.

### 단조·비선형·비단조

| 자료 | Pearson | Spearman | Kendall |
| --- | --- | --- | --- |
| x=1..10, y=eˣ (단조·비선형) | 0.717 | 1.000 | 1.000 |
| x∈[−3,3], y=x² (대칭 U 형) | ≈0 (−2×10⁻¹⁶) | −0.031 | 계산 안 함 |

- y = x² 는 완전히 종속인데 r ≈ 0 이다. scipy 문서도 "상관 0 이 독립을 뜻하지 않는다"(y=|x| 예)고 설명한다. 상관은 직선(또는 단조) 관계만 본다.

### 상관 검정

- 귀무가설: 모집단 상관 = 0. Pearson 의 검정통계량은 t = r√(n−2)/√(1−r²), 자유도 n−2 로 알려진 식이다(이 노트에서 1차 출처로 읽지 않음). 위 이상값 예(r=−0.162, n=10)에서 t = −0.464, p = 0.655 로 scipy `pearsonr` 의 p 와 같다.
- scipy `pearsonr` 의 기본 p-값은 두 변수가 정규인 독립 표본에서의 r 분포에 근거한다. 비정규면 신뢰성이 떨어질 수 있고 순열·몬테카를로 방식을 쓸 수 있다.
- 구간: 기본은 Fisher 변환 기반 점근 구간. 원자료 r=0.9997 의 95% 구간은 [0.9986, 0.9999].
- 표본이 작으면 r 이 우연히 커진다. n=2 면 |r| 은 항상 1 이고 양측 p 는 1 이다(scipy).

### 부분상관과 상관≠인과

시뮬레이션(seed 1, n=500): z ~ N(0,1), x = z + 잡음, y = z + 잡음. x 와 y 는 서로 영향을 주지 않고 둘 다 z 의 영향만 받는다.

| 값 | 결과 |
| --- | --- |
| r(x, y) | 0.488 |
| r(x, z), r(y, z) | 0.654, 0.670 |
| 편상관 r(x, y \| z) = (r_xy − r_xz r_yz)/√[(1−r_xz²)(1−r_yz²)] | **0.088** |

- 교란변수 z 를 통제하면 상관이 거의 사라진다. 아이스크림 판매와 익사 사고처럼 공통 원인이 만드는 가짜 상관(필자 예)과 같은 구조다.
- 편상관 식은 일반적으로 알려진 형태이며 이 노트에서 1차 출처로 읽지 않았다.
- 인과를 보려면 실험(무작위 배정)이나 인과 추론 설계가 필요하다. 상관은 방향·교란·역인과를 구분하지 못한다.

## 언제 쓰나 / 주의

| 상황 | 선택 |
| --- | --- |
| 두 연속 변수, 직선 관계 확인, 이상값 적음 | Pearson |
| 서열 척도, 이상값, 비선형 단조 | Spearman 또는 Kendall |
| 작은 표본, 동점 많음 | Kendall(tau-b) |
| 범주형 두 변수 | 상관이 아니라 [분할표 연관성](/develop-wiki/knowledge/data-analytics/categorical-data-contingency-chi-square/) |

- **산점도를 먼저 그린다.** 숫자 하나로는 U 형·이상값·군집이 모두 가려진다.
- 상관이 높은 설명변수끼리는 회귀에서 다중공선성을 일으킨다 → [선형회귀·다중공선성](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/)
- 통계적 유의성과 상관의 크기는 별개다. n 이 크면 r=0.05 도 유의하다 → [p-값](/develop-wiki/knowledge/data-analytics/estimation-hypothesis-testing-errors-pvalue/)

## 검증 범위

- scipy 문서(pearsonr, spearmanr, kendalltau), OpenIntro IMS 선형회귀 장의 상관 정의·성질을 읽었다. OpenIntro 는 이상값 민감도를 직접 설명하지 않아 이상값 영향은 위 직접 계산에 근거했다.
- Pearson 검정통계량 식, 편상관 식, 공분산 정의는 일반 지식으로 쓰고 직접 계산으로 값만 확인했다. Spearman 순위 동점 처리 방식은 scipy 문서에 없어 쓰지 않았다(미확인).
- 수치는 Python 3.15.0, numpy 2.5.5, scipy 1.18.1 로 직접 계산. 시뮬레이션은 seed 1 의존.
