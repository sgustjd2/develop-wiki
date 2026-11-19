---
title: 요커-볼겐안트 배정 알고리즘 (LAPJV)
aka: [Jonker-Volgenant, LAPJV, LAP, Linear Assignment Problem, Shortest Augmenting Path, Column Reduction, Augmenting Row Reduction, scipy linear_sum_assignment]
category: algorithms
group: algorithm
level: advanced
summary: 배정 문제를 최단 증가 경로로 푸는 O(n³) 알고리즘. 열 감소·감소 이전·증가 행 감소로 쌍대 해와 부분 배정을 먼저 크게 키운 뒤 Dijkstra 변형으로 남은 행만 증가시킨다. SciPy 의 배정 함수가 이 계열이다.
tags: [assignment, lapjv, shortest-augmenting-path, dual, potentials, dijkstra, scipy]
related: [algorithms/hungarian-algorithm, algorithms/min-cost-flow, algorithms/max-flow-bipartite-matching, algorithms/shortest-path, algorithms/greedy, algorithms/p-np-approximation]
sources:
  - https://www.gwern.net/doc/statistics/decision/1987-jonker.pdf
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html
  - https://github.com/scipy/scipy/blob/main/scipy/optimize/rectangular_lsap/rectangular_lsap.cpp
updatedAt: 2026-11-19
---

## 문제

n×n 비용 행렬에서 행마다 서로 다른 열을 하나씩 골라 합을 최소화하는 **선형 배정 문제(LAP)** 다. 풀이와 쌍대 문제의 설명은 [헝가리안 알고리즘](/develop-wiki/knowledge/algorithms/hungarian-algorithm/)에 있다. 이 노트는 Jonker–Volgenant(1987, *Computing* 38)가 제안한 **LAPJV** 를 다룬다. 원 논문은 Hungarian 계열이 아니라 Tomizawa(1971)·Dorhout 로 이어지는 **최단 증가 경로** 계열 위에 새 초기화와 특수한 Dijkstra 구현을 얹은 것이다. 논문 초록의 주장은 조밀·희소 문제 모두에서 당시 문헌의 최선 알고리즘보다 일관되게 빠르다는 것이다.

## 해법의 골격

쌍대 변수(행 가격 `u`, 열 가격 `v`)를 두고 모든 `c[i][j] − u[i] − v[j] ≥ 0` 를 유지한다. 배정된 칸의 감소 비용이 0 이면 최적이다. 알고리즘은 네 단계다.

1. **초기화**: 쌍대 해를 크게 만들고 부분 배정을 만든다(아래 3개 절차).
2. 행이 모두 배정되면 끝.
3. **증가**: 미배정 행 하나에서 미배정 열까지 감소 비용 합이 최소인 교대 경로를 찾아 따라 배정을 늘린다. 감소 비용이 음이 아니므로 Dijkstra 가 쓰인다.
4. 쌍대 값을 갱신해 상보 여유(complementary slackness)를 복원한다.

### 초기화 세 절차 (이 논문의 기여)

| 절차 | 하는 일 |
| --- | --- |
| 열 감소 | 열마다 최소 비용 칸을 찾아 `v[j]` 로 두고, 그 행이 비어 있으면 열을 배정한다. **열을 역순으로** 훑어 낮은 번호 열이 미배정으로 남도록 한다 |
| 감소 이전 | 배정된 행 `i` 의 둘째 최소 감소 비용만큼 배정 열의 가격을 낮추고 `u[i]` 를 올린다. 쌍대 합은 그대로지만 배정 열이 "비싸져" 미배정 행의 감소 여지가 늘어난다 |
| 증가 행 감소 | 미배정 행에서 최소·차소 감소 비용의 열을 보고, 차이가 있으면 최소 열 가격을 올려 감소를 이전하며 열을 가져온다. 뺏긴 행에서 같은 일을 이어 가다 **미배정 열을 만나거나 이전할 감소가 없으면** 멈춘다. 논문은 **두 번** 실행할 때 결과가 가장 좋다고 보고한다 |

```ts
// 열 감소 + 감소 이전 (검증에 쓴 구현에서 발췌, 0-기반, -1 = 미배정)
for (let j = n - 1; j >= 0; j--) {
  let im = 0;
  for (let i = 1; i < n; i++) if (c[i][j] < c[im][j]) im = i;
  v[j] = c[im][j];
  if (x[im] === -1) { x[im] = j; y[j] = im; }
}
for (let i = 0; i < n; i++) {
  if (x[i] === -1) continue;
  const j1 = x[i]; let mu = Infinity;
  for (let j = 0; j < n; j++) if (j !== j1) mu = Math.min(mu, c[i][j] - v[j]);
  v[j1] -= mu - u[i]; u[i] = mu;
}
```

증가 단계는 열 집합을 `READY`·`SCAN`·`REST`(논문 표기의 마지막 집합) 로 나누는 Dijkstra 변형이다. 같은 최소 거리 `μ` 인 열을 한꺼번에 `SCAN` 에 모아, 새 최솟값을 찾는 비싼 탐색을 `SCAN` 이 빌 때만 한다. 끝나면 `READY` 열의 가격을 `v[k] += d[k] − μ` 로 올리고 경로를 따라 배정을 뒤집는다. 행 가격은 상보 여유로 언제든 복원할 수 있어 따로 갱신하지 않는다.

## 직접 구현해 확인한 것

논문의 Fig. 1·2·5 를 TypeScript 로 옮겨 실행했다.

- **정확성**: 2~7 크기 무작위 행렬 300건을 브루트포스와 비교해 불일치 0, 크기 20~79 행렬 100건을 전위(potential) 헝가리안과 비교해 불일치 0. 정수 비용이다.
- **초기화 효과**(n=100, 25문제, 비용 1~100): 열 감소만으로 평균 62.2개가 배정되고, 세 절차 뒤에는 93.4개가 배정되며 증가 경로 탐색이 필요한 행은 평균 7개 남는다. 쌍대 값은 최적의 약 98.4% 다(행마다 최선의 `u` 를 다시 잡아 계산한 값이라 논문 Table 1 의 정의와 다를 수 있다).
- **속도(JS, arm64, 1회 측정, 상대 비교만)**:

| 입력(n) | LAPJV | 전위 헝가리안 |
| --- | --- | --- |
| 무작위 비용 1~1000 (n=800) | 7 ms | 42 ms |
| 거리형 `(i−j)²` (n=600) | 9 ms | 5 ms |
| 곱 `i·j` (n=600) | 352 ms | 291 ms |

무작위 입력에서는 초기화가 거의 다 풀어 빠르지만, 구조가 있는 입력에서는 이점이 사라지거나 뒤집혔다. **입력 분포에 민감하다**는 뜻이다. 이 수치는 위 구현·환경의 한 번 측정이며 라이브러리 성능이 아니다.

## 라이브러리에서

SciPy 의 `scipy.optimize.linear_sum_assignment` 문서는 **초기화 없는 수정 Jonker–Volgenant** 를 쓴다고 하며 Crouse(2016) 논문을 가리킨다. 소스 주석도 직사각 배정을 위한 최단 증가 경로 알고리즘이며 Crouse 논문 의사코드(1685~1686쪽)를 따른다고 밝힌다. 직사각 행렬을 받고 `maximize=True` 로 최대화도 되며, 희소 입력은 별도의 `min_weight_full_bipartite_matching` 을 안내한다. 즉 **초기화 세 절차는 SciPy 에서 쓰이지 않는다.** 이 때문에 "SciPy = LAPJV 전체"라고 말하면 틀린다.

## 헝가리안과의 관계

두 코드가 같은 비용을 낸다는 것은 위에서 확인했다. 헝가리안 노트의 전위 방식도 행을 하나씩 넣으며 최단 증가 경로와 전위 갱신을 하는 O(n³) 구성이어서 같은 계열로 보인다(이 해석은 필자 판단이다). LAPJV 가 보탠 것은 **좋은 초기 부분 해**와 **Dijkstra 구현 다듬기**다. 논문도 계산 시간의 60~70% 가 초기화에 쓰이고, 단순 열·행 감소는 약 20% 라고 보고한다.

## 언제 쓰나

- 1:1 최소 비용 배정(추적 대상 짝짓기, 작업 할당)을 반복해서 많이 풀어야 할 때. 직접 구현보다 SciPy 같은 검증된 구현을 쓴다.
- 비용 행렬이 조밀하고 n 이 수천 이하일 때.

## 주의 (비용)

- **메모리 O(n²)** (조밀 행렬). 희소 간선이면 희소용 알고리즘이나 [최소 비용 유량](/develop-wiki/knowledge/algorithms/min-cost-flow/)이 낫다. 원 논문에도 희소 버전이 따로 있다.
- 복잡도는 **여전히 O(n³)** 다. 초기화는 상수 개선이며 최악을 줄이지 않는다. 논문의 증가 행 감소 상한도 O(n³ · R) 또는 경로 길이 제한 시 O(n³) 이다.
- **정수 비용**이 안전하다. 실수에서는 같음 비교(`d[j] === μ`)가 오차에 민감하다.
- 입력이 비어 있거나 불가능한 칸(∞)이 있는 경우의 처리는 구현마다 다르다. SciPy 문서는 이를 명시하지 않아 확인하지 못했다.
- 이 노트는 원 논문을 읽었고, Crouse(2016)는 IEEE 유료 논문이라 읽지 못해 SciPy 문서와 소스 주석으로만 연결했다.
