---
title: 공간 오디오 (HRTF·거리 감쇠·리스너 추적)
aka: [Spatial Audio, 3D Audio, Binaural Audio, HRTF, PannerNode, Distance Attenuation, Web Audio]
category: graphics-xr
group: xr
level: intermediate
summary: 소리의 방향·거리를 헤드폰에서 재현하는 기법. 소스·청취자 위치로 패닝과 거리 감쇠를 계산하고, 머리 전달 함수(HRTF) 필터로 입체감을 더한다. 청취자를 머리 자세에 매 프레임 맞춰야 한다.
tags: [xr, audio, spatial-audio, hrtf, web-audio, panner, binaural]
related: [graphics-xr/openxr-webxr-architecture, graphics-xr/motion-to-photon-reprojection-frame-budget, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/coordinate-systems-handedness, graphics-xr/vr-motion-sickness-ux, graphics-xr/quaternion-3d-rotation]
sources:
  - https://webaudio.github.io/web-audio-api/
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
updatedAt: 2026-11-19
---

## 문제

VR/AR 에서 시각만 입체이고 소리가 머리 안에서 울리면 몰입이 깨진다. 소리는 시야 밖의 사건을 알리는 주된 수단이기도 하다. 소스가 오른쪽 뒤에서 가까워진다는 정보를 **두 개의 이어폰 신호**만으로 만들어야 한다.

## 해법

소스와 청취자(머리)의 3D 위치·방향에서 다음을 계산해 출력에 반영한다. Web Audio API 사양의 `PannerNode` 가 이 모델의 대표적 표준 구현이다.

| 요소 | 하는 일 | Web Audio 의 표현 |
| --- | --- | --- |
| 방향 패닝 | 소스의 방위·고도에 따라 좌우 신호를 조절 | `panningModel`: `equalpower`(좌우 이득), `HRTF` |
| 거리 감쇠 | 멀수록 작게 | `distanceModel`: `linear`, `inverse`(기본), `exponential`, 그리고 `refDistance`, `rolloffFactor`, `maxDistance` |
| 소리 원뿔 | 방향성 있는 소스(앞쪽이 크고 뒤쪽이 작음) | `coneInnerAngle`, `coneOuterAngle`, `coneOuterGain` |
| 청취자 | 머리 위치·방향 | `AudioListener` (위치·전방·상향 벡터) |

- **equalpower**: 방위만으로 좌우 이득을 정한다. 이득이 코사인/사인이라 전력 합이 일정하다(모노 입력 pan=0 에서 양쪽 0.707). 단순하고 싸지만 앞뒤·상하 구분은 안 된다.
- **HRTF**(머리 전달 함수): 방위·고도별로 측정된 임펄스 응답으로 소스를 합성곱해 귀마다 다른 필터를 건다. 사양은 이를 `equalpower` 보다 비싸지만 지각적으로 더 입체적이라고 설명하고, 스테레오 출력 전용이라고 밝힌다.
- **inverse 거리 모델**: `gain = ref / (ref + rolloff · (max(d, ref) − ref))`. `ref=1, rolloff=1` 이면 거리 2에서 0.5, 4에서 0.25, 8에서 0.125 로 **거리가 두 배일 때 약 −6 dB** 다(실행해 확인). `linear` 모델은 `maxDistance` 에서 0 에 닿는다(예: ref 1, max 10 에서 d=16 이면 0).

```ts
// Web Audio 사양식 그대로 구현해 값 확인
export const inverseGain = (d: number, ref = 1, rolloff = 1) =>
  ref === 0 ? 0 : ref / (ref + rolloff * (Math.max(d, ref) - ref));
export const stereoPan = (pan: number): [number, number] => {      // 모노 입력
  const x = (Math.max(-1, Math.min(1, pan)) + 1) / 2;
  return [Math.cos(x * Math.PI / 2), Math.sin(x * Math.PI / 2)];
};
// stereoPan(0) = [0.707, 0.707], 두 이득 제곱합 = 1
```

실제 설정은 브라우저에서 다음 식으로 한다(이 코드는 브라우저 API 라 여기서 실행하지 않았다).

```ts
const panner = new PannerNode(ctx, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1, rolloffFactor: 1 });
panner.positionX.value = x; panner.positionY.value = y; panner.positionZ.value = z;   // 소스 위치(미터)
// 매 프레임: 헤드셋 자세로 청취자 갱신
ctx.listener.positionX.value = head.x; /* ... */ ctx.listener.forwardX.value = fwd.x; /* up 벡터도 */
```

### XR 에서의 핵심: 청취자를 머리에 묶기

공간 오디오가 틀어지는 가장 흔한 이유는 **청취자 자세가 월드 좌표의 헤드 포즈와 어긋나는 것**이다. 시각 렌더링에 쓰는 같은 헤드 포즈(예측 시각 포함)를 청취자에 매 프레임 넣고, 소스 위치도 같은 좌표계(단위 미터, 축 방향 규약)로 맞춘다([좌표계](/develop-wiki/knowledge/graphics-xr/coordinate-systems-handedness/), [OpenXR/WebXR](/develop-wiki/knowledge/graphics-xr/openxr-webxr-architecture/)). 머리를 돌릴 때 소리가 월드에 고정되어 있어야 한다. 헤드 회전은 [쿼터니언](/develop-wiki/knowledge/graphics-xr/quaternion-3d-rotation/)에서 전방·상향 벡터로 변환한다.

## 언제 쓰나

- VR/AR 게임·체험에서 방향성 있는 효과음, 음성, 환경음.
- 접근성: 화면 밖 이벤트 알림을 소리 방향으로 전달할 때(헤드폰 사용 가정).
- 멀티 사용자 가상 공간의 음성 위치화.

## 주의/비용

- **헤드폰 가정**이다. 스피커에서는 HRTF 효과가 깨진다(좌우 신호가 서로 섞이므로).
- HRTF 는 일반 평균 머리 모델이라 사람마다 정위 정확도가 다를 수 있다. 앞뒤 혼동이 생기기도 한다(일반적으로 알려진 현상이며 이 노트에서 수치로 검증하지 않았다).
- HRTF 합성곱은 소스 수에 비례해 CPU 가 든다. 사양도 "더 비싸다" 고 명시한다. 소스가 많으면 가까운 몇 개만 HRTF, 나머지는 `equalpower` 로 낮춘다.
- Web Audio 의 `PannerNode` 는 패닝·거리·원뿔만 정의하고 벽 차단이나 실내 반사(잔향)는 포함하지 않는다. 잔향은 별도 노드(예: 합성곱 리버브)나 엔진 기능으로 더한다.
- 오디오 지연(출력 버퍼)이 크면 시각과 소리가 어긋난다. 시각의 [지연·프레임 예산](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/)과 별개로 오디오 버퍼 크기를 점검한다.
- 소리 크기 한계: 과도한 거리 이득, 소음 노출(청각 안전)을 고려해 최대 볼륨을 제한한다([멀미·편안함](/develop-wiki/knowledge/graphics-xr/vr-motion-sickness-ux/) 노트의 사용성 관점과 같다).
