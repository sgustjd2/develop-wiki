---
title: OAuth 리소스 인디케이터 (RFC 8707)
aka: [Resource Indicators for OAuth 2.0, RFC 8707, resource parameter, invalid_target, audience restriction, 리소스 파라미터]
category: security
level: advanced
summary: 클라이언트가 토큰을 쓸 대상 API 를 resource 파라미터로 인가 서버에 알려, 토큰의 audience 를 그 대상으로 좁히게 하는 확장(RFC 8707). scope 가 "무엇을", resource 가 "어디서"를 말한다.
tags: [oauth2, rfc8707, resource, audience, aud, invalid_target, multi-tenant, token-redirect]
related: [security/jwt-access-token-profile-rfc9068, security/oauth-token-exchange-downscoping, security/oauth2-oidc-pkce, security/access-control-design, security/dpop, security/mtls-certificate-bound-tokens]
sources:
  - https://www.rfc-editor.org/rfc/rfc8707.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
updatedAt: 2026-11-19
---

## 문제

OAuth 의 `scope` 는 "어떤 종류의 접근"(`calendar:read`)을 말하지, 토큰을 **어느 API 가 받을지**는 말하지 않는다. 인가 서버가 대상을 모르면 토큰의 audience 를 좁힐 수 없다.

- 같은 토큰을 받은 API A 가 그것을 API B 에 내밀면 B 가 받아 줄 수 있다(토큰 리다이렉트).
- 한 호스트에 여러 테넌트가 있으면, 테넌트 1 용 토큰이 테넌트 2 에서 통할 수 있다.
- 벤더마다 `audience`, `resource` 같은 독자 파라미터를 써서 클라이언트 라이브러리가 호환되지 않는다.

## 해법: `resource` 파라미터

인가 요청과 토큰 요청(모든 grant)에 `resource` 를 넣는다. 값은 **절대 URI**이고 fragment 는 금지, query 는 가급적 피한다. 여러 번 반복할 수 있다.

```text
GET /authorize?response_type=code&client_id=c1&scope=calendar
    &resource=https%3A%2F%2Fcal.example.com%2F          # 인가 요청: 허용 대상 후보

POST /token  grant_type=authorization_code&code=...
    &resource=https%3A%2F%2Fcal.example.com%2F          # 토큰 요청: 이번 토큰을 쓸 곳
```

RFC 의 동작 규칙을 요약하면 다음과 같다.

- 인가 서버는 발급 토큰의 audience 를 `resource` 대상으로 **제한해야 한다(SHOULD)**. JWT 면 `aud`, 인트로스펙션 응답이면 최상위 `aud` 로 전한다. `resource` 값 그대로 쓰거나 더 일반적인 식별자로 매핑해도 된다.
- 인가 요청에서 승인된 대상이 "grant 전체"의 범위가 되고, 이후 토큰 요청(`authorization_code`, `refresh_token`)은 그 **부분집합**만 요청하도록 서버가 정책으로 제한할 수 있다. 부분집합으로 발급할 때 리프레시 토큰은 원래 grant 전체에 묶인다.
- 같은 refresh token 으로 대상만 바꿔 여러 번 토큰을 받는 흐름이 가능하다(예: 캘린더용, 연락처용을 따로).
- 못 쓰는 대상이면 오류 코드 `invalid_target`. 생략하면 서버가 기본 대상을 쓰거나 거부해도 된다(서버 재량).
- 여러 대상 + scope 를 함께 요청하면 의미는 "각 대상에서 쓸 수 있는 scope 의 곱집합"이고, 서버는 각 대상이 이해하는 scope 로 **줄여서(downscope)** 주는 것이 좋다. 실제 scope 가 요청과 다르면 응답에 `scope` 를 돌려줘야 한다.

### 리소스 서버 쪽 검증

토큰을 받는 API 는 `aud` 에 **자기 식별자가 있는지** 확인해야 효과가 있다. 인가 서버만 좁혀 주고 API 가 검사하지 않으면 보호가 없다. RFC 9700(OAuth 보안 BCP)도 토큰은 특정 리소스 서버(또는 소수 집합)에 audience 제한하고, 리소스 서버는 모든 요청에서 이를 검증하며 어긋나면 거부해야 한다고 쓴다.

```ts
const aud = (t: { aud: string | string[] }) => (Array.isArray(t.aud) ? t.aud : [t.aud]);
const accept = (t: { aud: string | string[] }, me: string) => aud(t).includes(me);
accept({ aud: 'https://api.example.com/tenantA/' }, 'https://api.example.com/tenantB/'); // false
accept({ aud: ['https://cal.example.com/'] }, 'https://cal.example.com/');               // true
```

(위 두 호출은 직접 실행해 `false`, `true` 를 확인했다.)

## 언제 쓰나

- API 가 여러 개이고 서비스별로 토큰의 도달 범위를 좁히고 싶을 때(토큰 유출 시 피해 반경 축소).
- 멀티 테넌트 API 에서 테넌트 간 토큰 재사용을 막을 때. RFC 는 테넌트를 식별하는 경로까지 포함한 구체적 URI 를 쓰라고 한다.
- 인가 서버가 대상마다 토큰 형식·암호화·수명 정책을 달리하고 싶을 때.

## 주의 (비용)

- **여러 `resource` 를 한 토큰에 넣으면 그 대상끼리 서로의 토큰을 쓸 수 있다.** RFC 가 단일 resource 를 권장하는 이유다. 대상별로 토큰을 따로 받으면 왕복이 늘지만 반경이 좁다.
- `resource` 가 추상 식별자(URN 등)면 "이 네트워크 주소가 정말 그 식별자의 주인인가"를 클라이언트가 별도로 확인해야 한다. 가능하면 실제 접근 주소에 대응하는 URL 을 쓴다.
- 서버는 `resource` 를 지원하지 않거나 일부만 지원할 수 있다. 클라이언트는 `invalid_target` 과 무시(파라미터를 모르는 서버는 그냥 무시할 수 있음) 둘 다 대비한다. 무시되면 `aud` 가 기대와 다를 수 있으므로 **받은 토큰의 `aud` 를 확인**하는 편이 안전하다(이 방어는 RFC 문구가 아니라 이 노트의 의견).
- 인가 서버가 대상별 호출을 관찰하므로 인트로스펙션을 쓰지 않는 구성에서 추적 가능성이 다소 늘어난다고 RFC 가 프라이버시 절에서 언급한다.
- `aud` 를 검증하지 않는 리소스 서버에는 효과가 없다. JWT 액세스 토큰의 `aud` 처리 요건은 [RFC 9068 프로파일](/develop-wiki/knowledge/security/jwt-access-token-profile-rfc9068/) 참고.

## 비교

| 수단 | 누가 대상을 정하나 | 시점 | 특징 |
| --- | --- | --- | --- |
| `scope` 에 대상 넣기 | 클라이언트(관례) | 인가·토큰 요청 | 표준 의미 없음, 의미가 섞임 |
| `resource` (RFC 8707) | 클라이언트가 요청, 서버가 결정 | 인가·토큰 요청 | 표준화된 대상 지시 |
| `audience`(벤더 파라미터) | 벤더 정의 | 요청 | 비표준, 제품마다 다름 |
| [토큰 교환](/develop-wiki/knowledge/security/oauth-token-exchange-downscoping/) | 이미 가진 토큰을 내밀며 요청 | 발급 이후 | 서비스 체인에서 홉마다 좁힘. `resource`/`audience` 파라미터를 쓴다 |

## 검증 범위

RFC 8707 전문과 RFC 9700 의 audience 제한 절을 읽었다. 특정 제품(Auth0, Keycloak, Entra 등)이 `resource` 를 어떻게 구현하는지는 확인하지 않았다.
