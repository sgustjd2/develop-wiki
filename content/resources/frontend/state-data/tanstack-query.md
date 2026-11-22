---
name: TanStack Query
url: https://tanstack.com/query
repo: https://github.com/TanStack/query
stars: 50618
docs: https://tanstack.com/query/latest/docs/framework/react/overview
domain: frontend
category: state-data
description: 서버 상태 캐싱·동기화 라이브러리. 로딩/에러/재시도/무효화를 선언적으로 처리한다.
pricing: oss
tags: [data-fetching, cache]
languages: [typescript]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
TanStack Query는 서버에서 가져온 데이터(서버 상태)를 키 기반 캐시에 저장하고, 중복 요청 제거·백그라운드 재조회·재시도·무효화를 대신 처리하는 비동기 상태 관리 라이브러리다. 데이터를 가져오는 방법(fetch, axios, GraphQL 클라이언트)은 정하지 않고 `queryFn`이 반환하는 Promise만 관리한다. 이 문서는 **v5** React 어댑터 기준이다(npm `@tanstack/react-query` `latest` 5.108.0).

- 같은 코어 위에 Vue, Solid, Svelte, Angular 어댑터가 있다.
- 클라이언트 전용 UI 상태(모달 열림 등)는 범위가 아니다. 그런 상태는 컴포넌트 상태나 별도 상태 라이브러리로 관리한다.

## 설치
React 18 이상이 필요하다.

```bash
npm install @tanstack/react-query
npm install -D @tanstack/eslint-plugin-query          # 권장 린트 규칙
npm install @tanstack/react-query-devtools            # 선택: 캐시 확인 도구
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `QueryClient` / `QueryClientProvider` | 캐시를 가진 클라이언트를 앱 최상위에서 한 번 만들어 제공 |
| `queryKey` | 캐시 식별자 배열. `['todos', { page }]`처럼 queryFn이 쓰는 변수를 모두 포함 |
| `useQuery({ queryKey, queryFn })` | 조회. `data`, `error`, `status`, `isPending`, `isFetching`, `refetch` 반환 |
| `status` | `pending` / `error` / `success`. `isFetching`은 백그라운드 재조회 중에도 true |
| `staleTime` | 데이터를 신선하다고 볼 시간. 기본 `0`이라 마운트·포커스 때 다시 조회 |
| `gcTime` | 쓰지 않는 캐시를 지우기까지 시간. 기본 5분 |
| 재시도·포커스 | 기본으로 실패 시 3번 재시도, 창 포커스 시 stale 쿼리 재조회 |
| `useMutation({ mutationFn })` | 생성·수정·삭제. `mutate()`로 실행, `onSuccess`·`onError`·`onSettled` 콜백 |
| `invalidateQueries({ queryKey })` | 키 접두사가 맞는 쿼리를 stale 처리하고 화면에 있으면 재조회 |
| `queryOptions()` | 키와 함수를 묶어 재사용·타입 추론을 돕는 헬퍼 |
| `useSuspenseQuery` / `useInfiniteQuery` | Suspense 연동 / 페이지 단위 무한 스크롤 |

## 기본 사용법
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Todo = { id: number; title: string };
const getTodos = (): Promise<Todo[]> => fetch('/api/todos').then((r) => r.json());
const postTodo = (title: string) => fetch('/api/todos', { method: 'POST', body: JSON.stringify({ title }) });

function Todos() {
  const qc = useQueryClient();
  const todos = useQuery({ queryKey: ['todos'], queryFn: getTodos });
  const add = useMutation({ mutationFn: postTodo, onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }) });

  if (todos.isPending) return <p>불러오는 중…</p>;
  if (todos.isError) return <p>오류: {todos.error.message}</p>;
  return (
    <>
      <button onClick={() => add.mutate('새 할 일')} disabled={add.isPending}>추가</button>
      <ul>{todos.data.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
    </>
  );
}
```

앱 최상위에서 `new QueryClient()`를 한 번 만들고 `<QueryClientProvider client={queryClient}><Todos /></QueryClientProvider>`로 감싼다.

## 자주 쓰는 패턴
- **`fetch`는 HTTP 오류를 던지지 않는다.** `queryFn`에서 `if (!res.ok) throw new Error(...)`를 직접 해야 `error` 상태로 간다.
- **쿼리 옵션 팩토리.** `const todoQuery = (id) => queryOptions({ queryKey: ['todo', id], queryFn: ... })`로 모아 두고 `useQuery(todoQuery(id))`, `prefetchQuery(todoQuery(id))`에서 재사용한다.
- **조건부 조회.** 선행 값이 없을 때는 `enabled: !!userId`로 실행을 막는다.
- **신선도 조정.** 자주 안 바뀌는 데이터는 `staleTime: 60_000`처럼 늘려 불필요한 재조회를 줄인다. 전역 기본값은 `new QueryClient({ defaultOptions: { queries: { staleTime } } })`.
- **낙관적 업데이트.** `onMutate`에서 `setQueryData`로 캐시를 먼저 바꾸고, 실패하면 이전 값으로 되돌린 뒤 `onSettled`에서 무효화한다.

## 언제 쓰나 / 피할 때
- 쓸 때: REST·GraphQL API 데이터를 여러 화면에서 공유하고 캐시·재조회·로딩 상태를 일관되게 다뤄야 하는 SPA. [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/)·[Solid](/develop-wiki/frontend/framework/solid/)·[Svelte](/develop-wiki/frontend/framework/svelte/)·[Angular](/develop-wiki/frontend/framework/angular/) 공통.
- 피할 때(대안): 데이터 로딩을 프레임워크 로더·서버 컴포넌트가 이미 맡는 구조라면 중복일 수 있다. 서버 요청이 거의 없는 앱, 순수 클라이언트 상태만 있는 앱에는 과하다.

## 공식 문서
- [개요](https://tanstack.com/query/latest/docs/framework/react/overview) · [설치](https://tanstack.com/query/latest/docs/framework/react/installation) · [빠른 시작](https://tanstack.com/query/latest/docs/framework/react/quick-start)
- [중요 기본값](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) · [`useQuery` 레퍼런스](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
