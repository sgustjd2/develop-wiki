---
name: Apple Vision Pro 개발 (visionOS)
url: https://developer.apple.com/visionos/
docs: https://developer.apple.com/documentation/visionos
domain: xr
category: vr-platform
description: Apple Vision Pro용 visionOS 앱 개발. SwiftUI 창·볼륨·몰입 공간과 RealityKit, ARKit 공간 데이터를 쓰고 Xcode 시뮬레이터와 Reality Composer Pro로 만든다.
pricing: free
tags: [apple, visionos, spatial-computing, swiftui, realitykit]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
visionOS는 Apple Vision Pro의 운영체제로 iOS·iPadOS 프레임워크 위에 공간 기능을 얹은 구조다. 앱은 사용자의 방 안에 창(window)을 띄우고, 필요하면 볼륨(3D 영역)과 몰입 공간(immersive space)으로 확장한다. 입력은 시선+손가락 집기가 기본이다.

- 현재 세대는 **visionOS 27**(WWDC26 발표, 개발 도구는 Xcode 27). 27 세대 보도 요약: macOS Spatial Preview 프레임워크(Mac에서 Vision Pro로 공간 콘텐츠 미리보기와 SharePlay 협업), 객체 추적 개선과 iOS 확장, IR LED 추적 액세서리 개발 허용. 세부 API는 [What's new in visionOS](https://developer.apple.com/visionos/whats-new/)에서 확인한다.
- 기존 iPad 앱은 "호환" 모드로 실행되고, 네이티브로 만들려면 Xcode에서 visionOS 대상을 추가한다.
- Unity는 PolySpatial로 RealityKit에 연결해 mixed 공간을 지원한다(문서 확인 필요).

## 설치
[Xcode](/develop-wiki/mobile/ios/xcode/)(visionOS SDK·시뮬레이터 포함, macOS 필요)를 받고 새 프로젝트에서 **visionOS → App**을 고른다. 몰입 공간 시작 방식(Immersive Space) 옵션과 Reality Composer Pro 패키지가 템플릿에 들어 있다. 실기기 없이 시뮬레이터로 시작할 수 있으나 센서 기반 기능은 제한된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Window | 2D SwiftUI 콘텐츠를 공간에 띄운 창 |
| Volume | `.windowStyle(.volumetric)`로 만든 3D 경계 영역, 모든 각도에서 볼 수 있음 |
| `ImmersiveSpace` | 앱이 공간 전체를 쓰는 장면. 스타일 `.mixed`, `.progressive`, `.full` |
| Ornament | 창 가장자리에 붙는 도구막대 같은 보조 UI |
| `RealityView` | SwiftUI 안의 [RealityKit](/develop-wiki/xr/ar-sdk/realitykit/) 3D 콘텐츠 |
| `ARKitSession` | 손 추적·평면·장면 재구성·월드 추적 데이터 접근 ([ARKit](/develop-wiki/xr/ar-sdk/arkit/)) |
| 권한 | 월드 센싱·손 추적은 사용자 승인이 필요 |

## 기본 사용법
창, 몰입 공간을 한 앱에 선언하고 버튼으로 연다.

```swift
import SwiftUI
import RealityKit

@main
struct DemoApp: App {
    var body: some Scene {
        WindowGroup { LauncherView() }

        ImmersiveSpace(id: "space") {
            RealityView { content in
                let ball = ModelEntity(mesh: .generateSphere(radius: 0.15),
                                       materials: [SimpleMaterial(color: .orange, isMetallic: false)])
                ball.position = [0, 1.4, -1.2]
                content.add(ball)
            }
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
    }
}

struct LauncherView: View {
    @Environment(\.openImmersiveSpace) private var open
    var body: some View {
        Button("공간 열기") {
            Task { _ = await open(id: "space") }
        }
        .padding()
    }
}
```

## 자주 쓰는 패턴
- **창에서 시작.** 처음 보이는 것은 항상 창으로 두고, 몰입 공간은 사용자가 요청할 때만 연다. 닫기 경로도 제공한다.
- **볼륨으로 3D 미리보기.** 제품·모델은 `.windowStyle(.volumetric)` 창에 `Model3D`/`RealityView`로 보여 준다.
- **공유와 협업.** SharePlay로 공간 경험을 함께 쓰는 앱을 만든다.
- **시뮬레이터 테스트 후 실기기.** 시선·손 입력과 공간 감지는 실기기에서 검증한다.
- **iOS 코드 재사용.** SwiftUI 뷰·SwiftData 등 [SwiftUI](/develop-wiki/mobile/ios/swiftui/) 자산을 그대로 가져온다.

## 언제 쓰나 / 피할 때
- 쓸 때: Apple 생태계 앱을 공간으로 확장, 고화질 MR 앱·엔터프라이즈 도구.
- 피할 때(대안): 저가 보급형 VR 사용자나 다기기 지원이 필요하면 [Meta Quest](/develop-wiki/xr/vr-platform/meta-quest-development/)·[Android XR](/develop-wiki/xr/vr-platform/android-xr/)·OpenXR. Swift 외 코드베이스는 Unity PolySpatial 검토.

## 공식 문서
- [visionOS 문서](https://developer.apple.com/documentation/visionos) · [visionOS 개요](https://developer.apple.com/visionos/) · [What's new](https://developer.apple.com/visionos/whats-new/) · 디자인 지침은 [visionOS 디자인 지침](/develop-wiki/xr/learning/visionos-design-guidelines/)
