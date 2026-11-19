---
title: 라디언스 캐시 — SHARC(공간 해시)와 NRC(신경망)로 경로를 일찍 끝내기
aka: [Radiance Cache, SHARC, SHaRC, Spatially Hashed Radiance Cache, NRC, Neural Radiance Cache, Neural Radiance Caching, RTXGI SDK]
category: graphics-xr
group: rendering
level: advanced
summary: 라디언스 캐시는 경로 추적에서 두 번째 이후 히트의 복사휘도를 월드 공간에 저장해 두고, 경로를 캐시에서 일찍 끝내 노이즈와 비용을 줄인다. SHARC 는 해시 격자에 값을 누적하고, NRC 는 작은 신경망을 렌더링 중에 계속 학습시킨다.
tags: [rendering, ray-tracing, path-tracing, global-illumination, radiance-cache, sharc, nrc, hash-grid, neural-network, rtxgi]
related: [graphics-xr/nrd-reblur-relax-denoiser-inputs, graphics-xr/restir-gi-pt-hit-distance-contract, graphics-xr/restir-reservoir-resampling, graphics-xr/image-based-lighting, graphics-xr/pbr-material-model, graphics-xr/svgf-ray-tracing-denoising]
sources:
  - https://github.com/NVIDIA-RTX/SHARC
  - https://github.com/NVIDIA-RTX/SHARC/blob/main/docs/Integration.md
  - https://github.com/NVIDIA-RTX/RTXGI
  - https://github.com/NVIDIA-RTX/RTXGI/blob/main/Docs/NrcGuide.md
  - https://research.nvidia.com/publication/2021-06_real-time-neural-radiance-caching-path-tracing
  - https://github.com/NVIDIA-RTX/NRD
updatedAt: 2026-11-19
---

> 출처 메모: SHARC 저장소의 README·`docs/Integration.md`, RTXGI SDK 저장소 README, NRC 가이드(`Docs/NrcGuide.md`), NRC 논문(Müller 외, ACM TOG 2021)의 **NVIDIA 출판 페이지 초록**, NRD README 의 캐시 권고 문장을 읽었다. 모두 웹 요약 도구를 거쳐 읽어서 원문 문장 대조는 하지 못했다. **NRC 논문 PDF 는 용량 제한으로 열리지 않아** 네트워크 구조, 입력 인코딩, 자기 학습의 식, 학습 경로 수는 읽지 않았고 쓰지 않는다. SHARC 는 해시 함수·격자 레벨 식 같은 알고리즘 세부가 읽은 문서에 없다. 아래 두 가지 산수 확인은 문서에 적힌 수치의 계산 일치만 본 것이다.

## 문제

경로 추적에서 간접광은 광선이 여러 번 튕겨야 의미 있는 값이 된다. 바운스를 늘리면 비용과 노이즈가 같이 늘고, 줄이면 어두워진다. 두 번째 히트 이후의 복사휘도는 이웃 픽셀·이전 프레임의 경로들이 이미 비슷한 값을 계산했을 가능성이 높다. 이것을 **월드 공간에 저장해 두고 경로를 거기서 끊으면** 된다는 발상이 라디언스 캐시다. RTXGI README 는 이를 기존 프로브 기반 조도 캐시를 월드 공간 라디언스 캐시로 대체하는 것으로 설명한다. 복사휘도(방향별 값)를 다루므로 광택 반사도 어느 정도 담을 수 있다는 점은 노트 작성자의 해석이다.

## 해법

### 공통 구조

1. 일부 경로로 캐시를 **갱신**한다(학습 데이터 생성).
2. 캐시를 **합친다**(시간 누적 또는 신경망 학습).
3. 본 렌더링 경로는 2차 이후 히트에서 캐시를 **조회**해 거기서 끝낸다.

경로를 언제 끊을지가 편향과 노이즈의 교환 지점이다. 캐시 해상도(복셀 크기, 경로 퍼짐)보다 거친 신호를 쓰게 되기 때문이다.

### SHARC: 공간 해시 격자 (README·Integration 가이드)

- 월드 공간 해시 격자. 복셀마다 복사휘도와 표본 수를 누적한다. 셰이더 소스만 배포된다(SHARC README). RTXGI README 는 SHARC 에 DXR 지원 GPU 면 되고 벤더별 요구가 없다고, NRC 는 Turing 이상 NVIDIA GPU 가 필요하다고 적는다.
- **Update**: 화면의 일부 픽셀만 경로를 쏜다. 예시는 5×5 블록당 한 픽셀(약 4 %). 매 프레임 선택 픽셀을 바꾼다. 히트마다 캐시에 기여를 기록하고 처리량을 이어 간다.
- **Resolve**: 모든 캐시 원소를 훑어 이번 프레임 누적을 이전 값과 시간적으로 합치고, 오래 안 쓴 항목을 내보낸다. 파라미터는 최대 누적 프레임 수(품질 대 반응성)와 `staleFrameNumMax`(수명, 점유율 조절).
- **Query**: 본 경로에서 대개 1차 히트를 빼고 `SharcGetCachedRadiance()` 로 조회해 성공하면 경로를 끝낸다. 경로 구간이 복셀보다 짧은 동안은 계속 추적해야 아티팩트가 안 난다. 광택 반사는 광선 원뿔 퍼짐이 복셀 해상도를 넘을 때만 캐시를 쓰라는 검사식이 있다.
- **메모리**: 용량은 2의 거듭제곱이며 기준 2^22 개. 복셀당 기본 40바이트(해시 8 + 누적 16 + 해소 16), SH 인코딩을 켜면 64바이트. 계산하면 2^22 × 40 B = 160 MiB, × 64 B = 256 MiB 로 문서의 수치와 일치한다.
- **점유율** 목표는 정지 카메라에서 약 10~20 %. 높으면 성능이 떨어지므로 용량을 늘리거나 stale 임계를 낮춘다.
- 선택 기능: 조명이 빨리 바뀔 때의 반응형 모드(누적을 지우지 않아 전체 초기화 필요, 오버헤드), 방향 정보를 저장하는 SH 인코딩(메모리·비용 증가).
- 요구: 네이티브 fp16(DXIL SM 6.2 이상), 컴파일 시 `-enable-16bit-types`.

### NRC: 렌더링 중에 학습하는 신경망 (NRC 가이드, 논문 초록)

- 논문 초록: 장면·조명·재질에 대한 가정 없이 완전 동적 장면의 경로 추적 GI 를 목표로 한다. **사전 학습 없이** 렌더링 중에 학습한다("적응을 통한 일반화"). 자기 학습(self-training)으로 저노이즈 목표를 만들고, 몇 바운스짜리 학습 갱신을 반복해 무한 바운스를 근사한다. 풀HD 에서 갱신·조회 오버헤드는 약 2.6 ms 라고 한다(논문 보고, 하드웨어 조건은 읽지 못했다).
- 가이드: 경로 퍼짐(ray cone) 휴리스틱과 사용자 임계값으로 경로를 캐시에서 끝낸다. 임계값이 편향과 노이즈를 맞바꾼다. 프레임 흐름은 `BeginFrame` → **Update 패스**(축소된 학습 해상도, 픽셀당 1 표본) → **Query 패스**(전체 해상도) → `QueryAndTrain` → `Resolve` → `EndFrame`.
- 예시 메모리: 1920×1080, 학습 해상도 274×154, 8 바운스, 1 spp 에서 약 191.8 MB. 학습 픽셀은 42,196 개로 화면 픽셀의 약 2.0 %(계산 확인, 약 49분의 1).
- 요구: D3D12 또는 Vulkan, 텐서 코어(NVIDIA Turing 이상이라고 RTXGI README 가 적음), 바이너리 배포(소스 없음). **실험적(experimental)** 라이브러리라고 문서가 밝힌다.
- 디버그: `DirectCacheView` 로 캐시만 보면 통합이 맞는지 확인되고, `selfTrainingAttenuation` 으로 자기 학습을 꺼 원인을 좁힌다.

### 디노이저와의 관계

NRD README 는 라디언스 캐시(SHARC 또는 NRC)를 쓰면 신호 품질과 디스오클루전 거동이 좋아진다고 강하게 권한다. 히스토리 신뢰도의 그래디언트 계산에 SHARC 갱신 패스를 합칠 수 있다고도 적는다([NRD 입력 계약](/develop-wiki/knowledge/graphics-xr/nrd-reblur-relax-denoiser-inputs/)). 캐시로 끊긴 경로의 hitT 정의는 별개 문제이므로 [hitT 계약](/develop-wiki/knowledge/graphics-xr/restir-gi-pt-hit-distance-contract/)을 따로 확인한다.

## 언제 쓰나

- 바운스 수를 늘리면 비용이 폭증하는 실시간 경로 추적, 특히 장면이 동적이라 베이크가 안 맞을 때.
- 디노이저 입력의 노이즈·디스오클루전 문제를 입력 쪽에서 줄이고 싶을 때.
- 하드웨어 폭이 중요하면 SHARC(DXR 전반), 텐서 코어가 있는 NVIDIA 한정이면 NRC 도 후보.

## 주의/비용

- **편향.** 경로를 캐시에서 끊으면 복셀·퍼짐 해상도 이하의 간접광 디테일이 사라진다. SHARC 는 짧은 구간에서 계속 추적해야 하고, 광택면은 별도 검사가 필요하다.
- **조명 지연.** 시간 누적 캐시는 빠른 조명 변화에 늦게 반응한다(SHARC 반응형 모드는 그 비용을 지불).
- **해시 충돌·점유율.** SHARC 용량이 작으면 충돌, 크면 메모리. 점유율 모니터링이 필요하다.
- **NRC 의 제약.** 바이너리 전용, 실험적, 신경망 호출이 Nsight Graphics 프레임 디버깅에 안 보이고, `Configure` 가 할당을 하므로 렌더 중 호출하면 끊김이 난다. 기본 Resolve 는 합쳐진 신호를 가정해 확산·반사 분리 신호는 자체 Resolve 가 필요하다.
- **품질 수치는 읽지 못함.** 두 방식의 품질·시간 비교는 이 노트에 없다. 자기 장면에서 측정할 것.

## 비교

| 구분 | SHARC | NRC |
| --- | --- | --- |
| 저장 | 월드 공간 해시 격자(복셀 누적) | 신경망 가중치(렌더링 중 학습) |
| 갱신 | 일부 픽셀 경로 + 시간 누적 | 학습 경로 + 자기 학습(텐서 코어) |
| 하드웨어 | DXR 지원 GPU(README) | 텐서 코어, NVIDIA(README) |
| 배포 | 셰이더 소스 | 바이너리, 실험적 |
| 메모리 | 용량×40~64 B(예 160~256 MiB) | 예시 약 192 MB(해상도 의존) |
| 약점 | 해상도 이하 디테일, 충돌 | 블랙박스, 디버깅·통합 난도 |
