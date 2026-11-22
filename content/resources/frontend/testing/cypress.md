---
name: Cypress
url: https://www.cypress.io
docs: https://docs.cypress.io/app/get-started/why-cypress
repo: https://github.com/cypress-io/cypress
stars: 51042
domain: frontend
category: testing
description: 브라우저 안에서 테스트를 실행하며 명령 단위 스냅샷으로 디버깅하는 E2E·컴포넌트 테스트 도구. 테스트 러너 앱은 오픈소스, 기록·병렬화 서비스는 유료다.
pricing: oss
tags: [e2e, component-test, browser]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Cypress는 테스트 코드를 애플리케이션과 같은 브라우저 안에서 실행하는 E2E·컴포넌트 테스트 도구다. `cy.get(...).click()` 같은 명령을 체인으로 쓰고, 각 명령은 조건이 맞을 때까지 자동으로 재시도한다. 대화형 러너(Cypress App)에서 명령마다 DOM 스냅샷을 되돌려 보며 실패 원인을 찾을 수 있다. 이 문서는 **Cypress 16** 기준이다(npm `cypress` `latest` 16.3.0, Node.js 22.x·24.x·26 이상).

- 테스트 러너는 MIT 라이선스 오픈소스이고, 실행 기록·병렬 실행·플래키 분석을 제공하는 Cypress Cloud는 별도 유료 서비스다.
- [Playwright](/develop-wiki/frontend/testing/playwright/)와 비교하면 대화형 디버깅 경험이 강점이고, 여러 탭·여러 오리진 시나리오는 Playwright가 더 자연스럽다.

## 설치
```bash
npm install -D cypress
npx cypress open      # 앱 실행: E2E 또는 컴포넌트 테스트 선택, 설정 파일 생성
npx cypress run       # 헤드리스 실행 (CI)
```

v16 주요 변경: `Cypress.env()`가 제거되고 `Cypress.expose()`·`cy.env()`로 대체, `cy.exec()` 제거(`cy.task()` 사용), `cy.type()` 기본 입력 지연 0, 컴포넌트 테스트 최소 버전 Vite 8·Angular 21·Next.js 15.0.4. Electron 테스트 브라우저는 deprecated.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `cypress.config.ts` | `e2e`, `component` 설정, `baseUrl`, `setupNodeEvents` |
| 명령 체인 | `cy.visit()`, `cy.get()`, `cy.contains()`, `.click()`, `.type()` — 비동기 큐로 순서대로 실행 |
| 재시도 | 쿼리와 단언(`.should(...)`)은 타임아웃(기본 4초)까지 자동 재시도 |
| `cy.getByRole` | v16.2부터 역할·접근 가능한 이름으로 요소 찾기 |
| `cy.intercept` | 네트워크 요청 감시·스텁 (`cy.wait('@alias')`로 응답 대기) |
| `cy.session` | 로그인 상태를 캐시해 테스트 간 재사용 |
| `cy.task` | Node 쪽 코드 실행 (DB 초기화, 파일 처리) |
| 커스텀 명령 | `Cypress.Commands.add('login', ...)` |
| 컴포넌트 테스트 | `cy.mount(<Button />)`로 React·Vue·Angular·Svelte 컴포넌트를 실제 브라우저에 마운트 |

## 기본 사용법
```ts
// cypress/e2e/todo.cy.ts
describe('할 일 목록', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/todos', { body: [{ id: 1, title: '장보기' }] }).as('todos');
    cy.visit('/todos');
    cy.wait('@todos');
  });

  it('새 할 일을 추가한다', () => {
    cy.get('input[name="title"]').type('운동하기{enter}');
    cy.getByRole('listitem').should('have.length', 2);
    cy.contains('li', '운동하기').should('be.visible');
  });
});
```

## 자주 쓰는 패턴
- **안정적인 선택자.** 스타일 클래스 대신 역할(`cy.getByRole`)이나 `data-cy` 속성을 쓴다.
- **로그인 재사용.** `cy.session('user', () => { /* 로그인 */ })`로 매 테스트 로그인 비용을 줄인다.
- **UI 대신 API로 준비.** 테스트 데이터는 `cy.request()`나 `cy.task()`로 만들고 화면 조작은 검증 대상 흐름에만 쓴다.
- **고정 대기 금지.** `cy.wait(1000)` 대신 `cy.wait('@alias')`나 `.should()` 재시도를 쓴다.
- **CI.** `npx cypress run --browser chrome`과 실패 시 자동 저장되는 스크린샷·비디오를 아티팩트로 보관한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 단일 오리진 웹 앱의 핵심 흐름을 대화형으로 작성·디버깅하고 싶을 때, 같은 도구로 컴포넌트 테스트까지 하고 싶을 때.
- 피할 때(대안): 여러 탭·창, Safari(WebKit) 정식 검증, 병렬 실행을 무료로 원하면 [Playwright](/develop-wiki/frontend/testing/playwright/). 단위 로직은 [Vitest](/develop-wiki/frontend/testing/vitest/).

## 공식 문서
- [Cypress 소개](https://docs.cypress.io/app/get-started/why-cypress) · [설치](https://docs.cypress.io/app/get-started/install-cypress) · [`cy.intercept`](https://docs.cypress.io/api/commands/intercept)
- [`cy.getByRole`](https://docs.cypress.io/api/commands/getbyrole) · [모범 사례](https://docs.cypress.io/app/core-concepts/best-practices) · [변경 이력](https://docs.cypress.io/app/references/changelog)
