---
title: 동일 출처 정책(SOP)과 CORS 의 동작 원리
aka: [Same-Origin Policy, SOP, Origin, Site, CORS, Preflight, postMessage]
category: cs-fundamentals
group: web
level: beginner
summary: 브라우저는 한 출처의 스크립트가 다른 출처의 응답을 읽지 못하게 막는다. 출처·사이트의 정의, 막히는 것과 허용되는 것, CORS 가 이 규칙에 어떻게 예외를 여는지 정리한다.
tags: [web, browser, security, sop, cors, origin]
related: [security/cors, security/csrf, cs-fundamentals/cookies-and-web-storage, cs-fundamentals/http-caching]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
updatedAt: 2026-11-18
---

> CORS 헤더 설정과 흔한 잘못된 설정은 보안 관점의 [CORS](/develop-wiki/knowledge/security/cors/) 노트에 있다. 여기서는 그 바탕인 **동일 출처 정책이 무엇을 막는지**에 집중한다.

## 출처(origin)와 사이트(site)

**출처 = 스킴 + 호스트 + 포트.** 셋이 모두 같아야 같은 출처다.

| `https://app.example.com/a` 와 비교 | 같은 출처? | 같은 사이트? |
| --- | --- | --- |
| `https://app.example.com/b` | 예 (경로만 다름) | 예 |
| `http://app.example.com/a` | 아니오 (스킴) | 아니오 (스킴이 다르면 schemeful site 기준 다름) |
| `https://app.example.com:8443/a` | 아니오 (포트) | 예 |
| `https://api.example.com/a` | 아니오 (호스트) | **예** (등록 가능 도메인 `example.com` 동일) |
| `https://example.org/a` | 아니오 | 아니오 |

- **사이트** = 스킴 + 등록 가능 도메인(eTLD+1). 하위 도메인과 포트는 무시한다. `SameSite` 쿠키가 쓰는 기준이 이것이다.
- 그래서 `app.example.com` → `api.example.com` 호출은 **교차 출처**(CORS 필요)지만 **동일 사이트**(SameSite 쿠키 전송됨)다.

## 무엇을 막고 무엇을 허용하나 (MDN)

| 구분 | 기본 동작 | 예 |
| --- | --- | --- |
| 교차 출처 **쓰기** | 대체로 허용 | 링크, 리다이렉트, 폼 제출 |
| 교차 출처 **임베드** | 대체로 허용 | `<img>`, `<script>`, `<link rel=stylesheet>`, `<iframe>`, `<video>` |
| 교차 출처 **읽기** | **차단** | `fetch` 응답 본문 읽기, iframe 내부 DOM 접근 |
| 저장소 | 출처별 분리 | localStorage, IndexedDB |

핵심은 **요청은 나가지만 응답을 못 읽는다**는 것이다. 그래서 SOP 는 CSRF(요청 위조)를 막지 못한다 — 폼 제출은 허용되고 쿠키도 붙기 때문이다. CSRF 는 `SameSite` 쿠키·토큰으로 따로 막는다.

## CORS: 서버가 여는 예외

```
브라우저(https://app.example.com)                API(https://api.example.com)
  [단순 요청: GET, 안전한 헤더만]
  GET /items  Origin: https://app.example.com ──▶
         ◀── 200  Access-Control-Allow-Origin: https://app.example.com
  → 헤더가 맞으면 JS 가 응답을 읽음, 아니면 요청은 갔지만 읽기만 차단

  [사전 요청: PUT, JSON 본문, 커스텀 헤더 …]
  OPTIONS /items  Access-Control-Request-Method: PUT ──▶
         ◀── 204  Access-Control-Allow-Methods: PUT
                  Access-Control-Allow-Headers: content-type
                  Access-Control-Max-Age: 600
  PUT /items ...  (허락받은 뒤 실제 요청)
```

- `Content-Type: application/json` 은 단순 요청 조건이 아니라 **항상 사전 요청**을 부른다.
- 쿠키를 보내려면 `fetch(url, { credentials: 'include' })` + 서버의 `Access-Control-Allow-Credentials: true`, 그리고 `Allow-Origin` 에 `*` 를 쓸 수 없다.
- 출처마다 다른 `Allow-Origin` 을 돌려주면 `Vary: Origin` 을 붙여 캐시가 섞이지 않게 한다. [웹 캐싱](/develop-wiki/knowledge/cs-fundamentals/http-caching/) 참고.

## 개발자에게 왜 중요한가

- **CORS 오류는 브라우저만의 규칙**이다. `curl`·서버 간 호출은 CORS 와 무관하다. "Postman 에서는 되는데 브라우저에서 안 된다"의 정답이 대부분 이것이다.
- **CORS 는 서버를 보호하지 않는다.** 요청을 막는 것이 아니라 브라우저가 응답을 스크립트에 넘길지를 정한다. API 인가는 서버가 따로 한다.
- 개발 환경에서는 프록시(같은 출처로 보이게)로 피하는 것이 서버에 `*` 를 여는 것보다 안전하다.

```ts
// Vite 개발 서버: /api 를 백엔드로 프록시 → 브라우저 입장에서 같은 출처
export default { server: { proxy: { '/api': 'http://localhost:8080' } } };
```

- 서로 다른 출처의 창끼리 통신은 `postMessage` 로 하고, 받는 쪽은 `event.origin` 을 반드시 검사한다.

```ts
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://widget.example.com') return; // 출처 검사 필수
  handle(e.data);
});
```

## 주의

- 오류 메시지가 JS 에는 일반 네트워크 오류로만 보인다. 원인은 브라우저 콘솔과 Network 탭의 OPTIONS 요청에서 확인한다.
- `Origin` 헤더를 그대로 반사해 `Allow-Origin` 에 넣고 `Allow-Credentials: true` 까지 주면 모든 사이트에 사용자 데이터를 열어 준 셈이다. 허용 목록과 정확히 비교한다.
- `<script>` 로 임베드한 교차 출처 스크립트는 SOP 의 보호를 받지 않고 내 페이지 권한으로 실행된다. 서드파티 스크립트는 그만큼 신뢰하는 것이다.
