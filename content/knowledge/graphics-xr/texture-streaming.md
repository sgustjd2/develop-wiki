---
title: 텍스처 스트리밍 — 밉 단위 상주와 샘플러 피드백
aka: [Texture Streaming, Mipmap Streaming, Sparse Residency, Tiled Resources, Sampler Feedback, Virtual Texturing]
category: graphics-xr
group: rendering
level: advanced
summary: 텍스처 스트리밍은 화면에 필요한 밉 레벨(또는 타일)만 GPU 메모리에 올리고 예산을 넘으면 높은 해상도 밉부터 버리는 기법이다. 필요량 추정은 카메라 거리 휴리스틱이나 샘플러 피드백으로, 부분 상주는 스파스 리소스로 구현한다.
tags: [rendering, textures, streaming, mipmap, sparse-residency, sampler-feedback, memory-budget, vulkan, d3d12]
related: [graphics-xr/ktx2-basis-texture-compression, graphics-xr/gltf-usd-asset-pipeline, graphics-xr/rasterization-pipeline, graphics-xr/pbr-material-model, graphics-xr/foveated-stereo-rendering, graphics-xr/motion-to-photon-reprojection-frame-budget]
sources:
  - https://docs.unity.com/en-us/engine/6000.0/manual/materials-and-shaders/textures/texture-loading/texture-streaming/configure
  - https://github.com/microsoft/DirectX-Specs/blob/master/d3d/SamplerFeedback.md
  - https://github.com/KhronosGroup/Vulkan-Docs/blob/main/chapters/sparsemem.adoc
updatedAt: 2026-11-19
---

> 출처 메모: Unity 6 매뉴얼의 밉맵 스트리밍 설정 페이지, DirectX Sampler Feedback 사양(`SamplerFeedback.md`), Vulkan 사양의 스파스 메모리 장(`sparsemem.adoc`)을 읽었다. Unity 의 "소개" 페이지(동작 원리·제약)는 접근하지 못했고, Unreal Engine 의 텍스처 스트리밍 문서는 본문이 비어 읽지 못했다. 엔진별 우선순위 계산 세부는 확인하지 않았다. 아래 메모리 수치는 직접 계산한 값이다.

## 문제

4096² 텍스처 하나(블록 압축, 텍셀당 1바이트 가정)는 밉 체인까지 약 21.33 MiB 다. 씬에 텍스처가 수천 장이면 VRAM 이 먼저 바닥난다. 그런데 화면에서 멀리 있거나 작게 보이는 물체는 최고 해상도 밉을 쓰지 않는다. 쓰지 않는 밉까지 상주시키는 것이 낭비다.

## 해법

### 밉 단위 상주

밉이 한 단계 내려가면 면적이 1/4 이다. 같은 텍스처로 계산하면 다음과 같다.

| 상주 시작 밉 | 해상도 | 메모리 |
| --- | --- | --- |
| 0 | 4096² | 21.33 MiB |
| 1 | 2048² | 5.33 MiB |
| 2 | 1024² | 1.33 MiB |

필요한 밉은 한 화면 픽셀이 덮는 텍셀 수의 log2 근처다. 4096 텍스처의 UV 전체가 화면 1000픽셀이면 밉 2(1024²), 200픽셀이면 밉 4 가 적절하다(직접 계산). 엔진은 이 필요 밉을 카메라 기준으로 추정해 상주 밉을 올리고 내린다. 작은 밉부터 먼저 올려 저해상도를 빨리 보이게 하는 설계가 일반적이며, [KTX2](/develop-wiki/knowledge/graphics-xr/ktx2-basis-texture-compression/)는 밉을 작은 것부터 배치해 이 방식을 지원한다.

### 예산: Unity 의 예

Unity 의 밉맵 스트리밍(6.0 매뉴얼)은 다음 설정을 둔다.

- **Memory Budget**(MB): 스트리밍 텍스처와 스트리밍하지 않는 텍스처의 밉을 모두 포함한 GPU 텍스처 메모리 상한이다. 예산 100 MB 에 비스트리밍 텍스처가 90 MB 면 스트리밍에는 약 10 MB 가 돌아간다.
- **Max Level Reduction**: 시작 시 로드하는 레벨이면서, 이 값 이상의(작은) 밉은 예산을 넘더라도 유지한다. 예산이 우선이 아니다.
- 예산이 너무 작으면 해상도를 낮춘다. 문서는 텍스처가 튀거나 느리게 로드될 수 있다고 한다. 크게 잡으면 낮춤을 막고 화면 밖 데이터를 캐시하지만 메모리를 더 쓴다.
- 예산 산정은 `Texture.desiredTextureMemory` 로 실제 필요량을 재서 그보다 조금 크게 잡으라고 권한다(에디터 창에 쓰이는 텍스처가 섞일 수 있으니 빌드에서 재라고 함).
- 카메라마다 스트리밍 켜기/끄기(Streaming Controller)와 밉 바이어스를 줄 수 있다.

### 더 정확한 필요량: 샘플러 피드백

거리 휴리스틱은 UV 밀도·가림·이방성 필터를 정확히 모른다. D3D12 의 **Sampler Feedback** 은 셰이더가 실제로 샘플한 위치와 밉을 기록하게 한다.

- **MinMip**: 영역마다 요청된 가장 상세한 밉(원자적 최솟값). 스트리밍에 적합.
- **MipRegionUsed**: 영역·밉마다 사용 여부 플래그(원자적 OR). 텍스처 공간 셰이딩에 적합.
- 영역(밉 영역)은 2의 거듭제곱이고 4 이상이며 보통 타일 크기에 맞춘다. 피드백 맵은 불투명 객체라 `ResolveSubresourceRegion` 으로 읽는다. 보통 예약(타일) 텍스처와 작은 MinMip 맵을 짝지어, 상주한 만큼으로 샘플링을 제한한다.
- 필수 기능이 아니다. `D3D12_FEATURE_D3D12_OPTIONS7` 의 `D3D12_SAMPLER_FEEDBACK_TIER` 로 지원을 확인한다. 티어 0.9 는 WRAP·CLAMP 주소 모드만, 티어 1.0 은 모든 주소 모드를 지원한다. 단일 샘플 리소스만 쓸 수 있다.

### 타일 단위 상주: 스파스 리소스

밉 전체 대신 일부 영역만 상주시키려면 Vulkan 의 스파스 리소스(`sparseBinding`, `sparseResidency`)를 쓴다.

- 이미지를 고정 크기 블록으로 나눠 필요한 블록만 메모리에 바인딩한다. 표준 블록 모양은 64 KB 다.
- 블록보다 작은 밉은 **밉 테일**로 묶어 불투명하게 바인딩한다.
- 바인딩은 `vkQueueBindSparse` 로 하고 명령 버퍼 작업과의 순서는 세마포어·펜스로 직접 맞춰야 한다. 바인딩만으로는 메모리를 해제하지 않는다.
- 미바인딩 영역을 읽으면 `residencyNonResidentStrict` 가 참인 구현에서는 0 을, 아니면 정의되지 않은 값을 얻는다(안전하게 처리되기는 한다).

## 언제 쓰나

- 고해상도 텍스처가 많은 오픈 월드·건축 시각화, 메모리가 빠듯한 단독형 XR 기기.
- 빠른 이동 시 팝인보다 프레임 안정이 더 중요한 경우(저해상도로 먼저 보여 주는 방식).
- 단일 거대 텍스처(지형, 가상 텍스처링)에서 보이는 타일만 상주시킬 때.

## 주의/비용

- **팝인과 흐림**: 예산이 모자라거나 디스크·네트워크가 느리면 흐릿한 밉이 오래 보인다. 카메라 컷, 빠른 회전, 텔레포트(XR)에서 두드러진다. Unity 는 카메라 활성화 전 밉을 미리 로드하는 API 를 제공한다.
- **I/O·CPU 비용**: 스트리밍 요청, 업로드, 디스크 읽기가 프레임 시간에 끼어든다. 압축 포맷·밉 순서와 맞물려 설계한다.
- 예산이 비스트리밍 텍스처를 포함하므로, 예산만 보고 스트리밍 몫이 충분한지 착각하기 쉽다.
- 샘플러 피드백은 하드웨어 티어가 필요하고 제약(단일 샘플, 헬퍼 레인의 쓰기 무시 등)이 있다. 스파스 리소스 바인딩은 동기화 부담이 앱에 있다.
- 엔진마다 필요 밉 추정·우선순위 규칙이 다르다. 이 노트는 Unity 문서와 API 사양 수준이며, 자신의 엔진 문서를 확인해야 한다.
