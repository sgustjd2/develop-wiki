---
title: OAuth 푸시 인가 요청 PAR (RFC 9126)
aka: [Pushed Authorization Requests, PAR, RFC 9126, pushed_authorization_request_endpoint, request_uri, require_pushed_authorization_requests, 푸시된 인가 요청]
category: security
level: advanced
summary: 클라이언트가 인가 파라미터를 브라우저 URL 이 아니라 인가 서버로 직접(백채널) POST 해 두고, 돌아온 짧은 request_uri 만 리다이렉트에 싣게 하는 규격(RFC 9126).
tags: [oauth2, rfc9126, par, request_uri, authorization-request, back-channel, client-authentication, pkce]
related: [security/oauth-jar-rfc9101, security/oauth2-oidc-pkce, security/private-key-jwt-client-authentication, security/oauth-authorization-server-metadata-rfc8414, security/oauth-issuer-mix-up-defense-rfc9207, security/oauth-resource-indicators-rfc8707, security/dpop]
sources:
  - https://www.rfc-editor.org/rfc/rfc9126.html
  - https://www.rfc-editor.org/rfc/rfc9101.html
updatedAt: 2026-11-19
---

## 문제

표준 인가 코드 흐름에서 인가 요청 파라미터(`redirect_uri`, `scope`, `code_challenge`, `state`, 확장 파라미터 …)는 **브라우저를 거쳐 쿼리 문자열**로 간다. 그래서:

- 사용자(또는 브라우저 확장·악성 스크립트)가 값을 **바꿀 수** 있다. 인가 서버는 요청이 온전한지 알 수 없다.
- 요청의 출처 클라이언트를 **인증하지 못한다.** `client_id` 는 공개 값이다.
- 파라미터가 많으면 URL 이 길어진다(리치 인가 요청 등).
- 값이 브라우저 기록·Referer·로그에 남는다.

([JAR](/develop-wiki/knowledge/security/oauth-jar-rfc9101/)는 요청을 JWT 로 서명해 이를 막지만, 서명·키 관리를 모든 클라이언트가 해야 한다.)

## 해법

1. 클라이언트가 인가 서버의 **PAR 엔드포인트**(`pushed_authorization_request_endpoint`, HTTPS)에 `application/x-www-form-urlencoded` 로 인가 파라미터를 **POST** 한다. 클라이언트는 **토큰 엔드포인트와 같은 방식으로 인증**한다(예: [private_key_jwt](/develop-wiki/knowledge/security/private-key-jwt-client-authentication/)).
2. 서버는 클라이언트를 인증하고 요청을 인가 엔드포인트와 같은 기준으로 검증한 뒤 **`201 Created`** 로 `request_uri` 와 `expires_in`(양의 정수 초, 보통 짧음)을 준다.
3. 클라이언트는 브라우저를 `client_id` + `request_uri` 만으로 인가 엔드포인트에 리다이렉트한다.
4. 서버는 저장해 둔 요청을 꺼내 다시 검증하고, 사용자 인증·동의를 진행한다.

```text
POST /par HTTP/1.1                         HTTP/1.1 201 Created
Content-Type: application/x-www-form-urlencoded
client_id=c1&response_type=code            {"request_uri":"urn:ietf:params:oauth:request_uri:Xk3...",
&redirect_uri=https%3A%2F%2Fapp%2Fcb        "expires_in":60}
&scope=read&code_challenge=...&code_challenge_method=S256
                                           GET /authorize?client_id=c1&request_uri=urn:ietf:params:oauth:request_uri:Xk3...
```

핵심 규칙(RFC 9126):

- **`request_uri` 는 PAR 요청에 넣을 수 없다.** 있으면 거부한다.
- `request_uri` 는 암호학적으로 강한 무작위 성분을 갖고 **그 클라이언트에 묶인다.** 서버가 `urn:ietf:params:oauth:request_uri:` 접두사를 쓸 수 있다.
- **1 회용**: 클라이언트는 한 번만 써야 하고(MUST), 서버도 강제하는 것이 권장된다(SHOULD, 새로고침 중복은 허용해도 된다).
- 서버는 푸시 때 검증할 수 없던 항목을 **인가 엔드포인트에서 다시** 검증한다. 클라이언트 정책이 그 사이 바뀌었으면 그 결과가 우선이다.
- 오류는 토큰 엔드포인트 형식이다. 기본은 `invalid_request`. `405`(POST 아님), `413`(너무 큼), `429`(속도 제한)도 가능하다. `consent_required` 같은 상호작용 오류는 이 단계에 없다.
- 서버·클라이언트 메타데이터 **`require_pushed_authorization_requests`**(기본 `false`)가 참이면 PAR 로 얻은 `request_uri` 없는 인가 요청은 `invalid_request` 로 거부된다. 이게 없으면 공격자가 PAR 를 우회한 일반 요청을 보낼 수 있다.

PKCE 값(`code_challenge`, `code_challenge_method`)은 다른 파라미터처럼 푸시한다. 서명된 JAR 요청 객체를 `request` 파라미터로 푸시할 수도 있고, 이 경우 서버는 JAR 규칙대로 검증하며 인증된 클라이언트의 `client_id` 와 일치해야 한다. 서버·클라이언트 정책이 서명된 요청 객체를 요구하는데 어긋나면 `400 invalid_request` 다.

```ts
// 인가 서버 쪽 스케치 (검증 로직 일부만)
import { randomBytes } from 'node:crypto';
const store = new Map<string, { client: string; params: Record<string, string>; exp: number; used: boolean }>();
function push(client: string, params: Record<string, string>) {
  if (params.request_uri) throw new Error('invalid_request');
  const ru = 'urn:ietf:params:oauth:request_uri:' + randomBytes(16).toString('base64url');
  store.set(ru, { client, params, exp: Date.now() + 60_000, used: false });
  return { status: 201, request_uri: ru, expires_in: 60 };
}
function authorize(clientId: string, ru: string) {
  const e = store.get(ru);
  if (!e || e.client !== clientId || e.used || e.exp < Date.now()) throw new Error('invalid_request_uri');
  e.used = true; return e.params;
}
```

(정상 경로, 재사용 거부, 다른 클라이언트 거부, `request_uri` 포함 요청 거부를 실행해 확인했다. 난수는 CSPRNG 로 128 비트다.)

## 언제 쓰나

- 요청 무결성과 출처 인증이 필요한 고보안 환경(특정 산업 프로파일의 요구 사항은 이 노트에서 읽지 않았다).
- 리치 인가 요청, 많은 scope, 큰 `claims` 같은 **긴 파라미터**.
- 브라우저·로그에 요청 내용을 남기고 싶지 않을 때.
- JAR 의 서명 부담 없이(대신 클라이언트 인증으로) 요청 무결성을 얻고 싶을 때.

## 주의 (비용)

- **추가 왕복과 서버 상태**가 생긴다. 인가 서버는 `request_uri` 를 만료 때까지 저장해야 하고, 클라이언트는 매 인가마다 백채널 호출을 한다. 서버는 저장 용량과 PAR 엔드포인트 부하·`429` 정책을 설계한다.
- PAR 엔드포인트가 **클라이언트 인증 대상**이므로 비밀 없는 공개 클라이언트(SPA·모바일)는 인증할 수단이 약하다. 이 경우 요청 출처 인증 이점이 줄어든다. 공개 클라이언트가 PAR 를 쓰면 `redirect_uri` 등록 정책을 별도로 강화해야 한다는 점은 이 노트의 의견이다.
- **개방 리다이렉트**: RFC 는 PAR 로 새 `redirect_uri` 를 올릴 수 있는 것은 **인증된 클라이언트뿐**이어야 한다고 한다. 서버가 푸시된 `redirect_uri` 를 사전 등록과 대조하는 규칙을 약화하지 않는다.
- **`request_uri` 바꿔치기**(공격자가 자기 `request_uri` 를 피해자 흐름에 끼움): RFC 는 PKCE, 고유한 `state`, OIDC `nonce` 로 요청을 세션에 묶으라고 한다. PAR 가 PKCE 를 대체하지 않는다.
- 짧은 `expires_in`(수십 초)이므로 사용자가 로그인 화면에서 오래 머물면 만료된다. 클라이언트는 푸시 직후에만 리다이렉트하고 만료 시 처음부터 다시 한다.
- `request_uri` 추측: 엔트로피를 충분히 둔다(JAR 는 128 비트 이상 권장).
- 인가 서버가 PAR 를 **필수**로 하려면 `require_pushed_authorization_requests` 를 켜고, 기존 클라이언트의 마이그레이션 계획을 둔다.

## 비교

| 항목 | 일반 인가 요청 | PAR (RFC 9126) | JAR 값 전달 (`request`) | JAR 참조 (`request_uri`) |
| --- | --- | --- | --- | --- |
| 파라미터 경로 | 브라우저 쿼리 | 백채널 POST | 브라우저 쿼리(JWT) | 클라이언트가 호스팅한 URL |
| 변조 방지 | 없음 | 서버가 직접 받음 | JWS 서명 | JWS 서명 |
| 출처 클라이언트 인증 | 없음 | 요청 시 클라이언트 인증 | 서명키(요청 객체) | 서명키 + 서버가 URL 을 가져옴 |
| 서버의 추가 호출 | 없음 | 없음 (클라이언트 → 서버) | 없음 | 서버가 클라이언트 URL 을 GET (SSRF·DoS 위험) |
| URL 길이 | 길어질 수 있음 | 짧음 | 매우 길 수 있음 | 짧음 |
| 서버 상태 | 없음 | `request_uri` 저장 | 없음 | 가져온 객체 |

PAR 와 JAR 는 **함께** 쓸 수 있다(요청 객체를 푸시). 자세한 요청 객체 규칙은 [JAR](/develop-wiki/knowledge/security/oauth-jar-rfc9101/) 노트에서 다룬다.

## 검증 범위

RFC 9126 전문(엔드포인트, 인증, 응답, 오류, 인가 엔드포인트 사용, 메타데이터, 보안 고려)의 요약본과 RFC 9101 의 `request_uri` 엔트로피 권고를 읽었다. 위 서버 로직은 일부 검증 규칙만 실행해 확인했고, 실제 인가 서버 구현(Keycloak·Authlete 등)의 PAR 지원 방식은 읽지 않았다. FAPI 등 프로파일의 PAR 필수 여부도 확인하지 않았다.
