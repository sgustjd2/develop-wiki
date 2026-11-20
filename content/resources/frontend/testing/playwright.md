---
name: Playwright
url: https://playwright.dev
repo: https://github.com/microsoft/playwright
stars: 100670
docs: https://playwright.dev/docs/intro
domain: frontend
category: testing
description: Chromium·Firefox·WebKit을 한 API로 다루는 E2E 테스트 프레임워크.
pricing: oss
tags: [e2e, browser]
languages: [typescript, python, java, csharp]
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Playwright는 Chromium, Firefox, WebKit을 같은 API로 자동 조작하는 브라우저 자동화 라이브러리이자, Node.js용 테스트 러너(`@playwright/test`)다. 요소가 조작 가능해질 때까지 자동으로 기다리고, 테스트마다 격리된 브라우저 컨텍스트를 만들어 상태가 섞이지 않게 한다. 이 문서는 Node.js 테스트 러너 **1.65** 기준이다(npm `@playwright/test` `latest` 1.65.1). Python·Java·.NET 바인딩도 같은 개념을 쓴다.

- 단위·컴포넌트 테스트 도구(Vitest, Jest)와 달리 실제 브라우저에서 사용자 흐름 전체를 검증하는 E2E 용도가 중심이다.

## 설치
대화형 초기화(TypeScript/JS, 테스트 폴더, GitHub Actions 워크플로, 브라우저 설치 여부를 묻는다):

```bash
npm init playwright@latest
```

`playwright.config.ts`, `tests/example.spec.ts`가 생기고 의존성이 추가된다. Node.js는 22.x·24.x·26.x 최신 버전을 지원한다.

```bash
npx playwright test              # 헤드리스로 전체 실행
npx playwright test --ui         # UI 모드 (감시 모드, 단계별 확인)
npx playwright show-report       # HTML 리포트 열기
npx playwright codegen <url>     # 브라우저 조작을 테스트 코드로 기록
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `test` / `expect` | `@playwright/test`에서 import. `test.describe`로 묶고 `beforeEach` 등 훅 사용 |
| 픽스처 | 테스트 인자로 `page`, `context`, `browser`, `request`를 받음. 커스텀 픽스처는 `test.extend` |
| 격리 | 테스트마다 새 브라우저 컨텍스트(쿠키·스토리지 분리) |
| 로케이터 | `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, `getByTestId`. 사용자 관점 선택자 권장 |
| 자동 대기 | `click()`, `fill()` 전에 보임·활성·안정 상태를 기다림 |
| 웹 우선 단언 | `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL` 등은 조건이 맞을 때까지 재시도 |
| 프로젝트 | 설정의 `projects`로 브라우저·기기별 실행 (`devices['Desktop Safari']` 등 내장 기기 프리셋) |
| 트레이스 | 실패 테스트의 DOM 스냅샷·네트워크·콘솔을 기록해 Trace Viewer로 재생 |
| 병렬 실행 | 파일 단위로 워커 프로세스에 분산, `fullyParallel`로 테스트 단위 병렬 |

## 기본 사용법
`tests/login.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('로그인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('올바른 정보로 로그인하면 대시보드로 이동', async ({ page }) => {
    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('test-password');
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
  });
});
```

## 자주 쓰는 패턴
- **개발 서버 자동 실행.** 설정의 `webServer: { command: 'npm run dev', url: 'http://localhost:3000' }`와 `use: { baseURL }`을 두면 `page.goto('/login')`처럼 상대 경로로 쓸 수 있다.
- **로그인 한 번만.** setup 프로젝트에서 로그인 후 `page.context().storageState({ path })`로 저장하고, 다른 프로젝트는 `use: { storageState }`로 재사용한다.
- **네트워크 모킹.** `await page.route('**/api/items', (route) => route.fulfill({ json: [...] }))`로 백엔드 없이 화면을 검증한다.
- **API 테스트.** `request` 픽스처로 HTTP 요청을 보내 테스트 데이터를 준비하거나 API 자체를 검증한다.
- **CI 디버깅.** `trace: 'on-first-retry'`와 `retries`를 설정해 실패 시 트레이스를 남기고 `npx playwright show-trace`로 연다.

## 언제 쓰나 / 피할 때
- 쓸 때: 로그인·결제 같은 핵심 사용자 흐름을 여러 브라우저(특히 WebKit/Safari 계열 포함)에서 회귀 검증할 때, 스크린샷 비교·접근성 트리 기반 검사가 필요할 때.
- 피할 때(대안): 함수·컴포넌트 단위 로직은 Vitest·Jest 같은 단위 테스트가 빠르고 안정적이다. E2E는 핵심 흐름 위주로 수를 제한한다.
- 참고: [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/)·[Svelte](/develop-wiki/frontend/framework/svelte/) 등 프레임워크와 무관하게 결과 페이지를 대상으로 동작한다.

## 공식 문서
- [설치](https://playwright.dev/docs/intro) · [테스트 작성](https://playwright.dev/docs/writing-tests) · [로케이터](https://playwright.dev/docs/locators) · [인증](https://playwright.dev/docs/auth)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer) · [API 레퍼런스](https://playwright.dev/docs/api/class-playwright) · [릴리스 노트](https://playwright.dev/docs/release-notes)
