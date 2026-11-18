---
name: fast.ai
url: https://www.fast.ai
docs: https://docs.fast.ai/
repo: https://github.com/fastai/fastai
stars: 28271
domain: data-ml
category: learning
description: 코드를 먼저 돌려 보는 하향식 무료 딥러닝 강좌(Practical Deep Learning for Coders)와 PyTorch 기반 fastai 라이브러리. 실무 개발자가 딥러닝을 입문할 때 쓴다.
pricing: oss
tags: [course, deep-learning, pytorch, fastai, tutorial]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
fast.ai 는 Jeremy Howard 등이 운영하는 딥러닝 교육 프로젝트다. 대표 강좌 **Practical Deep Learning for Coders** 는 이론부터 쌓지 않고 첫 시간부터 이미지 분류 모델을 학습·배포해 본 뒤 내부 원리로 내려가는 방식이며, 영상·노트북·책(*Deep Learning for Coders with fastai and PyTorch*, 온라인 무료 공개)이 함께 제공된다. 강의 코드는 [PyTorch](/develop-wiki/data-ml/ml/pytorch/) 위의 고수준 라이브러리 `fastai` 를 쓴다.

**버전(2026-11 기준):** `fastai` 2.8.12(2026-09-09), 라이선스 Apache-2.0. 강좌와 책 노트북은 무료다.

## 설치
```bash
pip install fastai
```
강좌 노트북은 Kaggle 이나 Colab 같은 GPU 노트북 환경에서 바로 실행하도록 안내된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `DataLoaders` | 학습·검증 데이터 로더 묶음. `ImageDataLoaders.from_*` 등 팩토리 제공 |
| `DataBlock` | 입력·라벨 종류, 분할, 변환을 선언해 DataLoaders 를 만드는 API |
| `Learner` | 모델·데이터·손실·옵티마이저를 묶은 학습 객체 |
| `vision_learner` | 사전학습 비전 모델로 전이 학습용 Learner 생성 |
| `fine_tune` | 머리 부분만 학습 후 전체를 미세조정하는 기본 전략 |
| `lr_find` | 학습률 범위 탐색 |
| 콜백 | 학습 루프 단계마다 동작을 끼워 넣는 확장 지점 |

## 기본 사용법
강좌 1장 형태의 고양이/개 분류(Oxford-IIIT Pets, 파일명 첫 글자가 대문자면 고양이):

```python
from fastai.vision.all import *

path = untar_data(URLs.PETS) / "images"

def is_cat(fname):
    return fname[0].isupper()

dls = ImageDataLoaders.from_name_func(
    path, get_image_files(path), valid_pct=0.2, seed=42,
    label_func=is_cat, item_tfms=Resize(224))

learn = vision_learner(dls, resnet34, metrics=error_rate)
learn.fine_tune(1)

is_cat_pred, _, probs = learn.predict(get_image_files(path)[0])
print(is_cat_pred, probs)
learn.export("pets.pkl")
```

## 자주 쓰는 패턴
- **강좌 학습 순서**: Part 1(실용 딥러닝: 비전·NLP·표 데이터·협업 필터링·배포) → Part 2(Stable Diffusion 을 처음부터 구현하며 기초 다지기).
- **결과 해석**: `ClassificationInterpretation.from_learner(learn).plot_top_losses(9)` 로 오분류 사례 확인.
- **배포 연습**: `learn.export()` 한 모델을 불러와 간단한 웹 데모로 만든다([Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/) 등).
- **실습 환경**: 무료 GPU 는 [Kaggle](/develop-wiki/data-ml/learning/kaggle/) 노트북을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 코딩은 익숙하지만 딥러닝이 처음인 개발자의 입문, 전이 학습으로 빠르게 결과를 내 보고 싶을 때.
- 피할 때(대안): 최신 LLM 파인튜닝은 [Hugging Face Learn](/develop-wiki/ai/learning/hugging-face-learn/) 강좌와 [Transformers](/develop-wiki/ai/fine-tuning/transformers/) 문서, 운영용 학습 코드는 PyTorch 를 직접 쓰는 편이 일반적이다.

## 공식 문서
- [Practical Deep Learning 강좌](https://course.fast.ai/) · [fastai 문서](https://docs.fast.ai/) · [온라인 책(fastbook)](https://github.com/fastai/fastbook)
- [fastai 튜토리얼](https://docs.fast.ai/tutorial.vision.html) · [포럼](https://forums.fast.ai/)
