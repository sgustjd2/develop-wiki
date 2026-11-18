---
title: KTX2 와 Basis Universal — 텍스처 압축과 트랜스코딩
aka: [KTX2, KTX 2.0, Basis Universal, ETC1S, UASTC, BasisLZ, GPU Texture Compression, Supercompression]
category: graphics-xr
group: rendering
level: intermediate
summary: GPU 는 BC·ASTC·ETC 처럼 기기마다 다른 블록 압축 형식만 읽는다. KTX2 는 텍스처 컨테이너이고 Basis Universal 은 한 파일로 배포한 뒤 기기에서 맞는 GPU 형식으로 변환하는 중간 형식이다.
tags: [rendering, textures, ktx2, basis-universal, astc, bc7, gpu, compression, webgl, webgpu]
related: [graphics-xr/gltf-usd-asset-pipeline, graphics-xr/pbr-material-model, graphics-xr/rasterization-pipeline, graphics-xr/shaders-gpu-pipeline, graphics-xr/webxr-layers-api]
sources:
  - https://registry.khronos.org/KTX/specs/2.0/ktxspec.v2.html
  - https://github.com/BinomialLLC/basis_universal
  - https://registry.khronos.org/DataFormat/specs/1.3/dataformat.1.3.html
updatedAt: 2026-11-19
---

> 출처 메모: KTX 2.0 명세 본문(개요, 파일 구조, supercompressionScheme, 밉 레벨 순서, UASTC·BasisLZ 관련 절), Basis Universal README, Khronos Data Format 명세의 BC7/ASTC 블록 크기 서술을 읽었다. 각 코덱의 비트스트림 상세, 품질(PSNR)·속도 벤치마크, 인코더 옵션 목록은 읽지 못해 수치로 쓰지 않았다. Basis Universal 은 버전(2.5)이 빠르게 바뀌므로 지원 코덱을 최신 README 로 확인한다.

## 문제

PNG/JPEG 는 파일은 작지만 GPU 가 직접 읽지 못한다. GPU 에 올릴 때 풀어서 비압축(예: RGBA8)으로 두면 메모리와 대역폭이 크다. GPU 는 블록 단위 고정 비율 압축 형식을 하드웨어로 바로 샘플링한다. 문제는 형식이 기기마다 다르다는 점이다. 데스크톱 GPU 는 BC 계열, 모바일은 ASTC·ETC 를 지원하는 식이라, 모든 대상을 위해 형식별 텍스처를 다 만들어 배포하면 용량과 파이프라인이 불어난다.

## 해법

### 블록 압축의 크기

블록 압축은 4x4 같은 픽셀 블록을 고정 크기로 인코딩한다. Data Format 명세 기준으로 BC7 은 4x4 블록당 128비트(16 B), BC1 계열의 색 블록은 64비트, ASTC 는 블록 크기와 상관없이 항상 128비트다. ASTC 는 블록 크기(4x4, 6x6, 8x8 등)를 바꿔 비트율을 조절한다.

```ts
const blocks = (w: number, h: number, bw: number, bh: number) => Math.ceil(w / bw) * Math.ceil(h / bh);
// 밉 체인 크기 = 각 레벨의 블록 수 x 블록 바이트 의 합
```

(2048x2048 으로 직접 계산: RGBA8 은 베이스 16 MiB·체인 21.33 MiB, BC1 은 2 MiB·2.67 MiB, BC7 은 4 MiB·5.33 MiB, ASTC 6x6 은 약 1.78 MiB·2.38 MiB, ASTC 8x8 은 1 MiB·1.33 MiB. 비트/픽셀로 BC1 4, BC7 8, ASTC 6x6 3.57, 8x8 2. 밉맵을 모두 두면 약 1/3 이 더 든다.)

### KTX2 컨테이너

KTX 는 GPU 텍스처를 배포하기 위한 가벼운 컨테이너다. 2D 한 장부터 밉이 있는 큐브맵 배열까지 담고 로딩에 필요한 파라미터를 모두 갖는다. 2.0 의 요점은 다음과 같다.

- **밉 레벨 순서가 작은 것부터**다. 스트리밍할 때 작은 밉을 먼저 보내 저해상도를 빨리 보여 주기 위해서다. 레벨 인덱스(바이트 오프셋·길이·비압축 길이)를 파일 앞쪽에 둔다.
- 포맷 설명은 Vulkan 의 `vkFormat` 과 Khronos Data Format Descriptor(DFD)로 한다. 범용 형식은 `vkFormat = 0`(UNDEFINED) 과 DFD 의 컬러 모델로 표시한다.
- **슈퍼컴프레션**: `supercompressionScheme` 이 0(없음), 1(BasisLZ), 2(Zstandard), 3(ZLIB). 각 밉 레벨에 독립적으로 적용돼 스트리밍과 임의 접근이 가능하다. 단 BasisLZ 만 모든 레벨이 공유하는 전역 데이터를 쓴다.
- 파일 크기를 줄일 뿐 **GPU 메모리 크기는 변환 대상 형식이 정한다.** BasisLZ 는 인코더가 범용 형식 변환과 압축을 합쳤으므로 "압축 전 공통 형식" 이 눈에 보이지 않고, 비압축 길이는 변환 대상에 따라 달라진다.

### Basis Universal

Basis Universal 은 한 번 인코딩한 텍스처를 **런타임에 기기가 지원하는 GPU 형식으로 빠르게 변환(트랜스코딩)** 하는 시스템이다. README 에 따르면 v2.5 는 여덟 가지 모드를 둔다. 초기 두 가지가 핵심이다.

| 코덱 | 성격 | 용도 |
| --- | --- | --- |
| ETC1S | ETC1 의 부분집합을 슈퍼컴프레션. 다른 LDR 형식으로 매우 빠르게 변환. 품질은 낮음~중간, 압축률 높음 | 용량이 중요한 일반 텍스처 |
| UASTC LDR 4x4 | ASTC 4x4 유사. 품질 높음, 변환이 매우 빠름 | 노멀 맵·품질 중요 텍스처 |
| UASTC HDR 4x4 | ASTC HDR 4x4 이되 BC6H 로 빠르게 변환되게 제한 | HDR 텍스처 |
| XUASTC 계열 등 | ASTC 블록 크기 4x4~12x12 의 잠재 공간 코덱 등 | 최신 버전 확장 (README 참고) |

KTX2 에서 UASTC 는 Zstandard 슈퍼컴프레션을 붙일 수 있다(RDO 로 데이터를 먼저 정리할 수 있음). UASTC 는 GPU 가 직접 못 읽으므로 업로드 전에 변환하거나 디코드해야 한다고 명세가 못박는다. 변환 라이브러리는 WebAssembly 로도 빌드돼 브라우저에서 쓸 수 있다.

### 로딩 흐름

```ts
// 의사 코드: 기기 지원에 맞춰 변환 대상을 고른다
const target = gpu.has('astc') ? 'ASTC_4x4' : gpu.has('bc7') ? 'BC7' : gpu.has('etc2') ? 'ETC2' : 'RGBA8';
const tex = await ktx2.transcodeTo(target, bytes);  // 라이브러리 API 는 구현마다 다름
gpu.upload(tex);
```

## 언제 쓰나

- 웹(WebGL/WebGPU)·크로스 플랫폼 앱에서 여러 GPU 를 한 번에 지원할 때. glTF 자산에 KTX2 텍스처를 담는 방식은 [glTF/USD 파이프라인](/develop-wiki/knowledge/graphics-xr/gltf-usd-asset-pipeline/)과 연결되나, 해당 확장 명세는 이 노트에서 확인하지 않았다.
- 모바일·XR 처럼 메모리·대역폭이 빠듯한 대상에서 [PBR 재질](/develop-wiki/knowledge/graphics-xr/pbr-material-model/)의 많은 텍스처 용량을 줄일 때.
- 로딩이 느려 스트리밍(작은 밉 먼저)이 필요할 때.
- WebXR Layers 명세는 해당 확장이 켜진 컨텍스트에서 ETC2·ASTC 압축 형식을 레이어 색 형식으로 허용한다. 정적 UI 레이어의 텍스처를 압축해 둘 수 있다([WebXR Layers](/develop-wiki/knowledge/graphics-xr/webxr-layers-api/)).

## 주의/비용

- **손실 압축이다.** 블록 단위 압축이라 경계 아티팩트가 나고, 노멀·알파 많은 텍스처는 눈에 띈다. ETC1S 는 압축률 대신 품질이 낮다고 README 도 밝힌다. 텍스처 종류별로 코덱을 달리 고른다.
- 변환(트랜스코딩)은 런타임 CPU 비용과 대상 형식의 품질 손실이 있다. 변환 대상 형식(예: BC7)으로 직접 인코딩한 것보다 품질이 낮을 수 있다(일반적 추론이며 수치는 확인하지 않았다).
- 변환 라이브러리를 앱에 포함해야 하고 WASM 로딩이 첫 화면을 늦출 수 있다.
- 크기 제약: 블록 압축은 블록 경계 단위로만 부분 갱신할 수 있고, 일부 API 는 베이스 레벨 크기가 블록의 배수여야 한다(명세의 크기 유의 사항).
- sRGB·선형 구분, 알파 사전 곱 여부 같은 색 공간 메타데이터가 틀리면 색이 어긋난다. KTX2 는 이를 DFD 에 담는다.
- 라이선스·특허: Basis Universal 은 Apache 2.0 이다. 개별 블록 압축 형식(ASTC, BC)의 지원 현황과 특허는 이 노트에서 확인하지 않았다.
