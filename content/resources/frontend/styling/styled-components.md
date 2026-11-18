---
name: styled-components
url: https://styled-components.com
docs: https://styled-components.com/docs
repo: https://github.com/styled-components/styled-components
stars: 41048
domain: frontend
category: styling
description: 태그드 템플릿 리터럴로 React 컴포넌트에 CSS를 붙이는 런타임 CSS-in-JS 라이브러리. props에 따라 스타일이 바뀌는 컴포넌트를 만들 때 쓴다.
pricing: oss
tags: [css-in-js, react]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
styled-components는 ``styled.button`...` `` 형태의 템플릿 리터럴에 일반 CSS를 써서 스타일이 붙은 React 컴포넌트를 만드는 라이브러리다. 실행 시점에 고유 클래스 이름을 만들고 필요한 스타일만 문서에 넣으며, props를 받아 스타일을 바꿀 수 있다. 이 문서는 **v6** 기준이다(npm `styled-components` `latest` 6.6.0). v6.3.0부터 React Server Components를 추가 설정 없이 지원하고, 타입 정의가 패키지에 포함된다. v7은 알파 단계다.

- README에 따르면 현재 사실상 한 명이 유지보수하고 있다. 새 프로젝트라면 제로 런타임 대안과 비교해 고른다.
- Emotion(`@emotion/styled`)과 API가 비슷하지만, Emotion은 2025년 11월 이후 커밋·릴리스가 없다.

## 설치
```bash
npm install styled-components
```

SSR 프레임워크에서는 각 프레임워크의 styled-components 연동 안내(Next.js의 레지스트리 설정 등)를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| ``styled.tag`css` `` | 스타일이 붙은 컴포넌트 생성. `styled(Component)`로 기존 컴포넌트 확장 |
| 보간 `${(p) => ...}` | props에 따라 CSS 값을 계산 |
| 임시(transient) props `$name` | `$` 접두사 props는 DOM에 전달되지 않고 스타일 계산에만 쓰임 |
| `ThemeProvider` | 테마 객체를 하위 컴포넌트의 `props.theme`으로 제공 |
| `css` 헬퍼 | 재사용할 스타일 조각 정의 |
| `createGlobalStyle` | 전역 스타일 컴포넌트 |
| `keyframes` | 애니메이션 정의, 고유 이름 생성 |
| `.attrs()` | 기본 HTML 속성·props 지정 |
| `ServerStyleSheet` | 서버 렌더링 시 스타일 태그 수집 |

## 기본 사용법
```tsx
import styled, { css, ThemeProvider } from 'styled-components';

const theme = { brand: '#3b5bdb' };

const Button = styled.button<{ $variant?: 'solid' | 'ghost' }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid ${(p) => p.theme.brand};
  ${(p) => p.$variant === 'ghost'
    ? css`background: transparent; color: ${p.theme.brand};`
    : css`background: ${p.theme.brand}; color: white;`}
  &:hover { opacity: 0.9; }
`;

export const App = () => (
  <ThemeProvider theme={theme}>
    <Button>저장</Button> <Button $variant="ghost">취소</Button>
  </ThemeProvider>
);
```

TypeScript에서는 아래 "테마 타입" 패턴으로 `DefaultTheme`을 선언해야 `p.theme.brand`에 타입이 잡힌다.

## 자주 쓰는 패턴
- **DOM으로 새는 props 방지.** 스타일용 props는 `$` 접두사를 붙인다. 붙이지 않으면 알 수 없는 속성이 HTML에 그대로 전달될 수 있다.
- **테마 타입.** `declare module 'styled-components' { export interface DefaultTheme { brand: string } }`로 `p.theme`에 타입을 붙인다.
- **컴포넌트 참조 선택자.** `${Icon}:hover &` 처럼 다른 styled 컴포넌트를 선택자로 쓴다.
- **동적 스타일 최소화.** 값이 자주 바뀌는 스타일(드래그 좌표 등)은 보간 대신 `style` 속성이나 CSS 변수로 넘겨 클래스 재생성을 줄인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 styled-components로 만든 코드베이스나 디자인 시스템을 유지할 때, React Native와 같은 API로 스타일을 쓰고 싶을 때.
- 피할 때(대안): 새 프로젝트에서 런타임 비용과 단일 유지보수자 리스크를 피하려면 [vanilla-extract](/develop-wiki/frontend/styling/vanilla-extract/)·[Panda CSS](/develop-wiki/frontend/styling/panda-css/)·[StyleX](/develop-wiki/frontend/styling/stylex/) 같은 제로 런타임 방식이나 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/).

## 공식 문서
- [문서 홈](https://styled-components.com/docs) · [기본 사용법](https://styled-components.com/docs/basics) · [고급(테마·SSR·RSC)](https://styled-components.com/docs/advanced) · [API 레퍼런스](https://styled-components.com/docs/api)
