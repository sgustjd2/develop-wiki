---
name: SWR
url: https://swr.vercel.app
docs: https://swr.vercel.app/docs/getting-started
repo: https://github.com/vercel/swr
stars: 32497
domain: frontend
category: state-data
description: Vercel이 만든 React 데이터 패칭 훅. 캐시를 먼저 보여 주고 백그라운드에서 다시 검증하는 stale-while-revalidate 방식으로 동작한다.
pricing: oss
tags: [data-fetching, cache, react]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SWR은 키(보통 API URL)와 fetcher 함수를 받아 데이터를 가져오고 캐시하는 React 훅 라이브러리다. 이름은 HTTP 캐시 무효화 전략 stale-while-revalidate에서 왔으며, 캐시된 값을 먼저 반환한 뒤 다시 요청해 최신 값으로 바꾼다. 같은 키 요청은 하나로 합쳐지고, 탭 포커스·네트워크 재연결 때 자동으로 다시 검증한다. 이 문서는 **v2** 기준이다(npm `swr` `latest` 2.5.1).

- [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)와 같은 문제를 풀지만 API가 더 작고 React 전용이다. 문서 사이트에 한국어 번역이 있다.

## 설치
```bash
npm install swr
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `useSWR(key, fetcher, options)` | `data`, `error`, `isLoading`, `isValidating`, `mutate` 반환 |
| 키 | 캐시 식별자. 문자열·배열·함수 가능. `null`이면 요청하지 않음(조건부 요청) |
| fetcher | 키를 받아 Promise를 반환하는 함수. HTTP 라이브러리는 자유 |
| 재검증 | 마운트·포커스·재연결 시 자동 재요청. `refreshInterval`로 폴링 |
| `mutate` | 바운드(`useSWR`가 반환)·전역(`useSWRConfig().mutate`)으로 캐시 갱신·재검증 |
| `SWRConfig` | 하위 트리의 기본 fetcher·옵션 제공 |
| `useSWRMutation` | POST·PUT 같은 원격 변경을 수동 트리거 (`swr/mutation`) |
| `useSWRInfinite` | 페이지 단위 무한 로딩 (`swr/infinite`) |

## 기본 사용법
```tsx
import useSWR, { SWRConfig } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

function Profile({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR(`/api/users/${id}`, fetcher);
  if (error) return <p>불러오지 못했습니다.</p>;
  if (isLoading) return <p>불러오는 중…</p>;
  return <p>{data.name}님</p>;
}

export const App = () => (
  <SWRConfig value={{ fetcher }}><Profile id="1" /></SWRConfig>
);
```

## 자주 쓰는 패턴
- **커스텀 훅으로 감싸기.** `useUser(id)`처럼 `useSWR` 호출을 감싼 훅을 만들어 데이터 접근을 훅으로 모아 여러 컴포넌트에서 재사용한다.
- **의존 요청.** 선행 데이터가 없으면 키를 `null`로 두어 요청을 미룬다.
- **낙관적 업데이트.** `mutate(newData, { optimisticData, rollbackOnError: true })`로 화면을 먼저 바꾸고 실패 시 되돌린다.
- **변경 요청.** `const { trigger, isMutating } = useSWRMutation('/api/todos', sendRequest)`로 버튼 클릭 시 요청을 보낸다.
- **HTTP 오류 처리.** `fetch`는 4xx·5xx에서 예외를 던지지 않으므로 fetcher에서 직접 `throw`해야 `error`가 채워진다.

## 언제 쓰나 / 피할 때
- 쓸 때: React·Next.js 앱에서 읽기 위주 API 데이터를 간단한 API로 캐시하고 자동 재검증하고 싶을 때.
- 피할 때(대안): 변경 요청이 많고 쿼리 무효화·DevTools·여러 프레임워크 지원이 필요하면 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/). Redux를 이미 쓰고 있으면 RTK Query([Redux Toolkit](/develop-wiki/frontend/state-data/redux-toolkit/)).

## 공식 문서
- [시작하기](https://swr.vercel.app/docs/getting-started) · [한국어 문서](https://swr.vercel.app/ko/docs/getting-started) · [API](https://swr.vercel.app/docs/api)
- [Mutation](https://swr.vercel.app/docs/mutation) · [조건부 요청](https://swr.vercel.app/docs/conditional-fetching)
