---
name: Testing Library
url: https://testing-library.com
docs: https://testing-library.com/docs/
repo: https://github.com/testing-library/react-testing-library
stars: 19685
domain: frontend
category: testing
description: 사용자가 화면을 보는 방식(역할·레이블·텍스트)으로 요소를 찾아 컴포넌트를 테스트하는 라이브러리 모음. React·Vue·Svelte 등 어댑터가 있다.
pricing: oss
tags: [component-test, dom, react, accessibility]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Testing Library는 컴포넌트를 렌더링한 뒤 내부 상태나 구현 세부가 아니라 **사용자에게 보이는 결과**(역할, 접근 가능한 이름, 레이블, 텍스트)로 요소를 찾아 검증하도록 돕는 도구 모음이다. 핵심인 `@testing-library/dom` 위에 React·Vue·Svelte·Angular 어댑터가 있고, 실제 사용자 입력을 흉내 내는 `user-event`, DOM 단언을 추가하는 `jest-dom`이 함께 쓰인다. 테스트 러너가 아니므로 [Vitest](/develop-wiki/frontend/testing/vitest/)나 [Jest](/develop-wiki/frontend/testing/jest/) 위에서 쓴다. 이 문서는 React 어댑터 기준이다(npm `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/user-event` 14.6.12, `@testing-library/jest-dom` 7.0.1).

## 설치
React 18·19를 지원하며, v16부터 `@testing-library/dom`을 peer dependency로 직접 설치해야 한다.

```bash
npm install -D @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```

Vitest라면 `vitest.setup.ts`에 `import '@testing-library/jest-dom/vitest'`를 두고 `environment: 'jsdom'`으로 설정한다. jest-dom 7은 Node.js 22 이상이 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `render(<C />)` | 컴포넌트를 `document.body`에 렌더링 |
| `screen` | 문서 전체 대상 쿼리 모음 |
| `getBy*` / `queryBy*` / `findBy*` | 없으면 예외 / `null` 반환 / 나타날 때까지 기다리는 Promise |
| `*AllBy*` | 여러 요소 반환 |
| 쿼리 우선순위 | `ByRole` → `ByLabelText` → `ByPlaceholderText` → `ByText` → … → `ByTestId`(마지막 수단) |
| `userEvent.setup()` | 클릭·타이핑을 실제 브라우저 이벤트 순서대로 재현 (`fireEvent`보다 권장) |
| jest-dom matcher | `toBeInTheDocument`, `toBeDisabled`, `toHaveValue`, `toHaveAccessibleName` 등 |
| `waitFor` | 비동기 상태 변화가 단언을 만족할 때까지 재시도 |

## 기본 사용법
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import { LoginForm } from './LoginForm';

test('이메일을 입력하면 로그인 버튼이 활성화된다', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  const button = screen.getByRole('button', { name: '로그인' });
  expect(button).toBeDisabled();

  await user.type(screen.getByLabelText('이메일'), 'user@example.com');
  expect(button).toBeEnabled();

  await user.click(button);
  expect(await screen.findByText('환영합니다')).toBeInTheDocument();
});
```

## 자주 쓰는 패턴
- **역할로 찾기.** `getByRole('heading', { name: '주문 내역' })`처럼 찾으면 접근성 트리가 맞는지도 함께 검증된다. 못 찾으면 마크업의 접근성 문제일 가능성이 크다.
- **비동기는 `findBy*`.** 데이터 로딩 후 나타나는 요소는 `await screen.findBy...`로 기다린다. `waitFor` 안에서는 부수 효과 없이 단언만 둔다.
- **Provider 감싸기.** 라우터·쿼리 클라이언트·테마가 필요하면 `render(ui, { wrapper: AppProviders })`를 쓰는 커스텀 `render`를 만든다.
- **네트워크는 MSW로.** fetch를 직접 모킹하기보다 [MSW](/develop-wiki/frontend/testing/msw/) 핸들러로 API 응답을 준다.
- **디버깅.** `screen.debug()`로 현재 DOM을 출력하고, `logRoles(container)`로 역할 목록을 본다.

## 언제 쓰나 / 피할 때
- 쓸 때: React·Vue·Svelte 컴포넌트를 사용자 관점으로 테스트하고, 리팩터링해도 깨지지 않는 테스트를 원할 때.
- 피할 때(대안): 레이아웃·실제 브라우저 동작(스크롤, CSS 적용, 여러 페이지 이동)이 중요하면 [Playwright](/develop-wiki/frontend/testing/playwright/)·[Cypress](/develop-wiki/frontend/testing/cypress/)나 Vitest Browser Mode. 순수 함수는 Testing Library 없이 테스트 러너만으로 충분하다.

## 공식 문서
- [소개](https://testing-library.com/docs/) · [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) · [쿼리 우선순위](https://testing-library.com/docs/queries/about#priority)
- [user-event](https://testing-library.com/docs/user-event/intro) · [jest-dom](https://github.com/testing-library/jest-dom) · [자주 하는 실수(Kent C. Dodds)](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
