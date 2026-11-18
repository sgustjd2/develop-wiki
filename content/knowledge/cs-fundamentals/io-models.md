---
title: 파일 시스템과 I/O 모델 (blocking·non-blocking·epoll·io_uring)
aka: [I/O Models, Blocking I/O, Non-blocking I/O, I/O Multiplexing, epoll, kqueue, io_uring, Page Cache, fsync]
category: cs-fundamentals
group: os
level: intermediate
summary: 프로그램이 디스크·네트워크 I/O 를 기다리는 방식(블로킹, 논블로킹+준비 통지, 완료 통지)과 페이지 캐시·fsync 같은 파일 시스템 동작. 이벤트 루프 서버의 바탕.
tags: [os, io, epoll, io_uring, libuv, file-system, fsync, linux]
related: [cs-fundamentals/event-loop, cs-fundamentals/async-vs-threads, cs-fundamentals/process-thread, cs-fundamentals/virtual-memory]
sources:
  - https://man7.org/linux/man-pages/man7/epoll.7.html
  - https://man7.org/linux/man-pages/man7/io_uring.7.html
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
  - https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
updatedAt: 2026-11-18
---

## 문제

I/O 는 CPU 보다 수천~수백만 배 느리다. 연결 1만 개를 처리하는 서버가 연결마다 스레드를 하나씩 세워 `read()` 에서 기다리게 하면 스레드 스택과 전환 비용이 감당이 안 된다(이른바 C10K 문제).

## I/O 모델 비교

| 모델 | 호출 방식 | 누가 기다리나 | 예 |
| --- | --- | --- | --- |
| 블로킹 | `read()` 가 데이터가 올 때까지 반환 안 함 | 호출한 스레드 | 전통적 스레드-per-요청 서버 |
| 논블로킹 | 데이터 없으면 즉시 `EAGAIN` | 아무도 (계속 물어봐야 함) | 단독으로는 바쁜 대기 |
| I/O 다중화 (준비 통지) | `epoll_wait()` 로 "읽을 수 있는 fd" 목록을 받고, 그다음 직접 `read()` | 스레드 하나가 여러 fd 를 대기 | epoll(Linux), kqueue(BSD/macOS), libuv, Go netpoller |
| 완료 통지 | 작업을 제출하고, 끝나면 결과를 받음 | 커널 | io_uring(Linux), IOCP(Windows) |

```
준비 통지 (epoll)                    완료 통지 (io_uring)
app: epoll_wait() ──▶ "fd 7 읽기 가능"  app: SQ 에 "fd 7 read 4KB" 제출
app: read(fd7) ──▶ 데이터              kernel: 읽기 수행
                                       app: CQ 에서 결과(res=4096) 수거
```

## epoll 핵심 (epoll(7))

- `epoll_create1` 로 인스턴스를 만들고, `epoll_ctl` 로 관심 fd 를 등록하고, `epoll_wait` 로 준비된 것을 받는다.
- **레벨 트리거(기본)**: 준비 상태인 동안 계속 알려 준다. poll 의 빠른 버전으로 생각하면 된다.
- **엣지 트리거(`EPOLLET`)**: 상태가 바뀔 때만 알려 준다. 반드시 논블로킹 fd 를 쓰고 `EAGAIN` 이 나올 때까지 읽어야 한다. 덜 읽으면 남은 데이터가 있어도 다시 깨우지 않아 멈춘다.
- 한 fd 를 끝까지 비우다 다른 fd 가 굶을 수 있어, man 페이지는 자체 준비 목록을 두고 돌아가며 처리하라고 권한다.

## io_uring 핵심 (io_uring(7))

- 사용자 공간과 커널이 공유하는 두 개의 링 버퍼: **제출 큐(SQ)** 와 **완료 큐(CQ)**.
- 여러 요청을 한 번의 `io_uring_enter` 로 묶어 시스템 호출 수를 줄인다. SQPOLL 모드면 커널 스레드가 SQ 를 감시해 제출 시스템 호출조차 생략한다.
- 완료는 순서가 보장되지 않아 `user_data` 로 요청과 결과를 짝짓는다.
- 파일 I/O 까지 진짜 비동기로 다룰 수 있다는 점이 epoll 과 다르다(일반 파일은 epoll 로 "준비"를 기다릴 수 없다).

## 개발자에게 왜 중요한가

- **Node.js**: 네트워크는 epoll/kqueue 로, 파일 시스템·DNS(`dns.lookup`)·일부 crypto 는 libuv **스레드 풀**(기본 4개)로 처리한다. 파일 I/O 가 많으면 풀이 병목이 될 수 있다.
- **Go**: 고루틴은 블로킹 코드처럼 쓰지만 런타임이 내부적으로 netpoller(epoll 등)에 등록하고 고루틴을 재운다.
- **이벤트 루프에서 동기 I/O 금지**: `fs.readFileSync` 한 번이 그동안 모든 연결을 멈춘다. [이벤트 루프](/develop-wiki/knowledge/cs-fundamentals/event-loop/) 참고.

## 파일 시스템: 쓰기는 언제 디스크에 가나

```
write() ──▶ 페이지 캐시(메모리, dirty) ──(나중에 커널이)──▶ 디스크
              └─ fsync()/fdatasync() 를 불러야 "디스크에 있음"이 보장됨
```

- `write()` 가 성공해도 전원이 나가면 사라질 수 있다. DB·메시지 브로커가 커밋 시 `fsync` 를 부르는 이유이고, 그래서 커밋 지연의 상당 부분이 fsync 다.
- 새 파일을 안전하게 교체하려면: 임시 파일에 쓰기 → `fsync(파일)` → `rename()` → `fsync(디렉터리)`. OSTEP 의 저널링 장이 이 문제(크래시 일관성)를 다룬다.

```ts
// Node.js: 설정 파일을 원자적으로 교체
import { open, rename } from 'node:fs/promises';
async function atomicWrite(path: string, data: string) {
  const tmp = `${path}.tmp`;
  const fh = await open(tmp, 'w');
  try { await fh.writeFile(data); await fh.sync(); } finally { await fh.close(); }
  await rename(tmp, path); // 같은 파일 시스템 안의 rename 은 원자적
}
```

## 언제 무엇을

- 일반 웹 서버: 언어 런타임이 고른 방식(epoll 기반 이벤트 루프·netpoller)을 그대로 쓴다. 직접 epoll 을 다룰 일은 드물다.
- 초고성능 스토리지·프록시: io_uring 을 검토. 단, 커널 버전과 보안 정책을 확인한다.

## 주의 (비용)

- io_uring 은 공격 표면이 넓다는 이유로 일부 환경(컨테이너 런타임의 seccomp 기본 프로필, 일부 배포판·클라우드)에서 막혀 있을 수 있다. 쓰기 전에 대상 환경에서 사용 가능 여부를 확인한다.
- 엣지 트리거·SQPOLL 같은 옵션은 성능 이득만큼 버그 여지도 크다. 라이브러리(libuv, tokio, netty)를 쓰는 편이 안전하다.
- "비동기"라도 CPU 를 쓰는 작업은 여전히 그 스레드를 막는다. I/O 모델은 대기를 줄일 뿐 계산을 줄이지 않는다.
