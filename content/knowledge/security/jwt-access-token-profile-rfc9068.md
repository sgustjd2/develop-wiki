---
title: JWT 액세스 토큰 프로파일 (RFC 9068)
aka: [RFC 9068, at+jwt, JWT Profile for OAuth 2.0 Access Tokens, JWT Access Token, ID Token Confusion, Cross-JWT Confusion]
category: security
level: intermediate
summary: 액세스 토큰을 JWT 로 발급할 때 헤더 typ(at+jwt), 필수 클레임, 리소스 서버의 검증 순서를 정해 두어 서로 다른 인가 서버·리소스 서버가 호환되게 하는 표준.
tags: [oauth2, jwt, rfc9068, access-token, at+jwt, resource-server, aud, token-validation]
related: [security/oauth2-oidc-pkce, security/jwt-algorithm-confusion, security/jwt-key-rotation, security/token-revocation-introspection, security/session-vs-jwt, security/access-control-design, security/dpop]
sources:
  - https://www.rfc-editor.org/rfc/rfc9068.html
updatedAt: 2026-11-19
---

## 문제

OAuth 2.0 은 액세스 토큰의 형식을 정하지 않는다. 그래서 JWT 를 쓰는 구현이 제각각이다. 클레임 이름이 다르고, 인가 서버를 바꾸면 리소스 서버 검증 코드를 다시 짜야 한다. 더 위험한 것은 **JWT 끼리 서로 바꿔 쓰이는 혼동**이다.

- OIDC ID 토큰도 JWT 이고 구조가 비슷하다. 리소스 서버가 서명과 `iss` 만 보면 ID 토큰을 액세스 토큰처럼 받아들일 수 있다.
- `aud` 를 확인하지 않으면 리소스 A 용 토큰이 리소스 B 에서 통한다.

## 해법: 형식과 검증 규칙을 정한다

RFC 9068 은 JWT 액세스 토큰의 형태를 정한다.

**헤더**: `typ` 은 `at+jwt`(또는 `application/at+jwt`)여야 한다. 리소스 서버는 다른 값을 거부한다. 서명은 필수이고 `none` 은 금지, 비대칭 알고리즘을 권장하며 `RS256` 지원이 필수다.

**필수 클레임**: `iss`, `exp`, `aud`, `sub`, `client_id`, `iat`, `jti`. 요청에 scope 가 있었다면 `scope` 를 넣는다. 인증 정보(`auth_time`, `acr`, `amr`)와 그룹·역할 같은 속성은 선택이다.

**리소스 서버 검증**(4절):

1. `typ` 확인.
2. 암호화된 토큰이면 복호화. 암호화를 협의했는데 평문이 오면 거부.
3. `iss` 가 기대한 발급자와 **정확히** 일치.
4. `aud` 에 **자기 자신의 리소스 식별자**가 있는지.
5. 인가 서버가 공개한 키로 서명 검증(`alg: none` 거부). 키 위치는 AS 메타데이터(RFC 8414)나 OIDC discovery 로 얻는다.
6. 만료 확인(작은 시계 오차 허용).

실패하면 `invalid_token` 으로 응답한다.

```ts
function validateAccessToken(jwt: string, o: { iss: string; aud: string; key: KeyObject; now: number }) {
  const [h, p, s] = jwt.split('.'), head = parse(h), c = parse(p);
  const typ = String(head.typ ?? '').toLowerCase(); // media type 은 대소문자 무시(RFC 7515 §4.1.9), RFC 9068 예시는 at+JWT
  if (typ !== 'at+jwt' && typ !== 'application/at+jwt') throw new Error('typ');  // ID 토큰 등 거부
  if (head.alg !== 'ES256') throw new Error('alg');                    // 허용 알고리즘만
  if (!verify('sha256', Buffer.from(`${h}.${p}`), { key: o.key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))) throw new Error('sig');
  if (c.iss !== o.iss) throw new Error('iss');
  if (![c.aud].flat().includes(o.aud)) throw new Error('aud');         // aud 는 문자열 또는 배열
  if (c.exp <= o.now - 30) throw new Error('exp');                     // 30초 오차 허용
  return c;
}
```

직접 실행해 정상 토큰은 통과하고, `typ: JWT` 인 ID 토큰 모양, 다른 `aud`, 만료 토큰은 각각 거부되는 것을 확인했다.

### 인가 서버가 지킬 점

- 요청에 `resource` 파라미터(리소스 인디케이터)가 있으면 `aud` 를 그 값에 맞춘다. 없으면 기본 리소스 식별자를 쓰되, scope 가 서로 다른 리소스를 가리켜 모호하면 `invalid_scope` 로 거절한다.
- **클라이언트가 `sub` 를 고를 수 없게 한다.** 권한 높은 주체로 위장할 수 있기 때문이다.
- 리소스마다 `aud` 가 달라야 토큰을 다른 리소스에 재생하지 못한다.

## 언제 쓰나

- 마이크로서비스가 많아 **토큰마다 인트로스펙션을 호출하기 부담스러운** 경우. 서명 검증만으로 로컬에서 판단한다.
- 인가 서버와 리소스 서버를 서로 다른 팀·제품으로 운영해 형식 합의가 필요할 때.
- 반대로 즉시 취소가 꼭 필요하면 opaque 토큰 + [인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/)이 낫다. JWT 는 만료 전에 거둘 수 없다.

## 주의 (비용)

- **클레임이 노출된다.** 암호화하지 않은 토큰은 클라이언트와 사용자가 읽을 수 있다. 클라이언트는 토큰을 불투명하게 취급해야 하고, 민감한 값은 넣지 않거나 암호화·opaque 토큰을 쓴다.
- **`sub` 로 추적될 수 있다.** 리소스마다 다른 `sub` 를 주거나 호출마다 토큰을 새로 받으면 상관 분석이 어려워진다. 프라이버시 요구가 있으면 설계에 넣는다.
- **키 분리가 방어가 아니다.** 리소스 서버는 인가 서버가 공개한 어떤 키든 받아들여야 하므로 키 하나가 유출되면 전체가 뚫린다 → [키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).
- 프로파일은 **형식과 검증만** 정한다. 토큰 탈취 후 사용(bearer)은 막지 못한다 → [DPoP](/develop-wiki/knowledge/security/dpop/). 알고리즘 혼동 방어는 [별도 노트](/develop-wiki/knowledge/security/jwt-algorithm-confusion/).
- 이 프로파일을 따르지 않는 기존 토큰(`typ: JWT`)과 함께 운영하는 이행 기간에는 `typ` 검사를 엄격히 하면 옛 토큰이 거부된다. 발급 쪽을 먼저 바꾸고 검증 쪽을 나중에 조인다.

## 비교

| 구분 | ID 토큰 (OIDC) | JWT 액세스 토큰 (RFC 9068) |
| --- | --- | --- |
| 받는 쪽 | 클라이언트 | 리소스 서버 |
| `aud` | 클라이언트 `client_id` | 리소스 식별자 |
| `typ` | 이 RFC 가 정하지 않음 | `at+jwt` |
| 용도 | 로그인한 사용자 확인 | API 호출 인가 |
