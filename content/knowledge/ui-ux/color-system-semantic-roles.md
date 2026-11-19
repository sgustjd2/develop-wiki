---
title: 색 체계 — 팔레트와 의미 색(역할)
aka: [Color System, Color Palette, Semantic Color, Color Roles, Tonal Palette, Primitive vs Semantic Color]
category: ui-ux
group: visual
level: intermediate
summary: 원시 팔레트(파랑 50~900 같은 단계)와 의미 색(primary, surface, error, on-primary 같은 역할)을 분리해, 테마·다크 모드·대비 설정이 바뀌어도 컴포넌트 코드는 그대로 두는 색 설계.
tags: [color, visual-design, design-tokens, theming, material-design]
related: [ui-ux/color-contrast-wcag-apca, ui-ux/dark-mode-design, ui-ux/design-tokens, ui-ux/visual-hierarchy]
sources:
  - https://m3.material.io/styles/color/roles
  - https://m3.material.io/styles/color/system/how-the-system-works
  - https://developer.apple.com/design/human-interface-guidelines/color
  - https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
updatedAt: 2026-11-19
---

## 문제

- 컴포넌트에 `#2563eb` 를 직접 쓰면 브랜드 색 변경·다크 모드·고대비 모드마다 수백 곳을 고친다.
- 같은 파랑이 "링크", "선택됨", "정보 배지"에 섞여 쓰이면 색이 뜻을 잃는다. Apple HIG 도 같은 색을 다른 의미로 쓰지 말라고 한다.

## 해법 — 두 층으로 나눈다

```
원시(primitive) 팔레트          의미(semantic) 역할                 컴포넌트
blue-40, blue-90, gray-10 … ─▶ primary, on-primary, surface … ─▶ Button.bg = primary
 (값만 있음, 뜻 없음)            (뜻만 있음, 테마마다 다른 값을 가리킴)
```

- **팔레트**: 색상(hue)마다 명도 단계를 만든다. Material 3 는 HCT 색 공간의 tone 0(검정)~100(흰색) 단계(10 간격 + 95·98·99 등)로 톤 팔레트를 만든다.
- **역할**: Material 3 는 primary·secondary·tertiary·error·surface·outline 6개 묶음, 26개 표준 역할을 둔다.
  - `X` / `on-X`: 채움색과 그 위 텍스트·아이콘 색의 **짝**. 짝을 지켜 써야 대비가 보장된다.
  - `X-container`: 버튼 등 채움용. 텍스트 색으로 쓰지 않는다.
  - `surface-container-lowest~highest`: 중첩된 면을 구분하는 5단계 배경.
  - `outline` vs `outline-variant`: 입력란 테두리처럼 경계가 중요한 곳은 `outline`, 장식용 구분선은 `outline-variant`.

```css
:root {
  /* 원시 */
  --blue-40: #3a5ba9; --blue-100: #ffffff; --gray-98: #faf8ff; --gray-10: #1a1b21;
  /* 의미 (라이트) */
  --color-primary: var(--blue-40);
  --color-on-primary: var(--blue-100);
  --color-surface: var(--gray-98);
  --color-on-surface: var(--gray-10);
}
.button-primary { background: var(--color-primary); color: var(--color-on-primary); }
```

다크 모드·고대비는 **의미 층의 매핑만** 바꾼다([다크 모드 설계](/develop-wiki/knowledge/ui-ux/dark-mode-design/)).

### 상태색(성공·경고·오류·정보)

- 의미가 고정된 색이므로 브랜드 테마와 별도로 관리한다. Material 3 의 error 역할은 동적 색 체계에서도 바뀌지 않는 정적 색이다.
- 색만으로 상태를 전달하지 않는다(WCAG 1.4.1, A). 아이콘·텍스트를 함께 둔다.

## 언제 쓰나

- 테마가 둘 이상(라이트·다크·브랜드별·고대비)이거나 생길 가능성이 있을 때.
- 디자인 토큰을 도입할 때 색부터 이 구조로 시작하는 경우가 많다.

## 체크리스트

- [ ] 컴포넌트 코드에 원시 색(`blue-40`, hex)이 없다 — 의미 역할만 참조
- [ ] 모든 채움 역할에 짝이 되는 `on-` 역할이 있고, 짝의 대비를 자동 검사한다
- [ ] 상태색은 아이콘·텍스트와 함께 쓴다
- [ ] 역할 이름이 "어디에 쓰는가"를 말한다 (`text-subtle` O, `gray-text-2` X)

## 흔한 실수

- 역할 이름에 색 이름을 넣음(`--color-blue-button`) → 브랜드가 초록으로 바뀌면 이름이 거짓말이 된다.
- 역할을 너무 잘게 쪼갬(컴포넌트마다 고유 색 토큰) → 결국 원시 색을 직접 쓰는 것과 다르지 않다.
- 짝이 아닌 조합(`primary` 위에 `on-surface`)을 씀 → 대비 설정이 바뀌면 읽을 수 없게 된다(Material 3 가 명시적으로 경고).

## 주의 (비용)

- 두 층 구조는 간접 참조가 늘어 "이 버튼 색이 실제로 뭔지" 추적하는 비용이 생긴다. 디자인 도구와 코드에서 같은 이름을 써야 의미가 있다.
- 동적 색(사용자 배경화면에서 색 추출, Material You)은 브랜드 색이 화면에서 사라질 수 있다. 브랜드 요구와 먼저 합의한다.
