---
name: Hugging Face Datasets
url: https://huggingface.co/datasets
docs: https://huggingface.co/docs/datasets
repo: https://github.com/huggingface/datasets
stars: 22194
domain: data-ml
category: learning
description: Hugging Face Hub 의 공개 데이터셋 저장소와 이를 한 줄로 불러오는 datasets 라이브러리. 학습·평가용 텍스트·이미지·음성 데이터를 찾고 전처리할 때 쓴다.
pricing: oss
tags: [dataset, huggingface, arrow, streaming, nlp, benchmark]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hugging Face Hub 의 Datasets 섹션은 NLP·비전·음성·표 데이터셋을 저장소 단위로 공유하는 곳이다. 각 데이터셋에는 데이터 카드(출처·라이선스·용도), 브라우저 미리보기(Dataset Viewer), 태스크·언어·크기 필터가 있다. `datasets` 라이브러리는 Hub 나 로컬 파일을 Apache Arrow 기반 테이블로 불러오고, 메모리 매핑·스트리밍으로 메모리보다 큰 데이터도 다룬다.

**버전(2026-11 기준):** `datasets` 5.2.0(2026-11-09), Python 3.10 이상, 라이선스 Apache-2.0. 5.x 에서 스트리밍 셔플이 여러 입력 샤드를 섞도록 개선됐고, 에이전트 실행 기록(agent traces)을 `messages` 형식으로 불러오는 기능이 추가됐다. 개별 데이터셋 라이선스는 데이터 카드마다 다르다.

## 설치
```bash
pip install datasets
hf auth login        # 비공개·접근 제한 데이터셋, 업로드 시 (huggingface_hub CLI)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `load_dataset` | Hub id 또는 로컬 파일(csv, json, parquet)로 데이터 로드 |
| `DatasetDict` / split | `train`·`validation`·`test` 분할 묶음 |
| config(subset) | 한 저장소 안의 하위 구성(언어별 등) |
| `Dataset` | Arrow 기반 테이블. 디스크 캐시 + 메모리 매핑 |
| `IterableDataset` | `streaming=True` 로 내려받지 않고 순차 읽기 |
| `map` / `filter` | 배치 처리·병렬(`num_proc`) 변환, 결과 캐시 |
| Features | 열 타입 스키마(`ClassLabel`, `Image`, `Audio` 등) |
| `push_to_hub` | 데이터셋을 Parquet 로 Hub 에 업로드 |

## 기본 사용법
```python
from datasets import load_dataset

ds = load_dataset("stanfordnlp/imdb")          # DatasetDict(train/test/unsupervised)
print(ds["train"].features, ds["train"][0]["label"])

small = ds["train"].shuffle(seed=42).select(range(1000))
small = small.map(lambda b: {"n_words": [len(t.split()) for t in b["text"]]}, batched=True)
print(small.filter(lambda r: r["n_words"] < 100).num_rows)

df = small.to_pandas()                          # pandas 로 분석
```

대용량은 스트리밍으로:
```python
stream = load_dataset("HuggingFaceFW/fineweb", split="train", streaming=True)
for row in stream.shuffle(seed=42).take(3):
    print(row["text"][:80])
```

## 자주 쓰는 패턴
- **데이터셋 찾기**: Hub 에서 태스크·언어(예: Korean)·라이선스·크기로 필터하고, 카드의 수집 방법·라이선스를 확인한다.
- **로컬 파일 로드**: `load_dataset("parquet", data_files={"train": "train/*.parquet"})`.
- **토크나이즈**: `ds.map(tokenize_fn, batched=True, num_proc=8)` 후 [Transformers](/develop-wiki/ai/fine-tuning/transformers/)·[TRL](/develop-wiki/ai/fine-tuning/trl/) 트레이너에 넘긴다.
- **SQL 로 훑기**: Hub 의 Parquet 파일을 [DuckDB](/develop-wiki/backend/database/duckdb/) `hf://` 경로로 직접 질의.
- **내 데이터 공유**: `Dataset.from_pandas(df).push_to_hub("user/name", private=True)`.

## 언제 쓰나 / 피할 때
- 쓸 때: 모델 학습·평가용 공개 데이터 탐색, 대용량 텍스트·멀티모달 데이터 전처리, 데이터셋 버전 공유.
- 피할 때(대안): 대회 형식의 정형 데이터 실습은 [Kaggle](/develop-wiki/data-ml/learning/kaggle/). 일반 표 데이터 가공은 [pandas](/develop-wiki/data-ml/processing/pandas/)·[Polars](/develop-wiki/data-ml/processing/polars/)가 더 직접적이다.

## 공식 문서
- [Datasets 문서](https://huggingface.co/docs/datasets) · [Quickstart](https://huggingface.co/docs/datasets/quickstart) · [로드](https://huggingface.co/docs/datasets/loading)
- [스트리밍](https://huggingface.co/docs/datasets/stream) · [처리(map/filter)](https://huggingface.co/docs/datasets/process) · [Hub 데이터셋 목록](https://huggingface.co/datasets)
