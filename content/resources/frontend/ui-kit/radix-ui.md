---
name: Radix UI Primitives
url: https://www.radix-ui.com/primitives
docs: https://www.radix-ui.com/primitives/docs/overview/getting-started
repo: https://github.com/radix-ui/primitives
stars: 19537
domain: frontend
category: ui-kit
description: 스타일 없이 접근성·키보드 동작만 제공하는 React 헤드리스 컴포넌트 모음. 다이얼로그·메뉴·팝오버를 직접 디자인한 컴포넌트로 만들 때 쓴다.
pricing: oss
tags: [react, headless, accessibility, primitives]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Radix Primitives는 Dialog, DropdownMenu, Popover, Tabs, Tooltip 같은 상호작용 컴포넌트의 **동작(포커스 관리, 키보드 탐색, ARIA 속성, 바깥 클릭 닫기)** 만 구현하고 스타일은 전혀 넣지 않은 [React](/develop-wiki/frontend/framework/react/) 라이브러리다. 각 컴포넌트는 `Root`·`Trigger`·`Content` 같은 부품(part)으로 나뉘어 조합해 쓴다. 이 문서는 **v1** 단일 패키지 기준이다(npm `radix-ui` `latest` 1.8.1).

- 예전에는 `@radix-ui/react-dialog`처럼 컴포넌트별 패키지를 설치했고, 지금 문서는 단일 `radix-ui` 패키지를 안내한다(개별 패키지도 계속 배포된다).
- [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)의 선택 가능한 프리미티브 중 하나다. 같은 위치의 대안으로 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/), [React Aria](/develop-wiki/frontend/ui-kit/react-aria/)가 있다.

## 설치
```bash
npm install radix-ui@latest
```

import는 `import { Dialog } from 'radix-ui'` 또는 서브경로 `import * as Dialog from 'radix-ui/dialog'`. 서브경로는 일부 번들러에서 트리 셰이킹에 유리하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 부품 조합 | `Dialog.Root` > `Trigger` / `Portal` > `Overlay`, `Content` > `Title`, `Description`, `Close` 처럼 조합 |
| 비제어 / 제어 | `defaultOpen`(내부 상태) 또는 `open` + `onOpenChange`(외부 상태) |
| `asChild` | 기본 DOM 요소 대신 자식 요소에 props·동작을 합쳐 렌더링. 자식은 props를 spread하고 ref를 전달해야 함 |
| `data-state` | `data-state="open"`/`"closed"`, `"checked"` 등 상태가 속성으로 노출돼 CSS 선택자로 스타일링 |
| `Portal` | 팝업 내용을 `body` 아래로 옮겨 렌더링해 `overflow`·`z-index` 문제 회피 |
| 스타일 없음 | 각 부품에 `className`을 주고 CSS·Tailwind·CSS-in-JS 무엇이든 사용 |

## 기본 사용법
```tsx
import { Dialog } from 'radix-ui';

export function DeleteDialog({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="btn">삭제</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="dialog">
          <Dialog.Title>정말 삭제할까요?</Dialog.Title>
          <Dialog.Description>되돌릴 수 없습니다.</Dialog.Description>
          <button onClick={onConfirm}>확인</button>
          <Dialog.Close className="btn">취소</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

```css
.dialog[data-state='open'] { animation: fade-in 150ms ease-out; }
.dialog[data-state='closed'] { animation: fade-out 100ms ease-in; }
```

## 자주 쓰는 패턴
- **내 버튼 컴포넌트를 트리거로.** `<Tooltip.Trigger asChild><MyButton /></Tooltip.Trigger>`. `MyButton`은 받은 props와 ref를 실제 `<button>`에 넘겨야 동작한다.
- **폼 제출 후 닫기.** `open`/`onOpenChange`로 제어 모드로 바꾸고, 저장 성공 시 `setOpen(false)`.
- **상태 기반 애니메이션.** `data-state`와 CSS 애니메이션으로 열림·닫힘 전환을 만든다. 닫힘 애니메이션이 끝날 때까지 언마운트를 미룬다.
- **Tailwind와 함께.** `data-[state=open]:` 변형으로 상태별 클래스를 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 자체 디자인 시스템을 React로 만들면서 접근성 동작은 검증된 구현을 쓰고 싶을 때, 기존 Radix 기반 shadcn/ui 프로젝트.
- 피할 때(대안): 새로 시작하는 shadcn/ui 프로젝트는 기본값이 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/)다. 국제화(날짜·로캘)와 터치 상호작용이 중요하면 [React Aria](/develop-wiki/frontend/ui-kit/react-aria/). 바로 쓸 수 있는 디자인이 필요하면 [MUI](/develop-wiki/frontend/ui-kit/mui/), [Mantine](/develop-wiki/frontend/ui-kit/mantine/).

## 공식 문서
- [시작하기](https://www.radix-ui.com/primitives/docs/overview/getting-started) · [합성(asChild)](https://www.radix-ui.com/primitives/docs/guides/composition) · [스타일링](https://www.radix-ui.com/primitives/docs/guides/styling)
- [Dialog API](https://www.radix-ui.com/primitives/docs/components/dialog) · [릴리스 노트](https://www.radix-ui.com/primitives/docs/overview/releases)
