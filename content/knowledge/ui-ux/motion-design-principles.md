---
title: 모션 디자인 원칙 — 지속시간·이징·모션 줄이기
aka: [Motion Design, UI Animation, Duration, Easing, Spring Animation, prefers-reduced-motion, Reduce Motion]
category: ui-ux
group: visual
level: intermediate
summary: UI 애니메이션은 상태 변화와 공간 관계를 설명할 때만 짧게 쓰고, 이징·스프링으로 자연스럽게 만들며, 사용자의 모션 줄이기 설정(prefers-reduced-motion)을 존중한다.
tags: [motion, animation, css, accessibility, material-design]
related: [cs-fundamentals/browser-rendering-pipeline, ui-ux/design-tokens, graphics-xr/vr-motion-sickness-ux, performance/core-web-vitals, ui-ux/microinteractions]
sources:
  - https://www.nngroup.com/articles/animation-duration/
  - https://developer.apple.com/design/human-interface-guidelines/motion
  - https://m3.material.io/styles/motion/overview/how-it-works
  - https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-motion.scss
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
  - https://www.w3.org/TR/WCAG22/
updatedAt: 2026-11-19
---

## 문제

- 길고 화려한 전환은 반복될수록 사용자를 기다리게 만든다.
- 크게 확대·이동·패럴랙스하는 움직임은 전정 장애가 있는 사람에게 어지럼·메스꺼움을 일으킨다.
- `left`·`width` 를 애니메이션하면 매 프레임 레이아웃이 다시 돌아 끊긴다.

## 해법

### 1. 목적이 있을 때만

- 상태 변화 피드백(눌림, 토글), 공간 관계 설명(패널이 어디서 왔다 어디로 가는지), 주의 유도에만 쓴다.
- 자주 일어나는 상호작용일수록 짧고 조용하게. Apple HIG 는 빈번한 UI 상호작용에 커스텀 모션을 더하지 말고, 모션을 정보 전달의 유일한 수단으로 쓰지 말라고 한다.

### 2. 지속시간

| 상황 | NN/g 권장 |
| --- | --- |
| 체크박스·토글 같은 즉시 피드백 | 약 100ms |
| 모달 등장, 화면 안으로 이동하는 큰 변화 | 약 200~300ms |
| 큰 화면을 가로지르는 이동 | 최대 400ms. 500ms 부근부터 느리게 느껴짐 |
| 등장 vs 퇴장 | 퇴장을 조금 더 짧게 |

Material 3 의 기존 duration 토큰은 short1~4(50~200ms), medium1~4(250~400ms), long1~4(450~600ms), extra-long1~4(700~1000ms)다.

### 3. 이징과 스프링

- 선형(linear)은 기계적으로 보인다. 들어오는 요소는 감속(ease-out), 나가는 요소는 가속(ease-in)(NN/g).
- Material 3 easing 토큰 예: standard `cubic-bezier(0.2, 0, 0, 1)`, emphasized-decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)`, emphasized-accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)`.
- 2025-05 M3 Expressive 부터 Material 은 **스프링 기반 물리 시스템**(stiffness·damping, spatial/effects × fast/default/slow 토큰)을 도입했다. MDC-Android 문서는 기존 duration·easing 토큰과 스프링 토큰을 나란히 제공한다(m3.material.io 원문의 "대체" 범위는 확인하지 못함). 스프링은 중간에 끊기거나 목표가 바뀌어도 자연스럽게 이어진다.

```css
:root {
  --motion-short: 150ms;
  --motion-medium: 250ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
}
.sheet { transition: transform var(--motion-medium) var(--ease-decelerate); } /* transform·opacity 만 */

@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity var(--motion-short) linear; } /* 이동 대신 페이드 */
  * { scroll-behavior: auto !important; }
}
```

```ts
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
el.animate([{ transform: 'scale(.96)' }, { transform: 'none' }],
  { duration: reduce ? 0 : 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
```

### 4. 모션 줄이기 = 없애기가 아니다

- 크기 변화·이동·회전을 페이드나 즉시 전환으로 **대체**한다. 로딩 스피너처럼 상태를 알리는 움직임은 남겨도 된다.
- WCAG: 2.2.2(A) 자동으로 시작해 5초 넘게 움직이는 콘텐츠는 멈춤·숨김 수단 제공. 2.3.3(AAA) 상호작용으로 생기는 모션은 꺼질 수 있어야 함.

## 언제 쓰나

- 디자인 시스템에 duration·easing(또는 spring) 토큰을 정의해 컴포넌트가 공유하게 할 때.
- 화면 전환·시트·토스트처럼 "어디서 왔는지" 설명이 필요한 요소.

## 체크리스트

- [ ] 모든 애니메이션 값은 모션 토큰에서 온다
- [ ] `transform`·`opacity` 만 애니메이션 (레이아웃 속성 금지)
- [ ] `prefers-reduced-motion: reduce` 대안이 있다 (CSS 와 JS 애니메이션 모두)
- [ ] 자동 재생 캐러셀·배경 영상에 정지 버튼
- [ ] 애니메이션 도중 입력이 막히지 않는다 (중단·재지정 가능)

## 흔한 실수

- 등장 600ms + 퇴장 600ms → 메뉴 하나 여닫는 데 1초 넘게 대기.
- 모든 버튼 호버에 튀는 바운스.
- 모션 줄이기를 `animation: none` 일괄 적용 → 상태 전달용 표시까지 사라짐.
- JS 애니메이션 라이브러리 사용 시 미디어 쿼리 확인 누락.

## 주의 (비용)

- 모션은 구현·QA 비용이 크고 기기 성능 편차를 드러낸다. 저사양 기기에서 프레임 드랍을 확인한다.
- 스프링은 지속시간이 결과값이라 "정확히 300ms" 같은 사양을 맞추기 어렵다. 디자인 도구와 코드가 같은 스프링 파라미터를 쓰도록 토큰화한다.
