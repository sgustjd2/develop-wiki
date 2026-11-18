---
name: go_router
url: https://pub.dev/packages/go_router
docs: https://pub.dev/documentation/go_router/latest/
repo: https://github.com/flutter/packages/tree/main/packages/go_router
stars: 5343
domain: mobile
category: cross-platform
description: Flutter 팀이 관리하는 선언형 라우팅 패키지. URL 기반 경로, 딥링크, 리다이렉트, 중첩·탭 네비게이션(ShellRoute)을 Navigator 2 위에서 간단한 API 로 제공한다.
pricing: oss
tags: [flutter, routing, navigation, deep-link]
languages: [dart]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
go_router 는 경로 문자열(`/users/:id`)로 화면을 선언하고 `context.go()` 로 이동하는 Flutter 라우터다. 딥링크·웹 URL 동기화, 로그인 여부에 따른 리다이렉트, 하단 탭 별 독립 네비게이션 스택을 지원한다. `flutter/packages` 모노레포에서 Flutter 팀이 유지한다. 별 수는 모노레포 전체 값이다.

- 최신 **18.1.4**(2026-11-09, pub.dev), BSD-3-Clause.

## 설치
```bash
flutter pub add go_router
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `GoRouter` | 경로 트리, 초기 위치, redirect 를 가진 라우터 설정 |
| `GoRoute` | `path`, `builder`, 하위 `routes` |
| `context.go` / `context.push` | 스택 교체 이동 / 스택에 쌓기 |
| 경로 파라미터 | `state.pathParameters['id']`, 쿼리는 `state.uri.queryParameters` |
| `redirect` | 전역·경로별 조건부 이동(인증 가드) |
| `ShellRoute` / `StatefulShellRoute` | 공통 레이아웃, 탭별 상태 유지 |
| `refreshListenable` | 인증 상태 변화 시 redirect 재평가 |

## 기본 사용법
```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
      routes: [
        GoRoute(
          path: 'users/:id',
          builder: (context, state) => UserPage(id: state.pathParameters['id']!),
        ),
      ],
    ),
  ],
);

void main() => runApp(MaterialApp.router(routerConfig: router));

class HomePage extends StatelessWidget {
  const HomePage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(child: ElevatedButton(
      onPressed: () => context.go('/users/42'),
      child: const Text('사용자 보기'))),
  );
}

class UserPage extends StatelessWidget {
  const UserPage({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('user $id')));
}
```

## 자주 쓰는 패턴
- **인증 가드.** `redirect: (context, state) => loggedIn ? null : '/login'` 로 비로그인 접근 차단.
- **탭 네비게이션.** `StatefulShellRoute.indexedStack` 으로 탭마다 스택을 보존한다.
- **이름 경로.** `GoRoute(name: 'user', ...)` 후 `context.goNamed('user', pathParameters: {'id': '1'})`.
- **타입 안전 경로.** 별도 패키지 `go_router_builder` 로 경로 클래스를 생성(선택).
- **`go` vs `push`.** 상세 화면에서 뒤로 가기를 쓰려면 `push`, URL 상태를 통째로 바꿀 땐 `go`.

## 언제 쓰나 / 피할 때
- 쓸 때: 딥링크·웹 지원이 필요한 Flutter 앱, 공식 계열 라우터를 선호할 때.
- 피할 때(대안): 아주 단순한 앱은 `Navigator.push`. 복잡한 중첩 라우팅·타입 안전을 중시하면 auto_route 같은 대안.

## 공식 문서
- [pub.dev 가이드](https://pub.dev/packages/go_router) · [API 문서](https://pub.dev/documentation/go_router/latest/) · [Flutter 네비게이션 문서](https://docs.flutter.dev/ui/navigation)
