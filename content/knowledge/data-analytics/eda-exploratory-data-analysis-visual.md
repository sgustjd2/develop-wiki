---
title: 탐색적 데이터 분석과 시각적 탐색 (EDA)
aka: [Exploratory Data Analysis, EDA, Five-number Summary, Box Plot, Scatter Plot Matrix, Q-Q Plot, 시각적 데이터 탐색]
category: data-analytics
group: preprocessing
level: beginner
summary: 모델을 가정하기 전에 요약통계와 그래프로 데이터의 분포·관계·이상을 먼저 살피는 접근이다. 상자그림·히스토그램·산점도·Q-Q 플롯이 답하는 질문과, 시공간·다변량·비정형 탐색의 목적 차이를 정리한다.
tags: [eda, tukey, box-plot, histogram, scatter-plot, qq-plot, anscombe, nist]
related: [data-analytics/descriptive-statistics-probability-distributions, data-analytics/correlation-pearson-spearman-kendall, data-analytics/outlier-detection-methods, data-analytics/missing-values-handling-mechanisms, data-analytics/data-visualization-types-process-d3, data-analytics/feature-selection-dimensionality-reduction, data-analytics/time-series-stationarity-arima, machine-learning/text-mining-tfidf-tokenization]
sources:
  - https://www.itl.nist.gov/div898/handbook/eda/section1/eda11.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section1/eda12.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/eda34.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/histogra.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/scatterp.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/qqplot.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/runseqpl.htm
  - https://www.itl.nist.gov/div898/handbook/eda/section3/starplot.htm
updatedAt: 2026-11-23
---

## 개요

- EDA 는 John Tukey 가 체계화한 분석 태도다. NIST 핸드북은 EDA 를 "기법 모음이 아니라 분석 철학"으로 소개하고, 주로 그래프를 쓰며, 데이터가 어떤 모델을 따르는지 **미리 정하지 않고** 데이터가 구조를 드러내게 한다고 설명한다.
- NIST 가 든 목표: 통찰 극대화, 숨은 구조 발견, 중요한 변수 추출, 이상값·이상 징후 탐지, 가정 점검, 간명한 모델 개발.
- 순서의 차이(NIST 비교): 고전적 분석은 문제 → 데이터 → **모델** → 분석 → 결론, EDA 는 문제 → 데이터 → **분석** → 모델 → 결론.
- 전처리·모델링 앞뒤에서 반복한다. 결측·이상값·분포 왜곡·변수 관계를 알아야 어떤 변환·모델을 쓸지 정할 수 있다.

## 시험 범위 대응

- 빅데이터분석기사 2과목 "데이터 탐색 > 기초(개요·상관관계 분석·기초통계량 추출 및 이해·시각적 데이터 탐색)"와 "고급(시공간 데이터 탐색·다변량 데이터 탐색·비정형 데이터 탐색)".
- ADP 실기 출제 방향의 "EDA(요약통계·히스토그램·산점도·상자그림·차원 축소·군집)". ADP 필기의 데이터 시각화 과목은 [시각화 노트](/develop-wiki/knowledge/data-analytics/data-visualization-types-process-d3/)와 구분한다(탐색용 vs 전달용).
- ADsP 는 "기초 통계분석" 안에서 다루는 범위(직접 EDA 항목명은 없음).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 탐색적 데이터 분석 | exploratory data analysis | 모델 가정에 앞서 데이터를 그래프·요약으로 살피는 접근 |
| 5수 요약 | five-number summary | 최솟값, 1사분위수, 중앙값, 3사분위수, 최댓값 |
| 사분위 범위 | IQR | Q3 − Q1 |
| 울타리 | fence | 이상값 표시 기준선. NIST: Q1 − 1.5·IQR, Q3 + 1.5·IQR (3.0·IQR 바깥은 NIST 가 더 큰 원으로 구분해 그린다) |
| 상자그림 | box plot | 상자 = 1~3사분위수, 안쪽 선 = 중앙값, 수염 = 울타리 안 최극값 |
| 분위수-분위수 그림 | Q-Q plot | 두 데이터(또는 데이터와 이론 분포)의 분위수를 맞대어 분포 동일성을 본다 |

## 그래프가 답하는 질문 (NIST 핸드북 기준)

| 그래프 | 목적 | 알 수 있는 것 |
| --- | --- | --- |
| 히스토그램 | 단변량 분포 요약 | 중심, 퍼짐, 비대칭, 이상값, 다봉성. 구간 폭은 분석가가 정하는 선택이다(핸드북은 구간 정의를 사용자 또는 체계적 규칙에 맡긴다고 서술) |
| 상자그림 | 위치·변동의 집단 비교 | 요인이 효과를 갖는가, 집단 간 위치·변동 차이, 이상값 |
| 산점도 | 두 변수의 관계 | 관련 여부, 선형·비선형, Y 의 변동이 X 에 따라 변하는가, 이상값. **연관이 인과를 입증하지는 않는다** |
| Q-Q 플롯 | 두 분포 비교 | 45도 선에서 벗어난 정도로 위치·척도·대칭·꼬리 차이. 한 표본과 이론 분포를 비교하면 확률 그림(probability plot) |
| 실행 순서 그림 | 수집 순서대로 값 | 위치·산포의 이동, 이상값. "상수 + 오차" 모형의 가정 점검 |
| 별 그림 | 관측치별 다변량 | 우세한 변수, 비슷한 관측치, 이상값. 수백 점 미만에서만 유용(핸드북) |

산점도 행렬(scatterplot matrix)과 상관 히트맵은 NIST EDA 기법 목록(eda34)에 없다. 산점도를 변수 쌍마다 모아 놓은 것, 상관계수 표를 색으로 칠한 것이라는 설명은 필자 정리이며 이 노트에서 1차 출처로 확인하지 못했다. 상관계수의 의미와 한계는 [상관분석](/develop-wiki/knowledge/data-analytics/correlation-pearson-spearman-kendall/).

### 요약통계만 보면 안 되는 이유 (Anscombe 4중주)

네 데이터 세트(각 11점)의 요약이 거의 같다. 직접 계산 결과:

| 세트 | y 평균 | y 분산 | 상관 r | 회귀 기울기 |
| --- | --- | --- | --- | --- |
| I | 7.50 | 4.13 | 0.816 | 0.50 |
| II | 7.50 | 4.13 | 0.816 | 0.50 |
| III | 7.50 | 4.12 | 0.816 | 0.50 |
| IV | 7.50 | 4.12 | 0.817 | 0.50 |

그런데 산점도는 각각 선형, 곡선, 이상값 하나가 선을 끄는 모양, 한 점이 모든 것을 결정하는 모양이다. 숫자 요약 → 그림 확인을 같이 한다. (입력 값은 공개 사본(seaborn-data 의 anscombe.csv)과 44개 값이 모두 일치함을 팩트체크에서 확인했다. 1973 원논문 표는 직접 읽지 않았다.)

### 상자그림 읽기: 계산 예

값 `2,3,3,4,4,5,5,6,7,30`: 최소 2, Q1 3.25, 중앙값 4.5, Q3 5.75, 최대 30, IQR 2.5, 울타리 [−0.5, 9.5](numpy 기본 선형보간 분위수). 30 은 울타리 밖이라 이상값 후보다. 분위수 계산법(보간 방식)은 소프트웨어마다 달라 같은 데이터에서 Q1·Q3 가 조금 다를 수 있다. 이 차이는 수험서 풀이와 소프트웨어 출력이 어긋나는 흔한 이유로, 이 노트에서 소프트웨어별로 비교하지는 않았다.

## 탐색 목적 구분: 공식 범위 항목과 대응

공식 범위의 항목 이름만 있고 세부 내용은 공개돼 있지 않아, 아래 대응은 **항목 이름을 풀어 쓴 필자의 정리**다.

| 항목 | 주로 묻는 것 | 대표 도구 |
| --- | --- | --- |
| 기초 탐색 | 변수별 분포, 변수 쌍의 관계, 기초통계량 | 5수 요약, 히스토그램, 상자그림, 산점도, 상관표 |
| 시공간 데이터 탐색 | 시간에 따른 변화(추세·계절·급변)와 위치에 따른 분포 | 실행 순서/시계열 그림(NIST 로 확인), 지도 위 점·면 표시(지도 기법은 이 노트에서 출처 미확인) |
| 다변량 데이터 탐색 | 여러 변수를 동시에 볼 때의 구조·군집·이상 | 산점도 행렬, 별 그림(NIST), 차원 축소([변수 선택·차원 축소](/develop-wiki/knowledge/data-analytics/feature-selection-dimensionality-reduction/)) |
| 비정형 데이터 탐색 | 텍스트·이미지 등을 숫자 표현으로 바꾼 뒤의 빈도·분포·유사성 | 단어 빈도, 워드클라우드 등([텍스트 마이닝](/develop-wiki/knowledge/machine-learning/text-mining-tfidf-tokenization/)). 이 노트에서 별도 1차 출처 미확인 |

시계열의 자기상관·정상성 점검은 [시계열 노트](/develop-wiki/knowledge/data-analytics/time-series-stationarity-arima/)로 이어진다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 탐색용 그래프 vs 전달용 시각화 | 전자는 분석가가 구조를 찾는 도구(거칠어도 됨), 후자는 청중에게 결론을 설득하는 설계 |
| EDA vs 확증적 분석 | EDA 로 찾은 패턴은 가설이다. 같은 데이터로 검정까지 하면 p 값이 낙관적이다(필자 주의) |
| Q-Q 플롯 vs 확률 그림 | 둘 다 분위수 대응이다. 전자는 두 표본, 후자는 표본 대 이론 분포(NIST) |
| 이상값 표시 vs 이상값 제거 | 울타리 밖은 후보일 뿐이다. 처리 판단은 [이상값 탐지](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/) |

## 언제 쓰나 / 주의

- 새 데이터를 받았을 때 첫 단계. 결측 패턴([결측값](/develop-wiki/knowledge/data-analytics/missing-values-handling-mechanisms/))·이상값·왜곡 분포·범주 불균형을 모델링 전에 확인한다.
- 히스토그램은 구간 폭에 따라 인상이 달라진다. 여러 폭으로 본다(일반 통계 상식이며 NIST 히스토그램 페이지가 명시한 경고는 아님).
- 변수가 많으면 쌍별 그림이 폭증한다. 목적 변수 관련 그림부터 본다.
- 그림에서 본 구조를 근거 없이 인과로 읽지 않는다(NIST 산점도 페이지).
- 많이 볼수록 우연한 패턴을 발견할 확률도 커진다.

## 검증 범위

- 읽음: NIST/SEMATECH e-Handbook of Statistical Methods 의 EDA 개요(eda11·eda12), 그래프 기법 목록(eda34), 상자그림·히스토그램·산점도·Q-Q·실행순서·별 그림 페이지(2026-11-23).
- Tukey 의 원서(*Exploratory Data Analysis*, 1977)는 읽지 않았다. 5수 요약 정의는 상식 수준 서술이며 원문 대조는 하지 않았다.
- 직접 계산: Anscombe 4세트 요약, 상자그림 예(Python). 지도 기반 시공간 탐색, 산점도 행렬·상관 히트맵, 비정형 탐색은 1차 출처를 확인하지 못해 필자 정리로 표시했다.
