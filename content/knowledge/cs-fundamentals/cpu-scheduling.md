---
title: CPU 스케줄링
aka: [CPU Scheduling, CFS, EEVDF, MLFQ, Round Robin, nice, CPU Throttling]
category: cs-fundamentals
group: os
level: intermediate
summary: 실행 가능한 스레드 중 누구에게 언제 얼마나 CPU 를 줄지 정하는 OS 정책. 지연(tail latency)과 컨테이너 CPU 제한 동작을 이해하는 바탕.
tags: [os, scheduler, linux, latency, cgroup, kubernetes]
related: [cs-fundamentals/process-thread, cs-fundamentals/container-internals, cs-fundamentals/io-models]
sources:
  - https://man7.org/linux/man-pages/man7/sched.7.html
  - https://docs.kernel.org/scheduler/sched-eevdf.html
  - https://docs.kernel.org/admin-guide/cgroup-v2.html
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
updatedAt: 2026-11-18
---

## 문제

코어는 몇 개인데 실행하고 싶은 스레드는 수백 개다. 스케줄러는 서로 부딪히는 목표를 조율한다.

| 목표 | 뜻 | 유리한 방식 |
| --- | --- | --- |
| 처리량(throughput) | 단위 시간당 끝낸 일 | 긴 타임 슬라이스, 전환 최소화 |
| 응답 시간(latency) | 입력 후 처음 실행될 때까지 | 짧은 슬라이스, 대화형 작업 우선 |
| 공정성 | 같은 우선순위끼리 비슷한 CPU 몫 | 가상 실행 시간 기반 |

## 고전 알고리즘 (OSTEP 정리)

| 알고리즘 | 아이디어 | 약점 |
| --- | --- | --- |
| FIFO | 온 순서대로 | 긴 작업 뒤의 짧은 작업이 오래 기다림(호위 효과) |
| SJF / STCF | 짧은 작업 먼저 | 작업 길이를 미리 알아야 함 |
| Round Robin | 일정 시간씩 돌아가며 | 응답성은 좋지만 완료 시간은 길어짐 |
| MLFQ | 여러 우선순위 큐, 오래 쓰면 강등, 주기적으로 승격 | 튜닝 파라미터가 많음 |

## Linux 의 실제

`sched(7)` 기준:

- **SCHED_OTHER(NORMAL)**: 기본 시분할 정책. nice 값 -20(높음)~+19(낮음). nice 1 차이마다 CPU 몫이 약 1.25배 달라진다.
- **SCHED_BATCH / SCHED_IDLE**: 배치·아주 낮은 우선순위 작업.
- **SCHED_FIFO / SCHED_RR**: 실시간 정책, 정적 우선순위 1~99. 일반 작업보다 항상 먼저 돈다.
- **SCHED_DEADLINE**: 런타임·데드라인·주기로 예약하는 EDF 계열.

일반 작업용 공정 스케줄러는 2.6.23 부터 **CFS** 였고, 커널 문서에 따르면 6.6 부터 **EEVDF** 로 옮겨 가기 시작했다. EEVDF 는 각 작업의 lag(받아야 할 몫 대비 실제로 받은 양)를 보고, 받을 자격이 있는 작업 중 **가상 데드라인이 가장 이른** 것을 실행한다. 짧은 타임 슬라이스를 요청한 작업이 더 빨리 실행될 수 있어 지연 민감 작업에 유리하다.

## 개발자에게 왜 중요한가: 컨테이너 CPU 제한

쿠버네티스 `resources.limits.cpu` 는 cgroup v2 의 `cpu.max` 로 내려간다. 형식은 `$MAX $PERIOD`(기본 주기 100000µs = 100ms)다.

```
cpu.max = "50000 100000"  → 100ms 마다 최대 50ms (0.5 코어)

스레드 4개가 동시에 돌면:
0ms ─ 12.5ms ─────────────────────────── 100ms
████ 4스레드 × 12.5ms = 50ms 할당량 소진
     └─ 나머지 87.5ms 동안 전부 정지 (throttled) ─┘
```

평균 CPU 사용률이 낮아도 **순간적으로 몰리면** 주기의 대부분을 멈춰 있게 되어 p99 지연이 튄다. 반면 `cpu.weight`(요청량 `requests.cpu` 에 대응)는 경쟁할 때의 **비율**만 정하고 놀고 있는 CPU 는 더 쓸 수 있게 한다.

```shell
# 컨테이너 안에서 스로틀링 여부 확인 (cgroup v2)
cat /sys/fs/cgroup/cpu.max
grep -E 'nr_throttled|throttled_usec' /sys/fs/cgroup/cpu.stat
```

## 언제 신경 쓰나

- 평균은 괜찮은데 p99 가 튀는 서비스 → `nr_throttled` 확인, GC·JIT 스레드 수가 할당량보다 많지 않은지 확인.
- 배치와 온라인 서비스가 같은 노드에 있을 때 → 배치에 nice·`SCHED_BATCH`·낮은 `cpu.weight`.
- 스레드 풀 크기 결정 → 실제 할당된 CPU 수 기준.

## 주의

- 실시간 정책(SCHED_FIFO)은 잘못 쓰면 다른 작업을 굶긴다. 일반 서버 코드에는 거의 필요 없다.
- `sched_yield()` 로 "양보"하는 스핀 루프는 공정 스케줄러에서 기대대로 동작하지 않는 경우가 많다. 대기는 조건 변수·채널로 한다.
- 스케줄러 세부 동작은 커널 버전마다 바뀐다. 벤치마크 결과는 커널 버전과 함께 기록한다.
