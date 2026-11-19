---
title: FAPI 2.0 Message Signing 과 HTTP Message Signatures (RFC 9421)
aka: [FAPI 2.0 Message Signing, FAPI2MS, fapi-message-signing-2_0, FAPI 2.0 HTTP Signatures, HTTP Message Signatures, RFC 9421, Signature-Input, Content-Digest, RFC 9530, non-repudiation, 부인 방지]
category: security
level: advanced
summary: FAPI 2.0 Security Profile 위에 부인 방지를 더하는 서명 프로파일(Final, 2025-09). 인가 요청·응답·인트로스펙션 응답은 JWT 로 서명하고, API 요청·응답 서명(RFC 9421)은 별도 초안으로 분리됐다.
tags: [fapi, openid, non-repudiation, message-signing, rfc9421, rfc9530, http-signatures, jar, jarm, rfc9701, introspection]
related: [security/fapi-2-security-profile, security/oauth-jar-rfc9101, security/oauth-jarm-fapi-migration, security/oauth-par-rfc9126, security/token-revocation-introspection, security/dpop, security/jwt-algorithm-confusion, security/jwt-key-rotation, security/kms-hsm-signing-keys, security/oauth-issuer-mix-up-defense-rfc9207]
sources:
  - https://openid.net/specs/fapi-message-signing-2_0-final.html
  - https://openid.net/specs/fapi-message-signing-2_0-02.md
  - https://openid.net/specs/fapi-2_0-message-signing-ID1.html
  - https://openid.bitbucket.io/fapi/fapi-2_0-http-signatures.html
  - https://openid.net/wg/fapi/specifications/
  - https://www.rfc-editor.org/rfc/rfc9421.html
updatedAt: 2026-11-19
---

## 문제

[FAPI 2.0 Security Profile](/develop-wiki/knowledge/security/fapi-2-security-profile/)은 공격자가 남의 리소스에 접근하지 못하게 하는 것이 목표다. 그런데 금융 거래에는 다른 요구도 있다. 나중에 한 쪽이 "그 결제 요청을 보낸 적 없다", "그 응답을 준 적 없다"고 **부인**하면 TLS 로그로는 증명하기 어렵다. TLS 는 연결 구간만 보호하고, 끝난 뒤 제3자에게 보여 줄 수 있는 증거를 남기지 않는다.

FAPI 2.0 Message Signing 은 여기서 **부인 방지(non-repudiation)** 를 목표로 더한다. 서명 키 쌍의 소유자가 그 데이터에 서명했음을 설득력 있게 부인하지 못하게 하는 것이고(NIST SP 800-133 정의 인용, 5.2), 보통 메시지와 함께 저장할 수 있는 **애플리케이션 계층 서명**으로 달성한다.

## 문서 상태 (2026-11-19 확인)

| 문서 | 상태 | 비고 |
| --- | --- | --- |
| FAPI 2.0 Message Signing | **Final, 2025-09-25** | `fapi-message-signing-2_0-final`. Security Profile 의 모든 조항이 그대로 적용되고 그 위에 확장 |
| FAPI 2.0 HTTP Signatures | **Draft**(작업본, 2026-06-26 게시, 판 번호 표기 없음) | API 요청·응답 서명. Message Signing 에서 분리 |
| RFC 9421 HTTP Message Signatures | Proposed Standard, 2024-02 | IETF HTTP WG. HTTP Signatures 초안이 이것을 프로파일링 |

경과: Implementer's Draft 1(2023-03)은 5.1 에 RFC 9421(당시 초안)과 Digest Fields 를 "리소스 서버 요청·응답 서명" 수단으로 넣었지만 5.6 은 "다음 판에서 지원 예정" 한 줄뿐이었다. -02 문서의 이력(-01 변경 목록)에는 "initial work on creating separate http signing spec" 항목이 있고, Final 의 5.1 에서는 HTTP 서명이 빠졌다. **Final 만 구현하면 API 호출 자체는 서명되지 않는다.**

## 해법 1: Message Signing (Final)

키워드는 ISO 의 shall/should/may 다. 생태계가 일부만 고를 수 있게 세 영역을 따로 적합성 시험한다고 명시한다(5.1).

| 대상(NR 번호) | 수단 | 핵심 요구 | 절 |
| --- | --- | --- | --- |
| NR1 PAR 요청 | [JAR](/develop-wiki/knowledge/security/oauth-jar-rfc9101/) 요청 객체를 **PAR 엔드포인트에** | AS: 서명 요청 객체 지원·요구·검증 shall. `aud` 는 AS issuer 이거나 그것을 포함한 배열 shall. `nbf` 는 60분 이내 과거, `exp` 는 `nbf` 후 60분 이내 shall. `typ=oauth-authz-req+jwt` 수락 shall | 5.3.1 |
| | | 클라이언트: 모든 인가 파라미터를 서명 요청 객체로 PAR 에 전송 shall, `aud` 는 issuer, `nbf` 포함, `exp` 수명 60분 이내 shall, `typ` 는 should | 5.3.2 |
| NR2 프런트 채널 인가 요청 | PAR 덕분에 NR1 을 서명하면 함께 충족 | (요구 없음) | 5.3 |
| NR3 인가 응답 | [JARM](/develop-wiki/knowledge/security/oauth-jarm-fapi-migration/) | AS: JARM 지원·요구·발급 shall. 클라이언트: `response_mode=jwt` 설정, JARM 규칙으로 검증 shall | 5.4 |
| NR4 인트로스펙션 응답 | RFC 7662 + RFC 9701(JWT 응답) | AS: JWT 형식 응답 서명 shall. 클라이언트: 서명 응답 요청·검증 shall | 5.5 |
| NR5 ID 토큰 | 기존 서명 ID 토큰 | AS 추가 요구 없음. 클라이언트: 서명 검증 shall | 5.6 |

- 클라이언트 메타데이터 `response_modes`(OPTIONAL, 쓸 수 있는 응답 모드 배열)를 새로 정의한다(5.3.3).
- JARM 을 쓸 때 RFC 9207 의 `iss` 는 JWT **안에만** 넣으라고 한다(5.4.1 NOTE, should).
- 인가 응답 암호화는 요구하지 않고, 상호운용을 위해 권하지도 않는다. 응답에 비밀이 없고 코드 유출은 PKCE 가 막는다(6.1).

## 해법 2: HTTP Signatures 초안과 RFC 9421

### RFC 9421 이 하는 일

HTTP 메시지에서 **고른 구성요소**(메서드, 대상 URI, 특정 헤더, 상태 코드 등)를 정해진 규칙으로 직렬화한 "서명 기반(signature base)" 을 만들고 그것에 서명한다. 결과는 두 헤더로 실린다.

- `Signature-Input`: 라벨별로 덮은 구성요소 목록과 파라미터(`created`, `expires`, `nonce`, `alg`, `keyid`, `tag`). `created` 는 RECOMMENDED(2.3).
- `Signature`: 같은 라벨의 서명 바이트.

| 개념 | 요점 | 절 |
| --- | --- | --- |
| 파생 구성요소 | `@method`, `@target-uri`, `@authority`, `@path`, `@query`, `@status` 등 | 2.2 |
| `@signature-params` | 서명 기반의 **마지막 줄**에 REQUIRED, 덮는 목록에 넣으면 안 됨(MUST NOT) | 2.3 |
| `req` 플래그 | 응답 서명에 **원 요청의 구성요소**를 넣어 요청-응답을 결속 | 2.4 |
| 본문 | RFC 9421 자체는 본문을 덮지 않는다. `Content-Digest`(RFC 9530)를 만들어 그 헤더를 덮는다 | 7.2.8 |
| 알고리즘 | `rsa-pss-sha512`, `rsa-v1_5-sha256`, `hmac-sha256`, `ecdsa-p256-sha256`, `ecdsa-p384-sha384`, `ed25519` 등록. JWS 알고리즘도 가능하나 `none` 금지 | 3.3, 6.2.2 |
| 적용 프로파일의 의무 | 필수 구성요소, 키 조회 방법, 허용 알고리즘, 오류 코드 등을 **적용하는 쪽이 정해야** 한다(MUST) | 1.4 |

아래는 서명 기반을 만들고 Ed25519 로 서명하는 최소 구현이다. 직접 작성했고, RFC 9421 부록 B.2.6 시험 벡터(같은 키·구성요소·`created`)로 실행해 **서명 값이 RFC 의 값과 바이트 단위로 일치**하는 것을 확인했다. 구성요소 값의 정규화(헤더 공백 정리, 여러 값 결합 등, 2.1)는 생략했다.

```ts
import { sign, KeyObject } from 'node:crypto';
type Comp = [name: string, value: string];          // 이미 정규화된 값

export function signEd25519(label: string, comps: Comp[], params: string, key: KeyObject) {
  const sigParams = `(${comps.map(([n]) => `"${n}"`).join(' ')})${params}`;
  const lines = comps.map(([n, v]) => `"${n}": ${v}`);
  lines.push(`"@signature-params": ${sigParams}`);  // 항상 마지막 줄
  const sig = sign(null, Buffer.from(lines.join('\n'), 'ascii'), key).toString('base64');
  return { 'Signature-Input': `${label}=${sigParams}`, Signature: `${label}=:${sig}:` };
}
// 예: signEd25519('sig1', [['@method','POST'], ['@target-uri', url], ['authorization', auth],
//       ['content-digest', digest]], `;created=${now};keyid="k1";tag="fapi-2-request"`, privateKey)
```

### FAPI 2.0 HTTP Signatures 초안의 프로파일 (Draft)

대상은 NR5 리소스 요청, NR6 리소스 응답이다(초안 5.2. Message Signing Final 의 NR5 는 ID 토큰이라 번호가 겹친다).

| 역할 | 요구(shall) | 절 |
| --- | --- | --- |
| 클라이언트(요청 서명) | `@method`, `@target-uri`, `created`, `tag=fapi-2-request`, `Authorization` 헤더 포함. DPoP 사용 시 `DPoP` 헤더 포함. 본문이 있으면 `content-digest` 를 만들고 포함(인코딩 무관 방식, 예 sha-256 은 should) | 5.3.1.1 |
| 리소스 서버(요청 검증) | 서명 없음·무효는 **401**. `tag`, 필수 구성요소, `created` 누락 거부. `created` 허용 범위는 1분 권장 | 5.3.1.2 |
| 리소스 서버(응답 서명) | `req` 로 요청 메서드·대상 URI·(있으면) 요청 `content-digest` 결속, 요청이 서명됐으면 요청 서명과 서명 입력도 결속. `@status`, `created`, `tag=fapi-2-response`, 본문 있으면 `content-digest` | 5.3.2.1 |
| 클라이언트(응답 검증) | `@status`, `created`, `tag`, (본문 시) `content-digest` 포함 여부 확인 | 5.3.2.2 |

키 배포는 정하지 않는다. RS 는 mTLS 인증서·JWT 액세스 토큰·인트로스펙션 응답에서 클라이언트를 식별하고 `keyid` 로 키를 찾으라는 NOTE 만 있다.

## 언제 쓰나

- 규제나 분쟁 대응 때문에 **누가 무엇을 요청·응답했는지를 사후에 제3자에게 증명**해야 하는 생태계(결제 지시, 동의 기록).
- 인트로스펙션 응답을 감사 기록으로 남겨야 할 때(NR4 만 골라 적용 가능).
- API 요청 서명이 필요하면 HTTP Signatures 초안과 RFC 9421 을 검토하되, Draft 이므로 생태계 규격이 고정한 버전을 따른다.

## 주의 (비용)

- **부인 방지는 개별 메시지 단위**다. 메시지 순서나 흐름 전체에 대한 보장은 없다(6.3). 프런트 채널 인가 요청 자체도 부인 방지 대상이 아니다(6.4).
- **JARM 서명의 증거 가치는 제한적**이다. 서명되는 것은 `code`·`state` 같은 흐름 산출물이지 계좌번호·금액이 아니다. 무결성 이득은 있다(6.6).
- **실제 신원 연결은 범위 밖**이다. 서명 키와 실제 사용자·기관을 잇는 것은 별도 문제다(6.5).
- **저장 비용과 개인정보**: 증거로 쓰려면 메시지를 보관해야 하고, 거기에 PII 가 있을 수 있다. 보관한다면 접근 통제는 필수(must), 최소 수집과 변조 불가 감사 로그는 권고(should)다(7절).
- **인트로스펙션 혼동**: RS 가 아닌 클라이언트가 인트로스펙션을 호출해 남의 토큰 정보를 얻지 못하도록 AS 가 호출자를 구분해야 한다(6.2) → [인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/).
- **RFC 9421 은 도구일 뿐**이다. 덮는 범위가 좁으면 다른 메시지에 같은 서명이 통하고(7.2.2 재전송), `Content-Digest` 를 서명만 확인하고 실제 본문과 대조하지 않으면 본문 바꿔치기가 된다(7.2.8). `alg` 를 메시지에서 받아 쓰면 RSA 공개키를 HMAC 키로 쓰는 다운그레이드가 가능하므로 키·알고리즘을 설정으로 고정하라고 권한다(7.3.6) → [JWT 알고리즘 혼동](/develop-wiki/knowledge/security/jwt-algorithm-confusion/).
- **프록시·게이트웨이**: `@target-uri` 는 원래 요청 URI 가 필요하다. TLS 종료 프록시 뒤의 RS 는 원래 값을 알아야 검증할 수 있다(1.4). 중간에서 콘텐츠 인코딩을 바꾸면 `Content-Digest` 가 달라져 서명이 깨진다(7.2.8).
- **표기 흔들림**: Final 5.4.1 NOTE 는 "JARM Section 4.1" 을 인용하지만 JARM 최종본에서 응답 파라미터를 JWT 에 넣으라는 규정은 2.1 이다. HTTP Signatures 초안은 아직 Security Profile ID2(2022)를 참조하고 본문에 미완성 표시가 남아 있다. Security Profile Final 6.2 도 DPoP 재전송 완화책으로 "signed resource requests as per FAPI Message Signing" 을 들지만, Message Signing Final 에는 그 기능이 없다.

## 비교

| 항목 | 송신자 제약(DPoP·mTLS) | Message Signing (Final) | HTTP Signatures (Draft, RFC 9421) |
| --- | --- | --- | --- |
| 목표 | 탈취 토큰 사용 차단 | 인가 흐름 메시지의 부인 방지 | API 요청·응답의 부인 방지 |
| 서명 대상 | 토큰 사용 증명(일부 요청 요소) | 요청 객체, 인가 응답, 인트로스펙션 응답, ID 토큰 | HTTP 메시지 구성요소 + 본문 다이제스트 |
| 형식 | DPoP JWT 또는 TLS | JWT(JWS) | `Signature-Input`/`Signature` 헤더 |
| 응답 서명 | 없음 | 인가·인트로스펙션 응답 | API 응답(`req` 로 요청 결속) |

DPoP 증명은 HTTP 메서드·URI·토큰 해시만 덮어 본문 변조를 막지 못한다(FAPI 2.0 Security Profile 6.2 의 남는 위험). 본문까지 덮으려면 HTTP 서명이 필요하다 → [DPoP](/develop-wiki/knowledge/security/dpop/).

## 검증 범위

FAPI 2.0 Message Signing Final(2025-09-25) 전문을 openid.net 원문에서 읽었다. Implementer's Draft 1(2023-03-24)의 5.1·5.6, -02 판의 문서 이력을 읽어 HTTP 서명 분리 경위를 확인했다. FAPI 2.0 HTTP Signatures 는 openid.bitbucket.io 작업본(2026-06-26)의 1~7절을 읽었고, 상태(Draft)는 FAPI WG 명세 목록 페이지로 확인했다. RFC 9421 은 1.4, 2.3, 2.4, 2.5 앞부분, 3.3, 3.3.7, 4.1, 6.2.2, 7.2.2, 7.2.8, 7.3.6 과 부록 B.2.6 을 읽었다. RFC 9530, RFC 9701 본문은 읽지 않았다. 형식 분석 논문(FAPI2MSANALYSIS)과 OpenID 적합성 시험 항목은 확인하지 않았다. 코드는 Node 24.21 에서 RFC 9421 B.2.6 시험 벡터로 실행해 일치를 확인했다.
