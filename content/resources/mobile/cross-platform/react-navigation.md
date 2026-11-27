---
name: React Navigation
url: https://reactnavigation.org
docs: https://reactnavigation.org/docs/getting-started
repo: https://github.com/react-navigation/react-navigation
stars: 24530
domain: mobile
category: cross-platform
description: React Native 용 JavaScript 기반 네비게이션 라이브러리. 스택·탭·드로어 네비게이터, 타입 안전 파라미터, 딥링크를 제공하며 Expo Router 의 기반이기도 하다.
pricing: oss
tags: [react-native, navigation, routing, expo]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
React Navigation 은 화면 이동을 네비게이터(스택, 하단 탭, 드로어)로 구성하는 React Native 표준 라우팅 라이브러리다. v7 은 컴포넌트 트리로 선언하는 **동적 설정**과, 객체로 화면을 선언하는 **정적 설정**(`createStaticNavigation`)을 모두 지원한다. [Expo](/develop-wiki/mobile/cross-platform/expo/) 의 파일 기반 Expo Router 도 내부적으로 이 라이브러리 위에 만들어져 있다.

- 최신 `@react-navigation/native` **7.5.2**, `@react-navigation/native-stack` 7.21.1(npm), MIT(npm 패키지 license 필드 기준. GitHub API 는 라이선스를 인식하지 못했고 저장소 루트에서 LICENSE 파일을 찾지 못함).
- 최소 요구: react-native 0.72+, Expo Go 사용 시 Expo 52+, TypeScript 5+ (공식 문서 기준).

## 설치
```bash
npm install @react-navigation/native @react-navigation/native-stack
# Expo
npx expo install react-native-screens react-native-safe-area-context
# 일반 RN
npm install react-native-screens react-native-safe-area-context
```
iOS 는 `pod install` 이 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Navigator | 화면 묶음과 전환 방식. native-stack, bottom-tabs, drawer |
| Screen | 이름과 컴포넌트(또는 중첩 navigator) |
| `navigation` 객체 | `navigate`, `push`, `goBack`, `setOptions` |
| `route.params` | 화면 간 전달 파라미터 |
| 훅 | `useNavigation`, `useRoute`, `useFocusEffect`, `useIsFocused` |
| `linking` | URL ↔ 화면 매핑으로 딥링크 설정 |
| 정적 설정 | `createStaticNavigation` 으로 타입·링킹을 자동 생성 |

## 기본 사용법
정적 설정 예제.

```tsx
import { Button, Text, View } from 'react-native';
import { createStaticNavigation, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function Home() {
  const navigation = useNavigation();
  return (
    <View>
      <Button title="상세" onPress={() => navigation.navigate('Details', { id: 1 })} />
    </View>
  );
}

function Details({ route }: { route: { params: { id: number } } }) {
  return <Text>item {route.params.id}</Text>;
}

const RootStack = createNativeStackNavigator({
  screens: {
    Home: { screen: Home, options: { title: '홈' } },
    Details: { screen: Details },
  },
});

const Navigation = createStaticNavigation(RootStack);
export default function App() {
  return <Navigation />;
}
```

## 자주 쓰는 패턴
- **동적 설정.** `NavigationContainer` 안에 `Stack.Navigator`/`Stack.Screen` 컴포넌트로 선언하는 방식. 조건부 화면이 많을 때 편하다.
- **인증 흐름.** 로그인 상태에 따라 다른 화면 그룹만 렌더링해 비로그인 접근을 구조적으로 차단한다.
- **중첩 네비게이터.** 탭 안에 스택을 넣고, 부모 파라미터 전달은 `navigate('Tab', { screen: 'Inner' })`.
- **포커스 처리.** 화면이 보일 때만 데이터를 새로 고치려면 `useFocusEffect`.
- **타입.** TypeScript 에서 ParamList 를 선언하거나 정적 설정의 자동 추론을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 베어 RN 프로젝트의 표준 선택, 세밀한 화면 전환 제어가 필요할 때.
- 피할 때(대안): Expo 앱에서 파일 기반 라우팅과 자동 딥링크를 원하면 Expo Router. 완전 네이티브 네비게이션이 필요하면 react-native-navigation(Wix) 등.

## 공식 문서
- [시작하기](https://reactnavigation.org/docs/getting-started) · [GitHub](https://github.com/react-navigation/react-navigation)
