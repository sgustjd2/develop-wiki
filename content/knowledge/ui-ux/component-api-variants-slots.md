---
title: 컴포넌트 API 설계 — 변형(variant)·슬롯·헤드리스
aka: [Component API Design, Variants, Slots, Compound Components, Headless Components, asChild, Polymorphic Components, cva]
category: ui-ux
group: design-system
level: advanced
summary: 디자인 시스템 컴포넌트의 공개 API 를 "열거형 변형 + 내용 주입 슬롯 + 동작만 제공하는 헤드리스 층"으로 나눠, 불리언 prop 폭증과 스타일 오버라이드 경쟁 없이 확장 가능하게 만드는 설계.
tags: [design-system, component-api, react, headless, variants, accessibility]
related: [ui-ux/design-system-structure, ui-ux/design-tokens, principles/composition-over-inheritance, design-patterns/composite, design-patterns/decorator, ui-ux/keyboard-focus-management, ui-ux/semantic-html-first-aria]
sources:
  - https://cva.style/docs/getting-started/variants
  - https://www.radix-ui.com/primitives/docs/guides/composition
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/slot
  - https://atomicdesign.bradfrost.com/chapter-2/
updatedAt: 2026-11-19
---

## 문제

```tsx
<Button primary small outline danger loading iconLeft={...} fullWidth noPadding />
```

- 불리언 prop 이 늘면 `primary && danger && outline` 같은 조합이 정의되지 않은 채 생긴다.
- 디자인에 없는 모양을 원하는 팀은 `className` 으로 덮어쓰고, 시스템 업데이트 때마다 깨진다.
- 메뉴·콤보박스의 키보드·포커스·ARIA 동작을 컴포넌트마다 새로 짠다.

## 해법

### 1. 변형은 열거형으로, 기본값과 함께

변형(variant)은 디자인 도구의 컴포넌트 속성과 **이름·값을 1:1** 로 맞춘다.

```ts
import { cva, type VariantProps } from 'class-variance-authority';

export const button = cva('ds-btn', {
  variants: {
    intent: { primary: 'ds-btn--primary', secondary: 'ds-btn--secondary', danger: 'ds-btn--danger' },
    size: { sm: 'ds-btn--sm', md: 'ds-btn--md' },
    emphasis: { solid: '', outline: 'ds-btn--outline', ghost: 'ds-btn--ghost' },
  },
  compoundVariants: [{ intent: 'danger', emphasis: 'ghost', class: 'ds-btn--danger-ghost' }],
  defaultVariants: { intent: 'primary', size: 'md', emphasis: 'solid' },
});
export type ButtonVariants = VariantProps<typeof button>;
```

- 상태(hover·focus·disabled·loading)는 변형이 아니라 **상태**로 따로 다룬다.
- 허용하지 않는 조합은 타입으로 막거나 문서에 명시한다.

### 2. 슬롯: 내용은 주입받는다

| 방식 | 예 | 맞는 경우 |
| --- | --- | --- |
| `children` | `<Button>저장</Button>` | 주 내용 하나 |
| 이름 있는 슬롯 prop | `<Card header={…} footer={…}>` | 정해진 자리 몇 개 |
| 합성 컴포넌트(compound) | `<Dialog.Root><Dialog.Title/>…</Dialog.Root>` | 구조가 유연하고 부품끼리 상태 공유 |
| 웹 컴포넌트 `<slot name>` | `<ds-card><h2 slot="title">` | 프레임워크 무관 배포 |
| `asChild`(다형성) | `<Button asChild><a href="/x">이동</a></Button>` | 동작·스타일은 그대로, 렌더 요소만 교체 |

Radix 의 `asChild` 는 기본 요소 대신 자식을 복제해 props·동작을 넘긴다. 자식은 props 를 DOM 요소로 전달하고 ref 를 연결해야 하며, 요소를 바꾼 뒤의 접근성은 사용하는 쪽 책임이다.

### 3. 헤드리스 층과 스타일 층 분리

```
헤드리스(동작·접근성)  Radix · React Aria · Base UI · Ark UI · Headless UI
        ↓ 감쌈
시스템 컴포넌트(토큰·변형 적용)   ← 제품팀은 여기만 사용
```

키보드 탐색·포커스 관리·ARIA 는 검증된 헤드리스 라이브러리([Radix](/develop-wiki/frontend/ui-kit/radix-ui/), [React Aria](/develop-wiki/frontend/ui-kit/react-aria/), [Base UI](/develop-wiki/frontend/ui-kit/base-ui/))에 맡기고, 시스템은 모양과 API 일관성에 집중한다. [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/) 는 이 조합을 소스 복사 방식으로 배포한 예다.

## 언제 쓰나

- 여러 제품이 공유하는 컴포넌트를 만들 때. 한 화면용 컴포넌트에는 과한 설계다.

## 체크리스트

- [ ] 변형 이름·값이 디자인 도구 속성과 같다
- [ ] 모든 변형 조합이 스토리북 등에 렌더돼 있다([Storybook](/develop-wiki/frontend/testing/storybook/))
- [ ] 네이티브 속성(`type`, `disabled`, `aria-*`)을 통과시킨다
- [ ] ref 를 DOM 요소로 전달한다
- [ ] `className`/`style` 탈출구는 열어 두되, 레이아웃(margin·width)용으로만 쓰도록 문서화

## 흔한 실수

- `variant="primary-small-outline"` 처럼 축을 합친 문자열 → 축이 늘면 조합 폭발.
- 슬롯 대신 `title`, `subtitle`, `titleIcon`, `titleColor` … prop 이 계속 늘어남.
- 헤드리스 라이브러리 위에 감싼 뒤 `role`·`aria-*` 를 다시 덮어써 접근성을 깨뜨림.
- 컴포넌트가 바깥 여백(margin)을 가짐 → 배치하는 쪽과 충돌.

## 주의 (비용)

- 합성 컴포넌트·`asChild` 는 유연한 대신 잘못 조립할 자유도 준다. 대표 조합을 패턴으로 문서화한다.
- 헤드리스 라이브러리를 바꾸면 내부 API 가 크게 달라진다. 시스템 컴포넌트가 외부 라이브러리 타입을 그대로 노출하지 않게 감싼다([어댑터](/develop-wiki/knowledge/design-patterns/adapter/)처럼).
- 변형을 너무 적게 두면 오버라이드가, 너무 많이 두면 유지 비용이 늘어난다. 실제 사용 통계로 조정한다.
