---
name: OpenUSD
url: https://openusd.org
docs: https://openusd.org/release/index.html
repo: https://github.com/PixarAnimationStudios/OpenUSD
stars: 7677
domain: xr
category: content-tools
description: Pixar의 Universal Scene Description. 레이어·컴포지션으로 대규모 3D 장면을 협업 편집하는 개방 프레임워크로 USDZ가 Apple 플랫폼 AR에 쓰인다.
pricing: oss
tags: [usd, usdz, pixar, aousd, scene-description]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
OpenUSD는 Pixar가 만든 장면 기술(scene description) 프레임워크로, 여러 도구·팀이 같은 장면을 레이어로 나눠 비파괴로 편집·합성하게 한다. 포맷(`.usd`, `.usda` 텍스트, `.usdc` 바이너리, `.usdz` 패키지)과 C++/Python 라이브러리를 함께 제공한다. XR·AR에서는 USDZ가 Apple 플랫폼 AR Quick Look·RealityKit에서 쓰이고, 산업·시뮬레이션 분야에서 확산 중이다.

- 확인 기준: 최신 릴리스 태그 `v26.11.1`. 저장소 LICENSE는 "Tomorrow Open Source Technology License 1.0"으로, Apache 2.0과 상표 조항(6절)만 다르다고 본문에 적혀 있다.
- 업계 협의체 AOUSD(Alliance for OpenUSD)와 Apple·NVIDIA 등 참여사의 역할은 이 문서에서 직접 검증하지 않았다. 해당 맥락은 공식 AOUSD 사이트에서 확인한다.

## 설치
Python에서 가장 빠르게 쓰려면 PyPI 패키지를 쓴다.
```bash
pip install usd-core
python -c "from pxr import Usd; print(Usd.GetVersion())"
```
C++ 전체 빌드는 저장소의 `build_scripts/build_usd.py`를 사용한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Stage | 열린 장면. 여러 레이어를 합성한 결과 |
| Layer | `.usd*` 파일 하나. 약한 레이어/강한 레이어 순서로 합성 |
| Prim / Attribute | 장면 계층의 노드와 속성 |
| Composition arcs | Sublayer, Reference, Payload, Variant, Inherit, Specialize |
| Schema | `UsdGeom`, `UsdShade`, `UsdSkel` 등 타입 정의 |
| Hydra | 렌더러 연결 프레임워크 |
| USDZ | USD와 에셋을 담은 비압축 zip 패키지 |

## 기본 사용법
```python
from pxr import Usd, UsdGeom

stage = Usd.Stage.CreateNew("hello.usda")
UsdGeom.Xform.Define(stage, "/hello")
sphere = UsdGeom.Sphere.Define(stage, "/hello/world")
sphere.GetRadiusAttr().Set(2.0)
stage.SetDefaultPrim(stage.GetPrimAtPath("/hello"))
stage.GetRootLayer().Save()
```
다른 파일을 참조해 장면을 조립한다.
```python
shot = Usd.Stage.CreateNew("shot.usda")
prim = shot.DefinePrim("/props/ball")
prim.GetReferences().AddReference("hello.usda")
shot.GetRootLayer().Save()
```

## 자주 쓰는 패턴
- 에셋은 개별 USD로 두고 샷·씬 파일에서 Reference로 조립한다.
- 변형(색, LOD)은 VariantSet으로 한 파일에 담는다.
- 읽기는 쉬운 `usdview`로 확인하고, 디버그는 `.usda` 텍스트로 본다.
- Apple 배포용은 USDZ로 패키징하고, 웹·크로스엔진 배포는 [glTF](/develop-wiki/xr/content-tools/gltf/)를 병행한다.
- [Blender](/develop-wiki/xr/content-tools/blender/)에서 USD 입출력으로 파이프라인에 연결한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 DCC·엔진 사이 대규모 장면 협업, 디지털 트윈·시뮬레이션, Apple 플랫폼 AR 에셋.
- 피할 때: 단일 에셋의 웹 전송은 glTF가 가볍고 널리 지원된다.

## 공식 문서
- [OpenUSD 문서](https://openusd.org/release/index.html) · [튜토리얼](https://openusd.org/release/tut_usd_tutorials.html) · [AOUSD](https://aousd.org/)
