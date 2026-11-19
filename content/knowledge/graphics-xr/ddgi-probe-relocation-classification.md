---
title: DDGI 프로브 재배치·분류 — 벽에 박힌 프로브를 옮기고 쓸모없는 프로브의 갱신을 끄기
aka: [Probe Relocation, Probe Classification, Probe States, Probe Sleeping, Probe-position Optimizer, Fixed Rays, Backface Threshold, Self-shadow Bias, RTXGI DDGIVolume]
category: graphics-xr
group: rendering
level: advanced
summary: DDGI 의 균일 격자 프로브는 벽 속에 박히거나 빈 공간에 떠서 비용만 쓴다. 재배치는 뒷면 히트 비율로 "벽 속" 을 판정해 격자 칸 안에서 프로브를 밀어내고, 분류는 근처에 표면이 없거나 여전히 벽 속인 프로브의 광선 추적과 갱신을 끈다.
tags: [rendering, global-illumination, ddgi, irradiance-probes, ray-tracing, rtxgi, probe-relocation, performance]
related: [graphics-xr/ddgi-irradiance-probes, graphics-xr/radiance-cache-sharc-nrc, graphics-xr/hw-ray-traced-shadows-reflections, graphics-xr/soft-shadows-vsm-pcss, graphics-xr/reflection-probes-ssr]
sources:
  - https://jcgt.org/published/0010/02/01/
  - https://jcgt.org/published/0010/02/01/paper-lowres.pdf
  - https://github.com/NVIDIAGameWorks/RTXGI-DDGI/blob/main/docs/DDGIVolume.md
  - https://github.com/NVIDIAGameWorks/RTXGI-DDGI/blob/main/rtxgi-sdk/include/rtxgi/ddgi/DDGIVolume.h
  - https://github.com/NVIDIAGameWorks/RTXGI-DDGI/blob/main/rtxgi-sdk/shaders/ddgi/ProbeRelocationCS.hlsl
  - https://github.com/NVIDIAGameWorks/RTXGI-DDGI/blob/main/rtxgi-sdk/shaders/ddgi/ProbeClassificationCS.hlsl
  - https://github.com/NVIDIAGameWorks/RTXGI-DDGI/blob/main/rtxgi-sdk/shaders/ddgi/include/ProbeRayCommon.hlsl
updatedAt: 2026-11-19
---

> 출처 메모: Majercik·Marrs·Spjut·McGuire, "Scaling Probe-Based Real-Time Dynamic Global Illumination for Production"(JCGT 10(2), 2021) 저해상도 PDF 를 텍스트로 추출해 1~2장, 4.1절, 5~6장, 7.1~7.2절을 읽었다(4.3절 수렴 휴리스틱, 7.3~7.4절 추적 창·다중 볼륨, 8장은 훑지 않았다). RTXGI-DDGI 저장소(main 브랜치, 2026-11-19 조회 시 archived 아님, 마지막 push 2024-02-05)에서 `docs/DDGIVolume.md` 의 재배치·분류·고정 광선·변동성 절, `DDGIVolume.h` 의 설명자 기본값, `ProbeRelocationCS.hlsl`·`ProbeClassificationCS.hlsl` 본문을 읽었다. 기본 DDGI 알고리즘은 [DDGI 노트](/develop-wiki/knowledge/graphics-xr/ddgi-irradiance-probes/)를 본다. 아래 수치 중 "직접 계산" 표시는 내 산수다.

## 문제

[DDGI](/develop-wiki/knowledge/graphics-xr/ddgi-irradiance-probes/)는 프로브를 축 정렬 3D 격자에 놓는다. 격자 인덱싱이 단순한 대신 콘텐츠를 모른다.

- **벽 속 프로브.** 가시성 항 덕분에 빛 샘은 막지만, 완전히 가려진 프로브는 셰이딩에 기여하지 못한다. 예각 모서리에서는 그림자 샘이 남았다(2021 논문 그림 5).
- **빈 공간 프로브.** 열린 장면에서는 조정 후에도 많은 프로브가 어떤 표면도 셰이딩하지 않는데, 매 프레임 광선을 쏘고 갱신한다.
- **이동 물체.** 정적 기하만 보고 판단하면 움직이는 물체 근처 프로브가 꺼져 있을 수 있다.

## 해법 A: 2021 논문의 방식

### 1. 프로브 위치 최적화 (5장)

초기화 때 각 프로브의 광선 결과로 위치를 조정한다(논문 목록 4).

1. **뒷면 히트가 25 % 를 넘으면** 벽 속으로 보고, 가장 가까운 뒷면 방향으로 그 거리의 최대 2배까지(배율을 0.01 씩 줄여 가며) 밀어낸다.
2. 벽 속이 아니면, 가장 먼 앞면과 가장 가까운 앞면의 방향이 비슷하지 않을 때(의사코드상 거리로 스케일된 벡터의 내적 ≤ 0.5) 가장 먼 앞면 쪽으로 최대 0.2 만큼 옮겨 가까운 앞면에서 멀어진다.
3. 새 오프셋이 한도 안일 때만 적용한다. 격자 인덱싱을 지키려고 **축마다 최소 프로브 간격의 절반을 넘지 않는다**.

- 분류 단계에서 **5회 반복**한다. 접선 방향 뒷면을 사이에 두고 프로브가 무한히 왔다 갔다 하지 않게 상한을 둔 것이다.
- **정적 기하만** 대상으로 한다. 동적 기하에 맞춰 움직이면 불안정해서다. 동적 물체가 프로브를 지나가면 뒷면 처리(아래)가 샘을 막고 수렴 휴리스틱이 빠르게 회복한다고 설명한다.
- 논문은 이 최적화가 최적은 아니라고 밝힌다. 평평한 벽을 둘러싼 8개 "케이지" 의 앞쪽 4개를 벽 밖으로 빼면 같은 표면을 이중으로 덮어 추적 프로브만 늘 수 있다(그림 6). 시험 장면에서는 그 비효율을 감수할 만했다고 한다.

### 2. 뒷면 히트 처리 (4.1절)

프로브 갱신 광선이 뒷면에 맞으면 조도는 0, 거리는 **80 % 줄여** 기록한다. 거리를 0 으로 하지 않는 이유로 (1) 체비셰프 가중치가 0 으로 가서 정규화 때 오히려 커질 수 있고, (2) 모델링 탓에 뒷면을 조금 보는 정상 프로브의 평균 거리가 크게 왜곡될 수 있음을 든다.

같은 절에서 이전의 장면별 바이어스 세 개를 하나로 합친 **자기 그림자 바이어스**를 제안한다: `(n·0.2 + ωo·0.8) × (0.75 × 최소 프로브 간격) × TunableShadowBias`(기본 0.3). 너무 크면 빛 샘이 생긴다(그림 3).

### 3. 프로브 상태 (6장)

| 상태 | 뜻 |
| --- | --- |
| Off | 조정 후에도 정적 기하 속. 추적·갱신 안 함 |
| Sleeping | 프로브 간격 안에 기하가 없음. 쓰이지 않으므로 갱신 안 함 |
| Newly Awake / Awake | 동적 물체 근처에서 깨어남 |
| Newly Vigilant / Vigilant | 정적 기하를 셰이딩. 항상 추적·갱신 |

초기화(목록 5):

1. 미초기화 프로브는 5 프레임 동안 거리만 추적하며 위치를 최적화한다. 여전히 벽 속이면 Off, 앞면 거리가 프로브 간격보다 짧으면 Newly Vigilant, 아니면 Sleeping.
2. 동적 물체 AABB 를 격자 한 칸 + 자기 그림자 바이어스만큼 넓혀, 그 안의 Sleeping 프로브를 Newly Awake 로.
3. (선택) Newly 상태 프로브는 광선을 많이 쏘고 히스테리시스 0 으로 한 프레임에 수렴시킨 뒤 Awake·Vigilant 로.
4. Awake·Vigilant 만 평소 히스테리시스로 추적·갱신.

카메라가 프로브를 못 봐도 표면을 셰이딩하면 깨어 있어야 한다(간접광 전파 때문). 참여 매질처럼 빈 공간에서 조회하는 경우에는 표면이 없어도 깨워야 한다고 적는다.

**성능.** 프로브 수면으로 평균 30~50 % 빨라졌다고 보고한다(그림 8). 아낀 시간만큼 활성 프로브당 광선을 늘려 히스테리시스를 낮출 수도 있다. 같은 논문은 갱신 패스를 픽셀 셰이더 대신 일관된 컴퓨트 셰이더로 바꿔 3배 빨라졌다고 한다(7.2절).

## 해법 B: RTXGI-DDGI SDK 의 구현

SDK(`DDGIVolume`)는 같은 생각을 런타임 기능으로 넣었다. 둘 다 기본값은 꺼짐(`probeRelocationEnabled`, `probeClassificationEnabled` = false).

- **고정 광선.** 프로브 광선 중 `RTXGI_DDGI_NUM_FIXED_RAYS`(기본 32)개는 매번 같은 방향(무작위 회전 없음)으로 쏜다. 재배치·분류가 계속 돌아도 판정이 흔들리지 않게 하려는 것이다. 고정 광선은 규칙성 때문에 결과를 편향시키므로 조도·거리 블렌딩에서 빼고, 그래서 셰이딩도 생략할 수 있다.
- **재배치(`ProbeRelocationCS`)**: 고정 광선 중 뒷면 비율이 `probeFixedRayBackfaceThreshold`(기본 0.25)를 넘고 뒷면 히트가 하나라도 있으면, 가장 가까운 뒷면 방향으로 `뒷면 거리 + probeMinFrontfaceDistance/2` 만큼 민다. 그렇지 않고 가장 가까운 앞면이 `probeMinFrontfaceDistance`(기본 1.0) 보다 가까우면, 그 방향과 가장 먼 앞면 방향이 반대쪽(내적 ≤ 0)일 때만 먼 앞면 쪽으로 최대 1 만큼 옮긴다. 근처에 아무것도 없으면 오프셋을 0 쪽으로 되돌린다. 새 오프셋은 간격으로 정규화한 길이 제곱이 0.2025(= 0.45²) 미만일 때만 받아들인다. 문서도 최대 이동을 격자 간격의 45 % 라고 적는다.
- **분류(`ProbeClassificationCS`)**: 1단계, 고정 광선의 뒷면 비율이 같은 임계값을 넘으면 비활성. 2단계, 고정 광선마다 프로브 칸의 축 평면(간격만큼 떨어진 면)과의 교차 거리를 구해, 히트 거리가 그보다 짧은 광선이 하나라도 있으면 활성, 없으면 비활성.
- 상태는 프로브 데이터 텍스처의 W 채널(오프셋은 XYZ)에 저장한다. SDK 는 **활성/비활성 두 상태**이고, 논문의 Sleeping/Awake/Vigilant 구분과 동적 물체 AABB 깨우기는 이 문서에 없다.
- **변동성(Probe Variability)**: 볼륨 전체의 평균 변동 계수를 추적해, 충분히 낮아지면 앱이 추적·블렌딩을 멈추고 조명이 바뀌는 사건 때 다시 켜라고 권한다. 값은 0 에 도달하지 않을 수 있다.

```ts
// SDK 재배치 판정의 뼈대 (고정 광선 hit 거리: 음수 = 뒷면, 저장값 ×(-5) 로 원거리 복원)
type Hit = { dir: [number, number, number]; dist: number };
function relocate(off: number[], hits: Hit[], spacing: number[], minFront = 1, thr = 0.25): number[] {
  const back = hits.filter((h) => h.dist < 0).map((h) => ({ ...h, dist: -5 * h.dist }));
  const front = hits.filter((h) => h.dist >= 0).sort((a, b) => a.dist - b.dist);
  const add = (d: number[], s: number) => off.map((o, i) => o + d[i] * s);
  let full: number[] | null = null;
  if (back.length && back.length / hits.length > thr) {
    const b = back.reduce((m, h) => (h.dist < m.dist ? h : m));
    full = add(b.dir, b.dist + minFront * 0.5);                    // 벽 밖으로
  } else if (front.length && front[0].dist < minFront) {
    const near = front[0], far = front[front.length - 1];
    const dot = near.dir.reduce((s, v, i) => s + v * far.dir[i], 0);
    if (dot <= 0) full = add(far.dir, Math.min(far.dist, 1));      // 가까운 면에서 멀어짐
  } // (아무것도 가깝지 않으면 0 쪽으로 복귀 — 생략)
  if (!full) return off;
  const n2 = full.reduce((s, v, i) => s + (v / spacing[i]) ** 2, 0);
  return n2 < 0.45 * 0.45 ? full : off;                            // 칸의 45 % 안에서만
}
```

### 직접 계산

- 저장된 뒷면 거리는 논문의 "80 % 감축"(실제 거리 × 0.2, 부호는 뒷면 표시로 음수)과 맞고, 셰이더의 `× −5` 는 이것을 원래 거리로 되돌린다. SDK `ProbeRayCommon.hlsl` 의 `DDGIStoreProbeRayBackfaceHit` 도 `-hitT * 0.2f` 를 저장하며 "Shorten the hit distance on a backface hit by 80%" 라고 주석을 단다. 거리 3.0 → 저장 −0.6 → 복원 3.0.
- 고정 광선 32개 × 임계 0.25 = 8 → 뒷면 히트가 **9개 이상**이면 벽 속 판정(셰이더는 `>` 비교).
- 이동 한도: 간격 2 m 격자라면 SDK 는 축 방향 최대 0.9 m(타원체 경계), 논문은 축마다 1.0 m(간격의 절반).

## 언제 쓰나

- 레벨 디자이너가 프로브 배치를 손으로 고치기 어려운 큰 장면, 벽이 격자와 맞지 않는 실내.
- 열린 장면·공중 공간이 많아 대부분의 프로브가 아무것도 셰이딩하지 않을 때(수면·비활성으로 비용 절감).
- 재배치·분류 결과가 매 프레임 흔들리면 안 될 때는 SDK 처럼 고정 광선을 따로 둔다.

## 주의/비용

- **얇은 벽·양면 평면에 약하다.** 판정이 뒷면 히트에 기대므로 SDK 문서는 벽을 두께 있는 **단면(single-sided)** 기하로 만들고, 두께를 프로브 밀도에 비례하게 하라고 권한다. 두께 0 평면은 빛 샘을 낸다.
- **한도 때문에 못 빠져나오는 프로브.** 칸의 절반(SDK 45 %) 이상 박힌 프로브는 그대로 남고 꺼진다. 그 칸의 셰이딩은 남은 프로브에 의존한다.
- **이중 덮기.** 위치 최적화가 오히려 추적 프로브를 늘릴 수 있다(논문 그림 6).
- **동적 물체.** 논문은 동적 기하에 맞춰 프로브를 옮기지 않는다. 대신 AABB 로 깨우는 규칙이 필요하고, SDK 문서에는 그 규칙이 없다. 꺼진 프로브 근처로 물체가 들어오는 경우 처리는 앱이 설계해야 한다(SDK 측 동작은 미확인).
- **고정 광선의 비용.** 모든 프로브가 매 갱신에 최소 32개를 쏜다. 프로브당 광선이 적은 설정에서는 비중이 크다.
- **임계값은 장면 의존.** 25 % 는 논문·SDK 기본값일 뿐이고, 무작위 광선용 임계(`probeRandomRayBackfaceThreshold` 기본 0.1)는 별도다.
- **SDK 의 현황.** RTXGI 2.x 는 SHARC·NRC 로 옮겨 갔고 DDGI 는 v1.x 저장소에 남아 있다([라디언스 캐시 노트](/develop-wiki/knowledge/graphics-xr/radiance-cache-sharc-nrc/)). 이 저장소의 마지막 push 는 2024-02 였다.

## 비교: 논문 방식과 SDK 방식

| 구분 | 2021 논문 | RTXGI-DDGI SDK |
| --- | --- | --- |
| 실행 시점 | 초기화(미초기화 프로브), 5회 반복 | 런타임, 앱이 정한 주기 |
| 판정에 쓰는 광선 | 프로브 광선(거리만 추적) | 고정 광선 32개(블렌딩 제외) |
| 벽 속 판정 | 뒷면 > 25 % | 뒷면 > `probeFixedRayBackfaceThreshold`(0.25) |
| 이동 한도 | 축마다 간격의 1/2 | 간격 정규화 타원체 반지름 0.45 |
| 상태 | Off/Sleeping/Awake/Vigilant(+Newly) | 활성/비활성 |
| 동적 물체 | AABB 확장으로 깨움 | 문서에 없음 |
| 보고된 효과 | 평균 30~50 % 시간 절감 | 문서에 수치 없음 |

## 검증 범위

- 읽은 것: JCGT 2021 논문 1~2, 4.1, 5, 6, 7.1~7.2절(목록 4·5 포함), RTXGI-DDGI `DDGIVolume.md` 의 해당 절, `DDGIVolume.h` 설명자, 두 컴퓨트 셰이더 본문.
- 직접 계산: 뒷면 거리 저장·복원, 고정 광선 임계 개수, 이동 한도 비교.
- 미확인: 논문 4.3절 수렴 휴리스틱과 7.3~7.4절(추적 창·다중 볼륨) 세부, 그림 8 의 장면별 수치, SDK 의 동적 물체 처리, 고정 광선의 인덱스 배치(문서는 고정 광선도 같은 구면 피보나치 방식으로 균일 분포한다고 적고, 재배치 셰이더가 0 번부터 `min(광선 수, 32)` 개를 읽는 것까지 확인), 현재 엔진(UE·Unity) 통합판의 동작.
