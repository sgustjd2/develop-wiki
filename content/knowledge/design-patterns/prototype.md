---
title: 프로토타입 패턴
aka: [Prototype Pattern, Clone, Prototype Registry]
category: design-patterns
group: creational
level: beginner
summary: 이미 설정을 마친 객체를 복제해 새 객체를 만드는 생성 패턴. 구체 클래스를 몰라도 복사할 수 있고, 초기화만 다른 서브클래스를 미리 만든 원본 몇 개로 대신한다.
tags: [gof, oop, clone, creational]
related: [design-patterns/factory-method, design-patterns/abstract-factory, design-patterns/builder, design-patterns/memento, design-patterns/command, design-patterns/flyweight]
sources:
  - https://refactoring.guru/design-patterns/prototype
  - https://en.wikipedia.org/wiki/Design_Patterns
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
updatedAt: 2026-11-18
---

## 문제

- 객체를 복사하고 싶은데 클래스가 `Shape` 인터페이스로만 넘어와서 구체 타입을 모른다. `new ???(...)` 를 쓸 수 없다.
- 필드를 하나씩 꺼내 복사하려 해도 private 필드는 밖에서 읽을 수 없다. 복사하는 쪽이 대상 클래스 내부에 묶인다.
- "빨간 마커", "금색 배지"처럼 **설정값만 다른** 변형마다 서브클래스나 생성 코드를 만들면 같은 초기화가 곳곳에 반복된다.

## 해법

복사 책임을 **복사될 객체 자신**에게 준다. 모든 대상이 `clone()` 을 구현하고, 클라이언트는 그것만 부른다. 자주 쓰는 원본은 이름으로 찾는 **프로토타입 레지스트리**에 넣어 둔다.

```ts
interface Prototype<T> { clone(): T }

class Shape implements Prototype<Shape> {
  constructor(public x: number, public y: number, public color: string, public tags: string[]) {}
  clone(): Shape {
    return new Shape(this.x, this.y, this.color, [...this.tags]); // 배열은 새로 만든다(깊은 복사)
  }
}

class Circle extends Shape {
  constructor(x: number, y: number, color: string, tags: string[], public radius: number) {
    super(x, y, color, tags);
  }
  override clone(): Circle {
    return new Circle(this.x, this.y, this.color, [...this.tags], this.radius);
  }
}

// 프로토타입 레지스트리: 미리 설정해 둔 원본을 이름으로 찾아 복제
const registry = new Map<string, Shape>([
  ['badge', new Circle(0, 0, 'gold', ['ui'], 12)],
  ['marker', new Shape(0, 0, 'red', ['map'])],
]);

function spawn(key: string): Shape {
  const proto = registry.get(key);
  if (!proto) throw new Error(`unknown prototype: ${key}`);
  return proto.clone();
}

const a = spawn('badge');
a.tags.push('new');
console.log(a instanceof Circle, registry.get('badge')?.tags); // true [ 'ui' ] — 원본은 그대로
```

`spawn` 은 `Circle` 을 모르지만 결과는 `Circle` 이다. 다형성이 "어떤 클래스로 만들지"를 대신 정한다.

### 얕은 복사 vs 깊은 복사

| | 얕은 복사 | 깊은 복사 |
| --- | --- | --- |
| 참조 필드 | 원본과 **같은 객체**를 가리킴 | 새로 복사 |
| 비용 | 싸다 | 그래프 크기에 비례 |
| 위험 | 복제본을 고치면 원본도 바뀜 | 순환 참조·공유해야 할 객체(DB 연결 등)까지 복사할 수 있음 |

필드마다 정해야 한다. 불변 값과 공유 자원은 얕게, 복제본이 소유하는 가변 상태는 깊게 복사하는 것이 보통이다.

### JavaScript 에서 주의할 점

- JS 의 "프로토타입 상속"(`Object.create`)과 이 패턴은 이름만 같다. GoF 프로토타입은 **객체 복제로 생성**하는 설계 패턴이다.
- `structuredClone()` 은 순환 참조까지 깊게 복사하지만, MDN 에 따르면 **프로토타입 체인·getter/setter·`#private` 필드는 복사하지 않고** 함수가 있으면 `DataCloneError` 를 던진다. 클래스 인스턴스는 평범한 객체로 돌아온다. 도메인 객체에는 직접 만든 `clone()` 이 필요하다.
- 스프레드(`{ ...obj }`)는 얕은 복사이며 역시 프로토타입을 잃는다.

## 언제 쓰나

- 넘겨받은 객체를 복사해야 하는데 구체 클래스에 의존하고 싶지 않을 때 (플러그인, 서드파티 인터페이스로 들어온 객체).
- 초기화 비용이 큰 객체(파싱한 설정, 미리 계산한 템플릿)를 여러 번 만들어야 할 때 — 한 번 만들고 복제한다.
- 설정만 다른 변형이 많을 때 — 서브클래스 대신 레지스트리의 원본 몇 개로 표현한다.
- 편집기의 복사·붙여넣기, 게임의 몬스터 스폰, 문서 템플릿에서 새 문서 만들기.

## 주의

- **순환 참조와 깊은 그래프**는 복제가 까다롭다. 이미 복사한 객체를 기억하는 맵이 필요하다.
- 하위 클래스가 `clone()` 재정의를 잊으면 부모 타입으로 잘린 복제본이 나온다. 위 예에서 `Circle` 이 재정의하지 않으면 `radius` 가 사라진다. 상속 계층이 깊을수록 실수하기 쉽다.
- 복제본이 공유하면 안 되는 것(ID, 생성 시각, 이벤트 구독, 열린 연결)은 `clone()` 안에서 재설정해야 한다.
- 단순한 데이터 객체라면 패턴 없이 생성자나 팩토리 함수로 충분하다. 클래스 이름을 몰라야 하는 이유가 없으면 쓰지 않는다.

## 비교

| | 프로토타입 | 팩토리 메서드 | 추상 팩토리 | 빌더 |
| --- | --- | --- | --- | --- |
| 새 객체의 출처 | 기존 객체 복제 | 서브클래스가 고른 `new` | 팩토리 객체가 제품군을 `new` | 단계별 조립 후 `build()` |
| 변형을 늘리는 방법 | 원본 객체 하나 추가(런타임) | 서브클래스 추가 | 팩토리 클래스 추가 | 조립 순서·옵션 변경 |
| 상속 필요 | 없음 (단, 각 클래스가 `clone` 구현) | 있음 | 있음 | 없음 |
| 잘 맞는 곳 | 초기화가 비싸거나 런타임에 종류가 정해질 때 | 프레임워크 확장 지점 | 서로 맞아야 하는 객체 묶음 | 옵션이 많은 복잡한 객체 |

- [메멘토](/develop-wiki/knowledge/design-patterns/memento/)와 비교: 상태가 단순하고 외부 연결이 없으면 객체 전체를 복제해 두는 프로토타입이 메멘토보다 간단한 되돌리기 수단이 된다.
- [커맨드](/develop-wiki/knowledge/design-patterns/command/) 이력을 저장할 때 커맨드를 복제해 두기도 한다.
- [플라이웨이트](/develop-wiki/knowledge/design-patterns/flyweight/)는 반대 방향이다. 복제해서 늘리는 대신 공유해서 줄인다.
