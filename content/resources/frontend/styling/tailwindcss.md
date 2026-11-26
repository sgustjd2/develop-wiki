---
name: Tailwind CSS
url: https://tailwindcss.com
repo: https://github.com/tailwindlabs/tailwindcss
stars: 98849
docs: https://tailwindcss.com/docs/installation/using-vite
domain: frontend
category: styling
description: 유틸리티 클래스로 마크업에서 바로 스타일을 짜는 CSS 프레임워크.
pricing: oss
tags: [css, utility-first]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Tailwind CSS는 `flex`, `px-4`, `text-sm`처럼 한 가지 일을 하는 유틸리티 클래스를 마크업에 조합해 스타일을 만드는 CSS 프레임워크다. 소스 파일을 스캔해 실제로 쓴 클래스만 CSS로 생성한다. 이 문서는 **Tailwind CSS v4** 기준이다(npm `latest` 4.3.5, v3는 `v3-lts` 태그로 유지).

- v4부터 설정은 JavaScript 파일이 아니라 CSS 안의 `@theme` 등 지시어로 한다(CSS-first). 디자인 토큰은 그대로 CSS 변수로도 노출된다.
- 컴포넌트 단위 스코프 CSS(CSS Modules, Vue/Svelte `<style>`)나 CSS-in-JS와 대비되는 접근이다.

## 설치
Vite 프로젝트:

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({ plugins: [tailwindcss()] });
```

```css
/* src/style.css */
@import "tailwindcss";
```

Vite가 아닌 환경은 공식 문서의 PostCSS·CLI·프레임워크별 가이드를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 유틸리티 클래스 | 속성 하나에 대응하는 클래스(`mt-4`, `bg-sky-500`, `rounded-lg`) |
| 변형(variant) | `hover:`, `focus:`, `dark:`, `md:`, `group-hover:`처럼 조건을 접두사로 |
| 반응형 | 모바일 우선. `md:grid-cols-3`은 md 이상에서만 적용 |
| 임의 값 | 토큰에 없는 값은 `w-[37rem]`, `bg-[#0f172a]`처럼 대괄호로 |
| `@theme` | 토큰 정의. `--color-*`, `--font-*`, `--text-*`, `--breakpoint-*`, `--spacing` 등 네임스페이스에 맞춰 유틸리티 생성 |
| `@theme inline` | 다른 CSS 변수를 참조하는 토큰을 값으로 인라인 |
| `@utility` | 변형과 함께 쓸 수 있는 커스텀 유틸리티 등록 |
| `@custom-variant` | 커스텀 변형 정의(예: 클래스 기반 다크 모드) |
| `@source` | 자동 감지 밖의 파일(예: `node_modules` 안 UI 라이브러리)을 스캔 대상에 추가 |
| `@apply` / `@reference` | 기존 유틸리티를 CSS 규칙에 인라인 / 컴포넌트 `<style>`에서 CSS 출력 없이 테마 참조 |
| `@plugin` / `@config` | v3 방식 JS 플러그인·설정 파일 불러오기(호환용) |

## 기본 사용법
```html
<article class="mx-auto max-w-md rounded-xl bg-white p-6 shadow-md dark:bg-slate-800">
  <h2 class="text-lg font-semibold text-slate-900 dark:text-white">알림</h2>
  <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">새 버전이 배포되었습니다.</p>
  <button class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500
                 focus-visible:outline-2 focus-visible:outline-indigo-600">
    확인
  </button>
</article>
```

토큰 추가:

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.62 0.19 260);
  --font-display: "Pretendard", sans-serif;
  --breakpoint-3xl: 120rem;
}
/* → bg-brand-500, font-display, 3xl:* 사용 가능 */
```

## 자주 쓰는 패턴
- **클래스 기반 다크 모드.** 기본 `dark:`는 `prefers-color-scheme`를 따른다. 토글 버튼으로 바꾸려면 `@custom-variant dark (&:where(.dark, .dark *));`를 선언하고 `<html class="dark">`를 붙인다.
- **반복 마크업은 컴포넌트로.** 같은 클래스 묶음이 반복되면 `@apply`보다 React/Vue/Astro 컴포넌트로 추출하는 쪽을 먼저 고려한다.
- **기본 팔레트 교체.** `@theme { --color-*: initial; ... }`로 기본 색을 지우고 브랜드 색만 남긴다.
- **동적 클래스 이름 금지.** `` `bg-${color}-500` ``처럼 문자열을 조립하면 스캐너가 찾지 못한다. 완성된 클래스 이름을 객체로 매핑해 쓴다.
- **v3 → v4 이전.** `npx @tailwindcss/upgrade`(Node 20+)가 설정·클래스 이름 변경을 자동 처리한다. 새 브랜치에서 실행하고 diff를 검토한다.
- **클래스 정리.** 공식 Prettier 플러그인(`prettier-plugin-tailwindcss`)으로 클래스 순서를 자동 정렬한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인 토큰을 일관되게 쓰면서 CSS 파일 왕복 없이 빠르게 UI를 만들 때, 컴포넌트 기반 프레임워크([React](/develop-wiki/frontend/framework/react/), [Vue](/develop-wiki/frontend/framework/vue/), [Astro](/develop-wiki/frontend/meta-framework/astro/))와 함께.
- 피할 때(대안): 마크업을 바꿀 수 없는 CMS 출력 스타일링, 클래스 나열을 꺼리는 팀은 CSS Modules나 일반 CSS + CSS 변수. v4는 Safari 16.4+, Chrome 111+, Firefox 128+를 대상으로 하므로 그보다 오래된 브라우저를 지원해야 하면 v3.4에 머문다.

## 공식 문서
- [Vite 설치](https://tailwindcss.com/docs/installation/using-vite) · [테마 변수](https://tailwindcss.com/docs/theme) · [지시어와 함수](https://tailwindcss.com/docs/functions-and-directives)
- [다크 모드](https://tailwindcss.com/docs/dark-mode) · [v4 업그레이드 가이드](https://tailwindcss.com/docs/upgrade-guide)
