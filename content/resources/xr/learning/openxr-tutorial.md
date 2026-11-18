---
name: OpenXR Tutorial (Khronos)
url: https://openxr-tutorial.com/
docs: https://openxr-tutorial.com/
repo: https://github.com/KhronosGroup/OpenXR-Tutorials
domain: xr
category: learning
description: Khronos Group이 공개한 OpenXR 공식 튜토리얼. C++로 OpenXR 인스턴스·세션·스왑체인·입력 액션을 단계별로 구현하며 Windows와 Android, 여러 그래픽스 API를 다룬다.
pricing: oss
tags: [openxr, khronos, tutorial, cpp, vulkan]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
OpenXR Tutorial은 Khronos가 만든 학습 사이트와 저장소(`KhronosGroup/OpenXR-Tutorials`, Apache-2.0, 마지막 푸시 2026-11-10)다. 엔진 없이 OpenXR API를 직접 호출해 XR 앱의 뼈대를 만들어 보게 한다. Unity·Unreal 같은 엔진이 내부에서 하는 일을 이해하는 데 가장 좋은 자료다. 표준 자체는 OpenXR SDK(`KhronosGroup/OpenXR-SDK`, 최신 릴리스 1.1.65, 2026-10-16)가 정의한다.

- 튜토리얼 사이트는 플랫폼(Windows/Linux/Android)과 그래픽스 API(Vulkan, D3D11/12, OpenGL, OpenGL ES) 선택에 따라 내용이 바뀌는 구조다.
- 장별 완성 코드와 시작 코드가 저장소에 있어 막히면 비교할 수 있다.

## 이렇게 쓴다
| 단계 | 하는 일 |
| --- | --- |
| 준비 | 저장소 클론, CMake 구성, 헤드셋 또는 런타임(SteamVR, Meta, Monado 등) 선택 |
| 인스턴스·시스템 | 확장 목록 조회, `xrCreateInstance`, `xrGetSystem` |
| 그래픽스 | 그래픽스 바인딩으로 세션 생성, 스왑체인 이미지 렌더 |
| 프레임 루프 | `xrWaitFrame`/`xrBeginFrame`/`xrEndFrame`, 뷰·투영 행렬 |
| 입력 | 액션 세트와 상호작용 프로필, 포즈·버튼 읽기 |
| 확장 | 멀티뷰, 패스스루·핸드트래킹 등 확장 기능 |

## 예제: 인스턴스 만들기
튜토리얼 첫 단계에 해당하는 최소 코드(필요한 확장은 그래픽스 API에 맞춰 추가).

```cpp
#include <openxr/openxr.h>
#include <cstring>
#include <cstdio>

int main() {
    XrInstanceCreateInfo ci{XR_TYPE_INSTANCE_CREATE_INFO};
    std::strncpy(ci.applicationInfo.applicationName, "HelloXR", XR_MAX_APPLICATION_NAME_SIZE - 1);
    ci.applicationInfo.applicationVersion = 1;
    std::strncpy(ci.applicationInfo.engineName, "none", XR_MAX_ENGINE_NAME_SIZE - 1);
    ci.applicationInfo.apiVersion = XR_CURRENT_API_VERSION;

    XrInstance instance = XR_NULL_HANDLE;
    XrResult r = xrCreateInstance(&ci, &instance);
    std::printf("xrCreateInstance = %d\n", (int)r);
    if (XR_SUCCEEDED(r)) xrDestroyInstance(instance);
    return 0;
}
```
활성 OpenXR 런타임이 없으면 실패하므로 SteamVR·Meta 런타임 등을 먼저 활성화한다.

## 학습 순서 제안
1. 사이트의 개요와 용어(Instance, Session, Space, Action)를 읽는다.
2. 자신의 OS·그래픽스 API 조합으로 설정하고 장 1~2를 끝까지 실행한다.
3. 프레임 루프와 입력 액션을 직접 수정해 본다.
4. 엔진 사용으로 돌아가 Unity/Unreal OpenXR 플러그인 설정이 어떤 호출로 바뀌는지 연결한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 표준 기반 이식성 있는 XR 코드, 엔진 내부·성능 최적화, 커스텀 엔진.
- 피할 때(대안): 빠른 제작은 엔진 템플릿, 웹은 [WebXR 샘플](/develop-wiki/xr/learning/webxr-samples/). PC VR 런타임은 [SteamVR](/develop-wiki/xr/vr-platform/steamvr/).

## 공식 문서
- [OpenXR Tutorial](https://openxr-tutorial.com/) · [튜토리얼 저장소](https://github.com/KhronosGroup/OpenXR-Tutorials) · [OpenXR SDK](https://github.com/KhronosGroup/OpenXR-SDK) · [OpenXR 사양](https://registry.khronos.org/OpenXR/)
