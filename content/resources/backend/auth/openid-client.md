---
name: openid-client
url: https://github.com/panva/openid-client
docs: https://github.com/panva/openid-client/blob/main/docs/README.md
repo: https://github.com/panva/openid-client
stars: 2451
domain: backend
category: auth
description: Filip Skokan(panva)이 만든 OAuth 2 / OpenID Connect 클라이언트 라이브러리. Node.js 외 Deno·Bun·Cloudflare Workers 에서 인가 코드·DPoP·PAR 흐름을 구현할 때 쓴다.
pricing: oss
tags: [oauth2, oidc, typescript, javascript, dpop, par, fapi, nodejs]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
openid-client 는 인가 서버에 접속하는 **클라이언트(RP)** 쪽 라이브러리다. v6 부터는 `oauth4webapi` 와 `jose` 위에 만든 함수형 API 로, Fetch API·WebCrypto 만 있으면 어디서나 도는 범용(Universal) ESM 패키지다. 서버 메타데이터 디스커버리, 인가 코드 흐름(OIDC·OAuth 2.0/2.1·FAPI), 리프레시·디바이스·CIBA·클라이언트 자격 증명 그랜트, DPoP, PAR, JAR/JARM, 토큰 인트로스펙션·폐기, 동적 클라이언트 등록, Passport 전략을 다룬다. OpenID Certification 의 Basic, FAPI 1.0, FAPI 2.0 RP 프로파일 적합 인증을 받았다.

라이선스는 MIT, 최신은 **6.9.0**(2026-11-13)이며 Node.js 20 이상이 기준이다(CJS `require` 는 `require(esm)` 가 켜진 Node 에서 가능). v6 이전의 클래스 기반 API(`Issuer`, `Client`)와는 호환되지 않으므로 v5 에서 올릴 때는 마이그레이션 가이드를 확인한다. npm 주간 다운로드는 2천5백만 건 수준(2026-11)이다.

## 설치
```bash
npm install openid-client
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `client.discovery(server, clientId, secret)` | 메타데이터를 읽어 `Configuration` 생성 |
| `buildAuthorizationUrl` | 인가 엔드포인트 URL 생성 (PKCE `code_challenge` 포함) |
| `authorizationCodeGrant` | 콜백 URL 을 받아 토큰 교환 (`pkceCodeVerifier`, `expectedState`) |
| `randomPKCECodeVerifier` / `calculatePKCECodeChallenge` | PKCE 값 생성 |
| `fetchProtectedResource` | 액세스 토큰으로 리소스 서버 호출 |
| `clientCredentialsGrant` | 사용자 없는 서버 간 토큰 발급 |
| `initiateDeviceAuthorization` / `pollDeviceAuthorizationGrant` | 디바이스 코드 흐름 |
| `Configuration` | 서버 메타데이터와 클라이언트 설정을 담은 객체 |

## 기본 사용법
```ts
import * as client from 'openid-client'

const config = await client.discovery(
  new URL('https://issuer.example.test'), 'my-client-id', 'my-client-secret',
)

// 1) 로그인 시작: 세션에 code_verifier 를 저장하고 리디렉션
const code_verifier = client.randomPKCECodeVerifier()
const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)
const redirectTo = client.buildAuthorizationUrl(config, {
  redirect_uri: 'https://app.example.test/callback',
  scope: 'openid profile',
  code_challenge,
  code_challenge_method: 'S256',
})
// → redirectTo.href 로 사용자를 보낸다

// 2) 콜백 처리: 현재 요청 URL 과 저장해 둔 code_verifier 로 토큰 교환
const tokens = await client.authorizationCodeGrant(config, new URL(currentUrl), {
  pkceCodeVerifier: code_verifier,
})
console.log(tokens.access_token)
```

## 자주 쓰는 패턴
- **state 처리**: 서버가 PKCE 를 지원하지 않을 가능성이 있으면 `client.randomState()` 를 만들어 인가 요청에 넣고 `expectedState` 로 검증한다(`serverMetadata().supportsPKCE()` 로 확인).
- **서버 간 호출**: `clientCredentialsGrant(config, { scope, resource })` 로 토큰을 받는다.
- **DPoP·PAR**: 저장소의 `examples/dpop.ts`, `examples/par.ts` 가 기본 흐름과의 차이(diff)를 보여 준다.
- **ID 토큰 클레임**: 토큰 응답의 `tokens.claims()` 로 검증된 ID 토큰 클레임을 읽는다.
- **프레임워크 연동**: Express 등은 Passport 전략을 쓰거나 세션에 `code_verifier` 와 `state` 를 저장해 직접 연결한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 직접 만든 Node/Deno/Workers 앱이 외부 IdP(Keycloak, Auth0, Okta 등)에 OIDC 로그인할 때, FAPI·DPoP 같은 고보안 프로파일이 필요할 때.
- 피할 때(대안): 로그인 UI·세션·DB 까지 포함한 통합 솔루션이 필요하면 [Better Auth](/develop-wiki/backend/auth/better-auth/). 인가 **서버**를 만들려면 이 라이브러리가 아니라 [Keycloak](/develop-wiki/backend/auth/keycloak/) 같은 서버나 `oidc-provider` 를 본다.

## 공식 문서
- [README·빠른 시작](https://github.com/panva/openid-client#readme) · [API 레퍼런스](https://github.com/panva/openid-client/blob/main/docs/README.md) · [예제](https://github.com/panva/openid-client/blob/main/examples/README.md)
- 개념: [OAuth·OIDC](/develop-wiki/backend/auth/oauth-oidc/) · 언어: [TypeScript](/develop-wiki/languages/typescript/)
