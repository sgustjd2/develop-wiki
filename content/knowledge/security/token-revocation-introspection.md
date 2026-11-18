---
title: 토큰 취소와 인트로스펙션 (RFC 7009 · RFC 7662)
aka: [Token Revocation, Token Introspection, RFC 7009, RFC 7662, Opaque Token, Reference Token, 토큰 폐기, Denylist]
category: security
level: intermediate
summary: 발급한 OAuth 토큰을 서버가 나중에 무효화하는 취소 엔드포인트(RFC 7009)와, 리소스 서버가 토큰의 현재 상태를 묻는 인트로스펙션(RFC 7662). 캐시 TTL 이 곧 취소 지연이다.
tags: [oauth2, rfc7009, rfc7662, revocation, introspection, opaque-token, jwt]
related: [security/session-vs-jwt, security/oauth2-oidc-pkce, security/dpop, security/mtls-certificate-bound-tokens, security/jwt-key-rotation, security/jwt-algorithm-confusion, performance/caching-strategies]
sources:
  - https://www.rfc-editor.org/rfc/rfc7009.html
  - https://www.rfc-editor.org/rfc/rfc7662.html
updatedAt: 2026-11-19
---

## 문제

자가 포함 토큰(JWT)은 리소스 서버가 서명만 보고 받아들이므로 빠르고 상태가 없다. 그 대가로 **발급 후에는 거둘 방법이 없다.** 사용자가 로그아웃하거나, 기기를 잃어버렸거나, 앱 권한을 회수했거나, 토큰이 유출됐을 때 토큰은 `exp` 까지 살아 있다. 반대로 매 요청마다 인가 서버에 묻는 방식은 즉시성이 높은 대신 인가 서버가 모든 API 호출의 경로에 들어간다.

## 해법: 취소와 인트로스펙션, 두 엔드포인트

### 취소 (RFC 7009)

클라이언트가 토큰 취소 엔드포인트에 POST(`application/x-www-form-urlencoded`)한다.

- 필수 `token`, 선택 `token_type_hint`(`access_token` | `refresh_token`). 힌트는 조회 속도용이고, 틀리면 서버가 다른 종류도 찾아야 한다.
- 서버는 요청 클라이언트를 **인증**하고, 그 토큰이 **그 클라이언트에게 발급된 것인지** 확인한 뒤 취소한다.
- 성공이든, 이미 무효였든 **HTTP 200** 을 준다. 토큰이 유효했는지 여부를 응답으로 알려 주지 않는다. 추가 오류 코드는 `unsupported_token_type` 하나다. 503 이면 클라이언트는 토큰이 아직 살아 있다고 가정하고 나중에 재시도한다.
- **리프레시 토큰 취소는 서버가 반드시 지원**하고 같은 grant 로 발급된 액세스 토큰도 같이 무효화하는 것이 권장된다. 액세스 토큰 취소는 SHOULD 다. 자가 포함 토큰은 서버가 별도 상태를 두지 않으면 즉시 취소할 수 없다고 RFC 는 인정하고, 수명을 짧게 하는 것을 대안으로 든다.
- 취소는 남용 방지에 도움이 되지만 **토큰 탈취를 막지는 않는다.**

### 인트로스펙션 (RFC 7662)

리소스 서버가 인트로스펙션 엔드포인트에 `token` 을 POST 하면 JSON 을 받는다.

- 필수 필드는 `active`(불리언)뿐이다. 선택 필드: `scope`, `client_id`, `username`, `token_type`, `exp`, `iat`, `nbf`, `sub`, `aud`, `iss`, `jti`.
- 비활성·모르는 토큰·그 호출자에게 보여줄 수 없는 토큰은 **200 + `{"active": false}`** 하나로 답한다. 사유를 덧붙이지 않는다.
- 호출자 **인증이 필수**다(토큰 스캐닝 방지). 어떤 리소스가 어떤 토큰을 조회할 수 있는지도 제한하는 것이 권장된다.
- 같은 토큰에 대해 호출 리소스마다 다른 수준의 정보를 줄 수 있다. 응답에 개인 식별 정보가 들어갈 수 있으므로 리소스별 식별자를 쓰거나 필드를 줄이라고 한다.
- **캐시**: 리소스 서버가 응답을 캐시해 부하를 줄일 수 있지만 그동안 취소가 반영되지 않는다. 민감한 리소스는 캐시를 끄고, `exp` 가 있으면 그 이후까지 캐시하지 않는다.

## 취소 지연을 숫자로 보기

리소스 서버가 인트로스펙션 결과를 TTL 초만큼 캐시한다고 하자. 인가 서버에서 토큰을 취소한 순간부터 리소스 서버가 그 토큰을 계속 받아들이는 시간을 가상 시계로 모의했다(1초당 1요청, 취소 시각을 60가지로 바꿔 평균·최대를 구함).

```ts
type Intro = { active: boolean; exp?: number };
class AuthServer {
  calls = 0; revoked = new Set<string>(); exp = new Map<string, number>();
  issue(t: string, now: number, life: number) { this.exp.set(t, now + life); }
  revoke(t: string) { this.revoked.add(t); }
  introspect(t: string, now: number): Intro {
    this.calls++;
    const e = this.exp.get(t);
    return e === undefined || e <= now || this.revoked.has(t) ? { active: false } : { active: true, exp: e };
  }
}
class ResourceServer {
  cache = new Map<string, { r: Intro; until: number }>();
  as: AuthServer; ttl: number;
  constructor(as: AuthServer, ttl: number) { this.as = as; this.ttl = ttl; }
  accept(t: string, now: number): boolean {
    const c = this.cache.get(t);
    if (c && c.until > now) return c.r.active && (c.r.exp ?? Infinity) > now;
    const r = this.as.introspect(t, now);
    this.cache.set(t, { r, until: now + this.ttl });
    return r.active;
  }
}
```

| 캐시 TTL | 취소 후 추가로 허용된 시간(최대 / 평균) | 인가 서버 조회(300요청당 평균) |
| --- | --- | --- |
| 0초 | 0 / 0 | 300회 |
| 5초 | 4초 / 2.0초 | 60회 |
| 30초 | 29초 / 14.5초 | 10회 |
| 60초 | 59초 / 29.5초 | 5회 |

취소 지연의 최댓값은 대략 TTL, 평균은 TTL 의 절반이고, 인가 서버 부하는 TTL 에 반비례한다. 이 둘의 교환 비율을 **리소스의 민감도**에 따라 정한다. 이 표는 단일 토큰·균일 트래픽 가정의 모형이다. 실제 부하는 토큰 수와 요청 분포에 따라 다르다.

## 설계 선택지

| 방식 | 즉시 취소 | 요청당 비용 | 비고 |
| --- | --- | --- | --- |
| 짧은 JWT(수 분) + 리프레시 토큰 취소 | 수 분 지연 | 서명 검증만 | 가장 단순. 리프레시 취소는 즉시 |
| JWT + 거부 목록(`jti`/`sub` 별) | 목록 전파 지연만 | 목록 조회 | 목록 크기는 토큰 수명으로 제한됨. 상태가 생겨 JWT 의 장점이 줄어듦 |
| opaque 토큰 + 인트로스펙션(캐시 없음) | 즉시 | 네트워크 왕복 | 인가 서버가 가용성의 핵심 경로 |
| opaque 토큰 + 짧은 캐시 | TTL 만큼 지연 | 대부분 캐시 적중 | 위 표 |

## 언제 쓰나

- 로그아웃·권한 회수·기기 분실에 대응하는 **되돌리기** 수단이 필요할 때. 최소한 리프레시 토큰 취소는 항상 제공한다.
- 외부 서드파티 리소스 서버가 우리 토큰을 확인해야 하고 JWT 를 열어볼 수 없는(또는 열면 안 되는) 구조일 때 인트로스펙션.
- 사고 대응: 서명 키 유출이면 개별 취소가 아니라 키 교체와 전면 재로그인이다 → [서명 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).

## 주의 (비용)

- **취소 가능성은 설계 시점에 정한다.** 액세스 토큰이 자가 포함이면서 즉시 취소가 요구사항이면 결국 상태 조회가 생긴다. 상태 없음과 즉시 취소는 동시에 얻을 수 없다 → [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/).
- **인트로스펙션 엔드포인트는 공격 표면이다.** 인증이 없으면 토큰 유효성 오라클이 된다. TLS 와 호출자 인증, 속도 제한이 필요하다(RFC 7662 는 TLS 1.2 이상을 요구).
- 인가 서버 장애가 곧 모든 API 장애가 되지 않게 한다. 캐시, 타임아웃, 실패 시 거절/허용 정책(fail-closed 가 기본)을 정하고 → [타임아웃·재시도·회로 차단기](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/) 를 적용한다.
- 취소 요청이 유실돼도 안전하도록 클라이언트는 503 을 받으면 재시도한다. 서버는 응답 200 이 "이미 무효"와 구분되지 않으므로 감사 로그에 별도로 남긴다(일반 운영 권고).
- 취소는 **탈취된 토큰의 사용을 막지 않는다.** 유출 자체를 줄이려면 토큰을 키에 묶는다 → [DPoP](/develop-wiki/knowledge/security/dpop/), [mTLS 바운드 토큰](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/).
- 이 노트는 RFC 9068(JWT 액세스 토큰 프로필)과 RFC 7523 등은 읽지 않았다. JWT 액세스 토큰에 인트로스펙션을 병행하는 규칙은 해당 문서를 확인한다.
