---
name: Exposed
url: https://www.jetbrains.com/exposed/
docs: https://www.jetbrains.com/help/exposed/home.html
repo: https://github.com/JetBrains/Exposed
stars: 9304
domain: backend
category: orm-query
description: JetBrains 가 만든 Kotlin SQL 라이브러리로, 타입 안전 SQL DSL 과 경량 DAO API 를 함께 제공한다. Kotlin 서버(Ktor·Spring)에서 JPA 대신 Kotlin 다운 DB 접근을 원할 때 쓴다.
pricing: oss
tags: [kotlin, orm, sql-dsl, jdbc, r2dbc]
languages: [kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Exposed 는 JDBC·R2DBC 드라이버 위에서 동작하는 Kotlin 전용 DB 라이브러리다. 두 가지 접근 방식을 제공한다.

- **DSL**: 테이블을 `object` 로 선언하고 `selectAll().where { ... }` 처럼 SQL 에 가까운 타입 안전 쿼리를 쓴다.
- **DAO**: `IntEntity` 같은 엔티티 클래스로 행을 객체처럼 다룬다. JPA 보다 훨씬 얇다(지연 로딩 프록시·영속성 컨텍스트 없음).

모든 DB 작업은 `transaction { }` 블록 안에서 실행된다. H2, MariaDB, MySQL, Oracle, PostgreSQL, SQL Server, SQLite 를 지원한다.

라이선스는 Apache-2.0. **1.0 에서 패키지가 `org.jetbrains.exposed.v1.*` 로 바뀌었고**(0.x 코드는 import 수정 필요) R2DBC 지원이 추가됐다. 2026-11 기준 최신은 **1.6.1**(2026-11-04), Kotlin 2.2 이상이 필요하다. Spring Boot 3·4 스타터와 Spring 트랜잭션 매니저 모듈이 있다.

## 설치
```kotlin
// build.gradle.kts
dependencies {
    implementation("org.jetbrains.exposed:exposed-core:1.6.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:1.6.1")
    implementation("org.jetbrains.exposed:exposed-dao:1.6.1")              // DAO 를 쓸 때
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:1.6.1")  // 날짜 타입
    implementation("org.postgresql:postgresql:42.7.14")                     // 운영 DB 드라이버
    implementation("com.h2database:h2:2.5.252")                             // 아래 예제용 인메모리 DB
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Table` / `IntIdTable` | 테이블 정의 객체. 컬럼은 `varchar("name", 50)`, `integer(...)`, `reference(...)` |
| `Database.connect` | JDBC URL·DataSource 로 연결 등록 (HikariCP 풀 권장) |
| `transaction { }` | 모든 쿼리의 실행 단위. 블록이 끝나면 커밋, 예외면 롤백 |
| DSL 쿼리 | `insert`, `selectAll().where`, `select(cols)`, `update`, `deleteWhere`, `innerJoin` |
| DAO 엔티티 | `IntEntity` + `IntEntityClass` 동반 객체. `new {}`, `findById`, `find {}` |
| 관계 | DAO 의 `referencedOn`(N:1), `referrersOn`(1:N), `via`(N:M) |
| `SchemaUtils` | 개발용 테이블 생성·삭제. 운영 마이그레이션은 Flyway 등과 조합 |
| 모듈 | `exposed-core`, `-jdbc`, `-r2dbc`, `-dao`, `-json`, `-java-time`, `-migration-*` |

## 기본 사용법
```kotlin
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

object Todos : Table("todos") {
    val id = integer("id").autoIncrement()
    val title = varchar("title", 200)
    val done = bool("done").default(false)
    override val primaryKey = PrimaryKey(id)
}

fun main() {
    Database.connect("jdbc:h2:mem:test;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
    transaction {
        SchemaUtils.create(Todos)
        val newId = Todos.insert { it[title] = "write docs" } get Todos.id
        Todos.update({ Todos.id eq newId }) { it[done] = true }
        Todos.selectAll().where { Todos.done eq true }
            .forEach { println("${it[Todos.id]} ${it[Todos.title]}") }
    }
}
```

## 자주 쓰는 패턴
- **DAO 엔티티**: `object Users : IntIdTable()` + `class User(id: EntityID<Int>) : IntEntity(id) { companion object : IntEntityClass<User>(Users); var name by Users.name }` 로 선언하고 `User.new { name = "a" }` 로 저장한다.
- **SQL 로그**: 트랜잭션 안에서 `addLogger(StdOutSqlLogger)` 로 실행 SQL 을 확인한다.
- **코루틴**: 1.x 에서는 JDBC·R2DBC 모두 `suspendTransaction { }` 을 쓴다(기존 `newSuspendedTransaction` 은 deprecated). 완전한 논블로킹이 필요하면 `exposed-r2dbc` 를 쓰되 R2DBC 용 DAO 는 아직 실험 단계다.
- **Spring 연동**: `exposed-spring-boot4-starter`(Spring Boot 4) 또는 `-starter`(Boot 3)로 `@Transactional` 과 함께 쓴다.
- **N+1 방지**: DAO 에서 연관을 미리 읽을 때 `.with(User::city)` 로 eager loading 한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Kotlin 서버(Ktor, [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/))에서 SQL 을 명시적으로 쓰면서 타입 안전성을 원할 때, JPA 의 프록시·더티 체킹 같은 숨은 동작을 피하고 싶을 때.
- 피할 때(대안): 성숙한 JPA 생태계(2차 캐시, 복잡한 매핑)가 필요하면 [Hibernate ORM](/develop-wiki/backend/orm-query/hibernate-orm/), SQL 파일에서 Kotlin 코드를 생성하고 싶으면 [sqlc](/develop-wiki/backend/orm-query/sqlc/)(sqlc-gen-kotlin) 나 jOOQ.

## 공식 문서
- [문서](https://www.jetbrains.com/help/exposed/home.html) · [DSL 시작하기](https://www.jetbrains.com/help/exposed/getting-started-with-exposed.html) · [1.0 마이그레이션 가이드](https://www.jetbrains.com/help/exposed/migration-guide-1-0-0.html) · [Breaking changes](https://www.jetbrains.com/help/exposed/breaking-changes.html)
- 언어: [Kotlin](/develop-wiki/languages/kotlin/)
