---
title: VM 일시 정지·라이브 마이그레이션과 게스트 시계 (kvmclock · BOOTTIME · chrony)
aka: [VM Pause Clock, Live Migration Clock, kvmclock, KVM_GET_CLOCK, KVM_SET_CLOCK, KVM_KVMCLOCK_CTRL, PVCLOCK_GUEST_STOPPED, guest-set-time, makestep, maxslewrate, 게스트 시계, 가상머신 시계]
category: distributed-systems
level: advanced
summary: QEMU/KVM 은 VM 정지 때 kvmclock 값을 저장했다 재개 때 되돌려, 게스트의 MONOTONIC·BOOTTIME 이 정지 시간을 세지 않는다. 서스펜드와 달리 BOOTTIME 도 리스를 지키지 못하고, 벽시계 오차는 chrony 의 계단·slew 보정이 따로 메운다.
tags: [clock, virtualization, kvm, qemu, kvmclock, live-migration, chrony, ntp, lease, time-assumptions]
related: [distributed-systems/clock-boottime-vs-monotonic, distributed-systems/raft-lease-read-monotonic-clock, distributed-systems/leader-lease-clock-assumptions, distributed-systems/distributed-lock-fencing-token, distributed-systems/cockroachdb-leader-leases-liveness-fabric, distributed-systems/hybrid-logical-clock, distributed-systems/spanner-truetime]
sources:
  - https://gitlab.com/qemu-project/qemu/-/blob/master/hw/i386/kvm/clock.c
  - https://docs.kernel.org/virt/kvm/api.html
  - https://gitlab.com/qemu-project/qemu/-/blob/master/qga/qapi-schema.json
  - https://man7.org/linux/man-pages/man2/clock_gettime.2.html
  - https://chrony-project.org/doc/latest/chrony.conf.html
  - https://chrony-project.org/faq.html
updatedAt: 2026-11-19
---

[CLOCK_BOOTTIME vs CLOCK_MONOTONIC](/develop-wiki/knowledge/distributed-systems/clock-boottime-vs-monotonic/) 노트는 "리스 보유자는 서스펜드를 세는 BOOTTIME 을 써라"로 끝나면서, VM 일시 정지·라이브 마이그레이션은 확인하지 못했다고 남겼다. 이 노트는 그 빈칸을 QEMU/KVM(x86, kvmclock) 기준으로 채운다.

## 문제

- 클라우드·온프레미스 VM 은 호스트 쪽 사정으로 멈춘다. 관리자의 일시 정지, 스냅숏, 라이브 마이그레이션의 최종 정지 구간(downtime) 등이다.
- 게스트 OS 는 스스로 서스펜드에 들어간 것이 아니다. 커널이 "잠들었다 깼다"는 사건을 겪지 않는다.
- 이때 게스트의 단조 시계가 정지 시간을 세는지, 벽시계는 어떻게 되는지, 그 뒤 NTP 가 무엇을 하는지에 따라 리스·타임아웃의 안전성이 갈린다.

## 소스로 본 동작

### 1. QEMU: 멈출 때 kvmclock 을 저장, 재개 때 그대로 복원

`hw/i386/kvm/clock.c` 의 `kvmclock_vm_state_change`:

- VM 이 **멈출 때**: TSC 를 동기화하고 `KVM_GET_CLOCK` 으로 kvmclock 값을 읽어 저장한다. 멈춘 동안 다시 읽지 않도록 "값 유효" 표시를 한다.
- VM 이 **재개될 때**: 저장한 값을 `KVM_SET_CLOCK` 으로 되돌린다. 플래그 없이 부르므로, 커널 문서가 설명하는 `KVM_CLOCK_REALTIME`(호스트 실시간 경과를 더하는 옵션)은 쓰지 않는다. 결과적으로 **게스트 kvmclock 은 정지 구간을 건너뛴 것처럼 이어진다.**
- 재개 후 각 vCPU 에 `KVM_KVMCLOCK_CTRL` 을 호출한다. 커널 문서에 따르면 이것은 pvclock 구조의 플래그를 세워 **게스트의 soft lockup 감시기**가 "vCPU 가 멈췄었다"는 것을 알게 할 뿐이다. 시간 값을 고치지 않는다.

### 2. 라이브 마이그레이션: 차이를 줄이지만 0 은 아니다

`kvmclock_pre_save` 주석: 실행 중 게스트를 옮길 때 `vm_stop()` 직후가 아니라 상태 저장 직전에 다시 시계를 읽는다. 마지막 메모리 페이지를 보내는 시간(최대 downtime)만큼은 게스트 시계가 흐르게 한 것이다. 주석은 이로써 `max_downtime` 이 5초일 때 kvmclock 차이가 **5초에서 0.1초로** 준다고 적는다. 남은 구간(상태 전송·목적지 재개)은 여전히 게스트가 세지 않는다.

### 3. 게스트 시계별 결과 (이 노트의 추론)

kvmclock 이 클록소스인 리눅스 게스트에서, 위 동작으로부터 다음이 따라온다. 실측하지는 않았다.

| 게스트 시계 | 정지 30초 후 재개 직후 |
| --- | --- |
| `CLOCK_MONOTONIC` | 정지 시간을 세지 않음(30초 뒤처짐) |
| `CLOCK_BOOTTIME` | **마찬가지로 세지 않음.** 게스트가 서스펜드에 들어간 적이 없어 서스펜드 보정이 없다 |
| `CLOCK_REALTIME` | 30초 뒤처짐. NTP 가 고칠 때까지 유지 |
| 다른 노드(호스트 기준) | 30초 흐름 |

QEMU 게스트 에이전트 스키마의 `guest-set-time` 설명도 같은 사실을 전제한다. 게스트가 일시 정지되거나 파일로 저장 후 다시 불러오면 **게스트 OS 는 큰 시간 공백을 모른다**고 적고, NTP 가 다시 맞추지 못할 수 있으니 이 명령으로 시스템 시간과 RTC 를 설정하라고 안내한다.

## 리스에 미치는 영향

직접 실행한 모형(`vm-pause.mjs`, 위 동작을 그대로 옮긴 산수):

- 리스 9초를 받은 리더가 2초 시점에 30초 정지 → 재개 직후 게스트 단조 시계는 2초 경과로 보고 "7초 남음"이라 판단한다. 실제로는 23초 전에 만료됐다.
- 서스펜드였다면 BOOTTIME 이 32초를 보여 줬을 것이다. **VM 정지에서는 BOOTTIME 도 같은 실수를 한다.**

정리하면 VM 정지는 시계 관점에서 [GC 정지나 SIGSTOP](/develop-wiki/knowledge/distributed-systems/raft-lease-read-monotonic-clock/) 과 같은 부류다. 프로세스(여기서는 OS 전체)가 시간을 못 느낀 채 멈췄다 깨어난다. 대응도 같다.

- 리스 판단 직후의 정지는 어느 시계로도 못 막으므로, 외부 자원에는 [펜싱 토큰](/develop-wiki/knowledge/distributed-systems/distributed-lock-fencing-token/)을 둔다.
- 리스 유효 기간을 "요청을 보낸 시각"부터 재고 안전 여유를 둔다. 여유가 정지 시간보다 짧으면 의미가 없다는 것을 인정한다.
- 정지를 알릴 수단이 있다면(게스트 에이전트, 클라우드 유지보수 이벤트 알림 등) 정지 전에 리더십을 내려놓는다. 클라우드별 알림 방식은 확인하지 않았다.

## 재개 후 NTP 보정이 단조 시계를 흔든다

벽시계가 30초 뒤처진 채 깨어나면 chrony 는 둘 중 하나를 한다.

| 방식 | 조건(chrony 문서) | 단조 시계에 미치는 영향 |
| --- | --- | --- |
| 계단(step) | `makestep 임계값 한도` 의 한도 횟수 안일 때만. 문서는 보통 부팅 직후 몇 번만 허용하라고 권한다 | MONOTONIC 영향 없음(점프는 REALTIME 만) |
| slew | 그 밖의 경우 | MONOTONIC·BOOTTIME 도 빨라지거나 느려진다(man 페이지: NTP 의 점진 조정을 받음). RAW 는 영향 없음 |

- chrony 의 기본 최대 slew 속도는 83333.333ppm(1/12)이다. 30초를 메우려면 최소 360초가 걸리고, 그동안 게스트 MONOTONIC 은 최대 약 8.3% 빠르게 흐른다(직접 계산). 이때 9초를 잰 타이머의 실제 경과는 약 8.31초다.
- 빨리 흐르는 단조 시계는 리스 **보유자**에게는 안전 방향(일찍 만료)이지만, "그때까지 투표하지 않겠다"고 약속한 **팔로워·지지자**에게는 위험 방향이다. 약속을 일찍 끝낸다.
- chrony FAQ 는 RTC 가 없거나 잘못된 시간으로 재개되는 VM 이면 `makestep 1 -1` 처럼 **모든 갱신에서 계단 보정을 허용**하는 것이 필요할 수 있다고 적는다. 그러면 slew 기간이 사라지는 대신 REALTIME 이 점프한다.

## 언제 쓰나

- VM 위에서 리스·리더 선출·분산 락을 운영할 때 "정지 시간"을 위험 모형에 넣기 위해.
- 장애 분석에서 재개 직후 이중 리더·오래된 읽기·감시 타이머 폭주가 보이면, 하이퍼바이저 이벤트(정지·마이그레이션)와 chrony 로그(step/slew)를 함께 맞춰 볼 때.
- chrony 설정(`makestep` 한도, `maxslewrate`)을 정할 때. 벽시계 점프를 견디는 소프트웨어인지, 단조 시계 속도 변화를 견디는 소프트웨어인지에 따라 고른다.

## 주의 (비용)

- **범위가 좁다.** QEMU 의 kvmclock 장치와 x86 KVM 만 읽었다. 게스트가 TSC 를 클록소스로 쓰는 경우, Hyper-V·VMware·Xen·Firecracker, 클라우드별 라이브 마이그레이션 구현은 다를 수 있다.
- `KVM_CLOCK_REALTIME` 같은 커널 기능이 있으므로, 다른 VMM 이 정지 시간을 kvmclock 에 더하도록 구현할 수 있다. 그 경우 반대로 게스트 단조 시계가 재개 순간 크게 점프한다. 어느 쪽이든 "정지 동안 아무 일도 없었다"는 가정은 깨진다.
- 게스트 에이전트로 `guest-set-time` 을 부르면 REALTIME 이 점프한다. 벽시계로 타임아웃을 재는 코드는 그 순간 대량 만료를 겪을 수 있다.
- slew 계산은 상한(최대 속도로 계속 보정)을 가정한 산수다. 실제 chrony 는 오프셋·측정 상황에 따라 더 천천히 보정할 수 있다.

> 검증 범위: QEMU master 의 `hw/i386/kvm/clock.c`(상태 변경 처리, `pre_save` 주석의 5초→0.1초 수치)와 `qga/qapi-schema.json` 의 `guest-set-time` 설명, 리눅스 커널 KVM API 문서의 `KVM_GET_CLOCK`·`KVM_SET_CLOCK`(플래그 포함)·`KVM_KVMCLOCK_CTRL` 절, chrony 최신 문서의 `makestep`·`maxslewrate`(기본값)와 FAQ 의 VM 재개 항목을 읽었다(2026-11-19). 게스트 시계별 결과 표는 소스에서 추론한 것이며 실제 VM 을 정지시켜 재지 않았다(작업 환경 macOS). 리스·slew 수치는 Node 로 직접 계산했다(스크래치 `dist/vm-pause.mjs`). 미확인: 게스트 커널의 kvmclock 클록소스 코드, TSC 클록소스 게스트의 동작, 클라우드(AWS·GCP·Azure) 라이브 마이그레이션과 유지보수 알림, systemd-timesyncd·ntpd 의 동작.
