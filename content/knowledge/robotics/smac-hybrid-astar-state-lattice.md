---
title: Smac 플래너 — Hybrid-A*·State Lattice 와 풋프린트 충돌 검사
aka: [Smac Planner, SmacPlannerHybrid, SmacPlannerLattice, Hybrid A*, State Lattice, SE2 Collision Checking, Footprint Collision Check]
category: robotics
group: planning
level: advanced
summary: 자동차형·비원형 로봇은 (x, y, θ) 로 계획해야 주행 가능한 경로가 나온다. Hybrid-A* 는 셀마다 연속 상태 하나를 두고, State Lattice 는 미리 만든 제어 집합으로 확장하며, 둘 다 방향 구간별로 미리 회전해 둔 풋프린트로 충돌을 검사한다.
tags: [robotics, nav2, smac, hybrid-astar, state-lattice, planning, nonholonomic, footprint, collision-checking]
related: [robotics/astar-grid-planning, robotics/nav2-costmap-inflation, robotics/nav2-architecture, robotics/sampling-based-planning, robotics/pure-pursuit-dwa-local-planning, robotics/trajectory-velocity-profile, robotics/coordinate-frames-tf]
sources:
  - https://cdn.aaai.org/Workshops/2008/WS-08-10/WS08-10-006.pdf
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_smac_planner/README.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/planners_plugins/smac/index.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/planners_plugins/smac/smac_hybrid/configuring_smac_hybrid.md
  - https://github.com/ros-navigation/docs.nav2.org/blob/rolling/docs/configuration_and_development/configuration_guide/planners_plugins/smac/smac_lattice/configuring_smac_lattice.md
  - https://github.com/ros-navigation/navigation2/blob/main/nav2_smac_planner/src/collision_checker.cpp
updatedAt: 2026-11-19
---

> 출처 메모: Hybrid-A* 원 논문(Dolgov 외, STAIR-08 워크숍판), Nav2 Smac 의 README·파라미터 문서(rolling 브랜치 원문 마크다운), 충돌 검사기 소스(`collision_checker.cpp`)를 직접 읽었다. State Lattice 의 원 논문(Pivtoraiko & Kelly), Reeds-Shepp·Dubins 원 논문, 충돌 검사기에 넘기는 `possible_collision_cost` 가 인플레이션 레이어에서 어떻게 계산되는지는 읽지 못했다. 기본값은 rolling 문서 기준이라 배포판마다 다를 수 있다.

## 문제

[격자 A*](/develop-wiki/knowledge/robotics/astar-grid-planning/)는 로봇을 한 점으로 보고 셀 중심을 이어 경로를 만든다. 이 경로는 꺾인 선분이라 조향이 제한된 로봇(자동차형, 지게차형)은 그대로 따라갈 수 없고, 직사각형 로봇은 "중심은 통과하지만 몸체가 걸리는" 경로를 받게 된다. 해법은 상태를 (x, y, θ) 로 늘리고 운동학이 허용하는 이동만 확장하는 것이다.

## 해법 1: Hybrid-A*

Dolgov 외의 아이디어는 A* 의 격자를 그대로 두되 **각 셀에 연속 상태 하나를 붙이는 것**이다. 일반 A* 는 셀 중심만 방문하지만, 여기서는 차량 모델로 짧게 굴린 연속 좌표를 노드로 삼고, 같은 이산 셀에 들어온 상태끼리만 병합한다. 논문은 이 병합 때문에 최소 비용을 보장하지 못하지만 결과 경로가 **주행 가능함은 보장**한다고 밝힌다.

논문의 나머지 장치는 다음과 같다.

- 휴리스틱 둘의 최댓값을 쓴다. 하나는 장애물을 무시하고 비홀로노믹 제약만 반영한 최단 거리(목표 주변에서 미리 계산해 두고 이동·회전해 재사용), 다른 하나는 운동학을 무시하고 장애물만 반영한 2D 동적계획 거리다. 둘 다 허용적이다. 첫째는 엉뚱한 방향으로 목표에 접근하는 가지를, 둘째는 U 자 장애물·막다른 길을 걸러 낸다. 논문의 한 장면에서 확장 노드 수는 유클리드 2만 1515개, 비홀로노믹 휴리스틱 1465개(막다른 길이 많은 장면은 6만 8730개), 둘을 합치면 1만 588개였다.
- **해석적 확장**: 노드 N 개 중 하나마다 Reeds-Shepp 최단 경로를 장애물 없는 가정으로 목표까지 이어 보고, 충돌이 없을 때만 자식으로 추가한다. 이산 조향만으로는 정확한 목표 자세에 닿지 못하는 문제를 푼다. N 은 목표에 가까울수록 작아진다.
- 후진과 방향 전환(기어 변경)에는 벌점을 준다.
- 탐색 뒤에 켤레 기울기 방식으로 경로를 국소 최적화·평활화한다.

## 해법 2: State Lattice

Nav2 문서는 State Lattice 를 **미리 계산한 최소 제어 집합**(차동, 전방향, 아커만, 다리 로봇용 제공, 직접 제작 가능)으로 확장하는 Pivtoraiko & Kelly 방식의 변형이라고 설명한다. Hybrid-A* 와 휴리스틱·탐색 최적화를 공유한다. 차이는 다음과 같다.

- 제어 집합이 코스트맵 해상도에 묶여 있어서 **최소 회전 반경이 파라미터가 아니라 제어 집합 생성 시점에 정해지고**, 코스트맵 다운샘플링과 경로 평활화는 지원하지 않는다.
- 제어 집합에 제자리 회전이 있으면 `rotation_penalty`(기본 5.0)로 억제한다.
- `allow_reverse_expansion` 을 켜면 현재 방향의 반대로도 확장하며, 분기가 두 배가 된다.

## Nav2 Smac 의 구성

| 플러그인 | 대상 | 상태 공간 |
| --- | --- | --- |
| `SmacPlanner2D` | 원형 차동·전방향 | 비용 인식 2D A* (4·8 연결) |
| `SmacPlannerHybrid` | 아커만·다리 로봇 | SE2, Dubins 또는 Reeds-Shepp |
| `SmacPlannerLattice` | 비원형·임의 운동학 | SE2, 제어 집합 |

Hybrid 의 주요 기본값(rolling 문서)은 다음과 같다.

| 파라미터 | 기본값 | 의미 |
| --- | --- | --- |
| `motion_model_for_search` | `DUBIN` | `REEDS_SHEPP` 로 바꾸면 후진 허용 |
| `angle_quantization_bins` | 72 | 5° 간격 방향 구간 |
| `minimum_turning_radius` | 0.4 m | 평활화기의 최대 곡률 계산에도 쓰임 |
| `analytic_expansion_ratio` / `_max_length` / `_max_cost` | 3.5 / 3.0 m / 200 | 해석적 확장의 빈도·길이·비용 상한 |
| `reverse_penalty`, `change_penalty`, `non_straight_penalty` | 2.0, 0.0, 1.2 | 후진·조향 변경·비직진 벌점 |
| `cost_penalty` | 2.0 | 코스트맵 비용을 인식하게 하는 벌점 |
| `max_planning_time` | 5.0 s | 탐색 시간 상한 |

`analytic_expansion_max_length` 는 문서가 최소 회전 반경의 4~5 배 아래로 두지 말라고 경고한다(계획 시간이 늘어난다). `cache_obstacle_heuristic` 은 같은 목표로 재계획할 때 장애물 휴리스틱을 재사용하며, 문서는 코스트맵이 대체로 정적이면 약 40 배 빨라진다고 한다. `max_traversal_cost`(기본 252)와 `max_traversal_cost_relief_radius`(2.0 m)를 함께 쓰면 이 캐시를 쓸 수 없다.

문서의 75 m 경로 예시에서 계획 시간은 Hybrid-A* 144 ms, State Lattice 113 ms, 2D A* 243 ms, NavFn 146 ms 였다. 장면 하나에 대한 수치이므로 일반 성능으로 읽으면 안 된다.

## 풋프린트 충돌 검사

Hybrid·Lattice 는 SE2 충돌 검사를 한다. `collision_checker.cpp` 를 읽으면 구조는 이렇다.

1. 방향 구간 수만큼(기본 72) 풋프린트를 **미리 회전해 캐시**한다. 검사 때는 캐시된 다각형을 노드 위치만큼 평행 이동한다.
2. 먼저 중심 셀 비용을 본다. 맵 밖이거나, 중심 비용이 `max_traversal_cost` 를 넘으면(시작·목표 반경 안은 예외) 충돌이다.
3. 풋프린트 모드에서 중심 비용이 `possible_collision_cost` 보다 낮으면 풋프린트 검사를 **건너뛰고** 통과시킨다. 인플레이션이 충분히 넓다는 전제에서 "몸체가 닿을 수 없는 곳" 을 싸게 거르는 지름길이다.
4. 그 이상이면 캐시된 풋프린트의 비용을 읽어 점유(`OCCUPIED_COST`) 이상이면 충돌이다. 미지 영역은 `allow_unknown` 에 따른다.
5. 원 반경 모드(`radius`)는 풋프린트 캐시 없이 중심 셀만 본다.

소스는 `possible_collision_cost` 가 0 이하이면(인플레이션 레이어가 없거나 반경이 부족) 경고를 내고, 인플레이션 반경을 로봇 최대 단면의 절반 이상으로 두라고 권한다. 성능에 크게 영향을 준다고도 적혀 있다. [코스트맵 인플레이션](/develop-wiki/knowledge/robotics/nav2-costmap-inflation/)의 비용 장 설계가 바로 이 검사의 속도와 직결되는 셈이다.

```ts
type P = { x: number; y: number };
export function orientedFootprints(fp: P[], bins: number): P[][] {
  return Array.from({ length: bins }, (_, i) => {
    const th = (2 * Math.PI * i) / bins, c = Math.cos(th), s = Math.sin(th);
    return fp.map(({ x, y }) => ({ x: x * c - y * s, y: x * s + y * c }));
  });
}
export const binOf = (theta: number, bins: number) =>
  Math.round(((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI / bins)) % bins;
```

방향 양자화 오차는 직접 계산해 확인했다. 0.8 x 0.5 m 직사각형(모서리 반지름 0.472 m)에서 72구간이면 최대 방향 오차 2.5°, 모서리가 최대 2.06 cm 어긋난다. 36구간이면 4.12 cm, 16구간이면 9.25 cm 다. 복도 여유가 몇 cm 인 환경에서는 구간 수와 인플레이션 여유를 같이 봐야 한다. 외접원 지름은 0.943 m 로 실제 폭 0.5 m 의 거의 두 배라서, 원 근사는 좁은 문에서 불필요하게 막힌다.

## 비교

| 구분 | 격자 A* / Smac 2D | Hybrid-A* | State Lattice |
| --- | --- | --- | --- |
| 상태 | (x, y) | (x, y, θ) 연속 | (x, y, θ) 격자 |
| 운동학 | 무시 | 회전 반경 제약, Dubins·R-S | 제어 집합에 포함 |
| 후진 | 해당 없음 | R-S 모델에서 | 옵션(`allow_reverse_expansion`) |
| 최적성 | 격자 상 최적 | 보장 없음, 주행 가능성 보장 | 제어 집합 안에서 |
| 준비 | 없음 | 회전 반경만 지정 | 제어 집합 파일 필요 |

## 언제 쓰나

- 아커만·후륜 조향 AMR, 지게차처럼 제자리 회전이 안 되는 로봇의 전역 경로.
- 직사각형·긴 로봇이 좁은 통로·도킹 지점에 들어가야 할 때(풋프린트 검사).
- 특수 운동학이 있어 제어 집합을 직접 설계하고 싶을 때(State Lattice).

## 주의/비용

- **완전성·최적성 보장이 없다.** 해를 못 찾거나 시간 제한(`max_planning_time`)에 걸릴 수 있다. 실패 시 복구는 [행동 트리](/develop-wiki/knowledge/robotics/behavior-tree-vs-state-machine/)에서 설계한다.
- 계획 경로가 주행 가능해도 **컨트롤러가 그 곡률을 추종**해야 한다. 전역 경로 곡률과 [지역 컨트롤러](/develop-wiki/knowledge/robotics/pure-pursuit-dwa-local-planning/)의 한계가 어긋나면 의미가 없다.
- 해석적 확장은 벌점 구조를 우회하는 지름길을 만들 수 있다. 길이·비용 상한을 둔 것이 그 때문이다.
- State Lattice 는 해상도가 바뀌면 제어 집합을 다시 만들어야 하고 평활화가 없다.
- 풋프린트 검사의 지름길은 인플레이션 설정이 부실하면 느려진다. 반대로 인플레이션이 과하면 좁은 곳을 막는다.
- 평활화기는 비용을 인식하지 않는다(문서). 평활화 후 장애물 근처가 달라지지 않는지 시각화 옵션(`debug_visualizations`, 성능을 떨어뜨림)으로 확인한다.
