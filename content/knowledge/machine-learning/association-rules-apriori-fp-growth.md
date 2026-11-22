---
title: 연관규칙 분석 — 지지도·신뢰도·향상도, Apriori, FP-growth
aka: [Association Rules, Market Basket Analysis, Support, Confidence, Lift, Apriori, FP-growth, 장바구니 분석, 연관성 분석]
category: machine-learning
group: unsupervised
level: intermediate
summary: 거래 데이터에서 함께 자주 나타나는 항목 조합을 찾는 연관규칙 분석을, 지지도·신뢰도·향상도 등 지표 식과 Apriori·FP-growth 의 원리, 직접 계산한 장바구니 예제로 정리한다.
tags: [association-rules, apriori, fp-growth, market-basket, lift, unsupervised]
related: [machine-learning/clustering-kmeans-hierarchical-dbscan, machine-learning/lift-gain-chart-ks-model-comparison, data-analytics/categorical-data-contingency-chi-square, data-analytics/estimation-hypothesis-testing-errors-pvalue]
sources:
  - https://www.vldb.org/conf/1994/P487.PDF
  - https://www.cs.sfu.ca/~jpei/publications/sigmod00.pdf
  - https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/association_rules/
updatedAt: 2026-11-23
---

## 개요

- 거래(장바구니) 데이터에서 "A 를 산 사람이 C 도 산다" 같은 **항목 간 동시 발생 규칙**을 찾는다. 정답 레이블이 없는 패턴 발견이다.
- 문제는 두 단계로 나뉜다(Agrawal·Imielinski·Swami 1993 이래의 분해를 Agrawal & Srikant 1994 가 따름): ① 최소 지지도 이상인 **빈발 항목집합** 찾기, ② 빈발 항목집합에서 최소 신뢰도 이상 규칙 만들기. 1994 논문은 ②를 단순하다고 보고 ①의 알고리즘에 집중한다.
- 규칙은 **상관(동시 출현)** 이지 인과가 아니다.

## 시험 범위 대응

ADsP 데이터분석(정형 데이터 마이닝: 연관분석) / ADP 데이터분석(같은 항목) / 빅데이터분석기사 3과목 빅데이터 모델링(분석기법: 연관성분석).

## 핵심 용어

거래 수 N, 항목집합 A·C(겹치지 않음). 식은 mlxtend 문서의 정의를 따른다.

| 한국어 | 영어 | 식 | 읽는 법 |
| --- | --- | --- | --- |
| 지지도 | support | `supp(A→C)` = 항목집합 A∪C 를 포함하는 거래의 비율(확률로는 P(A ∩ C), A 와 C 가 모두 있는 사건) | 규칙이 얼마나 자주 등장하는가. 0~1 |
| 신뢰도 | confidence | `supp(A→C) / supp(A)` = P(C \| A) | A 가 있을 때 C 가 있을 비율. 비대칭. 0~1 |
| 향상도 | lift | `conf(A→C) / supp(C)` | C 의 평소 비율 대비 A 가 있을 때 C 가 몇 배. 1=독립 |
| 레버리지 | leverage | `supp(A→C) − supp(A)·supp(C)` | 관측과 독립 가정 기대의 차이. 0=독립 |
| 확신도 | conviction | `(1 − supp(C)) / (1 − conf(A→C))` | 1=독립, 신뢰도 1 이면 ∞ |
| 빈발 항목집합 | frequent (large) itemset | 지지도가 최소 지지도 이상 | 원 논문은 "large itemset" |

- 원 논문의 지지도는 **개수**(해당 항목집합을 포함한 거래 수)로 쓰이고, 라이브러리는 비율로 쓴다. 이 노트는 비율이다.
- 용어 혼동: 향상도(lift)는 모델 평가의 lift 곡선의 "향상도"와 이름이 같지만 쓰임이 다르다 → [이익도표·향상도](/develop-wiki/knowledge/machine-learning/lift-gain-chart-ks-model-comparison/).

## Apriori

- 핵심 원리: **빈발 항목집합의 모든 부분집합은 빈발**이다(원 논문: "large itemset 의 임의 부분집합은 large"). 대우로, 어떤 부분집합이 빈발하지 않으면 그 확장은 볼 필요가 없다.
- 절차: k−1 개짜리 빈발집합들을 합쳐 k 개짜리 후보를 만들고(join), 비빈발 부분집합을 가진 후보를 삭제(prune)한 뒤, 거래를 훑어 후보의 지지도를 센다. 더 이상 빈발집합이 없을 때까지 k 를 늘린다.
- 비용: 레벨마다 데이터를 한 번 훑는다. 후보가 많거나 패턴이 길면 비싸다.

## FP-growth

- Han·Pei·Yin(SIGMOD 2000): 후보 생성-검사 방식이 빈발 패턴이 많거나 길 때 비싸다는 문제의식에서, **FP-tree**(빈발 항목을 접두 공유로 압축한 트리)를 만들고 이 트리를 분할해 빈발 패턴을 찾는다. 후보를 만들지 않는다.
- 결과(빈발 항목집합)는 같고, 속도·메모리 특성이 다르다. 실무 라이브러리에서는 FP-growth 가 더 빠른 경우가 많다고 알려져 있으나, 이 노트에서 속도를 직접 비교하지는 않았다.

## 직접 계산

직접 계산(Python 3.15, 표준 라이브러리로 Apriori 를 직접 구현; mlxtend 미사용). 거래 10건: 항목은 빵·우유·기저귀·맥주·콜라·달걀. 최소 지지도 0.3.

- 단일 지지도: 빵 0.8, 우유 0.8, 기저귀 0.5, 맥주 0.4, 콜라 0.3, 달걀 0.2(→ 달걀은 1단계에서 탈락).
- 빈발 2-집합: {빵,우유} 0.6, {기저귀,우유} 0.4, {맥주,빵} 0.3, {맥주,우유} 0.3, {기저귀,맥주} 0.3, {기저귀,빵} 0.3. 3-집합은 후보 4개가 나왔으나 빈발은 없었다.

| 규칙 | 지지도 | 신뢰도 | 향상도 | 레버리지 | 확신도 |
| --- | --- | --- | --- | --- | --- |
| 기저귀 → 맥주 | 0.3 | 0.60 | **1.50** | 0.10 | 1.50 |
| 맥주 → 기저귀 | 0.3 | 0.75 | 1.50 | 0.10 | 2.00 |
| 빵 → 우유 | 0.6 | 0.75 | **0.94** | −0.04 | 0.80 |
| 빵 → 콜라 | 0.2 | 0.25 | 0.83 | −0.04 | 0.93 |

- **신뢰도가 같은 0.75 여도** 맥주→기저귀는 기저귀의 평소 비율이 0.5 라 0.75/0.5 = 1.5배, 빵→우유는 우유의 평소 비율이 0.8 이라 0.75/0.8 = 0.94배로 **오히려 약하다**. 신뢰도만 보면 놓친다.
- 향상도·지지도·레버리지는 A·C 를 바꿔도 같고(대칭), 신뢰도·확신도는 다르다(기저귀→맥주 vs 맥주→기저귀).
- 향상도 해석: >1 이면 우연 기대보다 함께 많이 나타남(양의 연관), =1 이면 독립, <1 이면 함께 덜 나타남(음의 연관).

**허위 규칙 확인**: 항목 50개에서 거래마다 5개를 무작위로 뽑은 200건(seed 0). 항목 사이에 아무 관계가 없어도, 지지도 0.02 이상인 쌍 중 최대 향상도가 **3.66**(지지도 0.025 = 5건)이었다. 지지도가 작은 규칙의 향상도는 우연히 크게 나온다.

## 언제 쓰나 / 주의

- 쓰는 곳: 상품 진열·번들·추천 후보 발굴, 로그·증상 동시 발생 탐색, 탐색 단계의 가설 생성.
- **최소 지지도 설정**: 낮추면 규칙이 폭증하고 높이면 희귀하지만 중요한 조합(고가 상품)을 놓친다.
- **허위 규칙**: 규칙이 많을수록 우연히 높은 향상도가 나온다. 지지도·향상도 임계를 같이 쓰고, 중요한 규칙은 홀드아웃 거래 또는 통계 검정으로 확인한다(필자 권고).
- 신뢰도는 결과 항목이 흔하면 부풀려진다(위 빵→우유). 향상도·레버리지·확신도를 함께 본다.
- 시간 순서·수량·가격을 쓰지 않는다. 순차 패턴이 필요하면 다른 방법이 필요하다.
- 연관 규칙의 동시 출현 표를 카이제곱 등으로 검정하는 관점은 [범주형 자료 분석](/develop-wiki/knowledge/data-analytics/categorical-data-contingency-chi-square/) 참고.

## 검증 범위

- 읽음: Agrawal & Srikant(VLDB 1994) 본문(문제 분해, large itemset, 부분집합 원리, 후보 생성 설명), Han·Pei·Yin(SIGMOD 2000) 초록·도입(후보 생성의 비용, FP-tree), mlxtend 연관규칙 문서(지표 정의·식·해석).
- 실행: 위 장바구니·무작위 거래 계산(직접 구현 Apriori).
- 미확인: FP-tree 구축·마이닝의 세부 절차(논문 전체는 읽지 않음), 향상도 원전(Brin 등 1997)과 레버리지·확신도 원 논문, 원 논문이 지지도를 "개수"로 정의한다는 점 외의 변형. FP-growth 와 Apriori 의 속도 비교는 실행하지 않았다. 수험서마다 지표 이름(예: 향상도=개선도)이 다를 수 있다.
