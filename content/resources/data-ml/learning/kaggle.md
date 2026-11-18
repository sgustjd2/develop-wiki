---
name: Kaggle
url: https://www.kaggle.com
docs: https://www.kaggle.com/docs
repo: https://github.com/Kaggle/kaggle-cli
stars: 7673
domain: data-ml
category: learning
description: 데이터 과학 대회, 공개 데이터셋, 무료 GPU 노트북, 단기 강좌를 제공하는 Google 의 데이터·ML 커뮤니티. 실습 데이터와 다른 사람의 풀이로 배울 때 쓴다.
pricing: free
tags: [competition, dataset, notebook, course, community]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kaggle 은 데이터 과학·머신러닝 실습 플랫폼이다. 기업·연구 기관이 낸 예측 대회(Competitions), 누구나 올리는 공개 데이터셋(Datasets), 브라우저에서 바로 돌리는 노트북(Code, 무료 GPU·TPU 할당량 포함), 사전학습 모델 저장소(Models), 짧은 실습 강좌(Learn)를 한곳에서 제공한다. 다른 참가자의 공개 노트북과 토론이 가장 큰 학습 자원이다. Google 이 운영한다.

공식 CLI(`kaggle`, 2.2.5, Apache-2.0)로 데이터 다운로드·제출·노트북 실행을 자동화할 수 있다. 저장소 이름이 `Kaggle/kaggle-api` 에서 `Kaggle/kaggle-cli` 로 바뀌었다.

## 설치
```bash
pip install kaggle
kaggle auth login                     # 브라우저 OAuth 인증
# 또는 kaggle.com/settings/api 에서 토큰 발급 후
export KAGGLE_API_TOKEN=<token>       # 또는 ~/.kaggle/access_token 파일
```
예전 방식의 `~/.kaggle/kaggle.json`(Legacy API Credentials)도 지원된다.

## 핵심 개념
| 영역 | 설명 |
| --- | --- |
| Competitions | 평가 지표·리더보드가 있는 예측 대회. Getting Started 대회(Titanic 등)는 상시 운영 |
| Public / Private 리더보드 | 대회 중 공개 점수 / 종료 후 숨겨진 테스트로 최종 순위 |
| Datasets | 사용자가 올린 데이터셋과 라이선스 표기 |
| Code (Notebooks) | 브라우저 Jupyter 환경. 주당 GPU·TPU 사용 시간 제한 |
| Models | 프레임워크별 사전학습 모델 |
| Learn | Python, pandas, ML 입문, SQL 등 짧은 무료 강좌 |
| 등급(Progression) | Competitions·Datasets·Code·Discussion 별 Novice~Grandmaster |

## 기본 사용법
```bash
kaggle competitions list
kaggle competitions download -c titanic          # 대회 규칙 동의가 먼저 필요
unzip titanic.zip -d titanic
kaggle competitions submit -c titanic -f submission.csv -m "baseline"

kaggle datasets list -s "korean"
kaggle datasets download -d <owner>/<dataset> --unzip
```

```python
# Titanic 베이스라인 제출 파일 만들기
import pandas as pd

test = pd.read_csv("titanic/test.csv")
pred = (test["Sex"] == "female").astype(int)        # 여성 생존 가정
pd.DataFrame({"PassengerId": test["PassengerId"], "Survived": pred}).to_csv("submission.csv", index=False)
```

## 자주 쓰는 패턴
- **학습 순서**: Learn 강좌 → Getting Started 대회 → 종료된 대회의 상위 공개 노트북 읽기 → 진행 중 대회 참가.
- **검증 설계**: 공개 리더보드에 과적합하지 말고 자체 교차 검증 점수를 기준으로 판단한다.
- **표 데이터 기본기**: 대회에서 자주 쓰는 [XGBoost](/develop-wiki/data-ml/ml/xgboost/)·[scikit-learn](/develop-wiki/data-ml/ml/scikit-learn/) 파이프라인을 익힌다.
- **라이선스 확인**: 데이터셋·대회 데이터는 각자 라이선스·규칙이 있어 상업적 재사용 전 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 실제 데이터로 ML 연습, 포트폴리오, 무료 GPU 로 실험, 다양한 풀이 비교.
- 피할 때(대안): 체계적인 딥러닝 강의는 [fast.ai](/develop-wiki/data-ml/learning/fast-ai/), NLP·LLM 데이터셋 탐색은 [Hugging Face Datasets](/develop-wiki/data-ml/learning/hugging-face-datasets/), LLM 강좌는 [Hugging Face Learn](/develop-wiki/ai/learning/hugging-face-learn/).

## 공식 문서
- [Kaggle 문서](https://www.kaggle.com/docs) · [Kaggle Learn](https://www.kaggle.com/learn) · [Titanic 대회](https://www.kaggle.com/competitions/titanic)
- [Kaggle CLI 저장소](https://github.com/Kaggle/kaggle-cli) · [CLI 사용자 문서](https://github.com/Kaggle/kaggle-cli/blob/main/docs/README.md)
