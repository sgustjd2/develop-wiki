---
title: TLS 와 HTTPS
aka: [TLS 1.3, HTTPS, TLS Handshake, Certificate, SNI, 0-RTT, mTLS, Forward Secrecy]
category: cs-fundamentals
group: network
level: intermediate
summary: TLS 는 전송 중인 데이터의 기밀성·무결성과 서버(선택적으로 클라이언트) 인증을 제공하는 프로토콜이고, HTTPS 는 HTTP 를 TLS 위에 얹은 것. 인증서 운영과 연결 지연에 직결된다.
tags: [network, tls, https, security, certificate, pki]
related: [cs-fundamentals/tcp-vs-udp, cs-fundamentals/http-versions, cs-fundamentals/load-balancer-l4-l7, security/owasp-top-10]
sources:
  - https://www.rfc-editor.org/rfc/rfc8446.html
  - https://www.rfc-editor.org/rfc/rfc9000.html
updatedAt: 2026-11-18
---

## TLS 가 주는 세 가지

| 성질 | 막는 공격 | 수단 |
| --- | --- | --- |
| 기밀성 | 도청 | 핸드셰이크로 합의한 대칭 키로 암호화(AEAD) |
| 무결성 | 변조 | AEAD 인증 태그 |
| 인증 | 사칭(중간자) | 서버 인증서 체인 + 서명 검증 |

## TLS 1.3 핸드셰이크 (RFC 8446)

```
클라이언트                                          서버
ClientHello (+key_share, 지원 암호, SNI) ─────────▶
           ◀───────── ServerHello (+key_share)
                      {EncryptedExtensions}        ← 여기부터 암호화
                      {Certificate}
                      {CertificateVerify}          ← 서버 개인키로 서명
                      {Finished}
{Finished} ───────────────────────────────────────▶
[애플리케이션 데이터]  ◀──────────────────────────▶   = 1-RTT
```

- 키 교환은 (EC)DHE, PSK, PSK+(EC)DHE 세 가지 모드. 클라이언트가 보낸 key_share 를 서버가 받을 수 없으면 HelloRetryRequest 로 한 번 더 왕복한다.
- TLS 1.2 대비 정적 RSA·정적 DH 키 교환을 없애 모든 연결이 **전방 비밀성**(서버 개인키가 나중에 유출돼도 과거 트래픽을 못 푼다)을 갖는다. 압축과 재협상도 없앴다.
- **0-RTT**: 이전에 받은 PSK 로 첫 비행에 데이터를 실어 보낸다. 단, 이 데이터는 전방 비밀성이 없고 **연결 간 재전송(replay) 방지가 보장되지 않는다**. 그래서 멱등한 요청(GET)에만 허용하는 것이 보통이다.
- QUIC(RFC 9000)은 TLS 1.3 핸드셰이크를 전송 계층에 통합해 TCP 핸드셰이크 1 RTT 를 아낀다.

## 인증서 검증에서 실제로 보는 것

1. 체인이 신뢰하는 루트 CA 까지 이어지는가 (중간 인증서를 서버가 함께 보내야 함)
2. 요청한 호스트명이 인증서의 SAN 에 있는가 (CN 은 더 이상 보지 않는 클라이언트가 많음)
3. 유효 기간 안인가, 폐기되지 않았는가
4. 서버가 그 인증서의 개인키를 가졌는가 (CertificateVerify 서명)

**SNI**: 한 IP 에 여러 도메인을 둘 수 있게 ClientHello 에 호스트명을 담는다. 이 값은 암호화되지 않아 경로에서 보인다(ECH 가 이를 가리려는 확장).

## 개발자에게 왜 중요한가

- **인증서 만료는 가장 흔한 장애 중 하나**다. ACME(Let's Encrypt 등) 자동 갱신 + 만료 모니터링을 둔다.
- **검증을 끄지 않는다**: `rejectUnauthorized: false`, `curl -k`, `InsecureSkipVerify: true` 가 운영 코드에 남으면 TLS 를 쓰는 의미가 없다. 사설 CA 는 CA 번들을 지정한다.
- **어디서 TLS 를 끝내나**: 로드 밸런서에서 종료하면 그 뒤 구간은 평문일 수 있다. 내부망도 암호화가 필요하면 재암호화나 메시 mTLS 를 쓴다. [L4/L7 로드 밸런서](/develop-wiki/knowledge/cs-fundamentals/load-balancer-l4-l7/) 참고.
- **mTLS**: 서버가 CertificateRequest 를 보내 클라이언트 인증서까지 검증한다. 서비스 간 인증에 쓴다.

```ts
// Node.js: 사설 CA 를 신뢰 (검증은 끄지 않는다)
import { readFileSync } from 'node:fs';
import { Agent } from 'node:https';
const agent = new Agent({ ca: readFileSync('/etc/ssl/internal-ca.pem') });
```

```shell
# 서버가 보내는 체인·만료일·협상 버전 확인
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

## HTTPS 를 제대로 쓰려면

- HTTP → HTTPS 리다이렉트 + `Strict-Transport-Security`(HSTS)로 다운그레이드를 막는다.
- 쿠키에 `Secure` 를 붙인다. [쿠키와 스토리지](/develop-wiki/knowledge/cs-fundamentals/cookies-and-web-storage/) 참고.
- 혼합 콘텐츠(HTTPS 페이지의 HTTP 리소스)는 브라우저가 막거나 경고한다.

## 주의 (비용)

- 핸드셰이크는 RTT 와 CPU(비대칭 연산)를 쓴다. 연결 재사용·세션 재개로 줄인다. 요즘 CPU 에서 대칭 암호화 자체 비용은 대개 병목이 아니다.
- 0-RTT 를 켜면 서버는 재전송 공격을 고려해야 한다. 상태를 바꾸는 요청에는 쓰지 않는다.
- TLS 는 전송 구간만 보호한다. 저장 데이터 암호화, 앱 수준 인가와는 별개 문제다.
