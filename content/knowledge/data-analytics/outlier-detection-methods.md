---
title: 이상값 탐지 방법 (Outlier Detection Methods)
aka: [Outlier, Extreme Value, IQR Rule, Z-score, Modified Z-score, MAD, Grubbs Test, Generalized ESD, Mahalanobis Distance, Isolation Forest, LOF, DBSCAN]
category: data-analytics
group: preprocessing
level: intermediate
summary: 이상값·극단값·노이즈를 구분하고 IQR(1.5 배), z-점수, MAD 수정 z, Grubbs·GESD, 마할라노비스, Isolation Forest·LOF·DBSCAN 으로 탐지하는 법과 처리 방침을 직접 계산으로 비교한다.
tags: [outlier, iqr, z-score, mad, grubbs, mahalanobis, isolation-forest, lof, dbscan, preprocessing]
related: [data-analytics/missing-values-handling-mechanisms, data-analytics/descriptive-statistics-probability-distributions, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/eda-exploratory-data-analysis-visual, data-analytics/multivariate-pca-factor-mds, machine-learning/clustering-kmeans-hierarchical-dbscan, data-analytics/r-basics-data-mart-apply-dplyr]
sources:
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm
  - https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h1.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h3.htm
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.median_abs_deviation.html
  - https://scikit-learn.org/stable/modules/outlier_detection.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html
updatedAt: 2026-11-23
---

## 개요

- 이상값은 "다른 값들에서 비정상적으로 멀리 떨어진 관측"이다(NIST 핸드북). **무엇이 비정상인지는 분석자가 정한다.** 그래서 정상 행동을 먼저 규정해야 한다.
- 탐지 규칙은 모두 "정상 분포 가정 + 거리 기준"의 조합이다. 규칙이 맞아 보여도 그 값이 오류인지, 진짜 극단 사례인지는 별개 판단이다.
- NIST 는 이상값이 공정이나 수집 과정에 대한 유용한 정보를 담는 경우가 많아, 삭제를 고려하기 전에 원인을 조사하라고 쓴다.

## 시험 범위 대응

- ADsP 데이터분석 > R기초와 데이터 마트 > 결측값 처리와 이상값 검색, ADP 실기 데이터 전처리·EDA(상자그림), 빅데이터분석기사 2과목 > 데이터 정제 > 이상값 처리에 대응한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 이상값 | outlier | 나머지 자료에서 비정상적으로 떨어진 관측. 오류일 수도, 진짜 값일 수도 있다 |
| 극단값 | extreme value | 분포의 꼬리에 있는 큰/작은 값. NIST 상자그림에서는 바깥 울타리(3×IQR) 밖의 점을 extreme outlier 로 부른다 |
| 노이즈 | noise | 측정·기록의 무작위 오차. 이상값과 달리 전체 자료에 퍼져 있다 |
| 사분위범위 | IQR | `Q3 − Q1` |
| 울타리 | fence | 상자그림에서 이상값 여부를 가르는 경계 |
| 가림 효과 | masking | 이상값이 여럿이면 서로 평균·표준편차를 부풀려 탐지를 방해하는 현상 |
| 마할라노비스 거리 | Mahalanobis distance | 공분산을 반영한 평균까지의 거리 |
| 이상 탐지 vs 신규성 탐지 | outlier vs novelty detection | 훈련자료에 이상값이 있다고 가정하는 비지도 / 훈련자료는 깨끗하다고 보고 새 관측을 판정하는 준지도 |

- "극단값"과 "이상값"을 같은 뜻으로 쓰는 교재가 많다. 위는 NIST 상자그림의 용법이다.

## 단변량 규칙

| 방법 | 규칙 | 특징 |
| --- | --- | --- |
| 상자그림 IQR | 안쪽 울타리 `Q1 − 1.5·IQR`, `Q3 + 1.5·IQR` 밖은 mild, 바깥 울타리 `±3·IQR` 밖은 extreme | 분포 가정 약함. **1.5 는 관례**(NIST 는 계수만 제시, Tukey 귀속은 미확인)지 통계적 임계값이 아님 |
| z-점수 | `(x − x̄)/s` 가 크면(관행적으로 2, 3) | 평균·표준편차가 이상값에 민감 → 가림 효과 |
| 수정 z-점수 | `0.6745·(x − 중앙값)/MAD` | 중앙값·MAD 사용으로 로버스트 |
| Grubbs 검정 | 최대 `|x − x̄|/s` 를 임계값과 비교 | 정규 가정, 이상값 **1개** |
| 일반화 ESD | 최대 r 개까지 순차 제거하며 통계량을 각자 임계값과 비교 | 정규 가정, 상한 r 만 지정 |

- **IQR 규칙**: NIST 와 R `boxplot.stats()` 모두 기본 계수 1.5 를 쓴다. R 은 사분위수 대신 힌지를 쓰므로 `quantile()` 기반 계산과 경계가 조금 다를 수 있다.
- **MAD**: 중앙값에서의 절대편차의 중앙값. 정규분포 표준편차와 맞추려면 약 1.4826 을 곱한다(scipy `scale='normal'`, 정규분포 0.75 분위수의 역수 약 0.67449). 수정 z 의 `0.6745` 가 이 상수다.
- **수정 z** `0.6745(x−중앙값)/MAD` 와 **임계값 3.5**(절댓값이 3.5 를 넘으면 잠재적 이상값)는 NIST 핸드북 1.3.5.17 이 Iglewicz & Hoaglin 의 권고로 전한다. 3.5 는 권고(관행)이며 원전(1993)은 직접 확인하지 못했다. 같은 절에 `z` 의 최댓값이 `(n−1)/√n` 이라는 서술도 있다.
- **Grubbs**: `G = max|Yᵢ − Ȳ|/s`. 양측 기각역: `G > ((N−1)/√N)·√(t²/(N−2+t²))`, `t` 는 자유도 N−2, 유의수준 α/(2N) 의 t 값(NIST). 정규성 가정, 한 번에 이상값 하나만 검정. 의심하는 이상값이 여럿이면 NIST 는 Tietjen-Moore 나 GESD 를 권한다.
- **GESD**: Grubbs 와 Tietjen-Moore 는 의심 이상값 개수 k 를 정확히 알아야 하지만 GESD 는 상한 r 만 지정하면 된다. 순차 Grubbs 는 가림 효과가 크면 일찍 멈추는 문제가 있다(NIST 예에서 순차 Grubbs 는 0 개, GESD 는 3 개 탐지). 임계값 근사는 n ≥ 25 에서 매우 정확, n ≥ 15 에서 어느 정도 정확하다(Rosner 모의실험, NIST 인용).

## 다변량·밀도·모형 기반

- **마할라노비스 거리**: `√((x − μ)ᵀ Σ⁻¹ (x − μ))`. 변수들이 상관되어 있으면 각 변수에서는 정상이어도 조합이 비정상인 점을 잡는다. 평균·공분산도 이상값에 민감하므로 로버스트 추정(MinCovDet)을 쓴다(sklearn `EllipticEnvelope`).
- **Isolation Forest**: 무작위 특성·분할값으로 나눌 때 이상값이 적은 분할로 고립된다는 아이디어. 평균 경로 길이가 짧을수록 이상.
- **LOF(Local Outlier Factor)**: 한 점의 국소 밀도를 이웃의 밀도와 비교한다. 이웃보다 밀도가 훨씬 낮으면 이상. 문서는 `n_neighbors=20` 을 일반적 시작점으로 보고, 이상값 비율이 약 10% 를 넘으면 더 크게(예: 35) 두라고 한다.
- **DBSCAN**: 밀도 기반 군집화이며 어느 핵심점의 `eps` 이웃에도 없는 점을 노이즈(라벨 −1)로 둔다. 기본값 `eps=0.5`, `min_samples=5`. `eps` 는 클러스터 내 최대 거리가 아니라 이웃 반경이며 가장 중요한 튜닝 모수라고 문서가 쓴다.
- sklearn 의 `contamination` 은 점수의 임계값을 정하며, `IsolationForest`·`LocalOutlierFactor` 기본은 `"auto"`, `EllipticEnvelope` 기본은 0.1(API 지식이며 이 문서 페이지에는 안 쓰여 있음). 문서는 고차원이나 분포 가정이 없는 이상 탐지가 매우 어렵다고 경고한다.

## 헷갈리는 구분

| 구분 | 설명 |
| --- | --- |
| 이상값 vs 노이즈 | 이상값은 소수의 떨어진 점, 노이즈는 전체에 퍼진 무작위 오차 |
| 이상값 vs 영향점 | 이상값은 `y` 가 멀리, 영향점은 회귀 결과를 크게 바꾸는 점. 레버리지가 크면 이상이 아니어도 영향이 크다 → [선형회귀 진단](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/) |
| 이상값 탐지 vs 신규성 탐지 | 훈련자료에 이상값이 섞였는지(outlier) vs 깨끗한지(novelty) |
| 처리 방침 | 삭제·대체·변환·유지는 탐지 결과와 별개로 원인을 보고 정한다 |

## 직접 계산

Python 3.15, numpy 2.5.5, scipy 1.18.1, scikit-learn 1.9.1.

**단변량.** `x = [10,12,11,13,12,11,14,10,12,13,11,12,45]` (n = 13)

| 방법 | 값 | 45 의 판정 |
| --- | --- | --- |
| IQR | Q1 = 11, Q3 = 13, IQR = 2 → 울타리 8 ~ 16, 바깥 울타리 19 | 바깥 울타리(19) 밖 → extreme |
| z-점수 | z = 3.302 | 2·3 기준 모두 초과 |
| 수정 z | 중앙값 12, MAD 1 → 22.26 | 3.5 기준을 크게 초과 |
| Grubbs | G = 3.302, 임계값(α = 0.05 양측) 2.462 | 이상값 |

- 한 자료에서 `z` 가 가질 수 있는 최댓값은 `(n−1)/√n` 으로, n = 13 에서 3.328 이다. 관측 3.302 는 거의 상한이다. 즉 자료가 작으면 "z > 3" 규칙은 어떤 점도 못 잡을 수 있다(n = 10 이면 상한 2.846).
- **가림 효과**: 45 옆에 46 을 하나 더 넣으면 z 는 2.31 과 2.39 로 둘 다 3 미만이어서 z 규칙은 둘을 놓쳤다. 수정 z 는 22.3, 22.9 로 여전히 크게 잡았다. 평균과 표준편차가 두 이상값 때문에 부풀었기 때문이다.

**다변량.** 상관 0.9 인 2 변수 정규 300 점 + 점 `(1.5, −1.5)`.

- 이 점의 변수별 z 는 1.5 와 −1.51 로 평범하지만, 마할라노비스 거리는 6.5 로 301 점 중 1 위였다. 참고로 자유도 2 카이제곱의 97.5% 분위수의 제곱근은 2.72. 상관 구조를 무시하면 놓친다.

**sklearn.** 2차원 정규 200 점 + 이상값 2 개 `(6, 6)`, `(7, −6)`, 시드 고정, 기본 설정.

| 방법 | 설정 | 두 이상값 탐지 | 전체 플래그 수 |
| --- | --- | --- | --- |
| IsolationForest | `contamination='auto'` | 예 | 26 |
| LocalOutlierFactor | `n_neighbors=20` | 예 | 10 |
| DBSCAN | `eps=0.7`, `min_samples=5` | 예(노이즈 −1) | 6 |

- 세 방법 모두 두 점을 잡았지만 정상 점을 얼마나 함께 플래그하느냐는 설정에 크게 좌우된다. 특히 Isolation Forest 는 이 기본 설정에서 202 점의 약 13% 를 이상으로 표시했다. 임계값을 자료와 목적에 맞게 정한다. `eps=0.7` 은 필자가 임의로 고른 값이다.
- 시드 의존 값(수치는 형태 확인용).

## 처리 방침

| 방침 | 쓸 때 | 주의 |
| --- | --- | --- |
| 삭제 | 입력·측정 오류가 확인됨 | 표본 감소, 편향 가능. 근거를 기록 |
| 대체(결측 처리 후 대치, 윈저화·캡) | 오류지만 행은 유지해야 함 | 분포가 변형된다 → [결측값 처리](/develop-wiki/knowledge/data-analytics/missing-values-handling-mechanisms/) |
| 변환(로그 등) | 오른쪽 꼬리가 길어 극단값처럼 보임 | 해석이 바뀐다 → [변환·스케일링](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/) |
| 유지·별도 분석 | 진짜 극단 사례(사기 탐지의 사기 건) | 로버스트 방법이나 별도 모델을 쓴다 |

## 언제 쓰나 / 주의

- 모델 입력 점검, 센서·로그 오류 찾기, 이상 거래 후보 추리기. 규칙은 후보를 추리는 도구이고, 판정은 도메인 지식과 함께 한다.
- 정규 가정 검정(Grubbs·GESD)을 비정규·치우친 자료에 쓰면 정상적인 꼬리를 이상으로 본다.
- 이상값이 많은 자료에서는 평균·표준편차 기반 규칙보다 중앙값·MAD·IQR 이 안정적이다.
- 이상값을 지운 뒤 같은 규칙을 반복 적용하면 계속 새 이상값이 나온다(경계가 안쪽으로 이동). 반복 횟수 기준을 사전에 정한다.

## 검증 범위

- 읽은 것: NIST 핸드북(이상값 정의·상자그림 울타리·Grubbs·GESD 절), scipy `median_abs_deviation`, scikit-learn 이상 탐지 User Guide·`DBSCAN` API. 단변량·다변량·sklearn 수치는 직접 실행.
- 미확인: Iglewicz & Hoaglin 1993 원전(3.5 와 `(n−1)/√n` 은 NIST 1.3.5.17 에서 확인), Tukey 1977 원전, LOF·Isolation Forest 원 논문, `EllipticEnvelope`·`contamination` 기본값(문서 외 API 지식), R 코드(실행 안 함).
- 수험 교재의 "ESD(Extreme Studentized Deviation)" 설명과 NIST 의 Generalized ESD 가 같은 대상인지 필자가 교재를 확인하지 않았다.
