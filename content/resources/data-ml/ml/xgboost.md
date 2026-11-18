---
name: XGBoost
url: https://xgboost.ai
docs: https://xgboost.readthedocs.io/en/stable/
repo: https://github.com/dmlc/xgboost
domain: data-ml
category: ml
description: 그래디언트 부스팅 결정 트리 라이브러리. 표 형식 데이터의 분류·회귀·순위 예측에서 높은 성능을 내며 CPU·GPU·분산 학습을 지원한다.
pricing: oss
tags: [gradient-boosting, gbdt, tabular, classification, regression, gpu]
languages: [python, cpp, java]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
XGBoost 는 이전 트리들의 오차를 다음 트리가 보정하도록 결정 트리를 차례로 쌓는 그래디언트 부스팅 구현이다. 히스토그램 기반 분할, 결측치 자동 처리, 정규화, 범주형 특성 지원을 제공하고, scikit-learn 호환 API 와 저수준 `DMatrix` API 를 함께 제공한다. 같은 계열의 **LightGBM**(Microsoft 에서 시작, 2026-03 `lightgbm-org/LightGBM` 으로 이관, 4.7.0, MIT)과 함께 표 형식 데이터의 대표 도구다.

**버전(2026-11 기준):** 3.4.x(GitHub 릴리스 3.4.2 2026-09-15, PyPI 3.4.1), Python 3.12 이상(PyPI 기준). 라이선스 Apache-2.0.

## 설치
```bash
pip install xgboost        # Linux x86_64 휠은 NVIDIA GPU 지원 포함
pip install lightgbm       # 대안 라이브러리
```
macOS 에서는 OpenMP 런타임이 필요하다(`brew install libomp`).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 부스팅 라운드 | 트리를 하나씩 추가하는 반복 (`n_estimators`) |
| `learning_rate` | 각 트리의 기여도 축소. 낮을수록 라운드가 더 필요 |
| `max_depth` / `min_child_weight` | 트리 복잡도 제한 |
| `subsample` / `colsample_bytree` | 행·열 샘플링으로 과적합 억제 |
| `tree_method="hist"` | 히스토그램 기반 분할(기본) |
| `device="cuda"` | GPU 학습·예측 |
| 조기 종료 | 검증 지표가 개선되지 않으면 학습 중단 (`early_stopping_rounds`) |
| `enable_categorical` | pandas `category` 열을 직접 처리 |

## 기본 사용법
```python
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

X, y = load_breast_cancer(return_X_y=True, as_frame=True)
X_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, random_state=0)

model = XGBClassifier(
    n_estimators=500, learning_rate=0.05, max_depth=4,
    subsample=0.8, colsample_bytree=0.8,
    early_stopping_rounds=30, eval_metric="auc",
)
model.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], verbose=False)

print(model.best_iteration, roc_auc_score(y_va, model.predict_proba(X_va)[:, 1]))
model.save_model("model.json")
```

## 자주 쓰는 패턴
- **조기 종료로 라운드 결정**: `n_estimators` 를 크게 두고 검증 세트 조기 종료로 최적 라운드를 찾는다.
- **범주형 처리**: pandas `category` dtype + `enable_categorical=True` 로 원-핫 없이 학습.
- **특성 중요도·설명**: `model.get_booster().get_score(importance_type="gain")`, `pred_contribs=True` 로 SHAP 값.
- **scikit-learn 통합**: `Pipeline`·`GridSearchCV` 에 그대로 넣는다([scikit-learn](/develop-wiki/data-ml/ml/scikit-learn/)).
- **분산 학습**: Dask·Spark·[Ray](/develop-wiki/data-ml/processing/ray/) 통합으로 큰 데이터 학습.

## 언제 쓰나 / 피할 때
- 쓸 때: 표 형식(정형) 데이터의 예측 모델, 대회·실무의 강한 베이스라인, 결측치가 많은 데이터.
- 피할 때(대안): 아주 큰 데이터에서 학습 속도·메모리가 우선이면 LightGBM 을 비교해 본다. 이미지·텍스트·시퀀스는 [PyTorch](/develop-wiki/data-ml/ml/pytorch/). 작은 데이터·해석이 중요한 문제는 선형 모델([scikit-learn](/develop-wiki/data-ml/ml/scikit-learn/)).

## 공식 문서
- [문서 홈](https://xgboost.readthedocs.io/en/stable/) · [Get Started](https://xgboost.readthedocs.io/en/stable/get_started.html) · [파라미터](https://xgboost.readthedocs.io/en/stable/parameter.html)
- [Python API](https://xgboost.readthedocs.io/en/stable/python/python_api.html) · [범주형 데이터](https://xgboost.readthedocs.io/en/stable/tutorials/categorical.html) · [LightGBM 문서](https://lightgbm.readthedocs.io/en/latest/)
