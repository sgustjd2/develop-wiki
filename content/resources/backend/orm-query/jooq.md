---
name: jOOQ
url: https://www.jooq.org
docs: https://www.jooq.org/doc/latest/manual/
repo: https://github.com/jOOQ/jOOQ
stars: 6804
domain: backend
category: orm-query
description: DB 스키마에서 코드를 생성해 SQL 을 타입 안전한 Java DSL 로 쓰는 쿼리 빌더. 오픈소스판은 Apache-2.0 이고 상용 DB 지원은 유료 에디션이다.
pricing: oss
tags: [java, kotlin, sql, query-builder, codegen, dual-license]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
jOOQ 는 "SQL 을 중심에 두는" 쿼리 빌더다. 데이터베이스 스키마를 읽어 테이블·컬럼 클래스를 생성하고, `select`, `from`, `where` 같은 SQL 문법을 그대로 닮은 fluent API 로 쿼리를 쓴다. 컬럼 이름과 타입은 컴파일 시점에 검증되고, 방언(PostgreSQL, MySQL 등)별 SQL 차이는 렌더링 단계에서 흡수된다. 엔티티 상태를 추적하는 ORM(Hibernate)과 달리 쿼리를 직접 짜는 쪽이며, 결과 매핑은 Record·POJO·Kotlin data class 로 한다.

**라이선스는 이원화돼 있다.** 오픈소스 에디션은 Apache-2.0 이고 무료지만 **오픈소스 DB(PostgreSQL, MySQL, SQLite 등)만** 지원한다. Oracle·SQL Server 정식판과 Redshift·Aurora 등은 Professional 부터, DB2·Snowflake·BigQuery 같은 DB 는 Enterprise 에서 지원하는 유료 에디션이 필요하다. 가격은 Express 연 €99, Professional 연 €399, Enterprise 연 €799(부가세 별도, 플로팅 개발 워크스테이션당, 2026-11 공식 다운로드 페이지)다. Express 는 무료판에 Oracle XE·SQL Server Express 등 일부만 더한다. 3.21 기준 최소 Java 는 오픈소스 에디션 21, Express·Professional 11, Enterprise 8 이다. 최신은 **3.21.10**(2026-11-17)이며 3.20, 3.19 계열도 유지보수 릴리스가 나온다.

## 설치
```xml
<!-- Maven -->
<dependency>
  <groupId>org.jooq</groupId>
  <artifactId>jooq</artifactId>
  <version>3.21.10</version>
</dependency>
```
```kotlin
// Gradle (Kotlin DSL)
implementation("org.jooq:jooq:3.21.10")
```
코드 생성은 `jooq-codegen-maven` 플러그인 또는 Gradle 용 플러그인(커뮤니티 `nu.studer.jooq` 등)으로 JDBC 연결 정보와 대상 패키지를 설정해 실행한다. Flyway·Liquibase 로 만든 스키마나 DDL 파일을 기준으로 생성하는 방식도 지원한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `DSLContext` | 모든 쿼리의 진입점. `DSL.using(connection, SQLDialect.POSTGRES)` 로 생성 |
| 생성 클래스 | 테이블 상수(`AUTHOR`), 필드(`AUTHOR.NAME`), 레코드 클래스 |
| `Record` | 결과 한 행. 타입이 있는 `Record2<String, Integer>` 형태도 지원 |
| `fetchInto` / `into` | 결과를 POJO·Kotlin data class 로 매핑 |
| `SQLDialect` | 방언 지정. 같은 쿼리를 대상 DB 에 맞는 SQL 로 렌더링 |
| `multiset` / `row` | 중첩 컬렉션을 한 쿼리로 가져오는 기능 (JSON/XML 집계로 변환) |
| `Settings` | 실행 로그, 이름 렌더링, 낙관적 잠금 등 옵션 |

## 기본 사용법
```java
import static com.example.db.Tables.AUTHOR;   // 코드 생성 결과 (예시 패키지)
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.impl.DSL;
import java.sql.Connection;
import java.sql.DriverManager;

try (Connection conn = DriverManager.getConnection(url, user, pass)) {
    DSLContext ctx = DSL.using(conn, SQLDialect.POSTGRES);

    ctx.insertInto(AUTHOR, AUTHOR.NAME).values("Kim").execute();

    var names = ctx.select(AUTHOR.NAME)
                   .from(AUTHOR)
                   .where(AUTHOR.NAME.like("K%"))
                   .orderBy(AUTHOR.NAME)
                   .fetch(AUTHOR.NAME);       // List<String>
    System.out.println(names);
}
```

## 자주 쓰는 패턴
- **트랜잭션**: `ctx.transaction(cfg -> { DSL.using(cfg).insertInto(...).execute(); })`. 예외가 나면 롤백된다. Spring 에서는 `spring-boot-starter-jooq` 로 `DSLContext` 를 주입받고 `@Transactional` 과 함께 쓴다.
- **복잡한 SQL**: 윈도 함수, CTE(`with(...)`), `UNION`, `merge` 등 SQL 기능을 DSL 로 그대로 표현한다.
- **동적 쿼리**: `Condition` 객체를 `DSL.noCondition().and(...)` 로 조건부 조합한다.
- **중첩 결과**: `multiset(select(...))` 로 1:N 을 한 번에 가져와 N+1 을 피한다.
- **Kotlin**: 확장 함수 모듈(`jooq-kotlin`)과 data class 매핑으로 간결하게 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 이 핵심인 Java/Kotlin 서비스(리포팅, 복잡한 조인), 스키마 변경이 쿼리 컴파일 오류로 드러나길 원할 때.
- 피할 때(대안): 엔티티 상태 관리·지연 로딩이 필요하면 [Hibernate ORM](/develop-wiki/backend/orm-query/hibernate-orm/). Oracle·SQL Server 정식판을 쓰는데 유료 에디션 예산이 없다면 도입 전 라이선스 범위를 확인한다. 오픈소스 에디션은 Java 21 이상이 필요하다.

## 공식 문서
- [매뉴얼](https://www.jooq.org/doc/latest/manual/) · [다운로드·에디션](https://www.jooq.org/download/) · [Javadoc](https://www.jooq.org/javadoc/latest/)
- 언어: [Java](/develop-wiki/languages/java/) · [Kotlin](/develop-wiki/languages/kotlin/)
