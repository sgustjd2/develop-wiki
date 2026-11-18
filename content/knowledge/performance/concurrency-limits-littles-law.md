---
title: 동시성 제한과 리틀의 법칙
aka: [Concurrency Limits, Little's Law, Adaptive Concurrency, In-flight Requests, Vegas, Gradient2, AIMD, 동시 처리 한도]
category: performance
level: intermediate
summary: 시스템 안에 머무는 평균 요청 수 = 도착률 × 평균 체류 시간(L = λW). 처리율이 아닌 동시 처리 수를 제한하고 지연 변화에 맞춰 한도를 조정하는 방법과 한계.
tags: [concurrency, littles-law, queueing, load-shedding, adaptive-limit, netflix, capacity-planning]
related: [performance/rate-limiting, performance/backpressure-load-shedding, performance/bulkhead, performance/connection-pool, performance/timeout-retry-circuit-breaker, performance/load-balancing, performance/profiling]
sources:
  - https://en.wikipedia.org/wiki/Little%27s_law
  - https://doi.org/10.1287/opre.9.3.383
  - https://github.com/Netflix/concurrency-limits
  - https://sre.google/sre-book/handling-overload/
  - https://builder.aws.com/content/3Eun1EEyX6p2e3VYNyRLSJzLuMV/using-load-shedding-to-avoid-overload
updatedAt: 2026-11-19
---

## 문제

서버에 초당 몇 건까지 허용할지(**처리율 제한**)는 부하 테스트로 정한다. 그런데 의존하는 DB 가 느려지거나 인스턴스 수가 바뀌면 그 숫자는 바로 틀린다. 요청 수가 같아도 **요청 하나가 시스템에 머무는 시간**이 길어지면 동시에 처리 중인 요청이 쌓이고, 스레드·커넥션·메모리가 바닥나면서 지연이 더 늘고, 클라이언트 타임아웃과 재시도가 부하를 더 얹는다. AWS Builders' Library 는 지연이 타임아웃을 넘는 순간 지연 문제가 가용성 문제가 되고 재시도가 되먹임을 만든다고 설명한다.

필요한 것은 "초당 몇 건"이 아니라 "**지금 동시에 몇 건이 안에 있나**"를 직접 다루는 관점이다.

## 리틀의 법칙

안정된(정상 상태) 시스템에서

> **L = λ × W**
> L = 시스템 안에 머무는 평균 요청 수, λ = 평균 도착률(처리율), W = 평균 체류 시간(지연)

Wikipedia 에 따르면 이 관계는 도착 분포, 서비스 시간 분포, 처리 순서와 무관하게 성립하고, 요구 조건은 시스템이 안정 상태라는 것뿐이다. John Little 이 1961년에 증명했다. 쓰임새는 다음과 같다.

- **용량 산정**: 초당 200건, 평균 50ms 면 L = 200 × 0.05 = **10건이 동시에 처리 중**이다. 워커·커넥션·스레드가 이만큼은 있어야 한다.
- **지연 악화의 영향**: 도착률은 그대로인데 W 가 10배(의존성 지연)가 되면 L 도 10배다. 풀이 작으면 대기열이 생긴다.
- **측정이 안 되는 값 구하기**: 평균 동시 처리 수와 처리율을 알면 W = L / λ 로 평균 지연을 얻는다.

시뮬레이션으로 확인했다. 포아송 도착 λ = 100/s, 워커 8개, 서비스 시간 평균 50ms 로 400초를 돌리고 "지금 시스템 안에 몇 개"를 0.01초마다 직접 세어 평균 낸 값이 **L = 5.12**, 측정한 λ·W 는 98.8 × 51.7ms = **5.11** 이었다.

```ts
// 포아송 도착(λ), 워커 c 개, 서비스 시간 지수분포(평균 s). 시스템 안(대기+처리) 요청이 cap 이상이면 거절
function simulate(lambda: number, s: number, c: number, cap: number, T = 2000) {
  let x = 1; const rnd = () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) + 0.5) / 2 ** 32;
  const exp = (mean: number) => -mean * Math.log(rnd());
  const free = new Array<number>(c).fill(0);
  const stays: [number, number][] = [];            // 받아들인 요청의 [도착, 퇴장]
  let t = 0, rejected = 0, j = 0;
  const live: number[] = [];
  while ((t += exp(1 / lambda)) < T) {
    while (live.length && Math.min(...live) <= t) live.splice(live.indexOf(Math.min(...live)), 1);
    if (live.length >= cap) { rejected++; continue; }
    const w = free.indexOf(Math.min(...free)), end = Math.max(t, free[w]) + exp(s);
    free[w] = end; live.push(end); stays.push([t, end]);
  }
  // L: 0.01초 간격으로 "지금 시스템 안에 몇 개 있나"를 직접 센 시간 평균 (λ·W 와 독립적으로 측정)
  let sum = 0, n = 0;
  for (let u = 100; u < T - 100; u += 0.01, n++) { while (j < stays.length && stays[j][1] < u) j++; sum += stays.filter(([a, b], i) => i >= j && a <= u && b > u).length; }
  const lam = stays.length / T, W = stays.reduce((a, [p, q]) => a + q - p, 0) / stays.length;
  return { L: sum / n, lam, W, rejected };
}
const r = simulate(100, 0.05, 8, 1_000, 400);
console.log(`L=${r.L.toFixed(2)}  λ·W=${(r.lam * r.W).toFixed(2)}  (λ=${r.lam.toFixed(1)}/s, W=${(r.W * 1000).toFixed(1)}ms)`);
const capped = simulate(200, 0.05, 8, 12, 400);           // 과부하(ρ=1.25): 동시성 12 로 제한
console.log(`cap=12: L=${capped.L.toFixed(2)}  λ_eff·W=${(capped.lam * capped.W).toFixed(2)}  W=${(capped.W * 1000).toFixed(0)}ms  거절 ${capped.rejected}`);
const uncapped = simulate(200, 0.05, 8, 1e9, 60);
console.log(`cap=∞ (60초): W=${(uncapped.W * 1000).toFixed(0)}ms  — 대기열이 계속 자란다`);
```

같은 워커 8개(처리 능력 약 160/s)에 200/s 를 넣는 과부하 실험 결과:

| 설정 | 평균 지연 W | 비고 |
| --- | --- | --- |
| 동시성 한도 12 | 63ms | 요청의 약 24%(19,280건/80,000건)를 거절하고 받은 요청은 빨리 처리 |
| 한도 없음(60초만) | 6,456ms | 대기열이 계속 자라 지연이 끝없이 커짐 |

한도는 과부하에서 **일부를 거절하는 대신 나머지의 지연을 지킨다.** 거절된 요청의 클라이언트는 빨리 실패하고 다른 곳을 찾는다.

## 해법: 동시성 한도 (in-flight limit)

서버가 처리 중인(대기 포함) 요청 수를 세어 **한도에 닿으면 즉시 거절**한다(HTTP 429/503, gRPC UNAVAILABLE). Netflix concurrency-limits 라이브러리의 README 는 한도의 출발점을 `Limit = 평균 RPS × 평균 지연`(리틀의 법칙)으로 소개하고, RPS 한도가 부하 테스트 값에 고정돼 오토스케일링 환경에서 낡는 점을 문제로 든다.

### 한도 자동 조정 (TCP 혼잡 제어에서 차용)

README 에 따르면 각 노드가 자기 한도를 스스로 추정하며, 측정한 지연이 최소 지연에서 벗어나면 큐가 생기기 시작한 신호로 본다.

| 알고리즘 | 아이디어 |
| --- | --- |
| **Vegas** | 큐 길이를 `L × (1 − minRTT / 샘플 RTT)` 로 추정. 표본 창마다 큐가 α(보통 2~3) 미만이면 한도 +1, β(보통 4~6) 초과면 −1 |
| **Gradient2** | 단기·장기 지연 지수 평균의 괴리가 지속되면 큐가 쌓이는 추세로 보고 한도를 크게 줄임. 최소 지연 기준의 편향·드리프트를 줄이는 목적 |
| **AIMD** | 손실(타임아웃·거절) 기반의 덧셈 증가·곱셈 감소(README 는 gRPC 클라이언트 절에서 이름만 언급) |

한도에 닿았을 때의 정책도 고른다. 즉시 거절(simple), 요청 유형별 몫 보장(예: 실시간 90%, 배치 10%), 클라이언트에서 호출자를 대기시키는 방식이 있다.

### 다른 접근

- **Google SRE**: 정해진 숫자 한도 대신 클라이언트가 최근 2분의 `요청 수`와 `수락 수`를 추적해 `요청 ≥ K × 수락` 이면 확률적으로 로컬에서 거절하는 **적응형 스로틀링**(K=2 선호)을 쓴다. 서버 쪽은 활성 스레드 수에 해당하는 "실행자 부하 평균"을 지수 감쇠로 평활해 임계를 넘으면 거절한다.
- **AWS Builders' Library**: 연결 수 상한(NGINX `max_conns` 등)은 부정확해 최후 수단으로만 쓰라고 한다. 지연, 처리량(goodput), 클라이언트 데드라인, 큐 대기 시간, 요청 우선순위 같은 **서버 로컬 정보**로 일찍 거절하는 방식을 권한다. 이 글은 리틀의 법칙을 본문에서 쓰지 않고 참고 자료로만 언급한다.

## 비교

| | 처리율 제한 | 동시성 제한 |
| --- | --- | --- |
| 단위 | 초당 요청 수 | 동시 처리 중인 요청 수 |
| 기준값 | 고정(부하 테스트) | 지연이 늘면 자동으로 허용량이 줄어듦(L = λW) |
| 막는 대상 | 남용, 비용 | 과부하로 인한 지연 폭증 |
| 사용처 | API 사용량 정책, 클라이언트별 공정성 | 서버·게이트웨이 보호 |

두 가지는 보완 관계다 → [레이트 리미팅](/develop-wiki/knowledge/performance/rate-limiting/), [백프레셔와 부하 차단](/develop-wiki/knowledge/performance/backpressure-load-shedding/).

## 언제 쓰나

- 서비스가 의존하는 시스템의 지연이 변하고, **고정 RPS 한도가 자주 틀릴 때**(오토스케일링, 공유 DB).
- 풀 크기(커넥션 풀·스레드 풀·세마포어)를 정할 때 L = λW 로 시작값을 구한다 → [커넥션 풀](/develop-wiki/knowledge/performance/connection-pool/), [벌크헤드](/develop-wiki/knowledge/performance/bulkhead/).
- 거절을 클라이언트에게 빨리 알려 재시도·서킷 브레이커가 동작하게 하고 싶을 때 → [타임아웃·재시도·서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/).

## 주의 (비용)

- **L = λW 는 평균과 안정 상태에 관한 법칙이다.** 순간 폭주(p99)나 불안정 상태를 설명하지 않는다. 용량은 평균에 여유를 더해 잡는다.
- 한도가 **너무 낮으면** 서버 능력을 낭비하고 정상 요청을 거절한다. **너무 높으면** 보호가 안 된다. 자동 조정 알고리즘은 지연 측정이 잡음에 약하고, 파라미터(α, β, 평활 창)를 환경에 맞춰야 한다.
- 지연 기반 한도는 **느린 요청이 정상인 워크로드**(큰 쿼리와 작은 쿼리 혼재)에서 오판할 수 있다. 요청 유형별로 한도를 나눈다.
- 거절된 요청에 대한 **클라이언트 정책**(재시도 예산, 백오프)이 없으면 거절이 재시도 폭풍이 된다. Google SRE 는 요청당 재시도 3회, 클라이언트별 재시도 비율 10% 미만 같은 예산을 예로 든다.
- 한도에 닿으면 사용자 경험에 어떤 응답을 줄지(부분 기능 축소, 우선순위 요청 우선 처리) 먼저 정해야 한다.
- 시뮬레이션은 포아송 도착, 지수 서비스 시간, 단일 큐라는 단순 모델이다. 실제 서비스는 의존성 체인과 다중 자원이 있어 한도 하나로 끝나지 않는다.
