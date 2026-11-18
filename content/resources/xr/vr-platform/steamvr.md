---
name: SteamVR / OpenVR
url: https://store.steampowered.com/steamvr
docs: https://github.com/ValveSoftware/openvr/wiki
repo: https://github.com/ValveSoftware/openvr
domain: xr
category: vr-platform
description: Valve의 PC VR 런타임 SteamVR과 그 C++ API OpenVR. Index·Vive 등 여러 헤드셋을 지원하며 OpenXR 런타임으로도 동작해 Unity·Unreal·Godot에서 PC VR을 만들 때 쓴다.
pricing: free
tags: [valve, steamvr, openvr, pcvr, openxr]
languages: [cpp, csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
SteamVR은 Steam의 도구로 설치하는 VR 런타임이다. 앱이 특정 하드웨어를 몰라도 여러 제조사의 헤드셋·컨트롤러·트래커를 쓰게 해 주며, 그 앱용 인터페이스가 **OpenVR**(C/C++ 헤더, 저장소 `ValveSoftware/openvr`, BSD-3-Clause)이다. SteamVR은 OpenXR 런타임으로도 동작하므로 새 앱은 OpenVR보다 OpenXR을 먼저 고려하는 것이 일반적이다.

- 저장소 최신 릴리스는 **OpenVR v2.15.6**(2026-03-27). 공식 README는 "런타임은 Steam의 SteamVR 도구에 있다"고 설명한다.
- **SteamVR Unity Plugin** 최신 릴리스는 2.8.0(2024-01)이고 저장소는 이후에도 커밋이 있다(마지막 푸시 2025-11). Unity에서는 OpenXR 경로도 병행된다.
- **Steam Frame**: Valve의 독립형 헤드셋(SteamOS 기반, SteamVR 게임과 Windows·Linux·Android 앱 실행)이 2026-09-14에 가격·출시 방식이 공개됐고 예약 대기열 순서로 주문 안내가 나간다는 보도가 있다(출하 시점은 매체마다 엇갈린다). 1차 출처(Valve 페이지)에서는 확인하지 못했으므로 출시 정보는 Steam 하드웨어 페이지에서 직접 확인한다.
- Valve Index의 현재 판매 상태는 확인하지 못했다. SteamVR 자체는 계속 업데이트되고 있다.

## 설치
Steam 클라이언트 라이브러리의 **도구(Tools) → SteamVR**를 설치한다. OpenVR 헤더가 필요하면 저장소를 받는다.

```bash
git clone https://github.com/ValveSoftware/openvr.git
```
Unity는 OpenXR 플러그인이나 SteamVR Unity Plugin을 패키지 매니저/Asset Store에서 추가한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| SteamVR Runtime | 장치 드라이버·합성·캘리브레이션을 담당하는 런타임 |
| OpenVR API | 앱용 C++ API(`vr::IVRSystem`, `IVRCompositor` 등) |
| Driver API | 새 하드웨어를 SteamVR에 붙이는 드라이버용 API |
| Action System(SteamVR Input) | 물리 버튼 대신 "동작(action)"을 정의하고 사용자가 바인딩 |
| Lighthouse | 베이스 스테이션 기반 외부 추적 방식(Index·Vive 계열) |
| Overlay | 다른 앱 위에 UI를 그리는 오버레이 앱 |

## 기본 사용법
OpenVR C++로 런타임에 연결하고 권장 렌더 크기를 읽는 최소 예.

```cpp
#include <openvr.h>
#include <cstdio>

int main() {
    vr::EVRInitError err = vr::VRInitError_None;
    vr::IVRSystem* sys = vr::VR_Init(&err, vr::VRApplication_Scene);
    if (err != vr::VRInitError_None) {
        std::printf("VR 초기화 실패: %s\n", vr::VR_GetVRInitErrorAsEnglishDescription(err));
        return 1;
    }
    uint32_t w = 0, h = 0;
    sys->GetRecommendedRenderTargetSize(&w, &h);
    std::printf("권장 렌더 크기: %u x %u\n", w, h);
    vr::VR_Shutdown();
    return 0;
}
```
Unity C#에서는 OpenXR 기반 Input System 바인딩이 기본이고, SteamVR Unity Plugin은 Action 바인딩 UI를 제공한다.

## 자주 쓰는 패턴
- **OpenXR 우선.** 새 PC VR 프로젝트는 OpenXR로 만들고 SteamVR을 활성 OpenXR 런타임으로 선택해 테스트한다.
- **Action 기반 입력.** 컨트롤러 종류별 하드코딩 대신 action manifest와 기본 바인딩 파일을 제공한다.
- **오버레이 앱.** 알림·도구 UI는 `IVROverlay`로 만든다.
- **하드웨어 드라이버.** 자체 트래커·장비는 Driver API로 SteamVR에 통합한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Steam에 배포하는 PC VR 게임, 다종 헤드셋 지원, 드라이버·오버레이 개발.
- 피할 때(대안): Quest 독립형 앱은 [Meta 경로](/develop-wiki/xr/vr-platform/meta-quest-development/). OpenVR 전용 코드는 장기 유지보수를 위해 OpenXR 이전을 검토한다. 표준은 [OpenXR 튜토리얼](/develop-wiki/xr/learning/openxr-tutorial/) 참고.

## 공식 문서
- [OpenVR 저장소·위키](https://github.com/ValveSoftware/openvr) · [SteamVR Unity Plugin](https://github.com/ValveSoftware/steamvr_unity_plugin) · [SteamVR 상점 페이지](https://store.steampowered.com/steamvr)
