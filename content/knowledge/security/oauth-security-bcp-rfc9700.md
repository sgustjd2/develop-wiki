---
title: OAuth 2.0 보안 BCP (RFC 9700)와 PAR+DPoP 결합
aka: [OAuth 2.0 Security Best Current Practice, RFC 9700, BCP 240, OAuth Security BCP, dpop_jkt, PAR with DPoP, 인가 코드 바인딩]
category: security
level: advanced
summary: OAuth 2.0 구현이 지킬 보안 요구를 MUST/SHOULD 강도 그대로 정리한 RFC 9700 요약. 이어서 PAR 로 요청을 백채널에 올리고 DPoP 로 코드·토큰을 키에 묶는 결합의 동작과 비용.
tags: [oauth2, rfc9700, bcp, security, par, dpop, dpop-jkt, pkce, redirect-uri, sender-constrained]
related: [security/oauth2-oidc-pkce, security/oauth-par-rfc9126, security/dpop, security/oauth-jar-rfc9101, security/oauth-issuer-mix-up-defense-rfc9207, security/oauth-resource-indicators-rfc8707, security/mtls-certificate-bound-tokens, security/private-key-jwt-client-authentication, security/oauth-authorization-server-metadata-rfc8414, security/token-revocation-introspection, security/csrf, security/oauth-rich-authorization-requests-rfc9396]
sources:
  - https://www.rfc-editor.org/rfc/rfc9700.html
  - https://www.rfc-editor.org/rfc/rfc9449.html
  - https://www.rfc-editor.org/rfc/rfc9126.html
updatedAt: 2026-11-19
---

## 문제

OAuth 2.0(RFC 6749)이 나온 뒤 구현 현장에서 같은 종류의 취약점이 반복됐다. 느슨한 `redirect_uri` 검사, 인가 코드 주입, 여러 인가 서버를 쓰는 클라이언트의 mix-up, 유출된 bearer 토큰의 재사용 등이다. 개별 RFC(PKCE, DPoP, `iss` 파라미터)는 흩어져 있어서 "무엇이 필수이고 무엇이 권장인가"를 한 문서로 묶은 것이 RFC 9700(BCP 240, 2025-01)이다. RFC 6749, 6750, 6819 를 갱신(Updates)한다.

## 요구 사항 정리 (원문 강도 그대로)

아래 강도(MUST, SHOULD 등)는 RFC 9700 본문(2절 및 4절)에서 옮겼다. "권장" 항목을 필수처럼 쓰지 않도록 강도를 구분했다.

### 리다이렉트 기반 흐름

| 요구 | 강도 | 절 |
| --- | --- | --- |
| `redirect_uri` 비교는 **정확한 문자열 일치**. 예외는 네이티브 앱 localhost 의 포트 번호뿐 | 인가 서버 MUST | 2.1, 4.1.3 |
| 임의 URI 로 보내는 **open redirector** 를 노출하지 않음 | 클라이언트·인가 서버 MUST NOT | 2.1, 4.11 |
| 클라이언트의 **CSRF 방어** (state, PKCE, OIDC nonce 중 하나) | 클라이언트 MUST | 2.1, 4.7 |
| 인가 서버가 둘 이상일 때 mix-up 방어 | **REQUIRED**. 방법은 `iss`(RFC 9207) 또는 ID Token·JARM 의 `iss` 를 SHOULD, 대안으로 서버별 distinct redirect URI 를 MAY | 2.1, 4.4 |
| 인가 응답을 암호화되지 않은 연결로 보내지 않음. `http` redirect URI 는 네이티브 loopback 외 금지 | MUST NOT | 2.6 |
| 사용자 자격 증명이 담긴 요청을 리다이렉트할 때 HTTP **307 금지**, 리다이렉트를 쓴다면 303 | 307 은 MUST NOT, 303 은 SHOULD | 4.12 |
| 인가 엔드포인트에서 clickjacking 방지(CSP `frame-ancestors` 등) | 방지 자체는 MUST, CSP level 2 이상은 SHOULD | 4.16 |
| 인가 엔드포인트에 **CORS 를 허용하지 않음** | MUST NOT | 2.6 |

### 인가 코드 흐름

| 요구 | 강도 | 절 |
| --- | --- | --- |
| 공개 클라이언트는 **PKCE** | MUST | 2.1.1 |
| 기밀 클라이언트의 PKCE | RECOMMENDED. 추가 조건 하에서 OIDC `nonce` 로 대체 가능(MAY) | 2.1.1 |
| 챌린지 방식은 verifier 를 요청에 노출하지 않는 것(`S256`) | SHOULD | 2.1.1 |
| 인가 서버는 PKCE 를 **지원**하고, 지원 여부를 알릴 방법(`code_challenge_methods_supported` 등) 제공 | 지원·탐지 수단 MUST, 메타데이터 게시는 RECOMMENDED | 2.1.1 |
| 요청에 `code_challenge` 가 없었는데 토큰 요청에 `code_verifier` 가 오면 거부 (**PKCE 다운그레이드 방지**) | MUST | 2.1.1, 4.8 |
| 인가 코드는 첫 사용 후 무효화. 코드가 두 번 사용되면 앞서 발급한 토큰 폐기 | 무효화 MUST(RFC 6749 인용), 토큰 폐기는 SHOULD | 4.2.4 |
| 암묵(implicit) grant 등 인가 응답으로 액세스 토큰을 주는 응답 유형 | 사용하지 않는다 **SHOULD NOT** (토큰 주입·유출이 막힌 경우는 예외). 대신 `code` | 2.1.2 |
| Resource Owner Password Credentials grant | **MUST NOT** 사용 | 2.4 |

### 토큰과 클라이언트

| 요구 | 강도 | 절 |
| --- | --- | --- |
| 액세스 토큰을 **송신자 제약**(mTLS RFC 8705, DPoP RFC 9449) | SHOULD (아키텍처·성능상 못 쓰는 배포가 있음을 인정) | 2.2.1, 4.10 |
| 공개 클라이언트의 **리프레시 토큰**은 송신자 제약이거나 **회전(rotation)** | MUST | 2.2.2, 4.14.2 |
| 리프레시 토큰은 사용자가 동의한 scope·리소스 서버에 묶음 | MUST | 4.14.2 |
| 리프레시 토큰을 줄지는 위험 평가로 결정 | MUST | 4.14.2 |
| 유휴 리프레시 토큰은 만료 | SHOULD | 4.14.2 |
| 액세스 토큰 권한을 최소로, **audience 제한**(특정 리소스 서버 또는 소수 집합) | SHOULD | 2.3 |
| 리소스 서버는 매 요청마다 토큰이 자기를 위한 것인지 검증하고 아니면 거부 | MUST | 2.3 |
| 토큰을 평문으로 저장·전송하지 않음(리소스 서버) | MUST | 4.9.3 |
| 클라이언트 인증이 가능하면 서버가 강제 | SHOULD. 비대칭 방식(mTLS, `private_key_jwt`)을 RECOMMENDED | 2.5 |
| 인가 서버 메타데이터(RFC 8414) 게시·사용 | RECOMMENDED | 2.6 |
| 클라이언트가 자신의 `client_id` 등을 정해 사용자 식별자와 혼동되게 하지 못하도록 | SHOULD NOT 허용 | 2.6, 4.15 |
| `postMessage` 응답은 송신·수신 origin 을 정확히 검증, 와일드카드 `*` 금지 | MUST / MUST NOT | 4.17 |
| TLS 종단 리버스 프록시는 외부에서 온 보안 관련 헤더를 정제 | MUST | 4.13 |

### 공격자 모델

RFC 는 5 종 공격자를 가정한다. A1(웹 공격자: 자기 서버·브라우저·등록 클라이언트를 운영), A2(네트워크 공격자: TLS 로 보호되지 않은 메시지 조작), A3(인가 **응답**을 읽을 수 있는 공격자), A4(인가 **요청**을 읽을 수 있는 공격자), A5(발급된 액세스 토큰을 손에 넣은 공격자, 예: 침해된 리소스 서버). A3~A5 는 보통 A1 또는 A2 와 함께 나타난다. 이 노트 아래 방어책은 대부분 "A3 가 코드를 읽는다", "A5 가 토큰을 가진다"는 가정에서 나온다.

## 해법: 한 장짜리 체크리스트

```text
인가 서버                                   클라이언트
[ ] redirect_uri 정확 일치                   [ ] PKCE(공개 MUST, S256 SHOULD), state 는 1 회용·세션 결속
[ ] PKCE 지원 + 메타데이터 광고              [ ] 인가 서버가 2 개 이상이면 iss 검증 + issuer 저장
[ ] code_verifier 만 오면 거부               [ ] implicit·ROPC 미사용
[ ] 코드 1 회용(재사용 시 토큰 폐기 SHOULD)  [ ] 리프레시 토큰 회전 또는 DPoP/mTLS
[ ] 액세스 토큰 aud 제한 + 송신자 제약       [ ] 토큰 요청에 resource/audience 지정
[ ] 307 대신 303, CSP frame-ancestors        [ ] RS: aud 검증 MUST, sender 검증 SHOULD
```

대부분의 항목은 개별 노트로 나뉘어 있다: [PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/), [`iss` mix-up 방어](/develop-wiki/knowledge/security/oauth-issuer-mix-up-defense-rfc9207/), [resource indicators](/develop-wiki/knowledge/security/oauth-resource-indicators-rfc8707/), [mTLS 바인딩](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/), [DPoP](/develop-wiki/knowledge/security/dpop/).

## PAR + DPoP 결합

RFC 9700 은 PAR(RFC 9126)와 JAR(RFC 9101)을 **필수로 하지 않는다.** 4.1.3 절에서 PAR/JAR 로 요청의 출처·무결성을 확인할 수 있으면(PAR 는 클라이언트 인증과 함께) 인가 서버가 redirect URI 를 추가 검사 없이 신뢰해도 된다(MAY)고만 말한다. 즉 선택적 강화책이다. 이 결합이 하는 일을 둘로 나눈다.

1. **PAR**: 인가 요청을 브라우저 URL 이 아니라 인증된 백채널로 올려 A4(요청 읽기)·변조를 막는다.
2. **DPoP**: 토큰을 클라이언트 키에 묶어 A5(토큰 도난)를 막는다. RFC 9449 는 여기에 더해 **인가 코드도 같은 키에 묶는** 방법을 둔다.

### 인가 코드를 DPoP 키에 묶기 (RFC 9449 10절)

- 인가 요청에 `dpop_jkt` 파라미터(DPoP 공개키의 JWK 썸프린트, SHA-256, RFC 7638)를 넣는다. 인가 서버는 토큰 요청의 DPoP 증명 키 썸프린트를 계산해 `dpop_jkt` 와 다르면 **거부해야 한다(MUST)**. 사용은 **OPTIONAL** 이다.
- 이게 막는 것: 인가 서버가 코드의 1 회용을 엄격히 강제하지 못하는 상황(복제된 서버 간 지연 등), 공격자가 코드와 PKCE verifier 까지 얻은 상황(RFC 9449 가 XSS 를 예로 든다)에서 공격자가 **자기 키**로 교환해 토큰을 자기 키에 묶는 시도. RFC 9449 는 `dpop_jkt` 가 PKCE 와 함께 쓸 수 있고, 인가 요청마다 고유한 DPoP 키를 쓸 때만 PKCE 와 비슷한 보호가 된다고 단서를 단다.
- RFC 9700 4.5.3.3 절은 "코드를 암호학적으로 송신자 제약하는 해법은 생각해 볼 수 있으나 지원이 부족하다"고 쓴다. DPoP 의 `dpop_jkt` 는 그 뒤에 표준화된 방법이다.

### PAR 에서 DPoP 키를 전달하는 두 방법 (RFC 9449 10.1절)

| 방법 | 동작 | 비고 |
| --- | --- | --- |
| `dpop_jkt` 를 PAR 요청 **본문**에 포함 | 코드가 그 키에 묶인다 | 본문의 다른 인가 파라미터와 함께 보냄(MUST) |
| PAR 요청에 **`DPoP` 헤더** 추가 | 서버가 증명을 4.3 절대로 검증하고 증명 키를 `dpop_jkt` 로 간주한다 | 개인키 소유 증명을 포함해 바인딩이 더 강하다. 클라이언트는 인가 서버로 가는 모든 호출에 헤더를 "그냥" 붙이면 된다 |

- PAR 와 DPoP 를 모두 지원하는 인가 서버는 **두 방식을 모두 지원해야 한다(MUST)**. 둘이 함께 오는데 썸프린트가 헤더 키와 다르면 **거부해야 한다(MUST)**.

### 직접 실행: 바인딩 동작 확인

Node 24(`node:crypto`, ES256)로 RFC 요건 일부만 흉내 낸 인가 서버를 써서 아홉 경우를 돌렸다. PAR 엔드포인트의 클라이언트 인증, `ath`, `jti` 리플레이, nonce, 시간 창 같은 나머지 DPoP 검증은 생략했다. 증명의 서명·`typ`·`alg`·`htm`/`htu` 일치는 확인한다.

```ts
// 인가 서버: PAR 에서 키를 정하고, 토큰 요청에서 같은 키인지 본다 (발췌)
function par(req: Req, dpopHeader?: string) {
  let bound = req.dpop_jkt;
  if (dpopHeader) {
    const k = checkProof(dpopHeader, 'POST', PAR_URL);   // 서명·htm·htu 검증 후 jkt
    if (bound && bound !== k) throw new Error('invalid_dpop_proof'); // 둘 다 왔는데 다르면 거부
    bound = k;                                           // 헤더 키를 dpop_jkt 처럼 취급
  }
  /* request_uri 저장 ... */
}
function token(code: string, verifier: string | undefined, dpop?: string) {
  const r = codes.get(code); codes.delete(code); if (!r) throw new Error('invalid_grant');
  if (verifier && !r.code_challenge) throw new Error('invalid_grant');   // PKCE 다운그레이드 거부
  if (r.dpop_jkt && (!dpop || checkProof(dpop, 'POST', TOKEN_URL) !== r.dpop_jkt)) throw new Error('invalid_grant');
}
```

| # | 경우 | 결과 |
| --- | --- | --- |
| 1 | `dpop_jkt` 로 푸시, 같은 키로 교환 | 성공 |
| 2 | PAR 요청에 `DPoP` 헤더, 같은 키로 교환 | 성공 |
| 3 | 코드와 verifier 를 탈취, **공격자 키**로 교환 | 거부 |
| 4 | 코드와 verifier 를 탈취, DPoP 증명 없이 교환 | 거부 |
| 5 | `dpop_jkt` 와 `DPoP` 헤더의 키가 다름 | PAR 단계에서 거부 |
| 6 | 대조군: 바인딩 없이 푸시, 공격자 키로 교환 | **성공**(토큰이 공격자 키에 묶여 발급됨) |
| 7 | PKCE 없이 인가한 코드에 `code_verifier` 제출 | 거부 |
| 8 | 등록 URI 로 시작하지만 다른 값의 `redirect_uri` | 거부 (정확 일치) |
| 9 | `htu` 가 다른 엔드포인트인 증명 | 거부 |

6 번이 핵심 비교다. PKCE 가 있어도 verifier 까지 유출되면 공격자가 교환하고, `dpop_jkt` 가 없으면 서버는 공격자 키로 토큰을 묶어 준다. 실제 인가 서버(Keycloak, Authlete 등)의 구현은 확인하지 않았다.

### 결합이 주는 것과 주지 않는 것

| 위협 | PAR 단독 | DPoP 단독 | PAR + DPoP(`dpop_jkt`) |
| --- | --- | --- | --- |
| 인가 요청 변조·열람(A4) | 막음 | 막지 않음 | 막음 |
| 인가 코드 탈취 후 교환(코드+verifier 유출) | 막지 않음 | 막지 않음(코드는 키에 안 묶임) | 막음(공격자 키 불일치) |
| 액세스 토큰 유출 후 재사용(A5) | 막지 않음 | 키가 없으면 못 씀 | 키가 없으면 못 씀 |
| 개인키까지 탈취(XSS, 침해된 클라이언트) | 해당 없음 | 못 막음 | 못 막음 |
| 리프레시 토큰 유출 | 막지 않음 | 공개 클라이언트면 키에 묶임 | 키에 묶임 |

RFC 9700 4.10.1 은 송신자 제약 토큰의 보안이 **토큰과 키를 함께 얻은 공격자 앞에서는 무너진다**고 명시한다(예: 손상된 클라이언트, 브라우저의 XSS). 키가 보안 모듈·비추출 저장소에 있으면 클라이언트가 오프라인일 때의 사용만 막는다.

## 언제 쓰나

- 금융·의료처럼 요구 수준이 높은 API(FAPI 류 프로파일의 세부 요건은 이 노트에서 읽지 않았다), 또는 리치 인가 요청([RFC 9396](/develop-wiki/knowledge/security/oauth-rich-authorization-requests-rfc9396/))처럼 요청이 길고 민감한 경우의 PAR.
- 토큰 도난 피해가 큰 공개 클라이언트(SPA·모바일)의 DPoP. 리프레시 토큰은 회전 대신 키 바인딩으로 MUST 요건을 채울 수 있다.
- 자체 인가 서버를 만들거나 OAuth 라이브러리를 고를 때의 **점검표**로서 RFC 9700 전체.

## 주의 (비용)

- **구현 비용**: DPoP 는 요청마다 서명 증명 생성·검증, `jti` 리플레이 저장소, nonce 관리(`DPoP-Nonce` 헤더로 추가 왕복이 생길 수 있다)가 필요하다. 리소스 서버마다 검증 로직을 넣어야 한다. PAR 는 서버 상태와 클라이언트당 한 번의 백채널 호출이 늘어난다. 결합하면 인가 서버·리소스 서버·클라이언트 SDK 모두 해당 기능을 지원해야 한다 → [PAR](/develop-wiki/knowledge/security/oauth-par-rfc9126/), [DPoP](/develop-wiki/knowledge/security/dpop/).
- **키 보관이 약한 고리다.** 브라우저에서 키를 비추출(non-extractable)로 만들어도 XSS 가 있으면 앱의 컨텍스트에서 서명을 요구할 수 있다. 위 표의 "개인키까지 탈취" 줄이 이 한계다.
- **`dpop_jkt` 는 OPTIONAL** 이다. 인가 서버가 PAR 요청에 키를 요구하게 하려면 서버 정책으로 따로 강제해야 한다. 그렇지 않으면 6 번 경우처럼 바인딩이 비어 있을 수 있다.
- 클라이언트가 "DPoP 쓰니까 PKCE 는 필요 없다"고 오해하기 쉽다. RFC 9700 은 PKCE 를 계속 요구하고(공개 클라이언트 MUST), RFC 9449 도 `dpop_jkt` 가 PKCE 를 대체한다고 하지 않는다.
- RFC 9700 은 **정보성 개요가 아니라 BCP** 이므로 MUST/SHOULD 구분이 감사 항목이 된다. SHOULD 항목(송신자 제약 등)을 생략하려면 사유를 기록해 두는 편이 낫다(이 노트의 제안).
- OAuth 2.1 초안이 이 BCP 의 내용을 흡수하는 방향이지만 아직 RFC 가 아니다. 상태는 노트 작성 시점에 다시 확인한다 → [OAuth·OIDC·PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/).

## 비교

| 문서 | 성격 | 이 노트와의 관계 |
| --- | --- | --- |
| RFC 6749 / 6750 | OAuth 2.0 핵심 | 9700 이 갱신·보완 |
| RFC 6819 | 위협 모델 | 9700 이 갱신, 공격자 모델 명시 |
| RFC 7636 (PKCE) | 코드 보호 | 9700 이 공개 클라이언트 MUST, 기밀 클라이언트 RECOMMENDED |
| RFC 9126 (PAR), 9101 (JAR) | 요청 보호 | 9700 은 선택적 강화로만 언급 |
| RFC 9449 (DPoP), 8705 (mTLS) | 송신자 제약 | 9700 이 SHOULD |
| OAuth 2.1 초안 | 통합 프로파일 | 이 노트의 범위 밖 |

## 검증 범위

RFC 9700 전문(1~4절 중 2·3절 전부, 4절의 4.1.3, 4.2.4, 4.4.2, 4.5.3, 4.6.1, 4.7.1, 4.8.2, 4.9.3, 4.10, 4.11.2, 4.12, 4.13(후반부), 4.14, 4.15, 4.16, 4.17)과 RFC 9449 의 10·10.1·11.9 절을 rfc-editor.org 본문에서 읽고 MUST/SHOULD 강도를 대조했다. 4.1.1·4.1.2, 4.3, 4.9.1·4.9.2, 4.10.3, 4.11.1 의 공격 설명과 5절 이후는 읽지 못했다. 바인딩 확인 표는 직접 쓴 Node 스크립트를 실행한 결과이며 완전한 DPoP 검증기가 아니다. 특정 인가 서버 제품의 `dpop_jkt`·PAR 지원 여부는 확인하지 않았다.
