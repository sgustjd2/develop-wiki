---
title: 터치 타깃 크기 (WCAG 2.5.8 vs 2.5.5, 플랫폼 가이드)
aka: [Target Size, Touch Target, Hit Area, Tap Target, WCAG 2.5.8, WCAG 2.5.5, 터치 영역]
category: ui-ux
group: accessibility
level: beginner
summary: 누르는 대상의 최소 크기와 간격 기준. WCAG 2.5.8(AA, 24×24 CSS px), 2.5.5(AAA, 44×44), Apple HIG(44×44 pt 기본), Android/Material(48×48 dp)을 비교한다.
tags: [accessibility, a11y, touch, target-size, wcag, mobile]
related: [ui-ux/fitts-hicks-law, ui-ux/wcag-22-overview, ui-ux/keyboard-focus-management, mobile-dev/mobile-accessibility-basics, ui-ux/material3-vs-apple-hig]
sources:
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
  - https://developer.apple.com/design/human-interface-guidelines/accessibility
  - https://developer.android.com/develop/ui/compose/accessibility/api-defaults
  - https://support.google.com/accessibility/android/answer/7101858
updatedAt: 2026-11-19
---

## 문제

- 손 떨림·관절 장애가 있는 사용자, 이동 중인 사용자, 큰 손가락은 작은 아이콘을 정확히 누르기 어렵다. 옆 버튼을 잘못 누르면 되돌리기 어려운 동작(삭제, 전송)이 실행되기도 한다.
- 크기 기준이 여러 개라 팀마다 "24? 44? 48?" 로 의견이 갈린다. 각 수치의 **단위·성격(최소 요건 vs 권장 기본값)** 이 다르다.

## 해법 — 기준 비교

| 기준 | 수치 | 성격 |
| --- | --- | --- |
| WCAG 2.2 **2.5.8 Target Size (Minimum)** | 24×24 CSS px | **AA 요건.** 예외 5가지 |
| WCAG 2.1/2.2 **2.5.5 Target Size (Enhanced)** | 44×44 CSS px | AAA. 중요한 컨트롤에 권장 |
| Apple HIG (iOS·iPadOS) | 기본 44×44 pt, 최소 28×28 pt | 플랫폼 권장. 간격도 크기만큼 중요 |
| Android / Material | 48×48 dp | 접근성 가이드 권장. Material 컴포넌트는 패딩으로 자동 확보 |

HIG 표는 플랫폼마다 다르다(macOS 기본 28×28·최소 20×20 pt, visionOS 기본 60×60 pt 등). HIG 는 테두리 있는 요소 주변 약 12pt, 테두리 없는 요소 주변 약 24pt 여백을 권한다.

### 2.5.8 의 판정 방법

- 타깃 안에 축 정렬된 24×24 정사각형이 들어가면 통과.
- 더 작으면 **간격 예외**: 타깃 경계 상자 중심에 지름 24px 원을 그려, 다른 타깃이나 다른 작은 타깃의 원과 겹치지 않으면 통과.
- 그 밖의 예외: 같은 기능을 하는 충분한 크기의 다른 컨트롤이 같은 페이지에 있음(Equivalent), 문장 속 인라인 링크(Inline), 브라우저 기본 컨트롤을 작성자가 바꾸지 않음(User Agent Control), 그 크기가 본질적임(Essential, 예: 지도 핀).

### 구현 — 보이는 크기와 누르는 영역을 분리

```css
/* 아이콘은 20px 로 보이되 누르는 영역은 44px */
.icon-button {
  inline-size: 44px; block-size: 44px;
  display: inline-grid; place-items: center;
}
.icon-button svg { inline-size: 20px; block-size: 20px; }

/* 레이아웃을 못 바꿀 때: 가상 요소로 히트 영역만 확장 */
.compact-link { position: relative; }
.compact-link::after { content: ""; position: absolute; inset: -10px; }
```

- 확장한 히트 영역끼리 겹치지 않게 한다. 겹치면 어느 쪽이 눌릴지 예측할 수 없다.
- 키보드 포커스 링은 보이는 요소가 아니라 확장된 영역 기준으로 보일 수 있으니 확인한다.

## 언제 쓰나

- 아이콘 버튼, 목록 행 안 보조 동작(더보기 ⋯, 즐겨찾기), 표 안 체크박스, 페이지네이션 숫자, 닫기 버튼, 슬라이더 손잡이.
- 데이터 밀도가 높은 화면(표·툴바)을 설계할 때: 밀도를 높여도 2.5.8 의 간격 예외로 통과할 수 있는지 계산한다. → [데이터 테이블](/develop-wiki/knowledge/ui-ux/data-table-density/)

## 체크리스트

- 디자인 시스템 토큰에 최소 타깃 크기(웹 24px 하한, 터치 우선 화면 44px/48dp 목표)를 정의했다.
- 파괴적 동작 버튼은 다른 버튼과 충분히 떨어져 있다.
- 브라우저 확대 200%·모바일 실기기에서 눌러 봤다.
- 인라인 링크는 예외지만, 줄 간격이 좁은 링크 목록은 예외가 아니다.

## 흔한 실수·주의

- **24px 를 "목표"로 삼음.** 2.5.8 은 최소선이다. 터치 중심 화면은 플랫폼 가이드(44pt/48dp)를 따르는 편이 실제 오조작을 줄인다. [Fitts 법칙](/develop-wiki/knowledge/ui-ux/fitts-hicks-law/)대로 크고 가까울수록 빠르고 정확하다.
- **단위 혼동.** CSS px, pt(iOS), dp(Android)는 모두 밀도 독립 단위지만 서로 같은 값이 아니다. 문서에 단위를 명시한다.
- **보이는 크기만 키움.** 시각적으로 크게 만들면 정보 밀도가 떨어진다. 히트 영역만 넓히는 방법이 있다.
- **Apple 44pt 를 "최소"로 인용.** 현재 HIG 표에서 44×44 pt 는 iOS 기본 크기이고 최소는 28×28 pt 다. 문서를 인용할 때 원문 표를 확인한다.
