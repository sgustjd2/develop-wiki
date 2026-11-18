---
name: Flutter
url: https://flutter.dev
docs: https://docs.flutter.dev
repo: https://github.com/flutter/flutter
domain: mobile
category: cross-platform
description: Google의 크로스플랫폼 UI 프레임워크. Dart로 위젯 트리를 작성하고 자체 렌더링 엔진으로 그려 iOS·Android·웹·데스크톱에서 같은 화면을 낸다.
pricing: oss
tags: [cross-platform, widget, dart, impeller]
languages: [dart]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Flutter는 플랫폼 네이티브 위젯을 쓰지 않고 **자체 렌더링 엔진(Impeller)** 으로 모든 픽셀을 그리는 UI 프레임워크다. 그래서 플랫폼 간 화면이 거의 똑같고, 개발 중에는 Dart VM의 핫 리로드로 상태를 유지한 채 코드를 바꿔 볼 수 있다. 릴리스 빌드는 AOT 컴파일된 네이티브 코드다.

- 최신 안정판 **Flutter 3.50.0**(2026-11-11, Dart 3.14). BSD-3-Clause.
- 3.50부터 Material·Cupertino 위젯이 SDK 밖 패키지 **`material_ui`·`cupertino_ui`** 로 분리됐고 `package:flutter/material.dart`는 deprecated다. 새 프로젝트는 새 패키지를 기본 import 한다.
- iOS 의존성은 Swift Package Manager로 옮겨 가는 중이며, 3.50은 SPM을 끄면 매 명령마다 경고한다. FFIgen(Objective-C)·JNIgen(Java/Kotlin) 네이티브 연동 도구가 안정화됐다.
- 언어는 [Dart](/develop-wiki/languages/dart/).

## 설치
```bash
# SDK 설치 후 (docs.flutter.dev/get-started 의 OS별 안내, 또는 VS Code Flutter 확장)
flutter doctor              # Xcode·Android SDK 등 환경 점검
flutter create my_app
cd my_app && flutter run    # 연결된 기기·시뮬레이터에서 실행
```

기존 프로젝트를 새 디자인 패키지로 옮길 때:

```bash
flutter pub add material_ui
dart fix --apply --code=migrate_design_widgets
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Widget | UI 설명 객체. 불변이며 매 빌드마다 새로 만들어도 싸다 |
| `StatelessWidget` / `StatefulWidget` | 상태 없음 / `State` 객체가 상태를 가지고 `setState`로 다시 빌드 |
| `BuildContext` | 트리 안 위치. `Theme.of(context)`처럼 조상 데이터 조회 |
| Element / RenderObject | 위젯을 실제 트리·레이아웃·그리기로 연결하는 내부 계층 |
| Hot reload / Hot restart | 상태 유지 코드 반영 / 앱 상태 초기화 후 재시작 |
| Platform channel / FFI | 네이티브(Swift·Kotlin) 코드 호출. 타입 안전 생성은 Pigeon, FFIgen, JNIgen |
| pub.dev | Dart·Flutter 패키지 저장소 (`flutter pub add`) |
| Impeller | 셰이더를 미리 컴파일하는 렌더링 엔진. iOS·Android 기본 |

## 기본 사용법
```dart
import 'package:flutter/widgets.dart';
import 'package:material_ui/material_ui.dart';

void main() => runApp(const MaterialApp(home: CounterPage()));

class CounterPage extends StatefulWidget {
  const CounterPage({super.key});
  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('카운터')),
      body: Center(child: Text('탭 $_count회', style: Theme.of(context).textTheme.headlineMedium)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _count++),
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

(3.50 이전 SDK에서는 첫 두 줄 대신 `import 'package:flutter/material.dart';`.)

## 자주 쓰는 패턴
- **상태 관리 라이브러리.** 화면 간 공유 상태는 Riverpod, Bloc, Provider 등 pub.dev 패키지로 분리한다(공식 문서는 특정 하나를 강제하지 않는다).
- **비동기 UI.** `FutureBuilder`·`StreamBuilder`로 로딩·오류·데이터 상태를 그린다.
- **`const` 생성자.** 바뀌지 않는 위젯에 `const`를 붙이면 다시 빌드를 건너뛴다.
- **플랫폼별 분기.** 같은 화면에 iOS 느낌이 필요하면 `cupertino_ui` 위젯이나 `.adaptive` 생성자를 쓴다.
- **빌드 산출물.** `flutter build appbundle`(Play), `flutter build ipa`(App Store), `flutter build web --wasm`.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인을 플랫폼과 무관하게 통일하고 싶을 때, 한 팀이 iOS·Android(+웹·데스크톱)를 동시에 낼 때, 애니메이션이 많은 UI.
- 피할 때(대안): 플랫폼 기본 UI 감각이 중요하면 네이티브([SwiftUI](/develop-wiki/mobile/ios/swiftui/)·[Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)). 웹 팀의 React 자산을 살리려면 [React Native](/develop-wiki/mobile/cross-platform/react-native/). 비즈니스 로직만 공유하려면 [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/).

## 공식 문서
- [Flutter 문서](https://docs.flutter.dev) · [시작하기](https://docs.flutter.dev/get-started) · [릴리스 노트](https://docs.flutter.dev/release/release-notes)
- [material_ui·cupertino_ui 이전 가이드](https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui) · [pub.dev](https://pub.dev)
