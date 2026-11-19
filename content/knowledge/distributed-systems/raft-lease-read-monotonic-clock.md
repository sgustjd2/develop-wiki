---
title: Raft 리스 읽기와 단조 시계 (etcd/raft 틱 vs TiKV 단조 시계, 시계 실험)
aka: [Raft Lease Read Clock Source, CLOCK_MONOTONIC_RAW, Monotonic Clock Lease, ReadOnlyLeaseBased, TiKV Leader Lease, Suspect Lease, 리스 읽기 시계 선택, 단조 시계]
category: distributed-systems
level: advanced
summary: 리스 읽기가 "어떤 시계로 얼마를 재는가"에 따라 갈리는 안전성을 etcd/raft(틱 기반)와 TiKV(단조 시계·리스 상태 3종) 코드로 비교하고, 시계 점프·속도 위반·정지를 모형과 실행으로 나눠 본다.
tags: [raft, lease-read, monotonic-clock, clock-drift, tikv, etcd, linearizable-reads, time-assumptions]
related: [distributed-systems/leader-lease-clock-assumptions, distributed-systems/raft-prevote-checkquorum-lease-interplay, distributed-systems/raft-read-index, distributed-systems/raft-consensus, distributed-systems/hybrid-logical-clock, distributed-systems/distributed-lock-fencing-token, distributed-systems/cockroachdb-uncertainty-interval-read-summary, distributed-systems/spanner-truetime]
sources:
  - https://github.com/etcd-io/raft/blob/main/raft.go
  - https://github.com/tikv/tikv/blob/master/components/raftstore/src/store/util.rs
  - https://github.com/tikv/tikv/blob/master/components/raftstore/src/store/config.rs
  - https://github.com/tikv/tikv/blob/master/components/tikv_util/src/time.rs
  - https://man7.org/linux/man-pages/man2/clock_gettime.2.html
updatedAt: 2026-11-19
---

[리더 리스와 시계 가정](/develop-wiki/knowledge/distributed-systems/leader-lease-clock-assumptions/) 노트는 "리스는 시계 속도 상한 가정에 기댄다"를 수식과 표로 보였다. 이 노트는 한 걸음 더 구현으로 내려간다. **어느 시계를 쓰는가**(벽시계·단조 시계·틱)와 **어느 순간부터 재는가**(보낸 시각·받은 시각)가 실제 코드에서 어떻게 정해지고, 어떤 사고를 막고 어떤 사고는 못 막는지다.

## 문제

리스 읽기의 안전 조건은 두 가지 시간 약속이 겹치지 않는 것이다. 리더는 "내 시계로 아직 리스 안"이라고 믿고 로컬 읽기를 하고, 팔로워는 "내 시계로 아직 투표하지 않겠다"고 약속한다. 이 두 "내 시계"가 어떤 시계냐에 따라 깨지는 방식이 달라진다.

- **벽시계**(실시간 시계)는 NTP·관리자 조작으로 앞뒤로 **점프**한다.
- **단조 시계**는 점프하지 않지만 속도는 어긋나고, 정지(일시 중단)를 알 수 없다. OS 에 따라 서스펜드 구간을 세지 않을 수도 있다.
- 어떤 시계든 읽은 뒤 응답하기까지 프로세스가 멈추면 소용없다.

## 해법: 구현이 고른 시계

### etcd/raft: 시계가 없고 틱만 있다

`etcd-io/raft` 의 `raft.go` 는 시간 패키지를 가져다 쓰지 않는다. 시간은 애플리케이션이 부르는 `Tick()` 이 올리는 카운터(`electionElapsed`, `heartbeatElapsed`)로만 흐른다. 따라서 "리스"는 별도 만료 시각이 아니라 **CheckQuorum 이 만든 암묵적 약속**이다. 설정 검증 코드는 `ReadOnlyLeaseBased` 이면 `CheckQuorum` 이 반드시 켜져 있어야 한다고 강제하고, 옵션 주석은 시계 드리프트가 무한정이면 리더가 리스를 필요 이상으로 오래 쥘 수 있다고 경고한다. 리스 모드에서 `MsgReadIndex` 는 하트비트 왕복 없이 현재 커밋 인덱스로 즉시 응답한다. 기본값인 `ReadOnlySafe` 는 과반 하트비트를 거친다.

이 구조의 의미는 이렇다. 안전성이 "틱을 얼마나 정확히 주는가"로 옮겨 간다. 예를 들어 리더 쪽 틱 타이머가 GC·스케줄링 지연으로 늦게 돌면 리더의 틱 카운터는 실제 경과보다 느리게 가서 리스를 더 오래 믿게 된다(내 추론이며 코드에서 실험하지는 않았다). 틱 지연의 상한을 라이브러리가 보장하지 않는다. **시계 선택을 라이브러리가 호스트에 떠넘긴 설계**다.

### TiKV: 단조 시계와 리스 상태 3종

`components/raftstore/src/store/util.rs` 의 `Lease` 는 만료 시각을 명시적으로 들고 있다.

- 상태는 `Valid`(만료 시각 전), `Expired`, `Suspect`(리더 이전 절차 중이라 리스가 유효한지 모름) 세 가지다. 리더가 `MsgTimeoutNow` 를 보내 이양을 시작하면 `suspect` 로 바뀌어 **로컬 읽기를 멈춘다.** 새 리더가 이미 뽑혔는데 옛 리더가 못 알아챌 수 있기 때문이라는 주석이 있다.
- 만료 시각은 `send_ts + max_lease` 다. 주석 식으로는 `lease = max_lease − (commit_ts − send_ts)`, 만료 `= commit_ts + lease`. **요청을 보낸 시각**부터 재므로 전송·합의 지연은 리스를 줄이는 쪽으로만 작용한다. 앞 노트의 "리더는 보낸 시점부터 잰다"와 같은 규칙이다.
- 현재 시각은 `monotonic_raw_now()` 다. Linux 에서는 `CLOCK_MONOTONIC_RAW`, 그 밖의 OS 에서는 프로세스 로컬 단조 시계로 대체되며 소스 주석이 macOS·Windows 용 raw 단조 시계 구현이 아직 없다고 밝힌다.
- 설정은 선거 타임아웃과 묶인다. 기본값은 `raft_store_max_leader_lease` 9초, 틱 1초 × 선거 10틱 = 10초이고, 검증 코드는 리스가 `선거 타임아웃 − 1틱` 을 넘으면 설정 오류로 거부한다. 선거 타임아웃 안쪽에 여유를 두는 것이 시계 속도 오차의 안전 마진 구실을 한다.

Linux `clock_gettime(2)` 문서가 말하는 시계 성질은 다음과 같다. 선택 근거로 중요한 것만 적는다.

| 시계 | 시간 점프 | 속도 조정(slew) | 서스펜드 시간 |
| --- | --- | --- | --- |
| `CLOCK_REALTIME` | 영향 받음(벽시계) | 영향 받음 | 벽시계 값을 따름 |
| `CLOCK_MONOTONIC` | 영향 없음 | **영향 받음** | 세지 않음 |
| `CLOCK_MONOTONIC_RAW` | 영향 없음 | 영향 없음 | 세지 않음 |
| `CLOCK_BOOTTIME` | 영향 없음 | 영향 받음 | **셈** |

모든 단조 변형은 연속 호출 값이 거꾸로 가지 않는다고 보장하지만, 구조에 따라 같은 값이 연속으로 나올 수 있다고 문서에 적혀 있다. TiKV 가 `MONOTONIC_RAW` 를 고르는 이유를 소스에서 직접 확인하지는 못했다. 위 표로 보면 NTP 의 속도 조정에 흔들리지 않는 시계라는 점이 후보 이유일 수 있다(추정).

## 직접 돌려 본 것

### 1) 실제 시계 (이 작업 환경, macOS, Node 24)

- `process.hrtime.bigint()` 를 500만 번 연속 읽어 **거꾸로 간 경우 0건**, 직전과 같은 값이 나온 경우 약 309만 건이었다. 단조 시계는 "정확히 증가"가 아니라 "비감소"라서, 시각을 키로 쓰거나 "엄격히 더 크다"에 기대는 코드는 깨진다.
- 3초 대기 동안 `Date.now()` 는 3001ms, 단조 시계는 3000.36ms 로 점프가 없는 구간에서는 두 시계가 일치했다. 즉 평상시 테스트로는 시계 선택의 차이를 **볼 수 없다.**
- 리스 100ms 짜리를 만들고 90ms 지점에서 유효를 확인한 뒤 프로세스를 200ms 멈췄다가 응답했다. 응답은 확인 시각 91.5ms 에서 계산했지만 실제로는 만료 191.5ms 뒤에 나갔고, 그 시점의 유효성 검사는 이미 false 였다. **단조 시계를 써도 확인과 응답 사이의 정지는 못 막는다.** 확인을 응답 직전에 하고, 정지 시간이 길 수 있는 런타임에서는 리스를 줄이는 것 외에 방법이 없다.

### 2) 리스 겹침 모형

리더는 보낸 시각부터 `L(1−ε)` 를 믿고, 팔로워는 받은 시각부터 `L` 동안 투표를 약속한다(L=1000ms, ε=1% 는 **두 시계 사이의 상대 속도 차이 상한**). 전송 지연은 0~50ms. 두 노드의 시계를 속도 ±0.5% 로 뽑고, 시계 종류에 따라 다음을 더했다. 각 20만 번, 겹침 구간이 양수면 위험(두 리더가 동시에 읽기를 믿을 수 있음)으로 센다.

| 시나리오 | 벽시계 위험 비율 / 평균 겹침 | 단조 시계 위험 비율 / 평균 겹침 |
| --- | --- | --- |
| A. 속도 차이 상한 준수, 점프 없음 | 0% | 0% |
| B. A + 5% 확률로 각 노드가 리스 중 ≤500ms 점프 | 4.46% / 216ms (최대 915ms) | 0% |
| C. 속도 상한 위반(노드의 5% 가 최대 4% 어긋남), 점프 없음 | 3.00% / 10.9ms | 3.10% / 10.8ms |
| D. B + C | 7.11% / 138.8ms | 3.10% / 10.8ms |

- 단조 시계는 **점프 계열 위험을 통째로 없앤다**(B). 반대로 속도 상한을 어기는 노드(C)는 어떤 시계로도 못 막는다. 상한 위반은 시계 종류가 아니라 하드웨어·가상화·운영의 문제다.
- 위 숫자는 내가 정한 확률·점프 크기를 넣은 모형의 값으로, 실제 사고 빈도가 아니다. 시나리오 구조(점프 위험은 벽시계에만 있고 속도 위반은 공통)가 요점이다. 앞 노트의 수식과 같은 부등식을 쓴다. 모형을 처음 짤 때 노드별 속도를 ±ε 로 뽑았더니 "상한 준수" 시나리오에서도 0.8% 가 겹쳤다. ε 는 **두 시계 사이의 상대 차이** 상한이므로 노드별로는 ±ε/2 로 뽑아야 하고, 한쪽 시계 기준으로 마진을 잡으면 모자란다는 뜻이다. 위 표는 고친 뒤의 결과다.

## 언제 쓰나

- 리스 읽기를 직접 구현하거나 `ReadOnlyLeaseBased` 를 켜기 전에, **시계 소스·시작 기준(보낸 시각)·만료 직전 처리**를 점검하는 체크리스트로.
- 리더 이양과 리스를 함께 쓸 때(TiKV 의 `Suspect` 처럼) 이양 중에는 로컬 읽기를 끊는 규칙.
- 리스를 쓰는 시스템의 장애 보고서를 읽을 때 "시계 점프", "속도 상한 위반", "정지" 중 어느 것인지 구분하는 틀.

## 주의 (비용)

- **단조 시계는 정지와 속도 위반을 못 막는다.** 점프만 막는다. 서스펜드·VM 일시 중지·라이브 마이그레이션 동안 `MONOTONIC` 계열은 시간이 가지 않은 것처럼 보일 수 있다(리눅스 문서: 서스펜드 구간을 세지 않음). 가상화 환경에서의 실제 동작은 확인하지 못했다.
- 이식성이 낮다. TiKV 소스는 macOS·Windows 에서 raw 단조 시계를 구현하지 않았다고 주석으로 밝히며 대체 구현을 쓴다. 개발 환경과 운영 환경의 시계 의미가 다를 수 있다.
- 틱 기반(etcd/raft)은 구현이 단순하지만, 틱 주기를 만드는 타이머의 정확도가 곧 안전성이다. 리스 읽기는 기본값이 아니라 선택지이며, 라이브러리 기본 `ReadOnlySafe`(과반 확인)는 시간 가정이 없다. 시계 점검 비용이 부담스러우면 [ReadIndex](/develop-wiki/knowledge/distributed-systems/raft-read-index/)가 기본 선택이다.
- 리스 길이는 장애 감지 시간과 맞바꾼다. 선거 타임아웃에 가깝게 잡을수록 로컬 읽기 비율은 오르고 시계 오차 여유는 줄어든다. TiKV 가 `타임아웃 − 1틱` 을 상한으로 강제하는 이유다.
- 리스로 얻은 권한으로 외부 자원을 건드린다면 [펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/)이 여전히 필요하다. Pre-Vote·CheckQuorum 과의 상호작용은 [해당 노트](/develop-wiki/knowledge/distributed-systems/raft-prevote-checkquorum-lease-interplay/)에 있다.

> 출처 확인 범위: etcd-io/raft main(커밋 99f9ffb)의 `raft.go` 에서 ReadOnlyOption 주석, CheckQuorum 필수 검증, `tickHeartbeat`, `ReadOnlyLeaseBased` 분기와 시간 패키지 미사용을 직접 확인했다. TiKV master(커밋 4d5e1a0)의 `store/util.rs` 의 `Lease`·`LeaseState`·`inspect`·`renew`·`suspect`, `store/config.rs` 의 기본값·검증, `tikv_util/src/time.rs` 의 `monotonic_raw_now` 구현을 읽었다. 리눅스 시계 성질은 man7 의 clock_gettime(2) 에서 읽었다(실행해 검증하지는 않음). 실행 실험은 macOS 의 Node 에서만 했고, Linux 단조 시계의 서스펜드·NTP 상호작용, 가상화 환경, Go·Rust 런타임 시계 구현은 확인하지 못했다. Raft 박사논문 6.4.1 은 이 노트 작성 중에 다시 읽지 않았다(이전 노트 기준).
