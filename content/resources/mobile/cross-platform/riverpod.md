---
name: Riverpod
url: https://riverpod.dev
docs: https://riverpod.dev/docs/introduction/getting_started
repo: https://github.com/rrousselGit/riverpod
stars: 7427
domain: mobile
category: cross-platform
description: Flutter·Dart 용 반응형 상태 관리·의존성 주입 라이브러리. Provider 의 후속으로 컴파일 타임 안전성, 비동기 상태(AsyncValue), 캐싱, 테스트 용이성을 제공한다.
pricing: oss
tags: [flutter, state-management, dependency-injection, provider]
languages: [dart]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Riverpod 은 위젯 트리 밖에서 선언하는 **Provider** 로 상태와 의존성을 정의하고, 위젯은 `ref.watch` 로 구독하는 방식의 상태 관리 라이브러리다. `BuildContext` 에 의존하지 않아 테스트·재사용이 쉽고, 비동기 값은 `AsyncValue`(loading/data/error)로 일관되게 다룬다. [Flutter](/develop-wiki/mobile/cross-platform/flutter/) 의 대표적 상태 관리 선택지이며 [Bloc](/develop-wiki/mobile/cross-platform/bloc/) 이 이벤트 중심의 대안이다.

- 패키지 최신: `flutter_riverpod` **3.5.0**(2026-11-06, pub.dev), MIT. 3.x 에서는 StateNotifierProvider 같은 구형 API 가 `legacy.dart` 로 분리됐다. 공식 마이그레이션 문서를 확인한다.
- 코드 생성(`riverpod_generator`, `@riverpod`)은 선택 사항이다. 아래 예제는 생성 없이 쓴다.

## 설치
```bash
flutter pub add flutter_riverpod
# 선택: 코드 생성
flutter pub add riverpod_annotation dev:riverpod_generator dev:build_runner
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ProviderScope` | 앱 루트에 두는 Provider 저장소 |
| `Provider` | 읽기 전용 값·의존성 |
| `NotifierProvider` | 변경 메서드를 가진 `Notifier` 로 동기 상태 관리 |
| `FutureProvider` / `AsyncNotifierProvider` | 비동기 값, 결과는 `AsyncValue` |
| `ref.watch` / `ref.read` / `ref.listen` | 구독해 리빌드 / 1회 읽기(이벤트 핸들러) / 부수 효과 |
| `ConsumerWidget` | `ref` 를 받는 위젯 |
| `family` | 인자별로 Provider 인스턴스를 만든다 |
| `autoDispose` | 구독자가 없으면 상태 폐기 |

## 기본 사용법
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class Counter extends Notifier<int> {
  @override
  int build() => 0;
  void increment() => state++;
}

final counterProvider = NotifierProvider<Counter, int>(Counter.new);

final userProvider = FutureProvider<String>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 300));
  return '홍길동';
});

void main() => runApp(const ProviderScope(child: MaterialApp(home: Home())));

class Home extends ConsumerWidget {
  const Home({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    final user = ref.watch(userProvider);
    return Scaffold(
      body: Center(child: Text(user.when(
        data: (n) => '$n: $count', loading: () => '...', error: (e, _) => '오류'))),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(counterProvider.notifier).increment()),
    );
  }
}
```

## 자주 쓰는 패턴
- **선택 구독.** `ref.watch(userProvider.select((u) => u.name))` 로 필요한 필드 변경에만 리빌드.
- **Provider 간 의존.** 한 Provider 안에서 `ref.watch(otherProvider)` 하면 의존 값이 바뀔 때 자동 재계산.
- **테스트.** `ProviderContainer(overrides: [apiProvider.overrideWithValue(FakeApi())])`.
- **일회성 효과.** 스낵바·네비게이션은 `ref.listen` 으로 처리하고 `build` 안에서 하지 않는다.
- **인자별 캐시.** `FutureProvider.family<User, int>((ref, id) => ...)`.

## 언제 쓰나 / 피할 때
- 쓸 때: 비동기 데이터와 의존성이 많은 중·대형 Flutter 앱, 위젯 밖 로직 테스트.
- 피할 때(대안): 이벤트·상태 전이를 엄격히 기록하려는 팀은 Bloc. 아주 작은 앱은 `setState`/`ValueNotifier` 로 충분하다.

## 공식 문서
- [시작하기](https://riverpod.dev/docs/introduction/getting_started) · [pub.dev](https://pub.dev/packages/flutter_riverpod) · [GitHub](https://github.com/rrousselGit/riverpod)
