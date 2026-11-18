---
name: OAuth 2.0 / OpenID Connect
url: https://oauth.net/2/
docs: https://openid.net/developers/how-connect-works/
domain: backend
category: auth
description: 위임 인가 표준 OAuth 2.0 과 그 위의 인증 계층 OpenID Connect. 소셜 로그인, SSO, API 액세스 토큰 발급 흐름을 설계할 때 기준이 되는 명세다.
pricing: oss
tags: [oauth2, oidc, sso, jwt, pkce]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
**OAuth 2.0**(RFC 6749)은 사용자가 비밀번호를 넘기지 않고 제3자 앱에 자신의 리소스 접근 권한을 위임하는 **인가** 프레임워크다. 결과물은 API 호출에 쓰는 액세스 토큰이다. **OpenID Connect(OIDC)** 는 OAuth 2.0 위에 "누가 로그인했는가"를 표준화한 **인증** 계층으로, 서명된 JWT 인 ID 토큰, `userinfo` 엔드포인트, 디스커버리 문서(`/.well-known/openid-configuration`)를 추가한다.

현재 기준 문서(2026-11):
| 문서 | 상태 | 요점 |
| --- | --- | --- |
| RFC 6749 / 6750 | 표준 | Authorization Code 등 그랜트, Bearer 토큰 사용 |
| RFC 7636 (PKCE) | 표준 | 코드 탈취 방지. 모든 클라이언트에 권장 |
| RFC 9700 | BCP (2025-01) | 보안 모범 사례: Implicit·비밀번호 그랜트 금지, PKCE, 정확한 redirect URI 일치 |
| OAuth 2.1 | IETF 초안(draft-17) | 위 모범 사례를 묶은 정리판. 아직 RFC 아님 |
| OpenID Connect Core 1.0 | OpenID Foundation 최종 명세 | ID 토큰, 스코프 `openid`, 디스커버리 |

## 설치
명세이므로 설치 대상이 없다. 구현은 인가 서버([Keycloak](/develop-wiki/backend/auth/keycloak/), [Ory Hydra](/develop-wiki/backend/auth/ory/), 관리형 IdP)와 언어별 클라이언트·리소스 서버 라이브러리를 조합한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 역할 | Resource Owner(사용자), Client(앱), Authorization Server(토큰 발급), Resource Server(API) |
| Authorization Code + PKCE | 브라우저 리다이렉트로 코드를 받고 `code_verifier` 와 함께 토큰으로 교환. 웹·모바일·SPA 기본 흐름 |
| Client Credentials | 사용자 없이 서비스 간 호출용 토큰 발급 |
| Device Authorization | 입력이 어려운 기기(TV, CLI)용 흐름 (RFC 8628) |
| 액세스 토큰 / 리프레시 토큰 | 짧은 수명의 API 권한 증명 / 새 액세스 토큰 발급용 |
| 스코프 | 권한 범위(`read:orders`). OIDC 는 `openid profile email` |
| ID 토큰 | OIDC 의 로그인 결과 JWT. `iss`, `sub`, `aud`, `exp`, `nonce` 를 검증 |
| JWKS | 토큰 서명 검증용 공개 키 집합. `jwks_uri` 에서 받는다 |

## 기본 사용법
Authorization Code + PKCE 흐름 요약:
```text
1. 클라이언트: code_verifier(무작위) 생성, code_challenge = BASE64URL(SHA256(code_verifier))
2. 브라우저 → GET /authorize?response_type=code&client_id=app&redirect_uri=...
              &scope=openid%20profile&state=xyz&code_challenge=...&code_challenge_method=S256
3. 사용자 로그인·동의 → redirect_uri?code=abc&state=xyz   (state 일치 확인)
4. 백엔드 → POST /token  grant_type=authorization_code&code=abc&code_verifier=...
5. 응답: access_token, id_token, refresh_token, expires_in
6. API 호출: Authorization: Bearer <access_token>  → 리소스 서버가 서명·aud·exp·scope 검증
```

## 자주 쓰는 패턴
- **BFF 패턴**: SPA 는 토큰을 브라우저에 두지 않고, 백엔드(BFF)가 토큰을 보관한 채 HttpOnly 세션 쿠키만 내려준다.
- **리소스 서버 검증**: API 는 디스커버리 문서의 `jwks_uri` 로 JWT 서명을 로컬 검증하고 `iss`·`aud`·`exp`·스코프를 확인한다. 불투명 토큰이면 introspection(RFC 7662)을 쓴다.
- **리프레시 토큰 회전**: 사용할 때마다 새 리프레시 토큰을 발급하고 재사용을 탐지하면 전체를 폐기한다.
- **라이브러리 선택**: 직접 구현하지 말고 검증된 라이브러리를 쓴다 — Spring Security(Java), Authlib(Python), `golang.org/x/oauth2`·`coreos/go-oidc`(Go), `openid-client`·`jose`(TS), `Microsoft.AspNetCore.Authentication.OpenIdConnect`(C#).
- **로그인만 필요할 때**: 앱 내부 인증은 [Better Auth](/develop-wiki/backend/auth/better-auth/) 같은 라이브러리가 OAuth 소셜 로그인을 대신 처리한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 소셜·기업 SSO 로그인, 여러 앱이 하나의 계정 시스템을 공유할 때, 서드파티에 API 접근을 위임할 때, 서비스 간 인증.
- 피할 때(대안): 단일 서버 웹앱의 자체 로그인만 필요하면 서버 세션 쿠키가 더 단순하다. 비밀번호 없는 로그인은 [WebAuthn/Passkeys](/develop-wiki/backend/auth/simplewebauthn/) 와 함께 설계한다.

## 공식 문서
- [OAuth 2.0 (oauth.net)](https://oauth.net/2/) · [RFC 9700 보안 BCP](https://www.rfc-editor.org/rfc/rfc9700) · [OAuth 2.1 초안](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) · [OpenID Connect 동작 방식](https://openid.net/developers/how-connect-works/) · [OIDC Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
