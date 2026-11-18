---
title: 이벤트 소싱
aka: [Event Sourcing, Event Store, 이벤트 저장소]
category: architecture
group: app-structure
level: advanced
summary: 현재 상태 대신 상태를 바꾼 이벤트들을 추가 전용 저장소에 순서대로 기록하고, 이벤트를 재생해 상태를 만드는 패턴. 감사 추적과 과거 상태 재구성에 강하지만 복잡도가 크다.
tags: [ddd, event-store, cqrs, audit, eventual-consistency]
related: [architecture/cqrs, architecture/event-driven, distributed-systems/transactional-outbox, distributed-systems/idempotency, design-patterns/command]
sources:
  - https://martinfowler.com/eaaDev/EventSourcing.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing
updatedAt: 2026-11-18
---

## 문제

일반적인 CRUD 는 **현재 상태만** 저장하고 덮어쓴다.

- "이 계좌 잔액이 왜 이렇게 됐나"를 설명할 이력이 없다. 감사 로그를 따로 만들면 본 데이터와 어긋날 수 있다.
- "지난달 말 기준 상태"를 다시 볼 수 없다.
- 같은 행을 많은 요청이 동시에 읽고-고치고-쓰면 잠금 경합이 생긴다.
- 상태 변경과 이벤트 발행을 따로 하면 이중 쓰기 문제가 생긴다.

## 해법

- 엔티티(집합체)마다 **이벤트 스트림**을 둔다. 변경은 `ItemAdded`, `OrderCanceled` 같은 이벤트를 **추가(append)만** 한다. 수정·삭제하지 않는다.
- 현재 상태는 스트림을 처음부터 재생(rehydration)해 계산한다.
- 이벤트 저장소가 **진실의 원천(system of record)** 이다. 조회용 모델은 이벤트로 만든 투영(projection) → [CQRS](/develop-wiki/knowledge/architecture/cqrs/)

```ts
type CartEvent =
  | { type: 'ItemAdded'; sku: string; qty: number }
  | { type: 'ItemRemoved'; sku: string }
  | { type: 'CheckedOut' };

type Cart = { items: Map<string, number>; checkedOut: boolean };

const apply = (s: Cart, e: CartEvent): Cart => {
  const items = new Map(s.items);
  if (e.type === 'ItemAdded') items.set(e.sku, (items.get(e.sku) ?? 0) + e.qty);
  if (e.type === 'ItemRemoved') items.delete(e.sku);
  return { items, checkedOut: s.checkedOut || e.type === 'CheckedOut' };
};
const rehydrate = (events: CartEvent[]) =>
  events.reduce(apply, { items: new Map(), checkedOut: false });

// 명령 처리: 상태 재구성 → 규칙 검사 → 새 이벤트 추가 (낙관적 동시성)
async function addItem(store: EventStore, cartId: string, sku: string, qty: number) {
  const { events, version } = await store.read(cartId);
  if (rehydrate(events).checkedOut) throw new Error('이미 결제된 장바구니');
  await store.append(cartId, [{ type: 'ItemAdded', sku, qty }], version); // 버전이 바뀌었으면 거부 → 재시도
}
interface EventStore {
  read(id: string): Promise<{ events: CartEvent[]; version: number }>;
  append(id: string, e: CartEvent[], expectedVersion: number): Promise<void>;
}
```

### 할 수 있게 되는 것 (Fowler)

- **전체 재구성**: 상태를 버리고 이벤트 로그로 다시 만든다. 새 읽기 모델도 과거 이벤트로 소급 생성한다.
- **시점 조회**: 특정 시점까지의 이벤트만 재생해 그때 상태를 본다.
- **재생**: 운영 이벤트를 테스트 환경에서 재생해 버그를 재현한다.

## 언제 쓰나

- 변경의 **의도·이력**이 업무상 중요할 때: 원장·결제, 주문 처리, 재고, 규제·감사 요구가 있는 도메인
- 과거 상태 재구성, 이벤트 재생, 소급 분석이 필요할 때
- 이미 이벤트 드리븐 구조이고 CQRS 의 읽기 모델을 이벤트로 만들 때
- 시스템 전체가 아니라 **이득이 큰 부분에만** 적용한다(결제 원장은 이벤트 소싱, 사용자 프로필은 CRUD).

## 주의 (비용)

Azure Architecture Center 와 Fowler 모두 기본 선택이 아니라고 경고한다. 도입·이탈 비용이 크고 이후 설계를 제약한다.

- **이벤트 설계**: "잔여 좌석이 42 로 바뀜"(상태)이 아니라 "좌석 2개 예약됨"(의도)을 기록해야 의미 있는 이력이 된다.
- **스키마 진화**: 저장된 이벤트는 바꾸지 않는다. 새 필드를 무시하는 관대한 역직렬화, 이벤트 버전 표기, 읽을 때 구버전을 변환하는 업캐스터를 쓴다. 이벤트를 직접 고치는 마이그레이션은 최후 수단.
- **잘못된 이벤트**도 영원히 남는다. 코드를 고쳐도 과거 이벤트는 그대로라 보상 이벤트가 필요하다.
- **조회**: 이벤트 저장소에 임의 쿼리를 할 수 없다. 투영(읽기 모델)이 필수이고 **최종 일관성**이 생긴다.
- **스트림이 길면** 재생이 느리다. N 개마다 스냅샷을 저장하고 이후 이벤트만 재생한다. 스냅샷은 최적화일 뿐 원천은 스트림이다.
- 소비자는 같은 이벤트를 여러 번 받을 수 있으므로 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)해야 한다.
- **재생 중 외부 부작용**: 재생할 때 이메일·결제 호출이 다시 나가면 안 된다. 외부 시스템은 게이트웨이로 감싸 재생 모드에서 막는다.
- **개인정보 삭제 요구**와 불변 저장이 충돌한다. 개인정보는 이벤트 밖에 두고 ID 로 참조하거나, 주체별 키로 암호화하고 키를 지운다(crypto-shredding).
- Kafka 같은 메시지 브로커는 엔티티별 스트림 조회와 낙관적 동시성이 약해 이벤트 저장소를 대신하지 못한다. 배포 계층으로 쓴다.
- 테스트는 "주어진 과거 이벤트 → 명령 → 기대 이벤트" 형태로 쓰기 좋지만, 투영·스키마 진화 테스트가 추가로 필요하다.

## 비교

| | CRUD | 이벤트 소싱 | 트랜잭셔널 아웃박스 |
| --- | --- | --- | --- |
| 진실의 원천 | 현재 상태 테이블 | 이벤트 스트림 | 현재 상태 테이블 |
| 이벤트 발행 | 별도 구현 | 저장이 곧 이벤트 (이중 쓰기 없음) | 같은 트랜잭션에 아웃박스 기록 |
| 이력·시점 조회 | 별도 감사 로그 필요 | 기본 제공 | 아웃박스는 보통 지움 |
| 조회 | SQL 바로 | 투영 필요 (최종 일관성) | SQL 바로 |
| 복잡도 | 낮음 | 매우 높음 | 중간 |

이벤트만 안정적으로 내보내면 되는 경우라면 [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/)가 훨씬 가벼운 선택이다.
