---
name: pandas
url: https://pandas.pydata.org
docs: https://pandas.pydata.org/docs/
repo: https://github.com/pandas-dev/pandas
stars: 50633
domain: data-ml
category: processing
description: Python 표준 격의 표 형식 데이터 분석 라이브러리. 메모리에 들어가는 데이터의 정제·집계·시계열 처리와 노트북 분석에 쓴다.
pricing: oss
tags: [dataframe, data-analysis, numpy, timeseries, csv]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
pandas 는 라벨이 붙은 1차원 `Series` 와 2차원 `DataFrame` 으로 표 형식 데이터를 다루는 라이브러리다. CSV·Excel·SQL·Parquet 입출력, 결측치 처리, 그룹 집계, 피벗, 시계열 리샘플링을 제공하며 scikit-learn·Matplotlib 등 대부분의 Python 데이터 도구가 입력으로 받는다.

**버전(2026-11 기준):** 3.1.1(2026-11-04). 3.0 에서 바뀐 점:
- 문자열 열의 기본 dtype 이 `object` 에서 전용 `str` 로 바뀜.
- Copy-on-Write 가 항상 적용: 연쇄 할당(`df[a][b] = x`)이 동작하지 않고 `SettingWithCopyWarning` 이 사라짐.
- `pd.col("a")` 표현식 도입(`assign` 에서 lambda 대체), Python 3.11 이상 필요, 시간대는 `zoneinfo` 사용.

라이선스 BSD-3-Clause.

## 설치
```bash
pip install pandas
pip install "pandas[parquet,excel]"   # pyarrow, openpyxl 등 선택 의존성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `DataFrame` / `Series` | 인덱스가 있는 2차원 표 / 1차원 열 |
| Index | 행 라벨. 정렬·조인·리샘플링 기준 |
| `loc` / `iloc` | 라벨 기반 / 위치 기반 선택 |
| dtype | `int64`, `float64`, `str`, `category`, `datetime64[us]`, nullable(`Int64`), Arrow 기반 dtype |
| `groupby` | split-apply-combine 집계 |
| `merge` / `concat` | SQL 식 조인 / 행·열 이어붙이기 |
| Copy-on-Write | 모든 결과가 복사본처럼 동작해 원본이 의도치 않게 바뀌지 않음 |

## 기본 사용법
```python
import pandas as pd

df = pd.read_csv("orders.csv", parse_dates=["created_at"])

df = df.dropna(subset=["amount"])
df = df.assign(total=pd.col("amount") * pd.col("qty"))   # 3.0+

summary = (
    df.groupby("category", as_index=False)
      .agg(revenue=("total", "sum"), orders=("order_id", "nunique"))
      .sort_values("revenue", ascending=False)
)
print(summary.head())

monthly = df.set_index("created_at")["total"].resample("ME").sum()   # 월말 기준
```

## 자주 쓰는 패턴
- **값 수정은 `loc` 한 번에**: `df.loc[df["qty"] < 0, "qty"] = 0` (3.0 에서는 연쇄 할당이 원본을 바꾸지 않는다).
- **메모리 절약**: 반복 문자열은 `astype("category")`, 큰 파일은 `usecols`·`dtype` 지정, 또는 Parquet 사용.
- **피벗**: `pivot_table(index=..., columns=..., values=..., aggfunc="sum")`.
- **SQL 연동**: `pd.read_sql(query, engine)` / `df.to_sql(...)` (SQLAlchemy 엔진).
- **큰 데이터 SQL 처리**: [DuckDB](/develop-wiki/backend/database/duckdb/) 로 DataFrame 을 직접 질의하거나 Parquet 를 집계한 뒤 pandas 로 받는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 메모리에 들어가는 데이터 탐색·정제, 노트북 분석, 다른 라이브러리가 pandas 입력을 요구할 때.
- 피할 때(대안): 수십 GB 이상이거나 멀티코어 성능이 필요하면 [Polars](/develop-wiki/data-ml/processing/polars/)·[DuckDB](/develop-wiki/backend/database/duckdb/). 여러 노드가 필요하면 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/).

## 공식 문서
- [문서 홈](https://pandas.pydata.org/docs/) · [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html) · [API 레퍼런스](https://pandas.pydata.org/docs/reference/index.html)
- [3.0 변경 사항](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html) · [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html)
