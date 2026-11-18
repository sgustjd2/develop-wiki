---
title: 페이크 vs 목 (상태 검증과 행위 검증)
aka: [Fake vs Mock, Classical vs Mockist, Detroit vs London, State Verification, Behavior Verification, Mocks Aren't Stubs]
category: testing-practice
level: intermediate
summary: 협력 객체를 진짜처럼 동작하는 페이크로 대체해 결과 상태를 볼지, 목으로 호출 기대를 검증할지 고르는 기준과 각각의 결합도 비용.
tags: [testing, fake, mock, tdd, state-verification, behavior-verification, refactoring]
related: [testing-practice/test-doubles, testing-practice/test-pyramid-trophy, testing-practice/tdd, testing-practice/contract-testing, architecture/hexagonal, design-patterns/repository-unit-of-work]
sources:
  - https://martinfowler.com/articles/mocksArentStubs.html
updatedAt: 2026-11-19
---

다섯 종류의 정의는 [테스트 더블](/develop-wiki/knowledge/testing-practice/test-doubles/)에 있다. 이 노트는 그중 가장 자주 갈리는 **페이크 대 목** 선택만 다룬다.

## 문제

같은 로직을 테스트해도 두 방식의 결과가 다르다.

```ts
// A. 페이크 + 상태 검증: 결과를 본다
const repo = new InMemoryOrderRepo();
await new PlaceOrder(repo, new FakePayment()).run(cmd);
expect((await repo.find(cmd.id))?.status).toBe('PAID');

// B. 목 + 행위 검증: 호출을 본다
const repo = mock<OrderRepo>(); const pay = mock<Payment>();
await new PlaceOrder(repo, pay).run(cmd);
expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'PAID' }));
expect(pay.charge).toHaveBeenCalledTimes(1);
```

둘 다 통과하는 코드가 리팩터링 후에는 B 만 깨지는 일이 흔하다. 어느 쪽이 맞는지 기준이 없으면 팀 안에서 테스트 스타일이 섞인다.

## 해법: 무엇을 검증하고 싶은가로 고른다

Fowler 의 구분을 따른다.

- **상태 검증**: 실행 후 대상과 협력자의 상태를 본다. 페이크·스텁과 쓰인다.
- **행위 검증**: 대상이 협력자를 기대한 대로 불렀는지 본다. 목은 항상 이 방식이다.
- **고전(디트로이트) 스타일**: 가능하면 진짜 객체를 쓰고, 어렵거나 느릴 때만 더블을 쓴다. 도메인 모델부터 안쪽에서 바깥으로 개발하는 경향.
- **목 중심(런던) 스타일**: 의미 있는 협력자는 목으로 두고, 기대를 먼저 쓰며 바깥에서 안쪽으로 개발하는 경향.

| 기준 | 페이크(상태) | 목(행위) |
| --- | --- | --- |
| 리팩터링 내성 | 높음. 내부 호출 순서가 바뀌어도 통과 | 낮음. 대상과 협력자 대화를 고정 |
| 실패 위치 | 여러 테스트가 같이 깨질 수 있음 | 깨진 객체에 국한되는 경향 |
| 준비 비용 | 페이크 구현·유지 필요 | 테스트마다 기대 설정 |
| 설계 압력 | 약함 | 역할 인터페이스·"묻지 말고 시켜라" 설계를 유도 |
| 위험 | 페이크가 실제와 어긋남 | 기대가 틀려도 통과해 실제 오류를 가림 |

Fowler 도 어느 한쪽이 우월하다고 결론 내리지 않고, 목 테스트는 구현 방식이 바뀌면 결과가 같아도 깨질 수 있다는 점을 대가로 짚는다.

### 실무 기준

1. **결과가 저장·반환되는 값이면 페이크 + 상태 검증.** 리포지토리, 인메모리 큐, 시계.
2. **결과가 "밖으로 나가는 호출" 자체면 스파이 또는 목.** 메일 발송 1회, 결제 요청의 금액.
3. 호출 횟수·순서를 단언하는 것은 요구 사항일 때만. 그렇지 않으면 구현 세부 고정이다.
4. 소유하지 않은 SDK 는 어댑터를 두고 어댑터를 대체한다. [헥사고날](/develop-wiki/knowledge/architecture/hexagonal/).

## 언제 쓰나

- 페이크: 도메인 규칙이 많고 리팩터링이 잦은 서비스 계층, 저장소가 포트로 분리된 구조.
- 목: 외부 부수효과가 곧 요구 사항인 얇은 조율 코드, 새 협력 관계를 설계하며 쓰는 outside-in TDD.

## 주의·비용

- **페이크도 코드다.** 실제 구현과 동작이 갈라지면 거짓 통과가 생긴다. 같은 계약 테스트를 진짜와 페이크 양쪽에 돌려 일치를 유지한다. [계약 테스트](/develop-wiki/knowledge/testing-practice/contract-testing/).
- 인메모리 페이크는 SQL 제약·트랜잭션·락 동작을 못 잡는다. 저장 계층은 실제 DB 통합 테스트가 따로 필요하다.
- 목이 많은 테스트는 "코드를 그대로 한 번 더 쓴 것"이 되기 쉽다. 단언이 구현 줄 수와 비슷해지면 신호다.
- 고전 스타일은 널리 쓰는 객체의 버그가 여러 테스트를 한꺼번에 깨뜨릴 수 있다(Fowler 가 짚는 단점).
- 팀 안에서 스타일을 하나로 맞추지 않으면 테스트 가독성이 떨어진다. 위 기준을 합의 문서로 남긴다. [테스트 피라미드](/develop-wiki/knowledge/testing-practice/test-pyramid-trophy/)와 함께 본다.
