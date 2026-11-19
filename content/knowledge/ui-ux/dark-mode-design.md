---
title: 다크 모드 설계
aka: [Dark Mode, Dark Theme, prefers-color-scheme, color-scheme, light-dark()]
category: ui-ux
group: visual
level: intermediate
summary: 라이트 색을 단순 반전하지 않고, 의미 색 역할의 매핑을 바꿔 어두운 배경에서도 위계·대비·깊이를 유지하는 테마 설계와 CSS 구현(color-scheme, light-dark, prefers-color-scheme).
tags: [dark-mode, theming, color, css, accessibility]
related: [ui-ux/color-system-semantic-roles, ui-ux/color-contrast-wcag-apca, ui-ux/design-tokens]
sources:
  - https://developer.apple.com/design/human-interface-guidelines/dark-mode
  - https://m3.material.io/styles/color/roles
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark
updatedAt: 2026-11-19
---

## 문제

- 색을 `filter: invert()` 하거나 명도만 뒤집으면 브랜드색이 형광처럼 튀고, 그림자로 표현하던 깊이가 사라진다.
- 일부 화면만 다크 모드를 지원하면 폼 컨트롤·스크롤바·이미지가 하얗게 남아 번쩍인다.

## 해법

### 1. 설계 원칙

- **반전이 아니라 재매핑**: Apple HIG 는 다크 모드 색이 라이트의 반전이 아니며, 배경은 더 어둡게·전경은 더 밝게 조정된다고 설명한다.
- **깊이는 밝기로**: 어두운 화면에서는 그림자가 잘 안 보인다. Apple 은 base(뒤)·elevated(앞, 더 밝음) 두 배경 세트를, Material 3 는 `surface-container-lowest~highest` 5단계를 써서 위에 올라온 면을 더 밝게 한다.
- **채도 낮추기**: Apple HIG 는 어두운 환경에서 색이 더 밝고 진하게 보인다고 설명한다. 그래서 다크용 브랜드색은 더 밝고 덜 진한 톤을 쓴다. (예: `#2563eb` 는 흰 배경 5.17:1 이지만 `#121212` 배경에서는 3.62:1 로 본문 기준 미달)
- **순수 검정·순수 흰색 피하기**는 흔한 권장이지만 규범은 아니다. 대비는 숫자로 검사한다.
- **사용자 설정 존중**: Apple HIG 는 시스템 설정을 무시하는 앱 전용 테마 옵션을 피하라고 권한다(웹은 사이트 토글을 두는 경우가 많으므로 기본값을 시스템 설정으로).

### 2. CSS 구현

```html
<meta name="color-scheme" content="light dark"> <!-- 첫 페인트 번쩍임 방지 -->
```

```css
:root {
  color-scheme: light dark;           /* 폼 컨트롤·스크롤바·캔버스 색도 따라 바뀜 */
  --color-surface:    light-dark(#faf8ff, #121318);
  --color-on-surface: light-dark(#1a1b21, #e3e2e9);
  --color-primary:    light-dark(#3a5ba9, #b0c6ff);
}
/* 사용자가 사이트 토글로 고른 값이 시스템 설정보다 우선 */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }

/* light-dark() 미지원 브라우저용 대안 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* 다크 매핑 */ }
}
img.diagram { filter: none; }         /* 반전 필터를 일괄로 걸지 않는다 */
```

- `light-dark()` 는 `color-scheme` 에 light·dark 가 모두 있어야 동작한다. Baseline 2024(Newly available)라 구형 브라우저 대안이 필요할 수 있다.
- 위 예시 색은 표면/텍스트 14.42:1, 표면/primary 10.92:1 (WCAG 2.x 계산).

## 언제 쓰나

- 오래 읽는 앱, 야간 사용이 많은 앱, OS 다크 모드 사용자가 많은 서비스.
- 미디어 감상용처럼 UI 가 뒤로 물러나야 하는 화면은 다크 전용도 선택지다(Apple HIG 의 Stocks 예).

## 체크리스트

- [ ] 컴포넌트는 의미 색만 참조하고, 다크 테마는 매핑 파일 하나로 끝난다
- [ ] 텍스트·아이콘·포커스 링 대비를 다크에서도 검사
- [ ] 겹친 면(모달·메뉴·카드)이 밝기 차이로 구분된다
- [ ] 로고·일러스트·차트 색을 다크용으로 따로 확인 (투명 PNG 의 검은 선 등)
- [ ] 저장된 테마를 첫 페인트 전에 적용(인라인 스크립트 또는 서버 렌더)

## 흔한 실수

- 이미지까지 `invert()` → 사진이 음화가 된다.
- 라이트용 그림자 토큰을 그대로 사용 → 깊이가 사라진다.
- 테마 값을 JS 로 하이드레이션 후 적용 → 라이트로 깜빡였다 다크로 바뀜.
- `color-scheme` 누락 → 다크 배경에 흰 기본 입력란.

## 주의 (비용)

- 테마가 둘이 되면 시각 회귀 테스트·디자인 검수 범위가 두 배가 된다. 의미 색 층이 없으면 비용이 폭증한다.
- 다크 모드에서 고대비·투명도 줄이기 설정이 겹치면 예상 밖으로 대비가 떨어지는 곳이 생긴다(Apple HIG). 조합별로 확인한다.
