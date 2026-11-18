---
name: Swift
summary: Apple이 만든 정적 타입 컴파일 언어. iOS·macOS 앱의 표준 언어이며, 옵셔널과 컴파일 타임 데이터 경합 검사로 안전성을 강조한다. Linux·Windows 서버에서도 쓴다.
paradigms: [객체지향, 프로토콜 지향, 함수형, 명령형]
typing: static
execution: compiled
firstAppeared: 2014
officialSite: https://www.swift.org/
docs: https://www.swift.org/documentation/
useCases: [iOS·macOS·watchOS 앱, 서버 사이드 API, 커맨드라인 도구, 임베디드(Embedded Swift)]
sources:
  - https://www.swift.org/install/macos/
  - https://www.swift.org/documentation/
  - https://docs.swift.org/swift-book/documentation/the-swift-programming-language/
updatedAt: 2026-11-18
---

## 개요
Swift는 2014년 Apple이 Objective-C의 후속으로 공개한 언어로, 2015년부터 오픈소스(Apache 2.0)로 개발된다. LLVM으로 네이티브 코드를 만들고, Apple 플랫폼 SDK(SwiftUI, UIKit)와 깊게 통합되어 있다. 이 글 작성 시점 swift.org 설치 페이지가 안내하는 버전은 **Swift 6.4.2** 이다.

## 언어의 특징
- **타입 시스템:** 정적 타입 + 타입 추론. `nil` 가능성은 옵셔널(`String?`)로만 표현해 null 참조 오류를 컴파일 단계에서 막는다. 프로토콜·제네릭·`some`/`any` 로 추상화한다.
- **값 타입 중심:** `struct`, `enum` 이 값 의미론(copy-on-write)을 가지며, 표준 라이브러리 대부분이 값 타입이다. `class` 는 참조 타입.
- **메모리 관리:** 가비지 컬렉터 대신 ARC(자동 참조 카운팅). 순환 참조는 `weak`/`unowned` 로 끊는다.
- **동시성:** `async`/`await`, 구조적 동시성(`Task`, `TaskGroup`), 상태를 격리하는 `actor`. Swift 6 언어 모드에서는 데이터 경합 가능성을 컴파일 오류로 잡는다.
- **상호 운용:** Objective-C, C와 직접 호출 가능하고 C++ 상호 운용도 지원한다.

## 개발 환경 시작하기
- **macOS:** 앱 개발은 Xcode(App Store) 설치가 기본. 툴체인만 필요하면 swift.org 의 **swiftly** 설치 도구를 쓴다.
- **Linux·Windows:** swift.org 의 플랫폼별 설치 페이지를 따른다(Linux도 swiftly 사용).

```bash
# macOS — swiftly 로 툴체인 설치 (swift.org 안내 명령)
curl -O https://download.swift.org/swiftly/darwin/swiftly.pkg && \
installer -pkg swiftly.pkg -target CurrentUserHomeDirectory && \
~/.swiftly/bin/swiftly init --quiet-shell-followup && \
. "${SWIFTLY_HOME_DIR:-$HOME/.swiftly}/env.sh" && hash -r

swift --version
```

패키지 매니저는 툴체인에 포함된 **Swift Package Manager(SwiftPM)** 다.
```bash
mkdir MyCLI && cd MyCLI
swift package init --name MyCLI --type executable   # Package.swift + Sources/ 생성
swift run MyCLI
swift test
```
의존성은 `Package.swift` 의 `dependencies` 에 Git URL과 버전 범위로 선언한다.

## 문법 한눈에 보기
```swift
enum ParseError: Error {
    case invalid(String)
}

struct User {
    let name: String
    var age: Int?            // 옵셔널: 값이 없을 수 있음
}

func parseAge(_ text: String) throws -> Int {
    guard let n = Int(text), n >= 0 else { throw ParseError.invalid(text) }
    return n
}

var users = [User(name: "kim", age: 30), User(name: "lee", age: nil)]
users.append(User(name: "park", age: try? parseAge("41")))

for u in users {
    print(u.name, u.age ?? 0)   // nil 이면 기본값
}

do {
    _ = try parseAge("abc")
} catch {
    print("error:", error)
}
```

동시성:
```swift
actor Counter {
    private var value = 0
    func increment() -> Int { value += 1; return value }
}

let counter = Counter()
let n = await counter.increment()   // actor 메서드는 await 로 호출
print(n)
```

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| UI | SwiftUI, UIKit/AppKit |
| 서버 | Vapor, Hummingbird, SwiftNIO |
| 데이터 | SwiftData, Core Data |
| 테스트 | Swift Testing(`@Test`), XCTest |
| 도구 | Xcode, SourceKit-LSP(VS Code 등), swift-format |

이 사이트에는 아직 Swift 전용 항목이 없다.

## 언제 쓰나 / 약점
- **쓸 때:** iOS·macOS 등 Apple 플랫폼 네이티브 앱. Apple 플랫폼과 코드를 공유하는 서버·CLI.
- **약점:** 생태계가 Apple 플랫폼에 집중돼 서버·Windows 쪽 라이브러리는 상대적으로 적다. 큰 프로젝트에서 타입 추론으로 인한 컴파일 시간이 길어질 수 있다. Swift 6 엄격한 동시성 검사로의 이전 비용이 있다.
- **대안:** 크로스 플랫폼 모바일은 [Dart](/develop-wiki/languages/dart/)(Flutter)나 [Kotlin](/develop-wiki/languages/kotlin/)(Kotlin Multiplatform).

## 공식 문서·학습 자료
- [The Swift Programming Language](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/) — 공식 언어 가이드
- [Swift 문서 허브](https://www.swift.org/documentation/) · [설치](https://www.swift.org/install/)
- [Swift Package Index](https://swiftpackageindex.com/) — 패키지 검색
- [Apple Developer — Swift](https://developer.apple.com/swift/)
