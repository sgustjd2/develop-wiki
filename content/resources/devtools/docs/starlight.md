---
name: Starlight
url: https://starlight.astro.build
docs: https://starlight.astro.build/getting-started/
repo: https://github.com/withastro/starlight
stars: 9632
domain: devtools
category: docs
description: Astro 위에서 동작하는 문서 사이트 테마·통합. 검색·다국어·접근성을 기본 제공해 프레임워크 제약 없는 빠른 정적 문서 사이트를 만들 때 쓴다.
pricing: oss
tags: [documentation, astro, static-site, i18n, markdown]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Starlight는 [Astro](/develop-wiki/frontend/meta-framework/astro/)의 공식 문서 테마로, `src/content/docs/`의 Markdown·MDX·Markdoc 파일을 사이드바·목차·검색(Pagefind)이 있는 정적 사이트로 만든다. 기본 출력은 JavaScript가 거의 없는 HTML이며, 필요하면 React·Vue·Svelte 컴포넌트를 섬(island)으로 넣는다. 이 문서는 **0.43** 기준(npm latest 0.43.1, MIT, Astro 7 필요). 아직 1.0 전이라 마이너 버전마다 변경 사항을 확인한다. 공식 문서 한국어 번역이 있다.

- 대안: [Docusaurus](/develop-wiki/devtools/docs/docusaurus/)(React), [VitePress](/develop-wiki/devtools/docs/vitepress/)(Vue).

## 설치
```bash
npm create astro@latest -- --template starlight
npm run dev
npm run build      # dist/
```
기존 Astro 프로젝트에는 `npx astro add starlight`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `starlight()` 통합 | `astro.config.mjs`의 `integrations`에 추가 |
| `src/content/docs/` | 문서 파일 위치. 경로가 곧 URL |
| sidebar | 수동 항목 또는 `autogenerate: { directory }` |
| frontmatter | `title`(필수), `description`, `sidebar.order`, `template: splash` |
| 내장 컴포넌트 | `Tabs`, `Card`, `Aside`, `Steps`, `FileTree` (MDX에서 import) |
| i18n | `locales`로 언어별 폴더, 누락 번역은 기본 언어로 대체 |
| 검색 | Pagefind 기반 로컬 검색 기본 포함 |

## 기본 사용법
`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      defaultLocale: 'root',
      locales: { root: { label: '한국어', lang: 'ko' }, en: { label: 'English' } },
      sidebar: [
        { label: '가이드', autogenerate: { directory: 'guides' } },
        { label: '레퍼런스', autogenerate: { directory: 'reference' } },
      ],
    }),
  ],
});
```

`src/content/docs/guides/install.mdx`:

```mdx
---
title: 설치
---
import { Steps, Aside } from '@astrojs/starlight/components';

<Aside type="tip">Node.js LTS 버전을 권장합니다.</Aside>
```

## 자주 쓰는 패턴
- **폴더 자동 사이드바.** `autogenerate`와 frontmatter `sidebar.order`로 순서만 조정.
- **커스텀 스타일.** `customCss`에 CSS 파일을 추가하거나 컴포넌트 오버라이드(`components`)로 헤더 등 교체.
- **플러그인.** 커뮤니티 플러그인으로 블로그, OpenAPI 문서, 링크 검사 추가.
- **콘텐츠 컬렉션.** Astro 콘텐츠 스키마를 확장해 문서 frontmatter 필드를 검증.

## 언제 쓰나 / 피할 때
- 쓸 때: 빠른 로딩·접근성·다국어가 중요한 문서, Astro를 이미 쓰거나 특정 UI 프레임워크에 묶이고 싶지 않을 때.
- 피할 때(대안): 문서 버전 스냅샷이 핵심이면 Docusaurus. 0.x 단계 변경을 따라가기 어렵다면 안정 버전이 오래된 도구를 고른다.

## 공식 문서
- [시작하기](https://starlight.astro.build/getting-started/) · [한국어](https://starlight.astro.build/ko/getting-started/) · [설정 레퍼런스](https://starlight.astro.build/reference/configuration/)
- [사이드바](https://starlight.astro.build/guides/sidebar/) · [컴포넌트](https://starlight.astro.build/components/using-components/)
