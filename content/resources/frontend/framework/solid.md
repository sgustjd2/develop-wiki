---
name: Solid
url: https://www.solidjs.com
repo: https://github.com/solidjs/solid
stars: 36918
docs: https://docs.solidjs.com
domain: frontend
category: framework
description: 가상 DOM 없이 시그널로 필요한 DOM만 갱신하는 JSX 기반 UI 라이브러리. React와 비슷한 문법에 세밀한 반응성이 필요할 때 쓴다.
pricing: oss
tags: [ui, signals, jsx, fine-grained]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Solid는 컴포넌트를 한 번만 실행하고, 그 안에서 만든 시그널이 바뀌면 해당 값을 쓰는 DOM 노드만 직접 갱신하는 UI 라이브러리다. JSX를 쓰지만 가상 DOM 비교가 없어서 "컴포넌트 재렌더링"이라는 개념 자체가 없다. 이 문서는 **Solid 2.0** 기준이다(npm `solid-js` `latest` 2.0.0). 1.x 문서는 v1.solidjs.com 에 따로 있다.

- 2.0에서 비동기가 반응성 그래프에 들어왔다. `createResource` 대신 Promise를 반환하는 `createMemo`를 쓰고, `Suspense`/`ErrorBoundary`는 `Loading`/`Errored`로 바뀌었다.
- React와 문법이 비슷하지만 실행 모델이 다르다. 같은 JSX 계열 대안은 [React](/develop-wiki/frontend/framework/react/), [Preact](/develop-wiki/frontend/framework/preact/).

## 설치
새 프로젝트(CLI가 템플릿을 고르게 해 준다):

```bash
npm init solid@latest
```

기존 Vite 프로젝트에 직접 추가:

```bash
npm install solid-js @solidjs/web
npm install -D vite @solidjs/vite-plugin
```

`vite.config.ts`에 `@solidjs/vite-plugin`의 `solid()`를 넣고, `tsconfig.json`은 `"jsx": "preserve"`, `"jsxImportSource": "@solidjs/web"`로 둔다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `createSignal` | `[getter, setter]` 쌍. 값은 `count()`처럼 함수 호출로 읽어야 추적된다 |
| `createMemo` | 파생 값. 함수가 Promise를 반환하면 비동기 memo가 된다 (2.0) |
| `createEffect(compute, effect)` | 2.0의 2단계 형태. compute에서 추적하고, effect는 추적 없이 실행되며 cleanup을 반환 |
| `createStore` | 중첩 객체용 반응형 상태. 2.0부터 `solid-js`에서 import, 수정은 draft 콜백으로 |
| 쓰기 지연 | setter는 다음 microtask에 반영된다. 테스트 등에서 즉시 반영하려면 `flush()` |
| `Show` / `For` / `Switch` | 조건·목록 렌더링용 흐름 컴포넌트. `Index`는 `For keyed={false}`로 대체 |
| `Loading` / `Errored` | 비동기 값의 첫 로딩 fallback, 오류 fallback 경계 (`Suspense`/`ErrorBoundary` 대체) |
| `isPending` / `refresh` | 다시 불러오는 중인지 확인 / 비동기 소스 재실행 |
| `onSettled` | 마운트 후 실행 (1.x `onMount` 대체), cleanup은 반환값으로 |
| `render` | `@solidjs/web`에서 import. 엘리먼트가 아니라 함수를 받는다 |

## 기본 사용법
엔트리와 카운터 컴포넌트.

```tsx
import { createSignal, createMemo } from 'solid-js';
import { render } from '@solidjs/web';

function Counter() {
  const [count, setCount] = createSignal(0);
  const double = createMemo(() => count() * 2);
  return (
    <button type="button" onClick={() => setCount(count() + 1)}>
      {count()} / 두 배 {double()}
    </button>
  );
}

render(() => <Counter />, document.getElementById('root')!);
```

비동기 memo와 경계.

```tsx
import { createMemo, Loading, Errored, For } from 'solid-js';

function UserList() {
  const users = createMemo(() => fetch('/api/users').then((r) => r.json()));
  return (
    <Errored fallback={(err, reset) => <button onClick={reset}>{String(err())} 재시도</button>}>
      <Loading fallback={<p>불러오는 중…</p>}>
        <ul>
          <For each={users()}>{(u) => <li>{u.name}</li>}</For>
        </ul>
      </Loading>
    </Errored>
  );
}
```

## 자주 쓰는 패턴
- **props는 구조 분해하지 않는다.** 컴포넌트 본문 맨 위에서 `props.x`를 읽으면 반응성이 끊긴다. JSX나 memo 안에서 `props.x`로 읽는다(2.0은 개발 모드에서 경고).
- **스토어는 draft로 수정.** `setState((d) => { d.items.push(item); })`처럼 쓰고, 1.x의 경로 인자·`produce`는 없어졌다.
- **파생 값에 effect를 쓰지 않는다.** 컴포넌트 본문이나 memo 안에서 setter를 부르면 개발 모드가 거부한다. 계산은 `createMemo`로.
- **새로고침 중 이전 화면 유지.** `Loading`은 첫 로딩에만 fallback을 보이고, 이후에는 `isPending(users)`로 흐리게 표시하는 식으로 처리한다.
- **1.x 코드 이전.** `solid-js/web`→`@solidjs/web`, `solid-js/store`→`solid-js`, `onMount`→`onSettled`, `batch` 제거 등은 공식 마이그레이션 가이드 표를 따라 바꾼다.

## 언제 쓰나 / 피할 때
- 쓸 때: JSX 문법을 유지하면서 세밀한 갱신과 작은 런타임이 필요할 때, 실시간 대시보드처럼 잦은 부분 갱신이 많은 화면.
- 피할 때(대안): 서드파티 컴포넌트·채용 풀이 중요한 대규모 팀은 [React](/develop-wiki/frontend/framework/react/), API 변경이 큰 1.x 프로젝트는 쓰는 라이브러리의 2.0 대응 여부를 먼저 확인하고, 템플릿 기반 대안으로는 [Svelte](/develop-wiki/frontend/framework/svelte/)·[Vue](/develop-wiki/frontend/framework/vue/)가 있다.

## 공식 문서
- [빠른 시작](https://docs.solidjs.com/getting-started/quick-start) · [수동 설정](https://docs.solidjs.com/getting-started/manual-setup) · [API 레퍼런스](https://docs.solidjs.com/reference/solid-js)
- [비동기 반응성](https://docs.solidjs.com/concepts/async-reactivity) · [스토어](https://docs.solidjs.com/concepts/stores) · [1.x → 2.0 마이그레이션](https://docs.solidjs.com/migration/from-solid-1)
