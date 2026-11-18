---
title: 셰이더와 GPU 파이프라인 기초
aka: [Shader, GLSL, WGSL, Uniform, Varying, Vertex Shader, Fragment Shader, Compute Shader, SIMT, Warp Divergence]
category: graphics-xr
group: rendering
level: intermediate
summary: 셰이더는 GPU 의 수천 스레드가 정점·픽셀마다 똑같이 실행하는 작은 프로그램이다. 입력 종류(attribute·uniform·보간값), 분기 비용, WGSL/GLSL 문법 차이를 알면 셰이더 버그와 성능 문제를 줄인다.
tags: [shader, glsl, wgsl, webgpu, webgl, gpu, simt]
related: [graphics-xr/rasterization-pipeline, graphics-xr/pbr-material-model, graphics-xr/homogeneous-coordinates-mvp, cs-fundamentals/webassembly-execution-model]
sources:
  - https://www.w3.org/TR/WGSL/
  - https://www.w3.org/TR/webgpu/
  - https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.60.pdf
  - https://learnopengl.com/PBR/Theory
updatedAt: 2026-11-19
---

## 문제

CPU 코드는 "정점 100만 개를 for 문으로" 돌리면 느리다. GPU 는 같은 프로그램을 수천 개 데이터에 동시에 돌리는 데 특화돼 있어서, 그 프로그램(셰이더)을 따로 짜서 넘겨야 한다. 문제는 셰이더가 일반 코드와 다른 실행 모델을 갖는다는 점이다.

## 해법: 실행 모델

| 개념 | 의미 |
| --- | --- |
| 호출 단위 | 버텍스 셰이더는 정점마다, 프래그먼트 셰이더는 프래그먼트마다 1회. 서로 통신하지 않는다 |
| 입력 | 정점 속성(attribute), 드로 콜 전체 공통 상수(uniform / WebGPU 의 바인딩 리소스), 버텍스 → 프래그먼트 **보간값** |
| 출력 | 클립 좌표, 색 타깃, (compute 는) 저장 버퍼 |
| SIMT | GPU 는 스레드를 묶음(NVIDIA warp, 보통 32개)으로 같은 명령을 실행. 묶음 안에서 분기가 갈리면 두 경로를 모두 지나간다 (divergence) |
| 상태 없음 | 프레임 사이에 변수가 남지 않는다. 필요하면 텍스처·버퍼에 쓴다 |

### 같은 셰이더를 두 언어로

WGSL 은 W3C WebGPU 용 언어이고, 엔트리 포인트를 `@vertex`·`@fragment`·`@compute` 속성으로 표시한다(WGSL 스펙 예제에 나오는 형식). 아래는 직접 쓴 예이며 **실제 컴파일은 하지 않았다**(이 환경에 컴파일러 없음).

```wgsl
struct Uniforms { mvp : mat4x4f, tint : vec4f };
@group(0) @binding(0) var<uniform> u : Uniforms;

struct VSOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};

@vertex fn vs(@location(0) p : vec3f, @location(1) uv : vec2f) -> VSOut {
  var o : VSOut;
  o.pos = u.mvp * vec4f(p, 1.0);
  o.uv = uv;
  return o;
}

@fragment fn fs(in : VSOut) -> @location(0) vec4f {
  return vec4f(in.uv, 0.0, 1.0) * u.tint;
}
```

```glsl
// GLSL 300 es (WebGL2)
#version 300 es
uniform mat4 uMvp; uniform vec4 uTint;
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUv;
out vec2 vUv;
void main() { gl_Position = uMvp * vec4(aPos, 1.0); vUv = aUv; }
// --- 프래그먼트 ---
// precision mediump float; in vec2 vUv; out vec4 o; void main(){ o = vec4(vUv,0.,1.)*uTint; }
```

| 항목 | GLSL | WGSL |
| --- | --- | --- |
| 타입 | `vec3`, `mat4` | `vec3f`(= `vec3<f32>`), `mat4x4f` |
| 변수 | 타입 먼저, 암묵 변환 허용 | `let`/`var`, **암묵 형변환 없음** |
| 입출력 | `in`/`out`/`uniform` | `@location`, `@builtin`, `@group/@binding` |
| 대상 | OpenGL / WebGL | WebGPU |

### 보간과 좌표

버텍스 셰이더가 내보낸 값은 래스터화에서 삼각형 안쪽 픽셀로 **원근 보정** 보간되어 프래그먼트 셰이더로 온다. UV, 법선, 월드 위치가 이렇게 전달된다. 법선은 비균일 스케일이 있으면 모델 행렬이 아니라 그 역전치 행렬로 변환한다(LearnOpenGL 라이팅 장에서 다루는 주제).

## 언제 쓰나

- 화면 단위 병렬 연산(라이팅, 후처리, 블러) → 프래그먼트 셰이더.
- 렌더링과 무관한 대량 병렬 연산(파티클 갱신, 컬링) → compute 셰이더(WebGPU/Vulkan/Metal/GL 4.3+). WebGL2 에는 compute 가 없다.
- 웹: 신규 프로젝트는 WebGPU(WGSL) 를 고려하되 브라우저·기기 지원 범위를 확인한다. 기존 자산이 많으면 WebGL2(GLSL ES 3.00).

## 주의

- **분기 비용**: 같은 묶음 안에서 `if` 결과가 갈리면 느려진다. 상수·uniform 조건 분기는 대체로 싸다.
- **정밀도**: 모바일 GLSL ES 의 `mediump` 는 16비트일 수 있다. 월드 좌표·깊이 계산에 쓰면 깨진다. [부동소수점](cs-fundamentals/number-representation) 한계는 여기서도 그대로다.
- **텍스처 샘플링은 비싸다**(메모리 대역폭). 반복문 안 샘플링, 의존적 텍스처 읽기를 줄인다.
- uniform 버퍼 정렬 규칙(vec3 패딩 등)을 어기면 값이 조용히 밀린다. WGSL 은 구조체 정렬을 명세에 정의한다.
- 셰이더 컴파일은 첫 사용 시 끊김(hitch)을 만들 수 있다. 미리 워밍업한다.

## 개발자에게 왜 중요한가

셰이더 버그는 에러 대신 "검은 화면"으로 나타난다. 디버깅은 중간값을 색으로 출력하는 방식이 기본이다(법선 → RGB, UV → RG). 이 모델을 알아야 [PBR](graphics-xr/pbr-material-model) 같은 수식을 픽셀 단위 코드로 옮길 수 있다.
