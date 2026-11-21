---
name: IntelliJ IDEA (JetBrains IDEs)
url: https://www.jetbrains.com/idea/
docs: https://www.jetbrains.com/help/idea/getting-started.html
repo: https://github.com/JetBrains/intellij-community
stars: 20748
domain: devtools
category: editor-ide
description: 정적 분석·리팩터링·빌드 도구 연동이 강한 JetBrains의 Java·Kotlin 개발 환경. 같은 플랫폼의 PyCharm·WebStorm·GoLand 등과 사용법이 같다.
pricing: freemium
tags: [jetbrains, java, kotlin, refactoring, android-studio]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
IntelliJ IDEA는 프로젝트 전체를 인덱싱해 타입 기반 탐색·리팩터링·검사(inspection)를 제공하는 통합 개발 환경이다. **2025.3부터 Community와 Ultimate가 하나의 배포판으로 통합**되어, 기존 Community 기능은 상업 용도 포함 무료로 쓰고 Spring·데이터베이스·웹 프레임워크 같은 고급 기능은 구독으로 연다. 2026-11 기준 최신 버전은 2026.3 계열이다. 오픈소스 빌드는 `intellij-community` 저장소에서 계속 만들 수 있다.

- 같은 IntelliJ 플랫폼 제품: PyCharm(Python), WebStorm(JS/TS), GoLand, Rider(.NET), CLion(C/C++), RustRover, DataGrip. **Android Studio**도 Google이 IntelliJ 플랫폼 위에 만든 Android 전용 무료 도구다.
- **Xcode**는 Apple 플랫폼(iOS·macOS) 앱 빌드·서명·시뮬레이터에 사실상 필수인 Apple 공식 도구로, macOS에서 App Store로 설치한다.

## 설치
```bash
brew install --cask intellij-idea   # macOS
# 또는 JetBrains Toolbox App 으로 여러 제품·버전 관리
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project / Module | 프로젝트 안에 빌드 단위 모듈. Gradle·Maven 파일에서 자동 구성 |
| 인덱싱 | 첫 로드 시 코드 전체를 색인. 끝나야 탐색·검사가 완전히 동작 |
| Inspections / Intentions | 문제 표시와 `Alt+Enter` 빠른 수정 |
| Run Configuration | 실행·테스트·디버그 설정 단위 |
| SDK | 프로젝트 JDK 지정 (IDE에서 내려받기 가능) |
| Plugins | Marketplace 플러그인. 기본 번들에 Git·Gradle·Maven 포함 |

## 기본 사용법
| 하고 싶은 일 | 단축키 (macOS / Win·Linux) |
| --- | --- |
| 어디서나 검색 | `Shift` 두 번 |
| 액션 찾기 | `Cmd+Shift+A` / `Ctrl+Shift+A` |
| 빠른 수정 | `Alt+Enter` (`Option+Enter`) |
| 정의로 이동 | `Cmd+B` / `Ctrl+B` |
| 사용처 찾기 | `Option+F7` / `Alt+F7` |
| 이름 바꾸기 | `Shift+F6` |
| 리팩터링 메뉴 | `Ctrl+T` / `Ctrl+Alt+Shift+T` |
| 코드 정리 | `Cmd+Option+L` / `Ctrl+Alt+L` |
| 최근 파일 | `Cmd+E` / `Ctrl+E` |

## 자주 쓰는 패턴
- **Gradle 프로젝트 열기.** `build.gradle.kts`가 있는 폴더를 열면 모듈·의존성을 가져온다. 빌드 스크립트를 고친 뒤에는 Gradle 동기화를 다시 한다.
- **디버거.** 조건부 중단점, Evaluate Expression(`Option+F8`)으로 실행 중 값을 확인.
- **로컬 이력.** Git 커밋 전 변경도 Local History로 되돌릴 수 있다.
- **설정 공유.** 코드 스타일은 `.editorconfig`로 저장소에 두면 다른 에디터와도 맞춰진다.

## 언제 쓰나 / 피할 때
- 쓸 때: Java·Kotlin 대형 코드베이스, Spring Boot, 대규모 리팩터링이 잦을 때.
- 피할 때(대안): 메모리가 부족한 환경이나 가벼운 스크립트 편집은 [VS Code](/develop-wiki/devtools/editor-ide/vscode/)·[Neovim](/develop-wiki/devtools/editor-ide/neovim/).

## 공식 문서
- [시작하기](https://www.jetbrains.com/help/idea/getting-started.html) · [단일 배포판 안내](https://www.jetbrains.com/help/idea/intellij-idea-single-distribution.html) · [단축키](https://www.jetbrains.com/help/idea/mastering-keyboard-shortcuts.html)
- [Android Studio](https://developer.android.com/studio) · [Xcode](https://developer.apple.com/xcode/)
