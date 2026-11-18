---
name: XCTest / XCUITest
url: https://developer.apple.com/documentation/xctest
docs: https://developer.apple.com/documentation/xctest
domain: mobile
category: mobile-testing
description: Xcode에 내장된 Apple 플랫폼 테스트 프레임워크. XCUIAutomation으로 앱 UI를 조작하는 UI 테스트와 성능 측정을 맡고, 단위 테스트는 Swift Testing과 함께 쓴다.
pricing: free
tags: [testing, ui-testing, xcode, apple]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
XCTest는 Xcode 테스트 번들 안에서 단위·성능·UI 테스트를 실행하는 Apple의 테스트 프레임워크다. 그중 UI 테스트(흔히 **XCUITest**)는 별도 프로세스에서 앱을 실행해 접근성 정보로 요소를 찾고 탭·입력·스와이프를 보낸다. UI 자동화 API는 **XCUIAutomation** 프레임워크(`XCUIApplication`, `XCUIElement`)로 분리돼 있으며 `import XCTest`만 해도 함께 들어온다.

- Xcode 27 기준 역할 분담: 단위 테스트는 **Swift Testing**(`@Test`, `#expect`), UI 테스트·성능 측정은 **XCTest**. 두 프레임워크는 같은 타깃에서 나란히 실행돼 점진적 이전이 가능하다.
- 언어는 [Swift](/develop-wiki/languages/swift/).

## 설치
Xcode에 포함돼 있다. 프로젝트에 **UI Testing Bundle** 타깃을 추가하고(File → New → Target), 테스트는 ⌘U 또는 명령줄로 실행한다.

```bash
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=<시뮬레이터 이름>' \
  -only-testing:MyAppUITests
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `XCTestCase` | 테스트 클래스. `test`로 시작하는 메서드가 테스트 |
| `setUp` / `tearDown` | 각 테스트 전후 준비·정리 (`async throws` 가능) |
| `XCTAssert*` | `XCTAssertEqual`, `XCTAssertTrue`, `XCTUnwrap` 등 단언 |
| `XCUIApplication` | 테스트 대상 앱 프록시. `launch()`, `launchArguments`, `launchEnvironment` |
| `XCUIElementQuery` | `app.buttons["저장"]`, `app.textFields["email"]`처럼 요소 검색 |
| Accessibility identifier | 코드에서 지정한 안정적 식별자. 텍스트 대신 이것으로 찾는 것이 권장 |
| `waitForExistence(timeout:)` | 비동기 UI가 나타날 때까지 대기 |
| `measure(metrics:)` | 시간·메모리·앱 실행 성능 측정 (`XCTApplicationLaunchMetric`) |
| UI 녹화·재생 | Xcode에서 조작을 녹화해 테스트 코드 생성, 실패 시 스크린숏·영상 확인 |
| Test plan | 언어·지역·기기 구성을 바꿔 같은 테스트 반복 |

## 기본 사용법
로그인 UI 테스트.

```swift
import XCTest

final class LoginUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    @MainActor
    func testLoginShowsHome() {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest-mock-server"]
        app.launch()

        let email = app.textFields["login.email"]
        email.tap()
        email.typeText("kim@example.com")
        app.secureTextFields["login.password"].tap()
        app.secureTextFields["login.password"].typeText("pass1234")
        app.buttons["login.submit"].tap()

        XCTAssertTrue(app.staticTexts["home.title"].waitForExistence(timeout: 5))
    }
}
```

앱 코드에서는 `.accessibilityIdentifier("login.email")`(SwiftUI) 또는 `accessibilityIdentifier` 속성(UIKit)으로 식별자를 붙인다.

같은 프로젝트의 단위 테스트(Swift Testing).

```swift
import Testing
@testable import MyApp

@Test func priceIncludesTax() {
    #expect(Cart(items: [1000]).totalWithTax == 1100)
}
```

## 자주 쓰는 패턴
- **테스트 모드 실행.** `launchArguments`/`launchEnvironment`로 목 서버·애니메이션 끄기·초기 상태를 지정한다.
- **Page Object.** 화면별 요소와 동작을 구조체로 묶어 테스트 본문을 짧게 유지한다.
- **`sleep` 대신 대기 API.** `waitForExistence`나 `XCTNSPredicateExpectation`으로 조건을 기다린다.
- **병렬 실행.** 스킴의 테스트 옵션에서 병렬 실행을 켜면 시뮬레이터 복제본에서 나눠 돈다.
- **시스템 알림 처리.** 권한 팝업은 `addUIInterruptionMonitor`나 `XCUIApplication(bundleIdentifier: "com.apple.springboard")`로 다룬다.

## 언제 쓰나 / 피할 때
- 쓸 때: 네이티브 iOS 앱의 UI 회귀 테스트, 앱 실행 시간·스크롤 성능 측정, CI(Xcode Cloud·GitHub Actions macOS 러너)에서 시뮬레이터 테스트.
- 피할 때(대안): iOS·Android를 같은 시나리오로 테스트하거나 비개발자도 읽을 수 있는 테스트가 필요하면 [Maestro](/develop-wiki/mobile/mobile-testing/maestro/). React Native 앱의 그레이박스 E2E는 [Detox](/develop-wiki/mobile/mobile-testing/detox/).

## 공식 문서
- [XCTest](https://developer.apple.com/documentation/xctest) · [XCUIAutomation](https://developer.apple.com/documentation/xcuiautomation) · [Swift Testing](https://developer.apple.com/documentation/testing)
- [UI 테스트 녹화·재생 (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/344/)
