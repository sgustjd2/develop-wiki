---
title: 2단계 커밋(2PC) vs 사가
aka: [Two-Phase Commit, 2PC, XA, Distributed Transaction, Saga, Atomic Commit, PREPARE TRANSACTION]
category: distributed-systems
level: advanced
summary: 여러 저장소에 걸친 변경을 하나로 묶는 두 방법의 비교. 원자적이지만 막힐 수 있는 2PC 와, 막히지 않지만 격리가 없고 보상을 직접 설계해야 하는 사가.
tags: [distributed-systems, transaction, 2pc, xa, saga, microservices, consistency]
related: [distributed-systems/saga, distributed-systems/transactional-outbox, distributed-systems/idempotency, distributed-systems/cap-pacelc, distributed-systems/consistency-models, data-modeling/transaction-isolation, data-modeling/sharding-partitioning]
sources:
  - https://www.postgresql.org/docs/current/sql-prepare-transaction.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/saga
  - https://microservices.io/patterns/data/saga.html
updatedAt: 2026-11-18
---

> 사가 자체의 구조(보상, 피벗, 코레오그래피 vs 오케스트레이션)는 [사가 패턴](/develop-wiki/knowledge/distributed-systems/saga/) 노트에 있다. 이 노트는 **2PC 와 무엇이 다르고 언제 어느 쪽인가**에 집중한다.

## 문제

"주문 DB 에 주문 생성 + 재고 DB 에서 차감"을 **둘 다 되거나 둘 다 안 되게** 하고 싶다. 저장소가 하나면 트랜잭션 하나로 끝나지만, 저장소가 둘 이상(샤드, 서비스별 DB, DB + 메시지 브로커)이면 각자 커밋하는 사이에 하나가 실패할 수 있다.

## 2PC: 모두에게 "준비됐나?" 묻고 커밋

코디네이터(트랜잭션 매니저)가 참여자들을 두 단계로 이끈다.

```
코디네이터                     참여자 A (주문 DB)      참여자 B (재고 DB)
 ── 1단계: PREPARE ───────────▶ 변경을 디스크에 기록,    같은 일
                                잠금 유지, "YES" 약속
 ◀── YES ─────────────────────  ◀── YES ──────────────
 (결정을 자기 로그에 기록: COMMIT)
 ── 2단계: COMMIT ────────────▶ 커밋, 잠금 해제           커밋, 잠금 해제
 (하나라도 NO/응답 없음 → 모두에게 ROLLBACK)
```

```sql
-- PostgreSQL 이 참여자 역할을 하는 명령 (max_prepared_transactions > 0 필요, 기본 0)
BEGIN;
UPDATE stock SET qty = qty - 1 WHERE sku = 'A-1';
PREPARE TRANSACTION 'order-981';   -- 디스크에 저장, 잠금 유지, 세션은 트랜잭션에서 빠짐
-- 코디네이터의 결정 후, 어느 세션에서든:
COMMIT PREPARED 'order-981';       -- 또는 ROLLBACK PREPARED 'order-981'
```

- 핵심 약속: 참여자가 YES 라고 답하면, 이후 크래시가 나도 **커밋할 수 있는 상태를 유지**해야 한다. 혼자 롤백할 권리를 포기하는 것이다.
- 그래서 **차단(blocking) 문제**가 생긴다. 참여자가 YES 를 보낸 뒤 코디네이터가 죽으면, 참여자는 결정을 알 때까지 잠금을 쥔 채 기다릴 수밖에 없다(in-doubt 트랜잭션). 그동안 그 행을 건드리는 모든 작업이 멈춘다.
- PostgreSQL 문서도 준비된 트랜잭션을 오래 두면 잠금이 남고, VACUUM 이 공간을 회수하지 못하며, 극단적으로는 트랜잭션 ID 랩어라운드 방지를 위한 셧다운까지 갈 수 있다고 경고한다. 그리고 **트랜잭션 매니저를 만드는 게 아니라면 직접 쓰지 말라**고 한다.
- 표준 인터페이스는 X/Open XA. Java 의 JTA, 일부 DB·브로커가 지원한다. 분산 SQL DB(Spanner, CockroachDB 등)는 내부적으로 합의(Paxos/Raft)로 복제된 참여자를 써서 코디네이터 장애의 차단 문제를 줄인다.

## 사가: 각자 커밋하고, 실패하면 보상

각 단계가 **자기 로컬 트랜잭션을 바로 커밋**하고 다음 단계를 메시지로 일으킨다. 중간에 실패하면 이미 커밋한 단계를 **보상 트랜잭션**(주문 취소, 재고 복구)으로 되돌린다.

```ts
// 대비: 2PC 는 "아직 확정 안 된 변경"을 잠근 채 기다리고,
//       사가는 "확정된 변경"을 나중에 업무적으로 되돌린다.
await orders.create(o);            // 커밋됨 — 다른 요청이 PENDING 주문을 볼 수 있다
try { await inventory.reserve(o); } // 커밋됨
catch { await orders.cancel(o); }  // 보상 (삭제가 아니라 취소 상태로)
```

## 비교

| | 2PC | 사가 |
| --- | --- | --- |
| 원자성 | 프로토콜이 보장 (전부 or 전무) | 최종적으로 전부 or "보상된 상태" — 앱이 보장 |
| 격리 | 커밋 전 변경은 남에게 안 보임 (잠금) | **없음.** 중간 상태가 보인다 → 의미적 잠금(`PENDING`) 등으로 대응 |
| 잠금 유지 시간 | 가장 느린 참여자 + 네트워크 왕복 동안 | 각 로컬 트랜잭션 동안만 |
| 장애 시 | 코디네이터 장애 시 참여자가 잠금 쥔 채 대기 | 막히지 않음. 대신 보상·재시도 로직이 필요 |
| 가용성 | 참여자 하나만 느려도 전체가 느려짐 | 단계별로 독립. 비동기 진행 가능 |
| 참여자 요건 | 모두 2PC/XA 를 지원해야 함 (많은 NoSQL·브로커·외부 API 미지원) | 로컬 트랜잭션 + 메시지만 있으면 됨 (외부 API 도 가능) |
| 되돌리기 | 자동 롤백 | 보상을 직접 설계. 되돌릴 수 없는 단계(메일 발송)는 순서로 해결 |
| 구현 복잡도 | 인프라(트랜잭션 매니저)에 숨음 | 앱 코드·상태 머신에 드러남 |
| 맞는 곳 | 한 조직이 통제하는 소수의 DB, 짧은 트랜잭션, 강한 원자성 필수 | 서비스별 DB, 오래 걸리는 업무 흐름, 외부 시스템 포함 |

## 언제 무엇을

1. **먼저 경계를 의심한다.** 함께 원자적이어야 하는 데이터가 서로 다른 저장소에 있다면, 같은 DB(같은 서비스·같은 샤드 키)로 모으는 것이 둘 다보다 낫다.
2. **DB 갱신 + 메시지 발행**만 묶으면 되는 경우 → 2PC 도 사가도 아닌 [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/).
3. 같은 DB 엔진의 여러 샤드, 짧은 트랜잭션, 통제된 환경 → 2PC (가능하면 분산 SQL DB 가 내부에서 처리하게).
4. 여러 서비스·외부 API 를 거치는 업무 흐름, 몇 초~며칠 걸리는 과정 → 사가.

## 주의

- 2PC 는 "분산 트랜잭션이 해결됐다"가 아니라 **가용성을 일관성과 맞바꾼 것**이다. [CAP·PACELC](/develop-wiki/knowledge/distributed-systems/cap-pacelc/) 참고.
- 남은 준비 트랜잭션(`pg_prepared_xacts`)을 모니터링하고 정리하는 운영 절차가 필요하다. 코디네이터의 결정 로그도 내구성 있게 보관해야 한다.
- 사가의 보상은 "원래대로"가 아니라 "업무적으로 동등한 반대 작업"이다. 이미 알림이 나갔다면 정정 알림이 보상이다.
- 사가의 모든 단계와 보상은 메시지 중복 전달을 견디도록 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)해야 한다.
- 3단계 커밋(3PC)은 이론상 차단을 줄이지만 네트워크 분할에서 안전하지 않아 실무에서는 거의 쓰이지 않는다. 차단 문제의 실용적 해법은 코디네이터·참여자를 합의로 복제하는 쪽이다.
