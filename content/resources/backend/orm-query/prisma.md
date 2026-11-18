---
name: Prisma ORM
url: https://www.prisma.io/orm
docs: https://www.prisma.io/docs/orm/v7
repo: https://github.com/prisma/orm
stars: 47685
domain: backend
category: orm-query
description: 스키마 파일에서 타입 안전한 클라이언트를 생성하는 TypeScript ORM. 선언형 마이그레이션과 관계 중심 CRUD 가 필요한 Node 백엔드에 쓴다.
pricing: oss
tags: [typescript, orm, migration, postgresql]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Prisma ORM 은 `schema.prisma` 에 모델을 선언하면 그로부터 타입이 완전히 지정된 클라이언트를 생성하고, 같은 스키마로 SQL 마이그레이션을 만들어 주는 TypeScript ORM 이다. `findMany({ where, include })` 처럼 객체로 쿼리를 표현해 관계 조회와 CRUD 를 짧게 쓰는 것이 특징이다. Prisma 7 부터 Rust 쿼리 엔진을 없애고 TypeScript 로 다시 구현했으며, DB 연결은 **드라이버 어댑터**(`@prisma/adapter-pg` 등)로 한다.

**버전 주의(2026-11)**: npm `prisma@latest` 는 **8.0.0-rc** 릴리스 후보(다시 설계된 Prisma 8, contract 기반)이고, 안정판은 **Prisma 7**(`@prisma/client` 7.10.1)이다. Prisma 7 은 8 정식 출시 후 18개월간 지원된다. 아래 내용은 Prisma 7 기준이며, 7 을 쓰려면 `prisma`·`@prisma/client` 를 `^7` 로 고정한다.

SQL 에 가까운 문법을 원하면 [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/), 쿼리 빌더만 필요하면 [Kysely](/develop-wiki/backend/orm-query/kysely/) 가 대안이다.

## 설치
PostgreSQL 기준 (Prisma 7).
```bash
npm install -D prisma@7 @types/pg
npm install @prisma/client@7 @prisma/adapter-pg pg dotenv
npx prisma init --datasource-provider postgresql --output ../generated/prisma
```
`init` 이 `prisma/schema.prisma` 와 `defineConfig` 기반 설정 파일(스키마 경로·DB URL 지정)을 만든다. Prisma 7 부터 DB URL 은 스키마가 아니라 이 설정 파일에 둔다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Prisma schema | `datasource`, `generator`, `model` 블록. 관계는 `@relation` 으로 선언 |
| `prisma-client` 생성기 | `output` 경로에 클라이언트 코드를 생성. `npx prisma generate` |
| 드라이버 어댑터 | `new PrismaClient({ adapter })` 로 `pg`, `mysql2`, `better-sqlite3` 등 JS 드라이버 연결 |
| Prisma Migrate | `migrate dev`(개발: SQL 생성·적용), `migrate deploy`(운영: 적용만) |
| 관계 쿼리 | `include`, `select` 로 중첩 로딩, `connect`·`create` 로 중첩 쓰기 |
| TypedSQL / `$queryRaw` | 원시 SQL 이 필요할 때 타입 지정된 쿼리 실행 |

## 기본 사용법
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```
```ts
// src/db.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })

// 사용 예
const user = await prisma.user.create({
  data: { email: 'a@example.com', posts: { create: { title: 'hello' } } },
})
const withPosts = await prisma.user.findMany({ include: { posts: true } })
```
```bash
npx prisma migrate dev --name init   # SQL 마이그레이션 생성·적용 + generate
```

## 자주 쓰는 패턴
- **운영 배포**: CI 에서 `npx prisma migrate deploy` 로 커밋된 마이그레이션만 적용한다. `migrate dev` 는 개발 DB 전용.
- **트랜잭션**: `prisma.$transaction(async (tx) => { ... })` 인터랙티브 트랜잭션, 또는 배열로 여러 쿼리를 원자적으로 실행.
- **싱글턴 클라이언트**: 개발 서버 핫 리로드 시 연결이 쌓이지 않게 `globalThis` 에 캐시한다.
- **N+1 피하기**: 루프 안에서 `findUnique` 를 부르지 말고 `include` 나 `where: { id: { in: ids } }` 로 한 번에 읽는다.
- **기존 DB**: `npx prisma db pull` 로 스키마를 역추출해 시작한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 관계가 많은 CRUD 앱, 스키마 파일 하나로 모델·마이그레이션·타입을 함께 관리하고 싶은 TypeScript 팀.
- 피할 때(대안): 복잡한 SQL(윈도 함수, CTE)을 많이 쓰면 Drizzle·Kysely, 코드 생성 단계를 원치 않을 때, 8.0 정식 전 대규모 신규 도입은 7·8 중 어느 쪽에 맞출지 먼저 정한다.

## 공식 문서
- [Prisma 7 문서](https://www.prisma.io/docs/orm/v7) · [Prisma 7 PostgreSQL 퀵스타트](https://www.prisma.io/docs/v7/prisma-orm/quickstart/postgresql) · [릴리스 상태(7·8)](https://www.prisma.io/docs/orm/release-status) · [Prisma 8 소개](https://www.prisma.io/docs/v8)
