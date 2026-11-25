---
name: Panda CSS
url: https://panda-css.com
docs: https://panda-css.com/docs/overview/getting-started
repo: https://github.com/chakra-ui/panda
stars: 6260
domain: frontend
category: styling
description: 타입 안전한 css() 함수·레시피·토큰으로 스타일을 쓰고 빌드 시 원자 CSS로 추출하는 CSS-in-JS 엔진. Chakra UI 팀이 만든다.
pricing: oss
tags: [css-in-js, zero-runtime, atomic-css, design-tokens]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Panda CSS는 컴포넌트 파일 안에서 `css({ ... })` 같은 함수로 스타일을 쓰면, 정적 분석으로 사용된 스타일을 찾아 원자(atomic) CSS 클래스로 생성하는 스타일링 엔진이다. 토큰·시맨틱 토큰·레시피·패턴(`stack`, `grid` 등)을 설정 파일에 정의하고 `styled-system/` 폴더에 타입이 붙은 함수가 생성된다. 이 문서는 **v2** 기준이다(npm `@pandacss/dev` `latest` 2.5.0). v2는 추출 엔진을 Oxc 기반 Rust 엔진으로 바꿔 빌드가 크게 빨라졌고, 사용하는 API(`css()`, 레시피, 패턴, 토큰, JSX 스타일 props)는 v1과 같다.

- 결과물은 Tailwind CSS처럼 원자 클래스지만, 작성은 클래스 문자열 대신 타입이 검사되는 객체로 한다.

## 설치
Vite + React 기준:

```bash
npm install -D @pandacss/dev @pandacss/vite
npx panda init           # panda.config.ts 생성
```

```ts
// vite.config.ts — pandacss()를 React 플러그인보다 앞에
import pandacss from '@pandacss/vite';
import react from '@vitejs/plugin-react';
export default { plugins: [pandacss(), react()] };
```

`src/index.css`에 레이어 순서 `@layer reset, base, tokens, recipes, utilities;` 한 줄을 두고 루트에서 import한다. 생성 CSS는 플러그인이 주입한다. `package.json`에 `"prepare": "panda codegen"`을 두면 설치 시 `styled-system/`을 만든다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `panda.config.ts` | `include`(스캔 경로), `presets`(`@pandacss/preset-base`, `@pandacss/preset-panda`), `theme`, `outdir` |
| `styled-system/` | 코드 생성 결과. `css`, `cva`, `sva`, `patterns`, `jsx`, `tokens` 진입점 |
| `css({...})` | 스타일 객체 → 클래스 문자열. `_hover`, `md: {...}` 같은 조건·반응형 키 |
| 토큰 / 시맨틱 토큰 | `colors.blue.500` 같은 원시 값과 `bg.default`처럼 의미 이름(라이트·다크별 값) |
| 레시피 `cva` | base·variants·compoundVariants를 가진 컴포넌트 스타일. 설정 파일 레시피는 사용한 변형만 생성 |
| 슬롯 레시피 `sva` | 여러 부분(root, label, icon…)으로 된 컴포넌트용 레시피 |
| 패턴 | `stack`, `hstack`, `grid`, `center` 등 레이아웃 함수와 JSX 컴포넌트 |
| 정적 분석 | 빌드 시 소스를 읽어 추출하므로 런타임에 계산된 임의 값은 추출되지 않는다 |

## 기본 사용법
```tsx
import { css, cva } from '../styled-system/css';
import { stack } from '../styled-system/patterns';

const button = cva({
  base: { px: '4', py: '2', rounded: 'md', fontWeight: 'semibold' },
  variants: {
    tone: { primary: { bg: 'blue.600', color: 'white', _hover: { bg: 'blue.700' } },
            ghost: { bg: 'transparent', color: 'blue.600' } },
  },
  defaultVariants: { tone: 'primary' },
});

export function Card() {
  return (
    <div className={stack({ gap: '3', p: { base: '4', md: '6' } })}>
      <h2 className={css({ fontSize: 'xl', color: 'gray.900' })}>제목</h2>
      <button className={button({ tone: 'ghost' })}>자세히</button>
    </div>
  );
}
```

## 자주 쓰는 패턴
- **동적 값은 토큰·변형으로.** `css({ color: props.color })`처럼 런타임 값은 추출되지 않는다. 변형 레시피나 CSS 변수(`style={{ '--c': value }}` + `color: 'var(--c)'`)를 쓴다.
- **런타임 제거.** `pandacss({ transform: true })`를 켜면 정적 `css()`·레시피 호출을 빌드 시 클래스 문자열로 바꿔 스타일 런타임이 번들에서 빠진다.
- **디자인 시스템 배포.** v2의 `panda lib`로 디자인 시스템을 만들고 앱에서 `designSystem` 설정으로 소비하면 앱에서 다시 추출하지 않는다.
- **진단.** `panda doctor`, `panda analyze`로 설정 문제와 토큰·레시피 사용 현황을 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: React·Vue·Solid 등에서 토큰 기반 디자인 시스템을 타입 안전하게 만들고, RSC에서도 동작하는 제로 런타임 스타일이 필요할 때.
- 피할 때(대안): 코드 생성 폴더와 정적 분석 제약이 부담이면 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/). 스타일을 별도 `.css.ts` 파일로 분리하는 편을 선호하면 [vanilla-extract](/develop-wiki/frontend/styling/vanilla-extract/).

## 공식 문서
- [시작하기](https://panda-css.com/docs/overview/getting-started) · [Vite 설치](https://panda-css.com/docs/installation/vite)
- [레시피](https://panda-css.com/docs/concepts/recipes) · [토큰](https://panda-css.com/docs/theming/tokens) · [Source transforms](https://panda-css.com/docs/styling/source-transforms) · [v2 발표](https://panda-css.com/blog/panda-css-v2)
