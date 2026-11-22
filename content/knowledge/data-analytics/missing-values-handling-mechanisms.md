---
title: 결측값 처리와 결측 메커니즘 (Missing Values, MCAR·MAR·MNAR, Imputation)
aka: [Missing Data, MCAR, MAR, MNAR, Listwise Deletion, Mean Imputation, KNN Imputation, MICE, Multiple Imputation, Missing Indicator]
category: data-analytics
group: preprocessing
level: intermediate
summary: 결측이 왜 생겼는지(MCAR·MAR·MNAR)에 따라 삭제·단순대치·회귀·KNN·다중대체의 편향이 달라진다. 평균대치가 분산·상관을 줄이는 것을 직접 계산으로 확인한다.
tags: [missing-data, imputation, mcar, mar, mnar, mice, multiple-imputation, scikit-learn, preprocessing]
related: [data-analytics/outlier-detection-methods, data-analytics/data-quality-privacy-deidentification, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/r-basics-data-mart-apply-dplyr, data-analytics/eda-exploratory-data-analysis-visual, machine-learning/data-split-cross-validation-leakage, machine-learning/knn-distance-based-classification]
sources:
  - https://stefvanbuuren.name/fimd/sec-MCAR.html
  - https://stefvanbuuren.name/fimd/sec-simplesolutions.html
  - https://stefvanbuuren.name/fimd/sec-nutshell.html
  - https://stefvanbuuren.name/fimd/sec-pooling.html
  - https://scikit-learn.org/stable/modules/impute.html
updatedAt: 2026-11-23
---

## 개요

- 결측값을 어떻게 다룰지는 "값이 왜 비었나"에 달려 있다. 같은 평균 대치도 결측이 무작위일 때와 값 자체에 의존할 때 결과가 다르다.
- Rubin(1976)이 결측 메커니즘을 MCAR·MAR·MNAR 로 구분했다. 이 구분은 어떤 방법이 편향 없는 결과를 줄 수 있는지의 조건이다.
- 처리 방법은 크게 삭제, 단순 대치, 모형 기반 대치(회귀·KNN·반복 대치), 다중 대치로 나뉜다. 대치는 값을 "채우는" 일이 아니라 불확실성을 어떻게 다루느냐의 문제다.

## 시험 범위 대응

- ADsP 데이터분석 > R기초와 데이터 마트 > 결측값 처리와 이상값 검색, ADP 필기 R기초·데이터 마트(결측값 처리와 이상값 검색)·실기 데이터 전처리(결측·이상값 처리 기준 자체는 빅데이터분석기사 실기 항목명), 빅데이터분석기사 2과목 > 데이터 정제·결측값 처리에 대응한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 완전 무작위 결측 | MCAR | 결측될 확률이 모든 케이스에서 같다. 결측 원인이 자료와 무관 |
| 무작위 결측 | MAR | 결측 확률이 **관측된** 자료가 정하는 집단 안에서 같다 |
| 비무작위 결측 | MNAR | MCAR·MAR 모두 아님. 결측이 관측되지 않은 이유(결측값 자체 포함)에 의존 |
| 목록별 삭제 | listwise (complete-case) deletion | 분석 변수 중 하나라도 비면 그 행 전체를 제거 |
| 쌍별 삭제 | pairwise deletion | 통계량마다 해당 변수쌍이 모두 관측된 케이스를 사용 |
| 단순(단일) 대치 | single imputation | 빈 값을 하나의 값으로 채움(평균·중앙값·최빈값·회귀 예측 등) |
| 다중 대치 | multiple imputation (MI) | 불확실성을 반영해 m 개의 완전 자료를 만들고 결과를 합침 |
| 결측 지시변수 | missing indicator | 값이 결측이었는지를 표시하는 0/1 변수 |

- 정의는 van Buuren *FIMD* 1.2 절의 비형식적 서술을 따랐다. 그 절의 예: 체중계가 무작위로 고장 → MCAR, 푹신한 바닥에서 더 자주 결측(바닥 종류는 관측됨) → MAR, 체중이 무거울수록 결측 → MNAR.
- **MAR 인지 MNAR 인지는 관측 자료만으로 검정할 수 없다**는 점이 실무의 핵심 한계다(FIMD 해당 절에는 검정 서술이 없어 이 노트는 일반 지식으로만 적는다). MNAR 이면 FIMD 는 결측 원인 정보를 더 수집하거나 민감도 분석을 권한다.
- 수험서에서는 "완전 무작위 결측/무작위 결측/비무작위 결측" 외에 "임의 결측" 같은 표현이 섞일 수 있다.

## 방법별 성질

FIMD 의 단순 해법 절에서 읽은 내용:

| 방법 | MCAR 에서 | 그 밖의 성질 |
| --- | --- | --- |
| 목록별 삭제 | 평균·분산·회귀계수는 불편, 표준오차는 자료 손실로 커짐 | MAR·MNAR 에서는 편향 가능, 표본의 절반 넘게 잃을 수도 |
| 쌍별 삭제 | 평균·공분산은 일치 | 공분산 행렬이 양정치가 아닐 수 있고 표준오차 계산이 어렵다. 거의 정규·낮은 상관·MCAR 이 그럴듯할 때만 |
| 평균 대치 | 평균만 유지 | 분산을 줄이고 상관을 약화. 평균 외 대부분 추정치가 편향 → 일반적으로 권하지 않음 |
| 회귀 대치 | 평균·회귀계수는 불편일 수 있음 | 상관을 부풀리고 변동을 과소추정. FIMD 는 "너무 좋아서 믿기 힘든" 대치라 아마도 가장 위험한 방법(probably the most dangerous)이라고 평가 |
| 확률적 회귀 대치 | 회귀계수·상관 유지(MAR 에서도) | 예측에 잔차 잡음을 더함. 음수 값·이분산 문제 가능 |
| 결측 지시변수 + 0 대치 | 좁은 조건(무작위 임상시험 등)에서만 불편 | MCAR 에서도 크게 편향될 수 있어 일반 해법 아님 |

- 중앙값·최빈값 대치는 평균 대치와 같은 단일값 대치이므로 분산 축소 문제를 공유한다(이 노트에서 중앙값·최빈값을 별도로 계산하지 않았다). 범주형은 최빈값, 극단값이 있는 연속형은 중앙값을 쓰는 것이 관행이다.
- "최근접 대치(hot-deck 계열)"의 범위와 정의는 이 노트에서 문헌을 확인하지 못했다(KNN 대치는 아래 sklearn 절).

## scikit-learn 의 대치기

| 클래스 | 방식 | 읽은 문서 요점 |
| --- | --- | --- |
| `SimpleImputer` | 열별 상수·평균·중앙값·최빈값 | 단변량. `missing_values` 는 NaN 아니어도 지정 가능, 범주형은 `most_frequent`·`constant` |
| `KNNImputer` | 가까운 `n_neighbors` 개 샘플의 값 평균(`uniform`/`distance`) | `nan_euclidean_distances` 사용. 특성마다 이웃이 다를 수 있다 |
| `IterativeImputer` | 결측 열을 차례로 `y` 로 삼아 나머지로 회귀하는 라운드로빈 반복 | 실험적(`enable_iterative_imputer` 필요), R 의 MICE 에서 영감, **한 번에 하나의 대치만 반환** |
| `MissingIndicator` / `add_indicator=True` | 결측 위치 이진 마스크를 열로 추가 | 대치 후에도 결측이었다는 정보를 유지 |

- `IterativeImputer(sample_posterior=True)` 로 시드를 바꿔 여러 번 적합하면 다중 대치를 흉내낼 수 있으나, 한 번의 `transform` 은 표본 수를 못 바꿔 여러 데이터셋을 낼 수 없다(문서).
- 기본 회귀기는 `BayesianRidge` 로 알려져 있다(이 문서 절에는 명시가 없고 API 지식).
- **누수 주의**: 대치기는 훈련 자료에만 `fit` 하고 검증·테스트에는 `transform` 만 한다 → [데이터 분할과 누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)

## 다중 대치와 MICE

- 절차: (1) 불확실성을 반영한 대치를 m(>1) 번 만들어 m 개 완전 자료를 얻는다. (2) 각 자료를 표준 방법으로 분석한다. (3) Rubin 규칙으로 결과를 합친다(FIMD).
- Rubin 규칙(합산 분산 = 대치 내 분산 + 대치 간 분산): `Q̄ = 평균(Qₖ)`, `U = 평균(Uₖ)`, `B = 분산(Qₖ)`, `T = U + (1 + 1/m)·B`. 이 식은 FIMD 2.4 절의 식(Rubin 1987 의 식 3.3.5 로 귀속됨)과 같다고 팩트체크에서 확인했고, 아래 직접 계산에 이 식을 썼다.
- FIMD pooling 절은 이 규칙이 대략 정규인 통계량(평균·표준편차·회귀계수·비율)에 직접 적용되고, 상관 같은 비정규 통계량은 Fisher z 로 변환 후 합산한다고 안내한다.
- MICE 는 변수별 조건부 모형을 반복 적용(FCS)하는 방식이며, 그 알고리즘 절(FIMD 4.5)은 읽지 못했다.

## 직접 계산

Python 3.15, numpy 2.5.5, pandas 3.1.1, scikit-learn 1.9.1. 시드 고정(`default_rng(7)`, n = 1000). `x ~ N(50, 10²)`, `y = 2x + N(0, 10²)`. 완전 자료: y 평균 98.48, 분산 466.4, 상관 0.880, 회귀 기울기 2.018. y 의 약 30% 를 비운다.

**MCAR(무작위 30%)**

| 방법 | y 평균 | y 분산 | 상관(x,y) | 기울기 |
| --- | --- | --- | --- | --- |
| 목록별 삭제 | 98.64 | 464.7 | 0.873 | 2.000 |
| **평균 대치** | 98.64 | **327.0** | **0.732** | **1.406** |
| 회귀 대치 | 98.34 | 432.5 | 0.906 | 2.000 |
| 확률적 회귀 대치 | 98.49 | 459.8 | 0.874 | 1.991 |
| sklearn `SimpleImputer`(평균) | 98.64 | 327.0 | 0.732 | 1.406 |
| sklearn `KNNImputer`(k=5) | 98.41 | 445.6 | 0.900 | 2.017 |
| sklearn `IterativeImputer`(기본) | 98.34 | 432.4 | 0.906 | 2.000 |

- 평균 대치는 평균은 지켰지만 분산이 약 30% 줄고(466 → 327) 상관·기울기가 크게 약해졌다(0.88 → 0.73, 2.02 → 1.41). 대치된 값이 모두 같아 `x` 와 무관해지기 때문이다.
- 회귀 대치는 분산이 줄고 상관이 0.906 으로 부풀었다(FIMD 설명과 같은 방향). 잔차 잡음을 더한 확률적 대치는 분산·상관·기울기를 거의 복원했다. 단일 `IterativeImputer` 는 회귀 대치와 같은 값이 나왔다.

**MAR / MNAR**

- MAR: y 의 결측 확률이 x 에 의존(x 가 클수록 결측, 결측률 29.6%). 목록별 삭제의 y 평균은 90.21 로 참값 98.48 보다 낮게 편향됐지만 기울기는 1.997 로 거의 그대로였다. 평균 대치는 y 평균 90.21 은 같고 분산 224.0, 상관 0.528, 기울기 0.839 로 더 망가졌다.
- MNAR: y 가 클수록 결측(결측률 34.9%). 목록별 삭제의 y 평균 89.05, 기울기 1.871. 관측 자료만으로 이를 바로잡을 수 없다.
- MAR 에서도 평균의 편향이 생긴 것은 "집단 내 무작위"일 뿐 집단 간 비율이 다르기 때문이다. 조건부(x 를 쓴 대치·모형)로는 바로잡을 수 있다.

**다중 대치(손으로 구현)**

- 확률적 회귀 대치를 20 번 반복해 y 평균을 구하고 위 Rubin 식으로 합쳤다: 합산 평균 98.322, 표준오차 0.720(대치 내 0.683, 대치 간 분산 B = 0.0497). 완전 자료의 표준오차는 0.683, 목록별 삭제는 0.812 였다.
- 결측 때문에 늘어난 불확실성이 표준오차에 반영되었다(0.683 → 0.720). 단 이 구현은 회귀 모수 자체의 불확실성을 새로 뽑지 않아 올바른 MI(proper imputation)보다 표준오차를 약간 작게 잡는다. 개념 시연용이다.
- 시드 의존 값이다.

## 언제 쓰나 / 주의

- 결측률이 낮고 MCAR 가 그럴듯하면 목록별 삭제가 단순하고 편향이 없다(대신 검정력 손실).
- 예측 모델에서는 대치를 파이프라인에 넣고 교차검증 안에서 적합한다.
- 결측 자체가 정보면(예: 소득 미응답) `add_indicator` 를 같이 쓰되, FIMD 는 지시변수 방법이 일반적으로 신뢰할 해법이 아니라고 경고한다.
- 추론(계수·검정)이 목적이면 단일 대치보다 다중 대치가 낫다는 것이 FIMD 의 입장이다. 단일 대치로 얻은 표준오차는 과소추정된다.
- 이상값을 결측으로 바꿔 처리하기 전에 [이상값 탐지](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/)로 원인을 먼저 확인한다.
- 개인정보 때문에 일부러 비운 값(비식별)은 [데이터 품질·비식별](/develop-wiki/knowledge/data-analytics/data-quality-privacy-deidentification/)과 구분한다.

## 검증 범위

- 읽은 것: van Buuren *FIMD* 1.2 절(MCAR·MAR·MNAR 비형식 정의)·단순 해법 절·MI 개요 절·pooling 절 일부, scikit-learn 대치 User Guide. 위 수치는 모두 직접 실행.
- **Rubin(1976) 원전은 읽지 못했다**(서지·DOI 10.1093/biomet/63.3.581 만 인지). 형식 정의(결측 지시자의 조건부분포 식)는 쓰지 않았다.
- 미확인: FIMD 2.2.4 절의 형식 정의와 2.4 절의 Rubin 규칙 원문(식은 필자 기술), MICE(FCS) 알고리즘 상세(FIMD 4.5), 최근접 대치·hot-deck 의 문헌 정의, `IterativeImputer` 기본 추정기를 이 페이지에서 확인하지 못함, 결측률 몇 % 이하면 삭제해도 된다는 기준(FIMD §1.3.1 은 그런 기준 제시를 경계한다).
- 실행하지 않은 것: R `mice`, 중앙값·최빈값 대치, 범주형 대치.
