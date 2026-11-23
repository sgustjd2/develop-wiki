---
title: 좋은 버그 리포트 작성 (결함 보고서)
aka: [Effective Bug Report, Defect Report, Incident Report, 결함 보고서, 버그 리포트]
category: testing-practice
level: beginner
summary: 결함 보고서에 들어갈 항목(제목·재현 절차·기대/실제 결과·환경·첨부·심각도·우선순위)과 CTFL 5.5 의 결함 보고서 항목, 버그 추적 도구 문서의 권고를 구분하고, 심각도와 우선순위가 다른 이유를 가상 양식으로 보인다.
tags: [bug-report, defect-report, severity, priority, reproduction, istqb, github-issue-forms]
related: [testing-practice/flaky-e2e-tests, testing-practice/test-documentation-types, testing-practice/test-process-stages, ui-ux/heuristic-evaluation-severity, ui-ux/a11y-testing-strategy]
sources:
  - https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
  - https://bugzilla.readthedocs.io/en/latest/using/filing.html
  - https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
updatedAt: 2026-11-23
---

## 문제

"결제가 안 돼요" 같은 보고는 받은 사람이 다시 물어봐야 한다. 무엇을 눌렀는지, 어떤 빌드인지, 무엇을 기대했는지가 없으면 수정은 재현 시도부터 시작한다. 결함 보고서의 목적은 **처리 담당자가 그 보고서만 보고 고칠 수 있게 하는 것**이다. ISTQB CTFL 4.0.1(5.5절)은 이를 목적 셋으로 적는다. 해결에 충분한 정보를 주고, 작업 산출물의 품질을 추적할 수단이 되고, 개발·테스트 프로세스 개선의 아이디어를 준다.

## 핵심 용어

| 한국어 | 영어 | 이 노트에서 쓰는 뜻 |
| --- | --- | --- |
| 결함 보고서 | defect report | 테스트 중 관찰한 이상 현상을 기록한 문서. CTFL 은 ISO/IEC/IEEE 29119-3 이 이를 incident report 라 부른다고 적는다 |
| 이상 현상 | anomaly | 보고된 것이 실제 결함일 수도, 거짓 양성이나 변경 요청일 수도 있다(CTFL 5.5). 처리 과정에서 판가름 난다 |
| 재현 절차 | steps to reproduce | 실패를 관찰하게 한 테스트 단계(CTFL 표현: "재현과 해결이 가능하도록 실패를 설명") |
| 심각도 | severity | 결함이 이해관계자의 이익이나 요구사항에 미치는 영향의 정도(CTFL) |
| 우선순위 | priority | 고치는 순서(CTFL 은 "priority to fix" 로 적는다) |

## ISTQB 가 적은 보고서 항목

CTFL 4.0.1 5.5절은 동적 테스트 중 기록하는 결함 보고서가 "보통 포함하는" 항목을 나열한다. 아래는 자기 말로 옮긴 목록이다.

- 고유 식별자, 제목(이상 현상의 짧은 요약)
- 관찰 일시, 보고 조직, 작성자와 역할
- 테스트 대상과 테스트 환경의 식별
- 맥락: 실행 중이던 테스트 케이스·활동, SDLC 단계, 사용한 기법·체크리스트·테스트 데이터
- 재현·해결이 가능한 실패 설명(이상을 찾은 테스트 단계, 관련 로그·DB 덤프·스크린샷·녹화)
- 기대 결과와 실제 결과
- 심각도, 수정 우선순위
- 상태(예: 열림, 보류, 중복, 수정 대기, 확인 테스트 대기, 재오픈, 종료, 반려)
- 참조(예: 테스트 케이스)

식별자·일시·작성자·초기 상태는 결함 관리 도구가 자동으로 채울 수 있다고도 적는다. 이 목록은 **예시적 구성**이지 모든 프로젝트가 따라야 하는 필수 양식이 아니다.

## 직접 그린 양식 예

아래 그림은 필자가 만든 가상 사례다. 항목 이름과 순서는 위 ISTQB 목록과 도구 문서를 합쳐 필자가 추려 놓은 것이다.

<figure class="fig" role="group" aria-label="직접 그린 도식. 가상의 결제 화면 사례이며 실제 제품이나 실제 결함이 아니다. 심각도·우선순위 값은 예시다."><div class="fig-grid" style="display:block"><div class="fig-item"><svg viewBox="0 0 320 200" role="img" aria-label="가상 결함 보고서 양식: 제목, 환경, 재현 절차, 기대 결과, 실제 결과, 첨부, 심각도, 우선순위, 상태" style="max-width:100%"><rect x="4" y="4" width="312" height="192" rx="6" class="f-screen"/><text x="14" y="20" class="f-muted" text-anchor="start" font-size="8">[가상 사례] 결함 보고서 양식 예</text><text x="14" y="39" class="f-muted" text-anchor="start" font-size="7.5">제목</text><rect x="74" y="28" width="232" height="16" rx="3" class="f-input"/><text x="80" y="39" class="f-text" text-anchor="start" font-size="7.5">결제 화면: 쿠폰 적용 후 합계가 쿠폰 전 금액으로 돌아감</text><text x="14" y="59" class="f-muted" text-anchor="start" font-size="7.5">환경</text><rect x="74" y="48" width="232" height="16" rx="3" class="f-input"/><text x="80" y="59" class="f-text" text-anchor="start" font-size="7.5">빌드 2.3.1-rc2 / 스테이징 / Android 14</text><text x="14" y="78" class="f-muted" text-anchor="start" font-size="7.5">재현 절차</text><rect x="74" y="68" width="232" height="44" rx="3" class="f-input"/><text x="80" y="80" class="f-text" text-anchor="start" font-size="7">1. 장바구니에 상품 2개를 담고 결제 화면으로 이동</text><text x="80" y="91" class="f-text" text-anchor="start" font-size="7">2. 쿠폰 코드 SAMPLE10 을 입력하고 적용</text><text x="80" y="102" class="f-text" text-anchor="start" font-size="7">3. 배송지 입력란을 눌러 다녀온 뒤 합계를 확인</text><text x="14" y="129" class="f-muted" text-anchor="start" font-size="7.5">기대 결과</text><rect x="74" y="118" width="232" height="16" rx="3" class="f-input"/><text x="80" y="129" class="f-text" text-anchor="start" font-size="7.5">합계에 쿠폰 할인(10%)이 유지된다</text><text x="14" y="149" class="f-muted" text-anchor="start" font-size="7.5">실제 결과</text><rect x="74" y="138" width="232" height="16" rx="3" class="f-input"/><text x="80" y="149" class="f-text" text-anchor="start" font-size="7.5">합계가 할인 전 금액으로 표시된다 (3회 중 3회 재현)</text><text x="14" y="169" class="f-muted" text-anchor="start" font-size="7.5">첨부</text><rect x="74" y="158" width="232" height="16" rx="3" class="f-input"/><text x="80" y="169" class="f-text" text-anchor="start" font-size="7.5">화면 녹화 coupon-total.mp4, 앱 로그 일부</text><text x="14" y="184" class="f-muted" text-anchor="start" font-size="7.5">심각도</text><rect x="52" y="174" width="50" height="14" rx="7" class="f-fill-amber"/><text x="77" y="184" class="f-text" text-anchor="middle" font-size="7">주요(예)</text><text x="124" y="184" class="f-muted" text-anchor="start" font-size="7.5">우선순위</text><rect x="170" y="174" width="50" height="14" rx="7" class="f-fill-blue"/><text x="195" y="184" class="f-on" text-anchor="middle" font-size="7">높음(예)</text><text x="232" y="184" class="f-muted" text-anchor="start" font-size="7.5">상태: 열림</text></svg></div></div><figcaption>직접 그린 도식. 가상의 결제 화면 사례이며 실제 제품이나 실제 결함이 아니다. 심각도·우선순위 값은 예시다.</figcaption></figure>

그림의 항목을 글로 다시 쓰면 이렇다. 제목 → 환경(빌드·환경·기기) → 번호 매긴 재현 절차 → 기대 결과 → 실제 결과(재현 횟수 포함) → 첨부(녹화·로그) → 심각도와 우선순위 → 상태.

## 항목별 작성 요령

도구 문서와 CTFL 이 말하는 것과 필자 제안을 구분해 적는다.

**출처가 말하는 것**
- 제목은 짧되 구체적이어야 한다. Bugzilla 가이드는 "프로그램이 자꾸 죽어요" 같은 막연한 제목은 주목받지 못한다고 쓴다. 또 제목에 있는 내용은 본문에도 있어야 한다고 한다(제목은 편집되곤 한다).
- 재현 절차는 문제를 재현하는 **최소한**으로 줄인다(Bugzilla).
- 제출 전에 오탈자를 고치고(검색에 잡히도록) 재현 정보가 완전한지 다시 읽는다(Bugzilla).
- 기대/실제 결과, 로그, 스크린샷, 환경 식별은 CTFL 목록에 있다.

**필자 제안 (출처가 직접 요구한 것은 아님)**
- 재현 단계는 한 줄에 동작 하나, 번호 목록으로 쓴다.
- 간헐적이면 "N회 중 M회"처럼 횟수를 적는다. 조건을 못 찾았다고 적는 것도 정보다.
- 한 보고서에는 결함 하나. 여러 개를 묶으면 상태 관리가 어긋난다.
- 원인 추측은 "관찰"과 구분해 쓴다. 관찰: 합계가 바뀐다. 추측: 쿠폰 상태가 초기화되는 듯하다.
- 기대 결과의 근거(요구사항 ID, 디자인, 이전 동작)를 한 줄 덧붙이면 반려가 줄어든다.

## 헷갈리는 구분

### 심각도 vs 우선순위

| | 심각도 | 우선순위 |
| --- | --- | --- |
| 묻는 것 | 영향이 얼마나 큰가 | 언제·무엇보다 먼저 고치나 |
| 정하는 근거 | 결함 자체의 영향(CTFL: 이해관계자의 이익·요구사항에 미치는 정도) | 일정·릴리스·위험·사업 판단까지 포함(필자 해석) |
| 누가 | 보통 보고자가 1차 판단 | 보통 제품·프로젝트 쪽 결정 (필자의 관행 설명, 출처 미확인) |

둘이 어긋나는 예: 로고 오타는 심각도가 낮지만 출시 전날이면 우선순위가 높을 수 있다. 드물게 쓰는 기능의 데이터 손상은 심각도가 높지만 당장 고치는 순서는 뒤일 수 있다. 값의 이름과 단계(치명·주요·보통…)는 CTFL 이 정하지 않았고 Bugzilla 가이드도 정의하지 않는다 — 가이드는 "프로그램이 죽으면 major 나 critical 쯤, 오타는 minor" 정도의 예시만 든다. 척도는 팀이 정해야 한다.

### 결함 vs 실패 vs 이상 현상

보고서는 관찰한 **실패**(또는 이상 현상)를 적는다. 원인 결함의 위치를 아는 경우도 있으나, 보고 시점에는 대개 모른다. CTFL 도 보고된 이상 현상이 거짓 양성일 수 있다고 적는다. 그래서 보고 문체는 단정("버그다")보다 관찰("이렇게 보인다")이 안전하다.

## 도구 템플릿: GitHub 이슈 양식

GitHub 문서는 이슈 양식(issue forms)을 `.github/ISSUE_TEMPLATE` 에 두는 YAML 로 설명하며, 필수 최상위 키는 `name`, `description`, `body` 다. 본문 요소는 markdown·textarea·input·dropdown·checkboxes 등이고, `validations.required: true` 로 필수 입력을 강제한다. 아래는 문서 예시의 구조를 따라 직접 줄인 양식이다.

```yaml
name: 버그 보고
description: 재현 가능한 결함을 보고합니다
body:
  - type: input
    id: build
    attributes:
      label: 빌드/버전
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: 재현 절차
      description: 번호 목록, 한 줄에 동작 하나
    validations:
      required: true
  - type: textarea
    id: expected-actual
    attributes:
      label: 기대 결과와 실제 결과
    validations:
      required: true
```

양식은 **빠뜨림을 줄이지만 품질을 보장하지는 않는다.** 필수 칸에 "위와 같음"을 쓰는 보고는 막지 못한다. GitHub 문서는 이 기능을 공개 프리뷰로 표기했다(2026-11-23 확인 시점). 동작은 바뀔 수 있다.

## 언제 쓰나

- 결함을 다른 사람(개발자, 외부 협력사)에게 넘겨야 할 때 — 보고서가 유일한 소통 수단일수록 더 상세히.
- 같은 팀이 바로 옆에서 고칠 거라면 화면 녹화와 로그 링크만으로 충분한 경우도 있다. 양식 완성이 목적이 되면 안 된다.
- 자동화 테스트가 실패했을 때: 실행 ID, 빌드, 실패 로그를 보고서에 자동 첨부하면 [불안정 E2E 테스트](/develop-wiki/knowledge/testing-practice/flaky-e2e-tests/)의 재현 문제를 줄인다(필자 제안).

## 주의 / 비용

- 항목이 많은 양식은 작성 비용이 커서 보고 자체를 줄인다. 필수 칸은 재현에 꼭 필요한 것으로 한정한다.
- 개인정보·인증 정보가 스크린샷·로그에 섞이기 쉽다. 첨부 전에 가린다.
- 심각도를 보고자가 부풀리는 경향이 있으면 척도의 예시를 양식 옆에 붙여 둔다(필자 제안).
- 시각적 결함은 [시각 회귀 테스트](/develop-wiki/knowledge/ui-ux/visual-regression-testing/), 접근성 결함은 [접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)의 관찰 항목(사용한 보조기기 등)을 환경 칸에 더한다. 문서 계층 안의 위치는 [테스트 문서 종류](/develop-wiki/knowledge/testing-practice/test-documentation-types/), 심각도 척도 예는 [휴리스틱 평가의 심각도](/develop-wiki/knowledge/ui-ux/heuristic-evaluation-severity/) 참고.

## 검증 범위

- **직접 읽음**: ISTQB CTFL 4.0.1 PDF 의 1.4, 5.5절(결함 보고서 항목·목적), Bugzilla 공식 문서의 "filing" 쪽 가이드, GitHub 이슈 양식 문서의 구문·예시.
- **못 읽음/미확인**: ISTQB 용어집(SPA 사이트라 본문 추출 불가)의 severity·priority 정의 원문은 못 읽었다. 이 노트의 두 정의는 CTFL 5.5절의 항목 설명에 근거한다. ISO/IEC/IEEE 29119-3 표준 원문은 유료라 **미열람**(CTFL 의 언급만 인용). Atlassian 가이드는 접속했으나 본문이 추출되지 않아 근거로 쓰지 않았다. Bugzilla 의 priority 정의는 확인하지 못했다.
- 표의 "누가 정하나" 칸과 작성 요령의 필자 제안은 관행 설명이며 출처 확인을 거치지 않았다.
- 그림의 값(결함 내용, 빌드 번호, 심각도 "주요")은 모두 가상이다.
