---
title: 경계 부하 일관된 해싱(Consistent Hashing with Bounded Loads)
aka: [Consistent Hashing with Bounded Loads, CHWBL, Bounded-Load Consistent Hashing, hash-balance-factor, 용량 상한 해싱]
category: algorithms
group: algorithm
level: advanced
summary: 일관된 해싱의 링에 서버별 용량 상한(평균 부하의 1+ε 배)을 두고, 꽉 찬 서버는 건너뛰어 시계 방향 다음 서버로 보내는 변형. 최대 부하를 보장하는 대신 키 이동과 캐시 지역성 일부를 내준다.
tags: [consistent-hashing, bounded-loads, load-balancing, hashing, caching, haproxy, hot-key]
related: [algorithms/consistent-hashing, algorithms/rendezvous-hashing, algorithms/maglev-hashing, performance/load-balancing, performance/power-of-two-choices-load-balancing, performance/caching-strategies, data-modeling/sharding-partitioning]
sources:
  - https://arxiv.org/abs/1608.01350
  - https://research.google/blog/consistent-hashing-with-bounded-loads/
  - https://github.com/haproxy/haproxy/blob/master/doc/configuration.txt
updatedAt: 2026-11-19
---

## 문제

[일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/)은 서버가 바뀔 때 옮기는 키를 줄여 준다. 하지만 **균형은 보장하지 않는다.**

- 논문 초록에 따르면 일반 일관된 해싱의 균형은 무작위 배정보다 낫지 않다. 클라이언트 n 개, 서버 n 대면 많은 서버가 Θ(log n / log log n) 개를 받는다.
- 가상 노드를 늘리면 **키 개수**는 고르게 나뉜다. 그러나 요청이 몇몇 키에 몰리면(핫 키, Zipf 분포) 그 키를 맡은 서버가 과부하된다.
- 캐시 앞단 로드 밸런서라면 지역성(같은 키 → 같은 서버) 때문에 해시를 쓰는데, 바로 그 고정 배정이 핫스팟을 만든다.

## 해법

Mirrokni, Thorup, Zadimoghaddam(Google·코펜하겐대)이 2016년 arXiv 에 올린 방식이다(v3 2017년 7월). 공 = 키(또는 요청), 통 = 서버.

1. 서버마다 **용량 상한**을 둔다: 평균 부하 × c, c = 1+ε. 논문은 공 m 개, 통 n 개일 때 어떤 통도 ⌈cm/n⌉ 을 넘지 않는다고 보인다.
2. 키를 링에 놓고 시계 방향 첫 서버를 찾는다(일반 링과 같다).
3. 그 서버가 꽉 찼으면 **시계 방향으로 계속 걸어** 여유 있는 첫 서버에 넣는다.
4. Google 블로그 설명으로는 공을 해시값과 무관한 **고정 순서**(예: ID 순)로 배정하고, 공이나 통이 추가·삭제될 때마다 이 배정을 다시 계산한다.

ε 이 양쪽 성질을 맞바꾼다(논문 초록).

- 공이나 통 하나가 바뀔 때 옮겨지는 공의 기대 개수는 ε ≤ 1 이면 O(1/ε²) 배로만 늘어난다. 블로그는 이 값이 공·통의 총수와 무관하다고 설명한다.
- ε 이 작을수록 균형은 좋아지고(최대 부하 상한이 낮아짐) 일관성은 나빠진다(옮겨지는 키가 늘어남).

```ts
// 정적 배정: keys 를 고정 순서로 넣는다. ring 은 point 오름차순 [{ point, node }]
function assignBounded(
  ring: { point: number; node: string }[], nodes: string[], keys: string[],
  c: number, hash: (s: string) => number,
): Map<string, string> {
  const cap = Math.ceil((c * keys.length) / nodes.length);
  const load = new Map(nodes.map((n) => [n, 0]));
  const out = new Map<string, string>();
  for (const k of keys) {
    let i = lowerBound(ring, hash(k)) % ring.length; // 이분 탐색, 링 끝이면 0번으로
    while (load.get(ring[i].node)! >= cap) i = (i + 1) % ring.length; // 꽉 찼으면 다음
    load.set(ring[i].node, load.get(ring[i].node)! + 1);
    out.set(k, ring[i].node);
  }
  return out;
}

function lowerBound(ring: { point: number }[], h: number): number {
  let lo = 0, hi = ring.length;
  while (lo < hi) { const m = (lo + hi) >>> 1; if (ring[m].point < h) lo = m + 1; else hi = m; }
  return lo;
}
```

c > 1 이면 전체 용량(n × cap)이 공 수보다 크므로 루프는 반드시 끝난다. c = 1 이면 (m 이 n 의 배수일 때) 상한이 평균과 같아져 모든 서버가 정확히 꽉 차야 하고, 사실상 해시 순서가 무너진다.

### 요청 단위로 쓸 때(HAProxy)

HAProxy 의 `hash-balance-factor` 가 이 방식을 **동시 요청 수**에 적용한다(설정 문서 기준).

- `hash-type consistent` 와 함께 쓴다. 값은 100 보다 큰 백분율이고 0(기본)은 끄기다. 150 이면 어떤 서버도 활성 서버 평균 동시 요청의 1.5 배를 넘지 못한다.
- 첫 서버가 탈락하면 요청 해시를 따라 여유 있는 서버를 찾는다. 값이 낮을수록 평균적으로 더 많은 서버를 확인해야 해서 성능에 영향이 있다. 문서가 제시하는 합리적 범위는 125~200 이다.
- 서버 가중치를 존중하고, `balance random` 도 내부적으로 일관된 해싱을 쓰므로 이 설정이 적용된다.

## 직접 실행: 시뮬레이션

외부 라이브러리 없는 Node 스크립트(시드 고정). 해시는 [일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/) 노트의 FNV-1a + murmur3 마무리 섞기와 같다.

**1) 정적 배정**: 서버 10 대, 키 10,000 개, 위 코드와 같은 방식. "서버 추가"는 11 번째 서버를 넣고 전체를 다시 배정했을 때 담당이 바뀐 키 비율이다.

| c | 가상 노드 1 개: 최대/평균 | 탐색 추가 횟수/키 | 서버 추가 시 이동 | 가상 노드 100 개: 최대/평균 | 서버 추가 시 이동 |
| --- | --- | --- | --- | --- | --- |
| ∞ (일반 링) | 2.55 | 0 | 2.3% | 1.21 | 10.7% |
| 2.0 | 2.00 | 0.15 | 7.4% | 1.21 | 10.7% |
| 1.5 | 1.50 | 0.50 | 14.8% | 1.21 | 10.7% |
| 1.25 | 1.25 | 0.99 | 24.1% | 1.21 | 10.7% |
| 1.1 | 1.10 | 1.53 | 24.0% | 1.10 | 11.7% |
| 1.05 | 1.05 | 1.75 | 23.0% | 1.05 | 11.8% |

- 상한은 정확히 지켜진다(최대/평균 = c).
- 가상 노드가 1 개면 링 자체가 치우쳐 상한이 자주 작동하고, 그만큼 서버 추가 때 키가 많이 움직인다. 이상적인 1/11 ≈ 9.1% 보다 훨씬 많다.
- 가상 노드 100 개에서는 링이 이미 1.21 배 안쪽이라 c ≥ 1.25 에서는 상한이 거의 작동하지 않는다. **키 개수 균형만 문제라면 가상 노드로 충분하다.** 상한은 그보다 빡빡하게 묶을 때만 비용을 낸다.
- 가상 노드 1 개, 서버 추가 시 2.3% 는 새 서버가 링에서 짧은 구간을 받은 우연이다. 일반 링의 이동량이 서버 위치에 따라 크게 흔들린다는 뜻이기도 하다.

**2) 요청 단위, 핫 키(HAProxy 방식 모델)**: 서버 10 대(가상 노드 100), 키 1,000 개를 Zipf(s=1.1) 로 요청, 포아송 도착, 요청 하나가 서버를 지수분포(평균 1) 시간 동안 점유. 서버당 평균 동시 요청 20. 상한은 "현재 전체 동시 요청 수 × c / 10" 이다. 시드 3 개 중 대표값(시드 간 차이는 ±1 이내).

| c | 첫 서버로 간 비율 | 가장 바쁜 서버 동시 요청(평균) | (최댓값) | 키·서버 조합 수 |
| --- | --- | --- | --- | --- |
| ∞ | 100% | 43.1 | 71 | 1,000 |
| 2.0 | 96.8% | 38.1 | 52 | 1,286 |
| 1.5 | 86.5% | 30.3 | 39 | 1,729 |
| 1.25 | 75.3% | 25.6 | 32 | 2,290 |

- 상한이 없으면 핫 키를 맡은 서버가 평균의 2 배 넘게 상시 바쁘고, 순간 최대 3.5 배까지 간다. 가상 노드로는 고칠 수 없는 부분이다.
- c 를 낮출수록 최대 부하는 줄지만 **첫 서버 적중률이 떨어진다.** 키·서버 조합 수는 "한 키가 몇 개 서버의 캐시에 올라가는가"의 근사인데, c = 1.25 에서 2.3 배로 늘었다. 캐시 지역성과 메모리 효율을 그만큼 내준 것이다.
- Zipf 지수를 0.8 로 낮추면(덜 쏠림) c = 2.0 에서 첫 서버 비율 99.9% 로 상한이 거의 작동하지 않았다. 쏠림이 클수록 효과와 비용이 함께 커진다.

실행: `node chbl.mjs static 1`, `node chbl.mjs static 100`, `node chbl.mjs dynamic 1.1 <seed>`. 스크립트는 저장소에 넣지 않았다. 핵심 로직은 위 TypeScript 와 같고, 동적 모델은 요청 도착마다 위 상한으로 걸음을 반복한다.

## 언제 쓰나

- **캐시 지역성이 필요한데 핫 키가 있는** 로드 밸런싱: CDN·비디오 세그먼트 캐시, 키별 캐시 서버 앞단. Google 블로그에 따르면 Vimeo 의 엔지니어가 HAProxy 에 구현해 캐시 대역폭을 거의 8 분의 1 로 줄였고, Google Cloud Pub/Sub 에도 적용됐다(Pub/Sub 수치는 공개되지 않음).
- 키를 처리하는 작업자 수가 바뀌어도 대부분의 키가 같은 작업자에 남아야 하고, 동시에 한 작업자가 평균의 몇 배를 넘으면 안 될 때.
- 일관된 해싱을 이미 쓰는데 최대 부하가 문제일 때. 별도 시스템 없이 상한 하나로 넣을 수 있다.

## 주의 (비용)

- **일관성이 줄어든다.** 넘친 키는 이웃 서버로 밀리고, 밀린 키가 다시 다른 키를 밀어낸다. 위 표처럼 서버 추가 시 이동량이 일반 링보다 늘 수 있다. ε 이 작을수록 심하다(O(1/ε²)).
- **배정이 순서·현재 부하에 의존한다.** 정적 방식은 모든 키를 고정 순서로 다시 배정해야 같은 결과가 나온다. 요청 단위 방식은 현재 동시 요청 수에 따라 같은 키가 매번 다른 서버로 갈 수 있다. 여러 로드 밸런서 인스턴스가 각자 자기 부하만 보면 인스턴스마다 다른 결정을 한다.
- **캐시 중복**: 핫 키가 여러 서버 캐시에 퍼진다. 메모리와 원본 요청이 늘 수 있다. 반대로 핫 키 하나를 여러 서버가 나눠 맡는 효과이기도 하다.
- **탐색 비용**: c 가 1 에 가까울수록 키당 확인하는 서버가 늘어난다(위 표 1.05 에서 키당 1.75 회 추가). HAProxy 문서도 같은 이유로 125~200 을 권한다.
- **부하 신호의 질이 상한이다.** 요청 단위 방식의 "부하"는 동시 요청 수다. 요청 비용 편차가 크면 실제 CPU 부하와 어긋난다.
- **용량을 늘려 주지는 않는다.** 전체가 과부하면 상한은 넘친 요청을 돌릴 곳이 없다 → [백프레셔·로드 셰딩](/develop-wiki/knowledge/performance/backpressure-load-shedding/).

## 비교

| | 일반 링 + vnode | 경계 부하 링 | [P2C](/develop-wiki/knowledge/performance/power-of-two-choices-load-balancing/) | [랑데부 해싱](/develop-wiki/knowledge/algorithms/rendezvous-hashing/) |
| --- | --- | --- | --- | --- |
| 지역성(키 → 서버 고정) | 강함 | 대부분 유지, 넘칠 때만 깨짐 | 없음 | 강함 |
| 최대 부하 보장 | 없음 | 평균 × c | 확률적으로 좋음 | 없음 |
| 핫 키 | 그대로 한 서버 | 넘침이 이웃으로 분산 | 키 개념이 없음 | 그대로 한 서버 |
| 필요한 상태 | 링 | 링 + 서버별 현재 부하 | 후보 두 개의 부하 | 서버 목록 |

[Maglev 해싱](/develop-wiki/knowledge/algorithms/maglev-hashing/)은 조회 테이블로 고른 분배와 빠른 조회를 노리지만 실시간 부하 상한은 없다.

## 검증 범위

arXiv 1608.01350 초록 페이지(저자, 상한 ⌈cm/n⌉, 이동량 O(1/ε²) 와 c ≥ 2 일 때 1 + O(log c / c))와 Google 연구 블로그(2017-04-03, 알고리즘 설명, Pub/Sub·Vimeo 사례)를 읽었다. 논문 본문의 증명, SODA 2018 게재 판과 arXiv 판의 차이는 확인하지 않았다(arXiv 페이지에는 게재처가 없다). HAProxy 는 저장소 `doc/configuration.txt`(master)의 `hash-balance-factor` 절을 읽었고, 실제 HAProxy 를 띄워 측정하지는 않았다. Vimeo 의 "약 8 분의 1" 은 Google 블로그의 재인용이며 Vimeo 원문은 읽지 않았다. 시뮬레이션은 단일 프로세스·단순 모델이라 수치는 방향성 확인용이다.
