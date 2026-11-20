---
name: scikit-learn
url: https://scikit-learn.org
docs: https://scikit-learn.org/stable/
repo: https://github.com/scikit-learn/scikit-learn
stars: 68270
domain: data-ml
category: ml
description: 분류·회귀·군집·전처리·모델 평가를 일관된 API 로 제공하는 Python 머신러닝 라이브러리. 표 형식 데이터의 전통적 ML 과 베이스라인 모델에 쓴다.
pricing: oss
tags: [machine-learning, classification, regression, preprocessing, pipeline]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
scikit-learn 은 선형 모델, 트리·앙상블, SVM, k-평균 같은 고전 ML 알고리즘과 전처리·특성 선택·교차 검증·지표를 한 라이브러리에 담았다. 모든 모델이 `fit` / `predict` / `transform` 같은 같은 인터페이스(Estimator API)를 따라 알고리즘을 바꿔 끼우기 쉽고, `Pipeline` 으로 전처리와 모델을 하나로 묶어 데이터 누수 없이 평가할 수 있다.

**버전(2026-11 기준):** 1.9.1(2026-09-11), Python 3.11 이상. 라이선스 BSD-3-Clause. GPU 딥러닝은 범위 밖이다.

## 설치
```bash
pip install -U scikit-learn
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Estimator | `fit(X, y)` 로 학습하는 모든 객체 |
| Predictor / Transformer | `predict` 를 가진 모델 / `transform` 을 가진 전처리기 |
| `Pipeline` | 전처리 → 모델 단계를 하나의 Estimator 로 연결 |
| `ColumnTransformer` | 열 종류별로 다른 전처리(수치 스케일링, 범주 원-핫) |
| 교차 검증 | `cross_val_score`, `KFold`, `StratifiedKFold` |
| 하이퍼파라미터 탐색 | `GridSearchCV`, `RandomizedSearchCV`, `HalvingGridSearchCV` |
| 지표 | `sklearn.metrics` 의 정확도, F1, ROC AUC, MAE 등 |
| `set_output` | 변환 결과를 pandas/Polars DataFrame 으로 받기 |

## 기본 사용법
```python
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

df = pd.DataFrame({
    "age": [22, 35, 58, 41, 29, 63, 33, 47],
    "plan": ["free", "pro", "pro", "free", "team", "pro", "free", "team"],
    "churn": [1, 0, 0, 1, 0, 0, 1, 0],
})
X, y = df[["age", "plan"]], df["churn"]

pre = ColumnTransformer([
    ("num", StandardScaler(), ["age"]),
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["plan"]),
])
model = make_pipeline(pre, HistGradientBoostingClassifier(max_iter=50))

print(cross_val_score(model, X, y, cv=2).mean())
model.fit(X, y)
print(model.predict(pd.DataFrame({"age": [30], "plan": ["pro"]})))
```

## 자주 쓰는 패턴
- **누수 방지**: 스케일러·인코더는 반드시 `Pipeline` 안에 넣어 교차 검증 폴드마다 학습되게 한다.
- **탐색**: `GridSearchCV(pipe, {"histgradientboostingclassifier__max_depth": [3, 6]}, cv=5)` 처럼 `단계명__파라미터` 로 지정.
- **불균형 데이터**: `class_weight="balanced"`, `StratifiedKFold`, 정확도 대신 F1·PR AUC.
- **모델 저장**: `joblib.dump(model, "model.joblib")` (같은 버전에서 로드), 또는 skops·ONNX 변환.
- **실험 기록**: [MLflow](/develop-wiki/data-ml/ml/mlflow/) 의 `mlflow.sklearn.autolog()`.

## 언제 쓰나 / 피할 때
- 쓸 때: 표 형식 데이터의 분류·회귀·군집, 빠른 베이스라인, 전처리·평가 파이프라인 표준화, 교육.
- 피할 때(대안): 대규모 표 데이터에서 최고 성능 부스팅은 [XGBoost](/develop-wiki/data-ml/ml/xgboost/)·LightGBM, 이미지·텍스트·딥러닝은 [PyTorch](/develop-wiki/data-ml/ml/pytorch/).

## 공식 문서
- [문서 홈](https://scikit-learn.org/stable/) · [Getting Started](https://scikit-learn.org/stable/getting_started.html) · [User Guide](https://scikit-learn.org/stable/user_guide.html)
- [API 레퍼런스](https://scikit-learn.org/stable/api/index.html) · [Pipeline·ColumnTransformer](https://scikit-learn.org/stable/modules/compose.html) · [릴리스 하이라이트](https://scikit-learn.org/stable/auto_examples/release_highlights/index.html)
