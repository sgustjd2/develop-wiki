---
title: 반사 프로브와 SSR — 실시간 반사의 계층 구성
aka: [Reflection Probes, Local Light Probes, Parallax-Corrected Cubemap, SSR, Screen-Space Reflections, Planar Reflections]
category: graphics-xr
group: rendering
level: advanced
summary: 실시간 반사는 한 방식으로 안 되어, 화면 공간 반사(SSR)로 가까운 반사를 잡고 실패하면 시차 보정한 로컬 프로브, 마지막으로 원거리 프로브로 채우는 계층 구성을 쓴다.
tags: [rendering, reflections, ssr, reflection-probe, ibl, parallax-correction, ray-marching, pbr]
related: [graphics-xr/image-based-lighting, graphics-xr/pbr-material-model, graphics-xr/gtao-hbao-horizon-ambient-occlusion, graphics-xr/forward-vs-deferred-rendering, graphics-xr/xr-compositor-layers, graphics-xr/rasterization-pipeline]
sources:
  - https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
  - https://jcgt.org/published/0003/04/04/paper.pdf
updatedAt: 2026-11-19
---

> 출처 메모: Frostbite 의 "Moving Frostbite to PBR" 강의 노트(Lagarde & de Rousiers, 2014)의 4.9절(IBL 종류, 로컬 프로브, SSR, 합성)과 McGuire & Mara 의 JCGT 논문 본문을 직접 읽었다. 로컬 프로브의 시차 보정 원 논문(Lagarde & Zanuttini 2012)과 SSR 의 Hi-Z 원 자료(Uludag 2014)는 읽지 못했고 Frostbite 노트가 인용한 내용만 사용했다.

## 문제

[IBL](/develop-wiki/knowledge/graphics-xr/image-based-lighting/)의 환경 큐브맵은 "무한히 먼 환경" 가정이다. 실내 바닥에서 벽의 반사를 이 큐브맵으로 읽으면 반사가 물체와 함께 움직이지 않는 가짜처럼 보인다. 반대로 정확한 반사는 레이 트레이싱이 필요해 비싸다. 정확도·비용·동적 대응이 다른 여러 근사를 함께 써야 한다.

## 해법: 네 종류의 반사원

Frostbite 노트는 반사 정보를 네 종류로 나눠 쓴다.

| 종류 | 담는 것 | 강점 | 약점 |
| --- | --- | --- | --- |
| 원거리 프로브 | 하늘·먼 배경 | 언제든 사용 가능 | 시차 없음, 가장 부정확 |
| 로컬 프로브 | 한 점에서 찍은 주변 큐브맵 + 프록시 형상 | 중거리 반사, 정적 장면에 저렴 | 시차 근사, 한 시점의 정보 |
| SSR | 현재 프레임의 조명 버퍼를 깊이 버퍼에 레이마칭 | 가까운~중거리의 정확한 반사, 접촉 경화 | 화면 안 정보만, 한 장의 깊이 |
| 평면 반사 | 반사 평면 기준으로 장면을 거울 렌더 | 평평한 물·바닥에 정확 | 평면 가정 |

### 로컬 프로브와 시차 보정

프로브는 한 점(큐브맵 중심)에서 찍은 것이라 그대로 읽으면 시차가 없다. 해법은 **프록시 형상**(구 또는 방향 있는 박스)에 투영하는 것이다. 반사 방향 광선이 프록시 벽과 만나는 점을 구하고, 그 점을 프로브 중심 기준 방향으로 바꿔 큐브맵을 읽는다. Frostbite 는 구·박스 프록시를 아티스트가 수동으로 맞추고, 거칠기가 클수록 보정된 방향을 원래 방향으로 보간해 불연속을 줄인다. 프로브는 사전 컨볼루션이 중심 기준이라 거친 표면에서 보정이 아티팩트를 만들기 때문이다.

```ts
// 박스 프록시: p 에서 반사 방향 r 로 쏜 광선이 박스 벽과 만나는 점 -> 프로브 중심 기준 방향
export function boxProjectedDir(p: V3, r: V3, boxMin: V3, boxMax: V3, probe: V3): V3 {
  let t = Infinity;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(r[i]) < 1e-9) continue;
    t = Math.min(t, ((r[i] > 0 ? boxMax[i] : boxMin[i]) - p[i]) / r[i]);
  }
  return norm(sub(add(p, mul(r, t)), probe));
}
```

(실행 확인: 박스 [−4,0,−3]~[4,3,3], 프로브 (0,1.5,0), 반사 방향 +x. p.z 가 −2, 0, 2 인 세 점에서 보정 방향은 (0.873, −0.218, −0.436), (0.970, −0.243, 0), (0.873, −0.218, 0.436) 으로 서로 달라졌다. 보정 전에는 세 점 모두 (1,0,0) 이다.)

로컬 프로브 캡처에도 문제가 있다. 프로브를 서로 비춰야 하는 순서 의존성, 금속 표면이 캡처 때 검게 나오는 문제(Frostbite 는 캡처 시 스페큘러를 끄고 금속은 F0 를 확산 알베도로 근사), 한 시점에서만 맞는 시점 의존 효과가 있다. 캡처 시 주변 가시성을 알파 채널에 저장해 합성에서 쓴다.

### SSR

깊이 버퍼를 따라 광선을 움직여 교차를 찾는다.

- **선형 3D 마칭**(Crytek 방식 등)은 3D 점을 화면으로 투영해 깊이 버퍼 뒤에 있으면 맞은 것으로 본다. 화면 픽셀을 건너뛰거나 같은 픽셀을 여러 번 보는 비효율이 있다.
- McGuire & Mara 는 **화면 공간에서 DDA 로 광선을 래스터화**한다. 샘플이 인접 픽셀에 놓이고 각 픽셀을 최대 한 번 보며 뷰 절두체로 클립한다. 원근 보정 보간을 쓴다.
- 파라미터: `zThickness`(깊이 버퍼 한 점에 부여하는 두께, 광선이 물체 뒤를 지나게 함), `maxDistance`, `maxSteps`, `stride`(샘플 간격), `jitter`(간격이 만드는 줄무늬 보정). 저자는 stride>1 은 거친 표면에서만 권한다.
- Frostbite 는 깊이 버퍼 위에 계층 Z 구조(Hi-Z)를 만들어 긴 광선을 빠르게 추적하고 조명을 BRDF 에 맞게 적분한다.
- 실패 경우: 광선이 maxDistance 를 넘거나 카메라 쪽으로 가거나, 화면 밖으로 나가거나 한 겹 깊이로 가려진 부분. 논문은 이때 복셀 같은 다른 구조 또는 방향으로 읽는 환경 큐브맵으로 대체하라고 한다.

### 합성

Frostbite 는 반사원을 계층으로 합성한다. SSR 이 실패한 곳은 로컬 프로브가, 그래도 모자라면 원거리 프로브가 메운다. 로컬 프로브는 작은 볼륨부터 평가해 중첩하며 알파가 1 이 되면 멈춘다.

```ts
export function compose(ssr: RGBA, locals: RGBA[], distant: number): number {
  let c = ssr.c * ssr.a, alpha = ssr.a;
  for (const p of locals) {
    if (alpha >= 1) break;
    const w = Math.min(1, Math.max(0, p.a - alpha));   // 아직 못 채운 부분만
    c += p.c * w; alpha = Math.min(1, alpha + w);
  }
  if (alpha < 1) c += distant * (1 - alpha);
  return c;
}
```

(SSR 색 1·알파 0.3, 로컬 프로브 색 0.5·알파 0.8, 원거리 0.1 이면 0.570. SSR 알파 1 이면 1.000, 모두 실패면 0.100.) 노트는 SSR 과 프로브가 서로 다른 적분 방식이라 이음새가 보일 수 있고, 거리 기반 거칠기 조정으로 전환을 맞춘다고 설명한다.

## 언제 쓰나

- 광택·금속 재질의 PBR 장면(실내 복도, 물웅덩이, 자동차).
- 정적 장면은 프로브만으로도 충분하고, 접촉 반사와 동적 물체가 중요하면 SSR 을 더한다. 거울·물은 평면 반사.

## 주의/비용

- **SSR 은 화면 정보만 안다.** 화면 밖, 가려진 뒷면, 카메라를 향한 반사는 안 나온다. 화면 가장자리에서 반사가 사라지거나 번쩍인다. 폴백이 필수다.
- 프로브는 아티스트 배치와 갱신 정책이 필요하다. 프록시를 실제 공간에 안 맞추면 반사가 엉뚱하게 늘어난다. 프로브 재캡처는 비용이 크다.
- 방출(emissive) 면을 SSR·프로브로 잡으면 조명이 두 번 반영될 수 있다(Frostbite 는 쉬운 해법이 없다고 한다).
- SSR 은 투명·반투명, 거친 표면에서 노이즈·비용 문제가 있고, 시간 누적을 쓰면 잔상이 생긴다(일반 지식, 읽은 출처 범위 밖).
- VR 은 눈마다 광선 추적이 필요해 비용이 두 배이고, 두 눈의 반사가 달라 보이는 불일치가 불편함을 만든다. SSR 폴백이 [컴포지터 레이어](/develop-wiki/knowledge/graphics-xr/xr-compositor-layers/)와 상호작용하는 방식은 확인하지 않았다.
- AO 와 같이 쓰일 때 스페큘러 가림은 별도 항이 필요하다([GTAO](/develop-wiki/knowledge/graphics-xr/gtao-hbao-horizon-ambient-occlusion/)).
