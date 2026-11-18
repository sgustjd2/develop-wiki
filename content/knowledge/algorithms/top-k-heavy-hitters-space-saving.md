---
title: Top-K 와 Heavy Hitters (Space-Saving)
aka: [Top-K, Heavy Hitters, Frequent Items, Space-Saving, Misra-Gries, HeavyKeeper, Stream Summary, 빈발 원소]
category: algorithms
group: algorithm
level: advanced
summary: 끝없는 스트림에서 가장 자주 나오는 원소를 고정된 작은 메모리로 찾는 알고리즘. Space-Saving 은 카운터 m 개만 유지하고 오차를 N/m 이하로 보장하며, 결과는 근삿값이다.
tags: [streaming, heavy-hitters, top-k, space-saving, misra-gries, sketch, approximation]
related: [algorithms/hyperloglog-count-min-sketch, algorithms/heap-priority-queue, algorithms/hash-table, algorithms/bloom-filter, algorithms/space-time-tradeoff, algorithms/linked-list]
sources:
  - https://www.cs.ucsb.edu/research/tech-reports/2005-23
  - https://cse.hkust.edu.hk/~raywong/comp5331/References/EfficientComputationOfFrequentAndTop-kElementsInDataStreams.pdf
  - https://en.wikipedia.org/wiki/Misra%E2%80%93Gries_heavy_hitters_algorithm
  - https://redis.io/docs/latest/develop/data-types/probabilistic/top-k/
updatedAt: 2026-11-19
---

## 문제

검색 로그, 요청 URL, 네트워크 패킷 스트림에서 "가장 많이 나온 상위 K개"를 알고 싶다.

- 정확한 방법: 해시 맵으로 전부 세고 정렬한다. 서로 다른 원소 수(카디널리티)에 비례하는 메모리가 든다. 아래 실험의 100만 건 스트림만 해도 서로 다른 키가 47,316개였다. 실제 서비스에서는 수억 개로 불어난다.
- 목표: 원소 종류 수와 무관한 **고정 메모리 m**, 스트림을 **한 번만** 훑기, 그리고 오차의 **보장**.

용어: n 건 스트림에서 빈도가 `n/k` 를 넘는 원소가 **heavy hitter(빈발 원소)** 다. 스트림 용 Top-K 는 이 문제의 정렬된 변형이다.

## Misra–Gries (1982)

가장 오래된 방법(Misra·Gries, "Finding repeated elements")이다. Boyer–Moore 다수결 투표를 일반화한다. 원소와 카운터를 최대 k 개까지만 보관한다. 이미 있는 원소면 +1, 새 원소이고 자리가 있으면 추가, 자리가 없으면 **모든 카운터를 −1** 하고 0 이 된 것은 버린다. 빈도 `n/k` 를 넘는 원소는 반드시 남으므로 후보를 보장하지만, 후보가 정말 임계값을 넘는지는 **두 번째 패스**로 확인해야 한다(Wikipedia).

## Space-Saving (Metwally, Agrawal, El Abbadi, ICDT 2005)

한 패스로 빈발 원소와 Top-K 를 둘 다 풀고, 각 카운터의 오차를 함께 추적한다.

- 카운터를 **정확히 m 개** 유지한다. 각 카운터는 `(원소, count, error)`.
- 모니터링 중인 원소가 오면 `count++`.
- 모니터링되지 않는 새 원소가 오고 자리가 비어 있으면 `(원소, 1, 0)` 으로 넣는다.
- 자리가 없으면 **count 가 가장 작은 카운터(= min)** 를 새 원소가 물려받는다: `count = min + 1`, `error = min`. 새 원소가 "이전 주인의 min 만큼 억울하게 이미 센 것"이라고 보수적으로 가정한다.

```ts
interface Slot { item: string; count: number; error: number }

class SpaceSaving {
  private slots = new Map<string, Slot>();
  total = 0;
  constructor(private readonly m: number) {}

  offer(item: string): void {
    this.total++;
    const s = this.slots.get(item);
    if (s) { s.count++; return; }
    if (this.slots.size < this.m) { this.slots.set(item, { item, count: 1, error: 0 }); return; }
    // 가장 작은 카운터를 새 원소가 물려받는다: count = min + 1, error = min
    // (설명용 O(m) 탐색. 논문의 Stream-Summary 는 count 별 버킷 연결 리스트로 O(1))
    let min: Slot | undefined;
    for (const x of this.slots.values()) if (!min || x.count < min.count) min = x;
    this.slots.delete(min!.item);
    this.slots.set(item, { item, count: min!.count + 1, error: min!.count });
  }

  top(k: number): Slot[] {
    return [...this.slots.values()].sort((a, b) => b.count - a.count).slice(0, k);
  }
}
```

### 보장 (스트림 길이 N, 카운터 m 개)

논문의 보조정리·정리를 요약하면 다음과 같다.

- 모든 카운터의 합은 N 이므로 최소 카운터 `min ≤ ⌊N/m⌋`.
- **빈도가 `min` 보다 큰 원소는 반드시 모니터링된다.** 즉 빈도가 `N/m` 를 넘는 원소는 절대 놓치지 않는다.
- 어떤 원소의 `count` 는 실제 빈도 이상이며(과대 추정), 과대 추정량은 그 카운터의 `error` 이하다. 실제 빈도는 `[count − error, count]` 안에 있다.
- 오차가 작으면 순위도 확정할 수 있다. 논문의 빈발 원소 질의는 보고한 결과가 모두 진짜 빈발 원소인지를 `guaranteed` 불리언으로 함께 돌려준다.

### Stream-Summary 구조

카운터를 count 값별로 묶은 **버킷의 이중 연결 리스트**(오름차순)로 두고, 원소→카운터 해시 맵을 곁들인다. 같은 count 의 카운터는 한 버킷에 연결된다. 카운터를 +1 하면 바로 다음 버킷(count+1)으로 옮기는 O(1) 작업이고, 최솟값은 항상 첫 버킷에서 바로 꺼낸다(논문). 위 코드의 O(m) 탐색이 이 구조로 O(1) 이 된다.

### 실험

Zipf(1/rank) 분포로 어휘 5만 개에서 100만 건을 뽑아 카운터 m=200 개로 돌렸다(정확한 맵은 47,316 항목 vs Space-Saving 200 슬롯).

| 순위 | 추정 | 오차 상한 | 실제 |
| --- | --- | --- | --- |
| 1 | 87,725 | 0 | 87,725 |
| 5 | 17,595 | 0 | 17,595 |
| 9 | 9,729 | 1 | 9,728 |

상위 10개 재현율은 10/10 이었다. 이론 보장은 빈도가 N/m = 5,000 을 넘으면 놓치지 않는다는 것이고, 치우친(skewed) 분포일수록 상위 원소의 오차가 작다. 논문도 Zipf 처럼 치우친 데이터에서 공간이 크게 줄어든다고 보고한다. 균등에 가까운 분포에서는 "상위"가 의미가 없고 오차 상한이 커진다.

## 다른 접근: 스케치와 HeavyKeeper

- **[Count-Min Sketch](/develop-wiki/knowledge/algorithms/hyperloglog-count-min-sketch/) + 힙**: 해시 d 줄 × w 칸 카운터로 빈도를 추정하고, 크기 K 의 [힙](/develop-wiki/knowledge/algorithms/heap-priority-queue/)에 상위를 유지한다. 모든 원소에 대한 빈도 추정이 가능하고, 같은 크기의 스케치끼리 칸별 덧셈으로 **병합**하기 쉽다.
- **HeavyKeeper**(Gong 외, USENIX ATC 2018): "카운트 + 지수 감쇠"로 작은 흐름(mouse)을 밀어내고 큰 흐름(elephant)은 거의 건드리지 않는다. Redis 의 `TOPK.*` 명령이 이 알고리즘을 쓴다. 문서에 따르면 해시 테이블(확률적 카운트)과 K개 최소 힙을 함께 쓰고, 기본 파라미터는 width 7, depth 8, decay 0.9 이며 `width = k·log(k)`, `depth = log(k)`(최소 5) 정도를 크기 지침으로 제시한다.

| | Misra–Gries | Space-Saving | Count-Min + 힙 | HeavyKeeper |
| --- | --- | --- | --- | --- |
| 카운터 | k 개 | m 개(원소 이름 포함) | w×d 개(이름 없음) + 힙 | w×d 개 + 힙 |
| 오차 방향 | 과소 추정 | **과대 추정** | 과대 추정 | 감쇠로 편향 |
| 상위 순서 | 추가 패스 필요 | 한 패스 + 오차 정보 | 힙 유지 | 힙 유지 |

## 언제 쓰나

- 인기 검색어·트렌딩 해시태그, 가장 많이 호출되는 API·URL, 핫 키 탐지(캐시·샤드 부하 분산).
- 네트워크의 엘리펀트 플로우, DDoS 탐지("특정 IP·주소로 갑자기 몰림").
- 윈도(최근 1시간) 단위로 쓸 때는 윈도마다 구조를 만들거나 시간 감쇠를 결합한다.

## 주의

- **결과는 근삿값**이다. 순위 확정이 필요하면 `error` 를 확인하고, 상위 후보를 정확 집계 시스템으로 다시 검증하는 2단계 구조로 설계한다.
- **m 이 너무 작으면** 분포가 평평할 때 상위 K 가 무의미해진다. `N/m` 이 K 번째 빈도보다 한참 작아야 한다.
- **초반 편향**: 스트림이 짧을 때는 카운터가 비어 있어 괜찮지만, 가득 찬 뒤 새 원소가 연달아 들어오면 min 이 계속 오른다.
- **병렬·분산 집계**(여러 노드에서 따로 센 뒤 합치기)는 구조마다 난이도가 다르다. 병합이 필요하면 Count-Min 계열이 낫다.
- 모든 카운터가 하나의 키 공간에 의존하므로 **키 정규화**(대소문자, 쿼리 파라미터)를 먼저 한다. 정규화가 안 되면 인기 항목이 여러 조각으로 나뉘어 순위에서 사라진다.
- 개인정보가 키에 있는 로그라면 카운터 안의 원소 이름이 그대로 노출된다. 해시나 접두사 마스킹을 고려한다.

## 실무에서

- Redis Stack(RedisBloom)의 `TOPK.RESERVE`/`ADD`/`LIST`/`QUERY` 가 HeavyKeeper 기반 구현이다. `TOPK.ADD` 는 목록에서 밀려난 원소를 반환해 실시간으로 "누가 들어오고 나갔는지" 알 수 있다.
- 정확한 순위가 필요한 대시보드는 로그 집계(배치) + 근사 스트림 결과를 병행하는 람다식 구성이 흔하다.
