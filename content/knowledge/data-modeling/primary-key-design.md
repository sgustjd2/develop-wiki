---
title: 기본 키 설계 (자동 증가 vs UUIDv7·ULID)
aka: [Primary Key Design, Surrogate Key, Auto Increment, UUIDv4, UUIDv7, ULID, 대리 키]
category: data-modeling
level: intermediate
summary: 자동 증가 정수, 무작위 UUIDv4, 시간 정렬 UUIDv7·ULID 를 인덱스 지역성, 분산 생성, 노출 위험 기준으로 비교하고 고르는 방법.
tags: [rdbms, primary-key, uuid, ulid, b-tree, distributed]
related: [data-modeling/index-design, data-modeling/sharding-partitioning, distributed-systems/idempotency]
sources:
  - https://www.rfc-editor.org/rfc/rfc9562.html
  - https://github.com/ulid/spec
  - https://www.postgresql.org/docs/current/functions-uuid.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding
updatedAt: 2026-11-18
---

## 문제

기본 키는 한 번 정하면 바꾸기가 거의 불가능하다(외래 키, URL, 외부 시스템, 로그에 퍼진다). 그런데 요구는 서로 부딪친다.

- B-tree 에 **순서대로** 들어가야 삽입이 빠르고 인덱스가 작다.
- 여러 서버·클라이언트가 **조율 없이** 만들 수 있어야 한다(샤딩, 오프라인, 멱등 키).
- URL 에 노출돼도 **개수·순서를 추측**당하지 않아야 한다.

## 선택지 비교

| | 자동 증가(`bigint identity`) | UUIDv4 | UUIDv7 | ULID |
| --- | --- | --- | --- | --- |
| 크기 | 8바이트 | 16바이트 | 16바이트 | 16바이트(문자열 26자) |
| 생성 위치 | DB 만 | 어디서나 | 어디서나 | 어디서나 |
| 정렬 | 생성 순 | 무작위 | 밀리초 시각 순 | 밀리초 시각 순 |
| B-tree 삽입 지역성 | 매우 좋음 | 나쁨 | 좋음 | 좋음 |
| 무작위 비트 | 0 | 122 | 74(구현에 따라 일부를 카운터로) | 80 |
| 추측 가능성 | 높음(다음 ID, 총 개수) | 없음 | 생성 시각이 드러남 | 생성 시각이 드러남 |
| 표준 | DB 기능 | RFC 9562 | RFC 9562 (2024) | 커뮤니티 스펙 |

RFC 9562 는 RFC 4122 를 대체하며 UUIDv7 을 새로 정의했다. 상위 48비트가 유닉스 밀리초 타임스탬프라 시간 순으로 정렬되고, RFC 는 가능하면 v1·v6 대신 v7 을 쓰라고 권한다. 같은 문서가 v4 처럼 시간 순서가 없는 ID 는 B-tree 류 인덱스에서 지역성이 나쁘다고 짚는다.

## 해법

```sql
-- PostgreSQL 18+: 내장 uuidv7()
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  customer_id bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

```ts
// 애플리케이션에서 생성 (예: uuid 패키지 v10+ 의 v7)
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7(); // 클라이언트가 미리 ID 를 정하면 재시도 시 멱등 키로도 쓸 수 있다
await db.query('INSERT INTO orders (id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, cid]);
```

혼합 전략도 흔하다: 내부 조인·외래 키는 `bigint`, 외부 노출용으로 별도 UUID/ULID 칼럼(유니크 인덱스)을 둔다.

## 언제 쓰나

- **자동 증가**: 단일 DB, 내부 ID 만 쓰고 외부에 노출하지 않을 때. 가장 작고 빠르다.
- **UUIDv7 / ULID**: 분산 생성, 샤딩, 클라이언트 측 ID 할당, 이벤트·메시지 ID. 기본 키로 UUID 가 필요하면 v4 보다 v7.
- **UUIDv4**: 정렬이 필요 없고 시각 노출도 피해야 하는 토큰성 식별자. 단, 인증 토큰이나 비밀번호 재설정 토큰은 ID 가 아니라 별도 CSPRNG 비밀값으로 만든다.

## 주의 (비용)

- **시간 정렬 ID 는 생성 시각을 공개한다.** 가입 시각, 주문 시각이 민감하면 외부 노출용으로 쓰지 않는다.
- 시간 정렬 ID 를 **샤드 키**로 그대로 쓰면 최신 샤드에 쓰기가 몰린다. 해시를 씌우거나 테넌트 ID 를 샤드 키로 쓴다.
- 같은 밀리초 안의 순서는 구현마다 다르다. ULID 스펙은 단조 생성기를 선택 사항으로 두고, PostgreSQL 문서도 세션 내 엄격한 단조성을 약속하지 않는다. 순서가 정확해야 하면 별도 시퀀스나 `created_at` 을 쓴다.
- 클라이언트 시계가 틀리면 순서가 어긋난다. ID 의 시각을 업무 시각으로 쓰지 않는다.
- 16바이트 키는 모든 보조 인덱스·외래 키에 복제된다(InnoDB 는 보조 인덱스가 기본 키를 담는다). 테이블이 많고 크면 저장·캐시 비용이 눈에 띈다.
- 문자열(`char(36)`, `varchar(26)`)로 저장하면 두 배 이상 커진다. 네이티브 `uuid`/`binary(16)` 타입을 쓴다.
- 자동 증가 ID 를 URL 에 노출하면 다른 사용자 리소스를 번호만 바꿔 조회하는 시도가 쉬워진다. 근본 해결은 ID 를 숨기는 것이 아니라 **접근 제어 검사**다.
