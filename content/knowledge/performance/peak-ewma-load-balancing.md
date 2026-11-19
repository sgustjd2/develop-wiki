---
title: P2C + Peak EWMA 로드 밸런싱
aka: [Peak EWMA, PeakEwma, P2C Peak EWMA, p2cPeakEwma, 지연 기반 로드 밸런싱, latency-aware load balancing, Finagle, Linkerd, tower]
category: performance
level: advanced
summary: 백엔드마다 응답 시간의 "최고치에 민감한" 지수 이동 평균에 진행 중 요청 수를 곱한 비용을 두고, 무작위 두 후보 중 비용이 낮은 쪽을 고르는 방식. 느려진 서버를 빨리 피하는 대신 회복한 서버도 늦게 돌아온다.
tags: [load-balancing, p2c, ewma, peak-ewma, finagle, linkerd, tower, tail-latency, service-mesh]
related: [performance/power-of-two-choices-load-balancing, performance/load-balancing, performance/hedged-requests-tied-requests, performance/mg1-service-time-variance-tail-latency, performance/backpressure-load-shedding, performance/adaptive-throttling-retry-budget, algorithms/consistent-hashing-bounded-loads]
sources:
  - https://twitter.github.io/finagle/guide/Clients.html
  - https://github.com/twitter/finagle/blob/develop/finagle-core/src/main/scala/com/twitter/finagle/loadbalancer/PeakEwma.scala
  - https://github.com/tower-rs/tower/blob/master/tower/src/load/peak_ewma.rs
  - https://github.com/linkerd/linkerd2-proxy/blob/main/linkerd/app/core/src/control.rs
  - https://linkerd.io/2/features/load-balancing/
updatedAt: 2026-11-19
---

## 문제

[P2C](/develop-wiki/knowledge/performance/power-of-two-choices-load-balancing/)의 기본 부하 신호는 **진행 중 요청 수**(least loaded)다. 값싸고 쏠림에 강하지만 한계가 있다.

- 요청 하나가 얼마나 오래 걸리는지 모른다. 10 ms 서버의 대기 3 건과 200 ms 서버의 대기 3 건을 같게 본다.
- 느려진 서버는 진행 중 요청이 쌓여야 비로소 덜 뽑힌다. 그 사이 요청들이 이미 긴 지연을 겪는다.
- 꼬리 지연(p99, p99.9)은 이런 "조금 느린 한 대"가 만든다.

## 해법

Finagle(트위터의 JVM RPC 라이브러리)이 만든 **Peak EWMA** 부하 지표를 P2C 와 묶는다. Rust 의 tower 가 이를 옮겼고(소스 주석에 Finagle 파생이라고 적혀 있다), Linkerd2 프록시가 tower 구현을 쓴다.

백엔드마다 비용을 다음처럼 계산한다(Finagle·tower 소스 기준).

```
cost = rtt_estimate × (pending + 1)
```

- `pending` 은 그 백엔드의 진행 중 요청 수다. `+1` 은 "이번 요청을 보낸다면"을 반영한다.
- `rtt_estimate` 갱신 규칙:
  - 관측 RTT 가 현재 추정치보다 **크면** 추정치를 그 값으로 **즉시 바꾼다**(최고치에 민감).
  - 작으면 지난 갱신 이후 경과 시간 Δt 로 가중치 w = e^(−Δt/τ) 를 정해 `est = est·w + rtt·(1−w)` 로 천천히 내린다. 관측 간격이 고르지 않아 시간 기반 가중치를 쓴다.
  - 비용을 읽을 때도 RTT 0 을 관측한 것처럼 감쇠시킨다. 요청이 없으면 추정치가 시간이 지나며 0 쪽으로 내려간다.
- τ 는 감쇠 시간(decay)이다. Finagle 문서는 `Balancers.p2cPeakEwma(decayTime)` 의 기본값을 10 초, "지연 관측의 창"이라고 설명한다.

```ts
type Node = { est: number; at: number; pending: number };

function decay(n: Node, now: number, rtt: number, tauMs: number) {
  if (rtt > n.est) n.est = rtt;                 // 최고치는 즉시 반영
  else { const w = Math.exp(-(now - n.at) / tauMs); n.est = n.est * w + rtt * (1 - w); }
  n.at = now;
}

function cost(n: Node, now: number, tauMs: number): number {
  decay(n, now, 0, tauMs);                       // 읽을 때마다 0 쪽으로 감쇠
  return n.est * (n.pending + 1);
}

function pick(pool: Node[], now: number, tauMs = 10_000, rnd = Math.random): Node {
  const i = Math.floor(rnd() * pool.length);
  let j = Math.floor(rnd() * (pool.length - 1));
  if (j >= i) j++;
  return cost(pool[j], now, tauMs) < cost(pool[i], now, tauMs) ? pool[j] : pool[i];
}
// 요청 시작: pending++ / 응답 완료: pending--, decay(n, now, rtt, tau)
```

### 구현별 차이 (소스 기준)

| | Finagle `PeakEwma` | tower `PeakEwma` | Linkerd2 프록시 |
| --- | --- | --- | --- |
| 지연 기록이 없을 때 | 진행 중 요청이 0 이면 비용 0(첫 요청을 받음), 첫 응답 전 진행 중 요청이 있으면 큰 벌점(`Long.MaxValue >> 16` + pending) | 생성 시 받은 `default_rtt` 를 초기 추정치로 사용 | tower 사용. 컨트롤 플레인 클라이언트는 `default_rtt` 30 ms, `decay` 10 s 상수 |
| RTT 측정 구간 | 서비스 획득부터 해당 서비스 `close` 까지 | 응답 완료 추적 방식(`completion`)에 따름 | 컨트롤 플레인은 첫 데이터 수신까지(`PendingUntilFirstData`) |
| 감쇠 시간 | `decayTime`, 문서상 기본 10 s | 생성자 인자 | 데이터 플레인은 정책에서 받음(값은 확인하지 않음) |

Linkerd 문서는 HTTP, HTTP/2, gRPC 는 요청 단위로, TCP 는 연결 단위로 균형을 잡으며, 알고리즘을 EWMA 라고만 설명한다. linkerd2-proxy 소스(main 브랜치, 2026-11-19 조회)에는 새 엔드포인트의 초기 RTT 가 너무 작으면 P2C 가 그 엔드포인트를 과하게 고른다는 이유로 `default_rtt` 에 1 ms 하한을 두는 코드가 있다.

## 직접 실행: 시뮬레이션

Node 스크립트, 시드 고정, 외부 라이브러리 없음. 백엔드 10 대, 각자 작업자 4 개와 FIFO 큐, 서비스 시간 지수분포 평균 10 ms, 포아송 도착 초당 2,500 건(정상 용량의 약 62%). 60 초 중 처음 10 초는 버렸고, 60 초 시점에 끝나지 않은 요청은 그때까지의 대기 시간으로 넣었다. EWMA 는 tower 방식(`default_rtt` 30 ms)이다. 시드 3 개의 대표값이고, p99.9 는 시드 간 차이를 범위로 적었다.

**1) 한 대가 상시 10 배 느림(평균 100 ms)**

| 정책 | 느린 서버 몫 | 평균 ms | p50 | p99 | p99.9 |
| --- | --- | --- | --- | --- | --- |
| 무작위 | 10.0% | 약 2,500 | 10.4 | 약 45,000 | 약 49,500 |
| P2C least loaded | 1.6% | 12.2 | 7.5 | 77 | 311~317 |
| P2C Peak EWMA, τ=10 s | 0.2% | 10.9 | 7.7 | 49 | 93~119 |
| P2C Peak EWMA, τ=1 s | 0.4% | 11.0 | 7.8 | 50 | 132~145 |

- 무작위는 느린 서버에 초당 약 250 건을 보내는데, 그 서버의 처리 능력은 작업자 4 개 ÷ 100 ms = 초당 40 건이다. 큐가 끝없이 자라 실행 종료 시점에 약 12,400 건이 남았다(이 값들은 종료 시점까지의 대기 시간으로 넣은 하한이다).
- least loaded 는 느린 서버 몫을 1.6%(초당 약 40 건, 그 서버 용량과 거의 같음)로 줄였다. 큐가 포화 근처에서 흔들려 p99.9 가 300 ms 를 넘었다.
- Peak EWMA 는 느린 서버를 0.2~0.4% 로 거의 끊었다. p99.9 가 least loaded 의 약 1/3 이다.

**2) 한 대가 5 초마다 0.5 초 멈춤(그 동안 시작한 요청은 멈춤이 끝날 때까지 대기)**

| 정책 | 멈추는 서버 몫 | 평균 ms | p99 | p99.9 |
| --- | --- | --- | --- | --- |
| 무작위 | 9.7~9.9% | 18.5 | 301~339 | 482~497 |
| P2C least loaded | 9.0% | 10.4 | 47 | 77~78 |
| P2C Peak EWMA, τ=10 s | 0.7~0.9% | 10.6 | 47 | 70~72 |
| P2C Peak EWMA, τ=1 s | 5.9~6.0% | 10.8 | 48 | 83~87 |

- 간헐적 멈춤에서는 least loaded 도 충분했다. 멈춘 동안 진행 중 요청이 바로 쌓이므로 그 서버가 덜 뽑힌다.
- Peak EWMA(τ=10 s)는 꼬리를 약간 더 줄였지만 **멈추는 서버를 90% 이상 시간 동안 정상인데도 거의 쓰지 않았다**(몫 0.8%). 500 ms 최고치가 10 초 감쇠로 오래 남기 때문이다. 클러스터 용량의 약 9% 를 놀린 셈이다.
- τ=1 s 는 회복이 빨라 몫이 6% 로 돌아왔고, 대신 꼬리는 least loaded 보다 약간 나빴다.

실행: `node ewma.mjs slow <seed>`, `node ewma.mjs stall <seed>`(seed 1~3). 스크립트는 저장소에 넣지 않았다.

## 언제 쓰나

- 백엔드 간 **응답 시간 편차**가 진행 중 요청 수보다 중요한 RPC·HTTP 클라이언트(사이드카 프록시, 서비스 메시, 클라이언트 측 로드 밸런싱).
- 일부 인스턴스가 GC, 시끄러운 이웃, 느린 디스크로 **지속적으로 느려지는** 환경에서 꼬리 지연을 줄이고 싶을 때.
- 요청 비용이 대체로 비슷하고, 느린 서버의 응답 시간이 다음 요청에도 이어진다고(회복에 시간이 걸린다고) 볼 수 있을 때. Finagle 문서도 이 가정을 명시한다.

## 주의 (비용)

- **느린 회복**: 최고치는 즉시 반영하고 내려갈 때만 천천히 내린다. 한 번 튄 서버는 τ 동안 덜 뽑힌다. 위 2) 처럼 짧은 멈춤에도 용량을 오래 버릴 수 있다. τ 를 줄이면 회복은 빨라지지만 잡음에 더 흔들린다.
- **가정이 깨지는 트래픽**: Finagle 문서는 롱 폴링 클라이언트에서 "부하가 걸린 서버는 회복에 시간이 걸린다"는 가정이 성립하지 않는다고 경고한다. 원래 오래 걸리도록 설계된 요청(스트리밍, 롱 폴링)이 섞이면 RTT 가 서버 상태가 아니라 요청 종류를 반영한다.
- **요청 종류 혼합**: 같은 백엔드에 1 ms 요청과 1 s 요청이 섞이면 최고치가 무거운 요청에 끌려 다닌다. 엔드포인트별·경로별로 밸런서를 나누거나 다른 신호를 쓴다.
- **빨리 실패하는 서버**: 오류를 즉시 돌려주는 서버는 RTT 가 짧아 비용이 낮다. least loaded 와 같은 블랙홀 문제가 남는다. Linkerd2 프록시 소스에 응답 실패에 벌점을 주는 별도 추정기(`PenaltyPeakEwma`)가 있는데, 이 노트에서는 동작을 확인하지 않았다. 헬스 체크·이상치 제거와 같이 쓴다.
- **새 서버의 초기값**: 기록이 없을 때 추정치가 너무 작으면 새 서버가 몰려 받는다(Linkerd 소스의 1 ms 하한 주석). 너무 크면 새 서버가 한동안 논다. Finagle 은 기록 없는 서버에 첫 요청 하나를 보내고, 그 응답이 올 때까지 큰 벌점을 준다. 오토스케일링 직후 동작을 확인한다.
- **관측 범위는 클라이언트 하나다.** 각 클라이언트·프록시가 자기 요청만 잰다. 트래픽이 적은 클라이언트는 표본이 적어 추정이 거칠다.
- 위 1) 과 2) 에서 least loaded 대비 이득이 크게 달랐듯, **정책 간 차이는 부하 수준과 장애 모양에 따라 바뀐다.** 자기 트래픽으로 재 본다.
- 과부하 자체는 해결하지 않는다 → [백프레셔·로드 셰딩](/develop-wiki/knowledge/performance/backpressure-load-shedding/), [재시도 예산](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/).

## 비교

| 신호 | 반응 속도 | 회복 | 약점 |
| --- | --- | --- | --- |
| 진행 중 요청 수(least loaded) | 큐가 쌓여야 반응 | 즉시 | 요청 시간을 모름, 느린 서버의 꼬리 |
| Peak EWMA × (pending+1) | 한 번의 느린 응답에 즉시 반응 | τ 에 걸쳐 천천히 | 용량을 오래 놀림, 요청 종류 혼합에 약함 |
| 일반 EWMA(최고치 즉시 반영 없음) | 평균이 움직일 때까지 느림 | 대칭 | 이 노트에서 측정하지 않음 |
| [요청 헤징](/develop-wiki/knowledge/performance/hedged-requests-tied-requests/) | 보낸 뒤 늦으면 하나 더 | 해당 없음 | 추가 부하 |

Peak EWMA 는 **어디로 보낼지**를, 헤징은 **보낸 뒤 늦을 때**를 다룬다. 둘은 같이 쓸 수 있다.

## 검증 범위

Finagle 클라이언트 가이드(로드 밸런서 절), Finagle `PeakEwma.scala`·`P2CPeakEwma.scala`·`util/Ema.scala`(develop 브랜치), tower `load/peak_ewma.rs`(master), linkerd2-proxy 의 `linkerd/proxy/balance/src/lib.rs`, `linkerd/app/core/src/control.rs`, `linkerd/app/outbound/src/http/concrete/balance.rs`(main), Linkerd 로드 밸런싱 기능 문서를 2026-11-19 에 읽었다. 소스는 브랜치 최신본이라 릴리스 버전과 다를 수 있다. Linkerd 데이터 플레인의 실제 `decay`·`default_rtt` 기본값(컨트롤 플레인 정책에서 내려옴)은 확인하지 않았다. 시뮬레이션은 단일 프로세스 이산 사건 모델이며 실제 Finagle·Linkerd 를 띄워 재지 않았다.
