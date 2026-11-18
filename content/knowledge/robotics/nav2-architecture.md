---
title: Nav2 구조 — 서버·행동 트리·플러그인
aka: [Nav2, Navigation2, ROS 2 Navigation Stack, BT Navigator, Behavior Tree Navigation]
category: robotics
group: software
level: intermediate
summary: ROS 2 내비게이션 스택 Nav2 는 플래너·컨트롤러·스무더·비헤이비어 서버를 독립 액션 서버로 두고, 행동 트리가 이들을 호출해 순서와 복구 동작을 정한다. 서버와 플러그인의 역할 분담을 정리한다.
tags: [robotics, ros2, nav2, behavior-tree, navigation, costmap, lifecycle]
related: [robotics/pure-pursuit-dwa-local-planning, robotics/astar-grid-planning, robotics/coordinate-frames-tf, robotics/particle-filter-mcl, robotics/slam-concepts, robotics/ros2-communication-qos, robotics/robot-safety-iso-10218]
sources:
  - https://docs.nav2.org/jazzy/getting_started/navigation_concepts/navigation_servers/
  - https://docs.nav2.org/rolling/
  - https://arxiv.org/abs/2003.00368
  - https://github.com/ros-navigation/navigation2
updatedAt: 2026-11-19
---

## 문제

"A 지점으로 가라" 는 한 줄 명령 뒤에는 경로 계획, 경로 추종, 장애물 회피, 막혔을 때의 복구, 지도·위치 추정이 얽혀 있다. 이를 하나의 거대한 노드나 상태 머신에 넣으면 알고리즘을 바꿀 때마다 전체를 건드리게 되고, 복구 전략("막히면 후진하고 다시 계획")이 코드 안에 박힌다. 이전 세대 ROS 내비게이션 스택의 한계를 넘기 위해 만든 것이 Nav2 이며, 행동 트리로 모듈형 서버들을 지휘하는 구조가 핵심이다(Macenski 외, IROS 2020).

## 해법: 서버 + 행동 트리 + 플러그인

Nav2 는 일을 **독립 서버**로 쪼갠다. 각 서버는 ROS 2 액션 인터페이스를 노출하고, 행동 트리(BT) 노드가 "틱" 될 때 해당 액션을 호출한다. 공식 문서의 서버 설명을 정리하면 다음과 같다.

| 서버 | 하는 일 |
| --- | --- |
| BT Navigator | 행동 트리를 실행하는 조정자. `NavigateToPose`, `NavigateThroughPoses` 같은 작업 인터페이스를 제공 |
| Planner Server | 전역 환경 표현(전역 코스트맵)으로 목표까지의 경로를 계산하는 플러그인을 호스팅 |
| Controller Server | 지역 환경 표현(지역 코스트맵)을 보며 경로를 따라가는 제어 명령을 계산하는 플러그인을 호스팅 |
| Smoother Server | 경로를 받아 거칠기·급회전을 줄이고 장애물과의 간격을 늘린 경로를 돌려준다 |
| Behavior Server | 후진, 제자리 회전, 코스트맵 비우기 같은 복구 동작을 호스팅. 컨트롤러 서버의 지역 코스트맵을 구독해 중복을 피한다 |
| Route Server | 자유 공간이 아니라 미리 정의된 노드·방향 간선 그래프 위에서 경로를 찾는 특화 플래너 |
| Waypoint Follower | 웨이포인트를 차례로 방문하고 각 지점에서 작업 플러그인을 실행하는 샘플 응용 |

그 밖에 설정 가이드에는 Collision Monitor, Docking Server, Map Server, Lifecycle Manager 등이 핵심 서버로 나열된다.

```
BT Navigator ──(액션)──▶ Planner Server    (ComputePathToPose)
      │        ──(액션)──▶ Smoother Server
      │        ──(액션)──▶ Controller Server (FollowPath) ──▶ 속도 명령
      └────────(액션)──▶ Behavior Server   (BackUp, Spin, ...)
```

### 플러그인

서버는 알고리즘을 직접 갖지 않고 pluginlib 플러그인을 로드한다. 플러그인에는 런타임 별칭이 붙는다. 공식 문서의 컨트롤러 예시는 DWB 플러그인을 `FollowPath` 별칭으로 두는 것이다. 구성 가이드에는 플래너(NavFn, Smac, Theta Star), 컨트롤러(DWB, Graceful, MPPI, Regulated Pure Pursuit, Rotation Shim)가 분류돼 있다. 즉 "경로 계획 알고리즘을 바꾼다"는 것은 YAML 의 플러그인 이름을 바꾸는 일에 가깝다. 컨트롤러 알고리즘 비교는 [Pure Pursuit·DWA](/develop-wiki/knowledge/robotics/pure-pursuit-dwa-local-planning/) 노트를 본다.

### 행동 트리가 하는 일

BT 노드는 서버 액션을 부르는 얇은 플러그인이다. 트리는 XML 로 쓰고, "경로 계산 → 추종, 실패하면 코스트맵 비우기 → 후진 → 재시도" 같은 복구 정책을 코드가 아니라 트리 구조로 표현한다. 정책을 바꿔도 C++ 재빌드 없이 XML 만 고치면 된다.

### 생명주기

Nav2 의 서버들은 ROS 2 라이프사이클 노드이며, Lifecycle Manager 가 전이를 관리한다(구성 → 활성화 순서를 통제해 일부만 켜진 상태를 막는다).

## 입력: 위치 추정과 환경 표현

Nav2 자체는 위치 추정기가 아니다. 문서의 큰 틀은 행동 트리, 내비게이션 서버, **상태 추정**(지역화·오도메트리·센서 융합), **환경 표현**(코스트맵·맵 서버) 네 축이다. 실무에서는 [REP-105 프레임](/develop-wiki/knowledge/robotics/coordinate-frames-tf/) 이 맞아야 시작할 수 있다. 지도 기반이면 [AMCL 같은 MCL](/develop-wiki/knowledge/robotics/particle-filter-mcl/), 지도가 없으면 [SLAM](/develop-wiki/knowledge/robotics/slam-concepts/)이 `map → odom` 을 공급한다. 전역 경로의 기본 아이디어는 [A* 격자 계획](/develop-wiki/knowledge/robotics/astar-grid-planning/) 에서 볼 수 있다.

## 언제 쓰나

- ROS 2 기반 이동 로봇(차동·전방향·자동차형)이 지도 위에서 목표 지점·웨이포인트로 이동할 때.
- 알고리즘(플래너·컨트롤러)을 로봇·환경별로 갈아 끼우거나, 복구 정책을 현장에서 조정해야 할 때.

## 주의/비용

- 구성이 많다. 프레임 트리, 센서 토픽, 코스트맵 레이어, 서버별 YAML 이 모두 맞아야 첫 이동이 된다. 증상이 "안 움직인다" 한 가지여도 원인은 여러 서버에 흩어져 있다.
- 서버 간 액션 호출과 지역 코스트맵 갱신은 DDS 통신 위에 있다. QoS·지연 설정이 나쁘면 제어 주기가 흔들린다([QoS](/develop-wiki/knowledge/robotics/ros2-communication-qos/), [실시간성](/develop-wiki/knowledge/robotics/realtime-dds-latency/)).
- Nav2 는 2D 평면 이동 중심의 스택이다. 매니퓰레이터 동작 계획이나 3D 비행 로봇에는 그대로 맞지 않는다.
- 안전 보장 도구가 아니다. 충돌 감시(Collision Monitor)가 있어도 인증 가능한 안전 기능은 별도 하드웨어·절차가 필요하다([로봇 안전](/develop-wiki/knowledge/robotics/robot-safety-iso-10218/)).
- 문서 URL 과 파라미터 이름은 배포판(Humble, Jazzy 등)에 따라 달라진다. 사용 배포판의 문서를 확인한다.
