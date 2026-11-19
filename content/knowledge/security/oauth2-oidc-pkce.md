---
title: OAuth 2·OIDC 흐름과 PKCE
aka: [OAuth 2.0, OAuth 2.1, OpenID Connect, OIDC, PKCE, Authorization Code Flow, Client Credentials, BFF, Backend for Frontend, Refresh Token Rotation, DPoP]
category: security
level: intermediate
summary: 위임 인가 OAuth 2.0 과 그 위의 로그인 계층 OIDC 에서 클라이언트 종류별로 어떤 흐름을 쓰고, PKCE 가 무엇을 막으며, 브라우저에서 토큰을 어디에 둘지 정리한다.
tags: [oauth2, oidc, pkce, authentication, authorization, token, bff, owasp]
related: [security/session-vs-jwt, security/csrf, security/xss, security/cors, security/mfa-passkeys, security/access-control-design, security/secrets-management, cs-fundamentals/cookies-and-web-storage, security/oauth-browser-based-apps-rfc10017]
sources:
  - https://www.rfc-editor.org/rfc/rfc6749.html
  - https://www.rfc-editor.org/rfc/rfc7636.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
  - https://www.rfc-editor.org/rfc/rfc10017.html
  - https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
  - https://openid.net/specs/openid-connect-core-1_0.html
updatedAt: 2026-11-18
---

명세 자체의 개요와 문서 목록은 리소스 페이지 [OAuth 2.0 / OpenID Connect](/develop-wiki/backend/auth/oauth-oidc/)에 있다. 이 노트는 **설계 판단**(어떤 흐름, 어떤 저장 위치)을 다룬다.

## 문제

- 앱 A 가 사용자의 구글 캘린더를 읽어야 한다. 사용자 비밀번호를 A 에 넘기면 A 는 모든 권한을 갖고, 사용자는 A 만 골라서 끊을 수 없다.
- "구글로 로그인"을 OAuth 액세스 토큰만으로 구현하면, 그 토큰이 **우리 앱을 위해 발급된 것인지** 확인할 방법이 없다(다른 앱용 토큰을 들고 와도 통과).
- 모바일·SPA 같은 **공개 클라이언트**는 클라이언트 비밀을 숨길 수 없다. 리다이렉트로 돌아오는 인가 코드를 다른 앱이 가로채면 토큰으로 바꿀 수 있다.

## 해법 1: 역할과 두 계층

| 역할 | 하는 일 |
| --- | --- |
| 리소스 소유자 | 보통 사용자. 권한을 위임한다 |
| 클라이언트 | 토큰을 받아 API 를 호출하는 앱 |
| 인가 서버(AS, IdP) | 사용자를 인증하고 동의를 받아 토큰 발급 |
| 리소스 서버(RS) | 액세스 토큰을 검증하고 데이터 제공 |

- **OAuth 2.0 = 인가.** 결과물은 액세스 토큰(무엇을 할 수 있나). 토큰 형식은 정하지 않는다.
- **OIDC = 인증.** `scope` 에 `openid` 를 넣으면 OIDC 요청이 되고, **ID 토큰**(누가, 언제, 어떻게 로그인했나를 담은 서명된 JWT)이 추가로 온다.
- 클라이언트는 **기밀(confidential)** 과 **공개(public)** 로 나뉜다. 서버에서 도는 웹 앱은 비밀을 지킬 수 있고, 브라우저 SPA·모바일·데스크톱 앱은 못 지킨다.

## 해법 2: 어떤 흐름을 언제

| 상황 | 흐름 | 비고 |
| --- | --- | --- |
| 서버 렌더링 웹 앱, BFF | Authorization Code + PKCE | 기밀 클라이언트. 클라이언트 인증 + PKCE 둘 다 |
| SPA (BFF 없이) | Authorization Code + PKCE | 공개 클라이언트. PKCE **필수** |
| 모바일·데스크톱 앱 | Authorization Code + PKCE | 시스템 브라우저 사용, 임베디드 웹뷰 금지(RFC 8252) |
| 서비스 간 호출(사용자 없음) | Client Credentials | 기밀 클라이언트만 |
| TV·CLI 등 입력이 불편한 기기 | Device Authorization Grant (RFC 8628) | 다른 기기에서 코드 입력 |
| ~~SPA 토큰 직접 수령~~ | ~~Implicit~~ | RFC 9700: 쓰지 말 것(SHOULD NOT). OAuth 2.1 에서 제거 |
| ~~앱이 비밀번호를 받아 교환~~ | ~~Resource Owner Password~~ | RFC 9700: 사용 금지(MUST NOT). OAuth 2.1 에서 제거 |

결론적으로 **사용자가 있는 흐름은 전부 Authorization Code + PKCE** 로 수렴했다. OAuth 2.1 초안(2026-10 기준 draft-17, 아직 RFC 아님)은 이 결론과 RFC 9700 의 권고를 본문에 합친 정리판이다.

## 해법 3: PKCE 가 막는 것

인가 코드는 리다이렉트 URL 에 실려 오므로 새기 쉽다. PKCE(RFC 7636)는 **코드를 요청한 그 클라이언트만 코드를 토큰으로 바꿀 수 있게** 묶는다.

```ts
// 1) 인가 요청 전: 요청마다 새 verifier (43~128자, 32바이트 난수 → base64url 이면 43자)
const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
const challenge = base64url(new Uint8Array(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
));
sessionStore.set({ verifier, state });            // 서버 세션(BFF) 또는 탭 범위 저장

location.assign(`${AS}/authorize?response_type=code&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=openid%20profile` +
  `&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`);

// 2) 콜백에서: state 확인 후 code + verifier 로 토큰 교환
await fetch(`${AS}/token`, { method: 'POST', body: new URLSearchParams({
  grant_type: 'authorization_code', code, redirect_uri: REDIRECT,
  client_id: CLIENT_ID, code_verifier: verifier,
}) });
```

- AS 는 저장해 둔 `code_challenge` 와 `SHA-256(code_verifier)` 를 비교한다. 코드를 가로챈 공격자는 verifier 가 없어 교환에 실패한다.
- 방식은 **`S256`** 만 쓴다. `plain` 은 인가 요청을 본 사람에게 verifier 가 그대로 드러난다. S256 실패 후 plain 으로 내려가는 것도 금지.
- RFC 9700 은 PKCE 를 공개 클라이언트에 **필수**, 기밀 클라이언트에도 **권장**한다. PKCE 를 쓰면 인가 코드 주입과 로그인 CSRF 방어도 겸한다(그래도 `state` 는 요청-응답 짝 맞추기에 유용하다).
- AS 쪽: 코드 1회 사용, `code_challenge` 없이 시작한 요청에 `code_verifier` 가 오면 거부(다운그레이드 방지).

## 해법 4: 토큰 검증과 리다이렉트 규칙

- **리다이렉트 URI 는 정확히 일치**(문자열 비교). 와일드카드·접두사 매칭 금지. 예외는 네이티브 앱의 루프백 주소 포트뿐.
- 액세스 토큰을 **URL 쿼리에 넣지 않는다**(로그·Referer 로 샌다). `Authorization: Bearer` 헤더로.
- RS 는 토큰의 `aud` 가 **자기 자신**인지 확인한다. 다른 RS 용 토큰은 거부.
- 클라이언트는 ID 토큰에서 `iss` 일치, `aud` 에 자기 `client_id` 포함, `exp`, 서명, 보낸 경우 `nonce` 일치를 확인한다. **ID 토큰을 API 호출용 액세스 토큰으로 쓰지 않는다.**
- 여러 AS 를 쓰는 클라이언트는 응답의 `iss` 파라미터(RFC 9207)로 믹스업 공격을 막는다.

## 해법 5: 브라우저에서 토큰은 어디에

RFC 10017(OAuth 2.0 for Browser-Based Applications, BCP 212, 2026-08)은 SPA 구조를 보안 강도 순으로 셋으로 나눈다.

| 구조 | 브라우저가 가진 것 | 평가 |
| --- | --- | --- |
| **BFF** (Backend for Frontend) | `HttpOnly; Secure; SameSite` 세션 쿠키만 | 가장 강함. 토큰은 서버에만. 민감 데이터·개인정보 앱에 강하게 권장 |
| 토큰 중개 백엔드 | 액세스 토큰(갱신 토큰은 서버) | 중간. 액세스 토큰은 XSS 로 탈취 가능 |
| 브라우저 단독 OAuth 클라이언트 | 액세스·갱신 토큰 모두 | 가장 약함. 공개 클라이언트, PKCE 필수 |

브라우저 단독일 때 저장소별 특징(RFC 10017 §8 요지):

- `localStorage`: 같은 출처의 모든 스크립트가 읽는다. 탭 간 공유, 영속.
- `sessionStorage`: 탭 수명, 탭 간 비공유. 여전히 같은 출처 스크립트가 읽는다.
- 메모리(클로저): 새로고침 때 사라진다. 노출 범위는 가장 좁지만 프로토타입 오염으로 우회될 수 있다.
- Web Worker / Service Worker 격리: 토큰 값 자체는 숨길 수 있다.
- JS 로 쿠키에 토큰 저장: 권장하지 않음.
- 핵심 한계: **XSS 가 있으면 어디에 두든 진다.** 저장소를 격리해도 공격자는 앱과 똑같이 새 인가 흐름을 돌려 토큰을 새로 받을 수 있다. 그래서 BFF 가 권장된다.

갱신 토큰을 공개 클라이언트에 줄 때는 **회전(rotation, 쓸 때마다 새로 발급하고 옛것 무효)** 또는 **송신자 제약(DPoP, mTLS)** 이 필수다(RFC 9700). 회전해도 처음 발급 시점 기준의 최대 수명은 늘리지 않고, AS 세션이 끝나면 함께 끊는다. RFC 10017 예시: 액세스 토큰 10분, 갱신 토큰 최대 8시간.

DPoP 는 토큰을 브라우저의 **추출 불가 WebCrypto 키**에 묶는다. 토큰을 훔쳐도 키 없이는 못 쓴다. 다만 공격자가 새 흐름을 돌려 자기 키에 묶인 토큰을 받는 것은 막지 못한다.

## 언제 쓰나

- 외부 IdP 로그인(구글, 사내 SSO), 여러 앱이 같은 계정 체계를 공유 → OIDC.
- 서드파티에 우리 API 접근 권한을 위임, 마이크로서비스 간 토큰 기반 인가 → OAuth 2.0.
- 내 웹 앱 하나 + 내 백엔드 + 자체 회원가입만 → OAuth 를 들일 필요가 없을 수 있다. [서버 세션](/develop-wiki/knowledge/security/session-vs-jwt/)이 더 단순하다.

## 주의 (비용)

- **직접 AS 를 구현하지 않는다.** Keycloak, Ory, 관리형 IdP 같은 검증된 구현을 쓰고, 클라이언트도 인증된 라이브러리를 쓴다. 명세의 MUST 가 수십 개다.
- 흐름이 늘수록 공격면이 늘어난다. AS 에서 쓰지 않는 grant type 은 끈다.
- BFF 는 프록시 부하와 운영 요소가 생기고, 쿠키 인증이므로 [CSRF](/develop-wiki/knowledge/security/csrf/) 방어가 필요하다(RFC 10017 은 BFF 쿠키에 `SameSite=Strict` 를 권장).
- 스코프는 최소로, 토큰은 대상(`aud`)을 좁게. 토큰이 유효하다는 것과 이 리소스에 접근해도 된다는 것은 다르다 → [접근 제어 설계](/develop-wiki/knowledge/security/access-control-design/).
- 로그인 자체의 강도(비밀번호, MFA)는 OAuth 범위 밖이다. IdP 쪽에서 [MFA·패스키](/develop-wiki/knowledge/security/mfa-passkeys/)를 건다. ID 토큰의 `acr`/`amr` 로 어떤 방식으로 로그인했는지 확인할 수 있다.
