---
title: 타이포그래피 기본 — 타입 스케일·행간·줄 길이
aka: [Type Scale, Line Height, Leading, Measure, Line Length, Vertical Rhythm, Fluid Typography]
category: ui-ux
group: visual
level: beginner
summary: 글자 크기를 정해진 단계(타입 스케일)로만 쓰고, 행간·줄 길이·자간을 읽기 쉬운 범위로 묶어 화면 전체의 텍스트 위계와 가독성을 일관되게 만드는 방법.
tags: [typography, visual-design, css, accessibility, design-tokens]
related: [ui-ux/visual-hierarchy, ui-ux/web-font-loading-variable-fonts, ui-ux/grid-spacing-system, ui-ux/design-tokens]
sources:
  - https://m3.material.io/styles/typography/overview
  - https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-typescale.scss
  - https://developer.apple.com/design/human-interface-guidelines/typography
  - https://www.w3.org/TR/WCAG22/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap
updatedAt: 2026-11-19
---

## 문제

- 화면마다 13px, 15px, 17px, 18px… 크기가 제각각이면 위계가 흐려지고 디자인·코드 리뷰마다 "이건 몇 px?"를 묻게 된다.
- 줄이 너무 길면 다음 줄 시작을 놓치고, 행간이 좁으면 줄끼리 엉긴다.

## 해법

### 1. 타입 스케일: 크기를 "역할" 단계로 고정

크기를 숫자가 아니라 역할 이름(display·headline·title·body·label)으로 부른다. Material 3 기준 스케일(15개 기본 스타일, 2025년 M3 Expressive 에서 강조 스타일 15개 추가)의 크기/행간은 다음과 같다(단위 px, 웹 토큰은 rem).

| 역할 | Large | Medium | Small |
| --- | --- | --- | --- |
| Display | 57/64 | 45/52 | 36/44 |
| Headline | 32/40 | 28/36 | 24/32 |
| Title | 22/28 | 16/24 | 14/20 |
| Body | 16/24 | 14/20 | 12/16 |
| Label | 14/20 | 12/16 | 11/16 |

Apple HIG 는 iOS 기본 본문 17pt, 최소 11pt 를 권하고, 시스템 텍스트 스타일을 쓰면 Dynamic Type(사용자 글자 크기 설정)을 자동 지원한다. 웹에서는 `rem` 으로 지정해야 브라우저 글자 크기 설정이 반영된다.

### 2. 행간·자간·줄 길이

```css
:root {
  --text-body: 1rem;            /* 16px */
  --leading-body: 1.5;          /* 본문은 1.5 전후 */
  --leading-heading: 1.2;       /* 큰 글자는 행간을 줄인다 */
}
.prose {
  font-size: var(--text-body);
  line-height: var(--leading-body);   /* 단위 없는 값: 자식에 비율로 상속 */
  max-inline-size: 65ch;              /* 줄 길이 상한 */
}
.prose h1, .prose h2 { line-height: var(--leading-heading); text-wrap: balance; }
.prose p { text-wrap: pretty; }       /* 지원 안 되면 그냥 wrap 으로 동작 */

/* 유동 타입: 뷰포트에 따라 최소~최대 사이에서 변화 */
.hero-title { font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem); }
```

참고 기준(WCAG 2.2):

| 기준 | 내용 | 수준 |
| --- | --- | --- |
| 1.4.4 텍스트 크기 조정 | 200% 확대 시 내용·기능 손실 없음 | AA |
| 1.4.12 텍스트 간격 | 사용자가 행간 1.5배, 문단 간격 2배, 자간 0.12em, 단어 간격 0.16em 으로 바꿔도 깨지지 않음 | AA |
| 1.4.8 시각적 표현 | 줄 길이 80자 이하(CJK 40자), 문단 내 행간 1.5배 이상 | AAA |

## 언제 쓰나

- 디자인 시스템·테마를 처음 만들 때 색보다 먼저 정한다. 간격 단위와 함께 레이아웃의 기준이 된다.
- 기존 서비스에 크기가 수십 개 흩어져 있을 때, 사용 빈도를 집계해 5~6개 역할로 수렴시킨다.

## 체크리스트

- [ ] 크기는 스케일 토큰으로만 지정한다 (임의 px 금지)
- [ ] 본문 `line-height` 는 단위 없는 숫자, 1.4~1.6 범위
- [ ] 본문 블록에 `max-inline-size`(예: 60~75ch) 가 있다
- [ ] 브라우저 글자 크기 200% 에서 잘림·겹침이 없다
- [ ] 고정 `height` 를 가진 텍스트 컨테이너가 없다 (1.4.12 에서 깨진다)

## 흔한 실수

- `line-height: 24px` 처럼 고정값 → 글자 크기가 바뀌면 행간이 따라오지 않는다.
- 한글·CJK 에 라틴 기준 줄 길이를 그대로 적용. `ch` 는 "0" 글리프 폭이라 한글 한 글자보다 좁다. 한글 본문은 `em` 기준으로 따로 확인한다.
- 제목에도 본문 행간 1.5 → 두 줄 제목이 벌어져 보인다.
- 얇은 굵기(Thin·Light)를 작은 글씨에 사용.

## 주의 (비용)

- `text-wrap: balance` 는 줄 수 제한이 있다(MDN 기준 Chromium 6줄, Firefox 10줄 이하). `pretty` 는 느린 알고리즘이라 긴 글 전체에 쓰면 성능 비용이 있다.
- 유동 타입(`clamp` + `vw`)은 확대해도 `vw` 부분은 커지지 않는다. 최솟값·`rem` 항을 충분히 두어 1.4.4 를 깨지 않게 한다.
- 스케일 단계가 너무 적으면 실제 화면에서 예외가 쏟아진다. 처음엔 넉넉히 두고 사용 통계로 줄인다.
