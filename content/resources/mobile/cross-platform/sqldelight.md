---
name: SQLDelight
url: https://sqldelight.github.io/sqldelight/
docs: https://sqldelight.github.io/sqldelight/latest/multiplatform_sqlite/
repo: https://github.com/sqldelight/sqldelight
stars: 6903
domain: mobile
category: cross-platform
description: SQL 문에서 타입 안전한 Kotlin API 를 생성하는 라이브러리. 스키마·쿼리·마이그레이션을 컴파일 시점에 검증하고 Android·iOS·JVM·JS 를 지원하는 Kotlin Multiplatform 의 대표 DB 계층이다.
pricing: oss
tags: [kotlin-multiplatform, sqlite, database, codegen]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
SQLDelight 는 ORM 이 SQL 을 숨기는 것과 반대로 `.sq` 파일에 직접 SQL 을 쓰면 그에 맞는 Kotlin 함수를 생성한다. 쿼리 오류가 빌드 시점에 드러나고, 결과를 `Flow` 로 구독할 수 있다. 플랫폼별 드라이버(android-driver, native-driver, sqlite-driver 등)만 바꿔 공통 코드를 공유하므로 [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/) 의 DB 선택지로 흔하다.

- 최신 릴리스 **2.4.1**(2026-10-06), Apache-2.0. 문서 예제는 아직 2.4.0 을 표기하므로 실제 적용 시 최신 버전을 확인한다.
- 대안: Room(KMP 지원), Flutter 쪽 [Drift](/develop-wiki/mobile/cross-platform/drift/).

## 설치
Gradle 플러그인 id `app.cash.sqldelight`(공식 문서 기준).
```kotlin
// build.gradle.kts
plugins { id("app.cash.sqldelight") version "2.4.1" }

sqldelight {
    databases {
        create("AppDatabase") { packageName.set("com.example.db") }
    }
}

kotlin {
    sourceSets {
        androidMain.dependencies { implementation("app.cash.sqldelight:android-driver:2.4.1") }
        nativeMain.dependencies { implementation("app.cash.sqldelight:native-driver:2.4.1") }
        commonMain.dependencies { implementation("app.cash.sqldelight:coroutines-extensions:2.4.1") }
    }
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `.sq` 파일 | `src/commonMain/sqldelight/` 의 SQL. 테이블 정의와 이름 붙은 쿼리 |
| 생성된 `Queries` | 라벨을 붙인 SQL 마다 Kotlin 함수가 생성됨 |
| `SqlDriver` | 플랫폼별 SQLite 연결 구현 |
| `.sqm` | 마이그레이션 파일(버전 N→N+1) |
| `asFlow()` | `coroutines-extensions` 로 쿼리 결과를 Flow 로 감시 |
| 컬럼 어댑터 | Kotlin 타입(예: `Instant`)과 SQL 타입 간 변환 |

## 기본 사용법
```sql
-- Todo.sq
CREATE TABLE todo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);

selectAll:
SELECT * FROM todo ORDER BY id DESC;

insertTodo:
INSERT INTO todo(title) VALUES (?);
```
```kotlin
val db = AppDatabase(driver)   // driver: 플랫폼별 SqlDriver
db.todoQueries.insertTodo("공부")
val todos: List<Todo> = db.todoQueries.selectAll().executeAsList()

// Flow
db.todoQueries.selectAll().asFlow().mapToList(Dispatchers.IO)
```

## 자주 쓰는 패턴
- **expect/actual 드라이버 팩토리.** 공통 코드에서 `DriverFactory` 를 선언하고 Android(`AndroidSqliteDriver`)·iOS(`NativeSqliteDriver`)에서 구현한다.
- **마이그레이션 검증.** `.sqm` 을 추가하고 `verifyMigrations` 설정으로 빌드 시 스키마 일치를 확인한다.
- **트랜잭션.** `db.transaction { ... }` 로 묶어 일괄 쓰기.
- **DI.** [Koin](/develop-wiki/mobile/cross-platform/koin/) 등으로 `AppDatabase` 를 싱글톤 제공.
- **테스트.** JVM 에서 인메모리 `JdbcSqliteDriver` 사용.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 을 직접 다루고 싶은 KMP·Android 앱, 컴파일 타임 쿼리 검증이 필요할 때.
- 피할 때(대안): 객체 매핑 중심이면 Room. 단순 설정 저장은 DataStore/multiplatform-settings.

## 공식 문서
- [멀티플랫폼 SQLite 시작하기](https://sqldelight.github.io/sqldelight/latest/multiplatform_sqlite/) · [GitHub](https://github.com/sqldelight/sqldelight)
