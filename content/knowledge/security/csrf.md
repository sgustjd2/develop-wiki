---
title: CSRF(교차 사이트 요청 위조) 방어
aka: [Cross-Site Request Forgery, CSRF, XSRF, Synchronizer Token, Double Submit Cookie, SameSite, Fetch Metadata]
category: security
level: intermediate
summary: 브라우저가 쿠키를 자동으로 붙이는 성질을 악용해 사용자 몰래 상태 변경 요청을 보내는 CSRF 를, 토큰·Fetch Metadata·SameSite 를 조합해 막는 방법.
tags: [owasp, csrf, cookie, web-security, samesite]
related: [security/xss, security/cors, security/session-vs-jwt, security/owasp-top-10]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
  - https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
updatedAt: 2026-11-18
---

OWASP Top 10:2025 에서는 A01 접근 제어 실패에 매핑된다(CWE-352).

## 문제

사용자가 `bank.example` 에 로그인한 채 공격자 페이지를 연다. 공격자 페이지에 숨은 폼이 `bank.example/transfer` 로 POST 를 보내면, 브라우저는 `bank.example` 쿠키를 **자동으로** 붙인다. 서버는 정상 요청과 구분하지 못한다.

```html
<!-- 공격자 사이트 -->
<form action="https://bank.example/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="1000000" />
</form>
<script>document.forms[0].submit()</script>
```

공격자는 응답을 읽을 수 없지만(동일 출처 정책), 요청이 **처리되는 것** 자체가 피해다. 쿠키·HTTP 기본 인증처럼 브라우저가 자동으로 붙이는 인증을 쓸 때만 해당한다.

## 해법

| 방어 | 원리 | 비고 |
| --- | --- | --- |
| 프레임워크 내장 CSRF 보호 | 검증된 구현 | 먼저 확인. 직접 만들기보다 낫다 |
| 동기화 토큰 | 세션별 예측 불가 토큰을 폼·헤더로 보내고 서버가 비교 | 상태 있는(세션) 앱의 기본 |
| 서명된 이중 제출 쿠키 | 세션 값 + 난수를 HMAC 으로 서명한 토큰을 쿠키와 헤더에 둘 다 보내 비교 | 상태 없는 앱. **서명 없는 단순 이중 제출은 비권장** |
| Fetch Metadata | `Sec-Fetch-Site: cross-site` 인 상태 변경 요청 거부 | 헤더 없는 구형 브라우저는 Origin 검사로 폴백 |
| 커스텀 헤더 요구 | API 가 `X-CSRF-Token` 같은 헤더를 요구 → 교차 출처면 프리플라이트 발생 | CORS 를 느슨하게 열면 무력화 |
| SameSite 쿠키 | 교차 사이트 요청에 쿠키를 안 붙임 | 심층 방어. 단독으로 믿지 않음 |
| Origin/Referer 검증 | 출처 전체를 정확히 비교 | 접두어 비교 금지, `Origin: null` 거부 |

```ts
// Fetch Metadata 기반 미들웨어 (단순화)
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
app.use((req, res, next) => {
  if (!UNSAFE.has(req.method)) return next();
  const site = req.get('Sec-Fetch-Site');
  if (site === 'same-origin' || site === 'none') return next();
  if (site === undefined && req.get('Origin') === 'https://app.example.com') return next();
  return res.status(403).send('cross-site request blocked');
});
```

## 기본 규칙

- **GET 으로 상태를 바꾸지 않는다.** `SameSite=Lax` 는 최상위 GET 이동에 쿠키를 붙이므로 GET 변경 요청은 그대로 뚫린다.
- 세션 쿠키는 `SameSite=Lax` 이상을 명시한다. 그래도 토큰 또는 Fetch Metadata 를 함께 쓴다.
- 송금·비밀번호 변경 같은 민감 작업은 재인증·일회용 코드로 사용자 의도를 한 번 더 확인한다.

## 언제 쓰나

- 쿠키로 인증하는 모든 웹 앱의 상태 변경 요청.
- `Authorization: Bearer` 헤더로만 인증하는 순수 API 는 브라우저가 자동으로 붙이지 않으므로 CSRF 대상이 아니다. 대신 토큰 저장 위치(XSS) 문제가 생긴다.

## 주의 (비용)

- **XSS 가 있으면 모든 CSRF 방어가 뚫린다.** 스크립트가 같은 출처에서 토큰을 읽어 요청을 보낼 수 있다. [XSS](/develop-wiki/knowledge/security/xss/) 방어가 전제다.
- SameSite 의 "사이트"는 등록 가능 도메인 단위다. 취약한 형제 서브도메인(`blog.example.com`)에서 오는 요청은 같은 사이트로 취급된다.
- 단순 이중 제출 쿠키는 서브도메인에서 쿠키를 심을 수 있는 공격자에게 우회된다.
- [CORS](/develop-wiki/knowledge/security/cors/)는 CSRF 방어가 아니다. 폼 POST 같은 단순 요청은 CORS 와 무관하게 전송된다.
- 토큰을 URL·로그에 남기지 않는다.
