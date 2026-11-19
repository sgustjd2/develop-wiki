---
title: 네이티브 앱 OAuth 로그인 UX (시스템 브라우저 세션)
aka: [Native App OAuth, ASWebAuthenticationSession, Custom Tabs, In-app Browser Tab, RFC 8252, AppAuth]
category: mobile-dev
group: platform
level: intermediate
summary: 앱이 로그인 화면을 직접 그리지 않고 OS 가 제공하는 인증 세션(iOS)·Custom Tabs(Android)로 외부 user-agent 를 띄워 인증하고, 리다이렉트로 코드를 돌려받는 설계와 UX 선택지.
tags: [mobile, oauth2, login, ios, android, custom-tabs, rfc8252, pkce]
related: [security/oauth2-oidc-pkce, mobile-dev/mobile-token-refresh-session, mobile-dev/deep-link-security, mobile-dev/navigation-deep-links, mobile-dev/mobile-threat-model-masvs, mobile-dev/mobile-secure-storage]
sources:
  - https://www.rfc-editor.org/rfc/rfc8252
  - https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
  - https://developer.android.com/develop/ui/views/layout/webapps/overview-of-android-custom-tabs
updatedAt: 2026-11-19
---

흐름 선택(Authorization Code + PKCE)과 토큰 갱신은 각각 [OAuth2·OIDC·PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/), [토큰 갱신](/develop-wiki/knowledge/mobile-dev/mobile-token-refresh-session/)에 있다. 이 노트는 **앱 안에서 인증 화면을 어떻게 띄우고 결과를 어떻게 받는가**만 다룬다.

## 문제

- 앱 안 WebView 에 로그인 폼을 띄우면 쉽지만, RFC 8252 는 네이티브 앱이 임베디드 user-agent 로 인가 요청을 하지 말라고 한다(8.12절). 호스트 앱이 입력한 자격 증명과 쿠키를 읽을 수 있고, 인가 서버 쪽 동의 과정을 우회할 수 있기 때문이다.
- 임베디드 뷰는 브라우저와 로그인 상태를 공유하지 않아 사용자가 앱마다 다시 로그인해야 한다.
- 반대로 외부 브라우저를 그냥 열면 앱과 브라우저를 오가는 문맥 전환이 크고, 돌아오는 경로(리다이렉트)를 아무 앱이나 가로챌 수 있다.

## 해법

RFC 8252 의 권고는 **외부 user-agent**(시스템 브라우저 또는 그 위의 "in-app browser tab")에서 인가 요청을 하고, 리다이렉트로 앱에 돌아오는 것이다. 브라우저의 기존 세션을 쓰므로 SSO 가 되고, 앱은 자격 증명을 보지 못한다.

| 플랫폼 | 수단 | 특징(공식 문서 기준) |
| --- | --- | --- |
| iOS/macOS | `ASWebAuthenticationSession` | 시작 시 OS 가 "어느 도메인으로 인증하는지" 묻는 모달을 먼저 보여 준다. iOS 에서는 보안 처리된 임베디드 웹 뷰, macOS 에서는 기본 브라우저(미지원이면 Safari)가 열린다. 같은 콜백 스킴을 여러 앱이 등록해도 호출한 앱의 세션만 콜백을 받는다고 문서에 명시돼 있다. |
| Android | Custom Tabs (`CustomTabsIntent`) | 사용자가 쓰는 브라우저가 렌더링하고, 쿠키·저장된 비밀번호·자동 완성을 공유한다. 앱이 직접 쿠키나 권한을 관리할 필요가 없다. |

### 리다이렉트 URI 선택 (RFC 8252 7절)

1. **Claimed https**(iOS Universal Links, Android App Links): OS 가 해당 앱의 도메인 소유를 보증한다. 가능하면 이쪽을 우선한다(7.2절). 검증 방법은 [딥링크 보안](/develop-wiki/knowledge/mobile-dev/deep-link-security/).
2. **Private-use URI scheme**: 자기가 통제하는 도메인을 거꾸로 쓴 스킴(`com.example.app:/cb`). `myapp` 같은 일반 이름 금지(7.1절). 다른 앱이 같은 스킴을 등록할 수 있다.
3. **Loopback**(`127.0.0.1`): 데스크톱 앱용(7.3절).

```ts
// 요청 준비: 앱이 만드는 값 두 개를 세션에 보관한다 (PKCE verifier, state)
const verifier = randomUrlSafe(64);
const state = randomUrlSafe(32);
pending.set(state, { verifier, startedAt: Date.now() });
const url = `${authEndpoint}?response_type=code&client_id=${clientId}`
  + `&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  + `&code_challenge=${s256(verifier)}&code_challenge_method=S256`;
const cb = await openAuthSession(url, redirectUri);   // ASWebAuthenticationSession / Custom Tab
const q = parse(cb);
const p = pending.take(q.state);                      // 모르는 state 면 폐기 (8.9절)
if (!p || q.error) throw new LoginCancelledOrFailed(q.error);
await exchangeCode(q.code, p.verifier);               // 코드 교환 후 토큰은 보안 저장소로
```

### UX 결정

- **취소는 오류가 아니다.** 사용자가 창을 닫으면 "실패" 대신 로그인 화면으로 조용히 되돌린다. 에러 코드 이름·값은 플랫폼 문서의 열거형을 확인한다.
- **SSO vs 격리**: iOS 에는 세션을 비공개(`prefersEphemeralWebBrowserSession`)로 요청하는 옵션이 있다(Apple 문서는 속성 정의만 제공하고 세부 동작은 설명하지 않는다). 공유 기기·계정 전환 화면에서는 쿠키를 남기지 않는 쪽이, 일반 앱에서는 SSO 쪽이 낫다.
- **동의 모달이 먼저 뜬다**(iOS). 사용자가 놀라지 않게 버튼 문구로 "계정 서비스로 이동"임을 미리 알린다.
- **프로세스 복구**: 인증 도중 앱이 종료·재시작될 수 있다. `state`·verifier 를 메모리에만 두면 복귀 시 검증이 실패한다. 짧은 수명으로 보안 저장소에 두는 것을 고려한다. [앱 생명주기](/develop-wiki/knowledge/mobile-dev/app-lifecycle-process-death/).

## 언제 쓰나

- 외부 IdP(소셜 로그인, 사내 SSO)나 자체 인가 서버로 OAuth 2 / OIDC 로그인하는 모든 네이티브 앱. 자체 로그인 폼을 앱에 직접 만드는 설계는 RFC 8252 의 권고 범위 밖이므로, 쓰려면 위협 모델에서 근거를 남긴다.

## 주의·비용

- 브라우저 세션 공유는 양면이다. 편하지만 사용자가 브라우저에 다른 계정으로 로그인해 있으면 그 계정이 제안된다.
- Custom Tabs 는 브라우저별로 기능 지원이 다르다(Android 문서가 브라우저 비교표를 따로 안내). 브라우저가 없거나 비활성인 기기를 위한 대체 경로를 점검한다.
- private-use 스킴은 가로채기가 가능하다. RFC 8252 는 PKCE 로 가로챈 코드를 쓸모없게 만들라고 한다(8.1절). 스킴만 믿고 PKCE 를 생략하지 않는다.
- 서버는 공개 클라이언트로 등록하고 redirect URI 를 정확히 일치시켜야 한다(8.4절). 앱 쪽 설정만으로는 해결되지 않는다.
- 인증 UI 가 OS·브라우저 소유라 디자인 자유도가 낮다. 브랜딩은 로그인 전 화면에서 처리한다.
- 앱 자체 인가 UI(WebView)로 되돌아가려는 압력(디자인 요구, 광고 SDK 연동)이 흔하다. 보안 이유를 기록해 둔다.

> 출처 확인 범위: RFC 8252 본문, Apple 의 `ASWebAuthenticationSession` 문서 JSON, Android Custom Tabs 개요를 읽었다. Apple 의 오류 코드 열거형과 `Callback` 타입 상세, Custom Tabs 의 AppAuth 연동 문서는 읽지 못했다.
