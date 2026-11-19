---
title: TiKV(TiDB)와 CockroachDB 의 분산 트랜잭션 비교
aka: [TiKV vs CockroachDB, Percolator vs HLC, Timestamp Oracle vs Hybrid Logical Clock, TiDB Transaction, CockroachDB Transaction Layer]
category: distributed-systems
level: advanced
summary: 같은 Raft 복제 키-값 위에 트랜잭션을 올리지만, TiKV 쪽은 Percolator 방식과 중앙 타임스탬프 서비스(PD)를, CockroachDB 는 의도(intent)·트랜잭션 레코드와 하이브리드 논리 시계를 쓴다. 두 제품의 공식 문서로 확인한 차이를 정리한다.
tags: [distributed-systems, transactions, tikv, tidb, cockroachdb, percolator, hlc, mvcc]
related: [distributed-systems/percolator-transactions, distributed-systems/hybrid-logical-clock, distributed-systems/spanner-truetime, distributed-systems/raft-consensus, distributed-systems/raft-read-index, distributed-systems/calvin-deterministic-transactions, distributed-systems/two-phase-commit-vs-saga, data-modeling/transaction-isolation, data-modeling/optimistic-pessimistic-locking]
sources:
  - https://tikv.org/deep-dive/distributed-transaction/percolator/
  - https://docs.pingcap.com/tidb/stable/optimistic-transaction/
  - https://docs.pingcap.com/tidb/stable/transaction-isolation-levels/
  - https://raw.githubusercontent.com/pingcap/docs/master/system-variables.md
  - https://docs.cockroachlabs.com/docs/stable/architecture/transaction-layer
  - https://docs.cockroachlabs.com/docs/stable/cockroach-start
updatedAt: 2026-11-19
---

## 문제

"Raft 로 복제한 키-값 위에 SQL 트랜잭션을 올린다"는 큰 그림은 TiDB(저장소 TiKV)와 CockroachDB 가 같다. 그런데 여러 범위(Region/Range)에 걸친 쓰기를 **어떻게 원자적으로 커밋하고, 어떤 시계로 스냅숏을 자르는가**에서 설계가 갈린다. 두 제품을 고르거나 장애를 해석할 때 이 차이가 지연·재시도·격리 동작으로 나타난다.

이 노트는 두 제품의 **공식 문서**에서 확인한 내용만 비교한다. 문서에 없는 성능 우열은 적지 않는다. 바탕 개념은 [Percolator](/develop-wiki/knowledge/distributed-systems/percolator-transactions/), [HLC](/develop-wiki/knowledge/distributed-systems/hybrid-logical-clock/), [Spanner](/develop-wiki/knowledge/distributed-systems/spanner-truetime/) 노트를 먼저 본다.

## 해법 1: TiKV 쪽 (Percolator + 중앙 타임스탬프)

- **저장 구조**: Percolator 의 열을 RocksDB 컬럼 패밀리 셋에 대응시킨다. `CF_DEFAULT` 는 `(key, start_ts)` 로 값을, `CF_LOCK` 은 키당 잠금 하나를, `CF_WRITE` 는 `(key, commit_ts)` 로 커밋 기록을 둔다. 새 버전이 앞에 오도록 키를 인코딩한다.
- **타임스탬프**: TiDB 는 PD 에서 단조 증가하고 전역에서 유일한 타임스탬프를 받아 시작 시각과 커밋 버전으로 쓴다. 문서는 PD 를 시작 시각 발급처로 명시하고, 이것이 중앙 서비스 의존이라는 점을 트레이드오프로 나열한다.
- **커밋(낙관적 모드)**: TiDB 가 쓰기 집합에서 primary 키를 고르고 Region 별로 묶어 **프리라이트(prewrite)** 를 보낸다. TiKV 가 충돌·만료 버전을 확인하고 잠근다. PD 에서 커밋 타임스탬프를 받아 primary 키의 TiKV 에 **커밋**을 보내면 그 잠금이 풀리며, 성공 응답 뒤 나머지 잠금은 비동기로 정리한다. 낙관적 모드는 충돌을 **커밋 때** 발견한다.
- **충돌한 잠금 만난 읽기**: primary 잠금을 확인해 커밋된 트랜잭션이면 앞으로 굴리고(roll forward), 포기된 것이면 되돌리고, 아직 살아 있으면 기다린다.
- **지연 줄이기**: `tidb_enable_1pc`(한 Region 만 건드리는 트랜잭션의 1단계 커밋)와 `tidb_enable_async_commit`(2단계를 백그라운드로) 모두 문서 기준 기본값이 `ON` 이다. `tidb_guarantee_linearizability` 는 비동기 커밋의 커밋 TS 계산 방식을 정한다. 기본 `ON` 은 PD 에서 새 TS 를 받아 선형화 가능성을 보장하고, `OFF` 는 그 호출을 건너뛰는 대신 **인과 일관성만** 보장한다.
- **격리**: 문서는 TiDB 가 스냅숏 격리(SI)를 구현하고 MySQL 호환을 위해 `REPEATABLE-READ` 라는 이름으로 내놓는다고 설명한다. ANSI 의 RR 과 달리 팬텀(P3)과 쓰기 왜곡(write skew)이 가능하다. `READ COMMITTED` 는 비관적 모드에서만 실제로 동작한다.
- **비관적 모드**: 쓰기 문장 때 잠금을 잡는 방식으로, 새로 만든 클러스터(v3.0.8 이후)는 기본이 비관적이다. 충돌이 잦으면 비관적이 낫다는 것이 문서의 설명이다.

## 해법 2: CockroachDB 쪽 (의도 + 트랜잭션 레코드 + HLC)

- **쓰기 의도(write intent)**: 커밋 전 쓰기는 임시 MVCC 값으로 Raft 복제된다. 각 의도는 **트랜잭션 레코드**를 가리키고 배타 잠금 역할을 한다. 의도를 만난 다른 트랜잭션은 레코드를 보고 정리하거나 기다리거나 무시한다.
- **트랜잭션 레코드**: 첫 쓰기가 있는 Range 에 저장되며 상태는 `PENDING`, `STAGING`, `COMMITTED`, `ABORTED` 다.
- **시계**: 게이트웨이 노드가 트랜잭션 타임스탬프를 정하는 **하이브리드 논리 시계(HLC)** 를 쓴다. 노드들은 들어온 요청의 타임스탬프로 자기 시계를 갱신한다.
- **불확실 구간과 재시도**: 시계가 어긋날 수 있어서 읽기가 "내 타임스탬프보다 앞인지 뒤인지 애매한" 값을 만날 수 있다. 그러면 타임스탬프를 그 값 너머로 밀어 올린다. 직렬화 가능(SERIALIZABLE) 격리에서는 이미 읽은 값에 끼어든 쓰기가 없는지 **다시 확인(read refresh)** 하고, 실패하면 새 타임스탬프로 재시도해야 한다.
- **시계 오차 상한**: `--max-offset` 기본값 500ms. 관측된 오프셋이 한도를 넘으면 노드는 **불일치한 읽기를 피하려고 스스로 종료**한다. 값을 키우면 장애 복구가 오래 걸리고 불확실성 때문에 읽기 재시작이 늘어난다고 문서에 있다.
- **병렬 커밋(parallel commits)**: 커밋 지연을 합의 두 번에서 한 번으로 줄인다. 코디네이터가 레코드를 `STAGING` 으로 두고 진행 중인 쓰기 목록을 적으며, 그 쓰기들이 모두 복제되면 커밋된 것으로 본다. 다른 트랜잭션이 이를 검증할 수 있고, 코디네이터는 나중에 `COMMITTED` 로 바꾸고 의도를 비동기로 정리한다.
- **격리**: 기본은 `SERIALIZABLE` 이다(재시도 로직이 필요할 수 있음). `READ COMMITTED` 에서는 문장마다 읽기 스냅숏을 새로 따고 커밋 때 read refresh 를 하지 않으며, 직렬화 오류는 문장 단위로 재시도된다.
- **닫힌 타임스탬프와 팔로워 읽기**: 리스홀더가 "이 시각 이하에는 쓰기를 받지 않겠다"는 약속을 지속적으로 내보낸다. 로그를 거기까지 적용한 팔로워는 과거 시점의 일관된 읽기를 로컬로 처리해 지연을 줄인다.

## 비교

| 쟁점 | TiKV(TiDB) | CockroachDB |
| --- | --- | --- |
| 원자 커밋 지점 | primary 키의 커밋 기록 | 트랜잭션 레코드(`COMMITTED`, 또는 병렬 커밋의 `STAGING`+쓰기 복제) |
| 미커밋 쓰기 표현 | `CF_LOCK` 의 잠금 + `CF_DEFAULT` 값 | MVCC 의도 + 트랜잭션 레코드 참조 |
| 시간원 | PD 가 발급하는 단조 증가 타임스탬프 | 노드별 HLC, 게이트웨이가 정함 |
| 시간 관련 의존 | 중앙 서비스 호출(1PC·비동기 커밋 설정에 따라 일부 생략) | 시계 오프셋 한도 500ms(기본), 초과 시 노드 종료 |
| 기본 격리 | SI(`REPEATABLE-READ` 이름) | `SERIALIZABLE` |
| 충돌 시 | 낙관적: 커밋 때 실패·재시도 / 비관적: 잠금 대기 | 불확실 구간·read refresh 로 재시도 |
| 낮은 지연 최적화 | 1PC, 비동기 커밋 | 병렬 커밋, 팔로워 읽기(닫힌 타임스탬프) |

## 해석: 둘의 큰 차이는 "시간을 누가 주는가"

- **중앙 타임스탬프(TiKV 방식)**: 순서가 단순하고 오프셋 걱정이 없다. 대신 시작 타임스탬프를 항상 PD 에서 받아야 하고(비동기 커밋에서 `tidb_guarantee_linearizability` 를 끄면 커밋 타임스탬프 계산용 추가 조회만 생략되며 인과 일관성으로 약해진다), PD 가용성이 곧 트랜잭션 가용성이다.
- **HLC(CockroachDB 방식)**: 중앙 호출은 없다. 대신 시계 오프셋을 가정해야 해서, **불확실 구간 때문에 읽기 재시작**이 생기고 한도를 넘는 시계는 노드를 죽인다. 오프셋 상한을 가정하는 점은 [리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)과 같은 종류의 비용이다.
- Spanner 는 TrueTime 으로 이 불확실성을 **기다림으로 흡수**한다. 두 제품 문서에서는 그런 커밋 대기를 확인하지 않았다.

## 언제 쓰나 (고를 때의 기준)

- MySQL 호환과 낮은 학습 비용이 우선이고 SI 로 충분하면 TiDB. 기본이 SI 라 쓰기 왜곡을 애플리케이션이 막아야 할 수 있다.
- 기본 직렬화 가능 격리와 단일 바이너리 운영이 중요하면 CockroachDB. 재시도 처리 코드를 클라이언트에 두는 비용을 감수한다.
- 리전이 여럿이고 읽기 지연이 중요하면 팔로워 읽기(CockroachDB)나 TiDB 쪽 읽기 최적화 옵션을 따로 검토한다. 이 노트는 TiDB 의 stale read 류 기능을 확인하지 않았다.

## 주의

- 문서 기준이므로 **버전에 따라 기본값·기능이 바뀐다.** 이 노트는 문서 `stable`(2026-11-19 조회) 기준이다. 운영 중인 버전의 문서를 다시 본다.
- 성능 수치(TPS·지연)는 근거 문서가 없어 적지 않았다. 벤치마크 비교는 워크로드·하드웨어에 좌우되므로 직접 측정한다.
- TiKV 문서(`deep-dive`)는 Percolator 를 일반론으로 설명하며 비동기 커밋·비관적 트랜잭션 세부는 다루지 않는다. 그 부분은 TiDB 문서에서 확인했다.
- 낙관적 트랜잭션의 자동 재시도는 TiDB v8.0.0 에서 폐기됐다(문서). 충돌 오류를 애플리케이션이 받아 재시도해야 한다.
- 대용량 쓰기는 TiDB 가 쓰기를 메모리에 모았다가 커밋하므로 메모리 부족 위험이 있다고 문서가 나열한다.
