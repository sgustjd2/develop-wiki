---
title: 학습 방식 구분 — 지도·비지도·준지도·자기지도·강화·전이·온라인·능동·연합
aka: [Learning Paradigms, Supervised, Unsupervised, Semi-supervised, Self-supervised, Reinforcement, Transfer, Online, Active, Federated, Instance-based vs Model-based]
category: machine-learning
group: paradigm
level: beginner
summary: 머신러닝을 "레이블이 있는가, 환경과 상호작용하는가, 데이터가 어떻게 오는가"로 나눈 학습 방식 정의표다. 분류 vs 회귀, 인스턴스 기반 vs 모델 기반 학습까지 한 번에 구분한다.
tags: [supervised, unsupervised, semi-supervised, self-supervised, reinforcement, transfer-learning, online-learning, active-learning, federated-learning]
related: [machine-learning/data-split-cross-validation-leakage, machine-learning/knn-distance-based-classification, machine-learning/clustering-kmeans-hierarchical-dbscan, machine-learning/deep-learning-architectures-cnn-rnn-transformer-terms, machine-learning/gradient-descent-loss-optimizers, machine-learning/model-deployment-monitoring-drift, data-analytics/analysis-methodologies-kdd-crisp-dm-semma]
sources:
  - https://d2l.ai/chapter_introduction/index.html
  - https://scikit-learn.org/stable/modules/semi_supervised.html
  - https://scikit-learn.org/stable/modules/neighbors.html
  - https://scikit-learn.org/stable/computing/scaling_strategies.html
  - https://arxiv.org/abs/1602.05629
  - https://en.wikipedia.org/wiki/Reinforcement_learning
  - https://en.wikipedia.org/wiki/Active_learning_(machine_learning)
  - https://en.wikipedia.org/wiki/Transfer_learning
updatedAt: 2026-11-23
---

## 개요

- "학습 방식"은 알고리즘 이름이 아니라 **문제 설정**의 분류다. 같은 신경망도 지도·자기지도·강화 어느 설정으로든 학습할 수 있다.
- 구분 질문은 네 가지다. (1) 정답(레이블)이 있나? (2) 모델이 행동해서 데이터에 영향을 주나? (3) 데이터가 한꺼번에 오나, 흘러오나? (4) 이미 배운 것을 다른 문제로 가져오나?
- 이름이 비슷해도 서로 다른 축이다. 예: 준지도는 *레이블 양*, 온라인은 *데이터 도착 방식*, 전이는 *지식 재사용*, 연합은 *데이터 위치*의 이야기다.

## 시험 범위 대응

- 공식 출제범위에 "학습 방식" 단독 항목은 없다. 관련: 빅데이터분석기사 3과목 "분석모형 설계 > 분석 절차 수립·분석모형 선정", ADsP "정형 데이터 마이닝 > 데이터 마이닝 개요, 분류분석, 군집분석", ADP 실기 "기계학습 영역(회귀·분류·군집화)", 빅데이터분석기사 "빅데이터와 인공지능"·"딥러닝 분석".
- 수험 교재는 보통 지도·비지도·강화 3분류를 쓴다. 준지도·자기지도·전이 등은 교재에 따라 포함 여부가 다르다(이 노트는 교재 내용을 확인하지 않음).

## 핵심 용어 (정의표)

| 학습 방식 | 영어 | 한 줄 정의 | 데이터 | 예 |
| --- | --- | --- | --- | --- |
| 지도학습 | supervised | 입력과 정답 쌍으로 입력 → 정답 대응을 학습 | 전부 레이블 있음 | 스팸 분류, 집값 예측 |
| 비지도학습 | unsupervised | 레이블 없이 데이터의 구조를 찾는다 | 레이블 없음 | 군집화, 차원 축소, 밀도 추정 |
| 준지도학습 | semi-supervised | 레이블 있는 소량 + 없는 다량을 함께 쓴다 | 일부만 레이블 | 자기 훈련, 레이블 전파 |
| 자기지도학습 | self-supervised | 레이블 없는 데이터에서 스스로 만든 과제(가려진 단어 맞히기 등)로 표현을 학습 | 레이블 없음(과제용 정답은 데이터에서 생성) | 마스크 언어 모델 사전학습 |
| 강화학습 | reinforcement | 에이전트가 환경에서 행동하고 보상을 받아 누적 보상을 높이는 정책을 학습 | 상호작용 중 생성 | 게임, 로봇 제어 |
| 전이학습 | transfer | 한 도메인·과제에서 얻은 지식으로 다른 과제의 학습을 돕는다 | 원천 + 목표 | 사전학습 모델 미세조정 |
| 온라인학습 | online | 데이터가 순차로 도착하고, 도착할 때마다 모델을 갱신 | 스트림 | 점진 학습(`partial_fit`) |
| 능동학습 | active | 모델이 어떤 표본에 레이블을 붙일지 골라 사람·오라클에 묻는다 | 레이블 비용이 큰 풀 | 불확실한 표본 우선 라벨링 |
| 연합학습 | federated | 데이터를 기기에 둔 채 로컬에서 계산한 갱신만 모아 공유 모델을 만든다 | 분산·비공개 | 모바일 키보드 모델 |

근거와 주의: 지도·비지도·자기지도·강화의 서술은 *Dive into Deep Learning* 1장의 설명을 따랐다. 준지도의 "레이블 없는 표본은 `-1`" 표기와 자기 훈련·레이블 전파 클래스는 sklearn 문서에서 확인했다. 연합학습 정의는 McMahan 등(AISTATS 2017)의 초록(데이터는 기기에 두고 로컬 갱신을 모아 공유 모델을 만든다)에서 가져왔다. 전이·능동·온라인·강화는 아래 각 절에 출처의 한계를 적었다.

## 지도학습: 분류 vs 회귀

| 구분 | 출력(레이블) | 질문 | 예 |
| --- | --- | --- | --- |
| 분류 | 범주(이진·다중) | "어느 쪽인가" | 정상/이상, 품종 |
| 회귀 | 연속 수치 | "얼마나" | 가격, 체류 시간 |

- d2l 은 "얼마나? 몇 개?" 형태의 질문을 대체로 회귀로 본다. 분류 모델이 클래스 확률을 내는 것은 흔하며, 이때 교차 엔트로피가 일반적인 손실이다([손실·최적화](/develop-wiki/knowledge/machine-learning/gradient-descent-loss-optimizers/)).
- "회귀"라는 이름이 붙은 로지스틱 회귀는 분류 모델이다. 이름이 아니라 *출력이 범주인가*로 구분한다.
- 오차 비용이 클래스마다 다르면 확률이 가장 큰 클래스가 최선이 아닐 수 있다(d2l).

## 레이블이라는 말의 폭

| 용어 | 뜻 | 비고 |
| --- | --- | --- |
| 레이블/라벨 | 지도학습의 정답 | 분류에서는 클래스, 회귀에서는 수치 |
| 타깃 / 종속변수 / 반응변수 | 예측 대상 | 통계 교재는 종속변수, ML 은 타깃·레이블 |
| 특성 / 독립변수 / 설명변수 | 입력 | feature, predictor |
| 자기지도의 "레이블" | 데이터에서 자동 생성한 학습 신호 | 사람이 붙인 레이블이 아님 |
| 준지도의 미레이블 | sklearn 에서 `y = -1` | 문자열 레이블이면 dtype `object` |

## 인스턴스 기반 vs 모델 기반

- **모델 기반**: 학습 데이터에서 매개변수(가중치·분할 규칙)를 맞춰 일반화된 함수를 만든 뒤, 예측 때는 그 함수만 쓴다. 선형 모델·트리·신경망.
- **인스턴스 기반**: sklearn 문서의 표현으로 "일반화 모델을 만들지 않고" 학습 표본을 저장해 두었다가 예측 때 가까운 표본의 레이블로 답한다. 최근접 이웃이 대표적이며 문서가 instance-based learning 이라 부른다([KNN](/develop-wiki/knowledge/machine-learning/knn-distance-based-classification/)).
- 차이는 **일반화 방식**이지 지도/비지도 구분과 무관하다. 인스턴스 기반은 학습은 빠르지만 예측 때 표본을 탐색해야 하고 저장 비용이 든다(필자 정리).

## 각 방식의 구분점과 주의

### 준지도 vs 자기지도 vs 비지도
- 준지도는 **레이블이 일부 있다**. 비지도는 없다. 자기지도는 레이블이 없지만 *스스로 정답을 만들어* 지도학습처럼 푼다.
- 준지도는 데이터 분포에 대한 가정이 맞아야 이득이 있다(sklearn 문서의 경고). 자기 훈련은 확률 보정(calibration)에 민감하다.

### 강화학습
- d2l: 에이전트가 관측 → 행동 → 보상을 반복. 정책은 관측을 행동으로 보내는 함수. 난점은 **공로 할당**(어느 행동이 보상을 냈나), 부분 관측, **탐험 대 활용**.
- 지도학습과 달리 "옳은 행동"이 주어지지 않고 보상만 온다. 보상이 지연될 수 있다.
- 교재 원문(Sutton & Barto) 본문은 PDF 를 읽지 못했다. 위 정의는 d2l 과 Wikipedia 가 일치하는 부분만 적었다.

### 전이학습
- 대개 큰 데이터로 사전학습한 모델의 지식을 작은 목표 과제에 가져온다. d2l 은 자기지도로 배운 표현을 하위 과제에 맞게 미세조정하는 흐름을 소개한다.
- 형식적 정의(도메인=특성공간+주변분포, 과제=레이블공간+예측함수)는 Pan & Yang 서베이(IEEE TKDE 22(10), 2010)를 따른다고 Wikipedia 가 소개한다. 서베이 원문은 읽지 못했다.
- 전이 vs 미세조정: 미세조정(fine-tuning)은 전이를 구현하는 한 방법으로 쓰이는 용어다(필자 정리, 문서마다 범위가 다를 수 있음).

### 온라인학습
- sklearn 문서는 소량의 미니배치씩 `partial_fit` 으로 학습하는 방식을 out-of-core 맥락에서 "online learning"이라 부른다. 첫 호출에 전체 클래스 목록을 줘야 하고, 모든 모델이 지원하는 것은 아니다.
- 용어 충돌: 서비스 운영에서의 "온라인"(실시간 운영 환경)과 학습 알고리즘의 "온라인"(순차 갱신)은 다른 말이다. 분포 변화는 [배포·모니터링](/develop-wiki/knowledge/machine-learning/model-deployment-monitoring-drift/)에서 본다.

### 능동학습
- 레이블이 비쌀 때 모델이 정보가 큰 표본을 골라 묻는다. 대표 전략: 불확실성 표집, 위원회 질의 등(Wikipedia 가 Settles 2009 서베이 분류로 소개). Settles 서베이 PDF 는 읽지 못했다.

### 연합학습
- 데이터 이동 대신 모델 갱신을 이동. 논문은 모델 평균화로 동기식 SGD 보다 통신 라운드를 10~100 배 줄였다고 보고한다(초록). 프라이버시가 **자동으로 보장되는 것은 아니다**(이 노트는 이 점을 출처로 확인하지 않았고 별도 보안 기법이 필요하다는 일반 지식).

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 준지도 vs 능동 | 준지도: 주어진 미레이블을 활용. 능동: 어느 것에 레이블을 붙일지 *고른다* |
| 온라인 vs 연합 | 온라인: 데이터 도착 순서 문제. 연합: 데이터 위치(분산) 문제 |
| 전이 vs 멀티태스크 | 전이는 한 과제의 지식을 다른 과제로 옮김(이 노트에서 멀티태스크는 다루지 않음, 미확인) |
| 군집화 vs 분류 | 군집화는 레이블 없이 묶음, 분류는 레이블 있는 정답을 예측 |
| 강화 vs 지도 | 강화: 보상(지연·희소), 지도: 즉시 정답 |

## 언제 쓰나 / 주의

- 선택 흐름(필자 정리): 레이블 충분 → 지도 / 레이블 거의 없음, 구조 탐색 → 비지도 / 레이블 일부 + 미레이블 다량 → 준지도·자기지도+전이 / 행동·보상이 있는 순차 의사결정 → 강화.
- 레이블 품질이 성능 상한이다. 준지도·자기지도라도 평가용 레이블은 필요하다.
- 비지도 결과(군집)는 정답이 없어 평가가 어렵다 → [군집 분석](/develop-wiki/knowledge/machine-learning/clustering-kmeans-hierarchical-dbscan/).
- 분석 프로젝트 전체 절차는 [KDD·CRISP-DM·SEMMA](/develop-wiki/knowledge/data-analytics/analysis-methodologies-kdd-crisp-dm-semma/).

## 검증 범위

- 읽음: d2l 1장 소개(100,000자 중 앞부분), sklearn 준지도·이웃·확장 전략 문서, McMahan 등 arXiv 초록, Wikipedia 의 강화·능동·전이·온라인학습 항목(보조).
- 읽지 못함: Sutton & Barto *Reinforcement Learning* 본문(PDF 추출 불가), Settles 능동학습 서베이 본문, Pan & Yang 서베이 본문, 자기지도학습의 원 문헌. 이 방식들의 정의는 d2l·Wikipedia 수준이다.
- 직접 계산·실행 없음(개념 노트).
