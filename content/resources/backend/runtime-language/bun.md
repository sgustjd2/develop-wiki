---
name: Bun
url: https://bun.com
docs: https://bun.com/docs
repo: https://github.com/oven-sh/bun
stars: 96967
domain: backend
category: runtime-language
description: JavaScriptCore 기반의 JS·TS 런타임으로 패키지 매니저, 번들러, 테스트 러너를 한 바이너리에 담았다. Node 호환을 유지하면서 빠른 시작·설치가 필요할 때 쓴다.
pricing: oss
tags: [javascript, typescript, runtime, bundler, package-manager]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Bun 은 Zig 로 작성되고 JavaScriptCore(Safari 엔진)를 쓰는 JavaScript 런타임이다. `bun` 하나로 런타임, npm 호환 패키지 매니저(`bun install`), 번들러(`bun build`), Jest 호환 테스트 러너(`bun test`)를 제공해 별도 도구 조합을 줄인다. TypeScript·JSX 를 설정 없이 실행하고, Node.js API 대부분을 구현해 기존 npm 패키지를 그대로 쓰는 것을 목표로 한다.

2025-12 Anthropic 이 Bun 을 인수했으며, 프로젝트는 MIT 라이선스 오픈소스로 GitHub 에서 계속 개발된다. 2026-11 기준 최신 안정판은 **1.4.4**(2026-10-22).

## 설치
```bash
curl -fsSL https://bun.com/install | bash      # macOS·Linux
powershell -c "irm bun.com/install.ps1|iex"    # Windows
bun upgrade                                     # 업그레이드
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 런타임 | `bun run index.ts` 로 TS·JSX 직접 실행. `node:*` 모듈과 Web API 지원 |
| `Bun.serve` | 내장 HTTP 서버. `routes` 객체로 경로별 핸들러 지정 |
| `bun install` | `package.json` 기반 설치. 잠금 파일은 텍스트 형식 `bun.lock` |
| `bun test` | Jest 스타일 `describe/test/expect` 테스트 러너 |
| `bun build` | 번들러. `--compile` 로 단일 실행 파일 생성 |
| 내장 드라이버 | `bun:sqlite`, `Bun.sql`(PostgreSQL 등), `Bun.redis` 같은 내장 클라이언트 |

## 기본 사용법
```bash
bun init -y          # 새 프로젝트 (package.json, tsconfig, index.ts)
bun add hono         # 패키지 추가
bun run index.ts
```
```ts
// index.ts — 내장 서버와 SQLite
import { Database } from 'bun:sqlite'

const db = new Database(':memory:')
db.run('CREATE TABLE todos (id INTEGER PRIMARY KEY, title TEXT)')

Bun.serve({
  port: 3000,
  routes: {
    '/todos': {
      GET: () => Response.json(db.query('SELECT * FROM todos').all()),
      POST: async (req) => {
        const { title } = await req.json()
        db.query('INSERT INTO todos (title) VALUES (?)').run(title)
        return new Response(null, { status: 201 })
      },
    },
  },
})
```

## 자주 쓰는 패턴
- **기존 Node 프로젝트에 부분 도입**: 런타임은 Node 그대로 두고 `bun install`·`bun test` 만 써서 설치·테스트 시간을 줄인다.
- **단일 바이너리 배포**: `bun build ./index.ts --compile --outfile app` 으로 런타임을 포함한 실행 파일을 만든다.
- **환경 변수**: `.env` 를 자동으로 읽으므로 dotenv 가 필요 없다.
- **웹 프레임워크**: [Hono](/develop-wiki/backend/web-framework/hono/), Elysia 처럼 Web 표준 `Request/Response` 기반 프레임워크가 잘 맞는다. ORM 은 [Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/) 이 Bun 드라이버를 지원한다.
- **스크립트 실행기**: `bunx <패키지>` 로 npx 대신 CLI 를 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 TS 프로젝트에서 도구 체인을 단순화하고 싶을 때, CLI·스크립트처럼 시작 속도가 중요한 작업, 단일 실행 파일 배포.
- 피할 때(대안): 네이티브 애드온이나 덜 쓰이는 Node API 에 기대는 라이브러리가 많으면 [Node.js](/develop-wiki/backend/runtime-language/nodejs/), 권한 샌드박스가 필요하면 [Deno](/develop-wiki/backend/runtime-language/deno/).

## 공식 문서
- [문서](https://bun.com/docs) · [Node.js 호환성](https://bun.com/docs/runtime/nodejs-compat) · [HTTP 서버](https://bun.com/docs/runtime/http/server) · [릴리스 블로그](https://bun.com/blog)
