---
name: Node.js
url: https://nodejs.org
docs: https://nodejs.org/docs/latest/api/
repo: https://github.com/nodejs/node
stars: 123813
domain: backend
category: runtime-language
description: V8 엔진 기반 JavaScript·TypeScript 서버 런타임. 이벤트 루프 위의 비동기 I/O 로 API 서버, CLI, 빌드 도구를 실행할 때 쓴다.
pricing: oss
tags: [javascript, typescript, v8, npm, runtime]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Node.js 는 Chrome 의 V8 엔진과 libuv(이벤트 루프·비동기 I/O)를 묶은 JavaScript 런타임이다. 하나의 스레드에서 이벤트 루프가 소켓·파일 I/O 를 논블로킹으로 처리하므로 I/O 가 많은 API 서버에 맞고, npm 레지스트리라는 가장 큰 패키지 생태계를 갖고 있다. 언어 자체는 [TypeScript/JavaScript](/develop-wiki/languages/typescript/) 페이지를 참고한다.

같은 JS 런타임으로 [Bun](/develop-wiki/backend/runtime-language/bun/)·[Deno](/develop-wiki/backend/runtime-language/deno/) 가 있지만, 라이브러리 호환성과 운영 사례가 가장 넓은 기본값은 Node.js 다.

**릴리스 현황(2026-11 기준)**
| 라인 | 상태 | 최신 |
| --- | --- | --- |
| 26.x "Lithium" | Active LTS (2026-10 승격) | 26.13.1 |
| 24.x "Krypton" | Maintenance LTS | 24.22.3 |
| 22.x "Jod" | Maintenance LTS | 22.23.5 |
| 27.x | alpha 채널 | 27.0.0-alpha |

Node.js 는 27.x 부터 **1년에 메이저 1개(4월 출시 → 10월 LTS)**, 홀짝 구분 없이 모든 메이저가 LTS 가 되는 일정으로 바뀐다. 26.x 가 기존 방식의 마지막 라인이며, 27 이전까지는 alpha 채널로 시험판이 나온다.

## 설치
```bash
# 버전 관리자 사용 권장 (fnm, nvm, volta 등)
fnm install --lts && fnm use --lts
node --version
```
공식 설치 파일·Docker 이미지(`node:26`)도 있다. 운영 환경은 LTS 라인을 고른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 이벤트 루프 | 콜백·Promise 를 큐에서 꺼내 실행. CPU 를 오래 잡는 코드는 전체 요청을 막는다 |
| 모듈 | ESM(`import`)과 CommonJS(`require`) 공존. `package.json` 의 `"type": "module"` 로 기본값 지정 |
| 내장 모듈 | `node:http`, `node:fs/promises`, `node:crypto`, `node:test` 등 `node:` 접두사 |
| 타입 스트리핑 | `.ts` 파일을 타입 주석만 지우고 바로 실행(23.6+/22.18+ 기본 활성). `enum` 같은 변환이 필요한 문법은 제외 |
| Worker Threads | CPU 작업을 별도 스레드로 분리 (`node:worker_threads`) |
| npm | 기본 패키지 매니저. pnpm·Yarn 도 많이 쓴다 |

## 기본 사용법
```ts
// server.ts — 의존성 없이 HTTP 서버 실행: node server.ts
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404).end()
})

server.listen(3000, () => console.log('http://localhost:3000'))
```
```ts
// sum.test.ts — 내장 테스트 러너: node --test
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('sum', () => {
  assert.equal([1, 2, 3].reduce((a, b) => a + b, 0), 6)
})
```

## 자주 쓰는 패턴
- **환경 변수**: `node --env-file=.env app.js` 로 dotenv 없이 `.env` 를 읽는다.
- **개발 중 재시작**: `node --watch server.ts` 로 파일 변경 시 자동 재시작.
- **웹 표준 API**: `fetch`, `Request`/`Response`, `AbortController`, Web Streams 가 전역으로 있어 [Hono](/develop-wiki/backend/web-framework/hono/) 같은 표준 기반 프레임워크와 잘 맞는다.
- **프레임워크**: 전통적인 미들웨어 방식은 [Express](/develop-wiki/backend/web-framework/express/), 타입 안전 RPC 는 [tRPC](/develop-wiki/backend/api/trpc/), DB 는 [Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/)·[Prisma](/develop-wiki/backend/orm-query/prisma/).
- **버전 고정**: `package.json` 의 `"engines": { "node": ">=24" }` 와 `.nvmrc`/`.node-version` 으로 팀 버전을 맞춘다.

## 언제 쓰나 / 피할 때
- 쓸 때: JS/TS 로 프론트와 백엔드를 통일할 때, I/O 위주의 API·BFF·실시간 서버, npm 패키지 호환성이 중요한 경우.
- 피할 때(대안): 시작 속도·올인원 도구가 중요하면 Bun, 기본 보안 권한 모델이 필요하면 Deno, CPU 집약적 계산이 주력이면 Go·Rust·JVM.

## 공식 문서
- [API 문서](https://nodejs.org/docs/latest/api/) · [학습 가이드](https://nodejs.org/en/learn) · [릴리스 일정](https://nodejs.org/en/about/previous-releases) · [릴리스 일정 변경 공지](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule)
