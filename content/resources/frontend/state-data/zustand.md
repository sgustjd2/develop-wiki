---
name: Zustand
url: https://zustand.docs.pmnd.rs
docs: https://zustand.docs.pmnd.rs/learn/getting-started/introduction
repo: https://github.com/pmndrs/zustand
stars: 59009
domain: frontend
category: state-data
description: 훅 하나로 전역 상태 스토어를 만드는 작은 React 상태 관리 라이브러리. Provider 없이 필요한 조각만 구독한다.
pricing: oss
tags: [state-management, react, store]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Zustand는 `create()`로 상태와 변경 함수를 담은 스토어를 만들면 그 자체가 React 훅이 되는 상태 관리 라이브러리다. Provider로 앱을 감쌀 필요가 없고, 컴포넌트는 셀렉터로 고른 값이 바뀔 때만 다시 렌더링된다. 보일러플레이트가 적어 Redux보다 가볍게 전역 클라이언트 상태를 다룰 때 많이 쓴다. 이 문서는 **v5** 기준이다(npm `zustand` `latest` 5.1.0, React 18 이상).

- 서버에서 가져온 데이터 캐시는 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)에 맡기고, Zustand는 UI·세션 같은 클라이언트 상태에 쓰는 조합이 흔하다.

## 설치
```bash
npm install zustand
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `create<T>()(fn)` | 스토어 훅 생성. `fn(set, get)`이 초기 상태와 액션을 담은 객체를 반환 (TS에서는 커리 형태 `create<T>()(...)`) |
| `set(partial)` | 상태를 얕게 병합. `set((s) => ({ n: s.n + 1 }))`처럼 이전 상태 기반 갱신 |
| 셀렉터 | `useStore((s) => s.count)` — 고른 값이 `Object.is`로 바뀔 때만 리렌더 |
| `useShallow` | 객체·배열을 고를 때 얕은 비교 (`zustand/react/shallow`) |
| `getState` / `setState` / `subscribe` | React 밖(이벤트 핸들러, 유틸 함수)에서 스토어 접근 |
| 미들웨어 | `persist`(스토리지 저장), `devtools`(Redux DevTools), `immer`, `subscribeWithSelector` (`zustand/middleware`) |
| `createStore` | React 없이 쓰는 바닐라 스토어 (`zustand/vanilla`) |

## 기본 사용법
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartState = {
  items: string[];
  add: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (id) => set((s) => ({ items: [...s.items, id] })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart' }, // localStorage 키
  ),
);

function CartBadge() {
  const count = useCart((s) => s.items.length);
  return <span>{count}</span>;
}
```

## 자주 쓰는 패턴
- **필요한 값만 구독.** `const { items, add } = useCart()`처럼 전체를 꺼내면 모든 변경에 리렌더된다. 여러 값은 `useCart(useShallow((s) => ({ items: s.items, add: s.add })))`.
- **액션을 스토어 안에.** 변경 로직을 스토어 함수로 두면 컴포넌트는 `useCart((s) => s.add)`만 호출한다.
- **스토어 쪼개기.** 큰 스토어는 기능별 "slice" 함수로 나눠 `create()(( ...a) => ({ ...createA(...a), ...createB(...a) }))`로 합친다.
- **SSR 주의.** Next.js 같은 서버 렌더링에서는 모듈 전역 스토어가 요청 간에 공유될 수 있다. 요청별로 `createStore`를 만들어 Context로 내려주는 패턴을 쓴다.
- **persist 하이드레이션.** v5.1부터 `persist.rehydrate()`가 Promise를 반환해 복원 완료를 `await`할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 컴포넌트가 공유하는 클라이언트 상태(장바구니, 필터, 모달, 사용자 설정)를 간단히 전역으로 두고 싶을 때.
- 피할 때(대안): 서버 데이터 캐시는 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)·[SWR](/develop-wiki/frontend/state-data/swr/). 파생 상태가 많은 원자 단위 모델은 [Jotai](/develop-wiki/frontend/state-data/jotai/), 엄격한 액션 기록과 대규모 팀 규칙이 필요하면 [Redux Toolkit](/develop-wiki/frontend/state-data/redux-toolkit/).

## 공식 문서
- [소개](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) · [상태 갱신](https://zustand.docs.pmnd.rs/learn/guides/updating-state) · [TypeScript 가이드](https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript)
- [persist 미들웨어](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) · [릴리스](https://github.com/pmndrs/zustand/releases)
