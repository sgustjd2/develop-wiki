---
title: Maglev 해싱
aka: [Maglev Hashing, Maglev Consistent Hashing, Lookup Table Hashing, Google Maglev]
category: algorithms
group: algorithm
level: advanced
summary: 백엔드마다 소수 크기 조회표의 선호 순서를 만들고 번갈아 빈 칸을 채워, 부하를 거의 완벽히 균등하게 나누면서 백엔드 변경 시 이동도 적게 유지하는 Google Maglev 의 일관된 해싱.
tags: [maglev, consistent-hashing, load-balancing, lookup-table, hash, google]
related: [algorithms/consistent-hashing, algorithms/rendezvous-hashing, algorithms/hash-functions-hashdos, performance/load-balancing, cs-fundamentals/load-balancer-l4-l7, algorithms/hash-table]
sources:
  - https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf
  - https://arxiv.org/abs/1406.2294
updatedAt: 2026-11-19
---

## 문제

패킷·연결을 N 개 백엔드로 나누는 L4 로드 밸런서는 두 가지를 동시에 원한다.

- **균등한 분배**: 한 백엔드가 몰리면 나머지를 과잉 확보해야 한다.
- **최소 교란(minimal disruption)**: 백엔드가 빠지거나 추가돼도 기존 연결의 목적지가 최대한 안 바뀌어야 한다. 밸런서가 여러 대일 때 서로 연결 상태를 공유하지 않아도 같은 선택을 하게 하려는 목적이다.

[일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/)과 [랑데부 해싱](/develop-wiki/knowledge/algorithms/rendezvous-hashing/)은 최소 교란에 초점을 맞춘 방식이라, 균등함을 높이려면 표가 매우 커져야 한다. Maglev 논문(Google, NSDI 2016)은 반대로 **균등함을 우선하고 약간의 교란을 허용**하는 새 알고리즘을 만들었다.

## 해법: 선호 순서로 번갈아 칸 채우기

1. 크기 `M` 인 조회표를 만든다. `M` 은 **소수**이고 `N` 보다 훨씬 크다.
2. 백엔드 `i` 의 이름을 서로 다른 두 해시 `h1`, `h2` 로 해시해 `offset = h1 mod M`, `skip = h2 mod (M-1) + 1` 을 만든다.
3. 백엔드 `i` 의 **선호 순서**는 `permutation[i][j] = (offset + j × skip) mod M`. `M` 이 소수라 `skip` 과 서로소이고 0..M−1 전체의 순열이 된다.
4. 백엔드들이 차례로 돌아가며, 자기 선호 순서에서 **아직 비어 있는 첫 칸**을 가져간다. 표가 다 찰 때까지 반복한다.
5. 패킷은 5-튜플 등을 해시한 값 mod `M` 으로 표를 조회한다.

차례를 번갈아 채우므로 각 백엔드의 칸 수는 `⌊M/N⌋` 또는 `⌈M/N⌉` 로 **최대 1 차이**가 난다. 가중치는 차례 빈도를 바꿔 구현할 수 있다고 논문이 언급하지만 세부는 공개하지 않았다.

```ts
import { hash32 } from './common.ts';

// M 은 소수, N 은 백엔드 수. 각 백엔드가 자기 선호 순서대로 빈 칸을 번갈아 채운다
function maglevTable(backends: string[], M = 65537): number[] {
  const N = backends.length;
  const offset = backends.map((b) => hash32(b, 1) % M);
  const skip = backends.map((b) => (hash32(b, 2) % (M - 1)) + 1);
  const next = new Array<number>(N).fill(0);
  const entry = new Array<number>(M).fill(-1);
  for (let filled = 0; ; ) {
    for (let i = 0; i < N; i++) {
      let c = (offset[i] + next[i] * skip[i]) % M;
      while (entry[c] >= 0) c = (offset[i] + ++next[i] * skip[i]) % M;
      entry[c] = i; next[i]++;
      if (++filled === M) return entry;
    }
  }
}
const lookup = (t: number[], key: string) => t[hash32(key, 3) % t.length];
```

(`hash32` 는 [일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/) 노트와 같은 FNV-1a + 섞기 함수에 시드를 받게 한 설명용 해시다.)

백엔드 100대, `M = 65537`로 실행해 본 결과:

| 항목 | 값 |
| --- | --- |
| 백엔드별 칸 수 | 655 ~ 656 (거의 완벽히 균등) |
| 1대 제거 시 이동한 키 | 1.53% (제거된 서버의 몫은 0.99%) |
| 같은 실험, `M = 1009`(N 의 약 10배) | 칸 수 10 ~ 11, 이동 3.94% (제거 서버 몫 1.06%) |

`M` 이 작으면 균등함은 유지되지만 **무관한 키의 이동이 늘어난다.** 논문은 `M > 100×N` 으로 두면 칸 수 차이가 1% 이하라고 하고, 구글은 기본 `M = 65537` 을 쓴다고 한다(연결 추적이 1차 방어라 동시 장애는 드물다는 판단).

## 비교 (논문 5.3절의 실험 요지)

백엔드 1000대, 표 크기 65537 에서 Karger 방식(링)과 랑데부 방식은 균등함을 맞추려면 백엔드를 각각 29.7%, 49.5% 과잉 확보해야 했다. 표 크기를 655373 으로 키워야 10.3%, 12.3% 로 줄었다. Maglev 는 표 크기와 무관하게 거의 완벽히 균등했다. VIP(가상 IP)마다 표가 하나라 표 크기를 마음대로 키울 수 없다는 점이 핵심 이유다.

| | Maglev | 해시 링 + vnode | 랑데부(HRW) | Jump hash |
| --- | --- | --- | --- | --- |
| 균등함 | 칸 수 차이 ≤ 1 | vnode 수에 의존 | 좋음 | 매우 좋음 |
| 교란 | 작지만 0 이 아님(`M` 이 클수록 작음) | 이론상 최소 | 이론상 최소 | 끝 번호만 제거 가능 |
| 조회 | O(1) 표 조회 | O(log N·V) | O(N) | O(log n) |
| 표 생성 | 평균 O(M log M) | 정렬 | 불필요 | 불필요 |
| 맞는 곳 | 소프트웨어 L4 밸런서 | 분산 DB·캐시 | 서버 수가 적을 때 | 번호가 고정된 샤드 |

## 언제 쓰나

- **조회가 매우 빈번하고 지연이 중요한** 로드 밸런서(패킷마다 O(1) 표 조회).
- 같은 구성을 보고 **상태 공유 없이 같은 결정**을 내려야 하는 여러 밸런서 인스턴스.
- 백엔드 수가 수십~수백이고 부하 편차가 곧 비용(과잉 프로비저닝)일 때.

## 주의 (비용)

- **표를 다시 만들어야 한다.** 구성이 바뀔 때 평균 O(M log M) 이고, 논문 측정으로 `M` 이 65537 → 655373 으로 커지면 생성 시간이 1.8ms → 22.9ms 로 늘었다(이 때문에 표 크기를 무한정 키우지 못한다). 동시 변경이 잦으면 이 비용이 쌓인다.
- 최악 복잡도는 O(M²) 이다(백엔드 수가 `M` 에 가깝고 순열이 같을 때). `M ≫ N` 을 유지한다.
- **교란이 0 이 아니다.** 일관된 해싱 계열처럼 "빠진 서버의 키만 이동"을 보장하지 않는다. Maglev 도 연결 추적 테이블로 기존 연결을 지키고, 해시는 새 연결과 밸런서 간 불일치를 줄이는 보조 장치로 쓴다.
- 캐시 서버처럼 **이동 한 번이 비싼** 곳(캐시 미스 폭풍)이면 교란이 적은 링·랑데부 쪽이 맞을 수 있다. 용도가 다르다.
- 가중치 지원의 정확한 구현은 논문이 공개하지 않았다. 직접 구현하면 검증이 필요하다.
