---
title: Paxos 와 Raft 비교
aka: [Paxos vs Raft, Single-decree Paxos, Multi-Paxos, Basic Paxos, Proposer Acceptor Learner, EPaxos]
category: distributed-systems
level: advanced
summary: 같은 문제(복제 로그 합의)를 푸는 두 알고리즘의 구조 차이. Paxos 는 값 하나를 정하는 2단계 프로토콜이고, Raft 는 리더 선출·로그 복제를 처음부터 한 덩어리로 설계했다.
tags: [distributed-systems, consensus, paxos, multi-paxos, raft, replicated-log]
related: [distributed-systems/raft-consensus, distributed-systems/replication-quorum, distributed-systems/logical-clocks, distributed-systems/cap-pacelc, distributed-systems/two-phase-commit-vs-saga, distributed-systems/spanner-truetime]
sources:
  - https://lamport.azurewebsites.net/pubs/paxos-simple.pdf
  - https://raft.github.io/raft.pdf
updatedAt: 2026-11-19
---

## 문제

"Paxos 와 Raft 중 뭐가 낫나"라는 질문은 둘을 같은 층위로 놓을 때 생긴다. 둘 다 과반이 살아 있으면 **하나의 값(또는 같은 순서의 로그)에 합의**하게 해 준다. 달라지는 곳은 알고리즘의 **분해 방식**이다. Raft 노트는 [Raft 합의](/develop-wiki/knowledge/distributed-systems/raft-consensus/)에서 따로 다뤘으니, 여기서는 Paxos 쪽 구조와 둘의 차이만 정리한다.

## Paxos: 값 하나를 정하는 프로토콜

Lamport 의 "Paxos Made Simple" 이 설명하는 단일 값(single-decree) 버전이다. 역할은 제안자(proposer), 수락자(acceptor), 학습자(learner)이고, 한 서버가 셋을 모두 맡을 수 있다.

**1단계**
- 제안자가 번호 `n`(유일하고 서로 비교 가능해야 함)을 골라 과반의 수락자에게 `prepare(n)` 을 보낸다.
- 수락자는 지금까지 약속한 번호보다 `n` 이 크면 "`n` 미만 제안은 앞으로 수락하지 않겠다"고 약속하고, **이미 수락한 제안 중 번호가 가장 큰 것**을 같이 돌려준다.

**2단계**
- 과반의 약속을 받으면 제안자는 `accept(n, v)` 를 보낸다. 이때 `v` 는 약속 응답에 들어 있던 수락 값 중 **번호가 가장 큰 것**이어야 한다. 아무도 수락한 값이 없을 때만 자기 값을 낸다.
- 수락자는 그동안 `n` 보다 큰 번호를 약속하지 않았다면 수락한다.

이 "값 규칙"이 안전성의 핵심이다. 과반 둘은 반드시 겹치므로, 이미 선택된 값은 다음 제안자의 약속 응답에 나타나고 그대로 이어진다. 수락자는 약속한 번호와 수락한 제안을 **재시작 후에도 기억**해야 하므로 안정 저장소에 먼저 쓴다.

```ts
type Acceptor = { promised: number; accN: number; accV: string | null };
type Reply = { ok: boolean; accN: number; accV: string | null };

const prepare = (a: Acceptor, n: number): Reply => {
  if (n > a.promised) { a.promised = n; return { ok: true, accN: a.accN, accV: a.accV }; } // 약속: n 미만은 앞으로 거절
  return { ok: false, accN: -1, accV: null };
};
const accept = (a: Acceptor, n: number, v: string): boolean => {
  if (n < a.promised) return false;
  a.promised = a.accN = n; a.accV = v; return true;
};

// 제안자: 과반 acceptor 에게만 말을 걸 수 있다고 가정(나머지는 끊김)
function propose(acc: Acceptor[], reach: number[], n: number, mine: string): string | null {
  const replies = reach.map((i) => prepare(acc[i], n)).filter((r) => r.ok);
  if (replies.length <= acc.length / 2) return null;
  const prior = replies.filter((r) => r.accV !== null).sort((x, y) => y.accN - x.accN)[0];
  const v = prior ? prior.accV! : mine;                     // 값 규칙: 이미 수락된 값이 있으면 가장 번호 큰 것을 이어받는다
  const acks = reach.filter((i) => accept(acc[i], n, v)).length;
  return acks > acc.length / 2 ? v : null;
}

const acc: Acceptor[] = Array.from({ length: 5 }, () => ({ promised: 0, accN: 0, accV: null }));
console.log(propose(acc, [0, 1, 2], 1, 'A'));  // 'A' 가 acceptor 0,1,2 에서 선택됨
console.log(propose(acc, [2, 3, 4], 2, 'B'));  // 'B' 를 내고 싶지만 2번이 A 를 알고 있어 'A' 를 이어받는다
```

실행하면 둘 다 `A` 를 출력한다. 두 번째 제안자는 `B` 를 원했지만 겹치는 수락자(2번)를 통해 `A` 를 알게 돼 값을 바꾸지 않는다.

**진행(liveness)**: 두 제안자가 서로 더 큰 번호로 1단계를 계속 끼워 넣으면 어느 쪽도 2단계를 끝내지 못한다. 논문은 대표 제안자를 하나 뽑아 이 문제를 피하라고 하고, 선출에는 무작위나 타임아웃이 필요하다고 짚는다(FLP 결과). **리더 선출이 실패해도 안전성은 깨지지 않는다.**

## Multi-Paxos: 로그로 확장

복제 상태 기계는 명령마다 Paxos 인스턴스를 하나씩 돌려 만든다. i 번째 인스턴스에서 선택된 값이 i 번째 명령이다.

- 안정된 리더가 있으면 **1단계를 모든 미래 인스턴스에 대해 한 번에** 끝내 두고, 명령마다 2단계만 실행한다. 논문은 정상 상태의 비용이 2단계뿐이라고 설명한다.
- 리더가 앞서 나가며 여러 인스턴스를 동시에 진행하면 **중간 빈칸(gap)** 이 생길 수 있다. 새 리더는 빈칸을 아무 일도 하지 않는 no-op 으로 채워 뒤 명령을 실행할 수 있게 한다.
- 서버 구성 변경도 상태 기계의 명령으로 처리하자는 아이디어가 논문에 나온다.

## 같은 문제, 다른 분해

Raft 논문(Ongaro·Ousterhout)이 Paxos 에 제기한 불만과 설계 선택을 요약하면 다음과 같다. 이 비교는 **Raft 저자들의 주장**이므로 그 점을 감안해서 읽는다.

| | Paxos / Multi-Paxos | Raft |
| --- | --- | --- |
| 기본 단위 | 값 하나를 정하는 인스턴스. 로그는 인스턴스를 이어 붙인 것 | 처음부터 **로그**를 기본 단위로 설계 |
| 리더 | 성능 최적화용으로 따로 얹음. 합의 자체에는 불필요 | 합의의 일부. 선거가 사실상 1단계 역할 |
| 로그 모양 | 인스턴스가 독립이라 빈칸이 생길 수 있고 no-op 으로 메움 | 리더 → 팔로워로만 흐르고, 직전 항목이 일치해야 붙음 |
| 선거 | 별도 메커니즘 | 무작위 선거 타임아웃 + 투표 제한(로그가 최신인 후보만) |
| 구성 변경 | 상태 기계 명령으로 처리하는 스케치 | 공동 합의(joint consensus)를 알고리즘에 포함 |
| 명세 | 단일 값 설명이 중심, 로그 확장은 세부가 비어 있음(저자 주장) | 구현에 필요한 세부를 한 논문에 담음 |

- Raft 논문은 기본 합의·구성 변경에 쓰는 메시지 종류가 4개(RPC 요청 2종과 응답)로, 비교한 VR·ZooKeeper 의 10개보다 적다고 센다.
- 이해 용이성은 학생 43명 대상 실험(Raft 질문을 더 잘 맞힌 학생 33명)으로 주장했다. 소규모 실험이니 절대적 근거로 쓰지 않는다.
- 같은 논문은 리더 없는 **EPaxos** 가 일부 조건에서 WAN 지연이 낮을 수 있다고 인정한다. 대신 복잡도가 크게 올라간다.
- Raft 논문에 따르면 Chubby·Spanner 는 Paxos 기반이라고 밝혔지만 알고리즘이 자세히 공개되지는 않았다. "Paxos 기반"이 곧 논문의 Paxos 와 같다는 뜻은 아니다. 논문은 실제 시스템이 Paxos 에서 출발해 상당히 다른 구조가 됐다고 지적한다.

## 언제 쓰나

- **직접 구현해야 한다면** 구현 지침이 풍부한 Raft 계열을 고른다. 이미 검증된 구현(etcd 등)을 쓰는 편이 더 낫다.
- **Paxos 계열을 이해해야 하는 경우**: 합의의 안전성 논증(과반 겹침 + 값 규칙)을 배우거나, Paxos 기반이라고 알려진 시스템을 읽을 때. 이 논증은 Raft 의 선거·커밋 규칙에도 그대로 대응된다.
- 합의 자체를 만들기보다 **Raft/Paxos 기반 서비스(설정 저장소, 락 서비스, 분산 DB)** 를 가져다 쓰는 것이 보통의 선택이다.

## 주의

- "Paxos 는 어렵고 Raft 는 쉽다"로 끝내지 않는다. Raft 도 투표 제한, 이전 term 항목의 커밋 규칙 같은 미묘한 안전성 조건이 있다.
- Paxos 는 **알고리즘 이름이 가리키는 범위가 넓다.** 단일 값 Paxos, Multi-Paxos, 그 변형이 모두 "Paxos"로 불린다. 논문 한 편이 곧 구현 명세는 아니다.
- 두 알고리즘 모두 **과반이 살아 있고 통신 가능**해야 진행한다. 비잔틴 장애(악의적·임의 오동작)는 가정하지 않는다. Paxos Made Simple 도 비비잔틴 가정을 둔다.
- 안전성은 시간 가정 없이 지켜지지만 진행은 시간(타임아웃)에 의존한다. 분산 락처럼 타이밍에 의존한 용법과 구분한다 → [분산 락과 펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/).
