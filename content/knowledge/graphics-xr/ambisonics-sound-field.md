---
title: 앰비소닉스 — 음장을 구면조화로 담는 공간 오디오
aka: [Ambisonics, FOA, HOA, B-format, ambiX, ACN, SN3D, First-Order Ambisonics]
category: graphics-xr
group: xr
level: intermediate
summary: 앰비소닉스는 소리의 방향을 스피커 배치가 아니라 구면조화 채널로 저장한다. 차수 N 이면 채널 (N+1)^2 개이고, 머리 회전은 채널 혼합만으로 처리해 헤드트래킹 VR 360도 오디오에 맞는다.
tags: [xr, audio, spatial-audio, ambisonics, ambix, spherical-harmonics, head-tracking, 360-audio]
related: [graphics-xr/spatial-audio, graphics-xr/quaternion-3d-rotation, graphics-xr/coordinate-systems-handedness, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/openxr-webxr-architecture, graphics-xr/motion-to-photon-reprojection-frame-budget]
sources:
  - https://www.rfc-editor.org/rfc/rfc8486.txt
  - https://ambisonics.ch/ambisonics-101/formats/
updatedAt: 2026-11-19
---

> 출처 확인 범위: 채널 번호(ACN) 식, SN3D 정규화 사용, 채널 수 식, 채널 허용 개수는 IETF RFC 8486(Ogg Opus 의 앰비소닉스 매핑)을 직접 읽었다. 형식 비교(FuMa/ambiX, MaxN/SN3D/N3D)는 ICST 의 교육 페이지(2차 출처)를 읽었다. **ambiX 형식의 원 논문(Nachbar 외, 2011)은 접근하지 못해 읽지 않았다.** 아래 1차 인코딩 식과 회전 식은 원문 대신 직접 수치 검증으로 확인했다. 디코더 설계(max-rE, 바이노럴 HRTF 방식)는 다루지 않는다.

## 문제

[공간 오디오](/develop-wiki/knowledge/graphics-xr/spatial-audio/)에서 소리를 "5.1 스피커 채널" 로 저장하면 청취자가 머리를 돌릴 때 대응하기 어렵고 재생 장치 배치에 묶인다. 소리 하나하나를 객체(위치+신호)로 보내면 객체 수만큼 비용이 든다. 360도 영상처럼 "청취 위치에서 사방의 음장" 을 한 덩어리로 저장하고, 재생 때 청취자 방향에 맞춰 푸는 방식이 필요하다.

## 해법

앰비소닉스는 음장을 단위구 위의 **구면조화 함수**로 전개한 계수들을 채널로 담는다. 0차 W 는 전방향 합, 1차(FOA)는 세 방향 성분이다. 채널 수는 `(N+1)²` (1차 4, 2차 9, 3차 16, 4차 25). RFC 8486 은 0~14차까지와, 선택적 비회전(non-diegetic) 스테레오 2채널을 포함한 허용 채널 수 목록(1, 3, 4, 6, 9, 11, 16, …)을 정의한다.

### 규약: ACN + SN3D (ambiX)

같은 앰비소닉스라도 채널 순서와 크기 정규화가 규약마다 다르다. 현재 현대적 도구가 쓰는 쪽은 **ACN 순서 + SN3D 정규화**(ambiX)이고, 구형 FuMa(W,X,Y,Z 순서, MaxN 정규화)와 섞으면 방향이 어긋난다.

- ACN 번호: `ACN = n(n+1) + m` (차수 n, 도 m). 역변환은 `n = floor(√k)`, `m = k − n(n+1)`. RFC 8486 의 정의다.
- SN3D 는 ambiX 가 쓰는 정규화이며 현재 HOA 도구에서 사실상 표준으로 쓰인다(ICST). RFC 8486 도 앰비소닉스 채널이 SN3D 로 정규화된다고 규정한다.
- RFC 8486 의 매핑에서 1차 채널은 W(0), Y(1), Z(2), X(3) 순서이다(첫째와 둘째 채널이 W, Y 라는 RFC 서술과 일치).

```ts
// 1차, ACN 순서 [W, Y, Z, X], SN3D. az: 좌(+)·정면 0, el: 위(+)
export const encode = (s: number, az: number, el: number): number[] =>
  [s, s * Math.sin(az) * Math.cos(el), s * Math.sin(el), s * Math.cos(az) * Math.cos(el)];

// 청취자 머리가 왼쪽으로 a 만큼 돌면 음장은 -a 회전: X, Y 만 섞인다
export function rotateYaw([w, y, z, x]: number[], a: number): number[] {
  const c = Math.cos(-a), s = Math.sin(-a);
  return [w, x * s + y * c, z, x * c - y * s];
}
```

(직접 실행: 왼쪽 90도 음원은 [1, 1, 0, 0] 로 인코딩되고, 머리를 왼쪽 90도 돌려 회전을 적용하면 [1, 0, 0, 1], 즉 정면 음원의 인코딩 [1, 0, 0, 1] 과 같아졌다. ACN 식은 ACN(1,−1)=1, (1,0)=2, (1,1)=3 이고 역으로 k=7 은 (2, 1), k=15 는 (3, 3) 이었다.)

### 머리 회전이 싸다는 점

음원 객체를 매번 다시 패닝하는 대신, 인코딩된 음장 채널에 **회전 행렬을 곱하기만** 하면 된다. 1차에서는 3x3 벡터 회전(위 코드)이고, 고차는 차수별 블록 회전이다(수학적 사실이나 이 노트에서 검증하지 않음). 회전 후 한 번 디코딩(스피커 또는 바이노럴)한다. 헤드트래킹 지연이 낮아야 하는 VR 에서 이 구조가 유리하다([모션-투-포톤](/develop-wiki/knowledge/graphics-xr/motion-to-photon-reprojection-frame-budget/)). 머리 자세의 표현·회전은 [쿼터니언](/develop-wiki/knowledge/graphics-xr/quaternion-3d-rotation/)과 [좌표계 규약](/develop-wiki/knowledge/graphics-xr/coordinate-systems-handedness/)이 맞아야 한다(축 방향·핸드니스).

### 코덱과 전달

RFC 8486 은 Ogg Opus 에 앰비소닉스를 실을 채널 매핑 패밀리 2, 3 을 정의한다. 패밀리 2 는 ACN 순서 + SN3D 의 앰비소닉스 성분 뒤에 선택적 비회전 스테레오 2채널을 둔다. 패밀리 3 은 디코드된 채널에 **역혼합 행렬** 을 곱해 출력 채널을 만드는 방식이다. RFC 는 헤드트래킹 VR 에서 나레이션·음악처럼 머리 회전에 영향받지 않아야 하는 소리는 별도의 스테레오 스트림으로 둘 수 있다고 설명한다. 그리고 앰비소닉스는 "다채널 오디오 스트림" 으로 취급한다.

## 언제 쓰나

- 360도 영상·VR 에서 배경 음장(자연음, 환경음, 공간 녹음)을 헤드트래킹 연동으로 재생.
- 마이크로 현장 음장을 녹음(앰비소닉 마이크)해 나중에 다른 방식(스피커/헤드폰)으로 렌더링.
- 점음원 위주의 게임 오디오는 객체 기반 파이프라인이 더 자연스럽고, 앰비소닉스를 배경층으로 섞는 구성이 흔하다(일반적 설계 판단).

## 주의/비용

- **1차는 방향 해상도가 낮다.** 소리가 넓게 퍼져 들리고 정확한 정위가 어렵다. 차수를 올리면 정밀해지나 채널 수가 제곱으로 늘고 인코딩/디코딩 비용이 커진다.
- 규약 불일치(FuMa vs ambiX, N3D/SN3D/MaxN)는 가장 흔한 버그다. 채널 순서만 맞아도 정규화가 틀리면 방향 렌더링이 어긋난다(ICST 도 인코더·디코더 규약이 다르면 방향이 틀린다고 경고).
- 청취자 위치 이동(6DoF)은 표준 앰비소닉스가 지원하지 않는다. 한 점에서 본 음장이기 때문이다. 이동 시차는 객체 기반 렌더링이나 여러 음장 보간이 필요하다([6DoF 추적](/develop-wiki/knowledge/graphics-xr/six-dof-inside-out-tracking-slam/)).
- 압축 코덱으로 채널을 줄이면 방향 정보가 흐려질 수 있다. RFC 는 매핑만 정의하며 품질 평가는 다루지 않는다.
- 스테레오·바이노럴 변환 방식(HRTF, 가상 스피커 디코딩)에 따라 음색이 달라진다. 디코더 선택은 이 노트의 범위 밖이다.
- Web Audio API 에 앰비소닉스 전용 디코더가 있는지는 이 노트에서 확인하지 않았다(상용·오픈소스 라이브러리를 별도로 조사한다).
