---
title: CockroachDB 병렬 커밋 (Parallel Commits)
aka: [Parallel Commits, STAGING Transaction Record, Implicit Commit, Transaction Recovery, 병렬 커밋, 암묵적 커밋]
category: distributed-systems
level: advanced
summary: 마지막 쓰기 배치와 트랜잭션 레코드의 STAGING 기록을 동시에 보내, 커밋 판정을 "목록의 쓰기가 모두 복제됐는가"라는 분산 조건으로 바꿔 합의 왕복을 두 번에서 한 번으로 줄이는 원자 커밋 프로토콜.
tags: [distributed-systems, cockroachdb, transactions, atomic-commit, latency, raft, implicit-commit]
related: [distributed-systems/tikv-vs-cockroachdb-transactions, distributed-systems/percolator-transactions, distributed-systems/two-phase-commit-vs-saga, distributed-systems/hybrid-logical-clock, distributed-systems/spanner-truetime, distributed-systems/calvin-deterministic-transactions, distributed-systems/replication-quorum]
sources:
  - https://www.cockroachlabs.com/blog/parallel-commits/
  - https://github.com/cockroachdb/cockroach/blob/master/docs/RFCS/20180324_parallel_commit.md
  - https://docs.cockroachlabs.com/docs/stable/architecture/transaction-layer
updatedAt: 2026-11-19
---

두 제품의 트랜잭션 구조 차이는 [TiKV vs CockroachDB](/develop-wiki/knowledge/distributed-systems/tikv-vs-cockroachdb-transactions/)에 한 줄로 요약돼 있다. 이 노트는 그중 **병렬 커밋 하나**를 단계별로 풀고, 안전하다는 근거와 한계를 정리한다.

## 문제

- 여러 범위(Range)에 걸친 트랜잭션은 쓰기 의도(intent)를 각 범위에 Raft 로 복제해야 하고, 그 뒤에 트랜잭션 레코드를 `COMMITTED` 로 바꿔야 커밋이 확정된다. 기존 순서는 "의도 복제 완료 대기 → 레코드를 COMMITTED 로 복제"여서 **합의 왕복이 직렬로 두 번**이다.
- 지리 분산 배포에서는 합의 한 번이 리전 간 RTT 한 번이므로, 커밋 지연이 곧 RTT 두 배다. 클라이언트가 보는 `COMMIT` 응답이 그만큼 늦다.

## 해법

### 단계

공식 블로그와 설계 RFC 를 자기 말로 정리한다.

1. 트랜잭션의 마지막 배치(쓰기 의도들)를 보낼 때 **같은 시점에** 트랜잭션 레코드를 `STAGING` 상태로 쓴다. 레코드에는 이 배치에서 약속한 쓰기들의 목록(키와 시퀀스 번호)이 담긴다(RFC 는 이를 in-flight writes, promised writes 로 부른다).
2. 코디네이터는 의도 쓰기들과 `STAGING` 쓰기가 **모두 성공하면** 클라이언트에 커밋을 응답한다. 사용자 관점의 지연은 합의 한 번이다.
3. 응답 뒤에 레코드를 `COMMITTED` 로 바꾸고 의도를 해소하는 일은 비동기로 한다.

### 암묵적 커밋 조건 (implicit commit)

`STAGING` 레코드가 있는 트랜잭션은 **레코드에 나열된 모든 쓰기가 실제로 복제돼 있으면 커밋된 것**으로 본다. 상태는 한 필드가 아니라 "레코드 + 여러 범위의 쓰기 존재 여부"의 조합으로 결정되는 분산 조건이다. 코디네이터가 `COMMITTED` 로 바꾸기 전에 죽어도 결과는 이미 정해져 있다.

### 상태 복구 (코디네이터가 죽었을 때)

다른 트랜잭션이 `STAGING` 레코드를 만나면 판정을 해야 한다.

1. 목록의 각 쓰기가 해당 타임스탬프·시퀀스로 존재하는지 확인한다. RFC 는 `QueryIntent` 요청에 "막기(prevent)" 플래그를 줘 확인과 차단을 한 번에 한다고 설명한다.
2. **없는 쓰기**를 발견하면 그 쓰기가 나중에라도 쓰이지 못하도록 막고(블로그: 타임스탬프 캐시 사용) 트랜잭션을 **중단**으로 판정한다.
3. 모두 있으면 **커밋**으로 판정해 레코드를 `COMMITTED` 로 만든다.
4. 여러 복구자가 경쟁하거나 코디네이터가 재시작해도, 레코드에 대한 조건부 쓰기로 정리한다.

핵심은 2번의 **차단**이다. 복구자가 "아직 없다"고 보고 중단 판정을 내린 뒤에 늦게 도착한 쓰기가 성공해 버리면, 코디네이터는 모두 성공했다고 믿고 커밋을 응답하는 모순이 생긴다. 차단으로 "중단 판정 이후에는 그 쓰기가 성공할 수 없다"를 보장해 결과가 한 가지로 정해진다.

### 규칙을 무작위 인터리빙으로 확인

위 규칙만 따로 떼어, 쓰기 도착 시각·STAGING 도착 시각·코디네이터 사망·복구자 개입 시각을 무작위로 뽑은 20만 번의 시행으로 확인했다(쓰기 1~5개).

- 코디네이터가 커밋을 응답한 시행에서 복구자가 중단으로 판정한 경우: 0 건.
- 복구자가 중단으로 판정했는데 목록의 모든 쓰기가 존재한다고 평가된 경우: 0 건.
- 지연 모형(쓰기 5개를 병렬로 보내는 구간, RTT 10~150ms, ±10% 변동): 직렬 방식 평균이 RTT 의 약 2.07배, 병렬 커밋이 약 1.07배로 비율 0.52.

이 시뮬레이션은 **"쓰기 차단"을 가정으로 포함**하므로 프로토콜 구현의 증명이 아니라 규칙의 논리 확인이다. 지연 모형도 합의 시간을 RTT 하나로 단순화한 것이다. 공식 블로그는 같은 방향의 결과로 교차 범위 트랜잭션이 대략 절반 시간으로 줄었다고 보고하며, 직렬 방식은 RTT 증가의 약 두 배로, 병렬 커밋은 RTT 와 같은 비율로 지연이 늘었다는 그림을 제시한다(3개 지역에 `tc` 로 지연을 주입한 벤치마크, TPC-C New Order 로 측정).

```ts
// 복구 판정 의사 코드 (설명용; 실제는 범위별 요청과 조건부 쓰기로 구현됨)
type Verdict = 'COMMITTED' | 'ABORTED';
async function recover(rec: { status: 'STAGING'; promised: { key: string; seq: number }[] }, store: Store): Promise<Verdict> {
  for (const w of rec.promised) {
    const found = await store.queryIntent(w.key, w.seq, { preventIfMissing: true }); // 없으면 이후 쓰기 차단
    if (!found) return 'ABORTED';
  }
  return 'COMMITTED';
}
```

## 언제 쓰나

- 여러 범위·리전에 걸친 읽기-쓰기 트랜잭션의 커밋 지연이 병목인 CockroachDB 사용자. 블로그 기준 v19.2 부터 도입된 기능이며, 쓰는 쪽이 따로 할 일은 거의 없다(자동 적용).
- 다른 시스템에서 비슷한 구조를 설계할 때 "커밋 상태를 한 필드가 아닌 분산 조건으로 둔다"는 아이디어의 참고. [Percolator](/develop-wiki/knowledge/distributed-systems/percolator-transactions/)의 primary 키 커밋 방식, TiDB 의 비동기 커밋과 비교한다.

## 주의·비용

- **복구가 비싸다.** 코디네이터 사망·경합 시 복구자가 여러 범위에 질의를 보내야 한다. 블로그는 코디네이터가 하트비트와 비동기 `COMMITTED` 갱신으로 복구가 일상 경로에 안 오게 한다고 설명한다.
- RFC 가 밝힌 제약: 범위 삭제(`DeleteRange`) 같은 범위 쓰기나 커밋 트리거가 든 배치는 대상이 아니다. 약속한 쓰기는 반드시 의도를 남겨야 하므로 아무 일도 안 하는 쓰기는 마지막 배치에 올 수 없다. `STAGING` 을 보낸 뒤에는 그 에포크의 약속 쓰기를 바꿀 수 없다.
- **모호한 커밋 오류가 늘 수 있다.** 더 많은 일이 커밋과 병렬로 진행돼서, 응답을 못 받은 클라이언트가 결과를 모르는 경우가 있다. 재시도 설계에서 [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/)이 필요하다.
- RFC 는 WAL 쓰기가 늘어 처리량이 줄 수 있고 복잡도가 이상 현상(anomaly) 위험을 키운다고 스스로 한계를 적는다. 블로그의 절반 지연 수치는 **경합이 낮은 교차 범위 트랜잭션**에 대한 헤드라인 값이며 모든 워크로드에 대한 보장이 아니다(블로그가 한계를 명시한 절은 없고, 이는 글의 측정 조건에서 이끌어 낸 해석).
- 단일 범위 트랜잭션은 애초에 합의 한 번이라 이 최적화의 이득이 없다.

> 출처 확인 범위: CockroachDB 블로그 "Parallel Commits", 설계 RFC `20180324_parallel_commit.md`(WebFetch 요약으로 읽음, 원문 전체 직접 열람은 아님), 트랜잭션 계층 문서(이전 노트 작성 때 읽음)를 근거로 했다. 미확인: 현재 버전의 병렬 커밋 적격 조건 변화, 학술 논문 형태의 안전성 증명(별도 TLA+ 모델이 있는지), 경합 상황의 실측. 위 시뮬레이션은 직접 작성한 모형이다.
