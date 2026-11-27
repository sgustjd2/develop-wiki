---
name: Bloc
url: https://bloclibrary.dev
docs: https://bloclibrary.dev/getting-started/
repo: https://github.com/felangel/bloc
stars: 12493
domain: mobile
category: cross-platform
description: Dart·Flutter 용 BLoC 상태 관리 패키지 모음(bloc, flutter_bloc). 이벤트→상태 스트림 구조와 간단한 Cubit 으로 UI 와 비즈니스 로직을 분리하고 bloc_test 로 검증한다.
pricing: oss
tags: [flutter, state-management, bloc, cubit]
languages: [dart]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Bloc 은 UI 가 보낸 이벤트(또는 메서드 호출)를 비즈니스 로직이 새 상태로 바꿔 스트림으로 내보내는 패턴을 구현한 라이브러리다. 이벤트 없이 메서드로 상태를 바꾸는 **Cubit** 과 이벤트 기반 **Bloc** 두 가지를 제공한다. 상태 전이가 모두 기록·관찰되어 대규모 팀의 일관된 구조에 유리하다. 대안은 [Riverpod](/develop-wiki/mobile/cross-platform/riverpod/).

- 패키지: `bloc` **9.2.1**, `flutter_bloc` **9.1.1**(2025-05, pub.dev), MIT.

## 설치
```bash
flutter pub add flutter_bloc
flutter pub add dev:bloc_test   # 테스트
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Cubit<State>` | `emit(newState)` 로 상태를 바꾸는 간단한 형태 |
| `Bloc<Event, State>` | `on<Event>` 핸들러가 이벤트를 상태로 변환 |
| `BlocProvider` | 트리에 Bloc 을 주입 (`context.read<T>()`) |
| `BlocBuilder` | 상태에 따라 UI 빌드 |
| `BlocListener` | 상태 변화에 부수 효과(네비게이션, 스낵바) |
| `BlocSelector` | 상태 일부만 구독 |
| `Transformer` | 이벤트 처리 방식 (`droppable`, `restartable` 등 bloc_concurrency) |

## 기본 사용법
```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);
  void increment() => emit(state + 1);
}

void main() => runApp(MaterialApp(
  home: BlocProvider(create: (_) => CounterCubit(), child: const CounterPage()),
));

class CounterPage extends StatelessWidget {
  const CounterPage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(child: BlocBuilder<CounterCubit, int>(
      builder: (_, count) => Text('$count'))),
    floatingActionButton: FloatingActionButton(
      onPressed: () => context.read<CounterCubit>().increment()),
  );
}
```

## 자주 쓰는 패턴
- **Bloc 이벤트 정의.** `sealed class` 로 이벤트·상태를 선언하면 `switch` 에서 누락을 컴파일러가 잡는다.
- **상태 동등성.** `Equatable` 을 쓰거나 `==` 를 정의해야 같은 상태의 중복 리빌드를 막는다.
- **테스트.** `blocTest<CounterCubit, int>('증가', build: CounterCubit.new, act: (c) => c.increment(), expect: () => [1]);`
- **디바운스.** 검색 Bloc 은 `on<Search>(..., transformer: debounce())` 로 이벤트 변환.
- **Repository 주입.** `RepositoryProvider` 로 데이터 계층을 주입하고 Bloc 은 인터페이스만 의존.

## 언제 쓰나 / 피할 때
- 쓸 때: 상태 전이를 추적·로깅해야 하는 팀, 이벤트 중심 설계, 테스트 규약이 필요한 큰 앱.
- 피할 때(대안): 보일러플레이트가 부담되면 Riverpod 이나 Cubit 만 사용. 단순 화면은 `ValueNotifier`.

## 공식 문서
- [시작하기](https://bloclibrary.dev/getting-started/) · [pub.dev flutter_bloc](https://pub.dev/packages/flutter_bloc) · [GitHub](https://github.com/felangel/bloc)
