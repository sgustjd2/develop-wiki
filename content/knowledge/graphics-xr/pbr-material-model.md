---
title: PBR 재질 모델
aka: [Physically Based Rendering, PBR, Metallic-Roughness, Cook-Torrance, GGX, Fresnel, Microfacet, BRDF]
category: graphics-xr
group: rendering
level: advanced
summary: 표면을 미세면(microfacet)의 집합으로 보고 에너지 보존을 지키는 재질 모델. baseColor·metallic·roughness 세 값만으로 조명이 바뀌어도 일관된 모습을 낸다.
tags: [pbr, brdf, ggx, gltf, materials, lighting]
related: [graphics-xr/shaders-gpu-pipeline, graphics-xr/forward-vs-deferred-rendering, graphics-xr/rasterization-pipeline, cs-fundamentals/number-representation]
sources:
  - https://learnopengl.com/PBR/Theory
  - https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  - https://google.github.io/filament/Filament.html
updatedAt: 2026-11-19
---

## 문제

옛 Phong 계열 재질은 "diffuse 색 + specular 색 + 광택 지수" 를 아티스트가 조명마다 손으로 맞췄다. 같은 재질이 실내·실외 조명에서 다르게 보이고, 파라미터 조합에 따라 반사광이 입사광보다 많아지는(에너지가 늘어나는) 비현실적 결과도 나왔다. 여러 엔진·도구 사이에서 에셋을 주고받기도 어려웠다.

## 해법

핵심 가정 두 가지(LearnOpenGL PBR 이론 요약).

1. **미세면 이론**: 표면은 아주 작은 거울 면들의 집합이다. 거칠수록 미세면 방향이 흩어져 하이라이트가 넓고 흐려진다.
2. **에너지 보존**: 나가는 빛의 양은 들어온 빛을 넘지 못한다. 반사(specular)가 늘면 확산(diffuse)은 그만큼 줄어야 한다.

### Cook-Torrance 스펙큘러

`f_specular = D · F · G / (4 (n·ωo)(n·ωi))`

| 항 | 묻는 것 | 흔한 선택(LearnOpenGL) |
| --- | --- | --- |
| D (법선 분포) | 하프벡터 방향을 향한 미세면 비율 | Trowbridge-Reitz **GGX** |
| F (프레넬) | 보는 각도별 반사율. 비스듬할수록 거울처럼 | **Fresnel-Schlick** |
| G (기하 감쇠) | 미세면끼리 서로 가리는 정도 | Smith + Schlick-GGX |

GGX 는 `α²/(π((n·h)²(α²-1)+1)²)`, α 는 roughness 를 제곱한 값을 쓰는 구현이 많다. 직접 수치적분으로 확인한 결과, α=0.3 에서 `∫ D(h)(n·h) dω ≈ 1.0000` 으로 정규화돼 있다(Python 으로 반구 적분, 20만 샘플).

### Metallic-Roughness 입력

glTF 2.0 의 기본 재질이 이 방식이다.

| 파라미터 | 의미 |
| --- | --- |
| baseColor | 비금속이면 확산 알베도, 금속이면 반사색(F0) |
| metallic | 0 = 유전체, 1 = 금속. 중간값은 텍스처 경계용 |
| roughness | 0 = 매끈, 1 = 거침 |

- 비금속(유전체)의 수직 입사 반사율 F0 는 대략 0.04 로 두는 것이 관행이다.
- 금속은 확산이 없고 F0 = baseColor 다.

```ts
// metallic-roughness → 셰이딩에 쓰는 F0 와 diffuse 색
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function split(baseColor: [number, number, number], metallic: number) {
  const f0 = baseColor.map((c) => lerp(0.04, c, metallic));
  const diffuse = baseColor.map((c) => c * (1 - metallic));
  return { f0, diffuse };
}
```

### 선형 공간

조명 계산은 **선형 색 공간**에서, 출력할 때만 sRGB 감마로 변환한다. baseColor 텍스처는 sRGB 로 저장되므로 샘플링 시 선형으로 풀고, 법선·roughness 텍스처는 선형 데이터로 취급한다. 이걸 놓치면 PBR 이 어두워지거나 탁해진다.

## 언제 쓰나

- 조명 환경이 바뀌는 앱(AR·VR, 게임, 3D 뷰어, 이커머스 제품 뷰). AR 은 실제 조명에 맞춰 환경광을 추정하므로 PBR 이 특히 어울린다.
- 에셋 파이프라인 표준화: glTF 는 PBR 재질을 기본 모델로 둔다.

## 주의 / 비용

- 환경 조명(IBL)을 위해 irradiance 맵·prefiltered 스페큘러 맵·BRDF LUT 를 미리 계산해야 한다. 메모리·베이크 비용이 든다.
- 모바일·스탠드얼론 VR 은 ALU·대역폭 예산이 작아 단순화한 PBR(조명 수 제한, 근사 BRDF)을 쓴다.
- "물리 기반" 은 "물리적으로 정확" 이 아니다. 광원이 점 광원이고, 다중 산란·서브서피스·이방성은 별도 확장이 필요하다.
- metallic 을 0.5 같은 중간값으로 칠하면 현실에 없는 재질이다. 텍스처 경계 보간 용도로만 쓴다.
- 분포·G 항 선택이 구현마다 다르니 엔진 간 결과는 비슷하지만 같지는 않다.

## 개발자에게 왜 중요한가

재질 값이 조명과 분리되므로, 아티스트는 재질을 한 번 만들고 개발자는 조명만 바꾼다. 셰이더 포팅 시 "어느 항을 어떻게 근사했는지" 를 문서화하지 않으면 엔진 이식 때 화면이 달라지는 원인을 찾기 힘들다. 실행 모델은 [셰이더 기초](graphics-xr/shaders-gpu-pipeline) 참고.
