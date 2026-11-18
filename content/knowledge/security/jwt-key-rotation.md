---
title: JWT 서명 키 회전 (JWKS 와 kid)
aka: [JWT Key Rotation, JWKS, JSON Web Key Set, kid, Signing Key Rollover, jwks_uri, 키 롤오버]
category: security
level: intermediate
summary: 서명 키를 정기·사고 시 바꿔도 발급된 토큰이 끊기지 않게 하는 방법. kid 가 붙은 공개키 집합(JWKS)에 새 키를 먼저 올리고, 검증자는 모르는 kid 에서만 다시 가져온다.
tags: [jwt, jwks, kid, key-rotation, oidc, rfc7517, rfc8725, authentication]
related: [security/session-vs-jwt, security/oauth2-oidc-pkce, security/secrets-management, security/dpop, security/ssrf, distributed-systems/idempotency]
sources:
  - https://openid.net/specs/openid-connect-core-1_0.html
  - https://www.rfc-editor.org/rfc/rfc7517.html
  - https://www.rfc-editor.org/rfc/rfc8725.html
updatedAt: 2026-11-19
---

## 문제

JWT 를 비대칭 키로 서명하면 검증자는 공개키만 있으면 된다. 그런데 키를 영원히 쓸 수는 없다. 정기 교체 정책, 담당자 퇴사, 키 유출 의심, 알고리즘 변경이 있다. 서명 키를 바꾸는 순간 다음이 문제가 된다.

- 이미 발급돼 유효기간이 남은 토큰은 **옛 키**로 서명돼 있다. 옛 키를 즉시 지우면 로그인한 사용자가 한꺼번에 끊긴다.
- 검증자(API 서버)가 공개키를 코드나 설정에 박아 두었다면 키를 바꿀 때마다 전 서비스를 배포해야 한다.
- 검증자가 어느 키로 검증할지 모르면 모든 키를 시도하게 된다.

## 해법: kid + JWKS

1. **JWKS** — 발급자가 공개키 목록(JSON Web Key Set, `{"keys": [...]}`)을 공개 URL(OIDC 의 `jwks_uri`)에 둔다.
2. **kid** — 각 키에 식별자를 붙이고, 서명할 때 JWT 헤더에 같은 `kid` 를 넣는다. RFC 7517 에 따르면 `kid` 는 JWK 집합에서 특정 키를 고르기 위한 것이고, 롤오버 중에 쓰기 좋다. 한 집합 안에서는 서로 다르게 두는 것이 권장(SHOULD)이다.
3. **회전 절차** (OIDC Core 10.1.1 의 방식):
   - 새 키를 JWKS 에 **추가**한다. 서명자는 원하는 때에 새 키로 서명을 시작하고, `kid` 로 검증자에게 알린다.
   - 검증자는 **모르는 `kid`** 를 만나면 `jwks_uri` 에서 키를 다시 가져온다.
   - JWKS 는 **최근에 퇴역한 키를 합리적인 기간 동안 남겨** 매끄러운 전환을 돕는다.

실무 절차로 풀면 이렇다.

| 단계 | 서명 키 | JWKS | 이유 |
| --- | --- | --- | --- |
| 0. 평상시 | A | A | |
| 1. 선공개 | A | A, B | 검증자가 B 를 미리 캐시할 시간을 준다 |
| 2. 전환 | B | A, B | 새 토큰은 B, 기존 토큰은 A 로 계속 검증됨 |
| 3. 퇴역 | B | B | 마지막 A 토큰이 만료된 뒤(≥ 토큰 최대 수명) A 제거 |

(1~3 의 구체적 대기 시간은 OIDC 문서에 정해져 있지 않다. 토큰 수명과 캐시 TTL 에서 정하는 일반 운영 방식이다.)

```ts
import { createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from 'node:crypto';
const b64u = (v: Buffer | string) => Buffer.from(v).toString('base64url');

// ── 발급자: kid 가 붙은 키 목록(JWKS)을 공개하고, 서명에는 현재 키만 쓴다
const issuer = {
  keys: new Map<string, { priv: KeyObject; jwk: object }>(), active: '',
  rotate(kid: string) {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    this.keys.set(kid, { priv: privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'ES256', use: 'sig' } });
    this.active = kid;
  },
  jwks() { return { keys: [...this.keys.values()].map((k) => k.jwk) }; },
  sign(claims: object) {
    const h = b64u(JSON.stringify({ alg: 'ES256', kid: this.active })), p = b64u(JSON.stringify(claims));
    return `${h}.${p}.${b64u(sign('sha256', Buffer.from(`${h}.${p}`), { key: this.keys.get(this.active)!.priv, dsaEncoding: 'ieee-p1363' }))}`;
  },
};

// ── 검증자: 모르는 kid 를 만나면 JWKS 를 다시 받는다. 단, 쿨다운을 둬서 가짜 kid 폭주를 막는다
let jwksFetches = 0;
class Verifier {
  cache = new Map<string, KeyObject>(); lastFetch = -Infinity;
  refresh(now: number) { jwksFetches++; this.lastFetch = now; for (const k of issuer.jwks().keys as any[]) this.cache.set(k.kid, createPublicKey({ key: k, format: 'jwk' })); }
  verify(token: string, now: number): boolean {
    const [h, p, s] = token.split('.'); const { kid, alg } = JSON.parse(Buffer.from(h, 'base64url').toString());
    if (alg !== 'ES256' || typeof kid !== 'string') return false;                 // 알고리즘은 허용 목록으로 고정
    if (!this.cache.has(kid) && now - this.lastFetch > 30) this.refresh(now);     // 쿨다운 30초
    const key = this.cache.get(kid);
    return !!key && verify('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
  }
}
const verifier = new Verifier();
issuer.rotate('2026-11'); const old = issuer.sign({ sub: 'u1' });
console.log(verifier.verify(old, 0));                      // true  (캐시 비어 있어 JWKS 조회 1회)
issuer.rotate('2026-12'); const fresh = issuer.sign({ sub: 'u1' });
console.log(verifier.verify(fresh, 100));                  // true  (새 kid → 재조회)
console.log(verifier.verify(old, 101));                    // true  (옛 키가 JWKS 에 남아 있는 동안 유효)
issuer.keys.delete('2026-11'); verifier.cache.delete('2026-11');   // 옛 키를 JWKS 에서 제거
console.log(verifier.verify(old, 200));                    // false (이제 옛 토큰 거절)
const fake = `${b64u(JSON.stringify({ alg: 'ES256', kid: 'x' }))}.e30.AA`;
console.log(verifier.verify(fake, 201), verifier.verify(fake, 202), 'JWKS 조회', jwksFetches); // 가짜 kid 두 번 → 조회는 1회만 늘어 총 3
```

실행 결과: `true true true false false false JWKS 조회 3`. 옛 키를 JWKS 에서 빼자 옛 토큰이 거절되고, 가짜 `kid` 를 두 번 보내도 쿨다운 덕분에 JWKS 조회는 한 번만 늘었다.

## 검증자가 지킬 것 (RFC 8725)

- **알고리즘을 허용 목록으로 고정**하고, 키 하나는 정확히 한 알고리즘에만 쓴다. 헤더의 `alg` 를 그대로 믿지 않는다. `none` 은 쓰지 않는다.
- `kid` 는 조회에 쓰이는 값이므로 **검증·정제**한다. RFC 는 SQL·LDAP 주입 가능성을 지적한다. 키 저장소를 쿼리로 찾는다면 특히 주의.
- 토큰이 가진 `iss` 와 **JWKS 를 가져온 발급자가 일치**하는지 확인한다. 어떤 발급자에서 키를 가져올지 신뢰할 목록을 미리 정한다.
- JWT 헤더의 `jku`, `x5u`(키를 가져올 URL)를 **맹신하면 SSRF** 가 된다. 허용 위치만 쓰고 쿠키를 보내지 않는다. OIDC 는 ID 토큰에서 `jwk`, `x5u`, `jku`, `x5c` 같은 헤더에 의존하지 말고 키는 사전에 설정된 디스커버리·등록 정보로 정하라고 권한다 → [SSRF](/develop-wiki/knowledge/security/ssrf/).

## 언제 쓰나

- 비대칭 서명(RS256, ES256 등)으로 JWT 를 발급하고 **여러 서비스**가 검증하는 모든 곳(OIDC 공급자, API 게이트웨이).
- 정기 회전 정책이 있거나 키 유출 대응 절차를 만들어야 할 때.

## 주의 (비용)

- **사고 시 회전은 다르다.** 키가 유출됐다면 "옛 키를 남겨 둔다"는 전환 절차가 위조 토큰을 계속 통과시킨다. 즉시 JWKS 에서 빼고 영향받은 토큰을 모두 무효화(재로그인 강제)할 각오를 한다. 공격자가 서명한 토큰도 수명 동안 살아 있기 때문이다.
- **검증자 캐시**: JWKS 를 오래 캐시하면 사고 시 제거가 늦게 반영되고, 너무 짧으면 발급자 가용성에 의존한다. 위 코드의 쿨다운처럼 모르는 `kid` 재조회는 **빈도 제한**을 건다. 아니면 가짜 `kid` 로 JWKS 엔드포인트를 때리는 증폭 공격이 된다.
- 옛 키 보관 기간은 **토큰 최대 수명보다 길어야** 한다. 짧은 수명의 토큰은 회전 부담을 줄인다 → [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/).
- 대칭 키(HS256)를 서비스 간에 공유하면 회전이 모든 당사자의 동시 교체가 되어 어렵다. 여러 검증자가 있다면 비대칭 키를 쓴다(일반 권고).
- 개인키 자체의 보관·접근 통제는 별도 문제다 → [비밀 관리](/develop-wiki/knowledge/security/secrets-management/). 서명을 KMS/HSM 에 맡기면 키가 서버 밖으로 나오지 않는다(일반론).
