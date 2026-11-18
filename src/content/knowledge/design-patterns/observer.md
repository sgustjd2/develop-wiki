---
title: 옵저버 패턴
aka: [Observer Pattern, Publish-Subscribe, Event Listener]
category: design-patterns
group: behavioral
level: beginner
summary: 한 객체의 변화나 이벤트를 구독한 여러 객체에 자동으로 알리는 행위 패턴. 발행자는 구독자 구체 타입을 모른다.
tags: [gof, oop, event, reactive]
related: [design-patterns/command, principles/solid]
sources:
  - https://refactoring.guru/design-patterns/observer
  - https://en.wikipedia.org/wiki/Design_Patterns
updatedAt: 2026-11-18
---

## 문제

회원 가입이 끝나면 환영 메일, 포인트 지급, 통계 집계를 해야 한다. 가입 서비스가 이 기능들을 직접 호출하면, 후속 작업이 늘 때마다 가입 코드를 고쳐야 하고 가입 서비스가 무관한 모듈에 모두 의존하게 된다.

## 해법

발행자(subject)는 구독자 목록만 관리하고, 일이 생기면 목록을 돌며 알린다. 구독자는 실행 중에 등록·해제한다.

```ts
type Listener<T> = (event: T) => void;

class Emitter<T> {
  private listeners = new Set<Listener<T>>();
  subscribe(fn: Listener<T>) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn); // 해제 함수
  }
  emit(event: T) { for (const fn of this.listeners) fn(event); }
}

const signedUp = new Emitter<{ userId: string }>();
signedUp.subscribe((e) => console.log('welcome mail', e.userId));
const off = signedUp.subscribe((e) => console.log('grant points', e.userId));

signedUp.emit({ userId: 'u1' });
off(); // 더 이상 포인트 지급 안 함
```

DOM `addEventListener`, Node `EventEmitter`, RxJS, 상태 관리 라이브러리의 `subscribe` 가 모두 이 패턴이다.

## 언제 쓰나

- 한 곳의 변화에 반응할 대상이 여러 개이고, 그 목록이 미리 정해지지 않았거나 실행 중에 바뀔 때
- UI 이벤트, 상태 변경 알림, 도메인 이벤트

## 주의

- **해제 누락 = 메모리 누수.** 컴포넌트가 사라질 때 구독을 끊는다.
- 알림 순서에 의존하지 않는다. 순서가 중요하면 명시적 호출이 낫다.
- 구독자 하나가 예외를 던지면 나머지가 실행되지 않을 수 있다. 격리 정책을 정한다.
- 흐름이 코드에 드러나지 않아 "이 값이 왜 바뀌었나" 추적이 어렵다. 연쇄 알림(구독자가 다시 emit)은 무한 루프 위험이 있다.
- 위 예시는 같은 프로세스 안의 동기 알림이다. 서비스 간 비동기 전달은 메시지 브로커 기반 pub/sub 로 다룬다.
