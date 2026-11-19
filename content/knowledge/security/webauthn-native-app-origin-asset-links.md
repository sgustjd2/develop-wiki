---
title: 네이티브 앱의 WebAuthn 출처 검증과 도메인 연결 (assetlinks.json · webcredentials · apk-key-hash)
aka: [Native App Passkey Origin, android:apk-key-hash, Digital Asset Links, assetlinks.json, get_login_creds, Associated Domains, webcredentials, apple-app-site-association, AASA, 앱 패스키 출처 검증]
category: security
level: advanced
summary: 앱에서 패스키를 쓰려면 RP ID 도메인이 앱을 공개적으로 지목해야 하고(안드로이드 assetlinks.json, 애플 apple-app-site-association), 서버는 웹 출처와 별도로 앱 출처(android:apk-key-hash:…)를 허용 목록으로 검증해야 한다.
tags: [webauthn, passkeys, android, ios, digital-asset-links, associated-domains, origin-validation, mobile]
related: [security/webauthn-related-origin-requests, security/mfa-passkeys, security/webauthn-signal-api-passkey-lifecycle, security/passkey-recovery-hints, mobile-dev/android-credential-manager-passkey-migration, mobile-dev/deep-link-security, security/threat-modeling-stride]
sources:
  - https://www.w3.org/TR/webauthn-3/
  - https://developer.android.com/identity/credential-manager/prerequisites
  - https://developer.android.com/identity/passkeys/create-passkeys
  - https://developer.android.com/identity/passkeys/architecture
  - https://developer.android.com/identity/sign-in/privileged-apps
  - https://developers.google.com/identity/passkeys/developer-guides/server-authentication
  - https://developer.apple.com/documentation/xcode/supporting-associated-domains
  - https://developer.apple.com/documentation/authenticationservices/supporting-passkeys
  - https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.associated-domains
  - https://android-developers.googleblog.com/2025/05/zoho-achieves-faster-logins-passkey-credential-manager-integration.html
updatedAt: 2026-11-19
---

[관련 출처 요청](/develop-wiki/knowledge/security/webauthn-related-origin-requests/) 노트는 **웹 도메인 여러 개**가 RP ID 하나를 함께 쓰는 방법을 다루면서 네이티브 앱 연동은 별개라고 남겼다. 이 노트는 그 별개 경로, 즉 **앱이 RP ID 의 패스키를 쓰도록 허락받는 방법**과 서버가 앱에서 온 응답의 출처를 검증하는 방법을 정리한다.

## 문제

- 브라우저에서는 브라우저가 페이지 출처를 알고, RP ID 가 그 출처의 등록 가능한 접미사인지 확인한다. 앱에는 "페이지 출처"가 없다.
- 아무 앱이나 `rpId: "bank.example"` 로 패스키를 요청할 수 있다면 피싱 앱이 진짜 은행의 패스키 서명을 받아낼 수 있다.
- 서버 쪽에서도 `clientDataJSON.origin` 에 `https://bank.example` 이 아닌 값이 온다. 웹만 생각한 검증 코드는 앱 로그인을 거절하거나, 반대로 아무 값이나 받는다.

## 해법 1: RP ID 도메인이 앱을 지목한다

플랫폼이 "이 도메인 주인이 이 앱을 허락했다"를 도메인 쪽 파일로 확인한다. 웹의 관련 출처 요청과 같은 방향(**RP ID 도메인이 목록을 공개**)이다.

| | Android (Credential Manager) | Apple (AuthenticationServices) |
| --- | --- | --- |
| 도메인 파일 | `https://<도메인>/.well-known/assetlinks.json` | `https://<도메인>/.well-known/apple-app-site-association`(확장자 없음) |
| 패스키용 선언 | `relation` 에 `delegate_permission/common.get_login_creds` | `"webcredentials": { "apps": ["<팀ID>.<번들ID>"] }` |
| 앱 식별 | `package_name` + `sha256_cert_fingerprints`(서명 인증서 SHA-256) | 애플리케이션 식별자 접두사(팀 ID) + 번들 ID |
| 앱 쪽 설정 | 매니페스트 `asset_statements` 메타데이터(비밀번호 공유에는 `include` 문 추가) | Associated Domains 권한에 `webcredentials:<도메인>` |
| 호스팅 조건 | HTTP 200, `Content-Type: application/json`, 비밀번호용 `include` 는 301/302 리다이렉트면 실패 | HTTPS 유효 인증서, 리다이렉트 없음 |
| 가져가는 주체 | Google(robots.txt 가 `/.well-known/` 을 막지 않아야 함) | iOS 14·macOS 11 부터 기기가 아니라 Apple CDN. 24시간 안에 가져가고 기기는 설치 후 대략 주 1회 갱신 |
| 없으면 | 문서: 패스키에는 Digital Asset Links 가 **필수** | 문서: `webcredentials` 연결 도메인이 없으면 등록·인증 요청이 오류 |

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls",
               "delegate_permission/common.get_login_creds"],
  "target": { "namespace": "android_app",
              "package_name": "com.example.android",
              "sha256_cert_fingerprints": ["<SHA-256 지문>"] }
}]
```

- `handle_all_urls` 는 App Links(딥 링크)용, `get_login_creds` 는 자격 증명 공유용이다. 딥 링크 검증과 같은 파일을 쓰므로 [딥 링크 보안](/develop-wiki/knowledge/mobile-dev/deep-link-security/)의 호스팅 실수(리다이렉트, 콘텐츠 타입)가 그대로 로그인 장애가 된다.
- 디버그·릴리스처럼 패키지명이 다른 빌드는 배열에 항목을 따로 넣는다(Android 문서).
- Apple 은 WKWebView 안에서 패스키를 쓸 때도 RP ID 를 연결 도메인으로 설정해야 하며, 연결하지 않은 서비스의 패스키는 앱이 쓸 수 없다고 적는다.

## 해법 2: 서버는 앱 출처를 허용 목록으로 검증한다

WebAuthn Level 3 의 13.4.9 는 RP 가 `origin` 을 반드시 검증하고 예상 밖 값을 받지 말라고 하며, 예시로 **동반 네이티브 앱이 있으면 OS 별 앱 식별자를 출처로 허용**할 수 있다고 든다. RP ID 용어 정의도 네이티브 플랫폼은 호출자를 RP ID 에 묶는 규칙을 따로 정할 수 있다고 적는다.

Android 문서가 정한 앱 출처 형식:

- `android:apk-key-hash:<서명 인증서 SHA-256 을 패딩 없는 base64url 로 인코딩한 값>`
- 만드는 법: `keytool -list` 의 SHA256 지문(콜론 구분 16진수) → 바이트로 → base64url, `=` 제거 → 접두사 붙이기.
- 서명 인증서가 여럿(디버그·릴리스, 여러 앱)이면 각각 만들어 모두 허용한다.
- Credential Manager 를 쓰는 WebView 의 패스키 요청도 서버에는 이 앱 출처로 도착한다(Android 패스키 아키텍처 문서). 그래서 assetlinks.json 을 올릴 수 없는 **제3자 IdP 페이지**를 WebView 로 띄우는 경우에는 이 방식이 안 되고 Auth Tab 등을 쓰라고 안내한다.

```ts
// 웹 출처와 앱 출처를 한 허용 목록으로. 문자열 정확 일치만.
import { createHash } from 'node:crypto';
export const apkOrigin = (sha256Hex: string) =>
  'android:apk-key-hash:' + Buffer.from(sha256Hex.replace(/:/g, ''), 'hex').toString('base64url');
const allowed = new Set(['https://example.com', apkOrigin(process.env.RELEASE_CERT_SHA256!)]);
export const originOk = (clientDataJSON: Buffer) =>
  allowed.has(JSON.parse(clientDataJSON.toString('utf8')).origin);
```

직접 실행(`apk-origin.mjs`, 임의 지문으로 계산): 해시부는 43자. 정확한 값은 통과, 같은 바이트를 **표준 base64(패딩 `=` 포함)** 로 만든 값과 첫 바이트만 다른 지문은 거절됐다. 또 `android:apk-key-hash:X` 를 `:` 로 나누면 조각이 3개다. Google 블로그의 Zoho 사례 코드처럼 `split(":")` 결과가 3개보다 많을 때만 네 번째 조각을 검사하는 식으로 옮기면, 정상 형식에서는 검사 분기를 타지 않을 수 있고, 같은 코드는 디코더도 표준 base64(`Base64.getDecoder()`)라 `-`·`_` 가 든 값에서 실패한다. 예시 코드를 옮길 때는 형식부터 확인한다.

- 브라우저처럼 **다른 RP 를 대신해** 호출하는 앱은 `setOrigin()` 으로 웹 출처를 넘기며, Android 14(API 34) 이상에서만 효과가 있고 Google Password Manager 에서는 별도 승인이 필요하다(Android privileged apps 문서). 일반 앱은 이 경로가 아니다.

## 언제 쓰나

- 웹과 앱이 같은 계정 체계를 쓰고, 한쪽에서 만든 패스키를 다른 쪽에서도 쓰게 하려 할 때.
- 앱을 새로 출시하거나 서명 키를 바꿀 때(Play 앱 서명 키 교체, 새 패키지 추가) assetlinks.json·서버 허용 목록을 함께 바꿔야 하는지 점검할 때.
- 웹에서는 되는데 앱에서만 "출처 불일치"로 패스키 로그인이 실패할 때 원인 추적.

## 주의 (비용)

- **두 목록을 함께 관리해야 한다.** 도메인 파일(플랫폼이 보는 것)과 서버 허용 목록(RP 가 보는 것)이 따로 있다. 한쪽만 바꾸면 등록은 되는데 검증에서 거절되거나 그 반대가 된다.
- **어떤 인증서의 지문인가.** Android 문서는 "APK 서명 인증서"의 SHA-256 을 쓰라고 한다. 스토어가 재서명하는 배포(예: Play 앱 서명)에서는 업로드 키가 아니라 최종 서명 키의 지문이어야 한다는 점을 확인한다(Play 앱 서명 세부는 이 노트에서 확인하지 않음).
- **캐시와 전파 지연.** Apple 은 CDN 이 하루 안에 가져가고 기기는 대략 주 1회 갱신한다. 파일을 고쳐도 즉시 반영된다고 가정하지 않는다. Android 쪽 캐시 주기는 확인하지 않았다.
- **목록 = 신뢰 경계.** `get_login_creds`·`webcredentials` 에 넣은 앱은 그 RP ID 의 패스키 서명을 받을 수 있다. 서명 키 유출이나 디버그 키를 운영 목록에 남기는 것은 웹의 XSS 와 같은 무게로 다룬다.
- **iOS 앱 출처 형식은 확인하지 못했다.** Apple 문서는 연결 도메인 요건만 설명하고, 네이티브 앱 요청에서 `clientDataJSON.origin` 이 어떤 문자열인지는 읽은 문서에 없다. 서버 허용 목록은 실제 응답을 로그로 확인해 정한다.
- 관련 출처 요청(웹 도메인 간)과 이 경로(앱-도메인)는 서로를 대체하지 않는다. 국가별 도메인 + 앱이 있으면 둘 다 필요하다.

> 검증 범위: W3C WebAuthn Level 3 의 13.4.9(출처 검증, 네이티브 앱 예시)와 RP ID 용어 정의의 비웹 플랫폼 문장, Android 문서 Credential Manager prerequisites(assetlinks.json 구조·호스팅 조건), Create passkeys(앱 출처 만드는 법), Passkeys architecture(WebView 출처·제3자 IdP 제약), Privileged apps(`setOrigin`, API 34), Google 서버 인증 가이드의 출처 단계, Apple 문서 Supporting associated domains·Supporting passkeys·associated-domains 권한 키를 읽었다(2026-11-19). Zoho 사례는 Android Developers Blog 본문과 예시 코드만 읽었다. 출처 계산·검증은 Node 로 직접 실행했다(스크래치 `dist/apk-origin.mjs`, 지문은 임의 값). 미확인: iOS 네이티브 요청의 origin 문자열, Digital Asset Links 캐시 주기, Play 앱 서명과 지문의 관계, 실기기 동작.
