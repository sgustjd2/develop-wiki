---
title: CSP 와 보안 응답 헤더
aka: [Content Security Policy, CSP, Strict CSP, Security Headers, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, COEP, CORP, frame-ancestors]
category: cs-fundamentals
group: web
level: intermediate
summary: 브라우저에게 "이 페이지는 이렇게만 동작하라"고 알려 주는 응답 헤더들. 논스 기반 strict CSP 와 HSTS·nosniff·Referrer-Policy 등 기본 헤더 세트를 정리한다.
tags: [web, browser, security, csp, http-headers, xss, clickjacking]
related: [security/xss, security/csrf, security/cors, cs-fundamentals/same-origin-policy, cs-fundamentals/tls-https, cs-fundamentals/cookies-and-web-storage, security/owasp-top-10]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
  - https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
updatedAt: 2026-11-18
---

> XSS 자체의 방어(출력 인코딩, 정화)는 [XSS](/develop-wiki/knowledge/security/xss/) 노트에 있다. 이 노트는 **헤더로 브라우저의 동작 범위를 좁히는 법**을 다룬다. 헤더는 2차 방어선이지 1차 방어가 아니다.

## 문제

- 인코딩을 한 군데 빠뜨리면 주입된 `<script>` 가 그 사이트 권한으로 실행된다.
- 다른 사이트가 내 페이지를 투명 iframe 으로 씌워 클릭을 훔친다(클릭재킹).
- 사용자가 `http://` 로 접속한 첫 요청이 가로채인다.
- 브라우저가 `text/plain` 업로드 파일을 스크립트로 "추측"해 실행한다.

이런 것은 서버 코드가 아니라 **브라우저가 해야 할 일**이고, 응답 헤더로 지시한다.

## CSP: 무엇을 로드·실행해도 되는가

`Content-Security-Policy` 는 자원 종류별 허용 출처를 지정한다. 지정 안 한 종류는 `default-src` 로 대체된다.

### 허용 목록 방식의 한계

```
Content-Security-Policy: script-src 'self' https://cdn.example.com https://www.google-analytics.com
```

허용한 CDN 에 JSONP 엔드포인트나 오래된 라이브러리가 하나라도 있으면 그것을 통해 우회된다. 유지보수도 어렵다. MDN 은 허용 목록 대신 **strict CSP** 를 권한다.

### Strict CSP (논스 기반)

```
Content-Security-Policy:
  script-src 'nonce-{요청마다 새 랜덤값}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  report-to csp
Reporting-Endpoints: csp="https://example.com/csp-reports"
```

```ts
// Express 미들웨어 예: 요청마다 논스를 만들고 템플릿에 넘긴다
import { randomBytes } from 'node:crypto';
app.use((req, res, next) => {
  const nonce = randomBytes(16).toString('base64');
  res.locals.nonce = nonce; // <script nonce="<%= nonce %>"> 로 사용
  res.setHeader('Content-Security-Policy',
    `script-src 'nonce-${nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none'`);
  next();
});
```

- 논스가 일치하는 `<script>` 만 실행된다. 공격자가 넣은 스크립트는 논스를 모른다.
- `'strict-dynamic'`: 논스로 허락받은 스크립트가 동적으로 추가한 스크립트도 실행을 허락한다. 서드파티 로더(태그 매니저 등)와 함께 쓰기 쉬워지지만, 신뢰한 스크립트가 공격자 입력으로 `<script>` 를 만들면 같이 뚫린다.
- 논스나 해시가 있으면 브라우저는 `'unsafe-inline'` 을 무시한다(구형 브라우저 대비로 함께 적어 두는 관례가 있다).
- 정적 HTML 이라 논스를 매번 넣을 수 없으면 `'sha256-…'` **해시 기반**으로 같은 효과를 낸다. 스크립트 내용이 바뀌면 해시도 바꿔야 한다.
- `require-trusted-types-for 'script'` 를 더하면 `innerHTML` 같은 위험 싱크에 문자열을 직접 넣을 수 없게 된다(DOM XSS 대응).

### 도입 순서

1. `Content-Security-Policy-Report-Only` 로 먼저 배포해 위반 보고만 받는다(차단 없음).
2. 인라인 이벤트 핸들러(`onclick=`), `javascript:` URL, `eval` 사용을 걷어 낸다.
3. 보고가 잠잠해지면 강제 헤더로 바꾼다. 두 헤더를 동시에 두고 새 정책을 Report-Only 로 시험할 수 있다.

## 기본 보안 헤더 세트 (OWASP 권장값 기준)

| 헤더 | 권장값 | 막는 것 |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS → HTTP 다운그레이드. [TLS](/develop-wiki/knowledge/cs-fundamentals/tls-https/) 참고 |
| CSP `frame-ancestors` | `'none'` 또는 `'self'` | 클릭재킹. 구식 `X-Frame-Options: DENY` 를 대체 |
| `X-Content-Type-Options` | `nosniff` | MIME 스니핑으로 업로드 파일이 스크립트·스타일로 해석됨 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | URL 경로·쿼리(토큰 등)가 외부로 새어 나감 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | 안 쓰는 강력한 기능을 서드파티 iframe 이 사용 |
| `Cross-Origin-Opener-Policy` | `same-origin` | 다른 출처 창과 `window.opener` 로 연결되는 공격(XS-Leaks 일부) |
| `Cross-Origin-Resource-Policy` | `same-site` | 내 자원을 다른 사이트가 임베드해 사이드 채널로 읽음 |
| `Cross-Origin-Embedder-Policy` | `require-corp` (필요할 때만) | COOP 와 함께 교차 출처 격리 → `SharedArrayBuffer` 사용 가능 |
| `Cache-Control` | 민감 응답은 `no-store` | 공용 PC·프록시에 개인정보가 남음 |
| `X-XSS-Protection` | 보내지 않거나 `0` | 구형 XSS 필터가 오히려 취약점을 만듦 |
| `Server`, `X-Powered-By` | 제거 | 버전 노출 (지문 채취를 완전히 막지는 못함) |

## 언제 쓰나

- **모든 HTML 응답**에 기본 세트를 붙인다. 리버스 프록시·CDN·프레임워크 미들웨어(helmet 등) 한 곳에서 일괄로.
- CSP 는 사용자 생성 콘텐츠를 다루거나, 세션이 가치 있는 앱(관리자, 결제)부터 우선 적용한다.
- API(JSON) 응답에는 `nosniff`, `Cache-Control`, CORS 관련 헤더가 핵심이고 CSP 의 효과는 작다.

## 주의

- **CSP 만 믿지 않는다.** OWASP 가 짚는 안티패턴이다. 출력 인코딩이 1차 방어다.
- HSTS `preload` 는 브라우저 목록에 등록되면 되돌리기 어렵다. 모든 하위 도메인이 HTTPS 인지 확인한 뒤에 한다. 인증서 문제가 나면 `max-age` 동안 사용자가 접속하지 못한다.
- `<meta http-equiv="Content-Security-Policy">` 는 `frame-ancestors`, 보고, Report-Only 를 지원하지 않는다. 가능하면 헤더로 보낸다.
- `upgrade-insecure-requests` 는 하위 자원을 HTTPS 로 바꿔 줄 뿐 HSTS 를 대신하지 않는다.
- COEP `require-corp` 는 CORP/CORS 를 안 주는 서드파티 이미지·스크립트를 모두 막는다. 격리가 필요한 기능이 없다면 켜지 않는다.
- 논스는 응답마다 새로 만들어야 한다. HTML 을 CDN 에 캐시하면 논스가 고정돼 의미가 없어진다.
