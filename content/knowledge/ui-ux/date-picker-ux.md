---
title: 날짜 선택기 UX (직접 입력 vs 달력)
aka: [Date Picker, Date Input, Calendar Grid, Date Range Picker, 날짜 입력]
category: ui-ux
group: patterns
level: intermediate
summary: 날짜를 받는 방법을 직접 입력(분리 필드), 달력 선택, 둘의 결합 중에서 고르는 기준과, 달력 그리드의 키 조작·로캘 형식·검증 규칙을 정리한다.
tags: [ux, forms, date-picker, accessibility, apg, i18n]
related: [ui-ux/form-inline-validation, ui-ux/keyboard-focus-management, ui-ux/modal-dialog, ui-ux/i18n-ux, ui-ux/error-messages, ui-ux/touch-target-size]
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
  - https://design-system.service.gov.uk/components/date-input/
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date
updatedAt: 2026-11-19
---

## 문제

- 달력은 "오늘 기준 가까운 날짜" 에는 빠르지만, 생년월일처럼 수십 년 전 날짜는 월을 수백 번 넘겨야 한다.
- 달력만 있고 타이핑이 안 되면 키보드·음성 입력 사용자와 숙련자가 불리하다.
- 날짜 형식(`2026-11-19`, `11/19/2026`, `2026. 11. 19.`)이 사용자마다 달라 파싱 오류가 난다.

## 해법

### 1. 입력 방식 고르기

| 상황 | 권장 |
| --- | --- |
| 사용자가 날짜를 이미 알고 있다(생년월일, 여권 만료일) | 일·월·연 **분리 텍스트 필드**. GOV.UK 도 이 경우 달력 없는 3필드를 권장 |
| 가까운 미래·과거에서 고른다(예약, 배송일) | 달력 + 텍스트 입력 결합. 요일·휴일 정보가 도움 |
| 기간(체크인~체크아웃) | 범위 선택 달력. 시작·끝을 각각 텍스트로도 입력 가능하게 |
| 브라우저 기본으로 충분 | `<input type="date">`. 형식·달력 UI 는 브라우저가 맡지만 스타일 제약이 크고 환경별 차이가 있다 |

### 2. 달력 그리드 키 조작 (APG datepicker-dialog 예제)

| 키 | 동작 |
| --- | --- |
| ←/→ | 전날/다음 날 |
| ↑/↓ | 이전/다음 주 같은 요일 |
| Home/End | 그 주의 첫/마지막 날 |
| PageUp/PageDown | 이전/다음 달(같은 일, 없으면 말일) |
| Shift+PageUp/PageDown | 이전/다음 해 |
| Enter/Space | 선택하고 닫은 뒤 열기 버튼으로 포커스 복귀 |
| Esc | 선택 없이 닫고 버튼으로 복귀 |

- 그리드 칸 중 하나만 Tab 순서에 두는 roving tabindex, 선택된 칸에 `aria-selected`, 월·연 제목은 `aria-live="polite"` 로 변경을 알린다. 열기 버튼 이름은 선택 후 "날짜 변경, 2026년 11월 19일" 식으로 현재 값을 포함한다.
- 달력은 모달 다이얼로그로 구현한다. 포커스는 열릴 때 현재 값(없으면 오늘)에 두고 닫히면 버튼으로 돌려준다([모달](/develop-wiki/knowledge/ui-ux/modal-dialog/)).

### 3. 날짜 계산 코드 (node 로 실행해 확인)

```ts
// 달 이동: 같은 '일', 대상 달에 없으면 말일로 보정 (PageUp/Down 규칙)
const addMonths = (d: Date, n: number) => {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last)));
};
// 실존 날짜 검증: Date 가 넘겨 주는 값(2/30 → 3/2)을 걸러낸다
const parse = (y: number, m: number, d: number) => {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? t : null;
};
```

- 실행 결과: 2026-01-31 에서 다음 달 → 2026-02-28, 2028-02-29 에서 다음 해 → 2029-02-28, `parse(2026, 2, 30)` → `null`. 날짜는 시간대 이동을 피하려고 UTC 로 다뤘다.
- 표시는 `Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' })` → "2026년 1월 31일 토요일" 처럼 로캘에 맡긴다. 요일 약어 열에는 전체 요일명을 `abbr`/`aria-label` 로 준다.

### 4. 검증·오류 문구 (GOV.UK 날짜 입력 지침 요지)

- 비었을 때: "생년월일을 입력하세요". 일부만 비었을 때: 비어 있는 필드만 강조하고 "월을 입력하세요".
- 존재하지 않는 날짜: "실제 있는 날짜여야 합니다".
- 과거·미래 제약: 입력 전에 힌트로 알리고, 위반 시 이유를 쓴다.
- 월은 숫자뿐 아니라 이름("11", "nov")도 받아 주면 오류가 줄어든다(GOV.UK).
- 생년월일 필드에는 `autocomplete="bday-day|bday-month|bday-year"` 를 지정한다(WCAG 1.3.5).
- 필드 사이 자동 탭 이동은 하지 않는다(GOV.UK 권고).

## 언제 쓰나

- 예약·일정·필터처럼 날짜가 핵심 입력인 모든 폼.
- 달력은 "가까운 날짜 선택 + 맥락 정보(빈 날짜, 휴일)" 가 가치일 때. 먼 과거에는 분리 입력이 낫다.

## 주의·비용

- 접근 가능한 달력은 구현량이 크다(그리드, 월 이동, 범위, 비활성 날짜, 낭독 문구). 검증된 라이브러리([React Aria](/develop-wiki/frontend/ui-kit/react-aria/) 등)를 쓰고, 이 노트의 예제는 로직 설명용으로 본다. 라이브러리별 접근성 수준은 직접 확인한다.
- 시간대: "날짜" 와 "시각" 을 구분한다. 날짜만 필요한 값(생일)을 `Date` 로컬 시각으로 저장하면 시간대에 따라 하루가 밀린다.
- 비활성 날짜(예약 마감)는 색만으로 구분하지 않고 `aria-disabled` 와 이유 텍스트를 준다.
- 터치 환경에서 칸 크기는 [터치 타깃](/develop-wiki/knowledge/ui-ux/touch-target-size/) 기준을 맞춘다.

## 체크리스트

- [ ] 텍스트로도 입력 가능, 형식 힌트가 입력창에 `aria-describedby` 로 연결
- [ ] 달력 키 조작이 위 표와 같고 Esc 가 동작
- [ ] 오류는 어떤 필드가 왜 틀렸는지 말한다
- [ ] 로캘별 표시·요일 시작(일/월)을 따른다
- [ ] 범위 선택에서 시작일 > 종료일을 막고 안내한다

## 흔한 실수

- 달력 아이콘만 있고 입력 불가, 또는 자유 입력을 받으면서 형식을 알려 주지 않는다.
- `new Date('2026-02-30')` 같은 관대한 파싱을 믿는다.
- `mm/dd/yyyy` 를 한국 사용자에게 강제한다.
- 닫힌 뒤 포커스가 `<body>` 로 떨어진다.
