---
name: Android XR 디자인 가이드
url: https://developer.android.com/design/ui/xr
docs: https://developer.android.com/design/ui/xr
domain: xr
category: learning
description: Android XR 헤드셋·유선 글래스용 공식 디자인 가이드. 공간 패널, 오비터, 환경, 멀티모달 입력, Material Design for XR 원칙과 글래스 디자인 문서로의 안내를 제공한다.
pricing: free
tags: [android-xr, design, material, spatial-ui, guidelines]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Android Developers의 Android XR 디자인 섹션이다. 개요 페이지는 XR 헤드셋과 유선 XR 글래스를 대상으로 하며, 오디오·디스플레이 글래스는 별도 "AI Glasses" 디자인 섹션(`design/ui/ai-glasses`)에서 다룬다. 구현은 [Android XR 개발](/develop-wiki/xr/vr-platform/android-xr/) 항목과 [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)를 참고한다.

## 구성
| 섹션 | 내용 |
| --- | --- |
| Getting started | 공간(Space), 환경, 자연스러운 입력의 기초 |
| Design principles | 현실에서 출발, 편안함 유지, 핵심 XR 순간 추가, 접근성 |
| Visual design | Material 스타일: 크기·스케일, 큰 타깃, 색, 타이포그래피 |
| Multimodal inputs | 시선·손·음성·컨트롤러 등 여러 입력 방식 |
| Spatial UI | UI를 공간 패널로 나누고 오비터를 붙이고 공간 높이(elevation)로 위계 표현 |
| 3D models | 깊이·스케일·사실감을 위한 3D 요소 |
| Environments | 사용자를 중심에 두는 완전 몰입 |
| Motion | 정적 장면을 상호작용 장면으로 바꾸는 애니메이션 |
| Adaptable design | Material 3 XR 디자인 킷, 대형 화면 앱의 XR 호환 |

## 예제: 패널과 오비터
디자인의 "패널 + 오비터" 구성을 Compose for XR로 옮긴 개념 예. (Compose for XR는 베타라 시그니처가 바뀔 수 있다.)

```kotlin
Subspace {
    SpatialPanel(SubspaceModifier.width(1024.dp).height(640.dp)) {
        HomeScreen()
        Orbiter(position = OrbiterEdge.Bottom) {
            NavigationBar()   // 패널 가장자리에 떠 있는 보조 컨트롤
        }
    }
}
```
임포트와 인자는 [Compose for XR 가이드](https://developer.android.com/develop/xr/jetpack-xr-sdk)의 최신 예제에 맞춘다.

## 학습 순서 제안
1. 기존 대형 화면 앱을 Material 3 기준으로 맞춘다(XR 호환의 출발점).
2. Design principles와 Spatial UI를 읽고 화면을 패널 단위로 나눈다.
3. 오비터·공간 높이로 위계를 정리하고, 필요하면 3D 모델·환경을 추가한다.
4. Android Studio XR 에뮬레이터로 확인한다.
5. 글래스 대상이면 AI Glasses 가이드를 별도로 읽는다.

## 언제 쓰나 / 피할 때
- 쓸 때: Galaxy XR 같은 Android XR 기기용 UI 설계, 모바일 앱의 공간 확장.
- 피할 때(대안): Apple 기기 지침은 [visionOS 디자인](/develop-wiki/xr/learning/visionos-design-guidelines/), 모바일 일반 규칙은 [Material Design 3](/develop-wiki/mobile/learning/material-design-3/).

## 공식 문서
- [Android XR 디자인](https://developer.android.com/design/ui/xr) · [AI Glasses 디자인](https://developer.android.com/design/ui/ai-glasses) · [Android XR 개발 허브](https://developer.android.com/develop/xr)
