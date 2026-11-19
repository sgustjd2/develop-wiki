---
title: OAuth 보호 리소스 메타데이터 (RFC 9728)
aka: [OAuth 2.0 Protected Resource Metadata, RFC 9728, .well-known/oauth-protected-resource, resource_metadata, WWW-Authenticate, 리소스 서버 메타데이터]
category: security
level: intermediate
summary: 리소스 서버(API)가 자신을 쓰는 방법(신뢰하는 인가 서버, 지원 scope, 토큰 전달 방식)을 .well-known JSON 으로 공개하고, 401 응답의 resource_metadata 로 그 위치를 알려 주는 규격(RFC 9728).
tags: [oauth2, rfc9728, resource-server, discovery, metadata, well-known, www-authenticate, audience]
related: [security/oauth-authorization-server-metadata-rfc8414, security/oauth-resource-indicators-rfc8707, security/jwt-access-token-profile-rfc9068, security/oauth-issuer-mix-up-defense-rfc9207, security/ssrf, security/dpop, security/mtls-certificate-bound-tokens, security/token-revocation-introspection]
sources:
  - https://www.rfc-editor.org/rfc/rfc9728.html
updatedAt: 2026-11-19
---

## 문제

[RFC 8414](/develop-wiki/knowledge/security/oauth-authorization-server-metadata-rfc8414/)는 "이 이슈어 서버가 어떤 엔드포인트를 가졌나"를 알려 준다. 그런데 클라이언트가 **API 주소만 알 때** 질문이 거꾸로다. 이 API 는 어느 인가 서버의 토큰을 받는가, 어떤 scope 가 있는가, 토큰을 헤더·바디 중 어디에 실어야 하는가, DPoP 가 필수인가. 이를 문서나 하드코딩으로 전달하면 API 와 인가 서버 구성이 바뀔 때 클라이언트가 깨지고, 클라이언트가 임의 API 를 만나는 개방 환경(플러그인, 에이전트, 멀티 테넌트)에서는 방법이 없다.

## 해법: 리소스 쪽 메타데이터 문서

### 1. 위치

리소스 식별자(`https`, fragment 없음, query 는 권장하지 않음)에서 계산한다. 기본 접미사 `/.well-known/oauth-protected-resource` 를 **host 와 path 사이에 끼운다**(RFC 8414 와 같은 방식, 끝의 `/` 는 제거).

```ts
function prmUrl(resource: string): string {
  const u = new URL(resource);
  if (u.protocol !== 'https:' || u.hash) throw new Error('resource 형식 위반');
  return `${u.origin}/.well-known/oauth-protected-resource${u.pathname.replace(/\/$/, '')}${u.search}`;
}
prmUrl('https://resource.example.com/resource1');
// https://resource.example.com/.well-known/oauth-protected-resource/resource1
const accept = (md: { resource: string }, expected: string) => {
  if (md.resource !== expected) throw new Error('resource mismatch');   // 정확 일치 아니면 폐기
  return md;
};
```

(URL 변환 두 경우와 `resource` 불일치 거부를 실행해 확인했다.)

### 2. 401 응답으로 위치 알리기

리소스 서버는 인증 없는 요청에 401 과 함께 `WWW-Authenticate` 에 **`resource_metadata`** 파라미터로 문서 URL 을 준다. 클라이언트는 well-known 경로를 몰라도 된다. DPoP 같은 다른 스킴에도 쓰고, 메타데이터가 바뀌면 **새 challenge 로 변경을 신호**할 수 있어 클라이언트는 다시 가져와 검증한다.

```text
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://api.example.com/.well-known/oauth-protected-resource/v1"
```

### 3. 주요 필드

| 필드 | 필수 여부 | 용도 |
| --- | --- | --- |
| `resource` | 필수 | 리소스 식별자. 위치 계산에 쓴 값과 같아야 함 |
| `authorization_servers` | 선택 | 이 리소스가 신뢰하는 인가 서버 이슈어 목록 |
| `scopes_supported` | 권장 | 쓸 수 있는 scope(공개 정보일 뿐, 전부 요청하라는 뜻 아님) |
| `bearer_methods_supported` | 선택 | 토큰 전달 방식(헤더, 바디, 쿼리) |
| `jwks_uri` | 선택 | 리소스가 응답을 서명·암호화할 때 키(https) |
| `resource_signing_alg_values_supported` | 선택 | 서명 알고리즘(`none` 금지) |
| `tls_client_certificate_bound_access_tokens` | 선택 | [mTLS 바인딩](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/) 토큰 지원 |
| `dpop_signing_alg_values_supported`, `dpop_bound_access_tokens_required` | 선택 | [DPoP](/develop-wiki/knowledge/security/dpop/) 지원·필수 여부 |
| `authorization_details_types_supported` | 선택 | RAR 타입 |
| `resource_name`, `resource_documentation`, `resource_policy_uri`, `resource_tos_uri` | 권장·선택 | 사람이 읽는 정보(언어 태그 `#ko` 가능) |
| `signed_metadata` | 선택 | 메타데이터를 JWT 로 서명, 지원하면 JSON 값보다 우선. `iss` 필수 |

모르는 필드는 무시하고, 값이 빈 항목은 응답에서 뺀다. 인가 서버 메타데이터에는 `protected_resources`(그 서버가 받는 리소스 식별자 목록)가 추가돼 양쪽 목록을 **교차 확인**할 수 있다.

### 4. 흐름

1. 클라이언트가 토큰 없이 API 호출 → 401 + `resource_metadata`.
2. 메타데이터를 가져와 `resource` 일치를 확인(요청한 URL 과 비교).
3. `authorization_servers` 중 하나를 골라 [RFC 8414 메타데이터](/develop-wiki/knowledge/security/oauth-authorization-server-metadata-rfc8414/)를 조회.
4. 인가 요청에 [`resource` 파라미터](/develop-wiki/knowledge/security/oauth-resource-indicators-rfc8707/)를 넣어 **이 API 용으로 audience 가 좁혀진** 토큰을 받는다.

## 언제 쓰나

- 클라이언트가 **미리 알지 못하는 API** 를 만나는 환경(범용 클라이언트, 플러그인, 에이전트 도구 호출, 파트너 연동).
- 한 리소스가 여러 인가 서버를 받거나 인가 서버를 교체·이전할 때.
- DPoP·mTLS 같은 토큰 바인딩 요구를 클라이언트가 사전에 알아야 할 때.

## 주의 (비용)

- **`resource` 정확 일치가 방어선이다.** 불일치하면 데이터를 쓰면 안 된다. 일치 확인이 없으면 공격자가 자기 서버에서 남의 리소스를 가장한 문서를 내려 줄 수 있다. 비교는 코드 포인트 단위이며 유니코드 정규화를 하지 않는다.
- **가져오기는 TLS 로**, 인증서를 해당 호스트에 대해 검증한다. 서명된 메타데이터를 쓰면 TLS·PKI 에만 의존하지 않고 서명 주체로 신뢰를 정할 수 있으나 키 관리 부담이 생긴다.
- **여러 리소스 서버를 상대하는 클라이언트는 audience 가 제한된 토큰을 쓰는 것이 권장된다(§7.4, SHOULD).** 악의적인 리소스 서버가 받은 토큰을 다른 곳에 재사용하는 것을 막는다(RFC 8707). 이 문서는 어떤 토큰이 허용될지를 말해 줄 뿐 강제하지 않는다.
- **SSRF**: 클라이언트가 신뢰 없는 출처에서 얻은 URL 로 메타데이터를 가져오면 내부망 주소로 요청이 간다. RFC 는 내부 주소 대역 차단을 권고한다 → [SSRF 방어](/develop-wiki/knowledge/security/ssrf/).
- 메타데이터가 있다고 인가가 되는 것은 아니다. 토큰 검증(서명, `aud`, 만료)은 별도다 → [JWT 액세스 토큰 프로파일](/develop-wiki/knowledge/security/jwt-access-token-profile-rfc9068/).
- 캐시는 표준 HTTP 캐시 규칙(`Cache-Control: max-age`)을 따른다. 오래 캐시하면 새 인가 서버·키로의 전환을 놓치므로, 리소스 서버가 새 challenge 를 보낼 때 다시 가져오게 한다.
- `scopes_supported` 는 정보 공개이기도 하다. 최소 권한 원칙대로 필요한 scope 만 요청한다. 사용자가 입력한 리소스 URL 은 피싱 UI 위험이 있다(RFC 의 UI 주의).

## 비교

| 규격 | 설명하는 대상 | 위치 | 핵심 검증 |
| --- | --- | --- | --- |
| RFC 8414 | 인가 서버 | `/.well-known/oauth-authorization-server` | 문서 `issuer` = 이슈어 |
| RFC 9728 | 보호 리소스(API) | `/.well-known/oauth-protected-resource` | 문서 `resource` = 리소스 식별자 |
| RFC 8707 | 토큰의 대상 지정 | 인가·토큰 요청 파라미터 | 토큰 `aud` 가 대상과 일치 |
| RFC 9207 | 응답 발급자 표시 | 인가 응답 `iss` | [mix-up 방어](/develop-wiki/knowledge/security/oauth-issuer-mix-up-defense-rfc9207/) |

## 검증 범위

RFC 9728 전문 요약(위치 규칙, 필드, `WWW-Authenticate` 파라미터, 검증·보안 절)을 읽었다. 위 코드는 실행해 확인했다. 필드별 필수·권장 구분은 읽은 내용 기준이며 모든 소절의 세부 문구까지 대조하지는 않았다. 특정 제품·프레임워크(예: MCP 인증 스펙)가 이 규격을 어떻게 채택했는지는 읽지 않았다.
