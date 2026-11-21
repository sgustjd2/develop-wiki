---
name: Plotly (+ Dash)
url: https://plotly.com/python/
docs: https://plotly.com/python/
repo: https://github.com/plotly/plotly.py
stars: 18915
domain: data-ml
category: analytics-bi
description: plotly.js 기반의 상호작용 차트 라이브러리와, 같은 회사의 Python 웹 대시보드 프레임워크 Dash. 확대·호버가 되는 웹 차트나 Python 만으로 분석 앱을 만들 때 쓴다.
pricing: oss
tags: [visualization, interactive, chart, dashboard, plotly-express, dash, python]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
**Plotly**(plotly.py)는 브라우저용 차트 엔진 plotly.js 를 Python 에서 쓰게 해 주는 시각화 라이브러리다. 그림을 JSON 형태의 Figure(데이터 trace + layout)로 만들고 HTML·노트북에 렌더하므로 확대·이동·호버·범례 토글이 기본으로 된다. 한 줄로 그리는 고수준 API **Plotly Express**(`px`)와 세밀하게 조작하는 **Graph Objects**(`go`)를 함께 제공하고, 3D·지도·금융 차트까지 지원한다.

**Dash** 는 Plotly 가 만든 Python 웹 앱 프레임워크로, 레이아웃(HTML·차트 컴포넌트)과 콜백(입력이 바뀌면 출력 갱신)만으로 대시보드를 만든다. 내부적으로 Flask 서버와 React 프런트엔드를 쓰지만 JavaScript 를 직접 쓸 필요가 없다.

**버전(2026-11 기준):** plotly 7.1.0(2026-09-15, Python 3.8+), dash 4.5.0(2026-10-29, Python 3.9+), 둘 다 MIT. plotly 7.0 은 plotly.js 4.0 으로 올라가며 `*mapbox` trace 를 제거(`scatter_map` 등 `*map` 으로 대체)하고 Orca·구버전 Kaleido 정적 이미지 내보내기와 폐기된 Figure Factory 함수 다수를 삭제했다. dash 4.0 은 핵심 컴포넌트(dcc)를 새로 디자인했다. 정적 출판용 그래프는 [Matplotlib](/develop-wiki/data-ml/analytics-bi/matplotlib/), 스크립트형 데이터 앱은 [Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/) 이 비교 대상이다.

## 설치
```bash
pip install plotly            # 차트
pip install kaleido           # PNG·SVG·PDF 정적 이미지 내보내기(선택)
pip install dash              # 대시보드 앱
```
Jupyter 에서는 추가 설정 없이 Figure 를 셀 결과로 출력하면 상호작용 차트가 표시된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Figure | `data`(trace 목록) + `layout`(축·제목·범례)로 구성된 그림 객체 |
| Trace | 차트 한 계열: `scatter`, `bar`, `histogram`, `box`, `heatmap`, `scatter_map` 등 |
| Plotly Express | DataFrame 열 이름으로 x·y·color·facet 을 지정하는 고수준 함수 (`px.line`) |
| Graph Objects | `go.Figure`, `go.Scatter` 로 trace 를 직접 구성 |
| Template | `plotly_white` 등 전체 스타일 프리셋 |
| Dash layout | `html.Div`, `dcc.Graph`, `dcc.Dropdown` 등 컴포넌트 트리 |
| Dash callback | `@callback(Output, Input)` 로 입력 변경 시 함수 실행 → 출력 속성 갱신 |

## 기본 사용법
```python
import plotly.express as px

df = px.data.gapminder().query("year == 2007")
fig = px.scatter(df, x="gdpPercap", y="lifeExp", size="pop", color="continent",
                 hover_name="country", log_x=True, template="plotly_white")
fig.update_layout(title="2007년 1인당 GDP와 기대 수명")
fig.write_html("gapminder.html")    # 단독 HTML (fig.show() 는 브라우저/노트북 표시)
```
Dash 앱:
```python
from dash import Dash, html, dcc, callback, Input, Output
import plotly.express as px

df = px.data.gapminder()
app = Dash(__name__)
app.layout = html.Div([
    dcc.Dropdown(sorted(df.country.unique()), "Korea, Rep.", id="country"),
    dcc.Graph(id="chart"),
])

@callback(Output("chart", "figure"), Input("country", "value"))
def update(country):
    return px.line(df[df.country == country], x="year", y="gdpPercap")

if __name__ == "__main__":
    app.run(debug=True)              # http://127.0.0.1:8050
```

## 자주 쓰는 패턴
- **pandas 백엔드**: `pd.options.plotting.backend = "plotly"` 로 `df.plot()` 결과를 Plotly 차트로 받는다.
- **서브플롯**: `plotly.subplots.make_subplots(rows=2, cols=1, shared_xaxes=True)` 에 `fig.add_trace(..., row=, col=)`.
- **정적 이미지**: 보고서용은 `fig.write_image("chart.png", scale=2)`(Kaleido 1.x 필요).
- **대용량 산점도**: 점이 수십만 개면 `go.Scattergl`(WebGL) 또는 집계 후 `density_heatmap` 을 쓴다.
- **Dash 상태 공유**: 계산 결과를 `dcc.Store` 에 두고 여러 콜백이 재사용한다. 운영 배포는 `gunicorn app:server`.

## 언제 쓰나 / 피할 때
- 쓸 때: 노트북·웹에서 호버·확대가 되는 탐색용 차트가 필요할 때, 차트를 HTML 로 공유할 때, Python 개발자만으로 사내 분석 대시보드를 만들 때(Dash).
- 피할 때(대안): 논문용 세밀한 정적 그림은 [Matplotlib](/develop-wiki/data-ml/analytics-bi/matplotlib/). 빠른 프로토타입 앱은 [Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/). SQL 기반 BI·권한 관리가 필요한 대시보드는 [Apache Superset](/develop-wiki/data-ml/analytics-bi/apache-superset/)·[Metabase](/develop-wiki/data-ml/analytics-bi/metabase/).
- 주의: 6.x 코드의 `scatter_mapbox` 와 제거된 Figure Factory 함수(`create_distplot`, `create_gantt` 등)는 7.x 에서 동작하지 않는다. 매우 큰 데이터를 HTML 에 그대로 넣으면 파일이 무거워진다.

## 공식 문서
- [Plotly Python](https://plotly.com/python/) · [Plotly Express](https://plotly.com/python/plotly-express/) · [Dash](https://dash.plotly.com/) · [plotly.py 릴리스](https://github.com/plotly/plotly.py/releases) · [Dash 저장소](https://github.com/plotly/dash)
