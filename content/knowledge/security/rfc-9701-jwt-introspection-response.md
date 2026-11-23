---
title: JWT 형식 토큰 인트로스펙션 응답 (RFC 9701)
aka: [RFC 9701, JWT Response for OAuth Token Introspection, JWT Introspection Response, application/token-introspection+jwt, token-introspection+jwt, token_introspection claim, 서명된 인트로스펙션 응답]
category: security
level: advanced
summary: RFC 7662 인트로스펙션 응답을 평문 JSON 대신 서명(선택적으로 암호화)된 JWT 로 받는 확장(RFC 9701). Accept 헤더로 요청하고, 응답 멤버는 token_introspection 클레임 안에 넣으며, 호출자 인증이 필수다.
tags: [oauth2, rfc9701, rfc7662, introspection, jwt, resource-server, jws, jwe, cross-jwt-confusion, privacy]
related: [security/token-revocation-introspection, security/jwt-access-token-profile-rfc9068, security/oauth-authorization-server-metadata-rfc8414, security/oauth-protected-resource-metadata-rfc9728, security/jwt-algorithm-confusion, security/private-key-jwt-client-authentication, security/oauth-security-bcp-rfc9700, security/jwt-key-rotation, security/dpop-resource-server-validation, security/fapi-2-security-profile]
sources:
  - https://www.rfc-editor.org/rfc/rfc9701.txt
updatedAt: 2026-11-23
---

## 문제

[RFC 7662 인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/)의 응답은 평문 JSON 이다. 리소스 서버(RS)는 TLS 로 인가 서버(AS)와 통신했다는 사실만 믿고 내용을 받아들인다. 대부분의 API 에는 이것으로 충분하다. RFC 9701 이 문제로 드는 경우는 다음이다(1절).

- RS 가 "이 응답을 AS 가 **그 토큰에 대해** 발급했다"는 더 강한 보증이 필요한 경우.
- AS 가 응답 내용에 **책임을 지는** 경우. 원문 예시는 검증된 개인 정보로 인증서를 만들고, 그 인증서를 적격 전자서명에 쓰는 RS 다.

이때 응답을 서명된 JWT 로 받으면 RS 는 그 응답을 감사·증빙용으로 보관할 수 있고, AS 는 RS 별로 다른 키·암호화를 적용할 수 있다. (보관·증빙은 필자가 붙인 활용 설명이며, RFC 는 "서명된 JWT 를 돌려주는 것이 유용하거나 필수일 수 있다"까지만 쓴다.)

## 문서 지위

| 항목 | 내용 (원문 헤더) |
| --- | --- |
| 번호·제목 | RFC 9701, JSON Web Token (JWT) Response for OAuth Token Introspection |
| 발행 | 2025년 1월 |
| 지위 | Standards Track |
| 저자 | T. Lodderstedt (Ed.), V. Dzhuvinov |
| 갱신·대체 | 헤더에 Updates/Obsoletes 표기 **없음.** RFC 7662 를 바꾸지 않고, RS 가 요청할 때만 쓰는 **추가 응답 형식**이다 |

초록은 이를 "OAuth 2.0 토큰 인트로스펙션을 위한, JWT 로 보호된 추가 응답"이라고 소개한다.

## 해법

### 1. 요청 (4)

- RS 는 평소 인트로스펙션 요청에 `Accept: application/token-introspection+jwt` 를 붙인다.
- AS 는 호출자를 **MUST 인증**한다. 방법은 클라이언트 인증 방식이거나, RS 를 subject 로 식별하는 별도 액세스 토큰이다. 원문 예시는 `private_key_jwt` 방식(`client_assertion`)이다 → [private_key_jwt](/develop-wiki/knowledge/security/private-key-jwt-client-authentication/).

### 2. 응답 (5)

헤더와 클레임 구조는 아래와 같다(원문 예시를 줄였다).

```http
HTTP/1.1 200 OK
Content-Type: application/token-introspection+jwt
```

```json
{ "typ": "token-introspection+jwt", "alg": "RS256", "kid": "wG6D" }
```

```json
{
  "iss": "https://as.example.com/",
  "aud": "https://rs.example.com/resource",
  "iat": 1514797892,
  "token_introspection": {
    "active": true, "iss": "https://as.example.com/", "aud": "https://rs.example.com/resource",
    "iat": 1514797822, "exp": 1514797942, "client_id": "paiB2goo0a",
    "scope": "read write dolphin", "sub": "Z5O3upPC88QrAjx00dis", "jti": "..."
  }
}
```

| 요소 | 규칙 | 강도 | 절 |
| --- | --- | --- | --- |
| `Content-Type` | `application/token-introspection+jwt` | 서술(원문: "responds ... setting") | 5 |
| JWT 헤더 `typ` | `token-introspection+jwt` | 서술(같은 문장) | 5 |
| 최상위 `iss` | AS 의 issuer URL | MUST | 5 |
| 최상위 `aud` | 응답을 받는 RS 를 식별 | MUST | 5 |
| 최상위 `iat` | AS 가 응답을 만든 시각 | MUST | 5 |
| `token_introspection` | RFC 7662 2.2절의 응답 멤버를 담은 JSON 객체 | 필수 클레임(MUST include) | 5 |
| 최상위 `sub`, `exp` | 포함하지 않음 | SHOULD NOT | 5 |
| 그 밖의 JWT 클레임 | 등록된 클레임 포함 가능 | MAY | 5 |
| 서비스별 확장 클레임 | `token_introspection` 의 최상위 멤버로 추가 | MAY(7662 허용) | 5 |
| 여러 도메인에서 쓸 응답 파라미터 이름 | RFC 7662 의 "OAuth Token Introspection Response" 레지스트리에 등록 | MUST | 5 |
| 응답 JWT 를 액세스 토큰으로 쓰는 것 | 의도된 용도가 아님(Note) | 서술 | 5 |

핵심 설계는 **멤버 분리**다. `sub`, `scope`, `exp` 같은 인트로스펙션 멤버를 최상위가 아니라 `token_introspection` 안에 넣는다. 원문은 같은 이름의 최상위 JWT 클레임과 충돌·혼동하지 않게 하려는 것이라고 밝힌다. 위 예시처럼 안쪽 `iat` 는 토큰 발급 시각이고, 바깥 `iat` 는 응답 생성 시각이다.

### 3. 비활성 토큰 (5)

토큰이 유효하지 않거나, 만료됐거나, 취소됐거나, **호출한 RS 가 대상(audience)이 아니면** AS 는 `token_introspection.active` 를 `false` 로 하고 **다른 멤버를 넣지 않는다(MUST NOT).** 그 외에는 `active: true`. 이 JWT 도 5절 구조로 오며, HTTP 오류 코드를 쓰라는 규정은 없다. 응답을 읽는 쪽에서는 "RS 가 대상이 아닌 토큰"과 "죽은 토큰"을 구분할 수 없다(이 점은 필자의 추론).

### 4. 범위와 내용 (5)

- AS 는 `scope` 를 해당 RS 에 관련된 값으로 좁히는 것이 SHOULD.
- AS 가 RS 에 사용자 신원 클레임을 주는 경우 어떤 클레임을 줄지는 RS 별 정책으로 정하고, 개인정보 공개의 **법적 근거를 확보하는 것은 MUST**(5, 9).

### 5. 서명·암호화 (5, 6)

- JWT 는 RFC 7519 에 따라 암호학적으로 보호된다. RS 정책에 따라 **서명만** 또는 **서명 후 암호화**다. 둘 다면 **Nested JWT 여야 MUST**(5). 6절은 "서명한 뒤 암호화"라고 순서를 적는다.
- AS 는 JWT 를 추가로 **암호화해도 된다(MAY)**(3). 이때 AS 에 RS 의 암호화 키·알고리즘이 준비돼 있어야 한다.
- 알고리즘은 RS(클라이언트)별 메타데이터로 정한다. 아래 6절 참고.
- **`alg: none` 금지 같은 문장은 이 RFC 에 없다.** 서명 알고리즘 선택은 RFC 7519/클라이언트 메타데이터에 맡기고, JWT 혼동과 그 밖의 JWT 공격은 RFC 8725 를 참조하라고만 한다(8.1). 허용 알고리즘 고정은 아래 코드처럼 RS 가 스스로 해야 하는 일이다.

### 6. 클라이언트 메타데이터 (6, 10.1)

RS 를 OAuth 클라이언트로 동적 등록(RFC 7591)하는 경우의 파라미터다. 모두 OPTIONAL 이며 이름은 OpenID Connect 의 UserInfo 응답 설정을 본뜬 것이다.

| 파라미터 | 의미 | 기본값 |
| --- | --- | --- |
| `introspection_signed_response_alg` | 응답 서명 `alg` | 생략하면 `RS256` |
| `introspection_encrypted_response_alg` | 콘텐츠 키 암호화 `alg` (JWE) | 생략하면 암호화 안 함 |
| `introspection_encrypted_response_enc` | 콘텐츠 암호화 `enc` | 생략하면 `A128CBC-HS256`. `..._alg` 없이 단독 지정은 MUST NOT |

RS 는 암호화용 공개키를 `jwks_uri` 또는 `jwks` 로 등록할 수 있다.

### 7. 인가 서버 메타데이터 (7, 10.2)

AS 는 지원 알고리즘을 [RFC 8414](/develop-wiki/knowledge/security/oauth-authorization-server-metadata-rfc8414/) 메타데이터로 **공개하는 것이 SHOULD**다. 정의된 파라미터(모두 OPTIONAL, JSON 배열)는 세 개다.

- `introspection_signing_alg_values_supported`
- `introspection_encryption_alg_values_supported`
- `introspection_encryption_enc_values_supported`

RS 는 이 값을 보고 클라이언트 등록 요청을 구성한다. 인트로스펙션 엔드포인트 URL 자체는 RFC 7662/8414 의 기존 항목이며 이 RFC 가 바꾸지 않는다(미확인: RFC 8414 원문은 이 작업에서 읽지 않았다).

## RS 응답 검증 절차 (필자 정리)

**RFC 9701 에는 "RS 가 인트로스펙션 JWT 를 이 순서로 검증하라"는 절이 없다.** RS 쪽 명시 요구는 8.1(액세스 토큰의 `typ` 확인과 최소 클레임 확인, 리플레이 대응)뿐이다. 아래는 5절의 응답 구조에서 필자가 도출한 점검 순서이며 RFC 원문 권고가 아니다.

1. `typ` 가 `token-introspection+jwt` 인지 확인한다.
2. `alg` 를 **RS 가 등록(또는 AS 메타데이터에서 확인)한 값으로 고정**하고 서명을 검증한다. 키는 AS 의 JWKS 에서 `kid` 로 찾는다 → [알고리즘 혼동](/develop-wiki/knowledge/security/jwt-algorithm-confusion/), [키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).
3. `iss` 가 기대한 AS 인지, `aud` 에 **자기 자신**이 있는지 확인한다.
4. `iat` 가 최근인지 확인한다(허용 창은 RFC 에 없음. 필자 선택).
5. `token_introspection.active` 가 불리언 `true` 인지 확인하고, 그 안의 `scope`·`exp`·`cnf` 등으로 접근 판단을 한다.
6. 암호화된 응답이면 먼저 복호화한 뒤 위를 적용한다.

### 직접 실행한 스케치

Node 24.21.0(`node:crypto`, RS256, 키 쌍은 실행 때 생성)으로 위 1~5 를 직접 작성해 실행했다. JWKS 조회와 복호화는 넣지 않았다.

```ts
function verifyIntrospectionJwt(jwt: string) {
  const [h64, p64, s64] = jwt.split('.');
  const h = JSON.parse(b64uDecode(h64)), p = JSON.parse(b64uDecode(p64));
  if (h.typ !== 'token-introspection+jwt') return fail('typ');
  if (!ALLOWED.includes(h.alg)) return fail('alg');                 // 허용 목록 고정
  if (!rsaVerify(`${h64}.${p64}`, s64, asPublicKey)) return fail('signature');
  if (p.iss !== AS_ISSUER) return fail('iss');
  if (![p.aud].flat().includes(MY_RS_ID)) return fail('aud');
  if (typeof p.iat !== 'number' || p.iat < now() - MAX_AGE) return fail('iat');
  const t = p.token_introspection;
  if (typeof t?.active !== 'boolean') return fail('token_introspection');
  return { active: t.active, claims: t };                           // active=false 면 접근 거부
}
```

| # | 경우 | 결과 |
| --- | --- | --- |
| 1 | 정상 `active:true` | 통과 |
| 2 | `active:false` (다른 멤버 없음) | 통과 후 `active=false`, 접근 거부 |
| 3 | 헤더 `typ: JWT` | 거부 (`typ`) |
| 4 | `aud` 가 다른 RS | 거부 (`aud`) |
| 5 | `iss` 불일치 | 거부 (`iss`) |
| 6 | `alg: none` | 거부 (허용 목록) |
| 7 | `HS256` + 공개키를 HMAC 비밀로 사용 | 거부 (허용 목록) |
| 8 | 페이로드 변조 | 거부 (서명) |
| 9 | `iat` 10 분 전 | 거부 (`iat`, 창 30 초 가정) |
| 10 | 최상위에 `sub`·`exp` 포함 | 통과하되 경고(SHOULD NOT 위반) |
| 11 | `active` 가 문자열 `"true"` | 거부 |
| 12 | 인트로스펙션 JWT 를 액세스 토큰으로 제시 | 액세스 토큰 `typ`(`at+jwt`) 검사에서 거부 |
| 13 | `typ: at+jwt` 액세스 토큰 | 해당 검사 통과 |

10 번은 필자의 선택이다. SHOULD NOT 위반이라도 서명이 유효하면 받아 주는 편을 택했다. 엄격하게 거부해도 RFC 와 모순되지 않는다. 12 번은 아래 보안 고려사항의 `typ` 검사를 모사한 것으로, `at+jwt` 값은 [RFC 9068](/develop-wiki/knowledge/security/jwt-access-token-profile-rfc9068/) 프로파일의 것이다.

## 보안·프라이버시 고려사항

### Cross-JWT Confusion (8.1)

- 인트로스펙션 JWT 의 `iss`, 경우에 따라 `aud` 가 JWT 형식 액세스 토큰과 닮을 수 있다. 공격자가 인트로스펙션 응답을 액세스 토큰으로 RS 에 내밀 수 있다.
- 방어: 헤더 `typ: token-introspection+jwt` 와, `sub`·`scope` 를 `token_introspection` 안에 캡슐화하는 구조. 5절의 "최상위 `sub`·`exp` 는 SHOULD NOT" 도 같은 목적이다.
- RS 는 JWT 형식 액세스 토큰의 `typ` 를 **MUST 확인**하고, 유효한 액세스 토큰에 최소한 필요한 클레임이 모두 있는지 **MUST 확인**한다.
- RS 는 액세스 토큰 리플레이 대응책(RFC 9700)을 **MUST 적용**한다 → [RFC 9700](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/).
- JWT 혼동 일반은 RFC 8725 를 참조하라고 한다.

### 토큰 데이터 유출 (8.2)

- AS 는 TLS 1.2 이상(BCP 195, RFC 9325)을 **MUST 사용**한다.
- RFC 7662 2.1절은 호출자를 식별하지 않는 액세스 토큰으로도 인트로스펙션을 허용한다. 이 RFC 는 이를 막으려고 **모든 요청의 인증을 MUST 요구**한다.
- 5절 Note: 호출자를 인증하지 않는 요청은 AS 가 **거부하고 HTTP 400** 을 돌려줘야 한다(MUST). 근거 설명은 8.2. RFC 7662 방식으로의 다운그레이드를 막으려는 규칙이다. 즉 이 RFC 를 따르는 AS 는 호출자 인증이 없는 인트로스펙션을 아예 서비스하지 않는다.
- 3절: AS 는 RS 가 특정 토큰의 audience 인지, 어떤 데이터를 받을 자격이 있는지 판단할 수 있어야 한다(MUST). 방법은 AS 재량이며, 예로 scope 값과 RS 의 매핑을 든다. RS 의 자격 증명은 필요한 호출(예: 인트로스펙션만)로 **제한해야 한다(MUST)**.

### 프라이버시 (9)

- 응답은 AS 에서 RS 로 개인식별정보(PII)를 옮길 수 있다. 전달 전에 법적·관할 제약을 지키는 것은 AS 의 MUST 다. 근거는 흔히 AS 가 인가 과정에서 받은 사용자 동의이고, 계약 등 별도 경로일 수도 있다.
- AS 와 RS 가 같은 법인이면 명시 동의가 필요 없을 수 있지만 서비스 약관·정책은 항상 지켜야 한다(MUST).
- AS 는 법적 근거의 범위를 토큰과 함께 유지하고(예: scope), RS 를 인증하고, RS 의 신원과 토큰 데이터로 줄 데이터를 결정해야 한다(MUST).
- 인트로스펙션 요청은 사용자가 지금 클라이언트를 쓰고 있다는 **시점 정보**를 AS 에 알려 준다. 이것이 받아들일 수 없으면 인트로스펙션 대신 필요한 데이터를 액세스 토큰에 직접 담는 등 **다른 수단을 MUST 사용**한다.

## 오류 처리

RFC 9701 이 새로 정한 오류 규칙은 **호출자 인증이 없는 요청에 HTTP 400**(5절 Note) 하나다. 그 밖의 오류 응답(인증 실패의 상세 형식, 잘못된 `Accept` 값, AS 가 JWT 를 지원하지 않는 경우의 응답 코드 등)은 이 RFC 에 규정이 없다. RS 가 JWT 를 요청했는데 AS 가 평문 JSON 이나 오류를 돌려주는 경우의 처리는 **미확인**이며, RS 는 `Content-Type` 이 `application/token-introspection+jwt` 가 아니면 응답을 신뢰하지 않는 편이 안전하다는 것이 필자의 판단이다.

## 언제 쓰나

- AS 가 응답에 책임을 지고 증빙을 남겨야 하는 규제·신원 서비스, 응답에 PII 를 담아 RS 에 줄 때(기관 간 연동).
- AS 와 RS 가 서로 다른 조직이며, TLS 뿐 아니라 응답 자체에 서명이 필요할 때.
- RS 별로 다른 키·암호화를 줘야 할 때(메타데이터로 RS 별 설정).
- [FAPI 2.0](/develop-wiki/knowledge/security/fapi-2-security-profile/) 같은 고보안 프로파일이 이 방식을 요구하는지는 이 작업에서 확인하지 않았다(미확인).

## 주의·비용

- **조직 간 신뢰 설정 비용이 생긴다.** RS 마다 클라이언트 등록, 서명·암호화 키, 허용 데이터 정책이 필요하다(3절). 평문 JSON 의 단순함을 잃는다.
- **서명이 있어도 취소 지연 문제는 그대로다.** 응답은 AS 가 발급 시점에 만든 스냅샷이다. RS 가 응답을 캐시하면 [취소 지연](/develop-wiki/knowledge/security/token-revocation-introspection/)이 생긴다. 서명된 응답을 오래 캐시하는 것은 RFC 가 다루지 않은 선택이다.
- **요청마다 AS 호출, 서명 연산, 검증 연산이 든다.** 주로 AS 가 호출마다 서명하므로 지연·CPU 가 평문 JSON 보다 크다. 수치는 측정하지 않았다.
- **액세스 토큰과 혼동하지 않는다.** 응답 JWT 는 액세스 토큰이 아니다(5). 같은 AS 키로 서명하면 `typ`·클레임 검사가 유일한 방어선이 된다. RS 의 액세스 토큰 검증 코드가 `typ` 를 확인하지 않으면 8.1 의 공격이 성립한다. 서명 키를 용도별로 분리할지는 RFC 에 없는 필자의 제안이다.
- **다른 인트로스펙션 확장과의 결합은 별도다.** DPoP·mTLS 바운드 토큰의 `cnf` 를 이 응답에 싣는 방식은 이 RFC 가 다루지 않는다 → [DPoP RS 검증](/develop-wiki/knowledge/security/dpop-resource-server-validation/)은 평문 응답 기준이다.

## 비교

| | 평문 인트로스펙션(RFC 7662) | JWT 인트로스펙션(RFC 9701) | JWT 액세스 토큰(RFC 9068) |
| --- | --- | --- | --- |
| 무엇을 JWT 로 | 안 함(JSON) | 인트로스펙션 **응답** | **토큰 자체** |
| RS 요청마다 AS 호출 | 예 | 예 | 아니오(서명만 확인) |
| 즉시 취소 반영 | 가능(캐시 없을 때) | 가능(캐시 없을 때) | 만료까지 불가 |
| 호출자 인증 | 7662 는 접근 보호 수단을 정하고 식별 없는 토큰도 허용 | MUST 인증, 안 하면 400 | 해당 없음 |
| RS 별 응답 서명·암호화 | 없음 | 가능 | 토큰 하나를 모든 RS 가 공유 |
| 확인 헤더 `typ` | 해당 없음 | `token-introspection+jwt` | `at+jwt` |

RFC 9068 열의 취소 반영·RS 별 서명 칸은 로컬 서명 검증 방식의 일반 성질이며 RFC 9068 이 직접 서술한 것이 아니다(이 노트는 RFC 9068 원문을 읽지 않았다).

## 검증 범위

RFC 9701(2025-01, Standards Track) 전문(1~11절, IANA 등록, 참고문헌, 예시 응답)을 rfc-editor.org 의 텍스트판에서 처음부터 끝까지 읽고 MUST/SHOULD/MAY 를 대조했다. 스케치는 직접 작성해 Node 24.21.0 에서 실행했으며 RS256 만 다루고 JWKS 조회·JWE 복호화·실제 AS 와의 통신은 포함하지 않았다. 읽지 못한 것: RFC 7662, RFC 8414, RFC 8725, RFC 9700, RFC 7591·7519 원문(이 노트에서는 RFC 9701 이 이를 인용한 내용과 기존 노트만 참고), 구현체(예: Connect2id·Keycloak 등)의 지원 여부와 동작. 미확인: 잘못된 `Accept`·JWT 미지원 AS 의 응답 규칙, FAPI 등 다른 프로파일과의 관계, (errata 는 rfc-editor.org errata 페이지에서 조회일 2026-11 기준 "No matching errata found", 상태 Proposed Standard, 갱신·대체 없음을 확인했다).
