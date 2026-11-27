---
name: Vitest
url: https://vitest.dev
docs: https://vitest.dev/guide/
repo: https://github.com/vitest-dev/vitest
stars: 17498
domain: frontend
category: testing
description: Vite 설정과 변환 파이프라인을 그대로 쓰는 유닛·컴포넌트 테스트 러너. Jest와 비슷한 API에 ESM·TypeScript를 기본 지원한다.
pricing: oss
tags: [unit-test, test-runner, vite]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Vitest는 Vite 기반 테스트 러너로, 앱이 쓰는 `vite.config`의 플러그인·별칭·변환을 테스트에서도 그대로 재사용한다. `describe`/`test`/`expect`, 모킹(`vi`), 스냅샷, 커버리지 등 Jest와 거의 같은 API를 제공하면서 ESM·TypeScript·JSX를 별도 설정 없이 처리하고, 변경된 파일과 관련된 테스트만 다시 도는 감시 모드가 기본이다. 이 문서는 **Vitest 5** 기준이다(npm `vitest` `latest` 5.1.1). v5는 Node.js 22.12 이상과 Vite 6.4 이상을 요구한다.

- [Playwright](/develop-wiki/frontend/testing/playwright/)가 실제 브라우저에서 사용자 흐름 전체를 검증한다면, Vitest는 함수·훅·컴포넌트 단위의 빠른 테스트를 맡는다. Browser Mode로 컴포넌트를 실제 브라우저에서 돌릴 수도 있다.

## 설치
```bash
npm install -D vitest
npm install -D jsdom   # DOM이 필요한 컴포넌트 테스트용 (또는 happy-dom)
```

`package.json`에 `"test": "vitest"`를 추가한다.

```bash
npx vitest                 # 감시 모드
npx vitest run             # 한 번 실행 (CI)
npx vitest run --coverage  # 커버리지 (@vitest/coverage-v8 필요)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 테스트 파일 | 이름에 `.test.` 또는 `.spec.`이 들어간 파일 |
| `test` / `describe` / `expect` | `vitest`에서 import. `globals: true`면 import 없이 사용 |
| `vi` | 모킹 도구. `vi.fn()`, `vi.spyOn()`, `vi.mock(path)`, `vi.useFakeTimers()` |
| 환경 | 기본 `node`. `environment: 'jsdom'`/`'happy-dom'`으로 DOM 제공 |
| `setupFiles` | 모든 테스트 전에 실행할 파일 (matcher 확장, MSW 서버 시작 등) |
| 프로젝트 | `projects` 설정으로 단위(node)·컴포넌트(jsdom/브라우저) 테스트를 한 설정에서 분리 |
| Browser Mode | `@vitest/browser-playwright` 등 프로바이더로 실제 브라우저에서 테스트 실행 |
| `test.concurrent` | 파일 안 테스트 동시 실행 (v5에서 `sequential` 옵션은 제거) |

## 기본 사용법
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] },
});
```

```ts
// price.test.ts
import { describe, test, expect, vi } from 'vitest';
import { formatPrice, fetchPrice } from './price';

describe('formatPrice', () => {
  test('천 단위 구분 기호를 붙인다', () => {
    expect(formatPrice(12000)).toBe('12,000원');
  });
});

test('API 결과를 사용한다', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ price: 500 }));
  await expect(fetchPrice('a1')).resolves.toBe(500);
});
```

## 자주 쓰는 패턴
- **Testing Library와 조합.** `@testing-library/react`로 렌더링하고, `vitest.setup.ts`에서 `import '@testing-library/jest-dom/vitest'`로 `toBeInTheDocument` 같은 DOM matcher를 추가한다.
- **모듈 모킹.** `vi.mock('./api', () => ({ getUser: vi.fn() }))`는 파일 최상단으로 끌어올려진다. v5부터 최상위가 아닌 곳에서 호출하면 오류가 난다.
- **매 테스트 정리.** 설정의 `restoreMocks: true` 또는 `afterEach(() => vi.restoreAllMocks())`로 모킹이 다음 테스트로 새지 않게 한다.
- **Jest 이전.** API가 거의 같아 `jest.fn` → `vi.fn` 치환과 설정 이전으로 대부분 옮겨진다. 공식 마이그레이션 가이드를 따른다.
- **타입 테스트.** `*.test-d.ts` 파일과 `expectTypeOf`로 타입 수준 단언을 검사한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vite·Astro·SvelteKit·Nuxt 등 Vite 기반 프로젝트, ESM·TypeScript 프로젝트의 단위·컴포넌트 테스트.
- 피할 때(대안): Vite를 쓰지 않는 기존 대형 Jest 코드베이스는 [Jest](/develop-wiki/frontend/testing/jest/)를 유지하는 편이 비용이 적을 수 있다. 여러 페이지에 걸친 사용자 흐름은 [Playwright](/develop-wiki/frontend/testing/playwright/).

## 공식 문서
- [시작하기](https://vitest.dev/guide/) · [설정 레퍼런스](https://vitest.dev/config/) · [모킹](https://vitest.dev/guide/mocking) · [테스트 환경](https://vitest.dev/guide/environment)
- [Browser Mode](https://vitest.dev/guide/browser/) · [Jest에서 이전](https://vitest.dev/guide/migration) · [Vitest 5 발표](https://vitest.dev/blog/vitest-5.html)
