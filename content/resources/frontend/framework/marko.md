---
name: Marko
url: https://markojs.com
docs: https://markojs.com/docs/introduction/welcome-to-marko
repo: https://github.com/marko-js/marko
stars: 14476
domain: frontend
category: framework
description: HTML을 확장한 템플릿 문법을 컴파일해 서버에서 스트리밍 렌더링하고, 상호작용이 필요한 부분의 JS만 브라우저로 보내는 UI 언어. 서버 렌더링 중심 사이트에 쓴다.
pricing: oss
tags: [streaming, ssr, compiler, resumability, html]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Marko는 eBay에서 시작한 UI 언어로, `.marko` 파일에 HTML과 거의 같은 문법으로 마크업·상태·이벤트를 쓴다. 컴파일러가 어느 부분이 브라우저에서 다시 실행돼야 하는지 판단해 **그 부분의 코드만** 클라이언트로 보내고, 서버는 HTML을 준비되는 대로 순서대로/순서 밖으로 스트리밍한다. 직렬화한 상태를 HTML에 실어 브라우저가 서버 작업을 반복하지 않고 이어받는다(resumability). 이 문서는 **Marko 6(Tags API)** 기준이다(npm `marko` `latest` 6.4.16, 5.x는 `m5` 태그로 계속 배포).

- Marko 5의 Class API(`class { onCreate() {} }`)에서 6의 Tags API(`<let>`, `<const>`, `<script>`)로 문법이 바뀌었다. 공식 문서에 "Marko 5 Interop", "Class to Tags API" 가이드가 있다.
- 파일 라우팅·서버 핸들러는 메타 프레임워크 **Marko Run**(`@marko/run`)이 맡는다.

## 설치
```bash
npm init marko -- -t basic     # Marko Run 템플릿
cd my-marko-application
npm run dev
```

직접 구성: `npm install marko` 후 `npm install -D vite @marko/vite`. 타입 검사는 `@marko/type-check`의 `mtc` 명령.

## 핵심 개념
| 문법 | 설명 |
| --- | --- |
| `input` | 태그에 전달된 속성 객체. `${input.name}` |
| `export interface Input {}` | 같은 파일에서 TypeScript로 props 타입 선언 |
| `<let/count=0>` | 변경 가능한 상태. 대입하면 읽는 곳이 다시 실행됨 |
| `<const/doubled=count * 2>` | 파생 값 |
| `<if=cond>` / `<else>` | 조건 렌더링 |
| `<for\|item\| of=list by="id">` | 반복. `in=`(객체), `from`/`to`(숫자 범위)도 가능 |
| `<await\|user\|=getUser()>` | Promise 결과를 기다려 렌더, 서버에서는 스트리밍 |
| `<try>` + `@catch` / `@placeholder` | 오류·로딩 경계 |
| `<script>` | 마운트 후 브라우저에서 실행, 참조 값이 바뀌면 재실행 |
| 태그 자동 탐색 | `.marko` 파일은 import 없이 커스텀 태그로 쓸 수 있다 |

## 기본 사용법
`src/tags/todo-list.marko`:

```marko
<let/items=[]>
<let/text="">

<h2>${input.title}</h2>
<input value=text onInput(e) { text = e.target.value }>
<button onClick() { items = [...items, text]; text = "" }>추가</button>
<ul>
  <for|item| of=items>
    <li>${item}</li>
  </for>
</ul>
<if=items.length === 0>
  <p>비어 있음</p>
</if>
```

Marko Run 라우트(`src/routes/+page.marko`)에서 사용: `<todo-list title="할 일"/>`.

## 자주 쓰는 패턴
- **Marko Run 파일 규칙:** `+page.marko`(페이지), `+layout.marko`(레이아웃, `content` 입력), `+handler.ts`(`GET`·`POST` 등 export), `+middleware.ts`, `$id` 폴더(동적 세그먼트).
- **느린 데이터는 `<await>`로 감싼다:** 나머지 HTML이 먼저 전송되고 결과는 도착하는 대로 스트리밍된다.
- **컴포넌트 범위 CSS:** `<style>` 블록, 또는 `<style/styles>`로 CSS Modules 클래스명을 받는다.
- **5.x 프로젝트:** 5와 6 태그를 섞어 쓰는 interop 가이드를 보고 점진적으로 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상품 목록·검색 결과처럼 서버 렌더링 비중이 크고 첫 바이트·초기 JS를 줄여야 하는 사이트, HTML에 가까운 문법을 선호하는 팀.
- 피할 때(대안): 컴포넌트 라이브러리·채용 풀 등 생태계가 중요하면 [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/). 비슷한 "JS 최소화" 접근은 [Qwik](/develop-wiki/frontend/meta-framework/qwik/), 콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/).

## 공식 문서
- [소개](https://markojs.com/docs/introduction/welcome-to-marko) · [설치](https://markojs.com/docs/introduction/installation) · [언어 레퍼런스](https://markojs.com/docs/reference/language) · [코어 태그](https://markojs.com/docs/reference/core-tag)
- [Marko Run 파일 라우팅](https://markojs.com/docs/marko-run/file-based-routing)
