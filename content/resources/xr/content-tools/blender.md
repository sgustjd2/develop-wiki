---
name: Blender
url: https://www.blender.org
docs: https://docs.blender.org/api/current/
repo: https://github.com/blender/blender
stars: 22328
domain: xr
category: content-tools
description: GPL 오픈소스 3D 제작 도구. 모델링·리깅·애니메이션·렌더링을 지원하고 Python API(bpy)와 glTF·USD 내보내기로 XR 에셋 파이프라인에 쓴다.
pricing: oss
tags: [3d, modeling, python, bpy, gltf, usd]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Blender는 모델링·스컬프팅·리깅·애니메이션·렌더링을 한 앱에서 처리하는 오픈소스 3D 도구다. XR에서는 에셋 제작기로 쓰이며 glTF/GLB, USD 등으로 내보내 엔진에 넘긴다. Python API(`bpy`)로 임포트·정리·내보내기를 자동화할 수 있다.

- 확인 기준: 공식 다운로드 서버에 Blender 5.3.0 빌드가 있다. GitHub 저장소는 공식 미러이며 라이선스 API는 `NOASSERTION`으로 나온다. Blender는 GNU GPL로 배포되니 정확한 버전 조항은 공식 라이선스 페이지에서 확인한다.

## 설치
[blender.org/download](https://www.blender.org/download/)에서 설치하거나 패키지 매니저를 쓴다.
```bash
brew install --cask blender     # macOS
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `bpy.data` | 블렌드 파일의 모든 데이터(메시, 머티리얼, 오브젝트) |
| `bpy.context` | 현재 선택·활성 상태 |
| `bpy.ops` | 에디터 연산자(UI 동작과 동일). 컨텍스트 의존 |
| Principled BSDF | glTF PBR로 매핑되는 기본 셰이더 |
| Collections / Modifiers | 정리·비파괴 편집 |
| Add-on / Extension | 파이썬 확장. glTF·USD 입출력은 내장 |
| 헤드리스 모드 | `blender -b -P script.py`로 UI 없이 실행 |

## 기본 사용법
큐브를 만들어 GLB로 내보내는 스크립트:
```python
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
cube = bpy.context.active_object
mat = bpy.data.materials.new("Blue")
mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.3, 0.9, 1)
cube.data.materials.append(mat)

bpy.ops.export_scene.gltf(filepath="cube.glb", export_format='GLB')
```
```bash
blender -b -P export.py
```

## 자주 쓰는 패턴
- 단위·축을 확인한다. glTF는 Y-up·미터 단위이며 exporter가 Blender의 Z-up에서 변환한다.
- 폴리곤을 줄이고(Decimate), 머티리얼 수를 줄이고, 텍스처를 합쳐 XR 성능 예산에 맞춘다.
- 배치 변환은 헤드리스 스크립트로 자동화한다.
- 내보낸 GLB는 압축(Draco/meshopt, KTX2)을 [glTF](/develop-wiki/xr/content-tools/gltf/) 도구로 후처리한다.
- USD가 필요하면 `bpy.ops.wm.usd_export`를 쓴다(버전별 옵션 확인).

## 언제 쓰나 / 피할 때
- 쓸 때: 무료로 모델링·리깅·베이킹·렌더링을 해결하고 glTF/USD로 엔진에 전달할 때.
- 피할 때: CAD 정밀 모델링(전용 CAD), 대형 스튜디오의 Maya·Houdini 전용 파이프라인이 고정된 경우.

## 공식 문서
- [Python API 레퍼런스](https://docs.blender.org/api/current/) · [사용자 매뉴얼](https://docs.blender.org/manual/en/latest/)
