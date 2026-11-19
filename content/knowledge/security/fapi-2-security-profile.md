---
title: FAPI 2.0 Security Profile
aka: [FAPI 2.0, FAPI 2.0 Security Profile, FAPI 2.0 Attacker Model, Financial-grade API 2.0, OpenID FAPI, fapi-security-profile-2_0]
category: security
level: advanced
summary: OpenID Foundation 이 2025-02 최종 확정한 고보안 OAuth 2.0 프로파일. 공격자 모델 문서가 정한 목표를 위해 기밀 클라이언트, PAR, PKCE S256, iss 응답, 송신자 제약 토큰(mTLS·DPoP)을 shall 로 묶는다.
tags: [oauth2, fapi, openid, security-profile, par, pkce, dpop, mtls, private-key-jwt, attacker-model, open-banking]
related: [security/oauth-security-bcp-rfc9700, security/oauth-par-rfc9126, security/dpop, security/dpop-resource-server-validation, security/mtls-certificate-bound-tokens, security/private-key-jwt-client-authentication, security/oauth-issuer-mix-up-defense-rfc9207, security/oauth-authorization-server-metadata-rfc8414, security/oauth-rich-authorization-requests-rfc9396, security/oauth2-oidc-pkce, security/oauth-jar-rfc9101, security/jwt-key-rotation, security/threat-modeling-stride, security/oauth-2-1-vs-rfc9700, security/fapi-2-message-signing-rfc9421, security/oauth-jarm-fapi-migration, security/openid-ciba-poll-ping-push]
sources:
  - https://openid.net/specs/fapi-security-profile-2_0-final.html
  - https://openid.net/specs/fapi-attacker-model-2_0-final.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
updatedAt: 2026-11-19
---

## 문제

OAuth 2.0 은 선택지가 많다. grant 종류, 클라이언트 인증 방식, 토큰 형태, 리다이렉트 처리 모두 구현마다 다르게 고를 수 있고, 그 조합 중 일부는 안전하지 않다. [RFC 9700](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/)(Security BCP)은 무엇이 안전한지를 알려 주지만 상당수가 SHOULD 다. 은행·의료·행정처럼 API 가 다루는 데이터 가치가 높은 생태계는 "모든 참여자가 같은 안전한 조합만 쓴다"는 **상호운용 가능한 고정 프로파일**이 필요하다.

FAPI 2.0 Security Profile(OpenID Foundation FAPI WG, **Final, 2025-02-22**)이 그 프로파일이다. 처음엔 금융을 위해 만들었지만, 문서는 e-health·e-government 등 고가치 API 일반에 적용할 수 있게 설계했다고 밝힌다(Introduction).

## 두 문서의 관계

| 문서 | 역할 |
| --- | --- |
| **FAPI 2.0 Attacker Model** (Final, 2025-02-22) | 보안 목표와 공격자 유형을 정의한다. 구체적인 위협 목록 대신 "이 능력을 가진 공격자가 어떤 공격을 하든 목표가 깨지지 않아야 한다"는 방식을 택한다(6절) |
| **FAPI 2.0 Security Profile** (Final, 2025-02-22) | 그 목표를 달성하도록 OAuth 2.0 과 관련 RFC 를 제약한다. RFC 9700 권고를 따른다(5.1.1) |
| 형식 분석(FAPI2SEC 등) | Security Profile 이 공격자 모델 안에서 목표를 만족함을 형식 모델로 증명. 상세 분석은 인가 코드 흐름과 CIBA 흐름까지라고 Profile 이 명시한다(5.3.2.1 NOTE 2) |

### 보안 목표 (Attacker Model 5절)

- **인가**: 어떤 공격자도 자기 것이 아닌 보호 리소스에 접근하지 못한다. 즉 남의 리소스용 액세스 토큰을 얻어 쓸 수 없다.
- **인증**(OIDC 사용 시): 다른 사용자 신원으로 클라이언트에 로그인하지 못한다.
- **세션 무결성**: 사용자를 공격자 계정으로 로그인시키거나 공격자 리소스를 쓰게 만들지 못한다(CSRF, 세션 스와핑).

### 공격자 유형 (Attacker Model 7절)

| 유형 | 능력 |
| --- | --- |
| A1 웹 공격자 | 자기 엔드포인트 운영, 정상 사용자처럼 흐름 참여, 사용자에게 링크 전송. 남의 메시지 가로채기·차단 불가 |
| A1a | A1 + 생태계 안에서 **인가 서버 역할**도 함 |
| A2 네트워크 공격자 | 네트워크 전체 장악(가로채기·차단·변조). 암호는 못 깸 |
| A3a | A1 + 프런트 채널 **인가 요청을 읽음**(브라우저 기록, 앱 URL 등록, TLS 가로채는 백신 등) |
| A4 | 클라이언트가 가짜 토큰 엔드포인트를 쓰게 만듦. Profile 이 메타데이터 신뢰 경로를 강제하므로 **FAPI 2.0 에서는 해당 없음**(정보용으로만 남김) |
| A5 | A1 + 리소스 서버가 처리한 **요청을 읽음**(RS 쪽 TLS 프록시 로그 등) |

범위 밖(6절, 7.5 Note, 8절): TLS 자체가 깨지는 경우, JWKS 배포가 잘못되는 경우, 사용자 기기·브라우저가 침해된 경우, 사용자 신원 확인·세션 관리, 인가 응답을 읽는 공격자(대부분의 리다이렉트 프로토콜을 무너뜨리므로 제외. Profile 6.5 "browser-swapping" 에서 다룸), 서버 원격 코드 실행, 약한 난수.

**번호 주의**: RFC 9700 의 공격자 번호와 다르다. RFC 9700 은 A3 = 인가 **응답** 읽기, A4 = 인가 **요청** 읽기, A5 = 액세스 토큰 획득이다. FAPI 는 A3a = 인가 요청 읽기, A5 = 리소스 요청 읽기다. 두 문서를 섞어 읽을 때 번호로 대조하면 틀린다.

## 해법: 핵심 요구 사항

키워드는 ISO Directive Part 2 의 **shall / should / may** 다(RFC 2119 의 MUST/SHOULD/MAY 가 아님). 아래 강도는 원문 그대로다.

### 네트워크 (5.2)

| 요구 | 강도 | 절 |
| --- | --- | --- |
| TLS 엔드포인트만, TLS 1.2 이상, BCP 195 따름, 서버 인증서 확인(RFC 9525) | shall | 5.2.1 |
| DNSSEC | should | 5.2.1 |
| 브라우저 미사용 엔드포인트의 TLS 1.2 암호 스위트는 BCP 195 "recommended" 만 | 서버 shall, 클라이언트 should | 5.2.2 |
| 브라우저용 엔드포인트는 TLS stripping 방지(사전 로드된 HSTS 등) | shall | 5.2.3 |
| 인가 엔드포인트에 CORS 지원 안 함 | shall not | 5.2.3 |

### 인가 서버 (5.3.2)

| 요구 | 강도 | 절 |
| --- | --- | --- |
| 메타데이터 게시(OIDC Discovery, RFC 8414) | shall | 5.3.2.1 |
| ROPC grant 거부 | shall | 5.3.2.1 |
| **기밀 클라이언트만** 지원 | shall | 5.3.2.1 |
| **송신자 제약 액세스 토큰만** 발급, 방식은 mTLS(RFC 8705) 또는 DPoP(RFC 9449) | shall | 5.3.2.1 |
| 클라이언트 인증은 mTLS 또는 `private_key_jwt` | shall | 5.3.2.1 |
| 클라이언트 인증 assertion 의 `aud` 는 자기 issuer 식별자 **문자열**만 수락 | shall | 5.3.2.1 |
| **리프레시 토큰 회전 안 함**(예외적 상황 제외) | shall not | 5.3.2.1 |
| 인가 코드 최대 수명 **60 초** | shall | 5.3.2.1 |
| DPoP 를 쓰면 RFC 9449 10.1 의 코드-키 바인딩 **지원** | shall | 5.3.2.1 |
| DPoP 서버 nonce 사용 | may | 5.3.2.1 |
| 미래 `iat`/`nbf` 0~10 초는 수락, 60 초 초과는 거부 | shall | 5.3.2.1 |
| 액세스 토큰 권한 최소화 | should | 5.3.2.1 |
| `response_type=code` 만 | shall | 5.3.2.2 |
| **PAR 지원 + PAR 없이 온 인가 요청 거부 + 클라이언트 인증 없는 PAR 거부** | shall | 5.3.2.2 |
| PKCE `S256` 필수 | shall | 5.3.2.2 |
| PAR 에 `redirect_uri` 필수 | shall | 5.3.2.2 |
| 인가 응답에 `iss`(RFC 9207) | shall | 5.3.2.2 |
| 이미 쓴 인가 코드 거부 | shall | 5.3.2.2 |
| 자격 증명 담긴 요청 리다이렉트에 307 금지, 303 권장 | shall not / should | 5.3.2.2 |
| PAR `request_uri` 의 `expires_in` **600 초 미만** | shall | 5.3.2.2 |
| OIDC 지원 시 `nonce` 64 자까지 지원 | shall | 5.3.2.2 |

### 클라이언트 (5.3.3)

| 요구 | 강도 | 절 |
| --- | --- | --- |
| mTLS·DPoP 중 하나 이상 지원, mTLS·`private_key_jwt` 중 하나 이상 지원 | shall | 5.3.3.1 |
| `private_key_jwt` 의 `aud` 는 AS issuer 를 배열 아닌 문자열로 | shall | 5.3.3.1 |
| 리프레시 토큰과 그 **회전을 지원**(AS 가 예외적으로 회전할 때를 대비) | shall | 5.3.3.1 |
| DPoP 를 쓰면 서버 nonce 지원 | shall | 5.3.3.1 |
| 메타데이터는 신뢰 출처·보안 채널로 얻은 issuer URL 에서만, issuer 값 일치 확인 | shall | 5.3.3.1 |
| 인가 시작을 CSRF 로부터 보호 | shall | 5.3.3.1 |
| PAR 사용, 인가 엔드포인트에는 `client_id` 와 `request_uri` **만** 전송 | shall | 5.3.3.2 |
| PKCE `S256`, 요청마다 생성하고 클라이언트·user agent 에 결속 | shall | 5.3.3.2 |
| 응답의 `iss` 확인 | shall | 5.3.3.2 |
| `dpop_jkt` 코드 바인딩 사용 | 요구 안 함(NOTE 2) | 5.3.3.1 |

### 리소스 서버 (5.3.4)

- 액세스 토큰은 HTTP 헤더(RFC 6750 2.1 또는 RFC 9449 7.1)로 받고(shall), 쿼리 파라미터 토큰은 받지 않는다(shall not).
- 토큰의 유효성·무결성·만료·**폐기 상태**를 확인하고, 권한이 충분한지 검사한다(shall).
- mTLS 또는 DPoP 송신자 제약을 지원·검증한다(shall) → [DPoP RS 검증 절차](/develop-wiki/knowledge/security/dpop-resource-server-validation/).

### 암호 (5.4)

- JWT 생성·처리는 RFC 8725 를 따르고 **PS256, ES256, EdDSA(Ed25519)** 만, `none` 금지(shall).
- RSA 2048 비트 이상, EC 224 비트 이상(shall). 사용자가 다루지 않는 자격 증명(토큰·코드)은 엔트로피 128 비트 이상(shall).
- `jwks_uri` 는 TLS 로만(shall), `x5u`·`jku` 헤더 쓰지 않음(should not), 같은 `kid` 의 여러 키를 두지 않음(should not) → [JWT 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).

## FAPI 1.0 Advanced 와 무엇이 바뀌었나 (5.5 표 요약)

| FAPI 1.0 Advanced | FAPI 2.0 | 문서가 든 이유 |
| --- | --- | --- |
| JAR | PAR | 요청 무결성과 호환성 |
| JARM | 응답에 코드만 | 응답에 보호할 것이 코드뿐 |
| `s_hash`, state 기반 CSRF | PKCE | CSRF 방어를 PKCE 가 맡음 |
| 사전 등록 redirect URI | PAR 안의 redirect URI | 클라이언트 인증 + PAR 이면 사전 등록 불필요 |
| `code id_token` 하이브리드 | `code` | 프런트 채널에 ID 토큰 없음(프라이버시) |
| mTLS 만 | mTLS 또는 DPoP | DPoP 가 일부 환경에서 배포가 쉬움 |
| 위협별 방어 | 공격자 모델 + 보안 목표 | 형식 분석에 맞는 설계 |

## 언제 쓰나

- 오픈뱅킹·의료 데이터 공유처럼 **여러 조직이 같은 규칙으로** 상호 연동해야 하고, 규제가 보안 수준의 근거를 요구할 때.
- 자체 인가 서버의 기본 설정을 "가장 엄격한 조합"으로 잡고 싶을 때의 기준표. 단, 프로파일을 만들어 더 좁히는 것은 되지만 **필수 동작을 빼거나 덮어쓰면 준수하지 않는 것**이다(5.1.2).
- 구현 검증: 문서는 OpenID Foundation 인증 도구와 인증된 구현 사용을 권한다(6.6, should).

## 주의 (비용)

- **공개 클라이언트는 범위 밖**이다(5.1.1). SPA·모바일 앱이 직접 토큰을 받는 구조라면 FAPI 2.0 을 그대로 적용할 수 없다. BFF 처럼 서버를 기밀 클라이언트로 두는 설계가 필요하다(후반은 이 노트의 해석).
- **구성 요소 부담**: AS 는 PAR, PKCE, `iss`, mTLS 또는 DPoP, `private_key_jwt`/mTLS 인증, 메타데이터를 모두 갖춰야 한다. 클라이언트도 키 관리(서명키, DPoP 키 또는 인증서)가 필수다.
- **시계 오차**: 미래 `iat` 수락 창을 0~10 초는 열고 60 초를 넘기면 닫아야 한다. 사용자 기기 위 기밀 클라이언트는 서버 `Date` 헤더로 시계를 맞추라고 권한다(5.3.3.1 NOTE 1).
- **리프레시 토큰 회전 금지**는 RFC 9700 의 공개 클라이언트용 "회전 또는 송신자 제약" 과 충돌하지 않는다. FAPI 는 기밀 클라이언트 + 송신자 제약이라 회전이 보안 이득 없이 장애(새 토큰 수신 실패)만 만든다고 본다(NOTE 1).
- **남는 위험**(6절): DPoP 증명 재사용으로 본문 변조(A5, 6.2), 신뢰하는 다른 AS 를 장악한 공격자의 토큰 주입("Cuckoo's Token", 6.3), 인가 요청 유출을 이용한 CSRF(6.4), 인가 응답 유출 시 browser-swapping(6.5, 현재 기술로 완전 차단 불가). 문서는 A5·6.3 같은 강한 공격자 대비가 많은 생태계에선 필요 없을 수도 있다고 쓴다.
- **문서 내 표기 흔들림**: Profile 6.4 는 "A3" 라고 쓰지만 Attacker Model 의 정의는 A3a 이고, Attacker Model 8.2 는 본문에 정의되지 않은 A7 을 언급한다. 형식 분석 당시 번호와의 대응표(9절)를 함께 본다.

## 비교

| 항목 | RFC 9700 (BCP) | [OAuth 2.1 초안](/develop-wiki/knowledge/security/oauth-2-1-vs-rfc9700/) | FAPI 2.0 Security Profile |
| --- | --- | --- | --- |
| 성격 | 보안 권고 | 프레임워크 재정의 | 고보안 프로파일 |
| 공개 클라이언트 | 허용(PKCE MUST) | 허용 | 범위 밖 |
| 송신자 제약 액세스 토큰 | SHOULD | SHOULD | shall |
| PAR | 선택 | 선택 | shall |
| PKCE | 공개 MUST, 기밀 RECOMMENDED | 원칙적 REQUIRED, `plain` 금지 | `S256` shall |
| 클라이언트 인증 | 비대칭 방식 RECOMMENDED | `client_secret` 허용 | mTLS 또는 `private_key_jwt` shall |
| 인가 응답 `iss` | AS 가 여럿일 때 mix-up 방어 REQUIRED(`iss` 는 그 방법 중 하나) | AS 는 항상 `iss` 반환 REQUIRED (-17 4.1.2) | AS 는 항상 반환, 클라이언트는 항상 확인(shall) |
| 리프레시 토큰 회전 | 공개 클라이언트: 회전 또는 송신자 제약 MUST | 같음 | AS 는 회전 shall not |

## 검증 범위

openid.net 의 FAPI 2.0 Security Profile Final(2025-02-22) 1~6절과 5.5 표, FAPI 2.0 Attacker Model Final(2025-02-22) 5~9절을 원문에서 읽었다. 강도는 원문 shall/should/may 를 그대로 옮겼다. 형식 분석 논문(FAPI2SEC, analysis.FAPI2) 본문, FAPI 2.0 Message Signing, 관련 Implementation and Deployment Advice 문서는 읽지 않았다. 국가별 오픈뱅킹 규격이 FAPI 2.0 의 어떤 선택지를 고정했는지, OpenID 인증 도구의 시험 항목은 확인하지 않았다.
