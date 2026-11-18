---
name: Redux Toolkit
url: https://redux.js.org/toolkit
docs: https://redux.js.org/toolkit/introduction/getting-started
repo: https://github.com/reduxjs/redux-toolkit
domain: frontend
category: state-data
description: Redux 공식 권장 도구 모음. createSlice·configureStore로 보일러플레이트를 줄이고, RTK Query로 서버 데이터 캐시까지 다룬다.
pricing: oss
tags: [state-management, redux, react, data-fetching]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Redux Toolkit(RTK)은 Redux를 쓰는 공식 권장 방식으로, 스토어 설정·리듀서·액션 생성을 한 번에 처리하는 API와 데이터 패칭·캐시 도구 RTK Query를 한 패키지에 담고 있다. 리듀서 안에서는 Immer 덕분에 `state.items.push(x)`처럼 변경 문법으로 불변 업데이트를 쓴다. 모든 상태 변경이 액션으로 기록되므로 Redux DevTools로 시간 순서대로 추적하기 쉽다. 이 문서는 **RTK 2.x** 기준이다(npm `@reduxjs/toolkit` `latest` 2.14.0, TypeScript 5.4 이상).

- 문서 사이트는 `redux.js.org/toolkit` 아래로 통합되었다(`redux-toolkit.js.org`는 리다이렉트).

## 설치
```bash
npm install @reduxjs/toolkit react-redux
# 새 프로젝트 템플릿 (Vite + Redux + TS)
npx tiged reduxjs/redux-templates/packages/vite-template-redux my-app
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `configureStore` | 리듀서 결합, thunk 미들웨어, DevTools 연결을 기본값으로 설정한 스토어 생성 |
| `createSlice` | 이름·초기 상태·리듀서 객체로 리듀서와 액션 생성자를 함께 생성 |
| `createAsyncThunk` | Promise 함수로 `pending/fulfilled/rejected` 액션을 자동 디스패치 |
| `createEntityAdapter` | 정규화된 목록(ids + entities)용 리듀서·셀렉터 생성 |
| `createSelector` | Reselect의 메모이즈 셀렉터 (재수출) |
| `combineSlices` | 슬라이스 결합 + 지연 주입(코드 분할) 지원 |
| RTK Query `createApi` | 엔드포인트 정의로 요청·캐시·무효화(`providesTags`/`invalidatesTags`)와 훅을 생성 |
| `useSelector` / `useDispatch` | react-redux 훅. TS에서는 `withTypes<>()`로 타입 붙인 버전을 만들어 사용 |

## 기본 사용법
```ts
// store.ts
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

const todosSlice = createSlice({
  name: 'todos',
  initialState: [] as { id: number; title: string; done: boolean }[],
  reducers: {
    added(state, action: PayloadAction<string>) {
      state.push({ id: Date.now(), title: action.payload, done: false });
    },
    toggled(state, action: PayloadAction<number>) {
      const t = state.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
  },
});

export const { added, toggled } = todosSlice.actions;
export const store = configureStore({ reducer: { todos: todosSlice.reducer } });
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
export const useAppSelector = useSelector.withTypes<ReturnType<typeof store.getState>>();
```

앱 최상위를 `<Provider store={store}>`(react-redux)로 감싸고 컴포넌트에서 `useAppSelector((s) => s.todos)`, `useAppDispatch()(added('새 할 일'))`로 쓴다.

## 자주 쓰는 패턴
- **서버 데이터는 RTK Query.** `createApi({ baseQuery: fetchBaseQuery({ baseUrl: '/api' }), endpoints: (b) => ({ getTodos: b.query({ query: () => 'todos' }) }) })`로 정의하면 `useGetTodosQuery()` 훅이 생긴다. `import`는 `@reduxjs/toolkit/query/react`.
- **API 슬라이스는 기본 URL당 하나.** 엔드포인트를 한 `createApi`에 모으고 `injectEndpoints`로 기능별 파일에 나눈다.
- **기능 폴더 구조.** 슬라이스·셀렉터·컴포넌트를 `features/todos/`처럼 기능 단위로 모은다.
- **파생 값은 셀렉터로.** 필터링·합계는 상태에 저장하지 말고 `createSelector`로 계산한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상태 변경 이력을 추적해야 하는 큰 앱, 여러 팀이 같은 규칙으로 상태를 다뤄야 할 때, 기존 Redux 코드를 현대화할 때.
- 피할 때(대안): 전역 상태가 작으면 [Zustand](/develop-wiki/frontend/state-data/zustand/)나 [Jotai](/develop-wiki/frontend/state-data/jotai/)가 더 간단하다. 서버 데이터 캐시만 필요하면 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/).

## 공식 문서
- [시작하기](https://redux.js.org/toolkit/introduction/getting-started) · [TypeScript 빠른 시작](https://redux.js.org/tutorials/typescript-quick-start)
- [`createSlice`](https://redux.js.org/toolkit/api/createSlice) · [RTK Query 개요](https://redux.js.org/toolkit/rtk-query/overview)
