---
title: GoF 23 패턴 한눈에 보기
aka: [GoF Design Patterns Overview, Gang of Four Patterns, 디자인 패턴 목록, 패턴 치트시트]
category: design-patterns
level: beginner
summary: GoF 책의 생성 5·구조 7·행위 11 패턴을 한 표로 정리하고, 헷갈리는 쌍의 구분법과 고르는 순서를 안내하는 비교 노트. 각 행은 개별 노트로 연결된다.
tags: [gof, overview, cheatsheet, comparison, oop]
related: [design-patterns/singleton, design-patterns/factory-method, design-patterns/abstract-factory, design-patterns/builder, design-patterns/prototype, design-patterns/adapter, design-patterns/bridge, design-patterns/composite, design-patterns/decorator, design-patterns/facade, design-patterns/flyweight, design-patterns/proxy, design-patterns/chain-of-responsibility, design-patterns/command, design-patterns/interpreter, design-patterns/iterator, design-patterns/mediator, design-patterns/memento, design-patterns/observer, design-patterns/state, design-patterns/strategy, design-patterns/template-method, design-patterns/visitor, principles/composition-over-inheritance, principles/solid]
sources:
  - https://en.wikipedia.org/wiki/Design_Patterns
  - https://refactoring.guru/design-patterns/catalog
updatedAt: 2026-11-19
---

> 이 노트는 그룹을 지정하지 않았다. 세 그룹 전체를 가로지르는 비교 노트이기 때문이다(스키마상 `group` 은 선택).

## 배경

Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides("Gang of Four")가 1994년 *Design Patterns: Elements of Reusable Object-Oriented Software* 에 23개 패턴을 정리했다. 책 전체를 관통하는 두 문장은 이렇다(Wikipedia 인용 요약).

- 구현이 아니라 **인터페이스에 맞춰 프로그래밍**한다.
- 클래스 상속보다 **객체 합성**을 선호한다 → [상속보다 합성](/develop-wiki/knowledge/principles/composition-over-inheritance/).

패턴은 목록을 외우는 것이 아니라, "이 문제는 어느 힘이 부딪히는가"를 알아보는 어휘다. 아래 세 그룹은 **무엇을 다루느냐**로 나뉜다. 생성은 객체를 만드는 법, 구조는 객체를 엮는 법, 행위는 객체끼리 책임과 통신을 나누는 법이다.

## 생성 패턴 (5)

| 패턴 | 한 줄 의도 | 쓰는 신호 |
| --- | --- | --- |
| [싱글턴](/develop-wiki/knowledge/design-patterns/singleton/) | 인스턴스를 하나로 제한하고 전역 접근점을 준다 | 정말 하나여야 하는 자원. 대부분은 DI 로 대체 |
| [팩토리 메서드](/develop-wiki/knowledge/design-patterns/factory-method/) | 생성을 서브클래스(또는 메서드)에 맡겨 어떤 클래스를 만들지 늦게 정한다 | `new` 가 구체 클래스에 박혀 있다 |
| [추상 팩토리](/develop-wiki/knowledge/design-patterns/abstract-factory/) | 서로 어울리는 객체군을 구체 클래스 모른 채 한 세트로 만든다 | 테마·플랫폼별로 제품군을 통째로 교체 |
| [빌더](/develop-wiki/knowledge/design-patterns/builder/) | 복잡한 객체를 단계별로 조립하고 표현과 절차를 분리한다 | 선택 인자가 많은 생성자 |
| [프로토타입](/develop-wiki/knowledge/design-patterns/prototype/) | 기존 객체를 복제해 새 객체를 만든다 | 생성이 비싸거나 구체 타입을 모를 때 |

## 구조 패턴 (7)

| 패턴 | 한 줄 의도 | 쓰는 신호 |
| --- | --- | --- |
| [어댑터](/develop-wiki/knowledge/design-patterns/adapter/) | 기존 인터페이스를 기대하는 인터페이스로 바꿔 끼운다 | 외부 라이브러리·레거시와 모양이 안 맞는다 |
| [브리지](/develop-wiki/knowledge/design-patterns/bridge/) | 추상과 구현을 분리해 각자 독립적으로 확장한다 | 클래스가 두 축(예: 도형×렌더러)으로 폭증 |
| [컴포지트](/develop-wiki/knowledge/design-patterns/composite/) | 부분-전체 트리를 같은 인터페이스로 다룬다 | 파일/폴더, UI 트리처럼 재귀 구조 |
| [데코레이터](/develop-wiki/knowledge/design-patterns/decorator/) | 객체에 기능을 겹겹이 덧씌운다 | 기능 조합마다 서브클래스가 필요해질 때 |
| [퍼사드](/develop-wiki/knowledge/design-patterns/facade/) | 복잡한 하위 시스템에 단순한 입구를 제공한다 | 호출자가 내부 클래스 여럿을 알아야 한다 |
| [플라이웨이트](/develop-wiki/knowledge/design-patterns/flyweight/) | 많은 비슷한 객체의 불변 상태를 공유해 메모리를 줄인다 | 측정된 메모리 문제 |
| [프록시](/develop-wiki/knowledge/design-patterns/proxy/) | 같은 인터페이스의 대리 객체로 접근을 제어한다 | 지연 로딩, 접근 제어, 원격 호출, 캐시 |

## 행위 패턴 (11)

| 패턴 | 한 줄 의도 | 쓰는 신호 |
| --- | --- | --- |
| [책임 연쇄](/develop-wiki/knowledge/design-patterns/chain-of-responsibility/) | 요청을 처리할 수 있는 객체를 만날 때까지 사슬로 넘긴다 | 미들웨어·필터, 처리자가 동적으로 바뀜 |
| [커맨드](/develop-wiki/knowledge/design-patterns/command/) | 요청을 객체로 만들어 큐·로그·undo 에 쓴다 | 실행 취소, 작업 큐, 매크로 |
| [인터프리터](/develop-wiki/knowledge/design-patterns/interpreter/) | 작은 언어의 문법을 클래스로 표현해 해석한다 | 단순한 규칙·표현식 DSL |
| [이터레이터](/develop-wiki/knowledge/design-patterns/iterator/) | 내부 구조를 드러내지 않고 요소를 순회한다 | 컬렉션 종류와 무관한 순회 |
| [미디에이터](/develop-wiki/knowledge/design-patterns/mediator/) | 객체 간 직접 통신을 중재자 하나로 모은다 | 다대다 의존이 얽힌 UI·컴포넌트 |
| [메멘토](/develop-wiki/knowledge/design-patterns/memento/) | 캡슐화를 깨지 않고 상태를 저장·복원한다 | undo, 스냅샷 |
| [옵저버](/develop-wiki/knowledge/design-patterns/observer/) | 상태 변화를 구독자에게 자동 통지한다 | 이벤트, 반응형 갱신 |
| [상태](/develop-wiki/knowledge/design-patterns/state/) | 내부 상태에 따라 행동을 바꾸고 상태 객체에 위임한다 | 상태별 `if/switch` 가 여러 메서드에 반복 |
| [전략](/develop-wiki/knowledge/design-patterns/strategy/) | 교체 가능한 알고리즘을 객체로 캡슐화한다 | 같은 일을 하는 규칙을 런타임에 바꿈 |
| [템플릿 메서드](/develop-wiki/knowledge/design-patterns/template-method/) | 알고리즘 골격은 부모에, 세부 단계는 서브클래스에 둔다 | 흐름은 같고 몇 단계만 다름 |
| [비지터](/develop-wiki/knowledge/design-patterns/visitor/) | 구조를 바꾸지 않고 새 연산을 객체 구조 밖에 추가한다 | 타입은 고정, 연산은 계속 늘어난다 |

## 헷갈리는 쌍

| 쌍 | 구분 |
| --- | --- |
| 전략 vs 상태 | 구조는 거의 같다. 전략은 **호출자가 고르고**, 상태는 **객체 스스로 전이**한다. |
| 어댑터 vs 퍼사드 vs 프록시 | 어댑터는 인터페이스를 **바꾸고**, 퍼사드는 **단순화**하며, 프록시는 **같은 인터페이스를 유지**한 채 접근을 제어한다. |
| 데코레이터 vs 프록시 | 둘 다 감싸지만 데코레이터는 **기능 추가**(조합은 클라이언트가 결정), 프록시는 **접근 제어**(수명은 보통 프록시가 관리). |
| 팩토리 메서드 vs 추상 팩토리 | 전자는 제품 **하나**를 상속으로, 후자는 제품 **군**을 객체 합성으로 만든다. |
| 미디에이터 vs 옵저버 | 미디에이터는 **양방향 조정자**를 두어 서로를 모르게 하고, 옵저버는 **단방향 통지**다. |
| 커맨드 vs 전략 | 커맨드는 **무엇을 할지(요청)** 를 객체화해 저장·취소, 전략은 **어떻게 할지(알고리즘)** 를 교체. |
| 템플릿 메서드 vs 전략 | 상속으로 일부 단계만 바꿈 vs 합성으로 알고리즘 전체를 바꿈. |
| 컴포지트 vs 데코레이터 | 같은 재귀 합성이지만 컴포지트는 **여러 자식**의 집합, 데코레이터는 **하나**를 감싸 기능을 추가. |
| 플라이웨이트 vs 싱글턴 | 플라이웨이트는 값 조합마다 불변 객체 하나, 싱글턴은 클래스당 하나(가변 가능). |

## 고르는 순서

1. **패턴부터 찾지 않는다.** 먼저 코드의 아픈 지점(분기 폭증, 구체 클래스 결합, 변경 이유 혼재)을 말로 적는다.
2. 아픈 지점이 "만들기"인지 "엮기"인지 "책임 나누기"인지로 그룹을 고른다.
3. 후보 둘의 차이를 위 표로 확인하고, **가장 단순한 것**(대개 함수 인자로 함수를 넘기는 정도)이 충분하지 않을 때만 패턴을 도입한다.

## 주의

- 언어가 기능으로 흡수한 패턴이 많다. 클로저·일급 함수가 있으면 전략·커맨드·템플릿 메서드가 함수 하나로 끝나고, 이터레이터는 `for...of` 와 제너레이터에, 옵저버는 이벤트 에미터·Rx 에 들어 있다.
- 책이 나온 1994년의 C++/Smalltalk 환경 가정이 있다. 싱글턴은 지금은 전역 상태 문제 때문에 DI 로 대체되는 경우가 많다 → [서비스 로케이터 vs 의존성 주입](/develop-wiki/knowledge/design-patterns/service-locator-vs-dependency-injection/).
- 패턴 이름을 클래스 이름에 붙이는 것(`FooStrategyFactoryBuilder`)이 목적이 되면 과설계 신호다.
- GoF 밖의 실무 패턴(객체 풀, 널 오브젝트, 리포지토리, 의존성 주입 등)도 많다 → [객체 풀](/develop-wiki/knowledge/design-patterns/object-pool/), [널 오브젝트](/develop-wiki/knowledge/design-patterns/null-object/).
- 원칙과의 관계: 대부분의 패턴은 [SOLID](/develop-wiki/knowledge/principles/solid/) 중 개방-폐쇄·의존성 역전을 구체화한 형태다.
