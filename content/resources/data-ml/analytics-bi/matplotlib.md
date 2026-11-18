---
name: Matplotlib
url: https://matplotlib.org
docs: https://matplotlib.org/stable/
repo: https://github.com/matplotlib/matplotlib
stars: 23477
domain: data-ml
category: analytics-bi
description: Python 의 기본 2D 시각화 라이브러리. 논문·보고서용 정적 그래프와 세밀한 그림 제어가 필요할 때 쓰며, pandas·seaborn 의 그리기 백엔드이기도 하다.
pricing: oss
tags: [visualization, plotting, chart, scientific, python]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Matplotlib 은 선·막대·산점도·히스토그램·이미지 등 거의 모든 2D 그래프를 그리는 Python 라이브러리다. Figure(전체 그림) 안에 Axes(좌표 평면)를 두고 각 요소를 객체로 조작하는 구조라 축·눈금·주석까지 세밀하게 바꿀 수 있다. PNG·SVG·PDF 로 저장하며, pandas `.plot()` 과 seaborn 이 내부적으로 Matplotlib 을 쓴다.

**버전(2026-11 기준):** 3.11.2(2026-09-11), Python 3.11 이상. 라이선스는 PSF 기반의 Matplotlib License(BSD 호환 허용형, GitHub 는 SPDX 미표기). 상호작용 웹 차트가 필요하면 Plotly(`plotly` 7.1.0, MIT)가 대안이다.

## 설치
```bash
pip install matplotlib
```
Jupyter 에서는 별도 설정 없이 셀 출력에 그림이 표시된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Figure | 그림 전체 캔버스. 크기(`figsize`)·해상도(`dpi`) |
| Axes | 데이터를 그리는 좌표 영역 하나. 대부분의 메서드가 여기 있음 |
| 객체지향 API | `fig, ax = plt.subplots()` 후 `ax.plot(...)` — 권장 방식 |
| pyplot API | `plt.plot(...)` 처럼 "현재 Axes" 에 그리는 간편 방식 |
| Artist | 선·텍스트·패치 등 그려지는 모든 객체 |
| 백엔드 | 화면(Qt, Tk, 노트북) 또는 파일(Agg) 출력 엔진 |
| 스타일 / rcParams | `plt.style.use(...)`, 전역 기본값 설정 |

## 기본 사용법
```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 200)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 3.5), layout="constrained")

ax1.plot(x, np.sin(x), label="sin")
ax1.plot(x, np.cos(x), label="cos", linestyle="--")
ax1.set(title="Waves", xlabel="x", ylabel="y")
ax1.legend()

data = np.random.default_rng(0).normal(size=1000)
ax2.hist(data, bins=30, color="tab:green", alpha=0.8)
ax2.set_title("Histogram")

fig.savefig("chart.png", dpi=150)
```

## 자주 쓰는 패턴
- **객체지향 API 사용**: 여러 서브플롯·함수에서 그릴 때는 `ax` 를 인자로 넘겨 상태 의존을 없앤다.
- **레이아웃**: `layout="constrained"` 로 제목·라벨 겹침을 자동 조정.
- **한글 글꼴**: 기본 글꼴은 한글이 깨지므로 `plt.rcParams["font.family"] = "NanumGothic"`(설치된 글꼴명)과 `axes.unicode_minus = False` 를 설정.
- **pandas 연동**: `df.plot(x="date", y="amount", ax=ax)` 로 그린 뒤 `ax` 로 세부 조정.
- **서버에서 저장만**: GUI 없는 환경에서는 `matplotlib.use("Agg")` 후 `savefig`.

## 언제 쓰나 / 피할 때
- 쓸 때: 논문·보고서용 정적 그림, 축·주석의 세밀한 제어, 노트북 분석 중 빠른 확인.
- 피할 때(대안): 확대·호버가 되는 웹 상호작용 차트는 Plotly, 대시보드 앱은 [Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/), 공유 BI 대시보드는 [Apache Superset](/develop-wiki/data-ml/analytics-bi/apache-superset/).

## 공식 문서
- [문서 홈](https://matplotlib.org/stable/) · [Quick start guide](https://matplotlib.org/stable/users/explain/quick_start.html) · [갤러리](https://matplotlib.org/stable/gallery/index.html)
- [API 레퍼런스](https://matplotlib.org/stable/api/index.html) · [라이선스](https://matplotlib.org/stable/project/license.html) · [Plotly Python](https://plotly.com/python/)
