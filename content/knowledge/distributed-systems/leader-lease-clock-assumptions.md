---
title: 리더 리스와 시계 가정
aka: [Leader Lease, Master Lease, Lease-based Read, Clock Drift Bound, Lease Read, 리스 기반 읽기]
category: distributed-systems
level: advanced
summary: 과반 응답을 받는 대신 리더가 "일정 시간 동안 다른 리더가 없다"는 약속(리스)에 기대 읽기를 로컬로 처리하는 기법. 안전성이 시계 속도 오차 상한이라는 시간 가정에 걸린다.
tags: [distributed-systems, lease, leader-lease, clock-drift, linearizability, raft, read-optimization]
related: [distributed-systems/raft-consensus, distributed-systems/paxos-vs-raft, distributed-systems/distributed-lock-fencing-token, distributed-systems/spanner-truetime, distributed-systems/logical-clocks, distributed-systems/consistency-models, distributed-systems/gossip-failure-detection]
sources:
  - https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf
  - https://raft.github.io/raft.pdf
  - https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf
  - https://storage.googleapis.com/gweb-research2023-media/pubtools/1974.pdf
  - https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
updatedAt: 2026-11-19
---

## 문제

합의 기반 저장소에서 선형화 가능한 읽기를 제공하려면, 읽기를 받은 리더가 **자기가 아직 리더인지** 확인해야 한다. 이미 다른 리더가 뽑혔는데 모르고 있을 수 있기 때문이다. Raft 는 읽기 전에 과반과 하트비트를 주고받아 확인한다. 안전하지만 읽기마다(또는 읽기 묶음마다) 한 왕복이 든다. 읽기가 대부분인 서비스에서는 이 비용이 크다.

## 해법: 확인 대신 시간 약속을 쓴다

**리스(lease)** 는 "내가 이 기간 동안은 상대를 바꾸지 않겠다"는 약속이다. 리더 리스는 이렇게 동작한다.

1. 팔로워는 리더의 하트비트(또는 리스 투표)에 응답하면서 **자기 시계로 L 동안 다른 후보에게 투표하지 않겠다**고 약속한다.
2. 리더는 하트비트를 **보낸 시점**부터, 과반이 응답했다면 L 을 시계 오차로 보정한 기간 동안 자기가 유일한 리더라고 믿는다.
3. 그 기간 안에는 읽기를 **메시지 없이 로컬 상태로** 처리한다. 쓰기는 그대로 합의를 거친다.

Raft 박사논문(6.4.1)이 이 방식을 설명한다. 리더의 하트비트가 과반의 확인을 받으면 선거 타임아웃 정도 기간 동안 다른 서버가 리더가 될 수 없다고 보고, 그 기간을 시계 드리프트 상한으로 보정한 시점까지를 리스로 삼는다. 박사논문은 이 방식에 **시계 오차 상한이 필요**하며 꼭 필요한 경우가 아니면 권하지 않는다고 못 박는다.

실제 시스템에서도 쓴다.

- **Chubby**: 복제본들이 마스터에게 투표하면서 수 초짜리 **마스터 리스** 동안 다른 마스터를 뽑지 않겠다고 약속한다. 마스터 읽기는 리스가 유효한 한 다른 마스터가 있을 수 없어 안전하다고 설명한다. 클라이언트 세션 리스도 있어서, 클라이언트는 서버 시계가 자기보다 일정 배수 이상 빠르지 않다는 가정 아래 로컬 만료 시각을 보수적으로 계산한다.
- **Spanner**: Paxos 리더 리스(기본 10초)를 쓰고, 한 그룹에서 서로 다른 리더들의 리스 구간이 **겹치지 않는다**는 불변식에 의존한다. 이 불변식을 TrueTime 으로 강제한다 → [Spanner 와 TrueTime](/develop-wiki/knowledge/distributed-systems/spanner-truetime/).

## 시계 가정이 곧 안전 조건

리더는 자기 시계로 만료를 재고, 팔로워는 자기 시계로 약속 기간을 잰다. 두 시계의 **진행 속도**가 다르면 구간이 겹칠 수 있다. 모델을 단순화해서 계산하면 이렇다.

- 팔로워 시계 속도 `r_f`, 리더 시계 속도 `r_l`(1 이 정확), 약속 기간 `L`, 리더가 믿는 기간 `L(1 − ε)`(ε = 설계에서 가정한 시계 속도 오차 상한).
- 리더는 실제 시간으로 `L(1−ε)/r_l` 동안 믿고, 팔로워는 `L/r_f` 가 지나야 다른 후보를 뽑을 수 있다.
- 안전하려면 `L(1−ε)/r_l ≤ L/r_f` 여야 한다. 메시지 지연은 리더가 보낸 시점부터 재므로 안전한 쪽으로 작용한다.

`L = 1000ms`, `ε = 1%` 로 계산한 결과다.

| 리더 속도 | 팔로워 속도 | 상황 | 두 리더가 공존 가능한 구간 |
| --- | --- | --- | --- |
| 1.00 | 1.00 | 정확 | 0 ms |
| 1.01 | 1.00 | 리더 1% 빠름(가정 범위) | 0 ms |
| 1.00 | 0.99 | 팔로워 1% 느림(가정 범위) | 0 ms |
| 0.97 | 1.00 | 리더 3% 느림(가정 위반) | 약 20.6 ms |
| 1.00 | 1.05 | 팔로워 5% 빠름(가정 위반) | 약 37.6 ms |

가정 안에서는 겹침이 없고 가정을 벗어나면 겹침이 생긴다. 그 구간에 리더가 읽기를 처리하면 이미 새 리더가 커밋한 쓰기를 못 본 **오래된 값**이 나온다. 이 표는 수식을 계산한 모델이며 실제 서비스의 측정값이 아니다.

### 시계 속도만이 아니다: 정지

속도가 정확해도 문제가 생긴다. 리더가 "리스가 5ms 남았다"를 확인한 직후 GC·페이지 폴트·VM 일시 정지로 200ms 멈췄다가 읽기에 응답하면, 그 응답은 리스가 끝난 뒤에 나간다. Raft 박사논문도 GC 정지, VM 이주, 시계 속도 조정이 오차 상한 유지를 어렵게 만든다고 적는다. 이는 [분산 락과 펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/)에서 본 문제와 같다. 리스를 쥔 쪽이 자기가 아직 쥐고 있는지 확신할 수 없다.

## 언제 쓰나

- 읽기 비중이 매우 높고 읽기 지연이 중요하며, **시계 오차를 운영으로 통제할 수 있는** 환경(시계 동기화 모니터링, 정지 시간 상한 관리).
- 리더 안정화 목적(리더가 자주 바뀌지 않게 함). Spanner 가 리더 리스를 쓰는 이유이기도 하다.
- 리더 이양(leadership transfer) 때는 리더가 리스를 먼저 포기해야 새 리더가 바로 설 수 있다. 박사논문이 이 점을 짚는다.

## 주의 (비용)

- **안전성이 시간에 걸린다.** 합의 자체는 비동기 모델에서도 안전한데, 리스 읽기는 시계 속도 상한이라는 가정을 추가한다. 가정이 깨지면 박사논문 표현대로 임의로 오래된 정보를 돌려줄 수 있다.
- **리스는 장애 감지 지연을 만든다.** 리더가 죽으면 리스가 끝날 때까지 새 리더가 못 서므로 쓰기 중단 시간이 리스 길이 이상으로 길어진다. 짧게 잡으면 갱신 부담과 오탐이 늘고, 길게 잡으면 복구가 늦다.
- 시계가 **뒤로 가거나 점프**하면(NTP 보정, 윤초) 가정이 깨진다. 단조 시계(monotonic clock)로 재는 것이 기본이다.
- 더 안전한 대안: ReadIndex 방식 하트비트 확인(왕복 1회, 시간 가정 없음), 또는 박사논문이 제안하는 보강으로 읽기 응답에 로그 인덱스를 실어 보내 **클라이언트 단조성**(뒤로 가는 읽기 방지)이라도 지키기.
- 리스가 지키는 것은 "리더가 동시에 둘이 아니다"까지다. 리스로 얻은 권한으로 **외부 자원**에 쓰는 경우에는 여전히 펜싱 토큰 같은 저장소 쪽 검사가 필요하다.
- 리스의 원전(Gray·Cheriton, 1989)은 열람하지 못했다. 이 노트의 리스 설명은 위 네 자료에서 확인한 범위다.
