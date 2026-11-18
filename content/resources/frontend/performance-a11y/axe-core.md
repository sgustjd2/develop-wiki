---
name: axe-core
url: https://www.deque.com/axe/
docs: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md
repo: https://github.com/dequelabs/axe-core
stars: 7849
domain: frontend
category: performance-a11y
description: DOM을 WCAG 규칙으로 검사해 접근성 위반을 찾는 Deque의 자동 접근성 검사 엔진. Playwright·Cypress·Storybook·Lighthouse 등에 내장돼 쓰인다.
pricing: oss
tags: [accessibility, wcag, a11y-testing]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
axe-core는 렌더링된 DOM을 받아 이미지 대체 텍스트 누락, 명도 대비 부족, 레이블 없는 입력, 잘못된 ARIA 사용 같은 접근성 문제를 규칙 기반으로 찾아내는 JavaScript 엔진이다. 오탐을 줄이는 것을 설계 원칙으로 삼아, 확실하지 않은 항목은 위반(`violations`)이 아니라 수동 확인 필요(`incomplete`)로 분리한다. Lighthouse 접근성 감사, Storybook a11y 애드온, Pa11y의 axe 러너 등 많은 도구가 이 엔진을 쓴다. 이 문서는 npm `axe-core` `latest` 4.14.1 기준이다(MPL-2.0).

- 자동 검사는 접근성 문제의 일부만 잡는다. 키보드 조작, 포커스 순서, 스크린 리더 낭독은 사람이 확인해야 한다.

## 설치
대부분은 테스트 도구용 통합 패키지로 쓴다.

```bash
npm install -D axe-core                 # 엔진 단독
npm install -D @axe-core/playwright     # Playwright 통합
npm install -D @axe-core/cli            # 명령줄 검사
npx @axe-core/cli https://example.com
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `axe.run(context?, options?)` | 문서(또는 일부 요소)를 검사해 결과 Promise 반환 |
| 결과 분류 | `violations`(위반), `passes`, `incomplete`(수동 확인 필요), `inapplicable` |
| 규칙(rule) | `color-contrast`, `image-alt`, `label`, `button-name` 등. 각 결과에 `helpUrl` 포함 |
| 태그 | `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, `best-practice` — 검사 범위 선택 |
| `impact` | `minor` / `moderate` / `serious` / `critical` |
| `nodes` | 위반한 요소의 선택자(`target`)와 HTML, 수정 안내 |
| context | `{ include, exclude }`로 검사 영역 한정 (서드파티 위젯 제외 등) |

## 기본 사용법
Playwright 테스트에서 페이지 전체를 WCAG 2.x AA 기준으로 검사:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('회원가입 페이지에 자동 검출 가능한 접근성 위반이 없다', async ({ page }) => {
  await page.goto('/signup');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .exclude('#third-party-chat')
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## 자주 쓰는 패턴
- **E2E에 붙이기.** 주요 페이지·모달을 연 상태에서 [Playwright](/develop-wiki/frontend/testing/playwright/) `AxeBuilder`나 `cypress-axe`로 검사해 회귀를 막는다.
- **컴포넌트 단위.** [Storybook](/develop-wiki/frontend/testing/storybook/) a11y 애드온이 스토리마다 axe를 실행한다.
- **상태별 검사.** 드롭다운 열림, 오류 메시지 표시처럼 상호작용 후 상태에서 다시 실행해야 숨은 요소의 문제가 잡힌다.
- **실패 메시지 읽기 쉽게.** 위반 객체 전체를 출력하지 말고 `id`, `impact`, `nodes[].target`만 추려 출력하면 CI 로그에서 원인을 찾기 쉽다.
- **`incomplete` 검토.** 배경 이미지 위 텍스트 대비처럼 자동 판정이 어려운 항목은 사람이 확인 목록으로 관리한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 테스트 파이프라인에 WCAG 자동 검사를 넣을 때, 디자인 시스템 컴포넌트의 접근성 기준선을 유지할 때.
- 피할 때(대안): 여러 URL을 설정 파일로 일괄 검사하는 CLI가 필요하면 [Pa11y](/develop-wiki/frontend/performance-a11y/pa11y/)(axe 러너 사용 가능). 수동 감사·보조기기 테스트를 대신하지는 못한다.

## 공식 문서
- [API 문서](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md) · [규칙 목록](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Playwright 접근성 테스트 가이드](https://playwright.dev/docs/accessibility-testing) · [Deque axe 소개](https://www.deque.com/axe/)
