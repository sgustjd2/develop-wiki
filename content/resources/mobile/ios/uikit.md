---
name: UIKit
url: https://developer.apple.com/documentation/uikit
docs: https://developer.apple.com/documentation/uikit
domain: mobile
category: ios
description: iOS·iPadOS의 명령형 UI 프레임워크. 뷰 컨트롤러와 뷰 계층을 직접 다루며, 기존 앱 유지보수나 SwiftUI로 표현하기 어려운 세밀한 제어가 필요할 때 레퍼런스로 쓴다.
pricing: free
tags: [ui, imperative, apple, viewcontroller]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
UIKit은 iPhone 초기부터 이어진 iOS·iPadOS(및 tvOS, Mac Catalyst)의 기본 UI 프레임워크다. `UIViewController`가 화면 하나를, `UIView` 계층이 그 안의 요소를 맡고, 상태가 바뀌면 개발자가 직접 뷰 속성을 갱신하는 **명령형** 방식이다.

- 새 화면은 [SwiftUI](/develop-wiki/mobile/ios/swiftui/)로 만드는 경우가 늘었지만, 대규모 기존 앱과 시스템 수준 API(앱 생명주기, 텍스트 입력, 컬렉션 레이아웃)는 여전히 UIKit 위에 있다. 이 항목은 **레퍼런스** 성격으로 둔다.
- 이 문서는 Xcode 27(iOS 27 SDK) 기준이다. 언어는 [Swift](/develop-wiki/languages/swift/)(Objective-C도 가능).

## 설치
Xcode에 포함돼 있다. 프로젝트 생성 시 Interface를 **Storyboard**로 고르거나, 코드만으로 구성하려면 SceneDelegate에서 `window.rootViewController`를 직접 지정한다. 코드에서는 `import UIKit`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `UIApplication` / `UIApplicationDelegate` | 앱 프로세스 생명주기 |
| `UIScene` / `UISceneDelegate` | 창(scene) 단위 생명주기. 멀티 윈도 iPad 지원의 기반 |
| `UIViewController` | 화면 하나의 뷰 계층과 생명주기(`viewDidLoad`, `viewWillAppear`) 관리 |
| `UIView` | 그리기·레이아웃·터치 처리 단위 |
| Auto Layout | `NSLayoutConstraint`로 뷰 사이 관계를 선언해 크기·위치를 계산 |
| `UINavigationController` / `UITabBarController` | 스택·탭 내비게이션 컨테이너 |
| `UICollectionView` | 컴포지셔널 레이아웃 + diffable data source로 목록·그리드 구성 |
| Target-Action / Delegate | 이벤트 전달 방식. 최근 API는 `UIAction` 클로저도 지원 |

## 기본 사용법
코드로 버튼과 레이블을 배치하는 뷰 컨트롤러.

```swift
import UIKit

final class CounterViewController: UIViewController {
    private var count = 0
    private let label = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        label.text = "0"
        let button = UIButton(configuration: .filled(), primaryAction: UIAction(title: "더하기") { [weak self] _ in
            guard let self else { return }
            count += 1
            label.text = "\(count)"
        })
        let stack = UIStackView(arrangedSubviews: [label, button])
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }
}
```

## 자주 쓰는 패턴
- **SwiftUI 화면 넣기.** `UIHostingController(rootView: MySwiftUIView())`를 push/present 하면 UIKit 앱에 SwiftUI 화면을 점진적으로 도입할 수 있다.
- **Diffable data source.** `UICollectionViewDiffableDataSource`에 스냅숏을 적용해 목록 변경을 애니메이션과 함께 반영한다.
- **`translatesAutoresizingMaskIntoConstraints = false`** 를 빼먹으면 코드로 만든 제약이 충돌한다.
- **순환 참조 주의.** 클로저에서 `self`를 쓸 때 `[weak self]`로 캡처한다.
- **미리보기.** Xcode 27의 `#Preview` 매크로는 UIKit 뷰·뷰 컨트롤러도 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 기존 UIKit 코드베이스 유지보수, 텍스트 편집·제스처·컬렉션 레이아웃을 세밀하게 제어할 때, SwiftUI에 대응 API가 없는 시스템 기능을 쓸 때.
- 피할 때(대안): 새 화면·새 앱은 [SwiftUI](/develop-wiki/mobile/ios/swiftui/)가 코드량과 미리보기 면에서 유리하다.

## 공식 문서
- [UIKit 문서](https://developer.apple.com/documentation/uikit) · [앱과 scene 생명주기](https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle)
- [SwiftUI와 UIKit 함께 쓰기](https://developer.apple.com/documentation/swiftui/uihostingcontroller)
