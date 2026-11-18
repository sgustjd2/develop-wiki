---
title: CQRS
aka: [Command Query Responsibility Segregation, 명령 조회 책임 분리]
category: architecture
group: app-structure
level: advanced
summary: 데이터를 바꾸는 명령(command) 모델과 읽는 조회(query) 모델을 분리해, 각각을 따로 설계·최적화·확장하는 패턴.
tags: [ddd, read-model, eventual-consistency, event-sourcing]
related: [architecture/event-driven, architecture/layered-clean-hexagonal, distributed-systems/transactional-outbox, distributed-systems/idempotency]
sources:
  - https://martinfowler.com/bliki/CQRS.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs
  - https://martinfowler.com/articles/201701-event-driven.html
updatedAt: 2026-11-18
---

Greg Young 이 이름 붙였고, Bertrand Meyer 의 CQS(command-query separation: 메서드는 상태를 바꾸거나 값을 돌려주거나 둘 중 하나만)를 **모델 수준**으로 넓힌 것이다.

## 문제

하나의 모델로 읽기와 쓰기를 모두 처리한다.

- 쓰기는 검증·불변식·트랜잭션이 중요하고, 읽기는 화면에 맞춘 조인·집계가 중요하다. 한 모델이 양쪽 요구를 다 떠안아 복잡해진다.
- 조회가 쓰기보다 훨씬 많아도 같은 DB·같은 스키마로 함께 확장해야 한다.
- 화면용 필드가 엔티티에 붙고, 쓰기 경로에 불필요한 데이터가 노출된다.

## 해법

```
         ┌─ Command ─▶ 쓰기 모델(도메인 규칙) ─▶ 쓰기 저장소
Client ──┤                                      │ 이벤트/동기화
         └─ Query ───▶ 읽기 모델(DTO·뷰) ◀────── 읽기 저장소
```

- **명령**은 "예약하기"처럼 업무 의도를 표현하고 결과값을 거의 돌려주지 않는다.
- **조회**는 상태를 바꾸지 않고, 화면에 맞춘 DTO 를 돌려준다. 도메인 로직이 없다.
- 단계가 있다: ① 같은 DB 에 모델만 분리 → ② 읽기 전용 저장소(구체화된 뷰, 문서 DB, 검색 엔진)를 따로 두고 이벤트로 동기화.

```ts
// 쓰기 측: 의도를 드러내는 명령 + 도메인 규칙
type ReserveRoom = { reservationId: string; roomId: string; guestId: string };
async function handle(cmd: ReserveRoom, repo: RoomRepository) {
  const room = await repo.get(cmd.roomId);
  room.reserve(cmd.guestId);          // 불변식 검사
  await repo.save(room);              // + RoomReserved 이벤트 기록
}

// 읽기 측: 화면 전용 모델, 로직 없음
type RoomCard = { roomId: string; name: string; available: boolean };
const listRooms = (db: ReadDb) => db.query<RoomCard>('select * from room_cards');
```

## 언제 쓰나

- 도메인이 복잡하고, 읽기와 쓰기의 형태·부하가 크게 다를 때 (조회 ≫ 쓰기)
- 같은 데이터를 여러 사용자가 동시에 고치는 협업 환경, 단계별 작업 UI(task-based UI)
- 이벤트 소싱을 쓰는 경우 — 이벤트 저장소가 쓰기 모델, 읽기 모델은 이벤트로 만든 투영(projection)

## 주의 (비용)

- Fowler 는 강하게 경고한다: 대부분의 시스템은 CRUD 로 충분하고, CQRS 는 **이점이 분명할 때만** 쓴다. 그가 본 사례에서는 실패가 더 많았다.
- 시스템 전체가 아니라 **바운디드 컨텍스트 하나**에 적용한다.
- 저장소를 분리하면 **최종 일관성**이 생긴다. 사용자가 방금 쓴 내용이 목록에 안 보일 수 있으므로 UI 에서 처리해야 한다.
- 쓰기 저장소 갱신과 이벤트 발행을 원자적으로 묶어야 한다 → [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/). 읽기 모델 갱신기는 중복 이벤트를 견뎌야 한다 → [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/).
- 조회 성능만 문제라면 리포팅 DB·읽기 복제본·캐시로 충분할 수 있다.

## 비교

| | CRUD 단일 모델 | CQRS (같은 DB) | CQRS + 별도 읽기 저장소 | CQRS + 이벤트 소싱 |
| --- | --- | --- | --- | --- |
| 모델 | 1개 | 2개 | 2개 | 이벤트 스트림 + 투영 |
| 일관성 | 즉시 | 즉시 | 최종 일관성 | 최종 일관성 |
| 독립 확장 | 불가 | 제한적 | 가능 | 가능 |
| 복잡도 | 낮음 | 중간 | 높음 | 매우 높음 |
