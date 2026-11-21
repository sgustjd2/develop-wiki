---
name: Polars
url: https://pola.rs
docs: https://docs.pola.rs/
repo: https://github.com/pola-rs/polars
stars: 40419
domain: data-ml
category: processing
description: Rust 로 작성된 컬럼형 DataFrame 라이브러리. 지연 실행과 멀티스레드 엔진으로 단일 머신에서 수십 GB 데이터를 빠르게 가공할 때 쓴다.
pricing: oss
tags: [dataframe, rust, arrow, lazy, columnar, etl]
languages: [python, rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Polars 는 Apache Arrow 메모리 모델 위에서 동작하는 DataFrame 라이브러리다. 행 단위 함수 대신 **표현식(expression)** 을 조합해 연산을 기술하고, 쿼리 엔진이 이를 최적화해 모든 코어로 병렬 실행한다. 인덱스가 없고, 즉시 실행(eager)과 지연 실행(lazy) API 를 함께 제공한다.

**버전(2026-11 기준):** Python 2.1.0(2026-10-25). 2.0(2026-10-06)에서 메모리 초과 시 디스크를 쓰는 out-of-core 처리가 기본으로 켜졌고(가용 RAM 80% 기준), 스트리밍 엔진에 out-of-core 정렬이 추가됐다. `cut`/`qcut` 은 deprecated, Parquet ENUM 열은 `pl.String` 으로 읽힌다. 라이선스 MIT.

[pandas](/develop-wiki/data-ml/processing/pandas/)보다 빠르고 API 가 일관되지만 생태계 호환성은 pandas 가 넓다. SQL 이 편하면 [DuckDB](/develop-wiki/backend/database/duckdb/)가 같은 영역을 다룬다(둘은 Arrow 로 무복사 교환 가능).

## 설치
```bash
pip install polars
pip install "polars[pyarrow,pandas]"   # pandas·pyarrow 상호 변환
```
Rust 에서는 `cargo add polars`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `DataFrame` / `Series` | 즉시 실행되는 테이블·열 |
| `LazyFrame` | 쿼리 계획. `collect()` 시점에 최적화 후 실행 |
| 표현식 `pl.col(...)` | 열 연산을 기술하는 단위. 컨텍스트 안에서 병렬 실행 |
| 컨텍스트 | `select`, `with_columns`, `filter`, `group_by().agg()` |
| `scan_*` | `scan_parquet`/`scan_csv` 등 지연 읽기. 필요한 열·행만 읽음(pushdown) |
| 스트리밍 엔진 | 데이터를 청크 단위로 처리해 메모리보다 큰 입력 처리 |
| `pl.SQLContext` | DataFrame 에 SQL 질의 |

## 기본 사용법
```python
import polars as pl

df = pl.DataFrame({
    "city": ["Seoul", "Busan", "Seoul", "Incheon"],
    "sales": [120, 80, 200, 50],
})

out = (
    df.with_columns((pl.col("sales") * 1.1).alias("with_tax"))
      .group_by("city")
      .agg(pl.col("sales").sum().alias("total"), pl.len().alias("n"))
      .sort("total", descending=True)
)
print(out)
```

지연 실행으로 큰 Parquet 처리:
```python
q = (
    pl.scan_parquet("events/*.parquet")
      .filter(pl.col("event") == "purchase")
      .group_by("user_id")
      .agg(pl.col("amount").sum())
)
print(q.explain())          # 최적화된 계획 확인
result = q.collect()        # 실행
```

## 자주 쓰는 패턴
- **lazy 우선**: 파일은 `read_*` 대신 `scan_*` 으로 열어 projection·predicate pushdown 을 받는다.
- **조건 열**: `pl.when(cond).then(a).otherwise(b)` 로 if-else 열을 만든다.
- **윈도 함수**: `pl.col("x").sum().over("group")` 으로 그룹 합계를 행마다 붙인다.
- **pandas 연동**: `df.to_pandas()`, `pl.from_pandas(pdf)`. 시각화·ML 라이브러리 입력이 pandas 일 때.
- **SQL 혼용**: `pl.sql("SELECT ... FROM df")` 로 지역 변수 DataFrame 을 SQL 로 질의.

## 언제 쓰나 / 피할 때
- 쓸 때: 단일 머신에서 수 GB~수십 GB ETL, pandas 가 느리거나 메모리가 부족할 때, 타입이 명확한 파이프라인 코드.
- 피할 때(대안): 여러 노드가 필요한 규모는 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/). pandas 전용 라이브러리 의존이 크면 [pandas](/develop-wiki/data-ml/processing/pandas/). SQL 중심 분석은 [DuckDB](/develop-wiki/backend/database/duckdb/).

## 공식 문서
- [사용자 가이드](https://docs.pola.rs/) · [Getting started](https://docs.pola.rs/user-guide/getting-started/) · [Python API 레퍼런스](https://docs.pola.rs/api/python/stable/reference/)
- [Lazy API](https://docs.pola.rs/user-guide/lazy/) · [pandas 사용자를 위한 안내](https://docs.pola.rs/user-guide/migration/pandas/) · [릴리스 노트](https://github.com/pola-rs/polars/releases)
