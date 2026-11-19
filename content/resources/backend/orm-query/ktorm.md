---
name: Ktorm
url: https://www.ktorm.org
docs: https://www.ktorm.org/en/quick-start.html
repo: https://github.com/kotlin-orm/ktorm
stars: 2343
domain: backend
category: orm-query
description: JDBC 위에서 동작하는 경량 Kotlin ORM. 타입 안전 SQL DSL 과 컬렉션처럼 쓰는 엔티티 시퀀스 API 를 제공해, 설정 없이 Kotlin 코드로 쿼리를 쓸 때 쓴다.
pricing: oss
tags: [kotlin, orm, sql-dsl, jdbc, entity-sequence]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Ktorm 은 JDBC 위에 얹은 Kotlin ORM 이다. 테이블을 Kotlin `object` 로 선언하고, **SQL DSL** 과 `filter`·`sortedBy`·`toList` 같은 Kotlin 시퀀스 문법의 **엔티티 시퀀스 API** 두 가지로 쿼리한다. 엔티티는 인터페이스(`Entity<E>`)로 정의한다. 별도 XML·설정 없이 라이브러리 하나로 동작한다.

라이선스는 Apache-2.0 이다. 2026-11 기준 최신 릴리스는 v4.2.1(2026-06-20)이다. 릴리스 간격은 4.1.1(2024-09)→4.2.0(2026-05)로 길었으나 저장소는 활동 중이다. 같은 계열의 [Exposed](/develop-wiki/backend/orm-query/exposed/) 와 비슷한 위치다.

## 설치
Maven Central 에서 받는다. 데이터베이스별 기능은 방언 모듈로 분리돼 있다.
```kotlin
// build.gradle.kts
dependencies {
    implementation("org.ktorm:ktorm-core:4.2.1")
    implementation("org.ktorm:ktorm-support-postgresql:4.2.1")  // PostgreSQL 전용 기능이 필요할 때
}
```
저장소에는 MySQL·Oracle·PostgreSQL·SQLite·SQL Server 방언 모듈과 Jackson 연동(`ktorm-jackson`), KSP 모듈이 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Database.connect` | JDBC URL·사용자·비밀번호(또는 DataSource)로 연결 객체 생성 |
| `Table<E>` | 테이블 정의 `object`. 컬럼은 `int("id").primaryKey()` 처럼 선언 |
| `Entity<E>` | 인터페이스로 정의하는 엔티티. 컬럼은 `bindTo` 로 프로퍼티에 연결 |
| SQL DSL | `from` → `select` → `where` 로 쓰는 타입 안전 쿼리. 집계·조인·유니온 지원 |
| 엔티티 시퀀스 | `database.employees.filter { ... }.toList()` — 중간 연산이 쿼리를 만들고 종결 연산이 실행 |
| `useTransaction` | 블록 안을 한 트랜잭션으로 실행, 예외가 나면 롤백 |

## 기본 사용법
공식 퀵스타트 기반 예시다.
```kotlin
interface Department : Entity<Department> {
    companion object : Entity.Factory<Department>()
    val id: Int
    var name: String
}

object Departments : Table<Department>("t_department") {
    val id = int("id").primaryKey().bindTo { it.id }
    val name = varchar("name").bindTo { it.name }
}
val Database.departments get() = this.sequenceOf(Departments)

val database = Database.connect("jdbc:mysql://localhost:3306/ktorm", user = "root", password = "***")

// SQL DSL
database.from(Departments)
    .select(Departments.id, Departments.name)
    .where { Departments.name like "%dev%" }
    .forEach { row -> println(row[Departments.name]) }

// 엔티티 시퀀스
val list = database.departments.filter { it.id eq 1 }.toList()
```
Gradle 의 Kotlin 컴파일 옵션이나 컬럼 길이 지정 등 세부는 퀵스타트의 "엔티티와 컬럼 바인딩" 부분을 따른다.

## 자주 쓰는 패턴
- **트랜잭션**: `database.useTransaction { ... }` 안에서 실행한 쿼리는 하나의 트랜잭션이며, 확인 예외·비확인 예외 모두 롤백을 일으킨다.
- **조건 조합**: `(Employees.departmentId eq 1) and (Employees.name like "%vince%")` 처럼 연산자 함수로 조건을 조립한다.
- **집계·그룹**: 시퀀스의 `aggregateColumns`·`groupingBy` 로 집계 쿼리를 쓴다.
- **DB 전용 기능**: PostgreSQL·MySQL 등의 방언 모듈을 추가해 해당 DB 의 문법 확장을 쓴다.
- **연결 풀**: `Database.connect(dataSource)` 에 HikariCP 같은 DataSource 를 넘긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: JPA 의 프록시·영속성 컨텍스트 없이 SQL 과 가까운 Kotlin 쿼리를 쓰고 싶을 때, 가벼운 ORM 이 필요한 Kotlin 서버([Ktor](/develop-wiki/backend/web-framework/ktor/)·Spring)에서.
- 피할 때(대안): 활동이 활발한 JetBrains 제품이 필요하면 [Exposed](/develop-wiki/backend/orm-query/exposed/), 코드 생성형 타입 안전 SQL 이면 [jOOQ](/develop-wiki/backend/orm-query/jooq/), 표준 JPA 생태계는 [Hibernate ORM](/develop-wiki/backend/orm-query/hibernate-orm/) 을 고려한다. 릴리스가 드문 편이라 새 JDK·Kotlin 버전 대응은 확인이 필요하다.

## 공식 문서
- [퀵스타트](https://www.ktorm.org/en/quick-start.html) · [트랜잭션 관리](https://www.ktorm.org/en/transaction-management.html) · [문서 홈](https://www.ktorm.org/)
