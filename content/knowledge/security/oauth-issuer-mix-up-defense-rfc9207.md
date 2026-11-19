---
title: OAuth issuer mix-up 공격과 iss 응답 파라미터 (RFC 9207)
aka: [Mix-Up Attack, OAuth Mix-Up, iss parameter, RFC 9207, Authorization Server Issuer Identification, authorization_response_iss_parameter_supported]
category: security
level: advanced
summary: 클라이언트가 여러 인가 서버를 쓸 때 공격자 서버가 정직한 서버의 인가 코드를 가로채는 mix-up 공격을, 인가 응답에 iss 를 넣고 요청 때 저장한 이슈어와 비교해 막는 방법(RFC 9207).
tags: [oauth2, mix-up, rfc9207, iss, issuer, authorization-code, multi-idp, rfc9700]
related: [security/oauth-authorization-server-metadata-rfc8414, security/oauth2-oidc-pkce, security/csrf, security/private-key-jwt-client-authentication, security/oauth-resource-indicators-rfc8707, security/dpop]
sources:
  - https://www.rfc-editor.org/rfc/rfc9207.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
  - https://www.rfc-editor.org/rfc/rfc8414.html
updatedAt: 2026-11-19
---

## 문제

OAuth 2.0 의 인가 응답(`?code=...&state=...`)에는 **누가 발급했는지**가 없다. 클라이언트가 인가 서버를 둘 이상 쓰고 그중 하나가 공격자 통제 하에 있으면(직접 등록했거나 침해됨), 공격자는 클라이언트를 속여 **정직한 서버가 발급한 코드를 공격자 서버에 보내게** 할 수 있다. 이것이 mix-up 공격이다. 서버가 하나뿐인 클라이언트는 해당 없지만, 나중에 둘째를 추가하면 취약해진다.

RFC 9700 이 정리한 기본 시나리오(정직한 서버 H, 공격자 서버 A):

1. 사용자가 클라이언트에서 A 로 로그인을 시작한다. 클라이언트는 세션에 "A 선택"을 저장하고 A 의 인가 엔드포인트로 보낸다.
2. A 는 즉시 브라우저를 H 의 인가 엔드포인트로 리다이렉트하되, `client_id` 를 클라이언트가 H 에 가진 ID 로 바꾼다.
3. 사용자가 H 에서 승인하면 H 가 코드를 클라이언트 redirect URI 로 보낸다.
4. 클라이언트는 세션 기록 때문에 이 코드가 A 에서 왔다고 믿고 **A 의 토큰 엔드포인트에 제출**한다. 공격자가 코드를 얻는다(공개 클라이언트면 바로 토큰 교환, 아니면 코드 주입 공격으로 이어진다).

변형으로 암묵 grant 에서 액세스 토큰을 직접 얻는 경우, 사용자 선택을 중간에서 바꾸는 경우, 서버별 redirect URI 를 쓰는데 검사가 느슨한 경우, OIDC 디스커버리를 악용하는 경우가 있다(상세는 RFC 9700 4.4절과 그 인용 논문).

## 해법: 응답에 `iss`, 요청 때 저장한 값과 비교

1. 인가 서버는 성공·오류 **모든** 인가 응답에 자기 issuer 를 `iss` 로 넣는다(`https` URL, query·fragment 없음).
2. 메타데이터에 `authorization_response_iss_parameter_supported: true` 를 게시한다. 생략하면 `false` 로 간주한다. 이때 `iss` 값은 메타데이터의 `issuer` 와 같아야 한다([RFC 8414](/develop-wiki/knowledge/security/oauth-authorization-server-metadata-rfc8414/)).
3. 클라이언트는 **인가 요청을 보낼 때** 어느 issuer 로 보냈는지를 사용자 에이전트(세션)에 묶어 저장한다.
4. 응답을 받으면 `iss` 를 URL 디코딩한 뒤 저장값과 **단순 문자열 비교**한다. 다르면 코드를 쓰지 않고 중단한다. 오류 응답도 같은 서버가 보냈다고 가정하지 않는다.

```ts
type Pending = { issuer: string; supportsIss: boolean };   // 요청 시점에 세션에 저장
function checkAuthzResponse(p: Pending, q: URLSearchParams) {
  const iss = q.get('iss');                                // 디코딩은 URLSearchParams 가 처리
  if (iss === null) { if (p.supportsIss) throw new Error('iss 누락'); return; }
  if (iss !== p.issuer) throw new Error('iss 불일치 — 코드 사용 금지');
}
```

실행 결과: 정직한 `iss` 는 통과, 공격자 `iss` 는 거부, 지원 서버에서 `iss` 가 없으면 거부, 공격자 `iss` 가 붙은 `error` 응답도 거부.

### 세부 규칙 (RFC 9207 2.4, 4절)

- 서버가 `iss` 지원을 광고했는데 응답에 없으면 거부한다. 지원 여부를 클라이언트가 서버별로 기억해야 한다.
- 지원을 광고하지 않은 서버가 보낸 `iss` 는 버리는 것이 권장(SHOULD)이며 예외는 로컬 정책이다.
- 서버마다 `iss` 가 **유일**해야 한다. 수동 설정 시 서로 같은 값을 쓰게 하면 안 된다.
- 메타데이터를 쓰지 않으면 서버별로 기대 `iss` 를 정적 설정한다.
- OIDC 에서 인가 응답에 ID 토큰이 오면 `iss` 파라미터는 ID 토큰의 `iss` 클레임과 같아야 한다.
- `iss` 는 암호학적으로 보호되지 않는다. RFC 는 mix-up 에서는 응답이 정직한 서버에서 오고, 응답을 변조할 수 있는 공격자는 이미 코드를 볼 수 있으므로 무결성 보호가 필요 없다고 논증한다.

## 언제 쓰나

- 둘 이상의 인가 서버·IdP 를 연동하는 클라이언트(소셜 로그인 여러 개, 멀티테넌트 SSO, 동적 클라이언트 등록 환경). RFC 9700 은 이런 클라이언트가 mix-up 을 막아야 한다(MUST)고 한다.
- 서버가 하나여도 확장 계획이 있으면 미리 `iss` 검증을 넣어 두면 비용이 작다.

## 주의 (비용)

- **저장해야 하는 것은 URL 하나가 아니라 issuer 다.** RFC 9700 은 인가 서버 URL 만 저장해서는 부족하다고 지적한다. 공격자가 정직한 서버의 인가 엔드포인트를 "자기 것"으로 선언하고 토큰 엔드포인트만 자기 것으로 둘 수 있기 때문이다. issuer 는 메타데이터를 통해 인가·토큰 엔드포인트 쌍을 대표하는 추상 식별자 역할을 한다.
- 서버가 `iss` 를 보내지 않으면 이 방어가 불가능하다. 그때 대안은 **서버마다 다른 redirect URI** 인데, RFC 9700 은 클라이언트가 많은 발급자에 한 번만 등록하는 구조(예: 일부 오픈 뱅킹)에서 못 쓰고, 공격자가 같은 redirect URI 로 정직한 서버에 새 클라이언트를 등록해 우회할 수 있어 다른 수단이 없을 때만 쓰라고 한다.
- ID 토큰이 인가 응답으로 오는 흐름(`code id_token`)이나 JARM 은 이미 issuer 를 담고 있어 `iss` 파라미터가 불필요할 수 있다. 단 서로 다른 issuer 가 여럿 보이면 일치하지 않을 때 거부해야 한다.
- 이 방어는 mix-up 만 다룬다. 코드 가로채기 자체는 [PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/), 로그인 CSRF 는 `state` 가 맡는다. 서로 대체재가 아니다.
- 구현 실수는 대부분 "문자열 비교 대신 정규화·접두사 비교", "응답마다가 아니라 세션 전역으로 저장" 같은 형태다(이 줄은 의견이며 출처 없음).

## 비교

| 방어 | 막는 것 | 전제 |
| --- | --- | --- |
| `iss` 비교(RFC 9207) | mix-up | 서버가 `iss` 를 보냄 |
| 서버별 redirect URI | mix-up (조건부) | 클라이언트가 서버마다 따로 등록 가능 |
| PKCE | 코드 가로채기·주입 | 클라이언트·서버 모두 지원 |
| `state` | 로그인 CSRF | 세션에 묶어 검증 |

## 검증 범위

RFC 9207 전문, RFC 9700 4.4절, RFC 8414 의 issuer 관련 절을 읽었다. 원 논문(arXiv 1601.01229 등)은 읽지 못했다. 공격 시나리오는 RFC 9700 서술을 요약했고 실제 공격 재현은 하지 않았다. 검증 함수는 로컬에서 실행했다.
