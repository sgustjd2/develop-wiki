---
title: 파일 디스크립터와 epoll·kqueue
aka: [File Descriptor, Open File Description, epoll, kqueue, eventfd, select, poll, Level-triggered, Edge-triggered, EPOLLONESHOT, O_CLOEXEC, EMFILE]
category: cs-fundamentals
group: os
level: advanced
summary: 소켓·파일·파이프를 정수 하나로 다루는 파일 디스크립터의 정체(open file description), 그리고 수만 개 fd 를 한 스레드로 감시하는 epoll(Linux)·kqueue(BSD/macOS)의 동작과 함정.
tags: [os, linux, file-descriptor, epoll, kqueue, eventfd, io-multiplexing, c10k]
related: [cs-fundamentals/io-models, cs-fundamentals/event-loop, cs-fundamentals/system-calls-user-kernel-mode, cs-fundamentals/process-thread, cs-fundamentals/async-vs-threads, cs-fundamentals/websocket-sse-long-polling]
sources:
  - https://man7.org/linux/man-pages/man7/epoll.7.html
  - https://man7.org/linux/man-pages/man2/eventfd.2.html
  - https://man7.org/linux/man-pages/man2/open.2.html
  - https://man.freebsd.org/cgi/man.cgi?query=kqueue&sektion=2
updatedAt: 2026-11-19
---

[I/O 모델](/develop-wiki/knowledge/cs-fundamentals/io-models/)이 블로킹·논블로킹·완료 통지를 비교한다면, 이 노트는 그 바닥에 있는 **fd 라는 추상**과 **epoll/kqueue 의 사용법과 함정**을 자세히 본다.

## 문제 1: fd 는 정확히 무엇인가

Unix 는 파일, 소켓, 파이프, 타이머 등을 모두 **정수 번호(fd)** 로 가리킨다. 그런데 이 정수가 가리키는 대상이 두 겹이다.

```
프로세스 fd 테이블        open file description (커널, open() 마다 1개)     inode / 소켓
 fd 3 ───────────────┐
 fd 7 (dup(3)) ──────┼──▶ [오프셋, 상태 플래그(O_NONBLOCK 등)] ──────────▶ 대상
 자식 프로세스 fd 3 ──┘
```

- `open()` 은 새 **open file description**(오프셋, 상태 플래그 보관)을 만들고, fd 는 그 참조다(open(2)).
- `dup()`·`fork()` 로 생긴 fd 들은 **같은 description 을 공유**한다. 그래서 오프셋과 `O_NONBLOCK` 이 같이 바뀐다.
- 새 fd 는 **사용 중이지 않은 가장 작은 번호**다. 예측 가능해서 `close(0)` 뒤 열면 stdin 자리를 차지하는 사고가 난다.
- **`O_CLOEXEC`** 를 `open` 시점에 같이 주지 않으면, 멀티스레드 프로그램에서 다른 스레드의 `fork`+`exec` 와 겹쳐 fd 가 자식 프로그램으로 **새는** 경쟁이 생긴다. 항상 생성과 동시에 지정한다(`SOCK_CLOEXEC`, `EFD_CLOEXEC` 등).
- 한도: 프로세스당 `RLIMIT_NOFILE` 초과 → `EMFILE`, 시스템 전체 초과 → `ENFILE`. 연결 수만 개 서버는 `ulimit -n` 을 올리고, fd 누수(close 누락)를 모니터링한다.

## 문제 2: 연결 1만 개를 어떻게 기다리나

연결마다 스레드를 두면 메모리와 컨텍스트 스위치가 감당이 안 된다. `select`/`poll` 은 호출마다 감시 목록 **전체를 커널에 넘기고 훑어서** fd 수에 비례해 느려진다. epoll/kqueue 는 목록을 **커널에 등록해 두고** 준비된 것만 돌려받는다.

## 해법 1: epoll (Linux)

세 호출이 전부다.

| 호출 | 하는 일 |
| --- | --- |
| `epoll_create1(EPOLL_CLOEXEC)` | epoll 인스턴스 생성. **interest list**(감시 대상)와 **ready list**(준비된 것)를 가진다 |
| `epoll_ctl(ADD/MOD/DEL, fd, event)` | 감시 대상 등록·수정·제거 |
| `epoll_wait(events, max, timeout)` | ready list 를 받아온다. 비었으면 블록 |

```c
int ep = epoll_create1(EPOLL_CLOEXEC);
struct epoll_event ev = { .events = EPOLLIN, .data.fd = listen_fd };
epoll_ctl(ep, EPOLL_CTL_ADD, listen_fd, &ev);

struct epoll_event out[64];
for (;;) {
  int n = epoll_wait(ep, out, 64, -1);
  for (int i = 0; i < n; i++) {
    if (out[i].data.fd == listen_fd) { /* accept 후 새 fd 를 EPOLL_CTL_ADD */ }
    else { /* read(out[i].data.fd, ...) — EAGAIN 까지 */ }
  }
}
```

### 레벨 트리거 vs 엣지 트리거

| | 레벨(기본) | 엣지(`EPOLLET`) |
| --- | --- | --- |
| 알림 | 준비 상태인 동안 계속 | 상태가 **바뀔 때** 한 번 |
| 요구 | 일부만 읽어도 다음 wait 에서 다시 알림 | 논블로킹 fd 필수, **`EAGAIN` 까지 읽고 써야** 함 |
| 위험 | 적음(poll 과 같은 의미, 더 빠름) | 덜 읽으면 남은 데이터가 있어도 안 깨워서 **멈춤** |

- `EPOLLONESHOT`: 이벤트를 한 번 받으면 그 fd 는 비활성화된다. 스레드 풀에서 한 fd 를 한 스레드만 처리하게 할 때 쓰고, 끝나면 `EPOLL_CTL_MOD` 로 다시 켠다.
- 한 fd 를 끝까지 비우느라 다른 fd 가 **굶는** 문제는, 준비 목록을 직접 관리해 돌아가며 처리하라고 man 페이지가 권한다.

### 함정 (man 7 epoll Q&A)

- 등록 키는 **fd 번호 + open file description** 이다. `dup` 된 fd 가 하나라도 남아 있으면 원래 fd 를 `close` 해도 **등록이 남아** 이벤트가 계속 온다. `close` 전에 `EPOLL_CTL_DEL` 을 하는 습관이 안전하다.
- 같은 fd 를 두 번 `ADD` 하면 `EEXIST`.
- `fork` 후 자식이 epoll fd 를 상속하면 두 프로세스가 같은 인스턴스를 공유한다.
- 이벤트를 배열에 모아 처리하는 중에 다른 이벤트 처리가 그 fd 를 닫으면 **낡은 이벤트**가 남는다. 닫은 fd 의 이벤트는 건너뛰어야 한다.
- 전체 등록 수는 `/proc/sys/fs/epoll/max_user_watches` 로 제한된다(등록 하나당 커널 메모리 약 160바이트, 64비트 기준).
- **일반 파일은 epoll 로 감시할 수 없다**(`epoll_ctl` 이 `EPERM` 을 반환한다. 디스크 파일은 항상 "준비"이므로 의미도 없다). 파일 I/O 는 스레드 풀이나 io_uring.

### eventfd: 스레드 깨우기용 fd

`eventfd` 는 커널이 관리하는 **64비트 카운터** 하나다. `write` 는 값을 더하고, `read` 는 값을 꺼내 0 으로 만든다(`EFD_SEMAPHORE` 면 1씩 감소). 카운터가 0 보다 크면 readable 이라 epoll 에 넣을 수 있다. 다른 스레드가 이벤트 루프를 깨우거나 종료 신호를 보낼 때 파이프 대신 쓴다. man 페이지는 파이프보다 커널 오버헤드가 훨씬 작고 fd 가 하나뿐이라고 설명한다.

```c
int efd = eventfd(0, EFD_NONBLOCK | EFD_CLOEXEC);
epoll_ctl(ep, EPOLL_CTL_ADD, efd, &(struct epoll_event){ .events = EPOLLIN, .data.fd = efd });
// 다른 스레드: uint64_t one = 1; write(efd, &one, 8);
// 루프: read(efd, &cnt, 8)  → cnt 만큼 쌓인 요청 처리
```

## 해법 2: kqueue (BSD, macOS)

- `kqueue()` 로 큐 fd 를 만들고 `kevent()` **한 호출로** 변경 목록(changelist)을 적용하면서 이벤트 목록(eventlist)을 받는다. `epoll_ctl` + `epoll_wait` 가 합쳐진 모양.
- 이벤트는 `struct kevent{ ident, filter, flags, fflags, data, udata }` 로 표현한다. **필터**가 감시 종류를 정한다: `EVFILT_READ`/`WRITE`(소켓·파일), `EVFILT_VNODE`(파일 변경), `EVFILT_PROC`, `EVFILT_SIGNAL`, `EVFILT_TIMER`, `EVFILT_USER` 등. epoll 이 fd 중심인 데 비해 **파일 변경·프로세스·시그널·타이머까지 하나의 인터페이스**로 감시한다.
- 플래그: `EV_ADD`/`EV_DELETE`, `EV_ONESHOT`, `EV_CLEAR`(꺼낼 때 상태를 리셋, 엣지와 비슷한 동작), `EV_DISPATCH`.
- 자식 프로세스는 `fork` 로 kqueue 를 **상속하지 않는다**(FreeBSD 문서).
- 일반 파일 `EVFILT_READ` 는 EOF 가 아닐 때 준비로 보고하고 `data` 에 EOF 까지 거리를 담는다. poll 과 다르다는 점에 주의.

| | select/poll | epoll | kqueue |
| --- | --- | --- | --- |
| 플랫폼 | POSIX 전반 | Linux | BSD, macOS |
| 등록 | 호출마다 전체 전달 | 커널에 상주 | 커널에 상주 |
| 비용 | 감시 fd 수에 비례 | 준비된 수에 비례 | 준비된 수에 비례 |
| 감시 대상 | fd | fd(일반 파일 불가) | fd + 파일 변경·프로세스·시그널·타이머 |
| 변경 적용 | - | `epoll_ctl` 별도 호출 | `kevent` 에 함께 |

Windows 는 IOCP(완료 통지 모델)다. libuv·Netty·tokio·Go netpoller 같은 런타임이 이 차이를 숨긴다.

## 언제 쓰나

- 직접 쓸 일은 **네트워크 서버·프록시·런타임을 만들 때**다. 일반 애플리케이션은 Node.js, Go, tokio 등이 이미 epoll/kqueue 위에 올라 있다.
- 장애 분석에서는 그대로 쓰인다: `EMFILE`, 연결 누수(fd 증가), `strace -e epoll_wait`, `lsof -p`, `ls /proc/<pid>/fd | wc -l`.

## 주의 (비용)

- 엣지 트리거 + 논블로킹 + `EAGAIN` 소진은 세트다. 하나라도 빠지면 가끔 멈추는 서버가 된다. 확신이 없으면 레벨 트리거.
- epoll 은 **준비 통지**일 뿐 데이터를 읽어 주지 않는다. 읽기·쓰기는 여전히 시스템 호출이고, 느린 처리가 루프를 막으면 모든 연결이 지연된다([이벤트 루프](/develop-wiki/knowledge/cs-fundamentals/event-loop/)).
- 멀티스레드에서 epoll 하나를 여럿이 기다리면 한 이벤트에 여러 스레드가 깨는 "thundering herd"가 생길 수 있다. 스레드마다 인스턴스를 두거나 `EPOLLONESHOT`/`EPOLLEXCLUSIVE` 를 검토한다(`EPOLLEXCLUSIVE` 는 Linux 4.5 부터 `epoll_ctl(2)` 에 있는 플래그로, 같은 fd 를 여러 epoll 인스턴스에 등록했을 때 일부 인스턴스만 깨우도록 한다. `EPOLL_CTL_ADD` 에만 쓸 수 있다).
- 플랫폼 이식성: epoll 코드는 macOS 에서 안 돈다. 이식이 필요하면 libuv·libevent 같은 추상 계층을 쓴다.
- 완료 기반 비동기가 필요하거나 디스크 I/O 가 병목이면 [io_uring](/develop-wiki/knowledge/cs-fundamentals/io-models/)을 검토한다.
