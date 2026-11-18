---
title: 평면 검출·앵커·공간 맵핑
aka: [Plane Detection, Anchors, Spatial Mapping, Scene Mesh, Hit Test, Trackable, Persistent Anchor, Depth API, Occlusion]
category: graphics-xr
group: tracking
level: intermediate
summary: AR 이 가상 물체를 현실에 붙이는 방법. 환경에서 평면·메시를 찾고(검출·맵핑), 물체를 앵커에 붙여 추적 보정에도 제자리를 유지시킨다. 앵커 개수·재사용·영속화가 설계 포인트다.
tags: [ar, anchors, plane-detection, arcore, arkit, spatial-mapping, hit-test]
related: [graphics-xr/six-dof-inside-out-tracking-slam, graphics-xr/hand-eye-tracking-interaction, graphics-xr/openxr-webxr-architecture, graphics-xr/pbr-material-model]
sources:
  - https://developers.google.com/ar/develop/anchors
  - https://developer.apple.com/documentation/arkit/arplaneanchor
  - https://www.w3.org/TR/webxr/
  - https://registry.khronos.org/OpenXR/specs/1.1/html/xrspec.html
updatedAt: 2026-11-19
---

## 문제

AR 물체를 "현실의 책상 위" 에 놓았는데, 시간이 지나면 둥둥 떠다니거나 미끄러진다. 추적(SLAM)이 환경 이해를 계속 수정하기 때문에, 처음 계산한 **월드 좌표를 그대로 두면** 현실과 어긋난다. 또 가상 물체가 현실 물체 뒤로 가도 앞에 그려지면 합성이 깨진다.

## 해법

### 환경 이해 3층

| 층 | 무엇을 | 용도 |
| --- | --- | --- |
| 평면 검출 | 바닥·벽·책상을 사각/다각형 평면으로 | 물체 배치, 충돌 바닥 |
| 히트 테스트(레이캐스트) | 화면/손/컨트롤러 광선과 환경의 교점 | "여기에 놓기" |
| 공간 맵핑(메시·깊이) | 환경 삼각형 메시나 깊이 맵 | 가림(occlusion), 물리, 길찾기 |

ARCore 는 평면을 **Trackable**(추적 대상)로 다루고, ARKit 은 `ARPlaneAnchor` 로 검출된 평면을 앵커 형태로 제공한다. 이름만 다르고 개념은 같다: "시스템이 지속적으로 갱신하는 환경 요소".

### 앵커

앵커는 "이 현실 지점에 붙어 있어라" 라는 약속이다. 시스템이 환경 추정을 고칠 때 앵커의 pose 도 같이 갱신되므로, 앵커에 붙인 물체는 현실과 어긋나지 않는다. ARCore 문서의 요점:

- 앵커는 Trackable(예: 평면)에 붙이거나, 세션에 붙여 월드 공간 고정 위치에 둔다.
- **가까운 물체는 같은 앵커를 재사용**한다. 물체마다 앵커를 따로 만들면 각 앵커가 독립적으로 보정되어, 물체끼리의 상대 위치가 시간이 지나며 미세하게 어긋날 수 있다. 앵커 수가 많으면 CPU 비용도 든다.
- 책상 위 램프 두 개 + 바닥 의자 하나 → 앵커 2개(책상 평면, 바닥 평면).

```ts
// 의사 코드: 히트 테스트 → 앵커 → 물체를 앵커 pose 에 매 프레임 동기화
const hit = session.hitTest(ray)[0];
const anchor = await hit.createAnchor();
scene.add(lamp);
onFrame(frame => { lamp.matrix = frame.getPose(anchor.space).matrix; });
```

WebXR 와 OpenXR 에서는 스펙/확장에 따라 앵커·평면·깊이가 **선택 기능(feature/extension)** 이다. 지원 여부를 요청 시점에 선언하고(WebXR: optionalFeatures, OpenXR: 확장 enable) 런타임이 지원하지 않으면 대체 경로를 둔다.

### 영속화

세션이 끝나도 같은 장소에 물체를 두려면 앵커를 저장·복원하는 플랫폼 기능(클라우드/공유 앵커, 영속 앵커)을 쓴다. 저장 가능한 수·수명·공유 범위는 플랫폼마다 달라, 설계 전에 문서를 확인한다(여기서는 각 플랫폼의 세부 한도를 확인하지 않았다).

## 언제 쓰나

- 가구·인테리어 배치, 측정, 게임 판 놓기: 평면 + 히트 테스트 + 앵커.
- 가림과 상호작용: 깊이 API/메시로 가상 물체가 소파 뒤에 숨게.
- 멀티유저 공유 공간: 공유 앵커.

## 주의 / 비용

- **평면은 확정이 아니라 추정**이다. 면적이 커지거나 합쳐지고, 때로 사라진다. 평면 ID 에 로직을 묶지 말고 앵커를 쓴다.
- 앵커 남발은 CPU·추적 부하. 근접 물체는 묶는다.
- 투명·반사·무늬 없는 면은 평면 검출이 어렵다. 안내 UI("천천히 둘러보세요")가 필요하다.
- 메시·깊이 데이터는 공간 정보 = 개인정보다. 서버로 보내지 않는 설계를 기본으로, 수집 시 동의·고지를 명확히 한다.
- 스케일: 폰 단안 AR 은 초기에 스케일 오차가 있을 수 있다.
- [조명 추정](graphics-xr/pbr-material-model) 없이 놓은 물체는 합성감이 떨어진다.

## 개발자에게 왜 중요한가

AR 품질은 렌더링보다 "붙어 있느냐" 로 먼저 평가된다. 추적 오차를 앵커가 흡수한다는 구조를 알면, 좌표를 직접 저장하는 실수([SLAM 드리프트](graphics-xr/six-dof-inside-out-tracking-slam))를 피할 수 있다.
