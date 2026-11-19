---
title: 토스트·스낵바·알림 배너
aka: [Toast, Snackbar, Notification Banner, Alert Banner, Inline Message, 알림, 상태 메시지]
category: ui-ux
group: patterns
level: beginner
summary: 사용자 동작의 결과나 시스템 사건을 알리는 수단(인디케이터·인라인 메시지·토스트·배너·모달)을 긴급도와 범위로 고르고, 자동으로 사라지는 메시지의 접근성 함정을 피하는 법.
tags: [ux, toast, snackbar, notification, banner, accessibility]
related: [ui-ux/live-regions-announcements, ui-ux/confirmation-vs-undo, ui-ux/error-messages, ui-ux/modal-dialog, ui-ux/form-inline-validation]
sources:
  - https://www.nngroup.com/articles/indicators-validations-notifications/
  - https://design-system.service.gov.uk/components/notification-banner/
  - https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
  - https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
updatedAt: 2026-11-19
---

## 문제

- 중요한 실패를 3초 뒤 사라지는 토스트로 알려 사용자가 놓친다.
- 토스트가 쌓여 화면 하단을 가리고, 포커스된 버튼을 덮는다(WCAG 2.4.11).
- 화면 위 배너가 서너 개씩 붙어 아무도 읽지 않는다.
- 낭독기 사용자는 토스트가 떴다는 사실을 모른다.

## 해법

### 1. 수단 고르기

NN/g(Flaherty, 2024)는 **인디케이터**(요소 옆 수동적 표시), **검증 메시지**(입력 오류), **알림**(시스템 사건; 맥락형/전역, 행동 필요/수동적)을 구분한다. 이를 컴포넌트로 옮기면:

| 수단 | 범위 | 사용자 행동 | 예 |
| --- | --- | --- | --- |
| 인디케이터·배지 | 특정 요소 | 불필요 | 읽지 않은 수, "저장됨" 체크 |
| 인라인 메시지 | 특정 영역·필드 | 상황에 따라 | 필드 오류, 위젯 로드 실패 |
| **토스트/스낵바** | 방금 한 동작의 결과 | 불필요(선택적 단일 동작) | "메일 보냄 · 실행 취소" |
| **배너** | 페이지·서비스 전체 | 확인·조치 가능 | 점검 예정, 결제 수단 만료 |
| 모달·alertdialog | 진행 차단 | 필수 | 세션 만료, 파괴적 동작 확인 → [모달](/develop-wiki/knowledge/ui-ux/modal-dialog/) |

### 2. 토스트 규칙

- **짧은 확인용**. 사라져도 사용자가 다른 방법으로 결과를 확인할 수 있는 정보만 담는다.
- 동작은 최대 하나(대개 "실행 취소"·"보기"). 그 동작은 다른 경로로도 가능해야 한다. → [확인 vs 실행 취소](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/)
- 실패·오류처럼 사용자가 조치해야 하는 내용은 사라지지 않는 인라인 메시지나 배너로.
- 한 번에 하나씩, 큐로 순서대로. 포커스 요소·하단 내비게이션을 가리지 않는 위치.
- 마우스 호버·키보드 포커스 중에는 타이머를 멈춘다.

**WCAG 2.2.1 Timing Adjustable 과의 관계**: Understanding 문서는 5초 뒤 사라지는 새 메일 토스트를 예로 들며, 받은편지함 등 **다른 경로로 같은 정보를 얻을 수 있으면 시간 제한이 아니다**라고 설명한다. 그 정보·기능을 얻을 다른 경로가 없다면 2.2.1 을 만족해야 한다(끄기·연장 등).

### 3. 배너 규칙 (GOV.UK 요약)

- 현재 과업과 직접 관계없지만 중요한 정보(서비스 문제, 개인 마감일, 이전 페이지 작업의 확인)에 쓴다. 자주 쓰면 무시된다.
- 페이지당 하나. 여러 개면 합치거나 가장 중요한 것만.
- 폼 검증 오류에는 쓰지 않는다(오류 요약을 쓴다).
- 성공 배너는 일관된 제목("완료")으로 색에만 의존하지 않는다.

### 4. 접근성

```html
<!-- 앱 셸에 미리 둔 토스트 영역: 내용이 바뀌면 polite 로 읽힘 -->
<div class="toast-region" role="status" aria-live="polite"></div>
```

- 토스트 문구는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알리되, "실행 취소" 버튼은 키보드로 도달 가능한 곳에 두고 단축키·기록 화면 등 대체 경로를 준다.
- 오류·긴급 알림만 `role="alert"`.

## 언제 쓰나

- 토스트: 저장·전송·복사·보관처럼 성공이 기본인 동작의 가벼운 확인, 실행 취소 제공.
- 배너: 계정·서비스 단위 상태, 사용자가 나중에 조치해도 되는 공지.

## 체크리스트

- 토스트로만 전달되는 중요한 정보가 없다.
- 토스트가 포커스 요소·고정 하단 바를 가리지 않는다.
- 호버·포커스 시 타이머가 멈춘다.
- 동시에 여러 개가 쌓이지 않는다.
- 배너는 페이지당 하나, 닫으면 다시 뜨지 않는다(조건이 바뀌지 않는 한).

## 흔한 실수·주의

- **실패를 토스트로.** "저장 실패" 토스트가 사라지면 사용자는 저장된 줄 안다.
- **토스트 안 링크·여러 버튼.** 시간 안에 누르기 어렵고 키보드로 도달하기 어렵다.
- **배너 피로.** 쿠키·앱 설치·뉴스레터·공지 배너가 겹치면 핵심 배너도 무시된다.
- **성공 알림 과잉.** 결과가 화면에 이미 보이면(목록에 항목 추가됨) 토스트는 불필요하다.
- Material 스낵바의 표시 시간·줄 수 수치는 이 노트에서 원문을 열어 확인하지 못해 적지 않았다.
