---
title: 래스터라이제이션 파이프라인
aka: [Rasterization Pipeline, Graphics Pipeline, Vertex Shader, Fragment Shader, Depth Buffer, Z-buffer, Z-fighting]
category: graphics-xr
group: rendering
level: beginner
summary: GPU 가 삼각형 목록을 화면 픽셀로 바꾸는 고정된 단계(버텍스 처리 → 조립 → 래스터화 → 프래그먼트 처리 → 깊이·블렌딩). 어디가 프로그래밍 가능하고 어디가 병목인지 알아야 렌더링 최적화가 보인다.
tags: [rendering, gpu, rasterization, depth-buffer, opengl, webgl]
related: [graphics-xr/shaders-gpu-pipeline, graphics-xr/homogeneous-coordinates-mvp, cs-fundamentals/browser-rendering-pipeline, graphics-xr/forward-vs-deferred-rendering]
sources:
  - https://learnopengl.com/Getting-started/Coordinate-Systems
  - https://learnopengl.com/Advanced-Lighting/Deferred-Shading
  - https://www.w3.org/TR/WGSL/
  - https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.60.pdf
updatedAt: 2026-11-19
---

## 문제

화면은 2D 픽셀 격자인데 장면은 3D 삼각형 수백만 개다. "어느 삼각형이 어느 픽셀을 덮고, 그 픽셀은 무슨 색이며, 앞뒤는 누가 이기는가"를 매 프레임(60~120회/초) 풀어야 한다. 이 일을 GPU 가 병렬로 처리하도록 정해 둔 흐름이 래스터라이제이션 파이프라인이다.

## 해법: 단계

```
정점 데이터(VBO/IBO)
  └▶ 버텍스 셰이더      정점 하나씩: 모델 공간 → 클립 공간 변환      [프로그래밍 가능]
     └▶ 프리미티브 조립   정점 3개를 삼각형으로 묶기, 클리핑, 원근 나눗셈, 뷰포트 변환
        └▶ 래스터화      삼각형이 덮는 픽셀(프래그먼트) 찾기, 정점 속성 보간      [고정 기능]
           └▶ 프래그먼트 셰이더  프래그먼트 하나씩: 색 계산, 텍스처 샘플링       [프로그래밍 가능]
              └▶ 출력 병합   깊이·스텐실 테스트, 블렌딩 → 프레임버퍼              [설정만 가능]
```

| 단계 | 입력 → 출력 | 개발자가 하는 일 |
| --- | --- | --- |
| 버텍스 셰이더 | 정점 속성 → 클립 공간 좌표(`gl_Position`) + 보간할 값 | MVP 행렬 곱, 스키닝, 법선 변환 |
| 프리미티브 조립·클리핑 | 정점 → 삼각형 | 컬링 모드(뒷면 제거) 설정 |
| 래스터화 | 삼각형 → 프래그먼트 + 보간된 값 | 직접 코드 없음. MSAA 설정 |
| 프래그먼트 셰이더 | 보간 값·텍스처 → 색 | 라이팅, 알파 컷아웃, PBR |
| 출력 병합 | 색·깊이 → 프레임버퍼 | 깊이 함수, 블렌드 식, 쓰기 마스크 |

LearnOpenGL 은 좌표가 로컬 → 월드 → 뷰 → 클립 → 화면 순으로 변환되고, 클립 공간 값을 `w` 로 나누는 원근 나눗셈 뒤 뷰포트 변환이 일어난다고 설명한다. 이 변환 자체는 [동차 좌표·MVP](graphics-xr/homogeneous-coordinates-mvp) 노트에서 다룬다.

### 깊이 버퍼

각 픽셀에 "지금까지 그려진 것 중 가장 가까운 깊이"를 저장해 두고, 새 프래그먼트가 더 멀면 버린다. 그리는 순서와 상관없이 가림이 맞게 되는 것이 장점이다.

문제는 원근 투영 뒤의 깊이가 **비선형**이라는 점이다. 직접 계산해 본 값(near=0.1, far=100, 카메라가 -Z 를 봄):

| 뷰 공간 z | NDC 깊이 |
| --- | --- |
| -0.1 | -1.00000 |
| -1 | 0.80180 |
| -10 | 0.98198 |
| -100 | 1.00000 |

near=0.1, far=1000, 24비트 고정소수 깊이로 계산하면 거리 1m 에서 해상도가 사실상 0(1e-6 미만), 100m 에서 약 6mm, 500m 에서 약 15cm 로 거칠어진다. 먼 곳의 서로 가까운 면이 같은 깊이 값으로 뭉치면 **Z-fighting**(깜빡이는 줄무늬)이 생긴다.

```ts
// 깊이 해상도 감 잡기: NDC 깊이 d(z) 를 24비트로 양자화했을 때 1 단계가 가리키는 거리
const n = 0.1, f = 1000;
const ndc = (z: number) => (f + n) / (f - n) - (2 * f * n) / ((f - n) * z); // z>0 거리
const step = 2 / (2 ** 24 - 1);
const res = (z: number) => step / ((ndc(z + 0.001) - ndc(z)) / 0.001);
```

완화책: near 를 최대한 키운다, far 를 줄인다, **reverse-Z**(깊이 1→0 으로 뒤집고 float32 깊이 버퍼 사용)로 부동소수점의 정밀도 분포를 상쇄한다.

## 언제 쓰나 / 병목 읽는 법

- 정점이 많고 화면이 작다 → 버텍스 단계(지오메트리) 병목. LOD, 인스턴싱.
- 화면이 크고 셰이더가 무겁다 → 프래그먼트 단계(필 레이트) 병목. 해상도 낮추기, 셰이더 단순화, [포비티드 렌더링](graphics-xr/foveated-stereo-rendering).
- 투명 물체가 많다 → **오버드로**. 같은 픽셀을 여러 번 칠한다.
- 래스터화 방식은 "삼각형 → 픽셀" 이라 그림자·반사·간접광 같은 전역 효과는 근사(그림자 맵, 프로브)로 만든다. 광선 추적은 반대 방향("픽셀 → 장면")이다.

## 주의

- 깊이 테스트는 **불투명** 물체에 맞는 설계다. 반투명은 뒤에서 앞으로 정렬해 블렌딩해야 하고, 순서가 틀리면 결과가 틀린다.
- 프래그먼트 셰이더에서 `discard`/깊이 쓰기를 하면 GPU 가 셰이더 실행 전에 깊이 테스트를 하는 early-Z 최적화를 못 쓰는 경우가 있다(드라이버·하드웨어 의존).
- 파이프라인 구조는 OpenGL·Vulkan·Metal·WebGPU 가 공통이지만, 어느 단계를 API 가 명시적으로 노출하는지는 다르다(WebGPU 의 `GPURenderPipeline` 은 상태를 한 객체로 고정).

## 개발자에게 왜 중요한가

"느리다" 를 들으면 먼저 어느 단계가 병목인지 가른다. 해상도를 반으로 줄였는데 빨라지면 프래그먼트, 안 빨라지면 정점·CPU 쪽이다. 브라우저의 [렌더링 파이프라인](cs-fundamentals/browser-rendering-pipeline) 합성 단계도 결국 이 파이프라인 위에서 돈다.
