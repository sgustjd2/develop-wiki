---
title: 인덱스 설계 (B-tree·복합·커버링)
aka: [Index Design, B-tree Index, Composite Index, Covering Index, 복합 인덱스, 커버링 인덱스]
category: data-modeling
level: intermediate
summary: B-tree 인덱스가 어떻게 범위를 좁히는지 이해하고, 복합 인덱스의 칼럼 순서와 커버링 인덱스로 테이블 접근을 줄이는 설계 방법.
tags: [rdbms, index, b-tree, postgresql, mysql, query-tuning]
related: [data-modeling/normalization, data-modeling/primary-key-design, data-modeling/zero-downtime-migration, data-modeling/n-plus-one]
sources:
  - https://www.postgresql.org/docs/current/indexes-multicolumn.html
  - https://www.postgresql.org/docs/current/indexes-index-only-scans.html
  - https://www.postgresql.org/docs/current/sql-createindex.html
updatedAt: 2026-11-18
---

## 문제

인덱스가 없으면 조건에 맞는 행을 찾으려고 테이블 전체를 읽는다. 반대로 인덱스를 아무렇게나 많이 만들면 쓰기가 느려지고 저장 공간이 늘며, 정작 쿼리는 그 인덱스를 못 쓰는 경우가 많다.

## 해법

### B-tree 의 성질

B-tree 는 키를 **정렬된 순서**로 유지하는 균형 트리다. 그래서 `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, 접두어 `LIKE 'abc%'` 를 처리할 수 있다. 정렬 순서가 핵심이라 다음은 기본적으로 못 쓴다.

- 칼럼에 함수를 씌운 조건: `WHERE lower(email) = ...` → 표현식 인덱스 `ON (lower(email))` 필요
- 앞부분이 와일드카드인 `LIKE '%abc'`
- 암묵적 형 변환이 일어나는 비교

### 복합 인덱스: 칼럼 순서가 전부다

`(a, b, c)` 인덱스는 "a 로 정렬, 같은 a 안에서 b 로 정렬…"이다. PostgreSQL 문서 기준으로, **앞쪽 칼럼들의 등호 조건 + 처음으로 등호가 아닌 칼럼의 범위 조건**까지가 스캔 범위를 줄인다. 그 뒤 칼럼 조건은 인덱스 안에서 걸러낼 뿐 범위를 줄이지 않는다.

```sql
CREATE INDEX orders_cust_status_created ON orders (customer_id, status, created_at);

-- 좋음: 등호, 등호, 범위
WHERE customer_id = 42 AND status = 'PAID' AND created_at >= '2026-01-01'
-- 좋음: 정렬까지 인덱스로 해결
WHERE customer_id = 42 AND status = 'PAID' ORDER BY created_at DESC LIMIT 20
-- 약함: 범위가 앞에 와서 뒤 칼럼(created_at)은 범위를 못 줄임
WHERE customer_id = 42 AND status > 'A' AND created_at >= '2026-01-01'
-- 못 씀(대개): 선두 칼럼 조건 없음
WHERE status = 'PAID'
```

순서 정하는 경험칙:
1. **등호로 쓰는 칼럼을 앞**에, 범위·정렬 칼럼을 뒤에.
2. 같은 등호 칼럼끼리는 여러 쿼리가 공유할 수 있는 칼럼을 앞에.
3. `ORDER BY ... LIMIT` 이 있으면 정렬 칼럼을 등호 칼럼 바로 뒤에 둬서 정렬 단계를 없앤다.

PostgreSQL 18 은 선두 칼럼 조건이 없어도 **스킵 스캔**으로 복합 인덱스를 쓸 수 있다. 다만 선두 칼럼의 서로 다른 값이 적을 때만 이득이라, 이것에 기대어 설계하지는 않는다.

### 커버링 인덱스

쿼리가 필요로 하는 칼럼이 전부 인덱스에 있으면 테이블(힙)을 읽지 않고 답할 수 있다(index-only scan).

```sql
-- 검색 키는 customer_id, 결과로 total 만 필요
CREATE INDEX orders_cust_cover ON orders (customer_id) INCLUDE (total);
SELECT total FROM orders WHERE customer_id = 42;
```

`INCLUDE` 칼럼은 검색 키가 아니라 "실어 나르는 값"이다. 유니크 제약도 키 칼럼에만 걸린다. MySQL InnoDB 는 보조 인덱스에 기본 키가 항상 들어 있어, 기본 키 칼럼까지는 따로 넣지 않아도 커버된다.

## 언제 쓰나

- 실제로 느린 쿼리를 `EXPLAIN (ANALYZE, BUFFERS)` 로 확인한 뒤, 그 쿼리의 `WHERE`·`JOIN`·`ORDER BY` 모양에 맞춰 만든다.
- 외래 키 칼럼(조인·삭제 시 참조 검사)은 대부분 인덱스가 필요하다.
- 선택도가 높은(걸러내는 비율이 큰) 조건일수록 인덱스 효과가 크다.

## 주의 (비용)

- **모든 인덱스는 쓰기 세금이다.** INSERT/UPDATE/DELETE 마다 갱신되고, 공간과 캐시 메모리를 차지한다. 안 쓰는 인덱스는 통계 뷰(`pg_stat_user_indexes` 등)로 찾아 지운다.
- PostgreSQL 문서도 3개를 넘는 칼럼의 인덱스는 사용 패턴이 아주 정형적이지 않으면 잘 도움이 안 된다고 본다. 단일 칼럼으로 충분한 경우가 많다.
- `(a)` 와 `(a, b)` 가 둘 다 있으면 앞의 것은 대개 중복이다.
- 커버링 인덱스는 테이블 데이터를 복제한다. PostgreSQL 의 index-only scan 은 가시성 맵이 "모두 보임"인 페이지에서만 힙 접근을 건너뛰므로, 자주 갱신되는 테이블에서는 기대만큼 안 빨라진다.
- 선택도가 낮은 칼럼(성별, boolean) 단독 인덱스는 거의 쓰이지 않는다. 특정 값만 자주 찾는다면 부분 인덱스(`WHERE status = 'PENDING'`)가 낫다.
- 운영 중인 큰 테이블에 인덱스를 추가할 때는 쓰기 잠금을 피하는 방법을 쓴다 → [무중단 마이그레이션](/develop-wiki/knowledge/data-modeling/zero-downtime-migration/).
- 무작위 키(UUIDv4)는 B-tree 삽입 위치를 흩뜨려 페이지 분할과 캐시 미스를 늘린다 → [키 설계](/develop-wiki/knowledge/data-modeling/primary-key-design/).
