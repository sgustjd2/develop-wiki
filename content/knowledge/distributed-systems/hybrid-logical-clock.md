---
title: 하이브리드 논리 시계 (HLC) 심화
aka: [Hybrid Logical Clock, HLC, HLC Bound, Causal Timestamp, Snapshot Read Timestamp, 하이브리드 논리 시계]
category: distributed-systems
level: advanced
summary: 물리 시각 l 과 카운터 c 의 쌍으로 인과 순서를 지키면서 l 을 NTP 시각 근처(오차 ε 이내)에 묶어 두는 스칼라 타임스탬프. 왜 단순한 max+1 이 안 되는지와 경계 증명, 운영상 방어를 다룬다.
tags: [distributed-systems, clocks, hlc, causality, snapshot-read, ntp, timestamps]
related: [distributed-systems/logical-clocks, distributed-systems/spanner-truetime, distributed-systems/consistency-models, distributed-systems/percolator-transactions, distributed-systems/crdt, distributed-systems/leader-lease-clock-assumptions]
sources:
  - https://cse.buffalo.edu/tech-reports/2014-04.pdf
  - https://lamport.azurewebsites.net/pubs/time-clocks.pdf
updatedAt: 2026-11-19
---

## 문제

[논리 시계 노트](/develop-wiki/knowledge/distributed-systems/logical-clocks/)에서 HLC 의 알고리즘을 간단히 봤다. 여기서는 "왜 그 모양인가"를 본다. 요구는 네 가지다.

1. 인과를 지킨다: 사건 e 가 f 보다 먼저 일어났을 수 있으면 `ts(e) < ts(f)`.
2. 한 노드에서 계속 증가한다.
3. 크기가 **유계**다(64비트 NTP 형식에 들어갈 정도).
4. 물리 시각과 **가깝다**. 그래야 "5분 전 스냅숏 읽기"가 가능하다.

Lamport 시계는 1~3 을 만족하지만 4 가 없다. 벽시계는 4 는 있는데 1 이 깨진다. 오차가 있는 시계 두 대가 메시지를 주고받으면 수신 시각이 송신 시각보다 작아질 수 있다.

## 해법: l 과 c 를 분리한다

HLC 타임스탬프는 `(l, c)` 다. `l` 은 지금까지 보거나 겪은 **가장 큰 물리 시각**, `c` 는 같은 `l` 안에서 인과를 구분하는 **작은 카운터**다. 비교는 사전식이다.

- 로컬·송신: `l = max(l, pt)`. `l` 이 그대로면 `c + 1`, 바뀌면 `c = 0`.
- 수신(메시지 `(lm, cm)`): `l = max(l, lm, pt)`. 새 `l` 이 이전 `l` 과 `lm` 둘과 같으면 `c = max(c, cm) + 1`, 이전 `l` 과만 같으면 `c + 1`, `lm` 과만 같으면 `cm + 1`, 둘 다 아니면 `c = 0`.

### 왜 `max + 1` 은 안 되나

논문의 "단순 알고리즘"은 `l = max(l, lm, pt) + 1` 같은 식이다. 인과는 지키지만 `l` 이 물리 시각에서 **무한히 멀어질 수 있다**. 논문은 노드 몇 대가 서로 메시지를 계속 주고받는 반례를 든다. 메시지마다 +1 이 쌓여 `l − pt` 가 끝없이 커지고, 물리 시계가 따라잡을 틈도 없다.

HLC 는 +1 을 `l` 에서 빼고 `c` 로 옮겼다. 물리 시각이 올라가면 `l` 이 갱신되며 `c` 가 0 으로 돌아간다. 그래서 `l` 은 "물리 시각의 최댓값"일 뿐 이벤트 수에 따라 자라지 않는다.

### 경계

물리 시계 오차가 최대 ε 라고 가정하면(논문의 가정) 논문은 다음을 증명한다.

- `l ≥ pt` 이고 `l − pt ≤ ε`. 즉 HLC 의 시각 부분은 어느 노드의 물리 시각에서도 ε 이상 앞서지 않는다.
- `c` 는 같은 `l` 을 가진 인과 사슬의 길이 이하이고, 상한은 `N · (ε + 1)` 이다(N = 노드 수, 시계가 이벤트 사이에 최소 1 증가한다는 가정).
- 메시지 전송 사이에 물리 시계가 최소 d 이상 움직인다는 추가 가정이 있으면 `c ≤ ε/d + 1` 로 줄어든다.

논문의 실험에서 `c` 는 이론 상한보다 훨씬 작았다. 4대 노드 실험은 `c` 가 4 미만이었고, 8대(오프셋 9ms)는 최대 9, 16대(16ms)는 최대 7까지 나왔지만 4 이상은 소수 비율이었다.

### 직접 돌려 본 결과

논문 Figure 5 알고리즘을 그대로 구현하고 노드별 시계 오프셋을 `[-ε/2, ε/2]` 에서 뽑아 20만 이벤트를 돌렸다. 한 ms 안에 이벤트가 70% 몰리게 했다(적은 지연의 바쁜 서비스를 흉내).

| 노드 수 | ε (ms) | HLC 인과 위반 | 벽시계만 썼을 때 수신 시각 ≤ 송신 시각인 메시지 | 최대 c | 최대 l−pt |
| --- | --- | --- | --- | --- | --- |
| 4 | 0 | 0 | 9.7% | 16 | 0 |
| 4 | 5 | 0 | 23.6% | 16 | 3 |
| 16 | 50 | 0 | 47.1% | 22 | 49 |
| 16 | 500 | 0 | 48.3% | 29 | 470 |

- 인과 위반은 모든 경우에 0 이다. 벽시계만 쓰면 오차가 커질수록 메시지의 절반 가까이가 순서가 역전되거나 같은 값이 된다.
- `l − pt` 의 최댓값은 모두 ε 이하였다. 위 경계와 일치한다.
- 이 시뮬레이션은 ε 와 메시지 지연을 내가 정한 모델이므로 실제 시스템의 수치로 읽으면 안 된다. 특히 `c` 는 이벤트 밀도에 민감하다.

```ts
class HLC {
  l = 0; c = 0;
  constructor(private pt: () => number, private maxDrift = 1000) {}
  send(): [number, number] {
    const l0 = this.l; this.l = Math.max(l0, this.pt());
    this.c = this.l === l0 ? this.c + 1 : 0; return [this.l, this.c];
  }
  recv(lm: number, cm: number): [number, number] {
    if (lm - this.pt() > this.maxDrift) throw new Error('HLC: 상대 시계가 너무 앞서 있음'); // 방어: 오염 전파 차단
    const l0 = this.l; this.l = Math.max(l0, lm, this.pt());
    if (this.l === l0 && this.l === lm) this.c = Math.max(this.c, cm) + 1;
    else if (this.l === l0) this.c++;
    else if (this.l === lm) this.c = cm + 1;
    else this.c = 0;
    return [this.l, this.c];
  }
}
```

## 활용

- **트랜잭션·버전 타임스탬프**: 중앙 타임스탬프 서버 없이 노드가 스스로 인과가 맞는 번호를 만든다. 논문은 이를 다중 버전 분산 DB 에서 **대기 없는(wait-free) 트랜잭션 순서화와 스냅숏 읽기**에 쓸 수 있다고 제안한다. Spanner 처럼 commit wait 로 시간 불확실성만큼 기다리지 않고 인과 순서만 보장하는 길이다 → [Spanner 와 TrueTime](/develop-wiki/knowledge/distributed-systems/spanner-truetime/).
- **일관된 스냅숏**: "HLC 가 T 이하인 상태들"의 모음이 일관된 컷이 된다.
- **LWW 충돌 해소의 보정**: 벽시계 LWW 보다 인과 역전이 적다. 그래도 동시 쓰기에서 한쪽이 사라지는 성질은 그대로다.

## 언제 쓰나

- 노드가 많고 중앙 시퀀서를 두기 싫으며, 인과 순서 + 사람이 읽을 수 있는 시각이 둘 다 필요할 때.
- 시간 기준 스냅숏 읽기, 변경 로그의 시간 구간 질의.

## 주의 (비용)

- **동시성을 구분하지 못한다.** 스칼라라서 `ts(a) < ts(b)` 가 인과를 뜻하지 않는다. 동시 쓰기 탐지는 벡터 클록이나 [CRDT](/develop-wiki/knowledge/distributed-systems/crdt/)가 필요하다.
- **외부 일관성(실시간 순서)을 보장하지 않는다.** 서로 통신하지 않은 두 클라이언트가 보기에 "먼저 끝난 트랜잭션"이 더 작은 타임스탬프를 가진다는 보장이 없다. 그건 TrueTime 의 몫이다.
- **오염에 취약하다.** 시계가 크게 앞선 노드의 메시지를 받으면 `l` 이 그 값으로 뛰어올라 전체가 따라간다. 논문도 가정 위반 상태를 고려해, `l` 이 `pt` 에서 너무 크게 벗어나는 메시지는 무시하고, 한계를 넘으면 `pt`, 0 으로 국소 리셋하며 로그·예외를 올리는 방어를 제안한다. 위 코드의 `maxDrift` 검사가 그 단순화다.
- 정상 동작에서 `l` 은 내려오지 않는다. 시계가 정상으로 돌아와도 그 사이 만든 타임스탬프는 미래값으로 남는다. 논문은 한계를 넘은 상태를 발견하면 물리 시계를 기준으로 `l`, `c` 를 `pt`, 0 으로 국소 리셋하고 로그와 경보를 남기는 보정을 둔다. 리셋은 인과 보장을 잠시 포기하는 비상 수단이다.
- 논문은 `l` 을 `pt` 의 상위 48비트(마이크로초 단위)로 제한하고 나머지 16비트를 `c` 에 쓰는 안을 제시한다. 실제 구현의 비트 배분은 구현마다 다르다.
