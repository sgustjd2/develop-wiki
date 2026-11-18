---
name: Android XR (Jetpack XR)
url: https://developer.android.com/develop/xr
docs: https://developer.android.com/develop/xr
repo: https://github.com/android/xr-samples
domain: xr
category: vr-platform
description: Google의 XR용 Android 플랫폼과 Jetpack XR SDK. Compose for XR로 공간 패널·오비터를 만들고 SceneCore·ARCore for Jetpack XR을 쓰며 Unity·OpenXR·WebXR도 지원한다.
pricing: free
tags: [google, android-xr, jetpack-xr, compose, headset, glasses]
languages: [kotlin, csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Android XR은 헤드셋과 스마트 글래스를 겨냥한 Android 확장 플랫폼이다. 기존 2D Android 앱은 헤드셋에서 그대로 실행되고, **Jetpack XR SDK**를 쓰면 공간 패널·3D 모델·몰입 환경을 추가해 "XR로 차별화된 앱"을 만들 수 있다. 언어는 [Kotlin](/develop-wiki/languages/kotlin/), UI는 [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)가 중심이다.

- **기기 범주**(공식 개발 허브): XR 헤드셋과 유선 XR 글래스(몰입형), 오디오 글래스와 디스플레이 글래스(경량 증강). 헤드셋은 Samsung Galaxy XR이 먼저 출시됐고, 글래스는 출시 시점과 가격을 1차 출처에서 확인하지 못했으므로 공식 Android XR 페이지에서 직접 확인한다.
- **라이브러리 상태(Google Maven, 2026-10-21 갱신)**: SceneCore 1.0.0, XR Runtime 1.0.0, ARCore for Jetpack XR 1.0.0 안정판. **Compose for XR는 1.0.0-beta02**, Jetpack Compose Glimmer(디스플레이 글래스용 디자인 시스템)는 1.0.0-alpha22로 아직 알파다. 베타·알파 API는 바뀔 수 있다.
- 다른 경로: Unity, Godot(OpenXR Vendors 플러그인), Unreal(OpenXR), WebXR.

## 설치
[Android Studio](/develop-wiki/mobile/android/android-studio/)에서 XR 가상 기기(헤드셋·유선 글래스·오디오/디스플레이 글래스 에뮬레이터)를 만들어 실행한다.

```kotlin
// app/build.gradle.kts
dependencies {
    implementation("androidx.xr.compose:compose:1.0.0-beta02")
    implementation("androidx.xr.scenecore:scenecore:1.0.0")
    implementation("androidx.xr.arcore:arcore:1.0.0")
}
```
Compose for XR는 일반 Jetpack Compose와 버전을 맞춰야 하므로 [릴리스 노트](https://developer.android.com/jetpack/androidx/versions)의 의존 관계를 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Spatial panel | 앱 UI를 3D 공간의 독립 패널로 배치 (`SpatialPanel`) |
| `Subspace` | Compose 안에서 3D 배치를 쓰는 영역 |
| Orbiter | 패널 가장자리에 떠 있는 보조 컨트롤 (내비게이션 등) |
| SceneCore | 엔티티·glTF 모델·공간 환경·공간 오디오 API |
| ARCore for Jetpack XR | 앵커, 의미 분할 등 (헤드셋·유선 글래스) |
| Glimmer / Material for XR | 투명 디스플레이용·XR용 디자인 시스템 |
| `LocalSpatialCapabilities` | 현재 기기에서 공간 UI 가능 여부 판별 |

## 기본 사용법
공간 UI가 가능하면 패널로, 아니면 기존 2D 화면으로(Kotlin, Compose).

```kotlin
import androidx.xr.compose.platform.LocalSpatialCapabilities
import androidx.xr.compose.spatial.Subspace
import androidx.xr.compose.subspace.SpatialPanel
import androidx.xr.compose.subspace.layout.SubspaceModifier
import androidx.xr.compose.subspace.layout.height
import androidx.xr.compose.subspace.layout.width

@Composable
fun AppRoot() {
    if (LocalSpatialCapabilities.current.isSpatialUiEnabled) {
        Subspace {
            SpatialPanel(SubspaceModifier.width(1024.dp).height(640.dp)) {
                HomeScreen()
            }
        }
    } else {
        HomeScreen()
    }
}
```
위 임포트·시그니처는 베타 기준으로 작성했다. 빌드가 실패하면 [Compose for XR 가이드](https://developer.android.com/develop/xr/jetpack-xr-sdk)의 최신 예제로 맞춘다.

## 자주 쓰는 패턴
- **먼저 2D 앱을 헤드셋에서 실행.** 호환 앱이 문제없이 도는지 확인한 뒤 공간 요소를 한 단계씩 추가한다.
- **폴백을 항상 둔다.** `LocalSpatialCapabilities`로 공간 UI 미지원 기기(폰·태블릿)를 구분해 같은 코드로 배포한다.
- **3D 콘텐츠는 glTF/GLB.** Blender 등에서 내보내 SceneCore로 불러온다.
- **기기별 라이브러리 구분.** 유선 글래스·헤드셋은 Compose for XR, 디스플레이 글래스는 Glimmer.
- **엔진 사용.** 몰입형 게임은 Unity/Godot/Unreal의 OpenXR 경로.

## 언제 쓰나 / 피할 때
- 쓸 때: 기존 Android 자산이 있는 팀, Play 스토어 앱의 XR 확장, Galaxy XR 겨냥.
- 피할 때(대안): 이미 Quest 중심이면 [Meta 경로](/develop-wiki/xr/vr-platform/meta-quest-development/), Apple 기기면 [visionOS](/develop-wiki/xr/vr-platform/apple-vision-pro-visionos/). 알파 API가 많은 글래스 영역은 변동을 감안한다.

## 공식 문서
- [Android XR 개발 허브](https://developer.android.com/develop/xr) · [XR 디자인](/develop-wiki/xr/learning/android-xr-design/) · [샘플](https://github.com/android/xr-samples)
