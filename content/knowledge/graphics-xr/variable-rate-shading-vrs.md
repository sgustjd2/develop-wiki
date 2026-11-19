---
title: 가변 속도 셰이딩(VRS) — 픽셀 묶음을 한 번만 셰이딩하는 거친 픽셀 셰이딩
aka: [Variable Rate Shading, VRS, Coarse Pixel Shading, Shading Rate Image, SV_ShadingRate, D3D12 VRS Tier 1, VRS Tier 2]
category: graphics-xr
group: rendering
level: intermediate
summary: VRS 는 픽셀 셰이더를 1×1 대신 2×2·4×4 같은 픽셀 묶음당 한 번만 실행해 결과를 묶음 전체에 퍼뜨리는 하드웨어 기능이다. 깊이·커버리지는 그대로 풀 해상도로 처리한다. D3D12 는 드로우별·프리미티브별·화면 이미지 세 출처를 합쳐 비율을 정한다.
tags: [rendering, shading, vrs, variable-rate-shading, d3d12, performance, foveated-rendering, vr]
related: [graphics-xr/texture-space-shading, graphics-xr/foveated-stereo-rendering, graphics-xr/rasterization-pipeline, graphics-xr/shaders-gpu-pipeline, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/taa-temporal-filtering-ao-ssr]
sources:
  - https://microsoft.github.io/DirectX-Specs/d3d/VariableRateShading.html
  - https://github.com/microsoft/DirectX-Specs/blob/master/d3d/VariableRateShading.md
  - https://developer.nvidia.com/blog/texture-space-shading/
updatedAt: 2026-11-19
---

> 출처 메모: Microsoft DirectX-Specs 저장소의 `d3d/VariableRateShading.md` 원문을 내려받아 동기, 티어, 비율 지정 방식, 결합기, 깊이·스텐실, 타일, 미분, API 열거형 절을 읽었다. **MSAA 표본 수별 지원 거친 픽셀 크기 표는 이미지라 읽지 못했다.** 속성 보간·SV_Coverage 세부와 Vulkan(`VK_KHR_fragment_shading_rate`)·Metal 의 대응 기능은 읽지 않았다. 텍스처 공간 셰이딩과의 관계는 [기존 노트](/develop-wiki/knowledge/graphics-xr/texture-space-shading/)의 출처(NVIDIA Turing TSS 블로그)를 따른다. 호출 수 계산은 내 산수다.

## 문제

VRS 이전에 셰이딩 빈도를 바꾸는 방법은 사양의 표현대로 둘뿐이었다. 픽셀당 1회(기본) 또는 MSAA 표본당 1회(슈퍼샘플링). 둘 다 **화면 전체에 같은 비용**을 매긴다. 그런데 화면에는 셰이딩을 덜 해도 티가 안 나는 곳이 있다.

- HUD 뒤에 가려진 영역, 반투명 물체 뒤
- 피사계 심도·모션 블러로 어차피 뭉개질 영역
- VR 렌즈 왜곡으로 가장자리가 압축되는 영역

## 해법

### 1. 거친 픽셀 (사양 "New model")

- MSAA 슈퍼샘플링의 반대 방향, 즉 **픽셀보다 거친 단위**로 셰이딩한다. 픽셀 묶음을 한 단위로 한 번 셰이딩하고 결과를 묶음의 모든 표본에 퍼뜨린다.
- 거친 픽셀 크기는 렌더 타깃을 만든 뒤에도 바꿀 수 있다. 그래서 화면 영역마다, 드로우마다 다르게 쓸 수 있다.
- 비율: 1×1, 1×2, 2×1, 2×2 는 모든 티어에서 요청 가능. 2×4, 4×2, 4×4 는 `AdditionalShadingRatesSupported` 캡이 있을 때만.
- **깊이·스텐실·커버리지는 항상 풀 표본 해상도로** 계산된다. 즉 실루엣 경계는 거칠어지지 않는다. 단, 픽셀 셰이더가 깊이나 스텐실을 내보내면(`SV_Depth`, `SV_StencilRef`) 거친 셰이딩이 꺼지고 원래 비율로 돈다.

### 2. 티어 (사양 "Feature Tiering")

| 티어 | 비율 지정 | 비고 |
| --- | --- | --- |
| Tier 1 | 드로우 단위 하나만, 화면 위치와 무관 | 1×2, 프로그래머블 표본 위치, 보수적 래스터화를 쓰면 원래 비율로 돌아갈 수 있음 |
| Tier 2 | 드로우 + 프리미티브별(`SV_ShadingRate`) + 화면 공간 이미지, 결합기로 합침 | 화면 이미지 타일 16×16 이하(8 또는 16), 요청 비율을 **정확히** 지킴, PS 에서 `SV_ShadingRate` 읽기 지원 |

Tier 2 의 "정확히 지킨다" 는 보장은 시간적 재구성 필터의 정확도를 위해서라고 사양이 이유를 적는다.

### 3. 세 출처와 결합기 (사양 "Combining Shading Rate Factors")

- **드로우 단위**: 명령 목록에 `D3D12_SHADING_RATE` 하나를 설정.
- **프리미티브 단위**: `SV_ShadingRate` 를 VS·GS 에서(메시 셰이더는 캡이 있을 때) 출력. 플랫 셰이딩되어 삼각형 전체에 적용된다. 셰이더 모델 6.4. `SV_ViewID` 별로 다른 값을 낼 수 있어 뷰 인스턴싱과 함께 쓸 수 있다.
- **화면 공간 이미지**: 렌더 타깃 해상도가 아니라 **타일 단위** 해상도의 이미지. 한 바이트가 `D3D12_SHADING_RATE` 값 하나다. 설정된 동안 어떤 셰이더도 그 리소스를 읽거나 쓸 수 없고, 드로우 시점에 `SHADING_RATE_SOURCE` 상태여야 한다.

세 값은 두 단계로 결합된다. 결합기는 축(x, y)별로 따로 동작하며, 값은 로그 축(1x=0, 2x=1, 4x=2)이다.

| 결합기 | 결과 |
| --- | --- |
| Passthrough | A |
| Override | B |
| Min(고품질) | 축별 min(A, B) |
| Max(저품질) | 축별 max(A, B) |
| Sum | 축별 min(maxRate, A + B), 캡 필요 |

열거형은 `(x축 << 2) | y축` 로 인코딩된다(2×1 = 0x4, 1×2 = 0x1, 2×4 = 0x6, 4×4 = 0xA). 사양의 예처럼 1×2 와 2×1 의 Min 은 1×1 이다. 직접 계산하면 Max 는 2×2, 2×2 와 2×1 의 Sum 은 4×4 까지 허용되는 장치에서 4×2, 2× 가 상한인 장치에서는 2×2 로 잘린다. 지원하지 않는 비율이 결합 결과로 나오면 지원되는 비율로 "정리(sanitize)" 된다.

```ts
type Axis = 0 | 1 | 2;                      // 1x, 2x, 4x 의 log2
type Rate = [Axis, Axis];
type Combiner = 'passthrough' | 'override' | 'min' | 'max' | 'sum';

function combine(c: Combiner, a: Rate, b: Rate, maxAxis: Axis): Rate {
  const f = (x: Axis, y: Axis): Axis => {
    switch (c) {
      case 'passthrough': return x;
      case 'override': return y;
      case 'min': return Math.min(x, y) as Axis;
      case 'max': return Math.max(x, y) as Axis;
      case 'sum': return Math.min(maxAxis, x + y) as Axis;
    }
  };
  return [f(a[0], b[0]), f(a[1], b[1])];
}
const encode = ([x, y]: Rate) => (x << 2) | y; // D3D12_SHADING_RATE 값
// combine('min', [0,1], [1,0], 2) → [0,0] = 1x1 (사양의 예)
```

### 4. 타일과 미분

- 한 프리미티브는 VRS 타일 하나 안에서 **비율이 하나뿐**이다. 거친 픽셀 격자는 타일 격자에 고정되어 타일 경계를 넘지 않는다. 격자의 정확한 위치는 플랫폼마다 다를 수 있다.
- 화면 미분이 커진다. 2×2 거친 픽셀이면 기울기가 두 배가 되고, 그 결과 **더 낮은 밉**이 선택된다. 사양은 셰이더에서 보정할지는 앱이 정할 일이라고 적는다.

### 호출 수 어림 (직접 계산)

1920×1080 을 한 비율로 다 덮는다고 가정하면 픽셀 셰이더 호출은 1×1 에서 2,073,600, 2×1 에서 1,036,800, 2×2 에서 518,400, 4×4 에서 129,600 이다. 화면 이미지는 16 픽셀 타일이면 120×68, 8 픽셀이면 240×135 바이트다. 실제 이득은 셰이더가 병목인지, 쿼드 효율, 오버드로에 따라 다르므로 이 비율이 곧 시간 절감은 아니다.

## 언제 쓰나

- 픽셀 셰이딩이 병목이고, 화면에 셰이딩을 줄여도 되는 영역이 분명할 때(블러·HUD·투명·VR 렌즈 가장자리, 사양이 든 예).
- VR 의 고정·시선 추적 [포비티드 렌더링](/develop-wiki/knowledge/graphics-xr/foveated-stereo-rendering/)을 구현하는 수단으로. Tier 2 의 화면 이미지가 바로 "영역별 품질 마스크" 다.
- 기존 파이프라인을 크게 바꾸지 않고 비용 조절 손잡이를 더하고 싶을 때. 비율 설정과 이미지 한 장이면 된다.

## 주의/비용

- **하드웨어·티어 의존.** Tier 1 은 화면 영역별 조절이 안 되고, 일부 기능과 함께 쓰면 거친 셰이딩이 보장되지 않는다. 4×4 등은 캡 확인이 필요하다.
- **흐림·블록.** 질감이 촘촘한 표면을 거칠게 셰이딩하면 블록이 보인다. 밉 선택이 바뀌는 효과까지 겹친다.
- **깊이 출력 셰이더는 혜택 없음.** 깊이·스텐실을 쓰는 셰이더는 원래 비율로 돈다.
- **재사용은 없다.** VRS 는 한 프레임·한 뷰 안에서 셰이딩 빈도만 낮춘다. 스테레오 두 눈이나 다음 프레임과 결과를 나누지 않는다. 그건 [텍스처 공간 셰이딩](/develop-wiki/knowledge/graphics-xr/texture-space-shading/)의 영역이다.
- **비율 이미지는 앱 몫.** 사양은 블러·HUD·투명 영역을 표시한 "LOD 마스크" 라는 예만 든다. 이미지를 무엇으로 어떻게 채울지, 그 패스의 비용은 앱이 설계해야 한다.

## 비교: VRS 와 텍스처 공간 셰이딩(TSS)

| 구분 | VRS | 텍스처 공간 셰이딩 |
| --- | --- | --- |
| 셰이딩 단위 | 화면 공간 거친 픽셀(최대 4×4) | 텍스처 공간 텍셀(밉으로 크기 조절) |
| 비율 조절 | 드로우·프리미티브·화면 타일(8/16 px) | 밉 레벨로 연속 조절 |
| 결과 저장·재사용 | 없음(즉시 퍼뜨림) | 셰이딩 캐시에 저장, 눈·프레임 간 재사용 |
| 깊이·커버리지 | 풀 해상도 유지 | 가시성은 화면 공간에서 평소대로 |
| 전제 | VRS 하드웨어·티어 | 표면별 고유 텍스처 매핑, 캐시 관리 |
| 파이프라인 변경 | 작음 | 큼 |
| 근거 문서 | D3D12 사양 | NVIDIA Turing TSS 블로그 |

NVIDIA 블로그는 TSS 의 샘플링 방식으로 VRS 와 같은 셰이딩 비율 감소 기법 상당수를 구현할 수 있고, VRS 는 파이프라인 변경이 가볍고 TSS 는 더 유연하다고 비교한다. 정리하면 **비용만 줄이려면 VRS, 결과를 여러 번 쓰려면 TSS** 다. 둘은 배타적이지 않다(동시 사용 사례는 확인하지 못했다).
