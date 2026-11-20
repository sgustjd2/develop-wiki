---
name: Drift
url: https://drift.simonbinder.eu
docs: https://drift.simonbinder.eu/setup/
repo: https://github.com/simolus3/drift
stars: 3303
domain: mobile
category: cross-platform
description: Dart·Flutter 용 반응형 SQLite 영속성 라이브러리. Dart 로 테이블을 정의하고 타입 안전 쿼리·스트림 감시·마이그레이션을 코드 생성으로 제공한다. 이전 이름은 Moor.
pricing: oss
tags: [flutter, sqlite, database, orm]
languages: [dart]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Drift 는 SQLite 위에서 테이블·쿼리를 Dart 코드(또는 `.drift` SQL 파일)로 정의하면 `build_runner` 가 타입 안전한 API 를 생성해 주는 라이브러리다. 쿼리 결과를 `Stream` 으로 `watch()` 하면 테이블이 바뀔 때 자동 갱신되어 Flutter UI 와 잘 맞는다. Android·iOS·데스크톱·웹까지 지원한다.

- 최신 `drift` **2.35.4**(2026-11-08), `drift_flutter` 0.3.1(pub.dev), MIT.
- 대안: sqflite(저수준), Isar/ObjectBox(NoSQL), Kotlin 쪽의 [SQLDelight](/develop-wiki/mobile/cross-platform/sqldelight/).

## 설치
```bash
flutter pub add drift drift_flutter
flutter pub add dev:drift_dev dev:build_runner
dart run build_runner build   # *.g.dart 생성
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Table` | 컬럼을 getter 로 선언 (`integer()`, `text()`, `.autoIncrement()`) |
| `@DriftDatabase` | 테이블 목록을 지정하는 데이터베이스 클래스 |
| `Companion` | 삽입·갱신용 값 객체(`TodosCompanion.insert(...)`) |
| `select` / `watch` | 쿼리 실행 / 변경 구독 스트림 |
| `schemaVersion` + `MigrationStrategy` | 스키마 버전과 마이그레이션 |
| `drift_flutter` | 플랫폼별 연결 설정(`driftDatabase(name:)`) |
| 트랜잭션 | `transaction(() async { ... })` |

## 기본 사용법
```dart
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'database.g.dart';

class Todos extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text().withLength(min: 1, max: 100)();
  BoolColumn get done => boolean().withDefault(const Constant(false))();
}

@DriftDatabase(tables: [Todos])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'app'));
  @override
  int get schemaVersion => 1;

  Stream<List<Todo>> watchAll() => select(todos).watch();
  Future<int> add(String title) =>
      into(todos).insert(TodosCompanion.insert(title: title));
  Future<void> toggle(Todo t) =>
      (update(todos)..where((x) => x.id.equals(t.id)))
          .write(TodosCompanion(done: Value(!t.done)));
}
```

## 자주 쓰는 패턴
- **StreamBuilder 연결.** `StreamBuilder(stream: db.watchAll(), ...)` 또는 Riverpod 의 `StreamProvider` 로 노출.
- **조인·집계.** `select(todos).join([...])` 나 `.drift` 파일의 SQL 로 복잡한 쿼리를 작성한다.
- **마이그레이션.** `schemaVersion` 을 올리고 `onUpgrade` 에서 단계별 처리, `drift_dev schema` 도구로 검증.
- **테스트.** `NativeDatabase.memory()` 로 인메모리 DB 를 주입한다.
- **백그라운드 격리.** 큰 작업은 isolate 에서 DB 를 열어 UI 스레드 부하를 줄인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 관계형 데이터·반응형 쿼리·마이그레이션이 필요한 Flutter 앱.
- 피할 때(대안): 키-값 수준이면 shared_preferences. 코드 생성을 피하고 싶으면 sqflite 직접 사용.

## 공식 문서
- [시작하기](https://drift.simonbinder.eu/setup/) · [pub.dev](https://pub.dev/packages/drift) · [GitHub](https://github.com/simolus3/drift)
