---
title: 하드웨어 레이 트레이싱 그림자·반사 — 하이브리드 렌더링과 SSR 폴백
aka: [Hybrid Rendering, Ray Traced Shadows, Ray Traced Reflections, DXR, Vulkan Ray Tracing, RT Cores, Shadow Rays]
category: graphics-xr
group: rendering
level: advanced
summary: 하이브리드 렌더링은 래스터화로 G-버퍼를 만들고 그 위에서 그림자·반사만 광선으로 푼다. 그림자는 픽셀당 광선 한두 개와 필터로, 반사는 BRDF 중요도 샘플링과 시공간 복원으로 만들며 SSR·프로브는 하드웨어가 없을 때의 폴백이 된다.
tags: [rendering, ray-tracing, dxr, hybrid-rendering, shadows, reflections, denoising, ssr, bvh]
related: [graphics-xr/shadow-mapping, graphics-xr/cascaded-shadow-maps, graphics-xr/soft-shadows-vsm-pcss, graphics-xr/reflection-probes-ssr, graphics-xr/taa-temporal-filtering-ao-ssr, graphics-xr/forward-vs-deferred-rendering, graphics-xr/pbr-material-model, graphics-xr/rasterization-pipeline]
sources:
  - https://boksajak.github.io/files/RTG1_RayTracedShadows.pdf
  - https://media.contentapi.ea.com/content/dam/ea/seed/presentations/2019-ray-tracing-gems-chapter-25-barre-brisebois-et-al.pdf
  - https://github.com/microsoft/DirectX-Specs/blob/master/d3d/Raytracing.md
updatedAt: 2026-11-19
---

> 출처 메모: Ray Tracing Gems 13장(Boksansky 외, 적응형 그림자 광선), 25장(Barré-Brisebois 외, PICA PICA 하이브리드 렌더링)을 직접 읽었다. DirectX Raytracing 사양(DirectX-Specs, `Raytracing.md`)은 전체 63만 자 중 앞쪽 약 10만 자(가속 구조, 셰이더 단계, `TraceRay`, 인라인 레이트레이싱, 갱신 제한)만 읽었고 빌드 플래그 선택·재귀 한도·압축 절은 읽지 못했다. ms 단위 수치는 두 장이 쓴 GPU(GeForce RTX 2080 Ti 등)와 장면에서만 유효하다. 최신 GPU·엔진의 수치, Vulkan 레이 트레이싱 사양, 불투명도 마이크로맵 효과는 확인하지 못했다.

## 문제

래스터화 파이프라인은 한 번에 한 삼각형을 칠하므로 "이 점과 광원 사이에 무엇이 있나" 를 알 수 없다. 그림자 맵([shadow-mapping](/develop-wiki/knowledge/graphics-xr/shadow-mapping/))은 해상도 부족의 계단 현상, 자기 그림자 오류(acne), 떨어진 그림자(Peter Panning), 반그림자 부재, 반투명 가림 불가 같은 한계를 낳고, 이를 줄이는 기법을 조합해 장면마다 손으로 조정해야 한다. 반사도 [SSR 과 프로브](/develop-wiki/knowledge/graphics-xr/reflection-probes-ssr/)는 화면 밖 정보가 없거나 상호 반사를 못 담는 식으로 쉽게 깨진다. 광선을 직접 쏘면 이 문제들이 정의상 사라지지만, 광선 비용이 문제다.

## 해법: 하이브리드 파이프라인

PICA PICA 장은 래스터화로 G-버퍼를 만들고, 그 깊이에서 복원한 위치를 광선 원점으로 삼아 필요한 효과(그림자, 반사, AO)에만 레이 트레이싱을 쓰는 구성을 소개한다. 기본 가속 구조는 DXR 의 2단계다. BLAS 가 삼각형(또는 절차적 AABB)을 담고, TLAS 가 변환을 가진 인스턴스를 가리킨다. `TraceRay()` 가 후보 교차를 찾고 any-hit, closest-hit, miss 셰이더가 이어진다.

### 그림자

- 하드 그림자: 표면에서 광원으로 광선 하나를 쏘아 무엇이든 맞으면 그림자다. 결과 가시성만 필요하므로 PICA PICA 는 `RAY_FLAG_SKIP_CLOSEST_HIT_SHADER` 를 쓰고 miss 셰이더에서 "가려지지 않음" 을 기록한다.
- 소프트 그림자: 광원 방향 주변의 원뿔에서 광선 방향을 뽑는다(광원 각 크기가 반그림자 폭). 샘플이 적으므로 시공간 분산을 쓰는 필터로 거른다. 반투명 가림은 광선이 투명 표면을 맞으면 재귀로 이어 간다.
- 13장은 모든 픽셀에 같은 수의 광선을 쏘지 않는다. 그림자 경계에서만 샘플을 늘리는 적응형 샘플링과 적응형 필터링으로, 같은 하드웨어(RTX 2080 Ti)에서 소프트 그림자를 픽셀당 4개 샘플(3.6 ms), 적응형 0~5개(2.7 ms), 256개(200 ms)로 비교한다.

### 반사

- 광선은 G-버퍼에서 출발하며 **반해상도, 곧 픽셀당 1/4 광선**으로 쏜다. 방향은 재질의 법선 분포를 중요도 샘플링해 만든다. 낮은 불일치 수열(Halton)에 픽셀별 회전을 더해 적은 샘플의 분포를 좋게 한다.
- 이어서 **공간 복원**(이웃 광선의 적중을 현재 픽셀의 BRDF·광선 PDF 로 가중 평균)으로 전체 해상도로 올린다. 장은 이것이 픽셀당 16개 광선을 쏜 것과 비슷한 분산 감소라고 밝힌다. 그다음 분산 추정으로 커널 크기를 조절하는 양방향 필터, 시간 누적, TAA 가 이어진다.
- 시간 누적은 단순 지수 평균으로는 부족하다. 반사는 반사체의 움직임과 다른 시차로 움직이기 때문이다. 반사체 모션 벡터 재투영은 거칠고 휘어진 표면에 맞고 평평한 거울면에 틀린다. 평균 적중점 재투영은 바닥 같은 평면에 맞고 곡면에 틀린다. 장은 둘을 블렌딩하고 [Karis 식 이웃 통계](/develop-wiki/knowledge/graphics-xr/taa-temporal-filtering-ao-ssr/)로 재투영값을 거부·클램프한다고 한다. 이 방식은 편향되고 깜박임이 생길 수 있다고 인정한다.
- 이 장에서는 처음엔 SSR 과 결합했다가 단순성과 균일성을 위해 최종적으로 광선 반사만 쓴다고 적혀 있다.

### 광선 예산을 따져 보기

1080p(2,073,600 픽셀)에서 반사 1/4 광선은 프레임당 약 51.8만 개, 60 fps 로 초당 약 3100만 개다. 그림자 픽셀당 1샘플이면 초당 약 1.24억 개다. 이 숫자에 비해 장이 "광선 수는 예산으로 관리해야 한다" 고 강조하는 이유가 보인다(장은 확산 간접 반사에 프레임당 25만 광선을 책정한 예를 든다).

## 비교: 폴백 계층과 어디까지 광선으로

| 항목 | 그림자 맵 | 광선 그림자 | SSR | 프로브 | 광선 반사 |
| --- | --- | --- | --- | --- | --- |
| 정보 범위 | 광원 시점 깊이 | 장면 전체(BVH) | 화면 안 | 한 시점 큐브맵 | 장면 전체 |
| 반그림자·거칠기 | 별도 기법 필요 | 광선 샘플 수에 비례 | 이전 프레임 블러로 근사 | 프리필터 | 확률 샘플, 잡음 큼 |
| 비용 구조 | 맵 해상도 | 광선 수, BVH 갱신 | 화면 마칭 | 거의 고정 | 광선 수, 필터 |
| 하드웨어 | 어디서나 | RT 지원 필요 | 어디서나 | 어디서나 | RT 지원 필요 |

SSR 은 흐린 반사에서 블러된 화면을 쓸 수 있지만 광선은 그럴 수 없어 잡음이 훨씬 크고 공격적인 필터가 필요하다고 장은 설명한다. 하드웨어가 없는 플랫폼에서는 프로브 + SSR 계층을 폴백으로 둘 수 있고(이 노트의 권고), 두 경로를 같이 유지하는 비용이 따른다.

## 언제 쓰나

- 접촉 그림자·다중 광원·면광원·반투명 그림자처럼 그림자 맵이 매번 손이 가는 장면.
- 화면 밖 반사, 곡면·상호 반사가 중요한 장면(자동차, 유리·물이 많은 실내).
- 최상위 하드웨어를 겨냥하고 폴백 품질을 따로 보장할 수 있을 때.

## 주의/비용

- **BVH 관리**: 가속 구조는 갱신(update)이 재빌드보다 빠르지만 추적 효율이 떨어진다. DXR 사양은 삼각형 BLAS 의 갱신에서 정점 위치만 바꿀 수 있다고 한다. 큰 BLAS 는 교차 성능이 좋고 인스턴스를 늘리면 유연성이 늘어난다는 절충도 서술한다. 스키닝·파괴가 많은 장면은 빌드 시간이 예산을 먹는다.
- **잡음 처리가 본체다.** 광선 수가 적으니 필터·시간 누적의 품질이 화질을 좌우하고, 모션 벡터 오류는 고스팅으로 보인다. 필터가 흐리게 만들 위험도 있다.
- 작은 밝은 광원은 확률 샘플링에서 분산을 키운다. 장은 이를 연구 과제로 남긴다.
- 인라인 레이트레이싱(`RayQuery`)은 모든 셰이더 단계에서 쓸 수 있지만 시스템이 앱을 대신해 최적화할 여지가 줄어든다고 사양이 적는다.
- 이 노트의 ms 수치는 한 하드웨어·한 장면의 보고값이다. 자기 장면에서 광선 수와 필터 비용을 따로 측정해야 한다.
- 광선 경로를 쓰더라도 하드웨어가 없는 기기용 [그림자 맵](/develop-wiki/knowledge/graphics-xr/cascaded-shadow-maps/)·프로브 경로를 같이 유지할지는 설계 결정이다(이 판단은 자료에서 확인한 사실이 아니라 이 노트의 권고다).
