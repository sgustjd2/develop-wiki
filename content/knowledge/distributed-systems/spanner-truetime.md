---
title: Spanner 와 TrueTime (외부 일관성)
aka: [Spanner, TrueTime, External Consistency, Commit Wait, Strict Serializability, 외부 일관성]
category: distributed-systems
level: advanced
summary: 시계 오차를 구간으로 노출하는 TrueTime 위에서, 커밋 시각을 정한 뒤 불확실 구간만큼 기다려(commit wait) 전역 트랜잭션에 실제 시간 순서를 보장하는 Spanner 의 설계.
tags: [distributed-systems, spanner, truetime, external-consistency, clocks, transactions, paxos]
related: [distributed-systems/logical-clocks, distributed-systems/consistency-models, distributed-systems/paxos-vs-raft, distributed-systems/two-phase-commit-vs-saga, distributed-systems/cap-pacelc, data-modeling/transaction-isolation]
sources:
  - https://research.google/pubs/spanner-googles-globally-distributed-database-2/
  - https://storage.googleapis.com/gweb-research2023-media/pubtools/1974.pdf
updatedAt: 2026-11-19
---

## 문제

지구 반대편의 두 데이터센터에서 트랜잭션 T1 이 커밋된 **뒤에** T2 가 시작됐다면, 모든 관찰자는 T2 가 T1 의 결과를 본다고 기대한다. 이것이 **외부 일관성(external consistency)** 이다. 서버마다 시계가 달라서 "뒤에"를 타임스탬프로 비교할 수 없는 것이 문제다. [논리 시계](/develop-wiki/knowledge/distributed-systems/logical-clocks/)는 인과 순서만 알려 주고 실제 시간 순서는 보장하지 않는다.

## 해법: 시계 오차를 숨기지 않고 구간으로 노출

Spanner 논문(Google, OSDI 2012 / TOCS 2013)의 TrueTime API 는 시각 하나가 아니라 **구간**을 돌려준다.

| 호출 | 의미 |
| --- | --- |
| `TT.now()` | `[earliest, latest]`. 호출 시점의 실제 시각을 반드시 포함하는 구간 |
| `TT.after(t)` | `t` 가 확실히 지났으면 true |
| `TT.before(t)` | `t` 가 확실히 오지 않았으면 true |

구간 폭이 클수록 시계를 못 믿는다는 뜻이고, 시스템은 그만큼 **기다려서** 정확성을 지킨다.

### 시간 출처와 오차 크기 (논문 값)

- 시간 기준은 GPS 와 원자시계 두 종류다. 장애 양상이 서로 달라 한쪽이 실패해도 다른 쪽이 받쳐 준다.
- 각 서버의 데몬이 여러 시간 마스터를 폴링한다. 폴링 사이에는 최악의 시계 드리프트를 가정해 불확실성을 서서히 키운다.
- 논문이 보고한 운영 환경에서 오차 ε 은 폴링 간격(30초)마다 1~7ms 톱니 모양이고, **평소 약 4ms** 다. 전체적으로 10ms 미만으로 유지한다고 설명한다. 장애 시 데이터센터 단위로 ε 이 커질 수 있고, 그래도 **정확성은 깨지지 않고 성능만 떨어진다.**

### 커밋 규칙 두 개

쓰기 트랜잭션 Ti 의 조정자 리더가 지킨다.

1. **Start**: 커밋 타임스탬프 `si` 는 조정자가 커밋 요청을 받은 이후 계산한 `TT.now().latest` 이상으로 정한다.
2. **Commit Wait**: `TT.after(si)` 가 참이 될 때까지 클라이언트에게 커밋 결과를 보이지 않는다.

이렇게 하면 `si` 가 실제 커밋 시각보다 작아지고, 뒤에 시작한 트랜잭션은 더 큰 타임스탬프를 받는다(논문의 증명). 대기 시간은 대략 불확실 구간 폭(≈2ε)이다.

```ts
// TrueTime 모사: now() 는 실제 시각을 포함하는 구간 [earliest, latest]
const EPS = 4; // ms. 논문에서 ε 은 평소 4ms 안팎(1~7ms 톱니)
const real = () => performance.now();
const tt = { now: () => ({ earliest: real() - EPS, latest: real() + EPS }), after: (t: number) => tt.now().earliest > t };

function commit(): { ts: number; waitedMs: number } {
  const ts = tt.now().latest;            // 규칙 1(Start): 커밋 타임스탬프 = 지금의 latest 이상
  const t0 = real();
  while (!tt.after(ts)) { /* 규칙 2(Commit Wait): ts 가 확실히 과거가 될 때까지 대기 */ }
  return { ts, waitedMs: real() - t0 };
}
const c = commit();
console.log(`대기 ${c.waitedMs.toFixed(1)}ms (≈2ε = ${2 * EPS}ms)`);
```

실행하면 대기가 8.0ms, 곧 2ε 로 나온다. 실제 Spanner 는 이 대기를 Paxos 복제와 겹쳐 처리해 비용을 줄인다(논문 4.2.1).

## 읽기: 잠금 없이 과거 시점을 읽는다

타임스탬프가 실제 시간 순서와 맞기 때문에 **특정 시각의 일관된 스냅숏**이 의미를 갖는다.

- **읽기 전용 트랜잭션**과 **스냅숏 읽기**는 잠금 없이 실행되고, 충분히 최신인 어느 복제본에서든 처리할 수 있다.
- 복제본은 안전 시각 `t_safe`(자신이 최신 상태임을 보장하는 최대 타임스탬프)를 추적하고, 읽기 시각 `t ≤ t_safe` 이면 바로 응답한다. 아니면 `t_safe` 가 올라갈 때까지 기다린다.
- 같은 이유로 스키마 변경도 미래 타임스탬프를 정해 원자적으로 처리한다(논문 요약).

## 구조 요약

- 데이터는 tablet 으로 나뉘고 tablet 마다 **Paxos 그룹**이 복제한다. 쓰기는 그룹 리더에서 시작한다. 리더는 시간제 **리더 리스**를 쓴다.
- 트랜잭션이 한 Paxos 그룹 안이면 그 리더가 처리하고, **여러 그룹에 걸치면 2단계 커밋**을 쓴다. 각 그룹이 Paxos 로 복제돼 있어 2PC 조정자가 죽어도 멈추는 문제를 완화한다고 논문은 설명한다 → [2PC 와 사가](/develop-wiki/knowledge/distributed-systems/two-phase-commit-vs-saga/).
- 쓰기 트랜잭션은 잠금(2단계 잠금)으로 직렬화하고, 타임스탬프로 읽기 전용 쪽을 분리하는 구조다.

## 언제 쓰나

- 전역 분산 DB 에서 **강한 일관성과 분산 트랜잭션**이 모두 필요한 경우. Spanner 를 쓰는 입장에서는 이 보장을 그대로 받는다.
- 설계 교훈: "시계는 틀린다"를 전제로, **오차 상한을 API 로 노출하고 그만큼 기다리는** 방식. 하드웨어 없이 흉내 낼 때는 오차 범위를 명시하는 HLC 같은 대안과 비교한다.

## 주의 (비용)

- 핵심은 **하드웨어 지원**이다. GPS·원자시계 전용 인프라와 시간 마스터 운영이 전제다. 일반 클라우드 VM 의 NTP 로는 ε 이 훨씬 클 수 있고 그만큼 commit wait 가 길어진다(이 부분은 논문이 다루지 않은 일반론이다).
- commit wait 때문에 **쓰기 지연이 ε 에 하한을 가진다.** ε 이 커지면 처리량과 지연이 나빠진다.
- 외부 일관성은 비싼 보장이다. 읽기가 많고 약간 오래된 데이터를 허용하면 스냅숏 읽기(과거 시점 읽기)로 지연을 줄일 수 있다.
- 이 노트는 논문 2013 TOCS 판 기준이다. 현재 Cloud Spanner 제품의 세부 동작(지연 수치 등)은 다루지 않았다.
