---
title: 컨테이너의 원리 (namespace·cgroup)
aka: [Container Internals, Linux Namespaces, cgroups, cgroup v2, Container Isolation]
category: cs-fundamentals
group: os
level: intermediate
summary: 컨테이너는 가상 머신이 아니라 namespace 로 "보이는 것"을 나누고 cgroup 으로 "쓸 수 있는 양"을 제한한 일반 프로세스다. 격리 수준과 자원 제한의 한계를 이해하는 바탕.
tags: [os, container, docker, kubernetes, namespace, cgroup, linux]
related: [cs-fundamentals/process-thread, cs-fundamentals/cpu-scheduling, cs-fundamentals/virtual-memory]
sources:
  - https://man7.org/linux/man-pages/man7/namespaces.7.html
  - https://man7.org/linux/man-pages/man7/cgroups.7.html
  - https://docs.kernel.org/admin-guide/cgroup-v2.html
  - https://docs.docker.com/engine/containers/resource_constraints/
updatedAt: 2026-11-18
---

## 핵심

```
          가상 머신                          컨테이너
┌──────────────────────────┐   ┌──────────────────────────────┐
│ 앱 │ 앱                   │   │ 앱(프로세스) │ 앱(프로세스)     │
│ 게스트 커널 │ 게스트 커널   │   │  namespace 로 시야 제한          │
│ 하이퍼바이저               │   │  cgroup 으로 자원 제한           │
│ 호스트 하드웨어            │   │ ── 호스트 커널 1개를 공유 ──      │
└──────────────────────────┘   └──────────────────────────────┘
```

컨테이너 = **namespace**(격리된 시야) + **cgroup**(자원 한도) + 루트 파일 시스템(이미지 레이어) + 보안 장치(capabilities 축소, seccomp, LSM).

## namespace: 무엇을 나누나 (namespaces(7))

| namespace | 플래그 | 격리 대상 | 컨테이너에서 보이는 효과 |
| --- | --- | --- | --- |
| PID | `CLONE_NEWPID` | 프로세스 ID | 컨테이너의 첫 프로세스가 PID 1 |
| Mount | `CLONE_NEWNS` | 마운트 지점 | 자기 루트 파일 시스템만 보임 |
| Network | `CLONE_NEWNET` | 네트워크 장치·스택·포트 | 자기 `eth0`, 자기 포트 80 |
| UTS | `CLONE_NEWUTS` | 호스트명 | 컨테이너별 hostname |
| IPC | `CLONE_NEWIPC` | System V IPC, POSIX 메시지 큐 | 공유 메모리 분리 |
| User | `CLONE_NEWUSER` | UID/GID | 안에서는 root, 밖에서는 일반 사용자(rootless) |
| Cgroup | `CLONE_NEWCGROUP` | cgroup 루트 보기 | 자기 cgroup 이 루트처럼 보임 |
| Time | `CLONE_NEWTIME` | boot·monotonic 시계 | 체크포인트/복원용 |

```shell
# 직접 체험: 새 PID·마운트·UTS namespace 에서 셸 실행 (root 필요)
sudo unshare --pid --fork --mount-proc --uts bash
hostname demo && ps aux   # 프로세스가 몇 개 안 보이고 bash 가 PID 1
```

## cgroup: 얼마나 쓰나

cgroup v2 는 하나의 통합 계층에서 컨트롤러(cpu, memory, io, pids, cpuset …)를 켠다(cgroups(7)). v1 은 컨트롤러마다 계층이 달랐다.

| 파일 (v2) | 의미 | 넘으면 |
| --- | --- | --- |
| `memory.max` | 하드 한도 | 회수 실패 시 cgroup 안에서 **OOM killer** |
| `memory.high` | 스로틀 한도 | 회수 압박·지연, OOM 은 안 함 |
| `cpu.max` | `$MAX $PERIOD` 대역폭 | 주기 남은 시간 동안 **스로틀링** |
| `cpu.weight` | 경쟁 시 비율(기본 100) | 제한 아님, 몫만 조정 |
| `pids.max` | 프로세스·스레드 수 | fork 실패 (fork bomb 방지) |

Docker 의 `--memory`, `--cpus` 와 쿠버네티스의 `resources.limits` 가 결국 이 파일들로 내려간다. Docker 문서는 한도 없이 호스트 메모리가 바닥나면 커널 OOM 이 Docker 데몬을 포함한 아무 프로세스나 죽일 수 있다고 경고한다.

## 개발자에게 왜 중요한가

- **PID 1 문제**: 컨테이너의 첫 프로세스는 PID 1 이라 기본 시그널 처리가 다르고 좀비 프로세스를 거둬야 한다. `node app.js` 를 직접 PID 1 로 두면 `SIGTERM` 핸들러가 없을 때 종료가 늦어질 수 있다 → 핸들러를 달거나 `tini` 같은 init 을 쓴다.
- **런타임이 한도를 알아야 한다**: JVM·Go·Node 가 힙 크기·스레드 수를 호스트 사양으로 잡으면 OOMKilled·스로틀링이 난다. 최신 런타임은 cgroup 을 읽지만 버전별로 다르므로 확인한다.
- **"컨테이너니까 안전"하지 않다**: 커널을 공유하므로 커널 취약점 하나가 탈출로 이어질 수 있다. 신뢰할 수 없는 코드는 gVisor·Kata·Firecracker 같은 더 강한 격리를 쓴다.

## 언제 쓰나

- 배포 단위 표준화, 같은 호스트에서 여러 서비스의 자원 분리, 빠른 시작이 필요할 때.
- 강한 보안 경계(멀티테넌트 사용자 코드 실행)가 필요하면 VM 이나 샌드박스 런타임과 조합한다.

## 주의 (비용)

- `/proc/meminfo`·`nproc` 는 namespace 로 가려지지 않아 호스트 값을 보여 줄 수 있다. 한도는 `/sys/fs/cgroup/` 에서 읽는다.
- 메모리 한도에는 페이지 캐시도 포함된다. 파일을 많이 읽는 앱은 캐시 때문에 한도에 가까워 보일 수 있다(회수 가능한 부분은 OOM 전에 회수됨).
- 루트로 도는 컨테이너 + 호스트 경로 마운트 + 넓은 capabilities 는 사실상 호스트 root 다. 최소 권한으로 시작한다.
