---
name: The Composable Architecture
url: https://github.com/pointfreeco/swift-composable-architecture
docs: https://swiftpackageindex.com/pointfreeco/swift-composable-architecture/documentation/composablearchitecture
repo: https://github.com/pointfreeco/swift-composable-architecture
stars: 15035
domain: mobile
category: ios
description: Point-Free의 Swift 상태 관리·앱 아키텍처 라이브러리(TCA). 단방향 데이터 흐름, 부수 효과, 의존성 주입, 테스트를 한 틀로 묶어 SwiftUI 앱의 기능 단위를 조합한다.
pricing: oss
tags: [architecture, state-management, swiftui, unidirectional]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
TCA는 한 기능을 **State(상태) · Action(이벤트) · Reducer(상태 변경 로직) · Store(런타임)** 네 요소로 나누는 단방향 아키텍처다. 부수 효과(네트워크, 타이머)는 `Effect`로 분리해 reducer 는 순수하게 유지하고, 그 덕에 `TestStore`로 상태 변화와 효과를 한 줄씩 단언하는 테스트가 가능하다. 작은 기능 reducer 를 부모에 조합해 큰 앱을 만든다.

- 최신 릴리스 **1.26.2**(2026-08-28), MIT.
- 대안: SwiftUI 기본 `@Observable` + 뷰모델(가볍지만 규약 없음), MVVM. [SwiftUI](/develop-wiki/mobile/ios/swiftui/) 와 함께 쓰는 것이 기본 전제다.

## 설치
Swift Package Manager 로 추가한다. Xcode 의 **File > Add Package Dependencies** 에 저장소 URL 입력.

```swift
// Package.swift
.package(url: "https://github.com/pointfreeco/swift-composable-architecture", from: "1.26.2")
// target dependencies
.product(name: "ComposableArchitecture", package: "swift-composable-architecture")
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@Reducer` | 기능 하나를 정의하는 매크로. 내부에 `State`, `Action`, `body` 를 둔다 |
| `@ObservableState` | State 를 관찰 가능하게 만들어 SwiftUI 가 쓰는 프로퍼티만 갱신하게 한다 |
| `Store` | State 를 보관하고 Action 을 받아 reducer 를 실행하는 런타임 |
| `Effect` | 비동기 작업. `.run { send in ... }` 으로 결과를 Action 으로 되돌린다 |
| `@Dependency` | 시계, UUID, API 클라이언트 등을 주입. 테스트에서 교체 |
| `TestStore` | Action 을 보내고 State 변화·수신 Action 을 검증하는 테스트 도구 |
| `@Presents` / `.ifLet` | 시트·알림·네비게이션 같은 옵셔널 하위 기능 |

## 기본 사용법
```swift
import ComposableArchitecture
import SwiftUI

@Reducer
struct Counter {
    @ObservableState
    struct State: Equatable { var count = 0 }
    enum Action { case increment, decrement }

    var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .increment: state.count += 1; return .none
            case .decrement: state.count -= 1; return .none
            }
        }
    }
}

struct CounterView: View {
    let store: StoreOf<Counter>
    var body: some View {
        HStack {
            Button("-") { store.send(.decrement) }
            Text("\(store.count)")
            Button("+") { store.send(.increment) }
        }
    }
}
// 진입점: CounterView(store: Store(initialState: Counter.State()) { Counter() })
```

## 자주 쓰는 패턴
- **비동기 효과.** `return .run { send in await send(.loaded(try await api.fetch())) }`. 결과는 Action 으로만 상태에 반영한다.
- **기능 조합.** `Scope(state: \.child, action: \.child) { Child() }` 로 자식 reducer 를 부모에 붙인다.
- **의존성 교체.** `@Dependency(\.continuousClock) var clock` 처럼 선언하고 테스트에서 `withDependencies`/`TestStore` 로 가짜 값을 주입한다.
- **테스트.** `let store = TestStore(initialState: Counter.State()) { Counter() }` 후 `await store.send(.increment) { $0.count = 1 }`.
- **취소 가능한 효과.** `.cancellable(id:, cancelInFlight: true)` 로 검색어 디바운스 같은 흐름을 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상태가 복잡한 대형 SwiftUI 앱, 효과까지 포함한 철저한 테스트가 필요한 팀.
- 피할 때(대안): 화면이 단순한 앱, 학습·보일러플레이트 비용이 부담스러울 때는 `@Observable` 모델. 빌드 시간·매크로 의존성이 늘어나는 점도 고려한다.

## 공식 문서
- [DocC 문서](https://swiftpackageindex.com/pointfreeco/swift-composable-architecture/documentation/composablearchitecture) · [GitHub](https://github.com/pointfreeco/swift-composable-architecture)
