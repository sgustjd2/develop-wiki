---
name: ARKit
url: https://developer.apple.com/augmented-reality/arkit/
docs: https://developer.apple.com/documentation/arkit
domain: xr
category: ar-sdk
description: Apple의 증강현실 프레임워크. 카메라·모션 센서로 기기 위치를 추적하고 평면·이미지·얼굴·장면 메시를 인식해 iPhone·iPad와 Vision Pro에서 AR 앱을 만든다.
pricing: free
tags: [ar, apple, tracking, slam, visionos]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
ARKit은 Apple 기기의 카메라와 센서를 합쳐 "기기가 현실 공간 어디에 있는지"와 "주변에 무엇이 있는지"를 알려 주는 프레임워크다. 그리기는 하지 않는다. 렌더링은 [RealityKit](/develop-wiki/xr/ar-sdk/realitykit/)·SceneKit·Metal이 맡고, ARKit은 추적·인식 데이터를 제공한다.

- **두 갈래 API.** iOS·iPadOS는 `ARSession` + `ARConfiguration`(문서상 iOS 11+), visionOS는 `ARKitSession` + 데이터 제공자(provider) 방식(visionOS 1+)이다. 두 API는 호환되지 않는다.
- 이 문서는 Xcode 27(iOS·visionOS 27 SDK) 기준이다. 일부 기능은 기기 사양(LiDAR, TrueDepth)에 따라 지원 여부가 갈린다.
- Android 대응은 [ARCore](/develop-wiki/xr/ar-sdk/arcore/), 플랫폼 간 공통 표준은 OpenXR이다.

## 설치
별도 설치는 없다. [Xcode](/develop-wiki/mobile/ios/xcode/)에서 `import ARKit`만 하면 된다. 카메라 사용 설명(`NSCameraUsageDescription`)이 필요하고, visionOS에서 월드 센싱 데이터를 쓰려면 `NSWorldSensingUsageDescription`(손 추적은 `NSHandsTrackingUsageDescription`)을 Info.plist에 넣는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ARSession` / `ARConfiguration` | iOS에서 추적 세션과 그 설정. `ARWorldTrackingConfiguration`(6DoF), `ARFaceTrackingConfiguration` 등 |
| `ARAnchor` | 현실 좌표계에 고정된 지점. 평면·이미지·얼굴도 앵커의 하위 종류 |
| 평면 감지 | `planeDetection = [.horizontal, .vertical]`로 바닥·벽 인식 |
| 레이캐스트 | 화면 점에서 실제 표면까지 광선을 쏴 배치 위치를 얻는다 |
| Scene Reconstruction | LiDAR 기기에서 주변 메시와 의미 분류를 제공 |
| `ARKitSession` (visionOS) | provider(평면·장면 재구성·손·이미지·월드 추적 등)를 실행하는 세션 |
| `WorldTrackingProvider` | visionOS에서 기기 포즈와 월드 앵커를 다룬다 |

## 기본 사용법
iOS: 수평면을 감지하는 AR 뷰(RealityKit `ARView` 사용).

```swift
import ARKit
import RealityKit

final class ARViewController: UIViewController {
    let arView = ARView(frame: .zero)

    override func viewDidLoad() {
        super.viewDidLoad()
        arView.frame = view.bounds
        view.addSubview(arView)
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal]
        arView.session.run(config)
    }
}
```

visionOS: 평면 감지 provider 실행(몰입 공간이 열려 있어야 한다).

```swift
import ARKit

let session = ARKitSession()
let planes = PlaneDetectionProvider(alignments: [.horizontal])

func startPlanes() async throws {
    _ = await session.requestAuthorization(for: [.worldSensing])
    try await session.run([planes])
    for await update in planes.anchorUpdates {
        print(update.event, update.anchor.classification)
    }
}
```

## 자주 쓰는 패턴
- **탭해서 배치.** `arView.raycast(from:allowing:alignment:)`로 얻은 `worldTransform`에 `AnchorEntity`를 만든다.
- **기능 지원 확인.** `ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)`처럼 실행 전에 확인하고 미지원 기기는 대체 경로를 둔다.
- **월드 맵 저장.** `getCurrentWorldMap`으로 맵을 저장해 다음 세션에서 같은 공간을 복원한다(iOS).
- **visionOS 권한 처리.** provider별 권한을 `requestAuthorization`으로 받고, 거부 상태를 UI에 반영한다.
- **이미지·객체 추적.** 참조 이미지·`ReferenceObject`를 등록하면 해당 대상에 콘텐츠를 붙일 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: iPhone·iPad·Vision Pro 전용 AR 앱, LiDAR·TrueDepth 같은 Apple 하드웨어 기능이 필요할 때.
- 피할 때(대안): Android까지 같은 코드로 가려면 [ARCore](/develop-wiki/xr/ar-sdk/arcore/)+Unity AR Foundation. 브라우저 AR은 WebXR.

## 공식 문서
- [ARKit 문서](https://developer.apple.com/documentation/arkit) · [visionOS용 ARKit](https://developer.apple.com/documentation/visionos/setting-up-access-to-arkit-data) · [visionOS 개발 개요](/develop-wiki/xr/vr-platform/apple-vision-pro-visionos/)
