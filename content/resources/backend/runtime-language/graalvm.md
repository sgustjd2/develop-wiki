---
name: GraalVM
url: https://www.graalvm.org
docs: https://www.graalvm.org/latest/docs/
repo: https://github.com/oracle/graal
stars: 21757
domain: backend
category: runtime-language
description: Native Image 로 Java 앱을 AOT 컴파일해 빠르게 시작하는 네이티브 실행 파일을 만드는 JDK. 서버리스·컨테이너에서 JVM 시작 시간과 메모리를 줄일 때 쓴다.
pricing: oss
tags: [java, jvm, native-image, aot, polyglot]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GraalVM 은 OpenJDK 에 Graal 컴파일러와 **Native Image**(AOT 컴파일러)를 더한 JDK 다. Native Image 는 빌드 시점에 도달 가능한 코드만 분석해 JVM 없이 실행되는 단일 바이너리를 만들어, 시작 시간을 밀리초 단위로 줄이고 메모리 사용을 낮춘다. Truffle 프레임워크 위의 GraalPy·GraalJS 로 다른 언어를 Java 에 내장하는 기능도 있다.

배포판은 두 갈래다.
| 배포판 | 라이선스 | 비고 |
| --- | --- | --- |
| GraalVM Community Edition | GPLv2 + Classpath Exception | 오픈소스. 2026 년부터 "Innovation" 기능 릴리스를 자주 낸다(최신 25.5, JDK 25.0.5 기반, 2026-11) |
| Oracle GraalVM | GraalVM Free Terms and Conditions | Oracle 배포판. JDK 25 LTS 기준 분기별 패치, 추가 최적화(G1 GC, PGO 등) |

2025-09 Oracle 은 GraalVM 개발을 Java 릴리스 주기와 분리하고 Native Image 를 Java SE 제품에서 제외한다고 밝혔다. 신규 도입 전 사용하려는 배포판의 지원 일정을 확인한다.

## 설치
```bash
sdk list java | grep -i graal     # SDKMAN 에서 graalce / oracle graal 식별자 확인
sdk install java <식별자>
native-image --version
```
GitHub Actions 는 `graalvm/setup-graalvm` 액션을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Native Image | `native-image` 명령. 클래스패스를 정적 분석해 실행 파일 생성 |
| 닫힌 세계 가정 | 빌드 시 보이지 않는 클래스는 포함되지 않는다. 리플렉션·리소스·프록시는 메타데이터로 알려야 한다 |
| 도달 가능성 메타데이터 | `reachability-metadata.json`. 트레이싱 에이전트(`-agentlib:native-image-agent`)로 수집 |
| 빌드 타임 초기화 | 일부 클래스를 빌드 시 초기화해 힙 스냅샷에 포함 |
| Graal JIT | JVM 모드에서 C2 대신 쓰는 JIT 컴파일러 |
| Polyglot | Truffle 기반 GraalPy, GraalJS, GraalWasm 을 Java 에서 호출 |

## 기본 사용법
```java
// App.java
public class App {
    public static void main(String[] args) {
        System.out.println("started in native mode: " + (System.getProperty("org.graalvm.nativeimage.imagecode") != null));
    }
}
```
```bash
javac App.java
native-image App          # ./app 실행 파일 생성
./app
```
Maven 은 `org.graalvm.buildtools:native-maven-plugin` 을 추가하고 `mvn -Pnative package`, Gradle 은 `org.graalvm.buildtools.native` 플러그인의 `nativeCompile` 태스크를 쓴다.

## 자주 쓰는 패턴
- **Spring Boot 네이티브**: [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 는 AOT 처리로 메타데이터를 생성한다. `./mvnw -Pnative native:compile` 또는 `./gradlew nativeCompile`.
- **리플렉션 문제 해결**: JVM 모드로 테스트를 돌리며 트레이싱 에이전트로 메타데이터를 수집하고 `META-INF/native-image/` 에 둔다.
- **컨테이너**: 네이티브 바이너리를 distroless·scratch 계열 이미지에 넣어 이미지 크기를 줄인다.
- **빌드 비용**: 네이티브 빌드는 수 분과 많은 메모리가 든다. CI 에서만 네이티브 빌드하고 로컬은 JVM 모드로 개발한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서버리스 함수·CLI·스케일 투 제로 서비스처럼 시작 시간이 비용인 곳, 메모리 제한이 빡빡한 컨테이너.
- 피할 때(대안): 장시간 실행되는 고처리량 서비스는 JIT 최적화가 유리한 일반 [OpenJDK](/develop-wiki/backend/runtime-language/openjdk/), 동적 클래스 로딩·리플렉션이 많은 레거시 코드.

## 공식 문서
- [문서](https://www.graalvm.org/latest/docs/) · [Native Image](https://www.graalvm.org/latest/reference-manual/native-image/) · [릴리스 캘린더](https://www.graalvm.org/release-calendar/) · [Native Build Tools](https://graalvm.github.io/native-build-tools/latest/index.html)
