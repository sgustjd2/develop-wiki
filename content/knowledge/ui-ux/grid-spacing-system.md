---
title: 그리드·스페이싱 시스템 (4/8pt)
aka: [Spacing System, 8pt Grid, 4pt Grid, Baseline Grid, Layout Grid, Spacing Scale]
category: ui-ux
group: visual
level: beginner
summary: 여백·크기를 4 또는 8의 배수 단계로만 쓰고, 열(column) 그리드로 정렬 기준선을 공유해 화면 간 리듬과 정렬을 맞추는 레이아웃 규칙.
tags: [layout, spacing, grid, visual-design, design-tokens]
related: [ui-ux/visual-hierarchy, ui-ux/responsive-adaptive-container-queries, ui-ux/design-tokens, ui-ux/typography-scale-rhythm]
sources:
  - https://m2.material.io/design/layout/spacing-methods.html
  - https://m3.material.io/foundations/layout/grids-spacing/spacing
  - https://m3.material.io/foundations/layout/grids-spacing/grids
  - https://developer.apple.com/design/human-interface-guidelines/layout
updatedAt: 2026-11-19
---

## 문제

- 여백이 13px, 15px, 22px 처럼 제각각이면 미세하게 어긋난 정렬이 쌓여 "왠지 정돈되지 않은" 화면이 된다.
- 디자이너와 개발자가 매번 간격 수치를 주고받느라 핸드오프가 느려진다.

## 해법

### 1. 스페이싱 스케일

기본 단위(4 또는 8)의 배수로만 간격을 쓴다. Material(2판)은 컴포넌트를 8dp 정사각 그리드에, 아이콘·텍스트·컴포넌트 내부 요소는 4dp 그리드에, 텍스트 베이스라인은 4dp 베이스라인 그리드에 맞추도록 안내했다.

```css
:root {
  --space-1: 0.25rem; /* 4  */
  --space-2: 0.5rem;  /* 8  */
  --space-3: 0.75rem; /* 12 */
  --space-4: 1rem;    /* 16 */
  --space-6: 1.5rem;  /* 24 */
  --space-8: 2rem;    /* 32 */
  --space-12: 3rem;   /* 48 */
}
.card       { padding: var(--space-4); display: grid; gap: var(--space-2); }
.card-group { display: grid; gap: var(--space-6); }  /* 그룹 사이 > 그룹 안 */
```

- **간격이 관계를 말한다**: 관련 요소는 가깝게(implicit grouping), 무관한 그룹은 멀게. 경계선·카드(explicit grouping)는 근접만으로 부족할 때만 쓴다(Material 3).
- 큰 값으로 갈수록 단계 간격을 넓힌다(4, 8, 12, 16, 24, 32, 48 …). 작은 쪽은 4 단위 조정이 필요하다.

### 2. 레이아웃 그리드

- 열 수·거터·마진을 화면 폭 구간마다 정한다. Material 3 는 브레이크포인트에 따라 열 수·폭·간격이 바뀌는 그리드 위에 바·레일·패널을 배치하고, 정렬 기준선(rulers)을 공유하라고 한다.
- Apple HIG 는 정렬과 들여쓰기로 위계를 표현하고, 관련 항목을 여백·컨테이너·구분선으로 묶으라고 권한다. 시스템이 제공하는 레이아웃 가이드·안전 영역(safe area)을 따른다.

```css
.layout {
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr));
  gap: var(--space-4);
  padding-inline: var(--space-4);
}
@media (width >= 600px) { .layout { --cols: 8; padding-inline: var(--space-6); } }
@media (width >= 840px) { .layout { --cols: 12; } }
```

## 언제 쓰나

- 디자인 시스템의 첫 토큰 세트(색·타입·간격)를 정할 때.
- 여러 팀이 같은 제품의 다른 화면을 만들 때 정렬 기준을 공유하려면.

## 체크리스트

- [ ] 코드에 스케일 밖 간격(예: `margin: 13px`)이 없다 — 린트로 막을 수 있다
- [ ] 그룹 내부 간격 < 그룹 사이 간격
- [ ] 텍스트 행간도 4의 배수로 맞춰 베이스라인 리듬 유지(타입 스케일과 함께 설계)
- [ ] 화면 가장자리 마진이 브레이크포인트별로 정의돼 있다

## 흔한 실수

- 1px 테두리를 고려하지 않아 실제 높이가 4의 배수에서 1~2px 어긋남 → `box-sizing: border-box` 와 테두리 포함 높이로 설계.
- 그리드를 감옥처럼 적용해 광학 정렬(아이콘·둥근 모양은 수치보다 약간 이동해야 맞아 보임)을 막음.
- 간격 토큰 이름을 수치로(`--space-16px`) 지음 → 밀도 모드에서 값을 바꾸면 이름이 거짓이 된다.

## 주의 (비용)

- 4/8 단위는 관행이지 표준이 아니다. 중요한 것은 **팀이 하나의 스케일을 공유**하는 것이다.
- 밀도가 높은 업무용 UI 는 8 단위가 너무 성길 수 있다. 밀도 모드(compact/comfortable)를 토큰으로 분리하는 방법이 있다(Material 3 의 density).
