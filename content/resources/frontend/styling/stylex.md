---
name: StyleX
url: https://stylexjs.com
docs: https://stylexjs.com/docs/learn/
repo: https://github.com/meta/stylex
stars: 10510
domain: frontend
category: styling
description: Meta가 만든 컴파일 타임 원자 CSS 라이브러리. JS 객체로 스타일을 정의하고 빌드 시 원자 클래스로 바꿔 대규모 앱에서 스타일 충돌을 줄인다.
pricing: oss
tags: [css-in-js, zero-runtime, atomic-css]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
StyleX는 `stylex.create()`로 정의한 스타일 객체를 빌드 시점에 원자 CSS 클래스로 컴파일하고, `stylex.props()`로 여러 스타일을 합칠 때 **나중에 넣은 스타일이 항상 이긴다**는 규칙을 보장하는 라이브러리다. Facebook·Instagram 등 Meta 제품에서 쓰는 스타일 시스템을 공개한 것으로, 스타일 우선순위가 CSS 선언 순서에 의존하지 않아 큰 코드베이스에서 예측하기 쉽다. 이 문서는 npm `@stylexjs/stylex` `latest` 0.19.2 기준이다(아직 0.x이므로 마이너 버전에서 API가 바뀔 수 있다).

- Panda CSS·vanilla-extract와 같은 제로 런타임 계열이지만, 토큰 프리셋 없이 "스타일 합성 규칙"과 타입 안전한 스타일 props에 집중한다.

## 설치
Vite 기준(다른 번들러는 Babel·PostCSS 플러그인 또는 `@stylexjs/unplugin`의 해당 진입점 사용):

```bash
npm install @stylexjs/stylex
npm install -D @stylexjs/unplugin @stylexjs/eslint-plugin
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

export default defineConfig({ plugins: [stylex.vite({ useCSSLayers: true }), react()] });
```

생성된 CSS는 Vite가 내보내는 CSS 자산에 합쳐진다. 루트에서 전역 CSS 파일 하나를 import해 두는 구성이 권장된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `stylex.create({...})` | 이름 붙은 스타일 묶음 정의. 빌드 시 원자 클래스로 바뀜 |
| `stylex.props(...)` | 스타일을 합쳐 `className`(+필요 시 `style`)을 돌려줌. 뒤쪽 인자가 우선 |
| 조건부 값 | 속성 값을 `{ default, ':hover', '@media (...)' }` 객체로 써서 상태·미디어별 값 지정 |
| 동적 스타일 | `size: (px) => ({ width: px })`처럼 화살표 함수. CSS 변수로 처리됨 |
| `defineVars` / `createTheme` | `.stylex.ts` 파일에 디자인 토큰(CSS 변수)을 정의하고 테마로 덮어씀 |
| 정적 분석 제약 | 스타일 객체에는 리터럴·상수·단순 식만. 일반 함수 호출, 객체 스프레드, 다른 모듈 import(토큰 제외) 불가 |
| 타입 | `StyleXStyles` 타입으로 컴포넌트가 받을 수 있는 스타일 속성을 제한 |

## 기본 사용법
```tsx
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  button: {
    paddingBlock: 8,
    paddingInline: 16,
    borderRadius: 6,
    backgroundColor: { default: 'lightblue', ':hover': 'steelblue' },
    width: { default: 'auto', '@media (max-width: 600px)': '100%' },
  },
  danger: { backgroundColor: 'crimson' },
});

export function Button({ danger, label }: { danger?: boolean; label: string }) {
  return <button {...stylex.props(styles.button, danger && styles.danger)}>{label}</button>;
}
```

## 자주 쓰는 패턴
- **외부에서 스타일 덮어쓰기.** 컴포넌트가 `style?: StyleXStyles`를 받아 `stylex.props(styles.base, style)` 마지막에 넣으면 호출자 스타일이 항상 이긴다.
- **허용 속성 제한.** `StyleXStyles<{ color?: string; marginTop?: number }>`처럼 타입을 좁혀 레이아웃을 깨는 속성을 막는다.
- **토큰 파일.** `tokens.stylex.ts`에서 `export const colors = stylex.defineVars({ brand: '#3b5bdb' })`로 정의하고 스타일에서 `colors.brand`로 참조한다.
- **린트.** `@stylexjs/eslint-plugin`이 잘못된 속성·정적 분석 불가 값을 미리 잡는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 팀이 공유 컴포넌트를 쓰는 큰 React 앱에서 스타일 충돌과 우선순위 문제를 없애고 싶을 때.
- 피할 때(대안): 유틸리티 클래스나 토큰 프리셋이 바로 필요하면 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/)·[Panda CSS](/develop-wiki/frontend/styling/panda-css/). 0.x 버전 변화가 부담이면 [vanilla-extract](/develop-wiki/frontend/styling/vanilla-extract/).

## 공식 문서
- [소개](https://stylexjs.com/docs/learn/) · [설치](https://stylexjs.com/docs/learn/installation/) · [Vite 설치](https://stylexjs.com/docs/learn/installation/vite/)
- [스타일 정의](https://stylexjs.com/docs/learn/styling-ui/defining-styles/) · [`stylex.props` API](https://stylexjs.com/docs/api/javascript/props)
