---
name: Xcode
url: https://developer.apple.com/xcode/
docs: https://developer.apple.com/documentation/xcode
domain: mobile
category: ios
description: Apple 플랫폼 앱의 공식 통합 개발 환경과 빌드 툴체인. 편집·빌드·시뮬레이터·디버깅·프로파일링·서명과 App Store Connect 업로드까지 한곳에서 처리한다.
pricing: free
tags: [toolchain, build, simulator, apple]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Xcode는 iOS·iPadOS·macOS·watchOS·tvOS·visionOS 앱을 만들 때 사실상 필수인 Apple의 개발 환경이다. 에디터뿐 아니라 Swift 컴파일러, 플랫폼 SDK, 시뮬레이터, `xcodebuild` 명령줄 도구, Instruments가 함께 들어 있어 다른 에디터를 쓰더라도 빌드에는 Xcode 툴체인이 필요하다.

- 현재 버전은 **Xcode 27**(27.2 출시, 27.3 베타). macOS Tahoe 26.6 이상 필요, Swift 6.4 컴파일러와 iOS·macOS 등 27.x SDK 포함, 배포 대상 iOS 15~27.
- Xcode 27은 Anthropic·Google·OpenAI 모델을 쓰는 코딩 어시스턴트와 에이전트, Agent Client Protocol 호환 에이전트 추가, MCP로 도구 확장, 실기기·시뮬레이터를 한곳에서 다루는 **Device Hub**를 내세운다.
- 언어는 [Swift](/develop-wiki/languages/swift/).

## 설치
Mac App Store에서 설치하거나 [developer.apple.com/download](https://developer.apple.com/download/)에서 받는다.

```bash
xcode-select --install                 # 명령줄 도구만 필요할 때
sudo xcode-select -s /Applications/Xcode.app   # 사용할 Xcode 선택
xcodebuild -runFirstLaunch             # 첫 실행 구성 요소 설치
xcodebuild -downloadPlatform iOS       # iOS 시뮬레이터 런타임 받기
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project / Workspace | `.xcodeproj`(타깃·설정 묶음), `.xcworkspace`(여러 프로젝트·패키지 묶음) |
| Target | 앱·확장·프레임워크·테스트 번들 같은 빌드 산출물 단위 |
| Scheme | 어떤 타깃을 어떤 구성(Debug/Release)으로 빌드·실행·테스트·아카이브할지 정의 |
| Build Settings / `.xcconfig` | 컴파일러·링커 옵션. 텍스트 파일로 분리해 버전 관리 가능 |
| Signing & Capabilities | 팀·번들 ID·프로비저닝 프로필, 푸시·iCloud 같은 권한 |
| Previews | `#Preview` 매크로로 SwiftUI·UIKit·AppKit 뷰를 캔버스에 표시 |
| Test Plan | 여러 테스트 대상·구성(언어, 기기)을 묶어 실행. Swift Testing과 XCTest 병행 가능 |
| Instruments | CPU·메모리·디스크·GPU 프로파일링. 27에서 Swift Concurrency 계측 추가 |
| Archive / Organizer | 배포용 빌드 생성, App Store Connect·TestFlight 업로드, 크래시 로그 확인 |
| Xcode Cloud | Apple의 클라우드 CI/CD |

## 기본 사용법
명령줄 빌드·테스트(CI에서 그대로 쓴다).

```bash
# 시뮬레이터 목록
xcrun simctl list devices available

# 빌드와 테스트
xcodebuild -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  test

# 배포용 아카이브와 내보내기
xcodebuild -scheme MyApp -configuration Release \
  -archivePath build/MyApp.xcarchive archive
xcodebuild -exportArchive -archivePath build/MyApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/
```

(시뮬레이터 이름은 `simctl list` 결과에 맞게 바꾼다.)

## 자주 쓰는 패턴
- **설정은 `.xcconfig`로.** 환경별(Dev/Prod) 번들 ID·API 주소를 구성 파일로 나누면 프로젝트 파일 충돌이 줄어든다.
- **의존성은 [Swift Package Manager](/develop-wiki/mobile/ios/swift-package-manager/)** 로 추가하고 `Package.resolved`를 커밋한다.
- **여러 Xcode 버전 병행.** `/Applications/Xcode-27.app`처럼 이름을 바꿔 두고 `xcode-select`나 `DEVELOPER_DIR` 환경 변수로 전환한다.
- **서명 자동화.** 팀 공유 인증서는 [fastlane](/develop-wiki/mobile/mobile-testing/fastlane/) `match`로 관리하는 경우가 많다.
- **UI 테스트는 [XCTest/XCUITest](/develop-wiki/mobile/mobile-testing/xctest/)**, 단위 테스트는 Swift Testing.

## 언제 쓰나 / 피할 때
- 쓸 때: Apple 플랫폼 앱 빌드·서명·배포는 Xcode 툴체인 없이는 불가능하다. 크로스플랫폼 프레임워크도 iOS 빌드 단계에서는 Xcode를 쓴다.
- 피할 때(대안): 편집만 다른 에디터(VS Code + Swift 확장 등)에서 하고 빌드는 `xcodebuild`로 돌릴 수 있다. Mac 없이 iOS 빌드가 필요하면 Xcode Cloud·EAS Build 같은 클라우드 빌드를 쓴다.

## 공식 문서
- [Xcode 문서](https://developer.apple.com/documentation/xcode) · [What's new in Xcode](https://developer.apple.com/xcode/whats-new/)
- [지원 SDK·macOS 요구 사항 표](https://developer.apple.com/support/xcode/) · [Xcode 릴리스 노트](https://developer.apple.com/documentation/xcode-release-notes)
