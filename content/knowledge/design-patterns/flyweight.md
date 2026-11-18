---
title: 플라이웨이트 패턴
aka: [Flyweight Pattern, Cache, Intrinsic/Extrinsic State, Interning]
category: design-patterns
group: structural
level: intermediate
summary: 수많은 비슷한 객체가 똑같이 들고 있는 불변 상태(내재 상태)를 공유 객체 하나로 모으고, 객체마다 다른 상태(외재 상태)는 밖에 두어 메모리를 줄이는 구조 패턴.
tags: [gof, oop, memory, caching, structural]
related: [design-patterns/singleton, design-patterns/composite, design-patterns/facade, design-patterns/prototype, design-patterns/interpreter, algorithms/hash-table, algorithms/space-time-tradeoff]
sources:
  - https://refactoring.guru/design-patterns/flyweight
  - https://en.wikipedia.org/wiki/Flyweight_pattern
  - https://en.wikipedia.org/wiki/Design_Patterns
  - https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html
updatedAt: 2026-11-18
---

## 문제

지도에 나무 10만 그루를 그린다. 나무 객체마다 좌표(16바이트)와 함께 종 이름, 색, 64KB 짜리 텍스처를 들고 있다. 텍스처만 6GB 가 넘는다. 그런데 나무 종류는 두 가지뿐이다. **똑같은 무거운 데이터가 10만 번 복제**돼 있다. 문서 편집기의 글자(글꼴·크기), 게임의 파티클(스프라이트), 지도의 아이콘도 같은 모양이다.

## 해법

객체의 상태를 둘로 나눈다.

| | 내재(intrinsic) 상태 | 외재(extrinsic) 상태 |
| --- | --- | --- |
| 예 | 종, 색, 텍스처, 글꼴 | 좌표, 속도, 글자 위치 |
| 공유 | 여러 객체가 공유 | 객체마다 다름 |
| 변경 | **불변** | 자유 |
| 위치 | 플라이웨이트 객체 안 | 바깥(컨텍스트·클라이언트), 메서드 인자로 전달 |

- 내재 상태만 가진 플라이웨이트를 **팩토리**가 키별로 캐시하고, 같은 키면 기존 객체를 돌려준다.
- 외재 상태는 가벼운 컨텍스트 객체(또는 배열)에 두고, 플라이웨이트의 메서드에 인자로 넘긴다.

```ts
// 내재(intrinsic) 상태: 여러 객체가 공유하는 무거운 불변 데이터
class TreeType {
  constructor(readonly species: string, readonly color: string, readonly texture: Uint8Array) {}
  draw(x: number, y: number): string { return `${this.species}@(${x},${y})`; }
}

class TreeTypeFactory {
  private static cache = new Map<string, TreeType>();
  static get(species: string, color: string): TreeType {
    const key = `${species}|${color}`;
    let t = this.cache.get(key);
    if (!t) {
      t = new TreeType(species, color, new Uint8Array(64 * 1024)); // 텍스처 64KB 라고 가정
      this.cache.set(key, t);
    }
    return t;
  }
  static get count(): number { return this.cache.size; }
}

// 외재(extrinsic) 상태: 객체마다 다른 값은 플라이웨이트 밖(컨텍스트)에 둔다
interface Tree { x: number; y: number; type: TreeType }

const forest: Tree[] = [];
for (let i = 0; i < 100_000; i++) {
  const type = TreeTypeFactory.get(i % 2 ? 'oak' : 'pine', 'green');
  forest.push({ x: i % 1000, y: Math.floor(i / 1000), type });
}
console.log(forest.length, TreeTypeFactory.count); // 100000 2 — 텍스처는 2벌(128KB)만 존재
```

메모리는 (나무 수 × 좌표+참조) + (종류 수 × 텍스처)가 된다. 원래는 나무 수 × 텍스처였다.

## 언제 쓰나

refactoring.guru 는 아래 조건을 **모두** 만족할 때만 쓰라고 권한다.

- 비슷한 객체가 **아주 많아서** 메모리가 실제 문제다(프로파일러로 확인).
- 그 객체들에 **중복되는 상태**가 있고, 그 부분을 불변으로 만들 수 있다.
- 남는 외재 상태를 밖에서 계산하거나 저장할 수 있다.
- 객체 정체성(`===`)에 의존하지 않는다. 공유되므로 "다른 나무인데 같은 `type`" 이 정상이다.

## 실무에서 보이는 형태

- **글리프**: 이 패턴의 원래 예다. Wikipedia 에 따르면 1990년 Paul Calder 와 Mark Linton 이 WYSIWYG 편집기에서 글자마다 글리프 객체를 두는 대신 공유 글리프를 참조하게 하면서 이 이름을 붙였다.
- **작은 값 캐시**: Java `Integer.valueOf(int)` 는 Javadoc 에 따라 -128~127 범위를 항상 캐시한다. 그래서 박싱된 `Integer` 의 `==` 비교가 그 범위에서만 우연히 맞는 함정이 생긴다.
- **문자열 인터닝·해시 콘싱**: 같은 값이면 같은 인스턴스를 쓰게 하는 기법. 컴파일러 심볼 테이블, 불변 자료구조 공유에서 쓴다.
- **게임 엔진의 인스턴싱**: 메시·머티리얼은 하나, 변환 행렬만 인스턴스마다.
- 데이터 지향 설계에서 외재 상태를 객체 배열 대신 **열 단위 typed array**(`xs: Float32Array`, `ys: Float32Array`)로 두면 객체 헤더 비용까지 없어진다.

## 주의

- **메모리를 CPU 와 맞바꾼다.** 외재 상태를 매번 계산하거나 인자로 넘기는 비용, 팩토리 조회(해시) 비용이 생긴다.
- 플라이웨이트가 **가변**이면 재앙이다. 한 나무의 색을 바꾸면 같은 종류의 나무가 전부 바뀐다. `readonly`·`Object.freeze` 로 막는다.
- 팩토리 캐시가 무한히 자라면 메모리 누수다. 키 공간이 크면 상한이나 `WeakRef` 기반 정리를 검토한다.
- 멀티스레드 환경에서는 팩토리의 "없으면 생성" 구간이 경쟁한다. 잠가서 값마다 인스턴스 하나를 보장하거나, 잠그지 않고 중복 생성을 허용하는(불변이면 무해) 두 선택지가 있다.
- 코드가 덜 직관적이다. 객체 하나의 상태가 두 곳에 흩어진다. 메모리 문제가 측정되지 않았다면 쓰지 않는다.

## 비교

| | 플라이웨이트 | 싱글턴 | 프로토타입 | 캐싱(일반) |
| --- | --- | --- | --- | --- |
| 인스턴스 수 | 내재 상태 조합마다 하나 | 전역에 하나 | 필요할 때마다 복제 | 키마다 하나 |
| 상태 | 불변(내재만) | 가변일 수 있음 | 복제본은 독립적으로 가변 | 보통 불변 결과값 |
| 목적 | 메모리 절약 | 유일성·전역 접근 | 생성 비용·구체 클래스 은닉 | 재계산·재조회 비용 절약 |

- [싱글턴](/develop-wiki/knowledge/design-patterns/singleton/)과 닮은 것은 공유 상태가 하나로 줄어든 특수한 경우뿐이다.
- [컴포지트](/develop-wiki/knowledge/design-patterns/composite/) 트리의 공유 가능한 잎 노드, [인터프리터](/develop-wiki/knowledge/design-patterns/interpreter/) 구문 트리의 종단 기호를 플라이웨이트로 만들 수 있다.
- [퍼사드](/develop-wiki/knowledge/design-patterns/facade/)는 하위 시스템 전체를 객체 하나로 대표하고, 플라이웨이트는 작은 객체를 많이 공유한다. 방향이 반대다.
