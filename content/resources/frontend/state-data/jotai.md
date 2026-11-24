---
name: Jotai
url: https://jotai.pmnd.rs
docs: https://jotai.pmnd.rs/docs
repo: https://github.com/pmndrs/jotai
stars: 21346
domain: frontend
category: state-data
description: 작은 상태 단위(atom)를 조합해 쓰는 React 상태 관리 라이브러리. 파생 상태와 비동기 상태를 atom 의존 관계로 표현한다.
pricing: oss
tags: [state-management, react, atomic]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Jotai는 상태를 하나의 큰 스토어 대신 `atom`이라는 작은 단위로 나누고, 다른 atom을 읽어 값을 계산하는 파생 atom으로 의존 그래프를 만드는 상태 관리 라이브러리다. 컴포넌트는 자신이 읽는 atom이 바뀔 때만 리렌더되며, `useState`와 비슷한 API로 전역 상태를 다룬다. 이 문서는 **v3** 기준이다(npm `jotai` `latest` 3.0.2). v3는 ESM 전용이고 React 18·TypeScript 5.5·Node.js 22.12 이상을 요구하며, 핵심 훅 시그니처는 v2와 같다.

- 같은 pmndrs 조직의 Zustand가 "위에서 아래로" 하나의 스토어를 쪼개는 방식이라면, Jotai는 "아래에서 위로" atom을 조합하는 방식이다.
- 공식 사이트였던 `jotai.org`는 2026-11-09 도메인 등록 만료 이후 원래 사이트 대신 도메인 주차 페이지가 나온다([이슈 #3392](https://github.com/pmndrs/jotai/issues/3392)). 이 문서는 같은 사이트가 서비스되는 `jotai.pmnd.rs`를 링크한다.

## 설치
```bash
npm install jotai
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `atom(initial)` | 읽기·쓰기 가능한 원시 atom. 정의만 하고 값은 스토어에 저장됨 |
| 파생 atom `atom((get) => ...)` | 다른 atom을 `get`으로 읽어 계산하는 읽기 전용 atom |
| 쓰기 atom `atom(null, (get, set, arg) => ...)` | 여러 atom을 한 번에 바꾸는 액션 역할 |
| `useAtom` / `useAtomValue` / `useSetAtom` | 읽기+쓰기 / 읽기만 / 쓰기만 (쓰기만 하면 리렌더 없음) |
| 비동기 atom | 읽기 함수가 Promise를 반환하면 Suspense와 연동. `loadable`로 감싸면 Suspense 없이 상태 확인 |
| `Provider` / `createStore` | 기본은 전역 스토어. 하위 트리별로 분리하거나 React 밖에서 접근할 때 사용 |
| `jotai/utils` | `atomWithStorage`, `atomWithReset`, `selectAtom`, `loadable` 등 유틸 |

## 기본 사용법
```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const todosAtom = atom<{ title: string; done: boolean }[]>([]);
const remainingAtom = atom((get) => get(todosAtom).filter((t) => !t.done).length);
const addTodoAtom = atom(null, (get, set, title: string) => {
  set(todosAtom, [...get(todosAtom), { title, done: false }]);
});

function Remaining() {
  return <p>남은 일: {useAtomValue(remainingAtom)}</p>;
}

function AddButton() {
  const addTodo = useSetAtom(addTodoAtom);
  return <button onClick={() => addTodo('새 할 일')}>추가</button>;
}
```

## 자주 쓰는 패턴
- **localStorage 연동.** `atomWithStorage('theme', 'light')`(`jotai/utils`)로 새로고침 후에도 값을 유지한다.
- **비동기 데이터.** `const userAtom = atom(async (get) => fetchUser(get(userIdAtom)))`를 `<Suspense>` 안에서 읽는다. 서버 캐시가 본격적으로 필요하면 `jotai-tanstack-query` 연동을 쓴다.
- **매개변수별 atom.** v3에서 `atomFamily`는 `jotai/utils`에서 제거되어 별도 패키지 `jotai-family`로 옮겨졌다.
- **테스트·SSR 격리.** 테스트마다 `createStore()`로 새 스토어를 만들어 `<Provider store={store}>`로 감싸면 상태가 섞이지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서로 의존하는 작은 상태가 많고 파생 값 계산이 잦은 UI(편집기, 대시보드 필터, 폼 위저드), 리렌더 범위를 세밀하게 줄이고 싶을 때.
- 피할 때(대안): 상태가 몇 개 안 되고 한곳에 모아 보는 편이 낫다면 [Zustand](/develop-wiki/frontend/state-data/zustand/). 서버 데이터 캐시는 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/).

## 공식 문서
- [소개](https://jotai.pmnd.rs/docs) · [`atom`](https://jotai.pmnd.rs/docs/core/atom) · [`useAtom`](https://jotai.pmnd.rs/docs/core/use-atom) · [Storage 유틸](https://jotai.pmnd.rs/docs/utilities/storage)
- [v3 마이그레이션](https://jotai.pmnd.rs/docs/guides/migrating-to-v3)
