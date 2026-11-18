---
name: Kysely
url: https://kysely.dev
docs: https://kysely.dev/docs/intro
repo: https://github.com/kysely-org/kysely
stars: 14368
domain: backend
category: orm-query
description: 데이터베이스 타입 인터페이스를 바탕으로 SQL 을 타입 안전하게 조립하는 TypeScript 쿼리 빌더. ORM 없이 SQL 그대로 쓰되 컬럼·결과 타입 검사가 필요할 때 쓴다.
pricing: oss
tags: [typescript, query-builder, sql]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kysely 는 ORM 이 아니라 **타입 안전한 SQL 쿼리 빌더**다. 테이블과 컬럼을 TypeScript 인터페이스로 선언하면 `selectFrom('person').select(['id', 'name'])` 같은 체인에서 테이블·컬럼 이름이 자동완성되고 결과 타입이 추론된다. 엔티티·관계 매핑·변경 추적이 없어 동작이 SQL 과 1:1 로 대응하며, 런타임 의존성이 없다.

PostgreSQL, MySQL, SQLite, MSSQL 방언이 내장돼 있고, 커뮤니티 방언으로 D1·PlanetScale·Neon 등을 지원한다. 2026-11 기준 최신은 **0.29.9**(0.28 라인도 패치 유지, Node 22 이상). 1.0 이전이라 마이너 버전 업그레이드 시 변경 사항을 확인한다.

## 설치
```bash
npm install kysely pg
npm install -D @types/pg
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Database` 인터페이스 | 테이블 이름 → 행 타입 매핑. 모든 타입 추론의 출발점 |
| `Generated<T>` | DB 가 채우는 컬럼(자동 증가 ID 등). insert 시 선택 사항이 된다 |
| `Selectable`/`Insertable`/`Updateable` | 테이블 타입에서 용도별 행 타입을 뽑는 헬퍼 |
| Dialect | `PostgresDialect`, `MysqlDialect`, `SqliteDialect` 등 드라이버 연결 |
| `sql` 템플릿 | 빌더 밖의 식을 바인딩된 원시 SQL 로 삽입 |
| Migrator | `Migrator` + `FileMigrationProvider` 로 up/down 마이그레이션 실행 |

## 기본 사용법
```ts
import { Kysely, PostgresDialect, Generated } from 'kysely'
import { Pool } from 'pg'

interface Database {
  person: { id: Generated<number>; name: string; age: number | null }
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: process.env.DATABASE_URL }) }),
})

const { id } = await db.insertInto('person').values({ name: 'Kim', age: 30 })
  .returning('id').executeTakeFirstOrThrow()

const adults = await db.selectFrom('person')
  .select(['id', 'name'])
  .where('age', '>=', 20)
  .orderBy('name')
  .execute()            // { id: number; name: string }[]

await db.updateTable('person').set({ age: 31 }).where('id', '=', id).execute()
await db.deleteFrom('person').where('id', '=', id).execute()
```

## 자주 쓰는 패턴
- **타입 자동 생성**: 손으로 인터페이스를 쓰지 않고 `kysely-codegen` 같은 도구로 기존 DB 에서 `Database` 타입을 생성한다.
- **트랜잭션**: `await db.transaction().execute(async (trx) => { ... })` — 콜백 안에서 `trx` 로 쿼리.
- **동적 조건**: `.$if(filter.name != null, (qb) => qb.where('name', '=', filter.name!))` 로 조건부 절을 붙인다.
- **관계를 JSON 으로**: `kysely/helpers/postgres` 의 `jsonArrayFrom`·`jsonObjectFrom` 으로 하위 쿼리를 중첩 객체로 받는다.
- **ORM 과 함께**: [Prisma](/develop-wiki/backend/orm-query/prisma/) 의 복잡한 쿼리를 보완하거나, Better Auth 의 기본 DB 어댑터처럼 다른 라이브러리 내부 엔진으로도 쓰인다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 을 직접 통제하면서 타입 오류를 컴파일 시점에 잡고 싶을 때, 동적 필터가 많은 조회 API, 서버리스·엣지 환경.
- 피할 때(대안): 스키마 선언·마이그레이션 생성까지 한 도구로 원하면 [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/)·Prisma, 관계 매핑·지연 로딩이 필요한 도메인 모델 중심 설계.

## 공식 문서
- [소개](https://kysely.dev/docs/intro) · [시작하기](https://kysely.dev/docs/getting-started) · [마이그레이션](https://kysely.dev/docs/migrations) · [API 문서](https://kysely-org.github.io/kysely-apidoc/)
