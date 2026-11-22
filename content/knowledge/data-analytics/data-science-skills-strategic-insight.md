---
title: 데이터 사이언스와 데이터 사이언티스트 역량
aka: [Data Science, Data Scientist, 데이터 사이언스 벤 다이어그램, Data Science Venn Diagram, Greater Data Science, 전략 인사이트, hard skill, soft skill]
category: data-analytics
group: understanding
level: beginner
summary: 데이터 사이언스를 어떻게 정의·분해해 왔는지 Conway 벤 다이어그램(2010)과 Donoho 의 6분류로 보고, 인력 수요 근거(McKinsey 2011)와 교재의 하드·소프트 스킬 틀이 어디까지 확인되는지 구분한다.
tags: [data-science, data-scientist, skills, venn-diagram, strategic-insight, adsp, adp]
related: [data-analytics/exam-map-adsp-adp-bigdata-analyst, data-analytics/big-data-characteristics-value-risks, data-analytics/analysis-methodologies-kdd-crisp-dm-semma, data-analytics/dikw-data-types-database-basics, machine-learning/learning-paradigms-supervised-unsupervised-reinforcement]
sources:
  - http://drewconway.com/zia/2013/3/26/the-data-science-venn-diagram
  - https://courses.csail.mit.edu/18.337/2015/docs/50YearsDataScience.pdf
  - https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century
  - https://karriere.mckinsey.de/~/media/mckinsey/business%20functions/mckinsey%20digital/our%20insights/big%20data%20the%20next%20frontier%20for%20innovation/mgi_big_data_exec_summary.pdf
updatedAt: 2026-11-23
---

## 개요

- "데이터 사이언스"에는 합의된 단일 정의가 없다. 통계학의 확장으로 보는 관점, 통계·머신러닝에 확장 기술을 더한 상위 집합으로 보는 관점, 도메인 지식·코딩·수학을 합친 직무로 보는 관점이 섞여 쓰인다.
- 역량 논의는 크게 두 갈래다. 필요한 지식·기술의 영역(Conway 의 벤 다이어그램, Donoho 의 6분류)과 인력 수요(McKinsey, Davenport & Patil).
- 교재의 "하드 스킬/소프트 스킬", "전략 인사이트 도출 역량"이라는 틀은 아래 출처에서 그대로 확인되지 않는다. 확인된 부분과 구분해 적는다.

## 시험 범위 대응

- ADsP·ADP 데이터 이해: "가치 창조를 위한 데이터 사이언스와 전략 인사이트(빅데이터분석과 전략 인사이트, 전략 인사이트 도출을 위한 필요 역량, 빅데이터 그리고 데이터 사이언스의 미래)".
- 빅데이터분석기사 1과목: "빅데이터 조직 및 인력". 직접 항목은 이름이 다르다.

## 핵심 용어

| 용어 | 영어 | 정의 |
| --- | --- | --- |
| 데이터 사이언스 | data science | 합의된 정의 없음. Cleveland 가 통계학이 확장해야 할 영역의 이름으로 제안했다고 Donoho 가 서술 |
| 데이터 사이언티스트 | data scientist | Davenport & Patil(HBR 2012)이 부제에서 "지저분한 비정형 데이터에서 가치를 끌어내는 사람"으로 소개 |
| 위험 지대 | danger zone | Conway: 해킹 능력과 도메인 전문성은 있으나 수학·통계 지식이 없는 영역 |
| Greater Data Science | GDS | Donoho 가 제안한 데이터 사이언스 활동의 6분류 |

## Conway 의 데이터 사이언스 벤 다이어그램 (2010-09-30)

세 원이 겹친다. 블로그 글이 직접 설명한 내용만 정리한다.

| 원 | 내용 |
| --- | --- |
| 해킹 기술(hacking skills) | 텍스트 파일을 명령행으로 다루기, 벡터화 연산 이해, 알고리즘적 사고. CS 학위가 필요하다는 뜻은 아니라고 한다 |
| 수학·통계 지식 | 최소한 최소제곱 회귀가 무엇이고 어떻게 해석하는지 안다 |
| 실질적 전문성(substantive expertise) | 세상에 대한 질문과 검증할 가설을 제공한다 |

| 교집합 | Conway 의 설명 |
| --- | --- |
| 해킹 + 수학·통계 | 머신러닝. 데이터 사이언스는 아니라고 본다 |
| 수학·통계 + 전문성 | 전통적 연구자 영역. 기술(technology) 학습이 적다 |
| 해킹 + 전문성 | 위험 지대. 결과를 낼 수는 있으나 의미를 이해하지 못하고 분석을 만들 수 있다 |
| 세 원 모두 | 데이터 사이언스 |

- 이 도식은 직무 정의가 아니라 토론을 단순화하려는 시도라고 저자가 밝힌다. 학술 연구 결과가 아니다.

## Donoho 의 6분류 (Greater Data Science)

*50 Years of Data Science*(2015 프리프린트; 이후 *J. Computational and Graphical Statistics* 2017 게재)는 데이터 사이언스를 통계·머신러닝에 확장 기술을 더한 상위 집합이라는 흐름을 비판적으로 검토하고, 활동을 6가지로 나눈다.

| 분류 | 뜻(요약) |
| --- | --- |
| GDS1 데이터 탐색·준비 | EDA, 이상·왜곡 정리 |
| GDS2 데이터 표현·변환 | 다양한 형식 다루기, DB·수학적 표현 |
| GDS3 데이터 컴퓨팅 | 여러 언어, 클러스터·클라우드, 워크플로 |
| 시각화·발표(소제목 GDS4, 프리프린트 목록에서는 5번) | 단순 플롯부터 대시보드까지 |
| 데이터 모델링(소제목 GDS5, 프리프린트 목록에서는 4번) | Breiman 의 두 문화: 생성 모델링 vs 예측 모델링 |
| GDS6 데이터 사이언스에 관한 과학 | 실제 분석 워크플로의 유효성을 측정 |

- 시험 범위의 분석 절차(수집·전처리·모델링·평가)와 GDS1~5 가 대응하는 부분이 많다. 이는 필자의 비교이며 출처가 대응을 말하지는 않는다.

## 역량 틀: 확인된 것과 아닌 것

| 항목 | 상태 |
| --- | --- |
| 하드 스킬(이론적 지식·분석 기술) / 소프트 스킬(통찰력·설득력·협업) 분류 | 한국 수험 교재의 틀. 공개 1차 출처 미확인 |
| Davenport & Patil 이 말한 데이터 사이언티스트 특성 | HBR 본문은 유료 구간이라 도입부만 읽음. 특성 목록은 미확인 |
| 전략 인사이트 도출 역량 | 교재 틀. 1차 출처 미확인 |

- 대신 확인한 것: Conway 도식이 기술·수학·도메인 세 축이 모두 필요하다는 주장, Donoho 의 컴퓨팅·시각화·발표 포함 분류가 "분석 결과를 전달하는 일"이 직무에 포함됨을 보여 준다는 점.
- 조직 수요 측면에서 McKinsey(2011)는 미국에서 깊은 분석 인력 14만~19만 명과 분석 결과로 의사결정할 관리자·분석가 150만 명이 부족할 것으로 봤다. 분석가뿐 아니라 이를 활용하는 관리자 역량도 병목이라는 서술이다. 2011년 전망이므로 현재 수치로 쓰지 않는다.

## 데이터 사이언스의 미래 (근거 있는 서술만)

- Donoho 는 지금의 데이터 사이언스가 "통계+머신러닝+규모 확장 기술"로 정의되는 것이 지적 흐름보다 상업적 흐름의 영향이 크다고 보고, 장기적으로는 과학 전반의 분석 워크플로 유효성을 연구하는 방향을 제안한다. 이는 한 연구자의 주장이다.
- 그 이상의 "미래 전망"(자동화, 직무 변화 등)은 읽은 1차 출처가 없어 쓰지 않는다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 머신러닝 vs 데이터 사이언스(Conway) | 해킹+통계는 머신러닝, 여기에 도메인 질문이 더해져야 데이터 사이언스 |
| 생성 모델링 vs 예측 모델링(Donoho·Breiman) | 데이터를 만든 확률 모형을 추론 vs 주어진 데이터에서 잘 맞히는 예측기 |
| 분석가 vs 관리자 수요 | McKinsey 는 두 집단의 부족을 따로 추정 |

## 언제 쓰나 / 주의

- 팀 구성이나 채용 기준을 논의할 때 어떤 축이 비는지 점검하는 대화 도구로 쓴다.
- 벤 다이어그램은 개인이 모든 영역에 정통해야 한다는 뜻이 아니다. Conway 도 통계 박사가 필요하다고 말하지 않는다.
- 직무 명칭과 요구 역량은 조직마다 다르다. 이 노트의 틀로 인력을 평가하지 않는다.

## 검증 범위

- 읽은 것: Conway 블로그 글 전문, Donoho 2015 프리프린트(초록, 6분류 절), HBR 2012 글의 제목·부제·도입부, MGI(2011) 요약 PDF 인력 전망 부분.
- 못 읽은 것: HBR 본문 후반(특성 서술), Donoho 2017 게재본(프리프린트와 차이 가능), Cleveland(2001).
- 미확인: 하드·소프트 스킬 틀과 전략 인사이트 역량 목록의 공개 1차 출처.
- 직접 계산·실행: 없음.
