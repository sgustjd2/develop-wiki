---
title: 트랜잭션 격리 수준과 이상 현상
aka: [Transaction Isolation Levels, Isolation Anomalies, Read Committed, Repeatable Read, Serializable, Snapshot Isolation]
category: data-modeling
level: advanced
summary: 동시에 실행되는 트랜잭션이 서로의 중간 상태를 얼마나 볼 수 있는지 정하는 격리 수준과, 수준별로 생기는 이상 현상(더티 리드, 팬텀, 쓰기 스큐 등).
tags: [rdbms, transaction, acid, mvcc, concurrency, postgresql, mysql]
related: [data-modeling/index-design, distributed-systems/saga, distributed-systems/idempotency]
sources:
  - https://www.postgresql.org/docs/current/transaction-iso.html
  - https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html
  - https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/
updatedAt: 2026-11-18
---

## 문제

트랜잭션을 하나씩 차례로 실행하면(직렬 실행) 정합성 문제가 없지만 느리다. DB 는 성능을 위해 트랜잭션을 겹쳐 실행하고, 그 대가로 "다른 트랜잭션의 영향이 얼마나 보이는가"를 **격리 수준**으로 조절한다. 기본값을 모른 채 쓰면, 테스트에서는 안 보이고 부하가 걸릴 때만 나타나는 데이터 오류가 생긴다.

## 이상 현상

| 현상 | 무슨 일 |
| --- | --- |
| 더티 리드 | 커밋되지 않은 다른 트랜잭션의 변경을 읽음 (그 트랜잭션이 롤백하면 없는 값을 본 셈) |
| 반복 불가능 읽기 | 같은 행을 두 번 읽었는데 그 사이 다른 트랜잭션이 커밋해 값이 달라짐 |
| 팬텀 | 같은 조건으로 두 번 조회했는데 행 집합이 달라짐(새 행 삽입) |
| 갱신 손실(lost update) | 둘이 같은 값을 읽고 각자 계산해 덮어써서 한쪽 변경이 사라짐 |
| 쓰기 스큐(write skew) | 둘이 같은 조건을 읽고 **서로 다른 행**을 고쳐, 합치면 규칙이 깨짐 |

SQL 표준은 앞의 세 가지로만 수준을 정의했는데, Berenson 등(1995, *A Critique of ANSI SQL Isolation Levels*)이 이 정의가 모호하고 스냅숏 격리 같은 실제 구현을 설명하지 못한다고 지적했다. 갱신 손실·쓰기 스큐는 그 뒤로 널리 쓰이는 구분이다.

## 수준별 비교

| 수준 | 표준이 막는 것 | PostgreSQL | MySQL InnoDB |
| --- | --- | --- | --- |
| Read Uncommitted | 없음 | Read Committed 와 동일하게 동작 | 더티 리드 가능 |
| Read Committed | 더티 리드 | **기본값.** 문장마다 새 스냅숏 | 문장마다 새 스냅숏, 갭 잠금 거의 없음 → 팬텀 가능 |
| Repeatable Read | + 반복 불가능 읽기 | 트랜잭션 스냅숏(스냅숏 격리). 팬텀도 안 보임. 동시 갱신 충돌 시 오류 | **기본값.** 일반 SELECT 는 첫 읽기 스냅숏, 잠금 읽기는 next-key/갭 잠금 |
| Serializable | + 팬텀 | 스냅숏 + 의존성 감시(SSI). 직렬 실행과 다른 결과가 날 패턴이면 한쪽을 실패시킴 | autocommit 이 꺼져 있으면 일반 SELECT 를 공유 잠금 읽기로 바꿈 |

PostgreSQL 에서 Repeatable Read/Serializable 의 충돌은 SQLSTATE `40001`(serialization failure)로 나온다. 공식 문서는 **트랜잭션 전체를 처음부터 재시도**하라고 안내한다.

## 쓰기 스큐 예

"당직 의사는 최소 1명" 규칙. 두 의사가 동시에 "나 말고 당직이 있나?"를 확인하고 각자 자기를 뺀다.

```sql
-- 두 트랜잭션이 동시에 (Repeatable Read)
SELECT count(*) FROM on_call WHERE shift = 'night';  -- 둘 다 2
UPDATE on_call SET active = false WHERE doctor = 'me' AND shift = 'night';
COMMIT;  -- 둘 다 성공 → 당직 0명
```

서로 다른 행을 고쳤으니 스냅숏 격리는 충돌로 보지 않는다. 해결책은 Serializable 로 올리거나, 읽은 행을 `SELECT ... FOR UPDATE` 로 잠그거나, 제약 조건으로 표현하는 것이다.

## 갱신 손실 피하기

```ts
// 나쁨: 읽고-계산하고-쓰기 (Read Committed 에서 갱신 손실)
const { stock } = await db.one('SELECT stock FROM item WHERE id = $1', [id]);
await db.none('UPDATE item SET stock = $1 WHERE id = $2', [stock - qty, id]);

// 좋음: 원자적 갱신 + 조건
const r = await db.result(
  'UPDATE item SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [qty, id]);
if (r.rowCount === 0) throw new OutOfStock();
```

다른 방법: `SELECT ... FOR UPDATE`(비관적 잠금), `version` 칼럼 비교(낙관적 잠금).

## 언제 무엇을

- **Read Committed**: 대부분의 웹 OLTP. 대신 "읽고 판단해서 쓰기"는 원자적 UPDATE·잠금·제약으로 보호한다.
- **Repeatable Read**: 한 트랜잭션 안에서 일관된 스냅숏이 필요한 보고·배치.
- **Serializable**: 규칙이 여러 행에 걸쳐 있고 잠금 설계가 어려울 때. 재시도 루프가 필수다.

## 주의 (비용)

- 같은 이름이라도 DB 마다 의미가 다르다. MySQL 의 기본 Repeatable Read 와 PostgreSQL 의 Repeatable Read 는 잠금·팬텀 동작이 다르다.
- 높은 격리는 공짜가 아니다. Serializable 은 실패·재시도가 늘고, 잠금 기반 구현은 대기와 교착을 늘린다.
- 재시도하는 트랜잭션 안에서 외부 부수효과(메일 발송, 결제 API 호출)를 하면 중복 실행된다. 부수효과는 커밋 후로 미루거나 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)하게 만든다.
- MySQL 문서는 한 트랜잭션에서 잠금 읽기와 일반 읽기를 섞지 말라고 경고한다. 서로 다른 시점의 데이터를 본다.
- 격리 수준은 한 DB 안의 이야기다. 여러 서비스에 걸친 일관성은 [사가](/develop-wiki/knowledge/distributed-systems/saga/) 같은 다른 도구가 필요하다.
