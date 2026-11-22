---
title: 데이터 시각화 — 목적별 유형·프로세스·D3.js
aka: [Data Visualization, Chart Types, Infographic, Visualization Process, D3.js, Data-Driven Documents, Overplotting]
category: data-analytics
group: visualization
level: intermediate
summary: 시각화를 목적(양·분포·비율·관계·공간·불확실성)별로 고르는 법, 탐색용과 설명용의 구분, 대용량 데이터의 겹침 문제, D3.js 의 selection·scale·axis·data join 개념을 1차 문헌 기준으로 정리한다.
tags: [visualization, chart-types, infographic, d3, scale, axis, overplotting, big-data]
related: [ui-ux/data-viz-color, ui-ux/accessible-charts, ui-ux/screen-reader-manual-test-script-chart-grid, data-analytics/eda-exploratory-data-analysis-visual, data-analytics/big-data-characteristics-value-risks, data-analytics/descriptive-statistics-probability-distributions, data-analytics/exam-map-adsp-adp-bigdata-analyst]
sources:
  - https://clauswilke.com/dataviz/figure-titles-captions.html
  - https://clauswilke.com/dataviz/directory-of-visualizations.html
  - https://clauswilke.com/dataviz/overlapping-points.html
  - https://clauswilke.com/dataviz/telling-a-story.html
  - https://www.cs.ubc.ca/~tmm/vadbook/
  - https://d3js.org/what-is-d3
  - https://d3js.org/getting-started
updatedAt: 2026-11-23
---

## 개요

- 좋은 시각화는 **무엇을 알리려는가(목적)** 에서 차트를 고른다. 차트 이름부터 고르면 데이터의 요점이 묻힌다.
- 시각화는 두 갈래로 나뉜다: 분석가가 데이터를 알아가는 **탐색**과, 독자에게 결론을 전달하는 **설명(프레젠테이션)**. 같은 차트라도 설명용에는 요점이 선명해야 한다.
- 이 노트의 차트 분류는 Wilke 의 무료 교재 *Fundamentals of Data Visualization* 의 목록에 맞추고, 수험·실무에서 쓰는 "시간·분포·관계·비교·공간·부분과 전체" 분류와의 대응을 표로 따로 둔다.
- 색·접근성 세부는 [시각화 색상](/develop-wiki/knowledge/ui-ux/data-viz-color/), [접근 가능한 차트](/develop-wiki/knowledge/ui-ux/accessible-charts/)가 맡는다.

## 시험 범위 대응

- ADP 필기 "데이터 시각화": 시각화 인사이트 프로세스(의미, 탐색 1단계, 분석 2단계, 활용 3단계) / 시각화 디자인(정의, 프로세스, 방법, 빅데이터와 시각화 디자인) / 시각화 구현(개요, 분석 도구, 라이브러리 기반 시각화 구현: D3.js).
- 빅데이터분석기사 4과목 "분석결과 해석 및 활용 > 시각화": 시공간·관계·비교 시각화, 인포그래픽. ADsP 에는 직접 항목 없음(관련: 빅데이터분석기사 2과목 "시각적 데이터 탐색").
- **"탐색 1단계 → 분석 2단계 → 활용 3단계" 는 공식 출제범위에 단계 이름만 있고 공개된 1차 설명을 찾지 못했다.** 이 노트는 그 3단계의 내용을 수험 교재 설명으로 채우지 않았다(미확인).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 오버플로팅(점 겹침) | Overplotting | 점이 너무 많아 서로 가려 밀도를 알 수 없게 되는 현상. 큰 데이터뿐 아니라 값이 반올림되어 좌표가 같은 경우에도 생긴다 |
| 지터 | Jitter | 겹친 점을 떼어 놓으려 주는 작은 무작위 이동. 지나치면 데이터를 왜곡한다 |
| 데이터 조인 | Data join | D3 에서 데이터 집합을 DOM 요소에 연결하고 새로 들어오는(enter)·갱신되는(update)·빠지는(exit) 요소의 동작을 따로 정하는 개념 |
| 스케일 | Scale | 데이터 값(정의역)을 화면 좌표·색 같은 출력 값(치역)으로 대응시키는 함수 |
| 축 | Axis | 스케일을 눈금과 레이블로 그려 주는 요소 |
| 인포그래픽 | Infographic | 정보를 그림·도표·문장으로 한 장에 묶어 전달하는 시각물(이 노트는 1차 출처를 읽지 못해 정의를 확정하지 않음) |

## 목적별 차트 유형

Wilke 의 "Directory of visualizations" 는 여섯 범주로 나눈다.

| 범주(원문) | 대표 유형(원문 목록에서) | 묻는 질문 |
| --- | --- | --- |
| Amounts | 막대(수직·수평), 점 그림, 묶음·누적 막대, 히트맵 | 항목마다 값이 얼마인가 |
| Distributions | 히스토그램, 밀도, 누적 밀도, q-q, 상자그림, 바이올린, 스트립, 능선(ridgeline) | 값이 어떻게 퍼져 있는가 |
| Proportions | 원, 나란한·누적 막대, 모자이크, 트리맵, parallel sets | 전체에서 각 부분이 얼마를 차지하는가 |
| x–y relationships | 산점도, 버블, 슬로프 그래프, 등고선, 2D·헥스 빈, 상관도, 선 그래프, 연결 산점도, 추세선 | 두 변수가 어떤 관계인가 |
| Geospatial data | 지도, 단계구분도(choropleth), 카토그램 | 어디에서 일어나는가 |
| Uncertainty | 오차 막대, 신뢰 띠, 퀀타일 점 그림 등 | 추정이 얼마나 불확실한가 |

- 교재 분류에는 "시간" 범주가 따로 없다. 시간 축 선 그래프는 x–y relationships 에 들어 있다(x 가 시간이거나 단조 증가하는 양일 때).

필자의 대응표(수험·실무의 6분류 ↔ Wilke 범주). 이 대응은 필자의 해석이며 어느 교재의 공식 표가 아니다.

| 통용 분류 | 대응 범주 | 흔한 차트 |
| --- | --- | --- |
| 시간 | x–y relationships 의 선 그래프 | 선 그래프 |
| 분포 | Distributions | 히스토그램, 상자그림, 밀도 |
| 관계 | x–y relationships | 산점도, 버블, 히트맵(상관도) |
| 비교 | Amounts | 막대, 점 그림 |
| 공간 | Geospatial data | 지도, 단계구분도 |
| 부분과 전체 | Proportions | 누적 막대, 트리맵, 원 |

- 수험서가 "비교 시각화"·"관계 시각화"에 어떤 차트를 넣는지는 교재를 읽지 않아 미확인이다. 같은 차트(히트맵 등)가 여러 목적에 쓰일 수 있어 칸막이는 엄밀하지 않다.
- Wilke 의 29장(Telling a story)은 바쁜 독자를 위해 단순하게 만들고 복잡함을 점진적으로 쌓으라고 조언한다. 캡션·제목에는 그림이 전하는 요점을 정확히 쓰고 데이터 출처를 밝히라는 서술은 22.1절(Figure titles and captions)에 있다(이 절은 팩트체크에서 확인했다).

## 시각화 프로세스

- 공개 1차 문헌에서 확인한 틀: Munzner(*Visualization Analysis and Design*, CRC Press, 2014)는 책의 구성이 데이터 추상화(what, 2장), 과제 추상화(why, 3장), 분석·검증 4수준(4장), 표시 요소·배열·색·뷰 조작 설계 선택으로 이어진다. 저자 사이트에서 장 제목만 읽었고 본문은 읽지 않았다.
- 실무에서 흔한 5단계 서술(질문 정의 → 데이터 확인·정제 → 차트 선택 → 디자인·주석 → 검토·공유)은 필자의 일반 정리이며 특정 문헌에서 확인하지 않았다.
- ADP 의 "시각화 디자인 프로세스·방법"이 정확히 어떤 단계를 가리키는지는 미확인.
- 탐색과 설명을 구분한다: 탐색 때는 여러 그림을 빠르게 만들어 보고, 설명 때는 하나의 메시지에 맞춰 줄인다(Wilke 의 "Telling a story" 장의 조언과 방향이 같다). 교재 28.2절 "Data exploration versus data presentation" 본문은 읽지 못했다.

## 빅데이터 시각화에서 고려할 점

- **점 겹침**: 산점도에 점이 많으면 밀도를 알 수 없다. Wilke 의 처방 세 가지: (1) 부분 투명도와 지터, (2) 2D 히스토그램(사각형·육각형 빈에 개수로 색칠), (3) 등고선으로 밀도 표시. 투명도만으로는 매우 큰 데이터에서 밀집부가 덩어리로 보이고 성긴 곳이 안 보인다.
- 지터는 데이터를 왜곡할 수 있어 양을 최소로 한다. 여러 집단의 등고선은 집단이 적고 잘 분리될 때만 비교 가능하며, 많으면 분할(패널)이 낫다.
- 위 목록은 "점 겹침"에 한정된다. 차원 수, 실시간성, 렌더링 성능 같은 다른 고려점은 읽은 자료에서 확인하지 못했다(미확인).
- 집계(빈·밀도)로 줄이면 개별 점은 사라진다. 어떤 요약인지 그림에 밝힌다.

## D3.js

- 공식 소개: D3 는 웹 표준(SVG·Canvas·DOM)으로 데이터를 시각화하는 무료 오픈 소스 JavaScript 라이브러리다. 2011 년 Mike Bostock 이 만들었다. 약 30개의 독립 모듈로 이뤄진다.
- 버전: 공식 시작 페이지에 7.9.2 로 표기(2026-11-23 확인).
- **차트 라이브러리가 아니다**: "차트"라는 개념이 없고 기본 표현도 없다. 스케일·도형 생성기·축·CSV 파싱·selection 같은 낮은 수준의 구성 요소를 조합한다. 공식 소개는 "막대 그래프에 백 줄을 쓰는 게 당연하다고 생각하면 D3 를 쓰라"는 Amanda Cox 의 말을 풀어 인용하며, D3 는 "쉽게가 아니라 가능하게" 한다고 적는다. 간단한 용도에는 자매 라이브러리 Observable Plot 을 권한다.
- 핵심 개념: **selection**(DOM 을 직접·동기적으로 조작), **data join**(데이터 ↔ 요소 연결, enter/update/exit 를 따로 정해 갱신·전환을 정밀하게), **scale**, **axis**.
- 시작 페이지의 예(요지): `d3.scaleLinear().domain([0, 100]).range([height - marginBottom, marginTop])` 로 y 스케일을 만들고, `svg.append("g").call(d3.axisLeft(y))` 처럼 축 생성기를 `<g>` 에 `call` 한다. 로드는 `https://cdn.jsdelivr.net/npm/d3@7/+esm` ES 모듈 import 또는 `npm install d3`.
- 데이터 조인 코드와 `join` 메서드 문법은 읽은 페이지에 설명이 없어 이 노트에 싣지 않았다.

## 직접 계산

D3 는 설치하지 않았고 코드를 실행하지 않았다. 아래는 선형 스케일의 일반적 정의(선형 보간)를 손으로 계산한 것이다(d3-scale 문서의 정의 문구는 읽지 않았다).

- 설정(필자가 정한 값): height=400, marginTop=20, marginBottom=30, 정의역 [0, 100], 치역 [370, 20] (값이 클수록 화면 위쪽).
- 값 25 의 좌표: 370 + (25 − 0)/(100 − 0) × (20 − 370) = 370 − 87.5 = **282.5**.
- 값 0 → 370, 값 100 → 20. SVG 의 y 는 아래로 갈수록 커서 치역이 "큰 값 → 작은 좌표"로 뒤집혀 있다.

## 언제 쓰나 / 주의

- 기본 차트(막대·선·산점도)로 충분하면 D3 를 쓰지 않는다. 맞춤·상호작용·애니메이션이 필요하고 코드 비용을 감당할 수 있을 때 D3 를 쓴다(공식 소개의 서술과 같은 방향).
- 원 그래프는 부분과 전체에 흔하지만 항목이 많으면 읽기 어렵다는 것은 일반론이며, 교재가 어떻게 평가하는지는 이 노트에서 확인하지 않았다.
- 색만으로 구분하지 않고 접근성을 확인한다 → [접근 가능한 차트](/develop-wiki/knowledge/ui-ux/accessible-charts/).
- 탐색 단계의 시각화는 [EDA](/develop-wiki/knowledge/data-analytics/eda-exploratory-data-analysis-visual/)와 이어진다.
- Few·Tufte 등 고전 저작(데이터-잉크 비율 등)은 이 노트에서 읽지 않아 인용하지 않았다.

## 검증 범위

- 읽은 것: Wilke *Fundamentals of Data Visualization* 의 차트 목록 장·겹친 점 장·이야기하기 장(요약 도구로 읽음), Munzner 책 소개 페이지(장 제목), D3 공식 "What is D3"·"Getting started".
- 미확인: ADP 의 시각화 인사이트 3단계와 시각화 디자인 프로세스의 내용, 인포그래픽의 1차 정의, 수험서의 유형 분류, Munzner·Few·Tufte 본문, 빅데이터 시각화의 다른 고려점, D3 data join 코드와 d3-scale·d3-axis 레퍼런스.
- 실행: 없음(스케일 계산은 손계산).
