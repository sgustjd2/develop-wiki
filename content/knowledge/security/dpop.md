---
title: DPoP (토큰 소유 증명)
aka: [DPoP, Demonstrating Proof of Possession, RFC 9449, Sender-constrained Token, DPoP Proof, Bearer Token Theft]
category: security
level: advanced
summary: 액세스·리프레시 토큰을 클라이언트의 공개키에 묶고, 요청마다 개인키로 서명한 증명 JWT 를 같이 보내게 해서 토큰이 유출돼도 키 없이는 쓰지 못하게 하는 OAuth 확장(RFC 9449).
tags: [oauth2, dpop, rfc9449, sender-constrained, token-theft, jwt, spa]
related: [security/oauth2-oidc-pkce, security/session-vs-jwt, security/jwt-key-rotation, security/xss, security/mfa-passkeys, security/secrets-management]
sources:
  - https://www.rfc-editor.org/rfc/rfc9449.html
updatedAt: 2026-11-19
---

## 문제

OAuth 의 기본 액세스 토큰은 **bearer 토큰**이다. 가지고 있는 사람은 누구든 쓴다. 로그, 프록시, 악성 라이브러리, 침해된 리소스 서버, XSS 등으로 토큰이 새면 공격자는 그대로 API 를 호출한다. 토큰의 `aud` 를 좁히는 방법(대상 한정)은 현실에서 적용하기 번거롭다고 RFC 는 평가한다.

## 해법: 토큰을 키에 묶는다

DPoP(Demonstrating Proof of Possession, RFC 9449)는 앱 계층에서 토큰을 **송신자 제약(sender-constrained)** 으로 만든다.

1. 클라이언트가 키 쌍을 만든다(개인키는 내보낼 수 없게 보관하는 것이 이상적).
2. 토큰 요청에 **DPoP 증명 JWT** 를 `DPoP` 헤더로 보낸다. 인가 서버는 발급하는 액세스 토큰을 증명에 든 공개키에 묶는다(`token_type` 은 `DPoP`). 공개 클라이언트에게 주는 리프레시 토큰도 같은 키에 묶인다.
3. 리소스를 호출할 때 `Authorization: DPoP <토큰>` 과 함께 **요청마다 새 증명**을 `DPoP` 헤더로 보낸다.
4. 리소스 서버는 증명의 서명을 검증하고, 토큰에 묶인 키와 증명의 키가 같은지, 증명이 이 요청(메서드·URL)과 이 토큰에 대한 것인지 확인한다.

### 증명 JWT 의 내용

헤더: `typ: "dpop+jwt"`, `alg`(비대칭 알고리즘, `none` 과 대칭 알고리즘은 금지), `jwk`(공개키, 개인키 포함 금지).

클레임:

| 클레임 | 의미 |
| --- | --- |
| `jti` | 증명의 고유 ID. 리플레이 감지용. 96비트 이상 난수 또는 UUID v4 권장 |
| `htm` | 요청의 HTTP 메서드 |
| `htu` | 요청 URI(쿼리·프래그먼트 제외) |
| `iat` | 생성 시각 |
| `ath` | 액세스 토큰의 SHA-256 해시(base64url). 토큰과 함께 쓸 때 필수 |
| `nonce` | 서버가 주었을 때 그 값 |

토큰과 키의 연결은 액세스 토큰이 JWT 이면 `cnf.jkt`(공개키 JWK 썸프린트의 SHA-256, RFC 7638)에 넣거나, 토큰 인트로스펙션 응답으로 알려 준다.

### 서버가 확인하는 것 (RFC 9449 4.3, 일부)

`typ`·`alg`·서명, `htm`/`htu` 일치, 허용 시간 창 안의 `iat`(또는 서버가 준 nonce), 토큰이 있으면 `ath` 일치와 토큰에 묶인 키와의 일치. 서버가 nonce 를 줬다면 그 값이 있어야 한다.

```ts
import { createHash, createPublicKey, generateKeyPairSync, randomUUID, sign, verify } from 'node:crypto';
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sha256 = (s: string) => createHash('sha256').update(s).digest();

// ── 클라이언트: 요청마다 새 증명 JWT 를 만든다 (ES256, 헤더에 공개키 jwk)
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const jwk = publicKey.export({ format: 'jwk' });
function makeProof(method: string, url: string, accessToken?: string): string {
  const header = { typ: 'dpop+jwt', alg: 'ES256', jwk };
  const payload: Record<string, unknown> = { jti: randomUUID(), htm: method, htu: url, iat: Math.floor(Date.now() / 1000) };
  if (accessToken) payload.ath = b64u(sha256(accessToken));              // 토큰 해시를 증명에 묶는다
  const input = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
  return `${input}.${b64u(sign('sha256', Buffer.from(input), { key: privateKey, dsaEncoding: 'ieee-p1363' }))}`;
}
// RFC 7638 JWK 썸프린트: 필수 멤버만 사전순으로 직렬화해 SHA-256
const thumbprint = (k: { crv?: string; x?: string; y?: string }) => b64u(sha256(JSON.stringify({ crv: k.crv, kty: 'EC', x: k.x, y: k.y })));

// ── 리소스 서버: 토큰은 jkt 에 묶여 있다 (cnf.jkt). 증명을 검사한다
const seen = new Set<string>();
function check(proof: string, method: string, url: string, token: string, boundJkt: string): string {
  const [h, p, s] = proof.split('.');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString()), c = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (header.typ !== 'dpop+jwt' || header.alg !== 'ES256' || header.jwk.d) return 'bad header';
  const key = createPublicKey({ key: header.jwk, format: 'jwk' });
  if (!verify('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))) return 'bad signature';
  if (c.htm !== method || c.htu !== url) return 'htm/htu mismatch';
  if (Math.abs(Date.now() / 1000 - c.iat) > 60) return 'stale iat';
  if (seen.has(c.jti)) return 'replay'; seen.add(c.jti);
  if (c.ath !== b64u(sha256(token))) return 'ath mismatch';
  if (thumbprint(header.jwk) !== boundJkt) return 'key not bound to token';
  return 'ok';
}

const token = 'opaque-access-token', jkt = thumbprint(jwk), url = 'https://api.example.com/orders';
const proof = makeProof('GET', url, token);
console.log(check(proof, 'GET', url, token, jkt));                       // ok
console.log(check(proof, 'GET', url, token, jkt));                       // replay
console.log(check(makeProof('GET', url, token), 'POST', url, token, jkt)); // htm/htu mismatch
console.log(check(makeProof('GET', url, 'other-token'), 'GET', url, token, jkt)); // ath mismatch
```

실행 결과는 `ok`, `replay`, `htm/htu mismatch`, `ath mismatch` 순서다. 공격자가 훔친 토큰을 **자기 키**로 만든 증명과 같이 보내면 `key not bound to token` 으로 거절된다. 이 코드는 원리 설명용이라 `htu` 정규화, 시간 창의 clock skew, 다중 서버의 `jti` 저장소, `nonce` 는 생략했다.

## 보장하는 것과 못 하는 것

- **유출된 토큰만으로는 못 쓴다.** 개인키가 없기 때문이다. 브라우저에서 WebCrypto 로 **내보낼 수 없는 키**를 만들면 XSS 로 토큰을 빼낸 공격자도 토큰을 독립적으로 쓸 수 없다고 RFC 는 설명한다.
- **클라이언트 코드가 장악되면 끝이다.** XSS 로 코드가 실행되면 공격자는 클라이언트의 키로 증명을 만들어 앱을 경유해 요청할 수 있다. RFC 는 이 범위를 DPoP 가 막지 못하며 XSS 자체를 막아야 한다고 말한다 → [XSS](/develop-wiki/knowledge/security/xss/).
- **증명 미리 생성(pre-generation)**: 키를 쓸 수 있는 공격자는 미래의 `iat` 로 증명을 만들어 빼내 둘 수 있다. 서버가 주는 예측 불가한 **nonce** 로 증명의 수명을 서버가 정하게 하면 막는다. nonce 없이 쓸 때는 `ath` 가 증명을 토큰 수명에 묶으므로, **수명이 긴 DPoP 토큰을 쓰지 말고** 짧은 액세스 토큰과 리프레시 토큰을 쓰라고 권한다.
- **HTTP 본문과 대부분의 헤더는 서명하지 않는다.** 메서드와 URI 만 덮는다. 메시지 무결성은 TLS 가 맡는다. DPoP 는 TLS 를 대체하지 않는다.
- 클라이언트 **인증이 아니다.** 공개 클라이언트(SPA, 모바일 앱)에서 토큰 유출 피해를 줄이는 도구다.

## 다른 방식과 비교

| | bearer | mTLS 인증서 바운드(RFC 8705) | DPoP |
| --- | --- | --- | --- |
| 계층 | - | 전송(TLS) | 애플리케이션(HTTP 헤더) |
| 토큰 유출 시 | 바로 악용 | 인증서 개인키 필요 | 개인키 필요 |
| 브라우저 SPA | 쉬움 | RFC 는 TLS 클라이언트 인증의 사용성이 나빠 쓰기 어렵다고 설명 | 가능 |
| 비용 | 없음 | 인증서 발급·관리 | 요청마다 서명, 서버 검증·리플레이 방어 |

RFC 는 DPoP 가 전송 계층 기반 방식을 쓸 수 없거나 원치 않는 경우(브라우저에 동적으로 내려받는 SPA 등)를 위한 것이라고 서술한다.

## 언제 쓰나

- 공개 클라이언트(SPA, 모바일·데스크톱 앱)가 OAuth 토큰을 쓰고 **토큰 도난 피해를 줄이고 싶을 때**. [OAuth2·PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/)와 함께 쓴다. 인가 코드를 키에 묶는 `dpop_jkt` 인가 요청 파라미터도 있다(선택).
- 높은 권한 API 에서 bearer 토큰 위험을 줄여야 할 때.

## 주의 (비용)

- **리소스 서버가 DPoP 를 지원해야 한다.** 요청마다 서명 검증, 시간 창, `jti` 중복 검사(서버가 여럿이면 공유 저장소 필요)를 한다. RFC 는 상태 공유가 없으면 단일 사용 검사가 어려울 수 있다고 인정한다.
- **키 관리**: 내보낼 수 없는 키(WebCrypto 등)를 어디에 보관할지, 앱 재설치·기기 변경 시 키를 다시 만들어 토큰을 새로 받는 흐름이 필요하다(후자는 일반론).
- nonce 를 쓰면 `use_dpop_nonce` 오류와 재시도로 **왕복이 늘어난다.**
- 시계 오차: 클라이언트와 서버의 시각이 많이 다르면 `iat` 검사가 실패한다. 서버가 시각이 담긴 nonce 를 주면 이 문제를 피할 수 있다.
- 증명 자체는 접근 제어 수단이 아니다. 유효한 DPoP 증명이 있어도 토큰이 유효해야 하고 권한 검사를 별도로 한다.
