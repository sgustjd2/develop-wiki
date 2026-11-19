---
title: HRTF 바이노럴 렌더링 — 측정 데이터에서 헤드폰 신호까지
aka: [HRTF, HRIR, Binaural Rendering, SOFA, AES69, ITD, ILD, Pinna Notch, CIPIC, 머리 전달 함수]
category: graphics-xr
group: xr
level: advanced
summary: HRTF 는 방향마다 한쪽 귀까지의 임펄스 응답(HRIR)을 측정한 데이터다. 소스 방향을 머리 기준으로 바꿔 가장 가까운 응답 쌍을 골라 합성곱하면 헤드폰에서 방향감이 생기지만, 남의 머리로 잰 응답은 앞뒤·고도 혼동을 낳는다.
tags: [xr, audio, hrtf, binaural, sofa, aes69, itd, head-tracking, convolution, spatial-audio]
related: [graphics-xr/spatial-audio, graphics-xr/ambisonics-sound-field, graphics-xr/quaternion-3d-rotation, graphics-xr/coordinate-systems-handedness, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/motion-to-photon-reprojection-frame-budget]
sources:
  - https://www.ece.ucdavis.edu/cipic/wp-content/uploads/sites/12/2015/04/cipic_WASSAP_2001_143.pdf
  - https://www.sofaconventions.org/mediawiki/index.php/SimpleFreeFieldHRIR
  - https://www.sofaconventions.org/mediawiki/index.php/SOFA_(Spatially_Oriented_Format_for_Acoustics)
updatedAt: 2026-11-19
---

> 출처 메모: CIPIC HRTF 데이터베이스 논문(Algazi 외, WASPAA 2001, PDF 본문)과 SOFA 사이트의 `SimpleFreeFieldHRIR` 규약·소개 페이지를 읽었다. PDF 텍스트 추출 중 수식·일부 통계 수치가 깨져 ITD·노치 주파수의 평균·표준편차 값은 인용하지 않았다. 구면 머리 ITD 근사(Woodworth 식)의 원전, Web Audio 사양의 HRTF 패너 절, 머리 추적 지연 허용치는 이 노트에서 읽지 않았다. 아래 ITD 수치는 가정한 머리 반지름으로 직접 계산한 것이다.

## 문제

헤드폰의 좌우 채널을 이득만으로 패닝하면 소리가 머리 안쪽 선 위에서 움직인다. 실제 귀는 머리와 귓바퀴가 소리를 방향별로 다르게 가리고 산란시켜 방향 단서를 만든다. 이 효과를 필터로 복제해야 소리가 바깥 공간에 놓인다. [공간 오디오](/develop-wiki/knowledge/graphics-xr/spatial-audio/)가 `PannerNode` 수준에서 다룬 HRTF 를, 여기서는 데이터와 렌더링 구조 쪽에서 본다.

## 해법

### 데이터: HRIR 집합

CIPIC 논문의 설명과 데이터 구성은 이렇다.

- 방향마다 한쪽 귀 앞(차단한 외이도의 입구)에서 잰 임펄스 응답이 HRIR 이고, 이를 주파수 영역으로 보면 HRTF 다. 논문은 HRTF 를 몸·머리·귓바퀴의 산란이 만드는 방향 단서를 담은 것으로 설명한다.
- 릴리스 1.0 은 45명(KEMAR 마네킹 2종 포함)을 25개 방위 × 50개 고도, 곧 약 5° 간격의 1250개 방향에서 측정했다. 반지름 1 m 후프에 스피커를 두고 골레이 코드 신호를 썼으며, 44.1 kHz 16비트로 녹음해 창을 씌워 방 반사를 제거하고 자유장 보정을 했다. **HRIR 길이는 200 샘플, 약 4.5 ms** 다.
- 좌표는 interaural-polar 방식이다. 방위가 −90°~90° 로 제한되고 뒤쪽은 고도로 표현한다. vertical-polar 에 익숙하면 변환이 필요하다.
- KEMAR 의 수평면 응답 이미지는 방위에 따라 도착 시간이 사인 곡선꼴로 변하고(양이 간 시간차), 반대쪽으로 갈수록 응답이 약해지는 머리 그림자를 보여 준다. 스펙트럼에서는 동측에서 약 5 kHz 부근의 강한 응답(깊이 공명)과 약 9 kHz 부근의 약한 응답(귓바퀴 노치)이 보인다고 한다.

저장 형식은 **SOFA**(AES69, 2015 제정, 2020·2022 재확인)다. `SimpleFreeFieldHRIR` 규약(v1.2)은 이렇게 생겼다.

| 요소 | 내용 |
| --- | --- |
| 차원 | M 측정 방향, R 수신기(귀), N 샘플 |
| `Data.IR` | M × R × N |
| `Data.SamplingRate` | 기본 48000 Hz |
| `SourcePosition` | 구면: 방위(°), 고도(°), 거리(m) |
| `Receivers` | 기본 2개, 머리 반지름 0.09 m |

### 렌더링 파이프라인

1. 월드의 소스 위치를 청취자 머리 좌표로 바꾼다. 머리 추적이 있으면 머리 회전의 역변환을 적용해 방위·고도를 얻는다([좌표계](/develop-wiki/knowledge/graphics-xr/coordinate-systems-handedness/), [쿼터니언](/develop-wiki/knowledge/graphics-xr/quaternion-3d-rotation/)).
2. 그 방향에 가장 가까운 측정 방향의 HRIR 쌍(좌·우)을 고른다. 5° 격자 사이는 인접 응답을 보간하거나, 아래처럼 두 쌍의 출력을 섞는다.
3. 모노 소스를 좌·우 HRIR 로 각각 합성곱한다.
4. 거리 감쇠는 따로 곱한다. HRIR 은 한 반지름에서 측정한 방향 필터다(CIPIC 는 1 m).

```ts
export function convolve(x: Float32Array, h: Float32Array): Float32Array {
  const y = new Float32Array(x.length + h.length - 1);
  for (let i = 0; i < x.length; i++) for (let k = 0; k < h.length; k++) y[i + k] += x[i] * h[k];
  return y;
}
export const binaural = (mono: Float32Array, hL: Float32Array, hR: Float32Array) =>
  [convolve(mono, hL), convolve(mono, hR)];
// 방향이 바뀔 때: 이전 HRIR 출력과 새 HRIR 출력을 한 블록에 걸쳐 크로스페이드
export const crossfade = (a: number[], b: number[]) =>
  a.map((v, i) => { const t = i / (a.length - 1); return (1 - t) * v + t * (b[i] ?? 0); });
```

비용을 계산하면 200탭 HRIR, 귀 2개, 48 kHz 에서 소스 하나당 직접 합성곱 400 MAC/샘플, 즉 초당 약 1920만 MAC 이다. 소스가 수십 개면 CPU 가 먼저 문제가 되어, 실제 구현은 FFT 기반 분할 합성곱을 쓰거나 가까운 소스만 HRTF 로 처리한다(이 마지막 처방은 자료에서 읽은 내용이 아니라 이 노트의 권고).

### ITD 감각 잡기

머리를 반지름 8.75 cm 구로 근사하고 음속 343 m/s 를 가정해 `ITD = (a/c)(θ + sin θ)` 를 계산하면(구면 머리의 고전적 근사식, 원전은 읽지 않았다) 방위 30°에서 0.261 ms(48 kHz 에서 12.5 샘플), 60°에서 0.488 ms(23.4 샘플), 90°에서 0.656 ms(31.5 샘플)다. 사람마다 머리 크기가 다르므로 최대 ITD 는 분포를 가진다. CIPIC 논문은 최대 ITD 가 대체로 정규분포이고 머리 너비가 가장 좋은 선형 예측 변수라고 보고한다(구체 수치는 추출이 깨져 인용하지 않는다).

## 언제 쓰나

- 헤드폰·HMD 에서 소스 방향·거리를 [공간 오디오](/develop-wiki/knowledge/graphics-xr/spatial-audio/)로 재현할 때 정위감의 핵심 필터.
- [앰비소닉스](/develop-wiki/knowledge/graphics-xr/ambisonics-sound-field/) 음장을 헤드폰으로 내릴 때 가상 스피커 HRTF 디코딩의 재료.
- 연구·제품에서 SOFA 데이터셋(CIPIC, ARI, LISTEN, KEMAR, HUTUBS 등 목록이 SOFA 사이트에 있다)을 교체해 비교할 때.

## 주의/비용

- **비개인화 HRTF 는 지각 왜곡을 만든다.** CIPIC 논문은 사람마다 HRTF 가 크게 다르고, 다른 사람의 응답으로 공간화하면 특히 앞뒤 혼동과 고도 오류가 생길 수 있다고 한다. 귓바퀴 치수에서 노치 주파수를 선형 회귀로 정확히 예측하기 어렵다는 결과도 있어 개인화가 쉽지 않다.
- **헤드폰 전용이다.** 스피커로 재생하면 좌우 신호가 섞여 효과가 깨진다. 헤드폰 보정(보상 필터)과 외이도 공명 복원은 별도 문제다(CIPIC 청취 실험은 Møller 방식을 썼다).
- **측정 조건의 흔적**이 데이터에 들어 있다. 창 처리로 방 반사를 제거했고 보정은 15 dB 로 제한했다. 다른 데이터셋을 섞으면 음색이 달라진다.
- 방향이 바뀔 때 HRIR 을 바로 교체하면 클릭이 난다. 크로스페이드나 보간이 필요하고 보간이 그림자·ITD 를 흐리게 할 수 있다.
- 머리 추적의 지연·지터는 정위 안정성에 직접 영향을 준다. 허용치는 이 노트에서 확인하지 않았다. 추적 계통은 [인사이드아웃 6DoF](/develop-wiki/knowledge/graphics-xr/six-dof-inside-out-tracking-slam/)와 [프레임 예산](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/)을 같이 본다.
- SOFA 규약 문서는 기본 머리 반지름 0.09 m 로 수신기 위치를 적는데, 규약 본문에서 청취자가 y축을 본다는 서술과 기본 `ListenerView` [1 0 0] 이 어긋나 보인다(문서에서 설명되지 않음). 좌표를 쓰기 전에 파일의 속성을 확인한다.
