---
name: Java
summary: JVM 위에서 실행되는 정적 타입 객체지향 언어. 오랜 하위 호환성과 성숙한 생태계로 기업용 백엔드, 대규모 서비스, 안드로이드 기반 기술에 널리 쓴다.
paradigms: [객체지향, 명령형, 함수형, 제네릭]
typing: static
execution: vm
firstAppeared: 1995
officialSite: https://dev.java/
docs: https://docs.oracle.com/en/java/javase/
useCases: [기업용 백엔드·API, 대규모 분산 시스템, 빅데이터 처리, 금융·공공 시스템, 안드로이드(레거시·라이브러리)]
sources:
  - https://openjdk.org/projects/jdk/27/
  - https://openjdk.org/jeps/512
  - https://docs.gradle.org/current/userguide/build_init_plugin.html
  - https://dev.java/
updatedAt: 2026-11-18
---

## 개요
Java는 Sun Microsystems에서 만들어 1995년 공개된 언어로, 현재는 Oracle과 OpenJDK 커뮤니티가 개발한다. 소스를 플랫폼 독립적인 바이트코드로 컴파일하고 JVM(Java Virtual Machine)이 이를 JIT 컴파일해 실행한다.

- 6개월마다(3월·9월) 새 기능 릴리스가 나온다. 2026-11 기준 최신 릴리스는 **JDK 27**(2026-09-15 GA)이고, 장기 지원(LTS) 최신은 **JDK 25**(2025-09)다. 운영 환경은 보통 LTS 를 기준으로 한다.
- JDK 배포판은 Oracle JDK 외에 Eclipse Temurin, Amazon Corretto, Microsoft Build of OpenJDK 등 여러 벤더가 OpenJDK 를 빌드해 제공한다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 정적·명목적 타입, 제네릭(타입 소거), 지역 변수 추론(`var`), `record`, `sealed` 계층, `switch` 패턴 매칭 |
| 메모리 관리 | 가비지 컬렉션(G1, ZGC 등 선택 가능) |
| 동시성 | OS 스레드 + 가상 스레드(JDK 21+, 대량의 블로킹 작업을 가볍게 처리), `java.util.concurrent` |
| 실행 | `javac` → 바이트코드(`.class`) → JVM 이 해석·JIT 컴파일. GraalVM 으로 네이티브 이미지 AOT 도 가능 |
| 에러 처리 | 예외. 검사 예외(checked)는 선언·처리를 컴파일러가 강제 |
| 호환성 | 오래된 바이트코드·라이브러리가 새 JVM 에서 대체로 그대로 동작 |

## 개발 환경 시작하기
1. JDK 설치 — [dev.java](https://dev.java/) 안내나 각 벤더 배포판(Temurin, Corretto 등)을 받는다. SDKMAN!(`sdk install java`)으로 여러 버전을 관리하는 방법도 흔하다.
2. 단일 파일은 컴파일 없이 바로 실행할 수 있다. JDK 25 부터 `main` 메서드와 클래스 선언을 생략한 간결한 소스 파일이 정식 기능이다.

```java
// Hello.java
void main() {
    IO.println("Hello, Java");
}
```

```bash
java Hello.java          # 소스 파일 직접 실행
```

3. 실제 프로젝트는 빌드 도구로 만든다. 의존성은 Maven Central 저장소에서 받는다.

```bash
# Gradle
gradle init --type java-application --dsl kotlin
./gradlew run
./gradlew test

# Maven
mvn archetype:generate -DgroupId=com.example -DartifactId=hello -DarchetypeArtifactId=maven-archetype-quickstart -DarchetypeVersion=1.5 -DinteractiveMode=false
cd hello
mvn package
```

## 문법 한눈에 보기
```java
import java.util.List;
import java.util.Optional;

// record: 불변 데이터 클래스 (생성자·equals·toString 자동)
record User(int id, String name) {}

// sealed 계층 + switch 패턴 매칭
sealed interface Shape {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}

static double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.r() * c.r();
        case Square q -> q.side() * q.side();
    };
}

static Optional<User> find(List<User> users, int id) {
    return users.stream().filter(u -> u.id() == id).findFirst();
}

void main() {
    var users = List.of(new User(1, "Kim"), new User(2, "Lee"));
    find(users, 2).ifPresent(u -> IO.println("찾음: " + u.name()));

    try {
        int n = Integer.parseInt("abc");
    } catch (NumberFormatException e) {
        IO.println("변환 실패: " + e.getMessage());
    }
    IO.println(area(new Square(3)));
}
```
위 코드는 JDK 25+ 의 간결한 소스 파일 형식이라 `java Main.java` 로 바로 실행된다. 일반 프로젝트에서는 `public class Main { public static void main(String[] args) { ... } }` 구조를 쓴다.

## 생태계
**백엔드**
- [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) — Java 백엔드의 사실상 표준 프레임워크. 그 밖에 Quarkus, Micronaut, Jakarta EE.
- 관측성: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) Java 에이전트

**AI**
- 에이전트·LLM: [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/) · [Google ADK](/develop-wiki/ai/agent-framework/google-adk/)
- 도구 연동: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) Java SDK

**테스트**: JUnit, Mockito, [Playwright](/develop-wiki/frontend/testing/playwright/) Java 바인딩.

**데이터·인프라**: Kafka, Elasticsearch, Hadoop·Spark 등 JVM 기반 대형 오픈소스가 많다. 빌드 도구는 Gradle·Maven, ORM 은 Hibernate(JPA).

## 언제 쓰나 / 약점
- **쓸 때**
  - 장기간 유지보수할 기업용 시스템 — 하위 호환성과 인력 풀이 강점.
  - 처리량이 높은 서버. 가상 스레드로 블로킹 I/O 코드도 확장하기 쉬워졌다.
  - JVM 생태계(Kafka, Spark 등)와 긴밀히 붙어야 할 때.
- **약점**
  - 다른 현대 언어 대비 코드가 장황한 편(최근 버전에서 많이 줄었지만 기존 코드베이스는 여전함).
  - JVM 기동 시간·메모리 사용량이 커서 짧게 뜨는 CLI·서버리스에는 불리(GraalVM 네이티브 이미지로 완화 가능).
  - 널 안전성이 타입 시스템에 없어 `NullPointerException` 위험이 남아 있다.
  - JDK 벤더·LTS 선택, 라이선스 조건을 조직 차원에서 정해야 한다.

## 공식 문서·학습 자료
- [dev.java — 학습 자료](https://dev.java/learn/) · [Java SE 문서](https://docs.oracle.com/en/java/javase/)
- [OpenJDK](https://openjdk.org/) · [JDK 27 프로젝트 페이지](https://openjdk.org/projects/jdk/27/) · [JEP 목록](https://openjdk.org/jeps/0)
- [JEP 512: 간결한 소스 파일과 인스턴스 main](https://openjdk.org/jeps/512)
- [Gradle 프로젝트 초기화](https://docs.gradle.org/current/userguide/build_init_plugin.html) · [Maven 시작하기](https://maven.apache.org/guides/getting-started/)
