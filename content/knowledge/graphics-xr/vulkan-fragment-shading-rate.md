---
title: Vulkan 프래그먼트 셰이딩 비율(VK_KHR_fragment_shading_rate) — 파이프라인·프리미티브·첨부 비율과 결합기
aka: [VK_KHR_fragment_shading_rate, Fragment Shading Rate, FSR, Pipeline Fragment Shading Rate, Primitive Fragment Shading Rate, Attachment Fragment Shading Rate, PrimitiveShadingRateKHR, ShadingRateKHR, Combiner Ops, Vulkan VRS]
category: graphics-xr
group: rendering
level: intermediate
summary: VK_KHR_fragment_shading_rate 는 프래그먼트 하나가 최대 4×4 픽셀을 덮게 해 셰이딩 횟수를 줄이는 Vulkan 기능이다. 드로우별(파이프라인)·프리미티브별·화면 첨부 이미지의 세 비율을 결합기 두 개로 합치고, 지원하지 않는 결과는 정해진 규칙으로 잘라낸다.
tags: [rendering, shading, vulkan, vrs, variable-rate-shading, fragment-shading-rate, foveated-rendering, performance]
related: [graphics-xr/variable-rate-shading-vrs, graphics-xr/foveated-stereo-rendering, graphics-xr/texture-space-shading, graphics-xr/rasterization-pipeline, graphics-xr/shaders-gpu-pipeline]
sources:
  - https://docs.vulkan.org/spec/latest/chapters/primsrast.html
  - https://docs.vulkan.org/spec/latest/chapters/limits.html
  - https://docs.vulkan.org/spec/latest/chapters/renderpass.html
updatedAt: 2026-11-19
---

> 출처 메모: Vulkan 사양(docs.vulkan.org 의 latest 판, 2026-11-19 에 받음) "Rasterization" 장의 Fragment Shading Rates 절 전체(지원 비율 조회, 파이프라인·프리미티브·첨부 비율, 결합 규칙, 클램프), "Limits" 장의 `VkPhysicalDeviceFragmentShadingRatePropertiesKHR` 설명과 Required Limits 표, "Render Pass" 장의 `VkRenderingFragmentShadingRateAttachmentInfoKHR` 를 읽었다. **첨부 이미지의 허용 포맷(format feature 표), Features 장의 기능 비트 설명, `VK_NV_fragment_shading_rate_enums` 세부, 프래그먼트 셰이더 쪽 보간·미분 규칙은 읽지 않았다.** D3D12 와의 대응은 [VRS 노트](/develop-wiki/knowledge/graphics-xr/variable-rate-shading-vrs/)의 출처(DirectX-Specs)를 따른다. 아래 예시 값은 사양의 식으로 내가 직접 계산했다.

## 문제

[가변 속도 셰이딩](/develop-wiki/knowledge/graphics-xr/variable-rate-shading-vrs/)과 같은 문제다. 화면 전체를 픽셀마다 셰이딩하면 비용이 일정한데, 블러·HUD 뒤·VR 렌즈 가장자리처럼 덜 셰이딩해도 되는 곳이 있다. Vulkan 은 이것을 **프래그먼트 크기**를 키우는 방식으로 표현한다. 사양은 이 기능이 멀티샘플링과 강하게 얽혀 있어, 쓸 수 있는 비율이 표본 수에 따라 제한될 수 있다고 처음부터 적는다.

## 해법

### 1. 지원 비율 조회

`vkGetPhysicalDeviceFragmentShadingRatesKHR` 가 (표본 수 비트마스크, 프래그먼트 크기) 목록을 돌려준다. 사양이 정한 규칙:

- 너비·높이는 1 이상의 2의 거듭제곱이고 `maxFragmentSize` 이하.
- 목록은 너비 내림차순, 같은 너비 안에서 높이 내림차순. 중복 없음.
- 너비 × 높이 × 최대 표본 수 ≤ `maxFragmentShadingRateCoverageSamples`.
- **모든 구현이 지원해야 하는 비율**: {2,2}·{2,1}(1× 및 4× 표본), {1,1}(모든 표본 수). 프레임버퍼 색 표본에 2× 가 있으면 2× 도 포함해야 한다. **{1,2} 는 필수 목록에 없다.**
- 목록은 장치 고유(native, 회전된) 좌표계 기준이라, 렌더 패스 변환이 90°·270° 회전이면 앱이 현재(회전되지 않은) 좌표계로 가로·세로를 바꿔 해석해야 한다(사양 예: 4×2 만 지원하면 회전 시 2×4 가 지원 비율).

Required Limits 표 기준 하한: `maxFragmentSize` 는 최소 (2,2), `maxFragmentShadingRateCoverageSamples` 최소 16, `maxFragmentShadingRateRasterizationSamples` 최소 4×. 첨부 기능을 지원하면 `minFragmentShadingRateAttachmentTexelSize` 는 (32,32) 이하, `maxFragmentShadingRateAttachmentTexelSize` 는 (8,8) 이상이어야 한다.

### 2. 세 출처

| 출처 | 지정 방법 | 단위 |
| --- | --- | --- |
| 파이프라인 | `VkPipelineFragmentShadingRateStateCreateInfoKHR` 또는 동적 상태 `vkCmdSetFragmentShadingRateKHR` | 드로우 |
| 프리미티브 | 마지막 전(前)래스터화 셰이더 단계의 `PrimitiveShadingRateKHR` 내장 변수. 메시 셰이더면 프리미티브별 값, 아니면 **유발 정점(provoking vertex)** 의 값 | 프리미티브 |
| 첨부(attachment) | 서브패스의 `VkFragmentShadingRateAttachmentInfoKHR` 또는 동적 렌더링의 `VkRenderingFragmentShadingRateAttachmentInfoKHR` | 화면 텍셀 영역 |

- 파이프라인 구조체가 없으면 크기 (1,1), 결합기 둘 다 KEEP 으로 본다.
- `vkCmdSetFragmentShadingRateKHR` 의 크기는 각 축 1~4 의 2의 거듭제곱이어야 한다. 해당 기능 비트가 꺼져 있으면 크기는 1, 결합기는 KEEP 이어야 하고, `fragmentShadingRateNonTrivialCombinerOps` 가 없으면 결합기는 KEEP·REPLACE 만 쓸 수 있다.
- **첨부 이미지**: 프레임버퍼 픽셀 (x, y) 는 텍셀 `(⌊x/region_x⌋, ⌊y/region_y⌋)` 를 읽는다(region = `shadingRateAttachmentTexelSize`). 첫 성분 값에서 `width = 2^((texel/4)&3)`, `height = 2^(texel&3)`. 너비·높이 4 를 넘는 값은 쓰면 안 된다. 멀티뷰면 `ViewIndex` 로 층을 고른다. 첨부를 지정하지 않으면 (1,1).

이 인코딩은 D3D12 의 `(x축 log2 << 2) | y축 log2` 와 같은 비트 배치다. 직접 확인한 예: 0x4 → 2×1, 0x6 → 2×4, 0xA → 4×4.

### 3. 결합 (사양 "Combining the Fragment Shading Rates")

두 단계로 합친다. `C1 = combine₀(파이프라인, 프리미티브)`, `C = combine₁(C1, 첨부)`. 축별로 따로 계산하며 값은 **프래그먼트 크기 자체**(1, 2, 4)다.

| `VkFragmentShadingRateCombinerOpKHR` | 결과 |
| --- | --- |
| KEEP (0) | A |
| REPLACE (1) | B |
| MIN (2) | min(A, B) |
| MAX (3) | max(A, B) |
| MUL (4) | A × B |

- 최종 비율은 셰이더에서 `ShadingRateKHR` 내장 변수로 읽힌다.
- **MUL 의 함정**: `fragmentShadingRateStrictMultiplyCombiner` 가 `VK_FALSE` 인 구현은 곱 대신 **덧셈**을 한다. 사양 설명대로 차이는 한 축에서 1 과 1 을 합칠 때뿐이다(1×1 = 1 이어야 하는데 1+1 = 2). 일부 구현이 사양 밖의 불명확한 요구를 따라 선형 덧셈으로 만든 탓에 이 속성이 추가되었다고 사양이 밝힌다. 선형 곱은 log2 공간의 덧셈과 같아, D3D12 의 SUM 결합기에 해당한다.

### 4. 클램프

- 결합기 입력 A·B 는 클램프하는 것이 권장(`fragmentShadingRateClampCombinerInputs` 가 참이면 필수)이고, **두 번째 결합 결과는 모든 구현이 반드시 클램프**한다.
- 지원 목록에 있으면 그대로, 없으면 목록에서 순서대로 고른다.
  1. 두 축 모두 원래 값 이하인 비율만 남긴다(가로·세로를 바꿔 비교한 것도 남길 수 있음).
  2. 면적(가로 × 세로)이 가장 큰 것.
  3. 가로 + 세로가 가장 작은 것(정사각형에 가까운 것).
  4. 4×1 과 1×4 처럼 둘이 남으면 구현이 고르되, 같은 입력에는 `VkDevice` 수명 동안 일관되게.

```ts
type Rate = [number, number];                       // [width, height] in pixels
type Op = 'keep' | 'replace' | 'min' | 'max' | 'mul';
function combine(op: Op, a: Rate, b: Rate, strictMul = true): Rate {
  const f = (x: number, y: number) =>
    op === 'keep' ? x : op === 'replace' ? y : op === 'min' ? Math.min(x, y)
    : op === 'max' ? Math.max(x, y) : (!strictMul && x === 1 && y === 1 ? 2 : x * y);
  return [f(a[0], b[0]), f(a[1], b[1])];
}
function clampRate(r: Rate, supported: Rate[]): Rate {  // 가로·세로 교환 허용은 생략
  if (supported.some(([w, h]) => w === r[0] && h === r[1])) return r;
  const c = supported.filter(([w, h]) => w <= r[0] && h <= r[1]);
  const area = Math.max(...c.map(([w, h]) => w * h));
  const c2 = c.filter(([w, h]) => w * h === area);
  const asp = Math.min(...c2.map(([w, h]) => w + h));
  return c2.find(([w, h]) => w + h === asp)!;       // 동점(4x1/1x4)은 구현 선택
}
// 최종 = clampRate(combine(op1, combine(op0, pipeline, primitive), attachment), list)
```

### 직접 계산 예

- 파이프라인 2×2, 프리미티브 2×1, MUL → 4×2. 4×2 를 지원하는 장치면 그대로, **필수 목록만**({2,2}, {2,1}, {1,1}) 지원하면 클램프로 2×2.
- 파이프라인 2×1, 프리미티브 1×2, MUL → 2×2.
- 엄격하지 않은 MUL 에서 1×1 과 1×1 → 2×2(덧셈). 기본 1×1 파이프라인에 MUL 을 걸어 두면 이 구현에서는 셰이딩이 의도치 않게 거칠어진다.
- 1×4 를 필수 목록에 클램프하면 1단계에서 {1,1} 만 남는다(가로·세로 교환을 허용하는 구현은 {2,1} 도 후보로 남길 수 있다).
- 1920×1080 화면의 첨부 이미지 크기: 텍셀 8 이면 240×135, 16 이면 120×68, 32 이면 60×34.

### 5. 강제로 1×1 이 되는 경우

다음이면 구현이 최종 비율을 {1,1} 로 둔다(해당 속성이 없을 때).

- 샘플 셰이딩 사용
- 파이프라인 샘플 마스크에 0 비트(`fragmentShadingRateWithSampleMask` 없음)
- 셰이더가 `SampleMask` 사용(`...WithShaderSampleMask` 없음)
- 셰이더가 `FragDepth`·`FragStencilRefEXT` 를 씀(`...WithShaderDepthStencilWrites` 없음)
- 보수적 래스터화, 프래그먼트 셰이더 인터록, 사용자 표본 위치(각 속성 없음)
- 타일 이미지 읽기 기능 선언

## 언제 쓰나

- Vulkan 으로 [포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)(고정 또는 시선 추적)을 할 때. 첨부 이미지가 영역별 품질 지도이고, 멀티뷰면 눈마다 다른 층을 쓸 수 있다.
- 드로우 단위로 먼 물체·블러 대상만 거칠게 셰이딩할 때(파이프라인 비율, 결합기 불필요).
- 메시·정점 셰이더가 프리미티브의 화면 속도·깊이 같은 정보로 비율을 정하게 할 때(프리미티브 비율).

## 주의/비용

- **구현마다 목록이 다르다.** 4×4·4×2·1×2 는 보장되지 않는다. 요청한 비율이 아니라 클램프된 비율이 쓰이므로, 품질 검증은 실제 장치 목록으로 한다.
- **MUL 은 속성 확인 후.** `fragmentShadingRateStrictMultiplyCombiner` 를 확인하지 않고 MUL 을 쓰면 1×1 끼리의 결합이 2× 가 될 수 있다.
- **깊이 출력·샘플 마스크·인터록** 같은 기능을 쓰는 셰이더는 조용히 1×1 로 돈다. 비용이 줄지 않는 원인이 되기 쉽다.
- **유발 정점 의존.** 비메시 경로의 프리미티브 비율은 유발 정점 값 하나로 정해진다. 정점마다 다른 값을 쓰면 의도와 다를 수 있다.
- **첨부 텍셀 크기 제약.** 가로·세로 각각 min~max 텍셀 크기 범위의 2의 거듭제곱이어야 하고 가로세로 비 제한도 있다. 앱이 정한 타일 크기가 장치 범위를 벗어날 수 있다.
- **화면 이미지는 앱 몫.** 사양은 첨부를 어떻게 채울지 말하지 않는다. 시선 추적 지도, 이전 프레임 휘도·움직임 분석 같은 생성 패스와 그 비용은 별도다.
- **멀티샘플링과의 상호작용.** 프래그먼트가 덮는 표본 수가 커지므로 `maxFragmentShadingRateCoverageSamples` 같은 한도를 넘는 조합은 목록에서 빠진다.

## 비교: Vulkan 과 D3D12

D3D12 쪽은 [VRS 노트](/develop-wiki/knowledge/graphics-xr/variable-rate-shading-vrs/)(DirectX-Specs) 기준이다.

| 구분 | Vulkan `VK_KHR_fragment_shading_rate` | D3D12 VRS |
| --- | --- | --- |
| 단계 구분 | 기능 비트 3개(pipeline/primitive/attachment)와 속성들 | Tier 1 / Tier 2 |
| 결합기 값 영역 | 프래그먼트 크기(선형) | log2 축 값 |
| 곱/합 결합기 | MUL(엄격하지 않으면 덧셈) | SUM(log2 덧셈, 캡 필요) |
| 화면 이미지 텍셀 | 장치 범위 내 2의 거듭제곱, 최대치는 8 이상 보장 | 8 또는 16 |
| 이미지 값 인코딩 | 값 = log2(너비) × 4 + log2(높이) | 같음 |
| 지원 밖 결과 | 면적 최대 → 정사각형 우선 클램프 | "sanitize" |
| 프리미티브 값 출처 | 유발 정점 또는 메시 프리미티브별 | VS·GS(메시는 캡) |

## 검증 범위

- 읽은 것: Vulkan 사양 latest 판 Rasterization 장 Fragment Shading Rates 절, Limits 장의 해당 속성 설명과 Required Limits 표 행, Render Pass 장의 동적 렌더링 첨부 구조체.
- 직접 계산: 결합·클램프 예, 텍셀 인코딩 해독, 첨부 이미지 크기(Python).
- 미확인: 첨부 이미지 허용 포맷, Features 장의 기능 비트 설명 원문, 프래그먼트 셰이더 미분·보간·밉 선택 규칙, 실제 GPU 별 지원 목록과 성능, `VK_NV_fragment_shading_rate_enums`(표본당 다중 호출) 세부.
