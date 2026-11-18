---
title: 가상 메모리와 페이징
aka: [Virtual Memory, Paging, Page Table, TLB, Page Fault, Swap, Huge Pages, OOM Killer]
category: cs-fundamentals
group: os
level: intermediate
summary: 프로세스마다 독립된 가상 주소 공간을 주고, 페이지 단위로 물리 메모리에 매핑하는 OS 기법. RSS·OOM·페이지 폴트·TLB 미스를 이해하는 바탕.
tags: [os, memory, paging, tlb, page-fault, oom, linux]
related: [cs-fundamentals/process-thread, cs-fundamentals/cpu-cache-locality, cs-fundamentals/container-internals, cs-fundamentals/garbage-collection]
sources:
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
  - https://docs.kernel.org/admin-guide/mm/transhuge.html
  - https://docs.kernel.org/admin-guide/cgroup-v2.html
updatedAt: 2026-11-18
---

## 문제

여러 프로그램이 같은 물리 메모리를 쓰면 서로의 데이터를 덮어쓸 수 있고, 각 프로그램이 "내 코드는 0x400000 에서 시작한다" 같은 가정을 할 수 없다. 물리 메모리보다 큰 데이터를 다루기도 어렵다.

## 해법: 주소 변환

각 프로세스는 자기만의 **가상 주소 공간**을 본다. CPU 의 MMU 가 접근할 때마다 가상 주소를 물리 주소로 바꾼다.

```
가상 주소 (x86-64, 4KiB 페이지)
┌──────────── 가상 페이지 번호(VPN) ────────────┬─ 오프셋(12bit) ─┐
                     │
                     ▼  TLB 조회 → 미스면 페이지 테이블(다단계) 탐색
              물리 프레임 번호(PFN) + 같은 오프셋 = 물리 주소
```

| 용어 | 뜻 |
| --- | --- |
| 페이지 | 가상 메모리를 나누는 고정 크기 블록 (보통 4KiB) |
| 페이지 테이블 | VPN → PFN 매핑 + 권한 비트(읽기/쓰기/실행), 존재 비트 |
| TLB | 최근 변환 결과를 담는 CPU 내부 캐시. 미스가 나면 테이블을 걸어야 해 느림 |
| 페이지 폴트 | 매핑이 없거나 권한 위반. 커널이 처리(페이지 할당, 디스크에서 읽기, 또는 SIGSEGV) |
| 스왑 | 덜 쓰는 페이지를 디스크로 내보내 물리 메모리를 확보 |

OSTEP 은 이 과정을 "주소 변환 → 세그멘테이션 → 페이징 → TLB → 다단계 페이지 테이블 → 스왑" 순으로 쌓아 올린다.

## 개발자에게 왜 중요한가

- **"메모리 사용량"은 여러 개다.** VSZ(예약한 가상 크기)는 거의 의미가 없고, RSS(실제로 물리 메모리에 올라온 페이지)가 비용이다. `malloc` 이나 `mmap` 은 실제로 건드리기 전까지 물리 메모리를 거의 쓰지 않는다(지연 할당).
- **OOM**: Linux 는 메모리를 과다 약속(overcommit)할 수 있어, 할당은 성공했는데 나중에 접근할 때 OOM killer 가 프로세스를 죽일 수 있다. 컨테이너에서는 cgroup 의 `memory.max` 를 넘을 때 그 cgroup 안에서 OOM killer 가 돈다.
- **페이지 폴트 비용**: 처음 접근하는 페이지마다 폴트가 난다(minor fault). 디스크를 읽어야 하면(major fault) 수 ms 가 걸린다. 지연에 민감한 서비스가 스왑을 끄는 이유다.
- **copy-on-write**: `fork()` 직후 부모·자식은 페이지를 공유하고, 쓰는 순간 복사된다. Redis 의 RDB 스냅숏이 쓰기 많은 시점에 메모리를 크게 쓰는 이유다.
- **mmap 파일 I/O**: 파일을 주소 공간에 매핑해 페이지 캐시를 바로 읽는다. DB·검색 엔진이 많이 쓴다.

```shell
# 프로세스의 실제 메모리(RSS)와 페이지 폴트 수 확인 (Linux)
ps -o pid,rss,vsz,min_flt,maj_flt,cmd -p <pid>
# 컨테이너(cgroup v2) 메모리 사용량과 한도
cat /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.max
```

## 휴지 페이지(Huge Pages)

커널 문서(Transparent Hugepage)에 따르면 2MiB 페이지는 TLB 항목 하나가 훨씬 넓은 영역을 덮어 TLB 미스를 줄인다. 대신:

- 폴트 한 번에 큰 페이지를 0 으로 채우거나 복사해야 해 **지연 스파이크**가 생길 수 있다.
- 1바이트만 쓰는 영역에도 2MiB 가 잡혀 **메모리가 부풀 수** 있다.

그래서 문서는 `madvise` 모드로 필요한 영역에만 쓰는 방법을 안내한다. DB 벤더가 THP 를 끄라고 권하는 경우가 이 비용 때문이다.

## 언제 신경 쓰나

- 메모리 한도가 있는 컨테이너에서 OOMKilled 가 반복될 때 → RSS·페이지 캐시·GC 힙을 나눠서 본다.
- 큰 데이터 구조를 랜덤 접근하는 코드가 느릴 때 → TLB·[캐시 지역성](/develop-wiki/knowledge/cs-fundamentals/cpu-cache-locality/) 문제일 수 있다.
- `fork` 기반 서버·스냅숏의 메모리 급증을 설명할 때.

## 주의

- "free 메모리가 적다"는 대개 문제가 아니다. Linux 는 남는 메모리를 페이지 캐시로 쓰고, 필요하면 회수한다. `available` 값을 본다.
- GC 언어는 힙을 OS 에 바로 돌려주지 않을 수 있어 RSS 가 내려가지 않는다. 런타임 설정(Go `GOMEMLIMIT`, JVM `-Xmx`)과 컨테이너 한도를 맞춘다. [가비지 컬렉션](/develop-wiki/knowledge/cs-fundamentals/garbage-collection/) 참고.
