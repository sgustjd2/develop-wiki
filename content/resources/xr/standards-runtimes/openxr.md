---
name: OpenXR
url: https://www.khronos.org/openxr/
docs: https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
repo: https://github.com/KhronosGroup/OpenXR-SDK
stars: 1170
domain: xr
category: standards-runtimes
description: Khronos의 로열티 프리 XR 표준 API. 하나의 앱이 여러 헤드셋 런타임에서 동작하도록 로더, 확장, API 레이어를 정의한다.
pricing: free
tags: [openxr, khronos, standard, loader, runtime]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
OpenXR은 Khronos Group이 관리하는 XR(VR·AR) 개방 표준이다. 애플리케이션이 `libopenxr_loader`를 통해 장치에 설치된 **런타임**(Meta, SteamVR, Windows Mixed Reality, Monado 등)을 찾아 호출하므로, 기기마다 SDK를 따로 붙이지 않아도 된다. C API이며 Unity·Unreal·Godot 등 주요 엔진이 내부적으로 이를 사용한다.

- 확인 기준: 스펙 1.1 계열, OpenXR-SDK 릴리스 `release-1.1.65`(2026-10-16). OpenXR-SDK 저장소는 GitHub API상 Apache-2.0로 표시된다(저장소 내 LICENSE·COPYING.adoc 참조).
- 확장(Extension)으로 기능을 추가하며 `XR_KHR_*`(크로스벤더 공식), `XR_EXT_*`, `XR_<벤더>_*` 접두사를 쓴다.

## 설치
앱 개발자는 로더를 빌드에 포함한다.
```bash
git clone https://github.com/KhronosGroup/OpenXR-SDK-Source
cmake -S OpenXR-SDK-Source -B build && cmake --build build
# 샘플 앱 hello_xr 로 동작 확인
```
엔진 사용자는 대개 엔진 플러그인(예: Unity OpenXR Plugin)이 로더를 처리한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Loader | 활성 런타임을 찾아 API 호출을 전달 |
| Runtime | 실제 장치·컴포지터 구현. "활성 런타임"은 시스템에 하나 |
| Instance / System / Session | 앱↔런타임 연결, HMD, 렌더링 수명 |
| Space | `LOCAL`, `STAGE`, `VIEW` 등 기준 좌표계 |
| Action / Action Set | 물리 입력을 추상 액션에 바인딩, Interaction Profile로 기기별 지정 |
| Swapchain / Composition Layer | 프레임을 컴포지터에 제출 |
| Extension | 선택 기능. 인스턴스 생성 시 요청 |
| API Layer | 호출을 가로채는 레이어(검증, 로깅) |

## 기본 사용법
인스턴스를 만드는 최소 흐름 (C++):
```cpp
#include <openxr/openxr.h>
#include <cstring>

XrInstance createInstance() {
    XrInstanceCreateInfo info{XR_TYPE_INSTANCE_CREATE_INFO};
    std::strcpy(info.applicationInfo.applicationName, "demo");
    info.applicationInfo.applicationVersion = 1;
    std::strcpy(info.applicationInfo.engineName, "none");
    info.applicationInfo.apiVersion = XR_CURRENT_API_VERSION;

    // 그래픽 확장은 사용하는 API에 맞게 (예: XR_KHR_vulkan_enable2)
    const char* exts[] = {"XR_KHR_vulkan_enable2"};
    info.enabledExtensionCount = 1;
    info.enabledExtensionNames = exts;

    XrInstance instance = XR_NULL_HANDLE;
    return XR_SUCCEEDED(xrCreateInstance(&info, &instance)) ? instance : XR_NULL_HANDLE;
}
```
이후 `xrGetSystem` → 그래픽 바인딩 → `xrCreateSession` → 프레임 루프(`xrWaitFrame`/`xrBeginFrame`/`xrEndFrame`) 순서로 진행한다.

## 자주 쓰는 패턴
- `xrEnumerateInstanceExtensionProperties`로 확장 지원을 확인하고, 없으면 기능을 끈다.
- 검증용 API 레이어로 오류를 잡는다.
- `XR_RUNTIME_JSON` 환경변수로 활성 런타임을 임시로 바꿔 테스트한다.
- 입력은 Interaction Profile을 여러 개 제안해 기기 호환성을 넓힌다.
- 엔진 위라면 스펙을 직접 다루기보다 엔진의 OpenXR 설정을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 네이티브 XR 앱·엔진·도구가 여러 기기를 지원해야 할 때, 런타임·레이어를 만들 때.
- 피할 때: 웹은 WebXR, 엔진으로 충분하면 엔진 플러그인, 모바일 AR은 ARKit·ARCore가 대상이다.

## 공식 문서
- [OpenXR 스펙(1.1)](https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html) · [OpenXR-SDK-Source](https://github.com/KhronosGroup/OpenXR-SDK-Source)
- 관련: [Monado](/develop-wiki/xr/standards-runtimes/monado/) · [WebXR](/develop-wiki/xr/standards-runtimes/webxr-device-api/)
