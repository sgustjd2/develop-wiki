---
name: MLflow
url: https://mlflow.org
docs: https://mlflow.org/docs/latest/
repo: https://github.com/mlflow/mlflow
stars: 28941
domain: data-ml
category: ml
description: 실험 추적, 모델 패키징·레지스트리, 배포를 다루는 오픈소스 MLOps 플랫폼. 학습 파라미터·지표·모델 버전을 기록하고 관리할 때 쓴다.
pricing: oss
tags: [mlops, experiment-tracking, model-registry, deployment, genai]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
MLflow 는 ML 수명 주기를 관리하는 플랫폼이다. 학습 실행(run)마다 파라미터·지표·아티팩트를 기록하는 Tracking, 모델을 프레임워크 중립 형식으로 저장하는 Models, 버전·별칭을 관리하는 Model Registry 가 핵심이고, 3.x 에서는 LLM 앱용 트레이싱·평가 기능도 같은 서버에서 제공한다. Databricks 가 시작했으며 현재 Linux Foundation 프로젝트다.

**버전(2026-11 기준):** 3.18.0(2026-11-03), Python 3.10 이상. 라이선스 Apache-2.0. 관리형 MLflow 는 Databricks·SageMaker 등에서 제공한다.

## 설치
```bash
pip install mlflow
mlflow server --port 5000        # 추적 서버 + UI (http://localhost:5000)
```
기본 저장소는 로컬 파일/SQLite 이고, 팀 운영 시 `--backend-store-uri postgresql://...` 와 S3 같은 아티팩트 저장소를 지정한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Experiment / Run | 관련 실행 묶음 / 학습 한 번의 기록 |
| 파라미터·지표·태그 | `log_param`, `log_metric`(스텝별 기록), `set_tag` |
| 아티팩트 | 모델 파일·그림·데이터 샘플 등 파일 |
| Autolog | scikit-learn·XGBoost·PyTorch 등에서 자동 기록 |
| MLflow Model / flavor | 표준 디렉터리 형식 + 프레임워크별 로더(sklearn, pytorch, pyfunc) |
| Model Registry | 등록 모델의 버전과 별칭(`@champion`) 관리 |
| Tracing / GenAI 평가 | LLM 호출 단계 추적, LLM 응답 평가 |

## 기본 사용법
```python
import mlflow
from sklearn.datasets import load_diabetes
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("diabetes")

X, y = load_diabetes(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)

with mlflow.start_run():
    params = {"alpha": 0.5}
    model = Ridge(**params).fit(X_tr, y_tr)
    mlflow.log_params(params)
    mlflow.log_metric("mae", mean_absolute_error(y_te, model.predict(X_te)))
    mlflow.sklearn.log_model(model, name="model", registered_model_name="diabetes-ridge")
```

등록 모델 불러오기:
```python
model = mlflow.pyfunc.load_model("models:/diabetes-ridge/1")
```

## 자주 쓰는 패턴
- **트리 모델 저장 주의**: 최근 버전의 `mlflow.sklearn.log_model` 은 skops 형식으로 저장하며, 결정 트리·랜덤 포레스트처럼 검증되지 않은 타입이 있으면 `skops_trusted_types` 로 신뢰할 타입을 명시하라는 오류를 낸다(직접 만든 모델일 때만 지정).
- **autolog**: `mlflow.autolog()` 한 줄로 지원 프레임워크의 파라미터·지표·모델을 자동 기록.
- **별칭 기반 배포**: 레지스트리에서 검증된 버전에 `champion` 별칭을 붙이고 서비스는 `models:/name@champion` 을 로드.
- **모델 서빙**: `mlflow models serve -m models:/diabetes-ridge/1 -p 5001` 로 REST 엔드포인트 실행.
- **LLM 앱 추적**: `mlflow.openai.autolog()` 같은 통합으로 프롬프트·응답·지연을 트레이스로 기록.

## 언제 쓰나 / 피할 때
- 쓸 때: 셀프 호스팅 가능한 실험 추적과 모델 레지스트리, 여러 프레임워크 모델을 같은 형식으로 배포, Databricks 환경.
- 피할 때(대안): 운영 부담 없이 협업 대시보드·리포트를 원하면 [Weights & Biases](/develop-wiki/data-ml/ml/weights-and-biases/). LLM 관측·평가만 필요하면 [Langfuse](/develop-wiki/ai/evaluation/langfuse/) 같은 전용 도구.

## 공식 문서
- [문서 홈](https://mlflow.org/docs/latest/) · [Tracking](https://mlflow.org/docs/latest/ml/tracking/) · [Model Registry](https://mlflow.org/docs/latest/ml/model-registry/)
- [Autolog](https://mlflow.org/docs/latest/ml/tracking/autolog/) · [GenAI](https://mlflow.org/docs/latest/genai/) · [릴리스](https://github.com/mlflow/mlflow/releases)
