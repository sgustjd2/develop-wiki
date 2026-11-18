---
name: Hibernate ORM
url: https://hibernate.org/orm/
docs: https://hibernate.org/orm/documentation/
repo: https://github.com/hibernate/hibernate-orm
stars: 6488
domain: backend
category: orm-query
description: Jakarta Persistence(JPA) 표준의 대표 구현체인 Java ORM. Spring Data JPA 와 함께 Java·Kotlin 서버에서 엔티티 매핑과 트랜잭션 처리에 쓴다.
pricing: oss
tags: [java, kotlin, jpa, orm, spring-data]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hibernate ORM 은 Java 객체(엔티티)와 관계형 테이블을 매핑하는 ORM 으로, Jakarta Persistence(JPA) 명세의 사실상 표준 구현이다. 영속성 컨텍스트가 엔티티 상태를 추적해 트랜잭션 커밋 시 변경을 자동으로 반영(dirty checking)하고, 1차 캐시·지연 로딩·배치 쓰기를 제공한다. [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 의 `spring-boot-starter-data-jpa` 가 Hibernate 를 기본 JPA 공급자로 쓰며, 그 위의 **Spring Data JPA** 가 인터페이스 선언만으로 리포지토리 구현을 만들어 준다.

**버전(2026-11)**: 안정 라인은 **7.x**(최신 7.4.16, Jakarta Persistence 3.2, Java 17+)이고 **8.0** 이 CR(후보) 단계다. 7.0 부터 라이선스가 LGPL 에서 **Apache-2.0** 으로 바뀌었다. Spring Data JPA 는 4.x(최신 4.1.2, Spring Boot 4 와 함께 사용).

## 설치
Spring Boot 프로젝트(Gradle Kotlin DSL) 기준. 버전은 Boot BOM 이 관리한다.
```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("org.postgresql:postgresql")
}
```
```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/app
spring.datasource.username=app
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=validate
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 엔티티 | `@Entity` 클래스. `@Id`, `@GeneratedValue`, `@Column` 으로 매핑 |
| 영속성 컨텍스트 | `EntityManager`(Hibernate `Session`)가 관리하는 엔티티 집합. 같은 트랜잭션 안에서 동일성 보장 |
| 변경 감지 | 관리 상태 엔티티의 필드를 바꾸면 커밋 시 UPDATE 가 자동 실행 |
| 연관관계 | `@ManyToOne`, `@OneToMany(mappedBy=...)`. `FetchType.LAZY` 권장 |
| JPQL / Criteria | 엔티티 기준 쿼리 언어와 타입 안전 쿼리 API |
| Spring Data 리포지토리 | `JpaRepository<T, ID>` 상속 + 메서드 이름 규칙(`findByEmail`) 또는 `@Query` |

## 기본 사용법
```java
import jakarta.persistence.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Entity
class Todo {
    @Id @GeneratedValue Long id;
    String title;
    boolean done;
    protected Todo() {}
    Todo(String title) { this.title = title; }
}

interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findByDoneFalseOrderByIdDesc();
}

@Service
class TodoService {
    private final TodoRepository repo;
    TodoService(TodoRepository repo) { this.repo = repo; }

    @Transactional
    void complete(Long id) {
        repo.findById(id).orElseThrow().done = true;   // 커밋 시 UPDATE 자동 실행
    }
}
```

## 자주 쓰는 패턴
- **N+1 해결**: 목록 조회 시 `@EntityGraph(attributePaths = "author")` 나 JPQL `join fetch` 로 연관 엔티티를 한 번에 읽는다.
- **DTO 프로젝션**: 읽기 전용 화면은 엔티티 대신 `record` 프로젝션(`select new ...` 또는 인터페이스 프로젝션)으로 필요한 컬럼만 조회한다.
- **스키마 관리**: 운영에서는 `ddl-auto=validate` 또는 `none` 으로 두고 Flyway·Liquibase 로 마이그레이션한다.
- **배치 쓰기**: `hibernate.jdbc.batch_size` 설정과 시퀀스 기반 ID 로 INSERT 를 묶는다(IDENTITY 전략은 배치 INSERT 를 막는다).
- **Open Session in View 끄기**: `spring.jpa.open-in-view=false` 로 웹 계층의 지연 로딩 쿼리를 막고, 필요한 데이터는 서비스 계층에서 로딩한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Spring·Jakarta EE 기반 도메인 모델 중심 애플리케이션, 엔티티 관계가 풍부한 업무 시스템.
- 피할 때(대안): SQL 을 직접 통제해야 하는 리포팅·대량 처리는 jOOQ·MyBatis·Spring `JdbcClient`, Kotlin 전용 경량 DSL 이 필요하면 Exposed.

## 공식 문서
- [Hibernate ORM 문서](https://hibernate.org/orm/documentation/) · [릴리스](https://hibernate.org/orm/releases/) · [Spring Data JPA 레퍼런스](https://docs.spring.io/spring-data/jpa/reference/) · [Spring Boot 데이터 접근](https://docs.spring.io/spring-boot/reference/data/sql.html)
