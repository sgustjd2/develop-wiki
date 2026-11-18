---
title: 위상 정렬
aka: [Topological Sort, Topological Ordering, Kahn's Algorithm, Dependency Resolution, 위상 순서]
category: algorithms
group: algorithm
level: intermediate
summary: 방향 비순환 그래프(DAG)의 정점을 모든 간선이 앞에서 뒤로 향하도록 일렬로 세우는 알고리즘. 의존성이 있는 작업의 실행 순서를 정하고 순환 의존을 검출한다.
tags: [graph, dag, topological-sort, dependency, build-system]
related: [algorithms/bfs-dfs, algorithms/graph-representation, algorithms/dynamic-programming, algorithms/stack-queue-deque, algorithms/strongly-connected-components]
sources:
  - https://en.wikipedia.org/wiki/Topological_sorting
  - https://cp-algorithms.com/graph/topological-sort.html
  - https://docs.python.org/3/library/graphlib.html
updatedAt: 2026-11-18
---

## 문제

"B 는 A 가 끝나야 시작할 수 있다" 같은 선후 관계가 잔뜩 있을 때, 모든 제약을 지키는 실행 순서가 필요하다. 패키지 설치, 빌드 단계, DB 마이그레이션, 스프레드시트 재계산이 모두 이 문제다.

간선 `A → B` = "A 가 B 보다 먼저". 순서가 존재할 필요충분조건은 **사이클이 없는 것(DAG)** 이다.

## 해법 1: Kahn 알고리즘 (진입 차수, 1962)

1. 모든 정점의 진입 차수(들어오는 간선 수)를 센다.
2. 진입 차수 0 인 정점을 큐에 넣는다. 이들은 지금 바로 실행 가능하다.
3. 하나 꺼내 결과에 붙이고, 나가는 간선을 지우며 이웃 진입 차수를 줄인다. 0 이 되면 큐에 넣는다.
4. 결과에 모든 정점이 없으면 **사이클이 있다.**

```ts
function topoSort<T>(deps: Map<T, T[]>): { order: T[]; cycle: T[] } {
  // deps: 노드 → 그 노드가 의존하는(먼저 끝나야 하는) 노드들
  const indeg = new Map<T, number>();
  const next = new Map<T, T[]>(); // 선행 → 후행
  const touch = (x: T) => { if (!indeg.has(x)) { indeg.set(x, 0); next.set(x, []); } };
  for (const [node, pres] of deps) {
    touch(node);
    for (const p of pres) {
      touch(p);
      next.get(p)!.push(node);
      indeg.set(node, indeg.get(node)! + 1);
    }
  }
  const queue = [...indeg].filter(([, d]) => d === 0).map(([x]) => x);
  const order: T[] = [];
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    order.push(u);
    for (const v of next.get(u)!) {
      const d = indeg.get(v)! - 1;
      indeg.set(v, d);
      if (d === 0) queue.push(v);
    }
  }
  const cycle = [...indeg].filter(([, d]) => d > 0).map(([x]) => x); // 사이클에 걸린(또는 그 뒤에 막힌) 노드
  return { order, cycle };
}

const deps = new Map<string, string[]>([
  ["app", ["lib", "utils"]],
  ["lib", ["utils"]],
  ["test", ["app"]],
]);
console.log(topoSort(deps).order); // ["utils", "lib", "app", "test"]
```

같은 "층"의 정점(동시에 진입 차수 0)은 **서로 독립이므로 병렬 실행**할 수 있다. 빌드 도구의 병렬 작업 스케줄링이 이 원리다.

## 해법 2: DFS 후위 순서 (Tarjan 1976)

DFS 로 정점의 탐색이 **끝나는** 순서를 기록한 뒤 뒤집으면 위상 순서다. "진행 중" 정점을 다시 만나면 사이클이다 → [BFS·DFS](/develop-wiki/knowledge/algorithms/bfs-dfs/)의 `hasCycle`.

| | Kahn | DFS |
| --- | --- | --- |
| 시간 | O(V + E) | O(V + E) |
| 공간 | O(V) | O(V) (재귀 깊이 주의) |
| 사이클 처리 | 남은 노드 = 사이클 관련 노드 | 사이클 경로를 바로 얻기 쉬움 |
| 병렬 실행 층 | 자연스럽게 나옴 | 별도 계산 |
| 사전순 최소 순서 | 큐를 최소 힙으로 바꾸면 됨 | 어려움 |

## 응용: DAG 위의 DP

위상 순서대로 처리하면 각 정점의 선행자가 모두 처리된 뒤라 **DP 를 한 번에** 할 수 있다. 예: 작업 시간이 주어질 때 전체 최소 완료 시간 = DAG 최장 경로(크리티컬 패스, CPM). DAG 의 최단 경로도 음수 간선과 상관없이 O(V + E)로 풀린다.

## 언제 쓰나

- 의존성 해석: 패키지·모듈 로드 순서, 빌드 타깃, 데이터 파이프라인 태스크(Airflow DAG), DB 테이블 생성·FK 로드 순서.
- 스프레드시트 셀 재계산, 리액티브 시스템의 파생 값 갱신 순서.
- 순환 의존 검출: "모듈 A ↔ B 순환 import" 경고.

## 주의

- **위상 순서는 보통 유일하지 않다.** 결과가 실행마다 다르면 재현성 문제가 생긴다. 결정적 순서가 필요하면 동점을 이름순(최소 힙)으로 고른다.
- 사이클이 있으면 순서가 없다. 오류 메시지에 **사이클 경로**를 보여 줘야 사용자가 고칠 수 있다.
- 간선 방향(선행→후행 vs 의존→피의존)을 헷갈리면 역순이 나온다. 함수 시그니처에 방향을 명시한다.
- 그래프가 동적으로 바뀌면(실행 중 새 의존 추가) 매번 전체 재계산 대신 증분 알고리즘이나 이벤트 기반 준비 큐를 쓴다.

## 실무에서

- Python 3.9+ `graphlib.TopologicalSorter` 는 `static_order()` 와, 준비된 노드를 꺼내고 완료를 알리는 `get_ready()`/`done()` 병렬 처리 API 를 제공한다. 사이클이면 `CycleError` 에 사이클 경로를 담는다.
- Make·Bazel·Gradle·Turborepo 같은 빌드 도구, npm·Cargo 등 패키지 매니저, Terraform 리소스 생성 순서, Airflow·Dagster 작업 스케줄링이 DAG 위상 순서를 쓴다.
- 컴파일러의 명령어 스케줄링, 링커의 심볼 의존 해석에도 쓰인다(Wikipedia 응용 절).
