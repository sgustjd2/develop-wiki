---
title: 브리지 패턴
aka: [Bridge Pattern, Handle/Body]
category: design-patterns
group: structural
level: intermediate
summary: 서로 독립적으로 변하는 두 축(추상과 구현)을 별도 계층으로 나누고 참조로 잇는 구조 패턴. 상속 조합으로 클래스가 곱절로 늘어나는 것을 막고 구현을 런타임에 바꿀 수 있게 한다.
tags: [gof, oop, composition, structural]
related: [design-patterns/adapter, design-patterns/strategy, design-patterns/abstract-factory, design-patterns/state, principles/composition-over-inheritance, principles/solid]
sources:
  - https://refactoring.guru/design-patterns/bridge
  - https://en.wikipedia.org/wiki/Bridge_pattern
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

알림 기능이 있다. 종류는 일반·긴급, 보낼 채널은 이메일·슬랙이다. 상속으로 풀면 `PlainEmail`, `PlainSlack`, `UrgentEmail`, `UrgentSlack` — 2 × 2 = 4 클래스다. 채널에 SMS 가 추가되면 6개, 알림 종류에 "요약"이 추가되면 9개. **두 축이 곱해지며 클래스가 폭발**하고, 같은 채널 코드가 여러 클래스에 복사된다.

## 해법

축 하나를 **별도 계층으로 떼어 내고**, 남은 계층이 그 객체를 필드로 들고 위임한다.

- **추상(Abstraction)**: 클라이언트가 쓰는 고수준 계층. 정책·규칙을 담는다(알림 종류).
- **구현(Implementation)**: 실제 일을 하는 저수준 계층. 공통 인터페이스로 교체 가능하다(채널).
- 여기서 "추상/구현"은 TypeScript 의 `abstract`/`implements` 를 말하는 것이 아니라 **역할**의 이름이다.

```ts
// 구현(Implementation) 계층: 메시지를 실제로 보내는 채널
interface Channel { send(to: string, body: string): Promise<void> }

class EmailChannel implements Channel {
  async send(to: string, body: string) { console.log(`[email] ${to}: ${body}`); }
}
class SlackChannel implements Channel {
  async send(to: string, body: string) { console.log(`[slack] #${to}: ${body}`); }
}

// 추상(Abstraction) 계층: 무엇을 어떤 규칙으로 보낼지. 채널은 참조로 들고 있다.
abstract class Notification {
  constructor(protected channel: Channel) {}
  abstract notify(to: string, msg: string): Promise<void>;
}

class PlainNotification extends Notification {
  notify(to: string, msg: string) { return this.channel.send(to, msg); }
}

class UrgentNotification extends Notification {
  async notify(to: string, msg: string) {
    for (let i = 1; i <= 3; i++) await this.channel.send(to, `[긴급 ${i}/3] ${msg}`);
  }
}

// 알림 종류 2 × 채널 2 = 4 조합을 서브클래스 4개가 아니라 객체 조합으로 만든다
void new UrgentNotification(new SlackChannel()).notify('ops', 'DB 디스크 90%');
void new PlainNotification(new EmailChannel()).notify('kim@example.com', '주간 리포트');
```

클래스 수가 M × N 에서 M + N 으로 준다. 채널을 추가해도 알림 클래스는 건드리지 않는다.

## 언제 쓰나

- 한 클래스가 **직교하는 두 차원**으로 확장돼야 할 때: 도형 × 렌더러, 리모컨 × 기기, 보고서 형식 × 출력 대상.
- 플랫폼 의존 코드를 분리할 때: UI 추상 × OS 별 구현, 저장소 추상 × DB 드라이버, 도형 × 그리기 API.
- 구현이 하나뿐이어도 헤더에서 내부를 숨기려는 경우: C++ 의 PIMPL(handle class) 관용구가 브리지의 축소판이다.
- 구현을 **런타임에 갈아 끼워야** 할 때 — 필드 하나만 바꾸면 된다.
- 거대한 클래스가 "DB 종류별 분기"처럼 여러 변형을 안에 품고 있을 때 쪼개는 리팩터링 목표로.

## 주의

- **차원이 하나뿐이면 과설계다.** 변하는 축이 정말 둘인지, 앞으로도 독립적으로 변할지 먼저 확인한다. 응집도 높은 클래스를 억지로 쪼개면 읽기만 어려워진다.
- 구현 인터페이스(`Channel`)를 너무 좁게 잡으면 새 구현이 표현할 수 없는 기능이 생기고, 너무 넓게 잡으면 모든 구현이 쓰지도 않는 메서드를 채워야 한다. 구현 인터페이스는 **원시 연산**만, 조합 로직은 추상 쪽에 둔다.
- 특정 추상이 특정 구현과만 동작한다면(예: 긴급 알림은 SMS 만), 그 조합 규칙을 [추상 팩토리](/develop-wiki/knowledge/design-patterns/abstract-factory/)로 감싸 클라이언트에서 숨긴다.
- 간접 호출이 한 단계 늘어난다. 성능보다는 코드 탐색(정의로 이동이 인터페이스에서 끊김) 비용이 더 크다.

## 비교

| | 브리지 | 어댑터 | 전략 | 상태 |
| --- | --- | --- | --- | --- |
| 구조 | 추상이 구현 객체를 참조·위임 | 래퍼가 다른 인터페이스로 변환 | 컨텍스트가 알고리즘 객체를 참조 | 컨텍스트가 상태 객체를 참조 |
| 도입 시점 | **설계 초기**, 두 축을 의도적으로 분리 | **사후**, 이미 있는 맞지 않는 코드를 연결 | 알고리즘 교체가 필요할 때 | 상태별 행동 분기가 커질 때 |
| 핵심 의도 | 두 계층이 독립적으로 확장 | 호환되지 않는 인터페이스를 맞춤 | 같은 일을 하는 방법을 교체 | 상태 전이에 따라 행동 교체 |
| 양쪽 모두 계층인가 | 예(추상도 서브클래스를 가짐) | 아니오 | 보통 컨텍스트는 하나 | 보통 컨텍스트는 하나 |

[전략](/develop-wiki/knowledge/design-patterns/strategy/)과 코드 모양이 거의 같다. 차이는 의도다. 전략은 "컨텍스트 하나 + 갈아 끼우는 알고리즘", 브리지는 "**양쪽 모두** 독립적으로 자라는 두 계층"이다. 둘 다 [상속보다 합성](/develop-wiki/knowledge/principles/composition-over-inheritance/)을 적용한 결과다.
