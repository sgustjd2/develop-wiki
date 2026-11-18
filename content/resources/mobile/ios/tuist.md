---
name: Tuist
url: https://tuist.dev
docs: https://docs.tuist.dev
repo: https://github.com/tuist/tuist
stars: 5867
domain: mobile
category: ios
description: Swift 로 Xcode 프로젝트를 선언해 생성하는 도구. Project.swift 매니페스트에서 .xcodeproj 를 만들어 머지 충돌을 없애고, 모듈화·빌드 캐시·의존성 관리를 지원한다.
pricing: oss
tags: [xcode, project-generation, modularization, build]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Tuist 는 `Project.swift` 에 타깃·의존성·설정을 코드로 적으면 `tuist generate` 가 Xcode 프로젝트를 만들어 주는 도구다. `.xcodeproj` 를 커밋하지 않아 `pbxproj` 머지 충돌이 사라지고, 많은 모듈로 쪼갠 앱에서 일관된 설정을 유지하기 쉽다. 유료 서버 기능(원격 캐시 등)이 있으나 CLI 는 오픈소스다.

- 최신 안정 릴리스 **4.218.1**(GitHub Releases 기준; 저장소가 매우 빠르게 릴리스함). 기본 라이선스 MIT 이며 저장소에 일부 하위 디렉터리는 별도 라이선스라고 명시돼 있다.
- 대안: XcodeGen(YAML 기반, 단순), Swift Package Manager 만 쓰는 구성.

## 설치
공식 문서는 [mise](https://mise.jdx.dev) 로 설치하는 방식을 안내한다.
```bash
mise install tuist
tuist version
tuist init            # 새 프로젝트 마법사
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Project.swift` | 타깃, 소스·리소스, 의존성을 선언하는 매니페스트 |
| `Tuist.swift` | 프로젝트 전역 설정 |
| `Workspace.swift` | 여러 프로젝트를 묶는 워크스페이스 |
| `Tuist/Package.swift` | 외부 SwiftPM 의존성 정의 (`tuist install` 로 해석) |
| `ProjectDescriptionHelpers` | 매니페스트 공통 코드를 모으는 헬퍼 모듈 |
| `tuist generate` | Xcode 프로젝트·워크스페이스 생성 |
| 캐시 | 빌드 산출물을 재사용해 모듈화된 프로젝트의 빌드를 단축 |

## 기본 사용법
```swift
// Project.swift
import ProjectDescription

let project = Project(
    name: "MyApp",
    targets: [
        .target(
            name: "MyApp",
            destinations: .iOS,
            product: .app,
            bundleId: "dev.example.myapp",
            sources: ["MyApp/Sources/**"],
            resources: ["MyApp/Resources/**"],
            dependencies: []
        ),
        .target(
            name: "MyAppTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "dev.example.myapp.tests",
            sources: ["MyApp/Tests/**"],
            dependencies: [.target(name: "MyApp")]
        ),
    ]
)
```
```bash
tuist install    # 외부 패키지 해석
tuist generate   # Xcode 열기
tuist build      # 빌드
```

## 자주 쓰는 패턴
- **`.gitignore` 에 `*.xcodeproj`, `*.xcworkspace`** 를 추가하고 매니페스트만 커밋한다.
- **모듈 분리.** Feature 별 프레임워크 타깃을 만들고 `dependencies: [.target(name: ...)]` 로 연결한다.
- **헬퍼 함수.** 공통 `Target` 생성 코드를 `ProjectDescriptionHelpers` 에 두어 반복을 줄인다.
- **외부 의존성.** `.external(name: "Alamofire")` 로 `Tuist/Package.swift` 의 패키지를 참조한다.
- **마이그레이션.** 기존 프로젝트는 한 번에 바꾸지 말고 앱 타깃부터 단계적으로 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모듈이 많은 대규모 앱, 여러 명이 pbxproj 충돌을 겪는 팀.
- 피할 때(대안): 타깃이 1~2개인 소규모 앱은 Xcode 프로젝트 그대로. 단순 생성만 원하면 XcodeGen.

## 공식 문서
- [시작하기](https://docs.tuist.dev) · [GitHub](https://github.com/tuist/tuist)
