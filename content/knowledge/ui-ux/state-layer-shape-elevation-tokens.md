---
title: 상태 레이어·shape·elevation 토큰
aka: [State Layer, Shape Tokens, Corner Radius Scale, Elevation Tokens, Material 3 Tokens, Interaction States]
category: ui-ux
group: design-system
level: intermediate
summary: 호버·포커스·눌림 상태를 요소 위에 반투명 색을 덮는 규칙으로 표현하고, 모서리 반경과 높이(깊이)를 단계 토큰으로 정의해 컴포넌트 전반에 일관되게 적용하는 방법.
tags: [design-system, design-tokens, material-3, state-layer, elevation, shape]
related: [ui-ux/design-tokens, ui-ux/color-system-semantic-roles, ui-ux/material3-vs-apple-hig, ui-ux/component-api-variants-slots, ui-ux/microinteractions, ui-ux/dark-mode-design]
sources:
  - https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-state.scss
  - https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-shape.scss
  - https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-elevation.scss
  - https://m3.material.io/foundations/interaction/states/state-layers
  - https://www.designtokens.org/TR/2025.10/format/
updatedAt: 2026-11-19
---

## 문제

- 버튼마다 hover 색을 따로 정하면 컴포넌트가 늘수록 수십 개의 색이 생기고 테마(다크, 브랜드)를 바꿀 때 전부 다시 정해야 한다.
- 모서리 반경·그림자 값이 컴포넌트마다 제각각이어서 화면이 정돈되어 보이지 않는다.

## 해법

### 1. 상태 레이어 (state layer)

요소의 **기본 색 위에 "의미 색"을 정해진 투명도로 덮어** 상태를 표현한다. 기본 색이 무엇이든 같은 규칙으로 호버·포커스·눌림이 나온다.

Material Web(v0_192 토큰)의 기본값. 이 노트는 이 소스 파일로 숫자를 확인했다(m3.material.io 문서 페이지는 스크립트 렌더링이라 본문을 읽지 못했다).

| 상태 | 불투명도 |
| --- | --- |
| hover | 0.08 |
| focus | 0.12 |
| pressed | 0.12 |
| dragged | 0.16 |

레이어 색은 보통 그 요소 위의 "내용 색(on-색)" 또는 요소 색 계열에서 정한다. 비활성(disabled)은 상태 레이어가 아니라 별도 규칙(내용 불투명도 감소)이다.

```css
.btn { --layer: var(--md-sys-color-on-primary); background: var(--md-sys-color-primary); position: relative; }
.btn::before { content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: var(--layer); opacity: 0; pointer-events: none; transition: opacity 120ms; }
.btn:hover::before { opacity: var(--state-hover, 0.08); }
.btn:focus-visible::before { opacity: var(--state-focus, 0.12); }
.btn:active::before { opacity: var(--state-pressed, 0.12); }
```

- 흰색 위 보라(`#6750a4`) 레이어를 0.08/0.12/0.16 로 합성한 결과(node 계산): `#f3f1f8`, `#edeaf4`, `#e7e3f0`. 상태 레이어는 **포커스 표시를 대체하지 않는다**. 키보드 포커스는 별도의 포커스 링이 필요하다([키보드·포커스](/develop-wiki/knowledge/ui-ux/keyboard-focus-management/)). 위 CSS 는 렌더링을 브라우저에서 시험하지 않은 예시다.
- 레이어 합성 후에도 텍스트 대비를 유지해야 한다(레이어가 밝기를 바꾼다).

### 2. shape (모서리 반경 척도)

Material Web 의 corner 토큰 값(같은 소스 확인): none 0, extra-small 4px, small 8px, medium 12px, large 16px, extra-large 28px, full 9999px. 상단만 둥근 변형(`large-top` 등)은 4값 묶음으로 정의된다.

- 컴포넌트에는 `radius-card` 같은 **컴포넌트 토큰**이 `shape-medium` 같은 **시스템 토큰**을 가리키게 한다(별칭, [디자인 토큰](/develop-wiki/knowledge/ui-ux/design-tokens/)).
- 중첩 둥근 요소는 안쪽 반경 = 바깥 반경 − 여백이 자연스럽다(시각 조정 원칙이며 소스 문서에서 확인한 규칙이 아니다).

### 3. elevation (높이 단계)

Material Web 의 `level0~5` 가 가리키는 높이 값은 0, 1, 3, 6, 8, 12 (dp 단위로 해석되는 값. 같은 소스에서 확인). 그림자는 이 단계에서 파생되며, 다크 테마에서는 그림자 대신 표면 색조(tonal surface)로 높이를 표현하는 접근이 쓰인다(M3 문서 설명이지만 이 노트에서 해당 페이지를 읽지 못해 확인되지 않았다).

- 높이는 의미(떠 있음 = 상호작용·우선순위)와 연결한다. 모든 카드에 그림자를 주면 계층이 사라진다([시각 계층](/develop-wiki/knowledge/ui-ux/visual-hierarchy/)).

### 4. DTCG 로 표현

```json
{
  "state": { "hover":   { "$type": "number", "$value": 0.08 },
             "focus":   { "$type": "number", "$value": 0.12 } },
  "shape": { "medium":  { "$type": "dimension", "$value": { "value": 12, "unit": "px" } } },
  "shadow": { "level1": { "$type": "shadow", "$value": { "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.2, "hex": "#000000" }, "offsetX": {"value":0,"unit":"px"}, "offsetY": {"value":1,"unit":"px"}, "blur": {"value":3,"unit":"px"}, "spread": {"value":0,"unit":"px"} } } }
}
```

- `number`·`dimension`·`shadow` 타입 존재와 값 구조는 DTCG Format 모듈 2025.10 기준으로 쓴 것이나, 이 노트에서 shadow 의 정확한 속성 스키마를 직접 검증하지 못했다. 사용하는 변환 도구의 지원 범위를 확인한다.

## 언제 쓰나

- 컴포넌트가 열 개 이상이고 테마·브랜드가 둘 이상일 때. 상태 규칙을 한 곳에서 바꿔 전체에 반영하고 싶을 때.
- 작은 앱 하나라면 CSS 변수 몇 개로 충분하다.

## 체크리스트

- [ ] 상태 불투명도·반경·높이가 시스템 토큰이고 컴포넌트가 참조한다
- [ ] 포커스 링은 상태 레이어와 별개로 존재하고 3:1 대비
- [ ] 다크·고대비에서 상태 변화가 보인다(그림자 의존 금지)
- [ ] disabled·selected·dragged 등 상태 조합 규칙이 문서화되어 있다
- [ ] 터치 환경에서 hover 가 "고착"되지 않는다(`@media (hover: hover)`)

## 흔한 실수

- 상태마다 새 hex 색을 정의 → 테마 확장이 불가능해진다.
- 오버레이가 클릭을 가로챈다(`pointer-events: none` 누락).
- hover 만 있고 키보드 포커스 상태가 없다.
- 반경 토큰 없이 임의 px 사용, 가장 바깥/안쪽 반경 불일치.
