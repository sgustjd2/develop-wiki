---
title: OAuth 토큰 교환과 downscoping (RFC 8693)
aka: [OAuth 2.0 Token Exchange, RFC 8693, Downscoping, Delegation, Impersonation, act claim, may_act, On-Behalf-Of, 토큰 교환]
category: security
level: advanced
summary: 서비스가 받은 토큰을 인가 서버에 내밀어 다른 대상(audience)·더 좁은 권한의 토큰으로 바꿔 받는 grant. 호출 체인에서 토큰을 그대로 전달하지 않게 해 준다(RFC 8693).
tags: [oauth2, token-exchange, rfc8693, downscoping, delegation, impersonation, microservices, act-claim]
related: [security/oauth2-oidc-pkce, security/jwt-access-token-profile-rfc9068, security/private-key-jwt-client-authentication, security/access-control-design, security/token-revocation-introspection, security/dpop, security/mtls-certificate-bound-tokens]
sources:
  - https://www.rfc-editor.org/rfc/rfc8693.html
updatedAt: 2026-11-19
---

## 문제

사용자가 API 게이트웨이를 호출하고, 게이트웨이가 주문 서비스, 주문 서비스가 결제 서비스를 호출한다. 사용자 토큰을 **그대로 전달**하면 문제가 생긴다.

- 토큰의 `aud`/scope 가 넓다. 중간 서비스 하나가 털리면 그 토큰으로 다른 모든 서비스를 호출할 수 있다(권한 확대·lateral movement).
- 결제 서비스는 "사용자가 직접 불렀나, 주문 서비스가 대신 불렀나"를 구분하지 못한다.
- 서비스마다 토큰 형식·수명 요구가 다른데 하나를 돌려쓴다.

## 해법: 교환 요청

토큰 엔드포인트에 `grant_type=urn:ietf:params:oauth:grant-type:token-exchange` 로 요청한다.

| 파라미터 | 의미 |
| --- | --- |
| `subject_token`, `subject_token_type` | 필수. 누구를 대신하는지(받은 토큰) |
| `actor_token`, `actor_token_type` | 선택. 행위자 신원. 보내면 타입도 필수 |
| `audience` / `resource` | 새 토큰을 쓸 대상(논리 이름 / 절대 URI). 여러 개 가능 |
| `scope` | 원하는 권한 |
| `requested_token_type` | 원하는 토큰 종류. 생략하면 서버가 정함 |

성공 응답은 200 JSON 이고, `access_token`(이름은 관례일 뿐 꼭 액세스 토큰이 아니다), 필수 `issued_token_type`, `token_type`(쓸 수 없으면 `N_A`)이 온다. 요청과 다른 scope 를 줬으면 `scope` 를 돌려줘야 한다. 대상을 못 만들면 `invalid_target` 이다.

### downscoping

받은 토큰보다 **좁은** 토큰을 새로 받는 것이 downscoping 이다. 인가 서버가 (호출자가 이 대상에 요청할 수 있는 권한) ∩ (subject 토큰의 권한) ∩ (요청한 scope) 만 주도록 구현한다. RFC 는 위험을 줄이는 방법으로 좁은 scope 와 짧은 수명을 든다.

### 위임과 가장

- **가장(impersonation)**: 행위자가 주체와 구분되지 않게 행동한다. subject 토큰만 보낸다. 하류 서비스는 누가 실제로 불렀는지 모른다.
- **위임(delegation)**: 행위자가 자기 신원을 유지한 채 주체를 대리한다. 보통 actor 토큰도 보내고, 결과 토큰에 `act` 클레임으로 행위자를 적는다. `act` 가 중첩되면 이전 행위자 체인이 남지만, **접근 제어에는 최상위 클레임과 현재 행위자만 쓴다**.
- `may_act`: 토큰 안에서 "이 주체를 대신해 행동해도 되는 상대"를 밝히는 클레임. 서버가 교환 허용 여부를 정할 때 확인할 수 있다.

```ts
type Tok = { sub: string; aud: string; scope: string[]; client_id: string; exp: number;
             act?: { sub: string; act?: unknown }; may_act?: { sub: string } };
// 호출자별로 어느 대상에 어떤 스코프까지 교환할 수 있는지
const policy: Record<string, Record<string, string[]>> = {
  gateway: { 'orders-api': ['orders:read'], 'billing-api': ['billing:read'] },
};
function exchange(caller: string, subject: Tok, req: { audience: string; scope?: string[] }, now: number): Tok {
  const p = policy[caller];
  if (!p) throw new Error('invalid_client');
  if (subject.exp <= now) throw new Error('invalid_request: subject expired');
  const allowed = p[req.audience];
  if (!allowed) throw new Error('invalid_target');
  if (subject.may_act && !subject.may_act.some((m) => m.sub === caller)) throw new Error('access_denied: may_act');
  const granted = (req.scope ?? subject.scope).filter((s) => subject.scope.includes(s) && allowed.includes(s)); // 교집합 = downscoping
  if (granted.length === 0) throw new Error('invalid_scope');
  return { sub: subject.sub, aud: req.audience, scope: granted, client_id: caller,
           exp: Math.min(subject.exp, now + 300), act: { sub: caller, act: subject.act } };     // 위임: 행위자 체인
}
```

사용자 토큰(scope: orders:read, orders:write, billing:read)으로 직접 실행해 확인한 결과: `orders-api` 교환은 `orders:read` 만 남고 `act.sub=gateway` 가 붙는다. `orders:write` 만 요청하면 `invalid_scope`, 정책에 없는 `admin-api` 는 `invalid_target`, `may_act` 에 없는 호출자는 거부, 만료된 subject 는 거부된다. 새 토큰 만료는 subject 보다 늦지 않게 `min` 으로 잡았다(이 부분은 RFC 요구가 아니라 이 예제의 설계 선택이다).

## 언제 쓰나

- 서비스 체인에서 **하류 호출마다 대상·권한을 좁힌 토큰**을 쓰고 싶을 때(Zero Trust 형 내부 호출).
- 외부 IdP 의 토큰(SAML, 다른 도메인 JWT)을 우리 인가 서버의 토큰으로 바꿔야 하는 연합 구조.
- 하류 서비스가 "누가 대신 불렀는지"를 감사 로그에 남겨야 할 때(위임 + `act`).

## 주의 (비용)

- **교환 엔드포인트가 권한 상승 통로가 된다.** 클라이언트 인증을 요구해야 한다(그렇지 않으면 훔친 토큰을 누구나 다른 토큰으로 바꾼다). 호출자별 허용 (audience, scope) 표를 정책으로 관리하고 기본은 거부한다. 호출자 인증은 [private_key_jwt](/develop-wiki/knowledge/security/private-key-jwt-client-authentication/)나 mTLS 가 어울린다.
- **홉마다 인가 서버 왕복이 늘고, 인가 서버가 모든 호출 경로의 의존성이 된다.** 교환 토큰을 짧은 수명 동안 캐시할 수는 있으나 키는 (subject 토큰, 대상, scope) 전부여야 한다(이 캐시 지침은 RFC 가 아니라 설계 의견이다).
- **가장은 감사성을 지운다.** 가능하면 위임(`act`)을 쓴다. 단, `act` 체인은 정보용이고 인가 판단에 쓰는 것은 현재 행위자뿐이다.
- 교환된 토큰이 원본이 취소돼도 살아 있을 수 있다. 짧은 수명을 두고, 취소 전파가 필요하면 [인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/) 설계를 같이 본다.
- 교환 토큰의 형식은 [JWT 액세스 토큰 프로파일](/develop-wiki/knowledge/security/jwt-access-token-profile-rfc9068/)에 맞추면 하류 검증이 쉽다. 탈취 대응(바운드 토큰)은 [DPoP](/develop-wiki/knowledge/security/dpop/)와 병행한다.

## 비교

| 방식 | 하류가 받는 토큰 | 장점 | 비용 |
| --- | --- | --- | --- |
| 토큰 그대로 전달 | 사용자 토큰 | 단순 | 권한이 넓고 `aud` 가 안 맞음 |
| 서비스 자체 토큰(client_credentials) | 서비스 토큰 | 단순, 사용자 컨텍스트 불필요 시 적합 | 사용자 신원이 사라짐 |
| 토큰 교환(위임) | 좁힌 토큰 + `act` | 대상·권한 한정, 감사 | 인가 서버 왕복, 정책 관리 |

## 검증 범위

RFC 8693 요약을 읽고 정리했다. 보안 고려사항 절의 세부 문구와 `may_act`/`act` 의 정확한 클레임 구조는 요약 수준으로만 확인했다. 예제 코드는 정책 로직만 보여 주며 서명·전송은 생략했다.
