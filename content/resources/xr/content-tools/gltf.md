---
name: glTF 2.0
url: https://www.khronos.org/gltf/
docs: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
repo: https://github.com/KhronosGroup/glTF
stars: 7903
domain: xr
category: content-tools
description: Khronos의 3D 전송 포맷. PBR 머티리얼과 씬을 JSON+바이너리로 담고 Draco·meshopt·KTX2 확장으로 용량을 줄인다.
pricing: free
tags: [3d, khronos, format, ktx2, draco, meshopt]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
glTF 2.0은 "3D의 JPEG"로 불리는, 런타임 전송에 최적화된 개방 3D 포맷이다. 장면 구조, 메시, PBR 머티리얼, 애니메이션을 담으며 `.gltf`(JSON+외부 파일)와 `.glb`(단일 바이너리)가 있다. 웹 3D·WebXR 엔진 대부분이 기본 포맷으로 지원하고 Unity·Unreal·Godot에서도 임포트된다. 2.0은 ISO/IEC 12113로 표준화됐다.

- 확인 기준: 주요 도구 `KTX-Software` v4.4.2, `google/draco` 1.5.9(Apache-2.0), `meshoptimizer` v1.3(MIT), `@gltf-transform/core` 4.5.1(MIT). 스펙 저장소의 라이선스는 GitHub API상 `NOASSERTION`이라 명시하지 않는다.

## 설치
포맷 자체는 설치 대상이 아니다. 검사·최적화에는 glTF-Transform CLI를 쓴다.
```bash
npm install --global @gltf-transform/cli
gltf-transform inspect model.glb
```
텍스처 압축에는 KTX-Software의 `toktx`도 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Scene / Node | 변환 계층 구조 |
| Mesh / Primitive | 정점 속성과 인덱스 |
| Accessor / BufferView / Buffer | 바이너리 데이터 접근 계층 |
| Material (metallic-roughness) | 코어 PBR 모델. 확장으로 clearcoat 등 추가 |
| `KHR_draco_mesh_compression` | Draco 기하 압축 확장 |
| `EXT_meshopt_compression` | meshoptimizer 압축 확장. 디코딩이 빠름 |
| `KHR_texture_basisu` | KTX2/Basis Universal 텍스처 |
| GLB | 헤더+JSON+BIN을 하나로 묶은 컨테이너 |

## 기본 사용법
CLI로 압축·최적화한다.
```bash
gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2
```
Three.js에서 압축 GLB를 로드하려면 디코더를 연결한다.
```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const ktx2 = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx2);
const gltf = await loader.loadAsync('/models/out.glb');
scene.add(gltf.scene);
```
(`/basis/`에는 Three.js 배포본의 트랜스코더 파일을 복사해 둔다. 자세한 내용은 [Three.js](/develop-wiki/frontend/animation/threejs/) 문서 참고)

## 자주 쓰는 패턴
- 웹·XR 배포는 GLB + meshopt(또는 Draco) + KTX2 조합으로 용량·VRAM을 줄인다.
- 텍스처는 GPU에서 압축 형식을 유지하는 KTX2가 디코딩 후 메모리에서 유리하다.
- 인스턴싱, 불필요한 노드·머티리얼 병합으로 드로우콜을 줄인다.
- 검증은 Khronos glTF-Validator를 쓴다.
- Apple 플랫폼이 필요하면 [OpenUSD/USDZ](/develop-wiki/xr/content-tools/openusd/) 변환 경로를 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: 웹·모바일·XR 런타임 배포용 에셋, 도구 간 교환.
- 피할 때: 대규모 장면 조립·레이어 협업 파이프라인은 OpenUSD, 원본 편집용 소스는 `.blend` 등 네이티브 포맷.

## 공식 문서
- [glTF 2.0 스펙](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) · [glTF-Transform](https://gltf-transform.dev/) · [KTX-Software](https://github.com/KhronosGroup/KTX-Software)
