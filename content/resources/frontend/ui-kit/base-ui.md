---
name: Base UI
url: https://base-ui.com
docs: https://base-ui.com/react/overview/quick-start
repo: https://github.com/mui/base-ui
stars: 11508
domain: frontend
category: ui-kit
description: Radix·Floating UI·Material UI 개발진이 만든 React 헤드리스 컴포넌트 라이브러리. 스타일 없는 접근성 컴포넌트로 자체 디자인 시스템을 만들 때 쓴다.
pricing: oss
tags: [react, headless, accessibility, primitives]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Base UI는 Dialog, Menu, Select, Combobox, Popover, Slider 같은 컴포넌트를 스타일 없이 제공하는 [React](/develop-wiki/frontend/framework/react/) 헤드리스 라이브러리다. MUI 조직 저장소(`mui/base-ui`)에서 개발되며 2025-12에 1.0이 나왔다. 이 문서는 **v1** 기준이다(npm `@base-ui/react` `latest` 1.9.0).

- 패키지 이름이 `@base-ui-components/react`에서 `@base-ui/react`로 바뀌었다. 옛 이름은 npm에서 deprecated 처리됐다.
- 2026-07부터 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)의 새 프로젝트 기본 프리미티브다. 같은 계열 대안은 [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/), [React Aria](/develop-wiki/frontend/ui-kit/react-aria/).

## 설치
```bash
npm install @base-ui/react
```

팝업이 페이지 내용 위에 올라오도록 앱 최상위 요소에 별도 쌓임 맥락을 만든다.

```css
.root { isolation: isolate; }   /* layout 의 최상위 래퍼에 class="root" */
body { position: relative; }   /* iOS Safari 백드롭 대응 */
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 컴포넌트별 서브경로 | `import { Dialog } from '@base-ui/react/dialog'`. 단일 패키지지만 트리 셰이킹됨 |
| 부품 조합 | Dialog: `Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, `Close` |
| `Positioner` | Popover·Menu·Select 팝업의 위치 계산 부품. `side`, `sideOffset` 등 지정 |
| `render` prop | 렌더링할 요소를 바꾼다(`render={<MyButton />}` 또는 `(props, state) => ...`). Radix의 `asChild`에 해당 |
| `className` 함수 | `className={(state) => ...}`처럼 상태에 따라 클래스 결정 |
| 데이터 속성 | `data-checked`, `data-highlighted`, `data-pressed`, `data-starting-style`/`data-ending-style`(전환 애니메이션) |
| CSS 변수 | `--anchor-width`, `--available-height` 등 위치·크기 값 노출 |

## 기본 사용법
```tsx
import { Popover } from '@base-ui/react/popover';

export function HelpPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger className="icon-btn">?</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="popup">
            <Popover.Arrow className="arrow" />
            <Popover.Title>도움말</Popover.Title>
            <Popover.Description>저장하면 팀원에게 공유됩니다.</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

```css
.popup { transition: opacity 150ms, transform 150ms; }
.popup[data-starting-style], .popup[data-ending-style] { opacity: 0; transform: scale(0.96); }
```

## 자주 쓰는 패턴
- **내 컴포넌트로 렌더링.** `<Menu.Trigger render={<MyButton size="md" />} />`. `MyButton`은 ref를 전달하고 받은 props를 DOM에 spread해야 한다. 클래스·스타일·이벤트 핸들러는 병합된다.
- **상태별 아이콘.** `render`의 함수 형태로 `(props, state) => <span {...props}>{state.checked ? '✓' : ''}</span>`처럼 상태에 따라 내용을 바꾼다.
- **제어 모드.** `Dialog.Root`에 `open`과 `onOpenChange(open, eventDetails)`를 넘겨 외부 상태로 관리한다.
- **Tailwind.** `data-[checked]:bg-blue-600`처럼 데이터 속성 변형으로 스타일링한다. [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) 참고.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인을 직접 입히는 React 컴포넌트 라이브러리를 새로 만들 때, Combobox·Select처럼 복잡한 입력 컴포넌트를 헤드리스로 쓰고 싶을 때, 새 shadcn/ui 프로젝트.
- 피할 때(대안): 이미 Radix 기반으로 잘 돌아가는 코드는 굳이 옮길 이유가 적다. 완성된 디자인이 필요하면 [MUI](/develop-wiki/frontend/ui-kit/mui/) 또는 [Mantine](/develop-wiki/frontend/ui-kit/mantine/). React 외 프레임워크에서는 쓸 수 없다.

## 공식 문서
- [빠른 시작](https://base-ui.com/react/overview/quick-start) · [스타일링](https://base-ui.com/react/handbook/styling) · [합성(render)](https://base-ui.com/react/handbook/composition)
- [Dialog](https://base-ui.com/react/components/dialog) · [릴리스](https://base-ui.com/react/overview/releases)
