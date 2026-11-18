---
title: 공유 공간 앵커 — 여러 기기가 같은 현실 좌표를 쓰는 법
aka: [Shared Spatial Anchors, Cloud Anchors, Colocation, Multi-user AR, Spatial Persistence, Anchor Sharing]
category: graphics-xr
group: tracking
level: intermediate
summary: 기기마다 자기 월드 좌표를 가지므로, 같은 앵커를 각자 인식해 좌표계를 정렬해야 같은 장소에 같은 가상 물체가 보인다. 호스팅/해석(resolve), 영속 범위, 정렬 오차가 설계의 핵심이다.
tags: [xr, ar, anchors, shared-anchors, cloud-anchors, colocation, multiuser, persistence, openxr]
related: [graphics-xr/plane-detection-anchors-spatial-mapping, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/coordinate-systems-handedness, graphics-xr/openxr-webxr-architecture, graphics-xr/homogeneous-coordinates-mvp]
sources:
  - https://developers.google.com/ar/develop/cloud-anchors
  - https://developers.google.com/ar/develop/java/cloud-anchors/developer-guide-android
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XR_EXT_spatial_persistence.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XrSpatialPersistenceScopeEXT.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XR_META_spatial_entity_sharing.html
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/xrShareSpacesMETA.html
updatedAt: 2026-11-19
---

> 출처 확인 범위: ARCore Cloud Anchors 개요·Android 개발자 가이드, OpenXR 1.1 레지스트리의 `XR_EXT_spatial_persistence`·`XR_META_spatial_entity_sharing` 매뉴얼 페이지를 읽었다. Meta Shared Spatial Anchors 개발자 문서, ARKit 협업 세션(ARWorldMap), 기타 벤더 클라우드 서비스의 현재 상태·한도·요금은 읽지 못했다. 수치(수명, 한도)는 해당 문서 날짜(2026-09 갱신 문서)를 기준으로 하고 바뀔 수 있다.

## 문제

[SLAM 기반 추적](/develop-wiki/knowledge/graphics-xr/six-dof-inside-out-tracking-slam/)에서 각 기기의 월드 좌표는 **그 기기가 켜진 순간** 에 정해진다. 기기 A 의 (0,0,0)과 기기 B 의 (0,0,0)은 서로 다른 곳이다. 한 사람이 책상 위에 가상 물체를 놓아도, 다른 사람의 기기는 같은 좌표값을 다른 위치로 해석한다. 서버로 월드 좌표를 주고받는 것으로는 풀리지 않는다. 둘이 **같은 현실 지점을 같이 보고 좌표계 사이의 변환을 구해야** 한다.

## 해법

### 공유 앵커로 좌표계 정렬

두 기기가 같은 앵커를 각자 자기 월드 좌표로 알고 있다면(A 의 `A_T_anchor`, B 의 `B_T_anchor`), 변환은 다음이다.

`A_T_B = A_T_anchor · (B_T_anchor)⁻¹`

앵커를 기준으로 배치한 물체는 `anchor_T_obj` 만 저장하면 되고, 각 기기는 자기 앵커 포즈에 곱해 렌더링한다. 평면 2D 로 단순화해 구현해 확인했다. 앵커를 A 에서 (2,1,0.3rad), B 에서 (−1,4,−1.1rad) 로 알 때, 앵커 기준 (0.5, 0.2)의 물체는 A 에서 (2.419, 1.339), B 좌표를 A 로 변환해도 (2.419, 1.339) 로 같았다.

```ts
// SE(2) 합성/역: 위치 + 각도. 3D 는 4x4 행렬 또는 쿼터니언+벡터로 같은 식
const A_T_B = compose(A_T_anchor, inv(B_T_anchor));      // B 월드 -> A 월드
const objInA = compose(A_T_anchor, objInAnchor);          // A 가 본 물체
// compose(A_T_B, compose(B_T_anchor, objInAnchor)) 가 같은 값이 되어야 한다
```

### 앵커를 공유하는 방식 두 가지

| 방식 | 흐름 | 대표 예 |
| --- | --- | --- |
| **시각 특징 지도 호스팅** | 한 기기가 앵커 주변을 여러 각도에서 스캔 → 특징 지도를 클라우드에 업로드 → ID 를 받음 → 다른 기기에 ID 를 전달 → 다른 기기가 같은 장소를 비추며 **resolve** 해서 지도와 비교해 자기 좌표계의 앵커를 복원 | ARCore Cloud Anchors |
| **플랫폼의 공간 엔티티 공유** | 기기·계정 간에 공간 엔티티를 플랫폼이 직접 공유(수신자 지정 구조체에 그룹 유형이 있다) | OpenXR `XR_META_spatial_entity_sharing`(`xrShareSpacesMETA`, 비동기 완료 이벤트), 일부 벤더 공유 앵커 |

ARCore 문서에서 확인한 사항은 다음과 같다.

- 호스트 때 앵커 주변 환경을 다양한 각도에서 스캔해야 한다. 제자리에서 회전만 하는 파노라마식은 안 되고 **실제로 이동**해야 한다. 조명이 충분하고 반사 표면을 피한다.
- 호스트 시 특징점 품질을 추정할 수 있다(`INSUFFICIENT` / `SUFFICIENT` 등). 품질이 낮으면 해석이 어렵다.
- 클라우드 앵커는 방 규모 경험에 가장 적합하다고 문서가 설명한다. Android·iOS 기기가 같은 경험에 참여할 수 있다.
- 호스트 때 올린 시각 데이터는 24시간 안에 삭제되고, 이전에 올린 시각 데이터가 사용자 기기로 내려가지는 않는다고 문서에 적혀 있다. 앵커 수명은 TTL 로 정한다. API 키 인증은 최대 24시간이고, 1일을 넘는 TTL 은 키리스 인증이 필요하다.
- 인터넷 연결이 필요하다.

### OpenXR 의 영속과 공유

OpenXR 에는 영속 확장이 표준화돼 있다. `XR_EXT_spatial_persistence` 는 비준(Ratified)된 확장이고, 영속 컨텍스트의 범위(scope)를 둔다. `SYSTEM_MANAGED` 범위는 시스템이 영속·관리하는 엔티티를 앱이 읽기 전용으로 접근하고, 영속 UUID 로 공간 컨텍스트와 기기 재부팅을 넘어 엔티티를 대응시킬 수 있다. `LOCAL_ANCHORS`(`XR_EXT_spatial_persistence_operations`)는 **같은 기기·같은 사용자·같은 앱** 범위의 앵커만 다룬다. 즉 비준된 영속은 기기 간 공유가 아니다. 기기 간 공유는 벤더 확장(`XR_META_spatial_entity_sharing`, `XR_FB_spatial_entity_sharing`)이며 매뉴얼에 **비준되지 않은(Not ratified)** 확장으로 표시돼 있다. 공유 요청은 비동기이고 완료 이벤트로 결과가 온다. 상태는 `LOADED` / `NOT_FOUND` 로 구분한다.

## 오차와 설계

앵커 정렬에 각도 오차 δ 가 있으면 앵커에서 거리 d 에 있는 물체는 약 `d · sin δ` 만큼 틀어진다. 직접 계산한 값:

| 각도 오차 | 1 m | 5 m | 20 m |
| --- | --- | --- | --- |
| 0.5도 | 8.7 mm | 43.6 mm | 175 mm |
| 1도 | 17.5 mm | 87 mm | 349 mm |
| 2도 | 34.9 mm | 175 mm | 698 mm |

그래서 큰 공간에서는 **앵커를 하나만 쓰지 않는다.** 물체 근처의 앵커를 기준으로 삼고(가까운 앵커 재사용, [앵커 설계](/develop-wiki/knowledge/graphics-xr/plane-detection-anchors-spatial-mapping/)), 필요하면 여러 앵커를 둔다.

## 언제 쓰나

- 같은 방에서 여럿이 같은 가상 물체를 보는 게임·협업·교육 앱(콜로케이션).
- 한 사람이 남긴 가상 메모·표지를 다른 사람이 나중에 같은 장소에서 보는 영속 경험.

## 주의/비용

- **프라이버시가 크다.** 방의 시각 특징 지도는 공간 정보다. 업로드 여부·보관 기간·삭제 방법·수신자를 사용자에게 알리고 동의를 받는다. ARCore 는 시각 데이터를 24시간 안에 삭제한다고 하지만 정책은 서비스마다 다르다.
- **서비스 의존성**: 클라우드 해석은 네트워크·벤더 서비스 가용성에 달려 있다. 폐지·정책 변경 위험은 각 벤더 문서로 확인한다(이 노트는 그 현황을 확인하지 않았다).
- 환경이 바뀌면(가구 이동, 조명 변화, 시간대) 해석이 실패하거나 흔들린다. 재시도와 "더 둘러보세요" 안내 UI 가 필요하다.
- 비준된 OpenXR 영속 범위는 기기 로컬이다. 크로스 디바이스 공유는 벤더 확장에 의존하므로 이식성이 낮다.
- 앵커 해석 직후와 시간이 지난 후의 추적 드리프트는 앵커의 포즈 갱신으로 흡수되지만, 두 기기의 갱신 시점이 달라 잠깐 어긋나 보일 수 있다(일반적 추론).
- 좌표계 규약(오른손/왼손, 축 방향)이 플랫폼마다 달라 앵커 포즈를 교환할 때 변환이 필요하다([좌표계 규약](/develop-wiki/knowledge/graphics-xr/coordinate-systems-handedness/)).
