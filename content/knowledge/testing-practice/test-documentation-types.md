---
title: 테스트 문서의 종류와 구분 (정책·전략·계획·케이스·절차·보고)
aka: [Test Documentation Types, Test Policy, Test Strategy, Test Plan, Test Case, Test Procedure, IEEE 829, ISO/IEC/IEEE 29119-3, 테스트 문서화]
category: testing-practice
level: intermediate
summary: 테스트 정책·전략·계획·조건·케이스·절차·로그·진행/완료 보고서가 각각 무엇이고 어떤 활동에서 나오는지 ISTQB 기준으로 구분하고, IEEE 829 와 ISO/IEC/IEEE 29119-3 의 관계를 공개 자료 범위에서 정리한다.
tags: [test-plan, test-strategy, test-policy, test-case, test-procedure, test-report, istqb, ieee-829, iso-29119]
related: [testing-practice/test-process-stages, testing-practice/effective-bug-report-writing, testing-practice/test-pyramid-trophy, testing-practice/test-environment-test-data-management, ui-ux/a11y-testing-strategy]
sources:
  - https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
  - https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTAL-TM_Syllabus_v3.0_zKjKsaN.pdf
  - https://standards.ieee.org/ieee/829/3787/
  - https://en.wikipedia.org/wiki/Software_test_documentation
updatedAt: 2026-11-23
---

## 문제

팀마다 "테스트 계획서", "테스트 시나리오", "테스트 케이스"를 다른 뜻으로 쓴다. 전략과 계획을 한 문서에 섞거나, 케이스 수천 개를 쓰고도 왜 그것을 테스트하는지 남기지 못한다. 문서의 이름을 맞추는 것이 목적은 아니다. **문서마다 어떤 질문에 답하는지**를 구분하면 어느 문서를 만들고 어느 문서는 생략할지 판단할 수 있다.

## 핵심 용어

| 한국어 | 영어 | 답하는 질문 / 출처 기준 정의 |
| --- | --- | --- |
| 테스트 정책 | test policy | 조직이 테스트로 이루려는 목적과 원칙. CTFL·CTAL-TM 은 계획이 정책에 맞는지(또는 벗어나는 이유)를 보이라고 한다 |
| 테스트 전략 | test strategy | 주어진 상황에서 테스트 목적을 이루기 위해 테스트를 어떻게 수행할지에 대한 서술. 범위·접근 방식·자원을 정한다(CTAL-TM v3.0) |
| 테스트 접근 방식 | test approach | 테스트 수준·유형·기법과 스크립트/수동 같은 실무 선택의 조합(CTAL-TM) |
| 테스트 계획 | test plan | 한 테스트 프로젝트의 목적·자원·프로세스. 수단과 일정을 문서화한다(CTFL 5.1.1) |
| 테스트 조건 | test condition | 분석 단계에서 정하는 "무엇을 테스트하나"(예: 인수 조건). 우선순위가 붙는다 |
| 테스트 케이스 | test case | 설계 단계에서 조건을 구체화한 것. 입력과 기대 결과를 갖는다 |
| 테스트 절차 | test procedure | 케이스를 실행 순서로 묶은 것(용어집 원문 미확인). 절차를 모은 것이 테스트 스위트(CTFL 1.4.1) |
| 테스트 로그 | test log | 실행 결과의 기록 |
| 진행 보고서·완료 보고서 | test progress / completion report | 기간별 진행 상황 / 한 수준·주기·반복이 끝난 뒤의 요약(CTFL 5.3.2) |

CTFL 4.0.1 의 핵심 용어 목록에는 **"테스트 시나리오"가 없다.** 실무에서 "케이스보다 큰, 사용자 흐름 단위의 테스트 아이디어"로 흔히 쓰이지만 이 정의는 필자의 정리이고 조직마다 다르다. 이 노트는 시나리오를 별도 ISTQB 문서 유형으로 다루지 않는다.

## 문서 계층

아래 그림은 CTFL 의 작업 산출물 목록(1.4.3)과 5.1, 5.3, 5.5절을 바탕으로 **필자가 층을 나누어 그렸다.** 공식 도표가 아니다.

<figure class="fig" role="group" aria-label="직접 그린 도식. 테스트 문서를 계획 층·설계/구현 층·실행/완료 층으로 나눈 필자 정리이며, 표준의 공식 도표가 아니다."><div class="fig-grid" style="display:block"><div class="fig-item"><svg viewBox="0 0 420 176" role="img" aria-label="테스트 문서의 계층: 정책, 전략, 계획, 조건, 케이스, 절차, 로그, 결함 보고서, 진행·완료 보고서" style="max-width:100%"><text x="10" y="14" class="f-muted" text-anchor="start" font-size="8">계획 층</text><text x="150" y="14" class="f-muted" text-anchor="start" font-size="8">설계·구현 층</text><text x="290" y="14" class="f-muted" text-anchor="start" font-size="8">실행·완료 층</text><rect x="10" y="22" width="120" height="32" rx="4" class="f-card"/><text x="70" y="36" class="f-text" text-anchor="middle" font-size="8.5">테스트 정책</text><text x="70" y="48" class="f-muted" text-anchor="middle" font-size="6.8">조직의 테스트 목적·원칙</text><rect x="10" y="66" width="120" height="32" rx="4" class="f-card"/><text x="70" y="80" class="f-text" text-anchor="middle" font-size="8.5">테스트 전략</text><text x="70" y="92" class="f-muted" text-anchor="middle" font-size="6.8">접근 방식(수준·유형·기법)</text><rect x="10" y="110" width="120" height="32" rx="4" class="f-fill-gray"/><text x="70" y="124" class="f-text" text-anchor="middle" font-size="8.5">테스트 계획</text><text x="70" y="136" class="f-muted" text-anchor="middle" font-size="6.8">범위·일정·위험·종료 기준</text><line x1="70" y1="54" x2="70" y2="66" class="f-outline"/><path d="M70 66 l-3 -4 m0 0 M70 66 l3 -4" class="f-outline"/><line x1="70" y1="98" x2="70" y2="110" class="f-outline"/><path d="M70 110 l-3 -4 m0 0 M70 110 l3 -4" class="f-outline"/><rect x="150" y="22" width="120" height="32" rx="4" class="f-card"/><text x="210" y="36" class="f-text" text-anchor="middle" font-size="8.5">테스트 조건</text><text x="210" y="48" class="f-muted" text-anchor="middle" font-size="6.8">분석: 무엇을 테스트하나</text><rect x="150" y="66" width="120" height="32" rx="4" class="f-card"/><text x="210" y="80" class="f-text" text-anchor="middle" font-size="8.5">테스트 케이스</text><text x="210" y="92" class="f-muted" text-anchor="middle" font-size="6.8">설계: 입력·기대 결과</text><rect x="150" y="110" width="120" height="32" rx="4" class="f-fill-gray"/><text x="210" y="124" class="f-text" text-anchor="middle" font-size="8.5">테스트 절차·스크립트</text><text x="210" y="136" class="f-muted" text-anchor="middle" font-size="6.8">구현: 실행 순서·자동화</text><line x1="210" y1="54" x2="210" y2="66" class="f-outline"/><path d="M210 66 l-3 -4 m0 0 M210 66 l3 -4" class="f-outline"/><line x1="210" y1="98" x2="210" y2="110" class="f-outline"/><path d="M210 110 l-3 -4 m0 0 M210 110 l3 -4" class="f-outline"/><rect x="290" y="22" width="120" height="32" rx="4" class="f-card"/><text x="350" y="36" class="f-text" text-anchor="middle" font-size="8.5">테스트 로그</text><text x="350" y="48" class="f-muted" text-anchor="middle" font-size="6.8">실행: 결과 기록</text><rect x="290" y="66" width="120" height="32" rx="4" class="f-card"/><text x="350" y="80" class="f-text" text-anchor="middle" font-size="8.5">결함 보고서</text><text x="350" y="92" class="f-muted" text-anchor="middle" font-size="6.8">실행: 실패 보고</text><rect x="290" y="110" width="120" height="32" rx="4" class="f-fill-gray"/><text x="350" y="124" class="f-text" text-anchor="middle" font-size="8.5">진행·완료 보고서</text><text x="350" y="136" class="f-muted" text-anchor="middle" font-size="6.8">모니터링·완료</text><text x="210" y="158" class="f-muted" text-anchor="middle" font-size="7">화살표는 입력·산출물의 방향. 이름과 층 구분은 필자 정리</text><text x="210" y="169" class="f-muted" text-anchor="middle" font-size="7">(근거: ISTQB CTFL 4.0.1 의 1.4.3, 5.1, 5.3, 5.5)</text></svg></div></div><figcaption>직접 그린 도식. 테스트 문서를 계획 층·설계/구현 층·실행/완료 층으로 나눈 필자 정리이며, 표준의 공식 도표가 아니다.</figcaption></figure>

그림을 글로 옮기면 세 층이다.
1. 계획 층: 테스트 정책 → 테스트 전략 → 테스트 계획. 위가 조직 수준이고 아래로 갈수록 프로젝트에 특화된다. 계획은 정책·전략을 따르거나 벗어나는 이유를 보인다(CTFL 5.1.1).
2. 설계·구현 층: 테스트 조건(분석) → 테스트 케이스(설계) → 테스트 절차·스크립트·스위트(구현).
3. 실행·완료 층: 테스트 로그, 결함 보고서([결함 보고서 작성](/develop-wiki/knowledge/testing-practice/effective-bug-report-writing/) 참고), 진행 보고서와 완료 보고서.

## 문서별 내용

### 테스트 계획

CTFL 5.1.1 이 드는 계획의 전형적 내용은 아래다(자기 말로 요약).
- 테스트의 맥락(범위·목적·테스트 기반), 가정과 제약
- 이해관계자와 소통 방식
- 위험 대장(제품 위험·프로젝트 위험)
- 테스트 접근 방식: 수준·유형·기법, 산출물, 진입/종료 기준, 독립성, 수집할 지표, 테스트 데이터 요구, 테스트 환경 요구, 정책·전략에서 벗어나는 점
- 예산과 일정

CTFL 은 계획서 자체가 "필수 양식"이라고 하지 않는다. 계획이 **테스트하는 사고를 강제**한다는 점을 더 강조한다. 상세 템플릿은 ISO/IEC/IEEE 29119-3 에 있다고 안내한다.

### 전략과 계획의 관계

CTAL-TM v3.0 은 프로젝트 전략을 "테스트 계획의 주된 결과물"이라 하고, 계획의 일부로 또는 다른 문서에 적을 수 있다고 한다. 순차 모델에서는 보통 계획서에 적고, 계약·규제·법이 문서화를 요구하기도 한다. 반대로 문서화 필요 수준은 맥락에 따라 달라서 정식 계획서가 꼭 필요하지는 않다고 쓴다. 즉 **"전략 문서"와 "계획 문서"를 둘 다 따로 만들어야 한다는 규칙은 없다.**

### 테스트 케이스와 절차

CTFL 은 케이스의 필수 필드 목록을 주지 않는다. 설계 단계에서 케이스를 만들고, 테스트 데이터·환경 요구를 함께 정의하며(1.4.1), 케이스와 요구사항·위험·결과·결함 사이의 **추적성**을 유지하라고 한다(1.4.4). 아래 양식은 그 요구를 만족시키려고 필자가 만든 예이며 표준 양식이 아니다.

| 필드 | 예 (가상) |
| --- | --- |
| ID | TC-CART-012 |
| 추적 대상 | 요구사항 R-45 (쿠폰 적용 후 합계) |
| 우선순위 | 높음 |
| 사전 조건 | 로그인됨, 장바구니에 상품 2개 |
| 단계 | 1. 쿠폰 SAMPLE10 입력 2. 적용 3. 합계 확인 |
| 입력 데이터 | 상품 단가 10000 원 x 2, 쿠폰 10% |
| 기대 결과 | 합계 18000 원 |
| 실제 결과·판정 | (실행 시 기록) |

절차(procedure)는 이런 케이스를 어떤 순서로 돌릴지(실행 일정)를 정한다. 의존성이 있으면 선행 케이스가 먼저다(CTFL 5.1.5).

### 보고서

- 진행 보고서(테스트 상태 보고서): 기간, 진행도와 이탈, 장애 요인과 우회책, 지표, 새로 변한 위험, 다음 기간 계획. 내부에는 자주·비공식으로.
- 완료 보고서: 요약, 계획 대비 품질 평가, 계획 이탈, 장애 요인, 지표, 미해결 위험·결함, 교훈. 정해진 양식으로 한 번 작성(CTFL 5.3.2).

## IEEE 829 와 ISO/IEC/IEEE 29119-3

- IEEE 829-2008 은 "소프트웨어 및 시스템 테스트 문서" 표준으로, IEEE 사이트에서 **Superseded**(대체됨) 상태다. IEEE 829-1998 을 대체했고, ISO/IEC/IEEE 29119 시리즈(-1·-2·-3: 2013, -4: 2015)로 대체됐다(IEEE 공식 페이지 확인).
- 같은 표준은 무결성 수준(integrity level)에 따라 문서의 폭과 깊이를 고르게 한다고 요약한다. 즉 **문서를 전부 쓰라는 표준이 아니라 위험에 맞춰 고르는 표준**이다.
- 보조 자료(Wikipedia, 1차 아님)에 따르면 2008판의 문서에는 마스터 테스트 계획, 수준 테스트 계획, 수준 테스트 설계·케이스·절차, 수준 테스트 로그, 이상 보고서, 중간 상태 보고서, 수준 테스트 보고서, 마스터 테스트 보고서가 있다. 1차 확인은 못 했다.
- ISO/IEC/IEEE 29119-3 은 검색 요약 기준으로 2021년 2판이 최신이고 2013판을 대체했다. 표준 문서는 유료이며 **원문은 읽지 않았다.** CTFL 이 말하는 것은 29119-3 에 계획서·진행 보고서(상태 보고서)·완료 보고서·결함(incident) 보고서의 템플릿과 예시가 있다는 정도다.

## 언제 쓰나

- 규제·계약·감사가 있는 프로젝트: 계획·결과 문서가 증빙이다. 추적성(요구사항 → 케이스 → 결과 → 결함)을 갖추면 변경 영향 분석과 감사에 쓰인다(CTFL 1.4.4).
- 애자일·소규모 팀: CTFL 2.1.1 은 애자일에서 가벼운 문서와 자동화를 선호하며, 수동 테스트는 사전 분석·설계가 적은 경험 기반 기법을 많이 쓴다고 적는다. 이때 문서는 위키 한 페이지의 전략, 자동화 테스트 코드 자체, [테스트 피라미드](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/)식 정책 한 장으로 줄어든다.
- 탐색적 테스트는 헌장(charter)과 세션 시트로 기록한다(CTFL 4.4.2).

## 주의 / 비용

- 문서는 만들고 끝이 아니다. 유지하지 않으면 거짓 문서가 되어 없는 것보다 해롭다. 구성 관리(CTFL 5.4)로 버전과 기준선을 관리한다.
- 케이스를 과도하게 상세히 쓰면 UI 변경마다 갱신 비용이 든다. 탐색적 테스트나 자동화로 대체할 수 있는 부분은 가벼운 헌장으로.
- 표준 양식 준수가 목적이 되면 안 된다. 어떤 결정을 돕는 문서인지 말할 수 없으면 만들지 않는다(필자 의견).
- 한 번 만든 환경·데이터 요구는 [테스트 환경과 데이터 관리](/develop-wiki/knowledge/testing-practice/test-environment-test-data-management/)의 근거가 된다. 활동과의 대응은 [테스트 프로세스 활동](/develop-wiki/knowledge/testing-practice/test-process-stages/) 참고.

## 검증 범위

- **직접 읽음**: ISTQB CTFL 4.0.1 PDF(1.4, 2.1, 5.1, 5.3, 5.4, 5.5), ISTQB CTAL-TM v3.0 PDF 의 테스트 전략 관련 부분, IEEE 829-2008 공식 표준 페이지(요약·상태).
- **보조로만 확인**: Wikipedia 의 IEEE 829-2008 문서 목록(1차 아님), 검색 결과 요약의 ISO/IEC/IEEE 29119-3:2021 소개.
- **못 읽음/미확인**: ISO/IEC/IEEE 29119-3 과 IEEE 829 표준 원문은 유료라 **미열람**이다. 문서별 정확한 필수 섹션(예: 계획서가 14개 섹션이라는 주장)은 확인하지 못해 쓰지 않았다. ISTQB 용어집의 test policy 정의 원문도 못 읽었다(SPA 사이트). 정책을 "조직의 테스트 목적·원칙"이라고 한 것은 CTFL·CTAL-TM 의 언급을 바탕으로 한 필자 요약이다.
- 그림의 층 구분과 케이스 양식은 필자 구성이다.
