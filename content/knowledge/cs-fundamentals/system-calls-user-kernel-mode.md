---
title: 시스템 콜과 유저 모드·커널 모드
aka: [System Call, Syscall, User Mode, Kernel Mode, Trap, Limited Direct Execution, vDSO, Context Switch]
category: cs-fundamentals
group: os
level: intermediate
summary: 프로그램이 파일·네트워크·메모리 같은 자원을 직접 만지지 못하고 트랩으로 커널에 부탁하는 구조와, 그 전환 비용이 성능에 미치는 영향.
tags: [os, syscall, kernel, linux, performance, vdso]
related: [cs-fundamentals/process-thread, cs-fundamentals/virtual-memory, cs-fundamentals/io-models, cs-fundamentals/cpu-scheduling, cs-fundamentals/container-internals]
sources:
  - https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf
  - https://man7.org/linux/man-pages/man7/vdso.7.html
updatedAt: 2026-11-18
---

## 문제

OS 는 두 가지를 동시에 원한다.

- **빠르게**: 사용자 프로그램은 CPU 위에서 직접(에뮬레이션 없이) 돌아야 한다.
- **안전하게**: 그 프로그램이 디스크를 마음대로 쓰거나, 남의 메모리를 읽거나, CPU 를 영원히 붙잡으면 안 된다.

OSTEP 은 이 해법을 **제한된 직접 실행(limited direct execution)** 이라 부른다. 평소에는 직접 실행하되, 위험한 일은 하드웨어가 막고 커널을 거치게 한다.

## 해법: 두 개의 모드와 트랩

| | 유저 모드 | 커널 모드 |
| --- | --- | --- |
| 누가 | 애플리케이션 | OS 커널 |
| 할 수 있는 것 | 일반 연산, 자기 주소 공간 접근 | 특권 명령(I/O, 페이지 테이블·인터럽트 설정 등) |
| 금지된 일을 하면 | CPU 가 예외를 일으켜 커널로 넘어감(보통 프로세스 종료) | — |

유저 프로그램이 파일을 읽고 싶으면 **시스템 콜**을 한다.

```
유저 모드                         커널 모드
read(fd, buf, n)
 └ libc 래퍼: 시스템 콜 번호를 레지스터에, 인자도 레지스터에
   trap 명령 (x86-64: syscall) ──▶ 하드웨어가 레지스터를 커널 스택에 저장, 모드 전환
                                   트랩 테이블(부팅 때 커널이 등록)에서 핸들러로 점프
                                   번호 검사 → sys_read 실행 → 결과를 레지스터에
         ◀── return-from-trap ──── 레지스터 복원, 유저 모드로 복귀
 └ 반환값(-1 이면 errno 설정)
```

핵심 포인트:

- 유저 코드는 **점프할 주소를 고를 수 없다.** 번호만 고르고, 실제 진입점은 커널이 부팅 때 정해 둔 트랩 테이블이 결정한다. 그래서 커널 안 아무 곳으로나 뛰어들 수 없다.
- 커널은 인자를 믿지 않는다. 포인터가 그 프로세스 주소 공간 안인지 검사한다.
- 시스템 콜이 아니어도 커널로 들어가는 경로가 있다: **타이머 인터럽트**(CPU 를 되찾아 스케줄링), 페이지 폴트, 장치 인터럽트. 타이머가 있기 때문에 무한 루프 프로세스가 기계를 독점하지 못한다.

## 직접 보기

```bash
strace -c ls > /dev/null        # 어떤 시스템 콜을 몇 번 했는지 집계
strace -f -e trace=network node app.js   # 네트워크 관련 콜만 추적
```

```ts
// Node: fs.readFileSync 한 줄도 내부적으로 openat → fstat → read(여러 번) → close
import { readFileSync } from 'node:fs';
const text = readFileSync('/etc/hostname', 'utf8');
```

## 비용과 성능

- 전환 자체(레지스터 저장·복원, 모드 전환)와, 그 부수 효과(캐시·TLB·분기 예측 상태 오염, CPU 취약점 완화책)가 든다. OSTEP 이 인용한 1996년 lmbench 측정에서 시스템 콜은 약 4µs 였고, 지금은 마이크로초 미만이지만 **함수 호출보다는 수십~수백 배 비싸다**고 보면 된다(정확한 값은 CPU·커널·완화책 설정에 따라 다르므로 직접 잰다).
- 그래서 고성능 코드는 **시스템 콜 횟수**를 줄인다.

| 기법 | 내용 |
| --- | --- |
| 버퍼링 | 1바이트씩 `write` 하지 말고 버퍼에 모아 한 번에 (`fwrite`, `BufWriter`) |
| 벡터 I/O | `readv`/`writev` 로 여러 버퍼를 한 번의 콜로 |
| 제로 카피 | `sendfile`, `splice` 로 커널 안에서 파일 → 소켓 |
| 이벤트 다중화 | 소켓마다 `read` 시도 대신 `epoll_wait` 한 번에 준비된 것만. [I/O 모델](/develop-wiki/knowledge/cs-fundamentals/io-models/) 참고 |
| 배치 제출 | `io_uring` 은 공유 링 버퍼로 요청을 모아 제출·완료를 확인해 전환을 줄인다 |
| vDSO | `clock_gettime`, `gettimeofday`, `time`, `getcpu` 는 커널이 프로세스에 매핑한 작은 라이브러리로 처리해 커널 진입 없이 끝난다 |

## 언제 의식하나

- 프로파일에서 `sys` 시간이 높을 때(`time` 의 sys, `perf top` 에 커널 심볼).
- 작은 쓰기·읽기를 아주 많이 하는 로깅, 직렬화, 프록시 코드.
- 컨테이너·샌드박스 설계: seccomp 로 허용 시스템 콜을 제한하는 것이 격리의 한 축이다. [컨테이너 내부](/develop-wiki/knowledge/cs-fundamentals/container-internals/) 참고.

## 주의

- "커널 모드 = 느림"이 아니다. 문제는 전환 **횟수**다. 큰 버퍼 한 번의 `read` 는 충분히 싸다.
- 시스템 콜 ≠ 컨텍스트 스위치. 시스템 콜은 같은 프로세스가 커널에 잠깐 들어갔다 나오는 것이고, 컨텍스트 스위치는 다른 프로세스·스레드로 CPU 를 넘기는 것이다. 블로킹 콜(디스크 대기 등)이 스위치를 **유발**할 수는 있다.
- 시스템 콜 번호와 ABI 는 OS·아키텍처마다 다르다. 직접 번호를 쓰지 말고 libc·언어 런타임 래퍼를 쓴다(Go 는 libc 없이 직접 호출하는 플랫폼이 있다).
- `errno` 는 실패했을 때만 의미가 있다. 반환값을 먼저 확인한다.
