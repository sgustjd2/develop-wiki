---
name: HeroUI
url: https://heroui.com
docs: https://heroui.com/docs/react/getting-started
repo: https://github.com/heroui-inc/heroui
stars: 31248
domain: frontend
category: ui-kit
description: Tailwind CSS v4와 React Aria Components 위에 만든 스타일 포함 React 컴포넌트 라이브러리(옛 NextUI). Tailwind 프로젝트에서 완성된 접근성 컴포넌트를 바로 쓸 때 쓴다.
pricing: oss
tags: [react, tailwindcss, react-aria, components, nextui]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
HeroUI는 접근성·키보드·포커스 동작을 [React Aria](/develop-wiki/frontend/ui-kit/react-aria/) Components에 맡기고, 시각 스타일을 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) v4 기반 CSS 패키지(`@heroui/styles`)로 제공하는 [React](/develop-wiki/frontend/framework/react/) 컴포넌트 라이브러리다. 2025년 초 NextUI에서 이름을 바꿨고, v3에서 컴포넌트 구조를 `Card.Header`처럼 부품을 조합하는 compound 방식으로 다시 만들었다. 이 문서는 **v3** 기준이다(npm `@heroui/react` `latest` 3.2.7, 3.0.0은 2026-03 출시). Apache-2.0 라이선스.

- **React 19 이상, Tailwind CSS v4가 필수**다(peerDependency `react >=19`, `tailwindcss >=4`). v3는 별도 Provider가 필요 없다.
- React Native용 **HeroUI Native**가 같은 생태계에 있다. 라이브러리 자체는 무료이고, 별도 유료 상품(HeroUI Pro)이 있다.
- Tailwind + 헤드리스 조합으로 코드를 복사해 오는 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)와 달리, HeroUI는 npm 패키지로 설치해 업데이트를 받는 방식이다.

## 설치
```bash
npm i @heroui/styles @heroui/react
```

전역 CSS(순서 중요: Tailwind를 먼저):

```css
@import "tailwindcss";
@import "@heroui/styles";
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| compound 컴포넌트 | `Card.Header`·`Card.Title`·`Card.Content`·`Card.Footer` 처럼 부품 조합 |
| `@heroui/styles` | 컴포넌트 스타일을 담은 CSS 패키지. Tailwind 유틸리티와 함께 동작 |
| React Aria 기반 이벤트 | 버튼 등은 `onClick` 대신 `onPress`(마우스·터치·키보드 통합) |
| `variant` / `size` | Button은 `primary`·`secondary`·`tertiary`·`outline`·`ghost`·`danger`, 크기 `sm`·`md`·`lg` |
| 테마 | CSS 변수로 색·반경 등을 재정의 |
| `className` | 각 부품에 Tailwind 클래스를 더해 세부 조정 |

## 기본 사용법
```tsx
import { Button, Card } from '@heroui/react';

export function InviteCard({ onAccept }: { onAccept: () => void }) {
  return (
    <Card className="max-w-sm">
      <Card.Header>
        <Card.Title>팀 초대</Card.Title>
        <Card.Description>dev.hub 워크스페이스에 초대되었습니다.</Card.Description>
      </Card.Header>
      <Card.Footer className="flex gap-2">
        <Button onPress={onAccept}>수락</Button>
        <Button variant="ghost">나중에</Button>
      </Card.Footer>
    </Card>
  );
}
```

## 자주 쓰는 패턴
- **브랜드 테마:** 전역 CSS에서 HeroUI가 정의한 CSS 변수(색, 반경)를 덮어써 전체 톤을 바꾼다.
- **Tailwind 클래스로 미세 조정:** 부품마다 `className`을 붙여 간격·레이아웃을 맞춘다.
- **폼:** React Aria 기반 입력 컴포넌트의 검증·오류 메시지 구조를 그대로 활용한다.
- **v2(NextUI 시절 API) 이전:** Provider 제거, compound 구조 전환 등 변경이 크므로 공식 마이그레이션 문서를 따라 컴포넌트 단위로 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Tailwind v4 + React 19 프로젝트에서 스타일까지 완성된 접근성 컴포넌트를 패키지로 받아 쓰고 싶을 때.
- 피할 때(대안): React 18이나 Tailwind v3에 묶여 있으면 v3를 쓸 수 없다. 컴포넌트 코드를 직접 소유하려면 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/), 스타일 없이 동작만 필요하면 [React Aria](/develop-wiki/frontend/ui-kit/react-aria/), Tailwind를 쓰지 않으면 [Mantine](/develop-wiki/frontend/ui-kit/mantine/)·[Chakra UI](/develop-wiki/frontend/ui-kit/chakra-ui/).

## 공식 문서
- [시작하기](https://heroui.com/docs/react/getting-started) · [빠른 시작](https://heroui.com/docs/react/getting-started/quick-start) · [테마](https://heroui.com/docs/react/getting-started/theming) · [Card](https://heroui.com/docs/react/components/card)
- [마이그레이션](https://heroui.com/docs/react/migration) · [GitHub 릴리스](https://github.com/heroui-inc/heroui/releases)
