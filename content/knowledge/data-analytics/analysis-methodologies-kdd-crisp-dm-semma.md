---
title: 분석 방법론 비교 — KDD·CRISP-DM·SEMMA
aka: [KDD process, Knowledge Discovery in Databases, CRISP-DM, SEMMA, 데이터 마이닝 프로세스, 분석 방법론, 계층적 프로세스 모델]
category: data-analytics
group: planning
level: intermediate
summary: Fayyad 등의 KDD(1996), CRISP-DM 1.0(2000), SAS 의 SEMMA 를 단계·태스크·산출물 기준으로 비교하고, 한국 수험 교재의 계층적 프로세스 모델 용어가 어디까지 확인되는지 구분한다.
tags: [kdd, crisp-dm, semma, methodology, data-mining, process-model, adsp, adp]
related: [data-analytics/exam-map-adsp-adp-bigdata-analyst, data-analytics/analysis-topic-discovery-top-down-bottom-up, data-analytics/analysis-project-management-master-plan-governance, data-analytics/data-science-skills-strategic-insight, data-analytics/eda-exploratory-data-analysis-visual, machine-learning/data-split-cross-validation-leakage, machine-learning/model-deployment-monitoring-drift]
sources:
  - https://www.kdnuggets.com/gpspubs/aimag-kdd-overview-1996-Fayyad.pdf
  - https://www.kde.cs.uni-kassel.de/wp-content/uploads/lehre/ws2012-13/kdd/files/CRISPWP-0800.pdf
  - https://support.sas.com/documentation/cdl/en/emgsj/62040/HTML/default/a003307717.htm
updatedAt: 2026-11-23
---

## 개요

- 분석 프로젝트를 "데이터를 모아 모델을 만든다"에서 끝내지 않고 단계로 나눠 반복하게 하는 세 가지 대표 틀이다.
- KDD 는 학계가 데이터베이스에서 지식을 찾는 과정을 정의한 틀, CRISP-DM 은 업계 컨소시엄이 만든 프로젝트 수행 가이드, SEMMA 는 SAS 가 Enterprise Miner 의 작업 흐름을 정리한 틀이다. 성격이 달라 단계 수만 비교하면 오해가 생긴다.
- 셋 다 순차 절차가 아니라 반복·되돌아감을 전제한다. 이 노트의 대응표는 필자 정리이며 출처가 1:1 대응을 말하지 않는다.

## 시험 범위 대응

- ADsP·ADP 데이터분석 기획: "데이터분석 기획의 이해 — 분석 방법론".
- 빅데이터분석기사 3과목: "분석모형 설계 — 분석 절차 수립: 분석모형 선정·정의·구축 절차".

## 핵심 용어

| 용어 | 영어 | 정의 |
| --- | --- | --- |
| KDD | Knowledge Discovery in Databases | 데이터에서 유효하고 새로우며 잠재적으로 유용하고 궁극적으로 이해 가능한 패턴을 찾는 비자명한 과정(Fayyad 등) |
| 데이터 마이닝 | data mining | KDD 과정 중 패턴을 탐색하는 한 단계. 전체 과정이 아니다(Fayyad 등) |
| CRISP-DM | CRoss-Industry Standard Process for Data Mining | 데이터 마이닝 프로젝트용 6단계 참조 모델(1.0, 2000) |
| SEMMA | Sample, Explore, Modify, Model, Assess | SAS Enterprise Miner 문서가 작업 노드를 정리하는 5단계 구성 |

## KDD (Fayyad·Piatetsky-Shapiro·Smyth, 1996)

- *AI Magazine* 17(3) 개요 글은 KDD 를 상호작용적·반복적 과정으로 설명하며 기본 단계를 **아홉 가지**로 서술한다: 응용 영역 이해와 목표 설정, 대상 데이터 집합 구성, 정제·전처리, 축소·투영, 목표와 마이닝 방법 대응, 탐색 분석과 모형·가설 선택, 데이터 마이닝, 패턴 해석, 발견한 지식의 활용.
- 같은 글의 그림 1 은 **다섯 단계** 도식이다: 선택(Selection) → 전처리(Preprocessing) → 변환(Transformation) → 데이터 마이닝 → 해석·평가(Interpretation/Evaluation). 데이터 → 대상 데이터 → 전처리 데이터 → 변환 데이터 → 패턴 → 지식 순으로 산출물이 바뀐다.
- 한국 교재의 "KDD 5단계(선택·전처리·변환·마이닝·해석/평가)"는 이 그림에 해당한다. 같은 글이 아홉 단계 서술도 함께 싣는다는 점을 알아 둔다.
- 글은 데이터 마이닝 단계에 연구가 집중돼 왔지만 나머지 단계가 실무 성공에 더 중요할 수 있다고 쓴다.

## CRISP-DM 1.0 (Chapman 외, 2000)

| 단계 | 포함 generic task(목차 기준) |
| --- | --- |
| 1 Business Understanding | 비즈니스 목표 결정, 상황 평가, 데이터 마이닝 목표 결정, 프로젝트 계획 수립 |
| 2 Data Understanding | 초기 데이터 수집, 데이터 기술(describe), 데이터 탐색, 데이터 품질 검증 |
| 3 Data Preparation | 데이터 선택, 정제, 구성(파생), 통합, 형식화 |
| 4 Modeling | 모델링 기법 선택, 테스트 설계 생성, 모델 구축, 모델 평가 |
| 5 Evaluation | 결과 평가, 프로세스 검토, 다음 단계 결정 |
| 6 Deployment | 배포 계획, 모니터링·유지보수 계획, 최종 보고서 작성, 프로젝트 검토 |

- 각 태스크마다 산출물(outputs)이 정의돼 있다. 예: 초기 데이터 수집 보고서, 데이터 기술 보고서, 프로젝트 계획.
- 문서는 이 방법론을 **네 수준의 계층 모델**로 설명한다: 단계(phase) → 일반 태스크(generic task) → 특수화 태스크(specialized task) → 프로세스 인스턴스(process instance). 일반 태스크는 모든 상황을 포괄하도록 만든 것이고, 특수화 태스크는 상황별 수행 방법(예: 수치형 vs 범주형 정제)이다.
- 문서는 단계·태스크의 순서를 "이상화된 순서"라고 하며, 실제로는 순서가 바뀌거나 되돌아가는 일이 흔하다고 쓴다.

### 계층적 프로세스 모델 용어

- 수험 교재는 "계층적 프로세스 모델: 단계(Phase) → 태스크(Task) → 스텝(Step)"을 분석 방법론의 구성으로 가르친다. CRISP-DM 의 계층은 위 4수준이며 "스텝"이라는 층은 없다. 교재의 3층 구조의 공개 1차 출처는 미확인이다.
- 용어 충돌: CRISP-DM 의 "generic task"를 교재의 "태스크"와 같다고 단정하지 않는다.

## SEMMA (SAS)

SAS Enterprise Miner 문서는 도구의 노드를 SEMMA 순서로 묶어 설명한다. 문서의 노드 설명에서 읽은 내용이다.

| 단계 | 문서의 노드 설명(요약) |
| --- | --- |
| Sample | 입력 데이터 식별·병합·분할·표본 추출 |
| Explore | 통계·그래프로 데이터 검토, 변수 선별 |
| Modify | 결측 대체, 변수 변환, 구간화, 차원 축소 등 분석용 데이터 준비 |
| Model | 목표 변수에 대한 예측·설명 모형 적합(트리, 회귀, 신경망 등) |
| Assess | 경쟁 모형 비교, 컷오프 선택, 점수 코드 생성 |

- SEMMA 는 비즈니스 문제 정의와 배포 단계를 따로 두지 않는다. 도구 작업 흐름 중심 구성이기 때문이라는 것은 단계 구성에서 읽은 필자 해석이다.
- 문서가 SEMMA 자체를 길게 설명하지는 않는다. 개별 단계의 공식 정의 문장은 확인하지 못했다.

## 비교

| 기준 | KDD | CRISP-DM | SEMMA |
| --- | --- | --- | --- |
| 발표 | 1996 | 1.0 (2000) | SAS 문서(도구 버전별) |
| 성격 | 학술 프로세스 정의 | 프로젝트 수행 참조 모델 | 도구 작업 흐름 구성 |
| 시작 | 응용 영역 이해(9단계 서술) / 선택(5단계 도식) | 비즈니스 이해 | 표본 추출 |
| 끝 | 지식 활용(9단계) / 해석·평가(5단계) | 배포·모니터링·보고 | 평가 |
| 비즈니스 이해 | 9단계 서술의 1단계에 포함 | 별도 1단계 | 별도 단계 없음 |
| 배포·운영 | 9단계 서술의 9단계에 "활용" | 별도 6단계 | 별도 단계 없음 |

단계 대응(필자 정리):

| KDD 5단계 | CRISP-DM | SEMMA |
| --- | --- | --- |
| 선택 | 데이터 이해 | Sample |
| 전처리 | 데이터 준비 | Explore·Modify |
| 변환 | 데이터 준비 | Modify |
| 데이터 마이닝 | 모델링 | Model |
| 해석·평가 | 평가(+배포) | Assess |

## 언제 쓰나 / 주의

- 프로젝트 체크리스트·산출물 목록이 필요하면 CRISP-DM, 도구 작업 흐름을 설명하려면 SEMMA, 용어 정의·학술 배경은 KDD 를 본다.
- 어느 틀이든 데이터가 문제 정의를 바꾸면 앞 단계로 돌아가야 한다. 폭포수식 일정으로 묶으면 반복 비용이 숨는다.
- CRISP-DM 1.0 은 2000년 문서다. 모델 운영(모니터링 등)은 6단계의 "모니터링·유지보수 계획" 수준만 있다. → [모델 배포·모니터링](/develop-wiki/knowledge/machine-learning/model-deployment-monitoring-drift/)
- 교재가 제시하는 다른 방법론 구성(예: 단계·태스크·스텝 3층)과 단계 이름이 다르면 출처를 확인한다.

## 검증 범위

- 읽은 것: Fayyad 등 *AI Magazine* 글(KDD 과정 절, 그림 1), CRISP-DM 1.0 문서(목차의 단계·태스크, 계층 breakdown 절, 순서에 관한 서술), SAS Enterprise Miner 5.3 Getting Started HTML 페이지(SEMMA 노드 구성).
- 못 읽은 것: CRISP-DM 의 산출물 상세 절 전체(일부만 확인), SEMMA 의 별도 공식 정의 문서, KDD 원 논문 *Advances in Knowledge Discovery and Data Mining*(1996) 장.
- 미확인: 교재의 "단계-태스크-스텝" 계층 모델의 공개 1차 출처.
- 직접 계산·실행: 없음.
