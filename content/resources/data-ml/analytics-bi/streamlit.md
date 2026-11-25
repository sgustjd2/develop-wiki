---
name: Streamlit
url: https://streamlit.io
docs: https://docs.streamlit.io/
repo: https://github.com/streamlit/streamlit
stars: 46503
domain: data-ml
category: analytics-bi
description: Python 스크립트만으로 데이터 대시보드·ML 데모 웹앱을 만드는 프레임워크. 프론트엔드 코드 없이 내부 도구와 분석 앱을 빠르게 공유할 때 쓴다.
pricing: oss
tags: [dashboard, web-app, python, data-app, ml-demo]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Streamlit 은 Python 스크립트 위에서 아래로 `st.*` 함수를 호출하면 그대로 웹 UI 가 되는 앱 프레임워크다. 사용자가 위젯을 조작할 때마다 스크립트 전체가 다시 실행되는 단순한 모델을 쓰고, 비싼 계산은 캐시 데코레이터로 재사용한다. pandas·Polars DataFrame, Matplotlib·Plotly·Altair 차트를 그대로 렌더링한다.

**버전(2026-11 기준):** 1.67.0(2026-11-05), Python 3.11 이상. Snowflake 가 운영하며 라이선스 Apache-2.0. Community Cloud 에서 무료로 공개 앱을 배포할 수 있다.

## 설치
```bash
pip install streamlit
streamlit hello            # 예제 앱
streamlit run app.py       # http://localhost:8501
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 재실행 모델 | 상호작용마다 스크립트를 처음부터 다시 실행 |
| 위젯 | `st.slider`, `st.selectbox`, `st.text_input` 등. 반환값이 현재 값 |
| `st.cache_data` | 데이터 로드·계산 결과 캐시 (직렬화 가능한 값) |
| `st.cache_resource` | DB 연결·모델 같은 공유 객체 캐시 |
| `st.session_state` | 재실행 사이에 유지되는 사용자별 상태 |
| 레이아웃 | `st.sidebar`, `st.columns`, `st.tabs`, `st.expander` |
| 다중 페이지 | `st.navigation` + `st.Page` 로 페이지 구성 |
| `st.fragment` | 페이지 일부만 다시 실행 |

## 기본 사용법
```python
# app.py
import pandas as pd
import streamlit as st

st.title("매출 대시보드")

@st.cache_data
def load() -> pd.DataFrame:
    return pd.read_csv("sales.csv", parse_dates=["date"])

df = load()
region = st.sidebar.selectbox("지역", sorted(df["region"].unique()))
filtered = df[df["region"] == region]

col1, col2 = st.columns(2)
col1.metric("총매출", f"{filtered['amount'].sum():,.0f}")
col2.metric("주문 수", len(filtered))

st.line_chart(filtered, x="date", y="amount")
st.dataframe(filtered, use_container_width=True)
```

## 자주 쓰는 패턴
- **캐시 구분**: 데이터프레임은 `cache_data`, DB 커넥션·ML 모델은 `cache_resource`. `ttl` 로 만료 시간 지정.
- **폼으로 재실행 줄이기**: `with st.form("f"):` 안의 입력은 제출 버튼을 눌렀을 때만 반영.
- **DB 연결**: `st.connection("sql")` 과 `.streamlit/secrets.toml` 로 접속 정보를 코드에서 분리.
- **ML 데모**: 모델 로드를 `cache_resource` 로 감싸고 `st.file_uploader` 로 입력을 받아 예측 결과 표시.
- **채팅 UI**: `st.chat_input`, `st.chat_message` 로 LLM 앱 프로토타입.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 분석 결과를 동료가 조작할 수 있는 앱으로 공유, ML 모델 데모, 사내 데이터 도구.
- 피할 때(대안): SQL 기반 정기 대시보드와 권한 관리는 [Apache Superset](/develop-wiki/data-ml/analytics-bi/apache-superset/)·[Metabase](/develop-wiki/data-ml/analytics-bi/metabase/). 사용자가 많고 복잡한 상호작용이 필요한 제품 UI 는 일반 웹 프레임워크. 탐색 분석 자체는 [Jupyter](/develop-wiki/data-ml/analytics-bi/jupyter/).

## 공식 문서
- [문서 홈](https://docs.streamlit.io/) · [Get started](https://docs.streamlit.io/get-started) · [API 레퍼런스](https://docs.streamlit.io/develop/api-reference)
- [캐싱](https://docs.streamlit.io/develop/concepts/architecture/caching) · [Session State](https://docs.streamlit.io/develop/concepts/architecture/session-state) · [Community Cloud 배포](https://docs.streamlit.io/deploy/streamlit-community-cloud)
