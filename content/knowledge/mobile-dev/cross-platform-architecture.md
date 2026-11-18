---
title: 크로스플랫폼 앱 아키텍처 비교 (Flutter·React Native·KMP·네이티브)
aka: [Cross-platform, Flutter, React Native, Kotlin Multiplatform, Compose Multiplatform, Native]
category: mobile-dev
group: architecture
level: intermediate
summary: 코드를 어디까지 공유하고 UI 를 누가 그리는가에 따라 네이티브·Flutter·React Native·KMP 로 나뉘는 구조 차이와 선택 기준.
tags: [mobile, flutter, react-native, kotlin-multiplatform, native, architecture]
related: [mobile-dev/clean-architecture-mobile, mobile-dev/mvvm-mvi-udf, mobile-dev/dependency-injection-mobile, architecture/layered-clean-hexagonal, principles/coupling-and-cohesion]
sources:
  - https://docs.flutter.dev/resources/architectural-overview
  - https://reactnative.dev/architecture/landing-page
  - https://kotlinlang.org/docs/multiplatform/kmp-overview.html
updatedAt: 2026-11-19
---

## 문제

iOS 와 Android 를 따로 만들면 기능·버그·인력이 두 벌이 된다. 그렇다고 코드를 하나로 합치면 플랫폼 고유 동작(내비게이션, 접근성, 백그라운드 제약)과 충돌한다. 선택지는 "무엇을 공유하는가"로 갈린다.

## 해법: 공유 범위로 구분

| 접근 | 공유하는 것 | UI 를 그리는 주체 | 플랫폼 코드와의 경계 |
| --- | --- | --- | --- |
| 네이티브 2벌 | 없음(서버 API 계약 정도) | OS 위젯(SwiftUI/UIKit, Compose/View) | 해당 없음 |
| Flutter | 로직과 UI 전부(Dart) | Flutter 가 직접 그림. OS 위젯으로 변환하지 않음 | 플랫폼 채널, FFI, 플랫폼 뷰 |
| React Native | 로직과 UI 정의(JS/TS) | 호스트(네이티브) 뷰로 렌더 | JSI 로 JS 와 네이티브가 직접 호출 |
| Kotlin Multiplatform(KMP) | 로직만, 또는 Compose Multiplatform 으로 UI 까지 선택 | 로직만 공유하면 네이티브 UI | `expect`/`actual` 선언으로 플랫폼별 구현 |

### 각 방식의 구조 (공식 문서 기준)

- **Flutter**: 위젯 트리에서 렌더 객체 트리를 만들고 엔진이 합성해 GPU 로 보낸다. Material/Cupertino 컨트롤도 Dart 로 구현돼 OS 버전과 무관하게 같은 모양이다. 릴리스 빌드는 네이티브 코드로 AOT 컴파일된다. 지도처럼 다시 만들기 어려운 컨트롤은 플랫폼 뷰로 끼워 넣는데, 문서가 오버헤드가 있다고 밝힌다.
- **React Native**: 새 아키텍처는 직렬화하는 비동기 브리지를 JSI(JS 가 C++ 객체를 직접 참조)로 대체한다. 0.76 부터 기본값이다. 문서는 켠다고 자동으로 빨라지지는 않고 코드 변경이 필요할 수 있다고 적는다.
- **KMP**: 네트워킹·저장소 같은 모듈 단위로 공유하다가 점차 넓힐 수 있다. 로직만 공유하고 SwiftUI/네이티브 UI 를 유지하거나, Compose Multiplatform 으로 UI 까지 공유한다. 점진적 도입이 가능하다는 점이 특징이다.

```kotlin
// KMP: 공통 코드는 선언만, 구현은 플랫폼이 제공
// commonMain
expect fun secureRandomId(): String
// androidMain / iosMain 에 각각 actual 구현
```

### 설계 관점의 공통 원칙

공유 방식과 무관하게 **도메인·데이터 계층은 플랫폼 API 에 직접 의존하지 않게** 둔다. 그래야 UI 기술이나 공유 방식을 바꿔도 핵심 로직이 남는다. [클린 아키텍처(모바일)](/develop-wiki/knowledge/mobile-dev/clean-architecture-mobile/)의 경계 나누기가 그대로 적용된다.

## 언제 쓰나

- 기능이 두 플랫폼에서 거의 같고 팀이 작다: Flutter, React Native 로 UI 까지 공유.
- 기존 네이티브 앱이 있고 비즈니스 로직 중복이 문제다: KMP 로 로직부터 점진 공유.
- 플랫폼 고유 경험(위젯, Live Activities, 최신 OS API)이 제품 핵심이다: 네이티브, 또는 공유 UI 를 쓰되 해당 부분만 네이티브 모듈.
- 팀 기술 스택이 이미 있다(웹/React, Kotlin)면 학습 비용이 선택을 좌우한다.

## 주의·비용

- **플랫폼 새 기능의 지연**: 새 OS API 는 먼저 네이티브에 나오고 크로스플랫폼 쪽은 래퍼나 직접 브리지가 필요하다. 이 경계 코드는 결국 Kotlin/Swift 지식이 있어야 쓴다.
- **"한 번 쓰고 어디서나"는 아니다**: 내비게이션, 권한, 백그라운드 작업, 푸시, 스토어 정책은 플랫폼별 처리가 남는다. [백그라운드 작업 제약](/develop-wiki/knowledge/mobile-dev/background-work-constraints/) 참고.
- **UI 를 직접 그리는 방식**(Flutter)은 OS 의 새 시각 스타일이나 접근성 동작을 따라가려면 프레임워크 업데이트를 기다려야 한다. 접근성은 따로 검증한다. [모바일 접근성 기초](/develop-wiki/knowledge/mobile-dev/mobile-accessibility-basics/) 참고.
- 성능·앱 크기·시작 시간은 앱마다 다르다. 공식 문서의 일반 설명만으로 판단하지 말고 핵심 화면으로 직접 측정한다. [크래시·성능 모니터링](/develop-wiki/knowledge/mobile-dev/crash-performance-monitoring/) 참고.
- 프레임워크 선택은 되돌리기 어렵다. 도메인 로직을 UI 와 분리해 두는 것이 가장 싼 보험이다.
