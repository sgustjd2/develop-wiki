---
title: CoDel과 적응형 LIFO (대기 시간 기반 큐 관리)
aka: [CoDel, Controlled Delay, Adaptive LIFO, Sojourn Time, Standing Queue, Bufferbloat, AQM, 큐 지연 제어]
category: performance
level: advanced
summary: 큐 길이 대신 요청이 큐에서 기다린 시간(sojourn time)을 보고 지속적인 대기열만 줄이는 CoDel 과, 대기열이 생기면 최신 요청부터 처리하는 적응형 LIFO 의 원리와 효과.
tags: [codel, adaptive-lifo, queue-management, load-shedding, latency, overload, sojourn-time, aqm]
related: [performance/priority-load-shedding, performance/backpressure-load-shedding, performance/metastable-failures-retry-storm, performance/queueing-theory-utilization-latency, performance/concurrency-limits-littles-law, performance/timeout-retry-circuit-breaker, performance/adaptive-throttling-retry-budget]
sources:
  - https://www.rfc-editor.org/rfc/rfc8289.html
  - https://queue.acm.org/detail.cfm?id=2839461
  - https://blog.acolyer.org/2015/11/19/fail-at-scale-controlling-queue-delay/
updatedAt: 2026-11-19
---

## 문제

과부하에서 대기열이 길어지면 모든 요청이 오래 기다린다. 선입선출(FIFO)이면 **맨 앞에서 처리되는 요청이 가장 오래 기다린 요청**이라 클라이언트가 이미 포기했을 가능성이 가장 높다. 서버는 쓸모없어진 일에 용량을 쓰고, 새 요청은 그 뒤에서 기다리다 역시 포기한다. 처리량은 있는데 유용한 일은 0 에 가까워진다([메타안정 장애](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/)).

큐 길이 임계값("100개 넘으면 거절")은 처리 속도가 변하면 의미가 달라진다. 100개가 10 ms 인지 10초인지 알 수 없다.

## CoDel: 기다린 시간을 잰다

CoDel(Controlled Delay, RFC 8289)은 네트워크 라우터의 bufferbloat 을 줄이려고 만든 큐 관리 알고리즘이다. 아이디어는 서비스 환경에도 그대로 옮겨진다.

- **측정 대상은 sojourn time**, 곧 요청이 큐에서 보낸 시간이다. 길이·바이트·속도가 아니다.
- **구간 내 최솟값**을 본다. 평균은 일시적 버스트를 지속적 큐로 오인한다. 최솟값조차 0 이 되지 않으면 큐가 한 번도 비지 않았다는 뜻이고, 그것이 **standing queue(나쁜 큐)** 다. 버스트로 잠깐 생겼다 사라지는 큐는 **좋은 큐**라 둔다.
- 기본값은 `target` 5 ms(허용하는 지속 지연), `interval` 100 ms(최솟값을 보는 창). 일반 인터넷에서는 튜닝이 필요 없다고 RFC 는 말한다. 이 값은 100 ms 안팎 RTT 에 맞춘 것이므로 요청 처리 서비스에서는 서비스 시간 규모에 맞게 다시 잡아야 한다.
- 동작: 최소 sojourn 이 `target` 을 넘은 상태가 `interval` 동안 이어지면 **드롭 상태**에 들어간다. 드롭은 꺼내는 시점(dequeue)에 한다. 첫 드롭 뒤 다음 드롭 시각은 이전 시각 + `interval / √드롭 횟수` 라 점점 촘촘해진다. sojourn 이 `target` 아래로 내려오면 드롭 상태를 나간다.
- 버퍼에 MTU 하나 미만만 남았으면 버리지 않는다. 링크가 놀지 않게 하려는 장치다.

## 적응형 LIFO

평소엔 FIFO 로 공정하게 처리하다가 **대기열이 생기면 LIFO** 로 바꾼다. 방금 도착한 요청은 아직 기다린 시간이 짧아 데드라인 안에 끝낼 확률이 높다. 오래 기다린 요청은 어차피 포기됐을 가능성이 높으니 뒤로 미룬다.

Facebook 의 "Fail at Scale"(ACM Queue 2016)은 CoDel 변형과 적응형 LIFO 를 함께 쓴다고 소개한다. 요약 글(Adrian Colyer)에 따르면 변형은 두 값을 쓴다. 큐가 N초 넘게 비지 않았으면 요청에 **짧은 타임아웃(M ms)** 을 줘 standing queue 를 막고, 그렇지 않으면 N초 타임아웃을 줘 버스트를 흡수한다. 짧은 타임아웃은 서버가 처리 능력보다 "조금만 더" 일을 받게 해 놀지 않게 하고, LIFO 는 새 요청이 그 짧은 데드라인을 맞출 확률을 높인다. M, N 의 값은 확인하지 못했다. (원문 ACM Queue 페이지는 접근이 막혀 읽지 못했고 요약 글로만 확인했다.)

## 직접 시뮬레이션

단일 서버(평균 서비스 10 ms, 지수 분포, 용량 약 100 req/s), 클라이언트 데드라인 500 ms. 도착률은 70 → 20~40초 구간 130(과부하) → 70 req/s. **데드라인 안에 끝난 요청만 "유익한 일"** 로 센다. 시드 5개 평균이다.

| 정책 | 과부하 중 유익한 처리(req/s) | 유익한 요청 p50 지연(ms) | p99(ms) | 과부하 직후 10초 유익한 처리 |
| --- | --- | --- | --- | --- |
| FIFO, 만료 요청도 처리 | 6 | 301 | 482 | 0 |
| FIFO, 만료 요청 폐기 | 79 | 476 | 500 | 70 |
| 적응형 LIFO, 만료 요청 폐기 | 99 | 18 | 317 | 70 |
| CoDel(target 20 ms, interval 200 ms), FIFO | 90 | 272 | 494 | 68 |
| 짧은 타임아웃(20 ms) 변형 + 적응형 LIFO | 96 | 17 | 455 | 69 |

- FIFO 가 만료 요청을 그대로 처리하면 용량 100 중 6 만 유익하다. 직후 10초에도 0 이고, 60~70초 구간에서도 63(도착은 70)으로 아직 밀린 일을 비우는 중이었다.
- **만료된 것을 버리는 것만으로** 79 가 된다. 하지만 성공한 요청도 거의 데드라인에 가깝게 기다린 것이다(p50 476 ms).
- LIFO 는 유익한 처리 99 에 중앙값 지연이 18 ms 다. 대신 **p99 가 p50 보다 훨씬 크다.** 앞쪽에 쌓인 요청은 버려지기 때문이다.
- CoDel 은 FIFO 의 단점을 일부만 해결한다. 서비스 규모(target 20 ms)에 맞춰 단순화한 구현이라 튜닝에 민감할 수 있다.

시뮬레이션 한계: 모든 요청이 같은 데드라인, 재시도 없음, 서버 하나, 단순화한 CoDel(RFC 의 의사코드를 읽지 않고 요약된 동작 설명을 따라 구현)이다. 숫자는 정책 간 **상대 비교** 용이다. LIFO 변형의 target·타임아웃 값은 이 시뮬레이션용으로 내가 고른 값이며 Facebook 의 설정이 아니다.

## 언제 쓰나

- 요청마다 클라이언트 데드라인이 있고, 포기된 요청에 서버가 일하는 낭비가 큰 시스템.
- 큐가 있는 워커 풀, 메시지 소비자, 프록시. 이미 [동시성 제한](/develop-wiki/knowledge/performance/concurrency-limits-littles-law/)을 둔 서비스에서 한 겹 더 방어가 필요할 때.
- 입구 차단은 [우선순위 부하 차단](/develop-wiki/knowledge/performance/priority-load-shedding/)과 함께 쓴다. 이쪽은 **큐 안에서** 어떤 요청을 먼저 처리하고 버릴지를 정한다.

## 주의 (비용)

- **LIFO 는 불공정하다.** 오래된 요청이 영원히 처리되지 않을 수 있다. 데드라인이 있는 상호작용 요청에만 쓰고, 순서가 중요한 작업(큐 소비, 로그 처리)에는 쓰지 않는다.
- **데드라인을 서버가 알아야 한다.** 클라이언트 타임아웃을 요청에 실어 보내지 않으면 "만료"를 판정할 수 없다(데드라인 전파).
- 버린 요청은 클라이언트에 빨리 실패로 알려야 한다. 조용히 버리면 클라이언트가 끝까지 기다린 뒤 재시도해 증폭이 생긴다 → [재시도 예산](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/).
- `target`/`interval` 은 환경 규모에 맞춰야 한다. 네트워크용 5 ms/100 ms 를 그대로 가져오지 않는다.
- 큐 관리는 **용량을 만들지 않는다.** 만성적 과부하는 용량 증설이나 [백프레셔](/develop-wiki/knowledge/performance/backpressure-load-shedding/)로 풀어야 한다.

## 비교

| 방식 | 판단 기준 | 장점 | 약점 |
| --- | --- | --- | --- |
| 큐 길이 상한 | 대기 건수 | 단순 | 처리 속도가 바뀌면 의미가 변함 |
| 고정 타임아웃(만료 폐기) | 요청별 데드라인 | 낭비 제거 | 응답이 데드라인 가까이에서 끝남 |
| CoDel | 최소 sojourn 시간 | 버스트는 흡수, 지속 큐만 제거 | 환경별 파라미터 |
| 적응형 LIFO | 큐 존재 여부 | 최신 요청의 낮은 지연 | 불공정, 순서 깨짐 |
