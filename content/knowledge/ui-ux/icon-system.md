---
title: 아이콘 시스템
aka: [Icon System, Interface Icons, Glyphs, SVG Icons, Icon Font, SF Symbols, Material Symbols]
category: ui-ux
group: visual
level: beginner
summary: 인터페이스 아이콘의 크기·선 굵기·모서리·은유를 하나의 규칙으로 맞추고, 웹에서는 SVG 컴포넌트로 배포하며 접근 가능한 이름을 붙이는 방법.
tags: [icons, svg, visual-design, accessibility, design-system]
related: [ui-ux/visual-hierarchy, ui-ux/grid-spacing-system, ui-ux/web-font-loading-variable-fonts, ui-ux/design-system-structure, ui-ux/screen-reader-accessible-name, ui-ux/touch-target-size]
sources:
  - https://developer.apple.com/design/human-interface-guidelines/icons
  - https://developer.apple.com/design/human-interface-guidelines/sf-symbols
  - https://developers.google.com/fonts/docs/material_symbols
  - https://github.com/google/material-design-icons
  - https://web.dev/articles/font-best-practices
  - https://www.w3.org/TR/WCAG22/
updatedAt: 2026-11-19
---

## 문제

- 여러 출처의 아이콘을 섞으면 선 굵기·모서리·시점이 달라 화면이 산만해진다.
- 아이콘만 있는 버튼은 화면 낭독기가 "버튼"이라고만 읽는다.
- 아이콘 폰트는 로딩 실패 시 엉뚱한 글자(리거처 텍스트)가 보이고, 색·애니메이션 제어가 제한적이다.

## 해법

### 1. 디자인 규칙

- **일관성**: 크기, 디테일 수준, 선 굵기, 시점(정면/입체)을 통일한다(Apple HIG). 인접 텍스트와 굵기를 맞춘다.
- **크기 단계**: 보통 16·20·24 처럼 몇 단계만 두고 그리드(4 단위)에 맞춘다. 작은 크기용은 획을 단순화한 별도 그리기를 두기도 한다(광학 크기).
- **광학 정렬**: 비대칭 아이콘(다운로드·재생)은 기하학적 중앙보다 약간 옮겨야 가운데로 보인다. Apple 은 이 보정을 여백에 포함해 자산을 만들라고 권한다.
- **은유는 익숙한 것**: 직접 관련된 친숙한 비유를 쓴다. 뜻이 모호하면 텍스트 라벨을 붙인다.

### 2. 플랫폼 아이콘 세트

| | SF Symbols (Apple) | Material Symbols (Google) |
| --- | --- | --- |
| 형태 | 시스템 심볼, 텍스트와 굵기·크기 연동 | 가변 폰트 + SVG/Vector Drawable 배포 |
| 변형 | 렌더링 모드 4종: monochrome·hierarchical·palette·multicolor | 스타일 3종(Outlined·Rounded·Sharp), 축 FILL·wght(100~700)·GRAD·opsz(20~48) |
| 라이선스 | Apple 약관. 앱 아이콘·로고 등 상표성 사용 금지 | Apache 2.0 |

### 3. 웹 구현: SVG 컴포넌트

```tsx
type IconProps = { name: 'search' | 'close'; size?: 16 | 20 | 24; label?: string };

export function Icon({ name, size = 20, label }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2}      // 텍스트 색 상속
         role={label ? 'img' : undefined}
         aria-hidden={label ? undefined : true}     // 장식용이면 숨김
         aria-label={label}>
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

// 아이콘만 있는 버튼: 이름은 버튼에 붙인다
<button type="button" aria-label="검색"><Icon name="search" /></button>
```

- `currentColor` 로 색을 상속시키면 다크 모드·상태색에 따로 손댈 필요가 없다.
- web.dev 는 가능하면 아이콘 폰트 대신 SVG 를 쓰라고 권한다(대체 폰트가 아이콘과 전혀 다르게 보이므로).

## 언제 쓰나

- 디자인 시스템 초기에 아이콘 출처를 하나로 정할 때. 커스텀 아이콘이 필요하면 기존 세트의 그리드·굵기 규칙을 그대로 따른다.

## 체크리스트

- [ ] 아이콘만 있는 버튼·링크에 접근 가능한 이름(`aria-label` 또는 숨김 텍스트)이 있다
- [ ] 장식용 아이콘은 `aria-hidden="true"`
- [ ] 의미 있는 아이콘은 배경과 3:1 이상 (WCAG 1.4.11)
- [ ] 클릭 영역은 아이콘 크기가 아니라 버튼 크기로 확보 (WCAG 2.5.8 최소 24×24 CSS px, Apple 은 44×44pt 권장)
- [ ] 같은 의미에 같은 아이콘, 다른 의미에 같은 아이콘을 쓰지 않는다

## 흔한 실수

- 20px 아이콘에 20px 클릭 영역 → 모바일에서 오조작.
- 아이콘 SVG 에 `fill="#333"` 하드코딩 → 다크 모드에서 사라짐.
- 장식 아이콘과 라벨이 모두 읽혀 "돋보기 아이콘 검색"처럼 중복 낭독.
- SF Symbols 를 웹 서비스나 로고에 사용(라이선스 범위 확인 필요).

## 주의 (비용)

- 아이콘 세트를 직접 만들면 그리기·검수·유지 비용이 크다. 기존 오픈 세트를 기반으로 부족분만 추가하는 편이 보통 싸다.
- SVG 스프라이트 하나에 수백 개를 넣으면 첫 로드가 무거워진다. 사용하는 아이콘만 번들하거나 개별 import 로 트리 셰이킹한다.
