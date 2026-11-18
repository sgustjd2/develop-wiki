---
title: SOLID 원칙
aka: [SOLID]
category: principles
level: beginner
summary: 변경에 강한 객체지향 설계를 위한 다섯 가지 원칙(SRP, OCP, LSP, ISP, DIP).
tags: [oop, design]
related: [design-patterns/strategy, architecture/hexagonal]
sources:
  - https://en.wikipedia.org/wiki/SOLID
updatedAt: 2026-11-18
---

| 원칙 | 한 줄 요약 | 위반 신호 |
| --- | --- | --- |
| **S**RP 단일 책임 | 모듈은 한 가지 변경 이유만 가진다 | 서로 다른 팀의 요구로 같은 클래스가 자주 바뀜 |
| **O**CP 개방-폐쇄 | 확장에는 열리고 수정에는 닫힌다 | 새 케이스마다 기존 `switch` 를 고침 |
| **L**SP 리스코프 치환 | 하위 타입은 상위 타입 자리에 그대로 들어가야 한다 | 하위 클래스에서 `throw new Error('not supported')` |
| **I**SP 인터페이스 분리 | 쓰지 않는 메서드에 의존하지 않는다 | 빈 구현(no-op) 메서드가 많음 |
| **D**IP 의존 역전 | 상위 정책은 하위 구현이 아닌 추상에 의존한다 | 도메인 코드가 DB 드라이버를 직접 import |

## 실무 팁

- 원칙은 **변경 비용을 낮추기 위한 수단**이다. 변경 가능성이 낮은 곳까지 추상화하면 오히려 복잡도만 늘어난다.
- DIP 를 시스템 수준으로 확장한 것이 헥사고날·클린 아키텍처다.
