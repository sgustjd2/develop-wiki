---
title: 낡은 응답 제공(stale-while-revalidate·stale-if-error)과 네거티브 캐싱
aka: [stale-while-revalidate, stale-if-error, RFC 5861, Negative Caching, 실패 캐싱, Serve Stale, RFC 2308, fail fast]
category: performance
level: intermediate
summary: 만료 뒤에도 정해진 시간 동안 낡은 값을 주며 뒤에서 갱신(SWR)하고, 원본 오류 때 낡은 값으로 버티며(stale-if-error), 실패·부재를 짧게 기억해 원본 호출을 줄이는(네거티브 캐싱) 규칙과 비용.
tags: [cache, stale-while-revalidate, stale-if-error, negative-caching, rfc5861, rfc9111, rfc2308, resilience, availability]
related: [performance/caching-strategies, performance/request-coalescing-cache-stampede, cs-fundamentals/http-caching, performance/timeout-retry-circuit-breaker, performance/adaptive-throttling-retry-budget, performance/metastable-failures-retry-storm, performance/backpressure-load-shedding]
sources:
  - https://www.rfc-editor.org/rfc/rfc5861.html
  - https://www.rfc-editor.org/rfc/rfc9111.html
  - https://www.rfc-editor.org/rfc/rfc2308.html
updatedAt: 2026-11-19
---

## 문제

TTL 이 끝나면 캐시는 두 가지 아픈 선택에 몰린다.

- **갱신을 기다리게 한다.** 만료 직후의 요청이 원본 지연을 그대로 맞는다.
- **원본이 죽었을 때 오류를 그대로 낸다.** 몇 분 전 값이 있는데도 사용자는 5xx 를 본다.

또 "없다"·"실패했다"를 기억하지 않으면 같은 실패를 요청마다 원본에 다시 묻는다. [스탬피드 방어](/develop-wiki/knowledge/performance/request-coalescing-cache-stampede/)가 "동시에 몰리는 갱신"을 줄인다면, 이 노트는 **낡은 값과 실패를 얼마나 쓸 수 있나**를 다룬다. HTTP 헤더 일반은 [HTTP 캐싱](/develop-wiki/knowledge/cs-fundamentals/http-caching/)을 본다.

## 해법

### stale-while-revalidate (RFC 5861)

`Cache-Control: max-age=600, stale-while-revalidate=30` 은 "600 초간 신선, 이후 **30 초 동안은 낡은 응답을 그대로 주고 뒤에서 재검증**해도 된다"는 뜻이다. 두 값은 **합산**되어 600~630 초 구간이 낡은 응답 허용 구간이다. 창이 지나도록 재검증에 성공하지 못하면 낡은 응답을 더 쓰지 않는다. 서비스하는 낡은 응답에는 0 이 아닌 `Age` 가 붙는다.

중요한 성질: **재검증은 창 안에 요청이 와야 시작된다.** RFC 도 트래픽이 드문 경우 창 밖에 요청이 떨어져 일반 블로킹 재검증이 일어난다고 적는다. 또한 캐시가 요청 없이 스스로 갱신을 시작하는 방식은 증폭 공격 위험이 있어, 요청을 계기로만 시작하라고 권한다.

### stale-if-error (RFC 5861)

`stale-if-error=1200` 은 **오류가 났을 때** 신선도와 무관하게 최대 그 시간까지 낡은 응답을 써도 된다는 뜻이다. 여기서 오류는 500·502·503·504 로 정의된다. 요청 쪽에 붙으면 그 요청에만, 응답에 붙으면 해당 캐시 항목의 모든 요청에 적용된다. 한도를 넘으면 오류를 그대로 전달한다.

### 표준에서의 위치

RFC 9111(HTTP Caching)은 캐시가 낡은 응답을 만들 수 있는 경우를 "연결이 끊겼을 때" 또는 "클라이언트·원본이 명시적으로 허용했을 때(`max-stale`, RFC 5861 같은 확장)"로 제한한다. 두 지시어는 RFC 9111 본문이 정의하지 않고 RFC 5861(Informational)이 정의한다. `no-cache`·`must-revalidate`·`s-maxage` 같은 지시어가 있으면 낡은 응답을 줄 수 없다. 또 RFC 9111 은 검증 요청에 5xx 가 오면 저장된 응답을 보내거나 재시도할 수 있다고 말한다.

### 네거티브 캐싱

"이 키는 없다(404)"나 "조회가 실패했다"를 **짧은 TTL 로 저장**하는 것이다.

- **부재 결과**: RFC 9111 은 404 같은 부정 결과도 저장할 수 있게 허용하되 의무는 아니다(휴리스틱 캐시 가능 상태 코드의 목록은 RFC 9110 에 있고 이 노트에서는 읽지 않았다).
- **DNS 의 모범 규칙(RFC 2308)**: NXDOMAIN(이름 없음)·NODATA(이름은 있으나 해당 타입 없음)를 SOA 의 MINIMUM 과 SOA TTL 중 작은 값만큼 캐시한다. 리졸버는 상한을 둬야 하며 1~3 시간 정도를 적정, 하루를 넘으면 문제라고 한다. **SERVFAIL 캐시는 RFC 2308 에서 선택 사항(MAY)이고 하더라도 5 분을 넘기면 안 된다(MUST NOT).** 응답 없는 서버도 최대 5 분이다. 다만 2023 년 RFC 9520 이 RFC 2308 을 갱신해 이름 해석 실패는 최소 1 초에서 최대 5 분 동안 캐시하도록(MUST) 바꿨다. 상한을 둬야 한다는 서술의 배경으로 RFC 2308 은 아주 긴 TTL 의 부정 응답이 퍼지는 서비스 거부 위험(§9)을 든다.

앱 캐시에서 옮기면: **부재(없음)** 는 비교적 길게(수십 초~분), **일시 오류** 는 매우 짧게(수 초) 기억한다.

```ts
type Entry<T> = { v?: T; fetchedAt: number; negUntil?: number };
async function get<T>(k: string, c: Map<string, Entry<T>>, load: () => Promise<T>, o: { ttl: number; sie: number; neg: number }) {
  const e = c.get(k), now = Date.now();
  if (e?.v !== undefined && now - e.fetchedAt < o.ttl) return e.v;                 // 신선
  if (e?.negUntil && now < e.negUntil) {                                           // 실패 기억 중: 원본 안 부름
    if (e.v !== undefined && now - e.fetchedAt < o.ttl + o.sie) return e.v;        // stale-if-error
    throw new Error('negative-cached');                                            // fail fast
  }
  try { const v = await load(); c.set(k, { v, fetchedAt: now }); return v; }
  catch (err) {
    c.set(k, { ...e, fetchedAt: e?.fetchedAt ?? 0, negUntil: now + o.neg });
    if (e?.v !== undefined && now - e.fetchedAt < o.ttl + o.sie) return e.v;
    throw err;
  }
}
```

(스케치. stale-if-error 대체, 네거티브 구간에서 원본 미호출, 복구 후 재조회, 첫 실패의 fail fast 를 실행해 확인했다. SWR 의 백그라운드 갱신은 넣지 않았고 합치기(single-flight)는 [합치기 노트](/develop-wiki/knowledge/performance/request-coalescing-cache-stampede/) 방식과 함께 쓴다.)

## 직접 실행으로 확인

가상 시간(초) 모사, 키 하나, 포아송 요청, 갱신 한 번에 200ms, 신선 구간 10 초, 1 시간. 갱신은 single-flight 이고 요청이 와야 시작된다. "블로킹"은 갱신을 기다린 요청 비율이다.

| 요청률 | SWR 창 | 블로킹 요청 | 낡은 응답 제공 | 제공한 최대 나이 | 원본 호출 수 |
| --- | --- | --- | --- | --- | --- |
| 0.02/s (1 시간 69건) | 0 | 79.7% | 0% | - | 55 |
| 0.02/s | 30 초 | 43.5% | 36.2% | 39.5 초 | 55 |
| 0.2/s | 0 | 33.1% | 0% | - | 226 |
| 0.2/s | 30 초 | 0.14% | 33.0% | 36.4 초 | 226 |
| 50/s | 0 | 2.11% | 0% | - | 352 |
| 50/s | 30 초 | 0.00% | 2.11% | 10.3 초 | 352 |

- SWR 은 **원본 호출 수를 줄이지 않는다.** 대기 시간을 낡은 응답으로 바꾼다(호출 수가 같다).
- 요청이 드문(0.02/s) 키에서는 창 밖 요청이 많아 여전히 43% 가 블로킹이다. RFC 의 "트래픽 의존성" 서술 그대로다.

원본 장애(60 초, 요청 50/s, 오류는 1 초 타임아웃 뒤 반환, 총 300 초, 신선 10 초):

| 정책 | 원본 호출 | 오류 응답 | 낡은 값 응답 | 즉시 실패(fail fast) |
| --- | --- | --- | --- | --- |
| single-flight 없음 | 2,922 | 2,899 | 0 | 0 |
| single-flight | 80 | 2,906 | 0 | 0 |
| single-flight + 네거티브 5 초 | 33 | 3,005 | 0 | 2,497 |
| single-flight + stale-if-error 120 초 | 80 | 0 | 2,906 | 0 |
| single-flight + 네거티브 5 초 + stale-if-error | 33 | 0 | 3,005 | 0 |

- 네거티브 캐시는 원본 호출을 80 → 33 으로 줄이고, 오류의 대부분(3,005 중 2,497)을 **1 초 타임아웃 없이 즉시** 낸다.
- 그러나 오류 응답 수는 늘었다(2,906 → 3,005). 복구(t=160s) 직후 **네거티브 TTL 만큼 오류가 연장**된 결과다.
- stale-if-error 는 이 모사에서 사용자 오류를 0 으로 만들었다. 단, 신선 10 초 + 120 초 안의 값만 쓸 수 있다.
- 모사는 키 하나, 갱신 실패가 오로지 시간대로 결정되는 단순 모형이다.

## 언제 쓰나

- **SWR**: 사용자 지연이 중요하고, 몇 초~수십 초 낡은 값이 허용되며 키에 꾸준한 트래픽이 있을 때(목록, 추천, 설정).
- **stale-if-error**: 원본이 가끔 죽어도 읽기 서비스를 이어야 하는 CDN·BFF·클라이언트 캐시.
- **네거티브 캐싱**: 존재하지 않는 키를 반복 조회하는 패턴(무효 ID 스캔, 삭제된 리소스, 미등록 도메인), 원본 장애 중 요청 폭주 방어.

## 주의 (비용)

- **낡은 값은 정확성 문제다.** 가격·재고·권한·결제 상태에는 허용 창을 짧게 하거나 쓰지 않는다. `must-revalidate`·`no-cache` 가 있으면 규격상 낡은 응답을 줄 수 없다.
- **stale-if-error 는 장애를 가린다.** 사용자는 정상으로 보는데 원본은 죽어 있다. 낡은 응답 비율·`Age` 를 관측해 알림을 건다.
- **네거티브 캐시는 복구를 늦춘다.** 방금 생성된 리소스가 404 로 캐시되어 "만들었는데 안 보이는" 현상이 생긴다(모사에서 복구 후 TTL 만큼 연장됨). 생성 시 해당 키를 무효화한다.
- **일시 오류를 길게 기억하지 마라.** DNS 규칙도 SERVFAIL 은 5 분 이하로 제한한다(RFC 2308, 현행은 RFC 9520). 앱에서는 수 초 단위가 무난하다(이 수치는 의견).
- **네거티브 캐시 오염**: 공격자가 임의 키 조회로 부정 항목을 대량 생성하면 캐시를 채운다. 크기·TTL 상한과 키 정규화가 필요하다. 위조된 부정 응답의 DoS 위험은 RFC 2308 도 경고한다.
- **사용자별 응답은 캐시 키에 사용자 정보를 포함**한다. 권한 없음(403)을 공용 키로 네거티브 캐싱하면 다른 사용자도 거부된다.
- SWR 의 백그라운드 갱신은 원본 부하다. 갱신이 실패할 때 재시도는 [예산 안에서](/develop-wiki/knowledge/performance/adaptive-throttling-retry-budget/) 한다. 낡은 값으로 버티는 동안 원본이 복구되며 캐시가 한꺼번에 갱신되면 그 순간이 [재시도 폭풍](/develop-wiki/knowledge/performance/metastable-failures-retry-storm/) 후보다.

## 비교

| 기법 | 해결하는 것 | 대가 |
| --- | --- | --- |
| 일반 TTL | 읽기 부하 | 만료 순간 지연 |
| SWR | 만료 순간의 대기 | 최대 TTL+창 만큼 낡은 값 |
| stale-if-error | 원본 장애 중 가용성 | 장애 은폐, 낡은 값 |
| 네거티브 캐싱 | 부재·실패 반복 호출, 느린 실패 | 복구·생성 지연, 오염 |
| [single-flight](/develop-wiki/knowledge/performance/request-coalescing-cache-stampede/) | 동시 중복 갱신 | 오류 공유 |
| [서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/) | 느린 실패 확산 | 상태·임계 튜닝 |

## 검증 범위

RFC 5861 전문, RFC 9111 의 낡은 응답 관련 절(4, 4.2.2, 4.2.4, 4.3.3, 5.2.3 — 문서 끝 약 7,500 자는 읽지 못함), RFC 2308 의 부정 캐싱 TTL·SERVFAIL 규칙을 읽었다. RFC 9110 의 휴리스틱 캐시 가능 상태 코드 목록과 CDN 별 구현 차이는 확인하지 않았다. 표는 직접 실행한 모사 결과다.
