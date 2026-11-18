---
title: 인증 상태 설계 — 서버 세션 vs JWT
aka: [Session vs JWT, Stateful vs Stateless Authentication, Session Cookie, Access Token, Refresh Token]
category: security
level: intermediate
summary: 로그인 상태를 서버 저장소의 세션 ID 로 유지할지, 서명된 자가 포함 토큰(JWT)으로 유지할지 고르는 기준과 각 방식의 안전한 설정.
tags: [authentication, session, jwt, cookie, owasp]
related: [security/csrf, security/xss, security/cors, security/secrets-management, security/owasp-top-10]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html
  - https://www.rfc-editor.org/rfc/rfc8725.html
updatedAt: 2026-11-18
---

## 문제

HTTP 는 상태가 없으므로 로그인 후 요청마다 "누구인가"를 증명할 무언가를 보내야 한다. 두 가지 길이 있다.

- **서버 세션**: 무작위 세션 ID 만 클라이언트에 주고, 사용자 정보는 서버 저장소(DB, Redis)에 둔다.
- **자가 포함 토큰(JWT)**: 사용자 정보(클레임)를 토큰 안에 넣고 서명한다. 서버는 서명만 검증하면 된다.

"JWT 가 더 현대적"이라는 이유로 고르면 세션이 공짜로 주던 기능(즉시 로그아웃, 권한 변경 반영)을 다시 만들게 된다.

## 비교

| | 서버 세션 | JWT (자가 포함) |
| --- | --- | --- |
| 서버 상태 | 세션 저장소 필요 | 서명 키만 필요 |
| 즉시 무효화(로그아웃, 계정 정지) | 저장소에서 삭제하면 끝 | 만료 전까지 유효. 무효화하려면 `jti` 거부 목록 = 결국 상태 |
| 권한 변경 반영 | 다음 요청부터 | 토큰 재발급 때까지 지연 |
| 내용 노출 | ID 는 의미 없는 난수 | 서명만 했으면 **누구나 클레임을 읽을 수 있음** |
| 크기 | 수십 바이트 | 수백 바이트~수 KB, 매 요청 전송 |
| 잘 맞는 곳 | 같은 도메인의 웹 앱(BFF 포함) | 서비스 간 호출, 여러 리소스 서버가 같은 발급자를 신뢰하는 구조(OAuth/OIDC) |

## 해법 1: 서버 세션을 안전하게

```http
Set-Cookie: __Host-sid=<CSPRNG 128비트 이상>; Secure; HttpOnly; SameSite=Lax; Path=/
```

- 세션 ID 는 CSPRNG 로, 엔트로피 64비트 이상(직접 만들면 128비트 권장). 프레임워크 기본 구현을 쓴다.
- `HttpOnly`(스크립트 접근 차단), `Secure`(HTTPS 만), `SameSite`, `Domain` 생략, `__Host-` 접두사.
- **로그인·권한 상승 시 세션 ID 재발급**(세션 고정 방지), 옛 ID 는 폐기.
- 유휴 만료와 절대 만료를 **서버에서** 강제한다. OWASP 예시: 고위험 앱은 유휴 2~5분, 일반 앱은 15~30분, 절대 만료 4~8시간.
- 로그아웃은 서버 저장소에서 세션을 지우는 것이 본질이다. 쿠키 삭제만으로는 탈취된 ID 가 계속 유효하다.

## 해법 2: JWT 를 쓴다면

```ts
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(token, publicKey, {
  algorithms: ['ES256'],          // 허용 알고리즘을 고정 (alg 헤더를 믿지 않음)
  issuer: 'https://auth.example.com',
  audience: 'orders-api',
  maxTokenAge: '10m',
});
```

- 허용 알고리즘을 명시하고 `none` 을 거부한다. 키 하나는 알고리즘 하나에만 쓴다(RFC 8725).
- `iss`, `aud`, `exp` 를 반드시 검증한다. 여러 종류의 JWT 를 쓰면 `typ` 으로 구분한다.
- HMAC 키는 사람이 기억하는 비밀번호가 아니라 CSPRNG 로 만든 256비트 이상 값.
- 액세스 토큰은 **짧게**(분 단위), 갱신 토큰은 서버에 저장해 회전·폐기할 수 있게 한다. 이 순간 이미 상태가 생긴다는 점을 받아들인다.
- 민감 정보를 클레임에 넣지 않는다. 필요하면 JWE 나 불투명(opaque) 토큰.

## 언제 쓰나

- 브라우저 웹 앱 하나 + 자체 백엔드 → **서버 세션 + 쿠키**가 대개 가장 단순하고 안전하다. SPA 라도 BFF 를 두면 세션을 쓸 수 있다.
- 마이크로서비스 내부 전파, 외부 IdP(OIDC) 연동, 모바일·서드파티 API → JWT 액세스 토큰.

## 주의 (비용)

- 토큰을 `localStorage` 에 두면 [XSS](/develop-wiki/knowledge/security/xss/) 한 번에 탈취된다. `HttpOnly` 쿠키도 XSS 를 막아 주진 않지만 토큰 값 자체를 빼가지는 못하게 한다.
- 쿠키로 인증하면 [CSRF](/develop-wiki/knowledge/security/csrf/) 방어가 필요하다. `Authorization` 헤더 토큰은 CSRF 에는 강하지만 저장 위치 문제가 남는다.
- JWT 거부 목록을 두면 무상태의 장점이 사라진다. OWASP 도 그럴 바엔 서버 세션을 고려하라고 한다.
- 서명 키 유출은 모든 토큰 위조로 이어진다 → [비밀 관리](/develop-wiki/knowledge/security/secrets-management/), 키 회전(`kid`).
- 인증(누구인가)과 인가(무엇을 할 수 있나)는 별개다. 토큰이 유효해도 리소스 소유권 검사는 매번 한다.
