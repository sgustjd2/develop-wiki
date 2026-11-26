---
name: VitePress
url: https://vitepress.dev
docs: https://vitepress.dev/guide/getting-started
repo: https://github.com/vuejs/vitepress
stars: 18529
domain: devtools
category: docs
description: Vite와 Vue로 Markdown 문서를 빠르게 빌드하는 정적 사이트 생성기. 라이브러리 문서처럼 가볍고 빠른 문서 사이트에 쓴다.
pricing: oss
tags: [documentation, static-site, vue, vite, markdown]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
VitePress는 Vue 팀이 만든 문서 사이트 생성기로, 개발 중에는 Vite 개발 서버로 즉시 반영하고 빌드 결과는 정적 HTML + 클라이언트 측 라우팅(SPA)으로 동작한다. Vue·Vite·Vitest 등 다수 라이브러리 문서가 VitePress로 만들어졌다. 안정판은 **1.6.4**(npm `latest`, MIT)이고, **2.0은 alpha**(2026-11 기준 2.0.0-alpha.21) 단계다. 공식 문서에 한국어 번역이 있다.

- 대안: React 기반 [Docusaurus](/develop-wiki/devtools/docs/docusaurus/), Astro 기반 [Starlight](/develop-wiki/devtools/docs/starlight/).

## 설치
```bash
npm add -D vitepress
npx vitepress init       # 설정 마법사 (docs 폴더, 테마 선택)
npm run docs:dev         # 마법사가 package.json 에 스크립트 추가
npm run docs:build       # docs/.vitepress/dist
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `.vitepress/config.mts` | 사이트·테마 설정 (`defineConfig`) |
| 파일 기반 라우팅 | `docs/guide/intro.md` → `/guide/intro` |
| 기본 테마 | `themeConfig`의 `nav`, `sidebar`, `socialLinks`, `search` |
| frontmatter | `layout: home`(홈 레이아웃), `outline`, `title` |
| Markdown 확장 | `::: tip` 컨테이너, 코드 그룹, 줄 강조, `<<<` 코드 조각 가져오기 |
| Vue in Markdown | `.md` 안에서 Vue 컴포넌트·`{{ }}` 보간 |

## 기본 사용법
`docs/.vitepress/config.mts`:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My Lib',
  description: '라이브러리 문서',
  base: '/my-lib/',
  themeConfig: {
    nav: [{ text: '가이드', link: '/guide/intro' }],
    sidebar: [
      { text: '시작하기', items: [
        { text: '소개', link: '/guide/intro' },
        { text: '설치', link: '/guide/install' },
      ] },
    ],
    search: { provider: 'local' },
  },
})
```

## 자주 쓰는 패턴
- **로컬 검색.** `search: { provider: 'local' }`로 외부 서비스 없이 검색.
- **실제 코드 포함.** `<<< @/snippets/example.ts`로 저장소의 코드 파일을 문서에 그대로 넣어 예제와 코드가 어긋나지 않게.
- **다국어.** `locales` 설정으로 `/ko/` 같은 경로별 언어 사이트.
- **GitHub Pages.** `base`를 저장소 이름으로 맞추고 Actions로 `dist` 배포.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈소스 라이브러리 문서, 빠른 개발 서버와 단순한 설정을 원할 때, Vue 생태계.
- 피할 때(대안): 문서 버전 스냅샷 기능이 필요하면 Docusaurus. 2.0 alpha로 넘어가는 시기라 신규 프로젝트는 안정판 1.x 사용을 기본으로.

## 공식 문서
- [시작하기](https://vitepress.dev/guide/getting-started) · [한국어 문서](https://vitepress.dev/ko/guide/getting-started) · [설정 레퍼런스](https://vitepress.dev/reference/site-config)
- [기본 테마](https://vitepress.dev/reference/default-theme-config) · [Markdown 확장](https://vitepress.dev/guide/markdown)
