---
name: Jest
url: https://jestjs.io
docs: https://jestjs.io/docs/getting-started
repo: https://github.com/jestjs/jest
stars: 45486
domain: frontend
category: testing
description: 테스트 러너·단언·모킹·스냅샷·커버리지를 한 패키지로 제공하는 JavaScript 테스트 프레임워크. Node 서버와 React 앱 단위 테스트에 오래 쓰여 왔다.
pricing: oss
tags: [unit-test, test-runner, mocking]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Jest는 테스트 실행, `expect` 단언, 함수·모듈 모킹, 스냅샷, 코드 커버리지를 별도 조합 없이 제공하는 테스트 프레임워크다. Meta에서 시작해 현재는 OpenJS Foundation 프로젝트이며, React Native 기본 테스트 도구이고 많은 기존 프로젝트의 표준이다. 테스트 파일마다 격리된 환경에서 병렬로 실행한다. 이 문서는 **Jest 30** 기준이다(npm `jest` `latest` 30.5.2, Node.js 18.14 이상).

- API 형태는 Vitest가 거의 그대로 따르고 있어 두 도구 사이 이전이 쉽다. 차이는 변환 파이프라인으로, Jest는 Babel·ts-jest 등 `transform` 설정으로 TS·JSX를 처리한다.

## 설치
```bash
npm install -D jest
# TypeScript: Babel로 변환(타입 검사 없음) 또는 ts-jest(타입 검사 포함) 중 선택
npm install -D @babel/preset-env @babel/preset-typescript
npm install -D jest-environment-jsdom   # DOM이 필요한 테스트
npm init jest@latest                    # 대화형으로 jest.config 생성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `test` / `describe` / `expect` | 전역으로 제공. 명시적 import는 `@jest/globals` |
| matcher | `toBe`, `toEqual`, `toThrow`, `toHaveBeenCalledWith`, `resolves`/`rejects` 등 |
| `jest.fn()` / `jest.spyOn()` | 목 함수와 기존 메서드 감시 |
| `jest.mock(path)` | 모듈 전체 모킹 (파일 상단으로 호이스팅) |
| 가짜 타이머 | `jest.useFakeTimers()` + `jest.advanceTimersByTime(ms)` |
| 스냅샷 | `toMatchSnapshot()` / `toMatchInlineSnapshot()` — 출력이 바뀌면 실패 |
| `testEnvironment` | `node`(기본) 또는 `jsdom` |
| `transform` | 파일을 변환할 도구 지정 (기본 `babel-jest`) |
| 커버리지 | `jest --coverage`, `coverageThreshold`로 최소 기준 강제 |

## 기본 사용법
```ts
// cart.test.ts
import { describe, test, expect, jest } from '@jest/globals';
import { checkout } from './cart';

describe('checkout', () => {
  test('결제 API에 합계를 보낸다', async () => {
    const pay = jest.fn(async (amount: number) => ({ ok: true, amount }));
    const result = await checkout([{ price: 3000 }, { price: 2000 }], pay);

    expect(pay).toHaveBeenCalledWith(5000);
    expect(result).toEqual({ ok: true, amount: 5000 });
  });

  test('빈 장바구니는 거부한다', async () => {
    await expect(checkout([], jest.fn(async () => ({ ok: true, amount: 0 })))).rejects.toThrow('비어');
  });
});
```

```bash
npx jest                 # 전체 실행
npx jest --watch         # 변경 감시
npx jest cart -t '합계'  # 파일·테스트 이름 필터
```

## 자주 쓰는 패턴
- **의존성 주입으로 모킹 줄이기.** 위 예제처럼 외부 호출 함수를 인자로 받으면 `jest.mock` 없이 `jest.fn()`만으로 테스트할 수 있다.
- **모듈 모킹.** `jest.mock('./api')` 후 `jest.mocked(api.getUser).mockResolvedValue(...)`로 타입이 붙은 목을 쓴다.
- **정리 자동화.** 설정에 `clearMocks: true` 또는 `restoreMocks: true`를 두어 테스트 간 상태 누수를 막는다.
- **React 컴포넌트.** `testEnvironment: 'jsdom'` + [Testing Library](/develop-wiki/frontend/testing/testing-library/) + `@testing-library/jest-dom` 조합.
- **스냅샷은 작게.** 큰 컴포넌트 트리 스냅샷은 리뷰가 어렵다. 의미 있는 출력(직렬화된 데이터, 오류 메시지)에만 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Jest로 구축된 프로젝트, React Native, Vite를 쓰지 않는 Node 백엔드·라이브러리.
- 피할 때(대안): Vite 기반 새 프로젝트나 ESM 중심 코드는 설정이 더 단순한 [Vitest](/develop-wiki/frontend/testing/vitest/). 실제 브라우저 흐름은 [Playwright](/develop-wiki/frontend/testing/playwright/).

## 공식 문서
- [시작하기](https://jestjs.io/docs/getting-started) · [설정](https://jestjs.io/docs/configuration) · [`expect`](https://jestjs.io/docs/expect)
- [목 함수](https://jestjs.io/docs/mock-functions) · [Jest 객체](https://jestjs.io/docs/jest-object) · [v29→30 업그레이드](https://jestjs.io/docs/upgrading-to-jest30)
