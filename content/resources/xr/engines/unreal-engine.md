---
name: Unreal Engine
url: https://www.unrealengine.com
docs: https://dev.epicgames.com/documentation/en-us/unreal-engine/developing-for-xr-experiences-in-unreal-engine
domain: xr
category: engines
description: Epic Games의 C++·Blueprint 기반 3D 엔진. OpenXR 플러그인으로 PC·모바일 VR·MR 앱을 만들며 고품질 실시간 렌더링이 강점이다.
pricing: freemium
tags: [vr, mr, openxr, game-engine, blueprint, c++]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Unreal Engine(UE)은 Epic Games가 만드는 엔진으로, 소스가 공개된 라이선스 아래 C++과 시각적 스크립팅(Blueprint)으로 개발한다. 렌더링 품질과 대형 프로젝트 도구가 강점이며, XR은 **OpenXR 플러그인**을 중심으로 헤드 마운트 디스플레이(HMD)를 지원한다. Epic 문서는 UE의 OpenXR이 헤드 마운트 기기만 지원한다고 밝히며, 핸드헬드 AR은 별도 문서의 경로를 따른다.

- 확인 기준 문서 버전: Unreal Engine 5.9 문서. 엔진 소스는 Epic 계정 연동이 필요한 비공개 GitHub 저장소(`EpicGames/UnrealEngine`)로 제공되어 공개 API로는 조회되지 않는다.
- 라이선스(공식 FAQ·언론 보도 기준, 공식 라이선스 페이지는 자동 조회가 막혀 직접 재확인하지 못함): 표준 EULA는 제품별 누적 총매출 $1 million 초과분에 5% 로열티가 붙는다. 매출 분류·예외·분기 신고 절차 등 세부 조건과 최신 변경은 반드시 공식 라이선스·FAQ에서 확인한다.

## 설치
Epic Games Launcher에서 엔진 버전을 설치하거나, 소스 접근 권한을 받아 직접 빌드한다.
```text
Edit > Plugins
  - OpenXR                (필수)
  - OpenXR Hand Tracking, OpenXR Eye Tracker 등 선택
새 프로젝트 > Games > Virtual Reality 템플릿으로 시작 가능
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| OpenXR 플러그인 | HMD·컨트롤러·핸드 트래킹을 OpenXR 런타임으로 연결 |
| VR Template | 텔레포트, 잡기, 메뉴 등을 갖춘 시작 프로젝트 |
| Pawn / Motion Controller Component | 사용자 몸체와 컨트롤러 추적 컴포넌트 |
| Blueprint | 노드 기반 스크립팅. C++ 클래스를 확장 |
| Mobile VR 렌더링 | Quest 같은 모바일 기기는 Forward 렌더러와 낮은 설정이 일반적 |
| Enhanced Input | 컨트롤러 버튼·축을 액션으로 매핑 |

## 기본 사용법
HMD 연결 여부에 따라 동작을 나누는 C++ 예 (`HeadMountedDisplay` 모듈 의존):
```cpp
#include "HeadMountedDisplayFunctionLibrary.h"

void AMyPawn::BeginPlay()
{
    Super::BeginPlay();
    if (UHeadMountedDisplayFunctionLibrary::IsHeadMountedDisplayEnabled())
    {
        UHeadMountedDisplayFunctionLibrary::SetTrackingOrigin(EHMDTrackingOrigin::Floor);
    }
}
```
`Build.cs`의 `PublicDependencyModuleNames`에 `"HeadMountedDisplay"`를 추가해야 링크된다.

## 자주 쓰는 패턴
- VR Template를 복제해 잡기·텔레포트 로직을 재사용하고 Blueprint로 변형한다.
- 기기별 입력은 OpenXR 액션 매핑과 Enhanced Input을 함께 쓴다.
- 모바일 HMD는 Forward 렌더링과 가벼운 머티리얼로 프레임 예산을 맞춘다.
- 에디터의 VR Preview로 헤드셋을 쓴 채 빠르게 반복한다.

## 언제 쓰나 / 피할 때
- 쓸 때: PC VR이나 고품질 시각화·시뮬레이션, Blueprint로 빠르게 프로토타입하려 할 때.
- 피할 때: 경량 모바일 AR이나 빌드 크기·반복 속도가 중요하면 Unity·Godot, 웹 배포는 WebXR 계열을 본다.

## 공식 문서
- [XR 개발 시작](https://dev.epicgames.com/documentation/en-us/unreal-engine/developing-for-xr-experiences-in-unreal-engine)
- [라이선스](https://www.unrealengine.com/en-US/license) · [FAQ](https://www.unrealengine.com/en-US/faq)
