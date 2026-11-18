---
title: 모션 투 포톤 지연·재투영(ATW/ASW)·프레임 예산
aka: [Motion-to-Photon Latency, Reprojection, Asynchronous Timewarp, ATW, ASW, Application SpaceWarp, Frame Budget, Judder, Late Latching, Pose Prediction]
category: graphics-xr
group: xr
level: advanced
summary: 머리를 움직인 시점부터 그에 맞는 이미지가 눈에 도달하기까지의 지연이 XR 의 핵심 품질 지표다. 예측·최신 포즈로의 재투영(타임워프)·프레임 합성(스페이스워프)과 주사율별 프레임 예산이 이를 지킨다.
tags: [xr, vr, latency, timewarp, spacewarp, frame-budget, prediction, judder]
related: [graphics-xr/vr-motion-sickness-ux, graphics-xr/foveated-stereo-rendering, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/openxr-webxr-architecture, performance/profiling]
sources:
  - https://developer.oculus.com/blog/the-latent-power-of-prediction/
  - https://developers.meta.com/horizon/documentation/native/android/mobile-timewarp-overview
  - https://developers.meta.com/horizon/documentation/unity/unity-asw
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
updatedAt: 2026-11-19
---

## 문제

일반 앱에서 입력 지연 50ms 는 느끼기 어렵다. 헤드 마운트 디스플레이에서는 머리를 돌려도 세계가 따라오지 못하고 늦게 움직이는 것으로 느껴져 **멀미**와 비현실감을 만든다. 파이프라인은 길다: 센서 → 추적 → 앱 시뮬레이션 → CPU 렌더 명령 → GPU 렌더 → 컴포지터 왜곡 → 디스플레이 스캔아웃. 각 단계가 지연을 더한다.

Oculus 개발자 블로그(LaValle 글)는 이를 "움직이는 표적에 총을 쏘는 것" 에 비유하고, 90년대 연구에서 60ms 를 상한으로 많이 인용했으며, 글쓴이 체감으로는 40ms 이상이면 지연이 거슬리고 20ms 이하는 지각하기 어렵다고 쓴다. 이 숫자는 역사적 경험칙이며 현재 기기 사양은 아니다.

## 해법

### 1. 프레임 예산

주사율이 정하는 한 프레임의 시간. 직접 계산한 값:

| 주사율 | 프레임 예산 |
| --- | --- |
| 60 Hz | 16.67 ms |
| 72 Hz | 13.89 ms |
| 90 Hz | 11.11 ms |
| 120 Hz | 8.33 ms |

이 안에 CPU·GPU 작업과 컴포지터 여유가 모두 들어가야 한다. 목표 시간을 넘긴 프레임은 이전 프레임이 반복되어 **저더(judder)** 가 된다(Meta 문서: 제시간에 못 오면 이전 프레임이 표시되어 방향 감각을 해친다). 평균이 아니라 **최악 프레임**(p99)이 기준이다.

### 2. 포즈 예측

표시 시각의 머리 자세를 **미리 예측**해서 그 포즈로 그린다. OpenXR 는 `xrWaitFrame` 이 돌려주는 `predictedDisplayTime`(다음 프레임이 표시될 것으로 예상되는 시각)에 맞춰 `xrLocateViews`/`xrLocateSpace` 를 호출하도록 설계돼 있다. LaValle 글의 주장도 "머리가 있었던 곳이 아니라 갈 곳의 이미지를 보여주라" 이다.

단순 계산: 각속도 200°/s 로 돌릴 때 지연 40ms 를 보정하지 않으면 8° 어긋난다(200 × 0.04). 예측은 급가속·방향 반전에서 틀린다는 한계가 있다.

### 3. 재투영: ATW

렌더 완료 직전에 **최신 헤드 포즈를 다시 읽어** 이미 그린 이미지를 회전 보정해 표시한다(Meta 의 타임워프 문서: 최신 헤드 추적 정보로 모션-투-포톤 지연과 저더를 줄임). 회전은 이미지 변환으로 비교적 싸게 근사 가능하다.

- 비동기(Asynchronous): 앱 렌더와 별도 컴포지터 스레드/우선순위에서 돈다. 앱이 한 프레임 늦어도 마지막 이미지를 재투영해 **머리 회전 반응**은 유지한다.
- 한계: **위치 이동**(시차)과 **움직이는 물체**는 못 맞춘다. 회전만 보정.

### 4. 프레임 합성: ASW / Application SpaceWarp

앱이 절반 주사율로 렌더(예: 90Hz 기기에서 45fps)하고 시스템이 사이 프레임을 합성한다. Meta 의 AppSW 는 앱이 모션 벡터와 깊이를 제공해(그래서 머티리얼·렌더 패스 수정이 필요) 위치 변화·물체 움직임까지 보정하며, 문서는 "최대 70% 의 추가 연산 여유" 를 얻을 수 있으나 "상당한 기술적 약속" 이라고 말한다. 반투명·파티클·빠른 UI 에서 잔상 아티팩트가 생길 수 있다.

| 기법 | 보정 대상 | 앱이 할 일 | 주된 이득 |
| --- | --- | --- | --- |
| 포즈 예측 | 표시 시각의 자세 | 올바른 시각으로 쿼리 | 평균 지연 감소 |
| ATW(회전 재투영) | 머리 회전 | 깊이 레이어 제출 등 설정 | 저더·회전 지연 |
| 위치 재투영 | 머리 이동 | 깊이 정보 제공 | 이동 시차 |
| ASW/AppSW | 프레임 생성 | 모션 벡터·깊이 | CPU·GPU 예산 확대 |

### 5. 앱이 직접 줄일 수 있는 지연

- 입력은 가능한 **늦게** 샘플링(late latching), 포즈는 `predictedDisplayTime` 기준.
- GPU 큐에 프레임을 여러 개 쌓지 않는다(파이프라인 깊이 줄이기).
- 주사율에 맞춰 일정한 프레임 타임: GC·셰이더 컴파일·로딩 hitch 제거.

```ts
// 프레임 타임 예산 감시 (WebXR 예시)
const budgetMs = 1000 / 90;
let last = performance.now();
session.requestAnimationFrame(function loop(t, frame) {
  const dt = t - last; last = t;
  if (dt > budgetMs * 1.5) console.warn(`frame spike ${dt.toFixed(1)}ms`);
  session.requestAnimationFrame(loop);
});
```

## 언제 쓰나

- ATW 는 대부분 플랫폼 컴포지터가 기본 제공. 앱은 올바른 포즈 시각과 깊이/레이어 정보만 맞춘다.
- ASW/AppSW 는 고품질을 절반 프레임율로 돌려야 할 때, 구현 복잡도를 감수할 만한 프로젝트에서.

## 주의 / 비용

- 재투영은 **지연을 숨길 뿐 렌더 낭비를 없애지 않는다**. 앱이 계속 늦으면 아티팩트가 누적된다.
- 합성 프레임 아티팩트는 텍스트·UI 가장자리에서 눈에 띈다. UI 는 별도 컴포지션 레이어로 제출해 재투영 대상에서 분리하는 방법이 일반적이다.
- 예측 시각을 잘못 쓰면(`now` 로 쿼리) 매 프레임 한 단계 늦은 포즈가 된다.
- 지연 측정은 프레임 타임 로그만으로 안 된다. 센서→광자 전체는 외부 카메라·전용 장비로 측정한다. 이 노트의 수치는 공개 글·문서의 경험칙이다.

## 개발자에게 왜 중요한가

XR 은 "FPS 평균" 이 아니라 "마감 시각 준수" 문제다. [프로파일링](performance/profiling) 을 프레임 타임 분포로 하고, [포비티드 렌더링](graphics-xr/foveated-stereo-rendering) 같은 최적화로 GPU 시간을 확보한다. 지연이 멀미로 이어지는 경로는 [멀미 노트](graphics-xr/vr-motion-sickness-ux).
