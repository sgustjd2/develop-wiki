---
name: OpenJDK
url: https://openjdk.org
docs: https://dev.java/learn/
repo: https://github.com/openjdk/jdk
stars: 23570
domain: backend
category: runtime-language
description: Java SE 의 오픈소스 참조 구현(JDK·JVM). Temurin·Corretto 같은 배포판으로 받아 Java·Kotlin 서버를 실행하고 빌드할 때 쓴다.
pricing: oss
tags: [java, jvm, jdk, runtime]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenJDK 는 Java SE 표준의 오픈소스 구현으로, 컴파일러(`javac`), 표준 라이브러리, HotSpot JVM(JIT 컴파일·GC)을 포함한다. 라이선스는 GPLv2 + Classpath Exception 이다. JVM 위에서는 [Java](/develop-wiki/languages/java/) 뿐 아니라 [Kotlin](/develop-wiki/languages/kotlin/)·Scala 도 실행되므로 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 같은 JVM 백엔드의 공통 기반이다.

실제로는 OpenJDK 소스를 빌드해 배포하는 **배포판**을 설치한다: Eclipse Temurin(Adoptium), Amazon Corretto, Microsoft Build of OpenJDK, Oracle OpenJDK 빌드 등. 기능은 같고 지원 기간·패치 정책이 다르다.

**릴리스 현황(2026-11 기준)**: 6개월마다 기능 릴리스가 나오고, 2년마다 LTS 가 지정된다. 최신 기능 릴리스는 **JDK 27**(2026-09), 최신 LTS 는 **JDK 25**(2025-09)이며 21·17·11·8 도 배포판별 LTS 지원이 이어진다.

## 설치
```bash
# SDKMAN 으로 배포판·버전 관리
sdk list java                 # 설치 가능한 배포판 식별자 확인
sdk install java 25-tem       # Temurin 25 (식별자는 목록에서 확인)
java -version
```
Docker 는 `eclipse-temurin:25-jre` 같은 공식 이미지를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| JDK / JRE | JDK = 개발 도구 포함, 런타임만 필요하면 JRE 이미지나 `jlink` 로 만든 최소 런타임 |
| HotSpot | 인터프리터 + C1/C2 JIT. 실행하면서 자주 쓰는 코드를 네이티브로 최적화 |
| GC | G1(기본), ZGC(저지연), Parallel, Serial. `-XX:+UseZGC` 로 선택 |
| 가상 스레드 | JDK 21 정식. 블로킹 코드를 그대로 두고 대량 동시성 처리 |
| 모듈 시스템 | `module-info.java`, `jlink` 로 필요한 모듈만 묶은 런타임 생성 |
| JEP | 기능 제안 단위. 프리뷰(`--enable-preview`) → 정식 순으로 들어온다 |

## 기본 사용법
```java
// Hello.java — JDK 25+: 클래스 선언 없는 소스 파일, `java Hello.java` 로 바로 실행
void main() {
    IO.println("hello, " + Runtime.version());
}
```
```java
// VirtualThreads.java — 가상 스레드 1만 개로 블로킹 작업 실행 (JDK 21+)
import java.time.Duration;
import java.util.concurrent.Executors;

public class VirtualThreads {
    public static void main(String[] args) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10_000; i++) {
                executor.submit(() -> {
                    Thread.sleep(Duration.ofMillis(100));
                    return null;
                });
            }
        } // close() 가 모든 작업 완료를 기다린다
        System.out.println("done");
    }
}
```

## 자주 쓰는 패턴
- **LTS 고정**: 운영 서비스는 LTS(25 또는 21)를 기준으로 하고, Gradle/Maven toolchain 설정으로 빌드 JDK 버전을 고정한다.
- **컨테이너 메모리**: JVM 은 컨테이너 메모리 제한을 인식한다. `-XX:MaxRAMPercentage=75` 로 힙 비율을 정한다.
- **최소 런타임 이미지**: `jlink --add-modules java.base,java.net.http --output runtime` 으로 이미지 크기를 줄인다.
- **진단 도구**: `jcmd <pid> Thread.print`, JDK Flight Recorder(`-XX:StartFlightRecording`)로 운영 중 프로파일링.
- **빠른 시작이 필요하면**: AppCDS·AOT 캐시를 쓰거나 [GraalVM](/develop-wiki/backend/runtime-language/graalvm/) Native Image 로 네이티브 바이너리를 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: Spring·Kotlin 기반 백엔드, 장시간 실행되는 고처리량 서비스, 성숙한 라이브러리·관측 도구가 필요한 엔터프라이즈 환경.
- 피할 때(대안): 콜드 스타트·메모리가 중요한 서버리스나 CLI 는 GraalVM Native Image 나 Go, 간단한 스크립트는 [Python](/develop-wiki/languages/python/).

## 공식 문서
- [dev.java 학습](https://dev.java/learn/) · [JDK 프로젝트·릴리스](https://openjdk.org/projects/jdk/) · [JEP 목록](https://openjdk.org/jeps/0) · [Adoptium Temurin](https://adoptium.net)
