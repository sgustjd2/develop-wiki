---
name: Swift Package Manager
url: https://www.swift.org/documentation/package-manager/
docs: https://www.swift.org/documentation/package-manager/
repo: https://github.com/swiftlang/swift-package-manager
domain: mobile
category: ios
description: Swift 툴체인에 포함된 공식 패키지 매니저·빌드 도구. Package.swift 매니페스트로 의존성과 타깃을 선언하며, Xcode 프로젝트의 라이브러리 의존성 관리에도 쓴다.
pricing: oss
tags: [package-manager, build, dependency, swiftpm]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Swift Package Manager(SwiftPM, SPM)는 Swift 코드의 빌드·테스트·의존성 관리를 맡는 공식 도구다. 패키지는 `Package.swift`라는 **Swift 코드로 된 매니페스트**로 정의되며, 의존성은 Git 저장소 URL과 버전 규칙으로 지정한다. Xcode가 SPM을 직접 지원해 iOS 앱의 외부 라이브러리 관리 기본 수단이 됐다.

- Swift 툴체인과 함께 배포된다. 현재 최신은 **Swift 6.4.2**(2026-10-30), Xcode 27에는 Swift 6.4 컴파일러가 들어 있다. 라이선스 Apache-2.0.
- CocoaPods 대신 SPM을 기본으로 쓰는 흐름이 넓어졌다(예: Capacitor 8부터 iOS 기본 의존성 관리자가 SPM, Flutter 3.50은 SPM 비활성화 시 경고).
- 언어는 [Swift](/develop-wiki/languages/swift/).

## 설치
Xcode 또는 swift.org 툴체인에 포함돼 있다.

```bash
swift --version                          # 툴체인 확인
swift package init --type library        # 새 라이브러리 패키지
swift build && swift test                # 빌드·테스트
```

Xcode 프로젝트에서는 **File → Add Package Dependencies…** 에서 저장소 URL을 넣는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Package | `Package.swift`가 있는 디렉터리. 하나 이상의 타깃·제품을 가진다 |
| `// swift-tools-version:` | 매니페스트 첫 줄. 필요한 최소 SwiftPM 버전과 사용 가능한 API를 정한다 |
| Target | 모듈 하나(`Sources/<이름>`). `.target`, `.executableTarget`, `.testTarget`, `.macro`, `.plugin` |
| Product | 외부에 공개하는 결과물(`.library`, `.executable`) |
| Dependency | `.package(url:from:)` 처럼 Git URL + 버전 규칙(SemVer) |
| `Package.resolved` | 실제로 고정된 버전 기록. 앱 저장소에는 커밋한다 |
| Plugin | 빌드 도구 플러그인·명령 플러그인으로 코드 생성·린트를 빌드에 끼워 넣음 |
| Swift 언어 모드 | 타깃별 `swiftLanguageModes`로 Swift 5/6 모드 선택 |

## 기본 사용법
라이브러리 하나와 테스트, 외부 의존성 하나를 가진 매니페스트.

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NetworkKit",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "NetworkKit", targets: ["NetworkKit"])],
    dependencies: [
        .package(url: "https://github.com/apple/swift-collections.git", from: "1.1.0"),
    ],
    targets: [
        .target(name: "NetworkKit",
                dependencies: [.product(name: "Collections", package: "swift-collections")]),
        .testTarget(name: "NetworkKitTests", dependencies: ["NetworkKit"]),
    ]
)
```

```bash
swift package resolve          # 의존성 해석·다운로드
swift package update           # 허용 범위 안에서 최신으로 갱신
swift test --filter NetworkKitTests
```

## 자주 쓰는 패키지 명령
- `swift package add-dependency <url> --from <버전>` — 매니페스트를 직접 고치지 않고 의존성 추가.
- `swift package show-dependencies` — 의존성 트리 확인.
- `swift build -c release` — 릴리스 구성 빌드.

## 자주 쓰는 패턴
- **앱을 로컬 패키지로 모듈화.** 앱 저장소 안에 `Packages/Feature` 같은 로컬 패키지를 두고 Xcode 프로젝트에서 참조하면 빌드 단위가 작아지고 테스트가 빨라진다.
- **버전 규칙은 `from:`(다음 메이저 전까지).** 정확히 고정해야 하면 `exact:`, 브랜치 추적은 개발 중에만.
- **리소스 포함.** 타깃에 `resources: [.process("Resources")]`를 주고 코드에서 `Bundle.module`로 읽는다.
- **CI 캐시.** `Package.resolved`를 커밋하고 `.build` 또는 Xcode의 SourcePackages 디렉터리를 캐시한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 iOS·macOS 프로젝트의 서드파티 라이브러리 관리, 서버 사이드 Swift, 앱 내부 모듈화.
- 피할 때(대안): SPM을 지원하지 않는 오래된 라이브러리에 의존하면 CocoaPods가 남을 수 있다. 앱 빌드·서명·배포 자동화는 SPM 범위 밖이므로 [Xcode](/develop-wiki/mobile/ios/xcode/)·[fastlane](/develop-wiki/mobile/mobile-testing/fastlane/)을 함께 쓴다.

## 공식 문서
- [Package Manager 문서](https://www.swift.org/documentation/package-manager/) · [저장소와 문서](https://github.com/swiftlang/swift-package-manager)
- [Xcode에서 패키지 의존성 추가](https://developer.apple.com/documentation/xcode/adding-package-dependencies-to-your-app)
