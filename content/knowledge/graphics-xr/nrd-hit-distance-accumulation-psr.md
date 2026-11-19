---
title: NRD 히트 거리 누적과 PSR — 여러 바운스의 hitT 와 거울 너머 가상 표면
aka: [NRD Hit Distance, hitT Accumulation, Primary Surface Replacement, PSR, Virtual World Space, Virtual Position, Delta Events, Disocclusion Threshold Mix]
category: graphics-xr
group: rendering
level: advanced
summary: NRD 는 첫 바운스의 히트 거리를 기준으로 삼고, 그 뒤 바운스는 곡률과 로브 퍼짐으로 앱이 보정해 넘기라고 요구한다. PSR 은 완전 거울 뒤의 첫 비거울 히트를 1차 표면으로 바꿔 넣어, 디노이저가 반사 속 장면을 직접 보게 한다.
tags: [rendering, ray-tracing, denoising, nrd, hit-distance, psr, reflection, path-tracing, motion-vectors]
related: [graphics-xr/nrd-reblur-relax-denoiser-inputs, graphics-xr/restir-gi-pt-hit-distance-contract, graphics-xr/restir-pt-shift-mapping-jacobian, graphics-xr/hw-ray-traced-shadows-reflections, graphics-xr/reflection-probes-ssr, graphics-xr/svgf-ray-tracing-denoising]
sources:
  - https://github.com/NVIDIA-RTX/NRD
  - https://developer.nvidia.com/blog/rendering-perfect-reflections-and-refractions-in-path-traced-games/
updatedAt: 2026-11-19
---

> 출처 메모: NRD 저장소 README(v4.18.0)의 원문 마크다운을 내려받아 "Noisy inputs" 의 히트 거리 절, 셰이더 의사 코드, 입력 그림 설명, "Interaction with primary surface replacements" 절을 직접 읽었다. PSR 의 출처로 README 가 링크한 NVIDIA 개발자 블로그 "Rendering Perfect Reflections and Refractions in Path-Traced Games" 는 웹 요약 도구로 읽어서 문장 대조는 못 했다. **NRD 샘플이 쓰는 "더 정교한 hitT 누적" 의 코드와 곡률 보정 식은 읽지 않았다.** README 도 식을 싣지 않는다. 그래서 아래에서 2번째 이후 바운스 보정은 "무엇을 해야 하는지" 만 쓰고 식은 쓰지 않는다. 코드는 README 규칙을 요약한 내 예시이며 NRD 의 실제 코드가 아니다.

## 문제

[NRD](/develop-wiki/knowledge/graphics-xr/nrd-reblur-relax-denoiser-inputs/)의 ReBLUR·ReLAX 는 히트 거리 `hitT` 로 블러 반경과 반사 리프로젝션을 정한다. 1 바운스 광선 하나라면 정의가 분명하지만 실제 경로 추적기에서는 두 가지가 꼬인다.

1. **여러 바운스.** 경로가 세 번 튕겼을 때 어떤 거리를 넘길 것인가. 구간 길이를 다 더하면 실제 반사상보다 훨씬 먼 거리가 되어 블러가 과해진다.
2. **완전 거울.** 거울 표면은 G-버퍼에 거울 자체로 기록된다. 거울에 비친 물체의 노이즈를 걸러야 하는데 디노이저가 보는 법선·깊이·모션은 거울 평면의 것이라 반사상이 화면에서 움직일 때 히스토리를 제대로 못 끌어온다.

## 해법

### 1. 히트 거리 누적 규칙 (README "Noisy inputs")

- 1차 히트(또는 PSR) **다음 첫 바운스의 hitT 는 그대로** 넣는다. 1차 히트까지의 거리는 넣지 않는다.
- 2번째 이후 바운스(그리고 PSR 이전 바운스)의 hitT 는 **곡률과 로브 에너지 퍼짐으로 앱이 보정**해야 한다.
- **모든 구간 길이의 합을 넣지 않는다.** README 의 무난한 기준은 첫 바운스 거리만 쓰는 것이고, 확산·반사 모두에 잘 맞는다고 한다. NRD 샘플은 로브 퍼짐과 현재 히트의 곡률로 인한 에너지 감쇠를 고려하는 더 복잡한 누적을 쓴다.
- 음수 불가, 접촉점에서 0 에 가까워질 것, PDF·BRDF 로 나누지 말 것(필요하면 확률적 받아들임/거부). 표면 안쪽을 향한 광선은 0 이어도 되고, NRD 는 근처에 0 이 아닌 값이 있으면 0 을 무시하려 한다.
- 2번째 이후 바운스의 확률적 확산/반사 분기는 괜찮다고 README 가 명시한다(첫 바운스의 확률적 분기는 재구성 모드 등 별도 처리가 필요하다).
- **픽셀당 경로가 여러 개**면 반사 hitT 는 단순 평균이 아니라 `NRD_FrontEnd_SpecHitDistAveraging_*` 로 "평균" 하고, 확산 hitT 는 확산 경로 수로 나눈다. 복사휘도는 샘플링 확률이 이미 반영돼 있으므로 전체 경로 수로 나누지만, hitT·방향은 확률을 포함하지 않으므로 **해당 로브의 경로 수로만** 나눈다(README 의사 코드의 주석).
- ReBLUR 는 `REBLUR_FrontEnd_GetNormHitDist` 로 정규화한 값을 받는다. 이 함수에는 1차 히트의 viewZ 와, 반사면 1차 히트의 거칠기(확산이면 1)가 들어간다.

```ts
interface PathSample { lobe: 'diff' | 'spec'; firstBounceHitT: number; radiance: number }

// README 의사 코드의 "평균 내는 대상" 규칙만 옮긴 예시. 반사 hitT 의 전용 평균 함수는 단순 평균으로 대신했다.
function packPixel(paths: PathSample[]) {
  const diff = paths.filter((p) => p.lobe === 'diff'), spec = paths.filter((p) => p.lobe === 'spec');
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    diffRadiance: diff.reduce((a, p) => a + p.radiance, 0) / paths.length, // 전체 경로 수로
    specRadiance: spec.reduce((a, p) => a + p.radiance, 0) / paths.length,
    diffHitT: mean(diff.map((p) => p.firstBounceHitT)),                     // 그 로브의 경로 수로
    specHitT: mean(spec.map((p) => p.firstBounceHitT)),                     // 실제로는 SpecHitDistAveraging
  };
}
```

경로 4개 중 확산 1개(hitT 2), 반사 3개(hitT 1, 1, 4)라면 확산 hitT 는 2, 반사 hitT 는 2 가 된다. 확산 hitT 를 4 로 나눠 0.5 로 만들면 확산 블러가 접촉 그림자처럼 좁아지는 오류가 된다.

### 2. PSR: 거울 너머를 1차 표면으로 (README, NVIDIA 블로그)

블로그의 정의를 요약하면, 반사 광선을 추적해 **거울이 아니라 비친 표면을 G-버퍼에 저장**하는 기법이다. Quake II RTX 에서 구현됐고 Minecraft with RTX 에서도 쓰였다고 블로그는 적는다.

README 가 정한 NRD 쪽 규칙:

- 1차 히트(0번째 바운스)를 연속된 완전 거울(델타 이벤트) 뒤 **첫 비거울 히트**로 바꾼다. 이것이 PSR 이다. G-버퍼의 관련 데이터를 모두 PSR 데이터로 바꾼다.
- 카메라는 거울이 없는 것처럼 PSR 을 본다. 이 공간을 **가상 월드 공간**이라 한다.
  - 가상 위치: 1차 히트와 같은 시선 위에 있고 거리만 늘어난다. 늘어나는 정도는 hitT 와 각 히트의 곡률에 따른다. README 의 평면 거울 예시는 `Bvirtual = A + viewVector × |B − A|` 다.
  - 가상 법선: PSR 히트의 법선을 1차 히트까지 역순으로 여러 번 반사한 것.
- "PSR 데이터는 항상 PSR 히트의 데이터가 아니다":
  - 재질(알베도, 금속도, 거칠기)은 PSR 히트의 것.
  - `IN_NORMAL_ROUGHNESS` 는 가상 공간 법선 + PSR 거칠기.
  - `IN_VIEWZ`·`IN_MV` 는 가상 위치의 값(곡률 보정 가능).
  - 누적 hitT 는 PSR 히트에서 시작한다. 즉 C 가 PSR 다음 히트면 `hitT = |C − B|`(반사된 세계에서는 첫 바운스).
  - 곡률은 첫 바운스부터 고려해야 한다. 1차 표면 법선이 PSR 법선으로 바뀌어 NRD 쪽에서는 알 수 없기 때문이다.
  - NRD 에 넘기는 광선 방향도 가상 공간으로 바꿔야 한다.
- 복사휘도의 확산/반사 분리는 1차 히트가 아니라 **PSR(2차 히트)** 에서 한다.

블로그 쪽 보충: G-버퍼에 표면 위치, 입사 방향, 1차 경로 길이, 바운스 수, 처리량(거울 사슬의 반사색 곱)을 추가하고, 셰이딩·디노이징 뒤 결과에 처리량을 곱한다. 모션 벡터는 반사 행렬 사슬로 변환해 구하며, 이것이 쉬운 경우는 정지한 평면 거울뿐이라고 한다.

```ts
type V3 = [number, number, number];
// 평면 거울 한 장의 가상 위치 (README 의 예시 식). 곡면이면 곡률 보정이 더 필요하다.
const virtualPos = (camHitA: V3, viewDir: V3, psrHitB: V3): V3 => {
  const d = Math.hypot(psrHitB[0] - camHitA[0], psrHitB[1] - camHitA[1], psrHitB[2] - camHitA[2]);
  return [camHitA[0] + viewDir[0] * d, camHitA[1] + viewDir[1] * d, camHitA[2] + viewDir[2] * d];
};
```

카메라가 원점에서 +z 를 보고, 거울이 z = 2, 반사 뒤 PSR 히트까지 3 이면 가상 위치는 z = 5 다. 화면에서는 카메라에서 5 m(거울 뒤 3 m)에 물체가 있는 것처럼 viewZ·모션을 넣는다.

## 언제 쓰나

- **첫 바운스 hitT 만 넘기기**: 대부분의 경우의 출발점. README 가 확산·반사 모두에 무난하다고 한다.
- **보정된 누적**: 다중 바운스 반사(거울 복도 등)가 화면에서 중요하고, 첫 바운스만으로 블러가 틀어질 때. NRD 샘플 구현을 참고해야 한다.
- **PSR**: 바닥 반사, 유리창, 거울처럼 완전 거울(또는 매우 매끈한 면) 뒤 장면을 선명하게 디노이징하고 싶을 때. README 는 평면 거울에 가장 잘 맞는다고 한다.

## 주의/비용

- **곡면 PSR.** 곡률을 무시해도 동작은 하지만 리프로젝션 아티팩트가 생길 수 있다(README).
- **디스오클루전 증가.** PSR 이면 1차 히트 데이터가 바뀌어 NRD 의 디스오클루전 판정이 1차 히트의 곡률을 모른다. 울퉁불퉁한 면에서 디스오클루전이 심해질 수 있어 `disocclusionThreshold` 를 2~10배 키우라고 한다. PSR 과 일반 표면이 섞인 화면이면 `IN_DISOCCLUSION_THRESHOLD_MIX` 로 PSR 픽셀만 큰 임계(`disocclusionThresholdAlternate`)를 쓰게 섞는다.
- **완전 거울만.** 블로그는 거친 반사면에 적용하면 비친 표면이 픽셀마다 엉망이 되어 디노이저가 다루기 어렵다고 한다. 매우 매끈한 면은 완전 거울로 취급하고 공간 블러를 더하거나 거친 면에서 멈추라고 권한다.
- **굴절은 PSR 만으로 안 된다.** G-버퍼는 표면 하나만 담는데 유리는 반사·굴절 두 표면이 필요하다. 블로그는 이를 위한 별도 기법(체커보드 분할)을 쓰며, 한 픽셀에 굴절면이 여럿이면 좋은 해법이 없다고 적는다.
- **움직이는·곡면 거울의 모션 벡터**는 블로그 범위 밖이다.
- **hitT 를 PDF 로 나누는 실수.** 확률을 반영하려다 hitT 를 나누면 거리가 아니게 된다. 받아들임/거부로 처리한다.

## 비교

| 구분 | 일반 1차 히트 | PSR |
| --- | --- | --- |
| G-버퍼 위치 | 거울 표면 A | 가상 위치 B_virtual(시선 위, 거리 늘림) |
| 법선 | A 의 법선 | B 의 법선을 역순 반사한 가상 법선 |
| 재질 | A | B |
| hitT 시작점 | A 다음 히트까지 | B 다음 히트까지(`|C − B|`) |
| 확산/반사 분리 | A 에서 | B 에서 |
| 디스오클루전 임계 | 기본값 | 2~10배 권장(README) |
