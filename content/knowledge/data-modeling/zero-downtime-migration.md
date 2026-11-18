---
title: 무중단 스키마 마이그레이션
aka: [Zero-Downtime Migration, Expand and Contract, Parallel Change, Online Schema Change, 확장-축소 마이그레이션]
category: data-modeling
level: advanced
summary: 서비스를 멈추지 않고 스키마를 바꾸기 위해 변경을 확장→이전→축소 단계로 쪼개고, 긴 잠금을 피하는 DDL 을 고르는 방법.
tags: [migration, schema, deployment, postgresql, expand-contract]
related: [data-modeling/index-design, data-modeling/normalization, distributed-systems/transactional-outbox]
sources:
  - https://martinfowler.com/bliki/ParallelChange.html
  - https://martinfowler.com/articles/evodb.html
  - https://www.postgresql.org/docs/current/sql-altertable.html
  - https://www.postgresql.org/docs/current/sql-createindex.html
updatedAt: 2026-11-18
---

## 문제

배포 중에는 **구 버전과 신 버전 애플리케이션이 같은 DB 를 동시에 쓴다**(롤링 배포, 카나리, 롤백). 칼럼 이름을 한 번에 바꾸면 둘 중 하나가 깨진다. 또 큰 테이블에 대한 DDL 은 강한 잠금을 잡아, 몇 초만 걸려도 뒤에 줄 선 쿼리들이 쌓여 장애가 된다.

## 해법 1: 확장 → 이전 → 축소

Danilo Sato 가 정리한 Parallel Change(확장-축소)를 스키마에 적용한다. 핵심 규칙: **모든 중간 상태에서 구·신 코드가 둘 다 동작해야 한다.**

칼럼 `name` → `full_name` 변경 예:

| 단계 | DB | 애플리케이션 |
| --- | --- | --- |
| 1. 확장 | `full_name` 추가(NULL 허용) | 그대로 |
| 2. 이중 쓰기 | — | 두 칼럼에 모두 쓰기, 읽기는 `name` |
| 3. 백필 | 기존 행을 작은 배치로 복사 | — |
| 4. 읽기 전환 | — | `full_name` 에서 읽기 (여전히 둘 다 쓰기) |
| 5. 쓰기 중단 | — | `name` 쓰기 제거 |
| 6. 축소 | `name` 삭제 | — |

각 단계는 **별도 배포**다. 5와 6 사이에는 롤백 여지를 둔다.

```ts
// 백필: 한 번에 다 하지 말고 짧은 트랜잭션 반복
let last = 0;
for (;;) {
  const r = await db.query(
    `UPDATE users SET full_name = name
      WHERE id IN (SELECT id FROM users WHERE id > $1 AND full_name IS NULL
                   ORDER BY id LIMIT 5000)
      RETURNING id`, [last]);
  if (r.rowCount === 0) break;
  last = Math.max(...r.rows.map((x) => x.id));
  await sleep(100); // 복제 지연·부하를 보며 속도 조절
}
```

## 해법 2: 잠금이 짧은 DDL 고르기 (PostgreSQL 기준)

| 하고 싶은 것 | 위험한 방법 | 안전한 방법 |
| --- | --- | --- |
| 인덱스 추가 | `CREATE INDEX` (쓰기 차단) | `CREATE INDEX CONCURRENTLY` (트랜잭션 밖에서, 실패 시 INVALID 인덱스 정리) |
| 칼럼 추가 + 기본값 | 휘발성 기본값(`clock_timestamp()`)은 테이블 재작성 | 비휘발 기본값은 메타데이터만 바뀜(재작성 없음) |
| FK·CHECK 추가 | 바로 추가하면 전체 검사 동안 잠금 | `ADD CONSTRAINT ... NOT VALID` → `VALIDATE CONSTRAINT`(쓰기 안 막음) |
| NOT NULL 추가 | `SET NOT NULL` 은 전체 스캔 + 강한 잠금 | `CHECK (col IS NOT NULL) NOT VALID` → 검증 → `SET NOT NULL`(스캔 생략) → CHECK 삭제 |
| 타입 변경 | `ALTER COLUMN TYPE` 은 대개 재작성 | 새 칼럼 추가 후 확장-축소 |

그리고 모든 마이그레이션 세션에 `SET lock_timeout = '3s'` 같은 상한을 둔다. 잠금을 못 잡으면 대기열을 만들지 말고 실패한 뒤 재시도하는 편이 낫다.

## 언제 쓰나

- 롤링·블루그린·카나리 배포를 하는 서비스, 다른 시스템이 같은 DB 를 읽는 경우.
- 큰 테이블(수백만 행 이상)이나 트래픽이 끊기지 않는 테이블.

## 주의 (비용)

- 한 번에 끝날 변경이 배포 3~6번으로 늘어난다. 내부 도구·트래픽 없는 테이블에는 과하다.
- **축소 단계를 잊기 쉽다.** 이중 쓰기 코드와 구 칼럼이 영구히 남는다. 정리 작업을 티켓으로 같이 만든다.
- 이중 쓰기는 같은 트랜잭션에서 해야 한다. 트리거로 동기화할 수도 있지만 숨은 로직이 된다.
- 마이그레이션은 버전 관리되는 스크립트로만 적용한다(Fowler·Sadalage 의 진화적 DB 설계). 운영 DB 를 손으로 고치면 환경이 어긋난다.
- ORM 이 자동 생성한 마이그레이션은 위의 "위험한 방법"을 그대로 쓰는 경우가 많다. 생성된 SQL 을 리뷰한다.
- DB 마다 잠금 동작이 다르다. MySQL 은 `ALGORITHM=INSTANT/INPLACE` 지원 여부, 대형 테이블은 gh-ost·pt-online-schema-change 같은 도구를 따로 검토한다.
