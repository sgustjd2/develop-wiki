---
title: private_key_jwt 클라이언트 인증 (RFC 7523)
aka: [private_key_jwt, client_assertion, JWT Bearer Client Authentication, RFC 7523, RFC 10070, rfc7523bis, client_secret_jwt, Audience Injection]
category: security
level: advanced
summary: 토큰 엔드포인트에서 공유 비밀 대신 클라이언트가 개인키로 서명한 JWT 어서션으로 자신을 증명하는 방식. aud 를 발급자 식별자 하나로 고정하는 최신 개정(RFC 10070)이 핵심이다.
tags: [oauth2, client-authentication, rfc7523, rfc10070, jwt, private-key-jwt, oidc, fapi]
related: [security/oauth2-oidc-pkce, security/jwt-algorithm-confusion, security/jwt-key-rotation, security/mtls-certificate-bound-tokens, security/dpop, security/secrets-management, security/kms-hsm-signing-keys, security/fapi-2-security-profile, security/oauth-par-rfc9126, security/openid-ciba-poll-ping-push]
sources:
  - https://www.rfc-editor.org/rfc/rfc7523.html
  - https://www.rfc-editor.org/rfc/rfc10070.html
  - https://datatracker.ietf.org/doc/draft-ietf-oauth-rfc7523bis/
  - https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
  - https://openid.net/specs/fapi-security-profile-2_0-final.html
  - https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html
updatedAt: 2026-11-19
---

## 문제

기밀 클라이언트(서버 앱, 서비스)는 토큰 엔드포인트에서 자신을 증명해야 한다. 기본값인 `client_secret_basic`/`client_secret_post` 는 **공유 비밀**이다.

- 인가 서버도 같은 비밀(또는 복원 가능한 형태)을 저장한다. 서버 DB 가 털리면 모든 클라이언트가 위장 가능하다.
- 비밀이 요청마다 네트워크를 지나고, 로그·프록시에 남을 수 있다.
- 회전할 때 양쪽을 동시에 바꿔야 한다.

## 해법: 서명한 어서션을 보낸다

`private_key_jwt` 는 클라이언트가 **개인키로 서명한 짧은 JWT** 를 `client_assertion` 으로 보내는 방식이다. 인가 서버는 등록된 **공개키**(또는 `jwks_uri`)로 검증만 한다. 개인키는 클라이언트 밖으로 나가지 않는다.

요청 파라미터(RFC 7523 2.2): `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, `client_assertion=<JWT 하나>`. 이것은 **인증 수단일 뿐**이라 `grant_type=client_credentials` 같은 grant 와 함께 보낸다.

| 클레임 | 값 | 비고 |
| --- | --- | --- |
| `iss` | `client_id` | |
| `sub` | `client_id` | 클라이언트 인증에서는 `iss` 와 같아야 한다 |
| `aud` | 인가 서버 | 아래 "audience" 절 |
| `exp` | 만료 시각 | 필수. 너무 먼 값은 서버가 거부해도 된다 |
| `jti` | 고유 ID | OIDC Core 는 재사용 방지용으로 사용을 요구한다 |
| `iat`, `nbf` | 선택 | |

같은 JWT 를 HMAC 으로 서명하고 키로 `client_secret` 을 쓰는 변형이 `client_secret_jwt` 다. 공유 비밀이 남으므로 이 노트의 목적(비밀 제거)에는 맞지 않는다.

```ts
import { randomUUID, sign, KeyObject } from 'node:crypto';
const b64u = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString('base64url');

function clientAssertion(clientId: string, issuer: string, key: KeyObject, kid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u({ alg: 'ES256', kid, typ: 'client-authentication+jwt' });
  const body = b64u({ iss: clientId, sub: clientId, aud: issuer, jti: randomUUID(), iat: now, exp: now + 60 });
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64u(sig)}`;       // 수명 60초, 요청마다 새로 만든다
}
```

서버 쪽 검증 순서(직접 구현해 4가지를 확인했다: 정상 통과, 같은 어서션 재사용 거부, 다른 `aud` 거부, 다른 키로 서명한 것 거부):

1. 알고리즘을 등록값으로 고정하고(`none`·`HS*` 거부), `iss` 로 클라이언트를 찾아 **그 클라이언트의 등록 키**에서 `kid` 로 키를 고른다. 어서션 안의 `jwk`/`jku` 를 믿지 않는다 → [알고리즘 혼동](/develop-wiki/knowledge/security/jwt-algorithm-confusion/).
2. 서명, `sub == iss`, `aud`, `exp` 검증.
3. `jti` 를 `exp` 까지 저장해 두고 재사용을 거부한다.

## audience: RFC 7523 에서 RFC 10070 으로

RFC 7523 은 `aud` 에 인가 서버를 가리키는 값이면 된다고 하고 토큰 엔드포인트 URL 도 허용한다. 이 모호함이 **audience injection** 공격의 원인으로 지적됐다. 스투트가르트 대학 연구진이 OpenID Federation 초안을 분석하다 발견했고, 한 상대를 위해 만든 어서션이 다른 상대에게 통하는 구조다. 이를 닫은 것이 RFC 10070(2026년 11월 발행, Standards Track)이다.

- 클라이언트 인증에서 `aud` 는 인가 서버의 **issuer 식별자 단 하나**여야 한다. 토큰 엔드포인트 URL 은 더 쓰지 못하고, 서버는 이 조건을 어긴 JWT 를 거부해야 한다.
- 인가 그랜트(어서션을 grant 로 쓰는 경우)는 issuer 식별자와 엔드포인트 URL 둘 다 허용된다.
- 헤더 `typ` 는 `client-authentication+jwt` 를 쓰도록 권장한다. 다만 아직 안 붙이는 클라이언트가 많으므로 `typ` 가 없다고 거부하지 말라고 한다.
- 순서 주의: 새 규칙을 따르는 클라이언트는 옛 서버·새 서버에서 모두 동작한다. 서버를 먼저 엄격하게 바꾸면 옛 클라이언트가 깨질 수 있어, 클라이언트를 서버보다 먼저 또는 서버와 함께 갱신해야 할 수 있다고 문서는 적는다(6절).
- 재사용(replay) 방지는 이 개정이 건드리지 않았다. RFC 7523 은 `jti` 추적을 선택 사항으로 둔다. 서버가 직접 정해야 한다.

### RFC 10070 이 고친 문서 (원문 2~5절)

IETF 초안 이름은 `draft-ietf-oauth-rfc7523bis` 이고 마지막 판은 -11 이다(datatracker 상태 RFC). 제목은 RFC 7523 개정처럼 보이지만 머리말의 `Updates:` 는 **RFC 7521, 7522, 7523, 9126** 넷이다.

| 대상 | 바뀐 곳 | 바뀐 내용 |
| --- | --- | --- |
| RFC 7521(어서션 프레임워크) | 5.1 Audience | "토큰 엔드포인트 URL 을 쓸 수 있다" 를 "AS 의 issuer 식별자를 쓸 수 있다" 로 교체. 복수 대상("party or parties")도 단수로 |
| RFC 7522(SAML 프로파일) | 2.2 | **새 애플리케이션은 SAML 어서션으로 클라이언트 인증을 하면 안 된다**(MUST NOT). 기존 사용처의 이전 여부는 구현자 재량 |
| | 3절 2항 | SAML **grant** 의 `<Audience>` 는 issuer, 토큰 엔드포인트 URL, SAML Entity ID 중 적절한 것을 클라이언트가 고른다(MAY). AS 는 자기 신원이 없으면 거부(MUST) |
| RFC 7523(JWT 프로파일) | 3절 3항 | 두 경우로 분리. A) grant: issuer 또는 토큰 엔드포인트 URL. B) 클라이언트 인증: issuer 단일 값 MUST, 토큰 엔드포인트 URL 금지(MUST NOT), AS 에 issuer 가 있어야 함(MUST) |
| | 3.2 | `typ: client-authentication+jwt`(또는 이를 프로파일링한 규격의 더 구체적인 값) SHOULD. `typ` 없다고 거부하는 것은 NOT RECOMMENDED |
| | 5절 | 클라이언트 인증 JWT 에 대해서는 참여자 간 "audience 식별자" 합의가 더는 필요 없음 |
| RFC 9126(PAR) | 2절 마지막 문단 | 전: issuer 를 SHOULD, AS 는 issuer·토큰 엔드포인트·**PAR 엔드포인트 URL** 모두 수락 MUST. 후: issuer 단일 값 MUST, 아니면 거부 MUST |

RFC 7523 개정문은 비교 기준을 RFC 3986 6.2.1 의 단순 문자열 비교(MUST, 애플리케이션 프로파일이 달리 정하지 않는 한)로 유지한다(RFC 7521 의 새 Audience 정의에는 비교 문장이 없다). 즉 끝 슬래시 하나 차이로도 불일치다.

[FAPI 2.0 Security Profile](/develop-wiki/knowledge/security/fapi-2-security-profile/)은 RFC 10070 이전(2025-02)에 이미 같은 방향으로 고정했다. AS 는 클라이언트 인증 어서션의 `aud` 로 자기 issuer 를 **문자열로만** 수락하고(5.3.2.1, shall), 클라이언트는 issuer 를 배열이 아닌 문자열로 보낸다(5.3.3.1, shall). RFC 10070 은 단일 값을 요구하지만 문자열·배열 표기까지 정하지는 않는다(원문에서 해당 문구를 찾지 못했다).

OpenID 규격 중 [CIBA](/develop-wiki/knowledge/security/openid-ciba-poll-ping-push/) Core 7.1 은 백채널 인증 엔드포인트에서 issuer·토큰 엔드포인트·백채널 엔드포인트 URL 을 모두 수락하라(MUST)는 옛 문구를 갖고 있고, RFC 10070 의 개정 대상이 아니다. OpenID 쪽 후속 개정 여부는 확인하지 못했다.

## 언제 쓰나

- 서비스 간(M2M) 인증에서 **서버 쪽에 비밀을 저장하지 않으려는** 경우. 인가 서버가 털려도 공개키만 노출된다.
- 금융 등 높은 보증 프로파일(FAPI)처럼 공유 비밀 방식이 허용되지 않는 환경. FAPI 2.0 은 클라이언트 인증을 mTLS 또는 `private_key_jwt` 로 제한한다(5.3.2.1, shall).
- 개인키를 [KMS·HSM](/develop-wiki/knowledge/security/kms-hsm-signing-keys/)에 두고 서명만 호출하는 구성이 가능할 때.

## 주의 (비용)

- **개인키가 새 비밀이다.** 공유 비밀 문제를 없애는 대신 개인키 보관·회전 절차가 필요하다. 공개키 등록은 `jwks_uri` 로 하면 회전을 자동화할 수 있다 → [키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).
- **jti 저장소가 필요하다.** 서버가 여러 대면 공유 저장소(Redis 등)가 있어야 재사용 검사가 의미 있다. 어서션 수명을 짧게 두면 저장 기간이 줄어든다.
- **시계 오차.** `exp`/`iat` 를 검사하므로 클라이언트 시계가 어긋나면 `invalid_client` 가 난다.
- 이것은 **클라이언트 인증**이다. 액세스 토큰이 유출됐을 때의 사용 제한은 별개의 문제이고 [DPoP](/develop-wiki/knowledge/security/dpop/)나 [mTLS 바운드 토큰](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/)이 맡는다. mTLS 는 클라이언트 인증(`tls_client_auth`)도 겸한다.
- 공개 클라이언트(SPA·모바일)는 비밀·개인키를 숨길 곳이 없으므로 대상이 아니다 → [PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/).

## 비교

| 방식 | 서버가 저장 | 요청에 실리는 것 | 재사용 방지 |
| --- | --- | --- | --- |
| client_secret_basic/post | 비밀(또는 해시 불가한 값) | 비밀 그대로 | 해당 없음 |
| client_secret_jwt | 공유 비밀 | HMAC 서명 JWT | `jti` |
| private_key_jwt | 공개키 | 서명 JWT | `jti` |
| tls_client_auth | 인증서 정보 | TLS 핸드셰이크 | TLS |

## 검증 범위

RFC 7523, RFC 10070, OIDC Core 9절을 읽고 정리했다. RFC 10070 은 2026-11-19 에 1~7절(개정 대상 RFC 7521·7522·7523·9126 의 OLD/NEW 문구)을 rfc-editor.org 원문에서 다시 대조했고, 초안 마지막 판(-11)과 상태는 datatracker API 로 확인했다. RFC 10070 은 최근 발행되어 구현 현황을 확인하지 못했다. FAPI 2.0 Security Profile Final 은 5.3.2.1 과 5.3.3.1 의 클라이언트 인증·`aud` 조항만 원문 Markdown 에서 읽었다. CIBA Core 1.0 은 7.1 을 읽었다.
