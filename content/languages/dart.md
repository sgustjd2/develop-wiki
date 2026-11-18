---
name: Dart
summary: Google이 만든 정적 타입 언어. Flutter의 언어로 모바일·웹·데스크톱 UI를 한 코드로 만든다. 개발 중엔 JIT로 핫 리로드, 배포 땐 AOT 네이티브 코드나 JS·Wasm으로 컴파일한다.
paradigms: [객체지향, 함수형, 명령형]
typing: static
execution: vm
firstAppeared: 2011
officialSite: https://dart.dev/
docs: https://dart.dev/guides
useCases: [Flutter 크로스 플랫폼 앱, 웹 프론트엔드(JS·Wasm), 커맨드라인 도구, 서버(shelf 등)]
sources:
  - https://dart.dev/get-dart
  - https://dart.dev/tools/dart-create
  - https://dart.dev/language
  - https://dart.dev/overview
updatedAt: 2026-11-18
---

## 개요
Dart는 Google이 2011년에 공개한 클라이언트 최적화 언어다. 지금은 사실상 **Flutter** 의 언어로 쓰이며, 하나의 코드베이스로 iOS·Android·웹·데스크톱 앱을 만든다. 이 글 작성 시점 dart.dev 문서는 **Dart 3.14** 기준이다.

`execution: vm` 으로 분류한 이유: 개발 중에는 Dart VM 위에서 JIT로 실행해 핫 리로드를 제공하고, 배포할 때는 AOT로 네이티브 기계어를 만들거나(`dart compile exe`) 웹용 JavaScript·WebAssembly로 컴파일한다. 즉 VM·AOT·트랜스파일을 모두 쓰는 언어다.

## 언어의 특징
- **타입 시스템:** 정적 타입 + 타입 추론, **sound null safety**(Dart 3부터 필수). `String` 은 null 이 될 수 없고 `String?` 만 가능하다. `dynamic` 으로 동적 타입도 쓸 수 있다.
- **Dart 3 기능:** 레코드(`(int, String)`), 패턴 매칭, `sealed` 클래스와 완전성 검사가 되는 `switch` 식.
- **메모리 관리:** 세대별 가비지 컬렉터.
- **동시성:** 단일 스레드 이벤트 루프 + `Future`/`async`/`await`, `Stream`. 병렬 처리는 메모리를 공유하지 않는 **isolate** 로 한다(`Isolate.run`).

## 개발 환경 시작하기
Flutter SDK에는 Dart SDK가 포함되어 있으므로 Flutter 개발이면 Flutter만 설치하면 된다. Dart만 쓸 때:

```bash
# macOS (Homebrew)
brew tap dart-lang/dart
brew trust dart-lang/dart   # dart.dev 안내에 포함된 단계 (서드파티 tap 신뢰)
brew install dart

# Windows
winget install --id=Google.DartSDK -e

# Linux(Debian/Ubuntu)는 dart.dev/get-dart 의 apt 저장소 등록 절차를 따른다
dart --version
```

패키지 매니저는 SDK에 포함된 **pub** 이고, 패키지 저장소는 [pub.dev](https://pub.dev/) 다.
```bash
dart create my_app              # 기본 템플릿 console (그 외 cli, package, server-shelf, web)
cd my_app
dart pub add http               # pubspec.yaml 에 의존성 추가
dart run                        # 실행
dart test                       # 테스트
dart compile exe bin/my_app.dart  # 네이티브 실행 파일
```

## 문법 한눈에 보기
```dart
sealed class Shape {}
class Circle extends Shape { Circle(this.r); final double r; }
class Square extends Shape { Square(this.side); final double side; }

double area(Shape s) => switch (s) {
      Circle(r: var r) => 3.14159 * r * r,
      Square(side: var a) => a * a,
    }; // sealed 라 모든 경우를 다뤄야 컴파일됨

class User {
  User(this.name, [this.age]);
  final String name;
  final int? age; // null 가능
}

int parseAge(String text) {
  final n = int.tryParse(text);
  if (n == null || n < 0) throw FormatException('invalid age: $text');
  return n;
}

Future<void> main() async {
  final users = [User('kim', 30), User('lee')];
  for (final u in users) print('${u.name} ${u.age ?? 0}');
  print(area(Circle(2)));
  try {
    parseAge('abc');
  } on FormatException catch (e) {
    print(e.message);
  }
  await Future.delayed(const Duration(milliseconds: 10));
}
```

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| UI | Flutter |
| 상태 관리(Flutter) | Provider, Riverpod, Bloc |
| 서버 | shelf, Dart Frog, Serverpod |
| 백엔드 연동 | Firebase(FlutterFire) |
| 코드 생성 | build_runner, json_serializable, freezed |
| 테스트 | package:test, flutter_test |

이 사이트에는 아직 Dart·Flutter 전용 항목이 없다.

## 언제 쓰나 / 약점
- **쓸 때:** 모바일·데스크톱·웹 UI를 한 코드베이스로 만들고 싶을 때(Flutter). 일관된 픽셀 단위 UI가 중요할 때.
- **약점:** Flutter 밖에서의 사용(서버·CLI)은 생태계가 작다. 웹 타깃은 번들 크기와 SEO 측면에서 일반 웹 프레임워크보다 불리하다. 직렬화 등에서 코드 생성(build_runner)에 의존하는 경우가 많다.
- **대안:** 네이티브 Apple 앱은 [Swift](/develop-wiki/languages/swift/), 웹 중심이면 [TypeScript](/develop-wiki/languages/typescript/).

## 공식 문서·학습 자료
- [Dart 언어 투어](https://dart.dev/language) · [Dart 가이드](https://dart.dev/guides)
- [Dart 설치](https://dart.dev/get-dart) · [dart create](https://dart.dev/tools/dart-create)
- [Effective Dart](https://dart.dev/effective-dart) — 스타일·설계 지침
- [pub.dev](https://pub.dev/) · [Flutter 문서](https://docs.flutter.dev/)
