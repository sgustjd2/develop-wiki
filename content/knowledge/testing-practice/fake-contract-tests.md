---
title: 페이크·실제 구현 일치를 위한 계약 테스트
aka: [Fake Contract Tests, Shared Test Suite, Test Double Drift, Interface Contract Tests, Contract Test]
category: testing-practice
level: intermediate
summary: 같은 테스트 스위트를 실제 구현과 페이크 양쪽에 돌려, 빠른 테스트가 의존하는 대역이 진짜와 어긋나는 것(드리프트)을 막는 방법.
tags: [testing, fake, contract-test, test-double, hexagonal, integration]
related: [testing-practice/fake-vs-mock, testing-practice/contract-testing, testing-practice/test-doubles, testing-practice/test-pyramid-trophy, architecture/hexagonal, design-patterns/repository-unit-of-work]
sources:
  - https://martinfowler.com/bliki/ContractTest.html
  - https://martinfowler.com/articles/mocksArentStubs.html
updatedAt: 2026-11-19
---

서비스 간 소비자 주도 계약(Pact)은 [계약 테스트](/develop-wiki/knowledge/testing-practice/contract-testing/)에 있다. 이 노트는 그와 다른 용도, **내 코드가 쓰는 포트의 실제 어댑터와 페이크가 같은 약속을 지키는지** 확인하는 방법이다. 왜 페이크를 쓰는지는 [페이크 vs 목](/develop-wiki/knowledge/testing-practice/fake-vs-mock/).

## 문제

- 서비스 테스트를 빠르게 하려고 `InMemoryOrderRepo` 같은 페이크를 만든다. 수백 개 테스트가 그 페이크 위에서 통과한다.
- 그런데 실제 DB 어댑터는 유니크 제약 위반 때 예외를 던지고, 페이크는 조용히 덮어쓴다. 정렬 순서, 없는 키 조회(null vs 예외), 대소문자 비교도 다를 수 있다.
- 테스트는 모두 초록인데 운영에서 깨진다. 페이크가 실제와 달라진 것, 즉 드리프트다. Fowler 도 대역이 실제 서비스와 같은지는 따로 확인해야 한다고 짚는다.

## 해법

Fowler 의 ContractTest 개념(대역이 실제와 여전히 같은 모양·동작인지 실제 쪽에 확인)을 **포트 단위 공유 스위트**로 구현한다.

1. 포트(인터페이스)의 **행동 약속**을 테스트로 쓴다. 특정 구현을 모르는 스위트다.
2. 그 스위트를 구현마다 한 번씩 실행한다: 페이크, 실제 어댑터(테스트 DB·샌드박스).
3. 둘 다 통과해야 페이크를 신뢰한다. 실제 쪽에서 새 동작을 발견하면 스위트에 추가하고 페이크를 고친다.

```ts
// 포트의 행동 약속: 구현을 팩토리로만 받는다
export function orderRepoContract(name: string, make: () => Promise<OrderRepo>) {
  describe(`OrderRepo 계약: ${name}`, () => {
    it('저장한 주문을 id 로 조회한다', async () => {
      const r = await make(); await r.save(order('o1'));
      expect(await r.find('o1')).toEqual(order('o1'));
    });
    it('없는 id 는 undefined 를 돌려준다', async () => {
      expect(await (await make()).find('nope')).toBeUndefined();
    });
    it('같은 id 로 낮은 버전을 저장하면 충돌 오류', async () => {
      const r = await make(); await r.save(order('o1', 2));
      await expect(r.save(order('o1', 1))).rejects.toThrow(VersionConflict);
    });
  });
}

orderRepoContract('InMemory', async () => new InMemoryOrderRepo());
orderRepoContract('Postgres', async () => PostgresOrderRepo.onFreshSchema(testDb));
```

### 무엇을 계약에 넣나

- 성공 경로뿐 아니라 **실패 방식**(예외 타입, 빈 결과 표현)과 **경계 조건**(중복, 없는 키, 정렬, 페이지 경계, 동시 저장 충돌).
- 실제 시스템에서 버그로 만난 동작은 재발 방지로 계약에 추가한다.
- 구현 세부(SQL, 내부 호출)는 넣지 않는다. 계약은 포트의 관찰 가능한 행동만 말한다.

### 외부 서비스 대역일 때

내가 소유하지 않은 외부 API 의 대역은 실제 서비스에 계약을 돌리기 어렵다. Fowler 의 권고는 다음과 같다.
- 실제 서비스(가능하면 테스트 인스턴스)에 대한 계약 테스트를 **일상 빌드가 아니라 외부 서비스의 변화 주기**에 맞춰 돌린다. 하루 한 번 정도로 충분한 경우가 많다고 한다.
- 데이터는 값이 아니라 **형식**을 확인한다.
- 실패해도 빌드를 깨는 게 목적이 아니다. 대역과 영향 받는 코드를 고치고, 서비스 팀과 소통하는 신호로 쓴다.
- 계약 테스트를 서비스 팀과 공유하면 소비자 주도 계약으로 발전한다.

## 언제 쓰나

- 서비스·유스케이스 테스트가 인메모리 페이크 위에서 대량으로 돌아가는 구조(헥사고날 포트가 분리된 코드). [헥사고날](/develop-wiki/knowledge/architecture/hexagonal/).
- 페이크를 팀이 직접 유지하고, 같은 포트의 실제 구현이 따로 있을 때.
- 외부 API 를 대역으로 갈음하는 테스트가 많은 경우.

## 주의·비용

- **페이크도 코드다.** 계약이 없으면 페이크는 시간이 갈수록 실제와 멀어진다. 계약은 그 유지 비용을 지불하는 방식이다.
- 계약이 불완전하면 안심만 준다. 계약에 없는 동작은 여전히 어긋날 수 있다.
- 실제 어댑터 실행에 테스트 DB·컨테이너가 필요해 느리다. 계약 실행은 통합 테스트 단계로 두고, 속도가 중요한 단위 테스트는 페이크만 쓴다. [테스트 피라미드](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/).
- 동시성·트랜잭션·성능 같은 특성은 인메모리 페이크가 재현하기 어렵다. 그 부분은 계약이 아니라 실제 DB 통합 테스트의 몫이다.
- 외부 서비스에 대한 계약 테스트는 비용·요금·속도 제한·불안정성에 걸릴 수 있다. 호출 횟수를 제한하고 불안정성(flaky)을 경계 신호로 취급한다.
- 소비자 주도 계약(Pact)과 목적이 다르다. 후자는 서비스 간 호환성, 이 노트의 방식은 대역의 충실도다.

> 출처 확인 범위: Fowler 의 ContractTest 글과 Mocks Aren't Stubs 는 읽었다(후자는 이전 노트 작성 때 읽은 범위). 공유 스위트를 구현별로 돌리는 구체 코드 구조는 일반적 실무 패턴이며 1차 출처가 이를 직접 규정하지는 않는다.
