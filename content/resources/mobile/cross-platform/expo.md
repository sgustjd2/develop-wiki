---
name: Expo
url: https://expo.dev
docs: https://docs.expo.dev
repo: https://github.com/expo/expo
stars: 53661
domain: mobile
category: cross-platform
description: React Native 앱을 위한 프레임워크와 클라우드 서비스. 네이티브 모듈 SDK, 파일 기반 라우팅(Expo Router), EAS 빌드·제출·업데이트로 RN 앱 개발과 배포를 단순화한다.
pricing: oss
tags: [react-native, framework, router, eas]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Expo는 [React Native](/develop-wiki/mobile/cross-platform/react-native/) 위에 카메라·알림·파일 시스템 같은 네이티브 모듈 묶음(Expo SDK), 파일 기반 라우팅(Expo Router), 네이티브 프로젝트 자동 생성(Continuous Native Generation)을 얹은 프레임워크다. React Native 공식 문서가 새 프로젝트에 권장하는 방식이다. 빌드·스토어 제출·OTA 업데이트는 유료 플랜이 있는 클라우드 서비스 **EAS**가 맡는다(프레임워크 자체는 MIT).

- 최신 **Expo SDK 58**(`expo` 58.0.26). 포함 버전: React Native 0.88, React 19.3.0, React Native Web 0.21.0.
- SDK 58 요구 사항: Node.js 22.13+, Xcode 26.4+, iOS 16.4+, Android 7+(compileSdk 37, targetSdk 36).
- 언어는 [TypeScript](/develop-wiki/languages/typescript/).

## 설치
```bash
npx create-expo-app@latest my-app
cd my-app
npx expo start            # 개발 서버. 기기의 Expo Go 또는 개발 빌드로 접속
npx expo install expo-camera   # SDK 버전에 맞는 모듈 버전 설치
```

네이티브 코드가 필요한 라이브러리를 쓰면 Expo Go 대신 **개발 빌드**(`npx expo run:ios`, `eas build --profile development`)를 만든다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Expo SDK | 버전이 맞춰진 네이티브 모듈 묶음(`expo-camera`, `expo-notifications` …) |
| Expo Go | 스토어 앱. SDK 모듈만 쓰는 프로젝트를 빌드 없이 실행 |
| Development build | 내 프로젝트 전용 디버그 앱. 임의의 네이티브 라이브러리 사용 가능 |
| Expo Router | `app/` 디렉터리 구조가 곧 화면 경로. 딥링크·타입 안전 링크 자동 |
| `app.json` / `app.config.ts` | 앱 이름·아이콘·권한·플러그인 설정 |
| Config plugin | 네이티브 프로젝트(Info.plist, AndroidManifest)를 코드로 수정 |
| CNG / prebuild | `npx expo prebuild`로 `ios/`·`android/`를 설정에서 생성. 디렉터리를 커밋하지 않아도 됨 |
| EAS Build / Submit / Update | 클라우드 빌드, 스토어 제출, JS 번들 OTA 배포 |
| Expo Modules API | Swift·Kotlin으로 네이티브 모듈 작성 |

## 기본 사용법
Expo Router 레이아웃과 화면.

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
export default function RootLayout() {
  return <Stack />;
}
```

```tsx
// app/index.tsx
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>홈</Text>
      <Link href="/items/42">42번 항목</Link>
    </View>
  );
}
```

```tsx
// app/items/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
export default function Item() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>항목 {id}</Text>;
}
```

## 자주 쓰는 패턴
- **모듈은 `npx expo install`.** `npm install` 대신 쓰면 현재 SDK와 호환되는 버전이 선택된다.
- **SDK 업그레이드.** `npx expo install expo@^58.0.0 --fix` 후 `npx expo-doctor`로 불일치를 점검한다.
- **빌드 프로필.** `eas.json`에 development·preview·production 프로필을 두고 `eas build -p ios --profile production`, `eas submit`.
- **OTA 업데이트.** JS·에셋만 바뀐 수정은 `eas update --channel production`으로 스토어 심사 없이 배포(네이티브 변경은 새 빌드 필요).
- **E2E 테스트.** [Maestro](/develop-wiki/mobile/mobile-testing/maestro/) 흐름을 EAS 워크플로에서 돌릴 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 React Native 프로젝트 대부분, 네이티브 설정을 코드로 재현 가능하게 관리하고 싶을 때, 소규모 팀이 빌드 인프라 없이 배포할 때.
- 피할 때(대안): 기존 대형 네이티브 앱에 RN 화면 일부만 넣는 brownfield 통합은 순수 RN 구성이 단순할 수 있다(Expo도 지원하지만 설정이 늘어남). EAS 비용이 부담되면 로컬 빌드 + [fastlane](/develop-wiki/mobile/mobile-testing/fastlane/).

## 공식 문서
- [Expo 문서](https://docs.expo.dev) · [SDK 레퍼런스(최신)](https://docs.expo.dev/versions/latest/) · [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/) · [Expo Modules API](https://docs.expo.dev/modules/overview/)
