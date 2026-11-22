---
title: 스케일링·인코딩·변환과 파생변수 (Scaling, Encoding, Transformation, Derived Features)
aka: [Standardization, Min-Max Scaling, Normalization, RobustScaler, Box-Cox, Yeo-Johnson, One-Hot Encoding, Label Encoding, Target Encoding, Binning, 정규화, 표준화]
category: data-analytics
group: preprocessing
level: beginner
summary: 표준화·min-max·로버스트 스케일링, 로그·Box-Cox·Yeo-Johnson 변환, 원-핫·순서·타깃 인코딩, 구간화, 파생변수를 정리하고 "정규화" 라는 말이 가리키는 서로 다른 다섯 가지를 구분한다.
tags: [scaling, standardization, normalization, encoding, one-hot, target-encoding, box-cox, binning, feature-engineering, scikit-learn]
related: [data-analytics/missing-values-handling-mechanisms, data-analytics/outlier-detection-methods, data-analytics/feature-selection-dimensionality-reduction, data-analytics/imbalanced-data-resampling-smote, data-analytics/multivariate-pca-factor-mds, data-analytics/r-basics-data-mart-apply-dplyr, data-modeling/normalization, machine-learning/overfitting-bias-variance-regularization, machine-learning/knn-distance-based-classification, machine-learning/data-split-cross-validation-leakage, machine-learning/deep-learning-training-batchnorm-dropout]
sources:
  - https://scikit-learn.org/stable/modules/preprocessing.html
  - https://scikit-learn.org/stable/auto_examples/preprocessing/plot_scaling_importance.html
updatedAt: 2026-11-23
---

## 개요

- 모델은 입력의 단위·분포·형식에 민감하다. 거리 기반 모델(KNN)과 분산 기반 기법(PCA)은 값의 크기에, 경사하강·규제 모델은 특성들의 척도 차이에, 선형모형은 범주형이 숫자 코드로 들어가는 방식에 영향을 받는다.
- 이 노트는 **스케일링**(척도 맞추기), **변환**(분포 모양 바꾸기), **인코딩**(범주 → 숫자), **구간화·파생변수**(새 변수 만들기)를 묶는다.
- 가장 헷갈리는 점은 "정규화"가 맥락마다 다른 것을 가리킨다는 것이다. 아래 표로 먼저 구분한다.

## 시험 범위 대응

- 빅데이터분석기사 2과목 > 분석 변수 처리(파생변수 생성·변수 변환), 실기 > 전처리 변환(유형 변환·표준화/정규화·파생변수·변수 선택), ADP 실기 > 데이터 전처리, ADsP 데이터분석 > 데이터 마트에 대응한다. 출제범위가 "표준화/정규화"를 한 항목으로 적고 있어 용어 구분이 중요하다.

## "정규화" 용어 충돌

| 맥락 | 영어 | 하는 일 | 도구·예 |
| --- | --- | --- | --- |
| 값의 범위 맞추기 | min-max scaling, (rescaling) | `(x − min)/(max − min)` 으로 [0, 1] 등에 맞춤 | sklearn `MinMaxScaler`(문서는 "alternative standardization" 이라 부름) |
| 분포를 정규분포 모양으로 | power / quantile transform | 비대칭 분포를 가우시안에 가깝게 | `PowerTransformer`, `QuantileTransformer(output_distribution='normal')` |
| 표본(행) 벡터를 단위 길이로 | normalization (sklearn 정의) | 각 **행**의 노름(L1/L2/max)이 1 이 되게 | `Normalizer`(L2 는 "spatial sign preprocessing" 이라고도 함) |
| 규제 | regularization | 손실에 계수 노름 벌점 추가(L1·L2) | 로지스틱 회귀의 `C`, Ridge/Lasso → [과적합과 규제](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/) |
| 데이터베이스 스키마 | database normalization | 중복을 줄이도록 테이블을 정규형으로 분해 | → [정규화와 반정규화](/develop-wiki/knowledge/data-modeling/normalization/) |

- scikit-learn 문서 자체가 "정규화(normalization)"를 **행 단위 단위노름 스케일링**으로 좁게 정의하고, min-max 를 표준화의 대안으로 부른다. 그러나 같은 문서와 예제는 z-점수 표준화에도 'normalization'(예: 'Z-score normalization')이라는 말을 쓴다. 이 노트의 다섯 가지 구분은 필자가 정리한 것이다.
- 한국어 수험서·실무에서 "정규화"는 위 다섯 모두를(필자 관찰, 용례 출처는 없다), 그리고 딥러닝의 배치 정규화(batch normalization; 층 입력 정규화)까지 가리킨다 → [딥러닝 학습 기법](/develop-wiki/knowledge/machine-learning/deep-learning-training-batchnorm-dropout/)
- "표준화(standardization)"는 일반적으로 평균 0·표준편차 1(z-점수)을 뜻한다(sklearn `StandardScaler`). 시험에서 "표준화/정규화"가 쌍으로 나오면 z-점수와 min-max 를 가리키는 경우가 많다고 추측되나 확인하지 못했다.
- 글을 읽을 때 "이 정규화가 열 단위인가 행 단위인가, 범위인가 분포인가"를 먼저 묻는다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 표준화 | standardization (z-score) | `(x − 평균)/표준편차`. 평균 0, 표준편차 1 |
| 최소-최대 스케일링 | min-max scaling | `(x − min)/(max − min)`. 기본 범위 [0, 1] |
| 로버스트 스케일링 | robust scaling | 중앙값과 IQR 로 중심·척도를 잡음(문서는 "더 로버스트한 추정"이라고만 쓰고 식은 안 씀) |
| 멱변환 | power transform | 분산 안정화·비대칭 완화를 위한 모수적 단조 변환. λ 는 최대가능도로 추정 |
| 원-핫 인코딩 | one-hot encoding | n 개 범주를 n 개 이진 열로 |
| 순서(레이블) 인코딩 | ordinal / label encoding | 범주를 0 … n−1 정수로 |
| 타깃 인코딩 | target encoding | 범주를 그 범주의 목표값 통계(수축된 평균)로 |
| 구간화 | binning, discretization | 연속값을 구간(bin)으로 나눔 |
| 파생변수 | derived feature | 기존 변수로 만든 새 변수 |

## 스케일링

- **표준화**: 많은 추정기가 특성이 0 근처에 있고 분산이 비슷하다고 가정한다. 문서는 SVM 의 RBF 커널과 선형모형의 L1/L2 규제가 이를 가정한다고 쓰며, 분산이 큰 특성이 목적함수를 지배할 수 있다고 설명한다. 훈련 자료에서 평균·표준편차를 구해 테스트에 그대로 적용한다.
- **min-max**: 범위가 정해진 입력이 필요하거나 표준편차가 매우 작을 때, 쓴다(희소 자료의 0 보존은 `MaxAbsScaler` 의 역할이며 min-max 는 0 을 일반적으로 보존하지 않는다). 이상값 하나가 범위를 늘려 나머지를 한쪽으로 몰아넣는다.
- **MaxAbsScaler**: 최대 절댓값으로 나눠 [−1, 1]. 희소 자료에 권장.
- **로버스트**: 이상값이 많을 때 표준화 대신. 희소 자료에는 쓸 수 없다.
- 희소 자료에 `StandardScaler` 는 `with_mean=False` 일 때만(중심화가 희소성을 깨기 때문).
- **스케일링이 필요한 모델**: sklearn 예제(Wine)에서 KNN 결정 경계는 값 범위가 큰 변수(proline)가 거의 전부 결정했고, PCA 의 첫 성분도 그 변수가 지배했다. 표준화 후 두 변수가 비슷하게 기여했고, 테스트 정확도가 35.19% → 96.30%(PCA + 로지스틱) 로 올랐다. 트리 기반 모델은 거의 영향이 없다. 스케일링이 항상 이로운 것은 아니며, 예측력 없는 작은 척도의 특성을 증폭해 과적합을 늘릴 수 있다(예제의 결론).
- **훈련 자료에만 fit**(누수 방지) → [데이터 분할과 누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)

## 변환

- 로그 변환은 오른쪽 꼬리가 긴 양수 자료를 대칭에 가깝게 만든다. 0 이하 값이 있으면 `log(1 + x)` 같은 조정이 필요하다.
- `PowerTransformer`: **Box-Cox**는 양수에만, **Yeo-Johnson**은 음수·0 도 가능. λ 를 최대가능도로 추정하고 기본적으로 출력을 표준화(`standardize=True`)한다. 문서는 변환 전후를 반드시 그려 보라고 한다(모든 분포에 잘 맞지는 않는다).
- `QuantileTransformer` 는 분위수로 균등·정규 분포에 사상한다(정규로 사상할 때 양끝은 무한대가 안 되게 잘림).
- Box-Cox(`(x^λ−1)/λ`, λ=0 이면 `ln x`, 양수 자료 전용)와 Yeo-Johnson(음수도 허용, λ 는 최대가능도로 추정)의 식은 sklearn 전처리 문서에서 확인했다. 원 논문(Box & Cox 1964, Yeo & Johnson 2000)은 읽지 않았다.

## 인코딩

| 방식 | 장점 | 주의 |
| --- | --- | --- |
| 원-핫 | 순서 가정 없음 | 범주가 많으면 열이 폭증. 선형모형에서 `drop='first'` 로 공선성 방지(문서) |
| 순서(Ordinal) | 열 하나. 순서 있는 범주(S < M < L)에 적합 | 순서 없는 범주에 쓰면 가짜 순서를 주입(문서 경고) |
| 타깃 | 고카디널리티(우편번호)에 적합 | **누수 위험**. `fit_transform` 의 교차 적합(cv=5) 사용 |

- 이름 주의: sklearn 의 `LabelEncoder` 는 **타깃**용이고, 입력 특성의 정수 인코딩은 `OrdinalEncoder` 다. "레이블 인코딩"을 입력에 쓴다고 할 때는 사실상 순서 인코딩이다(문서에서 `LabelEncoder` 상세는 읽지 않았다).
- 타깃 인코딩 식(이진): `Sᵢ = λᵢ·(nᵢY/nᵢ) + (1 − λᵢ)·(nY/n)`, `λᵢ = nᵢ/(m + nᵢ)`. 범주 평균과 전체 평균을 섞어(수축) 표본이 적은 범주의 과적합을 줄인다. `fit(X, y).transform(X)` 는 `fit_transform` 과 다르며 훈련 자료에 `fit` 후 `transform` 하면 누수된다(문서).
- 미지의 범주는 `handle_unknown` 으로 처리한다(원-핫), 타깃 인코딩은 전체 평균.

## 구간화와 파생변수

- `KBinsDiscretizer` 의 전략: `uniform`(같은 폭), `quantile`(같은 표본 수), `kmeans`(1차원 k-means). `Binarizer` 는 2 구간 특수 경우.
- 구간화는 비선형 관계와 이상값 영향을 줄이지만 정보 손실이 있고 구간 경계 선택이 임의적이다.
- 파생변수: 비율(구매액/방문 수), 차이·경과일, 상호작용, 집계(요약변수) 등 도메인 지식으로 만든다 → [R·데이터 마트](/develop-wiki/knowledge/data-analytics/r-basics-data-mart-apply-dplyr/)
- 파생변수·변환이 늘수록 특성이 많아지므로 선택·축소를 같이 본다 → [변수 선택·차원 축소](/develop-wiki/knowledge/data-analytics/feature-selection-dimensionality-reduction/)

## 직접 계산

Python 3.15, numpy 2.5.5, scikit-learn 1.9.1. 시드 고정.

**스케일러 비교** `x = [1, 2, 3, 4, 100]`

| 방법 | 결과 |
| --- | --- |
| 표준화(`StandardScaler`, 모표준편차 39.013) | −0.538, −0.513, −0.487, −0.461, **1.999** |
| min-max | 0, 0.01, 0.02, 0.03, **1** |
| 로버스트(중앙값 3, IQR 2) | −1, −0.5, 0, 0.5, **48.5** |
| 행 L2 정규화 `[3, 4]` | `[0.6, 0.8]` |

- 이상값 100 때문에 표준화·min-max 모두 정상값 네 개가 서로 거의 구별되지 않을 만큼 한 곳에 몰렸다. 로버스트 스케일링은 정상 값 간격을 보존하고 이상값은 크게 멀리 둔다.
- `StandardScaler` 는 모표준편차(분모 n)를 쓴다. `ddof=1` 표본 표준편차로 계산한 값과 다르다.

**스케일링이 필요한 모델.** 소득(평균 5만, 표준편차 1.5만)과 나이(평균 40, 표준편차 10) 두 특성, 레이블은 나이 > 40 이면 1 로 두고 전체의 10% 를 무작위로 뒤집어 만듦(n = 600, 계층 분할 75/25, `KNeighborsClassifier(5)`).

- 스케일링 없음: 테스트 정확도 **0.487**(우연 수준). 스케일링 후(`StandardScaler`, 훈련에만 fit): **0.867**. 소득이 거리를 지배해 나이를 사실상 무시했기 때문이다. 시드 의존 값이며 형태를 보인 것이다.

**왜도.** 로그정규 표본 2000 개: 왜도 3.62 → 로그 변환 −0.06. `PowerTransformer('box-cox')` 는 λ ≈ 0.02(로그에 해당)로 왜도 0.00. 같은 표본에서 3 을 뺀 값(최솟값 −2.98)에는 Yeo-Johnson 을 쓸 수 있고 λ ≈ −0.05.

**인코딩.** 범주 `a, b, c, a` 의 원-핫(`c_a, c_b, c_c`), `drop='first'` 이면 2 열. 순서 인코딩에서 `categories=[['S','M','L']]` 를 명시하면 S = 0, M = 1, L = 2(기본은 사전순이라 `L` < `M` < `S`가 됨). `KBinsDiscretizer(3, 'ordinal', 'quantile')` 은 0~8 을 `[0,0,0,1,1,1,2,2,2]` 로 나눔.

**타깃 인코딩 누수.** 효과 없는 무작위 범주 300 개(목표값은 무작위 이진)로, 범주별 평균을 훈련 자료 전체에서 계산해 쓰면 목표값과의 상관이 0.674 로 높게 나온다(순수 누수). `TargetEncoder.fit_transform`(교차 적합)에서는 0.069 였다.

## 언제 쓰나 / 주의

- 거리·분산·규제·경사하강 기반 모델(KNN, SVM, PCA, 신경망, 로지스틱·릿지/라쏘)은 스케일링을 하고 트리 모델은 보통 불필요하다.
- 스케일러 선택은 이상값과 목적에 따른다: 이상값 많음 → 로버스트, 범위 제한 필요 → min-max, 일반 → 표준화.
- 인코딩은 범주 수와 모델에 따라 선택한다. 원-핫은 범주가 적고 순서 없을 때, 타깃 인코딩은 고카디널리티일 때 교차 적합과 함께.
- 변환·인코딩·대치는 파이프라인 안에서 훈련 폴드에만 fit 한다.
- 예측 후에는 원래 척도로 되돌려 해석한다(역변환).
- 이상값 처리와 순서: 먼저 [이상값 탐지](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/), [결측 처리](/develop-wiki/knowledge/data-analytics/missing-values-handling-mechanisms/) 후 스케일링이 일반적이다. 불균형 자료는 [재표본](/develop-wiki/knowledge/data-analytics/imbalanced-data-resampling-smote/)을 따로 본다.

## 검증 범위

- 읽은 것: scikit-learn 전처리 User Guide(표준화·min-max·MaxAbs·로버스트·PowerTransformer·Normalizer·Ordinal/OneHot/TargetEncoder·KBinsDiscretizer), 스케일링 중요성 예제. 위 수치는 직접 실행.
- 미확인: Box-Cox·Yeo-Johnson 원 논문과 식, 로버스트 스케일링의 정확한 식(문서는 중앙값·IQR 이라 쓰지 않았고 필자가 알고 있는 일반 정의를 적음), `LabelEncoder` 문서, 배치 정규화·DB 정규화의 정의(각각 별도 노트·미읽음), "표준화/정규화" 출제 의도, 수험 교재의 "정규화" 정의.
- 실행하지 않은 것: R 의 `scale()`, 트리 모델의 스케일 불변성(예제 문서 서술만 인용), 인코딩 결과의 모델 성능 비교.
