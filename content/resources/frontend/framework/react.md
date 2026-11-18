---
name: React
url: https://react.dev
repo: https://github.com/react/react
docs: https://react.dev/learn
domain: frontend
category: framework
description: 컴포넌트 기반 UI 라이브러리. 서버 컴포넌트와 Actions를 지원하며, 생태계가 넓어 SPA부터 메타 프레임워크 기반 앱까지 두루 쓴다.
pricing: oss
tags: [ui, component, jsx]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
React는 UI를 컴포넌트 함수로 나누고, 상태가 바뀌면 컴포넌트를 다시 실행해 화면을 맞추는 선언형 UI 라이브러리다. 렌더링 대상(DOM, 네이티브)과 분리된 코어 위에 `react-dom`·React Native 같은 렌더러가 붙는 구조다. 이 문서는 **React 19.3** 기준이다(npm `latest` 19.3.1).

- 라우팅·데이터 로딩·SSR은 React 자체가 아니라 프레임워크(Next.js, React Router 등)가 맡는다.
- 같은 API를 더 작은 런타임으로 제공하는 대안은 [Preact](/develop-wiki/frontend/framework/preact/), 가상 DOM 없이 시그널로 갱신하는 대안은 [Solid](/develop-wiki/frontend/framework/solid/)다.

## 설치
공식 문서는 프레임워크로 시작하기를 권한다.

```bash
npx create-next-app@latest          # Next.js (App Router)
npx create-react-router@latest      # React Router v7
```

빌드 도구만으로 시작하려면 Vite 템플릿을 쓴다.

```bash
npm create vite@latest my-app -- --template react-ts
```

React Compiler(자동 메모이제이션)는 별도 Babel 플러그인으로 켠다.

```bash
npm install -D babel-plugin-react-compiler@latest
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 컴포넌트 | JSX를 반환하는 함수. 이름은 대문자로 시작 |
| props | 부모가 넘기는 읽기 전용 입력. 19부터 `ref`도 일반 prop으로 받는다 |
| `useState` / `useReducer` | 컴포넌트 지역 상태. 변경하면 다시 렌더링 |
| `useEffect` | 렌더링 후 외부 시스템(구독, 타이머)과 동기화 |
| `useEffectEvent` | Effect 안에서 최신 props·state를 읽되 의존성에서는 빠지는 함수 (19.2) |
| Context | 트리 깊은 곳까지 값을 전달. 19부터 `<Ctx value={...}>`로 바로 렌더 |
| Transition | `startTransition`/`useTransition`으로 급하지 않은 업데이트 표시 |
| Actions | 폼 `action`에 async 함수를 넘기고 `useActionState`·`useFormStatus`로 상태 추적 |
| `use` | 렌더 중 Promise·Context를 읽는 API. Suspense와 함께 동작 |
| Server Components | 서버에서만 실행되는 컴포넌트. `'use client'`로 클라이언트 경계를 표시 |
| `<Activity>` | UI를 숨겨도 상태를 유지 (`mode="hidden"`, 19.2) |
| `<ViewTransition>` | Transition으로 바뀌는 UI에 View Transition 애니메이션 적용 (19.3 안정화) |

## 기본 사용법
상태와 이벤트를 가진 최소 컴포넌트.

```tsx
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      클릭 {count}회
    </button>
  );
}

createRoot(document.getElementById('root')!).render(<Counter />);
```

Actions로 폼 제출 상태를 다루는 예.

```tsx
import { useActionState } from 'react';

async function save(_prev: string, form: FormData) {
  await fetch('/api/name', { method: 'POST', body: form });
  return `저장됨: ${form.get('name')}`;
}

export function NameForm() {
  const [message, action, isPending] = useActionState(save, '');
  return (
    <form action={action}>
      <input name="name" />
      <button disabled={isPending}>저장</button>
      <p>{message}</p>
    </form>
  );
}
```

## 자주 쓰는 패턴
- **파생 값은 상태로 두지 않는다.** props·state에서 계산 가능한 값은 렌더 중에 계산하고, 비싸면 `useMemo` 또는 React Compiler에 맡긴다.
- **리스트에는 안정적인 `key`.** 배열 인덱스 대신 데이터 id를 써야 재정렬 시 상태가 섞이지 않는다.
- **서버 데이터는 전용 라이브러리로.** `useEffect`에서 직접 fetch하기보다 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)나 프레임워크 로더를 쓴다.
- **Effect가 필요한지 먼저 확인.** 이벤트 처리는 핸들러에, 외부 시스템 동기화만 `useEffect`에 둔다.
- **클라이언트 전용 코드 분리 (19.3).** `use(browser())`로 서버 렌더링에서 빼고 가까운 Suspense fallback을 보여 준다(`browser`는 `react-dom`에서 import).

```tsx
<Suspense fallback={<Spinner />}>
  <Comments postId={id} />   {/* 내부에서 use(promise) */}
</Suspense>
```

## 언제 쓰나 / 피할 때
- 쓸 때: 팀 규모가 크고 채용·라이브러리 생태계가 중요할 때, Next.js·React Native 등 프레임워크와 함께 웹·앱을 함께 만들 때.
- 피할 때(대안): 정적 콘텐츠 위주 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/), 서버 렌더링 페이지에 약간의 상호작용만 필요하면 [htmx](/develop-wiki/frontend/framework/htmx/)·[Alpine.js](/develop-wiki/frontend/framework/alpinejs/), 번들 크기가 최우선이면 [Preact](/develop-wiki/frontend/framework/preact/)·[Svelte](/develop-wiki/frontend/framework/svelte/).

## 공식 문서
- [학습 가이드](https://react.dev/learn) · [API 레퍼런스](https://react.dev/reference/react) · [앱 만들기](https://react.dev/learn/creating-a-react-app)
- [React Compiler 설치](https://react.dev/learn/react-compiler/installation) · [React 19.3 릴리스 노트](https://react.dev/blog/2026/09/09/react-19-3)
