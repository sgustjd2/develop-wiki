---
title: 랑데부 해싱 (HRW)
aka: [Rendezvous Hashing, Highest Random Weight, HRW Hashing, Weighted Rendezvous Hashing, 최고 무작위 가중치 해싱]
category: algorithms
group: algorithm
level: intermediate
summary: 키마다 모든 서버에 해시 점수를 매겨 최고점 서버를 고르는 분산 배치 기법. 링과 토큰 없이도 서버 증감 시 이동량이 최소이고, 상위 r 개를 고르면 복제본 선택까지 된다. 조회는 O(n)이다.
tags: [hashing, hrw, rendezvous, load-balancing, sharding, distributed-systems, replication]
related: [algorithms/consistent-hashing, algorithms/hash-table, algorithms/hash-functions-hashdos, algorithms/heap-priority-queue, performance/load-balancing, data-modeling/sharding-partitioning]
sources:
  - https://en.wikipedia.org/wiki/Rendezvous_hashing
  - https://en.wikipedia.org/wiki/Consistent_hashing
updatedAt: 2026-11-19
---

## 문제

키를 서버 n 대에 나눠야 하는데 서버가 자주 늘고 줄어든다. `hash(key) % n` 은 서버 수가 바뀔 때 거의 모든 키가 이동한다. 클라이언트들이 중앙 조율 없이도 **같은 키에 같은 서버를 고르고**, 서버가 바뀌어도 **영향받는 키만** 움직이길 바란다. 이 문제는 [일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/)과 같다. 랑데부 해싱은 링 대신 다른 방법으로 푼다.

## 해법

Thaler 와 Ravishankar 가 1996년 미시간 대학에서 제안했다(Wikipedia). **Highest Random Weight(HRW)** 라고도 한다.

- 키 `k` 와 서버 `s` 쌍마다 `hash(k, s)` 로 점수를 낸다.
- **점수가 가장 높은 서버**가 키를 담당한다.
- 모든 클라이언트가 같은 서버 목록과 같은 해시를 쓰면 같은 답에 도달한다.

서버가 죽으면 그 서버가 1등이던 키만 새 1등(원래 2등)으로 넘어가고, 나머지 키의 1등은 그대로다. 서버가 추가되면 새 서버가 1등을 차지하는 키(평균 1/(n+1))만 이동한다. 이것이 "랑데부(약속 장소를 정하듯 합의)"라는 이름의 뜻이다.

```ts
interface Node { id: string; weight: number }

// 점수 = weight / -ln(u), u ∈ (0,1) 은 hash(key, node) 를 균등 분포로 바꾼 값. 최대 점수가 승자
function score(key: string, n: Node): number {
  const u = (hash32(`${key}|${n.id}`) + 0.5) / 2 ** 32; // (0,1) 열린 구간
  return n.weight / -Math.log(u);
}

function pick(key: string, nodes: Node[]): string {
  let best = nodes[0], bestScore = -Infinity;
  for (const n of nodes) { const s = score(key, n); if (s > bestScore) { best = n; bestScore = s; } }
  return best.id;
}

// 복제본 r 개: 점수 상위 r 개 (서버가 죽으면 다음 순위가 자동으로 승계)
function pickTop(key: string, nodes: Node[], r: number): string[] {
  return nodes.map((n) => ({ id: n.id, s: score(key, n) })).sort((a, b) => b.s - a.s).slice(0, r).map((x) => x.id);
}
```

`hash32` 는 FNV-1a 에 murmur3 마무리를 섞은 32비트 해시다(시드·링 없이 키와 서버 이름을 이어 붙여 해시한다). 위 코드를 `tsc --strict` 로 컴파일해 10만 키로 측정한 결과:

| 실험 | 결과 |
| --- | --- |
| 서버 4대 → 5대 (가중치 같음) | 이동 비율 20.2% (이론 1/5 = 20%) |
| 서버 b 제거 | 이동 비율 24.9%, **이동한 키는 전부 b 의 키** |
| 가중치 small=1, big=3 | 25% / 75% 로 분배 (24,987 / 75,013) |

### 가중치

용량이 다른 서버는 가중 점수로 처리한다. Wikipedia 가 소개하는 로그 방식은 `score = weight / −ln(h)` (h 는 (0,1) 균등 해시값)이며, 서버가 1등이 될 확률이 가중치에 비례한다. 위 실험이 이를 확인했다. 해시값을 그대로 가중치와 곱하면 비례 분배가 되지 않으므로 로그 변환이 필요하다.

### 복제와 순위

점수 상위 r 개를 고르면 **k-일치(k-agreement)** 를 얻는다. 클라이언트들이 중앙 없이도 "이 객체의 복제본은 이 r 대"에 합의한다. 서버가 죽으면 r+1 번째가 자연스럽게 승계한다. 위 예시의 `pickTop('user:42', nodes, 3)` 이 그런 용도다.

## 일관된 해싱(링)과 비교

| | 랑데부(HRW) | 해시 링 + vnode |
| --- | --- | --- |
| 아이디어 | 키×서버 점수의 최댓값 | 링에서 시계 방향 첫 서버 |
| 상태 | 서버 목록뿐 | 정렬된 토큰 배열(서버 × vnode) |
| 조회 | **O(n)** (서버 수) | O(log(n·V)) |
| 균형 | 서버당 1점이면 충분 | vnode 100개 정도 필요 |
| 제거 시 이동 | 그 서버 키만 | 그 서버 키만 |
| 가중치 | 점수식으로 자연스러움 | vnode 개수 조절 |
| 복제본 | 상위 r 개 | 링을 따라 r 개(물리 노드 중복 제외) |
| 맞는 곳 | 서버가 수십 대 이하, 단순한 구현 | 서버가 많고 조회 비용이 중요 |

- Wikipedia 는 랑데부 해싱이 일관된 해싱보다 **더 단순하고 일반적**이라고 설명한다. 일관된 해싱은 적절한 2항 해시 함수를 고르면 HRW 의 특수한 경우로 볼 수 있다.
- 반대로 HRW 는 한 서버가 제거될 때 그 서버의 키가 **임의로 많은 서버로 흩어질** 수 있다(링은 이웃 하나로 몰릴 수 있다). 이동 대상이 퍼진다는 것은 장점이기도 하다(재해싱 부하가 분산됨).
- 서버가 많으면 O(n) 이 부담이다. **skeleton** 이라 불리는 계층 구조로 O(log n) 으로 줄이는 변형이 있으나 전역 균일성을 일부 잃는다(Wikipedia).
- 링의 vnode 처럼 서버 이름 규칙이 바뀌면 배치가 전부 바뀐다. 서버 식별자(id)는 안정적으로 유지한다.

## 언제 쓰나

- **서버 수가 적고(수십 대) 단순함이 중요한 곳**: 로드 밸런서의 세션 고정, 캐시 서버 선택, 파티션 소유자 결정. 알고리즘이 점수 한 줄이라 구현 오류가 적다.
- 키마다 **순위 목록**이 필요한 곳: 복제본 선택, 장애 시 다음 후보 지정.
- 가중치가 있는 클러스터(용량이 다른 노드).
- 토큰·링 상태를 저장하거나 전파하기 싫을 때. 서버 목록만 같으면 된다.

Wikipedia 는 GitHub 로드 밸런서, Apache Ignite, Apache Kafka, Apache Druid, Twitter EventBus 를 사용 사례로 든다.

## 주의

- **O(n) 조회**: 요청마다 서버 수만큼 해시를 계산한다. Wikipedia 도 해시가 빠르면 n 이 매우 크지 않은 한 문제없다고 한다. 서버가 수백 대 이상이거나 초당 수백만 건을 처리한다면 키 → 서버 결과를 캐시하거나 링/Jump 해시를 검토한다.
- **핫 키는 해결하지 못한다.** 균등하게 나누는 것은 키 개수이지 요청량이 아니다. 인기 키는 복제 읽기, 키 분할, 로컬 캐시로 푼다 → [로드 밸런싱](/develop-wiki/knowledge/performance/load-balancing/).
- **멤버십 합의**는 별도 문제다. 클라이언트마다 서버 목록이 다르면 같은 키를 다른 서버로 보낸다(분산 캐시에서는 곧 미스).
- **해시 품질**: 키와 서버 이름을 이은 문자열 해시의 분포가 나쁘면 편향된다. 구분자 없이 이으면 `("ab","c")` 와 `("a","bc")` 가 충돌한다(위 예시는 `|` 를 둔다). 외부 입력이 키라면 [HashDoS](/develop-wiki/knowledge/algorithms/hash-functions-hashdos/) 관점에서 키 있는 해시를 고려한다.
- **범위 질의 불가**: 해시가 순서를 지우므로 범위 스캔은 안 된다 → [샤딩과 파티셔닝](/develop-wiki/knowledge/data-modeling/sharding-partitioning/)의 범위 파티셔닝을 쓴다.
- 부동소수점 점수는 플랫폼 간 미세한 차이로 동점·순서가 다를 수 있다. 서로 다른 언어 구현이 섞이면 정수 연산 변형을 쓰거나 동점을 서버 id 로 결정한다.
- 서버를 추가하면 이동하는 키는 새 서버로만 가지만, **데이터를 실제로 옮기는 작업**은 별개다. 이동 중 읽기 경로(옛 서버 → 새 서버 폴백)를 설계한다.

## 실무에서

- 로드 밸런서·프록시·분산 캐시 클라이언트가 백엔드를 고를 때 단순한 구현 때문에 자주 선택된다.
- 메시징·스트림 플랫폼과 분산 DB 에서 파티션/작업 소유자를 결정하는 데 쓴다(위 사용 사례 참고).
- 서버가 많은 분산 DB 는 링+vnode(Cassandra 등)나 Jump consistent hash 가 흔하다 → [일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/)에 변형 비교가 있다.
