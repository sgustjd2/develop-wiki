---
title: 딥링크·App Links·Universal Links 보안
aka: [Deep Link Security, App Links Verification, assetlinks.json, Link Hijacking, Scheme Hijacking, Intent Redirection]
category: mobile-dev
group: platform
level: intermediate
summary: 외부에서 들어오는 링크를 신뢰할 수 없는 입력으로 보고, 도메인 소유 검증된 https 링크를 쓰며 파라미터를 파싱·검증·재확인하는 보안 설계.
tags: [mobile, security, deep-link, app-links, universal-links, oauth, android, ios]
related: [mobile-dev/navigation-deep-links, mobile-dev/mobile-token-refresh-session, mobile-dev/mobile-threat-model-masvs, mobile-dev/push-notification-architecture, security/oauth2-oidc-pkce, security/owasp-top-10, principles/parse-dont-validate]
sources:
  - https://developer.android.com/training/app-links/verify-android-applinks
  - https://www.rfc-editor.org/rfc/rfc8252
  - https://mas.owasp.org/MASVS/
updatedAt: 2026-11-19
---

화면 이동 구조와 링크 종류는 [네비게이션과 딥링크](/develop-wiki/knowledge/mobile-dev/navigation-deep-links/)에서 다룬다. 이 노트는 보안 쪽만 깊게 본다.

## 문제

- 링크는 웹페이지, 다른 앱, 메시지, QR 어디서든 올 수 있다. 값은 전부 공격자가 만들 수 있다.
- 커스텀 스킴은 다른 앱이 같은 스킴을 등록해 가로챌 수 있다. RFC 8252 는 여러 앱이 같은 스킴을 등록하는 상황에서 인가 코드가 엉뚱한 앱에 전달될 수 있다고 경고한다(8.1절).
- 링크가 곧바로 결제·삭제·로그인 같은 동작을 실행하면 사용자가 모르는 사이 CSRF 비슷한 공격이 된다.

## 해법

### 1. 소유가 검증된 https 링크를 기본으로

- **Android App Links**: 매니페스트 intent filter 에 `autoVerify="true"` 를 두면 설치 시 시스템이 각 호스트의 `https://<호스트>/.well-known/assetlinks.json` 을 조회해 검증한다(Android 6.0+). 검증된 도메인은 한 기기에서 한 앱만 연결된다.
- **iOS Universal Links**: 앱의 Associated Domains 와 도메인의 `apple-app-site-association` 파일이 서로를 가리켜야 한다. (이 노트 작성 시 Apple 문서 본문은 읽지 못해 세부 요건은 적지 않았다. 구현 전 공식 문서를 확인할 것.)
- OAuth 리다이렉트도 같은 원칙이다. RFC 8252 는 가능하면 OS 가 앱 신원을 보증하는 claimed https 리다이렉트를 쓰라고 권하고(7.2절), 커스텀 스킴은 소유 도메인 역순 이름 형태를 쓰고 PKCE 를 반드시 함께 쓰라고 한다(7.1, 8.1절).

### 2. 파라미터는 파싱해서 타입으로 바꾼다

```kotlin
sealed interface Link { data class Product(val id: ProductId) : Link; data object Home : Link }

fun parse(uri: Uri): Link? {
    if (uri.scheme != "https" || uri.host !in ALLOWED_HOSTS) return null   // 허용 목록
    val seg = uri.pathSegments
    if (seg.size == 2 && seg[0] == "p") return ProductId.of(seg[1])?.let(Link::Product)
    return null                                                            // 모르면 무시
}
```

- 호스트·경로·값 형식을 허용 목록으로 검사하고, 통과한 값만 도메인 타입으로 만든다([parse, don't validate](/develop-wiki/knowledge/principles/parse-dont-validate/)).
- 링크가 "다음에 열 URL" 같은 값을 받으면(WebView 로드, 리다이렉트) 임의 URL 로딩을 허용하지 않는다. 열린 리다이렉트처럼 악용된다.

### 3. 링크는 열기만, 실행은 앱 안에서 확인

- 링크로 토큰·세션을 주입하지 않는다. 로그인이 필요하면 보류 목적지로 저장하고 로그인 후 이어서 이동한다.
- 결제·삭제·권한 변경은 화면을 연 뒤 사용자의 명시적 확인을 받는다.
- 서버가 이메일 로그인 링크 같은 일회성 토큰을 링크에 싣는 설계라면, 짧은 만료·1회 사용·기기 바인딩을 서버가 책임진다.

### 4. 내보내는 컴포넌트를 최소화 (Android)

- 외부에서 호출되는 Activity 는 `exported` 를 의도한 것만 켠다. 외부에서 받은 Intent 안의 또 다른 Intent 를 그대로 실행(intent redirection)하지 않는다.

## 언제 쓰나

- 푸시·메일·QR·공유로 앱에 진입시키는 모든 앱, 특히 로그인·결제·계정 관리 링크가 있는 앱.

## 주의·비용

- 검증 파일 변경이 기기에 반영되는 시간이 있다. Android 문서 기준으로 Android 15+ 는 백그라운드 재검증으로 최대 7일, Android 14 이하는 주로 앱 설치·업데이트 때 반영된다. 긴급 폐기 수단으로 쓰기 어렵다.
- 검증 호스트 하나라도 파일이 없거나 잘못되면 Android 11 이하에서는 앱이 기본 처리 앱이 되지 못한다(문서의 노트). 호스트를 줄여 관리한다.
- 검증된 링크도 "누가 보냈는지"는 보증하지 않는다. 도메인 소유와 링크 내용의 신뢰는 별개다.
- 도메인에 열린 리다이렉트나 사용자 업로드 경로가 있으면 신뢰된 도메인이 공격 발판이 된다.
- 링크 형식을 바꾸면 이미 발송된 링크가 깨진다. 호환 기간을 둔다.
- 점검 기준은 OWASP MASVS 의 PLATFORM 그룹(IPC·WebView 등)이다. [모바일 위협 모델](/develop-wiki/knowledge/mobile-dev/mobile-threat-model-masvs/) 참고.
