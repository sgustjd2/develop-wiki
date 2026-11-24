---
name: Better Auth
url: https://better-auth.com
docs: https://better-auth.com/docs/introduction
repo: https://github.com/better-auth/better-auth
stars: 30864
domain: backend
category: auth
description: 프레임워크에 묶이지 않는 TypeScript 인증 라이브러리. 이메일·비밀번호, 소셜 로그인, 세션, 2FA·패스키·조직을 플러그인으로 앱 DB 위에 직접 구현할 때 쓴다.
pricing: oss
tags: [typescript, authentication, session, oauth, plugins]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Better Auth 는 앱 서버 안에서 동작하는 TypeScript 인증 라이브러리다. 사용자·세션·계정 테이블을 **앱의 DB** 에 두고, `/api/auth/*` 핸들러 하나로 가입·로그인·로그아웃·OAuth 콜백을 처리한다. 2단계 인증, 패스키, 매직 링크, 조직·멤버, 관리자 기능 등은 플러그인으로 추가한다. Next.js, Nuxt, SvelteKit, Hono, Express 등 여러 프레임워크와 Node·Bun·Deno 에서 쓸 수 있다.

라이선스는 MIT. 2026-11 기준 최신은 **1.7.25**(1.8 베타 진행 중). 운영 주체 변화가 있었다: 2025-09 **Auth.js(NextAuth.js) 유지보수를 Better Auth 팀이 넘겨받았고**, 2026-07 **Vercel 이 Better Auth 를 인수**했다. Auth.js 는 보안 패치 위주로 유지되며 새 프로젝트에는 Better Auth 가 권장된다(next-auth 안정판 4.24.x, v5 는 베타).

## 설치
```bash
npm install better-auth
# .env
# BETTER_AUTH_SECRET=<openssl rand -base64 32 로 만든 32자 이상 값>
# BETTER_AUTH_URL=http://localhost:3000
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `betterAuth()` | 서버 인스턴스. DB, 로그인 방식, 플러그인을 설정해 `auth` 로 export |
| DB 어댑터 | 기본 Kysely 어댑터(`pg` Pool, `mysql2`, SQLite) 또는 Drizzle·Prisma·MongoDB 어댑터 |
| 핸들러 | `toNodeHandler(auth)`, `toNextJsHandler(auth)` 등으로 `/api/auth/*` 에 마운트 |
| 세션 | DB 세션 + 쿠키. 쿠키 캐시로 조회 비용 절감 |
| 클라이언트 | `createAuthClient()` — `signUp.email`, `signIn.social`, `useSession` 등 |
| 플러그인 | `twoFactor`, `passkey`, `organization`, `admin`, `magicLink` 등 서버·클라이언트 쌍 |
| CLI | `npx auth@latest generate`(ORM 스키마·SQL 생성), `migrate`(Kysely 어댑터일 때 테이블 생성) |

## 기본 사용법
```ts
// auth.ts
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  },
})
```
```ts
// server.ts — Express 5
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'

const app = express()
app.all('/api/auth/{*any}', toNodeHandler(auth))   // express.json() 보다 먼저 마운트
app.listen(3000)
```
```bash
npx auth@latest migrate     # user, session, account, verification 테이블 생성
```

## 자주 쓰는 패턴
- **서버에서 세션 확인**: `await auth.api.getSession({ headers: req.headers })` 로 보호 라우트에서 사용자 확인. Node 헤더는 `fromNodeHeaders` 로 변환한다.
- **ORM 스키마 통합**: [Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/)·[Prisma](/develop-wiki/backend/orm-query/prisma/) 를 쓰면 `generate` 로 스키마를 만들고 각 ORM 의 마이그레이션 흐름에 넣는다.
- **패스키·2FA**: `passkey()`, `twoFactor()` 플러그인을 서버와 클라이언트에 함께 등록하고 스키마를 다시 생성한다.
- **B2B**: `organization()` 플러그인으로 조직·초대·역할을 구현한다.
- **Auth.js 이전**: Auth.js 문서의 Better Auth 마이그레이션 가이드를 따라 계정·세션 테이블을 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: TS 웹앱에서 사용자 데이터를 자체 DB 에 두고 인증을 직접 소유하고 싶을 때, 프레임워크를 바꿔도 같은 인증 코드를 쓰고 싶을 때.
- 피할 때(대안): 여러 앱의 중앙 SSO·SAML·LDAP 이 필요하면 [Keycloak](/develop-wiki/backend/auth/keycloak/)·[Ory](/develop-wiki/backend/auth/ory/), JVM 서버는 [Spring Security](/develop-wiki/backend/auth/spring-security/).

## 공식 문서
- [소개](https://better-auth.com/docs/introduction) · [설치](https://better-auth.com/docs/installation) · [플러그인](https://better-auth.com/docs/concepts/plugins) · [Auth.js 합류 공지](https://better-auth.com/blog/authjs-joins-better-auth) · [Vercel 합류 공지](https://better-auth.com/blog/better-auth-joins-vercel)
