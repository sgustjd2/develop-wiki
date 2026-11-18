---
name: Drizzle ORM
url: https://orm.drizzle.team
repo: https://github.com/drizzle-team/drizzle-orm
stars: 36297
docs: https://orm.drizzle.team/docs/overview
domain: backend
category: orm-query
description: SQL에 가까운 문법의 TypeScript ORM. 스키마에서 타입을 추론하고 마이그레이션 도구를 제공한다.
pricing: oss
tags: [typescript, sql]
languages: [typescript]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Drizzle ORM 은 TypeScript 코드로 테이블 스키마를 선언하고, 그 스키마에서 행 타입을 추론해 SQL 과 거의 같은 모양의 쿼리 빌더(`select().from().where()`)를 제공하는 ORM 이다. 런타임 의존성이 적고 서버리스·엣지 드라이버(Neon, Turso, D1 등)를 지원해 Node·Bun·Workers 어디서나 쓴다. 마이그레이션은 별도 CLI 인 **drizzle-kit** 이 스키마를 비교해 SQL 파일을 만든다.

SQL 을 감추기보다 그대로 드러내는 쪽이라, 스키마 DSL·생성 클라이언트를 쓰는 Prisma 와 대비된다.

버전 메모: npm `latest` 는 0.45.x(drizzle-kit 0.31.x)이고, 1.0 이 RC 단계(`@rc`, 2026-11 기준 1.0.0-rc.5)다. 공식 시작 가이드는 RC 설치를 안내하므로 새 프로젝트는 문서 버전과 맞춰 고른다.

## 설치
PostgreSQL + node-postgres 기준.
```bash
npm i drizzle-orm pg dotenv
npm i -D drizzle-kit tsx @types/pg
# 1.0 RC 를 쓰려면: npm i drizzle-orm@rc && npm i -D drizzle-kit@rc
```
```ts
// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 스키마 | `pgTable`, `mysqlTable`, `sqliteTable` 로 테이블·컬럼·인덱스를 TS 코드로 선언 |
| 타입 추론 | `typeof users.$inferSelect` / `$inferInsert` 로 행 타입을 얻는다 |
| `drizzle()` | 드라이버별 진입점(`drizzle-orm/node-postgres` 등)에서 DB 인스턴스 생성 |
| SQL-like 빌더 | `db.select()`, `insert()`, `update()`, `delete()` + `eq`, `and`, `gt` 같은 연산자 |
| Relational Queries | `db.query.users.findMany({ with: { posts: true } })` 로 관계를 중첩 객체로 조회 |
| `sql` 템플릿 | 빌더가 지원하지 않는 식을 파라미터 바인딩된 원시 SQL 로 삽입 |
| drizzle-kit | `generate`(SQL 생성), `migrate`(적용), `push`(직접 반영), `pull`(기존 DB 역추출), `studio` |

## 기본 사용법
```ts
// src/db/schema.ts
import { integer, pgTable, varchar, boolean } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 200 }).notNull(),
  done: boolean().notNull().default(false),
})
```
```ts
// src/index.ts
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { todos } from './db/schema'

const db = drizzle(process.env.DATABASE_URL!)

const [created] = await db.insert(todos).values({ title: 'write docs' }).returning()
const open = await db.select().from(todos).where(eq(todos.done, false))
await db.update(todos).set({ done: true }).where(eq(todos.id, created.id))
await db.delete(todos).where(eq(todos.id, created.id))
```
```bash
npx drizzle-kit push        # 로컬: 스키마를 DB 에 바로 반영
npx tsx src/index.ts
```

## 자주 쓰는 패턴
- **마이그레이션 흐름**: 개발 초기에는 `push` 로 빠르게 반복하고, 팀·운영 환경에서는 `generate` 로 SQL 파일을 커밋한 뒤 `migrate` 로 적용한다.
- **트랜잭션**: `await db.transaction(async (tx) => { ... })` 안에서 `tx` 로 쿼리하면 예외 시 롤백된다.
- **조인·부분 선택**: `db.select({ id: users.id, title: posts.title }).from(users).leftJoin(posts, eq(posts.userId, users.id))` 처럼 SQL 그대로 표현한다.
- **웹 프레임워크 연동**: 앱 시작 시 `db` 를 한 번 만들고 모듈로 공유한다. [Hono](/develop-wiki/backend/web-framework/hono/) 의 엣지 런타임에서는 HTTP 기반 드라이버(Neon serverless, D1 등)를 고르고, [Express](/develop-wiki/backend/web-framework/express/) 에서는 `pg` 풀을 쓴다.
- **검증 스키마 생성**: 테이블 정의에서 Zod·Valibot 등 검증 스키마를 만들어 API 입력 검증과 DB 타입을 일치시킨다(1.0 RC 는 `drizzle-orm/zod` 의 `createInsertSchema` 등, 0.x 는 별도 패키지 `drizzle-zod`).
- **테스트**: 테스트용 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 컨테이너나 PGlite(`drizzle-orm/pglite`) 같은 인메모리 드라이버에 마이그레이션을 적용하고 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 에 익숙한 TypeScript 팀, 서버리스·엣지 배포, 코드 생성 단계 없이 스키마 타입을 바로 쓰고 싶을 때.
- 피할 때(대안): 관계 중심 CRUD 를 높은 추상화로 다루고 싶으면 Prisma, 복잡한 동적 쿼리만 필요하면 Kysely 같은 쿼리 빌더, 1.0 정식 전 API 변화가 부담스러우면 버전을 고정해 쓴다.

## 공식 문서
- [개요](https://orm.drizzle.team/docs/overview) · [PostgreSQL 시작하기](https://orm.drizzle.team/docs/get-started/postgresql-new) · [스키마 선언](https://orm.drizzle.team/docs/sql-schema-declaration) · [마이그레이션(drizzle-kit)](https://orm.drizzle.team/docs/migrations) · [Relational Queries](https://orm.drizzle.team/docs/rqb)
