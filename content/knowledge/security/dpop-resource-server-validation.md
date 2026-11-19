---
title: DPoP 리소스 서버 검증 절차와 구현 체크리스트 (RFC 9449)
aka: [DPoP Proof Validation, DPoP Resource Server, ath, htm, htu, cnf.jkt, DPoP-Nonce, use_dpop_nonce, invalid_dpop_proof, jti replay store, dpop_jkt checklist]
category: security
level: advanced
summary: 리소스 서버가 DPoP 토큰과 증명 JWT 를 받았을 때 확인할 항목(헤더·서명·htm/htu·iat 창·nonce·jti·ath·cnf.jkt)과, 인가 서버의 dpop_jkt·PAR 결합 점검 항목을 RFC 9449 절 번호와 강도로 정리.
tags: [oauth2, dpop, rfc9449, resource-server, replay, nonce, jti, sender-constrained, par, checklist]
related: [security/dpop, security/oauth-security-bcp-rfc9700, security/oauth-par-rfc9126, security/jwt-access-token-profile-rfc9068, security/token-revocation-introspection, security/oauth-protected-resource-metadata-rfc9728, security/fapi-2-security-profile, security/mtls-certificate-bound-tokens, security/cors, security/xss]
sources:
  - https://www.rfc-editor.org/rfc/rfc9449.html
  - https://www.rfc-editor.org/rfc/rfc9126.html
  - https://openid.net/specs/fapi-security-profile-2_0-final.html
updatedAt: 2026-11-19
---

## 문제

[DPoP](/develop-wiki/knowledge/security/dpop/) 개념은 단순하다. 토큰을 클라이언트 키에 묶고, 요청마다 서명한 증명을 같이 보낸다. 그런데 보호 효과는 **리소스 서버(RS)가 검증을 빠짐없이 할 때만** 생긴다. 흔히 빠지는 것:

- `Authorization: Bearer` 로 온 DPoP 토큰을 그냥 받아 준다(다운그레이드).
- `ath` 를 확인하지 않아 한 증명을 다른 토큰과 짝지어 쓸 수 있다.
- `jti` 를 서버 한 대의 메모리에만 저장해서, 로드 밸런서 뒤 다른 인스턴스에 같은 증명을 다시 보내면 통과한다.
- nonce 를 준 뒤에도 nonce 없는 증명을 받아 준다.

이 노트는 RS 쪽 검증 순서를 체크리스트로 만들고, 인가 서버(AS) 쪽 `dpop_jkt`·PAR 결합 항목은 짧게 묶는다. 결합의 동작 원리와 실행 결과는 [RFC 9700 + PAR·DPoP 결합](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/) 노트에 있다.

## 해법: RS 검증 체크리스트

### 1. 요청 형태 (7.1, 7.2)

| 확인 | 강도 | 절 |
| --- | --- | --- |
| DPoP 바운드 토큰이면 `DPoP` 헤더에 증명이 있는지 확인하고, 4.3 규칙으로 검사하고, 증명 키와 토큰에 묶인 키가 같은지 확인 | MUST | 7.1 |
| 위 검사가 모두 성공하지 않으면 접근 허용 안 함 | MUST NOT | 7.1 |
| Bearer 와 DPoP 를 함께 지원하는 RS 는 **DPoP 바운드 토큰이 `Bearer` 로 오면 거부** | MUST | 7.2 |
| 토큰이 여러 방식으로 동시에 온 요청(예: `Authorization` 헤더 두 개)은 RFC 예시처럼 `400 invalid_request` | 예시(그림 19) | 7.2 |
| `DPoP` 인증 스킴은 `Proxy-Authorization` 등 프록시 헤더에 쓰지 않음 | MUST NOT | 7.1 |

### 2. 증명 JWT 자체 (4.3 의 1~11)

RFC 9449 4.3 은 받는 서버가 확인해야 할(MUST) 항목을 나열하고, **순서는 상관없다**고 한다.

1. `DPoP` 헤더가 **하나만** 있다.
2. 값이 형식이 맞는 JWT **하나**다.
3. 필수 클레임 `jti`, `htm`, `htu`, `iat` 가 있다(토큰과 같이 오면 `ath`, 서버가 nonce 를 줬으면 `nonce` 도).
4. `typ` 가 `dpop+jwt` 다. 다른 용도의 JWT 를 끼워 넣는 공격을 막는 항목이라 11.5 절에서 따로 MUST 로 다시 강조한다.
5. `alg` 가 등록된 **비대칭** 서명 알고리즘이고 `none` 이 아니며, 앱이 지원하고 로컬 정책이 허용한다(11.6: 대칭 알고리즘·`none` 금지, MUST).
6. 헤더 `jwk` 의 공개키로 서명이 검증된다.
7. `jwk` 에 개인키가 없다.
8. `htm` 이 요청 메서드와 같다.
9. `htu` 가 요청 URI 와 같다(쿼리·프래그먼트 제외). 비교 전에 RFC 3986 의 문법 기반·스킴 기반 정규화를 **SHOULD** 적용한다.
10. 서버가 nonce 를 줬다면 `nonce` 가 그 값과 같다.
11. `iat`(또는 서버 시각을 담은 nonce)로 본 생성 시각이 허용 창 안이다.

### 3. 토큰과의 결합 (4.3 의 12, 6, 7)

- `ath` = 받은 액세스 토큰 값의 SHA-256 을 base64url 로 인코딩한 값과 같아야 한다. RS 리소스 요청의 증명에는 `ath` 가 **MUST** 다(7).
- 토큰에 묶인 키와 증명 키가 같아야 한다(MUST, 6). 묶인 키는:
  - JWT 액세스 토큰이면 `cnf.jkt`(JWK SHA-256 썸프린트, RFC 7638, 6.1).
  - 불투명 토큰이면 인트로스펙션 응답의 최상위 `cnf.jkt`(6.2). 이때 RS 는 인트로스펙션 요청에 증명을 보내지 않고, AS 도 바인딩을 검사하지 않는다. **RS 가 응답을 받아 직접 대조한다.** 응답에 `token_type` 이 있으면 값은 `DPoP` 여야 한다(MUST).
- RFC 7 은 `ath` 만으로는 리플레이나 요청 결합이 안 되므로 시간 창과 `htm`/`htu` 확인이 여전히 필요하다고 덧붙인다.

### 4. 리플레이와 시간 창 (11.1)

| 항목 | 원문 강도 | 내용 |
| --- | --- | --- |
| 생성 후 **제한된 시간**에만 증명 수락 | MUST | 바람직한 길이는 "초~분 단위"로 서술 |
| 같은 대상 URI 에서 본 `jti` 를 수락 창 동안 저장해 중복 거부 | can (권고 아님, 가능한 방법으로 서술) | 서버 여러 대가 상태를 공유하지 않으면 엄격한 1 회 검사가 어려울 수 있다고 인정 |
| 너무 큰 `jti` 거부 또는 해시만 저장 | should(소문자, 서술) | 메모리 고갈 공격 대비 |
| 약간 미래의 `iat` 허용 | MAY | 시계 오차(초~분) 흡수 |
| 서버 시각을 담은 nonce 로 수명 제한 | MAY | 시계 오차가 커도 결과가 같다 |

해석: `jti` 저장은 RFC 상 필수가 아니지만, 저장하지 않으면 창 안에서 같은 증명이 재사용될 수 있다. 서버가 여러 대이면 공유 저장소(예: 만료 시간을 둔 키-값 저장소의 "없을 때만 쓰기")가 사실상 필요하다는 것이 이 노트의 판단이다. 저장 키는 RFC 문장대로 "대상 URI + `jti`" 범위로 잡았다.

### 5. nonce (8, 9, 11.2, 11.3)

- RS 도 AS 처럼 nonce 를 줄 수 있다(9). 응답은 `401` + `WWW-Authenticate: DPoP error="use_dpop_nonce"` + `DPoP-Nonce` 헤더.
- nonce 값은 **예측 불가해야 한다(MUST, 8)**. `DPoP-Nonce` 헤더는 응답에 둘 이상 두지 않는다(MUST NOT, 8).
- 클라이언트에 nonce 를 줬다면 **nonce 없는 증명을 받으면 안 된다(MUST NOT, 11.3, 다운그레이드 방지)**.
- 증명의 nonce 가 최근에 준 값과 정확히 같지 않으면 AS 는 거부한다(MUST, 8). RS 에도 같은 방식을 적용한다고 9 절이 말한다.
- 다음 nonce 는 성공 응답(`200`)의 `DPoP-Nonce` 로 미리 줄 수 있어 왕복을 줄인다(8.2). 이런 응답은 캐시되지 않게 한다(should).
- nonce 는 **발급한 서버에서만** 쓴다. AS nonce 와 RS nonce, OIDC ID 토큰 `nonce` 를 섞지 않는다(9).
- 브라우저 클라이언트가 `DPoP-Nonce`·`WWW-Authenticate` 를 읽으려면 서버가 `Access-Control-Expose-Headers` 에 넣어야 한다(7.1, 8) → [CORS](/develop-wiki/knowledge/security/cors/).
- nonce 를 쓰지 않는 배포는 **수명이 긴 DPoP 액세스 토큰을 발급하지 않는다(SHOULD NOT, 11.2)**. 미리 만들어 둔 증명의 쓸모를 `ath` 가 토큰 수명으로 제한하기 때문이다.

### 6. 오류 응답 (7.1)

- `401` + `WWW-Authenticate: DPoP ...`. 토큰은 왔는데 인증에 실패했으면 `error` 를 넣는다(SHOULD).
- 증명 자체가 4.3 기준으로 틀리면 `invalid_dpop_proof`, 키 바인딩 실패는 RFC 예시처럼 `invalid_token`.
- 허용 알고리즘을 `algs` 파라미터로 알린다(SHOULD).

## 코드: RS 검증 스케치

Node 24(`node:crypto`, ES256)로 직접 작성해 실행했다. 인트로스펙션 결과(`active`, `cnfJkt`)는 이미 얻었다고 가정한다. 아래는 실행한 코드에서 JWT 파싱·서명 검증과 nonce 보관을 헬퍼(`parseAndVerifyEs256`, `recentNonces`)로 줄인 발췌다. 이 스케치는 DPoP 전용 RS 다(일반 Bearer 경로는 다루지 않음).

```ts
function checkResource(req: Req, token: { active: boolean; cnfJkt?: string }): Result {
  const authz = req.headers['authorization'] ?? [], dpop = req.headers['dpop'] ?? [];
  if (authz.length !== 1) return { status: 400, error: 'invalid_request' };
  const [scheme, at] = authz[0].split(' ');
  if (scheme.toLowerCase() === 'bearer' && token.cnfJkt) return { status: 401, error: 'invalid_token' }; // 7.2
  if (scheme.toLowerCase() !== 'dpop' || dpop.length !== 1) return { status: 401, error: 'invalid_dpop_proof' };
  const { header: hd, claims: c, ok } = parseAndVerifyEs256(dpop[0]);               // 4.3 #2,#6
  if (!ok || hd.typ !== 'dpop+jwt' || !ALGS.includes(hd.alg) || hd.jwk?.d) return { status: 401, error: 'invalid_dpop_proof' };
  const u = new URL(req.url); u.search = ''; u.hash = '';                             // 쿼리·프래그먼트 제외
  if (c.htm !== req.method || new URL(c.htu).href !== u.href) return { status: 401, error: 'invalid_dpop_proof' };
  const now = Math.floor(Date.now() / 1000);
  if (typeof c.iat !== 'number' || c.iat < now - WINDOW || c.iat > now + FUTURE) return { status: 401, error: 'invalid_dpop_proof' };
  if (!c.nonce || !recentNonces.has(c.nonce)) return { status: 401, error: 'use_dpop_nonce', nonce: currentNonce() }; // 11.3
  if (typeof c.jti !== 'string' || c.jti.length > 64) return { status: 401, error: 'invalid_dpop_proof' };      // 11.1
  if (c.ath !== b64u(sha256(at))) return { status: 401, error: 'invalid_dpop_proof' };
  if (!token.active || token.cnfJkt !== jkt(hd.jwk)) return { status: 401, error: 'invalid_token' };          // 6
  if (!replayStore.addIfAbsent(b64u(sha256(`${u.href}|${c.jti}`)), WINDOW + FUTURE))                       // 해시만 저장
    return { status: 401, error: 'invalid_dpop_proof' };
  return { status: 200 };
}
```

`replayStore.addIfAbsent` 는 여러 인스턴스가 공유하는 저장소로 바꾼다(예: Redis `SET key 1 NX EX ttl`). `jti` 기록을 **마지막**에 둔 것은 다른 검사에서 실패한 요청이 정상 클라이언트의 `jti` 를 소모하지 않게 하려는 이 노트의 선택이다.

실행 결과(10 경우):

| # | 경우 | 결과 |
| --- | --- | --- |
| 1 | nonce 없는 증명 | 401 `use_dpop_nonce` + 새 nonce |
| 2 | 정상(요청 URL 의 쿼리는 `htu` 비교에서 제외) | 200 |
| 3 | 2 번 증명을 그대로 재전송 | 401 (`jti` 중복) |
| 4 | DPoP 바운드 토큰을 `Bearer` 로 전송 | 401 `invalid_token` |
| 5 | `GET` 증명을 `POST` 요청에 사용 | 401 |
| 6 | 다른 토큰 값으로 계산한 `ath` | 401 |
| 7 | 공격자 키로 서명한 증명 + 훔친 토큰 | 401 `invalid_token` (`cnf.jkt` 불일치) |
| 8 | `iat` 가 5 분 전 | 401 |
| 9 | `typ` 가 `JWT` | 401 |
| 10 | `htu` 호스트만 대문자 | 200 (정규화 후 일치) |

## AS 쪽: dpop_jkt + PAR 점검 항목

RS 검증이 의미를 가지려면 AS 가 키를 제대로 묶어야 한다.

| 항목 | 강도 | 절 |
| --- | --- | --- |
| 토큰 요청(모든 grant)에 유효한 증명. 틀리면 `invalid_dpop_proof` | 클라이언트 MUST | 5 |
| 바인딩했으면 응답 `token_type: DPoP` | MUST | 5 |
| 공개 클라이언트의 리프레시 토큰을 같은 키에 묶고, 사용할 때 바인딩 검증 | MUST | 5 |
| 클라이언트 메타데이터 `dpop_bound_access_tokens: true` 면 `DPoP` 헤더 없는 토큰 요청 거부 | MUST | 5.2 |
| `dpop_signing_alg_values_supported` 로 지원 알고리즘 공개 | 메타데이터 정의 | 5.1 |
| 인가 요청의 `dpop_jkt` 와 토큰 요청 증명 키의 썸프린트가 다르면 거부. `dpop_jkt` 사용 자체는 OPTIONAL | MUST / OPTIONAL | 10 |
| `dpop_jkt` 가 PKCE 와 비슷한 보호를 주는 것은 인가 요청마다 고유한 DPoP 키를 쓸 때뿐 | 서술 | 10 |
| PAR 요청: `dpop_jkt` 는 POST 본문에 다른 파라미터와 함께 / `DPoP` 헤더를 붙이면 4.3 대로 검사하고 그 키를 `dpop_jkt` 처럼 취급 | MUST | 10.1 |
| PAR 와 DPoP 를 모두 지원하는 AS 는 두 방식을 모두 지원, 둘이 함께 오고 썸프린트가 다르면 거부 | MUST | 10.1 |
| AS 가 nonce 를 쓰면 `400 use_dpop_nonce` + `DPoP-Nonce` | MAY(사용), 값 예측 불가 MUST | 8 |
| PAR 의 `request_uri` 1 회용, 짧은 `expires_in`, `require_pushed_authorization_requests` 로 우회 차단 | RFC 9126 | 2.2, 4, 5, 6 → [PAR](/develop-wiki/knowledge/security/oauth-par-rfc9126/) |

참고로 [FAPI 2.0 Security Profile](/develop-wiki/knowledge/security/fapi-2-security-profile/)(5.3.2.1)은 DPoP 를 쓰는 AS 에게 "Authorization Code Binding to DPoP Key"(RFC 9449 10.1) **지원**을 shall 로 요구하지만, 클라이언트는 쓰지 않아도 된다고 명시한다(5.3.3.1 NOTE 2). 같은 문서는 미래 `iat`/`nbf` 를 0~10 초는 받아야(shall) 하고 60 초 초과는 거부해야(shall) 한다고 정한다.

## 언제 쓰나

- DPoP 토큰을 받는 API 게이트웨이·RS 미들웨어를 직접 만들거나, 라이브러리 설정을 감사할 때.
- Bearer 에서 DPoP 로 단계적으로 옮기며 두 스킴을 함께 받아야 할 때(7.2 다운그레이드 규칙이 핵심).
- AS 를 고를 때 `dpop_jkt`·PAR 결합 지원을 확인하는 점검표로.

## 주의 (비용)

- **공유 리플레이 저장소**: 인스턴스 간 공유 저장소 왕복이 요청마다 하나 늘어난다. 저장소 장애 시 "거부(가용성 손실)" 와 "통과(리플레이 허용)" 중 무엇을 택할지 정책이 필요하다(이 노트의 의견).
- **nonce 왕복**: nonce 를 요구하면 첫 요청이나 nonce 교체 때 `401` 후 재시도가 생긴다. 성공 응답에 다음 nonce 를 실어 줄이는 방법(8.2)을 쓴다. RFC 7.3 은 DPoP 요청이 더 이상 멱등이 아닐 수 있으니 재시도 때도 **새 증명**을 만들라고 권한다(RECOMMENDED).
- **`htu` 비교**: 리버스 프록시·게이트웨이 뒤에서는 RS 가 보는 URL(내부 호스트·포트)과 클라이언트가 서명한 외부 URL 이 다를 수 있다. 외부 URL 을 기준으로 재구성해야 한다(이 노트의 의견, RFC 는 정규화만 SHOULD).
- **본문 무결성 없음**: DPoP 는 메서드와 URI 만 덮는다(11.7). FAPI 2.0 6.2 는 A5 공격자(RS 쪽 요청을 읽는 공격자)가 증명을 재사용해 본문(금액·계좌)을 바꿀 수 있다고 쓰고, 짧은 nonce, `jti` 리플레이 방지, 메시지 서명, mTLS 를 완화책으로 든다.
- **클라이언트 코드 장악**: XSS 등으로 코드가 실행되면 공격자가 정상 키로 증명을 만든다(11.4). RS 검증은 이 경우를 막지 못한다 → [XSS](/develop-wiki/knowledge/security/xss/).

## 비교

| 검사 | 막는 것 | 빠뜨리면 |
| --- | --- | --- |
| `cnf.jkt` 대조 | 훔친 토큰 + 공격자 키 | DPoP 효과 없음 |
| `ath` | 증명을 다른 토큰과 짝짓기 | 같은 키의 다른 사용자 토큰과 바꿔치기(7) |
| `htm`/`htu` | 다른 엔드포인트·메서드로 재사용 | 증명 하나로 여러 API 호출 |
| `iat` 창 | 오래된 증명 재사용 | 수명 무제한 증명 |
| `jti` 저장 | 창 안의 재전송 | 같은 요청 반복 |
| nonce | 미리 만들어 빼낸 증명(11.2) | 키를 잠깐 쓴 공격자가 미래 증명 확보 |
| Bearer 다운그레이드 거부 | DPoP 토큰을 Bearer 로 사용 | 바인딩 우회 |

## 검증 범위

RFC 9449 의 4.1~4.3, 5, 5.1, 5.2, 6, 6.1, 6.2, 7, 7.1, 7.2, 7.3, 8, 8.1, 8.2, 9, 10, 10.1, 11.1~11.11 을 rfc-editor.org 원문에서 읽고 강도를 대조했다. FAPI 2.0 Security Profile(Final, 2025-02-22)의 5.3.2.1, 5.3.3.1, 6.2 를 읽었다. 위 코드는 직접 작성해 Node 24.21 에서 실행한 스케치이며 ES256 만 다루고, `htu` 정규화는 WHATWG `URL` 파서에 맡겼다(RFC 3986 6.2.2·6.2.3 과 완전히 같다는 것은 확인하지 않았다). 특정 게이트웨이·라이브러리(예: Spring Security, Keycloak)의 DPoP 검증 구현은 읽지 않았다. 인트로스펙션 캐시와 DPoP 검증의 상호 작용은 다루지 않았다.
