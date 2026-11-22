---
title: 군집 평가와 군집 수 선택 — 실루엣·엘보·갭 통계량
aka: [Cluster Validation, Silhouette Coefficient, Elbow Method, Calinski-Harabasz, Davies-Bouldin, Dunn index, Gap statistic, ARI, NMI]
category: machine-learning
group: unsupervised
level: intermediate
summary: 정답 없이 군집 품질을 재는 내부 지표(실루엣·CH·DB·Dunn)와 정답 레이블과 비교하는 외부 지표(ARI·NMI), 엘보·갭 통계량으로 군집 수를 고르는 법과 한계를 직접 계산으로 정리한다.
tags: [clustering, silhouette, elbow, gap-statistic, ari, nmi, evaluation]
related: [machine-learning/clustering-kmeans-hierarchical-dbscan, machine-learning/classification-metrics-confusion-matrix-roc, machine-learning/learning-paradigms-supervised-unsupervised-reinforcement, data-analytics/feature-selection-dimensionality-reduction]
sources:
  - https://scikit-learn.org/stable/modules/clustering.html
  - https://stat.ethz.ch/R-manual/R-devel/library/cluster/html/clusGap.html
  - https://en.wikipedia.org/wiki/Dunn_index
updatedAt: 2026-11-23
---

## 개요

- 군집에는 정답이 없어서 "좋다"를 재려면 기준이 필요하다. 기준은 두 갈래다.
  - **내부 평가**: 데이터와 군집 배정만으로 응집(군집 안이 가까움)·분리(군집끼리 멂)를 잰다.
  - **외부 평가**: 이미 아는 정답 레이블(또는 다른 군집 결과)과 얼마나 일치하는지 잰다.
- 같은 지표를 군집 수 k 를 바꿔가며 계산해 k 를 고르는 데 쓰기도 하지만, 지표는 알고리즘의 가정(볼록한 군집)을 같이 반영한다.

## 시험 범위 대응

ADsP·ADP 데이터분석(군집분석) / ADP 실기(모델 평가·선택) / 빅데이터분석기사 3·4과목(군집분석, 평가 지표). 실루엣·엘보 등 개별 지표 이름은 공식 출제범위에 직접 항목으로 나와 있지 않다(공식 출제범위에 직접 항목 없음. 관련: 군집분석, 평가 지표).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 실루엣 계수 | silhouette coefficient | 점마다 `s = (b − a) / max(a, b)`. a=같은 군집 내 평균 거리, b=가장 가까운 다른 군집까지 평균 거리. 범위 −1~+1 |
| 칼린스키-하라바츠 지수 | Calinski-Harabasz, variance ratio criterion | 군집 간 분산합 대 군집 내 분산합의 비에 자유도 보정. 높을수록 좋음 |
| 데이비스-볼딘 지수 | Davies-Bouldin | 군집별로 가장 비슷한 다른 군집과의 (산포 합 / 중심 거리) 최댓값의 평균. 낮을수록 좋음, 최솟값 0 |
| 던 지수 | Dunn index | 군집 사이 최소 거리 ÷ 군집 내 최대 거리(지름). 높을수록 좋음 |
| 조정 랜드 지수 | adjusted Rand index, ARI | 두 군집 결과의 짝(pair) 일치도를 우연 기대치로 보정. 우연 수준이 0 |
| 정규화 상호정보 | normalized mutual information, NMI | 두 군집 결과의 상호정보를 엔트로피 평균으로 나눈 값 |
| 관성 | inertia | 군집 내 제곱합(WSS). 군집 수가 늘면 항상 줄어든다 |

## 내부 평가 식 (scikit-learn 문서 기준)

- 실루엣: 전체 점수는 점별 값의 평균. 0 근처는 군집이 겹침.
- Calinski-Harabasz: `s = tr(B_k)/tr(W_k) × (n − k)/(k − 1)`. W_k 는 군집 내 산포, B_k 는 군집 간 산포.
- Davies-Bouldin: `R_ij = (s_i + s_j)/d_ij`, `DB = (1/k) Σ_i max_{j≠i} R_ij`. s_i 는 중심까지 평균 거리. 중심 거리를 쓰므로 유클리드 공간에 한정된다.
- Dunn: scikit-learn 에는 없다. Dunn 이 1970년대 초에 제안했고(Wikipedia 는 1973·1974 를 함께 적으며 원논문은 미확인), 분모가 최댓값이라 군집 하나만 엉성해도 값이 크게 떨어지는 "최악 사례" 지표다(Wikipedia 보조 확인).
- 공통 한계: scikit-learn 문서는 실루엣·CH·DB 세 곳에 모두 "볼록한 군집이 DBSCAN 같은 밀도 기반 군집보다 일반적으로 높다"는 같은 문장을 쓴다. DB 는 낮을수록 좋아서 방향이 헷갈리므로, 밀도 기반 군집은 이 지표들에서 불리하게 나오기 쉽다고 읽는 것이 안전하다.

## 외부 평가 (정답 또는 비교 대상이 있을 때)

- 랜드 지수 RI = (같은 쪽끼리 짝 + 다른 쪽끼리 짝)/전체 짝 수. 우연히도 1 근처가 나오기 쉬워 ARI 를 쓴다. ARI = (RI − E[RI]) / (max RI − E[RI]), 범위 [−0.5, 1], 무작위 배정은 0 근처.
- NMI = MI / 평균(H(U), H(V)). 상한 1. **우연 보정이 없어 군집 수가 많아질수록 커지는 경향**이 있어 AMI(보정판)가 쓰인다(scikit-learn 문서).
- 둘 다 **군집 번호 이름표에 무관**하다. 레이블 0/1 을 뒤바꿔도 값이 같다.
- 동질성(homogeneity)·완결성(completeness)·V-measure, Fowlkes-Mallows 도 같은 계열이다.
- 이름은 비슷하지만 분류의 정확도·F1([분류 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/))과는 다르다. 군집은 번호가 임의이므로 짝 단위 또는 정보량으로 비교한다.

## 군집 수 선택

- **엘보 방법**: k 를 늘리며 inertia 를 그리고 감소가 꺾이는 지점을 고른다. 판독이 주관적이다. inertia 는 k 가 늘면 항상 감소하므로 꺾임이 없으면 결정할 수 없다.
- **실루엣 최대화**: k 별 평균 실루엣이 가장 큰 k.
- **갭 통계량**(Tibshirani·Walther·Hastie 2001): log W_k 를 기준 분포(군집 구조가 없는 균등분포)에서 기대되는 값과 비교한다. R `cluster::clusGap` 문서 기준, 기준 표본은 데이터 범위의 균등분포이고 기본값은 PCA 회전을 적용한다. Tibshirani 규칙(clusGap 의 `method="Tibs2001SEmax"`; clusGap 의 기본은 `firstSEmax` 로 다른 규칙이다)은 "Gap(k) ≥ Gap(k+1) − SE(k+1)" 를 만족하는 최소 k 를 고른다. 이 규칙은 표준오차가 크면 k=1 을 고를 수 있다(clusGap 문서).

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1, numpy seed 고정; seed 의존 값은 그렇게 표시).

**1. 4개 블롭(`make_blobs(300, centers=4, cluster_std=1.0, random_state=7)`), K-means(n_init=10)**

| k | inertia | 실루엣 | CH | DB |
| --- | --- | --- | --- | --- |
| 2 | 9027.1 | 0.594 | 438.6 | 0.780 |
| 3 | 2503.3 | 0.766 | 1175.1 | 0.336 |
| 4 | 571.3 | **0.807** | **3754.7** | **0.272** |
| 5 | 511.1 | 0.707 | 3146.1 | 0.570 |
| 8 | 347.5 | 0.356 | 2637.4 | 1.088 |

- inertia 는 k=4 에서 급격히 꺾이고(2503 → 571) 이후 완만하다. 세 지표도 k=4 에서 최선. 이 경우 엘보와 지표가 일치한다.
- 이 데이터에서 k=4 의 ARI·NMI 는 둘 다 1.0(정답과 완전 일치).

**2. 군집이 없는 균등분포(`default_rng(0)`, 300×2)**: inertia 는 k=2 에서 30.04, 8 에서 5.80 으로 매끄럽게 줄어 뚜렷한 엘보가 없다. 실루엣은 0.36~0.40 에서 거의 평평(k=6 이 0.403)하다. 구조가 없어도 숫자는 나온다.

**3. 갭 통계량(위 블롭, 기준 표본 20개, 균등분포 범위 상자, 직접 구현·seed 의존)**: Gap(1..8) = 0.004, 0.308, 1.202, 2.256, 2.152, 2.070, 2.031, 2.016. Tibshirani 규칙을 적용하면 k=4. SE 계산식은 직접 구현한 형태이며 논문 원문으로 검증하지 않았다.

**4. 외부 지표 성질**: 정답 `[0,0,0,1,1,1]`, 예측 `[0,0,1,1,2,2]` → RI 0.667, ARI 0.242, NMI 0.516, AMI 0.299(sklearn 사용자 가이드 예제는 0.225 로 출력돼 있는데, 이는 `average_method='max'` 값이다. 기본값 arithmetic 에서 직접 재계산하면 0.299 다). 레이블을 뒤바꾼 `[1,1,1,0,0,0]` → ARI 1.0. 6개를 모두 따로 군집(`[0,1,2,3,4,5]`)하면 ARI 0.0, **NMI 0.558**, AMI 0.0. 군집을 잘게 쪼개기만 해도 NMI 는 올라간다.

**5. 달 모양(`make_moons(300, noise=0.05, random_state=0)`)**: 정답 레이블의 실루엣은 0.328, K-means(k=2)의 실루엣은 0.489. **정답보다 틀린 군집이 내부 지표는 더 높다.** 볼록 가정의 영향이다.

**6. Dunn(직접 구현)**: 같은 블롭에서 k=3 → 0.605, k=4 → 0.431, k=5 → 0.037. k=4 에서 최대가 아니다. 지표가 서로 다른 k 를 가리킬 수 있다.

## 언제 쓰나 / 주의

- 여러 알고리즘·k 후보를 **같은 지표 하나로만** 비교하지 말고 2~3개 지표와 시각화를 함께 본다.
- 내부 지표는 알고리즘의 가정을 닮은 군집을 선호한다. 밀도 기반 결과를 실루엣으로 깎는 것은 부당할 수 있다.
- 외부 지표가 있는 경우도 정답 레이블이 "유일한 진리"인지 확인한다(레이블 자체가 다른 기준의 분류일 수 있다).
- 변수 스케일·차원·표본이 바뀌면 지표 값이 바뀐다. 다른 데이터끼리 값을 비교하지 않는다.
- 최종 k 는 지표 + 해석 가능성(군집 프로파일이 업무 의미를 갖는가) + 안정성(부트스트랩·시드 변경에도 유지되는가)로 정한다. 마지막 두 가지는 필자 권고다.

## 검증 범위

- 읽음: scikit-learn 군집 평가 절(실루엣·CH·DB·ARI·NMI/AMI·V-measure 계열의 정의·범위·한계), R cluster 패키지 `clusGap` 도움말(기준 분포·maxSE 규칙, Tibshirani 2001 인용), Dunn 지수 Wikipedia(보조).
- 실행: 위 1~6 모든 표.
- 미확인: Rousseeuw(1987) 원논문(paywall)과 Tibshirani 등(2001) 원논문(접속 불가)은 읽지 못했다. 갭 통계량의 정의식 `Gap(k) = E*[log W_k] − log W_k` 는 clusGap 도움말의 서술("log W(k) 와 기준 분포 기대값 비교")을 식으로 옮긴 것이며, 표준오차 식은 원논문 확인 전이다. Davies-Bouldin·Calinski-Harabasz 원논문도 읽지 않았다.
