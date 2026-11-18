---
title: EPaxos (리더 없는 합의)
aka: [EPaxos, Egalitarian Paxos, Leaderless Consensus, Command Leader, Fast Path, Slow Path, 리더리스 합의]
category: distributed-systems
level: advanced
summary: 안정된 리더 없이 아무 복제본이나 명령을 받아, 서로 간섭하지 않는 명령은 한 왕복에 커밋하고 간섭하는 명령은 의존 그래프로 순서를 정하는 Paxos 변형.
tags: [distributed-systems, consensus, paxos, epaxos, leaderless, geo-replication, dependency-graph]
related: [distributed-systems/paxos-vs-raft, distributed-systems/flexible-paxos, distributed-systems/raft-consensus, distributed-systems/replication-quorum, distributed-systems/consistency-models, distributed-systems/spanner-truetime, algorithms/strongly-connected-components]
sources:
  - https://www.cs.cmu.edu/~dga/papers/epaxos-sosp2013.pdf
  - https://arxiv.org/abs/1906.10917
updatedAt: 2026-11-19
---

## 문제

Multi-Paxos 와 Raft 는 **안정된 리더 한 대**를 거쳐 모든 명령을 정한다. 그래서 세 가지 불만이 생긴다.

- 리더가 메시지 처리의 대부분을 맡아 CPU·네트워크 병목이 된다.
- 지역이 여러 개인 배치(geo-replication)에서 리더와 먼 곳의 클라이언트는 항상 리더까지 왕복해야 한다.
- 리더가 죽으면 새 리더가 설 때까지 상태 기계가 멈춘다.

[Paxos 와 Raft 비교](/develop-wiki/knowledge/distributed-systems/paxos-vs-raft/) 노트가 이 구조를 다뤘다. 여기서는 그 대안으로 자주 언급되는 EPaxos 를 정리한다.

## 해법: 순서를 "의존"으로 표현한다

핵심 관찰은 **서로 영향을 주지 않는 명령끼리는 순서를 맞출 필요가 없다**는 것이다. 두 명령 γ, δ 를 어떤 순서로 실행해도 결과가 같다면 간섭하지 않는다고 본다. 서로 다른 키를 고치는 쓰기가 대표적이다.

- 클라이언트는 가까운 복제본 아무 곳에나 명령을 보낸다. 그 복제본이 그 명령의 **command leader** 가 된다. 고정 리더가 아니라 명령마다 달라진다.
- 명령은 `deps`(간섭하는 이전 명령 목록)와 `seq`(의존 순환을 끊는 번호)라는 속성과 함께 커밋된다.

**커밋 단계**

1. **PreAccept**: command leader 가 명령과 자기가 아는 속성을 **fast quorum** 에 보낸다. 각 복제본은 자기 로그를 보고 `deps`·`seq` 를 보정해 돌려준다.
2. **빠른 경로(fast path)**: 받은 답이 모두 같은 속성이면 바로 커밋한다. 한 왕복이다.
3. **느린 경로(slow path)**: 답이 갈리면 command leader 가 속성을 합쳐 **과반(F+1)** 에게 Paxos 의 accept 를 한 번 더 받는다. 두 왕복이다.
4. 장애 복구는 다른 복제본이 Explicit Prepare 로 해당 명령 자리를 이어받아 끝낸다.

N = 2F+1 대일 때 논문의 쿼럼 크기는 다음과 같다. 최적화 전 기본 버전의 빠른 경로 쿼럼은 2F 이고, 최적화 버전은 `F + ⌊(F+1)/2⌋` 다. 아래 값은 이 식으로 계산했다.

| N | F | 기본 빠른 경로 2F | 최적화 빠른 경로 | 느린 경로(과반) |
| --- | --- | --- | --- | --- |
| 3 | 1 | 2 | 2 | 2 |
| 5 | 2 | 4 | 3 | 3 |
| 7 | 3 | 6 | 5 | 4 |
| 9 | 4 | 8 | 6 | 5 |

N = 3, 5 에서는 최적화된 빠른 경로 쿼럼이 과반과 같은 크기다. 7대부터는 과반보다 크다.

**실행 단계**: 커밋과 실행은 분리된다. 커밋된 명령은 `deps` 를 간선으로 하는 그래프를 이룬다. 실행기는 이 그래프에서 강연결 요소(SCC)를 찾고, **의존되는 쪽부터(역위상 순서)** 처리하며, 한 SCC 안에서는 `seq` 순으로 실행한다. 의존 순환이 있어도 모든 복제본이 같은 순서를 얻는다는 것이 포인트다([강연결 요소](/develop-wiki/knowledge/algorithms/strongly-connected-components/) 참고).

```ts
type Cmd = { id: string; seq: number; deps: string[] };
function execOrder(cmds: Cmd[], visitOrder: string[]): string[] {
  const by = new Map(cmds.map((c) => [c.id, c]));
  const idx = new Map<string, number>(), low = new Map<string, number>(), on = new Set<string>();
  const st: string[] = [], out: string[] = []; let t = 0;
  const dfs = (v: string) => {                       // Tarjan: SCC 는 의존되는 쪽부터 완성된다
    idx.set(v, t); low.set(v, t++); st.push(v); on.add(v);
    for (const w of by.get(v)!.deps) {
      if (!idx.has(w)) { dfs(w); low.set(v, Math.min(low.get(v)!, low.get(w)!)); }
      else if (on.has(w)) low.set(v, Math.min(low.get(v)!, idx.get(w)!));
    }
    if (low.get(v) !== idx.get(v)) return;
    const comp: Cmd[] = []; let w: string;
    do { w = st.pop()!; on.delete(w); comp.push(by.get(w)!); } while (w !== v);
    comp.sort((a, b) => a.seq - b.seq || (a.id < b.id ? -1 : 1)); // SCC 안에서는 seq 순(동률은 id 로 깸)
    out.push(...comp.map((c) => c.id));
  };
  for (const s of visitOrder) if (!idx.has(s)) dfs(s);
  return out;
}
```

명령 `C1`(독립), `C3↔C4`(서로 의존), `C5`(C3 에 의존) 로 실행해 봤다. 탐색 시작 순서 24가지를 모두 돌리면 결과가 3가지 나오는데, 달라지는 것은 간섭하지 않는 `C1` 의 위치뿐이다. 간섭하는 명령 사이의 상대 순서(`C3 < C4`, `C3 < C5`)는 24가지 모두 같았다. 이 실행기는 논문 절차를 직접 옮긴 것이고, SCC 안에서 seq 동률을 id 로 깨는 규칙은 이 예제의 가정이다.

## 언제 쓰나

- 여러 지역에 복제본을 두고 **쓰기 지연을 가까운 복제본 기준으로** 줄이고 싶고, 동시에 같은 객체를 건드리는 명령이 드문 워크로드.
- 단일 리더의 처리량 한계나 리더 장애 시 정지 시간이 문제가 되는 연구·설계 검토 단계. 논문은 느린 복제본이 있을 때도 다른 복제본이 그 복제본을 쿼럼에서 빼서 성능이 덜 떨어진다고 보고한다.

## 주의 (비용)

- **간섭 판정이 필요하다.** 구현이 두 명령이 간섭하는지 미리 알아야 한다. 알 수 없으면 모든 명령을 간섭으로 취급해야 해서 이점이 사라진다.
- **충돌이 많으면 느린 경로가 늘어** 두 왕복이 된다. 논문 평가에서도 충돌이 많은 구간에서는 이점이 줄어든다.
- **커밋 지연과 실행 지연이 다르다.** 간섭하는 명령이 빠르게 이어지면 의존 사슬이 길어져 실행이 늦어질 수 있다. 논문은 새 명령 제안보다 오래된 명령 완료를 우선하는 방식으로 실행 livelock 을 막는다고 설명한다.
- **복잡도와 검증 부담이 크다.** 후속 연구(Sutra, 2019)는 TLA+ 명세와 구현에서 복구 시 ballot 변경과 의존 계산이 얽힌 문제를 지적했고, 선형화가 깨질 수 있다고 주장했다. 이 노트는 해당 논문의 초록만 확인했으며 세부 반례와 수정 여부는 열람하지 않았다.
- 실제 제품에서의 채택 현황은 이 노트에서 확인하지 못했다. 직접 구현하기 전에 검증된 구현이 있는지부터 본다.
- 안전성은 시간 가정 없이 지켜지고 진행은 FLP 때문에 타임아웃에 의존한다는 점은 다른 Paxos 계열과 같다. 비잔틴 장애는 가정하지 않는다.
