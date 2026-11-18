---
title: Nav2 코스트맵 — 레이어와 인플레이션
aka: [Nav2 Costmap, costmap_2d, Inflation Layer, Costmap Layers, 코스트맵 인플레이션]
category: robotics
group: planning
level: intermediate
summary: 코스트맵은 0~255 정수 비용을 가진 2D 격자이고, 정적·장애물·인플레이션 같은 레이어가 차례로 쌓인다. 인플레이션은 장애물 주변에 지수로 줄어드는 비용 장을 만들어 플래너를 벽에서 떼어 놓는다.
tags: [robotics, ros2, nav2, costmap, inflation, navigation, planning]
related: [robotics/nav2-architecture, robotics/astar-grid-planning, robotics/pure-pursuit-dwa-local-planning, robotics/slam-concepts, robotics/behavior-tree-vs-state-machine, robotics/sensor-fusion-time-sync]
sources:
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/getting_started/navigation_concepts/environmental_representation.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/core_servers/costmap_2d/costmap_plugins/inflation.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/tuning_guide.md
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_costmap_2d/include/nav2_costmap_2d/inflation_layer.hpp
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_costmap_2d/include/nav2_costmap_2d/cost_values.hpp
updatedAt: 2026-11-19
---

> 출처 메모: docs.nav2.org 사이트의 옛 경로는 이동·개편 중이라 문서 저장소(rolling 브랜치)의 원문 마크다운과 navigation2 소스 헤더를 직접 읽었다. 코스트맵 레이어 구조를 처음 제안한 논문(Lu 외, layered costmaps)은 읽지 못했다. 파라미터 기본값은 rolling 기준이라 배포판별로 다를 수 있다.

## 문제

플래너와 컨트롤러는 "어디가 막혔나" 를 하나의 표로 물어야 한다. 라이다, 깊이 카메라, 저장된 지도, 접근 금지 구역이 각자 다른 형식으로 들어오는데, 이를 알고리즘마다 따로 처리하면 센서를 하나 바꿀 때마다 계획·제어 코드를 건드리게 된다. 또 로봇은 점이 아니라 몸체가 있다. 장애물 "셀" 만 피하면 몸체가 벽을 긁는다.

## 해법: 레이어 + 비용 격자

Nav2 의 환경 표현은 균일한 2D 격자 코스트맵이다. 각 셀은 미지, 자유, 점유, 인플레이션된 비용 중 하나를 담는다. 코스트맵에 정보를 넣는 일은 pluginlib 레이어가 맡는다.

| 레이어 | 역할 |
| --- | --- |
| StaticLayer | SLAM·지도 서버가 만든 지도를 바탕으로 벽·방 구조를 깐다 |
| ObstacleLayer | 2D 라이다 등 평면 센서의 장애물 표시 |
| VoxelLayer | 3D 정보(깊이 카메라, 비평면 라이다)를 레이캐스트 방식으로 반영 |
| InflationLayer | 장애물 주변에 비용을 퍼뜨린다 |
| 코스트맵 필터 | KeepoutFilter, SpeedFilter 등 지도 위 구역에 규칙을 붙인다 |

전역 코스트맵은 [플래너 서버](/develop-wiki/knowledge/robotics/nav2-architecture/)가 전체 경로를 구할 때, 지역 코스트맵은 컨트롤러가 주변을 보며 속도를 낼 때 쓴다. 레이어를 합칠 때의 기본 방식은 최대값이다(셀마다 레이어 값 중 큰 값이 남는다).

### 비용 값

소스 헤더의 상수는 다음과 같다.

| 값 | 이름 | 뜻 |
| --- | --- | --- |
| 255 | NO_INFORMATION | 미지 |
| 254 | LETHAL_OBSTACLE | 장애물 셀 자체 |
| 253 | INSCRIBED_INFLATED_OBSTACLE | 이 셀에 로봇 중심이 있으면 (내접원 기준) 반드시 충돌 |
| 252 | MAX_NON_OBSTACLE | 장애물이 아닌 셀의 최대 비용 |
| 0 | FREE_SPACE | 자유 |

### 인플레이션 공식

`inflation_layer.hpp` 의 `computeCost` 를 정리하면, 장애물에서 거리 d 에 대해 다음과 같다. r_ins 는 로봇의 내접 반경, k 는 `cost_scaling_factor`(기본 10), 반경 `inflation_radius` 의 기본값은 0.55 m 다.

- d = 0 이면 254
- 0 < d ≤ r_ins 이면 253
- 그 밖에는 `trunc(252 · exp(-k · (d - r_ins)))`

내접 반경 안은 "충돌 확정" 으로 막고, 그 바깥에서는 지수로 줄어드는 경사를 만들어 준다. 공식 설명도 장애물 주변에 지수 감쇠 함수를 둔다고 말한다.

```ts
const LETHAL = 254, INSCRIBED = 253;
export function inflationCost(d: number, inscribed: number, k: number): number {
  if (d <= 0) return LETHAL;
  if (d <= inscribed) return INSCRIBED;
  return Math.trunc((INSCRIBED - 1) * Math.exp(-k * (d - inscribed)));
}
```

(내접 반경 0.22 m 로 실행: k=10 이면 거리 0.3 m 에서 113, 0.4 m 에서 41, 0.55 m 에서 9 이다. k=3 이면 0.3 m 에서 198, 0.55 m 에서 93. 비용이 절반이 되는 거리는 ln2/k 로 k=10 이면 약 6.9 cm, k=3 이면 약 23 cm 이다.)

## 튜닝의 요점

- 공식 튜닝 가이드의 핵심 메시지는 인플레이션을 "벽 바로 앞만 막는 장치" 로 쓰지 말라는 것이다. 복도·통로에서는 지도 전체에 완만한 비용 장(potential field)을 만들어, NavFn·Theta*·Smac 같은 비용 인식 플래너가 자유 공간 한가운데로 경로를 잡게 하라고 권한다. 이를 위해 `cost_scaling_factor` 와 `inflation_radius` 를 같이 조정한다.
- 두 값은 짝이다. 문서상 인플레이션은 `inflation_radius` 안에서만 일어나므로 반경이 비용 장의 끝을 자른다. k 가 작고 반경이 짧으면 끝에서 비용이 큰 채로 뚝 끊긴다(위 예: k=3, 반경 0.55 → 끝 비용 93). k 가 크고 반경이 길면 반경 끝에 닿기 전에 비용이 0 이 되어 반경 설정이 무의미하다. 이 경계 분석은 위 공식에서 직접 계산한 것이다.
- 로봇이 원형이 아니면 원 근사 대신 실제 footprint 를 주라는 것이 같은 가이드의 권고다. 플래너·컨트롤러가 좁은 곳에 들어갈 수 있다. `custom_inscribed_radius` 는 내접 반경을 덮어쓰는데, 문서가 안전 문제를 일으킬 수 있다고 경고하므로 특별한 컨트롤러가 아니면 건드리지 않는다.
- 센서 종류에 맞는 레이어를 쓴다. 평면 라이다는 ObstacleLayer, 3D 센서는 VoxelLayer 또는 시공간 복셀 레이어. 레이어를 늘릴수록 코스트맵 갱신 비용이 커진다.

## 언제 쓰나

- Nav2 기반 이동 로봇의 장애물 회피, 접근 금지 구역·속도 제한 구역 지정.
- 경로가 벽에 너무 붙는다, 좁은 문에서 흔들린다 같은 증상을 인플레이션 파라미터로 다루고 싶을 때.

## 주의/비용

- **2D 표현의 한계**: 책상 상판처럼 센서 높이 밖에 있는 장애물은 평면 라이다에 안 보인다. 3D 레이어로 보완해야 한다.
- 인플레이션 계산 비용은 격자 크기와 반경에 비례한다. 최신 문서에는 OpenMP 병렬화 옵션이 있으며(기본 꺼짐), 문서 벤치마크(2000x2000 격자, 반경 2 m, 16코어)에서 9.11 ms 였다고 한다. 이는 그 하드웨어 기준이다.
- 비용 값은 플래너마다 해석이 다르다. 253 을 "통과 불가" 로 쓰는지, 비용 가중으로 쓰는지는 플래너 설정을 확인한다.
- 미지 셀 처리(`inflate_unknown`, `inflate_around_unknown`)는 기본 꺼짐이다. SLAM 중 미지 영역을 통과 가능으로 볼지 정책으로 정한다.
- 코스트맵에 남은 오래된 장애물 때문에 경로가 막힌 것처럼 보일 때를 위해 Nav2 는 코스트맵 비우기 BT 노드(ClearEntireCostmap 등)를 제공하고 복구 정책은 [행동 트리](/develop-wiki/knowledge/robotics/behavior-tree-vs-state-machine/)에서 정한다.
- 좌표 프레임·시간 동기가 틀리면 장애물이 엉뚱한 곳에 찍힌다([TF](/develop-wiki/knowledge/robotics/coordinate-frames-tf/), [시간 동기](/develop-wiki/knowledge/robotics/sensor-fusion-time-sync/)).
