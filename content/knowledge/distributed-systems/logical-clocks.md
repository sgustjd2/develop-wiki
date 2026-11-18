---
title: 논리 시계 (Lamport·벡터 클록·HLC)와 LWW 함정
aka: [Logical Clocks, Lamport Clock, Vector Clock, Hybrid Logical Clock, HLC, Happened-before, Last Write Wins, LWW, Clock Skew]
category: distributed-systems
level: advanced
summary: 물리 시계 없이 사건의 인과 순서를 매기는 Lamport 시계, 동시성까지 구분하는 벡터 클록, 물리 시간에 가깝게 유지하는 HLC. 벽시계 기반 LWW 가 데이터를 잃는 이유도 다룬다.
tags: [distributed-systems, clocks, lamport, vector-clock, hlc, lww, causality]
related: [distributed-systems/consistency-models, distributed-systems/crdt, distributed-systems/replication-quorum, distributed-systems/raft-consensus, distributed-systems/cap-pacelc]
sources:
  - https://lamport.azurewebsites.net/pubs/time-clocks.pdf
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
  - https://cse.buffalo.edu/tech-reports/2014-04.pdf
  - https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html
updatedAt: 2026-11-19
---

## 문제

서로 다른 서버에서 일어난 두 쓰기 중 무엇이 "나중"인가? 서버 시계는 서로 어긋나고(NTP 로도 수 ms~수백 ms 오차가 날 수 있다), 시계가 거꾸로 가기도 한다. 그런데 "나중 것이 이긴다" 같은 규칙은 순서 판단에 의존한다. 필요한 것은 **시계 값이 아니라 인과 관계**다.

## Lamport 의 happened-before (1978)

사건 a → b ("a 가 b 보다 먼저 일어났을 수 있다")는 세 규칙으로 정의된다.

1. 같은 프로세스 안에서 a 가 b 앞이면 a → b.
2. a 가 메시지 송신, b 가 그 수신이면 a → b.
3. 추이적으로 닫는다.

a → b 도 b → a 도 아니면 **동시(concurrent)** 다. 동시는 "같은 시각"이 아니라 "서로 영향을 줄 수 없었다"는 뜻이다.

## 세 가지 시계

### 1. Lamport 시계

각 프로세스가 정수 카운터 하나를 가진다. 논문의 구현 규칙 두 개가 전부다.

- 사건 사이마다 카운터를 증가시킨다.
- 메시지에 카운터를 실어 보내고, 받은 쪽은 `max(자기, 받은 값) + 1` 로 올린다.

```ts
class LamportClock {
  private t = 0;
  tick(): number { return ++this.t; }                        // 로컬 사건·송신
  receive(remote: number): number { this.t = Math.max(this.t, remote) + 1; return this.t; }
}
// 동점이면 노드 id 로 깨서 전체 순서(total order)를 만든다: (t, nodeId)
```

- 성질: `a → b` 이면 `C(a) < C(b)`. **역은 성립하지 않는다.** `C(a) < C(b)` 라고 인과가 있다고 말할 수 없고, 동시 사건을 구분하지 못한다.
- 쓰임: 전체 순서가 필요한 곳(논문의 분산 상호 배제 예제, 로그 정렬).

### 2. 벡터 클록

노드마다 카운터를 두고 **길이 N 의 벡터**를 들고 다닌다. 비교 규칙:

- 모든 성분이 `≤` 이고 하나라도 `<` 이면 a 가 b 보다 앞선다.
- 서로 크기가 엇갈리면 **동시**.

```ts
type VC = Record<string, number>;
function compare(a: VC, b: VC): 'before' | 'after' | 'equal' | 'concurrent' {
  let le = true, ge = true;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    if (x > y) le = false;
    if (x < y) ge = false;
  }
  return le && ge ? 'equal' : le ? 'before' : ge ? 'after' : 'concurrent';
}
```

- Dynamo 논문은 객체 버전마다 (노드, 카운터) 쌍의 벡터 클록을 붙여, 한 버전이 다른 버전의 조상인지 **동시 분기**인지 판별한다. 분기되면 둘 다 보관해 읽을 때 클라이언트가 병합한다(장바구니 예). 벡터가 커지면 오래된 쌍을 잘라내는데, 논문도 이러면 조상 관계를 정확히 못 알아낼 수 있다고 인정한다.
- 비용: 크기가 참여자 수에 비례한다. 클라이언트가 많으면 노드 대신 "dotted version vector" 같은 변형을 쓴다.

### 3. 하이브리드 논리 시계 (HLC)

Kulkarni 외(2014). 타임스탬프를 `(l, c)` 로 둔다. `l` 은 지금까지 본 가장 큰 물리 시각, `c` 는 같은 `l` 안의 논리 카운터.

```ts
class HLC {
  constructor(private now: () => number, private l = 0, private c = 0) {}
  send(): [number, number] {                 // 로컬·송신
    const pt = this.now();
    if (pt > this.l) { this.l = pt; this.c = 0; } else this.c++;
    return [this.l, this.c];
  }
  recv(ml: number, mc: number): [number, number] {
    const pt = this.now(), l0 = this.l;
    this.l = Math.max(l0, ml, pt);
    this.c = this.l === l0 && this.l === ml ? Math.max(this.c, mc) + 1
           : this.l === l0 ? this.c + 1
           : this.l === ml ? mc + 1 : 0;
    return [this.l, this.c];
  }
}
```

- 인과 보존(Lamport 성질)을 유지하면서 `l` 이 물리 시계에 가깝게 붙어 있어, "어제 오후 3시 시점의 스냅숏 읽기" 같은 시간 질의가 된다. 논문은 NTP 64비트 타임스탬프 형식에 들어가도록 설계했다고 한다.
- 벡터 클록과 달리 동시성은 구분하지 못한다(스칼라이므로). 대신 크기가 상수.
- 물리 시계가 크게 튀면(오차가 한계를 넘으면) `l` 이 앞서 달려 가는 문제가 있어, 실제 구현은 허용 오차 상한을 두고 넘으면 거부한다.
- 일부 분산 SQL DB 가 트랜잭션 타임스탬프에 쓴다(제품별 세부는 각 문서 확인).

| | Lamport | 벡터 클록 | HLC |
| --- | --- | --- | --- |
| 크기 | 정수 1개 | 노드 수에 비례 | 정수 2개 |
| 인과 → 순서 | O | O | O |
| 순서 → 인과 / 동시 감지 | X | **O** | X |
| 물리 시간과의 관계 | 없음 | 없음 | 가깝게 유지 |

## LWW(Last Write Wins) 함정

충돌 시 타임스탬프가 큰 쪽을 남기는 규칙. 단순하고 Cassandra 가 기본으로 쓴다(공식 문서: 변경마다 타임스탬프가 붙고 충돌은 LWW 로 해소, NTP 동기화를 권장).

```
A(시계 +5s 빠름): t=105 에 x=1 쓰기
B(정상):          t=102 에 x=2 쓰기   ← 실제로는 B 가 나중
결과: x=1 이 이긴다. B 의 쓰기는 오류 없이 사라진다.
```

- 시계 오차만큼의 시간 안에서 **실제 순서와 반대로** 이긴다.
- 진짜 동시 쓰기에서는 한쪽이 **조용히 유실**된다(경고도 충돌도 안 남음).
- Cassandra 는 열 단위로 LWW 를 적용해, 같은 행의 열들이 서로 다른 쓰기에서 섞여 나올 수 있다.

## 언제 무엇을

- 로그 순서·전체 순서만 필요하다 → Lamport.
- 충돌 감지와 병합이 필요하다(오프라인 편집, 리더리스 복제) → 벡터 클록 또는 [CRDT](/develop-wiki/knowledge/distributed-systems/crdt/).
- 시간 기반 질의·스냅숏이 필요하고 노드가 많다 → HLC.
- 유실돼도 괜찮은 값(마지막 접속 시각, 캐시)만 LWW.
- 순서가 정말 중요하면 시계를 믿지 말고 [합의](/develop-wiki/knowledge/distributed-systems/raft-consensus/)나 단일 리더로 순서를 정한다.

## 주의

- "동시"를 시간으로 오해하지 않는다. 벡터 클록이 동시라고 한 두 쓰기도 실제 시각은 다를 수 있다.
- 벡터 클록은 병합 로직을 **애플리케이션이 책임진다**. 형제 버전을 방치하면 계속 쌓인다.
- 물리 시계에 의존하는 모든 설계(LWW, 리스, TTL)는 시계 점프·윤초·VM 정지를 고려해야 한다.
