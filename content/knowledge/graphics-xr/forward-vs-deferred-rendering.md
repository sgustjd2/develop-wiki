---
title: 포워드 vs 디퍼드 렌더링과 드로 콜 최적화
aka: [Forward Rendering, Deferred Shading, G-buffer, Forward+, Draw Call, Batching, Instancing, Overdraw]
category: graphics-xr
group: rendering
level: intermediate
summary: 라이팅을 지오메트리 패스에서 하느냐(포워드) 별도 패스에서 하느냐(디퍼드)의 선택, 그리고 CPU 쪽 병목인 드로 콜을 줄이는 배칭·인스턴싱을 함께 정리한다.
tags: [rendering, deferred, forward, g-buffer, draw-call, instancing, performance]
related: [graphics-xr/rasterization-pipeline, graphics-xr/pbr-material-model, graphics-xr/foveated-stereo-rendering, performance/profiling]
sources:
  - https://learnopengl.com/Advanced-Lighting/Deferred-Shading
  - https://developers.meta.com/horizon/documentation/unity/unity-asw
  - https://www.w3.org/TR/webgpu/
updatedAt: 2026-11-19
---

## 문제

광원이 N 개, 물체가 M 개인 장면에서 모든 프래그먼트가 모든 광원을 계산하면 비용이 M×N 에 가깝게 커진다. 더구나 가려져서 결국 버려질 프래그먼트까지 라이팅한다(오버드로). 한편 물체마다 "상태 설정 + 드로 콜" 을 CPU 가 발행하므로, 물체가 수천 개면 GPU 가 아니라 CPU 가 먼저 막힌다.

## 해법 1: 라이팅 시점

| | 포워드 | 디퍼드 |
| --- | --- | --- |
| 흐름 | 물체를 그리며 바로 라이팅 | 1) 지오메트리 패스: 위치·법선·알베도 등을 **G-buffer** 에 저장 2) 라이팅 패스: 화면 픽셀당 1회 계산 |
| 라이팅 비용 | 프래그먼트 × 영향 광원 (오버드로 포함) | 화면 픽셀 × 영향 광원 (오버드로 영향 없음) |
| 많은 광원 | 불리(광원 수 제한·Forward+ 로 보완) | 유리 |
| 투명·블렌딩 | 자연스럽다 | **불가**(G-buffer 는 맨 앞 프래그먼트만 저장) → 투명은 포워드 패스로 따로 |
| MSAA | 가능 | 기본적으로 불가 |
| 메모리·대역폭 | 적다 | G-buffer 로 크다 |
| 재질별 라이팅 | 자유 | 대부분 같은 라이팅 식. 재질 ID 를 G-buffer 에 넣어 우회 |

LearnOpenGL 도 같은 단점(메모리, 블렌딩 불가, MSAA 불가)을 들고, 광원이 적은 작은 장면에서는 디퍼드가 오히려 느릴 수 있다고 말한다. 복잡한 장면에서만 이득이 커진다.

```ts
// 선택 휴리스틱 (의사 코드)
function pickRenderer(s: { dynamicLights: number; mobileOrVR: boolean; transparencyHeavy: boolean }) {
  if (s.mobileOrVR) return "forward";          // 대역폭·MSAA 가 중요
  if (s.dynamicLights > 50 && !s.transparencyHeavy) return "deferred";
  return "forward (+ light culling)";           // Forward+ / clustered
}
```

**Forward+ / clustered forward** 는 화면(또는 뷰 프러스텀)을 타일·클러스터로 나눠 타일별 광원 목록을 만들고 포워드로 그린다. MSAA·투명을 유지하면서 많은 광원을 감당하는 절충안이다. Meta 의 Quest 개발 문서에도 Forward+ 렌더링 가이드가 별도로 있다.

## 해법 2: 드로 콜 줄이기

드로 콜 자체보다 그 앞의 **상태 변경(셰이더·텍스처·버퍼 바인딩)** 이 CPU 비용이다.

| 기법 | 방법 | 한계 |
| --- | --- | --- |
| 인스턴싱 | 같은 메시를 변환 배열만 바꿔 한 번에 | 메시·재질이 같아야 함 |
| 배칭(정적) | 움직이지 않는 메시를 하나로 합침 | 메모리 증가, 컬링 단위가 커짐 |
| 텍스처 아틀라스 / 배열 | 재질 전환 제거 | 아틀라스 경계 번짐 |
| 정렬 | 상태별로 모아 그리기, 불투명은 앞→뒤(early-Z) | 투명은 뒤→앞 필요 |
| 컬링 | 프러스텀·오클루전 컬링 | 컬링 자체 비용 |
| Render bundle / 커맨드 버퍼 | 명령을 미리 기록해 재사용 (Vulkan·WebGPU) | 장면이 자주 바뀌면 이득 감소 |

```ts
// 인스턴싱 개념: 변환 행렬을 버퍼 하나에 모아 drawIndexed(count, instanceCount)
const instanceCount = 10_000;
const transforms = new Float32Array(instanceCount * 16); // 인스턴스당 mat4
// renderPass.drawIndexed(indexCount, instanceCount);   // WebGPU. 코드는 개념 예시이며 실행 검증 안 함
```

## 언제 쓰나

- 모바일·스탠드얼론 VR: 포워드(+ 광원 제한). 타일 기반 GPU 에서 대역폭이 곧 전력이다.
- 광원이 많은 데스크톱 씬: 디퍼드 또는 클러스터드.
- 드로 콜이 수천: CPU 프로파일러로 확인 후 인스턴싱부터. [프로파일링](performance/profiling) 원칙(측정 먼저)이 그대로 적용된다.

## 주의

- 디퍼드에서 G-buffer 의 월드 위치를 float 로 저장하면 정밀도 문제가 있어, 깊이로부터 위치를 복원하는 방식을 쓰는 구현이 많다.
- 앞선 최적화가 [VR 프레임 예산](graphics-xr/motion-to-photon-reprojection-frame-budget) 안에서 의미가 있다. 90Hz 에서 CPU·GPU 모두 약 11ms 안에 끝나야 한다.
- 배칭으로 메시를 합치면 컬링이 거칠어져 오히려 느려질 수 있다. 항상 전후 비교.

## 개발자에게 왜 중요한가

엔진(Unity URP/HDRP, Unreal, three.js)의 렌더 경로 옵션이 사실 이 선택이다. 설정 이름을 보고 "왜 투명이 이상하지, 왜 MSAA 가 안 되지" 를 바로 짚을 수 있다.
