---
title: 브라우저 렌더링 파이프라인
aka: [Critical Rendering Path, DOM, CSSOM, Render Tree, Layout, Reflow, Paint, Compositing, Layout Thrashing]
category: cs-fundamentals
group: web
level: intermediate
summary: HTML·CSS·JS 가 화면의 픽셀이 되기까지의 단계(DOM·CSSOM → 렌더 트리 → 레이아웃 → 페인트 → 합성). 어떤 변경이 어느 단계부터 다시 돌게 하는지가 웹 성능을 정한다.
tags: [web, browser, rendering, performance, css, core-web-vitals]
related: [cs-fundamentals/event-loop, cs-fundamentals/http-versions, cs-fundamentals/http-caching]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path
  - https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
  - https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
updatedAt: 2026-11-18
---

## 파이프라인

```
HTML ──파싱──▶ DOM ─┐
                    ├─▶ 스타일 계산 ─▶ 렌더 트리 ─▶ 레이아웃 ─▶ 페인트 ─▶ 합성 ─▶ 화면
CSS  ──파싱──▶ CSSOM┘     (보이는 노드만)   (크기·위치)  (픽셀 그리기) (레이어 합치기, GPU)
          ▲
 JS 가 DOM/CSSOM 을 읽고 고침 (메인 스레드)
```

| 단계 | 하는 일 | 다시 돌게 만드는 것 |
| --- | --- | --- |
| DOM | HTML 을 점진적으로 트리로 | DOM 조작 |
| CSSOM | CSS 를 트리로. 뒤 규칙이 앞을 덮을 수 있어 **점진적이지 않음** | 스타일시트 추가 |
| 렌더 트리 | DOM+CSSOM, `display:none` 과 `<head>` 제외 | |
| 레이아웃(리플로) | 모든 요소의 크기·위치 계산 | `width`, `top`, 글꼴, 내용 변경, 뷰포트 크기 |
| 페인트 | 텍스트·색·그림자를 픽셀로 | `color`, `background`, `box-shadow` |
| 합성 | 레이어를 합쳐 표시 | `transform`, `opacity` 만 바뀌면 **여기만** |

## 막히는 지점

- **CSS 는 렌더링을 막는다**: CSSOM 이 완성되기 전에는 그리지 않는다(어떤 규칙이 덮을지 모르므로).
- **일반 `<script>` 는 파서를 막는다**: 내려받아 실행할 때까지 HTML 파싱이 멈춘다.

| 스크립트 | 다운로드 | 실행 시점 | 순서 |
| --- | --- | --- | --- |
| `<script>` | 파싱 중단 | 즉시 | 문서 순서 |
| `async` | 병렬 | 받는 즉시 (파싱 중단) | 보장 안 됨 |
| `defer` | 병렬 | 파싱 끝난 뒤 | 문서 순서 |
| `type="module"` | 병렬 | 기본 defer 처럼 | 문서 순서 |

## 개발자에게 왜 중요한가

### 레이아웃 스래싱

스타일을 바꾼 직후 `offsetHeight` 같은 레이아웃 값을 읽으면, 브라우저는 정확한 값을 위해 그 자리에서 레이아웃을 강제로 돌린다(forced synchronous layout). 루프 안에서 읽기·쓰기를 번갈아 하면 매번 반복된다.

```ts
// 나쁨: 쓰기 → 읽기 반복 → 매 반복마다 강제 레이아웃
for (const el of items) {
  el.style.width = `${box.offsetWidth / 2}px`;
}

// 좋음: 읽기를 먼저 모으고, 쓰기는 한꺼번에
const half = box.offsetWidth / 2;
for (const el of items) el.style.width = `${half}px`;
```

web.dev 는 DevTools 의 Forced Reflow 인사이트와 Long Animation Frame API 의 `forcedStyleAndLayoutDuration` 으로 이를 찾으라고 안내한다.

### 애니메이션은 합성 단계 속성으로

`transform`·`opacity` 만 바꾸면 레이아웃·페인트를 건너뛰고 합성만 다시 한다. `left`/`top`/`width` 애니메이션은 매 프레임 레이아웃을 돌린다.

```css
/* 나쁨 */ .panel { transition: left 200ms; }
/* 좋음 */ .panel { transition: transform 200ms; }
```

### 프레임 예산

60Hz 화면이면 프레임당 약 16.7ms 안에 JS·스타일·레이아웃·페인트·합성을 끝내야 한다. JS 가 메인 스레드를 오래 잡으면 렌더링 자체가 밀린다. [이벤트 루프](/develop-wiki/knowledge/cs-fundamentals/event-loop/) 참고.

## 언제 신경 쓰나

- LCP(첫 화면 표시)가 느릴 때 → 렌더 차단 CSS·JS 줄이기, 중요한 리소스 preload.
- 스크롤·애니메이션이 끊길 때 → Performance 패널에서 Layout/Paint 비중 확인.
- INP(입력 반응)가 나쁠 때 → 긴 작업 쪼개기, 레이아웃 스래싱 제거.

## 주의 (비용)

- `will-change` 나 `translateZ(0)` 로 레이어를 무작정 늘리면 레이어마다 메모리와 GPU 텍스처 업로드 비용이 든다. web.dev 는 애니메이션할 요소만 승격하라고 권한다.
- 측정 없이 최적화하지 않는다. 대부분의 페이지 문제는 렌더링보다 큰 JS 번들과 느린 네트워크에서 온다.
- 프레임워크(React 등)가 DOM 갱신을 묶어 주지만, 렌더 중 레이아웃 값을 읽는 코드(`useLayoutEffect` 안 측정 등)는 여전히 강제 레이아웃을 만든다.
