---
name: Godot Engine
url: https://godotengine.org
docs: https://docs.godotengine.org/en/stable/tutorials/xr/index.html
repo: https://github.com/godotengine/godot
stars: 120629
domain: xr
category: engines
description: MIT 라이선스의 오픈소스 게임 엔진. OpenXR을 내장해 GDScript·C#으로 VR·AR 앱을 만들고 헤드셋 벤더 플러그인을 선택적으로 붙인다.
pricing: oss
tags: [vr, ar, openxr, game-engine, gdscript, mit]
languages: [cpp, csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Godot은 MIT 라이선스(GitHub API 확인)의 오픈소스 엔진이다. 스크립트는 전용 언어 GDScript, C#(.NET 빌드), C++(GDExtension)로 작성한다. XR은 엔진에 **OpenXR 지원이 내장**되어 있고, Meta Quest 등 벤더별 기능은 "Godot OpenXR Vendors" 같은 플러그인으로 추가한다. 엔진 크기가 작고 로열티·플랜 개념이 없다.

- 확인 기준 최신 릴리스: 4.7.2-stable(문서 사이트는 4.7 브랜치).

## 설치
엔진 실행 파일을 내려받아 바로 실행한다(설치 불필요).
```text
Project Settings > XR > OpenXR > Enabled 체크
Project Settings > XR > Shaders > Enabled 체크
에디터를 재시작
```
Quest 같은 안드로이드 기기 배포는 Godot OpenXR Vendors 플러그인과 Android 빌드 템플릿이 추가로 필요하다(공식 문서의 기기별 절차 참고).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `XRServer` | XR 인터페이스(OpenXR 등)와 추적 정보를 관리하는 싱글턴 |
| `XROrigin3D` | 추적 공간의 기준점 노드 |
| `XRCamera3D` | HMD 시점과 연결된 카메라 |
| `XRController3D` | 컨트롤러 추적 노드. `tracker` 이름(`left_hand`/`right_hand`)로 지정 |
| `Viewport.use_xr` | 해당 뷰포트를 XR 출력으로 전환 |
| OpenXR Action Map | 액션과 기기 입력 매핑 편집기 |

## 기본 사용법
`XROrigin3D` 루트 스크립트에서 OpenXR을 초기화한다.
```gdscript
extends Node3D

var xr_interface: XRInterface

func _ready() -> void:
    xr_interface = XRServer.find_interface("OpenXR")
    if xr_interface and xr_interface.is_initialized():
        print("OpenXR 초기화됨")
        DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
        get_viewport().use_xr = true
    else:
        print("OpenXR을 사용할 수 없음")
```
컨트롤러 버튼 입력은 컨트롤러 노드의 시그널로 받는다.
```gdscript
func _ready() -> void:
    $LeftHand.button_pressed.connect(func(name): print("누름: ", name))
```

## 자주 쓰는 패턴
- 헤드셋 VSync는 끄고(HMD가 프레임을 맞춤) 데스크톱 창 렌더 부담을 줄인다.
- 기본 Action Map으로 시작해 쓰는 기기의 Interaction Profile만 남긴다.
- 핸드 트래킹·패스스루 등 확장은 OpenXR 설정과 벤더 플러그인으로 켠다.
- XR 시작 실패 시 일반 모드로 돌아가는 폴백 경로를 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈소스·무로열티 스택, 가벼운 에디터, 소규모 팀 프로토타입.
- 피할 때: 대형 에셋 생태계나 일부 최신 플랫폼 SDK 통합이 필요하면 Unity·Unreal이 더 폭넓다. 웹 배포가 주목적이면 WebXR 엔진을 본다.

## 공식 문서
- [XR 튜토리얼](https://docs.godotengine.org/en/stable/tutorials/xr/index.html) · [OpenXR 설정](https://docs.godotengine.org/en/stable/tutorials/xr/setting_up_xr.html)
