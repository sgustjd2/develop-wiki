---
title: OpenXR 공간 엔티티 확장 — 엔티티·컴포넌트·스냅샷 모델
aka: [XR_EXT_spatial_entity, OpenXR Spatial Entities, Spatial Context, Spatial Capability, Spatial Snapshot, XR_EXT_spatial_anchor, XR_EXT_spatial_plane_tracking, XR_EXT_spatial_persistence]
category: graphics-xr
group: tracking
level: advanced
summary: OpenXR 의 공간 엔티티 확장은 평면·앵커·이미지·마커 같은 공간 인식 기능을 "엔티티 + 컴포넌트" 모델로 통일한다. 앱은 필요한 능력(capability)을 켠 컨텍스트를 만들고, 비동기로 얻은 불변 스냅샷에서 컴포넌트 데이터를 질의한다.
tags: [xr, openxr, spatial-entity, anchors, plane-detection, scene-understanding, persistence, ecs, extension]
related: [graphics-xr/plane-detection-anchors-spatial-mapping, graphics-xr/shared-spatial-anchors, graphics-xr/openxr-webxr-architecture, graphics-xr/passthrough-depth-occlusion, graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/coordinate-systems-handedness]
sources:
  - https://github.com/KhronosGroup/OpenXR-Docs/blob/main/specification/sources/chapters/extensions/ext/ext_spatial_entity.adoc
  - https://github.com/KhronosGroup/OpenXR-Docs/blob/main/specification/sources/chapters/extensions/ext/ext_spatial_anchor.adoc
  - https://github.com/KhronosGroup/OpenXR-Docs/blob/main/specification/sources/chapters/extensions/ext/ext_spatial_plane_tracking.adoc
  - https://github.com/KhronosGroup/OpenXR-Docs/blob/main/specification/sources/chapters/extensions/ext/ext_spatial_persistence.adoc
  - https://registry.khronos.org/OpenXR/specs/1.1/man/html/XR_EXT_spatial_entity.html
updatedAt: 2026-11-19
---

> 출처 메모: OpenXR-Docs 저장소(main 브랜치)의 `ext_spatial_entity.adoc`(전체 약 2600줄 중 개요·능력·컨텍스트·엔티티 표현·스냅샷·추적 상태·공통 컴포넌트 절과 Issues), 앵커·평면 추적·영속성 확장의 개요 절을 직접 읽었다. `XR_EXT_spatial_entity` 가 비준(ratified) 확장이고 `XR_EXT_future` 에 의존한다는 점은 레지스트리 매뉴얼 페이지에서 확인했다. 이미지·마커·객체 추적, 메시 추적, 영속 연산 확장의 세부, 벤더별 구 확장(`XR_FB_*`, `XR_META_*`, `XR_MSFT_*`)과의 대응은 읽지 못했다. 아래 호출 흐름은 사양 서술을 따라 쓴 의사 코드이며 컴파일하지 않았다. 확장 이름·가용성은 런타임별로 다르다.

## 문제

공간 인식 기능은 벤더마다 따로 노출됐다. 평면, 앵커, 메시, 이미지 추적이 각기 다른 객체·이벤트·질의 방식을 쓰면 앱은 기능마다 다른 코드를 짜고 런타임을 바꿀 때 다시 짠다. [평면 감지·앵커](/develop-wiki/knowledge/graphics-xr/plane-detection-anchors-spatial-mapping/)나 [공유 앵커](/develop-wiki/knowledge/graphics-xr/shared-spatial-anchors/)에서 보는 개념도 API 형태가 제각각이다.

## 해법: 엔티티·컴포넌트·능력

사양은 이 확장을 "공간 이해와 추론의 개념과 기초" 라고 소개한다. 구체 기능은 정의하지 않고 공통 틀만 둔다.

| 개념 | 뜻 |
| --- | --- |
| **공간 엔티티** | 공간에 있는 것. 물리(벽·의자), 가상(다른 앱·사용자가 놓은 콘텐츠), 앱 정의(거실로 표시한 영역)가 모두 가능. 컨트롤러·시선은 엔티티가 아니다 |
| **컴포넌트** | 엔티티에 붙는 데이터·동작. 엔티티는 컴포넌트 종류당 최대 하나만 가진다 (Entity-Component 모델) |
| **능력(capability)** | 앵커, 평면 감지, 이미지 추적 같은 기능 단위. 능력마다 엔티티에 반드시 붙는(보장) 컴포넌트 종류가 정해져 있다. 각 능력은 대개 별도 확장이다 |
| **능력 기능(feature)** | 능력을 조정하는 매개변수(예: 추적 이미지가 고정인지) |
| **컨텍스트** | 능력을 켜고 설정한 뒤 엔티티와 상호작용하는 단위(`XrSpatialContextEXT`) |
| **스냅샷** | 어느 시점의 엔티티·컴포넌트를 일관되게 본 불변 뷰 |

공통 컴포넌트로 `BOUNDED_2D`(평면 영역), `BOUNDED_3D`(경계 상자), `PARENT`(부모 엔티티 참조), `MESH_3D`(메시)가 이 확장에 정의된다. 평면 추적 확장은 능력 `XR_SPATIAL_CAPABILITY_PLANE_TRACKING_EXT` 와 평면 의미 레이블 컴포넌트를, 앵커 확장은 `XR_SPATIAL_CAPABILITY_ANCHOR_EXT` 와 `XR_SPATIAL_COMPONENT_TYPE_ANCHOR_EXT` 컴포넌트를 더한다.

### 호출 흐름

```ts
// 의사 코드: 이름은 사양에서 확인한 것, 인자는 생략
caps = xrEnumerateSpatialCapabilitiesEXT(system);                // 이 기기가 지원하는 능력
comps = xrEnumerateSpatialCapabilityComponentTypesEXT(PLANE_TRACKING);
future = xrCreateSpatialContextAsyncEXT(session, { capabilityConfigs: [planeConfig(comps)] });
ctx = xrCreateSpatialContextCompleteEXT(future);                 // xrPollFutureEXT 로 READY 대기

onEvent(XrEventDataSpatialDiscoveryRecommendedEXT, () => {       // 런타임이 "지금 발견하라" 고 알림
  f = xrCreateSpatialDiscoverySnapshotAsyncEXT(ctx, { componentTypes: [BOUNDED_2D, PARENT] });
  snap = xrCreateSpatialDiscoverySnapshotCompleteEXT(f);
  result = xrQuerySpatialComponentDataEXT(snap, condition);      // 엔티티 ID, 추적 상태, 컴포넌트 데이터
  // 계속 추적할 엔티티는 ID → xrCreateSpatialEntityFromIdEXT → 핸들
  // 이후 xrCreateSpatialUpdateSnapshotEXT(ctx, { entities }) 로 최신 데이터 갱신
  xrDestroySpatialSnapshotEXT(snap);
});
```

핵심 규칙은 다음과 같다.

- **비동기**: 컨텍스트와 발견 스냅샷 생성은 `XrFutureEXT` 를 반환하는 Async/Complete 쌍이다. 여러 요청을 동시에 낼 수 있고 런타임은 완료 순서를 바꾸거나 전력·발열 때문에 지연시킬 수 있다.
- **불변 스냅샷**: 스냅샷의 데이터는 유효한 동안 변하지 않는다. 메모리를 쓰므로 다 쓰면 반드시 파괴한다.
- **발견 권고 이벤트**: `XrEventDataSpatialDiscoveryRecommendedEXT` 를 기다리면 같은 엔티티를 중복 조회하는 낭비와 스로틀링을 피한다. 이 이벤트는 기존 엔티티 데이터의 변경을 알리는 용도가 아니다. 변경은 엔티티 핸들로 **갱신 스냅샷**을 만들어 읽는다.
- **엔티티 ID 와 핸들**: ID(`XrSpatialEntityIdEXT`)는 그것이 발견된 컨텍스트 안에서 유효하고 같은 세션 안에서도 재사용되지 않는다. 지속적으로 갱신받고 싶은 것만 ID 로 핸들을 만든다.
- **추적 상태**: `TRACKING`, `PAUSED`, `STOPPED`. 런타임은 앱이 포커스를 잃거나 너무 멀거나 추적 대상이 너무 많으면 `PAUSED` 로 바꿀 수 있고, 재위치 추정에 실패하는 등 복구 불가능하면 `STOPPED` 로 바꾸며 `STOPPED` 는 되돌아오지 않는다. `TRACKING` 일 때만 질의 버퍼에 유효 데이터가 들어간다.
- **영속성**: 앵커 확장은 영속화 기능을 직접 제공하지 않고 다른 확장에 맡긴다. `XR_EXT_spatial_persistence` 는 영속된 엔티티를 `XrUuid` 로 앱·세션을 넘어 식별하게 한다([공유 앵커](/develop-wiki/knowledge/graphics-xr/shared-spatial-anchors/)의 영속 범위 설명과 이어진다).

## 비교

| 항목 | 이 모델(EXT) | 벤더 확장 시대 방식 |
| --- | --- | --- |
| 구조 | 엔티티 + 컴포넌트 + 능력으로 통일 | 기능별 객체·질의 (이 노트에서 세부 미확인) |
| 결과 | 스냅샷에서 일괄 질의 | 기능별 API |
| 이식성 | 능력·컴포넌트를 열거해 런타임별 지원 분기 | 벤더 코드 경로 분기 |

## 언제 쓰나

- 평면·앵커·마커 같은 공간 기능을 여러 런타임에 걸쳐 같은 구조로 다루고 싶을 때.
- 가구 레이아웃 인식처럼 평면(`BOUNDED_2D`)과 객체(`BOUNDED_3D`)를 함께 쓰는 장면 이해 앱.
- 앵커에 가상 물체를 붙여 시스템 재중심화에도 흔들리지 않게 하려는 경우(앵커 확장의 설명).

## 주의/비용

- **추상적이다.** 확장 자체는 구체 기능이 없고 능력 확장이 따로 필요하다. 런타임이 어떤 능력·컴포넌트를 지원하는지는 반드시 열거로 확인한다.
- **하나의 실제 사물이 여러 엔티티일 수 있다.** 사양의 Issues 는 같은 테이블이 평면 추적과 객체 추적에서 각각 엔티티로 나오거나 런타임이 하나로 합칠 수 있다고 한다. 합치기는 런타임 마음이며, 컴포넌트 데이터가 충돌하면 별개 엔티티로 둔다. 앱은 엔티티와 사물을 일대일로 가정하면 안 된다.
- 비동기·스냅샷·핸들 수명 관리가 코드량을 늘린다. 스냅샷·핸들을 정리하지 않으면 메모리가 샌다.
- 권한(공간 데이터 접근), 업데이트 빈도, 정확도는 기기·런타임마다 다르다. 이 노트는 정책을 확인하지 않았다.
- 좌표는 엔티티 컴포넌트가 공간(Space) 기준 포즈로 내놓으므로 [좌표계 규약](/develop-wiki/knowledge/graphics-xr/coordinate-systems-handedness/)과 기준 공간을 일치시킨다(이 항목은 일반 원칙이며 사양 원문 인용이 아니다).
