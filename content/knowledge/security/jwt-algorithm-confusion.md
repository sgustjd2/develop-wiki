---
title: JWT 알고리즘 혼동 공격 (alg none, RS256→HS256)
aka: [JWT Algorithm Confusion, Key Confusion, alg none, RS256 to HS256, JWT Algorithm Verification, RFC 8725]
category: security
level: intermediate
summary: JWT 헤더의 alg 를 검증자가 그대로 믿을 때 생기는 위조. alg none 으로 서명을 건너뛰거나, RS256 공개키를 HS256 비밀로 오용하게 만드는 공격과 허용 알고리즘 고정이라는 방어.
tags: [jwt, rfc8725, alg-none, key-confusion, hmac, rsa, authentication]
related: [security/jwt-key-rotation, security/session-vs-jwt, security/oauth2-oidc-pkce, security/dpop, security/kms-hsm-signing-keys, security/owasp-top-10, security/secrets-management]
sources:
  - https://www.rfc-editor.org/rfc/rfc8725.html
updatedAt: 2026-11-19
---

## 문제

JWT 헤더의 `alg` 는 "이 토큰을 어떤 알고리즘으로 서명했나"를 **토큰 자신이** 말하는 필드다. 토큰은 공격자가 만들 수 있는 입력이다. 검증자가 이 값을 보고 검증 방식을 고르면 공격자가 방식을 고른다. RFC 8725 2.1절은 이 계열의 두 가지 실패를 든다.

1. **`alg: none`** — 서명 없는 JWT. 일부 라이브러리가 이를 유효로 받아 서명 검사를 건너뛰었다.
2. **키 혼동(RSA ↔ HMAC)** — 서버는 RS256 용 **공개키**를 가지고 있다(JWKS 로 누구나 얻는다). 공격자가 헤더를 `HS256` 으로 바꾸고 그 공개키 바이트를 HMAC 비밀로 써서 서명한다. 검증자가 `alg` 에 따라 "HMAC 이면 가진 키로 검증"하면 통과한다.

## 해법: 알고리즘은 코드가 정한다

RFC 8725 3.1절의 요지:

- 호출자가 **허용 알고리즘을 명시**하고, 그 밖은 모두 거절한다. 헤더의 `alg` 는 "그 허용 목록에 있는가"를 확인하는 데만 쓴다.
- **키 하나는 알고리즘 하나에만** 묶고, 검증 시점에 그 묶음을 확인한다.
- 3.3절: 서명·MAC·복호 등 모든 암호 연산이 성공해야 하고, 하나라도 실패하면 토큰 전체를 거절한다(중첩 JWT 는 두 겹 모두).
- 3.2절: `none` 은 TLS 같은 다른 수단이 토큰을 보호할 때만 의미가 있다. 라이브러리는 호출자가 명시적으로 요청하지 않는 한 서명 없는 토큰을 만들거나 받지 않는 것이 권장된다(SHOULD NOT).

### 실행으로 확인

RSA 키쌍을 만들고 위조 토큰 두 종류를 취약한 검증자와 안전한 검증자에 넣었다.

```ts
import { createHmac, generateKeyPairSync, sign, verify, type KeyObject } from 'node:crypto';
const b64u = (v: Buffer | string) => Buffer.from(v).toString('base64url');
const parse = (t: string) => { const [h, p, s] = t.split('.'); return { h, p, s, header: JSON.parse(Buffer.from(h, 'base64url').toString()) }; };
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;   // 공격자도 아는 값

// 취약: 헤더의 alg 를 믿는다
function vulnerable(token: string): boolean {
  const { h, p, s, header } = parse(token);
  if (header.alg === 'none') return true;
  if (header.alg === 'HS256') return createHmac('sha256', pubPem).update(`${h}.${p}`).digest('base64url') === s; // 공개키를 HMAC 비밀로
  return verify('sha256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url'));
}
// 안전: 허용 알고리즘을 코드가 고정
function safe(token: string): boolean {
  const { h, p, s, header } = parse(token);
  return header.alg === 'RS256' && verify('sha256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url'));
}
```

| 토큰 | 취약 검증자 | 안전 검증자 |
| --- | --- | --- |
| 정상 RS256 | 통과 | 통과 |
| 공격자가 만든 HS256(공개키 PEM 을 비밀로) | **통과** | 거절 |
| 공격자가 만든 `alg: none` | **통과** | 거절 |

별도로 `createHmac('sha256', publicKey)` 처럼 **키 객체(KeyObject)** 를 넘기면 Node 가 `ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE` 로 거절했다. 키에 용도가 묶인 API 를 쓰면 이 혼동이 구조적으로 어려워진다. 반면 PEM 문자열이나 바이트를 그대로 넘기는 API 에서는 막히지 않는다.

## 언제 신경 쓰나

- JWT 를 **직접** 검증하는 모든 코드: 라이브러리 옵션(`algorithms`, `allowedAlgorithms` 등 이름은 라이브러리마다 다름)에 허용 목록을 **항상** 명시한다.
- 같은 발급자가 RS256 과 HS256 을 섞어 쓰거나, 키 조회가 `kid` 로 동적인 시스템(→ [서명 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/)).
- 서명 알고리즘을 바꾸는 마이그레이션 중(ES256 → EdDSA 등). 허용 목록에 둘 다 두되 키마다 알고리즘을 고정한다.

## 주의

- **허용 목록에 `none` 과 대칭 알고리즘을 같이 두지 않는다.** 비대칭 키로 검증하는 서비스에서 HS* 는 허용 목록에서 뺀다. 그러면 공개키가 HMAC 비밀로 쓰일 여지가 없다.
- **약한 대칭 키**는 별개의 문제다. 사람이 외울 수 있는 비밀로 HS256 을 쓰면 토큰 하나만 있어도 오프라인 사전 대입으로 키가 나온다(RFC 8725 2.2절). 대칭 서명 키는 충분한 길이의 난수여야 한다.
- 알고리즘 고정은 **필요조건**이다. `iss`, `aud`, `exp` 검증, `kid` 정제, `jku`/`x5u` 맹신 금지 같은 나머지 규칙은 [서명 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/)의 검증자 절을 참고한다.
- 라이브러리 기본값을 믿지 않는다. 과거 기본값이 `none` 을 허용하던 구현이 있었다는 것이 RFC 의 배경이다. 사용 중인 라이브러리 버전의 문서를 직접 확인한다.
- 가장 근본적인 방어는 **JWT 를 쓰지 않아도 되는 곳에서 안 쓰는 것**이다 → [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/).
