---
name: Capacitor (Ionic)
url: https://capacitorjs.com
docs: https://capacitorjs.com/docs
repo: https://github.com/ionic-team/capacitor
stars: 17145
domain: mobile
category: cross-platform
description: 웹 앱을 iOS·Android 네이티브 앱으로 포장하는 런타임. 웹뷰 위에서 JS로 네이티브 플러그인을 호출하며, Ionic UI 컴포넌트와 함께 쓰거나 기존 React·Vue·Angular 앱을 앱으로 낼 때 쓴다.
pricing: oss
tags: [hybrid, webview, ionic, plugins]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Capacitor는 빌드된 웹 자산(HTML·CSS·JS)을 네이티브 셸의 웹뷰에서 실행하고, 카메라·파일·푸시 같은 기능은 **플러그인**을 통해 JS에서 Swift·Kotlin 코드를 호출하게 하는 런타임이다. Cordova의 후속 격이며, 생성된 `ios/`·`android/` 프로젝트를 개발자가 소유하고 Xcode·Android Studio에서 직접 수정한다는 점이 다르다.

- 최신 안정판 **Capacitor 8.6.2**(9.0은 RC). MIT. Capacitor 8부터 iOS 기본 의존성 관리자가 CocoaPods에서 [Swift Package Manager](/develop-wiki/mobile/ios/swift-package-manager/)로 바뀌었다. 9.0 문서 기준 요구 사항은 Node.js 24+, Xcode 27+.
- **Ionic Framework**(최신 9.0.12)는 모바일 스타일 웹 컴포넌트 UI 키트로, Angular·React·Vue와 함께 Capacitor 위에서 많이 쓴다. Capacitor는 UI 프레임워크와 무관하게 쓸 수 있다.
- 언어는 [TypeScript](/develop-wiki/languages/typescript/).

## 설치
기존 웹 앱 루트에서:

```bash
npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init                     # 앱 이름·ID, webDir(빌드 출력 폴더) 설정
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run build && npx cap sync    # 웹 빌드를 네이티브 프로젝트로 복사
npx cap open ios                 # Xcode에서 열기
```

Ionic으로 새로 시작하려면 `npm i -g @ionic/cli` 후 `ionic start`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `capacitor.config.ts` | appId, appName, `webDir`, 플러그인 설정 |
| `npx cap sync` | 웹 자산 복사(`copy`) + 네이티브 의존성 갱신(`update`) |
| Plugin | JS API + iOS/Android 구현 묶음. 공식(`@capacitor/camera` 등)·커뮤니티 플러그인 |
| Web 구현 | 같은 플러그인 API가 브라우저에서도 동작하도록 웹 폴백 제공 |
| Native project 소유 | `ios/`, `android/`를 커밋하고 직접 수정. 재생성하지 않는 것이 기본 |
| Live Reload | `npx cap run android --live-reload`로 개발 서버를 기기에서 바로 반영 |
| Custom plugin | `npx @capacitor/create-plugin`으로 Swift·Kotlin 플러그인 작성 |

## 기본 사용법
공식 플러그인으로 사진 촬영과 기기 정보 읽기.

```bash
npm i @capacitor/camera @capacitor/device && npx cap sync
```

```ts
import { Camera, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export async function takePhoto(img: HTMLImageElement) {
  const photo = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri });
  img.src = photo.webPath ?? '';
}

export async function describeDevice() {
  const info = await Device.getInfo();
  return `${Capacitor.getPlatform()} / ${info.osVersion}`;
}
```

iOS는 `Info.plist`에 카메라·사진 권한 설명(`NSCameraUsageDescription` 등)을 추가해야 한다.

## 자주 쓰는 패턴
- **플랫폼 분기.** `Capacitor.isNativePlatform()` / `getPlatform()`으로 웹과 앱 동작을 나눈다.
- **빌드 파이프라인.** `웹 빌드 → cap sync → 네이티브 빌드` 순서를 CI 스크립트로 고정한다. 네이티브 빌드·서명은 [fastlane](/develop-wiki/mobile/mobile-testing/fastlane/)과 조합.
- **푸시 알림.** `@capacitor/push-notifications`가 iOS APNs·Android [FCM](/develop-wiki/mobile/mobile-backend/firebase-cloud-messaging/) 토큰을 받는다.
- **메이저 업그레이드.** `npx cap migrate`가 네이티브 프로젝트 변경 일부를 자동 적용한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 있는 웹 앱([React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/)·[Angular](/develop-wiki/frontend/framework/angular/))을 스토어 앱으로 내고 싶을 때, 웹 개발자만으로 사내 앱을 만들 때, PWA와 코드를 공유할 때.
- 피할 때(대안): 스크롤·애니메이션 성능과 네이티브 감각이 핵심이면 [React Native](/develop-wiki/mobile/cross-platform/react-native/)·[Flutter](/develop-wiki/mobile/cross-platform/flutter/)나 네이티브.

## 공식 문서
- [Capacitor 문서](https://capacitorjs.com/docs) · [설치](https://capacitorjs.com/docs/getting-started) · [환경 설정](https://capacitorjs.com/docs/getting-started/environment-setup)
- [공식 플러그인](https://capacitorjs.com/docs/apis) · [Ionic Framework 문서](https://ionicframework.com/docs)
