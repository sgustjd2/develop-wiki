---
title: 테스트 더블 (더미·페이크·스텁·스파이·목)
aka: [Test Double, Mock, Stub, Fake, Spy, Dummy, Mocks Aren't Stubs]
category: testing-practice
level: beginner
summary: 테스트에서 실제 협력 객체 대신 쓰는 대역 다섯 종류의 차이와, 상태 검증과 행위 검증 중 무엇을 고를지에 대한 기준.
tags: [testing, mock, stub, fake, unit-test]
related: [testing-practice/test-pyramid-trophy, testing-practice/tdd, testing-practice/contract-testing, architecture/hexagonal, principles/solid]
sources:
  - https://martinfowler.com/bliki/TestDouble.html
  - https://martinfowler.com/articles/practical-test-pyramid.html
  - https://martinfowler.com/articles/nonDeterminism.html
updatedAt: 2026-11-18
---

"테스트 더블"은 Gerard Meszaros 가 *xUnit Test Patterns* 에서 정리한 용어다(영화의 스턴트 더블에서 왔다). 흔히 전부 "목"이라고 부르지만 종류마다 쓰임이 다르다.

## 문제

결제 게이트웨이, 메일 발송, 시계, 난수처럼 느리거나, 비결정적이거나, 부수효과가 있는 의존성을 진짜로 부르면 테스트가 느리고 불안정해진다.

## 다섯 가지

| 종류 | 하는 일 | 예 |
| --- | --- | --- |
| 더미(Dummy) | 자리만 채움. 실제로 쓰이지 않음 | 시그니처상 필요한 `logger` 인자 |
| 스텁(Stub) | 미리 정한 값을 돌려줌 | `rates.get('USD')` → `1380` |
| 스파이(Spy) | 스텁 + 어떻게 호출됐는지 기록 | 메일 발송 호출 횟수·인자 저장 |
| 목(Mock) | 기대 호출을 미리 정하고, 어긋나면 실패 | "`charge(10000)` 이 정확히 1번 호출돼야 함" |
| 페이크(Fake) | 실제로 동작하지만 운영용은 아닌 간이 구현 | 인메모리 리포지토리, 인메모리 큐 |

```ts
// 페이크: 포트(인터페이스)를 진짜처럼 구현
class InMemoryOrderRepo implements OrderRepo {
  private rows = new Map<string, Order>();
  async save(o: Order) { this.rows.set(o.id, structuredClone(o)); }
  async find(id: string) { return this.rows.get(id) ?? null; }
}

// 스텁 + 스파이
const sent: Email[] = [];
const mailer: Mailer = { send: async (e) => { sent.push(e); } };
const clock: Clock = { now: () => new Date('2026-11-18T00:00:00Z') };

await new PlaceOrder(new InMemoryOrderRepo(), mailer, clock).run(cmd);
expect(sent).toHaveLength(1);              // 행위 확인(스파이)
expect(sent[0].to).toBe('a@example.com');
```

## 상태 검증 vs 행위 검증

- **상태 검증**: 실행 후 결과 상태를 본다(리포지토리에 주문이 저장됐나). 페이크·스텁과 어울린다.
- **행위 검증**: 협력 객체가 어떻게 불렸는지 본다(`charge` 가 이 인자로 불렸나). 목·스파이와 어울린다.

기본은 상태 검증. 결과가 "외부로 나가는 호출" 그 자체일 때(메일 발송, 결제 요청)만 행위 검증을 쓴다.

## 언제 쓰나

- 프로세스 밖 의존성(네트워크, 외부 API, 메일, 결제)과 비결정적 요소(시계, 난수, UUID).
- [헥사고날](/develop-wiki/knowledge/architecture/hexagonal/)처럼 포트로 의존성을 끊어 두면 더블을 끼우기 쉽다. 시계를 직접 부르지 말고 감싸라는 조언(Fowler, 비결정성 글)도 같은 맥락이다.

## 주의 (비용)

- **목이 많을수록 테스트가 구현에 묶인다.** 내부 호출 순서를 바꾸는 리팩터링만 해도 테스트가 깨진다.
- 내가 소유하지 않은 타입(서드파티 SDK)을 직접 목으로 만들지 않는다. 얇은 어댑터를 만들고 그 어댑터를 대체한다. 어댑터 자체는 통합 테스트로 검증한다.
- 더블은 실제와 어긋날 수 있다. 외부 서비스 더블은 [계약 테스트](/develop-wiki/knowledge/testing-practice/contract-testing/)로 주기적으로 맞춘다.
- DB 를 페이크로 바꾸면 SQL·제약·트랜잭션 버그를 못 잡는다. 저장소 계층은 실제 DB(컨테이너)로 통합 테스트한다.
- 같은 프로세스 안의 순수 객체까지 대체할 필요는 없다. 진짜를 쓰는 사교적 테스트가 더 많은 확신을 준다.
