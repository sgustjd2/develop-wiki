---
name: PICO 개발자 플랫폼
url: https://developer.picoxr.com/
docs: https://developer.picoxr.com/document/unity/
repo: https://github.com/pico-developer/PICO-Unity-Integration-SDK
domain: xr
category: vr-platform
description: ByteDance PICO 헤드셋(PICO 4 계열)용 개발 플랫폼. Unity·Unreal·Native·OpenXR·WebXR SDK, 혼합현실 Sense Pack과 PICO 스토어 배포 도구를 제공한다.
pricing: free
tags: [pico, bytedance, headset, unity, mixed-reality, openxr]
languages: [csharp, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
PICO는 ByteDance 계열의 XR 헤드셋 제조사이며 개발자 사이트(developer.picoxr.com)에서 SDK, 문서, 샘플, 앱 배포(PICO 스토어)를 제공한다. 주력은 **Unity**용 PICO Unity Integration SDK이고 Unreal·네이티브 SDK와 OpenXR·WebXR 경로도 문서에 나온다. 기기용 OS는 Android 기반이다.

- **PICO Unity Integration SDK 3.4.0**(GitHub 릴리스 `release_3.4.0`, 2026-03-25). 릴리스 노트상 Sense Pack(평면 감지 등), SecureMR, 카메라 이미지 API가 추가됐다. 저장소 라이선스는 NOASSERTION(별도 약관).
- 개발자 사이트 첫 화면은 "AI로 공간 앱 개발"을 내세운다. 지원 기기 목록과 지역별 판매·배포 정책은 이 문서에서 확인하지 못했다. 한국에서의 배포 가능 여부는 사이트의 스토어 가이드에서 확인한다.
- 같은 OpenXR을 쓰는 [Meta Quest](/develop-wiki/xr/vr-platform/meta-quest-development/) 앱을 이식하는 경우가 흔하다.

## 설치 (Unity)
1. Unity에서 Android 빌드 대상과 OpenXR 또는 PICO XR 플러그인을 선택한다(문서의 Unity 버전 요건 확인).
2. 개발자 사이트나 GitHub 저장소에서 Integration SDK 패키지를 받아 Package Manager의 "Add package from disk/git"으로 추가한다.
3. PICO 기기를 개발자 모드로 두고 USB(ADB)로 연결해 빌드한다.

GitHub의 `pico-developer`에는 `Getstarted-Unity`, `BasicSample-Unity`, `PlatformSample-Unity`와 Unreal용 샘플이 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Integration SDK | Unity용 추적·입력·렌더링 래퍼 |
| Sense Pack | MR 기능 묶음: 공간 앵커, 공유 앵커, 공간 메시, 씬 캡처, 평면 감지 |
| SecureMR | 카메라 데이터를 안전하게 처리하는 파이프라인(릴리스 노트에 기술) |
| Platform SDK | 계정·결제·업적 등 스토어 서비스 |
| PICO Developer Center | 앱 등록·심사·배포 사이트 |

## 기본 사용법 (Unity C#)
평면 감지 같은 MR 기능은 문서(Plane detection)의 Unity 절차를 따라 권한과 프로바이더를 켠다. 기본 연결 확인용 최소 스크립트는 다음과 같다(OpenXR 입력 사용).

```csharp
using UnityEngine;
using UnityEngine.XR;

public class HeadPoseLogger : MonoBehaviour
{
    void Update()
    {
        var head = InputDevices.GetDeviceAtXRNode(XRNode.Head);
        if (head.TryGetFeatureValue(CommonUsages.devicePosition, out Vector3 pos))
            Debug.Log($"Head: {pos}");
    }
}
```
PICO 전용 기능(`PXR_*` 클래스)은 SDK 문서를 기준으로 호출한다.

## 자주 쓰는 패턴
- **OpenXR 우선 + PICO 확장.** 표준 입력 위에 필요한 곳에만 PICO API를 얹어 다른 기기와 코드를 공유한다.
- **샘플 먼저.** `BasicSample-Unity`를 열어 빌드 설정을 그대로 복제한다.
- **MR 권한 점검.** 공간·카메라 기능은 런타임 권한과 기기별 지원 여부를 먼저 확인한다.
- **릴리스 노트 구독.** SDK 3.x는 기능이 빠르게 추가되므로 업그레이드 때 변경 내역을 읽는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 아시아·유럽 일부 시장의 독립형 VR/MR 앱, 기업용 PICO 기기.
- 피할 때(대안): 북미 시장 중심이면 Meta Quest 우선. 지역 배포 가능성이 불명확하면 먼저 정책을 확인한다.

## 공식 문서
- [PICO Developer](https://developer.picoxr.com/) · [Unity 문서](https://developer.picoxr.com/document/unity/) · [GitHub 샘플](https://github.com/pico-developer)
