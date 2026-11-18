---
title: A*와 그리드 경로 계획
aka: [A-star, Grid Path Planning, Occupancy Grid, Costmap, Octile Heuristic, Weighted A*]
category: robotics
group: planning
level: intermediate
summary: 점유 격자 위에서 다익스트라에 휴리스틱을 더해 목표 쪽으로 탐색하는 A*. 이동 모델, 휴리스틱 선택, 장애물 팽창, 경로의 각진 모양 같은 로봇 특유의 쟁점을 다룬다.
tags: [robotics, planning, astar, grid, costmap, navigation]
related: [algorithms/shortest-path, algorithms/bfs-dfs, algorithms/heap-priority-queue, algorithms/graph-representation, robotics/sampling-based-planning, robotics/trajectory-velocity-profile]
sources:
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://lavalle.pl/planning/
  - https://nav2.org
updatedAt: 2026-11-19
---

## 문제

이동 로봇이 지도(점유 격자)에서 시작점에서 목표까지 장애물을 피해 가는 경로를 찾아야 한다. 격자는 곧 그래프이므로 일반 최단 경로 알고리즘([최단 경로](/develop-wiki/knowledge/algorithms/shortest-path/))이 그대로 적용되지만, 격자가 수백만 칸이면 다익스트라처럼 사방으로 퍼지는 탐색은 너무 느리다.

## 해법 — A*

다익스트라는 `g(n)`(출발점에서 n 까지 실제 비용)이 작은 순으로 확장한다. A* 는 `f(n) = g(n) + h(n)` 이 작은 순으로 확장한다. `h(n)` 은 n 에서 목표까지 남은 비용의 추정치(휴리스틱)다. 목표 방향 칸이 먼저 확장된다.

- `h` 가 **허용적**(실제보다 크지 않음)이면 A* 는 최적 경로를 보장한다.
- `h` 가 **일관적**(`h(n) ≤ cost(n,m) + h(m)`)이면 한 번 확장한 칸을 다시 열 필요가 없다.
- `h = 0` 이면 다익스트라, `h` 를 크게 부풀리면(가중 A*) 빠르지만 최적성이 `w` 배 이내로 느슨해진다.

격자 이동 모델별 휴리스틱:

| 이동 | 비용 | 휴리스틱 |
| --- | --- | --- |
| 4방향 | 1 | 맨해튼 |
| 8방향 (대각 √2) | 1, √2 | 옥타일: `(dr+dc) + (√2-2)·min(dr,dc)` |
| 연속 방향 허용 | 유클리드 거리 | 유클리드 |

```python
import heapq, math
def octile(a, b):
    dr, dc = abs(a[0]-b[0]), abs(a[1]-b[1]); return (dr+dc) + (math.sqrt(2)-2)*min(dr,dc)

def astar(free, S, G, h=octile):
    g = {S: 0.0}; pq = [(h(S, G), S)]; closed = set()
    while pq:
        _, u = heapq.heappop(pq)
        if u in closed: continue
        closed.add(u)
        if u == G: return g[G]
        for dr in (-1,0,1):
            for dc in (-1,0,1):
                if (dr, dc) == (0, 0): continue
                v = (u[0]+dr, u[1]+dc)
                if not free(*v): continue
                if dr and dc and not (free(u[0]+dr,u[1]) and free(u[0],u[1]+dc)): continue  # 모서리 통과 금지
                nd = g[u] + math.hypot(dr, dc)
                if nd < g.get(v, 1e18): g[v] = nd; heapq.heappush(pq, (nd + h(v, G), v))
    return None
```

7x10 격자 장애물 예제에서 비용 13.828 로 동일한 최적 경로를 구했고, 확장한 칸 수는 다익스트라 44 → A*(옥타일) 26 → 가중 A*(w=3) 15 였다. 가중 A* 는 경로 비용이 14.414 로 약 4% 길어졌다. 수치는 이 작은 격자에 한정한 예다. 우선순위 큐는 [힙](/develop-wiki/knowledge/algorithms/heap-priority-queue/) 구현이 성능을 좌우한다.

## 왜 중요한가 (로봇 개발 관점)

- Nav2 같은 내비게이션 스택의 전역 플래너가 격자 비용지도(costmap) 위에서 이런 탐색을 쓴다. 지도 해상도와 팽창 반경이 곧 플래너 품질이다.
- 로봇은 점이 아니다. 격자 위의 "자유 칸"이 로봇 몸체가 지나가도 되는 칸이어야 한다.

## 로봇에 맞추는 법

- **장애물 팽창(inflation)**: 로봇 반경만큼 장애물을 부풀리고 내부를 점으로 취급한다. 거리에 따른 비용 감쇠를 넣어 벽에 붙어 가지 않게 한다.
- **비용지도**: 칸마다 통과 비용을 달리해 "가능하면 피하는 영역"을 표현한다.
- **경로 평활화**: 격자 경로는 45도 단위로 각진다. 후처리(shortcut, 스플라인)나 any-angle 계열(Theta*)로 부드럽게 만든다.
- **재계획**: 지도가 바뀌면 D* Lite 같은 증분 방식이 처음부터 다시 푸는 것보다 싸다.
- **로봇 운동 제약**: 전진만 되는 차량형은 (x, y, θ) 상태 격자와 곡률 제약이 필요하다(하이브리드 A* 등).

## 언제 쓰나

- 2D 이동 로봇의 전역 경로 계획, 저차원(2~3 자유도) 공간.
- 비용 구조가 명확한 환경, 최적성이 중요한 경우.
- 고차원(매니퓰레이터 6~7 자유도)은 격자가 지수적으로 커져 비적합 → [샘플링 기반 계획](/develop-wiki/knowledge/robotics/sampling-based-planning/).

## 주의/비용

- 메모리: 해상도를 절반으로 줄이면 칸 수가 4배(2D). 3D 는 8배.
- 해상도가 거칠면 좁은 통로를 놓치고, 촘촘하면 느리다.
- 비허용 휴리스틱(실제보다 큰 추정)을 쓰면 빠르지만 최적성 보장이 사라진다. 의도된 선택인지 확인한다.
- 계획된 경로는 로봇 동역학을 모른다. 지역 플래너·궤적 생성이 따로 필요하다([궤적과 속도 프로파일](/develop-wiki/knowledge/robotics/trajectory-velocity-profile/)).
- 동적 장애물, 불확실한 지도는 A* 한 번으로 해결되지 않는다.
