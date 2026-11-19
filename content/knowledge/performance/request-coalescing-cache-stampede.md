---
title: 요청 합치기(request coalescing)와 캐시 스탬피드 방어
aka: [Request Coalescing, Single-flight, Cache Stampede, Thundering Herd, Dogpile, Probabilistic Early Expiration, XFetch, stale-while-revalidate]
category: performance
level: intermediate
summary: 인기 키가 만료되는 순간 몰리는 동일 요청을 키별로 하나만 원본에 보내고 나머지는 그 결과를 공유하게 하는 single-flight 와, 만료 전에 확률적으로 미리 갱신하는 XFetch 의 원리와 한계.
tags: [cache, stampede, thundering-herd, single-flight, coalescing, xfetch, ttl, resilience]
related: [performance/caching-strategies, performance/timeout-retry-circuit-breaker, performance/backpressure-load-shedding, performance/metastable-failures-retry-storm, performance/adaptive-throttling-retry-budget, performance/connection-pool, distributed-systems/idempotency]
sources:
  - https://pkg.go.dev/golang.org/x/sync/singleflight
  - https://en.wikipedia.org/wiki/Cache_stampede
  - https://doi.org/10.14778/2757807.2757813
updatedAt: 2026-11-19
---

## 문제

[캐시](/develop-wiki/knowledge/performance/caching-strategies/)는 원본(DB·외부 API)이 감당 못 할 읽기 부하를 흡수한다. 그런데 **인기 키 하나**가 만료되면, 갱신이 끝날 때까지 들어오는 모든 요청이 미스가 되어 동시에 원본을 때린다. 원본이 느려지면 갱신이 더 오래 걸려 미스 창이 길어지고, 요청이 더 쌓인다. 캐시를 믿고 용량을 잡았다면 원본이 무너지는 시점이 바로 이때다. 캐시 전체를 비운 직후(콜드 스타트, 배포)에는 이것이 모든 키에서 동시에 일어난다.

## 해법 1: single-flight (요청 합치기)

같은 키에 대해 **진행 중인 갱신이 있으면 새로 시작하지 않고 그 결과를 기다린다.** Go `x/sync/singleflight` 의 `Group.Do` 가 대표 구현으로, 키당 한 번에 하나의 실행만 허용하고 중복 호출자는 같은 결과를 받는다. `Forget` 으로 키 추적을 지우면 다음 호출은 새로 실행한다.

```ts
const inflight = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  let p = inflight.get(key) as Promise<T> | undefined;
  if (!p) { p = fn().finally(() => inflight.delete(key)); inflight.set(key, p); }
  return p;                                     // 이미 있으면 같은 프라미스를 공유
}
```

범위가 **프로세스 안**이라는 점에 주의한다. 서버가 N 대면 키당 동시 갱신은 최대 N 개다. 전역 하나로 줄이려면 분산 락이나 캐시 계층(프록시·CDN 의 request collapsing)이 필요하고, 그만큼 락 대기·장애 처리 복잡도가 붙는다.

## 해법 2: 만료 전에 확률적으로 미리 갱신 (XFetch)

Vattani 등(VLDB 2015)의 방식으로, 각 요청이 "지금 미리 갱신할까"를 독립적으로 정한다. 다음 조건이 참이면 만료 전이라도 갱신한다(β=1 기본).

```text
now - delta * beta * ln(rand(0,1)) >= expiry        # delta = 마지막 갱신에 걸린 시간
```

`ln(rand)` 는 음수라서 만료 시각이 다가올수록 참일 확률이 지수적으로 커진다. 갱신이 오래 걸리는(delta 큰) 키일수록 더 일찍 시작한다. 값과 함께 delta(와 필요시 expiry)를 캐시에 저장해야 한다. (공식은 위키백과 서술 기준이며, 논문 PDF 는 읽지 못했다.)

## 해법 3: 그 외

- **stale-while-revalidate**: 만료된 값을 바로 돌려주고 백그라운드에서 갱신. 응답 지연이 없지만 잠깐 오래된 값이 나간다.
- **TTL 지터**: 같은 시각에 쓴 키들이 같은 시각에 만료되는 동기화를 깬다. 한 키의 스탬피드는 못 막는다.
- **외부 주기 갱신**: 별도 작업이 키를 미리 채운다. 키 집합이 정해져 있을 때만 맞는다.
- **분산 락**: 락을 얻은 요청만 갱신하고 나머지는 대기·옛 값·"없음" 중 택한다. 락 실패·타임아웃 처리가 필요하다.

## 직접 실행으로 확인

키 하나, TTL 1 s, 갱신(원본 호출) 100 ms, 약 5000 req/s, 10 s 동안 Node 단일 프로세스에서 실행했다. 원본 호출 수와 **동시 호출 최대치**.

| 방식 | 원본 호출 수 | 동시 호출 최대 |
| --- | --- | --- |
| 합치기 없음 | 3466 | 440 |
| single-flight | 10 | 1 |
| XFetch(+single-flight, 요청은 옛 값 반환) | 23~26 (2회 실행) | 1 |

- 합치기가 없으면 만료 때마다 갱신 창(100 ms) 동안 들어온 요청이 전부 원본으로 갔다.
- XFetch 는 만료 순간의 지연을 없애는 대신 **원본 호출이 늘었다**(10 → 약 25). 요청률이 높으면 "누군가 미리 갱신할" 확률 합이 만료 훨씬 전에 1 에 가까워지기 때문이라고 이해한다(공식에 요청 수가 곱해지는 효과를 내가 계산한 설명이며 논문으로 확인하지 않았다). delta 평균은 100 ms 로 측정돼 부하로 인한 왜곡은 아니었다.
- 이 실험은 요청 처리 시간 0 인 모사다. 절대값이 아니라 경향만 본다.

## 언제 쓰나

- 읽기 비율이 높고, 키 하나의 갱신 비용이 크거나 원본이 약한 경우(집계 쿼리, 외부 API).
- 배포·장애 복구 직후 빈 캐시에 트래픽이 들어오는 경우(콜드 스타트 보호).
- 같은 원본을 여러 소비자가 쓰는 BFF·게이트웨이 계층.

## 주의 (비용)

- **갱신이 실패하면 대기자가 모두 같이 실패한다.** single-flight 는 오류도 공유한다. 실패는 짧게만 기억하거나(negative caching) 옛 값으로 폴백하고, 재시도는 [예산·백오프](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/) 안에서 한다.
- 대표 호출자의 취소·타임아웃이 대기자 전체에 번질 수 있다. 대표가 요청 컨텍스트의 [데드라인](/develop-wiki/knowledge/performance/deadline-propagation-cancellation/)을 쓰면 다른 대기자의 더 긴 데드라인이 무시된다. 갱신은 **요청과 분리된 컨텍스트**로 돌리는 편이 안전하다(이 부분은 구현 의견).
- **사용자별로 다른 응답**(권한, 개인화)을 키 없이 합치면 다른 사용자의 데이터를 돌려줄 수 있다. 합치기 키에 응답을 결정하는 모든 요소를 넣는다.
- 대기자가 쌓이는 만큼 메모리·커넥션을 쓴다. 갱신이 오래 걸리면 대기열에 상한과 타임아웃이 필요하다 → [백프레셔](/develop-wiki/knowledge/performance/backpressure-load-shedding/).
- XFetch 는 값마다 delta 를 저장해야 하고(캐시 메모리 증가), 보장이 확률적이라 서로 다른 노드가 동시에 갱신하는 일이 남는다. 거의 모든 경우 노드 내 single-flight 와 함께 쓴다.
- 합치기는 **읽기 중복**을 줄일 뿐 쓰기 경합이나 무효화 순서 문제는 풀지 않는다.

## 비교

| 방법 | 막는 것 | 비용 |
| --- | --- | --- |
| single-flight | 만료 순간 중복 갱신(프로세스당 1) | 오류·취소 공유, 프로세스 범위 |
| 분산 락 | 전역 중복 갱신 | 락 왕복, 락 장애 처리 |
| XFetch | 만료 순간의 지연 자체 | 갱신 횟수 증가, delta 저장 |
| stale-while-revalidate | 갱신 대기 지연 | 오래된 값 노출 |
| TTL 지터 | 키 간 동시 만료 | 단일 키 스탬피드는 그대로 |

## 검증 범위

Go singleflight 문서와 위키백과의 Cache stampede 항목(XFetch 공식·완화책 목록)을 읽었다. Vattani 등 원 논문(PVLDB 8(8), 886–897)은 본문을 열람하지 못했고 최적성 주장은 2차 서술에 의존한다. 위 표는 직접 실행한 값이다.
