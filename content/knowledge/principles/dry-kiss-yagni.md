---
title: DRY · KISS · YAGNI
aka: [Don't Repeat Yourself, Keep It Simple Stupid, You Aren't Gonna Need It]
category: principles
level: beginner
summary: 지식은 한곳에만 둔다(DRY), 단순하게 만든다(KISS), 지금 필요 없는 기능은 만들지 않는다(YAGNI)는 세 가지 경험칙.
tags: [design, simplicity, refactoring]
related: [principles/solid, principles/coupling-and-cohesion, principles/composition-over-inheritance]
sources:
  - https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
  - https://en.wikipedia.org/wiki/KISS_principle
  - https://martinfowler.com/bliki/Yagni.html
updatedAt: 2026-11-18
---

세 원칙은 모두 "코드를 바꾸기 쉽게 유지하라"는 같은 목표를 다른 방향에서 본다. 서로 충돌할 때가 있어 함께 알아 두는 편이 좋다.

| 원칙 | 출처 | 핵심 | 위반 신호 |
| --- | --- | --- | --- |
| **DRY** | Hunt & Thomas, *The Pragmatic Programmer* (1999) | 하나의 지식(규칙·결정)은 시스템 안에 권위 있는 표현을 하나만 가진다 | 할인율 규칙을 바꾸려면 API·배치·프론트 세 곳을 고쳐야 함 |
| **KISS** | 1960년대 미 해군·Lockheed Skunk Works(Kelly Johnson) | 단순함을 설계 목표로 삼는다. 고장 났을 때 평범한 사람도 고칠 수 있어야 한다 | 설정 하나 바꾸는 데 제네릭 3단, 팩토리 2개를 거침 |
| **YAGNI** | XP(Extreme Programming), C3 프로젝트의 Kent Beck | 미래에 필요할 "것 같은" 기능은 실제로 필요해질 때 만든다 | "나중에 멀티 테넌트 될 수도 있으니" 지금 테넌트 추상화를 넣음 |

## 문제

- **중복**: 같은 규칙이 여러 곳에 복사되면, 한 곳만 고쳐져 동작이 갈라진다.
- **과설계**: 아직 없는 요구를 대비한 추상화가 쌓이면, 실제 요구가 왔을 때 오히려 고치기 어렵다.

## 해법

### DRY — 코드가 아니라 "지식"의 중복을 없앤다

```ts
// 나쁨: 같은 규칙(무료 배송 기준)이 두 군데
const fee1 = total >= 50_000 ? 0 : 3_000;      // 주문 API
const label = total >= 50_000 ? '무료배송' : ''; // 장바구니 UI

// 좋음: 규칙을 한곳에
export const isFreeShipping = (total: number) => total >= 50_000;
```

모양이 비슷한 코드라도 **바뀌는 이유가 다르면** 중복이 아니다. 주문 검증과 회원 검증이 우연히 같은 `if` 를 가졌다면 합치지 않는다.

### KISS — 가장 단순한 동작하는 방법부터

- 표준 라이브러리·언어 기능으로 되면 패턴·프레임워크를 꺼내지 않는다.
- 읽는 사람이 한 번에 따라갈 수 있는 흐름을 우선한다.

### YAGNI — 추정 기능(presumptive feature)을 만들지 않는다

Fowler 는 미리 만든 기능의 비용을 네 가지로 나눈다.

| 비용 | 내용 |
| --- | --- |
| 구축 비용 | 쓰이지 않을 수 있는 기능을 분석·구현·테스트하는 노력 |
| 지연 비용 | 그 시간에 더 가치 있는 기능을 늦게 내보낸 손해 |
| 유지 비용 | 남은 코드가 다른 모든 변경·디버깅을 느리게 함 |
| 수리 비용 | 잘못 이해한 채 만든 기능을 고치거나 우회하는 비용 |

## 언제 쓰나

- 리뷰에서 "이 추상화가 지금 필요한가?"(YAGNI·KISS), "이 규칙이 다른 곳에도 있나?"(DRY)를 묻는 기준으로 쓴다.
- 리팩터링 대상 고르기: 같은 버그를 여러 곳에서 고친 적이 있다면 DRY 위반이다.

## 주의

- **성급한 DRY**는 잘못된 추상화를 만든다. 우연히 닮은 코드를 합치면, 나중에 갈라질 때 플래그 인자가 늘어난다. "잘못된 추상화보다 중복이 낫다"(Sandi Metz), "세 번째 반복 때 추출한다"(rule of three) 같은 경험칙이 있다.
- **YAGNI 는 대충 만들라는 뜻이 아니다.** 리팩터링, 자동 테스트, 지속적 배포처럼 코드를 바꾸기 쉽게 하는 노력은 YAGNI 대상이 아니며, 오히려 YAGNI 가 성립하기 위한 전제다.
- **되돌리기 어려운 결정**(공개 API 형태, 데이터 스키마, 보안)은 YAGNI 로 미루면 나중 비용이 크다. 추가 복잡도가 거의 없는 미래 대비는 해도 된다.
- KISS 의 "단순함"은 사람마다 다르다. 줄 수가 적은 것과 이해하기 쉬운 것은 다르다.
