---
title: OAuth 2.1 초안과 RFC 9700 의 차이
aka: [OAuth 2.1, draft-ietf-oauth-v2-1, draft-ietf-oauth-v2-1-17, OAuth 2.1 vs Security BCP, RFC 9700 vs OAuth 2.1, OAuth 2.0 migration]
category: security
level: intermediate
summary: OAuth 2.1(draft-ietf-oauth-v2-1-17, 2026-10-31, 아직 RFC 아닌 초안)은 RFC 6749·6750 을 대체하려는 프레임워크 문서이고, RFC 9700 은 6749 를 갱신하는 보안 BCP 다. 두 문서의 성격과 요구 강도 차이를 절 번호로 비교.
tags: [oauth2, oauth21, rfc9700, bcp, pkce, implicit-grant, refresh-token, draft, migration]
related: [security/oauth-security-bcp-rfc9700, security/oauth2-oidc-pkce, security/fapi-2-security-profile, security/dpop, security/mtls-certificate-bound-tokens, security/private-key-jwt-client-authentication, security/oauth-issuer-mix-up-defense-rfc9207, security/oauth-par-rfc9126, security/session-vs-jwt]
sources:
  - https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
  - https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-17.txt
  - https://www.rfc-editor.org/rfc/rfc9700.html
updatedAt: 2026-11-19
---

## 문제

"OAuth 2.1 을 지원한다"와 "RFC 9700 을 따른다"는 자주 같은 뜻으로 쓰인다. 하지만 두 문서는 성격이 다르다.

- **RFC 9700**(BCP 240, 2025-01): 발행된 RFC. RFC 6749·6750·6819 를 **갱신(Updates)** 하는 보안 권고다. OAuth 2.0 위에 얹는다.
- **OAuth 2.1**(`draft-ietf-oauth-v2-1`): **아직 RFC 가 아닌 Internet-Draft** 다. 이 노트는 **-17 판(2026-10-31 제출, 2027-05-04 만료)** 을 기준으로 한다. datatracker 상태는 "Active", IESG 상태 "I-D Exists", 스트림 상태 "WG Document" 다(2026-11-19 조회). 승인되면 RFC 6749·6750 을 **대체(Obsoletes)** 하는 것이 목표다(-17 에서 메타데이터에 추가).

초안은 바뀔 수 있다. 아래 OAuth 2.1 쪽 강도는 -17 판 기준이며, 인용 전에 최신 판을 다시 확인해야 한다.

## 해법: 관계 정리

OAuth 2.1 -17 의 10절은 이 문서가 RFC 6749, 8252(네이티브 앱), 7636(PKCE), 10017(브라우저 기반 앱, BCP 212, 2026-08), 9700, 6750 의 기능을 **한 문서로 통합**한다고 설명한다. 뒤 문서가 6749 를 바꾼 부분은 그 규범적 변경을 반영하거나 아예 뺐다.

즉 해석하면: RFC 9700 은 "OAuth 2.0 을 안전하게 쓰는 법" 이고, OAuth 2.1 은 "그 권고 상당수를 기본 규칙으로 넣은 새 본문" 이다. 대부분의 요구가 겹치지만, **강도가 올라간 것**, **아예 정의에서 빠진 것**, **2.1 이 새로 넣은 것**이 있다.

## 비교: 요구 사항별 강도

| 항목 | RFC 9700 | OAuth 2.1 -17 |
| --- | --- | --- |
| 문서 지위 | BCP(발행), 6749 갱신 | Internet-Draft, 승인 시 6749·6750 대체 |
| PKCE (공개 클라이언트) | MUST (2.1.1) | `code_challenge` REQUIRED, AS 가 강제 MUST (4.1.1, 7.5.1.1) |
| PKCE (기밀 클라이언트) | RECOMMENDED. 조건부로 OIDC `nonce` 대체 MAY (2.1.1) | 기본은 REQUIRED + AS 강제 MUST. 기밀 클라이언트이고 OIDC `nonce` 구현을 AS 가 합리적으로 확신할 때만 예외(그때도 RECOMMENDED) (7.5.1.1) |
| AS 의 PKCE 처리 | 지원 MUST, 챌린지가 오면 강제 MUST (2.1.1) | 공개 클라이언트의 챌린지 없는 요청은 거부 MUST, 그 밖의 클라이언트는 다른 방어를 합리적으로 확신할 때만 예외 (4.1.2.1, 7.5.1.1) |
| `plain` 챌린지 | verifier 를 노출하지 않는 방식 SHOULD, 현재 `S256` 뿐 (2.1.1) | **명시적 금지** (7.5.2), `code_challenge_method` 는 `S256` 또는 향후 확장 (4.1.1) |
| PKCE 다운그레이드 | `code_verifier` 만 오면 거부 MUST (2.1.1) | `code_verifier` 는 챌린지가 있었을 때만, 없었으면 거부 MUST (4.1.3) |
| Implicit (`response_type=token`) | SHOULD NOT (2.1.2) | **정의에서 제거** (10.1) |
| ROPC grant | MUST NOT (2.4) | **정의에서 제거** (10) |
| redirect URI 비교 | 정확 일치 MUST, localhost 포트 예외 (2.1) | 같음, 전체 URI 등록 MUST (2.3.1) |
| 토큰 요청의 `redirect_uri` | (다루지 않음) | **제거**. 2.0·2.1 클라이언트를 함께 받는 AS 는 2.0 방식대로 받고 강제 MUST (10.2) |
| 쿼리 문자열로 액세스 토큰 | 클라이언트 MUST NOT (4.3.2) | 클라이언트 MUST NOT, **RS 도 무시 MUST** (5.1) |
| 송신자 제약 액세스 토큰 | SHOULD (2.2.1) | AS·RS SHOULD (1.4.3) |
| 공개 클라이언트 리프레시 토큰 | 송신자 제약 또는 회전 MUST (2.2.2) | 같음 (4.3.1) |
| 브라우저 앱 리프레시 토큰 | (해당 RFC 범위 밖) | 최대 수명 또는 유휴 만료 MUST, 회전 시 최초 수명 넘겨 연장 MUST NOT (9.3.2, RFC 10017 반영) |
| 인가 코드 재사용 | 1 회용 MUST, 재사용 시 토큰 폐기 SHOULD (4.2.4) | 거부 MUST + 폐기 SHOULD, **잘못된 파라미터를 단 재사용에는 폐기 SHOULD NOT**(DoS 방지) (4.1.3, 7.5.3) |
| CSRF | state·PKCE·OIDC nonce 중 하나 MUST (2.1) | 클라이언트 MUST. AS 의 PKCE 지원을 확인했으면 PKCE 에 기대도 MAY (2.3.3) |
| mix-up | AS 가 여럿이면 방어 REQUIRED (2.1) | AS 가 여럿이면 방어 MUST (2.3.4, 7.15) |
| 인가 응답 `iss` | mix-up 방어 수단 중 하나(SHOULD, 2.1) | **성공·오류 응답 모두 AS 가 `iss` 반환 REQUIRED** (4.1.2, 4.1.2.1). 클라이언트 비교 MUST 는 7.15.1 방어를 쓸 때 |
| 307 리다이렉트 | MUST NOT, 303 SHOULD (4.12) | 같음 (7.5.4) |
| 클라이언트 인증 | 가능하면 강제 SHOULD, 비대칭 RECOMMENDED (2.5) | 비대칭 RECOMMENDED. **`client_secret` 을 본문으로 받는 것(client_secret_post) 지원 MUST**, Basic 은 MAY (2.4, 2.4.1) |
| 브라우저 앱 공유 비밀 | (다루지 않음) | 공유 비밀로 인증 요구 MUST NOT, 그런 클라이언트는 공개 클라이언트로 취급 MUST (9.3.1) |
| HTTPS | 인가 응답 평문 전송 MUST NOT (2.6) | 모든 OAuth URL https MUST, loopback redirect 만 http MAY (1.5) |
| 버전 신호 | - | 클라이언트·AS 가 2.0/2.1 을 알리는 방법은 정의하지 않음. AS 가 클라이언트별 설정으로 결정 (1.8) |

## 언제 쓰나

- **새 OAuth 구현의 기준선**: 2.1 초안의 규칙(PKCE 필수, implicit·ROPC 없음, 정확 일치)을 따르면 RFC 9700 의 핵심 MUST 대부분을 함께 채운다. 다만 공식 근거로는 발행된 RFC 9700 과 개별 RFC 를 인용하는 편이 안전하다(초안은 바뀌기 때문, 이 노트의 의견).
- **기존 2.0 AS 의 이행**: 1.8 절대로 클라이언트별로 2.1 규칙을 켤 수 있다. 토큰 요청의 `redirect_uri` 처리(10.2)와 `plain` PKCE 클라이언트가 이행의 걸림돌이다.
- **라이브러리·제품 평가**: "OAuth 2.1 지원" 이라는 문구가 어떤 초안 판을 뜻하는지 확인하는 체크리스트로.

## 주의 (비용)

- **초안이다.** -17 판도 RFC 가 아니며 만료일이 있다. 절 번호·강도가 다음 판에서 바뀔 수 있다. "OAuth 2.1 준수" 를 계약·감사 문구로 쓰면 기준이 모호해진다.
- **2.1 이 9700 의 모든 것을 담지는 않는다.** 예를 들어 9700 의 공격자 모델(3절), 개별 공격 설명은 9700 쪽에 있다. 반대로 2.1 은 9700 이 다루지 않는 기본 프로토콜 정의(엔드포인트, 오류 코드, 확장 방법)를 포함한다.
- **비호환**: PKCE 를 쓰지 않거나 redirect URI 패턴 매칭에 기대거나 implicit·ROPC 를 쓰는 2.0 클라이언트는 2.1 규칙을 강제하는 AS 와 연동되지 않는다(10). 토큰 요청에 `redirect_uri` 를 요구하는 AS 와 2.1 만 따르는 클라이언트도 안 맞는다(10.2).
- **`plain` 제거 비용**: S256 을 못 쓰는 기존 클라이언트가 있으면, 7.5.2 는 지원 중단 전에 수명이 긴 리프레시 토큰을 발급해 두라고 권한다(SHOULD).
- 송신자 제약은 두 문서 모두 **SHOULD** 다. 필수로 만들려면 [FAPI 2.0](/develop-wiki/knowledge/security/fapi-2-security-profile/) 같은 프로파일이나 자체 정책이 필요하다.
- 문서 안 표기: 7.5.2 는 "OAuth 2.1 의 TLS 1.2+ 요구" 를 근거로 들지만, 1.5 는 TLS 버전 선택을 범위 밖이라 하고 BCP 195 를 참조한다. -17 판 기준의 관찰이다.

## 비교: 무엇을 읽어야 하나

| 상황 | 읽을 문서 |
| --- | --- |
| 기존 2.0 시스템의 보안 점검 | [RFC 9700](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/) |
| 새 구현의 기본 규칙 | OAuth 2.1 최신 초안 + RFC 9700 |
| 고보안 생태계 상호운용 | [FAPI 2.0 Security Profile](/develop-wiki/knowledge/security/fapi-2-security-profile/) |
| PKCE 자체 | [OAuth·OIDC·PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/), RFC 7636 |
| 토큰 도난 대비 | [DPoP](/develop-wiki/knowledge/security/dpop/), [mTLS 바운드 토큰](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/) |

## 검증 범위

`draft-ietf-oauth-v2-1-17` 원문(ietf.org archive)의 1.4.3, 1.5, 1.8, 2.3.1~2.3.4, 2.4, 2.4.1, 2.4.2, 4.1.1(앞부분), 4.1.2, 4.1.2.1, 4.1.3, 4.3.1(일부), 4.3.3, 5, 5.1, 5.1.1, 5.1.2, 7.5.1.1~7.5.4, 9.3~9.3.2, 10, 10.1, 10.2, 부록 F 의 -17 항목을 읽었다. 판 번호·날짜·상태는 datatracker API(2026-11-19 조회)로 확인했다. RFC 9700 은 2.1.1, 2.2.2, 2.5, 4.3.2 를 원문에서 다시 확인했고 나머지 강도는 [RFC 9700 노트](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/)에서 원문 대조한 값을 썼다. 2.1 초안의 7절 나머지(클릭재킹, 오픈 리다이렉트 상세), 8절(네이티브 앱) 전체, RFC 10017 본문은 읽지 않았다. -16 이전 판과의 차이는 -17 변경 기록만 봤다.
