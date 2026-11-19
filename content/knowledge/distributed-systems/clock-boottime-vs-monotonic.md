---
title: CLOCK_BOOTTIME vs CLOCK_MONOTONIC (서스펜드를 세는 시계와 리스·타임아웃)
aka: [CLOCK_BOOTTIME, CLOCK_MONOTONIC, CLOCK_MONOTONIC_RAW, CLOCK_BOOTTIME_ALARM, Suspend-aware Clock, clock_gettime, timerfd, 서스펜드 인식 시계]
category: distributed-systems
level: advanced
summary: 리눅스의 두 단조 시계는 시스템 서스펜드 시간을 세느냐만 다르다. 남이 재는 약속(리스)에 기대는 쪽은 서스펜드를 세는 BOOTTIME 이 안전하고, 자기 활동을 기준으로 하는 감시 타임아웃은 MONOTONIC 이 기대 동작이라는 점을 man 페이지와 커널·런타임 사례로 정리한다.
tags: [clock, monotonic-clock, boottime, suspend, lease, timeout, linux, time-assumptions]
related: [distributed-systems/raft-lease-read-monotonic-clock, distributed-systems/leader-lease-clock-assumptions, distributed-systems/distributed-lock-fencing-token, distributed-systems/gossip-failure-detection, distributed-systems/cockroachdb-lease-types, distributed-systems/hybrid-logical-clock]
sources:
  - https://man7.org/linux/man-pages/man2/clock_gettime.2.html
  - https://man7.org/linux/man-pages/man2/timerfd_create.2.html
  - https://lkml.iu.edu/hypermail/linux/kernel/1804.3/02810.html
  - https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a3ed0e4393d6885b4af7ce84b437dc696490a530
  - https://github.com/golang/go/issues/24595
  - https://doc.rust-lang.org/std/time/struct.Instant.html
updatedAt: 2026-11-19
---

[Raft 리스 읽기와 단조 시계](/develop-wiki/knowledge/distributed-systems/raft-lease-read-monotonic-clock/) 노트는 벽시계 대신 단조 시계를 쓰면 **점프** 위험이 사라진다는 것을 보였고, 표 한 줄로 `CLOCK_BOOTTIME` 이 서스펜드 시간을 센다고만 적었다. 이 노트는 그 한 줄을 풀어, 리스와 타임아웃을 잴 때 두 단조 시계 중 무엇을 골라야 하는지 다룬다.

## 두 시계의 차이 (Linux man-pages 6.19 기준)

| 시계 | 설정 가능 | 점프(`settimeofday` 등) | 속도 조정(NTP·`adjtime`) | 서스펜드 시간 | 도입 |
| --- | --- | --- | --- | --- | --- |
| `CLOCK_MONOTONIC` | 불가 | 영향 없음 | 영향 받음 | **세지 않음** | (POSIX 필수 시계) |
| `CLOCK_MONOTONIC_RAW` | 불가 | 영향 없음 | 영향 없음(하드웨어 원시 값) | 세지 않음 | Linux 2.6.28 |
| `CLOCK_BOOTTIME` | 불가 | 영향 없음 | MONOTONIC 과 같음 | **셈** | Linux 2.6.39 |
| `CLOCK_BOOTTIME_ALARM` | — | — | — | 셈, 타이머가 서스펜드된 시스템을 깨울 수 있음 | Linux 3.0 |

- man 페이지는 `CLOCK_BOOTTIME` 을 "서스펜드를 아는 단조 시계가 필요하지만 `CLOCK_REALTIME` 의 불연속은 피하고 싶은" 경우를 위한 시계로 설명한다. 차이는 서스펜드 시간 하나다.
- 모든 단조 시계는 연속 호출 값이 거꾸로 가지 않지만 같은 값이 나올 수는 있다.
- `timerfd_create(2)` 는 `CLOCK_BOOTTIME` 을 Linux 3.15 부터, 두 `*_ALARM` 시계를 3.11 부터 받는다. ALARM 시계에 타이머를 걸려면 `CAP_WAKE_ALARM` 권한이 필요하다.

## 문제: 서스펜드 동안 남의 시계는 간다

리스는 두 시계 사이의 약속이다. 리더는 자기 시계로 "아직 리스 안"을 판단하고, 팔로워는 자기 시계로 "그때까지 다른 후보에게 투표하지 않겠다"를 지킨다. 한 노드가 서스펜드되면 다른 노드의 시계는 계속 흐른다.

리스 9초를 받은 리더가 2초 시점에 30초 서스펜드됐다가 깨어나는 경우를 산수로 따라가면 이렇다.

| 리더가 잰 시계 | 깨어난 직후 리더가 보는 경과 | 리더 판단 | 실제(다른 노드 기준) 경과 | 결과 |
| --- | --- | --- | --- | --- |
| `CLOCK_MONOTONIC` / `_RAW` | 2초 | 리스 7초 남음 → 로컬 읽기 | 32초, 새 리더 선출 가능 | **두 리더가 겹친다** |
| `CLOCK_BOOTTIME` | 32초 | 리스 만료 → 읽기 중단 | 32초 | 안전 |

반대로 **팔로워**가 서스펜드되는 경우, MONOTONIC 으로 재면 약속 기간이 실제보다 길어진다(투표를 더 오래 미룬다). 가용성은 나빠지지만 안전 방향이다.

정리하면 "실제 경과 시간을 과소평가하면 위험한 쪽"(리스 보유자, 만료를 근거로 권한을 쓰는 쪽)은 서스펜드를 세는 시계가 맞다.

## 반대 사례: 감시 타임아웃은 서스펜드를 세면 안 된다

Linux 4.17 개발 중 `CLOCK_MONOTONIC` 이 `CLOCK_BOOTTIME` 처럼 서스펜드를 세도록 합치는 변경이 들어갔다가, rc 단계에서 사용자 공간 회귀로 되돌려졌다(2018년 4월 LKML 스레드). 보고된 증상은 재개 직후 화면이 어두워지고 화면 보호기가 켜짐, NetworkManager 의 "네트워크 비활성" 등이다. 재개하자마자 "서스펜드 동안 아무 활동이 없었다"고 판단한 타이머들이 한꺼번에 터진 것이다. 되돌림 커밋 메시지는 systemd 가 `WatchdogSec` 넘게 서스펜드된 뒤 재개 시 데몬을 죽였다고 적고, systemd 가 서스펜드를 세지 않는 `CLOCK_MONOTONIC` 에 기댄다고 밝힌다.

- 유휴·감시·재시도 백오프처럼 **자기 프로세스의 활동량**을 재는 타임아웃은 서스펜드 시간을 빼는 MONOTONIC 이 사용자가 기대하는 동작이다.
- 리스·인증서 만료·캐시 TTL 처럼 **바깥 세계와 맞춘 약속**은 서스펜드를 세야 한다.

## 런타임은 무엇을 쓰나

| 런타임·시스템 | 단조 시간의 출처 | 확인 |
| --- | --- | --- |
| Rust `std::time::Instant` | Linux 에서 `clock_gettime(CLOCK_MONOTONIC)` | 공식 문서 표. 서스펜드를 경과로 세는지는 "명세되지 않았고 플랫폼·버전에 따라 다르다"고 명시 |
| Go 런타임 | `CLOCK_MONOTONIC` 으로 보인다. BOOTTIME 으로 바꾸자는 이슈 #24595 는 논의 끝에 철회(2019-12) | 이슈 제목·결론에서 추론, 런타임 소스는 읽지 않음 |
| TiKV 리스 | `CLOCK_MONOTONIC_RAW` | [이전 노트](/develop-wiki/knowledge/distributed-systems/raft-lease-read-monotonic-clock/)에서 소스 확인 |

언어 표준 라이브러리의 "단조 시간"을 그대로 쓰면 리눅스에서는 대개 서스펜드를 세지 않는다. 리스 만료를 판단하는 코드에서 BOOTTIME 이 필요하면 직접 `clock_gettime(CLOCK_BOOTTIME)` 을 불러야 한다.

```ts
// 시계를 주입받는 리스. 서스펜드가 있을 수 있는 환경이면 now 는 BOOTTIME 기반으로 넘긴다.
type Clock = () => number; // ms, 단조
export class Lease {
  constructor(private now: Clock, private expiresAt = 0) {}
  renew(sentAt: number, durationMs: number, marginMs: number) {
    this.expiresAt = sentAt + durationMs - marginMs; // 요청을 보낸 시각부터 잰다
  }
  valid(): boolean { return this.now() < this.expiresAt; }
}
```

## 언제 쓰나

- 노트북·엣지 장비·모바일처럼 **시스템 서스펜드가 실제로 일어나는** 곳에서 리스·락·토큰 만료를 판단하는 코드.
- 리스 기반 읽기를 직접 구현할 때, 리스 보유자 쪽은 BOOTTIME, 감시·유휴 타이머는 MONOTONIC 으로 **목적별로 나눠** 고른다.

## 주의 (비용)

- **BOOTTIME 은 서스펜드만 센다.** 프로세스 정지(GC, `SIGSTOP`), 스케줄링 지연, 확인 직후의 정지는 어느 시계도 못 막는다. 이전 노트의 실험대로 확인과 응답 사이의 정지는 남는다. 외부 자원에는 [펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/)이 여전히 필요하다.
- **가상화는 별개 문제다.** VM 일시 정지·라이브 마이그레이션 때 게스트 커널이 그 시간을 서스펜드로 인식하는지는 하이퍼바이저·클록소스에 달려 있고, 이 노트는 확인하지 못했다.
- BOOTTIME 은 속도 조정 측면에서 MONOTONIC 과 같아 NTP 의 slew 를 받는다. 속도 상한 가정은 그대로다.
- 이식성: `CLOCK_BOOTTIME` 은 리눅스 전용 이름이다. 다른 OS 의 대응 시계와 의미는 이 노트에서 확인하지 않았다(Rust 문서는 macOS 에서 `CLOCK_UPTIME_RAW` 를 쓴다고만 밝힌다).
- `*_ALARM` 타이머는 시스템을 깨우므로 전력 비용이 있고 권한이 필요하다. 리스 만료 판정에는 읽기 시계로 충분하다.

> 출처 확인 범위: man7.org 의 clock_gettime(2)(man-pages 6.19, 2026-03-07)와 timerfd_create(2)를 읽었다. 4.17 회귀는 LKML 답장 한 통(증상)과 되돌림 커밋 a3ed0e4393d6(2018-04-25)의 메시지 원문(systemd WatchdogSec 등 회귀 목록)을 읽었다. Go 이슈 #24595 는 제목·결론, Rust `Instant` 는 공식 문서의 플랫폼 표와 서스펜드 문구를 읽었다. 서스펜드 시나리오 표는 산수이며 리눅스에서 실제로 서스펜드를 걸어 재지 않았다(작업 환경이 macOS). Node.js·JVM 의 단조 시계 출처는 확인하지 않았다.
