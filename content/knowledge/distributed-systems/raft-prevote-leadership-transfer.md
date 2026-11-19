---
title: Raft Pre-Vote 와 리더 이양
aka: [Raft Pre-Vote, Leadership Transfer, TimeoutNow, Disruptive Server, Term Inflation, CheckQuorum, 사전 투표]
category: distributed-systems
level: advanced
summary: 고립됐다 돌아온 서버가 임기를 부풀려 멀쩡한 리더를 끌어내리는 문제를 막는 사전 투표 단계와, 점검·재배치 때 선거 공백 없이 리더를 넘기는 이양 절차.
tags: [distributed-systems, raft, leader-election, pre-vote, leadership-transfer, availability, etcd]
related: [distributed-systems/raft-consensus, distributed-systems/raft-membership-change, distributed-systems/raft-read-index, distributed-systems/leader-lease-clock-assumptions, distributed-systems/paxos-vs-raft, distributed-systems/gossip-failure-detection]
sources:
  - https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf
  - https://raft.github.io/raft.pdf
  - https://raw.githubusercontent.com/etcd-io/raft/main/doc.go
updatedAt: 2026-11-19
---

기본 선거와 로그 복제는 [Raft 합의](/develop-wiki/knowledge/distributed-systems/raft-consensus/)에 있다. 구성 변경 중 제거된 서버가 일으키는 방해와 그 해법(리더 하트비트를 들은 직후 투표 요청 무시)은 [구성 변경](/develop-wiki/knowledge/distributed-systems/raft-membership-change/)에서 다룬다. 이 노트는 그와 다른 두 가지, **네트워크 분리에서 돌아온 서버의 임기 부풀림**과 **리더를 계획적으로 넘기는 절차**를 다룬다.

## 문제

### 임기 부풀림

- 네트워크가 갈라져 하트비트를 못 받는 서버는 선거 타임아웃마다 임기(term)를 올리고 선거를 건다. 과반을 못 얻어 리더가 되지는 못하지만 **임기 번호만 계속 커진다**.
- 연결이 돌아오면 그 큰 임기가 요청이나 응답에 실려 전파되고, 멀쩡히 일하던 리더가 물러나 새 선거가 열린다. Ongaro 의 박사 논문은 이런 일이 드물고 한 번에 리더 하나만 물러나게 한다고 평가하면서도, 원하면 막을 수 있는 확장을 둔다.

### 리더를 내려놓아야 할 때

- 리더를 재부팅·제거해야 할 때, 그냥 멈추면 다른 서버가 선거 타임아웃이 지나 선거를 열 때까지 클러스터가 쉰다. 논문은 이 공백을 피하려고 이양을 둔다.
- 지연을 줄이려 선호하는 서버(주 데이터센터, 부하가 낮은 서버)를 리더로 두고 싶어도, Raft 에서는 로그가 충분히 최신인 서버만 리더가 될 수 있어 선호 서버가 뽑힌다는 보장이 없다.

## 해법

### Pre-Vote

논문 9.6절의 설명을 자기 말로 정리하면 다음과 같다.

1. 선거 타임아웃이 지난 서버는 **임기를 올리지 않고** 다른 서버에 "지금 선거를 걸면 표를 주겠는가"를 묻는다(사전 투표 요청).
2. 묻는 쪽의 로그가 충분히 최신이고, 응답하는 쪽이 **최소 기본 선거 타임아웃 동안 유효한 리더의 하트비트를 못 받았을 때만** 긍정한다.
3. 과반이 긍정하면 그제야 임기를 올리고 실제 선거를 연다. 아니면 임기 변화 없이 대기한다.

고립된 서버는 과반의 허락을 못 얻으니 임기가 오르지 않는다. 복귀해도 다른 서버는 리더의 정기 하트비트를 받고 있으므로 계속 거절하고, 이 서버는 리더의 하트비트를 받는 즉시 같은 임기의 팔로워로 돌아온다. 논문은 이 확장이 선거 성능을 크게 해치지 않는다고 시뮬레이션했고, 추가 견고성이 이로운 배포에 권한다.

etcd 의 Raft 라이브러리는 이를 `Config.PreVote` 옵션으로 제공한다. 문서 설명으로는 사전 선거가 일반 선거와 같은 규칙으로 돌고, 이길 것이 확실할 때만 임기를 올리며, 메시지 종류는 `MsgPreVote`·`MsgPreVoteResp` 다.

### 한계: 구성 변경의 방해는 못 막는다

Pre-Vote 는 서버 로그가 최신이라면 통과한다. 논문 4.2.3절은 제거 중인 서버의 로그가 과반보다 최신이어서 사전 투표를 통과하는 반례를 그림으로 보이고, 로그 비교만으로는 방해성 선거를 구분할 수 없다고 결론낸다. 그래서 구성 변경 쪽 해법은 하트비트 시간 기반 무시 규칙이다. 두 장치는 목적이 다르다.

### 리더 이양(Leadership transfer)

논문 3.10절의 절차는 다음과 같다.

1. 기존 리더가 **새 클라이언트 요청 수락을 멈춘다.**
2. 대상 서버의 로그를 일반 복제로 자기 로그와 같게 만든다.
3. 대상에 `TimeoutNow` 를 보낸다. 대상은 선거 타이머가 울린 것과 같은 효과로 즉시 임기를 올리고 후보가 된다.

대상은 거의 확실히 다른 서버보다 먼저 선거를 열어 다음 임기의 리더가 되고, 대상의 다음 메시지에 실린 새 임기를 본 기존 리더는 물러난다. 한 선거 타임아웃쯤 지나도 이양이 안 끝나면 기존 리더가 이양을 취소하고 요청 수락을 재개한다. 대상이 죽어 있었다면 그것으로 끝이고, 대상이 살아 있었는데 오판했다면 최악의 경우 선거가 한 번 더 열린다. 논문은 `TimeoutNow` 수신이 시계가 빠르게 앞서 간 것과 같아 Raft 가 이미 임의의 시계 속도에서도 안전하므로 안전성이 유지된다고 설명한다. 단 논문은 이 방식을 **구현하거나 평가하지는 않았다**고 밝힌다.

기존 리더가 [리더 리스](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/)로 읽기를 서빙하고 있었다면 이양 때 리스를 먼저 포기해야 새 리더가 바로 설 수 있다.

### 장난감 모델로 확인

5노드를 한 노드만 고립시킨 틱 단위 모델(로그는 모두 동일, 선거만 단순화)로 200 가지 난수 시드를 돌렸다.

| Pre-Vote | 복귀 시 고립 노드의 평균 임기 | 복귀 직후 리더 강제 사임 |
| --- | --- | --- |
| 끔 | 4.6 (정상은 1) | 200/200 |
| 켬 | 1.0 | 0/200 |

실제 구현이 아니라 규칙의 효과를 보는 모형이다. 임기 숫자는 고립 시간과 타임아웃 설정에 비례한다.

```ts
// 사전 투표 처리(투표자 쪽): 상태를 바꾸지 않고 "표를 줄 수 있는가"만 답한다
function onPreVote(me: Node, req: { term: number; lastLogOk: boolean }, now: number): boolean {
  const heardLeaderRecently = now - me.lastLeaderContact < me.electionTimeoutMin;
  return !heardLeaderRecently && req.term >= me.term && req.lastLogOk;   // me.term, me.votedFor 는 건드리지 않음
}
```

## 언제 쓰나

- 가끔 분리되거나 느려지는 서버(여러 가용 영역, 불안정한 링크)가 있어, 복귀할 때마다 리더가 교체되는 지연 스파이크가 문제일 때. Pre-Vote.
- 롤링 업그레이드·노드 교체·리전 선호 리더 배치처럼 **계획된** 리더 이동에서 가용성 공백을 줄이고 싶을 때. 리더 이양.

## 주의·비용

- **Pre-Vote 는 만능이 아니다.** 사전 투표 단계로 선거가 한 왕복 늦어진다. 과반의 하트비트 정보가 서로 어긋나면(일부만 리더와 끊김) 정당한 선거가 거절될 수 있다. etcd 문서가 이 경우를 길게 다루지 않으므로 운영 버전의 동작을 직접 확인한다.
- 리더가 과반과 끊긴 비대칭 분리에서 리더가 스스로 물러나지 못하는 문제는 다른 장치(리더가 과반 연락을 확인하다 실패하면 사임하는 CheckQuorum 류)가 맡는다. etcd 문서에는 "리더가 정족수를 잃으면 자동 사임" 기능이 선택 확장으로 나열돼 있으나, Pre-Vote 와 조합했을 때의 세부 동작은 이 노트에서 확인하지 못했다.
- 리더 이양은 대상 선정, 복제 지연 대기, 타임아웃 취소 처리가 필요하다. 대상이 너무 뒤처져 있으면 이양이 길어진다.
- 이양 도중 새 요청을 막으므로 짧은 쓰기 정지가 생긴다. 선거 공백보다 짧은 것이 목적이다.
- 둘 다 안전성(두 리더 금지)이 아니라 **가용성** 개선이다. 잘못 구현해도 안전성은 깨지지 않도록 설계된 확장이지만, 잘못 구현하면 선거가 계속 거절되는 활성(liveness) 문제가 생길 수 있다(논문의 안전성 논의에서 이끌어 낸 추론).

> 출처 확인 범위: Ongaro 박사 논문 PDF 에서 3.10절(리더 이양), 4.2.3절(방해 서버와 Pre-Vote), 9.6절(복귀 서버 방해 방지)을 본문 텍스트를 직접 추출해 읽었다. etcd raft 의 `doc.go` 와 README 는 읽었으나 `MsgTimeoutNow`·CheckQuorum 세부는 해당 페이지에 없어 확인하지 못했다. 위 장난감 모델은 직접 작성해 실행한 결과이며 실제 etcd 동작이 아니다. 미확인: TiKV·CockroachDB 등 구현의 Pre-Vote 채택 여부와 세부 파라미터.
