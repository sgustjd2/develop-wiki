---
title: 시간·난수 대역 (Clock 페이크, 시드 고정 난수)
aka: [Fake Clock, Injectable Clock, Frozen Time, Seeded Random, Non-determinism in Tests, 시계 주입]
category: testing-practice
level: intermediate
summary: 현재 시각과 난수를 코드가 직접 부르지 않고 주입받는 포트로 바꿔, 만료·재시도·타임아웃 같은 시간 의존 동작을 빠르고 재현 가능하게 검증하는 방법.
tags: [testing, clock, time, random, fake, flaky, determinism]
related: [testing-practice/test-doubles, testing-practice/fake-vs-mock, testing-practice/flaky-e2e-tests, testing-practice/property-based-testing, testing-practice/tdd, architecture/hexagonal, principles/dependency-inversion-composition-root]
sources:
  - https://martinfowler.com/articles/nonDeterminism.html
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html
  - https://nodejs.org/api/test.html
updatedAt: 2026-11-19
---

[테스트 더블](/develop-wiki/knowledge/testing-practice/test-doubles/)에서 시계와 난수를 대역이 필요한 의존성으로 소개했다. 이 노트는 그 둘만 파고든다. 어떤 모양의 대역을 만들고, 어디까지 가짜로 바꾸고, 무엇이 남는가.

## 문제

- 쿠폰 만료, 토큰 갱신, 재시도 간격 같은 규칙은 **시간이 지나야** 검증된다. 실제로 기다리면 테스트가 느리고, `sleep` 으로 맞추면 간헐적으로 실패한다.
- 시스템 시계를 직접 부르면 호출할 때마다 값이 달라 결과가 달라진다(Fowler). 자정 직전·월말·연말에만 깨지는 테스트가 생긴다.
- 난수로 만든 ID·토큰·지연 시간은 테스트에서 값을 맞출 수 없고, 충돌 같은 희귀 경로는 실행해도 재현되지 않는다.

## 해법

### 1. 시계를 포트로

현재 시각을 얻는 일을 인터페이스 하나로 감싸 주입한다. Java 의 `Clock` 문서도 현재 시각이 필요한 곳에 `Clock` 을 넘기고 `LocalDate.now()` 같은 정적 호출을 피하라고 권한다. 테스트용으로는 항상 같은 순간을 돌려주는 `fixed` 와, 다른 시계를 일정 간격만큼 밀어 과거·미래를 흉내 내는 `offset` 이 제공된다.

```ts
interface Clock { now(): Date; }

class FakeClock implements Clock {
  private t: Date;
  constructor(t: Date) { this.t = t; }
  now() { return new Date(this.t); }               // 복사본을 돌려줘 외부 변경을 막는다
  advance(ms: number) { this.t = new Date(this.t.getTime() + ms); }
}

class Coupon {
  private clock: Clock; private ttlMs: number; private issuedAt: Date;
  constructor(clock: Clock, ttlMs: number) { this.clock = clock; this.ttlMs = ttlMs; this.issuedAt = clock.now(); }
  isValid() { return this.clock.now().getTime() - this.issuedAt.getTime() < this.ttlMs; }
}

test('만료 경계: 시계를 앞당겨 확인', () => {
  const c = new FakeClock(new Date('2026-11-19T00:00:00Z')); const k = new Coupon(c, 1000);
  assert.equal(k.isValid(), true);
  c.advance(999); assert.equal(k.isValid(), true);   // 1ms 전
  c.advance(1);   assert.equal(k.isValid(), false);  // 정확히 경계
});
```

- 운영 코드의 `SystemClock` 은 `new Date()` 를 감싸는 한 줄이다. 조립 지점(composition root)에서만 만든다.
- **경계값**을 직접 맞출 수 있다는 점이 가장 큰 이득이다. 위 테스트는 1ms 전과 경계 시점을 즉시 검증한다.
- 위 코드와 아래 타이머·난수 코드를 Node 24(`node:test`)에서 실행해 모두 통과함을 확인했다.

### 2. 타이머(`setTimeout`)는 다른 문제

`Clock` 은 "지금이 언제인가"만 답한다. `setTimeout`·`setInterval` 로 **기다렸다가 실행**하는 코드(세션 타임아웃, 디바운스, 폴링)는 따로 가짜 타이머가 필요하다. Node 의 테스트 러너는 `mock.timers` 로 `setTimeout` 과 `Date` 를 가짜로 바꾸고 `tick()` 으로 시간을 앞당긴다. 문서에 따르면 `Date` 와 타이머를 함께 모킹하면 하나의 내부 시계를 공유해 `tick()` 이 `Date.now()` 도 같이 진행시키고, 시작 시각은 `now` 옵션으로 정한다.

```ts
test('세션 5분 타임아웃', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: new Date('2026-11-19T00:00:00Z') });
  let expired = false; setTimeout(() => { expired = true; }, 5 * 60 * 1000);
  t.mock.timers.tick(5 * 60 * 1000 - 1); assert.equal(expired, false);
  t.mock.timers.tick(1); assert.equal(expired, true);
});
```

문서의 주의: `import { setTimeout } from 'node:timers'` 처럼 구조 분해로 가져온 함수는 이 방식으로 바뀌지 않는다. `setTime()` 은 과거로 지나간 타이머를 실행하지 않으므로 이어서 `tick(0)` 이 필요하다. 다른 러너(Jest·Vitest 의 fake timers)는 API 가 달라 해당 문서를 따로 본다.

### 3. 난수

- **값을 고정하는 스텁**: `() => 0.5` 를 주입하면 "ID 충돌" 같은 희귀 경로를 만든다. Fowler 는 난수기를 항상 같은 값을 돌려주도록 대체해 파일 이름 충돌 같은 버그를 드러내는 예를 든다.
- **시드 고정 난수기**: 같은 시드면 같은 수열이 나와 실패를 재현할 수 있다.
- 난수 입력으로 경계를 탐색하는 테스트는 회귀 테스트와 **목적이 달라 분리**하라는 것이 Fowler 의 조언이다. 탐색용은 [속성 기반 테스트](/develop-wiki/knowledge/testing-practice/property-based-testing/)로 두고, 실패한 시드를 기록해 회귀 테스트로 승격한다.

```ts
type Rng = () => number;
const newId = (rng: Rng) => Math.floor(rng() * 1000).toString(36).padStart(3, '0');

test('항상 같은 값이면 충돌이 드러난다', () => {
  assert.equal(new Set([newId(() => 0.5), newId(() => 0.5)]).size, 1);   // 충돌 처리 경로를 강제
});
test('시드 고정이면 재현 가능', () => {
  const mk = (s: number): Rng => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  assert.equal(newId(mk(42)), newId(mk(42)));
});
```

### 4. 직접 호출을 막는 장치

Fowler 는 코드에서 시스템 시계를 직접 부르는 곳을 검색해, 발견되면 빌드를 실패시키라고 제안한다. 린트 규칙(`new Date()`, `Date.now()`, `Math.random()` 금지, 단 `SystemClock` 파일 예외)으로 구현할 수 있다. 시계를 주입했다고 안심해도 누군가 한 곳에서 `Date.now()` 를 부르면 그 테스트가 다시 불안정해진다.

## 언제 쓰나

- 만료·유효 기간·재시도 백오프·세션 타임아웃·캐시 TTL·배치 스케줄처럼 **시간으로 규칙이 정해지는** 로직.
- ID·토큰·샘플링·지터(jitter)처럼 난수가 결과에 들어가는 로직.
- 테스트 데이터가 날짜에 묶여 "작년에 쓴 고정 날짜가 만료돼 깨지는" 문제를 겪을 때. Fowler 는 데이터가 낡으면 데이터와 시계 시드를 같이 옮기고 그 변경만 하라고 한다.

## 주의·비용

- **시간의 종류를 구분**한다. 달력 시각(벽시계)은 사용자에게 보이는 날짜·만료에 쓰고, 경과 시간 측정에는 단조 시계(monotonic)를 쓴다. 벽시계는 NTP 보정·윤초·사용자 변경으로 뒤로 갈 수 있다. Java `Clock` 문서는 `Clock` 이 실제 현재 시각을 보장하지 않고 통제된 관점을 제공할 뿐이라고 설명하며 단조성은 다루지 않는다. 경과 시간용 포트는 별도로 두는 편이 안전하다(이 구분은 설계 권고).
- 고정 시계는 시간이 흐르지 않는다. 같은 시각을 가정하는 코드(예: 타임스탬프가 단조 증가한다는 가정)는 고정 시계에서 통과하고 운영에서 깨질 수 있다. 진행하는 `FakeClock` 과 구분해 쓴다.
- 시간대·서머타임·월말은 가짜 시계로도 별도 테스트 항목이다. 시간대 값도 주입한다(Java 문서가 `Clock` 에 시간대가 포함된다고 설명).
- 가짜 타이머는 비동기 코드와 섞이면 한 번의 `tick` 이 만든 마이크로태스크를 못 기다릴 수 있다. 러너별 동작을 문서로 확인한다.
- 가짜 시계가 있다고 **실제 시스템 시계 동작**(NTP 점프, 절전 복귀)까지 검증되는 것은 아니다. 그 부분은 소수의 통합 테스트나 운영 관측이 맡는다.
- 포트가 늘면 생성자 인자가 늘어난다. 시계를 도메인 이벤트의 입력(커맨드에 시각 포함)으로 받는 설계가 더 단순한 경우도 있다.
- 난수의 암호학적 용도(토큰·키)는 CSPRNG 를 써야 하며 테스트에서 고정하는 것은 **테스트 경계 안에서만** 한다. 운영 조립 지점에서 고정 난수기가 주입되지 않도록 한다.

> 출처 확인 범위: Fowler 의 비결정성 글, Java `Clock` 클래스 문서, Node.js 테스트 러너 문서 중 모킹 개요(페이지 앞 100,000자; `MockTimers` 클래스 상세와 `setInterval` 지원 여부는 읽지 못함)를 읽었다. 단조 시계와 벽시계의 구분, 린트 규칙 구현, 운영 조립 지점 고정 난수기 방지는 일반 실무 권고이며 위 자료가 직접 규정하지는 않는다.
