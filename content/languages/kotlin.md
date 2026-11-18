---
name: Kotlin
summary: JetBrains가 만든 간결한 정적 타입 언어. JVM에서 Java와 완전히 호환되며 널 안전성과 코루틴을 갖춰 안드로이드 앱과 서버 개발에 많이 쓴다.
paradigms: [객체지향, 함수형, 명령형]
typing: static
execution: vm
firstAppeared: 2011
officialSite: https://kotlinlang.org/
docs: https://kotlinlang.org/docs/home.html
useCases: [안드로이드 앱, 서버·백엔드(JVM), 멀티플랫폼 모바일(Kotlin Multiplatform), 빌드 스크립트(Gradle Kotlin DSL)]
sources:
  - https://kotlinlang.org/docs/releases.html
  - https://kotlinlang.org/docs/jvm-get-started.html
  - https://docs.gradle.org/current/userguide/build_init_plugin.html
  - https://kotlinlang.org/docs/home.html
updatedAt: 2026-11-18
---

## 개요
Kotlin은 JetBrains가 2011년 공개하고 2016년 1.0을 낸 언어다. 주 타깃은 JVM이며 Java 코드·라이브러리를 그대로 섞어 쓸 수 있다. Google이 안드로이드 개발의 우선 언어로 지정한 뒤 모바일에서 주류가 되었고, Spring 등 서버 쪽에서도 널리 쓰인다.

- 2026-11 기준 최신 안정 버전은 **Kotlin 2.4.21**(2026-10-08, 2.4.x 버그 수정 릴리스). 2.0 부터 새 컴파일러 프런트엔드 K2 가 기본이다.
- JVM 외에 Kotlin/JS, Kotlin/Wasm, Kotlin/Native 타깃이 있고, Kotlin Multiplatform 으로 iOS·안드로이드·데스크톱 간 코드를 공유할 수 있다. 메타데이터의 `execution: vm` 은 주 타깃인 JVM 기준이다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 정적 타입, 강한 타입 추론, 널 가능 타입(`String?`)을 타입 시스템에서 구분, `data`·`sealed` 클래스, 확장 함수 |
| 메모리 관리 | JVM 타깃은 JVM 의 가비지 컬렉션 |
| 동시성 | 코루틴(`suspend` 함수, `kotlinx.coroutines` 라이브러리)과 구조화된 동시성, `Flow` |
| 실행 | JVM 바이트코드로 컴파일되어 JVM 에서 실행. Native 타깃은 LLVM 으로 기계어 생성 |
| Java 호환 | 같은 프로젝트에서 Java 클래스를 호출·상속 가능, 반대 방향도 가능 |
| 에러 처리 | 예외 사용(검사 예외 없음). `runCatching`/`Result` 로 값처럼 다룰 수도 있음 |

## 개발 환경 시작하기
1. JDK 를 설치한다(Kotlin/JVM 은 JDK 위에서 동작).
2. IDE 는 **IntelliJ IDEA**(Kotlin 플러그인 내장)나 안드로이드라면 **Android Studio** 가 기본 경로다. IntelliJ 에서 *File → New → Project → Kotlin* 을 고르고 빌드 시스템(Gradle/Maven)을 선택한다.
3. CLI 로 만들 때는 Gradle 의 초기화 기능을 쓴다. 의존성은 Maven Central 에서 받는다.

```bash
gradle init --type kotlin-application --dsl kotlin
./gradlew run
./gradlew test
```

`build.gradle.kts` 의 Kotlin 플러그인 선언 예:

```kotlin
plugins {
    kotlin("jvm") version "2.4.21"
    application
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:<버전>")
}
```

## 문법 한눈에 보기
```kotlin
// 불변 val, 가변 var
val name = "dev.hub"
var count = 0

// data class: equals/hashCode/toString/copy 자동
data class User(val id: Int, val name: String, val email: String? = null)

// 널 안전성
fun emailDomain(user: User): String =
    user.email?.substringAfter('@') ?: "(없음)"

// sealed 계층 + when
sealed interface Shape
data class Circle(val r: Double) : Shape
data class Rect(val w: Double, val h: Double) : Shape

fun area(s: Shape): Double = when (s) {
    is Circle -> Math.PI * s.r * s.r
    is Rect -> s.w * s.h
}

// 확장 함수
fun String.shout() = uppercase() + "!"

fun main() {
    val users = listOf(User(1, "Kim", "kim@example.com"), User(2, "Lee"))
    users.filter { it.email != null }.forEach { println(emailDomain(it)) }

    val n = "abc".toIntOrNull() ?: -1          // 변환 실패 시 null
    val r = runCatching { "42".toInt() }       // 예외를 Result 로
    println("$n ${r.getOrDefault(0)} ${"hi".shout()} ${area(Rect(2.0, 3.0))}")
}
```

코루틴(`kotlinx.coroutines` 의존성 필요):
```kotlin
import kotlinx.coroutines.*

suspend fun load(id: Int): String { delay(100); return "item-$id" }

fun main() = runBlocking {
    val results = (1..3).map { async { load(it) } }.awaitAll()
    println(results)
}
```

## 생태계
**백엔드**
- [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) — Kotlin 을 공식 지원(코루틴, Kotlin DSL). JetBrains 의 Ktor 도 Kotlin 전용 서버 프레임워크로 쓰인다.
- ORM·DB: Exposed(JetBrains), JPA/Hibernate.

**AI**
- [Google ADK](/develop-wiki/ai/agent-framework/google-adk/) · [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) Kotlin SDK
- JVM 이므로 [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/) 같은 Java 라이브러리도 그대로 사용 가능.

**모바일**: Jetpack Compose(안드로이드 UI), Compose Multiplatform, Kotlin Multiplatform.

## 언제 쓰나 / 약점
- **쓸 때**
  - 안드로이드 앱 — 신규 코드의 기본 선택지.
  - Java 코드베이스를 점진적으로 현대화(같은 프로젝트에서 섞어 쓰기)할 때.
  - iOS·안드로이드 간 비즈니스 로직 공유(Kotlin Multiplatform).
- **약점**
  - 빌드(특히 Gradle + Kotlin 컴파일) 속도가 Java 단독보다 느릴 수 있다.
  - Java 라이브러리를 쓸 때 널 정보가 없는 "플랫폼 타입"이 섞여 널 안전성이 약해진다.
  - 서버 쪽 인력·자료는 Java 보다 적다.
  - 언어 기능(확장 함수, DSL, 스코프 함수)이 많아 팀 컨벤션 없이는 스타일이 갈린다.

## 공식 문서·학습 자료
- [Kotlin 문서](https://kotlinlang.org/docs/home.html) · [JVM 시작하기](https://kotlinlang.org/docs/jvm-get-started.html)
- [릴리스·버전 정보](https://kotlinlang.org/docs/releases.html) · [Kotlin Playground](https://play.kotlinlang.org/)
- [코루틴 가이드](https://kotlinlang.org/docs/coroutines-guide.html) · [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
- [Android Kotlin 문서](https://developer.android.com/kotlin)
- [Gradle 프로젝트 초기화](https://docs.gradle.org/current/userguide/build_init_plugin.html)
