---
title: CORS (교차 출처 리소스 공유)
aka: [Cross-Origin Resource Sharing, CORS, Preflight, Same-Origin Policy, 동일 출처 정책]
category: security
level: beginner
summary: 브라우저의 동일 출처 정책을 서버가 명시적으로 완화해 다른 출처의 스크립트가 응답을 읽도록 허용하는 HTTP 헤더 규약과, 흔한 잘못된 설정.
tags: [cors, browser, http, web-security, same-origin]
related: [security/csrf, security/xss, security/session-vs-jwt, security/owasp-top-10]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
updatedAt: 2026-11-18
---

## 문제

브라우저는 **동일 출처 정책**에 따라, `https://app.example.com` 의 스크립트가 `https://api.example.com`(출처 = 스킴+호스트+포트가 다름)의 응답을 읽지 못하게 한다. 프런트엔드와 API 를 다른 도메인에 두면 `fetch` 가 실패한다. 이를 "CORS 에러"라고 부르며, 급하게 `*` 로 다 열어 버리는 일이 흔하다.

## 해법

서버가 응답 헤더로 "이 출처는 읽어도 된다"고 알리고, **브라우저가** 그 헤더를 보고 스크립트에 응답을 넘길지 결정한다.

### 단순 요청 vs 프리플라이트

| | 단순 요청 | 프리플라이트 요청 |
| --- | --- | --- |
| 조건 | `GET`/`HEAD`/`POST` + 안전 목록 헤더만 + `Content-Type` 이 폼·`text/plain` | 그 밖 전부 (`PUT`, `DELETE`, `application/json`, 커스텀 헤더 등) |
| 동작 | 바로 전송, 응답 헤더로 읽기 허용 판단 | 먼저 `OPTIONS` 로 허용 여부 확인 후 본 요청 |

### 주요 헤더

| 헤더 | 의미 |
| --- | --- |
| `Access-Control-Allow-Origin` | 허용 출처 하나 또는 `*` |
| `Access-Control-Allow-Credentials: true` | 쿠키 등 자격 증명이 포함된 요청의 응답을 읽게 허용 |
| `Access-Control-Allow-Methods` / `-Headers` | 프리플라이트에서 허용할 메서드·헤더 |
| `Access-Control-Max-Age` | 프리플라이트 결과 캐시 시간(초) |
| `Access-Control-Expose-Headers` | 스크립트가 읽을 수 있는 추가 응답 헤더 |
| `Vary: Origin` | 출처마다 응답이 다름을 캐시에 알림 |

```ts
const ALLOWED = new Set(['https://app.example.com', 'https://admin.example.com']);

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && ALLOWED.has(origin)) {               // 정확히 일치하는 허용 목록
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.set('Access-Control-Max-Age', '600');
    return res.sendStatus(204);
  }
  next();
});
```

## 언제 쓰나

- 프런트엔드와 API 가 다른 출처에 있고, 브라우저 스크립트가 API 응답을 읽어야 할 때.
- 공개 데이터 API(인증 없음)라면 `Access-Control-Allow-Origin: *` 가 적절할 수 있다.
- 같은 출처로 맞출 수 있다면(리버스 프록시로 `/api` 경로) CORS 자체가 필요 없다. 가장 단순한 해결책이다.

## 흔한 잘못된 설정

- **요청의 `Origin` 을 검증 없이 그대로 반사** + `Allow-Credentials: true` → 어떤 사이트든 로그인된 사용자의 데이터를 읽는다. 사실상 동일 출처 정책 해제.
- 정규식·접두어 비교: `https://app.example.com.attacker.net`, `https://evilexample.com` 이 통과한다. 정확한 문자열 비교를 쓴다.
- `Origin: null` 허용: 샌드박스 iframe, 로컬 파일에서 위조 가능.
- 모든 서브도메인 허용: 서브도메인 하나에 XSS 가 있으면 API 전체가 노출된다.
- 자격 증명 요청에 `*` 를 쓰면 브라우저가 거부한다. 그래서 "반사"로 우회하다 위 첫 번째 문제를 만든다.

## 주의 (비용)

- **CORS 는 서버 보호 장치가 아니다.** 브라우저만 지키는 규칙이다. curl·서버 간 호출에는 아무 효과가 없다. 인증·인가는 서버가 따로 해야 한다.
- **CORS 는 CSRF 방어가 아니다.** 단순 요청(폼 POST)은 CORS 와 무관하게 전송되고 처리된다. CORS 는 응답을 "읽는 것"만 통제한다 → [CSRF](/develop-wiki/knowledge/security/csrf/).
- 프리플라이트는 요청마다 왕복을 하나 더한다. `Max-Age` 로 캐시하되, 브라우저마다 상한이 있다.
- 제3자 쿠키 차단 정책은 CORS 설정과 별개로 쿠키 전송을 막을 수 있다.
