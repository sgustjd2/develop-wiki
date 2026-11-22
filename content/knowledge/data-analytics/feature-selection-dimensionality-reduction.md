---
title: 변수 선택과 차원 축소 (Feature Selection & Dimensionality Reduction)
aka: [Feature Selection, Dimensionality Reduction, Feature Extraction, Filter/Wrapper/Embedded, t-SNE, UMAP, Curse of Dimensionality]
category: data-analytics
group: preprocessing
level: intermediate
summary: 쓸모없는 변수를 골라내는 변수 선택(필터·래퍼·내장)과 변수를 새로 합성해 줄이는 차원 축소(PCA·t-SNE·UMAP)를 구분하고, 선택을 교차검증 밖에서 하면 점수가 부풀려지는 함정을 계산으로 보인다.
tags: [feature-selection, dimensionality-reduction, pca, tsne, umap, sklearn, leakage]
related: [data-analytics/multivariate-pca-factor-mds, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/eda-exploratory-data-analysis-visual, machine-learning/data-split-cross-validation-leakage, machine-learning/overfitting-bias-variance-regularization, machine-learning/model-interpretation-feature-importance-shap-pdp]
sources:
  - https://scikit-learn.org/stable/modules/feature_selection.html
  - https://scikit-learn.org/stable/modules/manifold.html
  - https://scikit-learn.org/stable/modules/decomposition.html
  - https://www.jmlr.org/papers/v9/vandermaaten08a.html
  - https://distill.pub/2016/misread-tsne/
  - https://arxiv.org/abs/1802.03426
  - https://d2l.ai/chapter_linear-regression/weight-decay.html
updatedAt: 2026-11-23
---

## 개요

- 변수가 많다고 모델이 좋아지지 않는다. 잡음 변수는 과대적합을 부르고, 계산·저장 비용과 해석 부담을 키운다.
- 줄이는 방법은 두 갈래다. **변수 선택**은 원래 변수 중 일부를 *그대로* 고르고, **차원 축소(특성 추출)** 는 원래 변수를 조합해 *새 축*을 만든다.
- 선택은 "어떤 열이 중요한가"에 답하고(해석 쉬움), 축소는 "정보를 적은 축에 담을 수 있나"에 답한다(해석은 어려워짐).

## 시험 범위 대응

- 빅데이터분석기사 2과목 "데이터 전처리 > 분석 변수 처리"의 변수 선택·차원축소.
- ADP 실기 출제 방향의 "변수 선택", "EDA 의 차원 축소".
- ADsP 에는 직접 항목 없음(관련: 다변량 분석).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 변수 선택 | feature selection | 원래 변수의 부분집합을 고른다 |
| 차원 축소 | dimensionality reduction | 변수 개수를 줄인 새 표현으로 바꾼다. 선택·추출을 모두 가리키는 넓은 용어로도 쓰인다 |
| 특성 추출 | feature extraction | 원래 변수를 조합해 새 변수를 만든다(PCA 등) |
| 필터 | filter | 모델과 무관하게 통계량으로 변수 점수를 매겨 거른다 |
| 래퍼 | wrapper | 모델을 반복 학습시켜 변수 부분집합의 성능으로 고른다 |
| 내장(임베디드) | embedded | 학습 과정에서 변수 가중치가 정해져 그 값으로 고른다 |
| 차원의 저주 | curse of dimensionality | 차원이 커질수록 데이터가 희박해지고 거리 구분력이 떨어지는 현상 |

## 변수 선택 세 방식

| 방식 | 대표 기법(sklearn) | 비용 | 특징 |
| --- | --- | --- | --- |
| 필터 | `VarianceThreshold`, `SelectKBest`(`f_classif`, `chi2`, `mutual_info_*`) | 낮음 | 변수 간 상호작용을 못 본다. 모델과 독립 |
| 래퍼 | `RFE`/`RFECV`, `SequentialFeatureSelector`(전진·후진) | 높음 | 모델에 맞춘 선택. 후보마다 교차검증 학습 |
| 내장 | `SelectFromModel` + L1(Lasso, `LinearSVC`/로지스틱 L1), 트리 중요도 | 중간 | 학습 한 번에 가중치로 선택 |

공식 사용자 가이드에서 확인한 세부:
- `VarianceThreshold` 는 분산이 기준 이하인 변수를 버린다. 기본값은 분산 0(상수 열)만 제거한다.
- F 검정은 선형 의존만 잡고, 상호정보량은 임의의 의존을 잡지만 표본이 더 필요하다.
- `chi2` 는 **음수가 없는** 값(빈도 등)에만 쓴다. 분류에 회귀용 점수 함수를 쓰면 의미 없는 결과가 나온다.
- RFE 는 `coef_`/`feature_importances_` 가 있는 모델로 중요도 낮은 변수를 반복 제거한다. `SequentialFeatureSelector` 는 이런 속성이 필요 없지만 모델을 훨씬 많이 학습한다.
- L1 모델은 계수를 정확히 0 으로 만들어 선택에 쓴다. 로지스틱·SVM 은 C 가 작을수록, Lasso 는 alpha 가 클수록 적게 남는다. 교차검증으로 고른 alpha 는 무관한 변수를 일부 남기는 경향이 있다고 문서가 적는다.
- Lasso 가 0 을 만드는 이유는 [과대적합·규제 노트](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/)에서 다룬다.

### 선택은 반드시 학습 데이터 안에서

선택 자체가 "정답 y 를 보고 변수를 고르는" 학습이다. 전체 데이터로 고른 뒤 교차검증하면 검증 폴드의 정보가 선택에 들어가 점수가 부풀려진다. `Pipeline` 에 넣으면 폴드마다 학습 부분만으로 다시 선택한다. 자세한 유형은 [분할·교차검증·누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/).

```python
from sklearn.pipeline import make_pipeline
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
pipe = make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression(max_iter=1000))
cross_val_score(pipe, X, y, cv=5)   # 선택이 폴드 안에서 일어난다
```

## 차원 축소

### 선형: PCA 계열
- PCA 는 분산을 최대로 담는 직교 축을 순서대로 찾는다(수식·해석은 [PCA·요인분석·MDS](/develop-wiki/knowledge/data-analytics/multivariate-pca-factor-mds/)).
- sklearn `PCA` 는 열 평균을 빼 주지만 **척도는 맞추지 않는다**. 단위가 다른 변수는 먼저 표준화한다([척도 변환](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/)).
- `TruncatedSVD` 는 중심화 없이 상위 k 개 특이값만 구한다(희소 행렬·텍스트의 LSA). `NMF` 는 음수 없는 데이터에서 음수 없는 두 행렬로 분해한다.

### 비선형: t-SNE, UMAP (주로 시각화용)
- t-SNE(van der Maaten & Hinton, JMLR 2008)는 고차원 점들의 이웃 관계를 확률로 만들고, 2~3차원 지도에서 같은 이웃 관계가 유지되도록 배치한다. 다양한 규모의 구조를 한 지도에 드러낸다는 것이 논문의 주장이다.
- UMAP(McInnes 등, arXiv 2018)은 t-SNE 와 비슷한 시각화 품질에 더 빠르고, 전역 구조를 더 보존하는 면이 있다(arguably)고 **저자들이 주장**한다. 이 노트에서는 직접 비교하지 않았다.
- sklearn 문서의 t-SNE 주의: 목적 함수(KL 발산)가 볼록이 아니어서 시드에 따라 결과가 다르다. 전역 구조는 명시적으로 보존되지 않는다(`init='pca'` 로 완화). 2D 에서 클래스가 안 갈라져도 지도학습으로 분류 불가능하다는 뜻은 아니다. 큰 데이터에서는 PCA 보다 훨씬 오래 걸린다.
- Wattenberg 등(Distill 2016)이 짚은 오독 사례: 군집의 **크기**와 군집 **사이 거리**는 의미가 없을 수 있고, perplexity(대략 5~50 에서 시작)에 따라 모양이 달라지며, 무작위 잡음에서도 군집처럼 보이는 모양이 생긴다. 여러 perplexity 로 확인하고, 수렴할 때까지 돌려야 한다.

| 구분 | PCA | t-SNE / UMAP |
| --- | --- | --- |
| 변환 | 선형, 새 데이터에 같은 투영 적용 가능 | 비선형, 주로 학습 데이터 시각화(새 점 변환은 도구별 지원이 다름, 미확인) |
| 거리·크기 해석 | 분산 비율 등 해석 가능 | 군집 크기·간격 해석 금지 |
| 용도 | 전처리·압축·잡음 제거 | 탐색용 2D/3D 그림 |

## 차원의 저주 (직접 계산으로 확인)

[0,1]^d 에서 균등 난수 500 점을 뽑아 점 쌍 거리를 쟀다(seed 0, numpy).

| 차원 d | 최소거리/최대거리 | 거리의 표준편차/평균 |
| --- | --- | --- |
| 2 | 0.002 | 0.479 |
| 10 | 0.119 | 0.192 |
| 100 | 0.600 | 0.059 |
| 1000 | 0.845 | 0.019 |

차원이 커지면 가까운 점과 먼 점의 거리가 비슷해진다. 거리 기반 방법(KNN·군집)이 약해지는 이유다.

## 직접 계산 (Python 3.15, scikit-learn 1.9.1, seed 고정)

1. **선택 누수.** 순수 잡음(60×1000, 무작위 레이블)에 `SelectKBest(k=10)` 를 전체 데이터에 먼저 적용한 뒤 5-겹 교차검증 정확도: 0.80 / 0.78 / 0.93(seed 0·1·2). 파이프라인 안에서 선택하면 0.48 / 0.55 / 0.65. 실제 신호가 없는데 0.8~0.9 가 나온 것이 누수다.
2. **세 방식 비교.** `make_classification(n_samples=300, n_features=30, n_informative=5, n_redundant=0, shuffle=False)` 에서 정보 변수는 0~4 번. `SelectKBest(f_classif, k=5)` 는 0~4 를 모두 골랐다. `RFE`(로지스틱)와 L1 로지스틱(C=0.1, 표준화 후)은 둘 다 {0, 1, 4, 19, 20} 을 골라 정보 변수 3 개만 맞혔다. 이 데이터 한 건의 결과이며 방법 우열을 뜻하지 않는다.
3. t-SNE KL 발산(잡음 300×50)은 perplexity 5 에서 2.009, 30 에서 1.637. sklearn 문서는 시드를 바꿔 돌려 KL 이 가장 낮은 결과를 고르는 것을 정당하다고 설명한다. 다만 perplexity 가 다르면 목적 함수 자체가 달라지므로(이 부분은 필자의 해석) KL 값으로 perplexity 를 고르지 않는다.

## 언제 쓰나 / 주의

- 변수가 표본 수에 비해 많을 때, 해석 가능한 소수 변수가 필요할 때 → 변수 선택(필터로 먼저 거르고 내장·래퍼로 다듬는 순서가 비용상 흔하다. 필자의 정리이며 원문 권고는 아니다).
- 공선성이 심하거나 압축·시각화가 목적일 때 → 차원 축소.
- 도메인상 중요한 변수를 통계량만 보고 지우지 않는다. 필터는 변수 간 상호작용을 못 본다.
- 트리 중요도·L1 선택은 상관된 변수 중 일부만 고르기도 한다(sklearn 문서: Lasso 는 상관 변수 중 하나를 임의로 고르는 경향). 선택 결과를 "이 변수만 의미 있다"로 읽지 않는다.
- t-SNE/UMAP 그림으로 군집 수·크기를 결론 내리지 않는다. 군집 확인은 [EDA](/develop-wiki/knowledge/data-analytics/eda-exploratory-data-analysis-visual/)에서 다른 증거와 함께 본다.
- 선택·축소 모두 학습 데이터로만 맞추고 검증·테스트에 적용한다.

## 검증 범위

- 읽음: sklearn feature_selection·manifold·decomposition 사용자 가이드(2026-11-23), t-SNE JMLR 초록 페이지, Distill "How to Use t-SNE Effectively" 본문, UMAP arXiv 초록, d2l 가중치 감쇠 절.
- t-SNE 논문 본문과 UMAP 논문 본문은 읽지 않았다(초록만). UMAP 의 전역 구조·속도 우위는 저자 주장으로만 적었다.
- 차원의 저주는 위 모의실험으로만 보였고 ESL 등 교재의 서술은 확인하지 못했다(PDF 를 읽지 못함).
- 직접 계산 외 방법(상호정보량 점수, `SequentialFeatureSelector`, UMAP 코드)은 실행하지 않았다. 새 데이터에 대한 t-SNE/UMAP 변환 지원 여부는 미확인.
