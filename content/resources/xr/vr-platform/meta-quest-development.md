---
name: Meta Quest 개발 (Horizon OS)
url: https://developers.meta.com/horizon/
docs: https://developers.meta.com/horizon/documentation/
repo: https://github.com/meta-quest/Meta-Spatial-SDK-Samples
domain: xr
category: vr-platform
description: Meta Quest 헤드셋(Meta Horizon OS)용 앱 개발 경로 모음. Unity·Unreal·OpenXR·네이티브와 Android 방식의 Meta Spatial SDK, 패스스루·앵커·씬 이해 등 Presence Platform 기능을 다룬다.
pricing: free
tags: [meta, quest, horizon-os, mixed-reality, spatial-sdk, openxr]
languages: [kotlin, csharp, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Meta Quest 기기는 Android 기반의 **Meta Horizon OS**를 쓴다. 개발자는 같은 기기를 세 방식으로 겨냥한다: 게임 엔진(Unity·Unreal·Godot), OpenXR 네이티브(C/C++), 그리고 Android 앱 개발자용 **Meta Spatial SDK**(Kotlin). 패스스루, 손 추적, 공간 앵커, 장면(Scene) 이해, 공유 공간 같은 혼합현실 기능을 묶어 Meta는 Presence Platform이라 부른다.

- 이 문서는 2026-11 기준이다. **Meta XR Core SDK(Unity UPM)는 209.0**(개발자 사이트 표기 2026-11-09)이고 버전 번호가 큰 수로 올라갔다. Meta Spatial SDK는 Maven Central 최신 **0.15.0**(2026-11-03)이다. Spatial SDK 공식 문서는 Horizon OS를 "Meta Horizon OS"라고 부른다.
- Meta Spatial SDK 샘플 저장소는 MIT 라이선스. Meta XR SDK 패키지 자체는 Meta의 별도 약관을 따른다.
- 표준 인터페이스는 OpenXR이며 Quest 전용 확장을 더해 쓴다. 엔진 선택은 [XR 엔진 항목](/develop-wiki/xr/engines/)을 함께 본다.

## 설치
| 경로 | 시작 |
| --- | --- |
| Unity | Package Manager에서 Meta XR Core SDK(또는 All-in-One SDK) 추가, XR Plug-in은 OpenXR |
| Unreal | Meta 포크 또는 Meta XR 플러그인(Unreal Engine 5 Integration) 사용 |
| Spatial SDK | Android Studio 프로젝트에 Gradle 플러그인·`com.meta.spatial` 의존성 추가 |
| 기기 연결 | 헤드셋을 개발자 모드로 전환 후 USB·Wi-Fi ADB, Meta Horizon Link로 PC 테스트 |

```kotlin
// Spatial SDK 의존성 예 (버전은 공식 문서·카탈로그 확인)
dependencies {
    implementation("com.meta.spatial:meta-spatial-sdk:0.15.0")
    implementation("com.meta.spatial:meta-spatial-sdk-vr:0.15.0")
    implementation("com.meta.spatial:meta-spatial-sdk-compose:0.15.0")
}
```
Maven Central에는 `-toolkit`, `-physics`, `-mruk`, `-animation`, `-spatialaudio` 등 모듈도 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Passthrough | 카메라 영상을 배경으로 써서 혼합현실 구성 |
| Scene / MRUK | 방 구조(벽·바닥·가구) 인식과 이를 다루는 Mixed Reality Utility Kit |
| Spatial Anchors | 현실 위치에 콘텐츠를 저장·복원, 공유 앵커 |
| Interaction SDK | 손·컨트롤러 상호작용 컴포넌트 모음 |
| Spatial SDK의 Entity/Component | Kotlin ECS. 패널(2D UI)을 3D 공간에 배치, glTF·물리 지원 |
| Spatial Editor | Spatial SDK용 씬 편집기 |
| Meta Quest Developer Hub | 기기 관리·로그·앱 업로드 데스크톱 도구 |

## 기본 사용법 (Spatial SDK, Kotlin)
공식 StarterSample의 구조를 줄인 것이다(패키지·클래스는 샘플과 같다).

```kotlin
class MyActivity : AppSystemActivity() {
    override fun registerFeatures(): List<SpatialFeature> =
        listOf(VRFeature(this), ComposeFeature())

    override fun onSceneReady() {
        super.onSceneReady()
        scene.setReferenceSpace(ReferenceSpace.LOCAL_FLOOR)
        Entity.create(
            listOf(
                Mesh("mesh://box".toUri()),
                Transform(Pose(Vector3(0f, 1f, -1.5f)))
            )
        )
    }
}
```
`registerPanels()`에서 `ComposeViewPanelRegistration`으로 [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/) 패널을 등록하면 2D UI를 공간에 띄울 수 있다. `mesh://box` 같은 기본 메시 URI는 샘플 코드로 확인했다.

Unity(C#)에서는 OVRCameraRig와 OVRManager 설정에서 패스스루·손 추적 권한을 켜고 Building Blocks 메뉴로 기능을 추가한다.

## 자주 쓰는 패턴
- **엔진 vs Spatial SDK.** 3D 게임·몰입 앱은 Unity/Unreal, 기존 Android 앱을 공간 앱으로 확장하거나 Kotlin 팀이면 Spatial SDK.
- **OpenXR 기본.** Unity는 OpenXR 제공자를 쓰고 Oculus XR 제공자(deprecated)는 피한다. Core SDK 209.0의 Forward Head Pose 설정은 OpenXR 제공자에서만 작동한다고 안내돼 있다.
- **권한 처리.** 장면·공간 데이터·손 추적은 런타임 권한이 필요하다. 거부 때의 대체 UX를 둔다.
- **성능 예산.** 스탠드얼론 모바일 칩이므로 draw call·오버드로를 줄이고 OVR Metrics로 프레임 확인.
- **Meta Horizon Store 배포.** 앱 심사·등록은 개발자 대시보드에서 진행(요건은 문서 확인).

## 언제 쓰나 / 피할 때
- 쓸 때: 가장 큰 독립형 VR/MR 사용자 기반을 겨냥할 때, 패스스루 MR 앱.
- 피할 때(대안): 다기기 지원이 목표면 OpenXR 표준을 최대한 쓰거나 [Android XR](/develop-wiki/xr/vr-platform/android-xr/)·[visionOS](/develop-wiki/xr/vr-platform/apple-vision-pro-visionos/)와의 이식 계획을 세운다.

## 공식 문서
- [Meta Horizon 개발자 문서](https://developers.meta.com/horizon/documentation/) · [Spatial SDK 소개](https://developers.meta.com/horizon/documentation/spatial-sdk/spatial-sdk-explainer) · [Meta XR Core SDK 다운로드](https://developers.meta.com/horizon/downloads/package/meta-xr-core-sdk/) · [샘플](https://github.com/meta-quest/Meta-Spatial-SDK-Samples)
