---
title: 분석 과제 발굴 — 하향식과 상향식, 디자인 씽킹
aka: [Analytics topic discovery, top-down approach, bottom-up approach, 하향식 접근, 상향식 접근, Design Thinking, 분석 과제 도출]
category: data-analytics
group: planning
level: beginner
summary: 분석 과제를 문제에서 출발해 찾는 하향식과 데이터에서 출발해 찾는 상향식을 나누고, 상향식에 연결되는 디자인 씽킹을 Stanford d.school·IDEO 자료로 확인하되 한국 수험 교재 틀과 공개 근거를 구분한다.
tags: [analytics-planning, top-down, bottom-up, design-thinking, problem-definition, adsp, adp]
related: [data-analytics/exam-map-adsp-adp-bigdata-analyst, data-analytics/analysis-methodologies-kdd-crisp-dm-semma, data-analytics/analysis-project-management-master-plan-governance, data-analytics/eda-exploratory-data-analysis-visual, machine-learning/learning-paradigms-supervised-unsupervised-reinforcement, machine-learning/clustering-kmeans-hierarchical-dbscan]
sources:
  - https://dschool.stanford.edu/resources/design-thinking-bootleg
  - https://www.ideou.com/pages/design-thinking
  - https://www.dataq.or.kr/www/sub/a_06.do
updatedAt: 2026-11-23
---

## 개요

- 분석 과제를 찾는 방식은 크게 둘로 설명된다. **하향식**은 해결할 문제를 먼저 정하고 필요한 분석을 찾아가고, **상향식**은 가진 데이터를 살펴 의미 있는 패턴에서 문제를 찾는다.
- 두 방식은 배타적이지 않다. 문제 정의가 흐릿하면 데이터 탐색으로 단서를 얻고, 탐색에서 나온 패턴은 다시 비즈니스 질문으로 검증한다.
- 이 분류와 단계 이름은 한국 수험 교재에서 널리 쓰이는 틀이다. 단계 이름 자체의 공개 1차 출처(저자·문서)는 찾지 못했다. 공개 근거로 확인한 것은 디자인 씽킹의 단계 구성과 시험 범위의 항목 이름뿐이다.

## 시험 범위 대응

- ADsP·ADP 데이터분석 기획: "데이터분석 기획의 이해 — 분석 과제 발굴". 빅데이터분석기사 1과목: "분석 로드맵 설정·분석 문제 정의".

## 핵심 용어

| 용어 | 영어 | 뜻 |
| --- | --- | --- |
| 하향식 접근 | top-down | 문제 탐색 → 문제 정의 → 해결 방안 탐색 → 타당성 검토 순으로 과제를 확정(교재 틀) |
| 상향식 접근 | bottom-up | 데이터에서 패턴을 찾고 그 의미로 과제를 도출(교재 틀) |
| 디자인 씽킹 | design thinking | 사용자 이해에서 출발해 프로토타입과 검증을 반복하는 문제 해결 방식. Stanford d.school 은 5개 모드로 설명 |
| 비지도 학습 | unsupervised learning | 정답 레이블 없이 데이터 구조를 찾는 학습. 군집·연관 규칙 → [학습 패러다임](/develop-wiki/knowledge/machine-learning/learning-paradigms-supervised-unsupervised-reinforcement/) |

## 하향식 접근 (교재 틀, 설명은 필자 정리)

| 단계 | 하는 일 |
| --- | --- |
| 문제 탐색 | 비즈니스 모델·외부 환경·내부 역량 등을 훑어 해결 후보 영역을 모은다 |
| 문제 정의 | 후보를 "어떤 데이터로 무엇을 예측·설명할지" 형태의 분석 문제로 바꾼다 |
| 해결 방안 탐색 | 데이터·기법·도구 후보를 놓고 어떻게 풀지 정한다 |
| 타당성 검토 | 경제적(효과 대비 비용), 데이터·기술적(확보 가능성, 품질, 구현 난도) 관점으로 실행 여부를 판단한다 |

- 타당성 검토를 경제·데이터·기술 관점으로 나누는 설명은 교재에서 흔하지만, 위 표의 세부 항목은 필자가 일반적 프로젝트 타당성 검토에 맞춰 쓴 것이다.
- 하향식의 위험: 정의한 문제에 필요한 데이터가 실제로 없을 수 있다. 타당성 검토에서 데이터 확보 가능성을 먼저 본다.

## 상향식 접근

- 데이터에서 출발한다. 탐색적 분석, 군집 분석, 연관 규칙 같은 비지도 기법으로 "이 데이터에 어떤 구조가 있는가"를 묻고, 발견한 패턴에서 비즈니스 의미를 해석해 과제를 제안한다.
- 교재는 이 방식을 "문제 정의가 어려운 영역"에 맞는 접근으로 설명하며, 시행착오를 반복하는 **프로토타이핑** 방식과 엮는 경우가 많다. 이 연결의 공개 1차 출처는 미확인이다.
- 상향식의 위험: 패턴이 우연이거나 사업과 무관할 수 있다. 발견 후에 비즈니스 질문으로 검증하는 단계가 필요하다. 군집 결과의 타당성은 [군집 분석](/develop-wiki/knowledge/machine-learning/clustering-kmeans-hierarchical-dbscan/) 노트를 본다.

## 디자인 씽킹 (공개 출처 기준)

- Stanford d.school 의 Bootleg(2018)는 다섯 모드로 구성한다: Empathize(공감) → Define(정의) → Ideate(아이디어 발산) → Prototype(시제품) → Test(검증). 각 모드를 이름으로 제시하며, 정의 문장은 페이지에서 확인하지 못했다.
- IDEO U 는 디자인 씽킹을 사람 중심 문제 해결로 설명하며, 사용자 요구 이해, 빠른 프로토타입, 피드백으로 개선하는 반복 과정이라고 쓴다. 바람직함(desirability)·실현 가능성(feasibility)·사업성(viability)과 책임(responsibility)을 함께 본다. 페이지는 단계 수를 "여섯"이라고 쓰면서 목록은 일곱 개를 제시해 단계 수 표기가 일관되지 않는다.
- 교재가 상향식과 디자인 씽킹을 묶는 방식(사용자 관점으로 데이터를 다시 보며 발산·수렴)은 위 공개 자료가 직접 말하지 않는다. 디자인 씽킹은 데이터 분석 전용 방법이 아니다.

## 분석 대상 × 분석 방법 사분면 (교재 틀)

- 교재는 "분석 대상이 무엇인지 알고 있는가"와 "분석 방법을 알고 있는가"를 두 축으로 4개 영역을 나눠 과제 유형을 구분한다.
- 사분면 이름과 각 영역의 접근 방식은 교재마다 쓰이는 틀이며 공개 1차 출처는 미확인이라 이 노트는 이름을 적지 않는다.

## 헷갈리는 구분

| 쌍 | 차이 |
| --- | --- |
| 하향식 vs 상향식 | 출발점이 문제인가 데이터인가. 지도 학습/비지도 학습과 같은 말이 아니다 |
| 문제 탐색 vs 문제 정의 | 탐색은 후보를 넓히는 일, 정의는 분석 가능한 형태로 좁히는 일(교재 틀) |
| 타당성 검토 vs 분석 모델 검증 | 전자는 실행 전 경제·기술·데이터 판단, 후자는 구축한 모델의 성능 평가 |

## 언제 쓰나 / 주의

- 조직에 해결할 문제가 이미 명확하면 하향식, 데이터는 쌓였는데 질문이 없으면 상향식 탐색으로 시작한다.
- 어느 쪽이든 최종 과제는 비즈니스 효과와 실행 가능성으로 걸러야 한다 → [마스터 플랜·우선순위](/develop-wiki/knowledge/data-analytics/analysis-project-management-master-plan-governance/)
- 이 틀은 수험용 분류이므로 실무에서 그대로 이름을 맞출 필요는 없다.

## 검증 범위

- 읽은 것: Stanford d.school Bootleg 페이지(모드 이름, 2018 표기), IDEO U 디자인 씽킹 페이지, dataq.or.kr ADsP 페이지의 개요(출제범위 항목 이름은 별도 정리 메모).
- 미확인: 하향식 4단계·상향식·4사분면 틀의 공개 1차 출처, 프로토타이핑 접근법의 출처, Stanford 의 각 모드 정의 문장.
- 직접 계산·실행: 없음.
