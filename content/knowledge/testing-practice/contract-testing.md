---
title: 계약 테스트 (소비자 주도 계약)
aka: [Contract Testing, Consumer-Driven Contracts, CDC, Pact]
category: testing-practice
level: intermediate
summary: 서비스 사이의 요청·응답 약속을 계약으로 기록하고 소비자와 제공자를 각각 따로 검증해, 전체를 띄우는 E2E 없이 API 호환성을 확인하는 방법.
tags: [testing, microservices, api, pact, contract]
related: [testing-practice/test-pyramid-trophy, testing-practice/test-doubles, testing-practice/flaky-e2e-tests, architecture/event-driven, design-patterns/adapter]
sources:
  - https://martinfowler.com/bliki/ContractTest.html
  - https://martinfowler.com/articles/practical-test-pyramid.html
  - https://docs.pact.io/
  - https://docs.pact.io/getting_started/what_is_pact_good_for
updatedAt: 2026-11-18
---

## 문제

서비스 A 가 서비스 B 의 API 를 부른다. A 의 테스트는 B 를 스텁으로 대체하고, B 의 테스트는 자기 API 만 본다. 둘 다 통과하는데, B 가 응답 필드 이름을 바꾸면 운영에서 A 가 깨진다. 이를 잡으려고 모든 서비스를 띄운 E2E 환경을 만들면 느리고, 불안정하고, 팀끼리 서로를 기다린다.

## 해법

| 용어 | 의미 |
| --- | --- |
| 계약(contract) | "이 요청을 보내면 이런 모양의 응답을 기대한다"는 예시 모음 |
| 소비자(consumer) | API 를 부르는 쪽. 계약을 만든다 |
| 제공자(provider) | API 를 제공하는 쪽. 계약을 검증한다 |

**소비자 주도 계약(CDC)** 흐름:

1. 소비자 테스트가 모의 제공자를 상대로 실행되며, 실제로 쓴 요청·기대 응답을 계약 파일로 기록한다.
2. 계약 파일을 공유 저장소(Pact Broker 등)에 올린다.
3. 제공자 CI 가 실제 제공자 앱에 계약의 요청을 재생하고 응답이 맞는지 검증한다.
4. 배포 전, 이 버전 조합이 서로 검증됐는지 확인한다(Pact 의 `can-i-deploy`).

```ts
// 소비자 쪽 (Pact JS 스타일, 개념 예시)
provider
  .given('주문 42가 존재')
  .uponReceiving('주문 조회')
  .withRequest({ method: 'GET', path: '/orders/42' })
  .willRespondWith({
    status: 200,
    body: { id: like('42'), status: like('PAID'), total: integer(12000) },
  });

await provider.executeTest(async (mock) => {
  const order = await new OrderClient(mock.url).get('42');
  expect(order.status).toBe('PAID');   // 소비자가 실제로 쓰는 필드만 계약에 들어간다
});
```

소비자가 **실제로 쓰는 필드만** 계약에 넣는 것이 핵심이다. 그래야 제공자는 아무도 안 쓰는 필드를 자유롭게 바꿀 수 있고, 누가 무엇을 쓰는지 알 수 있다.

## 두 가지 의미

- **CDC(Pact 류)**: 내가 만든 소비자-제공자 쌍 사이의 호환성 검증. 배포 파이프라인 안에서 돈다.
- **Fowler 의 ContractTest(2011)**: 내가 통제하지 못하는 외부 서비스에 대해, 내 테스트 더블이 실제와 여전히 같은지 주기적으로(예: 하루 한 번) 확인. 실패해도 빌드를 깨기보다는 더블을 고치는 작업과 상대 팀과의 대화를 시작하는 신호로 쓴다.

## 언제 쓰나

Pact 문서가 꼽는 적합한 조건:
- 소비자와 제공자를 **둘 다 우리가 통제**하고 둘 다 개발 중일 때.
- 제공자당 소비자 수가 관리할 만하고, 소비자 요구가 제공자 기능을 이끌 때.
- 제공자 팀이 테스트용 데이터 상태(`given`)를 만들 수 있을 때.
- 메시지 기반(이벤트) 통합에도 쓸 수 있다.

## 주의 (비용)

- **공개 API 에는 안 맞는다.** 소비자를 알 수 없다. 이때는 OpenAPI 스키마 검증, 하위 호환 규칙, 버저닝으로 관리한다.
- 계약 테스트는 **형식과 내용**을 확인하지 동작을 확인하지 않는다. "결제가 실제로 승인되는가"는 제공자 쪽 기능 테스트 몫이다.
- 응답 바디만 보므로, BFF 처럼 하위 시스템에 부수효과를 넘기는 API 는 그 부수효과를 검증하지 못한다.
- 브로커 운영, 제공자 상태 핸들러 작성, 팀 간 합의라는 조직 비용이 든다. 팀 사이 소통이 약하면 효과가 떨어진다.
- 성능·부하 테스트 도구가 아니다.
