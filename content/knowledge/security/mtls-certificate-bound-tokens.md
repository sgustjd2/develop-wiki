---
title: mTLS 클라이언트 인증과 인증서 바운드 토큰
aka: [OAuth 2.0 Mutual-TLS, RFC 8705, Certificate-Bound Access Token, tls_client_auth, self_signed_tls_client_auth, cnf x5t#S256, mTLS 토큰 바인딩]
category: security
level: advanced
summary: TLS 클라이언트 인증서로 OAuth 클라이언트를 인증하고, 액세스 토큰에 인증서 지문(cnf x5t#S256)을 박아 그 인증서의 개인키를 가진 쪽만 토큰을 쓰게 하는 방식(RFC 8705).
tags: [oauth2, mtls, rfc8705, sender-constrained, x509, token-theft, tls]
related: [security/dpop, security/oauth2-oidc-pkce, security/session-vs-jwt, security/token-revocation-introspection, security/secrets-management, security/jwt-key-rotation, security/access-control-design]
sources:
  - https://www.rfc-editor.org/rfc/rfc8705.html
updatedAt: 2026-11-19
---

## 문제

bearer 토큰은 가진 사람이 쓴다. 로그·프록시·침해된 리소스 서버로 토큰이 새면 그대로 악용된다. 또 기밀 클라이언트의 `client_secret` 은 공유 비밀이라 서버 쪽 DB 가 새도 같이 노출된다. 필요한 것은 두 가지다.

1. 클라이언트가 **개인키를 가졌음**을 비밀 전송 없이 증명하는 인증(클라이언트 인증).
2. 발급된 토큰이 그 키의 소유자에게만 쓸모 있게 하는 **송신자 제약**(sender-constrained).

## 해법: RFC 8705 의 두 부분

### 1) mTLS 클라이언트 인증 (RFC 8705 2절)

토큰 엔드포인트에서 TLS 핸드셰이크 때 클라이언트가 인증서를 제시한다. 요청에는 `client_id` 를 같이 보내고, 서버는 제시된 인증서가 그 클라이언트에 대해 기대한 것인지 본다. 안 맞으면 `invalid_client`. 방식은 둘이다.

| 방식 | 서버가 하는 검증 | 클라이언트 등록 |
| --- | --- | --- |
| `tls_client_auth` (PKI) | 신뢰하는 CA 체인을 검증하고, 인증서의 주체(DN 또는 SAN 값 하나)가 등록값과 일치 | `tls_client_auth_subject_dn`, `tls_client_auth_san_dns` 등 **정확히 하나** |
| `self_signed_tls_client_auth` | 체인 검증 없음. 인증서가 **등록된 인증서(`jwks` 또는 `jwks_uri` 의 `x5c`)와 일치** | 공개키/인증서 등록 |

PKI 방식은 같은 CA 에서 인증서를 갱신해도 서버 설정을 바꿀 필요가 없다. 대신 다른 신뢰 CA 가 같은 주체명으로 인증서를 발급하면 사칭이 가능하므로 신뢰 CA 범위를 좁히라고 RFC 는 경고한다(7.4절).

### 2) 인증서 바운드 액세스 토큰 (3절)

인가 서버는 토큰 요청 때 쓰인 클라이언트 인증서의 **SHA-256 지문**을 토큰에 묶는다.

- JWT 토큰이면 `cnf` 클레임 안에 `x5t#S256` 멤버로 넣는다. 값은 인증서 DER 인코딩의 SHA-256 을 base64url(패딩 없음)로 쓴 것이다.
- opaque 토큰이면 인트로스펙션 응답의 최상위에 같은 `cnf` 구조를 돌려준다 → [토큰 취소와 인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/).
- 리소스 서버는 **현재 TLS 연결의 클라이언트 인증서**를 구해 지문을 계산하고 토큰의 값과 비교한다. 다르면 HTTP 401 과 `invalid_token`.
- 서버 메타데이터의 `tls_client_certificate_bound_access_tokens`(기본 `false`)로 지원을 알리고, 클라이언트 등록 메타데이터의 같은 이름 파라미터로 바인딩을 요청한다.

공개 클라이언트도 자체 서명 인증서로 바운드 토큰을 받을 수 있다(4절). 이때는 클라이언트 인증은 없고 바인딩만 있다.

### 실행으로 확인

자체 서명 인증서 둘(A, B)을 만들고 Node `https` 서버로 확인했다. 토큰은 A 의 인증서에 묶여 있다.

```ts
import https from 'node:https';
import { readFileSync } from 'node:fs';
import { createHash, X509Certificate } from 'node:crypto';
const f = (n: string) => readFileSync(new URL(n, import.meta.url));
const x5t = (der: Buffer) => createHash('sha256').update(der).digest('base64url');   // RFC 8705 3.1

const tokens = new Map([['tok-for-A', { 'x5t#S256': x5t(new X509Certificate(f('a.crt')).raw) }]]);  // 토큰 → cnf

https.createServer(
  { key: f('srv.key'), cert: f('srv.crt'), requestCert: true, rejectUnauthorized: false }, // 체인 검증 없이 인증서만 받는다
  (req, res) => {
    const cnf = tokens.get((req.headers.authorization ?? '').replace(/^Bearer /, ''));
    const peer = (req.socket as any).getPeerCertificate();                  // TLS 계층이 이미 개인키 소유를 증명했다
    res.statusCode = cnf && peer?.raw && cnf['x5t#S256'] === x5t(peer.raw) ? 200 : 401;
    res.end();
  }).listen(8443);
```

결과: A 인증서 + A 토큰은 `200`, **B 인증서 + A 토큰은 `401`**, 인증서 없이 A 토큰만 보내면 `401`. 토큰이 새도 인증서 개인키 없이는 TLS 핸드셰이크에서 A 로 행세할 수 없기 때문이다. 리소스 서버가 체인 신뢰를 검증하지 않아도 되는 이유가 이것이다. RFC 도 리소스 서버에서는 키 소유 증명만 필요하다고 설명한다(6.2절).

## 언제 쓰나

- **서버 간(기밀 클라이언트) API**, 금융·결제처럼 토큰 유출 피해가 큰 곳. 이미 사설 PKI 나 서비스 메시의 mTLS 가 있으면 증분 비용이 작다.
- `client_secret` 이나 `private_key_jwt` 대신 전송 계층에서 클라이언트를 인증하고 싶을 때.
- 브라우저 SPA 처럼 클라이언트 인증서를 쓰기 어려운 곳이라면 [DPoP](/develop-wiki/knowledge/security/dpop/)가 대안이다.

## 주의 (비용)

- **TLS 종료 지점.** 로드 밸런서·API 게이트웨이가 TLS 를 끝내면 애플리케이션은 클라이언트 인증서를 못 본다. 인증서를 헤더로 넘겨야 하는데 그 방법은 RFC 범위 밖이라고 명시돼 있다(6.5절). 헤더를 외부 요청이 위조할 수 없게 프록시가 지우고 다시 쓰도록 구성해야 한다(일반 운영 원칙).
- **엔드포인트 분리.** 인증서를 요구하는 TLS 설정이 일반 클라이언트에 영향을 주지 않도록 별도 호스트/포트나 `mtls_endpoint_aliases` 를 쓸 수 있다(5절, 6.1절).
- **인증서 수명 관리.** 인증서를 교체하면 이전 인증서에 묶인 토큰은 무효가 된다. 클라이언트는 새 토큰(보통 리프레시 토큰)을 받아야 한다(6.3절). 자동 갱신과 만료 모니터링이 없으면 장애 원인이 된다.
- **브라우저와 모바일 사용성 부족.** 사용자 기기에 인증서를 배포·보관하는 부담이 크다. RFC 9449 는 이를 DPoP 필요성의 근거로 든다.
- **프라이버시.** TLS 1.3 이전에는 클라이언트 인증서가 평문으로 오가 추적에 쓰일 수 있다. 단일 사용자 클라이언트는 TLS 1.3 을 권장한다(8절).
- **직접 파싱하지 않는다.** X.509 파싱은 복잡하므로 검증된 라이브러리를 쓴다(7.5절).
- 토큰 바인딩은 **유출된 토큰**을 막지, 클라이언트 호스트 침해(개인키 탈취)를 막지 않는다. 키는 HSM/TPM 등에 두는 편이 낫다 → [비밀 관리](/develop-wiki/knowledge/security/secrets-management/).

## 비교

| | bearer | mTLS 바운드(RFC 8705) | DPoP(RFC 9449) |
| --- | --- | --- | --- |
| 증명 계층 | 없음 | TLS 핸드셰이크 | HTTP 요청마다 서명한 JWT |
| 토큰에 담는 것 | - | `cnf.x5t#S256` | `cnf.jkt` |
| 요청별 비용 | 없음 | 연결 단위(재사용 가능) | 요청마다 서명·검증, 리플레이 방어 |
| 적합 | 저위험 | 서버 간, 인프라에 PKI 가 있음 | 공개 클라이언트(SPA, 앱) |
