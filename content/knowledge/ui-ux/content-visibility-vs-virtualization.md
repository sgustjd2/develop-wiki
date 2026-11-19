---
title: content-visibility auto 와 가상화 비교 (찾기·접근성 트리·포커스)
aka: [content-visibility auto vs virtualization, CSS Containment content-visibility, contain-intrinsic-size, Rendering Skipping, 가상 스크롤 대안, 렌더링 건너뛰기]
category: ui-ux
group: accessibility
level: advanced
summary: 긴 목록을 빠르게 그리는 두 방법, 화면 밖 렌더링만 건너뛰는 CSS content-visibility auto 와 DOM 자체를 줄이는 가상화를 CSS Containment 사양과 직접 실행한 Chromium 실험으로 비교한다. 찾기·접근성 트리·포커스·메모리 차이를 다룬다.
tags: [accessibility, performance, css, content-visibility, contain-intrinsic-size, virtualization, find-in-page, rendering]
related: [ui-ux/virtualized-list-accessibility, ui-ux/virtualization-library-a11y-comparison, ui-ux/keyboard-focus-management, ui-ux/search-filter-sort, ui-ux/pagination-vs-infinite-scroll, ui-ux/voiceover-manual-testing-keys, ui-ux/nvda-browse-focus-mode-keys, performance/core-web-vitals]
sources:
  - https://www.w3.org/TR/css-contain-2/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/contain-intrinsic-size
updatedAt: 2026-11-19
---

가상화의 접근성 처리는 [가상화 리스트 접근성](/develop-wiki/knowledge/ui-ux/virtualized-list-accessibility/), 라이브러리별 지원은 [가상화 라이브러리 비교](/develop-wiki/knowledge/ui-ux/virtualization-library-a11y-comparison/)에 있다. 이 노트는 **가상화를 쓰지 않고 CSS 로 렌더링만 건너뛰는 방법**과 그 차이를 다룬다.

## 문제

- 수천 개 항목 목록이 느리다. 가상화를 넣으면 화면 밖 항목이 DOM 에서 사라져 브라우저 찾기(Ctrl+F)·낭독기 전체 탐색·순차 Tab 이동이 깨진다.
- 반대로 아무것도 안 하면 처음 렌더링·스크롤 비용이 크다.
- `content-visibility: auto` 는 그 중간이다. DOM 은 그대로 두고 **화면 밖 요소의 렌더링 작업만 건너뛴다.** 다만 무엇이 유지되고 무엇이 달라지는지 정확히 알아야 고를 수 있다.

## 해법

### 1. 사양이 정한 동작 (CSS Containment Level 2, W3C WD 2022-09-17)

| 값 | 동작 | 찾기·Tab·포커스·선택 | 접근성 트리 |
| --- | --- | --- | --- |
| `visible` | 영향 없음 | 그대로 | 그대로 |
| `auto` | 레이아웃·스타일·페인트 containment 를 항상 걸고, **사용자에게 관련 없을 때만** 내용을 건너뜀 | 건너뛴 내용도 계속 쓸 수 있어야 함 | 건너뛴 내용도 의미상 관련 있음. 다만 보조기술 사용 여부가 드러나면 안 되며, 피할 수 없으면 트리에서 빼야 함 |
| `hidden` | 항상 내용을 건너뜀 | 찾기·Tab·포커스·선택 모두 불가 | 빠져야 함 |

- "건너뜀"(skips its contents): 그려지지 않고(`visibility: hidden` 처럼), 히트 테스트에 반응하지 않으며(`pointer-events: none` 처럼), 스크립트가 요청하지 않으면 스타일·레이아웃을 갱신하지 않을 수 있다.
- 건너뛰는 동안에는 크기 containment 도 추가된다. 그래서 내용이 아니라 `contain-intrinsic-size` 가 크기를 정한다.
- "사용자에게 관련 있음"(relevant to the user)의 조건: 화면(또는 UA 가 정한 여백, 사양 예시 50%) 근처, 요소나 내용에 포커스, 내용이 선택됨, 내용이 top layer 에 있음. 하나라도 맞으면 건너뛰지 않는다.

### 2. 자리 크기: `contain-intrinsic-size`

```css
.row {
  content-visibility: auto;
  contain-intrinsic-size: auto 72px; /* 한 번 그려진 뒤엔 실제 크기를 기억해 사용 */
}
```

- `auto <length>`: 한 번이라도 정상 렌더링된 요소는 마지막 크기를 기억해 건너뛸 때 쓴다. 기억이 없으면 `<length>` 를 쓴다(MDN, CSS Box Sizing 4).
- 추정값이 실제와 크게 다르면 스크롤 막대 길이가 바뀌고 스크롤 위치가 튄다. MDN 예시도 이 현상을 보여 준다.
- MDN 표기 기준 Baseline: `content-visibility` 는 2024(Newly available, MDN 은 일부 하위 기능 지원 차이를 * 로 표시), `contain-intrinsic-size` 는 Widely available.

### 3. 직접 실행한 확인 (Chromium 151 headless, Playwright 1.65)

300개 `<section>`(제목·문단) 중 250번째에 고유 문자열을 넣고 두 값을 비교했다.

| 확인 항목 | `auto` | `hidden` |
| --- | --- | --- |
| 첫 화면 밖 250번 제목 `checkVisibility({contentVisibilityAuto: true})` | false (건너뜀) | false |
| 250번 섹션 높이 | 80px (`contain-intrinsic-size` 값) | 80px |
| `window.find()` 로 250번 문자열 찾기 | 찾음, 그 위치로 스크롤 | 못 찾음 |
| Playwright `ariaSnapshot()` 에 250번 제목 포함 | 포함 | 빠짐 |
| `getByRole('button', { name })` 로 화면 밖 버튼 찾기 | 1개 | 0개 |

- 사양·MDN 설명과 같은 결과였다. 낭독기 실제 출력은 듣지 않았다(아래 검증 범위).

### 4. 가상화와 비교

| 기준 | `content-visibility: auto` | 가상화(창 밖 DOM 제거) |
| --- | --- | --- |
| DOM 노드 수 | 그대로 (메모리 그대로) | 창 크기만큼 |
| 렌더링 비용 | 화면 밖 레이아웃·페인트 생략 | 창 밖은 아예 없음 |
| 브라우저 찾기 | 동작 (사양 요구) | 동작 안 함 |
| 접근성 트리 | 유지 (Chromium 실측. 사양 4.5 절상 UA 가 트리에서 뺄 수 있음) | 창 밖 항목 없음 → `aria-setsize` 등으로 보충 |
| 순차 Tab 이동 | 동작 | 창 밖으로 넘어가는 처리를 직접 구현 |
| 데이터 로딩 | 모두 미리 있어야 함 | 필요한 범위만 가져올 수 있음 |
| 스크롤 위치 정확도 | 자리 크기 추정에 의존 | 높이 측정·추정에 의존 (같은 문제) |

## 언제 쓰나

- 항목 수가 많지만 **전부 DOM 에 둬도 메모리가 감당되는** 목록·문서: 긴 설정 페이지, 문서 뷰어, 수백~수천 개 카드. 정확한 경계 수치는 기기에 따라 다르므로 측정으로 정한다(필자 제안).
- 찾기·낭독기 전체 탐색이 중요한 콘텐츠 페이지(문서, 약관, 긴 기사).
- 가상화 도입 전 첫 단계: CSS 한 줄로 효과를 보고, 부족할 때 가상화로 간다(필자 제안).

## 주의·비용

- **메모리 문제는 안 풀린다.** 수만 개 행, 무거운 이미지·iframe 이 있으면 가상화나 페이지 나누기가 필요하다 → [페이지네이션 vs 무한 스크롤](/develop-wiki/knowledge/ui-ux/pagination-vs-infinite-scroll/)
- 처음 렌더링 때 스타일 계산·DOM 생성 비용은 그대로다. 생략되는 건 화면 밖의 레이아웃·페인트다.
- `auto` 는 레이아웃·페인트 containment 를 **항상** 건다. 자식이 상자 밖으로 넘치는 디자인(드롭다운, 툴팁, 음수 여백)은 잘린다. 팝오버는 top layer 로 띄운다.
- 화면 밖 요소의 크기를 스크립트로 읽으면(`getBoundingClientRect`) 자리 크기가 나오거나 강제 레이아웃이 생긴다. 측정 코드가 있는 컴포넌트에는 조심해서 쓴다.
- `hidden` 은 `display: none` 처럼 찾기·포커스에서 빠진다. 접근성 목적의 "숨김"에 쓰면 안 되고, 렌더링 상태를 보존하고 싶은 숨김 탭 패널 같은 곳에 쓴다.
- 사양은 W3C Working Draft 상태다. 브라우저별 세부 동작(관련성 판정 여백, 접근성 트리 처리)은 다를 수 있다.

## 비교: 무엇을 고르나

| 상황 | 선택 |
| --- | --- |
| 수백~수천 항목, 찾기 중요(낭독기 탐색은 브라우저별 확인) | `content-visibility: auto` |
| 수만 항목, 메모리·데이터 로딩이 병목 | 가상화 + 앱 내 검색 |
| 서버에서 범위만 받아야 함 | 가상화 또는 페이지 나누기 |
| 숨긴 탭 패널을 빠르게 다시 보여 주기 | `content-visibility: hidden` |

## 검증 범위

- 확인함: 값별 동작, "관련 있음" 조건, 접근성 트리 요구는 W3C CSS Containment Level 2 WD(2022-09-17) 원문. `contain-intrinsic-size` 의 `auto` 동작과 Baseline 표기는 MDN(2026-11-19 열람). 표 3 은 스크래치에서 Playwright 1.65.1 + Chrome for Testing 151.0.7922.34(headless shell)로 직접 실행.
- 확인 못 함: Firefox·Safari 에서 같은 결과인지, NVDA·VoiceOver·TalkBack 이 화면 밖 `auto` 내용을 실제로 어떻게 읽는지(낭독기를 켜고 듣지 않음), 항목 수별 성능 수치(측정하지 않음).
