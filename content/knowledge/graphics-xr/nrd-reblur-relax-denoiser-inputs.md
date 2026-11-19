---
title: NRD 의 ReBLUR·ReLAX 디노이저 — 입력 계약, 두 디노이저의 선택, 히스토리 신뢰도
aka: [NRD, NVIDIA Real-Time Denoisers, ReBLUR, ReLAX, SIGMA, Recurrent Blur, A-trous Denoiser, History Confidence, hitT]
category: graphics-xr
group: rendering
level: advanced
summary: NRD 는 픽셀당 광선 1개 안팎의 경로 추적 신호를 G-버퍼 가이드로 걸러 내는 라이브러리다. ReBLUR 는 재귀 블러 방식, ReLAX 는 à-trous 방식이며, 결과 품질은 입력 신호의 약속(hitT, 확률적 로브 선택, 신뢰도)을 지키는 데 달렸다.
tags: [rendering, ray-tracing, denoising, nrd, reblur, relax, restir, path-tracing, hit-distance, temporal]
related: [graphics-xr/nrd-hit-distance-accumulation-psr, graphics-xr/svgf-ray-tracing-denoising, graphics-xr/restir-reservoir-resampling, graphics-xr/hw-ray-traced-shadows-reflections, graphics-xr/taa-temporal-filtering-ao-ssr, graphics-xr/stochastic-ssr-hiz-ray-reuse, graphics-xr/pbr-material-model]
sources:
  - https://github.com/NVIDIA-RTX/NRD
updatedAt: 2026-11-19
---

> 출처 메모: NRD 저장소의 README(v4.18.0, 개요·입력 요구·히스토리 신뢰도·권장 사항·성능 표)를 읽었다. **ReBLUR·ReLAX 의 내부 알고리즘(필터 구조, 가중치 식)을 설명한 논문이나 글은 이 노트에서 확인하지 못했다.** README 도 알고리즘 수식을 싣지 않는다. 그래서 이 노트는 "무엇을 넣고 어떻게 고르는가" 의 계약만 다루고, ReBLUR 의 "재귀 블러" 가 구체적으로 무엇을 반복하는지는 설명하지 않는다. ReLAX 와 ReSTIR·SVGF 의 관계도 README 에 직접 쓰여 있지 않아 단정하지 않는다. 성능 수치는 README 가 적은 RTX 4080 1440p 기본 설정 값이다. 아래 두 수치 실험은 직접 만든 단순 모형이다.

## 문제

1 spp 경로 추적 결과는 노이즈가 너무 커서 한 프레임으로 못 쓴다. [SVGF](/develop-wiki/knowledge/graphics-xr/svgf-ray-tracing-denoising/) 같은 시공간 필터가 해법의 뼈대인데, 실제 게임·프로비즈에서는 확산·반사·그림자·전역 조명이 섞이고 해상도와 광선 예산이 제각각이다. 디노이저의 성능은 필터 자체보다 **입력 신호가 필터가 기대하는 형태인가** 에 좌우된다. NRD 는 그 약속을 문서로 명시한 라이브러리다.

## 해법: 세 디노이저, 한 가지 계약

README 의 개요:

| 디노이저 | 방식(README 표현) | 지원 신호 |
| --- | --- | --- |
| ReBLUR | 재귀 블러 기반 | 확산·반사 복사휘도, 확산·반사 차폐(AO·SO), 방향성 확산 차폐 |
| ReLAX | à-trous 기반, RTXDI(직접 조명 샘플링) 용으로 설계 | 확산·반사 복사휘도 |
| SIGMA | 광원별 그림자 전용 | 태양·달 같은 무한광, 점·스포트 광원 그림자(반투명 포함) |

공통적으로 G-버퍼 가이드(법선, 거칠기, 뷰 Z, 모션 벡터)로 불투명 표면의 노이즈를 푼다. 투명·볼륨은 대상이 아니다. 복사휘도 디노이저는 구면 조화(SH, 실제로는 구면 가우시안) 변형도 있다. 해상도를 낮춰 디노이징할 때는 SH 변형을 필수로 보라고 README 가 권한다(풀해상도에서 응용이 SG 로 세부를 복원하기 때문).

### 입력 계약 (README 의 요구)

- 복사휘도는 첫 히트(또는 PSR 의 2차 히트, [PSR 노트](/develop-wiki/knowledge/graphics-xr/nrd-hit-distance-accumulation-psr/))에서 **확산/반사로 분리**해 넣는다. 자체 발광은 분리해 선명도를 유지한다.
- **히트 거리 `hitT`** 는 디노이징 중인 BRDF 로브 **안에서의** 거리여야 한다. 확산은 코사인 가중 샘플러, 반사는 VNDF 샘플러가 권장된다. 음수 불가, 접촉점에서 0 에 접근, 첫 히트 거리는 포함하지 않는다. 경로 전체 길이의 합을 넣지 말라고 한다(첫 번째 바운스 거리가 무난한 기준).
- **RIS·MIS·ReSTIR** 로 고른 샘플의 `hitT` 는 그대로 못 넣는다. 한 샘플이 여러 반사를 대표하므로, 실제 BRDF 로브 기준으로 확률적으로 받아들이거나 버려야 한다. 버리면 로브 안 히트 거리로 대체한다. ReSTIR 이 디스오클루전에서 내는 `hitT = 0` 은 항상 무시한다. ([ReSTIR](/develop-wiki/knowledge/graphics-xr/restir-reservoir-resampling/)은 이 약속이 틀어지기 쉬운 대표 사례다.)
- 고에너지 **반딧불(firefly)** 은 공간 필터가 퍼뜨리므로 피한다. 안티 반딧불 필터가 있으나 주변 배경 신호가 믿을 만할 때만 동작한다.
- **ReBLUR** 는 히트 거리를 정규화해서 받는다(`REBLUR_FrontEnd_GetNormHitDist`). ReLAX 는 **2차 모멘트** `x²` 를 추적하므로 입력 색이 FP16 에 맞도록 `[0, 250]` 범위로 눌러야 한다. ReBLUR 는 모멘트를 추적하지 않아 더 넓은 HDR 을 받는다고 README 는 적는다.

### 확률적 로브 선택과 3×3 재구성

1 spp 예산이면 픽셀마다 확산·반사 중 한 로브만 쏘는 편이 절반씩 나누는 것보다 효율적이라고 README 는 말한다(금속은 전부 반사에 쓴다). 건너뛴 로브의 `hitT` 는 0 으로 넣고 `HitDistanceReconstructionMode` 를 켠다. 재구성은 3×3(또는 5×5) 이웃에서 유효 샘플을 찾으므로 **그 영역에 반드시 유효 샘플이 있게** 해야 한다. 방법은 확률을 `[1/4, 3/4]` 로 자르고 백색 잡음 대신 Bayer 디더링을 쓰는 것이다. 또 이웃의 샘플이 확률로 나뉘어 있으므로 프리패스(`diffusePrepassBlurRadius`, `specularPrepassBlurRadius`)를 0 이 아닌 값으로 켠다.

**직접 확인.** 2×2 Bayer 임계값(0.125, 0.375, 0.625, 0.875)으로 로브를 고른다고 가정하고(README 는 Bayer 크기를 명시하지 않아 이 가정은 내 선택이다), 3×3 창의 모든 위상에서 확산·반사 개수의 최솟값을 셌다.

| 확산 확률 p | 백색 잡음에서 9 픽셀 중 확산이 하나도 없을 확률 | Bayer 2×2, 창 안 확산·반사 최소 개수 |
| --- | --- | --- |
| 0.10 | 0.387 | 확산 0 (보장 실패) |
| 0.25 | 0.075 | 1, 5 |
| 0.50 | 0.002 | 4, 4 |
| 0.75 | ≈ 0 (반사 없음 확률 0.075) | 5, 1 |
| 0.90 | ≈ 0 (반사 없음 확률 0.387) | 확산 9, 반사 0 (보장 실패) |

`[1/4, 3/4]` 안에서는 모든 위상에서 두 로브가 최소 1 개씩 있다. 밖이면 보장이 깨진다. README 의 "확률을 자르고 디더링하라" 는 권고가 왜 두 세트인지(둘 중 하나만으로는 부족) 보여 준다.

### 히스토리 신뢰도 (History Confidence)

디노이저는 시간 누적(최대 N 프레임)으로 노이즈를 줄이는데, 조명이 갑자기 바뀌면 과거 누적이 지연(lag)을 만든다. README 는 두 디노이저 내장 안티 래그에만 의존하지 말고 **응용이 신뢰도(0 이면 히스토리 초기화, 1 이면 가속 없음)를 입력**하라고 한다. 신뢰도는 "이전 프레임에 저장된 복사휘도" 와 "이전 프레임을 현재 프레임에서 이전 시드로 다시 쏜 복사휘도" 의 차이(그래디언트)로 만든다. 프레임 시간의 5% 미만이라고 한다. 사용 방식이 디노이저마다 다르다.

- ReBLUR: `historyLength *= lerp(confidence, 1, 1/(1 + historyLength))`, 새 길이가 모든 패스와 피드백 루프를 통과한다.
- ReLAX: `historyLength = min(historyLength, maxAccumulatedFrameNum * confidence)`, **시간 누적 패스에서만** 즉시 적용된다.

두 식을 `historyLength = 30`, `maxAccumulatedFrameNum = 30`(내 가정)으로 계산했다.

| 신뢰도 | ReBLUR | ReLAX |
| --- | --- | --- |
| 0.0 | 0.97 | 0.0 |
| 0.1 | 3.87 | 3.0 |
| 0.5 | 15.5 | 15.0 |
| 1.0 | 30 | 30 |

신뢰도가 높을 때는 비슷하지만 0 근처에서 ReBLUR 는 완전히 지우지 않고(`1/(1+hl)` 만큼 남김) ReLAX 는 0 으로 지운다. 그래서 README 도 "ReLAX 는 더 작은 값을 기대한다" 며 디노이저마다 신뢰도 튜닝을 따로 하라고 말한다. 히스토리 길이가 이미 짧은(예: 5, 신뢰도 0.5) 픽셀에서는 ReBLUR 가 2.92 로 줄이고 ReLAX 는 5 를 유지하는 점도 다르다.

## 언제 쓰나

- **ReBLUR**: 범용 선택. README 의 성능 표(RTX 4080, 1440p, 기본 설정)에서 확산+반사 2.55 ms(SH 3.40 ms). 차폐(AO·SO) 디노이저도 ReBLUR 계열이다. 저사양 대상은 `REBLUR_PERFORMANCE_MODE` 를 켤 수 있다.
- **ReLAX**: README 가 "RTXDI 신호나 매우 깨끗한 고 spp 신호와 잘 맞는다" 고 한다. 확산+반사 3.25 ms(SH 4.80 ms). RTXDI 샘플을 고향으로 소개한다.
- **SIGMA**: 광원별 그림자만. 0.40 ms. 광원 수와 무관한 메모리를 쓰려면 광원마다 따로 돌리는 방식(`maxStabilizedFrameNum = 0`).
- 라디언스 캐시(SHARC, NRC)가 있으면 입력 품질과 디스오클루전 거동이 좋아진다고 권장한다.

## 주의/비용

- **입력 약속이 틀리면 디노이저 설정으로 못 고친다.** `hitT` 정의, 확률적 선택의 영(0) 처리, 반딧불, 확산·반사 분리가 맞아야 한다.
- **저해상도·저 spp.** 0.25 rpp 는 반해상도·사분해상도 디노이징과 짝이고, 회전 격자 샘플링은 엔트로피를 올려 디스오클루전이 늘어 권장하지 않는다(README).
- **지연 vs 안정.** 누적 프레임 수는 FPS 에 비례해 잡도록 권한다(`maxAccumulatedFrameNum = 누적 시간(초) × FPS`). 과도한 누적은 번짐·래그, 부족하면 노이즈다. 안티 래그 파라미터는 처음에 끄고 통합하라는 것이 README 의 조언이다.
- **내부 동작은 블랙박스.** 알고리즘 문서가 README 에 없으므로 이상 현상의 원인은 검증 출력(`OUT_VALIDATION`)과 단계별 켜기·끄기로 좁혀야 한다.
- **버전 의존.** 기본 설정은 알고리즘 변경에 맞춰 바뀌므로 `{}` 기본 생성 설정을 쓰라고 한다. 이 노트의 수치는 v4.18.0 README 기준이다.

## 비교

| 구분 | SVGF ([관련](/develop-wiki/knowledge/graphics-xr/svgf-ray-tracing-denoising/)) | ReBLUR | ReLAX |
| --- | --- | --- | --- |
| 공개 문서 | 논문 | README 수준 | README 수준 |
| 필터 구조 | 분산 유도 à-trous | 재귀 블러(README 표현) | à-trous(README 표현) |
| 2차 모멘트 추적 | 예(분산 추정) | 아니오(README) | 예(README) |
| 히트 거리 | 이 노트에서 확인 안 함 | 정규화해서 입력 | 프리패스·반사 추적에만 사용(README) |
