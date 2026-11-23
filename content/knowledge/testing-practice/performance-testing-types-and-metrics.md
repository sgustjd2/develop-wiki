---
title: 성능 테스트 유형과 지표 (Load, Stress, Spike, Soak, Scalability)
aka: [Performance Testing Types, 부하 테스트, 스트레스 테스트, 스파이크 테스트, 소크 테스트, 지구력 테스트, TPS, 응답 시간]
category: testing-practice
level: intermediate
summary: 부하·스트레스·스파이크·소크(지구력)·확장성 테스트가 각각 무엇을 묻는지, 응답 시간·처리량·동시 사용자·백분위·오류율을 어떻게 읽는지 ISTQB CT-PT·k6·JMeter 문서 기준으로 정리하고 작은 모의로 계산한다.
tags: [performance-testing, load-testing, stress-testing, soak-test, spike-test, throughput, percentile, k6, jmeter, istqb]
related: [performance/concurrency-limits-littles-law, performance/queueing-theory-utilization-latency, performance/backpressure-load-shedding, performance/mg1-service-time-variance-tail-latency, testing-practice/test-types-classification, testing-practice/flaky-e2e-tests]
sources:
  - https://www.istqb.org/wp-content/uploads/2024/11/ISTQB-CT-PT_Syllabus_v1.0_2018.pdf
  - https://glossary.istqb.org/
  - https://grafana.com/docs/k6/latest/testing-guides/test-types/
  - https://grafana.com/docs/k6/latest/using-k6/metrics/reference/
  - https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/
  - https://grafana.com/docs/k6/latest/using-k6/thresholds/
  - https://jmeter.apache.org/usermanual/glossary.html
updatedAt: 2026-11-23
---

## 문제

"성능 테스트를 했다" 는 말은 정보가 거의 없다. 평소 부하에서 평균 응답이 빨랐다는 건지, 한계를 넘겼을 때 어떻게 무너지는지 봤다는 건지, 하루 종일 돌려도 메모리가 새지 않는지 봤다는 건지에 따라 질문과 결과가 다르다. 또 "평균 200ms" 와 "p95 200ms" 는 다른 약속이다. 이 노트는 유형(어떤 질문)과 지표(어떤 숫자)를 나누고, 작은 모의로 숫자가 어떻게 움직이는지 직접 계산해 본다.

## 핵심 용어

| 한국어 | 영어 | 정의(출처 기준 요약) |
| --- | --- | --- |
| 성능 테스트 | performance testing | 다양한 부하에서 시스템·컴포넌트의 응답성 등을 보는 테스트의 포괄 용어(CT-PT). 용어집은 성능 효율성을 판단하는 테스트 유형이라 정의 |
| 부하 테스트 | load testing | 예상되는 현실적 부하가 높아질 때의 처리 능력. 용어집: 낮음·보통·피크 사이의 가변 부하에서의 동작 |
| 스트레스 테스트 | stress testing | 예상·명세 한계 이상의 부하, 또는 CPU·대역폭·메모리 같은 자원이 줄었을 때의 동작 |
| 스파이크 테스트 | spike testing | 갑작스런 피크 부하에 정상 대응하고 이후 안정 상태로 돌아오는 능력 |
| 지구력(소크) 테스트 | endurance (soak) testing | 운영 맥락에 맞는 기간 동안의 안정성. 메모리 누수·DB 커넥션·스레드 풀 같은 자원 문제 확인 |
| 확장성 테스트 | scalability testing | 현재 요구를 넘는 미래 요구(사용자·데이터 증가)를 성능 요건을 깨지 않고 감당하는지 |
| 용량 테스트 | capacity testing | 성능 목표를 만족하면서 지원할 수 있는 사용자·트랜잭션 수 |
| 동시성 테스트 | concurrency testing | 여러 동작이 동시에 일어나는 상황(예: 동시 로그인)의 영향 |
| 가상 사용자 | virtual user (VU) | 사용자 운영 프로파일에 따른 활동의 모사 |
| 생각 시간 | think time | 사용자 동작 사이의 지연 |

위 정의는 ISTQB CT-PT 실러버스 1.2절과 용어집의 영어 정의를 한국어로 줄여 쓴 것이다.

## 유형: 부하 프로파일로 구분하기

k6 문서는 테스트 유형을 부하의 모양으로 나눈다. 아래 그림은 가로를 시간, 세로를 가상 사용자 수로 그린 개념 곡선이다. 수치는 의미가 없다.

<figure class="fig" role="group" aria-label="부하 프로파일의 모양(가로=시간, 세로=가상 사용자 수). 실제 수치가 아닌 개념 곡선이다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스모크: 낮은 VU, 짧게(k6)"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><text x="113" y="74" class="f-muted" text-anchor="end" font-size="6">시간</text><text x="14" y="8" class="f-muted" text-anchor="middle" font-size="6">VU</text><path d="M14 62 L30 56 L100 56 L112 62" class="f-arc" fill="none"/></svg><span>스모크: 낮은 VU, 짧게(k6)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="부하·평균 부하: 예상 수준 유지"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><text x="113" y="74" class="f-muted" text-anchor="end" font-size="6">시간</text><text x="14" y="8" class="f-muted" text-anchor="middle" font-size="6">VU</text><path d="M14 62 L32 34 L92 34 L112 62" class="f-arc" fill="none"/></svg><span>부하·평균 부하: 예상 수준 유지</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스트레스: 한계 이상으로 단계 상승"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><text x="113" y="74" class="f-muted" text-anchor="end" font-size="6">시간</text><text x="14" y="8" class="f-muted" text-anchor="middle" font-size="6">VU</text><path d="M14 62 L28 40 L44 40 L58 24 L74 24 L88 12 L104 12 L112 62" class="f-arc" fill="none"/></svg><span>스트레스: 한계 이상으로 단계 상승</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스파이크: 갑작스런 짧은 급증"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><text x="113" y="74" class="f-muted" text-anchor="end" font-size="6">시간</text><text x="14" y="8" class="f-muted" text-anchor="middle" font-size="6">VU</text><path d="M14 62 L30 34 L70 34 L72 10 L80 10 L82 34 L112 34" class="f-arc" fill="none"/></svg><span>스파이크: 갑작스런 짧은 급증</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="소크·지구력: 평균 부하를 오래"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><text x="113" y="74" class="f-muted" text-anchor="end" font-size="6">시간</text><text x="14" y="8" class="f-muted" text-anchor="middle" font-size="6">VU</text><path d="M14 62 L26 36 L102 36 L112 62" class="f-arc" fill="none"/></svg><span>소크·지구력: 평균 부하를 오래</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="한계점(breakpoint): 깨질 때까지 증가(k6)"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><text x="113" y="74" class="f-muted" text-anchor="end" font-size="6">시간</text><text x="14" y="8" class="f-muted" text-anchor="middle" font-size="6">VU</text><path d="M14 62 L100 10" class="f-arc" fill="none"/></svg><span>한계점(breakpoint): 깨질 때까지 증가(k6)</span></div></div><figcaption>부하 프로파일의 모양(가로=시간, 세로=가상 사용자 수). 실제 수치가 아닌 개념 곡선이다. 직접 그린 도식.</figcaption></figure>

| 유형 | 묻는 질문 | k6 문서의 부하 형태 |
| --- | --- | --- |
| 스모크 | 스크립트가 돌고 최소 부하는 처리하나? | 낮은 VU, 수 초~수 분. 최소 부하에서 스크립트와 시스템이 동작하는지 보는 용도(k6 문서)이며, 용량 확인용이 아니라는 설명은 필자 해석 |
| 평균 부하 | 평소 수준에서 괜찮은가? | 운영 평균 수준, 대략 5~60분 |
| 스트레스 | 평균을 넘으면 어떻게 동작하나? | 평균보다 높게, 대략 5~60분 |
| 소크 | 오래 돌려도 괜찮은가? | 평균 부하를 몇 시간 |
| 스파이크 | 갑작스런 짧은 급증을 버티나? | 매우 높은 부하를 몇 분 |
| 한계점(breakpoint) | 어디서 깨지나? | 깨질 때까지 점진 증가. 몇 번만 실행 |

- k6 문서는 이 분류가 상대적이라고 경고한다. 어떤 앱의 스트레스 테스트가 다른 앱에서는 평균 부하일 수 있다.
- 단순한 램프업-플래토-램프다운 모양을 쓰고, 오르내림을 반복하는 롤러코스터 패턴은 피하라고 한다. 스모크부터 시작해 큰 테스트로 가라고 권한다. 하나의 유형이 모든 위험을 덮지 못하므로 시스템의 위험에 맞춰 조합한다.
- ISTQB 와 k6 의 이름이 일대일이 아니다. ISTQB 는 "지구력" 이라 부르는 것을 k6 는 "소크" 라고 한다. ISTQB 의 확장성·용량은 부하의 모양이 아니라 "무엇을 알아내려는가" 에 가깝고, k6 의 "한계점" 은 ISTQB 정의에 별도 항목이 없다(용량 테스트와 목적이 겹치는 것으로 보이나 이는 필자의 해석이다).

## 지표: 무엇을 재는가

CT-PT 는 성능 지표 표에서 가상 사용자 상태(성공·실패 수), 트랜잭션 응답 시간(최소·최대·평균·90 백분위), 초당 트랜잭션 수, 초당 히트, 처리량(bits/s), 초당 HTTP 응답 수 등을 든다.

- **가상 사용자 상태를 먼저 본다.** 시뮬레이션 사용자들이 맡은 일을 끝냈는지부터 확인한다. 오류가 있으면 다른 수치가 오염될 수 있기 때문이다.
- **평균은 이상치에 끌린다.** CT-PT 는 평균이 단순한 산술 평균일 뿐 성능을 대표하지 않을 수 있다고 하고, 90 백분위를 목표로 삼는 경우가 많다고 한다. 100% 준수를 요구하는 것은 자원이 과도하게 들고 사용자 체감 효과는 작을 수 있어 권하지 않는다.
- **처리량(throughput)** 은 CT-PT 에서 단위 시간당 처리한 특정 유형 트랜잭션 수(예: 시간당 주문, 초당 HTTP 요청)다. 네트워크 처리량(전송 데이터 양)과 구별한다. JMeter 용어집의 throughput 은 요청 수를 첫 샘플 시작부터 마지막 샘플 종료까지의 시간으로 나눈 값이다.
- **지연(latency)·경과 시간(elapsed time)** 은 도구마다 뜻이 다르다. JMeter 는 elapsed 를 요청 직전부터 마지막 응답 바이트 도착까지, latency 를 요청 직전부터 첫 응답 데이터 도착까지로 정의한다. k6 의 `http_req_duration` 은 송신+대기+수신의 합이며 초기 DNS·연결 시간을 제외한다. 같은 "응답 시간" 이라도 도구가 다르면 값이 다르다.
- **동시 사용자**: CT-PT 는 동시성(concurrency)을 병렬 실행 스레드(대화형이면 병렬 사용자) 수로 정의하고, 같은 처리량이어도 동시성이 다르면 자원 사용이 다르다고 한다. 사용자 수만으로는 부하를 정의할 수 없다. 사용자 500명이 분당 한 번씩 질의하면 시간당 30,000건이고, 시간당 한 번씩이면 500건으로 60배 차이가 난다(CT-PT 의 예).
- **오류율**: k6 의 `http_req_failed` 는 실패한 요청 비율(Rate)이다. 임계값은 `rate<0.01` 처럼 비율로 쓰고, 백분위는 `p(95)<200` 형태로 쓴다. 임계값이 깨지면 종료 코드가 0 이 아니게 되어 CI 에서 실패로 쓸 수 있다.

### 폐쇄형과 개방형

CT-PT 는 일반적인 테스트 구성이 사용자 수가 고정된 폐쇄형 시스템이고, 많은 공개 시스템은 새 사용자가 계속 도착하는 개방형이라고 구분한다. k6 문서도 같은 구분을 한다. 폐쇄형은 이전 반복이 끝나야 다음이 시작되므로 시스템이 느려지면 도착률이 줄어 부하가 스스로 낮아진다. 특정 도착률(RPS)을 유지하려면 `constant-arrival-rate`, `ramping-arrival-rate` 같은 개방형 실행기가 낫다고 설명한다.

## 직접 실행: 폐쇄형 모의

단일 서버(서비스 시간 지수분포 평균 20ms, FIFO 큐), 가상 사용자 N명, 생각 시간 지수분포 평균 1초, 60초 구간을 Node 로 모의했다(난수 시드 고정, 필자 작성 코드. 코드는 저장소에 두지 않았고 같은 모델을 시드만 바꿔 다시 돌리면 표 값과 정확히 같지는 않다(시드 의존 값). 실제 시스템이 아니라 개념 확인용이다).

```ts
// 핵심 루프(요약): 요청마다 대기+서비스를 계산하고, 끝나면 생각 시간 뒤 다음 도착을 예약한다
const start = Math.max(arrival, serverFree);
const end = start + exp(rand, 20);       // 서비스 시간
serverFree = end;
const response = end - arrival;          // 응답 시간 = 큐 대기 + 서비스
```

| VU(N) | 요청 수 | TPS | 평균(ms) | p50 | p95 | p99 | 1초 초과 비율 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 536 | 8.9 | 22.6 | 15.7 | 67.7 | 103.2 | 0% |
| 30 | 1721 | 28.7 | 36.8 | 27.1 | 103.9 | 149.8 | 0% |
| 50 | 2767 | 46.1 | 112.5 | 93.6 | 277.3 | 383.8 | 0% |
| 60 | 3025 | 50.4 | 222.5 | 208.1 | 477.9 | 602.4 | 0% |
| 80 | 3109 | 51.8 | 584.7 | 564.7 | 938.8 | 1052.6 | 2.41% |
| 120 | 3145 | 52.4 | 1344.5 | 1331.9 | 1789.8 | 1883.9 | 94.85% |

<figure class="fig" role="group" aria-label="직접 실행한 모의 결과(서비스 시간 평균 20ms 단일 서버, 생각 시간 평균 1초). VU 가 60을 넘으면 처리량은 포화하고 지연만 는다. 직접 그린 도식."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 128 80" role="img" aria-label="TPS(요청/초) vs VU 수"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><rect x="22" y="58.583333333333336" width="12" height="7.416666666666667" rx="1" class="f-fill-blue"/><text x="28" y="55.583333333333336" class="f-text" text-anchor="middle" font-size="5.5">8.9</text><text x="28" y="74" class="f-muted" text-anchor="middle" font-size="5.5">10</text><rect x="40" y="42.08333333333333" width="12" height="23.916666666666668" rx="1" class="f-fill-blue"/><text x="46" y="39.08333333333333" class="f-text" text-anchor="middle" font-size="5.5">28.7</text><text x="46" y="74" class="f-muted" text-anchor="middle" font-size="5.5">30</text><rect x="58" y="27.583333333333336" width="12" height="38.416666666666664" rx="1" class="f-fill-blue"/><text x="64" y="24.583333333333336" class="f-text" text-anchor="middle" font-size="5.5">46.1</text><text x="64" y="74" class="f-muted" text-anchor="middle" font-size="5.5">50</text><rect x="76" y="24" width="12" height="42" rx="1" class="f-fill-blue"/><text x="82" y="21" class="f-text" text-anchor="middle" font-size="5.5">50.4</text><text x="82" y="74" class="f-muted" text-anchor="middle" font-size="5.5">60</text><rect x="94" y="22.833333333333336" width="12" height="43.166666666666664" rx="1" class="f-fill-blue"/><text x="100" y="19.833333333333336" class="f-text" text-anchor="middle" font-size="5.5">51.8</text><text x="100" y="74" class="f-muted" text-anchor="middle" font-size="5.5">80</text><rect x="112" y="22.333333333333336" width="12" height="43.666666666666664" rx="1" class="f-fill-blue"/><text x="118" y="19.333333333333336" class="f-text" text-anchor="middle" font-size="5.5">52.4</text><text x="118" y="74" class="f-muted" text-anchor="middle" font-size="5.5">120</text></svg><span>TPS(요청/초) vs VU 수</span></div><div class="fig-item"><svg viewBox="0 0 128 80" role="img" aria-label="p95 응답 시간(ms) vs VU 수"><line x1="14" y1="66" x2="112" y2="66" class="f-line"/><line x1="14" y1="10" x2="14" y2="66" class="f-line"/><rect x="22" y="64.21052631578948" width="12" height="1.789473684210526" rx="1" class="f-fill-amber"/><text x="28" y="61.21052631578947" class="f-text" text-anchor="middle" font-size="5.5">68</text><text x="28" y="74" class="f-muted" text-anchor="middle" font-size="5.5">10</text><rect x="40" y="63.26315789473684" width="12" height="2.736842105263158" rx="1" class="f-fill-amber"/><text x="46" y="60.26315789473684" class="f-text" text-anchor="middle" font-size="5.5">104</text><text x="46" y="74" class="f-muted" text-anchor="middle" font-size="5.5">30</text><rect x="58" y="58.71052631578947" width="12" height="7.2894736842105265" rx="1" class="f-fill-amber"/><text x="64" y="55.71052631578947" class="f-text" text-anchor="middle" font-size="5.5">277</text><text x="64" y="74" class="f-muted" text-anchor="middle" font-size="5.5">50</text><rect x="76" y="53.421052631578945" width="12" height="12.578947368421053" rx="1" class="f-fill-amber"/><text x="82" y="50.421052631578945" class="f-text" text-anchor="middle" font-size="5.5">478</text><text x="82" y="74" class="f-muted" text-anchor="middle" font-size="5.5">60</text><rect x="94" y="41.28947368421052" width="12" height="24.710526315789476" rx="1" class="f-fill-amber"/><text x="100" y="38.28947368421052" class="f-text" text-anchor="middle" font-size="5.5">939</text><text x="100" y="74" class="f-muted" text-anchor="middle" font-size="5.5">80</text><rect x="112" y="18.89473684210526" width="12" height="47.10526315789474" rx="1" class="f-fill-amber"/><text x="118" y="15.89473684210526" class="f-text" text-anchor="middle" font-size="5.5">1790</text><text x="118" y="74" class="f-muted" text-anchor="middle" font-size="5.5">120</text></svg><span>p95 응답 시간(ms) vs VU 수</span></div></div><figcaption>직접 실행한 모의 결과(서비스 시간 평균 20ms 단일 서버, 생각 시간 평균 1초). VU 가 60을 넘으면 처리량은 포화하고 지연만 는다. 직접 그린 도식.</figcaption></figure>

관찰한 것:

- 처리량은 VU 를 늘려도 서버의 최대 처리율(1/20ms = 50 TPS)에서 포화한다. 52.4 가 50 을 조금 넘는 것은 난수와 집계 방식(구간 경계에서 요청을 세는 기준) 때문으로 보인다. 집계 기준은 노트에 따로 기록하지 않았다.
- 포화 이후에는 VU 를 늘려도 일은 늘지 않고 큐에서 기다리는 시간만 늘어난다. 평균 응답 시간이 22.6ms 에서 1344.5ms 로 올랐다.
- N=10 에서도 평균(22.6)과 p95(67.7)는 3배 차이가 난다. 평균만 보면 꼬리를 놓친다.
- CT-PT 의 식 `처리량 = VU 수 / (처리 시간 + 생각 시간)` 은 모의 결과와 대체로 맞았다(N=50 에서 식 44.9, 실측 46.1. 생각 시간이 확률적이라 근사). 리틀의 법칙과의 관계는 [동시성 제한과 리틀의 법칙](/develop-wiki/knowledge/performance/concurrency-limits-littles-law/)과 [큐잉 이론: 이용률과 지연](/develop-wiki/knowledge/performance/queueing-theory-utilization-latency/)에서 다룬다.
- 이 모의는 "스트레스 테스트에서 처리량 포화 + 지연 폭증" 의 모양을 보여 줄 뿐, 실서비스에서 재시도·타임아웃이 부하를 증폭하는 효과는 넣지 않았다.

## 언제 쓰나

- 배포 파이프라인에는 스모크 수준의 가벼운 부하 + 임계값을, 릴리스 전에는 평균·스트레스, 인프라 변경 전에는 소크·확장성을 두는 식으로 목적별로 나눈다(필자 제안).
- SLO 가 백분위로 정의돼 있으면 테스트 임계값도 같은 백분위로 쓴다.
- 도착률이 외부에서 정해지는 서비스(공개 API)는 개방형 모델로 설계한다.

## 주의

- 테스트 환경이 운영과 다르면 숫자의 절대값은 의미가 약하다. 비교(전후, 기준선 대비)에 쓴다. CT-PT 는 기준선(baseline) 지표를 두고 비교하라고 한다.
- 부하 생성기 자체가 병목이면 서버를 잰 것이 아니다.
- 한계점 테스트나 스트레스 테스트는 의존 시스템·공유 환경에 피해를 줄 수 있으므로 범위를 정해야 한다.
- 레벨·유형 분류에서 성능 테스트는 비기능 유형이다. [테스트 레벨과 유형 분류](/develop-wiki/knowledge/testing-practice/test-types-classification/) 참조.

## 검증 범위

- 읽은 것: ISTQB CT-PT v1.0 (2018) 실러버스 1.2·성능 지표·4.2.5, ISTQB 용어집 정의(부하·스트레스·스파이크·지구력·확장성·용량 등), k6 공식 문서(테스트 유형, 지표 참조, 임계값, 개방형·폐쇄형), Apache JMeter 사용자 매뉴얼 용어집.
- 못 읽은 것: JMeter 의 Aggregate/Summary Report 열 정의(컴포넌트 레퍼런스), ISO/IEC/IEEE 29119 원문(유료, 열람하지 않음).
- 미확인: k6 의 한계점 테스트와 ISTQB 용량 테스트의 정확한 대응. 모의는 필자가 직접 실행한 가상 계산이며 실측이 아니다.
