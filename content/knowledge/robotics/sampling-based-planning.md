---
title: 샘플링 기반 계획 — RRT·PRM
aka: [Sampling-Based Motion Planning, RRT, RRT*, PRM, Configuration Space, Probabilistic Roadmap]
category: robotics
group: planning
level: advanced
summary: 설정 공간을 무작위 표본으로 탐색해 고차원에서 경로를 찾는 RRT(단일 질의 트리)와 PRM(다중 질의 로드맵). 확률적 완전성과 경로 품질의 한계를 다룬다.
tags: [robotics, planning, rrt, prm, motion-planning, configuration-space]
related: [robotics/astar-grid-planning, robotics/forward-inverse-kinematics-jacobian, robotics/trajectory-velocity-profile, algorithms/graph-representation]
sources:
  - https://lavalle.pl/planning/ch5.pdf
  - https://lavalle.pl/planning/
  - http://hades.mech.northwestern.edu/images/7/7f/MR.pdf
  - https://en.wikipedia.org/wiki/Rapidly-exploring_random_tree
updatedAt: 2026-11-19
---

## 문제

6자유도 팔의 설정 공간은 6차원이다. 각 축을 100칸으로 나누면 10¹² 칸이라 격자 탐색은 불가능하다. 게다가 설정 공간에서 장애물 모양을 명시적으로 계산하기도 어렵다(MR 10.2 절은 설정 공간 장애물과 충돌 검사를 다룬다). 그래서 **충돌 검사만 할 수 있으면 된다**는 가정으로 표본을 뿌리는 방식이 쓰인다. LaValle 의 Planning Algorithms 5장이 대표 원전이다.

## 왜 중요한가 (로봇 개발 관점)

- MoveIt 의 기본 플래너 계열(OMPL)이 이 알고리즘들이다. 매니퓰레이터 모션 계획은 사실상 이 방식 위에서 돈다.
- 계획이 가끔 실패하거나 경로가 지그재그인 이유를 알아야 시간 제한·후처리 파라미터를 조정할 수 있다.

## 해법 1 — RRT (단일 질의)

시작점에서 트리를 키운다. 반복마다:
1. 설정 공간에서 무작위 점 `s` 를 뽑는다(가끔은 목표를 직접 뽑는 goal bias).
2. 트리에서 `s` 와 가장 가까운 노드를 찾는다.
3. 그 노드에서 `s` 방향으로 한 걸음(STEP) 간 새 점이 충돌 없이 갈 수 있으면 트리에 추가한다.
4. 목표 근처에 닿으면 부모를 거슬러 올라가 경로를 얻는다.

큰 빈 공간에 가까운 노드가 끌려가므로 트리가 미탐색 영역으로 빠르게 뻗는다(Voronoi 편향).

```python
def rrt(start, goal, seg_free, sample, step=0.5, iters=5000, bias=0.05):
    nodes = [start]; par = {0: None}
    for _ in range(iters):
        s = goal if random.random() < bias else sample()
        i = min(range(len(nodes)), key=lambda k: math.dist(nodes[k], s))
        d = math.dist(nodes[i], s); t = min(step, d)
        new = tuple(a + (b-a)*t/d for a, b in zip(nodes[i], s))
        if not seg_free(nodes[i], new): continue
        nodes.append(new); par[len(nodes)-1] = i
        if math.dist(new, goal) < step and seg_free(new, goal):
            path, k = [goal], len(nodes)-1
            while k is not None: path.append(nodes[k]); k = par[k]
            return path[::-1]
```

원 3개 장애물이 있는 10x10 평면에서 80 노드로 경로를 찾았다. 직선 거리 11.31 에 비해 경로 길이는 15.0, **shortcut 후처리**(두 점을 직선으로 이을 수 있으면 사이를 잘라냄) 후 12.36 이었다(난수 시드 고정 실험 1건이며 일반화 수치가 아니다). 모든 구간의 충돌 없음도 검증했다.

## 해법 2 — PRM (다중 질의)

1. **구축 단계**: 자유 공간에서 표본 N 개를 뽑고, 가까운 표본끼리 충돌 없는 직선으로 이어 그래프(로드맵)를 만든다.
2. **질의 단계**: 시작·목표를 로드맵에 연결하고 그래프 탐색(A*, 다익스트라)으로 경로를 찾는다([그래프 표현](/develop-wiki/knowledge/algorithms/graph-representation/)).

## 비교

| | RRT | PRM | 격자 A* |
| --- | --- | --- | --- |
| 질의 | 매 질의마다 새로 | 로드맵 재사용 | 매번 탐색 |
| 적합 환경 | 환경이 자주 바뀜 | 환경이 고정, 질의 많음 | 저차원 |
| 고차원 | 강함 | 강함 | 약함 |
| 경로 품질 | 지그재그, 비최적 | 로드맵 품질에 의존 | 격자 해상도 내 최적 |
| 최적성 | RRT* 는 점근 최적 | PRM* 는 점근 최적 | 보장 |

## 속성과 한계 (MR 10.1, LaValle)

- **확률적 완전성**: 해가 있으면 표본이 늘수록 찾을 확률이 1 로 간다. 해가 없을 때 없다고 알려 주지는 못한다(종료 조건은 시간 제한뿐).
- **좁은 통로 문제**: 통로가 좁으면 무작위 점이 거기 들어갈 확률이 낮아 오래 걸린다. 브리지 테스트, 장애물 근방 샘플링 같은 변형이 있다.
- **재현성**: 난수 시드에 따라 다른 경로가 나온다. 안전 임계 응용에서는 시드 고정, 후처리 검증이 필요하다.

## 언제 쓰나

- 고차원 설정 공간(매니퓰레이터, 다관절 로봇, 3D 비행체).
- 장애물 모델이 복잡해 충돌 검사 함수만 있을 때.
- 로드맵 재사용이 가능한 고정 작업장(PRM).

## 주의/비용

- **충돌 검사가 비용의 대부분**이다. 선분을 촘촘히 보간해 검사하면 느리다. 보간 간격을 너무 크게 잡으면 얇은 장애물을 통과한다.
- 경로가 매끄럽지 않아 그대로 실행하면 급가속이 생긴다. shortcut → 평활화 → 시간 매개변수화를 이어야 한다([궤적·속도 프로파일](/develop-wiki/knowledge/robotics/trajectory-velocity-profile/)).
- 동역학·비홀로노믹 제약이 있으면 단순한 직선 연결을 쓸 수 없다. 운동학적 제약을 반영한 확장 함수가 필요하다.
- 저차원 평면 이동이라면 [A*](/develop-wiki/knowledge/robotics/astar-grid-planning/) 가 더 단순하고 재현 가능하다.
