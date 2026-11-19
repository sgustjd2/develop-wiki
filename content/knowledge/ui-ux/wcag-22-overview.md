---
title: WCAG 2.2 개요 (POUR·적합성 수준·2.2 신규 기준)
aka: [WCAG 2.2, Web Content Accessibility Guidelines, POUR, Conformance Level, ISO/IEC 40500:2025, 웹 콘텐츠 접근성 지침]
category: ui-ux
group: accessibility
level: beginner
summary: W3C 웹 접근성 표준 WCAG 2.2 의 구조(4원칙·13지침·성공 기준), A/AA/AAA 적합성 수준, 2.2 에서 새로 생긴 9개 기준을 정리한 입문 노트.
tags: [accessibility, a11y, wcag, w3c, standard, compliance]
related: [ui-ux/semantic-html-first-aria, ui-ux/keyboard-focus-management, ui-ux/touch-target-size, ui-ux/cognitive-accessibility, ui-ux/screen-reader-accessible-name, mobile-dev/mobile-accessibility-basics, ui-ux/color-contrast-wcag-apca]
sources:
  - https://www.w3.org/TR/WCAG22/
  - https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
  - https://www.w3.org/WAI/WCAG22/Understanding/
  - https://www.w3.org/WAI/news/2025-10-21/wcag22-iso
updatedAt: 2026-11-19
---

## 문제

- "접근성 지켜 주세요"라는 요구는 막연하다. 무엇을, 어느 수준까지 맞춰야 하는지 공통 기준이 없으면 디자이너·개발자·QA 가 각자 다른 체크리스트를 쓴다.
- 공공·금융 조달, 해외 법규(예: 미국 ADA 소송, EU 접근성 법)는 대개 WCAG 의 특정 버전·수준을 기준으로 삼는다. 버전과 수준을 모르면 계약 요구를 해석할 수 없다.

## 해법 — 구조 한눈에 보기

WCAG 는 **원칙 → 지침 → 성공 기준(Success Criterion, SC)** 3단 구조다. 시험 대상은 성공 기준이다. 기준은 특정 기술에 묶이지 않은 "검증 가능한 문장"으로 쓰여 있다.

| 원칙(POUR) | 뜻 | 지침 예 |
| --- | --- | --- |
| **P**erceivable 인식 가능 | 정보를 감각 하나에만 의존하지 않고 받아들일 수 있다 | 대체 텍스트, 자막, 적응 가능, 구별 가능(명암비) |
| **O**perable 운용 가능 | 키보드·포인터·음성 등 여러 방식으로 조작할 수 있다 | 키보드 접근, 충분한 시간, 발작 예방, 탐색, 입력 방식 |
| **U**nderstandable 이해 가능 | 내용과 동작을 예측하고 이해할 수 있다 | 가독성, 예측 가능, 입력 지원 |
| **R**obust 견고성 | 보조 기술이 의미를 해석할 수 있다 | 호환성(이름·역할·값, 상태 메시지) |

- WCAG 2.2 본문(2024-12-12 개정판)에는 지침 13개, 성공 기준 87개 번호가 있고 그중 4.1.1 Parsing 은 "폐기·삭제"로 표시돼 실제 적용 기준은 86개다.
- 2.2 는 2023-10-05 W3C 권고안이 됐고, 2025년 10월 ISO/IEC 40500:2025 로도 승인됐다.
- 각 기준에는 **Understanding** 문서(의도·예시·충분한 기법·실패 사례)가 따로 있다. 해석이 갈리면 기준 문장보다 Understanding 을 먼저 읽는다.

### 적합성 수준

| 수준 | 의미 | 실무 |
| --- | --- | --- |
| A | 이것조차 안 되면 일부 사용자는 아예 못 쓴다 | 최소선 |
| AA | 대부분의 장벽을 없앤다 | **법규·조달·사내 정책의 사실상 표준 목표** |
| AAA | 더 엄격. 모든 콘텐츠에 일괄 적용은 어려움 | 핵심 흐름·특정 대상 서비스에 선택 적용 |

- "AA 준수"는 해당 페이지가 **A 와 AA 기준을 모두** 만족한다는 뜻이다. 적합성은 페이지(또는 페이지 묶음이 이루는 전체 프로세스) 단위로 판정한다. 결제 흐름 중 한 단계만 실패해도 그 프로세스 전체가 미달이다.

### 2.2 에서 새로 생긴 기준 (9개)

| SC | 이름 | 수준 | 요지 |
| --- | --- | --- | --- |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | 포커스 받은 요소가 고정 헤더·배너에 **완전히** 가려지지 않는다 |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | 일부도 가려지지 않는다 |
| 2.4.13 | Focus Appearance | AAA | 포커스 표시의 크기(2px 둘레 상당)와 상태 간 3:1 대비 |
| 2.5.7 | Dragging Movements | AA | 끌기로 하는 기능은 끌지 않는 단일 포인터 방법도 제공 |
| 2.5.8 | Target Size (Minimum) | AA | 포인터 타깃 24×24 CSS px 이상(예외 있음) |
| 3.2.6 | Consistent Help | A | 여러 페이지에 반복되는 도움 수단은 같은 상대 위치에 |
| 3.3.7 | Redundant Entry | A | 같은 과정에서 이미 입력한 정보는 자동 채움 또는 선택 가능 |
| 3.3.8 | Accessible Authentication (Minimum) | AA | 인증에 기억·전사 같은 인지 기능 시험을 강요하지 않는다 |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | 위에서 사물 인식·개인 콘텐츠 예외도 없앰 |

삭제: **4.1.1 Parsing**. 브라우저·보조 기술이 HTML 오류를 스스로 처리하게 되면서 의미가 없어졌다.

### 자주 걸리는 AA 기준 (2.0/2.1 에서 이어짐)

| SC | 내용 | 관련 노트 |
| --- | --- | --- |
| 1.1.1 (A) | 비텍스트 콘텐츠의 대체 텍스트 | [접근 가능한 이름](/develop-wiki/knowledge/ui-ux/screen-reader-accessible-name/) |
| 1.3.1 (A) | 정보·구조·관계를 마크업으로 전달 | [시맨틱 HTML 우선](/develop-wiki/knowledge/ui-ux/semantic-html-first-aria/) |
| 1.4.3 (AA) | 텍스트 명암비 4.5:1, 큰 텍스트 3:1 | [색 대비](/develop-wiki/knowledge/ui-ux/color-contrast-wcag-apca/) |
| 1.4.10 (AA) | 폭 320 CSS px 에서 가로·세로 이중 스크롤 없이 리플로 | |
| 1.4.11 (AA) | UI 컴포넌트·그래픽 3:1 | |
| 2.1.1 (A) / 2.4.7 (AA) | 키보드로 전부 조작, 포커스 표시 | [키보드·포커스](/develop-wiki/knowledge/ui-ux/keyboard-focus-management/) |
| 3.3.1 (A) / 3.3.3 (AA) | 오류 식별·수정 제안 | [에러 메시지](/develop-wiki/knowledge/ui-ux/error-messages/) |
| 4.1.2 (A) | 이름·역할·값을 프로그램으로 판별 | |
| 4.1.3 (AA) | 상태 메시지를 포커스 이동 없이 전달 | [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/) |

## 언제 쓰나

- 기획 단계에서 목표 수준을 정할 때: 특별한 이유가 없으면 **WCAG 2.2 AA** 를 기본으로 잡는다.
- 디자인 시스템 컴포넌트의 수용 기준(Definition of Done)을 쓸 때.
- 외부 감사 보고서·VPAT(접근성 적합성 보고서)를 읽고 우선순위를 매길 때.

## 체크리스트

- 목표 버전·수준을 문서에 적었다 (예: "WCAG 2.2 AA, 결제·가입은 2.4.12 도 시도").
- 자동 검사([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/), [Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/), [Pa11y](/develop-wiki/frontend/performance-a11y/pa11y/))를 CI 에 넣었다.
- 자동 검사가 못 보는 항목(키보드 흐름, 낭독 순서, 오류 문구의 의미)은 수동 점검 목록으로 분리했다.
- 2.2 신규 기준(포커스 가림, 24px 타깃, 끌기 대안, 인증)을 기존 2.1 체크리스트에 추가했다.

## 흔한 실수·주의

- **자동 검사 통과 = 준수라고 여김.** 도구는 마크업 규칙 위반 일부만 잡는다. 기준 상당수는 사람의 판단이 필요하다.
- **AAA 를 일괄 목표로 잡음.** W3C 도 모든 콘텐츠에 AAA 를 요구하지 않는다. 범위를 좁혀 선택 적용한다.
- **오버레이 위젯으로 대체.** 페이지에 스크립트 한 줄로 붙이는 "접근성 오버레이"는 원본 마크업의 문제를 고치지 못한다. 근본 수정이 먼저다.
- 지역 규정은 WCAG 를 그대로 쓰지 않을 수 있다(국내는 KWCAG 등). 계약서가 지정한 기준 문서를 직접 확인한다. 이 노트는 국내 규정 세부를 검증하지 않았다.
- 모바일 앱에도 원칙은 같지만 기준 문장은 웹 기준이다. 앱 실무는 [모바일 접근성 기본](/develop-wiki/knowledge/mobile-dev/mobile-accessibility-basics/)을 함께 본다.
