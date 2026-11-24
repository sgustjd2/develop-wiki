---
name: Deno
url: https://deno.com
docs: https://docs.deno.com
repo: https://github.com/denoland/deno
stars: 108971
domain: backend
category: runtime-language
description: 권한 기반 보안 모델과 TypeScript 기본 지원을 갖춘 V8 기반 JS 런타임. 포맷터·린터·테스트가 내장돼 있고 npm 패키지도 쓸 수 있다.
pricing: oss
tags: [javascript, typescript, runtime, jsr, security]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Deno 는 Node.js 를 만든 Ryan Dahl 이 시작한 Rust·V8 기반 런타임이다. 파일·네트워크·환경 변수 접근을 기본적으로 막고 `--allow-*` 플래그로 명시적으로 허용하는 **권한 모델**, 설정 없는 TypeScript 실행, `deno fmt`·`deno lint`·`deno test` 같은 내장 도구가 특징이다. Deno 2 부터 `package.json`·`node_modules`·`npm:` 지정자를 지원해 npm 생태계와 호환된다.

2026-11 기준 최신 안정판은 **2.9.8**(2026-10-21). 자체 패키지 레지스트리 **JSR**(jsr.io)과 서버리스 호스팅 Deno Deploy 를 함께 운영해 왔다. 2026-10-09 Deno 팀이 Cloudflare 에 합류한다고 발표했고, Deno 런타임은 1년간 월간 릴리스(버그·보안 수정)를 낸 뒤 개발을 종료한다(오픈소스로는 유지). Deno Deploy 는 6개월 뒤 종료되며 JSR 은 Cloudflare 로 인프라를 옮겨 계속 운영한다.

## 설치
```bash
curl -fsSL https://deno.land/install.sh | sh   # macOS·Linux
irm https://deno.land/install.ps1 | iex        # Windows PowerShell
deno upgrade
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 권한 | `--allow-net`, `--allow-read`, `--allow-env` 등. `-A` 는 전부 허용 |
| `deno.json` | 태스크, import map, 컴파일러·린트 설정을 담는 설정 파일 |
| 지정자 | `npm:express`, `jsr:@std/path`, 로컬 경로. `deno add` 로 `deno.json` 에 등록 |
| `Deno.serve` | 내장 HTTP 서버. Web 표준 `Request`→`Response` 핸들러 |
| 내장 도구 | `fmt`, `lint`, `test`, `bench`, `check`, `compile`, `doc`, `task` |
| Node 호환 | `node:fs` 등 Node 내장 모듈과 `package.json` 프로젝트 지원 |

## 기본 사용법
```bash
deno init my-api && cd my-api
deno add jsr:@std/assert
```
```ts
// main.ts — deno run --allow-net main.ts
Deno.serve({ port: 8000 }, (req) => {
  const url = new URL(req.url)
  if (url.pathname === '/hello') {
    return Response.json({ message: `hello ${url.searchParams.get('name') ?? 'deno'}` })
  }
  return new Response('not found', { status: 404 })
})
```
```ts
// main_test.ts — deno test
import { assertEquals } from '@std/assert'

Deno.test('add', () => {
  assertEquals(1 + 2, 3)
})
```

## 자주 쓰는 패턴
- **`deno serve`**: `export default { fetch(req) { ... } }` 형태 모듈을 `deno serve --parallel main.ts` 로 여러 코어에 띄운다.
- **최소 권한 실행**: `--allow-net=api.example.com --allow-read=./data` 처럼 호스트·경로 단위로 좁혀 공급망 공격 영향을 줄인다.
- **단일 실행 파일**: `deno compile --allow-net main.ts` 로 배포용 바이너리 생성.
- **태스크 러너**: `deno.json` 의 `"tasks"` 에 `dev`, `test` 를 정의하고 `deno task dev` 로 실행.
- **프레임워크**: [Hono](/develop-wiki/backend/web-framework/hono/), Fresh, npm 의 [Express](/develop-wiki/backend/web-framework/express/) 도 동작한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 스크립트·도구에 권한 제한을 걸고 싶을 때, 설정 없이 TS·포맷·린트·테스트를 바로 쓰고 싶을 때, 엣지 배포.
- 피할 때(대안): 네이티브 애드온·특정 Node 동작에 강하게 의존하는 레거시는 [Node.js](/develop-wiki/backend/runtime-language/nodejs/), 설치·번들 속도가 주 관심이면 [Bun](/develop-wiki/backend/runtime-language/bun/).

## 공식 문서
- [문서](https://docs.deno.com) · [권한](https://docs.deno.com/runtime/fundamentals/security/) · [Node·npm 호환](https://docs.deno.com/runtime/fundamentals/node/) · [JSR](https://jsr.io/docs)
