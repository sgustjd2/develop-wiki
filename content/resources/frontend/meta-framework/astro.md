---
name: Astro
url: https://astro.build
repo: https://github.com/withastro/astro
stars: 64262
docs: https://docs.astro.build/en/getting-started/
domain: frontend
category: meta-framework
description: 콘텐츠 중심 사이트에 강한 프레임워크. 기본은 JS 없는 정적 HTML이고 필요한 곳만 아일랜드로 붙인다.
pricing: oss
tags: [ssg, islands, content]
languages: [typescript]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Astro는 페이지를 서버(빌드 시점 또는 요청 시점)에서 HTML로 렌더링하고, 기본적으로 클라이언트 JavaScript를 보내지 않는 웹 프레임워크다. 상호작용이 필요한 컴포넌트만 "아일랜드"로 골라 하이드레이션하며, 그 컴포넌트는 [React](/develop-wiki/frontend/framework/react/), [Vue](/develop-wiki/frontend/framework/vue/), [Svelte](/develop-wiki/frontend/framework/svelte/), [Solid](/develop-wiki/frontend/framework/solid/), [Preact](/develop-wiki/frontend/framework/preact/) 중 무엇으로 써도 된다. 이 문서는 **Astro 7** 기준이다(npm `latest` 7.4.12). 이 사이트(dev.hub)도 Astro로 만들어졌다.

- 7에서는 Vite 8, Rust 기반 `.astro` 컴파일러, 새 기본 Markdown 처리기, `compressHTML: 'jsx'` 기본값이 들어왔다.
- 앱 중심 메타 프레임워크(Next.js, SvelteKit, Nuxt)와 달리 문서·블로그·마케팅 같은 콘텐츠 사이트에 초점을 둔다.

## 설치
Node.js 22.23.4 이상(짝수 LTS 계열)이 필요하다.

```bash
npm create astro@latest
cd my-site && npm run dev       # astro dev
```

통합 추가는 `npx astro add react`, `npx astro add netlify`(어댑터)처럼 한다. 빌드는 `astro build`, 미리보기는 `astro preview`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `.astro` 컴포넌트 | `---` 코드 펜스(서버에서 실행) + HTML 템플릿. 클라이언트로 JS가 가지 않음 |
| 파일 기반 라우팅 | `src/pages/` 경로가 URL. `[slug].astro` 동적 경로는 정적 빌드 시 `getStaticPaths()` 필요 |
| 아일랜드 | 프레임워크 컴포넌트에 `client:*` 디렉티브를 붙인 것만 브라우저에서 하이드레이션 |
| `client:load` / `client:idle` / `client:visible` | 즉시 / 브라우저 유휴 시 / 화면에 보일 때 하이드레이션 |
| `client:media` / `client:only` | 미디어 쿼리 충족 시 / 서버 렌더링 없이 클라이언트에서만 |
| 서버 아일랜드 | `server:defer`를 붙인 컴포넌트는 나중에 따로 렌더링, `slot="fallback"`으로 자리 표시. 어댑터 필요 |
| 콘텐츠 컬렉션 | `src/content.config.ts`에서 `defineCollection` + 로더(`glob`, `file`) + Zod 스키마 |
| 렌더링 모드 | 기본 정적 생성. 어댑터를 붙이면 페이지별 `export const prerender = false`로 요청 시 렌더링 |
| Actions | 타입 검증된 서버 함수를 클라이언트·폼에서 호출 (`astro:actions`) |
| 어댑터 | Node, Vercel, Netlify, Cloudflare 등 배포 대상별 서버 출력 |

## 기본 사용법
`src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({ title: z.string(), pubDate: z.coerce.date() }),
});

export const collections = { blog };
```

`src/pages/blog/[id].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import LikeButton from '../../components/LikeButton.tsx';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
<LikeButton client:visible />
```

## 자주 쓰는 패턴
- **레이아웃 컴포넌트.** `src/layouts/Base.astro`에 `<html>` 골격과 `<slot />`을 두고 페이지가 감싸 쓴다.
- **필요한 곳만 하이드레이션.** 화면 아래 위젯은 `client:visible`, 데스크톱 전용 UI는 `client:media="(min-width: 768px)"`처럼 비용을 미룬다.
- **정적 + 일부 동적.** 대부분 정적으로 두고 개인화 영역만 `server:defer` 서버 아일랜드로 분리해 캐시 효율을 지킨다.
- **스키마로 콘텐츠 검증.** 컬렉션 스키마가 frontmatter 오류를 빌드 단계에서 잡는다. `astro sync`로 타입을 생성한다.
- **스타일.** `.astro`의 `<style>`은 기본으로 컴포넌트 범위. [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/)는 Vite 플러그인으로 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 문서 사이트·블로그·마케팅 페이지·이 사이트 같은 레퍼런스 허브처럼 콘텐츠 비중이 크고 초기 로딩 속도가 중요한 사이트, 여러 UI 프레임워크 컴포넌트를 섞어야 할 때.
- 피할 때(대안): 화면 대부분이 상호작용인 대시보드·편집기형 앱은 React 기반 프레임워크(Next.js, React Router)나 SvelteKit 같은 앱 중심 도구가 더 자연스럽다.
- 7로 올릴 때: 더 엄격한 Rust 컴파일러가 닫히지 않은 태그를 오류로 처리하고, remark/rehype 플러그인을 쓰면 `@astrojs/markdown-remark`를 직접 설치해야 하며, `@astrojs/db`는 제거됐다.

## 공식 문서
- [시작하기](https://docs.astro.build/en/getting-started/) · [설치](https://docs.astro.build/en/install-and-setup/) · [아일랜드](https://docs.astro.build/en/concepts/islands/)
- [콘텐츠 컬렉션](https://docs.astro.build/en/guides/content-collections/) · [서버 아일랜드](https://docs.astro.build/en/guides/server-islands/) · [v7 업그레이드](https://docs.astro.build/en/guides/upgrade-to/v7/)
