---
title: 머클 트리 (해시 트리)
aka: [Merkle Tree, Hash Tree, Anti-entropy, Inclusion Proof, Audit Path, Consistency Proof]
category: distributed-systems
level: intermediate
summary: 잎은 데이터 해시, 부모는 자식 해시의 해시인 트리. 루트 하나로 데이터 전체를 대표해, 두 복제본의 차이를 O(log n) 비교로 찾고 한 항목의 포함을 로그 크기 증명으로 보인다.
tags: [distributed-systems, merkle-tree, hash, anti-entropy, replication, certificate-transparency]
related: [distributed-systems/replication-quorum, distributed-systems/gossip-failure-detection, distributed-systems/crdt, algorithms/consistent-hashing, algorithms/lsm-tree, algorithms/bloom-filter, algorithms/hash-functions-hashdos]
sources:
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
  - https://www.rfc-editor.org/rfc/rfc9162.html
  - https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html
updatedAt: 2026-11-19
---

## 문제

두 복제본이 각각 수백만 키를 가진다. 어딘가 몇 개가 어긋났다고 의심될 때 전부 보내서 비교하면 대역폭과 디스크 읽기가 너무 크다. 반대로 전체 체크섬 하나만 비교하면 "다르다"는 사실만 알고 **어디가** 다른지 모른다. 또 신뢰할 수 없는 서버가 준 큰 로그에서 항목 하나가 정말 들어 있는지, 전체를 내려받지 않고 확인하고 싶을 때도 있다.

## 해법

- **잎**: 데이터 항목(또는 키 범위)의 해시.
- **안쪽 노드**: 두 자식 해시를 이어 붙여 다시 해시한 값.
- **루트**: 맨 위 해시 하나. 데이터 어디가 바뀌어도 루트가 바뀐다.

### 1. 복제본 비교 (anti-entropy)

Dynamo 논문은 노드가 **키 범위마다 머클 트리를 따로** 유지한다고 설명한다. 두 노드는 공통으로 가진 범위의 루트를 교환한다. 같으면 그 범위 전체가 같으므로 끝이다. 다르면 자식 해시를 교환하며 내려가 어긋난 **잎(키)** 에 도달한다. 한 가지(branch)씩 독립적으로 확인할 수 있어 전송량과 디스크 읽기가 줄어든다.

Cassandra 의 `nodetool repair` 도 같은 아이디어다. 문서에 따르면 복제본의 공통 토큰 범위를 머클 트리로 비교하고, 어긋난 구간만 스트리밍한다.

```ts
import { createHash } from 'node:crypto';
const H = (...p: Buffer[]) => createHash('sha256').update(Buffer.concat(p)).digest();
const leaf = (s: string) => H(Buffer.from([0x00]), Buffer.from(s));          // 잎과 안쪽 노드를 접두어로 구분(RFC 9162)
const node = (l: Buffer, r: Buffer) => H(Buffer.from([0x01]), l, r);

// 모든 층을 저장. 홀수 개면 마지막 노드를 올려 보낸다(단순화한 구조)
function build(items: string[]): Buffer[][] {
  const levels = [items.map(leaf)];
  while (levels.at(-1)!.length > 1) {
    const cur = levels.at(-1)!, up: Buffer[] = [];
    for (let i = 0; i < cur.length; i += 2) up.push(i + 1 < cur.length ? node(cur[i], cur[i + 1]) : cur[i]);
    levels.push(up);
  }
  return levels;
}
// 두 트리를 위에서 아래로 비교해 달라진 잎 번호만 찾는다
function diff(a: Buffer[][], b: Buffer[][], lvl = a.length - 1, i = 0, out: number[] = []): number[] {
  if (a[lvl][i].equals(b[lvl][i])) return out;                                // 해시가 같으면 부분 트리 전체를 건너뜀
  if (lvl === 0) { out.push(i); return out; }
  for (const c of [2 * i, 2 * i + 1]) if (c < a[lvl - 1].length) diff(a, b, lvl - 1, c, out);
  return out;
}

const A = Array.from({ length: 1000 }, (_, i) => `k${i}=v${i}`);
const B = A.slice(); B[137] = 'k137=STALE'; B[862] = 'k862=STALE';
const ta = build(A), tb = build(B);
console.log('루트 같음?', ta.at(-1)![0].equals(tb.at(-1)![0]));
console.log('다른 잎', diff(ta, tb));                                           // [137, 862]
```

실행하면 루트가 다르다고 나오고, 1000개 중 어긋난 잎 `[137, 862]` 두 개만 찾아낸다. 일치하는 부분 트리는 한 번의 해시 비교로 건너뛴다.

### 2. 포함·일관성 증명 (인증 로그)

RFC 9162(인증서 투명성 2.0)의 머클 트리는 이렇게 정의된다.

- 잎은 `HASH(0x00 || 데이터)`, 안쪽 노드는 `HASH(0x01 || 왼쪽 || 오른쪽)`. RFC 는 이 접두어가 두 번째 원상(second preimage) 저항성을 준다고 설명한다. 곧 잎과 안쪽 노드를 서로 바꿔치기하는 위조를 막는다.
- 잎 수가 2 의 거듭제곱이 아니어도 된다. 분할 지점을 "n 보다 작은 가장 큰 2 의 거듭제곱"으로 정해 트리 모양이 잎 수로 결정된다.
- **포함 증명(audit path)**: 한 잎에서 루트까지 올라가며 필요한 형제 노드 목록. 검증자는 이를 이용해 루트를 다시 계산해 서버가 약속한 루트와 비교한다. 길이는 트리 높이(약 log₂ n)에 비례한다.
- **일관성 증명**: 크기 m 의 옛 트리가 크기 n 의 새 트리의 **앞부분 그대로**임을 보인다. 로그가 과거를 고쳐 쓰지 않고 뒤에 붙기만 했다는 증명이며, RFC 에 따르면 최대 ⌈log₂ n⌉+1 개 노드다.

## 언제 쓰나

- 분산 저장소의 **복제본 동기화(anti-entropy)**: Dynamo 계열, Cassandra repair.
- **추가 전용 로그의 무결성 증명**: 인증서 투명성처럼 서버를 믿지 않고 항목 포함과 로그의 불변을 검증.

## 주의 (비용)

- **트리를 유지하는 비용**이 있다. 쓰기마다 잎에서 루트까지 해시를 다시 계산한다. Dynamo 논문은 노드가 합류·이탈하면 키 범위가 바뀌어 **트리를 다시 계산해야 하는 단점**을 직접 적었고, 이를 파티셔닝 방식(6.2절)으로 개선했다고 한다.
- 잎 단위가 거칠면(범위당 하나 등) 한 키만 달라도 범위 전체를 전송하게 된다. 잎의 크기와 트리 깊이는 정밀도와 메모리의 교환이다.
- 해시 함수에 **충돌 저항**이 필요하다. 약한 해시로는 증명이 의미가 없다. 안쪽 노드 접두어를 빼먹는 구현 실수도 흔하다.
- 복제본이 **같은 순서·같은 직렬화**로 잎을 만들어야 같은 트리가 나온다. 정규화가 어긋나면 데이터가 같아도 다르다고 판단한다.
- anti-entropy 는 평소 경로(쿼럼 읽기·쓰기, 힌트 핸드오프)를 대체하지 않고 **보강**한다 → [복제와 쿼럼](/develop-wiki/knowledge/distributed-systems/replication-quorum/).
