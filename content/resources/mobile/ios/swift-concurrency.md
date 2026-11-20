---
name: Swift Concurrency
url: https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/
docs: https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/
repo: https://github.com/swiftlang/swift
stars: 70587
domain: mobile
category: ios
description: Swift 언어에 내장된 동시성 모델. async/await, 구조적 동시성(Task), 액터, Sendable 로 비동기 코드를 쓰고 Swift 6 언어 모드에서 데이터 경합을 컴파일 시점에 잡는다.
pricing: oss
tags: [concurrency, async-await, actor, sendable]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Swift Concurrency 는 콜백·GCD 대신 `async/await` 로 비동기 흐름을 순차 코드처럼 쓰게 하고, `actor` 와 `Sendable` 로 공유 상태를 안전하게 다루는 언어·런타임 기능이다. Swift 6 언어 모드에서는 데이터 경합 가능성을 컴파일 오류로 보고한다. 최신 Swift 는 **6.4.2** 이며, 라이선스는 Apache-2.0.

- 위치: Combine 은 새 코드에서 `async/await` + `AsyncSequence`(와 UI 쪽 Observation)로 대체되는 추세다. Combine 이 더 이상 확장되지 않는다는 공식 선언은 확인하지 못했고, 기존 앱에서는 계속 동작한다.
- 언어 자체 설명은 [Swift](/develop-wiki/languages/swift/) 페이지 참고.

## 설치
Swift 툴체인(Xcode 또는 swift.org)에 포함돼 있다. 엄격 검사는 언어 모드로 켠다.
```swift
// Package.swift (swift-tools-version 6.0 이상이면 기본 Swift 6 모드)
.target(name: "App", swiftSettings: [.swiftLanguageMode(.v6)])
```
Xcode 에서는 Build Settings 의 *Swift Language Version* 을 6 으로 바꾼다. 점진 이행은 모듈별로 모드를 나눠 진행한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `async` / `await` | 중단 가능한 함수 선언과 호출 지점 표시 |
| `Task { }` | 비구조적 작업 시작. 현재 액터 컨텍스트 상속 |
| `async let` / `TaskGroup` | 자식 작업을 병렬 실행하고 결과 수집 (구조적 동시성) |
| `actor` | 내부 상태에 한 번에 한 작업만 접근하게 격리 |
| `@MainActor` | 메인 스레드(UI) 격리. 뷰·뷰모델에 붙인다 |
| `Sendable` | 격리 경계를 안전하게 넘을 수 있는 타입. 값 타입·불변 클래스·액터 |
| `AsyncSequence` / `AsyncStream` | 비동기 값 스트림 (`for await`) |
| 취소 | 협력형. `Task.checkCancellation()`, `Task.isCancelled` |

## 기본 사용법
```swift
actor Counter {
    private var value = 0
    func increment() -> Int { value += 1; return value }
}

struct User: Sendable, Decodable { let id: Int; let name: String }

func loadUsers(ids: [Int]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                let url = URL(string: "https://example.com/users/\(id)")!
                let (data, _) = try await URLSession.shared.data(from: url)
                return try JSONDecoder().decode(User.self, from: data)
            }
        }
        return try await group.reduce(into: []) { $0.append($1) }
    }
}

@MainActor
final class ViewModel {
    var users: [User] = []
    func refresh() async { users = (try? await loadUsers(ids: [1, 2, 3])) ?? [] }
}
```

## 자주 쓰는 패턴
- **UI 격리.** 뷰모델에 `@MainActor` 를 붙여 UI 상태 갱신을 메인 액터에 고정한다.
- **콜백 API 감싸기.** `withCheckedThrowingContinuation` 으로 델리게이트·완료 핸들러를 `async` 로 바꾼다(재개는 정확히 한 번).
- **스트림 변환.** 이벤트 소스는 `AsyncStream` 으로 만들고 `for await` 로 소비한다.
- **취소 연동.** SwiftUI 의 `.task { }` 는 뷰가 사라지면 자동 취소된다.
- **Sendable 오류 대처.** 가변 클래스는 액터로 바꾸거나 값 타입으로 전달한다. `@unchecked Sendable` 은 내부 동기화를 직접 보장할 때만 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모든 신규 Swift 비동기 코드. 네트워크·디스크 I/O, 병렬 작업, 공유 상태 보호.
- 피할 때(대안): 오래된 OS 지원·기존 Combine 파이프라인을 당장 갈아엎을 필요는 없다. 극단적 저지연 락 코드는 별도 저수준 동기화를 검토한다.

## 공식 문서
- [The Swift Programming Language: Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/) · [Swift 6 마이그레이션 가이드](https://www.swift.org/migration/documentation/migrationguide/)
