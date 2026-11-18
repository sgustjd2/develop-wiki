---
name: Headless UI
url: https://headlessui.com
docs: https://headlessui.com/react/menu
repo: https://github.com/tailwindlabs/headlessui
stars: 28837
domain: frontend
category: ui-kit
description: Tailwind Labs가 만든 스타일 없는 접근성 컴포넌트 모음. 메뉴·리스트박스·다이얼로그 같은 소수 컴포넌트를 Tailwind 클래스로 직접 꾸밀 때 쓴다.
pricing: oss
tags: [react, vue, headless, accessibility, tailwindcss]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Headless UI는 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/)를 만든 Tailwind Labs의 헤드리스 컴포넌트 라이브러리다. Menu, Listbox, Combobox, Dialog, Popover, Disclosure, Tabs, Switch, Radio Group과 폼 요소(Input, Select, Checkbox, Field) 등 비교적 적은 수의 컴포넌트에 키보드·포커스·ARIA 동작만 넣고, 상태는 `data-*` 속성으로 드러내 Tailwind 변형(`data-focus:`, `data-open:`)으로 꾸미게 한다. 이 문서는 **React v2** 기준이다(npm `@headlessui/react` `latest` 2.2.10, 2026-04 배포, React 18·19 지원).

- **Vue 패키지(`@headlessui/vue`)는 v1.7.23(2024-09)에서 멈춰 있고** 문서도 v1이다. Vue에서 새로 시작한다면 [Ark UI](/develop-wiki/frontend/ui-kit/ark-ui/) 같은 대안을 함께 검토한다.
- 릴리스 간격이 길어졌다(2.2.9 → 2.2.10 사이 약 6개월). 같은 위치의 React 대안은 [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/)·[Base UI](/develop-wiki/frontend/ui-kit/base-ui/)·[React Aria](/develop-wiki/frontend/ui-kit/react-aria/)이며, 컴포넌트 수는 이들보다 적다.

## 설치
```bash
npm install @headlessui/react
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 이름 붙은 컴포넌트 | v2는 `Menu`, `MenuButton`, `MenuItems`, `MenuItem`처럼 개별 export (v1의 `Menu.Button` 점 표기 대체) |
| `data-*` 상태 속성 | `data-focus`, `data-open`, `data-selected`, `data-disabled` 등. Tailwind v4 `data-focus:bg-…`로 스타일 |
| `anchor` | 팝업(`MenuItems`, `ListboxOptions` 등)을 버튼 기준으로 배치 (`"bottom"`, `"bottom start"` …) |
| `transition` prop | 열림·닫힘 시 `data-closed`·`data-enter`·`data-leave` 속성을 붙여 CSS 트랜지션 연결 |
| `Field` / `Label` / `Description` | 폼 요소에 라벨·설명을 연결해 ID·ARIA 속성 자동 처리 |
| `as` | 렌더할 요소·컴포넌트 변경 (`as={Fragment}` 등) |

## 기본 사용법
```tsx
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

export function AccountMenu() {
  return (
    <Menu>
      <MenuButton className="rounded px-3 py-1 data-active:bg-gray-100">계정</MenuButton>
      <MenuItems anchor="bottom" className="w-40 rounded border bg-white p-1">
        <MenuItem>
          <a href="/settings" className="block rounded px-2 py-1 data-focus:bg-blue-100">설정</a>
        </MenuItem>
        <MenuItem>
          <button className="block w-full rounded px-2 py-1 text-left data-focus:bg-blue-100">로그아웃</button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
```

## 자주 쓰는 패턴
- **Tailwind Plus 예제와 함께:** Tailwind Labs의 유료 UI 블록 모음(Tailwind Plus)에 Headless UI를 쓰는 React 예제가 많아, 구조를 참고하기 좋다.
- **선택 컴포넌트:** 단순 선택은 `Listbox`, 검색 가능한 선택은 `Combobox`에 `onChange`와 필터링 상태를 연결한다.
- **애니메이션:** `transition` prop + `data-closed:opacity-0` 같은 클래스로 별도 라이브러리 없이 열림·닫힘 효과를 준다.
- **v1 → v2:** 점 표기 컴포넌트를 개별 export로 바꾸고, render prop의 `active`는 `data-focus` 기반으로 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Tailwind로 스타일을 직접 관리하는 React 앱에서 메뉴·다이얼로그·리스트박스 등 기본 상호작용 컴포넌트만 필요할 때.
- 피할 때(대안): 날짜 선택기·슬라이더·토스트 등 더 많은 컴포넌트가 필요하면 [React Aria](/develop-wiki/frontend/ui-kit/react-aria/)·[Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/)·[Base UI](/develop-wiki/frontend/ui-kit/base-ui/), Vue는 [Ark UI](/develop-wiki/frontend/ui-kit/ark-ui/), 스타일까지 갖춘 Tailwind 키트는 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)·[HeroUI](/develop-wiki/frontend/ui-kit/heroui/).

## 공식 문서
- [React 문서(Menu)](https://headlessui.com/react/menu) · [Dialog](https://headlessui.com/react/dialog) · [Listbox](https://headlessui.com/react/listbox) · [Combobox](https://headlessui.com/react/combobox)
- [Vue v1 문서](https://headlessui.com/v1/vue/menu) · [GitHub 릴리스](https://github.com/tailwindlabs/headlessui/releases)
