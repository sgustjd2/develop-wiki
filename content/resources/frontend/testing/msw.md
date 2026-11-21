---
name: Mock Service Worker
url: https://mswjs.io
docs: https://mswjs.io/docs/
repo: https://github.com/mswjs/msw
stars: 18358
domain: frontend
category: testing
description: 네트워크 수준에서 요청을 가로채 가짜 응답을 주는 API 모킹 라이브러리. 같은 핸들러를 브라우저 개발·Node 테스트·Storybook에서 재사용한다.
pricing: oss
tags: [mocking, api-mock, service-worker]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Mock Service Worker(MSW)는 `fetch`나 axios 같은 클라이언트를 모킹하는 대신, 실제로 나가는 네트워크 요청을 가로채 정의한 응답을 돌려주는 API 모킹 라이브러리다. 브라우저에서는 Service Worker로, Node.js에서는 요청 모듈 인터셉터로 동작하므로 앱 코드를 바꾸지 않고 같은 요청 핸들러를 개발 서버·단위 테스트·Storybook·E2E에서 공유한다. REST(HTTP), GraphQL, WebSocket, Server-Sent Events를 지원한다. 이 문서는 **MSW 3** 기준이다(npm `msw` `latest` 3.0.7).

- v3 주요 변경: ESM 전용, Node.js 22.12 이상, TypeScript 5.9 이상, GraphQL 핸들러는 `msw/graphql`에서 import, `onUnhandledRequest` 옵션 이름이 `onUnhandledFrame`으로 변경, `worker.stop()`이 Promise 반환, 공식 Vite 플러그인(`msw/vite`) 추가, `msw/native` 제거(`@msw/react-native`로 이동).

## 설치
```bash
npm install -D msw
npx msw init public --save   # 브라우저용 Service Worker 스크립트를 public 폴더에 생성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 요청 핸들러 | `http.get(url, resolver)`처럼 메서드·경로와 응답 함수를 묶은 것 |
| `HttpResponse` | `HttpResponse.json(body, { status })`, `.text()`, `.error()` 등 응답 생성 |
| 경로 매개변수 | `/api/users/:id` → resolver의 `params.id` |
| `setupServer` (`msw/node`) | Node 테스트 환경용. `listen()` / `resetHandlers()` / `close()` |
| `setupWorker` (`msw/browser`) | 브라우저 개발 환경용. `await worker.start()` |
| `server.use(...)` | 특정 테스트에서만 핸들러를 덮어쓰기(런타임 핸들러) |
| `passthrough()` / `bypass()` | 요청을 실제 네트워크로 통과 / 모킹을 우회해 원본 요청 |
| `delay()` | 응답 지연 (`msw/utils`에서 개별 import 가능) |

## 기본 사용법
```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => HttpResponse.json({ id: params.id, name: '홍길동' })),
  http.post('/api/todos', async ({ request }) => {
    const body = (await request.json()) as { title: string };
    return HttpResponse.json({ id: 1, ...body }, { status: 201 });
  }),
];
```

```ts
// vitest.setup.ts (setupFiles에 등록)
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './src/mocks/handlers';

export const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 자주 쓰는 패턴
- **오류 경로 테스트.** 테스트 안에서 `server.use(http.get('/api/users/:id', () => HttpResponse.json({ message: 'x' }, { status: 500 })))`로 그 테스트만 실패 응답을 준다. `resetHandlers()`가 원래대로 돌려 놓는다.
- **개발 중 백엔드 없이 화면 만들기.** 개발 모드에서만 `const { worker } = await import('./mocks/browser'); await worker.start()`를 실행한 뒤 앱을 렌더링한다. Vite라면 v3의 `msw/vite` 플러그인으로 이 연결을 자동화할 수 있다.
- **처리되지 않은 요청 감지.** `server.listen({ onUnhandledFrame: 'error' })`로 핸들러가 없는 요청을 테스트 실패로 만든다.
- **Storybook·Playwright와 공유.** 같은 `handlers` 배열을 [Storybook](/develop-wiki/frontend/testing/storybook/) 애드온, [Playwright](/develop-wiki/frontend/testing/playwright/) 연동에서 재사용한다.
- **가짜 타이머 주의.** v3부터 `setTimeout` 패치를 하지 않으므로 `delay()`를 쓴 응답은 가짜 타이머를 직접 진행시켜야 끝난다.

## 언제 쓰나 / 피할 때
- 쓸 때: [Vitest](/develop-wiki/frontend/testing/vitest/)·[Jest](/develop-wiki/frontend/testing/jest/)+[Testing Library](/develop-wiki/frontend/testing/testing-library/) 컴포넌트 테스트에서 실제 데이터 패칭 코드를 그대로 실행하고 싶을 때, 백엔드보다 프런트엔드 개발이 먼저 진행될 때.
- 피할 때(대안): 함수 단위 테스트에서 의존성을 인자로 주입할 수 있으면 `vi.fn()` 목이 더 단순하다. 실제 백엔드와의 계약 검증은 통합·E2E 테스트로 따로 한다.

## 공식 문서
- [문서 홈](https://mswjs.io/docs/) · [빠른 시작](https://mswjs.io/docs/quick-start) · [브라우저 연동](https://mswjs.io/docs/integrations/browser) · [Node.js 연동](https://mswjs.io/docs/integrations/node)
- [v3.0.0 릴리스 노트](https://github.com/mswjs/msw/releases/tag/v3.0.0)
