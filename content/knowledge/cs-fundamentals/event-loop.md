---
title: 이벤트 루프 (브라우저·Node.js)
aka: [Event Loop, Task Queue, Microtask, Macrotask, process.nextTick, setImmediate, libuv, Run-to-completion]
category: cs-fundamentals
group: web
level: intermediate
summary: 단일 스레드 JavaScript 가 큐에서 작업을 하나씩 꺼내 끝까지 실행하는 구조. 태스크·마이크로태스크·렌더링(브라우저)·libuv 단계(Node)의 순서가 실행 순서와 응답성을 정한다.
tags: [web, javascript, nodejs, event-loop, async, performance]
related: [cs-fundamentals/async-vs-threads, cs-fundamentals/io-models, cs-fundamentals/browser-rendering-pipeline, cs-fundamentals/process-thread]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model
  - https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
  - https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
  - https://web.dev/articles/optimize-long-tasks
updatedAt: 2026-11-18
---

## 핵심 규칙 (MDN 실행 모델)

- 에이전트(창, 워커) 하나는 스레드 하나, 콜 스택 하나, 작업 큐를 가진다.
- **완료까지 실행(run-to-completion)**: 작업 하나가 끝나기 전에는 다른 작업이 끼어들지 않는다. 그래서 JS 코드 한 덩어리 안에서는 다른 JS 에 의한 경쟁 조건이 없다.
- 작업은 **태스크**와 **마이크로태스크**로 나뉘고, 태스크 하나가 끝날 때마다 마이크로태스크 큐를 **완전히 비운다**.
- I/O 는 기다리지 않는다. 결과는 나중에 콜백 작업으로 큐에 들어온다.

## 브라우저

```
┌─▶ 태스크 1개 실행 (스크립트, setTimeout 콜백, 클릭 이벤트, 메시지)
│     └─ 끝나면 마이크로태스크 전부 실행 (Promise.then, queueMicrotask, MutationObserver)
│          (실행 중 새로 생긴 마이크로태스크도 이번에 다 처리)
│   렌더링 기회 (필요할 때만, 보통 화면 주사율에 맞춰)
│     └─ requestAnimationFrame 콜백 → 스타일 → 레이아웃 → 페인트
└───────────────────────────────────────────────┘
```

```ts
console.log('script start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise1')).then(() => console.log('promise2'));
console.log('script end');
// script start → script end → promise1 → promise2 → timeout
```

## Node.js (libuv)

공식 문서의 단계 순서:

| 단계 | 실행되는 것 |
| --- | --- |
| timers | 기한이 지난 `setTimeout`·`setInterval` 콜백 |
| pending callbacks | 이전 반복에서 미뤄진 일부 시스템 콜백 |
| idle, prepare | 내부용 |
| poll | 새 I/O 이벤트를 받아 콜백 실행, 필요하면 여기서 대기 |
| check | `setImmediate` 콜백 |
| close callbacks | `socket.on('close')` 등 |

- `process.nextTick` 은 단계와 무관하게 **현재 작업 직후**, Promise 마이크로태스크보다 먼저 실행된다.
- 메인 모듈에서 `setTimeout(0)` 과 `setImmediate` 의 순서는 정해지지 않는다. I/O 콜백 안에서는 `setImmediate` 가 항상 먼저다.
- 공식 문서는 libuv 1.45.0(Node.js 20)부터 타이머가 poll 단계 **뒤**에 실행되도록 바뀌었다고 적는다. 미묘한 순서에 의존하는 코드는 버전에 따라 달라질 수 있다.

```ts
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
// nextTick → promise → (timeout, immediate 순서는 메인 모듈에서 비결정적)
```

## 개발자에게 왜 중요한가

- **긴 작업은 모든 것을 멈춘다.** 브라우저에서 50ms 를 넘는 작업은 web.dev 기준 "긴 작업"이고 클릭·스크롤 반응(INP)을 늦춘다. Node 에서는 그동안 **모든 요청**이 멈춘다.
- **마이크로태스크로는 양보가 안 된다.** `await` 는 마이크로태스크라 렌더링이나 다른 태스크에 차례를 주지 않는다. 마이크로태스크를 끝없이 만들면(재귀 `nextTick` 포함) I/O 와 렌더링이 굶는다.

```ts
// 큰 배열 처리 중간중간 메인 스레드에 양보 (브라우저)
async function processAll<T>(items: T[], work: (x: T) => void) {
  for (let i = 0; i < items.length; i++) {
    work(items[i]);
    if (i % 500 === 0) {
      // scheduler.yield 미지원 브라우저는 새 태스크로 양보
      await ('scheduler' in globalThis && 'yield' in (globalThis as any).scheduler
        ? (globalThis as any).scheduler.yield()
        : new Promise((r) => setTimeout(r, 0)));
    }
  }
}
```

web.dev 기준 `scheduler.yield()` 는 Chrome·Edge 129+, Firefox 142+ 에서 지원되고 Safari 는 아직 미지원이라 폴백이 필요하다.

## 언제 무엇을

| 하고 싶은 것 | 브라우저 | Node.js |
| --- | --- | --- |
| 현재 코드 직후, 다른 작업 전 | `queueMicrotask` / Promise | `queueMicrotask` (`nextTick` 은 꼭 필요할 때만) |
| 다른 작업에 양보 | `scheduler.yield()` / `setTimeout(0)` | `setImmediate` |
| 다음 프레임 그리기 직전 | `requestAnimationFrame` | 해당 없음 |
| CPU 무거운 계산 | Web Worker | `worker_threads` |

## 주의

- `setTimeout(fn, 0)` 은 0ms 가 아니다. 중첩되면 최소 지연이 붙고, 큐 뒤에 줄 선다.
- 이벤트 루프는 **동시성**이지 병렬성이 아니다. CPU 계산은 여전히 한 코어에서 순서대로 돈다. 비교는 [async/await vs 스레드](/develop-wiki/knowledge/cs-fundamentals/async-vs-threads/) 참고.
- Node 의 파일 I/O·`dns.lookup` 은 libuv 스레드 풀을 쓴다. 이벤트 루프가 한가해 보여도 풀이 포화될 수 있다. [I/O 모델](/develop-wiki/knowledge/cs-fundamentals/io-models/) 참고.
