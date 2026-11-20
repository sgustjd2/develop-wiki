---
name: Chakra UI
url: https://chakra-ui.com
docs: https://chakra-ui.com/docs/get-started/installation
repo: https://github.com/chakra-ui/chakra-ui
stars: 40745
domain: frontend
category: ui-kit
description: 스타일 props와 디자인 토큰 기반 테마를 갖춘 React 컴포넌트 라이브러리. v3는 Ark UI 위에서 접근성 동작을, 토큰·레시피로 스타일을 정의해 빠르게 화면을 만들 때 쓴다.
pricing: oss
tags: [react, components, design-tokens, style-props, ark-ui]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Chakra UI는 `<Box p="4" bg="gray.100">`처럼 CSS 속성을 props로 쓰는 **스타일 props**와, 색·간격·폰트를 토큰으로 정의하는 테마 시스템을 가진 [React](/develop-wiki/frontend/framework/react/) 컴포넌트 라이브러리다. v3(2024-10 출시)에서 내부를 다시 만들어 컴포넌트 동작은 [Ark UI](/develop-wiki/frontend/ui-kit/ark-ui/)(Zag.js 상태 머신)에, 스타일은 Panda CSS에서 가져온 토큰·레시피 개념에 기반한다. 이 문서는 **v3** 기준이다(npm `@chakra-ui/react` `latest` 3.38.0, v2는 `v2-latest` 2.10.10).

- 현재 런타임 스타일 엔진은 **Emotion**이다(`@emotion/react` peerDependency). 공식 문서는 장기적으로 Panda CSS 방식의 런타임 없는 스타일링으로 옮겨 갈 계획이라고 밝힌다.
- v2 → v3는 Provider·테마 API·컴포넌트 구조(`Modal` → `Dialog.Root` 등 compound 컴포넌트)가 크게 바뀐 메이저 변경이다.

## 설치
```bash
npm i @chakra-ui/react @emotion/react
npx @chakra-ui/cli snippet add      # Provider, 색 모드, 토스트 등 스니펫 생성
```

생성된 `components/ui/provider`의 `Provider`로 앱을 감싼다. 이 Provider는 `ChakraProvider`(스타일)와 `next-themes`의 `ThemeProvider`(색 모드)를 합친 것이다. TypeScript는 `moduleResolution: "Bundler"`를 권장한다. Node.js 20 이상.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 스타일 props | `p`, `bg`, `color`, `gap` 등 CSS 속성을 props로. 반응형은 `{{ base: '2', md: '4' }}` |
| 시스템(`createSystem`) | `defaultConfig`에 사용자 `defineConfig`를 합쳐 만든 스타일 엔진. `ChakraProvider value`로 주입 |
| 토큰 / 시맨틱 토큰 | `colors.brand.500` 같은 원시 값 / `bg.muted`처럼 의미 단위 값(다크 모드 대응) |
| 레시피 / 슬롯 레시피 | 단일 요소·다중 부품 컴포넌트의 variant 정의 |
| compound 컴포넌트 | `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content` 등 부품 조합 |
| 스니펫 | CLI가 프로젝트에 복사하는 조합 컴포넌트(Toaster, ColorModeButton 등). 직접 수정 가능 |
| typegen | `npx @chakra-ui/cli typegen ./theme.ts`로 커스텀 토큰 타입 생성 |

## 기본 사용법
테마 확장.

```ts
// theme.ts
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: { colors: { brand: { 500: { value: '#0f766e' } } } },
  },
});

export const system = createSystem(defaultConfig, config);
```

컴포넌트 사용.

```tsx
import { Button, Card, HStack, Text } from '@chakra-ui/react';

export function PlanCard() {
  return (
    <Card.Root maxW="sm" p="4">
      <Card.Body gap="2">
        <Card.Title>Pro 플랜</Card.Title>
        <Text color="fg.muted">월 단위 결제</Text>
      </Card.Body>
      <Card.Footer>
        <HStack><Button colorPalette="teal">선택</Button><Button variant="outline">비교</Button></HStack>
      </Card.Footer>
    </Card.Root>
  );
}
```

## 자주 쓰는 패턴
- **브랜드 색 전체 적용:** `colorPalette` prop으로 컴포넌트 묶음의 색 계열을 한 번에 바꾼다.
- **다크 모드:** 시맨틱 토큰(`bg`, `fg`, `border` 계열)을 쓰면 색 모드 전환 시 자동으로 값이 바뀐다.
- **커스텀 컴포넌트 스타일:** `defineRecipe`/`defineSlotRecipe`로 variant를 정의하고 시스템 config에 등록한다.
- **v2 이전:** 공식 마이그레이션 가이드와 `@chakra-ui/codemod`로 컴포넌트 이름·props 변경을 처리한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 스타일 props로 빠르게 화면을 조립하고 토큰 기반 테마·다크 모드가 필요한 React 앱, 내부 도구·대시보드.
- 피할 때(대안): 런타임 CSS-in-JS를 피하고 싶으면(서버 컴포넌트 중심 등) Tailwind 기반 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)·[HeroUI](/develop-wiki/frontend/ui-kit/heroui/). 동작만 필요하면 [Ark UI](/develop-wiki/frontend/ui-kit/ark-ui/), 기능이 많은 올인원은 [Mantine](/develop-wiki/frontend/ui-kit/mantine/)·[MUI](/develop-wiki/frontend/ui-kit/mui/).

## 공식 문서
- [설치](https://chakra-ui.com/docs/get-started/installation) · [테마 커스터마이징](https://chakra-ui.com/docs/theming/customization/overview) · [컴포넌트](https://chakra-ui.com/docs/components/concepts/overview)
- [v3 마이그레이션](https://chakra-ui.com/docs/get-started/migration)
