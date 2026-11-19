---
title: CIBA 백채널 인증과 poll·ping·push 모드
aka: [CIBA, Client-Initiated Backchannel Authentication, OpenID Connect CIBA Core 1.0, urn:openid:params:grant-type:ciba, auth_req_id, binding_message, login_hint_token, FAPI-CIBA, decoupled authentication]
category: security
level: advanced
summary: 클라이언트가 사용자 식별자만으로 OP 에 인증을 요청하고, 사용자는 별도 기기(스마트폰)에서 승인하는 OpenID 흐름. 결과를 받는 poll·ping·push 세 모드의 차이와 보안 요구를 정리한다.
tags: [openid, oidc, ciba, backchannel, decoupled-flow, poll, ping, push, fapi, authentication]
related: [security/oauth2-oidc-pkce, security/fapi-2-security-profile, security/private-key-jwt-client-authentication, security/mtls-certificate-bound-tokens, security/dpop, security/oauth-rich-authorization-requests-rfc9396, security/mfa-passkeys, security/oauth-authorization-server-metadata-rfc8414]
sources:
  - https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html
  - https://openid.net/specs/openid-financial-api-ciba-ID1.html
  - https://openid.net/wg/fapi/specifications/
  - https://www.rfc-editor.org/rfc/rfc10070.html
updatedAt: 2026-11-19
---

## 문제

일반 OIDC 흐름은 사용자가 **로그인하려는 그 기기의 브라우저**에서 OP 로 리다이렉트된다. 그런데 이것이 안 되거나 어색한 상황이 있다.

- 콜센터 상담원이 전화한 고객을 인증해야 한다.
- 은행 창구 직원이 대면 고객을 인증해야 한다.
- 매장 결제 단말에서 결제를 사용자 스마트폰으로 승인받고 싶다.

이때 서비스를 쓰는 기기(**Consumption Device, CD**)와 인증·동의하는 기기(**Authentication Device, AD**)가 다르다. CD 는 사용자 것이 아닐 수도 있다(창구 단말, 주유기). CIBA(OpenID Connect Client-Initiated Backchannel Authentication Flow - Core 1.0, **Final, 2021-09-01**)는 클라이언트가 리다이렉트 없이 OP 에 직접 인증을 요청하고, OP 가 AD 로 사용자에게 승인을 받는 흐름이다(1, 2, 6절).

## 해법: 흐름

1. 클라이언트가 **백채널 인증 엔드포인트**에 POST 로 인증 요청(클라이언트 인증 필수, TLS 필수). 사용자를 가리키는 힌트를 **정확히 하나** 보낸다: `login_hint_token`, `id_token_hint`, `login_hint` 중 하나(7.1, REQUIRED).
2. OP 가 즉시 `auth_req_id`, `expires_in`(둘 다 REQUIRED), `interval`(OPTIONAL)을 돌려준다(7.3).
3. OP 가 AD 에서 사용자를 인증하고 동의를 받는다(8절).
4. 결과를 아래 세 모드 중 **등록 때 정한 하나**로 받는다(3, 10절). 클라이언트는 모드를 하나만 등록할 수 있고 OP 는 그 모드로만 전달해야 한다(MUST).

| 요청 파라미터 | 강도 | 요점 |
| --- | --- | --- |
| `scope` | REQUIRED | `openid` 포함 MUST |
| `client_notification_token` | ping·push 면 REQUIRED | OP 가 콜백 때 쓰는 bearer 토큰. 1024자 이하, 엔트로피 최소 128비트(160 권장) MUST |
| `binding_message` | OPTIONAL | CD 와 AD 양쪽에 같은 짧은 문구를 보여 줘 두 화면이 같은 거래임을 사용자가 확인 |
| `user_code` | OPTIONAL | 사용자만 아는 비밀. 남이 사용자 식별자만 알고 AD 에 원치 않는 요청을 띄우는 것을 막음. 클라이언트는 저장 MUST NOT |
| `requested_expiry` | OPTIONAL | `auth_req_id` 수명 희망값 |
| `acr_values` | OPTIONAL | 원하는 인증 수준 |

서명된 인증 요청(7.1.1)도 있다. 모든 파라미터를 JWT 클레임으로 넣고 비대칭 서명 MUST, `aud` 는 OP issuer, `iss` 는 `client_id`, `exp`·`iat`·`nbf`·`jti` 포함 MUST, JWT 밖에 파라미터를 두면 안 된다(MUST NOT). 암호화된 요청은 지원하지 않는다.

## 세 가지 결과 전달 모드

| | Poll | Ping | Push |
| --- | --- | --- | --- |
| 결과 위치 | 토큰 엔드포인트 | 토큰 엔드포인트 | 클라이언트 알림 엔드포인트 |
| OP → 클라이언트 콜백 | 없음 | `auth_req_id` 만 | 토큰 전체(ID·액세스·선택적 리프레시) |
| 클라이언트 → 토큰 엔드포인트 | 반복 호출 | 알림 받은 뒤 1회 | 호출 금지(하면 `unauthorized_client`) |
| 클라이언트 인증 하에 토큰 수령 | 예 | 예 | 아니오 |
| 알림 엔드포인트 등록 | 불필요 | 필요(HTTPS MUST) | 필요(HTTPS MUST) |
| `grant_types` 에 CIBA grant 등록 | MUST | MUST | 불필요 |
| FAPI-CIBA(ID1) | shall 지원 | may 지원 | **shall not 지원** |

FAPI-CIBA ID1 의 AS 요구(5.2.2)는 이 밖에도 기밀 클라이언트만 허용, 서명된 인증 요청(7.1.1) 요구, 서명 요청의 `nbf`·`exp` 로 수명 60분 이내 제한, 요청에 고유한 인가 컨텍스트가 없으면 `binding_message` 요구를 shall 로 둔다.

### Poll (10.1, 11절)

- grant 는 `urn:openid:params:grant-type:ciba`, 파라미터는 `auth_req_id`.
- 폴링 간격은 OP 의 `interval` 보다 짧으면 안 된다(MUST NOT). `interval` 이 없으면 기본 5초 MUST.
- 간격은 **요청을 보낸 시점**부터 잰다. 같은 `auth_req_id` 로 요청을 겹쳐 보내면 안 된다(MUST NOT).
- OP 는 롱 폴링을 쓸 수 있다. 권장 타임아웃 30초, 클라이언트는 최소 30초 기다릴 준비를 해야 한다(should).
- 오류: `authorization_pending`(계속), `slow_down`(이 요청과 이후 모든 요청의 간격을 **최소 5초 늘림** MUST), `expired_token`, `access_denied`. 남의 `auth_req_id` 면 `invalid_grant` MUST. `invalid_request` 를 받으면 같은 `auth_req_id` 로 더 요청하지 않는다.
- 부하가 크면 OP 는 503 + `Retry-After` 를 돌려줄 수 있고 클라이언트는 따라야 한다(should).

아래는 직접 작성한 poll 루프다. 가짜 토큰 엔드포인트로 실행해 요청이 겹치지 않음, `slow_down` 뒤 간격이 5초 늘어남, `access_denied` 에서 중단, 만료 시 종료를 확인했다.

```ts
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function pollCiba(authReqId: string, intervalSec = 5, expiresInSec: number,
    tokenRequest: (id: string) => Promise<{ status: number; body: any }>) {
  let interval = intervalSec;                                  // 응답에 없으면 5초
  const deadline = Date.now() + expiresInSec * 1000;
  while (Date.now() < deadline) {
    const sentAt = Date.now();
    const res = await tokenRequest(authReqId);                 // 응답을 받은 뒤에만 다음 요청
    if (res.status === 200) return res.body;
    const err = res.body?.error;
    if (err === 'slow_down') interval += 5;                    // 이후 모든 요청에 적용
    else if (err !== 'authorization_pending') throw new Error(err ?? `HTTP ${res.status}`);
    const wait = sentAt + interval * 1000 - Date.now();        // 간격은 보낸 시점부터
    if (wait > 0) await sleep(wait);
  }
  throw new Error('expired_token');
}
```

### Ping (10.2)

- OP 는 `Authorization: Bearer <client_notification_token>` 과 본문 `{"auth_req_id": ...}` 로 알림 엔드포인트를 호출한다.
- 클라이언트는 토큰이 유효하고 **그 `auth_req_id` 에 연결된 것인지** 확인 MUST, 아니면 401 SHOULD. 정상이면 204 SHOULD(OP 는 200 도 수락 SHOULD).
- 클라이언트는 3xx 를 돌려주면 안 되고(MUST NOT), OP 는 리다이렉트를 따라가면 안 된다(MUST NOT).
- ping 클라이언트가 폴링해도 되고, 그러면 OP 는 poll 클라이언트로 취급한다(NOTE).

### Push (10.3)

- OP 가 토큰 응답 전체에 `auth_req_id` 를 더해 알림 엔드포인트로 보낸다.
- 위변조 방지를 위해 ID 토큰에 `at_hash`, `urn:openid:params:jwt:claim:auth_req_id`, (리프레시 토큰이 있으면) `urn:openid:params:jwt:claim:rt_hash` 를 넣어야 한다(MUST). 이 클레임은 push 모드에서만 요구된다.
- 클라이언트는 ID 토큰을 분리 서명으로 검증하고, `auth_req_id` 클레임 일치, `at_hash`·`rt_hash` 로 토큰 검증 MUST.
- 오류는 push 오류 페이로드(`error`, `auth_req_id` REQUIRED)로 온다. 코드는 `access_denied`, `expired_token`, `transaction_failed`(12절).

### 송신자 제약 토큰과 push (5절)

push 는 토큰 엔드포인트를 거치지 않아 mTLS 결속 시점이 없다. OP 는 백채널 인증 엔드포인트에서 제시된 키 자료(예: 인증서 SHA-256 지문)를 기록해 두고 push 로 발급하는 토큰을 그 키에 결속하라고 한다(should).

## 언제 쓰나

- 콜센터·창구처럼 **CD 가 사용자 소유가 아니거나** 사용자가 CD 에 자격 증명을 입력하면 안 되는 경우.
- POS·키오스크 결제를 사용자 폰 앱으로 승인하는 경우.
- 이미 로그인한 웹 세션에서 고위험 동작만 폰으로 추가 확인(step-up)할 때. 문서는 사용자와 보안 컨텍스트가 이미 있는 클라이언트는 `user_code` 없이 허용하는 것이 보통이라고 쓴다(7.1.2).
- 모드 선택(이 노트의 정리): 기본은 **poll**(구현이 단순, 알림 엔드포인트 불필요). 지연을 줄이고 싶으면 **ping**(토큰은 여전히 클라이언트 인증 하에 수령). **push** 는 알림 엔드포인트가 토큰을 직접 받으므로 고보안 프로파일에서는 피한다.

## 주의 (비용)

- **원치 않는 승인 요청(푸시 폭탄)**: 사용자 식별자(전화번호 등)만 알면 누구나 그 사용자의 AD 에 요청을 띄울 수 있다. `user_code`, 서명된 `login_hint_token`(14절, SHOULD), 클라이언트 등록 심사로 줄인다. 사용자가 습관적으로 승인하지 않게 `binding_message` 를 화면 양쪽에 보여 준다.
- **알림 엔드포인트 신뢰**: OP 는 등록된 `backchannel_client_notification_endpoint` 가 실제로 그 클라이언트 관할인지 확인해야 한다(SHOULD). 아니면 인증 결과가 엉뚱한 곳으로 간다(14절).
- **push 의 위험**: FAPI-CIBA 는 클라이언트가 소유한 엔드포인트로 토큰을 보내는 방식이 확립된 패턴(클라이언트 인증 후 토큰 엔드포인트에서 수령)과 달라 알려지지 않은 보안 문제가 있을 수 있다며 금지한다(FAPI-CIBA ID1 7.8). ping 의 `client_notification_token` 도 송신자 제약이 없어, 유출되면 공격자가 클라이언트에게 토큰 엔드포인트를 반복 호출하게 만들 수 있다(대부분 큰 문제는 아니라고 평가).
- **힌트로 권한 정보를 보내지 말 것**: FAPI-CIBA 는 `login_hint`·`login_hint_token` 은 사용자 식별용이며, 결제 의도 ID 같은 인가 메타데이터를 싣지 말라고 한다(should not). 복잡한 인가 정보는 별도 파라미터나 [RAR](/develop-wiki/knowledge/security/oauth-rich-authorization-requests-rfc9396/) 같은 방식으로.
- **`id_token_hint` 검증의 애매함**: 원래 클라이언트용으로 발급된 ID 토큰이라 표준 JWT 검증을 그대로 적용할 수 없다. 만료된 것도 한동안 받아야 하고, 키 회전 때문에 서명 검증이 불가능할 수도 있다(14절).
- **개인정보**: 전화번호·이메일 같은 정적 전역 식별자를 쓰면 프라이버시 문제가 있다. 페어와이즈 `sub` 가 든 ID 토큰을 힌트로 쓰거나 AD 에서 일회용 식별자(QR)를 넘기는 대안을 제시한다(15절).
- **`aud` 처리 차이**: CIBA 7.1 은 JWT 클라이언트 어서션의 `aud` 로 issuer 를 SHOULD 로 권하면서 OP 는 issuer·토큰 엔드포인트 URL·백채널 인증 엔드포인트 URL 을 모두 수락하라고(MUST) 한다. IETF 의 [RFC 10070](/develop-wiki/knowledge/security/private-key-jwt-client-authentication/)은 RFC 7523·PAR 의 클라이언트 인증 `aud` 를 issuer 하나로 좁혔지만 CIBA 는 그 개정 대상 목록에 없다. OpenID 쪽에서 CIBA 를 같이 고쳤는지는 확인하지 못했다. 클라이언트는 issuer 하나만 쓰는 것이 양쪽 규칙과 모두 맞는다.

## 비교

| 흐름 | 사용자 상호작용 기기 | 사용자를 아는 방법 | 결과 수령 |
| --- | --- | --- | --- |
| 인가 코드(+PKCE) | 같은 기기의 브라우저 | 리다이렉트 중 로그인 | 리다이렉트 → 토큰 엔드포인트 |
| Device Authorization(RFC 8628) | 다른 기기(사용자가 코드 입력) | 사용자가 다른 기기에서 로그인 | 폴링 |
| CIBA | 다른 기기(OP 가 AD 로 요청을 보냄) | **클라이언트가 힌트로 지정** | poll·ping·push |

Device Authorization 과 겉모습(폴링, `slow_down`)이 비슷하지만, CIBA 는 클라이언트가 **누구를 인증할지 먼저 안다**는 점이 다르다(RFC 8628 원문은 이 노트에서 읽지 않았다. 차이는 CIBA 원문의 정의로 정리).

## 검증 범위

openid.net 의 CIBA Core 1.0 Final(2021-09-01) 1~15절을 읽고 MUST/SHOULD 를 대조했다(16절 IANA 와 참고 문헌 제외). FAPI-CIBA 는 openid.net 의 Implementer's Draft 1 파일(머리말 표기 "Draft-02", 2019-08-15)의 서버·클라이언트 요구와 보안 고려 중 poll·ping·push, 힌트 관련 문장만 읽었다. 이 파일이 최신 ID 인지와 작업본(fapi-ciba)과의 차이는 FAPI WG 명세 목록 페이지(2026-11-19)로 상태만 확인했다. RFC 10070 은 개정 대상(RFC 7521·7522·7523·9126)을 원문에서 확인했다. FAPI 2.0 과 CIBA 를 함께 쓰는 프로파일 문서는 읽지 않았다. poll 루프는 직접 작성해 Node 24.21 에서 가짜 토큰 엔드포인트로 실행한 스케치다.
