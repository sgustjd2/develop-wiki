---
name: XState
url: https://stately.ai/docs/xstate
docs: https://stately.ai/docs/xstate
repo: https://github.com/statelyai/xstate
stars: 30533
domain: frontend
category: state-data
description: 상태 머신·상태차트와 액터 모델로 복잡한 UI 흐름과 비동기 로직을 명시적으로 모델링하는 라이브러리. 프레임워크와 무관하게 동작한다.
pricing: oss
tags: [state-machine, statechart, actor-model]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
XState는 "어떤 상태에서 어떤 이벤트가 오면 어디로 가는가"를 상태 머신(상태차트)으로 정의하고, 이를 실행하는 액터(actor)로 상태를 관리하는 라이브러리다. 불리언 플래그 여러 개로 표현하던 흐름(로딩·성공·실패·재시도, 다단계 위저드, 결제 절차)을 불가능한 상태 조합 없이 표현할 수 있고, 정의를 시각화 도구(Stately Studio)로 볼 수 있다. 이 문서는 **v5** 기준이다(npm `xstate` `latest` 5.33.4, `@xstate/react` 6.1.0).

- Zustand·Jotai가 "값"을 저장하는 데 집중한다면, XState는 "전이 규칙"을 코드로 강제한다. 가벼운 이벤트 기반 스토어가 필요하면 같은 팀의 `@xstate/store`도 있다.

## 설치
```bash
npm install xstate
npm install @xstate/react   # React 훅 (Vue·Svelte·Solid용 어댑터도 별도 패키지)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `setup({...}).createMachine({...})` | 타입·액션·가드·액터 구현을 먼저 선언하고 머신을 정의하는 v5 권장 방식 |
| 상태(states) / `initial` | 유한 상태 목록과 시작 상태. 중첩·병렬(`type: 'parallel'`) 상태 가능 |
| 이벤트 / `on` | `{ type: 'SUBMIT' }` 같은 이벤트와 전이 대상 `target` |
| `context` | 유한 상태와 함께 갖는 확장 데이터. `assign`으로만 갱신 |
| 가드(guards) | 전이 조건 함수. 거짓이면 전이하지 않음 |
| 액션(actions) | 전이·진입(`entry`)·이탈(`exit`) 시 실행되는 부수 효과 |
| 액터 | `createActor(machine).start()`로 실행. `fromPromise`, `fromCallback` 등으로 비동기 작업도 액터로 표현하고 `invoke`로 호출 |
| 스냅샷 | `actor.getSnapshot()` — `value`(현재 상태), `context`, `matches('...')` |

## 기본 사용법
```ts
import { setup, assign, createActor } from 'xstate';

const fetchMachine = setup({
  types: { context: {} as { retries: number }, events: {} as { type: 'FETCH' } | { type: 'FAIL' } | { type: 'OK' } },
  guards: { canRetry: ({ context }) => context.retries < 3 },
}).createMachine({
  id: 'fetch',
  initial: 'idle',
  context: { retries: 0 },
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { on: { OK: 'success', FAIL: 'failure' } },
    failure: { on: { FETCH: { target: 'loading', guard: 'canRetry', actions: assign({ retries: ({ context }) => context.retries + 1 }) } } },
    success: { type: 'final' },
  },
});

const actor = createActor(fetchMachine).start();
actor.subscribe((s) => console.log(s.value));
actor.send({ type: 'FETCH' });
```

React에서는 `const [snapshot, send] = useMachine(fetchMachine)`(`@xstate/react`)로 쓰고 `snapshot.matches('loading')`으로 화면을 분기한다.

## 자주 쓰는 패턴
- **비동기 호출은 invoke.** 상태에 `invoke: { src: fromPromise(({ input }) => fetchUser(input.id)), onDone: 'success', onError: 'failure' }`를 두면 상태를 벗어날 때 자동으로 정리된다.
- **필요한 값만 구독.** 공유 액터는 `useActorRef`로 만들고 하위 컴포넌트에서 `useSelector(actorRef, (s) => s.context.count)`로 고른다.
- **구현 교체.** 테스트에서는 `machine.provide({ actions: {...}, actors: {...} })`로 부수 효과를 바꿔 끼운다.
- **시각화.** Stately 확장·Studio로 머신을 다이어그램으로 보고 리뷰한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상태 전이 규칙이 복잡하거나 잘못된 조합이 치명적인 흐름(결제, 인증, 업로드, 다단계 폼, 미디어 플레이어), 프레임워크와 독립적으로 로직을 테스트하고 싶을 때.
- 피할 때(대안): 단순 전역 값 공유에는 과하다. [Zustand](/develop-wiki/frontend/state-data/zustand/)·[Jotai](/develop-wiki/frontend/state-data/jotai/)가 가볍다. 서버 데이터 캐시는 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/).

## 공식 문서
- [XState 개요](https://stately.ai/docs/xstate) · [`setup`](https://stately.ai/docs/setup) · [액터](https://stately.ai/docs/actors) · [가드](https://stately.ai/docs/guards)
- [React 연동](https://stately.ai/docs/xstate-react) · [v4→v5 마이그레이션](https://stately.ai/docs/migration)
