---
name: React Aria
url: https://react-aria.adobe.com
docs: https://react-aria.adobe.com/getting-started
repo: https://github.com/adobe/react-spectrum
stars: 16053
domain: frontend
category: ui-kit
description: Adobe가 만든 스타일 없는 React 접근성 컴포넌트·훅 라이브러리. 국제화·터치·키보드 동작이 중요한 디자인 시스템을 만들 때 쓴다.
pricing: oss
tags: [react, headless, accessibility, i18n, adobe]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
React Aria는 Adobe의 디자인 시스템 React Spectrum의 기반 라이브러리로, 50개 이상의 스타일 없는 컴포넌트(`react-aria-components`)와 그보다 낮은 수준의 훅(`react-aria`)을 제공한다. 마우스·터치·키보드·스크린 리더에서 같은 의미로 동작하도록 상호작용을 정규화하고, 30개 이상 언어 번역·13개 달력 체계·RTL 같은 국제화를 내장한다. 이 문서는 **React Aria Components v1** 기준이다(npm `react-aria-components` `latest` 1.22.1).

- 문서 주소가 `react-spectrum.adobe.com/react-aria/`에서 `react-aria.adobe.com`으로 옮겨졌다.
- 같은 위치의 대안은 [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/), [Base UI](/develop-wiki/frontend/ui-kit/base-ui/). [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)에서도 `aria` base로 고를 수 있다.

## 설치
```bash
npm install react-aria-components
npm install tailwindcss-react-aria-components    # 선택: Tailwind 상태 변형 플러그인
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 컴포넌트 = DOM 요소 하나 | 각 컴포넌트가 하나의 요소를 렌더링하고, `Select` > `Label`, `Button`, `Popover` > `ListBox`처럼 조합 |
| 기본 클래스 | `.react-aria-ListBoxItem`처럼 자동 클래스가 붙어 그대로 CSS로 스타일링 가능 |
| 데이터 속성 | `data-hovered`, `data-pressed`, `data-focus-visible`, `data-selected`, `data-disabled` |
| 렌더 props | `className`, `style`, `children`에 `({ isSelected }) => ...` 함수를 넘겨 상태별 처리 |
| 컬렉션 | `items` 배열 + 렌더 함수로 ListBox·Table·Tree 등 동적 목록 구성, 가상화 지원 |
| 훅 계층(`react-aria`) | `useButton`, `useCalendarGrid` 등. 컴포넌트로 표현이 안 되는 구조를 직접 조립할 때 |
| 국제화 | `I18nProvider locale="ko-KR"`로 숫자·날짜 서식, 달력, 읽기 방향 지정 |

## 기본 사용법
```tsx
import { Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue } from 'react-aria-components';

export function RoleSelect() {
  return (
    <Select placeholder="권한 선택">
      <Label>권한</Label>
      <Button>
        <SelectValue />
        <span aria-hidden="true">▼</span>
      </Button>
      <Popover>
        <ListBox>
          <ListBoxItem id="viewer">보기</ListBoxItem>
          <ListBoxItem id="editor">편집</ListBoxItem>
          <ListBoxItem id="admin">관리자</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}
```

```css
.react-aria-ListBoxItem[data-focus-visible] { outline: 2px solid royalblue; }
.react-aria-ListBoxItem[data-selected] { font-weight: 600; }
```

## 자주 쓰는 패턴
- **상태별 클래스.** `<ListBoxItem className={({ isSelected }) => isSelected ? 'item on' : 'item'}>`.
- **Tailwind 플러그인.** CSS에 `@plugin "tailwindcss-react-aria-components";`를 추가하면 `selected:bg-blue-500`, `pressed:scale-95`처럼 `data-` 없이 상태 변형을 쓴다. [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) v4 기준.
- **날짜 입력.** `DatePicker`·`DateRangePicker`는 로캘별 달력과 키보드 입력 세그먼트를 기본 제공한다.
- **드래그 앤 드롭.** ListBox·GridList·Table에 `dragAndDropHooks`를 연결해 키보드·스크린 리더에서도 동작하는 정렬을 만든다.
- **스타터 킷.** 공식 문서의 CSS·Tailwind 예제나 Storybook 스타터 킷을 복사해 사내 컴포넌트의 출발점으로 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 언어·지역에 배포하는 제품, 날짜·숫자 입력이 많은 업무 앱, 터치 기기에서 hover/press 동작을 일관되게 맞춰야 하는 디자인 시스템.
- 피할 때(대안): 간단한 팝오버·다이얼로그 몇 개면 더 가벼운 API의 [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/)나 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/)로 충분하다. 바로 쓸 디자인이 필요하면 [MUI](/develop-wiki/frontend/ui-kit/mui/), [Mantine](/develop-wiki/frontend/ui-kit/mantine/).

## 공식 문서
- [시작하기](https://react-aria.adobe.com/getting-started) · [스타일링](https://react-aria.adobe.com/styling) · [Select](https://react-aria.adobe.com/Select)
- [GitHub 릴리스](https://github.com/adobe/react-spectrum/releases)
