---
title: XSS(크로스 사이트 스크립팅) 방어
aka: [Cross-Site Scripting, XSS, Stored XSS, Reflected XSS, DOM-based XSS, Output Encoding, CSP, Trusted Types]
category: security
level: intermediate
summary: 신뢰할 수 없는 데이터가 페이지에서 스크립트로 실행되는 XSS 를, 맥락별 출력 인코딩·안전한 DOM API·HTML 정화로 막고 CSP·Trusted Types 로 피해를 줄이는 방법.
tags: [owasp, xss, web-security, frontend, csp, react]
related: [security/csrf, security/sql-injection, security/session-vs-jwt, security/owasp-top-10, security/cors]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
  - https://top10.owasp.org/2025/A05_2025-Injection/
updatedAt: 2026-11-18
---

OWASP Top 10:2025 에서는 A05 Injection 에 포함된다(빈도는 높고 건당 영향은 낮은 편으로 분류).

## 문제

공격자가 넣은 문자열이 HTML·JS 로 해석되면, 피해자 브라우저에서 **그 사이트의 권한으로** 스크립트가 돈다. 세션을 이용한 요청 위조, 화면 조작, 키 입력 가로채기, 토큰 탈취가 모두 가능하다.

| 종류 | 경로 |
| --- | --- |
| 저장형 | 게시글·프로필에 저장된 값이 다른 사용자에게 렌더링 |
| 반사형 | URL 파라미터가 응답 HTML 에 그대로 반사 |
| DOM 기반 | 서버를 거치지 않고 클라이언트 JS 가 `location.hash` 등을 위험한 싱크에 넣음 |

## 해법

### 1. 맥락에 맞는 출력 인코딩

같은 값이라도 들어가는 자리에 따라 인코딩이 다르다.

| 위치 | 방법 |
| --- | --- |
| HTML 본문 | `& < > " '` 를 엔티티로 |
| HTML 속성 | 속성값을 항상 따옴표로 감싸고 속성 인코딩. `onclick` 같은 이벤트 속성에는 데이터를 넣지 않는다 |
| JS 안 | 인용된 문자열 안에만, 라이브러리 인코더로. 직접 따옴표 이스케이프 금지 |
| URL | 파라미터는 `encodeURIComponent`, `href`/`src` 전체는 `http(s)` 스킴만 허용 |
| CSS | 데이터를 CSS 소스에 끼우지 말고 `style.setProperty` + 허용 값 |

### 2. 프레임워크 기본 이스케이프를 지키고, 탈출구를 감시

React·Vue·Angular·Svelte 는 텍스트 바인딩을 자동 이스케이프한다. 문제는 탈출구다.

```tsx
// 위험한 탈출구: React dangerouslySetInnerHTML, Vue v-html, Angular bypassSecurityTrust*, Lit unsafeHTML
<div dangerouslySetInnerHTML={{ __html: comment.html }} />          // 정화 없으면 취약

import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.html) }} />

// URL 은 스킴 검증 (javascript: 차단)
const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : '#');
```

### 3. 안전한 DOM API

- 쓰기: `textContent`, `createTextNode`, 고정 이름의 `setAttribute`, `value`.
- 피하기: 정화 없는 `innerHTML`/`outerHTML`/`insertAdjacentHTML`, `document.write`, `eval`, 문자열 인자의 `setTimeout`/`setInterval`.

### 4. 심층 방어

- **CSP**: `script-src` 를 nonce·hash 기반으로 제한하면 주입된 인라인 스크립트가 실행되지 않는다. 앱별로 맞춰 설계한다.
- **Trusted Types**: `require-trusted-types-for 'script'` 로 위험한 싱크에 일반 문자열을 넣지 못하게 한다. 정책 함수는 정말로 검증·정화해야 의미가 있다.
- **쿠키 속성**: `HttpOnly` 는 스크립트의 쿠키 읽기를 막아 피해를 줄일 뿐, XSS 자체를 막지는 않는다.

## 언제 쓰나

- 사용자 입력·외부 데이터를 화면에 그리는 모든 곳. 특히 리치 텍스트, 마크다운 렌더링, 사용자 지정 링크, 관리자 화면(내부 사용자가 공격 대상이 되기 쉽다).

## 주의 (비용)

- **CSP 만 믿지 않는다.** OWASP 가 명시한 안티패턴이다. CSP 는 우회 경로가 많고 레거시 페이지에서 깨지기 쉽다.
- 입력 시점의 전역 필터·WAF 에 맡기지 않는다. 출력 맥락을 모르고, DOM 기반 XSS 를 못 본다.
- 정화한 HTML 을 다시 가공하면(문자열 치환, 다른 라이브러리 통과) 정화가 무력해질 수 있다. 정화는 마지막에.
- 정화 라이브러리는 우회가 자주 발견된다. 최신으로 유지한다.
- XSS 가 있으면 [CSRF](/develop-wiki/knowledge/security/csrf/) 토큰도 읽혀 무력화된다. 토큰을 `localStorage` 에 두는 설계는 XSS 한 번에 탈취로 이어진다.
