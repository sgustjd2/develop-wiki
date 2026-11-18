---
name: RealityKit
url: https://developer.apple.com/augmented-reality/realitykit/
docs: https://developer.apple.com/documentation/realitykit
domain: xr
category: ar-sdk
description: Apple의 3D 렌더링·물리·공간 오디오 프레임워크. Entity-Component 구조로 iOS·macOS·visionOS의 AR·공간 콘텐츠를 Swift로 만들고 SwiftUI의 RealityView에 얹는다.
pricing: free
tags: [3d, ecs, apple, visionos, rendering]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
RealityKit은 AR과 공간 앱을 위한 Apple의 렌더링·시뮬레이션 엔진이다. 장면을 Entity(객체)에 Component(데이터)를 붙이고 System(로직)이 처리하는 ECS 방식으로 구성한다. 사실적 조명, 물리, 애니메이션, 공간 오디오를 내장하고 [ARKit](/develop-wiki/xr/ar-sdk/arkit/) 데이터와 연결된다.

- 문서 기준 플랫폼: iOS 13+, macOS 10.15+, tvOS 26+, **visionOS 1+**. 이 문서는 Xcode 27 SDK 기준이다. 27 세대에는 시뮬레이션·렌더링 개선과 macOS Spatial Preview 같은 도구 확장이 발표됐다.
- visionOS의 SwiftUI 창·볼륨·몰입 공간 안에서 3D 콘텐츠를 그리는 표준 수단이 RealityKit이다. 앱 구조는 [visionOS 개발](/develop-wiki/xr/vr-platform/apple-vision-pro-visionos/) 참고.
- 에셋 제작은 Reality Composer Pro(Xcode 동봉)와 USD/USDZ 파일을 쓴다.

## 설치
Xcode에서 `import RealityKit`. visionOS 프로젝트 템플릿은 `RealityView`와 Reality Composer Pro 패키지를 기본 제공한다. 언어는 [Swift](/develop-wiki/languages/swift/), UI는 [SwiftUI](/develop-wiki/mobile/ios/swiftui/).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Entity` | 장면의 객체. 계층 구조(부모·자식)를 이룬다 |
| `Component` | 데이터 조각: `ModelComponent`, `CollisionComponent`, `InputTargetComponent`, `PhysicsBodyComponent` 등 |
| `System` | 매 프레임 컴포넌트를 처리하는 사용자 정의 로직 |
| `RealityView` | SwiftUI에서 RealityKit 장면을 담는 뷰. `make`/`update` 클로저와 attachments |
| `AnchorEntity` | 평면·이미지·월드 위치 등에 장면을 고정 |
| `ModelEntity` | 메시와 머티리얼을 가진 엔티티. `generateSphere` 등 기본 메시 |
| `ARView` | UIKit 기반 AR 뷰(iOS). 신규 코드는 `RealityView`를 우선 검토 |
| Reality Composer Pro | 장면·머티리얼(Shader Graph)·파티클을 시각 편집 |

## 기본 사용법
탭하면 커지는 구 (visionOS `RealityView`).

```swift
import SwiftUI
import RealityKit

struct SphereView: View {
    var body: some View {
        RealityView { content in
            let sphere = ModelEntity(
                mesh: .generateSphere(radius: 0.1),
                materials: [SimpleMaterial(color: .systemBlue, isMetallic: false)]
            )
            sphere.position = [0, 1.2, -1]
            sphere.components.set(InputTargetComponent())
            sphere.generateCollisionShapes(recursive: false)
            content.add(sphere)
        }
        .gesture(
            TapGesture().targetedToAnyEntity().onEnded { value in
                value.entity.scale *= 1.2
            }
        )
    }
}
```

USDZ 모델 불러오기.

```swift
RealityView { content in
    if let model = try? await Entity(named: "Toy", in: realityKitContentBundle) {
        content.add(model)
    }
}
```
(`realityKitContentBundle`은 visionOS 템플릿의 Reality Composer Pro 패키지가 내보내는 번들이다.)

## 자주 쓰는 패턴
- **입력은 두 컴포넌트가 한 쌍.** 제스처를 받으려면 `InputTargetComponent`와 충돌 형태(`CollisionComponent`)가 모두 있어야 한다.
- **UI를 3D에 붙이기.** `RealityView`의 `attachments`로 SwiftUI 뷰를 엔티티 위치에 올린다.
- **커스텀 로직은 System.** 매 프레임 갱신을 `System`으로 분리하고 `Component`를 `registerComponent()`로 등록한다.
- **성능.** 엔티티 수와 드로우콜을 줄이고, 머티리얼은 Reality Composer Pro에서 미리 구성한다.
- **iOS와 공유.** 같은 엔티티 코드를 `RealityView`(iOS 18+ 지원 범위는 문서 확인)나 `ARView`에서 재사용한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Apple 플랫폼 전용 AR·공간 앱, SwiftUI와 한 코드베이스로 창과 3D를 함께 구성할 때.
- 피할 때(대안): 멀티 플랫폼 XR 게임은 Unity/Unreal/Godot(OpenXR). 웹은 three.js·WebXR.

## 공식 문서
- [RealityKit 문서](https://developer.apple.com/documentation/realitykit) · [RealityView](https://developer.apple.com/documentation/realitykit/realityview) · [Reality Composer Pro](https://developer.apple.com/documentation/realitykit/designing-realitykit-content-with-reality-composer-pro)
