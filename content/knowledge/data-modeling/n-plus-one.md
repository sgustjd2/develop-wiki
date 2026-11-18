---
title: N+1 쿼리 문제
aka: [N+1 Query Problem, N+1 Selects, Eager Loading, DataLoader]
category: data-modeling
level: beginner
summary: 목록 1번 조회 뒤 항목마다 연관 데이터를 1번씩 더 조회해 쿼리가 N+1개로 불어나는 문제와, 즉시 로딩·배치 로딩으로 고치는 방법.
tags: [orm, query, performance, graphql, dataloader]
related: [data-modeling/index-design, data-modeling/normalization, performance/connection-pool, performance/profiling]
sources:
  - https://guides.rubyonrails.org/active_record_querying.html
  - https://github.com/graphql/dataloader
updatedAt: 2026-11-18
---

## 문제

ORM 의 지연 로딩(lazy loading)은 연관 객체에 처음 접근할 때 쿼리를 보낸다. 목록을 돌면서 연관 객체를 건드리면 항목 수만큼 쿼리가 나간다.

```ts
const posts = await Post.findMany({ take: 50 });       // 쿼리 1
for (const p of posts) {
  const author = await p.author();                      // 쿼리 50
  render(p.title, author.name);
}
// 총 51번 왕복. 쿼리 하나는 빨라도 왕복 지연이 쌓인다
```

개발 환경(데이터 몇 건, 로컬 DB)에서는 안 보이다가, 데이터가 늘고 DB 가 네트워크 너머에 있으면 응답이 수백 ms~수 초로 늘어난다. 커넥션 풀도 오래 붙잡는다.

## 해법

| 방법 | 쿼리 수 | 설명 |
| --- | --- | --- |
| JOIN 으로 즉시 로딩 | 1 | 한 쿼리로 함께 가져옴. 1:N 이면 부모 행이 중복되어 결과가 커짐 |
| IN 으로 배치 로딩 | 1 + 연관 수 | 부모 ID 를 모아 `WHERE author_id IN (...)` 한 번 |
| DataLoader(요청 단위 배치) | 1 + 연관 수 | 같은 틱에 들어온 개별 `load(id)` 를 모아 한 번에 조회 |
| 필요한 칼럼만 조회하는 전용 쿼리 | 1 | 화면용 SQL·뷰를 직접 작성 |

ORM 마다 이름만 다르다. Rails 는 `includes`(자동 선택)·`preload`(별도 쿼리)·`eager_load`(LEFT JOIN), Django 는 `select_related`(JOIN)·`prefetch_related`(IN), JPA 는 `JOIN FETCH`·엔티티 그래프, Prisma 는 `include`.

```ts
// 배치 로딩: 쿼리 2번
const posts = await db.query('SELECT * FROM post ORDER BY id DESC LIMIT 50');
const ids = [...new Set(posts.map((p) => p.author_id))];
const authors = await db.query('SELECT id, name FROM author WHERE id = ANY($1)', [ids]);
const byId = new Map(authors.map((a) => [a.id, a]));
posts.forEach((p) => render(p.title, byId.get(p.author_id)!.name));
```

GraphQL 리졸버는 필드마다 독립적으로 실행돼 N+1 이 구조적으로 생긴다. 요청마다 새 DataLoader 를 만들어 배치와 요청 내 캐시를 얻는다.

```ts
const authorLoader = new DataLoader(async (ids: readonly number[]) => {
  const rows = await db.query('SELECT * FROM author WHERE id = ANY($1)', [ids]);
  const m = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => m.get(id) ?? null); // 입력 순서대로 돌려줘야 한다
});
// 리졸버: Post.author = (p) => authorLoader.load(p.author_id)
```

## 찾는 법

- 요청당 쿼리 수를 로그·APM 트레이스로 본다. 같은 모양의 쿼리가 파라미터만 바뀌어 반복되면 의심.
- Rails `strict_loading` 처럼 지연 로딩을 오류로 만드는 설정, 또는 테스트에서 "이 요청은 쿼리 N개 이하" 단언을 둔다.

## 언제 쓰나 (어떤 해법을)

- 1:1, N:1(작성자, 카테고리) → JOIN 이 단순하다.
- 1:N, N:M(댓글, 태그) → IN 배치 로딩이 결과 중복이 없어 낫다.
- GraphQL, 계층이 깊은 직렬화 → DataLoader.

## 주의 (비용)

- 무조건 즉시 로딩하면 반대 문제가 생긴다. 안 쓰는 연관까지 매번 가져와 메모리와 전송량이 는다. 화면·API 별로 필요한 만큼만.
- 1:N 을 여러 개 JOIN 하면 행 수가 곱으로 불어난다(카테시안 폭발). 컬렉션은 별도 쿼리로 나눈다.
- `IN` 목록이 수만 개가 되면 쿼리 자체가 무겁다. 페이지네이션과 함께 쓴다.
- DataLoader 캐시는 요청 범위로만 둔다. 요청 사이에 공유하면 다른 사용자 데이터·권한이 섞일 수 있다.
- 배치로 바꾼 뒤에도 느리면 `IN`/JOIN 칼럼의 [인덱스](/develop-wiki/knowledge/data-modeling/index-design/)를 확인한다.
