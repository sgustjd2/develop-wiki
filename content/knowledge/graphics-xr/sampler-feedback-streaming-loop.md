---
title: Sampler Feedback 스트리밍 루프 — MinMip 맵, 피드백 맵, 타일 상주를 잇는 구조
aka: [Sampler Feedback Streaming, SFS, Sampler Feedback, MinMip Map, Feedback Map, MipRegionUsed, Sparse Feedback Textures, PRT+, Texture-Space Shading]
category: graphics-xr
group: rendering
level: advanced
summary: D3D12 Sampler Feedback 은 셰이더가 실제 샘플한 밉 요청을 영역 단위 맵에 기록하게 해 주고, 앱은 예약(타일) 텍스처의 상주 상태를 담은 MinMip 맵과 이 피드백 맵을 맞물려 타일 단위 스트리밍을 돌린다.
tags: [rendering, texture-streaming, sampler-feedback, d3d12, tiled-resources, virtual-texturing, minmip, texture-space-shading]
related: [graphics-xr/texture-streaming, graphics-xr/virtual-texturing-page-table-feedback, graphics-xr/ktx2-basis-texture-compression, graphics-xr/shaders-gpu-pipeline, graphics-xr/rasterization-pipeline, graphics-xr/foveated-stereo-rendering]
sources:
  - https://github.com/microsoft/DirectX-Specs/blob/master/d3d/SamplerFeedback.md
updatedAt: 2026-11-19
---

> 출처 메모: Microsoft DirectX-Specs 저장소의 `d3d/SamplerFeedback.md` 를 읽었다. 읽은 부분은 동기, 기능 지원 티어, 스트리밍 채택 절차, MinMip 맵, 피드백 맵(두 종류, 갱신 규칙, 트랜스코딩, 확률적 갱신), HLSL 구성과 DXIL 연산이다. DDI 세부와 `ID3D12Device` API 상세 절(1007줄 이후 대부분)은 건너뛰었다. 이 노트는 [텍스처 스트리밍](/develop-wiki/knowledge/graphics-xr/texture-streaming/) 노트가 한 줄로 요약한 샘플러 피드백을, **MinMip 맵과 타일 상주를 잇는 루프** 중심으로 깊게 다룬다. 스펙에 성능 수치나 실제 GPU 의 구현 방식은 없다. 아래 확률 실험은 직접 만든 모형이다.

## 문제

[가상 텍스처링](/develop-wiki/knowledge/graphics-xr/virtual-texturing-page-table-feedback/)은 화면에서 어떤 페이지가 필요한지 알아내려고 **별도 피드백 렌더 패스**를 돌린다. 이방성 필터나 밉 선택 규칙을 소프트웨어로 흉내 내야 하고, 이방성 샘플 패턴은 특히 흉내 내기 어렵다. D3D12 의 예약(타일) 리소스와 `CheckAccessFullyMapped` 로 "비상주 타일에 접근했다" 는 사실은 알 수 있지만, **어느 밉이 이상적이었는지** 는 한 번에 못 얻는다. 스펙은 이 두 한계를 샘플러 피드백이 해결한다고 설명한다. 이상적 밉 검출과 기록이 한 단계로 합쳐져 드라이버가 최적화할 수 있다는 것이다.

## 해법: 세 개의 짝 리소스

스펙의 스트리밍 채택 절차는 이렇다.

1. 스트리밍 대상 텍스처를 **예약(타일) 텍스처**로 만든다(스펙은 타일 리소스 티어 2 이상을 권장: 타일 상주 제어와 상주 밉으로의 샘플 클램프가 직접 지원됨).
2. 각 텍스처마다 작은 **MinMip 맵**(상주한 것)과 **피드백 맵**(필요한 것)을 둔다.
3. 스트리밍 엔진을 밉 단위가 아니라 **타일 단위**로 바꾸고 피드백 맵 내용으로 결정한다.
4. 타일이 상주·해제될 때마다 해당 영역의 MinMip 맵을 갱신해 GPU 접근을 클램프한다.
5. 셰이더는 MinMip 맵을 읽고, 특수 HLSL 구성으로 피드백 맵에 쓴다.

### MinMip 맵: 상주 상태 (런타임 기능이 아니다)

MinMip 맵은 **앱이 정하는 관행**이지 런타임 기능이 아니다. 스펙 예시는 부호 없는 정수를 쓴다. 텍셀 하나가 짝 텍스처의 **밉 영역**(보통 64 KB 타일 하나 또는 그 배수)에 대응하고, 그 영역에서 **완전히 상주한 가장 상세한 밉 번호**를 담는다. 값 1 이면 밉 1, 2, 3… 이 모두 상주한다는 뜻이다. 샘플할 때는 같은 UV 로 MinMip 맵을 읽어 얻은 값 `X` 를 짝 텍스처 샘플의 **밉 하한**으로 쓴다. 균일한 `MinLOD` 클램프를 영역별로 다르게 만든 셈이다.

타일 하나가 상주하면 갱신해야 할 MinMip 텍셀 수는 그 타일의 밉에 따라 `4^m` 이다(밉 영역이 밉 0 타일 하나에 대응할 때). 밉 0 타일은 1 텍셀, 밉 1 타일은 4 텍셀, 밉 2 타일은 16 텍셀을 갱신한다. 이 수는 스펙의 설명(1, 4, 16)과 일치한다.

### 피드백 맵: 요청 기록

피드백 맵은 **런타임 기능**이고 불투명 포맷이다(`DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE` 등). 제약은 이렇다.

- 밉 영역은 한 변이 2의 거듭제곱이고 4 이상, 가장 상세한 밉의 절반 이하다.
- 짝 리소스와 같은 크기·밉 수·배열 크기, 단일 샘플, `ALLOW_UNORDERED_ACCESS` 필요, 타일 리소스로 만들 수 없다.
- 두 종류 중 하나를 고른다(한 리소스에 한 가지).

| 종류 | 담는 것 | 갱신 | 어울리는 용도 |
| --- | --- | --- | --- |
| MinMip | 영역마다 요청된 **가장 상세한 밉** 한 값(밉 구조 없음) | 원자적 최솟값 | 스트리밍(중간 밉은 필요 없고 최상위 요청만 필요) |
| MipRegionUsed | 영역·밉마다 **사용 여부** 불린(밉 구조 있음, 0xFF/0x00) | 원자적 OR | 텍스처 공간 셰이딩 등 "어느 밉이 쓰였나" 가 필요한 용도 |

스펙은 MipRegionUsed 가 MinMip 보다 정보가 더 많다고 말한다(MinMip 은 불린 비트필드에서 가장 낮은 켜진 비트의 인덱스에 해당).

HLSL 에서는 `FeedbackTexture2D<SAMPLER_FEEDBACK_MIN_MIP>` 같은 쓰기 전용 객체로 선언하고 `WriteSamplerFeedback`(및 `Bias`, `Grad`, `Level`) 메서드에 **짝 텍스처와 샘플러, 좌표**를 주어 쓴다. 이 연산은 샘플러 상태(필터링, 이방성)로 샘플 패턴을 만든 뒤 텍스처 페치 대신 피드백 맵에 원자 연산을 한다. `Bias` 와 기본형은 픽셀 셰이더 전용, `Grad` 와 `Level` 은 다른 단계에서도 쓸 수 있다. 오프셋은 지원하지 않는다.

기본형 의사 코드는 스펙이 보여 주는 대로 사실상 다음과 같다.

```hlsl
float ideal = TiledTexture.CalculateLevelOfDetail(Sampler, uv);   // 이상적 밉
uint2 c = uint2(uv * FeedbackMapDimensions);
InterlockedMin(FeedbackMap[c], (uint)ideal);                      // 영역 내 최솟값
```

실제로는 이 대신 `WriteSamplerFeedback` 를 쓰고, 이방성 같은 복잡한 샘플 패턴을 하드웨어가 대신 처리한다는 점이 이점이다.

### 읽기 루프: 트랜스코딩과 요청/해제

피드백 맵은 불투명하므로 `ResolveSubresourceRegion` 으로 **디코딩**(`DECODE_SAMPLER_FEEDBACK`)해 텍스처나 CPU 읽기용 버퍼로 바꾸고, 필요하면 인코딩해 되돌린다. 전형적 프레임 루프는 이렇다.

1. 프레임을 그리며 피드백 맵을 갱신한다(초기값은 보통 항상 상주가 보장되는 밉, 예: 밉 꼬리).
2. 프레임 끝(또는 일정 간격)에 읽어서 초기값으로 되돌린다(`ClearUnorderedAccessViewUint`).
3. 영역별 최솟값이 현재 상주 밉보다 상세하면(값이 작으면) **로드 요청**을 낸다.
4. 값이 상주 밉보다 거칠면(값이 크면) 일정 시간이 지난 뒤 **해제 후보**로 삼는다. 타일별 "마지막 참조" 타임스탬프를 두는 방식을 스펙이 제안한다.
5. 로드·해제 후 MinMip 맵을 갱신한다.

### 확률적 갱신

가까운 UV 의 샘플이 같은 영역에 중복 기록되므로 갱신 연산량을 줄이는 것이 중요하다고 스펙은 말한다. 쉐이더에서 무작위로 쓰기를 버리는 방식이 가능하고 "실험 결과 99% 이상 버려도 믿을 만한 데이터를 얻을 수 있었다" 고 적는다(런타임 기능이 아니라 앱 구현 아이디어).

**직접 확인.** 어떤 영역에서 가장 상세한 밉을 요청한 픽셀이 `n` 개일 때, 각 쓰기를 확률 `p` 로 남기면 한 프레임에 검출될 확률은 `1 − (1−p)^n` 이다. 시뮬레이션(2만 회)이 식과 일치했다.

| 요청 픽셀 수 `n` | p = 1% | p = 0.1% |
| --- | --- | --- |
| 1 | 0.010 | 0.001 |
| 10 | 0.096 | 0.010 |
| 100 | 0.634 | 0.095 |
| 500 | 0.993 | 0.394 |
| 2000 | ≈ 1.0 | 0.865 |

픽셀이 많이 요청하는 영역은 99% 를 버려도 거의 항상 잡힌다. 반대로 **한두 픽셀만 최상위 밉을 요청하는 영역은 놓친다**(n = 1, p = 1% 면 첫 검출까지 중앙값 73 프레임, 95% 분위 306 프레임). 중간 밉 요청은 이 확률이 높아 먼저 해결되지만, 가는 선·작은 장식처럼 면적이 작은 디테일의 최상위 밉은 늦게 올라온다. 스펙의 "99% 를 버려도 된다" 는 면적이 큰 영역 중심의 경험 결과로 읽어야 한다.

## 언제 쓰나

- **예약(타일) 텍스처 기반 스트리밍을 직접 구현하는 D3D12 엔진**에서, 이방성·밉 선택을 정확히 반영한 필요량을 얻고 싶을 때. 별도 피드백 패스를 없애거나 단순화할 수 있다.
- **텍스처 공간 셰이딩**: MipRegionUsed 로 어떤 영역이 쓰였는지 알아 그 부분만 조명 계산을 갱신한다. 스펙은 VR 양안 렌더에서 한 번 계산한 조명을 양안이 재사용하는 이점을 언급한다.
- 기능은 필수가 아니라 선택이며, 지원 여부는 `CheckFeatureSupport` 티어로 확인한다. 티어 0.9 는 WRAP·CLAMP 주소 모드와 SRV 제약(전체 밉 범위 등)이 있고, 티어 1.0 은 모든 주소 모드와 SRV 설정에서 쓴다.

## 주의/비용

- **하드웨어·API 종속.** 이 노트의 근거는 D3D12 기능 스펙이다. 다른 API 의 대응 기능은 확인하지 않았다. 여러 API 를 지원해야 하면 [소프트웨어 가상 텍스처링](/develop-wiki/knowledge/graphics-xr/virtual-texturing-page-table-feedback/)이 대안이 될 수 있다.
- **짝 리소스는 단일 샘플.** 멀티샘플 텍스처에는 쓸 수 없다. 피드백 맵 자체는 타일 리소스가 될 수 없다.
- **읽기 지연.** 읽기-해제-로드를 거쳐 보이는 데 몇 프레임이 걸리므로, 로드 전에는 거친 밉이 보이는 **팝인**을 막으려면 밉 하한 클램프와 보간(분수 밉)이 필요하다. 스펙은 MinMip 값에 필터링해 밉을 부드럽게 섞을 수 있다고 한다.
- **제로 가중 읽기.** 필터링에서 가중치 0 인 읽기가 피드백에 기록되는지는 하드웨어마다 다를 수 있다(스펙). 요청이 약간 과대·과소 보고될 수 있다.
- **MinMip 맵을 직접 관리해야 한다.** 타일이 상주·해제될 때 갱신을 빠뜨리면 비상주 타일을 샘플한다.
- **영역 크기 선택.** 영역이 클수록 맵은 작고 중복 쓰기가 늘어난다. 16384² 텍스처를 256² 영역으로 나누면 MinMip 맵은 4096 텍셀이다.
- **확률적 갱신의 함정**은 위 표처럼 작은 면적의 디테일이다.

## 비교

| 구분 | 소프트웨어 가상 텍스처링 | D3D12 타일 리소스 + 샘플러 피드백 |
| --- | --- | --- |
| 필요량 수집 | 별도 저해상도 피드백 패스 | 일반 렌더 중 `WriteSamplerFeedback` |
| 이방성 반영 | 직접 흉내 | 하드웨어가 샘플 패턴 처리 |
| 간접 주소 | 셰이더의 페이지 테이블 룩업 | 하드웨어 타일 매핑 + MinMip 클램프 |
| 이식성 | 높음 | D3D12 중심 |
| 앱 책임 | 페이지 테이블·캐시 전체 | 상주 관리와 MinMip 맵 갱신 |
