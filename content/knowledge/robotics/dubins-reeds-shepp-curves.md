---
title: Dubins·Reeds-Shepp 곡선 — 최소 회전 반경 아래의 최단 경로
aka: [Dubins Curves, Dubins Path, Reeds-Shepp Curves, Bounded-Curvature Shortest Path, CSC, CCC, 최소 회전 반경 경로]
category: robotics
group: planning
level: advanced
summary: 곡률 상한이 있는 자동차형 로봇의 두 자세 사이 최단 경로는 직선(S)과 최소 반경 호(L·R)를 이어 붙인 몇 가지 단어뿐이다. 전진만이면 Dubins 6개, 후진까지 되면 Reeds-Shepp 46개 단어를 닫힌 식으로 푼다.
tags: [robotics, planning, dubins, reeds-shepp, nonholonomic, ackermann, hybrid-astar, steering, local-planner]
related: [robotics/smac-hybrid-astar-state-lattice, robotics/astar-grid-planning, robotics/sampling-based-planning, robotics/pure-pursuit-dwa-local-planning, robotics/nav2-rpp-mppi-controllers, robotics/trajectory-velocity-profile]
sources:
  - http://lavalle.pl/planning/ch15.pdf
  - https://msp.org/pjm/1990/145-2/pjm-v145-n2-p06-s.pdf
updatedAt: 2026-11-19
---

> 출처 메모: LaValle 의 *Planning Algorithms* 15.3절(Dubins·Reeds-Shepp 단어와 매개변수 범위)과 Reeds & Shepp 1990 논문(Pacific J. Math. 145권 2호)의 초록·서론을 읽었다. Dubins 1957 원 논문은 유료 접근이라 읽지 못했고 LaValle 의 정리를 통해서만 인용한다. 각 단어의 최적성 증명(Pontryagin 최소 원리 등)과 Reeds-Shepp 의 단어별 길이 공식 표는 읽지 않았다. 아래 닫힌 식은 직접 구현해 종점 도달을 수치로 검증한 것이지 논문 공식의 옮김이 아니다.

## 문제

[격자 A*](/develop-wiki/knowledge/robotics/astar-grid-planning/)가 내놓는 경로는 꺾인 선이다. 조향각에 한계가 있는 로봇(아커만, 지게차)은 곡률이 일정 값 `1/ρ` 를 넘을 수 없어서, "(x, y, θ) 에서 (x', y', θ') 로 가는 가장 짧은 주행 가능 경로" 가 필요하다. 이 문제를 풀면 두 가지가 한꺼번에 생긴다. 하나는 샘플링 기반 계획기의 **국소 연결기**(두 자세를 잇는 곡선), 다른 하나는 탐색 계획의 **비홀로노믹 휴리스틱과 해석적 확장**([Smac Hybrid-A*](/develop-wiki/knowledge/robotics/smac-hybrid-astar-state-lattice/)가 쓰는 것)이다.

## 해법

### Dubins: 전진만 되는 차

속도가 일정하고 앞으로만 가는 차에서, 최단 경로는 세 가지 원시 동작의 열이다. 직진 `S`, 최소 반경 좌회전 `L`, 최소 반경 우회전 `R`. LaValle 은 Dubins 의 결과를 이렇게 정리한다. 모든 경로는 원시 동작 **3개 이하**이고, 같은 동작이 연달아 오는 것은 합쳐지므로 후보 단어는 `LRL, RLR, LSL, LSR, RSL, RSR` 여섯뿐이다. 묶어 쓰면 `CCC` 와 `CSC`(C 는 L 또는 R 인 호) 두 꼴이다. `CCC` 의 가운데 호는 π 보다 길어야 하고(짧으면 다른 단어가 더 짧다), 양끝 호는 0 이상 2π 미만이다.

구하는 법은 단순하다. 여섯 단어를 모두 풀어 가장 짧은 것을 고른다. 각 단어는 시작·목표에서 최소 반경 원을 그려 접선·교점을 잡는 기하 문제라 닫힌 식으로 풀린다. 아래는 그중 `CSC` 네 개의 식을 직접 옮긴 TypeScript 이고(`CCC` 두 개는 생략), 반환은 `[첫 호, 직선 길이, 둘째 호]` 다(호는 라디안, ρ 로 정규화).

```ts
type Pose = [number, number, number];
const TAU = 2 * Math.PI, mod = (a: number) => ((a % TAU) + TAU) % TAU;

export function csc(q0: Pose, q1: Pose, rho = 1) {
  const d = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) / rho;
  const th = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]);
  const a = mod(q0[2] - th), b = mod(q1[2] - th);
  const [sa, ca, sb, cb, c] = [Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b), Math.cos(a - b)];
  const out: Record<string, [number, number, number]> = {};
  let p2 = 2 + d * d - 2 * c + 2 * d * (sa - sb);
  if (p2 >= 0) { const k = Math.atan2(cb - ca, d + sa - sb); out.LSL = [mod(-a + k), Math.sqrt(p2), mod(b - k)]; }
  p2 = 2 + d * d - 2 * c + 2 * d * (sb - sa);
  if (p2 >= 0) { const k = Math.atan2(ca - cb, d - sa + sb); out.RSR = [mod(a - k), Math.sqrt(p2), mod(-b + k)]; }
  p2 = -2 + d * d + 2 * c + 2 * d * (sa + sb);
  if (p2 >= 0) { const p = Math.sqrt(p2), k = Math.atan2(-ca - cb, d + sa + sb) - Math.atan2(-2, p); out.LSR = [mod(-a + k), p, mod(-b + k)]; }
  p2 = d * d - 2 + 2 * c - 2 * d * (sa + sb);
  if (p2 >= 0) { const p = Math.sqrt(p2), k = Math.atan2(ca + cb, d - sa - sb) - Math.atan2(2, p); out.RSL = [mod(a - k), p, mod(b - k)]; }
  return out; // 길이 = (t + p + q) * rho
}
```

검증은 여섯 단어 전부(`CCC` 포함)를 같은 방식으로 구현한 Python 판으로 했다. 시작 자세·목표 자세를 무작위로 3000쌍 뽑아 후보 단어 14,146개를 실제로 따라 그려 보니 **전부 목표 자세에 1e-6 이내로 도달**했다(위 `csc` 는 같은 식을 TypeScript 로 옮겨 두 사례만 대조했다). 3000쌍 중 최단이 `CCC` 인 경우는 297쌍(약 10%)이었다. 직접 계산한 예(ρ=1)는 다음과 같다.

| 목표 (x, y, θ) | 최단 단어 | 길이 | 직선거리 |
| --- | --- | --- | --- |
| (4, 0, 0) | LSL(직진뿐) | 4.00 | 4.00 |
| (3, 3, π/2) | LSL | 4.40 | 4.24 |
| (0, 0, π) 제자리 반전 | RLR | 7.33 | 0 |
| (-2, 0, 0) 바로 뒤 | LSL | 8.28 | 2.00 |

### Reeds-Shepp: 후진도 되는 차

기어를 바꿔 후진할 수 있으면(경로에 첨점 cusp 이 생긴다) 최단 경로가 훨씬 짧아진다. 원시 동작은 전진·후진 각각의 S, L, R 로 여섯 개가 된다. Reeds & Shepp(1990)의 결과는 **기어 전환(첨점)이 많아야 두 번**이고, 경로가 `CCSCC` 꼴의 열에 들어간다는 것이다. 논문 초록은 어떤 두 자세 사이든 최단 경로를 포함하는 후보가 많아야 68개이고 보통 훨씬 적다고 하며, LaValle 은 이를 정리해 기본 단어를 아홉 꼴(`C|C|C`, `CC|C`, `C|CC`, `CSC`, `CCβ|CβC`, `C|CβCβ|C`, `C|Cπ/2SC`, `CSCπ/2|C`, `C|Cπ/2SCπ/2|C`)로 쓰고, 이것을 풀어 쓴 단어가 48개이며 후속 연구에서 둘이 빠져 **46개**가 실제로 최단이 될 수 있다고 한다(`|` 는 기어 전환). 두 자료의 센 방식(후보 경로 수 vs 단어 수)이 다르니 숫자를 섞어 쓰지 않는다. 최대 다섯 동작까지 쓰인다.

바로 뒤에 있는 목표 (-2, 0, 0) 은 후진 직진 하나(길이 2.0)로 닿는다. 위 표의 Dubins 8.28 과 4배 차이다. 직접 계산한 값이며 직진이 평면 최단이라는 사실에서 바로 나온다.

## 언제 쓰나

- 아커만·후륜 조향 로봇의 전역 계획에서 **해석적 확장**(장애물 없는 가정으로 목표까지 단번에 잇기)이나 휴리스틱.
- 샘플링 계획기(RRT 계열)의 두 자세 연결기. 탐색이 만든 경로가 곡률 한계를 지키게 한다.
- 주차·도킹처럼 후진이 자연스러운 작업은 Reeds-Shepp, 전진만 허용되는 도로·고속 이동은 Dubins.

## 주의/비용

- **장애물을 보지 않는다.** 이 곡선은 기하만 푼 것이라 충돌 검사는 따로 해야 한다. Smac 이 해석적 확장 결과에 충돌 검사를 하는 이유다.
- **비대칭 거리.** A→B 와 B→A 의 Dubins 길이가 다르다. LaValle 은 대칭 공리를 어기므로 엄밀한 거리 함수가 아니라고 지적한다. 양방향 탐색이나 최근접 이웃 구조에 그대로 넣으면 안 된다. 또 Dubins 비용은 연속이 아니다(회전 반경이 부족한 근처 점은 더 긴 열이 필요).
- **속도·가속은 별개.** 곡률 상한만 지키고 속도 프로파일이나 조향 속도 한계는 없다. [속도 프로파일](/develop-wiki/knowledge/robotics/trajectory-velocity-profile/)과 컨트롤러 단에서 따로 맞춘다.
- **기어 전환 비용.** Reeds-Shepp 최단 경로는 전환 횟수를 줄여 주지 않는다. 실제 로봇의 전환 지연·안전 구역을 고려하면 벌점을 둔 탐색(Hybrid-A* 의 `reverse_penalty`·`change_penalty`)이 필요하다.

## 비교

| 구분 | Dubins | Reeds-Shepp |
| --- | --- | --- |
| 후진 | 불가 | 가능(기어 전환) |
| 후보 단어 | 6개(CCC, CSC) | 최대 46개 |
| 동작 개수 | 3개 이하 | 5개 이하 |
| 대칭성 | 비대칭(LaValle) | 읽은 범위에서는 명시 없음 |
| 주 사용처 | 전진 전용 차량 | 주차·도킹, 지게차 |

LaValle 의 15.3절은 차동 구동 로봇의 최단 경로도 다루지만 이 노트는 다루지 않는다.
