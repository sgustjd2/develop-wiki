---
title: 군집분석 — K-means·계층적 군집·DBSCAN
aka: [Clustering, K-means, Hierarchical Clustering, Agglomerative, Ward linkage, Dendrogram, DBSCAN, 군집화]
category: machine-learning
group: unsupervised
level: intermediate
summary: 정답 레이블 없이 비슷한 관측치를 묶는 군집분석의 대표 세 방식(중심 기반 K-means, 병합형 계층적 군집, 밀도 기반 DBSCAN)을 목적함수·가정·파라미터 중심으로 비교하고, 달 모양 데이터에서 직접 계산한 차이를 보인다.
tags: [clustering, kmeans, hierarchical, dbscan, unsupervised, scikit-learn]
related: [machine-learning/cluster-validation-silhouette-elbow, machine-learning/association-rules-apriori-fp-growth, machine-learning/learning-paradigms-supervised-unsupervised-reinforcement, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/outlier-detection-methods, data-analytics/feature-selection-dimensionality-reduction, data-analytics/multivariate-pca-factor-mds]
sources:
  - https://scikit-learn.org/stable/modules/clustering.html
  - https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html
  - https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf
  - https://cdn.aaai.org/KDD/1996/KDD96-037.pdf
updatedAt: 2026-11-23
---

## 개요

- 군집분석은 정답 레이블 없이 **서로 비슷한 관측치끼리 묶는** 비지도 학습이다. 고객 세분화, 이상 징후 후보 찾기, 탐색적 분석에 쓴다.
- "비슷하다"의 정의(거리·밀도·분산)가 알고리즘마다 다르고, 정답이 없으므로 **어떤 가정을 깔았는지**가 결과를 좌우한다.
- 이 노트는 세 계열을 다룬다. 군집이 잘 됐는지 재는 법은 [군집 평가](/develop-wiki/knowledge/machine-learning/cluster-validation-silhouette-elbow/).

## 시험 범위 대응

ADsP 데이터분석(정형 데이터 마이닝: 군집분석) / ADP 데이터분석(같은 항목) 및 실기(EDA의 군집, 모델 구축의 군집화, 초매개변수 조율) / 빅데이터분석기사 3과목 빅데이터 모델링(분석기법: 군집분석).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 군집 | cluster | 서로 가깝거나 밀집한 관측치의 묶음 |
| 중심(점) | centroid | K-means 에서 군집 소속 관측치의 평균점 |
| 관성(군집 내 제곱합) | inertia, within-cluster sum of squares | 각 점과 가장 가까운 중심 사이 제곱거리의 합. K-means 가 줄이는 값 |
| 연결법 | linkage | 두 군집 사이 거리를 정의하는 규칙(단일·완전·평균·Ward) |
| 덴드로그램 | dendrogram | 계층적 군집의 병합 과정을 나무 모양으로 그린 그림 |
| 핵심점 | core sample/point | 반경 eps 안에 min_samples 이상의 점(자기 포함)이 있는 점 |
| 경계점 | border point (sklearn: non-core sample) | 핵심점의 이웃이지만 자신은 핵심점이 아닌 점 |
| 잡음 | noise (label -1) | 어느 군집에도 속하지 않는 점 |

## K-means

- 목적: 군집 수 k 를 정해 두고 `inertia = Σ_i min_j ‖x_i − μ_j‖²` 를 줄이는 중심 k 개를 찾는다 (scikit-learn 문서의 식).
- Lloyd 알고리즘: 중심 k 개로 시작 → 각 점을 가장 가까운 중심에 배정 → 중심을 배정된 점들의 평균으로 갱신 → 안정될 때까지 반복. 총 오차는 단조 감소해 반드시 끝나지만 **지역 최적**일 수 있다(Arthur & Vassilvitskii 2007).
- k-means++: 첫 중심을 무작위로 고르고, 이후 중심을 "이미 뽑힌 중심까지 거리 D(x)의 제곱에 비례하는 확률"로 고른다. 논문은 이 시딩만으로 최적 비용 대비 기대 O(log k) 배 이내를 보인다. scikit-learn 은 `init='k-means++'` 를 쓴다.
- 가정·한계(scikit-learn 문서): inertia 는 군집이 **볼록하고 등방(구형)** 이라고 가정한다. 길쭉하거나 휜 모양에 약하다. 고차원에서는 유클리드 거리가 부풀어 PCA 로 먼저 줄이길 권한다.
- **k 를 미리 정해야 한다**. 거리 기반이라 변수 단위(스케일)에 민감하다.

## 계층적 군집 (병합형 기준)

- 병합형(agglomerative, 상향식): 모든 점을 각자 군집으로 두고 가장 가까운 두 군집을 합치기를 반복. 분할형(divisive, 하향식)은 그 반대. scikit-learn 은 병합형을 제공한다.
- 군집 간 거리 규칙(scikit-learn 문서 서술):

| 연결법 | 합칠 군집을 고르는 기준 |
| --- | --- |
| 단일(single) | 두 군집의 **가장 가까운** 관측치 쌍 거리 최소 |
| 완전(complete) | 두 군집의 **가장 먼** 관측치 쌍 거리 최소 |
| 평균(average) | 두 군집 모든 쌍 거리의 평균 최소 |
| Ward | 합쳤을 때 군집 내 제곱합 증가가 최소. 유클리드 거리에만 쓸 수 있다 |

- 문서는 병합형이 'rich get richer' 성향으로 군집 크기가 불균등해지기 쉽고, 그 점에서 단일 연결이 가장 나쁘며 Ward 가 가장 고른 크기를 준다고 적는다.
- 덴드로그램을 어느 높이에서 자르느냐가 군집 수를 정한다. k 를 미리 정하지 않아도 되지만, 모든 쌍 거리가 필요해 큰 데이터에는 비싸다.

## DBSCAN

- Ester·Kriegel·Sander·Xu(KDD-96)의 밀도 기반 방식. 파라미터는 반경 `eps`, 최소 이웃 수 `MinPts`(sklearn `min_samples`, 기본 5, **자기 자신 포함**). sklearn 사용자 가이드 본문은 'other samples' 라고 적어 API 문서와 표현이 다르다. 여기서는 API 문서와 원 논문(핵심점 조건 |N_Eps(q)| ≥ MinPts)을 따랐다.
- 핵심점: eps 안에 min_samples 개 이상. 군집 = 핵심점끼리 이웃으로 이어진 집합 + 그 핵심점의 eps 안에 있는 경계점. 어디에도 속하지 않으면 잡음(-1).
- **군집 수를 정하지 않고**, 임의 모양을 찾고, 잡음을 따로 분리한다.
- eps 는 가장 중요한 파라미터(sklearn). 너무 작으면 대부분 잡음, 너무 크면 군집이 합쳐진다. 원 논문은 정렬한 k-dist 그래프의 첫 "골짜기"에서 eps 를 찾는 휴리스틱을 제안한다.
- 밀도가 군집마다 크게 다르면 하나의 eps 로 맞추기 어렵다는 점은 일반적으로 알려진 한계이며 이 노트에서 별도 실험은 하지 않았다. 경계점이 두 군집의 핵심점 사이에 걸치면 데이터 순서에 따라 배정이 달라질 수 있다(sklearn 문서).

## 다른 방식과의 구분 (한 줄)

| 방식 | 구분점 | 근거 상태 |
| --- | --- | --- |
| 혼합분포(GMM, EM) | 군집마다 공분산이 있는 가우시안으로 모형화해 **소속 확률**을 낸다. K-means 는 군집별 공분산이 같고 작은 특수 경우(sklearn 문서) | sklearn 확인 |
| K-medoids(PAM) | 중심이 실제 관측치(medoid)이고 임의의 비유사도를 쓸 수 있어 이상값에 덜 민감. Kaufman & Rousseeuw 1990 | Wikipedia 보조 확인, 원전 미확인 |
| SOM(자기조직화 지도) | 군집이라기보다 고차원 자료를 2차원 격자에 옮기는 비지도 신경망(Kohonen) | Wikipedia 보조 확인, 원전 미확인 |

## 직접 계산

직접 계산(Python 3.15, scikit-learn 1.9.1, `make_moons(300, noise=0.05, random_state=0)`, 정답 레이블은 달 모양 두 개). 결과는 이 seed·설정에서의 값이다.

| 방법 | 설정 | ARI (1 에 가까울수록 정답과 일치) |
| --- | --- | --- |
| K-means | k=2, n_init=10 | 0.241 |
| DBSCAN | eps=0.2, min_samples=5 | 1.000 (군집 2, 잡음 0) |
| 계층적 | Ward / 완전 / 평균 / 단일 | 0.241 / 0.297 / 0.425 / 1.000 |

- K-means 는 직선 경계로 갈라 두 달을 가로질러 자른다. 구형 가정이 깨진 사례다. 단일 연결·DBSCAN 은 이웃 사슬을 따라가 모양을 찾았다.
- DBSCAN eps 민감도(min_samples=5): eps=0.05 → 군집 13개·잡음 223점(ARI 0.009), 0.1 → 군집 5·잡음 6(0.719), 0.2 → 군집 2(1.0), 0.5 → 군집 1(0.0). **같은 알고리즘이 eps 하나로 완전히 달라진다.**
- 시드 민감성: 3개 군집 blobs 에서 `init="random", n_init=1` 로 seed 0~3 을 돌리면 inertia 가 1826.1 / 573.9 / 1826.0 / 573.9 로 갈렸다(지역 최적). 그래서 `n_init` 을 여러 번 둔다.
- 스케일: blobs 에서 한 변수에 ×100 을 곱해도 ARI 가 0.98 → 0.97 로 거의 변하지 않았다. 군집 간 분리가 이미 크기 때문이며, 변수 단위가 다르고 분리가 약한 데이터에서는 달라질 수 있다. 표준화는 거리 기반 방법의 기본 점검 항목이다 → [스케일링](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/).

## 언제 쓰나 / 주의

| 상황 | 선택 |
| --- | --- |
| 구형에 가깝고 큰 데이터, 군집 수를 가정 가능 | K-means (빠르고 단순) |
| 군집 수를 모르고 계층 구조를 보고 싶음, 데이터가 작음 | 계층적 군집 + 덴드로그램 |
| 임의 모양, 잡음 제거가 필요함 | DBSCAN |
| 소속 확률이 필요함 | 혼합분포 |

- 군집 수 k·eps 는 사람이 정해야 하며 "정답"은 없다. 평가는 [실루엣·엘보](/develop-wiki/knowledge/machine-learning/cluster-validation-silhouette-elbow/) 와 도메인 해석을 함께 본다.
- 범주형이 섞인 데이터는 유클리드 거리가 맞지 않을 수 있다(거리 정의부터 정해야 함).
- 군집은 "그룹이 실제로 존재한다"는 증거가 아니다. 균등분포 데이터에도 K-means 는 군집을 만든다.
- 이상값 탐색이 목적이면 DBSCAN 의 잡음이 후보가 될 뿐, 이상값 확정은 아니다 → [이상값 탐지](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/).

## 검증 범위

- 읽음: scikit-learn User Guide 군집 장(K-means 목적식·한계·k-means++·연결법·DBSCAN 요약), DBSCAN API 문서(eps·min_samples·자기 포함), k-means++ 논문 본문(Lloyd 절차·D² 시딩·O(log k)), DBSCAN 원 논문(핵심점·잡음·k-dist 휴리스틱).
- 실행: 위 모든 수치. 같은 코드를 다른 seed 로 바꾸면 값이 달라질 수 있다.
- 미확인: Ward 의 수식(문서는 서술만), 분할형 군집·GMM 의 EM 절차 상세, K-medoids·SOM 원전, "밀도 차이가 큰 데이터에서 DBSCAN 이 약하다"는 서술의 원문 근거. 수험서의 군집 세부 용어(예: 군집 간 거리 이름)는 교재마다 다를 수 있어 공개 1차 출처 범위만 썼다.
