---
name: React Native
url: https://reactnative.dev
docs: https://reactnative.dev/docs/getting-started
repo: https://github.com/react/react-native
domain: mobile
category: cross-platform
description: React로 iOS·Android 네이티브 앱을 만드는 프레임워크. JavaScript/TypeScript 컴포넌트가 실제 플랫폼 뷰로 렌더링되며, 웹 React 팀이 모바일 앱을 낼 때 주로 쓴다.
pricing: oss
tags: [cross-platform, react, hermes, new-architecture]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
React Native는 [React](/develop-wiki/frontend/framework/react/)의 컴포넌트·상태 모델을 그대로 쓰되, DOM 대신 iOS `UIView`·Android `View` 같은 **진짜 네이티브 뷰**를 렌더링한다. JS 코드는 Hermes 엔진에서 돌고, 네이티브 모듈과는 JSI 기반의 New Architecture(Fabric 렌더러, TurboModules)로 직접 통신한다.

- 최신 안정판 **0.88.1**(0.88: 2026-10-15, React 19.3.0 포함). 0.89는 RC 단계. MIT.
- 0.82부터 New Architecture만으로 동작하고, 0.84부터 Hermes V1이 기본 엔진이다. 0.88은 Web 방식 이벤트 디스패치 기본화, `fontVariationSettings`(가변 폰트), iOS SceneDelegate 지원을 담았다.
- 공식 문서는 프레임워크로 [Expo](/develop-wiki/mobile/cross-platform/expo/) 사용을 권장한다. 언어는 [TypeScript](/develop-wiki/languages/typescript/).

## 설치
```bash
# 권장: 프레임워크(Expo)로 시작
npx create-expo-app@latest my-app

# 프레임워크 없이 순수 RN 템플릿
npx @react-native-community/cli@latest init MyApp
cd MyApp && npx react-native run-android   # 또는 run-ios
```

iOS 빌드에는 [Xcode](/develop-wiki/mobile/ios/xcode/), Android 빌드에는 [Android Studio](/develop-wiki/mobile/android/android-studio/)의 SDK가 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Core Components | `View`, `Text`, `Image`, `ScrollView`, `FlatList`, `TextInput`, `Pressable` |
| StyleSheet | CSS 부분 집합을 JS 객체로. 레이아웃은 Flexbox(Yoga 엔진), 기본 방향은 column |
| Hermes | RN 전용 JS 엔진. 바이트코드 사전 컴파일로 시작 시간 단축 |
| New Architecture | JSI + Fabric(동기 레이아웃, 동시성 렌더링) + TurboModules(지연 로딩 네이티브 모듈) |
| Codegen | TypeScript 스펙에서 네이티브 모듈 인터페이스 코드 생성 |
| Metro | RN 번들러. Fast Refresh로 상태 유지 수정 반영 |
| Platform API | `Platform.OS`, `*.ios.tsx`/`*.android.tsx` 파일 분기 |

## 기본 사용법
```tsx
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function TodoScreen() {
  const [text, setText] = useState('');
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);

  const add = () => {
    if (!text.trim()) return;
    setItems((prev) => [{ id: String(Date.now()), title: text }, ...prev]);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput value={text} onChangeText={setText} placeholder="할 일" style={styles.input} />
      <Pressable onPress={add}><Text>추가</Text></Pressable>
      <FlatList data={items} keyExtractor={(i) => i.id} renderItem={({ item }) => <Text>{item.title}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 },
});
```

## 자주 쓰는 패턴
- **긴 목록은 `FlatList`.** `ScrollView`에 `map`으로 수백 개를 그리면 메모리·성능이 떨어진다. `keyExtractor`를 꼭 준다.
- **내비게이션.** React Navigation 또는 Expo Router(파일 기반)를 쓴다. RN 코어에는 내비게이터가 없다.
- **서버 상태.** [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)·[Zustand](/develop-wiki/frontend/state-data/zustand/) 같은 웹 React 라이브러리를 그대로 쓴다.
- **네이티브 기능.** 커뮤니티·Expo 모듈을 먼저 찾고, 없으면 Turbo Native Module이나 Expo Modules API로 직접 작성한다.
- **업그레이드.** [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)로 버전 간 템플릿 차이를 비교한다.

## 언제 쓰나 / 피할 때
- 쓸 때: React·TypeScript 경험이 있는 팀, 웹과 로직·라이브러리를 공유할 때, 플랫폼 네이티브 컴포넌트 느낌이 필요할 때.
- 피할 때(대안): 픽셀 단위로 같은 커스텀 UI·복잡한 애니메이션이 핵심이면 [Flutter](/develop-wiki/mobile/cross-platform/flutter/). 기존 웹 앱을 거의 그대로 포장하려면 [Capacitor](/develop-wiki/mobile/cross-platform/capacitor/). Kotlin 팀이면 [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/).

## 공식 문서
- [시작하기](https://reactnative.dev/docs/getting-started) · [컴포넌트·API](https://reactnative.dev/docs/components-and-apis) · [New Architecture](https://reactnative.dev/architecture/landing-page)
- [블로그(릴리스 노트)](https://reactnative.dev/blog) · [0.88 발표](https://reactnative.dev/blog/2026/10/19/react-native-0.88)
