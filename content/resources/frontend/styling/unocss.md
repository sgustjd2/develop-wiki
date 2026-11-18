---
name: UnoCSS
url: https://unocss.dev
docs: https://unocss.dev/guide/
repo: https://github.com/unocss/unocss
stars: 18991
domain: frontend
category: styling
description: 규칙과 프리셋을 조합해 쓰는 온디맨드 원자 CSS 엔진. Tailwind 호환 프리셋, 아이콘, 속성 모드 등을 골라 쓴다.
pricing: oss
tags: [css, atomic-css, utility-first, vite]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
UnoCSS는 소스 코드에서 쓰인 클래스 이름을 찾아 해당 CSS만 생성하는 원자 CSS **엔진**이다. 엔진 자체에는 유틸리티가 없고, 모든 유틸리티는 프리셋이 제공한다. Tailwind CSS v4 규칙과 맞춘 `presetWind4`, v3·Windi 호환 `presetWind3`, 최소 세트 `presetMini` 중 하나를 고르고 아이콘·속성 모드·웹 폰트 같은 프리셋을 더하는 구조다. 이 문서는 npm `unocss` `latest` 66.13.0 기준이다(라이선스 MIT).

- Tailwind CSS와 결과물은 비슷하지만, 정규식+함수로 직접 규칙을 정의하기 쉽고 프리셋을 자유롭게 조합한다는 점이 다르다.
- 예전 기본 프리셋 `presetUno`는 `presetWind3`으로 이름이 바뀌어 deprecated다.

## 설치
Vite 기준:

```bash
npm install -D unocss
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
export default defineConfig({ plugins: [UnoCSS()] });
```

엔트리(`main.ts`)에 `import 'virtual:uno.css'`를 추가한다. Astro, webpack, Rollup, PostCSS 통합도 같은 패키지의 하위 경로(`unocss/astro` 등)로 제공된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `uno.config.ts` | 프리셋·규칙·단축키·테마를 정의하는 설정 파일 (`defineConfig`) |
| 프리셋 | `presetWind4`·`presetWind3`·`presetMini`(유틸리티), `presetIcons`, `presetAttributify`, `presetTypography`, `presetWebFonts` 등 |
| 규칙(rules) | `['m-1', { margin: '1px' }]` 같은 정적 규칙, 정규식 매처와 함수 본문으로 된 동적 규칙(아래 예제의 `stack-N`) |
| 단축키(shortcuts) | 여러 유틸리티를 하나의 이름으로 묶음 (`btn: 'px-4 py-2 rounded'`) |
| 변형(variants) | `hover:`, `dark:`, `md:` 같은 접두사 |
| 트랜스포머 | `transformerVariantGroup`(`hover:(bg-gray-100 text-black)`), `transformerDirectives`(`@apply`) 등 소스 변환 |
| 인스펙터 | Vite 개발 서버의 `/__unocss`에서 생성된 규칙과 사용 현황 확인 |

## 기본 사용법
```ts
// uno.config.ts
import { defineConfig, presetWind4, presetIcons, transformerVariantGroup } from 'unocss';

export default defineConfig({
  presets: [presetWind4(), presetIcons()],
  transformers: [transformerVariantGroup()],
  shortcuts: { btn: 'px-4 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700' },
  rules: [[/^stack-(\d+)$/, ([, n]) => ({ display: 'flex', 'flex-direction': 'column', gap: `${Number(n) / 4}rem` })]],
});
```

```html
<section class="stack-4 p-6 md:(p-10 max-w-2xl)">
  <h1 class="text-2xl font-bold">제목</h1>
  <button class="btn"><span class="i-carbon-add" /> 추가</button>
</section>
```

## 자주 쓰는 패턴
- **아이콘을 CSS로.** `presetIcons`와 Iconify 아이콘 데이터(`npm i -D @iconify-json/carbon` 등)를 설치하면 `i-carbon-add` 같은 클래스 하나로 아이콘을 쓴다.
- **팀 규칙은 프리셋으로.** 공통 테마·단축키·규칙을 사내 프리셋으로 묶어 여러 프로젝트에서 `presets: [myPreset()]`로 재사용한다.
- **Tailwind 이전.** Tailwind v4 문법에 맞추려면 `presetWind4`, 기존 v3 문법 프로젝트는 `presetWind3`을 쓴다.
- **동적 클래스 주의.** 문자열을 조합한 클래스(`'text-' + color`)는 스캔되지 않는다. 전체 클래스 이름을 소스에 두거나 `safelist`에 등록한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vite 기반 프로젝트에서 유틸리티 CSS를 쓰되 규칙·프리셋을 직접 확장하고 싶을 때, 아이콘을 CSS 클래스로 다루고 싶을 때.
- 피할 때(대안): 생태계·자료·플러그인 호환을 가장 넓게 원하면 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/). 타입 검사되는 객체로 스타일을 쓰고 싶으면 [Panda CSS](/develop-wiki/frontend/styling/panda-css/).

## 공식 문서
- [가이드](https://unocss.dev/guide/) · [Vite 통합](https://unocss.dev/integrations/vite) · [설정 파일](https://unocss.dev/guide/config-file)
- [프리셋 목록](https://unocss.dev/presets/) · [presetWind4](https://unocss.dev/presets/wind4) · [단축키](https://unocss.dev/config/shortcuts) · [인스펙터](https://unocss.dev/tools/inspector)
