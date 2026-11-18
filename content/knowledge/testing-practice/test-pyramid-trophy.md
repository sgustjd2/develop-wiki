---
title: 테스트 피라미드와 테스트 트로피
aka: [Test Pyramid, Testing Trophy, Practical Test Pyramid, 테스트 포트폴리오]
category: testing-practice
level: beginner
summary: 테스트를 범위(단위·통합·E2E)별로 몇 개씩 둘지 정하는 두 가지 모델과, 둘이 공통으로 말하는 "싸고 빠른 테스트로 최대한 많이 확신하라"는 원칙.
tags: [testing, unit-test, integration-test, e2e, strategy]
related: [testing-practice/test-doubles, testing-practice/tdd, testing-practice/contract-testing, testing-practice/flaky-e2e-tests, architecture/hexagonal]
sources:
  - https://martinfowler.com/articles/practical-test-pyramid.html
  - https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
updatedAt: 2026-11-18
---

## 문제

테스트를 어디에 얼마나 쓸지 정하지 않으면 두 극단 중 하나로 흐른다.

- **아이스크림 콘**: 수동 테스트와 브라우저 E2E 가 대부분. 느리고, 자주 깨지고, 실패 원인을 찾기 어렵다.
- **목(mock) 범벅 단위 테스트**: 수천 개가 통과하는데 실제로 조립하면 안 돌아간다.

## 테스트 피라미드

Mike Cohn 이 *Succeeding with Agile* 에서 제시했다(원래 층은 단위·서비스·UI). Ham Vocke 가 martinfowler.com 의 *The Practical Test Pyramid*(2018)에서 현대적으로 풀었다. 층 이름보다 두 가지 원칙이 중요하다.

1. **세분도가 다른 테스트를 함께 쓴다.**
2. **위로 갈수록(범위가 넓을수록) 개수를 줄인다.**

```
        /\        E2E: 핵심 사용자 여정 몇 개
       /  \       
      /----\      통합·계약: 외부 경계(DB, HTTP, 큐)마다
     /      \     
    /--------\    단위: 도메인 로직, 많고 빠르게
```

## 테스트 트로피

Kent C. Dodds 가 2018년에 제시한 모양. 아래부터 **정적 분석 → 단위 → 통합(가장 두꺼움) → E2E**. 핵심 문장은 "테스트가 소프트웨어 사용 방식과 닮을수록 더 큰 확신을 준다". 프런트엔드처럼 단위로 쪼갠 컴포넌트를 목으로 감싸면 의미가 적은 환경에서 나왔다.

## 비교

| | 피라미드 | 트로피 |
| --- | --- | --- |
| 가장 많은 층 | 단위 | 통합 |
| 맨 아래 | 단위 테스트 | 정적 분석(타입, 린트) |
| 잘 맞는 곳 | 도메인 로직이 두꺼운 백엔드 | UI, 조립이 중요한 앱 |
| 공통점 | 비용 대비 확신을 최대로. E2E 는 적게. 범위가 겹치는 중복 테스트는 지운다 | |

사실 둘의 차이는 "단위"의 정의 차이가 크다. Vocke 는 협력 객체를 진짜로 쓰는 **사교적(sociable)** 단위 테스트도 허용하는데, 이것은 트로피의 "통합"과 거의 같다.

## 해법: 포트폴리오 짜는 법

- 도메인 규칙(계산, 상태 전이) → 단위 테스트. 빠르고 실패 위치가 명확하다.
- 직렬화·SQL·외부 API 같은 **경계마다** 통합 테스트 한 묶음. 실제 DB(컨테이너)를 쓴다.
- 서비스 간 API → [계약 테스트](/develop-wiki/knowledge/testing-practice/contract-testing/)로 E2E 를 대신한다.
- E2E 는 돈이 오가는 흐름, 로그인 같은 핵심 여정만.
- 상위 테스트가 잡은 버그를 하위 테스트가 못 잡았다면, **하위 테스트를 추가**한다(Vocke 의 규칙). 테스트는 가능한 한 아래로 내린다.

```ts
// 사교적 단위 테스트: 진짜 협력 객체, 외부 I/O 만 대체
test('쿠폰과 등급 할인이 함께 적용된다', () => {
  const pricing = new Pricing(new CouponPolicy(), new TierPolicy());
  expect(pricing.total(cart({ items: [10_000, 5_000] }), { coupon: 'WELCOME10', tier: 'GOLD' }))
    .toBe(12_825);
});
```

## 언제 쓰나

- 새 프로젝트의 테스트 전략을 정할 때, CI 시간이 길어지거나 실패가 잦아 원인을 볼 때.
- 모양 자체를 지키는 것이 목표가 아니다. "이 버그는 어느 층에서 가장 싸게 잡히나?"를 묻는 도구로 쓴다.

## 주의 (비용)

- 층 이름은 팀마다 뜻이 다르다. "통합 테스트"가 DB 를 붙인 테스트인지, 서비스 여러 개를 띄운 테스트인지 먼저 합의한다.
- 커버리지 숫자를 목표로 삼으면 의미 없는 테스트가 는다.
- 구현 세부(비공개 메서드, 호출 순서)를 검사하는 테스트는 리팩터링을 막는다. 공개 동작을 검사한다.
- 모든 테스트에는 작성·실행·유지 비용이 있다. 같은 것을 여러 층에서 반복 검사하면 지운다.
- E2E 를 줄이는 대신 계약·통합 테스트가 그 빈자리를 실제로 덮는지 확인한다.
