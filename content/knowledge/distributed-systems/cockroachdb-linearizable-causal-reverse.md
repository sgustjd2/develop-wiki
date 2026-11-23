---
title: CockroachDB 의 일관성 모델 - 직렬화 가능, 단일 키 선형화, causal reverse
aka: [CockroachDB consistency model, causal reverse, strict serializability, single-key linearizability, no stale reads, COCKROACH_EXPERIMENTAL_LINEARIZABLE, 인과 역전]
category: distributed-systems
level: advanced
summary: CockroachDB 는 직렬화 가능 격리와 "오래된 읽기 없음(단일 키 선형화)"을 보장하지만 엄격한 직렬화 가능(strict serializability)은 아니다. 겹치지 않는 키를 쓰는 두 트랜잭션의 순서가 뒤바뀌어 보이는 causal reverse 가 그 차이다.
tags: [cockroachdb, serializability, strict-serializability, linearizability, causal-reverse, hlc, uncertainty-interval, commit-wait, spanner]
related: [distributed-systems/consistency-models, distributed-systems/cockroachdb-global-tables-commit-wait, distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/cockroachdb-closed-timestamps, distributed-systems/hybrid-logical-clock, distributed-systems/spanner-truetime, distributed-systems/tikv-vs-cockroachdb-transactions, data-modeling/transaction-isolation]
sources:
  - https://www.cockroachlabs.com/pdf/cockroachdb-the-resilient-geo-distributed-sql-database-sigmod-2020.pdf
  - https://docs.cockroachlabs.com/docs/stable/architecture/transaction-layer
  - https://www.cockroachlabs.com/blog/consistency-model/
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/kv/kvclient/kvcoord/txn_coord_sender.go
  - https://github.com/cockroachdb/cockroach/blob/master/pkg/server/config.go
  - https://jepsen.io/analyses/cockroachdb-beta-20160829
  - https://groups.google.com/g/cockroach-db/c/ALLI0aHEsL8
updatedAt: 2026-11-23
---

## 문제

"CockroachDB 는 직렬화 가능(serializable)이지 선형화 가능(linearizable)은 아니다"라는 말은 흔하지만 정보가 적다. 개발자가 알고 싶은 것은 이런 질문이다. 방금 커밋된 쓰기를 다른 노드로 접속한 다음 읽기가 못 볼 수 있나? 시계가 어긋나면 무엇이 깨지나? 정확히 어떤 이상 현상이 남나? 이 노트는 SIGMOD 2020 논문, 공식 문서, 소스 주석, Jepsen 분석을 읽고 그 경계를 정리한다. 시계·구간 메커니즘 자체는 [불확실성 구간·읽기 요약](/develop-wiki/knowledge/distributed-systems/cockroachdb-uncertainty-interval-read-summary/)과 [GLOBAL 테이블 커밋 대기](/develop-wiki/knowledge/distributed-systems/cockroachdb-global-tables-commit-wait/) 노트가 다루므로 여기서는 보장의 이름과 경계에 집중한다.

## 용어

| 한국어 | 영어 | 정의 (이 노트에서) |
| --- | --- | --- |
| 직렬화 가능 | serializable | 트랜잭션들의 결과가 어떤 직렬 순서의 실행과 같다. 그 순서가 실제 시간과 맞을 필요는 없다 |
| 단일 키 선형화 | single-key linearizability | 한 키에 대한 각 연산이 실제 시간 순서와 일치하는 전체 순서로 원자적으로 일어난 것처럼 보임(논문 4.2) |
| 엄격한 직렬화 가능 | strict serializability | 직렬화 가능 + 직렬 순서가 트랜잭션 완료·시작의 실제 시간 순서와 일치. Spanner 의 "외부 일관성" |
| 오래된 읽기 | stale read | 이미 커밋·응답된 쓰기를 뒤에 시작한 읽기가 못 보는 것 |
| causal reverse | causal reverse | 먼저 커밋된 T1 과 그 뒤에 시작한 T2 가 서로 다른 키를 다룰 때, 제3의 읽기가 T2 는 보고 T1 은 못 보는 현상. Cockroach Labs 가 붙인 이름 |
| 최대 시계 오차 | max_offset | 노드 시계 사이에 허용하는 최대 차. 기본 500ms (소스 `DefaultMaxClockOffset`, master 기준) |

## CockroachDB 가 보장하는 것

논문(Taft et al., SIGMOD 2020)과 문서가 말하는 층은 이렇다.

1. **직렬화 가능 격리.** 논문 4.3 은 레인지 리스 구간 규칙과 Raft 로그의 리스 번호 검사 두 안전장치 덕에 **시계 오차가 최대 오차 범위를 넘어도 직렬화 가능 격리는 유지된다**고 쓴다. 현재 문서의 트랜잭션 계층 페이지도 SERIALIZABLE 이 기본이라 하고 시계 오차와 무관하게 직렬화 가능성을 서술한다. 단, 문서에는 READ COMMITTED 도 있어 일부 이상 현상을 허용한다. 이 노트의 논의는 SERIALIZABLE 기준이다. (2021 블로그의 "직렬화 가능이 유일한 격리 수준"이라는 문장은 현재 문서와 맞지 않는다.)
2. **오래된 읽기 없음(단일 키 선형화).** 시계가 `max_offset` 안에 있는 한, 논문 4.2 는 "정상 조건에서 단일 키 읽기·쓰기에 대해 선형화"를 만족한다고 한다. 메커니즘은 불확실성 구간이다. 트랜잭션은 `[commit_ts, commit_ts + max_offset]` 구간에서 만난 값을 과거의 쓰기로 취급해 타임스탬프를 올린다(불확실성 재시작).
3. **시계가 범위를 벗어나면** 단일 키 선형화가 깨질 수 있다. 서로 다른 게이트웨이로 이어진 인과적 트랜잭션에서, 두 번째 게이트웨이의 시계가 `max_offset` 보다 더 느리면 첫 트랜잭션의 쓰기가 구간 밖에 있어 못 볼 수 있다(4.3). 이를 줄이려 노드는 주기적으로 시계 오차를 재고, 다수 노드 대비 최대 오차의 80% 를 넘으면 스스로 종료한다. 소스는 `toleratedOffsetMultiplier = 0.8` 이다.

## 보장하지 않는 것: strict serializability

논문 4.2 의 문장: 서로 겹치지 않는 키 집합을 다루는 트랜잭션끼리는 순서가 실제 시간과 맞는다는 보장이 없으므로 **엄격한 직렬화 가능을 지원하지 않는다**. 실제로는 클라이언트들 사이에 외부 저지연 통신 채널이 없으면 문제 되지 않는다고 덧붙인다.

### causal reverse 의 구성 (블로그와 소스 주석 기반, Jepsen 2.5 와 같은 현상)

- T1 이 키 a 에 쓰고 커밋한다. 응답을 받은 뒤 T2 가 시작해 키 b 에 쓰고 커밋한다(실제 시간으로 T1 → T2).
- T1 과 T2 의 읽기·쓰기 집합이 **겹치지 않아** 데이터베이스가 둘의 순서를 강제할 근거가 없다.
- (필자 정리 — 블로그는 시계 동기화가 좋을수록 드물다고만 설명한다) T1 의 게이트웨이 시계가 빠르고 T2 의 시계가 느리면 T2 의 커밋 타임스탬프가 T1 보다 **작을 수** 있다. 둘 다와 동시에 실행 중인 제3의 읽기 R 의 타임스탬프가 그 사이이면 R 은 T2 의 쓰기를 보고 T1 의 쓰기는 못 본다.
- 블로그는 서로 겹치는 키를 읽었다면(예: T2 가 T1 의 행을 외래 키 검사로 읽었다면) 직렬화 가능성 때문에 순서가 고정되어 이상이 사라진다고 설명한다. 또 범위 리더가 같은 노드에 있거나 T2 의 클라이언트가 같은 노드에 붙는 등 여러 경우에 피해진다고 한다.
- Jepsen 2016 분석의 2.5 절은 같은 현상을 보고하며, 이것이 **시계 오차가 범위 안에 있는 상태에서도** 일어난다고 쓴다. 해당 분석은 베타 버전(2016-08) 대상이라 현재 판에 그대로 적용된다고 볼 수 없다.
- `AS OF SYSTEM TIME` 과 백업은 임의 과거 시각을 읽으므로 같은 이상을 관찰할 수 있다는 점이 블로그에 있다(백업이 T2 만 담을 수 있음).

### 선형화 설정: 소스 주석이 말하는 것

`txn_coord_sender.go` 의 `maybeCommitWait` 주석은 CockroachDB 가 `linearizable` 플래그로 "더 엄격한 모델(strict serializable 모드라고도 부름)"을 지원한다고 설명한다. 이 모드에서는 쓰기 트랜잭션이 커밋 뒤 **추가로 `max_offset` 만큼 더 기다려** 커밋 타임스탬프가 다른 노드의 현재 HLC 보다 작음을 보장하고, 그래서 인과적으로 뒤따르는 모든 트랜잭션이 더 높은 타임스탬프를 받아 causal reverse 가 방지된다고 한다. 읽기 전용 트랜잭션은 추가 대기를 하지 않는다. 이 모드에서도 불확실성 구간은 여전히 필요하다고 한다(겹치는 키를 서로 다른 노드에서 읽는 두 읽기의 단조 읽기를 위해). Spanner 는 커밋 대기 중 잠금을 쥐어 읽기를 막으므로 구간 없이도 되지만, CockroachDB 는 대기 전에 잠금을 풀기 때문이라고 설명한다.

이 플래그를 켜는 방법과 지위는 소스가 알려 준다.

- `pkg/server/config.go` 에서 `Linearizable` 은 환경 변수 `COCKROACH_EXPERIMENTAL_LINEARIZABLE` 로만 설정되고, 같은 블록의 주석은 이 값들이 "환경 변수로만 설정할 수 있고 테스트 전용이며 최종 사용자용이 아니다"라고 쓴다.
- 2021-04 구글 그룹 스레드에서 CockroachDB 개발자(Andrei Matei)는 이 모드가 사실상 깨져 있고 선형화를 제공하지는 않으나 겹치지 않는 쓰기의 순서는 정해 준다고 답했다. 질문자는 커밋 대기가 의도 해소 뒤에 일어나므로 다른 클라이언트가 대기 중에 값을 읽을 수 있다고 지적했다. (커뮤니티 포럼 글이며 공식 문서가 아니다. 현재 판에서도 같은지는 확인하지 못했다.)
- `kv.transaction.…` 같은 이름의 클러스터 설정이나 `SET ... linearizable` 세션 변수는 이 조사에서 **찾지 못했다**(문서 페이지의 설정 언급에도, 위 소스 파일에도 없음). 이 노트는 그런 설정이 존재한다고 쓰지 않는다.

문서 페이지의 `cockroach start` 최대 오차 설정(`--max-offset`)은 이 노트에서 따로 읽지 않았다.

## GLOBAL 테이블과의 관계

[GLOBAL 테이블](/develop-wiki/knowledge/distributed-systems/cockroachdb-global-tables-commit-wait/)은 쓰기를 미래 시각으로 밀고 그 시각까지 커밋 대기를 하므로 `maybeCommitWait` 의 같은 경로를 쓴다. 위 개발자 답변은 21.1 의 global tables 가 해당 테이블에 한해 선형화에 더 가까워질 것이라고 했지만 "완전히 도달하는지는 확신하지 못한다"고 했다. 이 노트는 그 이상을 단정하지 않는다. 소스 주석은 `global_read` 범위의 미래 쓰기와 충돌한 트랜잭션도 대기한다고 쓴다.

## 직접 계산 (필자의 단순 모형)

causal reverse 가 일어나는 조건과 추가 대기가 막는 이유를 Python 으로 모의했다. **CockroachDB 를 실행한 것이 아니다.** 모형: 노드 시계 = 실제 시간 + 노드별 고정 오프셋(두 노드 오프셋 차 ≤ `max_offset` = 0.5초), T1 은 게이트웨이 1 에서 실제 시간 0 에 커밋 타임스탬프 `ts1 = 0 + off1` 을 받고, T2 는 T1 응답 이후 임의 시점(최대 0.5초 뒤) 게이트웨이 2 에서 시작해 `ts2 = t2 + off2` 를 받는다. HLC 전파·불확실성 재시작·키 충돌은 모형에서 뺐다.

| 설정 | T2.ts < T1.ts (causal reverse 가 가능한 상태) 비율, 20만 회 |
| --- | --- |
| T1 이 즉시 응답 | 약 16.7% |
| T1 이 커밋 후 `max_offset` 만큼 대기한 뒤 응답 | 0% |

대기 후에는 `t2 ≥ max_offset` 이고 `off1 − off2 ≤ max_offset` 이므로 `ts2 = t2 + off2 ≥ max_offset + off2 ≥ off1 = ts1` 이 되어 순서 역전이 불가능하다. 위 소스 주석의 논리와 같은 방향이다. 16.7% 는 모형 가정(균등 분포 오프셋·지연)에 의존하는 수치이므로 실제 발생 빈도로 읽으면 안 된다. 블로그는 실제로는 "만들어 내기도 어렵다"고 말한다.

## 헷갈리는 구분

- **"선형화 가능"이라는 말.** 논문은 키 하나 단위의 선형화를 말하고, 소스 주석의 `linearizable` 플래그는 "strict serializable 모드"라고도 불린다. 블로그 저자는 트랜잭션 시스템에 선형화라는 용어를 쓰는 것을 "언어 남용"이라고 적었다.
- **오래된 읽기와 causal reverse.** 전자는 이미 응답된 쓰기를 뒤 읽기가 못 보는 것(CockroachDB 가 막는 쪽), 후자는 응답된 쓰기보다 뒤의 쓰기가 앞선 것처럼 제3자에게 보이는 것(CockroachDB 가 허용하는 쪽).
- **Spanner 와의 차이.** [Spanner](/develop-wiki/knowledge/distributed-systems/spanner-truetime/)는 모든 쓰기 트랜잭션이 커밋 대기를 하고 읽기 락을 쥐어 strict serializability 를 얻는다고 논문이 설명한다. CockroachDB 는 기본 상태에서 대기 비용을 내지 않는 대신 이 보장을 포기한다([일관성 모델 일반론](/develop-wiki/knowledge/distributed-systems/consistency-models/)과 [TiKV 대 CockroachDB 트랜잭션](/develop-wiki/knowledge/distributed-systems/tikv-vs-cockroachdb-transactions/) 참고).

## 언제 쓰나 (이 구분이 필요한 때)

- 설계 검토: "방금 쓴 값을 다른 서비스가 반드시 보는가"는 예(오래된 읽기 없음), "서로 다른 키에 쓴 두 이벤트의 시간 순서가 모든 관찰자에게 같은가"는 보장 없음.
- 순서가 중요하면 애플리케이션에서 의존성을 만든다. 같은 행을 읽는 외래 키·읽기-후-쓰기로 두 트랜잭션을 데이터로 연결하면 직렬화 가능성이 순서를 고정한다(블로그의 설명, 필자 정리).
- `AS OF SYSTEM TIME`·백업 시점 선택에서는 시각 경계의 일관성이 임의로 한 쪽만 보일 수 있다는 점을 감안한다.

## 주의·비용

- 시계 의존이다. 오차 상한(기본 500ms)을 넘기면 단일 키 선형화도 깨질 수 있어 NTP 등 시계 동기화가 전제다. 최대 오차를 키우면 불확실성 재시작과 GLOBAL 테이블 쓰기 지연이 늘어난다(`config.go` 주석).
- 불확실성 재시작은 클라이언트에 재시도 오류로 보일 수 있다. 서버가 아직 결과를 안 줬다면 서버 쪽에서 재실행해 숨긴다고 블로그가 설명한다.
- 선형화 모드를 켜서 해결하려 하지 마라. 위 근거로 이 모드는 테스트 전용 환경 변수이고 공식 지원 기능으로 문서화돼 있지 않다.

## 검증 범위

읽은 것: Taft et al. SIGMOD 2020 논문 4절(4.1~4.3)과 8절(Related Work)의 Spanner 비교 문단(cockroachlabs.com 의 PDF), CockroachDB 문서 "Transaction Layer"(v26.4 링크를 가진 stable 페이지, 시계·SERIALIZABLE·최대 오차 부분), 2021-02 블로그 "CockroachDB's consistency model", `txn_coord_sender.go`(`maybeCommitWait` 주석·코드)와 `pkg/server/config.go`·`pkg/base/constants.go`(master 브랜치), Jepsen 2016-08 분석의 2.5·2.6 절, 구글 그룹 스레드 요약. 읽지 않았거나 못 한 것: 특정 릴리스 태그에서의 소스 확인(master 기준), `--max-offset` 의 문서 설명, 일부 문서·블로그("Living Without Atomic Clocks" 등) 전문, Jepsen 후속 분석, 최근 릴리스에서 `linearizable` 플래그의 변화, 문서 페이지에 "strict serializable" 문구가 없다는 확인(요약 도구로 확인했으므로 직접 읽은 것은 아님). 모의 실험은 단순 모형이다.
