---
title: PostgreSQL FOR NO KEY UPDATE 와 외래 키 설계 트레이드오프
aka: [FOR NO KEY UPDATE, FOR KEY SHARE, Foreign Key Lock, FK 잠금, 행 잠금 모드, 부모 행 핫 로우, FK 인덱스]
category: data-modeling
level: advanced
summary: 외래 키가 부모 행에 거는 FOR KEY SHARE 와 부모 UPDATE 의 FOR NO KEY UPDATE / FOR UPDATE 구분이 언제 서로를 막는지, 직접 만든 충돌 표와 pgbench 로 보이고 부모 설계(카운터 분리, 유니크 컬럼 갱신, FK 인덱스)로 연결한다.
tags: [postgresql, row-lock, foreign-key, for-no-key-update, for-key-share, multixact, pgbench, schema-design]
related: [data-modeling/postgresql-multixact-wraparound-row-locks, data-modeling/optimistic-pessimistic-locking, data-modeling/index-design, data-modeling/transaction-isolation, data-modeling/mvcc-vacuum, data-modeling/advisory-locks, data-modeling/db-job-queue, data-modeling/primary-key-design]
sources:
  - https://www.postgresql.org/docs/16/explicit-locking.html
  - https://www.postgresql.org/docs/16/pgrowlocks.html
updatedAt: 2026-11-19
---

## 문제

자식 행을 넣을 때 PostgreSQL 은 참조하는 **부모 행이 사라지거나 키가 바뀌지 않게** 지켜야 한다. 이 보호를 부모 행에 걸리는 행 잠금으로 구현한다. 문제는 그 잠금이 부모를 **자주 갱신하는** 쪽과 부딪히는지 여부다.

- 부모 갱신이 자식 INSERT 를 막으면: 부모 행이 사실상 직렬화 지점이 된다.
- 막지 않아도 잠금을 겹쳐 잡느라 **multixact** 가 만들어진다 → [multixact 운영](/develop-wiki/knowledge/data-modeling/postgresql-multixact-wraparound-row-locks/).

## 행 잠금 모드 네 가지 (공식 문서)

| 잠금 | 누가 거나 | 충돌 |
| --- | --- | --- |
| `FOR UPDATE` | `SELECT … FOR UPDATE`, `DELETE`, **키 컬럼을 바꾸는** `UPDATE` | 나머지 셋 모두와 충돌 |
| `FOR NO KEY UPDATE` | 위에 해당하지 않는 모든 `UPDATE`, `SELECT … FOR NO KEY UPDATE` | `FOR KEY SHARE` 와는 **충돌하지 않음** |
| `FOR SHARE` | `SELECT … FOR SHARE` | `UPDATE`·`DELETE`·`FOR NO KEY UPDATE`·`FOR UPDATE` 와 충돌 |
| `FOR KEY SHARE` | (FK 검사. 아래 실험으로 확인) | `DELETE`, 키 변경 `UPDATE`, `FOR UPDATE` 와만 충돌 |

"키 컬럼"은 문서 기준으로 **외래 키에서 참조될 수 있는 유니크 인덱스의 컬럼**이다. 부분 인덱스와 표현식 인덱스는 해당하지 않는다고 문서가 적고, 이 정의가 바뀔 수 있다고도 한다.

## 직접 실행: 충돌 표

PostgreSQL 16.15(임시 컨테이너). 테이블 `parent(id PK, name, email UNIQUE, n)` 와 `child(parent_id → parent.id)`. 한 세션이 행에 잠금을 잡고(2.5 초 유지) 다른 세션이 `lock_timeout=800ms` 로 시도해 **BLOCK**(타임아웃) / ok 로 판정했다. 각 라운드마다 데이터를 초기화했다.

| 먼저 잡은 쪽 \ 나중 시도 | 부모 `DELETE` | 자식 INSERT(FK) | 부모 비키 `UPDATE` | 부모 `FOR SHARE` | 부모 PK `UPDATE` |
| --- | --- | --- | --- | --- | --- |
| 부모 `UPDATE name`(비키) | BLOCK | **ok** | BLOCK | BLOCK | BLOCK |
| 부모 `UPDATE id = id`(값 불변) | BLOCK | **ok** | BLOCK | BLOCK | BLOCK |
| 부모 `UPDATE email`(유니크 컬럼) | BLOCK | **BLOCK** | BLOCK | BLOCK | BLOCK |
| 부모 `UPDATE id = 2`(PK 변경) | BLOCK | BLOCK | BLOCK | BLOCK | BLOCK |
| `SELECT … FOR NO KEY UPDATE` | BLOCK | ok | BLOCK | BLOCK | BLOCK |
| `SELECT … FOR UPDATE` | BLOCK | BLOCK | BLOCK | BLOCK | BLOCK |
| `SELECT … FOR SHARE` | BLOCK | ok | BLOCK | ok | BLOCK |
| 부모 `DELETE` | BLOCK | BLOCK | BLOCK | BLOCK | BLOCK |
| 자식 INSERT(FK 검사) | BLOCK | ok | ok | ok | BLOCK |

- 자식 INSERT 가 막는 것은 **부모 DELETE 와 키 변경뿐**이다. 비키 UPDATE 와 FOR SHARE 와는 공존한다. 즉 FK 검사는 `FOR KEY SHARE` 로 동작한다고 관측된다(문서의 FK 절은 읽지 않았고, 이 결론은 이 표와 아래 `pgrowlocks` 에 근거한다).
- `UPDATE id = id` 처럼 **값이 안 바뀌면** 키 컬럼이어도 `FOR NO KEY UPDATE` 로 처리됐다.
- 유니크 인덱스 컬럼 확인(자식 INSERT 를 시도): 일반 유니크 인덱스(`code`)의 갱신은 **BLOCK**, 표현식 유니크 인덱스(`lower(name)`)·부분 유니크 인덱스·인덱스 없는 컬럼의 갱신은 ok. 문서 서술과 일치한다.

`pgrowlocks` 로 본 겹침: 자식 INSERT 트랜잭션을 연 채 다른 세션이 부모의 비키 컬럼을 UPDATE 하자 `multi = t`, `modes = {"Key Share","No Key Update"}` 였다. 이 상태에서 세 번째 세션의 비키 UPDATE 는 BLOCK(NO KEY UPDATE 끼리는 충돌). 즉 두 잠금이 공존하는 대가가 **multixact 생성**이다.

## 직접 실행: 부모 갱신 방식에 따른 처리량과 MXID

16 클라이언트 pgbench 10 초. 스크립트 비율 4:1 = 자식 INSERT(트랜잭션 안에서 5ms `pg_sleep`) : 부모 갱신(같은 방식으로 5ms 유지). 부모는 1 행(`id=1`)만 쓴다. 실행 전후 체크포인트의 `next_multixact_id`(MXID)와 `next_multi_offset`(멤버) 차이로 소비량을 쟀다. a, b 는 2 회, c, d 는 1 회 실행했다.

| 부모 갱신 방식 | 자식 INSERT tps | 부모 갱신 tps | 소비 MXID | 소비 멤버 |
| --- | --- | --- | --- | --- |
| a. 부모에 카운터 컬럼 `n = n + 1` | 583~615 | 141~145 | 14,109~14,777 | 71,380~76,490 |
| b. 카운터를 **별도 테이블**로 분리 | 558~589 | 142~143 | 5,298~5,642 | 19,982~22,408 |
| c. 부모의 **유니크 컬럼** `email` 갱신 | 294 | 72 | 2,739 | 11,196 |
| d. `SELECT … FOR UPDATE` 후 UPDATE | 277 | 72 | 2,533 | 10,147 |

- a 는 처리량 저하가 거의 없다(FK 와 비키 UPDATE 가 서로 막지 않는다). 그러나 b 보다 **MXID 를 약 2.5~2.8 배** 소비했다. 부모를 갱신하는 트랜잭션이 자식 INSERT 와 겹칠 때마다 Key Share + No Key Update 조합 multixact 가 생기기 때문으로 이해한다(원인 분리 실험은 하지 않았다).
- b 에서도 자식 INSERT 끼리 겹쳐 MXID 가 소비된다(앞 노트의 결과와 같다). 갱신을 분리해도 0 이 되지는 않는다.
- c, d 는 부모 갱신이 `FOR UPDATE` 수준이라 자식 INSERT 와 **서로 직렬화**되어 두 스크립트 모두 tps 가 약 절반으로 떨어졌다. MXID 소비가 적은 것은 겹침이 없어서이지 이점이 아니다.
- 이 harness 는 `pg_sleep` 이 지배한다. 절대 tps 는 의미가 없고 **비교용**이다. 단일 컨테이너, 1 부모 행의 극단 조건이다.

## 설계 지침

1. **부모 행을 갱신할 때 키가 아닌 컬럼만** 바꾼다. 부모에 걸린 유니크 컬럼(이메일, 슬러그, 외부 코드)을 자주 갱신하면 그 갱신이 자식 INSERT 를 막는다. 유니크성이 꼭 필요하지 않으면 부분·표현식 유니크 인덱스로 표현할 수 있는지 본다(문서가 "바뀔 수 있다"고 한 정의에 기대는 설계이므로 업그레이드 시 재확인).
2. **명시적 잠금은 `FOR NO KEY UPDATE`.** 습관적 `SELECT … FOR UPDATE` 는 FK 자식 INSERT 와 충돌한다(위 표의 d). 키를 안 바꿀 읽기-수정-쓰기에는 `FOR NO KEY UPDATE` 로 충분하다.
3. **핫 카운터·집계·마지막 활동 시각을 부모 행에 두지 않는다.** 별도 테이블이나 [DB 큐](/develop-wiki/knowledge/data-modeling/db-job-queue/) 같은 구조로 분리하면 MXID 소비와 부모 행 경합이 줄었다(b). 대신 조인·일관성 관리 비용이 늘어난다.
4. **자식 FK 컬럼에 인덱스를 둔다.** 부모 DELETE/키 UPDATE 때 자식 테이블을 조회해야 해서, 자식 100 만 행·부모 2,000 행에서 부모 한 행 삭제의 FK 트리거 시간이 인덱스 없음 23.9ms, 있음 0.38ms 였다(단일 실행). PostgreSQL 은 FK 컬럼에 자동으로 인덱스를 만들지 않는다 → [인덱스 설계](/develop-wiki/knowledge/data-modeling/index-design/).
5. **FK 를 빼는 것은 마지막 수단.** FK 가 없으면 부모 잠금도 없지만 무결성을 앱·배치가 책임져야 한다. 대안으로 핫 부모 행을 쪼개(테넌트·샤드별 행) 경합을 분산한다.
6. **재시도 가능한 구조**라면 [낙관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/)으로 부모 행의 장기 잠금을 피할 수 있다.

## 언제 쓰나

- 부모 행에 자식 INSERT 가 몰리는 테이블(테넌트, 계정, 주문 헤더)을 설계·진단할 때.
- "부모를 업데이트하면 자식 INSERT 가 느려진다/멈춘다" 증상을 조사할 때(`pg_locks`, `pg_stat_activity` 의 대기 이벤트와 함께).
- ORM 이 쓰는 잠금 SQL(`FOR UPDATE` 등)을 점검할 때.

## 주의 (비용)

- 위 충돌 표는 **PostgreSQL 16.15 에서의 관측**이다. 키 컬럼의 정의와 FK 가 쓰는 잠금은 구현 세부이므로 다른 메이저 버전에서는 확인한다.
- FK 가 `FOR KEY SHARE` 를 쓴다는 결론은 관측이다. 공식 FK 설명을 읽고 확인하지는 않았다.
- `FOR NO KEY UPDATE` 로 충돌은 줄어도 **multixact 비용이 남는다.** 핫 부모에서는 [MXID 나이](/develop-wiki/knowledge/data-modeling/postgresql-multixact-wraparound-row-locks/)를 감시한다.
- 낮은 격리 수준 가정이 없는 표다. REPEATABLE READ·SERIALIZABLE 에서는 잠금 대기 후 직렬화 오류가 나는 동작이 다르다 → [격리 수준](/develop-wiki/knowledge/data-modeling/transaction-isolation/). 이 조합은 실험하지 않았다.
- 행 잠금은 디스크 쓰기를 유발할 수 있다(문서). 읽기 전용처럼 보이는 `FOR SHARE` 도 비용이 있다.
- 자식 쪽 잠금(자식 UPDATE 로 `parent_id` 를 바꾸면 새 부모에 KEY SHARE)과 `ON DELETE CASCADE` 의 대량 삭제 비용은 이 노트에서 다루지 않았다.

## 비교

| 선택 | 부모 갱신과 자식 INSERT | 비용 |
| --- | --- | --- |
| 부모 비키 컬럼 `UPDATE` | 서로 막지 않음 | multixact 소비 |
| 부모 유니크 컬럼 `UPDATE` | 서로 직렬화 | 처리량 하락 |
| 카운터 분리 테이블 | 부모와 무관 | 조인·일관성 관리 |
| `FOR UPDATE` 습관 | 서로 직렬화 | 불필요한 대기 |
| `FOR NO KEY UPDATE` | 서로 막지 않음 | multixact 소비 |
| FK 제거 | 잠금 없음 | 무결성 직접 책임 |

## 검증 범위

PostgreSQL 16 공식 문서의 Explicit Locking 행 수준 잠금 절(모드 정의, 충돌 표, 키 컬럼 정의)을 읽었다. 위 충돌 표, pgrowlocks 출력, pgbench 비교, FK 인덱스 유무 시간은 임시 `postgres:16` 컨테이너에서 직접 실행했고 종료 후 컨테이너와 익명 볼륨을 삭제했다. 기존 컨테이너는 건드리지 않았다. 다른 버전, REPEATABLE READ 이상, ON DELETE CASCADE 경로는 실행하지 않았다.
