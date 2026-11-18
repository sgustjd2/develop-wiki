---
title: 낙관적 잠금과 비관적 잠금
aka: [Optimistic Locking, Pessimistic Locking, Optimistic Concurrency Control, SELECT FOR UPDATE, Version Column, Lost Update, SKIP LOCKED, ETag If-Match]
category: data-modeling
level: intermediate
summary: 같은 행을 동시에 고칠 때 생기는 갱신 손실을 막는 두 전략. 버전 칼럼으로 커밋 때 충돌을 감지하는 낙관적 잠금과, 미리 행을 잠그는 비관적 잠금의 구현과 선택 기준.
tags: [rdbms, concurrency, locking, postgresql, transaction, api]
related: [data-modeling/transaction-isolation, cs-fundamentals/race-condition-lock-deadlock, distributed-systems/idempotency, architecture/event-sourcing, data-modeling/explain-analyze]
sources:
  - https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html
  - https://martinfowler.com/eaaCatalog/pessimisticOfflineLock.html
  - https://www.postgresql.org/docs/current/explicit-locking.html
  - https://www.postgresql.org/docs/current/sql-select.html
updatedAt: 2026-11-18
---

## 문제: 갱신 손실(lost update)

```
관리자 A: 상품 조회 (재고 10)        관리자 B: 상품 조회 (재고 10)
A: 재고 = 10 - 3 = 7 저장
                                     B: 재고 = 10 - 5 = 5 저장   ← A 의 변경이 사라짐 (정답 2)
```

같은 일이 웹 폼에서도 생긴다. A 가 편집 화면을 열어 둔 사이 B 가 저장하면, A 의 저장이 B 의 수정을 덮는다. 이건 DB 트랜잭션 하나 안이 아니라 **여러 요청에 걸친 업무 트랜잭션**의 문제라 격리 수준만으로는 해결되지 않는다. [트랜잭션 격리](/develop-wiki/knowledge/data-modeling/transaction-isolation/) 참고.

가장 먼저 볼 것: **읽고-계산하고-쓰기를 한 문장으로 바꿀 수 있나?** `UPDATE products SET stock = stock - 3 WHERE id = 1 AND stock >= 3` 은 잠금 전략 없이도 안전하다. 안 될 때 아래 둘 중 하나를 고른다.

## 낙관적 잠금: 충돌은 드물다, 커밋 때 확인

행에 `version`(또는 갱신 시각) 칼럼을 두고, **읽을 때의 버전이 그대로일 때만** 쓴다.

```sql
-- 읽기: version 도 함께 가져와 클라이언트(폼)에 보낸다
SELECT id, title, body, version FROM posts WHERE id = 42;   -- version = 7

-- 쓰기: 조건에 version 을 넣고 함께 올린다
UPDATE posts
SET title = $1, body = $2, version = version + 1
WHERE id = 42 AND version = 7;
-- 영향받은 행 0 → 그사이 누가 고쳤다 → 충돌
```

```ts
const { rowCount } = await db.query(
  'UPDATE posts SET title=$1, body=$2, version=version+1 WHERE id=$3 AND version=$4',
  [title, body, id, expectedVersion],
);
if (rowCount === 0) throw new ConflictError('다른 사용자가 먼저 수정했습니다'); // HTTP 409/412
```

- HTTP API 에서는 버전을 `ETag` 로 내려주고, 수정 요청에 `If-Match` 로 받는다. 맞지 않으면 `412 Precondition Failed`.
- JPA `@Version`, Rails `lock_version`, EF Core concurrency token, Prisma 의 조건부 `updateMany` 등이 이 방식이다.
- 충돌 시 할 일을 정해야 한다: 사용자에게 최신본을 보여 주고 다시 편집, 자동 병합, 또는 자동 재시도(멱등한 계산일 때).

## 비관적 잠금: 충돌이 잦다, 미리 잠근다

트랜잭션 안에서 읽을 때 행을 잠가, 커밋할 때까지 다른 쓰기를 기다리게 한다.

```sql
BEGIN;
SELECT stock FROM products WHERE id = 1 FOR UPDATE;  -- 다른 FOR UPDATE·UPDATE 는 여기서 대기
-- 애플리케이션 계산 …
UPDATE products SET stock = 7 WHERE id = 1;
COMMIT;                                                -- 잠금 해제
```

PostgreSQL 행 잠금 모드(강한 순):

| 모드 | 막는 것 | 쓰임 |
| --- | --- | --- |
| `FOR UPDATE` | 모든 쓰기와 모든 행 잠금 | 행을 고치거나 지울 예정 |
| `FOR NO KEY UPDATE` | 키 아닌 칼럼 갱신용. `FOR KEY SHARE` 는 허용 | 일반 `UPDATE` 가 자동으로 잡는 수준 |
| `FOR SHARE` | 쓰기는 막고 다른 공유 잠금은 허용 | 읽은 값이 커밋까지 안 바뀌어야 할 때 |
| `FOR KEY SHARE` | 삭제·키 변경만 막음 | 외래 키 검사가 내부적으로 사용 |

- 일반 `SELECT` 는 행 잠금에 막히지 않는다(MVCC).
- `NOWAIT`: 기다리지 않고 바로 오류. `SKIP LOCKED`: 잠긴 행은 건너뜀 → **작업 큐** 패턴에 쓴다. 일관되지 않은 데이터를 보게 되므로 일반 조회에는 쓰지 않는다.

```sql
-- 워커 여러 개가 겹치지 않게 작업 하나씩 가져가기
SELECT id FROM jobs WHERE status = 'ready'
ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;
```

- 행이 아닌 "개념"을 잠가야 하면(사용자별 일일 정산 1회 등) 어드바이저리 락(`pg_advisory_xact_lock`)을 쓸 수 있다. DB 가 의미를 강제하지 않으므로 모든 코드가 같은 규칙을 따라야 한다.

## 비교

| | 낙관적 | 비관적 |
| --- | --- | --- |
| 가정 | 충돌이 드물다 | 충돌이 잦다 / 충돌 비용이 크다 |
| 언제 감지 | 쓸 때(사후) | 읽을 때 막음(사전) |
| 대기 | 없음, 실패 후 재시도 | 잠금 대기 |
| 요청 간 사용 | **가능** (버전을 폼·ETag 로 들고 다님) | 불가에 가깝다 — 사람이 편집하는 동안 DB 잠금을 유지할 수 없음 |
| 데드락 | 없음 | 가능 (잠금 순서 주의) |
| 처리량 | 경합 적으면 높음, 경합 많으면 재시도 폭증 | 경합 많을 때 안정적, 적을 때도 잠금 비용 |
| 대표 예 | 문서·설정 편집, 관리 화면, REST PATCH | 재고 차감, 좌석 예약, 잔액 이체, 작업 큐 |

사람이 오래 편집하는 화면에 "비관적 잠금"이 필요하면(Fowler 의 Pessimistic Offline Lock), DB 행 잠금이 아니라 **잠금 테이블(누가, 언제까지)** 을 따로 두고 만료를 둔다.

## 언제 쓰나

- 기본은 **낙관적 잠금**. 대부분의 CRUD 는 같은 행을 동시에 고치는 일이 드물고, 요청 사이에서도 동작한다.
- 같은 행에 쓰기가 몰리는 핫스팟(인기 상품 재고, 한정 쿠폰)이고 한 트랜잭션 안에서 끝나는 작업은 **비관적 잠금**이나, 더 나아가 원자적 `UPDATE … WHERE` 조건으로.
- 이벤트 소싱에서는 스트림의 기대 버전으로 같은 원리(낙관적 동시성)를 쓴다. [이벤트 소싱](/develop-wiki/knowledge/architecture/event-sourcing/) 참고.

## 주의

- **낙관적 잠금은 모든 쓰기 경로가 지켜야 한다.** 배치 스크립트 하나가 `version` 을 무시하고 `UPDATE` 하면 보호가 깨진다. 트리거로 강제하는 방법도 있다.
- 갱신 시각을 버전으로 쓰면 해상도 문제로 같은 값이 나올 수 있다. 정수 버전이 안전하다.
- 경합이 많은 곳에 낙관적 잠금을 쓰면 재시도가 재시도를 부른다. 충돌률을 메트릭으로 본다.
- `FOR UPDATE` 를 쥔 채 외부 API 호출·사용자 입력을 기다리지 않는다. 잠금 시간 = 트랜잭션 시간이다. `lock_timeout` 을 건다.
- 여러 행을 잠글 때는 **항상 같은 순서**(예: id 오름차순)로. 순서가 엇갈리면 데드락이고, PostgreSQL 은 하나를 강제로 중단시킨다 → 재시도 로직 필요.
- `REPEATABLE READ`/`SERIALIZABLE` 에서 `FOR UPDATE` 대상 행이 트랜잭션 시작 후 바뀌었으면 직렬화 오류가 난다. 재시도 전제로 짠다.
- 여러 서비스·DB 에 걸친 경우 행 잠금은 소용없다. [사가](/develop-wiki/knowledge/distributed-systems/saga/)의 의미적 잠금(`PENDING` 상태) 같은 업무 수준 장치가 필요하다.
