---
name: SwiftUI
url: https://developer.apple.com/swiftui/
docs: https://developer.apple.com/documentation/swiftui
domain: mobile
category: ios
description: Apple 플랫폼 공통의 선언형 UI 프레임워크. 상태가 바뀌면 뷰를 다시 계산하는 방식으로 iOS·iPadOS·macOS·watchOS·visionOS 화면을 Swift 코드로 만든다.
pricing: free
tags: [ui, declarative, apple, swift]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SwiftUI는 화면을 "상태 → 뷰" 함수로 기술하는 Apple의 선언형 UI 프레임워크다. 뷰는 가벼운 값 타입(`struct`)이고, 상태가 바뀌면 프레임워크가 `body`를 다시 계산해 필요한 부분만 갱신한다. 하나의 코드로 iPhone·iPad·Mac·Apple Watch·Vision Pro를 모두 대상으로 삼을 수 있다.

- 이 문서는 **Xcode 27 (iOS 27 SDK, Swift 6.4 컴파일러)** 기준이다. Xcode 27의 배포 대상 범위는 iOS 15~27이다.
- 명령형 UI 프레임워크인 [UIKit](/develop-wiki/mobile/ios/uikit/)과 한 앱 안에서 섞어 쓸 수 있다(`UIHostingController`, `UIViewRepresentable`).
- 언어는 [Swift](/develop-wiki/languages/swift/).

## 설치
별도 설치는 없다. [Xcode](/develop-wiki/mobile/ios/xcode/)에서 새 프로젝트를 만들 때 Interface를 **SwiftUI**로 고르면 된다. 코드에서는 `import SwiftUI`만 하면 된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `View` 프로토콜 | `body`에서 다른 뷰를 조합해 반환하는 값 타입 |
| 수정자(modifier) | `.padding()`, `.font()`처럼 뷰를 감싸 새 뷰를 만드는 메서드. 순서가 결과에 영향을 준다 |
| `@State` | 뷰가 소유하는 지역 상태. 값이 바뀌면 뷰를 다시 그린다 |
| `@Binding` | 부모가 가진 상태를 자식이 읽고 쓰게 하는 참조 |
| `@Observable` | Observation 프레임워크 매크로(iOS 17+). 클래스의 프로퍼티 접근을 추적해 읽은 뷰만 갱신 |
| `@Bindable` | `@Observable` 객체의 프로퍼티에 바인딩(`$model.name`)을 만들 때 사용 |
| `@Environment` | 트리 아래로 값을 주입·조회 (색 구성표, 의존성 객체 등) |
| `NavigationStack` | 값 기반 경로(`path`)로 화면 스택을 관리하는 내비게이션 컨테이너 |
| `.task` | 뷰가 나타날 때 비동기 작업을 시작하고 사라지면 취소 |
| `#Preview` | Xcode 캔버스에 미리보기를 띄우는 매크로 |

## 기본 사용법
상태를 가진 최소 화면.

```swift
import SwiftUI

struct CounterView: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 12) {
            Text("탭 \(count)회")
                .font(.title)
            Button("더하기") { count += 1 }
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview { CounterView() }
```

`@Observable` 모델과 목록·내비게이션을 묶은 예.

```swift
import SwiftUI

@Observable final class TodoStore {
    var items: [String] = ["우유 사기"]
    func add(_ title: String) { items.append(title) }
}

struct TodoListView: View {
    @State private var store = TodoStore()

    var body: some View {
        NavigationStack {
            List(store.items, id: \.self) { item in
                NavigationLink(item, value: item)
            }
            .navigationDestination(for: String.self) { Text($0) }
            .toolbar { Button("추가") { store.add("새 할 일") } }
            .navigationTitle("할 일")
        }
    }
}
```

## 자주 쓰는 패턴
- **상태 소유자는 하나.** 데이터를 만드는 뷰가 `@State`로 소유하고, 하위 뷰에는 값·`@Binding`·`@Bindable`로 내려준다.
- **비동기 로딩은 `.task`.** `onAppear` + `Task {}` 대신 `.task { await load() }`를 쓰면 뷰가 사라질 때 자동 취소된다. 값에 따라 다시 실행하려면 `.task(id:)`.
- **의존성 주입은 Environment.** `.environment(store)`로 넣고 `@Environment(TodoStore.self) var store`로 꺼낸다.
- **UIKit 컴포넌트 재사용.** SwiftUI에 없는 뷰는 `UIViewRepresentable`/`UIViewControllerRepresentable`로 감싼다.
- **영속 데이터는 [SwiftData](/develop-wiki/mobile/ios/swiftdata/).** `@Query`가 SwiftUI 뷰와 바로 연결된다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 Apple 플랫폼 앱, 위젯·watchOS·visionOS처럼 SwiftUI만 지원하는 영역, 미리보기로 빠르게 화면을 반복할 때.
- 피할 때(대안): 낮은 OS 버전 지원이 필요하거나 컬렉션 뷰·텍스트 편집을 세밀하게 제어해야 하면 [UIKit](/develop-wiki/mobile/ios/uikit/). Android까지 한 코드로 만들려면 [Flutter](/develop-wiki/mobile/cross-platform/flutter/)·[Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/).

## 공식 문서
- [SwiftUI 문서](https://developer.apple.com/documentation/swiftui) · [SwiftUI 튜토리얼](https://developer.apple.com/tutorials/swiftui) · [Observation](https://developer.apple.com/documentation/observation)
- [Xcode 지원 버전 표](https://developer.apple.com/support/xcode/)
