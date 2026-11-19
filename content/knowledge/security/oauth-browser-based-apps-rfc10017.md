---
title: 브라우저 앱 OAuth 아키텍처 비교 (RFC 10017)
aka: [OAuth 2.0 for Browser-Based Applications, RFC 10017, BCP 212, draft-ietf-oauth-browser-based-apps, BFF, Backend for Frontend, Token-Mediating Backend, Browser-Based OAuth Client, SPA OAuth]
category: security
level: advanced
summary: SPA 가 OAuth 를 쓰는 세 구조(BFF, 토큰 중개 백엔드, 브라우저 직접 클라이언트)를 악성 JavaScript 기준으로 비교한 IETF BCP(RFC 10017, 2026-08)의 요구 사항과 선택 기준.
tags: [oauth2, rfc10017, bcp212, spa, bff, token-mediating-backend, browser, xss, csrf, cookie, dpop]
related: [security/oauth2-oidc-pkce, security/oauth-security-bcp-rfc9700, security/oauth-2-1-vs-rfc9700, security/session-vs-jwt, security/csrf, security/cors, security/xss, security/dpop, security/ssrf, security/fapi-2-security-profile, security/oauth-token-exchange-downscoping, security/oauth-resource-indicators-rfc8707]
sources:
  - https://www.rfc-editor.org/rfc/rfc10017.html
  - https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/
  - https://www.rfc-editor.org/rfc/rfc9700.html
updatedAt: 2026-11-19
---

## 문제

SPA 는 코드 전체가 브라우저에서 돈다. 이 앱이 OAuth 토큰을 다룰 때 가장 큰 위협은 **같은 출처에서 실행되는 악성 JavaScript**(XSS, 오염된 서드파티 스크립트)다. 공격 코드는 앱 코드와 구별되지 않으므로 앱이 할 수 있는 일을 전부 할 수 있다. RFC 10017(OAuth 2.0 for Browser-Based Applications, **BCP 212, Best Current Practice, 2026년 8월**)은 이 전제에서 세 가지 구조를 비교하고 각각의 요구 사항을 정한다. 초안 이름은 `draft-ietf-oauth-browser-based-apps`, 마지막 판은 -27 이다.

RFC 가 정리한 공격 시나리오(5.1)는 넷이다. 구조 비교는 이 넷 중 무엇을 막는지로 갈린다.

| 시나리오 | 내용 |
| --- | --- |
| 5.1.1 일회성 토큰 탈취 | 저장소에 있는 토큰을 한 번 빼 간다 |
| 5.1.2 지속적 토큰 탈취 | 갱신될 때마다 계속 빼 간다 |
| 5.1.3 새 토큰 획득 | 숨은 iframe 등으로 **새 인가 흐름을 직접 돌려** 토큰을 받는다 |
| 5.1.4 브라우저를 통한 요청 대리 | 사용자 브라우저에서 앱처럼 API 를 호출한다(클라이언트 하이재킹) |

## 세 구조 (6절, 보안 강도 순)

| | BFF (6.1) | 토큰 중개 백엔드 (6.2) | 브라우저 OAuth 클라이언트 (6.3) |
| --- | --- | --- | --- |
| OAuth 클라이언트 | 서버(기밀) | 서버(기밀) | 브라우저(공개) |
| 브라우저가 가진 것 | `HttpOnly` 세션 쿠키만 | 세션 쿠키 + **액세스 토큰** | 액세스·리프레시 토큰 |
| API 호출 경로 | 모두 BFF 경유 | 브라우저 → RS 직접 | 브라우저 → RS 직접 |
| 5.1.1·5.1.2 토큰 탈취 | 막음(탈취할 토큰 없음) | 리프레시 토큰은 막음, 액세스 토큰은 노출 | 노출 |
| 5.1.3 새 토큰 획득 | 막음(기밀 클라이언트) | 리프레시는 막음, 액세스 토큰은 백엔드에 요청해 얻을 수 있음 | 노출 |
| 5.1.4 요청 대리 | 남음 | 남음 | 남음 |
| RFC 의 결론 | 업무·민감·개인정보 앱에 **강하게 권장** | BFF 를 쓸 수 없을 때만 고려 | 업무·민감·개인정보 앱에 **권장하지 않음** |

요청 대리(5.1.4)는 어느 구조도 막지 못한다. RFC 는 이것을 웹 앱 자체에 내재한 문제로 보고, BFF 를 쓰면 OAuth 때문에 공격 면이 늘지는 않는다고 정리한다(6.1.4.3).

## 해법: 구조별 요구 사항

### BFF (6.1)

BFF 는 프런트엔드의 일부인 서버 구성요소이며, 프런트엔드 대신 **OAuth 클라이언트가 된다**. 토큰을 쿠키 세션에 묶어 보관하고, 모든 API 요청에 토큰을 붙여 RS 로 전달한다.

| 요구 | 강도 | 절 |
| --- | --- | --- |
| 기밀 클라이언트로 동작, 인가 코드 grant 사용(RFC 9700 2.1.1) | MUST | 6.1.3.1 |
| 쿠키 `Secure`, `HttpOnly` | MUST | 6.1.3.2 |
| 쿠키 `SameSite=Strict`, `Path=/`, `Domain` 미설정, `__Host-Http-` 같은 접두사 | SHOULD (SHOULD NOT for Domain) | 6.1.3.2 |
| 클라이언트 쪽 세션에 토큰을 담는다면 쿠키 내용 암호화 | SHOULD | 6.1.3.2 |
| CSRF 방어 구현 | MUST | 6.1.3.3 |
| CORS 를 CSRF 방어로 쓴다면 앱이 **고정 사용자 정의 헤더**를 붙이게 함 | SHOULD, 쓰면 모든 요청에서 확인 MUST | 6.1.3.3.2 |
| 전달 대상 호스트 검증, 명시적 허용 목록 | MUST | 6.1.3.6 |

- 쿠키 속성의 SHOULD 는 기존 구조가 준수할 수 있게 일부러 MUST 로 올리지 않았다고 문서가 밝힌다.
- 고정 헤더가 필요한 이유: 바디 없는 POST 처럼 CORS-safelisted 요청은 프리플라이트 없이 전송된다. 사용자 정의 헤더가 있으면 교차 출처 요청은 항상 프리플라이트를 거친다. 프런트엔드와 BFF 를 같은 출처에 두면 프리플라이트 부담도 없다.
- 프록시를 열어 두면 [SSRF](/develop-wiki/knowledge/security/ssrf/)와 같은 문제가 생긴다. 공격자가 BFF 를 임의 호스트로 보내면 액세스 토큰이 그쪽으로 간다(6.1.3.6). 메서드도 엔드포인트별로 제한하라고 권한다.
- 세션 수명은 리프레시 토큰 최대 수명과 맞추고, 리프레시 토큰이 무효가 되면 세션도 끝내는 것이 합리적이라고 한다(6.1.2.2).

아래는 BFF 프록시의 핵심 검사만 직접 작성한 스케치다. 고정 헤더 누락 403, 세션 없음 401, 허용 목록 밖 API·메서드 404, `//evil.com` 같은 경로로 호스트가 바뀌면 400 이 나는 것을 Node 24 에서 실행해 확인했다.

```ts
const sessions = new Map<string, { accessToken: string }>();
const ROUTES: Record<string, { origin: string; methods: string[] }> = {
  orders: { origin: 'https://order-api.example.com', methods: ['GET', 'POST'] },
};

export async function bffProxy(req: Request): Promise<Response> {
  if (req.headers.get('x-bff-csrf') !== '1') return new Response(null, { status: 403 }); // 교차 출처면 프리플라이트 강제
  const sid = /(?:^|;\s*)__Host-Http-sid=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1];
  const session = sid ? sessions.get(sid) : undefined;
  if (!session) return new Response(null, { status: 401 });

  const [, , api, ...rest] = new URL(req.url).pathname.split('/');      // /bff/<api>/<path>
  const route = Object.hasOwn(ROUTES, api) ? ROUTES[api] : undefined;
  if (!route || !route.methods.includes(req.method)) return new Response(null, { status: 404 });
  const target = new URL('/' + rest.join('/'), route.origin);
  if (target.origin !== route.origin) return new Response(null, { status: 400 }); // 허용 목록 밖 호스트 차단

  return fetch(target, {
    method: req.method,
    headers: { authorization: `Bearer ${session.accessToken}`, 'content-type': req.headers.get('content-type') ?? '' },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
  });
}
```

### 토큰 중개 백엔드 (6.2)

백엔드가 기밀 클라이언트로 토큰을 받고, **액세스 토큰만** 프런트엔드에 넘긴다. API 는 브라우저가 직접 호출한다. BFF 보다 가볍지만 덜 안전하다.

- 기밀 클라이언트·인가 코드 grant 는 BFF 와 같이 MUST(6.2.3.1). 쿠키·CSRF 요구도 BFF 와 같고, CSRF 방어는 토큰을 내주는 엔드포인트에 적용된다(6.2.3.3).
- 캐시한 액세스 토큰의 scope 가 프런트엔드가 요청한 것보다 넓으면 그대로 돌려주지 않고(SHOULD NOT), 리프레시 토큰으로 좁은 토큰을 새로 받는다(SHOULD, 6.2.2.3). 실제 축소 가능 여부는 AS 에 달렸다 → [리소스 지시자](/develop-wiki/knowledge/security/oauth-resource-indicators-rfc8707/), [다운스코핑](/develop-wiki/knowledge/security/oauth-token-exchange-downscoping/).
- 브라우저에 영구 저장할 필요는 없다(세션으로 다시 받으면 된다). 다만 공격 코드도 같은 방법으로 최신 토큰을 받아 간다(6.2.4.3.1).
- DPoP 를 쓰려면 키 소유자(브라우저)와 토큰 요청자(백엔드)가 갈라져 RFC 9449 가 정의하지 않은 구성이 된다. RFC 10017 은 이것을 범위 밖으로 둔다(6.2.4.3.2).

### 브라우저 OAuth 클라이언트 (6.3)

브라우저 앱이 공개 클라이언트로 모든 OAuth 처리를 한다.

| 요구 | 강도 | 절 |
| --- | --- | --- |
| PKCE 구현, AS 는 PKCE 지원·강제 | MUST | 6.3.2.1 |
| 리다이렉트 URI 에 대한 CSRF 방지 | MUST | 6.3.2.2 |
| AS: 리프레시 토큰은 매번 회전 **또는** 송신자 제약 | MUST | 6.3.2.3 |
| AS: 리프레시 토큰 최대 수명 또는 미사용 만료 설정, 회전 시 최초 수명을 넘겨 연장 금지 | MUST / MUST NOT | 6.3.2.3 |
| AS: 리프레시 토큰 수명을 AS 의 사용자 세션에 연동 | SHOULD | 6.3.2.3 |
| AS: 공유 비밀로 브라우저 앱을 인증하지 않음. 정적 비밀을 요구하던 AS 는 공개 클라이언트로 취급 | MUST NOT / MUST | 6.3.3.1 |
| 리다이렉트 URI 사전 등록·정확 일치 | MUST | 6.3.3.2.1 |
| postMessage 쓰면 송신·수신 출처 모두 검증 | MUST | 6.3.3.3 |
| AS·RS 는 필요한 CORS 헤더 전송 | MUST | 6.3.3.4 |

- [DPoP](/develop-wiki/knowledge/security/dpop/)를 쓰고 키를 추출 불가 `CryptoKeyPair` 로 IndexedDB 에 두면 저장된 토큰 탈취(5.1.1·5.1.2)는 막는다. 그러나 공격자는 **새 흐름을 돌려 자기 키에 묶인 토큰**을 받을 수 있다(6.3.4.2.2).
- iframe 차단, 매번 동의 강제 같은 AS 쪽 차단책은 우회되거나 동의 피로를 만들어 권장하지 않는다(6.3.4.2.3).

## 권장하지 않거나 폐기된 구조 (7절)

| 구조 | 판정 |
| --- | --- |
| 단일 도메인 앱에 OAuth 대신 서버 세션 | OAuth 를 쓰지 않는 선택지로 제시. 요청 대리(5.1.4)만 남는다. 다만 OIDC 로 로그인만 위임하는 것은 여전히 유용하다고 본다(7.1) |
| Implicit grant | AS 는 인가 응답에 액세스 토큰을 넣지 않음 MUST NOT, 브라우저 클라이언트는 인가 코드 grant 사용 MUST, implicit MUST NOT(7.2) |
| ROPC | MUST NOT(7.3) |
| Service Worker 가 OAuth 흐름을 처리 | 새 토큰 획득(5.1.3)을 막지 못해 권장하지 않음. Service Worker 자체가 공격 면을 늘리지는 않는다(7.4) |
| JavaScript 로 쿠키에 토큰 저장 | NOT RECOMMENDED(8.1) |

저장소(8절): localStorage·sessionStorage·IndexedDB 는 노출 범위만 다르고, 같은 출처의 악성 코드로부터 토큰을 지키지 못한다. 메모리·클로저 보관은 노출을 줄이지만 프로토타입 오염으로 깨질 수 있다. 핵심 한계는 어느 저장소든 공격자가 **제공자(AS 나 백엔드)에게 새 토큰을 요청하는 것**은 막을 수 없다는 점이다.

## 언제 쓰나

- 업무 앱, 결제·의료처럼 민감한 데이터, 개인정보를 다루는 SPA → BFF.
- RS 가 많거나 트래픽이 커서 모든 API 를 프록시하기 어렵다 → 토큰 중개 백엔드. 단 문서는 BFF 가 가능한지 먼저 검토하라고 강하게 권한다(6.2.4.4).
- 서버를 둘 수 없는 정적 앱, 위험이 낮은 공개 데이터 앱 → 브라우저 OAuth 클라이언트 + PKCE + 짧은 리프레시 토큰.
- 같은 도메인의 1st-party 웹 앱이고 다른 클라이언트가 없다 → OAuth 없이 [서버 세션](/develop-wiki/knowledge/security/session-vs-jwt/)도 선택지다.
- [FAPI 2.0](/develop-wiki/knowledge/security/fapi-2-security-profile/)처럼 공개 클라이언트를 허용하지 않는 프로파일을 SPA 에 적용하려면 BFF 가 기밀 클라이언트 역할을 맡는 구조가 필요하다(이 연결은 이 노트의 해석).

## 주의 (비용)

- **BFF 운영 비용**: 서버 구성요소를 배포·운영해야 하고 모든 API 트래픽을 대신 받는다. 배포 방식에 따라 부하가 상당할 수 있다고 문서가 직접 쓴다(6.1.4.3).
- **쿠키 인증 = CSRF 부담**: 토큰 대신 쿠키로 인증하므로 [CSRF](/develop-wiki/knowledge/security/csrf/) 방어가 필수다. 프레임워크가 제공하는 double-submit 토큰도 대안이 되지만 CORS 방식보다 낫다는 뜻은 아니라고 한다(6.1.3.3.3).
- **XSS 는 여전히 치명적이다.** BFF 도 요청 대리는 막지 못한다. CSP(nonce·hash 기반), SRI, 출력 인코딩 같은 1차 방어가 먼저다(5절) → [XSS](/develop-wiki/knowledge/security/xss/).
- **BFF 를 범용 프록시로 만들지 말 것.** 동적 라우팅이 필요하면 허용된 호스트·경로만 통과시켜야 한다(MUST).
- 토큰 중개 백엔드는 액세스 토큰 유출 시 RS 직접 접근을 막지 못한다. 수명을 짧게, scope 를 좁게 유지하는 것 외에 구조적 방어가 약하다.

## 비교: 이 RFC 와 이웃 문서

| 문서 | 다루는 것 |
| --- | --- |
| [RFC 9700](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/) | 모든 클라이언트 유형의 OAuth 보안 권고. RFC 10017 의 리프레시 토큰 요구는 RFC 9700 4.14.2 를 그대로 따르게 한다 |
| [OAuth 2.1 초안](/develop-wiki/knowledge/security/oauth-2-1-vs-rfc9700/) | 프레임워크 재정의(implicit·ROPC 제거) |
| RFC 10017 | 브라우저 앱이라는 실행 환경에 한정한 구조 선택과 쿠키·CSRF·프록시 요구 |
| [OAuth·OIDC·PKCE 개요](/develop-wiki/knowledge/security/oauth2-oidc-pkce/) | 흐름 선택 전반. 이 노트는 그중 SPA 구조 부분을 원문 기준으로 펼친 것 |

## 검증 범위

rfc-editor.org 의 RFC 10017 텍스트에서 머리말(BCP 212, Best Current Practice, 2026년 8월), 5, 5.1, 6~6.3.4.3, 7.1~7.1.1, 7.4~7.4.1.1, 8 도입부, 8.4, 8.5 를 읽고 MUST/SHOULD 를 원문 대조했다. 7.2·7.3·8.1 은 해당 문장만 확인했다. 9절(토큰 권한 축소, 송신자 제약, mix-up, 출처 격리) 본문은 읽지 않았다. 초안 마지막 판(-27)과 RFC 상태는 datatracker API(2026-11-19 조회)로 확인했다. 위 코드는 직접 작성해 Node 24.21 에서 가짜 `fetch` 로 실행한 스케치이며 세션 발급·로그인 흐름·리프레시 처리는 포함하지 않는다.
