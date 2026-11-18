---
title: 테스트 주도 개발 (TDD)
aka: [Test-Driven Development, TDD, Red-Green-Refactor, 테스트 우선 개발]
category: testing-practice
level: intermediate
summary: 실패하는 테스트를 먼저 쓰고, 통과할 만큼만 구현한 뒤, 리팩터링하는 짧은 주기를 반복해 설계와 회귀 테스트를 함께 키우는 개발 방식.
tags: [testing, tdd, xp, refactoring, design]
related: [testing-practice/test-doubles, testing-practice/test-pyramid-trophy, testing-practice/property-based-testing, principles/dry-kiss-yagni, principles/solid]
sources:
  - https://martinfowler.com/bliki/TestDrivenDevelopment.html
  - https://martinfowler.com/articles/practical-test-pyramid.html
updatedAt: 2026-11-18
---

Kent Beck 이 1990년대 후반 익스트림 프로그래밍(XP)의 실천법으로 정리했다.

## 문제

구현을 다 짜고 나서 테스트를 쓰면 세 가지가 생긴다.

- 테스트하기 어려운 구조가 이미 굳어 있다(숨은 의존성, 거대한 함수).
- 이미 동작한다고 믿는 코드에 대해 테스트를 "통과하도록" 쓰게 되어 빈틈을 못 본다.
- 바쁘면 테스트를 건너뛴다.

## 해법: 레드 → 그린 → 리팩터

0. 만들 동작의 **테스트 목록**을 적는다. 어떤 것부터 할지 고르는 게 실력이다.
1. **레드**: 목록에서 하나 골라 실패하는 테스트를 쓴다. 실패 이유가 예상과 같은지 확인한다.
2. **그린**: 그 테스트를 통과시킬 **최소한**의 코드를 쓴다.
3. **리팩터**: 테스트가 초록인 상태에서 새 코드와 기존 코드를 정리한다.

```ts
// 1) 레드
test('연속 3회 실패하면 계정을 잠근다', () => {
  const acc = new Account();
  acc.failLogin(); acc.failLogin(); acc.failLogin();
  expect(acc.locked).toBe(true);
});

// 2) 그린: 최소 구현
class Account {
  private failures = 0;
  locked = false;
  failLogin() { if (++this.failures >= 3) this.locked = true; }
}

// 3) 다음 테스트: "성공하면 실패 횟수를 초기화한다" → 레드 → 그린 → 리팩터
```

주기는 짧을수록 좋다(분 단위). 막히면 더 작은 단계로 쪼갠다.

## 얻는 것

- 테스트 가능한 설계가 자연스럽게 나온다. 테스트를 먼저 쓰려면 의존성을 인자로 받게 되기 때문이다.
- 회귀 테스트가 부산물로 쌓인다.
- 지금 필요한 것만 만든다([YAGNI](/develop-wiki/knowledge/principles/dry-kiss-yagni/)).

## 두 갈래

| | 고전파(디트로이트) | 목 중심(런던) |
| --- | --- | --- |
| 출발 | 안쪽 도메인부터 | 바깥 인수 테스트부터 안으로 |
| 협력 객체 | 진짜를 쓰고, 외부 I/O 만 대체 | 아직 없는 협력 객체를 목으로 두고 인터페이스를 발견 |
| 장점 | 리팩터링에 강함 | 역할·인터페이스 설계가 빨리 드러남 |
| 위험 | 큰 설계가 늦게 보임 | 테스트가 구현에 묶이기 쉬움 |

## 언제 쓰나

- 규칙이 분명한 도메인 로직(계산, 검증, 상태 전이), 버그 수정(먼저 재현 테스트).
- 요구가 자주 바뀌어 안전한 리팩터링이 중요한 코드.

## 주의 (비용)

- **리팩터 단계를 건너뛰는 것**이 Fowler 가 꼽는 가장 흔한 실수다. 그러면 테스트는 있어도 코드가 조각난다.
- 탐색 중인 코드(프로토타입, UI 배치, 처음 써 보는 라이브러리)에는 잘 안 맞는다. 스파이크로 배우고 버린 뒤 TDD 로 다시 짓는다.
- 구현 세부를 고정하는 테스트를 쓰면 TDD 가 오히려 변경을 막는다. 공개 동작을 테스트한다.
- 100% 커버리지는 목표가 아니다. 자명한 getter/setter 까지 테스트하지 않는다.
- TDD 는 설계 실력을 대신하지 않는다. 테스트가 통과해도 경계·이름·책임이 엉망일 수 있다.
