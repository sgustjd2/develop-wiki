---
name: Ark UI
url: https://ark-ui.com
docs: https://ark-ui.com/docs/overview/getting-started
repo: https://github.com/chakra-ui/ark
stars: 5477
domain: frontend
category: ui-kit
description: Zag.js 상태 머신 위에 만든 스타일 없는 접근성 컴포넌트 모음. React·Solid·Vue·Svelte에서 같은 API로 헤드리스 컴포넌트를 쓸 때 쓴다.
pricing: oss
tags: [headless, accessibility, multi-framework, state-machine, zag]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ark UI는 Chakra UI 팀이 만드는 헤드리스 컴포넌트 라이브러리다. 다이얼로그, 콤보박스, 날짜 선택기, 슬라이더, 트리 뷰 같은 컴포넌트의 동작을 프레임워크 독립적인 **Zag.js 유한 상태 머신**으로 구현하고, 그 위에 React·Solid·Vue·Svelte 어댑터를 얹어 네 프레임워크에서 같은 구조(`X.Root`, `X.Trigger`, `X.Content` …)로 쓴다. 스타일은 넣지 않는다. 이 문서는 **v5** 기준이다(npm `@ark-ui/react` `latest` 5.40.0, `next` 태그로 6.0.0 프리릴리스 진행 중).

- [Chakra UI v3](/develop-wiki/frontend/ui-kit/chakra-ui/)의 컴포넌트가 Ark UI 위에 만들어져 있다(`@chakra-ui/react`가 `@ark-ui/react`에 의존).
- React 전용 헤드리스 대안은 [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/)·[Base UI](/develop-wiki/frontend/ui-kit/base-ui/)·[React Aria](/develop-wiki/frontend/ui-kit/react-aria/). Ark UI의 차이는 **같은 컴포넌트 API를 Vue·Svelte·Solid에도 제공**한다는 점이다.

## 설치
```bash
npm install @ark-ui/react     # 또는 @ark-ui/solid, @ark-ui/vue, @ark-ui/svelte
```

React 어댑터는 React 18 이상이 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 부품(part) 조합 | `Slider.Root`·`Slider.Control`·`Slider.Thumb`처럼 나뉜 부품을 조합 |
| 컴포넌트별 import 경로 | `@ark-ui/react/slider`처럼 서브경로로 가져온다 |
| `data-scope` / `data-part` | 렌더된 요소에 붙는 속성. `[data-scope='slider'][data-part='root']`로 스타일링 |
| 상태 속성 | `data-state="open"`, `data-disabled` 등으로 상태별 스타일 |
| 제어/비제어 | `value`+`onValueChange`로 제어하거나 `defaultValue`로 내부 상태 사용 |
| `asChild` | 기본 요소 대신 자식 요소에 동작·속성을 위임 |
| Zag.js | 각 컴포넌트의 동작을 정의한 상태 머신 패키지(`@zag-js/*`). Ark UI가 내부적으로 사용 |

## 기본 사용법
```tsx
import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';

export function ConfirmDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>삭제</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className="backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="dialog">
            <Dialog.Title>정말 삭제할까요?</Dialog.Title>
            <Dialog.Description>되돌릴 수 없습니다.</Dialog.Description>
            <Dialog.CloseTrigger>취소</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
```

```css
[data-scope='dialog'][data-part='content'][data-state='open'] {
  animation: fade-in 150ms ease-out;
}
```

## 자주 쓰는 패턴
- **디자인 시스템의 동작 계층:** 사내 디자인 시스템이 여러 프레임워크를 지원해야 할 때 동작은 Ark UI, 스타일은 Tailwind나 [Panda CSS](/develop-wiki/frontend/styling/panda-css/)로 나눈다.
- **복잡한 입력 컴포넌트:** 날짜 선택기, 콤보박스, 태그 입력, 컬러 피커처럼 직접 만들기 어려운 컴포넌트를 헤드리스로 가져다 쓴다.
- **폼 연동:** 일부 컴포넌트는 `HiddenInput` 부품으로 네이티브 폼 제출 값을 제공한다.
- **스타일 프리셋이 필요하면:** Chakra 팀의 Park UI(Ark UI + 스타일 레시피)나 Chakra UI v3를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vue·Svelte·Solid에서 Radix 수준의 헤드리스 컴포넌트가 필요할 때, 여러 프레임워크에 같은 동작 계층을 두고 싶을 때.
- 피할 때(대안): React 전용이고 shadcn/ui 같은 생태계를 쓰려면 [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/)·[Base UI](/develop-wiki/frontend/ui-kit/base-ui/). 스타일까지 완성된 컴포넌트가 필요하면 [Chakra UI](/develop-wiki/frontend/ui-kit/chakra-ui/)·[Mantine](/develop-wiki/frontend/ui-kit/mantine/).

## 공식 문서
- [시작하기](https://ark-ui.com/docs/overview/getting-started) · [스타일링 가이드](https://ark-ui.com/docs/guides/styling) · [Zag.js](https://zagjs.com)
- [GitHub 릴리스](https://github.com/chakra-ui/ark/releases)
