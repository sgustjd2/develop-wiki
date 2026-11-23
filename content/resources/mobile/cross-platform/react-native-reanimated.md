---
name: React Native Reanimated
url: https://docs.swmansion.com/react-native-reanimated/
docs: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
repo: https://github.com/software-mansion/react-native-reanimated
stars: 11091
domain: mobile
category: cross-platform
description: React Native 용 고성능 애니메이션 라이브러리. UI 스레드에서 실행되는 워클릿 기반 공유 값·애니메이티드 스타일과 CSS 스타일 전환·애니메이션 API 를 제공한다.
pricing: oss
tags: [react-native, animation, worklets, gestures]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Reanimated 는 애니메이션 계산을 JS 스레드가 아닌 **UI 스레드**에서 실행해 제스처·스크롤에 반응하는 부드러운 모션을 만든다. `useSharedValue` 로 값을 만들고 `useAnimatedStyle` 로 스타일에 연결하는 것이 기본이다. v4 부터 워클릿 실행 엔진이 별도 패키지 `react-native-worklets` 로 분리됐다. 제스처는 보통 `react-native-gesture-handler` 와 함께 쓴다.

- 최신 **4.7.2**(2026-11-17, npm), MIT. v4 는 React Native 새 아키텍처 전용이다(구 아키텍처는 3.x). 세부 호환 버전은 공식 호환성 표를 확인한다.
- 위치: 내장 `Animated` API 의 상위 대안. [React Native](/develop-wiki/mobile/cross-platform/react-native/) · [Expo](/develop-wiki/mobile/cross-platform/expo/) 에서 사용한다.

## 설치
```bash
# Expo
npx expo install react-native-reanimated react-native-worklets
npx expo prebuild
# 베어 RN: 설치 후 babel.config.js 의 plugins 맨 마지막에 'react-native-worklets/plugin' 추가
npm install react-native-reanimated react-native-worklets
npm start -- --reset-cache
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `useSharedValue` | JS·UI 스레드가 공유하는 반응형 값 (`.value`) |
| `useAnimatedStyle` | 공유 값에서 스타일을 계산해 UI 스레드에서 갱신 |
| `withTiming` / `withSpring` / `withDecay` | 값 변화 애니메이션 |
| 워클릿(worklet) | UI 스레드에서 실행되는 JS 함수. `'worklet'` 지시어 |
| `useAnimatedScrollHandler` | 스크롤 이벤트를 UI 스레드에서 처리 |
| Layout animations | 마운트·언마운트·레이아웃 변경 전환 (`entering`, `exiting`) |
| CSS 애니메이션·전환 | v4 에서 CSS 스타일 `transition`/`animation` 속성 지원 |
| `scheduleOnRN` | 워클릿에서 JS 스레드 함수 호출 (worklets 패키지) |

## 기본 사용법
```tsx
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Button, View } from 'react-native';

export default function Box() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View>
      <Animated.View style={[{ width: 80, height: 80, backgroundColor: 'tomato' }, style]} />
      <Button title="이동" onPress={() => { x.value = withSpring(x.value + 50); }} />
    </View>
  );
}
```

## 자주 쓰는 패턴
- **제스처 연동.** Gesture Handler 의 `Gesture.Pan()` 콜백에서 공유 값을 갱신해 손가락을 따라가게 한다.
- **진입 애니메이션.** `<Animated.View entering={FadeIn} exiting={FadeOut}>`.
- **스크롤 연동.** 스크롤 오프셋을 공유 값으로 받아 헤더 축소·패럴랙스 구현.
- **보간.** `interpolate(x.value, [0, 100], [1, 0.5])` 로 범위 변환.
- **JS 호출.** 애니메이션 종료 콜백에서 상태 변경이 필요하면 JS 스레드로 넘기는 함수(`scheduleOnRN`)를 사용한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 제스처 기반 UI, 복잡한 전환, 60fps 가 중요한 애니메이션.
- 피할 때(대안): 단순 페이드·이동은 내장 `Animated` 나 LayoutAnimation. 구 아키텍처 앱은 3.x 를 쓰거나 새 아키텍처로 먼저 이전한다.

## 공식 문서
- [시작하기](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) · [GitHub](https://github.com/software-mansion/react-native-reanimated)
