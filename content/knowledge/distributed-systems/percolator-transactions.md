---
title: Percolator 방식 분산 트랜잭션
aka: [Percolator, Percolator Transactions, Snapshot Isolation on Bigtable, Primary Lock, Timestamp Oracle, TSO, 2PC with Primary Lock]
category: distributed-systems
level: advanced
summary: 트랜잭션 코디네이터 없이, 키-값 저장소의 행 단위 원자성만으로 스냅숏 격리 다중 행 트랜잭션을 만드는 방식. 타임스탬프 오라클과 primary 잠금 하나가 커밋 지점을 정한다.
tags: [distributed-systems, transactions, percolator, snapshot-isolation, two-phase-commit, timestamp-oracle, mvcc]
related: [distributed-systems/two-phase-commit-vs-saga, distributed-systems/spanner-truetime, distributed-systems/hybrid-logical-clock, data-modeling/transaction-isolation, data-modeling/mvcc-vacuum, data-modeling/optimistic-pessimistic-locking, distributed-systems/consistency-models]
sources:
  - https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Peng.pdf
  - https://research.google/pubs/large-scale-incremental-processing-using-distributed-transactions-and-notifications/
updatedAt: 2026-11-19
---

## 문제

Bigtable 같은 저장소는 **한 행 안에서만** 원자적이다. 웹 색인처럼 여러 행(문서, 링크, 중복 판정 표)을 함께 고쳐야 하는 일을 점진적으로 처리하려면 행을 가로지르는 트랜잭션이 필요하다. 별도 트랜잭션 관리자 서버를 두면 그것이 병목이자 장애 지점이 된다.

## 해법: 락과 커밋 기록을 데이터와 같은 곳에 둔다

Google 의 Percolator 논문(OSDI 2010)이 쓴 설계다. 저장소는 시간에 따라 값을 여러 버전으로 갖는 다중 버전 표로 본다.

**셀마다 열을 나눠 둔다** (예: 계좌 잔액 열 `bal`)

| 열 | 내용 |
| --- | --- |
| `bal:data` | 시작 타임스탬프를 키로 한 실제 값 |
| `bal:lock` | 아직 커밋되지 않은 쓰기가 잠근 흔적. primary 의 위치를 가리킴 |
| `bal:write` | 커밋 타임스탬프 → 어느 시작 타임스탬프의 데이터를 가리키는지 |

**타임스탬프 오라클**은 엄격히 증가하는 번호를 나눠 주는 서버다. 트랜잭션은 시작 때와 커밋 때 두 번 번호를 받는다.

**읽기**: 시작 타임스탬프 `S` 이하의 가장 최근 `write` 기록을 따라가 값을 읽는다. 그 범위에 `lock` 이 있으면 쓰는 중이므로 기다린다. 잠금 없이 일관된 스냅숏을 읽는다.

**쓰기(커밋)**

1. **Prewrite**: 쓸 셀마다 (a) `S` 이후 커밋된 기록이 있거나 (b) 이미 잠금이 있으면 abort. 아니면 `S` 위치에 데이터를 쓰고 잠금을 건다. 쓸 셀 중 하나를 **primary**, 나머지를 secondary 로 정하고, 모든 잠금에 primary 위치를 적는다.
2. **커밋 지점**: 커밋 타임스탬프 `C` 를 받아 primary 의 잠금을 지우고 `write` 기록을 쓴다. 이 한 번의 행 단위 원자 연산이 트랜잭션의 성패를 정한다.
3. 나머지 셀도 같은 방식으로 `write` 기록을 쓰고 잠금을 지운다. 이 단계는 실패해도 된다.

2PC 와 닮았지만 **코디네이터의 영속 상태가 없다.** 결정이 primary 셀 하나에 기록돼 있기 때문이다 → [2PC 와 사가](/develop-wiki/knowledge/distributed-systems/two-phase-commit-vs-saga/).

### 클라이언트가 죽으면: 느긋한 정리

클라이언트가 중간에 죽으면 잠금이 남는다. 다른 트랜잭션이 이를 만나면 primary 를 본다.

- primary 의 잠금이 **write 기록으로 바뀌어 있으면** 이미 커밋된 트랜잭션이다. 남은 잠금을 write 기록으로 바꿔 **롤 포워드**한다.
- primary 에 잠금이 **그대로** 있고 소유자가 죽은 것으로 보이면 primary 를 지우고 **롤백**한다. 롤백과 커밋이 둘 다 primary 를 건드리므로 행 트랜잭션 하나만 성공한다. 살아 있던 소유자와의 경쟁도 안전하다.

죽었는지 판단은 단순하다. 워커가 Chubby 에 올려 둔 생존 토큰, 그리고 잠금에 적은 벽시계 시각(너무 오래되면 정리)을 쓴다. 논문은 이런 느긋한 정리가 커밋을 수십 초 늦출 수 있고 색인 구축에는 괜찮지만 OLTP 에는 맞지 않는다고 말한다.

### 직접 돌려 본 결과

위 프로토콜을 메모리 모델로 구현해 시나리오를 실행했다(행 단위 원자성은 단일 스레드가 대신함).

| 시나리오 | 결과 |
| --- | --- |
| 정상 이체(Bob 10→7, Joe 2→5) | 커밋, 읽기 7·5 |
| primary 커밋 직후 클라이언트 사망 | Joe 읽기가 잠금에 막힘 → 정리가 **롤 포워드** → 5 |
| primary 커밋 전 사망 | 잠금에 막힘 → 정리가 **롤백** → 10·2 유지 |
| 같은 셀을 동시에 쓰는 두 트랜잭션 | 하나만 커밋 |
| 서로 다른 셀을 쓰는 두 트랜잭션(불변식 x+y≥1, 둘 다 1 에서 시작해 각자 하나를 0 으로) | **둘 다 커밋**, 최종 0·0 (**write skew**) |
| 이전 시작 시각 트랜잭션의 읽기 | 이후 커밋을 못 보고 옛 값 유지 |

```ts
// Prewrite 의 두 검사와 커밋 지점이 핵심 (단일 셀 단위, 저장소가 행 원자성을 보장한다고 가정)
function prewrite(c: Cell, startTs: number, v: string, primary: string): boolean {
  if ([...c.write.keys()].some((t) => t >= startTs)) return false; // 스냅숏 이후 다른 커밋 → 쓰기-쓰기 충돌
  if (c.lock) return false;                                         // 이미 다른 트랜잭션이 잠금
  c.data.set(startTs, v); c.lock = { startTs, primary }; return true;
}
function commitPrimary(c: Cell, startTs: number, commitTs: number): boolean {
  if (c.lock?.startTs !== startTs) return false;                   // 누가 정리해 버렸다면 커밋 불가
  c.write.set(commitTs, startTs); c.lock = undefined; return true; // 커밋 지점
}
```

## 언제 쓰나

- 쓰기 지연보다 **처리량과 확장성**이 중요한 대규모 배치·점진 처리, 그리고 저장소가 행(키) 단위 원자 연산과 다중 버전만 제공할 때.
- Percolator 모델을 따랐다고 알려진 제품이 있으나 이 노트는 제품 문서를 확인하지 않았다. 채택 여부와 변형은 각 제품 문서를 따로 본다.

## 주의 (비용)

- **스냅숏 격리**이지 직렬화 가능이 아니다. 위 실험처럼 write skew 가 생긴다. 불변식이 여러 셀에 걸치면 같은 셀에 쓰기를 강제하는 식의 우회가 필요하다 → [트랜잭션 격리 수준](/develop-wiki/knowledge/data-modeling/transaction-isolation/).
- **쓰기 증폭이 크다.** 논문 측정에서 셀 하나를 쓰고 커밋하는 최악의 경우 Bigtable 대비 약 4배의 오버헤드가 났다. 잠금 확인용 읽기, 잠금 쓰기, 잠금 제거 쓰기가 추가되기 때문이다. 이 벤치마크는 타임스탬프 오라클 비용을 포함하지 않는다.
- **타임스탬프 오라클이 단일 지점**이다. 논문은 한 대가 초당 약 200만 개를 내주고, 워커가 요청을 묶어(batch) 보내 부하를 낮춘다고 설명한다. 지역이 여러 개면 오라클까지의 왕복이 모든 트랜잭션에 더해진다. 시계 오차를 구간으로 다루는 방식과 비교 → [Spanner 와 TrueTime](/develop-wiki/knowledge/distributed-systems/spanner-truetime/), [HLC](/develop-wiki/knowledge/distributed-systems/hybrid-logical-clock/).
- **충돌하는 트랜잭션의 지연이 길다.** 전역 데드락 감지기가 없고 대기·정리가 느긋하다. 충돌하면 재시도·지수 백오프로 느려지고, 논문은 같은 키를 반복 갱신하는 경우(예: TPC-E 의 브로커 수수료)를 벤치마크에서 아예 뺀 뒤 증분을 별도 테이블에 쓰고 주기적으로 집계하자고 제안한다. 논문이 보고한 TPC-E 유사 벤치마크의 평균 트랜잭션 지연은 2~5초이고 이상치는 수 분(백오프·타블릿 불가용 영향)이며, OLTP 에 최적이 아니라고 인정한다.
- 읽기가 잠금을 만나면 기다려야 해서, 죽은 클라이언트의 잠금이 읽기 지연으로 번진다.
- 이 노트는 알림(observer) 기반 점진 처리 부분은 다루지 않는다. 논문에서 별도 장으로 설명한다.
