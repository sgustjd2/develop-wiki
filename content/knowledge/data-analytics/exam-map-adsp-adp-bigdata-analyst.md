---
title: ADsP·ADP·빅데이터분석기사 출제범위 지도
aka: [ADsP, ADP, 데이터분석 준전문가, 데이터분석 전문가, 빅데이터분석기사, Big Data Analysis Engineer, 한국데이터산업진흥원, dataq]
category: data-analytics
group: understanding
level: beginner
summary: 한국데이터산업진흥원 공식 페이지 기준으로 ADsP·ADP·빅데이터분석기사의 구분·과목·문항·합격기준·출제범위 대분류를 비교하고, 과목별로 이 허브의 어느 노트를 보면 되는지 연결한다.
tags: [adsp, adp, bigdata-analyst, certification, exam-scope, data-analytics]
related: [data-analytics/dikw-data-types-database-basics, data-analytics/big-data-characteristics-value-risks, data-analytics/data-science-skills-strategic-insight, data-analytics/analysis-methodologies-kdd-crisp-dm-semma, data-analytics/analysis-topic-discovery-top-down-bottom-up, data-analytics/analysis-project-management-master-plan-governance, data-analytics/data-quality-privacy-deidentification, machine-learning/learning-paradigms-supervised-unsupervised-reinforcement]
sources:
  - https://www.dataq.or.kr/www/sub/a_06.do
  - https://www.dataq.or.kr/www/sub/a_05.do
  - https://www.dataq.or.kr/www/sub/a_07.do
updatedAt: 2026-11-23
---

## 개요

- 세 시험은 모두 한국데이터산업진흥원(dataq.or.kr)이 안내하는 데이터 분석 계열 자격이다. 이름이 비슷하지만 구분(민간/국가기술), 시험 형식, 과목 구성이 다르다.
- 이 노트는 "어느 시험에 무엇이 나오는가"와 "그 내용을 이 허브 어디서 보는가"만 정리한다. 합격률·난이도·학습법·교재 평가는 공식 페이지에 없으므로 쓰지 않는다.
- 아래 수치·기간은 **2026-11-23 확인**한 공식 페이지 기준이며 개정될 수 있다. 응시 전에 공식 공고를 다시 본다.

## 시험 범위 대응

이 노트 자체가 세 시험의 출제범위 전체를 다루는 지도다. 세부 항목은 아래 "과목별 연결 표"에서 노트로 이어진다.

## 한눈에 비교 (2026-11-23 확인)

| 항목 | ADsP | ADP | 빅데이터분석기사 |
| --- | --- | --- | --- |
| 구분 | 민간자격(공식 페이지 표기: 공인자격 제2022-05호) | 민간자격(공식 페이지 표기: 공인자격 제2022-05호) | 국가기술자격 |
| 주관 | 한국데이터산업진흥원 | 한국데이터산업진흥원 | 한국데이터산업진흥원 안내 페이지(a_07) |
| 형식 | 필기만 | 필기 + 실기 | 필기 + 실기 |
| 시행 | 연 4회 | 연 2회(공식 페이지 "정기 시행") | 필기·실기 각각 연 2회 |
| 필기 문항 | 객관식 50문항(2점, 100점) | 81문항: 객관식 80(1점씩 80점) + 서술형 1(20점) | 객관식 80문항(과목당 20문항, 각 1.25점) |
| 필기 시간 | 90분 | 180분 | 120분 |
| 필기 합격 | 총점 60점 이상, 과목별 40% 미만 과락 | 총점 70점 이상, 과목별 40% 미만 과락 | 총점 60점 이상, 과목별 40점 미만 과락, 전 과목 평균 60점 미만 과락(공식 문구 그대로) |
| 실기 | 없음 | CBT "데이터분석 실무" 100점, 240분, 75점 이상 | 통합형(필답형+작업형) 100점, 180분, 60점 이상 |
| 응시자격 | 제한 없음 | 학력·경력 기준 또는 ADsP 취득자 | 학력·경력 등 기준(서류 증빙 필요) |
| 기타 | - | 필기 합격자 발표일부터 2년 이내 실기 응시 가능(그 기간 시행이 2회 미만이면 다음 필기 1회 면제) | 필기 합격 면제 2년, 출제기준 적용기간 2024.1.1~2026.12.31 |

- ADP 학력·경력 기준(하나 충족): 박사, 석사+1년, 학사+3년, 전문대+6년, 고졸+9년.
- 빅데이터분석기사의 "과목별 40점 미만"은 공식 문구를 옮긴 것이며, 과목당 배점이 25점(20문항×1.25)이라 100점 환산 기준인지 과목 배점 기준인지 페이지 문구만으로는 확정하지 못했다. 응시 안내문에서 확인한다.
- 빅데이터분석기사의 출제기준 적용기간(2024.1.1~2026.12.31)은 **곧 끝나는 값**이다. 2027년 이후 기준은 공식 페이지에서 확인한다(미확인).

## 출제범위 대분류

| 시험 | 과목(문항) | 대분류 |
| --- | --- | --- |
| ADsP | 데이터 이해(10) | 데이터의 이해 / 데이터의 가치와 미래 / 데이터 사이언스와 전략 인사이트 |
| ADsP | 데이터분석 기획(10) | 분석 기획의 이해(방향성·방법론·과제 발굴·프로젝트 관리) / 분석 마스터 플랜(마스터 플랜·거버넌스) |
| ADsP | 데이터분석(30) | R 기초와 데이터 마트 / 통계분석 / 정형 데이터 마이닝 |
| ADP | 데이터 이해(10), 데이터분석 기획(10) | ADsP 와 같은 영역 이름 |
| ADP | 데이터 처리 기술 이해(10) | 데이터 처리 프로세스(ETL·CDC·EAI 등) / 데이터 처리 기술(분산 저장·분산 컴퓨팅·클라우드) |
| ADP | 데이터분석(40) | ADsP 영역 + 비정형 데이터 마이닝(텍스트 마이닝·사회연결망 분석) |
| ADP | 데이터 시각화(10) | 시각화 인사이트 프로세스 / 시각화 디자인 / 시각화 구현(D3.js 포함) |
| ADP 실기 | 데이터분석 실무 | 기계학습 영역(전처리·EDA·모델 구축·평가)과 통계 영역(기초 통계·추론·회귀·다변량·시계열) |
| 빅데이터분석기사 | 1 빅데이터 분석 기획 | 빅데이터의 이해 / 데이터분석 계획 / 데이터 수집 및 저장 계획 |
| 빅데이터분석기사 | 2 빅데이터 탐색 | 데이터 전처리 / 데이터 탐색 / 통계기법 이해 |
| 빅데이터분석기사 | 3 빅데이터 모델링 | 분석모형 설계 / 분석기법 적용 |
| 빅데이터분석기사 | 4 빅데이터 결과 해석 | 분석모형 평가 및 개선 / 분석결과 해석 및 활용 |

## 과목별 연결 표

각 줄의 노트는 이 허브의 `data-analytics`·`machine-learning` 카테고리에 있다(일부는 작성 중일 수 있음). 링크 형식은 `/develop-wiki/knowledge/<category>/<id>/`.

| 공식 항목 | 시험 | 볼 노트 |
| --- | --- | --- |
| 데이터와 정보, 데이터베이스의 정의·특징 | ADsP·ADP 데이터 이해 | [DIKW·데이터 유형·DB 기초](/develop-wiki/knowledge/data-analytics/dikw-data-types-database-basics/) |
| 빅데이터의 이해·가치·비즈니스 모델·위기 요인 | ADsP·ADP 데이터 이해, 기사 1과목 | [빅데이터 특징·가치·위기](/develop-wiki/knowledge/data-analytics/big-data-characteristics-value-risks/) |
| 데이터 사이언스와 전략 인사이트 | ADsP·ADP 데이터 이해 | [데이터 사이언스 역량](/develop-wiki/knowledge/data-analytics/data-science-skills-strategic-insight/) |
| 분석 방법론 | 데이터분석 기획, 기사 1과목(분석 절차 및 작업 계획)·3과목(분석 절차 수립) | [KDD·CRISP-DM·SEMMA](/develop-wiki/knowledge/data-analytics/analysis-methodologies-kdd-crisp-dm-semma/) |
| 분석 과제 발굴 | 데이터분석 기획 | [하향식·상향식 과제 발굴](/develop-wiki/knowledge/data-analytics/analysis-topic-discovery-top-down-bottom-up/) |
| 프로젝트 관리, 마스터 플랜, 거버넌스 | 데이터분석 기획 | [분석 프로젝트 관리·마스터 플랜](/develop-wiki/knowledge/data-analytics/analysis-project-management-master-plan-governance/) |
| 데이터 비식별화·품질 검증·개인정보 법·제도 | 기사 1과목 | [데이터 품질·비식별화](/develop-wiki/knowledge/data-analytics/data-quality-privacy-deidentification/) |
| ETL·CDC·EAI | ADP 데이터 처리 기술 | [ETL·ELT·CDC·EAI](/develop-wiki/knowledge/data-analytics/etl-elt-cdc-eai-integration/) |
| 분산 저장·컴퓨팅 | ADP 데이터 처리 기술 | [HDFS·MapReduce](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/) · [하둡 생태계](/develop-wiki/knowledge/data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume/) · [Spark](/develop-wiki/knowledge/data-analytics/spark-rdd-dataframe-vs-mapreduce/) · [NoSQL](/develop-wiki/knowledge/data-analytics/nosql-types-cap-base/) |
| 데이터 웨어하우스·레이크 | ADP 데이터 처리 기술 | [DW·마트·레이크](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/) |
| 클라우드 인프라 | ADP 데이터 처리 기술 | [IaaS·PaaS·SaaS](/develop-wiki/knowledge/data-analytics/cloud-service-models-nist-iaas-paas-saas/) |
| 표본추출·확률분포·기술통계 | 데이터분석, 기사 2과목 | [표본추출·척도](/develop-wiki/knowledge/data-analytics/sampling-methods-measurement-scales/) · [기술통계·분포](/develop-wiki/knowledge/data-analytics/descriptive-statistics-probability-distributions/) |
| 점추정·구간추정·가설검정 | 데이터분석, 기사 2과목 | [추정·가설검정](/develop-wiki/knowledge/data-analytics/estimation-hypothesis-testing-errors-pvalue/) · [t검정·ANOVA](/develop-wiki/knowledge/data-analytics/t-test-anova-f-test/) |
| 결측값·이상값·변수 변환·불균형 | 데이터분석, 기사 2과목 | [결측값](/develop-wiki/knowledge/data-analytics/missing-values-handling-mechanisms/) · [이상값](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/) · [스케일링·인코딩](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/) · [불균형](/develop-wiki/knowledge/data-analytics/imbalanced-data-resampling-smote/) |
| 분류·군집·연관 분석 | 데이터분석, 기사 3과목 | [학습 패러다임](/develop-wiki/knowledge/machine-learning/learning-paradigms-supervised-unsupervised-reinforcement/) 에서 개별 기법 노트로 이동 |
| 평가 지표·교차 검증·과대적합 | 기사 4과목, ADP 실기 | [분류 지표](/develop-wiki/knowledge/machine-learning/classification-metrics-confusion-matrix-roc/) · [교차 검증](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/) · [과대적합](/develop-wiki/knowledge/machine-learning/overfitting-bias-variance-regularization/) |
| 텍스트 마이닝·사회연결망 분석 | ADP 데이터분석 | [텍스트 마이닝](/develop-wiki/knowledge/machine-learning/text-mining-tfidf-tokenization/) · [SNA](/develop-wiki/knowledge/machine-learning/social-network-analysis-centrality/) |
| 시각화 | ADP 데이터 시각화, 기사 4과목 | [시각화 유형·프로세스](/develop-wiki/knowledge/data-analytics/data-visualization-types-process-d3/) |

## 헷갈리는 구분

| 구분 | 내용 |
| --- | --- |
| 민간자격 vs 국가기술자격 | ADsP·ADP 는 공식 페이지에 "공인자격 제2022-05호"로 표기된 민간자격이고, 빅데이터분석기사는 국가기술자격이다. 등급·법적 지위·우대 조건은 이 노트에서 다루지 않는다(미확인). |
| ADsP 응시자격 vs ADP 응시자격 | ADsP 는 제한이 없고, ADP 는 학력·경력 기준을 충족하거나 ADsP 취득자여야 한다. |
| 필기 과락 기준 | ADsP·ADP 는 "과목별 40% 미만", 빅데이터분석기사는 공식 문구상 "과목별 40점 미만"과 "전 과목 평균 60점 미만"을 함께 둔다. |
| 실기 합격선 | ADP 실기 75점 이상, 빅데이터분석기사 실기 60점 이상. |

## 언제 쓰나 / 주의

- 어떤 시험을 볼지 정하기 전에 범위 차이를 훑거나, 공부할 주제가 어느 시험 범위에 있는지 찾을 때 쓴다.
- 과목 이름이 같아도(예: "데이터 이해") 시험마다 문항 수와 세부 항목은 다르다. 표의 연결 노트는 개념 설명이지 문제 풀이 자료가 아니다.
- 합격률, 난이도, 학습 기간, 교재 비교는 근거가 없어 싣지 않았다.
- 출제기준은 개정된다. 날짜가 붙은 값(적용기간, 시행 횟수, 합격 기준)은 응시 직전에 공식 페이지로 재확인한다.

## 검증 범위

- 세 공식 페이지(a_06 ADsP, a_05 ADP, a_07 빅데이터분석기사)를 2026-11-23 에 읽었다. a_05·a_06 은 개요 표(구분·문항·시간·합격기준·응시자격)를 확인했고, 과목별 세부 항목은 브라우저로 직접 읽어 정리해 둔 출제범위 메모(공식 페이지 항목 이름만 옮긴 것)를 따랐다. a_07 은 개요·적용기간·합격기준을 확인했다.
- 연 2회 시행 등 시행 횟수는 페이지 표기를 옮겼다. 접수 일정·응시료는 읽지 않았다.
- 빅데이터분석기사 "과목별 40점" 해석, ADP·ADsP 민간자격의 법적 지위 설명은 미확인. 2027년 이후 빅데이터분석기사 출제기준은 미확인.
