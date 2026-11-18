---
name: Unity
url: https://unity.com
docs: https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.7/manual/index.html
domain: xr
category: engines
description: C# 기반 범용 게임 엔진. XR Interaction Toolkit·OpenXR 플러그인·AR Foundation으로 VR·MR·모바일 AR 앱을 만든다.
pricing: freemium
tags: [vr, ar, mr, openxr, game-engine, xr-interaction-toolkit]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Unity는 C# 스크립트와 에디터 중심 워크플로로 2D·3D 앱을 만드는 엔진이며, XR 개발에서 가장 널리 쓰이는 선택지 중 하나다. XR 기능은 엔진 본체가 아니라 패키지(Package Manager)로 제공된다. 헤드셋 입출력은 **XR Plug-in Management + OpenXR Plugin**, 상호작용은 **XR Interaction Toolkit(XRI)**, 모바일 AR은 **AR Foundation**이 맡는다.

- 이 문서 확인 기준 패키지 최신판: XR Interaction Toolkit 3.7, OpenXR Plugin 1.19, AR Foundation 6.7(Unity 문서 `@latest` 리디렉션 기준). 지원 에디터 버전은 패키지 문서의 요구 사항을 확인한다.
- 요금(공식 가격 변경 안내 페이지 기준): Runtime Fee는 취소되어 Unity 6를 포함한 어떤 버전에도 적용되지 않는다. Personal은 연 매출·투자금 합계 $200,000 이하, Pro는 $200,000 초과, Enterprise는 $25 million 이상일 때 필요한 플랜이다. 플랜별 가격·기능은 변동이 잦으니 공식 요금 페이지에서 확인한다.

## 설치
Unity Hub에서 에디터를 설치한 뒤 프로젝트를 만들고 패키지를 추가한다.
```text
Window > Package Manager > Unity Registry
  - XR Plugin Management
  - OpenXR Plugin
  - XR Interaction Toolkit   (Samples 에서 Starter Assets 임포트)
  - AR Foundation            (모바일 AR 시)
Project Settings > XR Plug-in Management > OpenXR 체크, Interaction Profiles 추가
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| XR Plug-in Management | 플랫폼별 XR 제공자(OpenXR 등)를 켜고 끄는 설정 |
| OpenXR Plugin | Khronos OpenXR 런타임에 연결. Interaction Profile·Feature Group으로 기기별 기능 선택 |
| XR Origin | 카메라와 컨트롤러를 담는 추적 공간의 루트 |
| Interactor / Interactable | 손·레이(`XRRayInteractor`)가 대상(`XRGrabInteractable`)을 가리키고 잡는 구조 |
| Interaction Manager | 상호작용 상태를 중재하는 `XRInteractionManager` |
| Locomotion | 텔레포트·연속 이동·회전 제공자 |
| AR Foundation | `ARSession`, `ARRaycastManager`, `ARPlaneManager` 등 ARCore/ARKit 추상화 |

## 기본 사용법
잡기 이벤트를 받는 컴포넌트 (XRI 3.x 네임스페이스):
```csharp
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit.Interactables;

[RequireComponent(typeof(XRGrabInteractable))]
public class GrabLogger : MonoBehaviour
{
    XRGrabInteractable grab;
    void OnEnable()
    {
        grab = GetComponent<XRGrabInteractable>();
        grab.selectEntered.AddListener(e => Debug.Log($"잡음: {e.interactorObject.transform.name}"));
        grab.selectExited.AddListener(_ => Debug.Log("놓음"));
    }
    void OnDisable() => grab.selectEntered.RemoveAllListeners();
}
```
AR Foundation에서 화면 터치 지점의 평면을 찾는 예:
```csharp
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

public class PlaceOnPlane : MonoBehaviour
{
    [SerializeField] ARRaycastManager raycaster;
    [SerializeField] GameObject prefab;
    static readonly List<ARRaycastHit> hits = new();

    void Update()
    {
        if (Input.touchCount == 0) return;
        var t = Input.GetTouch(0);
        if (t.phase == TouchPhase.Began && raycaster.Raycast(t.position, hits, TrackableType.PlaneWithinPolygon))
            Instantiate(prefab, hits[0].pose.position, hits[0].pose.rotation);
    }
}
```
(프로젝트가 새 Input System만 쓰도록 설정돼 있으면 `Input` 대신 Input System API로 바꾼다.)

## 자주 쓰는 패턴
- 시작은 XRI 샘플 `Starter Assets`의 XR Origin 프리팹을 장면에 놓고 시작한다.
- 기기별 입력 차이는 OpenXR Interaction Profile(Meta Quest Touch, Valve Index 등)을 추가해 흡수한다.
- 손 추적은 XR Hands 패키지와 OpenXR의 Hand Tracking 기능을 함께 켠다.
- 모바일 VR·MR은 URP를 쓰고 드로우콜·오버드로를 줄이는 쪽으로 최적화한다.
- AR과 VR을 한 프로젝트에서 쓰려면 플랫폼별 빌드 타깃에서 각각 XR 제공자를 설정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 헤드셋(Quest, PC VR, Android XR 등)과 모바일 AR을 한 코드베이스로 노리고, C# 생태계와 에셋 스토어를 활용할 때.
- 피할 때: 완전 오픈소스 스택이 필요하면 Godot, 웹 배포가 목표면 Babylon.js·A-Frame·PlayCanvas, 최고 수준 그래픽 충실도가 필요하면 Unreal을 검토한다.

## 공식 문서
- [XR Interaction Toolkit](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.7/manual/index.html) · [OpenXR Plugin](https://docs.unity3d.com/Packages/com.unity.xr.openxr@latest/) · [AR Foundation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@latest/)
- [요금제 변경 안내](https://unity.com/products/pricing-updates)
