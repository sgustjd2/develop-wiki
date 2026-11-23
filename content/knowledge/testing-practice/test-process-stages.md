---
title: 테스트 프로세스의 활동과 산출물 (ISTQB CTFL 4.0)
aka: [Test Process, Test Activities, 테스트 활동, 테스트 프로세스, 테스트 계획·분석·설계·구현·실행·완료]
category: testing-practice
level: intermediate
summary: ISTQB CTFL 4.0.1 의 테스트 활동 일곱 가지(계획, 모니터링·통제, 분석, 설계, 구현, 실행, 완료)가 각각 답하는 질문과 산출물, 순서가 아닌 반복·병행으로 도는 방식을 정리한다.
tags: [test-process, test-activities, testware, traceability, istqb, ctfl, iteration, entry-criteria]
related: [testing-practice/test-documentation-types, testing-practice/effective-bug-report-writing, testing-practice/test-environment-test-data-management, testing-practice/test-pyramid-trophy, testing-practice/tdd, testing-practice/flaky-e2e-tests]
sources:
  - https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
  - https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTAL-TM_Syllabus_v3.0_zKjKsaN.pdf
updatedAt: 2026-11-23
---

## 문제

"테스트"를 곧 "실행"으로 이해하면 앞뒤가 비어 버린다. 무엇을 테스트할지 정하지 않은 채 케이스를 쓰고, 환경이 준비되지 않은 채 실행을 시작하고, 끝난 뒤 자료는 흩어진다. ISTQB 는 이런 공통 활동 묶음을 **테스트 프로세스**라 부른다. 이 노트는 CTFL 4.0.1(2024-09-15판) 1.4절의 구성을 그대로 따라, 활동별 질문과 산출물을 정리한다.

## 핵심 용어

| 한국어 | 영어 | 정의(자기 말로) |
| --- | --- | --- |
| 테스트 프로세스 | test process | 테스트 목적을 달성하는 데 공통으로 필요한 활동 묶음. 상황에 맞게 조정한다 |
| 테스트웨어 | testware | 테스트 활동의 산출물 전체(계획서, 케이스, 데이터, 스크립트, 로그, 보고서 등) |
| 테스트 기반 | test basis | 테스트 대상을 분석할 때 근거로 삼는 자료(요구사항·사용자 스토리 등) |
| 테스트 조건 | test condition | 분석에서 도출한 테스트할 대상(예: 인수 조건) |
| 커버리지 항목 | coverage item | 설계에서 입력을 정하는 기준이 되는 단위 |
| 진입/종료 기준 | entry / exit criteria | 활동을 시작하기 위한 전제 / 끝났다고 선언하기 위한 달성 조건 |
| 추적성 | traceability | 테스트 기반 ↔ 조건·케이스·결과·결함 사이의 연결 |

## 활동 흐름

아래 그림은 CTFL 1.4.1 의 활동 이름과 1.4.3 의 산출물을 필자가 한 장으로 옮긴 것이다. 위쪽 문구처럼 화살표는 논리적 순서일 뿐 실제로는 반복·병행된다.

<figure class="fig" role="group" aria-label="직접 그린 도식. 활동 이름과 산출물은 ISTQB CTFL 4.0.1 1.4.1, 1.4.3 에 근거해 필자가 정리했다."><div class="fig-grid" style="display:block"><div class="fig-item"><svg viewBox="0 0 428 114" role="img" aria-label="테스트 활동 흐름: 계획, 분석, 설계, 구현, 실행, 완료와 전 과정에 걸친 모니터링·통제" style="max-width:100%"><rect x="8" y="30" width="62" height="40" rx="4" class="f-fill-gray"/><text x="39" y="46" class="f-text" text-anchor="middle" font-size="9">계획</text><text x="39" y="60" class="f-muted" text-anchor="middle" font-size="5.4">계획서·위험·기준</text><line x1="70" y1="50" x2="78" y2="50" class="f-outline"/><path d="M78 50 l-5 -3 m0 0 M78 50 l-5 -3" class="f-outline"/><rect x="78" y="30" width="62" height="40" rx="4" class="f-card"/><text x="109" y="46" class="f-text" text-anchor="middle" font-size="9">분석</text><text x="109" y="60" class="f-muted" text-anchor="middle" font-size="5.4">테스트 조건</text><line x1="140" y1="50" x2="148" y2="50" class="f-outline"/><path d="M148 50 l-5 -3 m0 0 M148 50 l-5 -3" class="f-outline"/><rect x="148" y="30" width="62" height="40" rx="4" class="f-card"/><text x="179" y="46" class="f-text" text-anchor="middle" font-size="9">설계</text><text x="179" y="60" class="f-muted" text-anchor="middle" font-size="5.4">케이스·데이터 요구</text><line x1="210" y1="50" x2="218" y2="50" class="f-outline"/><path d="M218 50 l-5 -3 m0 0 M218 50 l-5 -3" class="f-outline"/><rect x="218" y="30" width="62" height="40" rx="4" class="f-card"/><text x="249" y="46" class="f-text" text-anchor="middle" font-size="9">구현</text><text x="249" y="60" class="f-muted" text-anchor="middle" font-size="5.4">절차·스크립트·환경</text><line x1="280" y1="50" x2="288" y2="50" class="f-outline"/><path d="M288 50 l-5 -3 m0 0 M288 50 l-5 -3" class="f-outline"/><rect x="288" y="30" width="62" height="40" rx="4" class="f-card"/><text x="319" y="46" class="f-text" text-anchor="middle" font-size="9">실행</text><text x="319" y="60" class="f-muted" text-anchor="middle" font-size="5.4">로그·결함 보고서</text><line x1="350" y1="50" x2="358" y2="50" class="f-outline"/><path d="M358 50 l-5 -3 m0 0 M358 50 l-5 -3" class="f-outline"/><rect x="358" y="30" width="62" height="40" rx="4" class="f-fill-gray"/><text x="389" y="46" class="f-text" text-anchor="middle" font-size="9">완료</text><text x="389" y="60" class="f-muted" text-anchor="middle" font-size="5.4">완료 보고서·교훈</text><rect x="8" y="84" width="412" height="22" rx="6" class="f-fill-blue"/><text x="214" y="99" class="f-on" text-anchor="middle" font-size="7.5">모니터링과 통제: 전 과정에서 계획 대비 진행을 확인하고 조치(통제 지시)를 내린다</text><text x="214" y="16" class="f-muted" text-anchor="middle" font-size="7">순서대로 흐르는 듯 보여도 반복·병행으로 수행되는 경우가 많다</text></svg></div></div><figcaption>직접 그린 도식. 활동 이름과 산출물은 ISTQB CTFL 4.0.1 1.4.1, 1.4.3 에 근거해 필자가 정리했다.</figcaption></figure>

## 활동별 정리

### 1. 테스트 계획

테스트 목적을 정하고, 제약 안에서 목적에 맞는 접근 방식을 고른다. 산출물은 테스트 계획, 일정, 위험 대장, 진입·종료 기준이다(1.4.3). 계획서의 전형적 내용은 [테스트 문서의 종류](/develop-wiki/knowledge/testing-practice/test-documentation-types/)에 정리했다. 세부는 CTFL 5.1: 반복형 SDLC 에서는 릴리스 계획과 반복 계획이 따로 있고, 테스터는 테스트 가능한 스토리·인수 조건 작성, 위험 분석, 공수 추정에 참여한다(5.1.2).

### 2. 모니터링과 통제

모니터링은 활동 전반을 점검해 계획과 실제 진행을 비교한다. 통제는 목적을 이루려고 필요한 조치를 한다. CTFL 이 드는 통제 지시의 예는 이렇다: 위험이 현실화되면 테스트를 재우선순위화, 재작업 때문에 진입·종료 기준을 다시 평가, 환경 인도 지연에 맞춰 일정 조정, 필요한 곳에 인력 추가(5.3). 산출물은 진행 보고서와 통제 지시 문서, 위험 정보다.

### 3. 테스트 분석 — "무엇을 테스트하나"

테스트 기반을 분석해 테스트 가능한 특성을 식별하고, 관련 위험을 고려해 **테스트 조건**을 정의·우선순위화한다. 이 과정에서 테스트 기반과 대상의 결함도 찾고 테스트 용이성을 평가한다. 측정 가능한 커버리지 기준으로 "무엇"에 답한다. 산출물은 우선순위가 매겨진 테스트 조건(예: 인수 조건), 테스트 기반의 결함 보고서(바로 고치지 않는 경우).

### 4. 테스트 설계 — "어떻게 테스트하나"

조건을 케이스와 다른 테스트웨어(예: 헌장)로 구체화한다. 커버리지 항목을 식별해 입력을 정하는 지침으로 삼고, **테스트 데이터 요구사항 정의, 테스트 환경 설계, 필요한 인프라·도구 식별**도 이 단계에 속한다. 기법(4장)이 분석과 설계를 돕는다. 산출물은 케이스, 헌장, 커버리지 항목, 데이터 요구, 환경 요구.

### 5. 테스트 구현

실행에 필요한 테스트웨어를 만들거나 확보한다. 케이스를 **절차**로 묶고 스위트로 조립하며, 수동·자동 스크립트를 만들고, 실행 일정에서 절차의 순서와 우선순위를 정한다. 테스트 환경을 **구축하고 제대로 갖춰졌는지 확인**한다. 환경 항목의 예로 스텁, 드라이버, 시뮬레이터, 서비스 가상화를 든다. 산출물은 절차, 스크립트, 스위트, 테스트 데이터, 실행 일정, 환경 항목.

### 6. 테스트 실행

일정대로 테스트를 돌린다(수동·자동, 지속적 테스트, 페어 테스트 세션 등). 실제 결과를 기대 결과와 비교하고 결과를 로그에 남긴다. 이상 현상은 원인을 분석해 관찰한 실패를 기준으로 보고한다. 산출물은 테스트 로그와 [결함 보고서](/develop-wiki/knowledge/testing-practice/effective-bug-report-writing/)다.

### 7. 테스트 완료

릴리스, 반복 종료, 테스트 수준 종료 같은 마일스톤에서 한다. 미해결 결함에는 변경 요청이나 백로그 항목을 만들고, 앞으로 쓸 만한 테스트웨어는 보관하거나 인계하며, 테스트 환경은 합의된 상태로 종료한다. 활동을 분석해 교훈과 개선점을 뽑고 완료 보고서를 이해관계자에게 전달한다. CTFL 2.1.6 은 회고의 결과가 보통 완료 보고서에 들어간다고 적는다.

## 실제로는 순서가 아니다

CTFL 은 활동이 논리적 순서처럼 보여도 **반복적으로 또는 병행해서** 구현되는 경우가 많다고 적는다. 반복형·증분형 개발에서는 반복마다 모든 수준에서 정적·동적 테스트를 할 수 있어서 빠른 피드백과 광범위한 회귀 테스트가 필요하다(2.1.1). 즉 반복 하나 안에 위 활동이 작은 크기로 다 들어 있다.

| 개발 방식 | 활동 배치 (CTFL 2.1.1 요지) |
| --- | --- |
| 순차(워터폴, V 모델) | 초기 단계에서 요구사항 검토·분석·설계에 참여. 코드는 후반에 나와 동적 테스트는 늦다 |
| 반복·증분 | 매 반복이 동작하는 증분을 내므로 반복마다 정적·동적 테스트 |
| 애자일 | 변화 전제. 가벼운 문서, 광범위한 자동화, 수동 테스트는 경험 기반 기법 중심 |

DevOps 에서는 CI/CD 파이프라인이 안정적 테스트 환경 구축을 돕는다고 CTFL 은 적는다(2.1.4). 환경 이야기는 [테스트 환경과 데이터 관리](/develop-wiki/knowledge/testing-practice/test-environment-test-data-management/)에서 이어진다.

## 헷갈리는 구분

- **분석 vs 설계**: 분석은 "무엇"(조건, 커버리지 기준), 설계는 "어떻게"(케이스, 입력, 데이터·환경 요구). 작은 팀에서는 한 번에 한다.
- **계획 vs 모니터링·통제**: 계획은 앞을 정하고, 모니터링·통제는 계획과 실제의 차이를 보고 조치한다. 실행 뒤에 오는 단계가 아니라 전 기간에 걸친다.
- **구현 vs 실행**: 구현은 실행을 위한 준비(스크립트·환경·일정), 실행은 돌리는 일. 환경을 구축하고 검증하는 일은 **구현**에 속한다.
- **테스트 활동 vs 개발 활동**: 개발 쪽 TDD 는 테스트를 먼저 쓰는 개발 방식이며 활동 순서와 별개다. [TDD](/develop-wiki/knowledge/testing-practice/tdd/) 참고.

## 언제 쓰나

- 팀의 테스트가 "개발 막바지 실행"에 몰려 있을 때, 빠진 활동이 무엇인지 점검하는 체크 목록으로.
- 신규 프로젝트의 테스트 계획을 짤 때 활동별 담당·산출물·진입/종료 기준을 정하는 틀로.
- 감사나 인수에서 "무엇을 근거로 테스트했나"를 보일 때, 추적성(요구사항 ↔ 조건 ↔ 케이스 ↔ 결과 ↔ 결함)을 연결하는 순서로(CTFL 1.4.4).

## 주의 / 비용

- 맥락이 달라지면 활동 수행 방식이 달라진다. CTFL 1.4.2 는 이해관계자, 팀 역량, 업무 영역, 기술 요인, 프로젝트 제약, 조직, SDLC, 도구를 영향 요인으로 든다. 이 일곱 활동을 전부 문서로 남기라는 뜻이 아니다.
- 진입·종료 기준을 문서화하지 않으면 "끝났다"의 합의가 없다. 시간·예산 소진도 이해관계자가 위험을 수용하면 유효한 종료일 수 있다고 CTFL 은 적는다(5.1.3).
- 자동화 비중이 큰 팀에서 "구현"은 코드 작성·유지 비용이 된다. 불안정 테스트가 쌓이면 실행·보고가 신뢰를 잃는다([불안정 E2E 테스트](/develop-wiki/knowledge/testing-practice/flaky-e2e-tests/)).
- ISO/IEC/IEEE 29119-2 는 테스트 프로세스에 대한 더 자세한 정보를 준다고 CTFL 이 안내한다. 이 표준은 유료라 **원문은 읽지 않았다.**
- 전체 비중 배분(어느 수준에 얼마나)은 이 노트의 범위 밖이다. [테스트 피라미드와 트로피](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/) 참고.

## 검증 범위

- **직접 읽음**: ISTQB CTFL 4.0.1 PDF 의 1.4.1~1.4.4, 2.1.1, 2.1.4, 2.1.6, 5.1.2, 5.1.3, 5.3 절.
- **못 읽음**: ISO/IEC/IEEE 29119-2 원문(유료, 미열람), ISTQB 용어집(SPA 라 본문 추출 불가). CTFL 이전 판(2018 등)과 4.0 의 활동 구성 차이는 비교하지 않았다.
- 그림은 필자가 활동·산출물을 옮겨 그린 것이다. 그림 속 산출물 문구는 1.4.3 의 항목을 줄여 쓴 것이다.
- 로컬 모델(Hermes) 초안은 이 주제에 없었다(실패). 처음부터 직접 썼다.
