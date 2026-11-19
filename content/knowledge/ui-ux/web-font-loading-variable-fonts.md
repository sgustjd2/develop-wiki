---
title: 웹폰트 로딩과 가변 폰트
aka: [Web Font Loading, font-display, FOIT, FOUT, Variable Fonts, OpenType Variations, size-adjust]
category: ui-ux
group: visual
level: intermediate
summary: 웹폰트가 늦게 도착해도 글자가 사라지거나 레이아웃이 튀지 않게 font-display·preload·서브셋·대체 폰트 보정을 고르고, 여러 굵기를 가변 폰트 하나로 묶는 방법.
tags: [typography, web-performance, css, fonts, cls]
related: [ui-ux/typography-scale-rhythm, performance/core-web-vitals, cs-fundamentals/browser-rendering-pipeline]
sources:
  - https://web.dev/articles/font-best-practices
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts
updatedAt: 2026-11-19
---

## 문제

- 웹폰트를 받는 동안 브라우저는 글자를 안 보이게 두거나(FOIT), 대체 폰트로 보여 줬다가 바꾼다(FOUT). web.dev 에 따르면 기본 동작은 Chromium·Firefox 가 최대 3초 숨김, Safari 는 무기한 숨김이다.
- 대체 폰트와 웹폰트의 글자 폭·높이가 다르면 교체 순간 줄바꿈이 바뀌어 CLS 가 생긴다.
- Regular·Medium·Bold·Italic 을 따로 받으면 요청과 용량이 늘어난다.

## 해법

### 1. `font-display` 고르기

| 값 | 숨김(block) | 교체(swap) | 맞는 곳 |
| --- | --- | --- | --- |
| `swap` | 0ms | 무한 | 로고·브랜드 제목처럼 반드시 그 폰트여야 하는 곳 |
| `fallback` | 약 100ms | 약 3초 | 절충 |
| `optional` | 약 100ms | 없음 | 본문. 늦으면 이번 방문은 대체 폰트로 끝(성능 최우선) |
| `block` | 2~3초 | 무한 | 아이콘 폰트처럼 대체 글리프가 의미 없는 경우 |

(시간은 web.dev 기준. MDN 명세 설명은 "짧음/매우 짧음" 같은 상대 표현이다.)

### 2. 빨리 찾게, 적게 받게

```html
<link rel="preconnect" href="https://fonts.example.com" crossorigin>
<link rel="preload" href="/fonts/Inter-var.woff2" as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-var.woff2") format("woff2-variations");
  font-weight: 100 900;          /* 가변 폰트: 범위로 선언 */
  font-display: optional;
  unicode-range: U+0000-00FF;    /* 필요한 글리프 범위만 */
}
/* 대체 폰트 크기를 웹폰트에 맞춰 교체 시 흔들림을 줄인다 */
@font-face {
  font-family: "Inter-fallback";
  src: local("Arial");
  size-adjust: 107%;             /* 값은 두 폰트를 측정해 정한다 */
}
body { font-family: "Inter", "Inter-fallback", system-ui, sans-serif; }
```

- 형식은 WOFF2 (WOFF 대비 약 30% 더 압축, web.dev).
- 한글·CJK 폰트는 수 MB 라 서브셋·`unicode-range` 분할이 사실상 필수. 서브셋 전에 폰트 라이선스가 수정을 허용하는지 확인한다.

### 3. 가변 폰트

축(axis) 하나로 굵기·폭·기울기를 연속값으로 조절한다. 등록 축은 소문자 태그, 커스텀 축은 대문자 태그다.

| 축 | 태그 | 우선 쓰는 CSS 속성 |
| --- | --- | --- |
| 굵기 | `wght` | `font-weight: 550` |
| 폭 | `wdth` | `font-stretch: 90%` |
| 이탤릭 | `ital` | `font-style: italic` |
| 기울기 | `slnt` | `font-style: oblique 10deg` |
| 광학 크기 | `opsz` | `font-optical-sizing: auto` |

`font-variation-settings` 는 커스텀 축(예: `GRAD`)이나 표준 속성으로 못 쓰는 값에만 쓴다. 한 축만 바꿔도 전체를 다시 선언해야 하므로 축마다 CSS 변수로 나눠 두면 편하다(MDN).

## 언제 쓰나

- 브랜드 폰트를 도입할 때, LCP·CLS 가 폰트 때문에 나빠졌을 때.
- 3개 이상의 굵기·스타일을 쓴다면 가변 폰트를 검토한다. 1~2개만 쓰면 정적 폰트가 더 작을 수 있다.

## 체크리스트

- [ ] 첫 화면에 쓰이는 폰트 1개만 preload (preload 는 `unicode-range` 를 무시한다)
- [ ] 본문은 `optional` 또는 `fallback`, 브랜드 요소만 `swap`
- [ ] 대체 폰트에 `size-adjust` 등 메트릭 보정
- [ ] WOFF2 + 서브셋, 캐시 헤더 길게
- [ ] 아이콘은 아이콘 폰트 대신 SVG ([아이콘 시스템](/develop-wiki/knowledge/ui-ux/icon-system/))

## 흔한 실수

- 모든 굵기를 preload → 정작 HTML·CSS 다운로드를 늦춘다.
- `crossorigin` 없이 폰트 preload → 같은 파일을 두 번 받는다.
- 가변 폰트를 썼는데 `@font-face` 에 `font-weight: 400` 단일값 선언 → 굵기가 합성(faux bold)된다.
- `font-variation-settings: "wght" 700` 로 굵기 지정 → `font-weight` 상속·`<strong>` 과 어긋난다.

## 주의 (비용)

- 가변 폰트는 항상 작지 않다. 쓰는 굵기가 적으면 정적 파일 몇 개가 더 가볍다.
- 셀프 호스팅은 CDN·HTTP/2 를 갖췄을 때 이득이다. 아니면 폰트 서비스의 최적화(서브셋·WOFF2 자동 제공)가 더 나을 수 있다(web.dev).
- `optional` 은 첫 방문에 브랜드 폰트가 안 보일 수 있다는 디자인 측 합의가 필요하다.
