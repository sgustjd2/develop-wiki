---
title: OAuth 인가 서버 메타데이터 (RFC 8414)
aka: [OAuth 2.0 Authorization Server Metadata, RFC 8414, .well-known/oauth-authorization-server, OIDC Discovery, issuer, 서버 메타데이터, 디스커버리]
category: security
level: intermediate
summary: 인가 서버가 엔드포인트·지원 기능·서명 키 위치를 .well-known JSON 으로 공개하는 규격(RFC 8414). 이슈어 URL 에서 문서 위치를 계산하고, 문서 안의 issuer 가 그 URL 과 정확히 같을 때만 신뢰한다.
tags: [oauth2, rfc8414, discovery, metadata, issuer, well-known, oidc, jwks]
related: [security/oauth-issuer-mix-up-defense-rfc9207, security/oauth2-oidc-pkce, security/private-key-jwt-client-authentication, security/jwt-key-rotation, security/jwt-access-token-profile-rfc9068, security/ssrf, security/token-revocation-introspection]
sources:
  - https://www.rfc-editor.org/rfc/rfc8414.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
updatedAt: 2026-11-19
---

## 문제

클라이언트가 인가 서버에 붙으려면 인가·토큰 엔드포인트, JWKS 위치, 지원하는 클라이언트 인증 방식과 PKCE 방식을 알아야 한다. 이를 설정 파일에 손으로 복사하면 서버를 바꾸거나 키·엔드포인트가 이동할 때 클라이언트가 같이 깨진다. 서버가 여럿이면 설정이 늘어난다.

## 해법: 이슈어에서 계산하는 well-known 문서

1. 서버는 **issuer 식별자**를 가진다. `https` URL 이고 query·fragment 가 없다.
2. 메타데이터 JSON 은 `/.well-known/oauth-authorization-server` 경로에 둔다. issuer 에 path 가 있으면 well-known 문자열을 **host 와 path 사이에 끼운다**(끝의 `/` 는 먼저 제거).
3. 클라이언트는 GET 으로 가져온 뒤 문서의 `issuer` 가 **요청에 쓴 이슈어와 동일**한지 확인한다. 다르면 그 문서를 쓰면 안 된다.

```ts
function metadataUrl(issuer: string, suffix = 'oauth-authorization-server'): string {
  const u = new URL(issuer);
  if (u.protocol !== 'https:' || u.search || u.hash) throw new Error('issuer 형식 위반');
  return `${u.origin}/.well-known/${suffix}${u.pathname.replace(/\/$/, '')}`;
}
metadataUrl('https://example.com');          // https://example.com/.well-known/oauth-authorization-server
metadataUrl('https://example.com/issuer1/'); // https://example.com/.well-known/oauth-authorization-server/issuer1
const checkMetadata = (issuer: string, md: { issuer: string }) => {
  if (md.issuer !== issuer) throw new Error('metadata issuer mismatch');
};
```

(두 변환과 불일치 거부를 실행해 확인했다.)

### 주요 필드 (RFC 8414 2절)

| 필드 | 필수 여부(RFC) | 용도 |
| --- | --- | --- |
| `issuer` | 필수 | 이슈어 식별자. mix-up 방어의 기준값 |
| `authorization_endpoint`, `token_endpoint` | 해당 grant 가 있으면 필수 | 흐름 진입점 |
| `response_types_supported` | 필수 | 지원 response_type |
| `jwks_uri` | 선택 | 서명 키 집합(https). 서명·암호화 키가 섞이면 `use` 필수 |
| `token_endpoint_auth_methods_supported` | 선택, 생략 시 `client_secret_basic` | [private_key_jwt](/develop-wiki/knowledge/security/private-key-jwt-client-authentication/) 등. JWT 방식이면 서명 알고리즘 목록 필수, `none` 금지 |
| `code_challenge_methods_supported` | 선택, 생략하면 PKCE 미지원 | `S256` 등 |
| `grant_types_supported` | 선택, 생략 시 `authorization_code`·`implicit` | 지원 grant |
| `revocation_endpoint`, `introspection_endpoint` | 선택 | [폐기·인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/) |
| `signed_metadata` | 선택 | 메타데이터를 JWT 로 서명. 지원하는 소비자에게는 JSON 값보다 우선 |

값이 빈 배열인 클레임은 응답에서 **생략**해야 한다. RFC 9207 은 `authorization_response_iss_parameter_supported` 를 여기에 추가했다.

### OIDC Discovery 와의 차이

`/.well-known/openid-configuration` 이 이름은 OIDC 지만 이 규격에서도 쓸 수 있다. 다만 **issuer 에 path 가 있으면** OIDC Discovery 는 well-known 을 issuer 뒤에 붙이고, RFC 8414 는 host 와 path 사이에 끼운다. 레거시 환경에서는 전환기에 두 위치에 모두 게시하고, 클라이언트는 RFC 8414 위치를 먼저 시도해 실패하면 OIDC 위치로 돌아가라고 RFC 가 안내한다.

## 언제 쓰나

- 여러 인가 서버(멀티 IdP, 테넌트별 이슈어)를 지원하는 클라이언트·리소스 서버.
- 서버 설정 변경(키 교체, 엔드포인트 이동)을 클라이언트 재배포 없이 반영하고 싶을 때. 키 교체와 함께 [JWKS 운영](/develop-wiki/knowledge/security/jwt-key-rotation/)을 본다.
- 클라이언트가 지원 기능(PKCE, 인증 방식)을 확인해 협상해야 할 때.

## 주의 (비용)

- **issuer 정확 일치가 방어선이다.** 공격자가 자기 서버에서 남의 `issuer` 값을 담은 문서를 내려주면 자기 엔드포인트·키를 신뢰하게 만들 수 있다. RFC 는 요청에 쓴 이슈어와 문서의 `issuer` 가 정확히 같아야 한다고 요구한다.
- 가져올 때 TLS 인증서가 해당 이슈어 URL 에 유효한지 반드시 검증한다(MITM·DNS 공격 방지). RFC 는 TLS 1.2 를 서버 필수로 둔다.
- **이슈어가 사용자 입력이면 서버가 임의 URL 을 가져가는 셈이다.** 사내망 주소를 가리키게 하는 SSRF 가 가능하므로 [SSRF 방어](/develop-wiki/knowledge/security/ssrf/)(허용 목록, 사설 IP 차단, 리다이렉트·크기·시간 제한)를 같이 적용한다. 이 부분은 RFC 가 아니라 이 노트의 의견이다.
- 메타데이터는 **캐시**하되 TTL 정책은 RFC 가 정하지 않는다. 키가 바뀌는데 문서를 오래 캐시하면 서명 검증이 실패한다. 반대로 요청마다 가져오면 인가 서버가 병목이 된다.
- 표준 형식으로 공개하면 공격자도 쉽게 읽는다(RFC 6.3). 공개 정보에 비밀이 없어야 한다.
- 메타데이터가 있어도 **어떤 리소스 서버가 이 인가 서버와 쓰이는지**는 범위 밖이다(RFC 6.4). 이를 위한 별도 규격이 있으나 이 노트에서는 읽지 않았다.

## 검증 범위

RFC 8414 전문(2·3·5·6절)과 RFC 9700 의 mix-up 절을 읽었다. 특정 IdP 가 발행하는 실제 문서나 `signed_metadata` 검증 구현은 실행하지 않았다.
