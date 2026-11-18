---
name: vanilla-extract
url: https://vanilla-extract.style
docs: https://vanilla-extract.style/documentation/getting-started/
repo: https://github.com/vanilla-extract-css/vanilla-extract
stars: 10452
domain: frontend
category: styling
description: TypeScript 파일(.css.ts)에 스타일을 쓰고 빌드 시 정적 CSS로 뽑아내는 제로 런타임 CSS-in-TS 라이브러리.
pricing: oss
tags: [css-in-js, zero-runtime, design-tokens]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
vanilla-extract는 스타일을 `.css.ts` 파일에 TypeScript 객체로 작성하면 빌드 시점에 평범한 CSS 파일과 클래스 이름 문자열로 바꿔 주는 라이브러리다. 런타임에 스타일을 주입하지 않으므로 서버 컴포넌트·SSR에서도 추가 설정이 없고, 테마 변수까지 타입으로 검사된다. 프레임워크에 독립적이며 이 문서는 npm `@vanilla-extract/css` `latest` 1.21.3 기준이다.

- styled-components 같은 런타임 CSS-in-JS의 개발 경험(TS로 스타일 작성)과 CSS Modules의 결과물(정적 CSS + 지역 클래스)을 결합한 위치다.

## 설치
```bash
npm install @vanilla-extract/css
npm install -D @vanilla-extract/vite-plugin   # 번들러별 플러그인 (webpack, esbuild, Next.js, Rollup 등 별도 패키지)
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({ plugins: [vanillaExtractPlugin()] });
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `.css.ts` 파일 | 이 확장자 파일만 빌드 시 실행돼 CSS로 추출된다. 여기서 export한 값은 클래스 이름 문자열 |
| `style({...})` | 지역 범위 클래스 하나 생성. `':hover'`, `selectors`, `'@media'` 키 지원 |
| `styleVariants` | 같은 형태의 클래스 여러 개를 객체로 생성 (`primary`, `secondary` 등) |
| `globalStyle` | 전역 선택자에 스타일 적용 |
| `createTheme` / `createThemeContract` | CSS 변수 묶음(테마)을 만들고 클래스로 전환. `vars.color.brand`처럼 타입 안전하게 참조 |
| `createVar` | 지역 CSS 변수 하나 생성 |
| `@vanilla-extract/recipes` | `recipe()`로 base·variants·compoundVariants를 갖는 컴포넌트 스타일 정의 |
| Sprinkles | `@vanilla-extract/sprinkles`로 유틸리티 클래스 세트를 정적으로 생성 |

## 기본 사용법
```ts
// theme.css.ts
import { createTheme, style } from '@vanilla-extract/css';

export const [themeClass, vars] = createTheme({
  color: { brand: '#3b5bdb', text: '#1f2937' },
  space: { md: '12px' },
});

export const card = style({
  padding: vars.space.md,
  color: vars.color.text,
  borderLeft: `4px solid ${vars.color.brand}`,
  ':hover': { background: '#f8fafc' },
  '@media': { 'screen and (min-width: 768px)': { padding: 24 } },
});
```

```tsx
import { themeClass, card } from './theme.css';

export const Card = () => <div className={`${themeClass} ${card}`}>내용</div>;
```

## 자주 쓰는 패턴
- **변형이 있는 컴포넌트는 recipe.** `recipe({ base, variants: { size: { sm: {...}, lg: {...} } }, defaultVariants })`로 정의하고 `button({ size: 'lg' })`로 클래스를 얻는다.
- **테마 계약 분리.** `createThemeContract`로 변수 모양만 정의하고 라이트·다크 테마를 각각 `createTheme(contract, values)`로 만들어 루트 클래스를 바꾼다.
- **런타임 값은 CSS 변수로.** 동적 값은 `createVar()`로 변수를 만들고 `assignInlineVars`(`@vanilla-extract/dynamic`)로 인라인 스타일에 주입한다.
- **`.css.ts`에는 스타일만.** 이 파일은 빌드 시 실행되므로 React 컴포넌트나 브라우저 API를 두지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인 시스템처럼 토큰과 변형을 타입으로 관리하고 싶을 때, RSC·SSR 환경에서 런타임 CSS-in-JS 비용을 피하고 싶을 때.
- 피할 때(대안): 스타일을 JSX 안에서 바로 쓰는 방식을 원하면 [Panda CSS](/develop-wiki/frontend/styling/panda-css/)나 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/). 번들러 플러그인을 둘 수 없는 환경이면 [Sass](/develop-wiki/frontend/styling/sass/)+CSS Modules.

## 공식 문서
- [시작하기](https://vanilla-extract.style/documentation/getting-started/) · [Vite 연동](https://vanilla-extract.style/documentation/integrations/vite/)
- [Styling API](https://vanilla-extract.style/documentation/styling/) · [Theming](https://vanilla-extract.style/documentation/theming/) · [Recipes](https://vanilla-extract.style/documentation/packages/recipes/)
