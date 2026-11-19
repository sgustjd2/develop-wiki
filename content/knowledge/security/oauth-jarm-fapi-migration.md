---
title: JARM (JWT 보안 인가 응답 모드)과 FAPI 1.0 → 2.0 이전
aka: [JARM, JWT Secured Authorization Response Mode, response_mode=jwt, query.jwt, fragment.jwt, form_post.jwt, FAPI 1.0 Advanced, FAPI 1.0 Part 2, s_hash, detached signature, FAPI 2.0 migration]
category: security
level: advanced
summary: 인가 응답 파라미터를 서명(선택적으로 암호화)한 JWT 하나로 보내는 OpenID 규격 JARM 과, FAPI 1.0 Advanced 에서 JARM·하이브리드 흐름을 쓰던 구현을 FAPI 2.0 으로 옮길 때 바뀌는 점.
tags: [oauth2, openid, jarm, fapi, authorization-response, jwt, mix-up, s_hash, migration, response-mode]
related: [security/fapi-2-security-profile, security/fapi-2-message-signing-rfc9421, security/oauth-jar-rfc9101, security/oauth-par-rfc9126, security/oauth-issuer-mix-up-defense-rfc9207, security/oauth2-oidc-pkce, security/oauth-security-bcp-rfc9700, security/jwt-algorithm-confusion, security/mtls-certificate-bound-tokens, security/dpop]
sources:
  - https://openid.net/specs/oauth-v2-jarm-final.html
  - https://openid.net/specs/oauth-v2-jarm.html
  - https://openid.net/specs/openid-financial-api-part-2-1_0.html
  - https://openid.net/specs/fapi-security-profile-2_0-final.html
  - https://openid.net/specs/fapi-message-signing-2_0-final.html
  - https://openid.net/wg/fapi/specifications/
updatedAt: 2026-11-19
---

## 문제

RFC 6749 의 인가 응답(`code`, `state`)은 리다이렉트 URL 에 평문으로 실린다. 무결성 보호가 없어서 공격자가 다른 사람의 코드를 자기 응답에 끼워 넣거나(응답 파라미터 주입), 여러 인가 서버를 쓰는 클라이언트를 속여 코드를 엉뚱한 곳에 보내게 할 수 있다([mix-up](/develop-wiki/knowledge/security/oauth-issuer-mix-up-defense-rfc9207/)). FAPI 1.0 Advanced(Final, 2021-03-12)는 이를 막기 위해 둘 중 하나를 요구했다(5.2.2).

- `response_type=code id_token`: OIDC 하이브리드 흐름. ID 토큰을 **분리 서명(detached signature)** 으로 쓰고 `c_hash`·`s_hash` 로 `code`·`state` 를 묶는다(5.1.1).
- `response_type=code` + `response_mode=jwt`: **JARM**.

## JARM 이 하는 일

JARM(JWT Secured Authorization Response Mode for OAuth 2.0)은 OpenID FAPI WG 의 **Final(2022-11-09)** 규격이다. 2025-08-17 에 errata set 1 을 반영한 판이 나왔다. 키워드는 RFC 2119 의 MUST/SHOULD 다.

### 응답 JWT (2.1)

| 클레임 | 값 | 강도 |
| --- | --- | --- |
| `iss` | 응답을 만든 AS 의 issuer URL | 항상 포함 |
| `aud` | 응답을 받을 클라이언트의 `client_id` | 항상 포함 |
| `exp` | 만료. 최대 10분 권장 | RECOMMENDED |
| 응답 파라미터 | `code`, `state` 등. **오류 응답도** `error`, `state` 를 JWT 안에 | MUST |

JWT 는 서명하거나, 서명 후 암호화(Nested JWT)한다(2.2).

### 응답 모드 (2.3)

| 값 | 전달 방식 | 비고 |
| --- | --- | --- |
| `query.jwt` | 리다이렉트 URI 쿼리의 `response` 파라미터 | `token`·`id_token` 이 든 응답 유형에는 JWT 를 암호화하지 않는 한 MUST NOT |
| `fragment.jwt` | 프래그먼트의 `response` | |
| `form_post.jwt` | 자동 제출 HTML 폼(POST) | |
| `jwt` | 응답 유형의 기본 인코딩 | `code` 는 `query.jwt`, `token` 및 OIDC 응답 유형(`none` 제외)은 `fragment.jwt` |

### 클라이언트 처리 규칙 (2.4, 5.1)

전제: 클라이언트는 요청을 보낸 AS 를 기억하고 user agent 에 결속해 둔다.

1. (선택) 복호화.
2. `iss` 가 알려진 값이고 이 흐름의 **기대 issuer** 인지 확인. 실패하면 중단 MUST.
3. `aud` 가 요청에 쓴 `client_id` 와 같은지 확인. 실패하면 중단 MUST.
4. `exp` 확인. 실패하면 중단 MUST.
5. 서명 확인, `alg: none` 수락 금지 MUST NOT.
6. 모든 검사가 끝나기 전에는 grant 별 응답 파라미터를 처리하면 안 된다(MUST NOT).

순서가 의미가 있다. `iss` 를 먼저 확인하지 않고 JWT 의 `iss` 로 JWKS 를 찾아가면 공격자가 거대한 키 세트나 느린 서버로 클라이언트를 묶거나 제3자 DDoS 에 이용할 수 있다. 그래서 **키를 가져오기 전에** issuer 가 기대값인지 확인해야 한다(5.1, MUST).

아래는 직접 작성한 클라이언트 검증 스케치다. Node 24 에서 ES256 으로 실행해 정상 통과, 다른 `iss`·`aud`, 만료, 다른 키 서명, `alg: none` 거부를 확인했고, `iss` 불일치일 때는 키 조회가 일어나지 않음을 확인했다.

```ts
import { verify, KeyObject } from 'node:crypto';
const b64u = (s: string) => Buffer.from(s, 'base64url');

export async function verifyJarm(jwt: string, expect: { issuer: string; clientId: string },
                                 getKey: (iss: string, kid?: string) => Promise<KeyObject>) {
  const [h, p, s] = jwt.split('.');
  const head = JSON.parse(b64u(h).toString()), claims = JSON.parse(b64u(p).toString());
  if (claims.iss !== expect.issuer) throw new Error('iss');        // 키 조회 전에 먼저
  if (claims.aud !== expect.clientId) throw new Error('aud');
  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) throw new Error('exp');
  if (head.alg !== 'ES256') throw new Error('alg');                // none 거부, 알고리즘 고정
  const key = await getKey(claims.iss, head.kid);
  if (!verify('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, b64u(s))) throw new Error('sig');
  return claims as { code?: string; state?: string; error?: string }; // 검사 후에만 사용
}
```

### 메타데이터 (3, 4절)

- 클라이언트: `authorization_signed_response_alg`(기본 RS256, `none` 불가), `authorization_encrypted_response_alg`, `authorization_encrypted_response_enc`(alg 지정 시 기본 `A128CBC-HS256`).
- AS: `authorization_signing_alg_values_supported` 등(OPTIONAL), `response_modes_supported` 에 새 값 게시(SHOULD).

## FAPI 1.0 Advanced 의 JARM 요구

| 요구 | 강도 | 절 |
| --- | --- | --- |
| AS: `code id_token` 또는 `code` + `response_mode=jwt` 중 하나를 요구 | shall | 5.2.2 |
| AS: JARM 을 쓰면 JARM 규격대로 응답 생성 | shall | 5.2.2.2 |
| 클라이언트: JARM 을 쓰면 JARM 규격대로 검증 | shall | 5.2.3.2 |
| 알고리즘 PS256 또는 ES256 | shall | 8.6 |

FAPI 1.0 은 JARM 을 OIDC 에도 쓸 수 있다고 설명한다. `response_type=code`, `response_mode=jwt`, `scope=openid` 로 요청하면 JARM 이 인증 응답을 보호하고, 사용자 클레임이 담긴 ID 토큰은 토큰 엔드포인트에서만 받는다. 프런트 채널에 개인정보가 지나가지 않는다(5.1.2 NOTE).

## FAPI 2.0 으로 옮길 때 바뀌는 것

FAPI 2.0 Security Profile(Final, 2025-02-22)의 "Main differences to FAPI 1.0" 표 중 응답과 관련된 행을 정리했다.

| FAPI 1.0 Advanced | FAPI 2.0 | 문서가 든 이유 |
| --- | --- | --- |
| JARM | 응답에 **코드만** | 응답에 남는 것이 코드뿐이라 무결성 보호가 필요 없어짐 |
| `s_hash` | PKCE | `state` 가 맡던 CSRF 방어를 PKCE 가 맡음. `state` 무결성은 PAR 가 일부 보호 |
| `code id_token` 또는 `code` | `code` 만 | 프런트 채널에 ID 토큰 없음(프라이버시). 클라이언트는 nonce·서명 검사를 건너뛸 수 있지만 PKCE 는 건너뛸 수 없음(보안) |
| ID 토큰을 분리 서명으로 | PKCE | ID 토큰이 분리 서명 역할을 할 필요 없음 |
| 프런트 채널의 암호화 ID 토큰 | 프런트 채널 ID 토큰 없음 | 백채널에서만 오가므로 암호화 불필요 |
| JAR | PAR | 요청 무결성과 호환성 |
| 요청 객체 `nbf`·`exp` | `request_uri` 수명 제한 | 요청 미리 만들어 두기 방지 |

JARM 이 막던 위협이 FAPI 2.0 에서 어떻게 처리되는지:

| 위협 | FAPI 1.0 Advanced | FAPI 2.0 |
| --- | --- | --- |
| mix-up | JARM 또는 ID 토큰의 `iss` (8.3.3) | 응답의 `iss` 파라미터(RFC 9207) shall |
| 응답 파라미터 주입(코드 끼워 넣기) | JARM 무결성, 하이브리드의 해시(8.4.3) | PKCE: 코드만 훔쳐서는 교환 불가 |
| CSRF | `state` + `s_hash` | PKCE |
| 응답 부인 방지 | 범위 밖 | 필요하면 **FAPI 2.0 Message Signing 이 JARM 을 다시 요구**(5.4) |

즉 JARM 은 FAPI 2.0 기본 프로파일에서는 빠지고, [Message Signing](/develop-wiki/knowledge/security/fapi-2-message-signing-rfc9421/)의 "인가 응답 서명" 을 고른 생태계에서만 돌아온다. 이때 RFC 9207 의 `iss` 는 JWT 안에만 넣으라고 한다(Message Signing 5.4.1 NOTE).

### 이전 체크리스트 (이 노트의 정리)

1. 응답 유형을 `code` 하나로. 하이브리드(`code id_token`)와 `s_hash` 검증 코드를 걷어 낸다.
2. 인가 요청을 PAR 로 옮기고 PKCE `S256` 을 켠다. 인가 엔드포인트에는 `client_id`, `request_uri` 만 보낸다.
3. 인가 응답의 `iss` 파라미터 확인을 추가한다. JARM 에서 JWT 안 `iss` 로 하던 일이다.
4. 송신자 제약은 mTLS 만이 아니라 DPoP 도 선택할 수 있다.
5. 부인 방지가 규제 요구라면 Message Signing 을 함께 채택하고 JARM(`response_mode=jwt`)을 유지한다.

## 언제 쓰나

- FAPI 1.0 Advanced 생태계에 남아 있거나, FAPI 2.0 Message Signing 으로 인가 응답 서명이 필요할 때.
- 브라우저 히스토리·Referer 로 코드가 새는 것이 걱정되어 응답을 **암호화**하고 싶을 때(5.4, MAY). 단 암호화된 응답 전체가 새어 나갈 수 있으므로 PKCE 는 여전히 필요하다고 문서가 쓴다.
- 여러 AS 를 쓰는 클라이언트에서 RFC 9207 을 아직 지원하지 않는 AS 가 있을 때 mix-up 방어 수단.

## 주의 (비용)

- **키 관리가 늘어난다.** 클라이언트는 AS 서명키(암호화하면 자기 복호화 키까지)를 관리하고, 메타데이터로 키를 찾는 경로를 구현해야 한다(키 획득은 JARM 범위 밖이고 OIDC Discovery·RFC 8414 를 SHOULD).
- **JARM 만으로 흐름 무결성이 보장되지 않는다.** 메시지 하나하나가 서명돼도 다른 흐름의 메시지를 끼워 넣을 수 있다. PKCE 를 함께 쓰라고 한다(5.2).
- **CSRF 는 JARM 범위 밖**이다. 처리 규칙도 CSRF 검사는 별도라고 명시한다(2.4).
- 기본 서명 알고리즘이 RS256 이다. FAPI 1.0 은 PS256·ES256 만 허용하므로 메타데이터로 명시해야 한다.
- **절 번호 주의**: FAPI 1.0 Advanced 는 "JARM, Section 4.3/4.4" 를 인용하지만 JARM 최종본에서 해당 내용(응답 생성·처리 규칙)은 2절이다. 옛 초안 번호로 보이나 어느 판 기준인지는 확인하지 못했다.

## 비교

| 방식 | 보호 대상 | 서명 주체 | 필요 조건 |
| --- | --- | --- | --- |
| JARM | 인가 응답 전체 | AS | JWT 검증 키, 응답 모드 지원 |
| 하이브리드 + `s_hash` | `code`·`state` 해시 | AS(ID 토큰) | OIDC, 프런트 채널 ID 토큰 |
| `iss` 파라미터(RFC 9207) | 발급자 식별만 | 없음(TLS) | AS 지원 |
| [JAR](/develop-wiki/knowledge/security/oauth-jar-rfc9101/) | 인가 **요청** | 클라이언트 | 요청 객체 서명 |

## 검증 범위

openid.net 의 JARM Final(2022-11-09)과 errata set 1 판(2025-08-17) 1~6절을 읽었다(두 판의 차이 대조는 하지 않았다). FAPI 1.0 Part 2 Advanced Final(2021-03-12)의 5.1~5.2.3.2, 8.3.3, 8.4.2, 8.4.3, 8.6 일부를 읽었다. FAPI 2.0 Security Profile Final 의 "Main differences to FAPI 1.0" 표를 원문 Markdown 에서 읽었고, Message Signing Final 의 5.4, 6.6 을 읽었다. 문서 상태는 FAPI WG 명세 목록 페이지(2026-11-19)로 확인했다. 이전 체크리스트는 규격 조항을 엮은 이 노트의 정리이고 규격 문구가 아니다. 위 코드는 직접 작성해 Node 24.21 에서 실행한 스케치이며 JWE 복호화와 키 조회는 다루지 않았다.
