---
title: OAuth 서명된 요청 객체 JAR (RFC 9101)
aka: [JWT-Secured Authorization Request, JAR, RFC 9101, Request Object, request parameter, request_uri, require_signed_request_object, invalid_request_object]
category: security
level: advanced
summary: 인가 요청 파라미터를 서명(선택적으로 암호화)된 JWT 요청 객체로 묶어 request 또는 request_uri 로 전달해 변조를 막고 요청 출처를 인증하는 규격(RFC 9101).
tags: [oauth2, rfc9101, jar, jwt, request-object, authorization-request, integrity, request_uri]
related: [security/oauth-par-rfc9126, security/oauth2-oidc-pkce, security/jwt-algorithm-confusion, security/private-key-jwt-client-authentication, security/oauth-authorization-server-metadata-rfc8414, security/ssrf, security/jwt-key-rotation]
sources:
  - https://www.rfc-editor.org/rfc/rfc9101.html
  - https://www.rfc-editor.org/rfc/rfc9126.html
updatedAt: 2026-11-19
---

## 문제

인가 요청이 브라우저 쿼리로 가면 중간(사용자, 확장, 악성 스크립트)이 `scope`·`redirect_uri` 같은 값을 바꿀 수 있고, 인가 서버는 요청이 **정말 그 클라이언트가 만든 것인지** 알 수 없다. 파라미터가 URL 에 평문으로 남아 Referer·기록·로그로 새는 것도 문제다. [PAR](/develop-wiki/knowledge/security/oauth-par-rfc9126/)는 백채널로 해결하고, JAR 는 **요청 자체를 서명**해서 해결한다.

## 해법

모든 인가 파라미터를 JWT(요청 객체)의 클레임에 담고 클라이언트 키로 서명한다. 인가 요청에는 이 객체를 두 방식으로 싣는다.

- **`request`**: 객체를 값으로 전달. 자기 완결적이지만 URL 이 커질 수 있다.
- **`request_uri`**: 객체가 있는 곳의 URI. 서버가 GET 으로 가져온다. 짧지만 가져오는 위험이 생긴다. `request` 와 `request_uri` 를 **동시에 쓰면 잘못된 요청**이다.

요청 객체의 규칙(RFC 9101):

- 요청 파라미터 전부(확장 포함, 단 `request`·`request_uri` 제외)를 클레임으로 담는다. 요청 객체 안에 `request`/`request_uri` 를 **중첩하면 안 된다**.
- JWS 서명, 필요하면 서명 후 JWE 암호화(**서명 먼저, 암호화 나중**인 중첩 JWT). 공개키 암호화는 보낸 이를 인증하지 못하므로 출처 인증은 서명에 달렸다.
- 서명된 객체에는 `iss`, `aud` 를 두는 것이 권장된다(SHOULD). `aud` 는 인가 서버의 이슈어([RFC 8414](/develop-wiki/knowledge/security/oauth-authorization-server-metadata-rfc8414/)) 값이다.
- 쿼리의 `client_id` 는 여전히 필수이고 객체의 `client_id` 와 **같아야 한다**.
- **우선순위**: 서버는 **요청 객체 안의 파라미터만** 쓰고, 쿼리의 같은 이름 파라미터는 무시한다(하위 호환용으로 보낼 수는 있다).
- 미디어 타입은 `application/oauth-authz-req+jwt`(일부 구버전은 `application/jwt`).
- 서버 검증: 복호화 실패·서명 실패·서명 키가 클라이언트에 속하지 않음 → `invalid_request_object`. 알고리즘 검증은 RFC 8725 의 3.1·3.2 를 따른다 → [JWT 알고리즘 혼동](/develop-wiki/knowledge/security/jwt-algorithm-confusion/).
- 오류 코드: `invalid_request_object`, `invalid_request_uri`, `request_not_supported`, `request_uri_not_supported`.
- 메타데이터 **`require_signed_request_object`**(클라이언트·서버 양쪽, 기본 `false`): 참이면 서명되지 않은 요청과 `alg: none` 을 거부한다. 이게 없으면 공격자가 JAR 를 쓰지 않는 일반 요청으로 **다운그레이드**할 수 있다.
- 지원 알고리즘 협상 메타데이터: 클라이언트 `request_object_signing_alg`, `request_object_encryption_alg`, `request_object_encryption_enc`, 서버 쪽 `*_values_supported`.

```ts
// 서버 쪽 스케치: 서명된 요청 객체에서 파라미터를 꺼낸다
function readJar(jwt: string, o: { issuer: string; clientId: string; query: Record<string, string> }) {
  const claims = verifyEs256(jwt, publicKeyOf(o.clientId));          // alg 는 서버가 고정, none 거부
  if (claims.client_id !== o.clientId || o.query.client_id !== o.clientId) throw new Error('client_id mismatch');
  if (claims.aud !== o.issuer) throw new Error('aud');
  if ('request' in claims || 'request_uri' in claims) throw new Error('nested');
  return claims;                                                     // 쿼리의 나머지 파라미터는 사용하지 않는다
}
```

(Node 의 `crypto` 로 ES256 서명을 직접 만들어 실행해 확인했다. 정상 경로에서 쿼리의 `scope=admin` 이 무시되고 객체의 `scope=read` 가 쓰이는 것, `alg: none`·잘못된 `aud`·본문 변조가 거부되는 것을 확인했다. `verifyEs256`·`publicKeyOf` 는 구현 생략이다.)

### request_uri 로 전달할 때

- **서버가 URL 을 가져온다.** 공격자가 `request_uri` 를 거대하거나 아주 느린 응답, 재귀 조회로 향하게 하는 DoS 가 가능하다. RFC 는 대상 위치 확인, 올바른 미디어 타입 요구, 가져오기 타임아웃, **재귀 GET 금지**를 완화책으로 든다. RFC 는 "SSRF" 라는 말을 쓰지 않고 예상 밖 위치를 가리키지 않는지 확인하라고 한다 → [SSRF 방어](/develop-wiki/knowledge/security/ssrf/)를 적용한다.
- TLS 필수, 인증서는 DNS-ID 로 검증한다. `request_uri` 값 자체는 서명되지 않아 브라우저 수준 공격자가 바꿀 수 있다(그래서 위 완화책).
- URI 는 전체 512 ASCII 자 이하로 유지하라는 권고가 있다.
- 서버가 발급하는 `request_uri`(PAR 의 방식)는 충분한 엔트로피(128 비트 이상이 일반 지침)와 짧은 수명(RFC 는 짧게를 요구하고 지침은 1 분 미만, PAR 예시는 5~600 초), 가능하면 1 회용을 요구·권고한다. 사용자별로 고정된 URI 는 브라우저 기록을 통한 추적이 될 수 있다.

## 언제 쓰나

- 요청 변조 방지와 **요청 출처의 비부인**이 필요할 때(서명이 남는다).
- 민감한 확장 파라미터(리치 인가 요청 내용)를 URL 에 평문으로 노출하기 싫을 때(암호화 병용).
- 클라이언트가 이미 비대칭키를 운영하고 있을 때([private_key_jwt](/develop-wiki/knowledge/security/private-key-jwt-client-authentication/)와 같은 키 관리).
- PAR 와 결합해 "서명된 객체를 백채널로 푸시"하는 구성.

## 주의 (비용)

- **키 관리가 모든 클라이언트의 일이 된다.** 서명키 등록·회전([키 교체](/develop-wiki/knowledge/security/jwt-key-rotation/))·만료 처리가 필요하다.
- `request` 값 전달은 공개키 서명 때문에 **URL 이 커진다**. 길이 제한에 걸리면 `request_uri`/PAR 로 간다.
- `require_signed_request_object` 를 켜지 않으면 **일반 요청으로 우회**된다. 켜면 모든 클라이언트가 서명해야 하므로 마이그레이션이 필요하다.
- **`request_uri` 가져오기는 공격 표면**이다. 서버가 임의 URL 을 가져가는 구조이므로 허용 호스트(클라이언트 등록 값), 크기·시간 제한, 리다이렉트 차단이 필요하다(마지막 두 항목은 이 노트의 의견).
- 요청 객체 재사용(replay): RFC 는 서버가 발급하는 일회용 URI 를 권고한다. 클라이언트 호스팅 URI 는 그 보장이 약하다.
- 서명만으로는 **기밀성이 없다**. 내용이 민감하면 암호화한다(서명→암호화 순).
- 서명 알고리즘은 서버가 허용 목록으로 **고정**한다. 헤더의 `alg` 를 그대로 믿으면 혼동 공격이 된다.

## 비교: PAR vs JAR

| 질문 | PAR | JAR |
| --- | --- | --- |
| 무결성을 무엇으로 보장하나 | 백채널 + 클라이언트 인증 | 요청 객체 서명 |
| 클라이언트가 할 일 | 인증 수단 + 추가 POST | 서명키 관리 + JWT 생성 |
| 서버가 할 일 | `request_uri` 저장 | (참조 시) URL 가져오기, 서명 검증 |
| 기밀성 | TLS 백채널 | JWE 선택 |
| 서명의 감사 가치 | 없음 | 있음(비부인) |
| 둘을 합치면 | 서명된 객체를 `request` 로 푸시 가능(RFC 9126) | 같음 |

## 검증 범위

RFC 9101 전문 요약(`request`/`request_uri`, 요청 객체 요구, 검증·우선순위, 오류 코드, 메타데이터, 암호화, `request_uri` 보안 고려, 값 vs 참조 비교)과 RFC 9126 의 `request` 푸시 절을 읽었다. 위 검증 로직은 직접 서명한 ES256 요청 객체로 실행해 확인했다. 암호화(JWE) 경로와 `request_uri` 가져오기 구현은 실행하지 않았다. RFC 8725 본문은 읽지 않았다.
