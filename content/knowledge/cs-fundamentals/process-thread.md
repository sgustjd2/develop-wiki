---
title: 프로세스와 스레드
aka: [Process, Thread, Context Switch, Goroutine, Green Thread, Worker Thread]
category: cs-fundamentals
group: os
level: beginner
summary: 프로세스는 독립된 주소 공간을 가진 실행 단위, 스레드는 그 주소 공간을 공유하는 실행 흐름. 격리·비용·공유의 차이가 서버 설계와 장애 범위를 정한다.
tags: [os, process, thread, context-switch, goroutine, nodejs]
related: [cs-fundamentals/virtual-memory, cs-fundamentals/cpu-scheduling, cs-fundamentals/race-condition-lock-deadlock, cs-fundamentals/async-vs-threads, cs-fundamentals/container-internals]
sources:
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
  - https://man7.org/linux/man-pages/man7/sched.7.html
  - https://nodejs.org/api/worker_threads.html
  - https://go.dev/doc/effective_go
updatedAt: 2026-11-18
---

## 개념

| | 프로세스 | 스레드 |
| --- | --- | --- |
| 무엇 | 실행 중인 프로그램 하나. OS 가 CPU·메모리를 "가상화"해 혼자 쓰는 것처럼 보이게 함 | 한 프로세스 안의 실행 흐름(레지스터·스택·PC 를 따로 가짐) |
| 주소 공간 | 각자 독립 | 같은 프로세스의 스레드끼리 **공유** (힙·전역·열린 파일) |
| 만들기·전환 비용 | 큼 (페이지 테이블·파일 디스크립터 테이블 등) | 작음 (같은 주소 공간이라 TLB·캐시를 덜 버림) |
| 통신 | 파이프, 소켓, 공유 메모리 등 명시적 IPC | 그냥 같은 변수를 읽고 씀 → 동기화 필요 |
| 장애 범위 | 한 프로세스가 죽어도 다른 프로세스는 무사 | 한 스레드의 잘못된 메모리 접근이 프로세스 전체를 죽임 |

OSTEP 은 운영체제의 첫 번째 일을 "CPU 와 메모리의 가상화"로 설명한다. 프로세스는 그 가상화의 단위이고, 스레드는 "같은 주소 공간을 쓰는 여러 개의 실행 지점"이다.

```
프로세스 A                       프로세스 B
┌───────────────────────┐       ┌──────────────┐
│ 코드 | 데이터 | 힙      │       │ 코드|데이터|힙 │
│ 스택T1  스택T2  스택T3  │       │ 스택T1        │
│  ↑스레드 3개가 힙 공유   │       └──────────────┘
└───────────────────────┘        주소 공간이 분리됨
```

Linux 커널 입장에서는 스레드도 스케줄링 단위(task)다. `sched(7)` 의 정책·nice 값은 스레드마다 적용된다.

## 개발자에게 왜 중요한가

- **동시성 모델 선택**: 요청마다 스레드(Java 서블릿 전통), 이벤트 루프 한 스레드(Node.js), 경량 스레드(Go 고루틴) 중 무엇을 쓰느냐가 코드 스타일과 병목을 정한다.
- **격리 vs 공유**: 플러그인·사용자 코드·불안정한 네이티브 라이브러리는 프로세스로 분리하면 하나가 죽어도 본체가 산다(브라우저의 사이트별 프로세스 분리가 대표 예).
- **멀티코어 활용**: Node.js·CPython 처럼 한 번에 한 스레드만 JS/바이트코드를 실행하는 런타임은 CPU 작업을 위해 별도 워커·프로세스가 필요하다.

## 런타임별 모습

| 런타임 | 실행 단위 | 메모 |
| --- | --- | --- |
| Go | 고루틴 (M:N, 런타임이 OS 스레드에 배치) | 공식 문서: 같은 주소 공간에서 동시에 실행되는 함수, 스택 할당 정도의 비용 |
| Node.js | 메인 스레드 1개 + libuv 스레드 풀 + `worker_threads` | 공식 문서: 워커는 CPU 집약 작업용, I/O 에는 큰 도움이 안 됨 |
| JVM | 플랫폼 스레드(OS 스레드 1:1), 가상 스레드 | 블로킹 코드를 많이 띄우는 서버에서 가상 스레드 고려 |

```ts
// Node.js: CPU 작업을 워커로 분리 (메인 이벤트 루프를 막지 않기 위해)
import { Worker } from 'node:worker_threads';

function hashInWorker(input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./hash-worker.js', import.meta.url), { workerData: input });
    w.once('message', resolve);
    w.once('error', reject);
  });
}
```

워커끼리는 기본적으로 메시지를 복사해 주고받고, `SharedArrayBuffer` 를 쓰면 메모리를 공유할 수 있다(그 순간 [원자 연산](/develop-wiki/knowledge/cs-fundamentals/memory-model-atomics/)이 필요해진다).

## 언제 무엇을

- **프로세스**: 격리가 필요할 때, 언어 런타임이 단일 스레드일 때(Node `cluster`, Gunicorn 워커), 크래시가 전파되면 안 될 때.
- **스레드**: 같은 데이터를 자주 공유하고 지연이 중요할 때. 대신 [경쟁 조건](/develop-wiki/knowledge/cs-fundamentals/race-condition-lock-deadlock/)을 설계 단계에서 다룬다.
- **경량 스레드·이벤트 루프**: 동시 연결이 수만 개이고 대부분 I/O 대기일 때. 비교는 [async/await vs 스레드](/develop-wiki/knowledge/cs-fundamentals/async-vs-threads/) 참고.

## 주의 (비용)

- 스레드가 싸다고 무한정 만들면 스택 메모리와 컨텍스트 스위치 비용이 쌓인다. 스레드 풀 크기는 CPU 수와 대기 비율로 정한다.
- `fork()` 한 자식은 부모 메모리를 copy-on-write 로 공유한다. 멀티스레드 프로세스에서 `fork` 하면 호출한 스레드만 복제되어, 다른 스레드가 잡고 있던 락이 자식에서 영원히 풀리지 않을 수 있다.
- 컨테이너 안에서 "CPU 수"는 호스트 코어 수가 아니라 cgroup 할당량일 수 있다. 풀 크기를 코어 수로 정하는 라이브러리는 [cgroup 제한](/develop-wiki/knowledge/cs-fundamentals/container-internals/)을 인식하는지 확인한다.
