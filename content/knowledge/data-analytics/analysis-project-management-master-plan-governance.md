---
title: 분석 프로젝트 관리·마스터 플랜·거버넌스·성숙도 모델
aka: [PMBOK knowledge areas, 분석 프로젝트 관리, 분석 마스터 플랜, 분석 거버넌스, CMMI, 분석 성숙도, 우선순위 평가]
category: data-analytics
group: planning
level: intermediate
summary: PMBOK 6판의 10개 지식 영역과 7·8판의 구조 변화, CMMI 성숙도 단계를 공개 자료로 확인하고, 한국 수험 교재의 분석 마스터 플랜·거버넌스·분석 성숙도 틀은 공개 근거 여부를 구분해 정리한다.
tags: [project-management, pmbok, cmmi, maturity-model, master-plan, governance, adsp, adp]
related: [data-analytics/exam-map-adsp-adp-bigdata-analyst, data-analytics/analysis-methodologies-kdd-crisp-dm-semma, data-analytics/analysis-topic-discovery-top-down-bottom-up, data-analytics/data-quality-privacy-deidentification, data-analytics/data-science-skills-strategic-insight]
sources:
  - https://www.pmi.org/-/media/pmi/documents/public/pdf/pmbok-standards/pmbok-guide-public-faqs-1-july-2021.pdf
  - https://www.pmi.org/-/media/pmi/documents/public/pdf/pmbok-standards/pmi-project-performance-domains.pdf
  - https://www.pmi.org/standards/pmbok
  - https://en.wikipedia.org/wiki/Project_Management_Body_of_Knowledge
  - https://cmmiinstitute.com/learning/appraisals/levels
updatedAt: 2026-11-23
---

## 개요

- 분석 프로젝트도 일반 프로젝트처럼 범위·일정·원가·품질·위험을 관리한다. 교재의 "분석 프로젝트 관리 방안"은 PMBOK 의 지식 영역을 분석 프로젝트 특성에 맞춰 설명한다.
- **PMBOK 은 판마다 구조가 다르다.** 10개 지식 영역은 6판까지의 구조이고, 7판(2021)은 이를 원칙·성과 영역 구조로 바꿨으며 8판(2025)에서 다시 바뀌었다. 시험 교재가 어느 판을 기준으로 하는지 먼저 확인한다.
- 마스터 플랜·분석 거버넌스·분석 성숙도는 한국 수험 교재의 틀이다. 아래에서 공개 자료로 확인되는 일반 개념(PMBOK, CMMI)과 분리해 적는다.

## 시험 범위 대응

- ADsP·ADP 데이터분석 기획: "분석 프로젝트 관리 방안", "분석 마스터 플랜(마스터 플랜 수립, 분석 거버넌스 체계 수립)".
- 빅데이터분석기사 1과목: "데이터분석 계획 — 분석 로드맵 설정, 분석 작업 계획".

## 핵심 용어

| 용어 | 영어 | 정의 |
| --- | --- | --- |
| 지식 영역 | knowledge area | PMBOK 6판까지의 관리 영역 분류. 7판은 지식 영역 개념이 성과 영역들에 걸쳐 나타난다고 설명(PMI FAQ) |
| 성과 영역 | project performance domain | 프로젝트 성과 전달에 핵심인 관련 활동 묶음(PMI) |
| 성숙도 수준 | maturity level | CMMI 에서 조직 전체의 프로세스 개선 수준 |
| 역량 수준 | capability level | CMMI 에서 개별 실천 영역(practice area)의 수준 |
| 분석 마스터 플랜 | analytics master plan | 분석 과제를 우선순위로 정리해 중장기 로드맵으로 만든 계획(교재 용어, 공개 출처 미확인) |

## PMBOK — 판별 구조

| 판 | 구조 | 확인 근거 |
| --- | --- | --- |
| 6판(2017) | 5개 프로세스 그룹 + **10개 지식 영역** | 아래 목록은 Wikipedia 기준(보조 확인) |
| 7판(2021) | 12개 원칙 + 8개 프로젝트 성과 영역. 프로세스 그룹은 모델 중 하나로 남음 | PMI FAQ(원칙 12개, 성과 영역·프로세스 그룹 설명), 성과 영역 PDF(8개 영역 그림) |
| 8판(2025-11) | 6개 핵심 원칙 + 7개 성과 영역 | PMI 상품 페이지 내용을 검색 결과 요약으로 확인(페이지 직접 열람 못 함) |

- 6판 10개 지식 영역(Wikipedia 목록): 통합, 범위, 일정, 원가, 품질, 자원, 의사소통, 위험, 조달, 이해관계자. 영역 이름 표기(예: 이해관계자 "관리"/"참여")는 문헌마다 다르다. 같은 문서는 6판 이전에는 일정 영역이 "시간", 자원 영역이 "인적 자원" 이름이었다고 쓴다.
- 7판의 성과 영역 8개(PMI PDF 도식): 이해관계자, 팀, 개발 방식과 생애 주기, 기획, 프로젝트 작업, 전달, 측정, 불확실성.
- 7판 FAQ 는 6판이 무효가 된 것은 아니며, 지식 영역·프로세스 그룹을 계속 쓸 수 있다고 답한다.

## 분석 프로젝트에 적용할 때의 질문(필자 정리)

PMBOK 6판 영역에 맞춰 분석 프로젝트에서 자주 문제 되는 지점을 적었다. PMI 가 분석 프로젝트를 이렇게 설명하는 것은 아니다.

| 영역 | 분석 프로젝트의 쟁점 |
| --- | --- |
| 범위 | 탐색 결과에 따라 요구 사항이 바뀐다. 가설 검증 범위를 먼저 고정 |
| 일정 | 데이터 확보·정제 시간이 모델링보다 길 수 있다 |
| 품질 | 데이터 품질 기준 → [데이터 품질·비식별화](/develop-wiki/knowledge/data-analytics/data-quality-privacy-deidentification/) |
| 위험 | 데이터 접근 권한, 개인정보 규정, 모델 성능 미달 |
| 이해관계자 | 현업이 결과 활용을 약속하지 않으면 배포 단계에서 멈춘다 |

## 분석 마스터 플랜 (교재 틀, 공개 출처 미확인)

- 교재는 여러 분석 과제를 우선순위로 정렬해 단계적 로드맵으로 만드는 것을 마스터 플랜으로 설명한다. 우선순위 기준으로 **시급성**과 **난이도**를 쓰는 틀이 흔하다. 공개 1차 출처는 찾지 못했다.
- 일반적인 우선순위 방법(가치 대비 노력 2축 등)은 널리 쓰이지만, 이 허브에서 읽은 문서가 아니라서 이름만 언급한다. 점수 계산 방식은 조직이 정해야 하며 표준이 없다.

## 분석 거버넌스 (교재 틀, 공개 출처 미확인)

- 교재 틀로 알려진 구성은 조직(Organization), 프로세스(Process), 시스템(System), 데이터(Data), 인력(Human Resource) 다섯 요소다. 이 구성의 공개 1차 출처(저자·문서)는 찾지 못했다.
- 데이터 거버넌스 일반 틀(DAMA 등)은 이 노트에서 읽지 않았다.

## 성숙도 모델: CMMI vs 교재의 분석 성숙도

| 항목 | CMMI(공개 자료) | 교재의 분석 성숙도 |
| --- | --- | --- |
| 대상 | 프로세스 개선(소프트웨어·서비스 등) | 조직의 분석 활용 수준 |
| 단계 | 아래 표 | 4단계로 가르친다. 단계 이름과 근거는 공개 출처 미확인 |
| 출처 | CMMI Institute | 수험 교재 |

CMMI Institute 페이지가 설명하는 수준(페이지는 CMMI 버전을 명시하지 않음):

| 구분 | 수준 |
| --- | --- |
| 성숙도(조직 전체) | 0 Incomplete, 1 Initial, 2 Managed, 3 Defined, 4 Quantitatively Managed, 5 Optimizing |
| 역량(실천 영역별) | 0 Incomplete, 1 Initial, 2 Managed, 3 Defined |

- 검색 결과로 확인한 SEI 쪽 서술은 성숙도 5단계(1 Initial ~ 5 Optimizing)다. 0단계 "Incomplete"는 현재 CMMI Institute 페이지에서 본 것이며, 판(V1.3, V2.0, V3.0)에 따라 달라질 수 있다.
- 용어 충돌: CMMI 의 "Managed/Defined"와 교재의 분석 성숙도 단계를 같은 것으로 대응시키지 않는다.

## 언제 쓰나 / 주의

- 교재 문제에서 "PMBOK 지식 영역"을 묻는다면 6판 기준 10개로 답하는 경우가 많다. 7판 이후 기준인지는 교재 본문을 확인한다.
- 마스터 플랜의 시급성·난이도 평가는 점수화할수록 정확해 보이지만 근거는 조직의 판단이다. 기준을 문서로 남긴다.
- 성숙도 모델은 목표 설정 도구이지 인증이 아니다. CMMI 단계가 높다고 분석 성과가 보장되지 않는다.

## 검증 범위

- 읽은 것: PMI PMBOK 7판 FAQ(2021, 원칙 12개·프로세스 그룹/지식 영역 답변), PMI 성과 영역 PDF(8개 영역 도식), Wikipedia PMBOK 항목(10개 영역 목록), CMMI Institute 수준 페이지.
- 읽지 못한 것: PMBOK 6판 본문, 8판 PMI 페이지(직접 열람 실패, 검색 결과 요약 의존), 7판 원칙 12개의 이름, CMMI 모델 문서 본문, DAMA-DMBOK.
- 미확인: 마스터 플랜 우선순위 기준(시급성·난이도)·분석 거버넌스 5요소·분석 성숙도 4단계의 공개 1차 출처.
- 직접 계산·실행: 없음.
