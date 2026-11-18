---
title: 성능 프로파일링 방법
aka: [Profiling, USE Method, Flame Graph, Sampling Profiler, Off-CPU Analysis, 성능 분석]
category: performance
level: intermediate
summary: 추측 대신 측정으로 병목을 찾는 절차. USE 방법으로 자원 병목을 훑고, 샘플링 프로파일러와 플레임 그래프로 코드 경로를 좁히는 방법.
tags: [profiling, flame-graph, use-method, observability, cpu]
related: [performance/connection-pool, performance/core-web-vitals, performance/caching-strategies, data-modeling/n-plus-one, data-modeling/index-design]
sources:
  - https://www.brendangregg.com/usemethod.html
  - https://www.brendangregg.com/flamegraphs.html
  - https://sre.google/sre-book/handling-overload/
updatedAt: 2026-11-18
---

## 문제

"느리다"는 증상에서 바로 코드를 고치면 대개 엉뚱한 곳을 최적화한다. 개발자의 직감은 병목 위치를 잘 맞히지 못하고, 손에 익은 도구가 보여 주는 지표만 보다가(도구 중심 접근) 정작 포화된 자원을 놓친다.

## 해법: 넓게 훑고, 좁게 판다

### 0단계: 증상을 숫자로

- 무엇이 느린가? p50 이 아니라 **p95·p99 지연**, 처리량, 오류율. 언제부터? 무엇이 바뀌었나(배포, 트래픽, 데이터 크기)?
- 요청 하나의 시간이 어디서 쓰이는지 분산 트레이스로 먼저 본다. DB 대기인지, 외부 API 인지, 내 코드 CPU 인지에 따라 다음 도구가 다르다.

### 1단계: USE 방법 — 자원 병목 훑기

Brendan Gregg 의 USE 방법: **모든 자원에 대해 사용률(Utilization), 포화도(Saturation), 오류(Errors)를 확인한다.**

| 자원 | 사용률 | 포화도 | 오류 |
| --- | --- | --- | --- |
| CPU | 코어별 사용률 | 실행 대기열 길이 | — |
| 메모리 | 사용량 | 스왑, OOM, GC 시간 | 할당 실패 |
| 디스크 | 바쁜 시간 비율 | I/O 대기열 | 장치 오류 |
| 네트워크 | 대역폭 대비 | 재전송, 소켓 백로그 | 인터페이스 오류 |
| 소프트웨어 자원 | 커넥션 풀·스레드 풀 사용률 | 풀 대기 시간 | 타임아웃 |

- 오류부터 본다(해석이 빠르다). 100% 사용률이나 0이 아닌 포화도는 병목 후보다.
- 평균 사용률 70%도 짧은 폭주를 숨길 수 있다. 짧은 간격으로 본다.
- 확인 못 한 항목은 "?"로 남겨 무엇을 안 봤는지 드러낸다.

### 2단계: 프로파일러 — 코드 경로 좁히기

| 종류 | 원리 | 쓰임 |
| --- | --- | --- |
| 샘플링 | 일정 주기(예: 99Hz)로 스택을 찍음 | 운영 환경에서도 오버헤드가 낮음. 기본 선택 |
| 계측(instrumenting) | 함수 진입·종료마다 기록 | 정확한 호출 횟수. 오버헤드가 커서 결과를 왜곡 |
| Off-CPU | 스레드가 CPU 밖에서 기다린 시간(I/O, 잠금) | CPU 는 한가한데 느릴 때 |
| 힙·할당 | 할당 위치와 크기 | 메모리 증가, GC 압박 |

### 3단계: 플레임 그래프 읽기

- **세로축**: 스택 깊이(아래가 호출자, 위가 피호출자).
- **가로축은 시간이 아니다.** 스택을 알파벳순으로 정렬해 합친 것이다. **폭 = 샘플에 등장한 빈도**.
- 위쪽 가장자리가 실제로 CPU 를 쓰던 함수다. **넓은 고원(plateau)** 을 찾는다.

```bash
# Node.js: CPU 프로파일 수집 → Chrome DevTools 나 speedscope 로 플레임 그래프 보기
node --cpu-prof --cpu-prof-dir=./prof server.js
# Linux 전체 시스템: perf 로 샘플링
perf record -F 99 -a -g -- sleep 30
```

### 4단계: 고치고 다시 잰다

한 번에 하나만 바꾸고, 같은 조건(데이터·부하)에서 전후를 비교한다.

## 언제 쓰나

- 지연·처리량 목표를 못 맞출 때, 비용(인스턴스 수)이 예상보다 클 때, 배포 후 회귀가 의심될 때.

## 주의 (비용)

- 개발 PC·작은 데이터에서의 프로파일은 운영과 다르다. 가능하면 운영과 비슷한 데이터·부하에서, 또는 운영에서 저오버헤드 샘플링으로.
- CPU 프로파일만 보면 I/O·잠금 대기를 놓친다. CPU 가 한가한데 느리면 Off-CPU 와 트레이스를 본다. 가장 흔한 범인은 [N+1 쿼리](/develop-wiki/knowledge/data-modeling/n-plus-one/)와 [커넥션 풀](/develop-wiki/knowledge/performance/connection-pool/) 대기다.
- JIT 언어는 워밍업 전 측정이 왜곡된다. 마이크로벤치마크는 실제 병목과 무관한 최적화로 이끌기 쉽다.
- 평균은 꼬리 지연을 숨긴다. 분포(히스토그램)로 본다.
- "무작위로 바꿔 보기"는 측정이 아니다. 가설 → 측정 → 변경 → 재측정 순서를 지킨다.
