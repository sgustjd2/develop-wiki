---
name: ARCore
url: https://developers.google.com/ar
docs: https://developers.google.com/ar/develop
repo: https://github.com/google-ar/arcore-android-sdk
domain: xr
category: ar-sdk
description: Google의 모바일 AR SDK. 모션 추적·평면 감지·깊이(Depth)·Geospatial API를 Android와 iOS에 제공하며 Kotlin/Java, Unity, NDK에서 쓴다.
pricing: free
tags: [ar, google, android, geospatial, depth]
languages: [kotlin, java, csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
ARCore는 카메라와 IMU로 기기 포즈를 추적하고, 평면·깊이·조명 추정과 Google의 지도 데이터를 이용한 위치 기반 AR(Geospatial)을 제공한다. 렌더러는 포함하지 않는다. OpenGL/Filament/Sceneform 후속 라이브러리, Unity 등 원하는 엔진과 함께 쓴다.

- 최신 SDK는 **1.57.0**(GitHub `google-ar/arcore-android-sdk` 릴리스 2026-10-16, Google Maven 최신 1.57.0). iOS용 SDK(`arcore-ios-sdk`)는 1.57.1이며 Geospatial 등 일부 기능을 제공한다.
- Android 공식 지원 도구는 Android SDK(Kotlin/Java), NDK, Unity(AR Foundation + ARCore Extensions)다. 라이선스는 SDK 저장소가 NOASSERTION(별도 약관)이므로 사용 전 약관을 확인한다.
- Android XR 기기용 AR은 별도 라이브러리 [Jetpack XR의 ARCore](/develop-wiki/xr/vr-platform/android-xr/)를 쓴다.

## 설치
```kotlin
// app/build.gradle.kts
dependencies {
    implementation("com.google.ar:core:1.57.0")
}
```
`AndroidManifest.xml`에 카메라 권한과 `<meta-data android:name="com.google.ar.core" android:value="required"/>`(필수 앱) 또는 `optional`을 넣는다. 기기에는 "Google Play Services for AR"가 있어야 하며 지원 기기 목록은 문서에서 확인한다. 언어는 [Kotlin](/develop-wiki/languages/kotlin/), IDE는 [Android Studio](/develop-wiki/mobile/android/android-studio/).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Session` / `Config` | 추적 세션과 기능 설정(평면 감지, 깊이, Geospatial 등) |
| `Frame` | 매 프레임 카메라 포즈·추적 상태·감지 결과 스냅샷 |
| `Anchor` | 월드 좌표에 고정된 지점. 추적 보정에 따라 위치가 갱신된다 |
| `Plane` / `HitResult` | 감지된 평면과 화면 터치 지점의 충돌 결과 |
| Depth API | 화면 픽셀별 거리. 가림(occlusion)·메시 생성에 사용. `Config.DepthMode.AUTOMATIC` |
| Geospatial API | Visual Positioning Service로 위도·경도·방위 수준의 위치 추정, 지형·Rooftop 앵커 |
| Augmented Images/Faces, Cloud Anchors | 이미지 인식, 얼굴 메시, 여러 사용자가 공유하는 앵커 |

## 기본 사용법
깊이와 Geospatial을 켜고 프레임마다 확인하는 최소 흐름(Kotlin).

```kotlin
import com.google.ar.core.*

fun createSession(activity: Activity): Session {
    val session = Session(activity)
    val config = Config(session).apply {
        planeFindingMode = Config.PlaneFindingMode.HORIZONTAL
        if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC))
            depthMode = Config.DepthMode.AUTOMATIC
        if (session.isGeospatialModeSupported(Config.GeospatialMode.ENABLED))
            geospatialMode = Config.GeospatialMode.ENABLED
    }
    session.configure(config)
    return session
}

fun onFrame(session: Session) {
    val frame = session.update()
    val earth = session.earth ?: return
    if (earth.trackingState == TrackingState.TRACKING) {
        val pose = earth.cameraGeospatialPose
        println("${pose.latitude}, ${pose.longitude} ±${pose.horizontalAccuracy}m")
    }
}
```

## 자주 쓰는 패턴
- **설치·지원 확인.** `ArCoreApk.getInstance().requestInstall(...)`로 서비스 설치 상태를 확인한 뒤 세션을 만든다.
- **Geospatial 인증.** Geospatial은 Google Cloud 프로젝트의 ARCore API 설정이 필요하다. 키·토큰은 소스에 넣지 말고 문서의 키 없는(keyless) 인증 안내를 따른다.
- **정확도 게이팅.** `horizontalAccuracy`가 작아지기 전에는 앵커를 배치하지 말고 "주변을 비추세요" 안내를 띄운다.
- **깊이 가림.** 깊이 이미지를 셰이더에 넘겨 현실 물체 뒤로 가상 객체를 가린다.
- **Unity.** AR Foundation + ARCore XR Plugin으로 크로스 플랫폼, Geospatial·Cloud Anchors는 ARCore Extensions(1.57.0).

## 언제 쓰나 / 피할 때
- 쓸 때: Android 중심 모바일 AR, 도시 규모 위치 기반 AR(Geospatial), 깊이 기반 가림·측정.
- 피할 때(대안): iOS 전용이면 [ARKit](/develop-wiki/xr/ar-sdk/arkit/)·[RealityKit](/develop-wiki/xr/ar-sdk/realitykit/). 브라우저 AR은 WebXR 또는 [8th Wall](/develop-wiki/xr/ar-sdk/8th-wall/).

## 공식 문서
- [ARCore 개발 가이드](https://developers.google.com/ar/develop) · [Geospatial 개요](https://developers.google.com/ar/develop/geospatial) · [Depth](https://developers.google.com/ar/develop/depth) · [릴리스 노트](https://developers.google.com/ar/whatsnew-arcore)
