---
title: ReSTIR GI·PT — 경로 재샘플링이 디노이저에 넘기는 hitT 를 망가뜨리는 지점
aka: [ReSTIR GI, ReSTIR PT, GRIS, Generalized Resampled Importance Sampling, Path Resampling, Shift Mapping, hitT Contract]
category: graphics-xr
group: rendering
level: advanced
summary: ReSTIR GI·PT 는 직접 조명용 저수지 재사용을 간접광 경로 전체로 넓힌 기법이다. 한 픽셀의 표본이 이웃 경로의 것일 수 있어, 디노이저(NRD)가 요구하는 로브 안 히트 거리 hitT 를 그대로 넘기면 안 되고 받아들임·대체 규칙이 필요하다.
tags: [rendering, ray-tracing, restir, path-tracing, global-illumination, resampling, nrd, hit-distance, denoising]
related: [graphics-xr/restir-reservoir-resampling, graphics-xr/restir-pt-shift-mapping-jacobian, graphics-xr/nrd-hit-distance-accumulation-psr, graphics-xr/nrd-reblur-relax-denoiser-inputs, graphics-xr/svgf-ray-tracing-denoising, graphics-xr/radiance-cache-sharc-nrc, graphics-xr/pbr-material-model]
sources:
  - https://research.nvidia.com/publication/2021-06_restir-gi-path-resampling-real-time-path-tracing
  - https://research.nvidia.com/publication/2022-07_generalized-resampled-importance-sampling-foundations-restir
  - https://github.com/NVIDIA-RTX/NRD
updatedAt: 2026-11-19
---

> 출처 메모: ReSTIR GI(Ouyang 외, 2021)와 GRIS·ReSTIR PT(Lin 외, SIGGRAPH 2022)는 **NVIDIA 연구 출판 페이지의 초록만** 읽었다. 논문 PDF 는 용량 제한으로 열리지 않아 저수지에 무엇을 저장하는지, 이동 사상(shift mapping)·야코비안 식, 편향 보정 세부, 비용은 **읽지 않았고 쓰지 않는다**. NRD 쪽은 저장소 README 의 hitT·ReSTIR·확률적 로브 선택 절을 읽었다(웹 요약 도구 경유라 문장 하나하나의 원문 대조는 못 했다). README 는 ReSTIR GI 를 언급하지 않고 RESTIR-DI·RESTIR-PT 만 말한다. 아래 코드는 규칙을 요약한 내 예시이며 NRD 의 실제 코드가 아니다.

## 문제

[ReSTIR DI](/develop-wiki/knowledge/graphics-xr/restir-reservoir-resampling/)는 카메라 첫 정점의 **직접 조명**만 다뤘다. 간접광은 광선 1~2개로는 분산이 커서, 강력한 디노이저를 써도 한계가 있다. 같은 아이디어(좋은 표본을 이웃·이전 프레임과 나눠 쓰기)를 **여러 번 튕긴 경로 전체**에 적용하려는 것이 ReSTIR GI·PT 다. 그런데 표본이 이웃 경로에서 왔다는 사실이 두 곳에서 문제를 만든다.

1. 이론: RIS 는 표본이 독립이라고 가정하는데 재사용은 상관을 만든다.
2. 실무: 디노이저는 "이 픽셀의 로브 안에서 쏜 광선" 의 히트 거리를 기대한다.

## 해법

### 1. 무엇이 확장됐나 (초록 수준)

- **ReSTIR GI**(초록): ReSTIR 의 화면 공간 시공간 재샘플링을 경로 추적의 **다중 바운스 간접광 경로**로 확장해, 이웃 픽셀·프레임이 중요한 경로를 공유한다. 픽셀당 광선 1개, 프레임당 1회에서 시험 장면별 MSE 가 경로 추적 대비 9.3배~166배 개선된다고 보고한다. 디노이저와 함께 쓰는 것을 전제로 한다.
- **GRIS / ReSTIR PT**(초록): 상관된 표본, PDF 를 모르는 표본, 서로 다른 정의역의 표본까지 재샘플링하도록 RIS 이론을 일반화했다. 이를 근거로 분산 한계와 수렴 조건을 유도하고, 복잡한 이동 사상으로 픽셀 간 **경로 재사용**을 지원한다. ReSTIR PT 는 픽셀당 경로 1개만 셰이딩하면서 다중 바운스 확산·반사 조명을 잡는다고 한다. 수렴을 보장하도록 고친 오프라인용 변형도 제시한다.

### 2. 디노이저 계약: 재사용 표본의 hitT

[NRD](/develop-wiki/knowledge/graphics-xr/nrd-reblur-relax-denoiser-inputs/) README 가 RIS·MIS·ReSTIR 로 고른 표본에 대해 요구하는 것:

- 히트 거리는 디노이징하려는 **BRDF 로브 안**(확산=코사인 가중, 반사=VNDF)에서의 값이어야 한다.
- 선택된 표본의 hitT 를 **그대로 넣지 않는다**. 실제 로브 기준(BRDF 항, PDF)으로 걸러 **확률적으로 받아들이고**, 거부되면 로브 안 hitT 로 대체한다. PDF·BRDF 로 나누는 방식이 아니라 받아들임/거부다.
- ReSTIR 이 **디스오클루전에서 내는 hitT = 0** 은 항상 무시한다.
- 다중 바운스에서는 첫 바운스 값을 기준으로 하고, 경로 전체 길이를 합산하지 않는다. 2차 이후 바운스는 곡률·로브 에너지 감쇠를 앱이 보정해야 한다고 README 는 적는다(NRD 샘플은 더 정교한 누적을 쓴다고 한다).
- 확률적 로브 선택을 쓰면 건너뛴 로브의 hitT 는 0, 1rpp 에서 `AREA_3X3` 재구성 모드를 쓰는 비결정적 확률일 때는 3×3 안에 유효 샘플이 있도록 확률을 `[1/4, 3/4]` 로 자르고(결정적인 금속 등은 0·1 허용), 재구성 모드와 프리패스 블러를 켠다. 2차 이후 바운스의 확률 하한은 0.05 안팎, 에너지 증가는 20~30배 이내라는 권고도 있다.
- README 에 따르면 SH 디노이저 없이 re-jittering 으로 미세 디테일을 복원하려면 ReSTIR 에서 현재 픽셀의 광원 방향만 얻으면 된다. 낮은 변동은 DLSS 같은 업스케일이 처리할 수 있다고 별도로 적혀 있다.

```ts
interface Shade { hitT: number; reused: boolean; disoccluded: boolean }

// 위 규칙의 요약 예시. acceptProb 는 BRDF·PDF 로 앱이 계산한 값이라고 가정한다.
function denoiserHitT(s: Shade, ownLobeHitT: number, acceptProb: number, u: number): number {
  if (s.disoccluded && s.hitT === 0) return ownLobeHitT; // 0 은 접촉이 아니라 "정보 없음" → 대체(대체 방식은 내 선택)
  if (!s.reused) return s.hitT;                          // 이 픽셀 로브 안에서 직접 쏜 값
  return u < acceptProb ? s.hitT : ownLobeHitT;          // 재사용 표본은 확률적으로 수용, 아니면 대체
}
```

직접 실행해 네 경우(직접 표본, 재사용 수용, 재사용 거부, 디스오클루전 0)가 각각 3.2, 8, 1, 1 로 나오는 것은 확인했다. 이것은 분기 논리 확인일 뿐 영상 품질 검증이 아니다.

## 언제 쓰나

- 간접광을 픽셀당 광선 1개로 감당해야 하고, 이웃·시간 상관이 큰 장면(논문 초록의 전제).
- 이미 NRD 같은 시공간 디노이저를 쓰고 있고, 샘플 품질을 더 올리고 싶을 때. NRD README 는 ReLAX 가 RTXDI 가 만든 신호나 매우 깨끗한 고 rpp 신호에 잘 맞는다고 말한다.

## 주의/비용

- **hitT 오염.** 재사용 표본의 거리를 그대로 넘기면 반사 디노이징의 블러 반경·리프로젝션이 틀어진다. 디노이저 설정으로는 못 고친다.
- **상관의 대가.** 재사용은 표본 간 상관을 만들어 디노이저가 걸러야 할 노이즈의 성격이 달라진다(상관 때문에 반복 재사용의 수렴 보장이 약해진다는 것이 GRIS 가 다룬 문제).
- **구현 난도.** 경로 재사용에는 이웃 경로의 이동 사상과 확률 보정이 필요하다. 이 노트는 그 식을 다루지 않는다. GRIS 논문 본문을 읽고 정리한 [이동 사상·야코비안 노트](/develop-wiki/knowledge/graphics-xr/restir-pt-shift-mapping-jacobian/)를 본다. 그 논문은 ReSTIR GI 가 첫 간접 정점 재연결을 암묵적으로 쓰면서 성능을 위해 정확성을 일부 포기했다고 평가한다.
- **디스오클루전·빠른 움직임**에서는 재사용이 줄어 노이즈가 늘 수 있다(ReSTIR DI 논문의 한계 서술에서 외삽한 것으로 GI·PT 논문에서 직접 확인하지 않았다).

## 비교

| 구분 | ReSTIR DI | ReSTIR GI | ReSTIR PT |
| --- | --- | --- | --- |
| 재사용 대상 | 직접 조명 광원 표본 | 다중 바운스 간접광 경로(초록) | 경로 전체, 이동 사상 사용(초록) |
| 이론 | RIS + 저수지 | (초록에 명시 없음) | GRIS 로 상관·미지 PDF 일반화 |
| 디노이저 입력 | 로브 안 hitT 확인 필요 | 같음 | 같음(README 는 RESTIR-PT 언급) |
