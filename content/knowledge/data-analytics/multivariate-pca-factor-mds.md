---
title: 다변량 분석 개관과 PCA·요인분석·MDS (Multivariate Analysis, PCA, Factor Analysis, MDS)
aka: [Multivariate Analysis, PCA, Principal Component Analysis, Factor Analysis, MDS, Multidimensional Scaling, 주성분분석, 요인분석, 다차원척도법]
category: data-analytics
group: statistics
level: intermediate
summary: 다변량 분석 기법(주성분·요인·판별·군집·MANOVA·정준상관·MDS)을 한 줄씩 구분하고, PCA 의 공분산/상관 행렬·고유값·설명 분산 비율, 요인분석과의 차이, MDS 를 직접 계산으로 정리한다.
tags: [multivariate, pca, factor-analysis, mds, eigenvalue, scree-plot, dimensionality-reduction]
related: [data-analytics/feature-selection-dimensionality-reduction, data-analytics/correlation-pearson-spearman-kendall, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/linear-regression-diagnostics-multicollinearity, machine-learning/clustering-kmeans-hierarchical-dbscan, machine-learning/learning-paradigms-supervised-unsupervised-reinforcement]
sources:
  - https://scikit-learn.org/stable/modules/decomposition.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
  - https://scikit-learn.org/stable/modules/manifold.html#multidimensional-scaling
  - https://scikit-learn.org/stable/modules/lda_qda.html
  - https://scikit-learn.org/stable/modules/cross_decomposition.html
  - https://www.statsmodels.org/stable/generated/statsmodels.multivariate.manova.MANOVA.html
  - https://arxiv.org/html/2503.24248v1
updatedAt: 2026-11-23
---

## 개요

- 다변량 분석은 변수가 여럿인 자료를 한꺼번에 다루는 기법 묶음이다. 목적은 크게 (1) 변수 요약·축소, (2) 개체 분류·집단 비교, (3) 변수 집합 간 관계 파악이다.
- PCA 는 분산을 최대한 보존하는 직교 축으로 자료를 다시 표현한다. 요인분석은 관측 변수 뒤의 잠재 요인 모형을 세우고, MDS 는 개체 간 거리(비유사도)를 낮은 차원 지도로 옮긴다.
- 이 셋은 혼동하기 쉽다. 입력(원자료 vs 거리 행렬)과 가정(분산 보존 vs 잠재 변수 모형)이 다르다.

## 시험 범위 대응

- ADsP 데이터분석 > 통계분석 > 다변량 분석, ADP 실기 통계 영역 > 다변량 분석·기계학습 영역 EDA(차원 축소), 빅데이터분석기사 3과목 > 고급 분석기법(다변량 분석)·2과목 > 분석 변수 처리(차원축소)에 대응한다.

## 다변량 기법 한 줄 구분

| 기법 | 한 줄 | 반응변수 필요 | 출처 확인 |
| --- | --- | --- | --- |
| 주성분분석(PCA) | 분산이 큰 직교 방향으로 변수를 요약 | 아니오 | sklearn 문서 |
| 요인분석(FA) | 관측 변수를 소수의 잠재 요인 + 변수별 잡음으로 설명 | 아니오 | sklearn 문서 |
| 다차원척도법(MDS) | 개체 간 비유사도를 저차원 점 배치로 근사 | 아니오 | sklearn 문서 |
| 군집분석 | 비슷한 개체끼리 묶음 → [군집분석](/develop-wiki/knowledge/machine-learning/clustering-kmeans-hierarchical-dbscan/) | 아니오 | 별도 노트 |
| 판별분석(LDA) | 클래스별 가우시안(공통 공분산)을 가정해 분류하거나 클래스를 잘 가르는 방향으로 축소 | 예(클래스) | sklearn 문서 |
| 다변량 분산분석(MANOVA) | 종속변수 여럿에 대한 집단 효과를 동시에 검정(다변량 회귀 기반) | 예 | statsmodels 문서(검정 통계량은 미확인) |
| 정준상관분석(CCA) | 두 변수 집합의 선형 투영 간 관계를 찾음 | 두 집합 | sklearn 에서 PLS 의 특수한 경우로만 설명(상관 최대화 서술은 문서에 없음) |

- 표의 MANOVA 검정 통계량(Wilks 등)과 CCA 의 상관 최대화 정의는 이 노트가 읽은 출처에서 확인하지 못했다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 주성분 | principal component | 분산을 차례로 최대화하는, 서로 직교하는 선형결합 |
| 고유값 | eigenvalue | 해당 주성분 방향의 분산 |
| 설명 분산 비율 | explained variance ratio | 한 성분의 고유값 / 전체 분산(고유값 합) |
| 적재 | loading | 변수가 성분에 기여하는 정도. 단위길이 고유벡터를 가리키기도, 고유벡터×√고유값(성분과 변수의 상관)을 가리키기도 한다 |
| 스크리 플롯 | scree plot | 고유값을 큰 순서로 그린 그림 |
| 잠재 요인 | latent factor | 관측되지 않고 변수들의 공통 변동을 만든다고 가정하는 변수 |
| 고유분산 | noise variance, uniqueness | 요인으로 설명되지 않는 변수별 분산(`Ψ` 의 대각) |
| 스트레스 | stress | MDS 의 적합 손실. 임베딩 거리와 목표(비)유사도 차이의 제곱합 |

## PCA

- scikit-learn 은 PCA 를 "차례로 가능한 한 많은 분산을 담는 직교 성분"으로 분해하며, 특성별로 **평균을 빼지만 척도는 맞추지 않는다**. 단위가 다른 변수는 먼저 표준화해야 한다.
- 공분산 행렬로 하면 단위가 큰 변수가 지배하고, 상관 행렬(= 표준화 후 공분산)로 하면 모든 변수가 동등하다. 단위가 서로 다르면 후자가 일반적이다.
- `explained_variance_` 는 `n − 1` 로 계산한 공분산 행렬의 큰 고유값들과 같고(문서), `explained_variance_ratio_` 는 그 비율이다. `components_` 는 단위길이 고유벡터다. **성분의 부호는 임의**라 결과마다 뒤집힐 수 있다.
- 성분 수 선택 기준은 전부 **경험칙**이다.

| 기준 | 내용 | 한계(읽은 문헌) |
| --- | --- | --- |
| 누적 설명 분산 | 70~80% 등 정한 비율까지 | 기준값이 임의 |
| Kaiser 규칙 | 상관 행렬에서 고유값 > 1 인 성분만 | 변수 수에 민감, 과다·과소 선택 보고 |
| 스크리 플롯(Cattell) | 곡선이 꺾이는 "팔꿈치" 앞까지 | 시각 판단, 꺾임이 불분명할 수 있음 |
| `n_components='mle'` | Minka 의 MLE 로 차원 추정(sklearn 옵션) | `svd_solver='full'` 필요 |

  위 세 경험칙의 정의와 약점은 arXiv 2503.24248(2025, Weeraratne·Hunt·Kurz, 미심사 프리프린트, 단일 시뮬레이션·실자료 근거. 초록과 본문 표가 서로 어긋나는 부분이 있어 방향은 단정하지 않는다)의 서술을 읽은 것이다. 이 논문은 셋이 같은 자료에서 자주 엇갈린다고 보고한다. Kaiser(1960)·Cattell(1966) 원전과 Horn 의 병렬분석은 직접 읽지 않았다.

## 요인분석 vs PCA

- sklearn 의 요인분석 모형: `x = Wh + μ + ε`, `h ~ N(0, I)`, `ε ~ N(0, Ψ)`. 주변분포는 `N(μ, WWᵀ + Ψ)`.
- `Ψ = σ²I`(모든 변수 같은 잡음)이면 확률적 PCA, `Ψ = diag(ψ₁…ψₙ)`(변수마다 다른 잡음)이면 요인분석이다. 즉 확률적 PCA 와 요인분석의 차이는 Ψ 구조(σ²I 대 diag)라고 문서가 설명한다. 표의 목적·회전 행은 필자 정리다.
- 요인분석은 변수별 잡음을 따로 모델링할 수 있어 이분산 잡음에 유리하다. 요인 적재 열이 PCA 성분과 비슷해 보여도 일반적 보장은 없고, 직교하지 않을 수 있다.
- 요인분석 뒤에는 해석을 쉽게 하려고 회전(varimax 등)을 한다. varimax 는 제곱 적재의 분산을 최대화해 변수가 소수 요인에만 크게 걸리게 한다(simple structure).

| 구분 | PCA | 요인분석 |
| --- | --- | --- |
| 목적 | 분산 보존·차원 축소 | 변수 간 공통 변동의 잠재 구조 설명 |
| 모형 | 선형결합(성분이 변수의 함수) | 변수가 요인의 함수 + 변수별 고유 잡음 |
| 잡음 | 따로 모델링 안 함(확률적 PCA 는 동일 σ²) | 변수마다 다른 ψ |
| 회전 | 보통 안 함 | 해석을 위해 흔히 함 |

## MDS

- sklearn 문서: 비유사도 `δᵢⱼ` 를 임베딩 거리 `dᵢⱼ(Z)` 로 근사하는 배치를 찾는다. 원스트레스는 `Σ_{i<j}(d̂ᵢⱼ − dᵢⱼ(Z))²`.
- **계량(metric) MDS**: `d̂ = δ`. **비계량(non-metric) MDS**: 순서만 보존하도록 등위 회귀(isotonic regression)로 `d̂` 를 만들고 정규화 스트레스(Stress-1)를 쓴다.
- **고전적 MDS(주좌표분석, Torgerson)**: 스트레인(strain)을 최소화하고, 이중 중심화한 Gram 행렬 `B = −½CΔC` 의 고유분해로 정확히 풀린다. 입력이 유클리드 거리면 PCA 와 같다(문서).
- PCA 는 원자료 `X` 가, MDS 는 거리 행렬만 있으면 된다. 변수가 없고 개체 간 유사도만 있을 때(설문 유사도, 도시 간 거리) MDS 를 쓴다.
- 입력 거리가 비유클리드면 PCA 와 같다는 보장이 없다(이 노트에서 확인하지 않음).

## 직접 계산

Python 3.15, numpy 2.5.5, scikit-learn 1.9.1. Iris 4 변수(150 행).

| 행렬 | 고유값 | 설명 분산 비율 | 누적 |
| --- | --- | --- | --- |
| 공분산 | 4.228, 0.243, 0.078, 0.024 | 0.925, 0.053, 0.017, 0.005 | PC1 0.925, PC2 까지 0.978 |
| 상관 | 2.919, 0.914, 0.147, 0.021 | 0.730, 0.229, 0.037, 0.005 | PC1 0.730, PC2 까지 0.958 |

- 공분산 행렬을 쓰면 분산이 큰 꽃잎 길이가 PC1 을 지배했다(PC1 고유벡터 성분 −0.857). 상관 행렬은 네 변수가 −0.52, 0.27, −0.58, −0.57 로 비교적 고르게 걸린다.
- 고유값 합은 변수 수(상관 행렬에서 4)이고, 공분산 행렬에서는 분산 합(4.573)이다.
- 상관 행렬의 Kaiser 규칙은 성분 1 개(2.919 > 1, 0.914 < 1), 80% 누적 기준은 2 개를 가리켜 **경험칙끼리 결론이 갈렸다**.
- sklearn `PCA` 를 `StandardScaler` 출력(표준편차는 `n` 으로 나눈 값)에 적용하면 `explained_variance_` 는 2.938… 로 `np.corrcoef` 의 2.919 와 `150/149` 배 차이가 나지만 비율은 같다(0.7296).
- 요인분석(2 요인, 표준화 자료, 회전 없음): 변수별 잡음 분산이 0.024, 0.519, 0.001, 0.071 로 sepal width 가 요인으로 설명되지 않는 몫이 가장 컸다.
- 고전적 MDS(유클리드 거리 행렬 → `−½CΔC` 고유분해) 첫 두 좌표와 PCA 점수의 상관 절댓값은 둘 다 1.0(소수 6 자리). 입력이 유클리드 거리일 때 PCA 와 같다는 문서 설명과 일치했다.
- 모든 수치는 결정적 계산이며 시드 의존 아님(MDS SMACOF 는 이 노트에서 결과를 인용하지 않음).

## 언제 쓰나 / 주의

- 상관이 높은 변수를 소수 축으로 요약해 [다중공선성](/develop-wiki/knowledge/data-analytics/linear-regression-diagnostics-multicollinearity/)을 줄이거나 시각화(2차원)·군집 전처리에 쓴다 → [변수 선택·차원 축소](/develop-wiki/knowledge/data-analytics/feature-selection-dimensionality-reduction/)
- PCA 는 분산이 큰 방향이 중요한 방향이라고 가정한다. 분류에 중요한 방향이 분산이 작을 수도 있다.
- 표준화 여부가 결과를 바꾼다 → [스케일링](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/)
- 성분은 원 변수의 혼합이라 해석이 어렵다. 해석이 목적이면 요인분석 + 회전을 고려한다.
- "정규성" 같은 가정은 PCA 의 기술적 사용에는 필요 없지만, 확률적 모형(요인분석의 우도)은 가우시안을 가정한다.

## 검증 범위

- 읽은 것: scikit-learn 문서(분해·PCA API·manifold MDS 절·LDA/QDA·cross decomposition), statsmodels MANOVA 페이지, arXiv 2503.24248 의 성분 수 선택 기준 서술. Iris 계산은 직접 실행.
- **ESL(Hastie 등)은 읽지 못했다.** PCA·요인분석·MDS 의 교과서 서술은 미확인이다.
- 미확인: MANOVA 검정 통계량, CCA 의 상관 최대화 정의, Kaiser(1960)/Cattell(1966)/Horn(1965) 원전, 적재의 정의가 교재마다 다르다는 서술의 출처(sklearn 문서 서술과 필자 정리), 요인 수 결정·KMO·Bartlett 검정.
- 수험 교재에서 "요인분석 vs 주성분분석" 구분 방식이 다를 수 있다.
