---
name: swift-snapshot-testing
url: https://github.com/pointfreeco/swift-snapshot-testing
docs: https://github.com/pointfreeco/swift-snapshot-testing
repo: https://github.com/pointfreeco/swift-snapshot-testing
stars: 4397
domain: mobile
category: mobile-testing
description: 뷰·데이터를 스냅샷(이미지, 텍스트, JSON 등)으로 저장하고 이후 실행과 비교하는 Swift 스냅샷 테스트 라이브러리. UIKit·SwiftUI 화면 회귀 테스트에 쓴다.
pricing: oss
tags: [snapshot-test, swift, ios, xctest, swift-testing]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
swift-snapshot-testing(Point-Free)은 `assertSnapshot(of:as:)` 한 함수로 값을 "스냅샷 전략"으로 변환해 디스크의 기준 파일과 비교한다. 이미지(`.image`), 뷰 계층 텍스트(`.recursiveDescription`), JSON, plist, 요청 객체 등 다양한 전략이 있다. 처음 실행하면 기준 스냅샷을 자동 기록하고 테스트를 실패시킨 뒤, 다음 실행부터 비교한다.

- 이 문서는 **1.19.7**(2026-10-21 릴리스) 기준이다. MIT.
- [XCTest](/develop-wiki/mobile/mobile-testing/xctest/)와 Swift Testing(`@Suite(.snapshots(record: .failed))`) 모두에서 쓸 수 있다. Android 대응은 [Roborazzi](/develop-wiki/mobile/mobile-testing/roborazzi/).

## 설치
Swift Package Manager로 테스트 타깃에 추가한다([Swift Package Manager](/develop-wiki/mobile/ios/swift-package-manager/)).

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/pointfreeco/swift-snapshot-testing", from: "1.19.7"),
],
targets: [
    .testTarget(name: "AppTests", dependencies: [
        .product(name: "SnapshotTesting", package: "swift-snapshot-testing"),
    ]),
]
```
Xcode 프로젝트는 File > Add Package Dependencies에서 URL로 추가한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `assertSnapshot(of:as:)` | 값을 전략으로 변환해 기준과 비교 |
| Snapshot strategy | `.image`, `.recursiveDescription`, `.json`, `.plist`, `.raw` 등 |
| `.image(on:)` | 기기 설정(`.iPhoneSe`, `.iPhoneX`, `.iPadMini(.portrait)`)으로 렌더링 |
| `record` 옵션 | `.all`(전부 갱신), `.failed`(실패만 갱신), `.missing`, `.never` |
| `withSnapshotTesting` | 블록 안의 모든 단언에 설정 적용 |
| `__Snapshots__` | 기준 파일 저장 디렉터리(테스트 파일 옆) |
| 커스텀 전략 | `Snapshotting`으로 새 형식을 정의 |

## 기본 사용법
```swift
import SnapshotTesting
import SwiftUI
import XCTest

final class ProfileViewTests: XCTestCase {
    func testProfile() {
        let view = ProfileView(name: "Hong")
        let host = UIHostingController(rootView: view)
        assertSnapshot(of: host, as: .image(on: .iPhone13))
    }

    func testDarkMode() {
        let host = UIHostingController(rootView: ProfileView(name: "Hong"))
        host.overrideUserInterfaceStyle = .dark
        assertSnapshot(of: host, as: .image(on: .iPhone13), named: "dark")
    }
}
```
`ProfileView`는 앱이 정의한 SwiftUI 뷰 가정이다. 기기 프리셋은 라이브러리 버전에 따라 이름이 다를 수 있으니 README를 확인한다. 기준 이미지를 갱신하려면 `record: .all`을 임시로 지정하고 다시 실행한 뒤 되돌린다.

## 자주 쓰는 패턴
- **구성 매트릭스**: 라이트/다크, 큰 Dynamic Type, 가로/세로, 여러 기기를 파라미터로 반복한다([SwiftUI](/develop-wiki/mobile/ios/swiftui/)).
- **텍스트 스냅샷**: 레이아웃 대신 `.json`·`.dump`로 데이터 구조를 비교하면 diff가 읽기 쉽다.
- **고정 환경**: 시뮬레이터 모델·OS·폰트가 달라지면 픽셀이 바뀌므로 CI와 로컬을 같은 환경으로 맞춘다.
- **정밀도**: 렌더링 오차가 있으면 `precision`·`perceptualPrecision` 옵션으로 허용치를 지정한다.
- **기준 파일 리뷰**: 변경된 PNG를 PR에서 사람이 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인 시스템 컴포넌트, 다양한 상태의 화면 회귀, API 응답·직렬화 결과 고정.
- 피할 때: 애니메이션·시간 의존 화면, 환경 차이로 이미지가 계속 흔들리는 경우, 사용자 흐름 전체 검증(UI 테스트: [Maestro](/develop-wiki/mobile/mobile-testing/maestro/)·XCUITest).

## 공식 문서
- [README](https://github.com/pointfreeco/swift-snapshot-testing) · [릴리스](https://github.com/pointfreeco/swift-snapshot-testing/releases) · [Point-Free](https://www.pointfree.co/)
