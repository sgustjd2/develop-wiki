---
title: 클라이언트 적응형 스로틀링과 재시도 예산
aka: [Adaptive Throttling, Client-side Throttling, Retry Budget, Admission Control, Google SRE Overload, 적응형 스로틀링]
category: performance
level: advanced
summary: 클라이언트가 최근 요청 수와 수락 수의 비율로 스스로 요청을 줄이고(적응형 스로틀링), 재시도를 전체 요청의 일정 비율 안으로 가두어(재시도 예산) 과부하 중인 백엔드를 더 때리지 않게 하는 방법.
tags: [overload, adaptive-throttling, retry-budget, sre, resilience, client-side]
related: [performance/backpressure-load-shedding, performance/priority-load-shedding, performance/timeout-retry-circuit-breaker, performance/rate-limiting, performance/concurrency-limits-littles-law, performance/queueing-theory-utilization-latency, distributed-systems/idempotency]
sources:
  - https://sre.google/sre-book/handling-overload/
  - https://sre.google/sre-book/addressing-cascading-failures/
  - https://docs.rs/gcp-sdk-gax/0.1.0/src/gcp_sdk_gax/retry_throttler.rs.html
updatedAt: 2026-11-19
---

## 문제

서버 쪽 레이트 리미팅이나 부하 차단은 거절을 **서버가** 한다. 그런데 거절도 공짜가 아니다. 요청을 받고, 파싱하고, 거절 응답을 만드는 데 CPU 가 든다. 과부하 상태에서 클라이언트가 계속 보내면 서버는 일은 못 하고 거절만 하다가 쓰러질 수 있다. 거절 요청이 많아지면 거절 처리만으로도 서버 자원이 소진될 수 있다(이 노트의 모의 실험으로 보이는 일반 원리이며, SRE 책의 문장을 옮긴 것은 아니다). 재시도까지 더해지면 부하가 곱절로 늘어난다.

해법은 **클라이언트가 서버의 상태를 스스로 추정해 먼저 물러나는 것**이다.

## 해법 1: 적응형 스로틀링 (SRE 책 21장)

클라이언트가 최근 2분 동안 두 값을 센다.

- `requests`: 애플리케이션이 시도한 요청 수(스로틀링에 걸러진 것 포함)
- `accepts`: 백엔드가 수락한 요청 수

정상일 때는 둘이 같다. 백엔드가 거절하기 시작하면 `accepts` 가 뒤처진다. `requests` 가 `K × accepts` 를 넘으면 클라이언트는 새 요청을 **네트워크에 내보내기 전에** 확률적으로 버린다. SRE 책은 K = 2 를 권한다. 거절 확률은 널리 인용되는 형태로 다음과 같다.

> 거절 확률 = max(0, (requests − K × accepts) / (requests + 1))

(책의 해당 페이지에서 이 식은 이미지라 텍스트로 확인하지 못했다. 같은 식을 쓰는 구현 문서(gcp-sdk-gax 의 retry_throttler)로 교차 확인했다.) K 를 낮추면 더 공격적으로 줄이고, 높이면 덜 줄인다. 책은 K = 2 가 백엔드 용량을 더 쓰지만 회복 신호를 클라이언트에 더 빨리 퍼뜨린다고 설명한다.

### 실행으로 확인

백엔드 용량 100 rps, 클라이언트 10개가 각 30 rps(총 300 rps)를 시도한다. 클라이언트마다 최근 120초의 `requests`/`accepts` 를 센다. 백엔드는 초당 100건만 수락하고 나머지는 거절한다. 600초를 돌려 후반 300초의 평균을 냈다.

```ts
class Client {
  reqs: number[] = []; accs: number[] = [];            // 초당 카운트, 120칸 유지
  K: number; constructor(K: number) { this.K = K; }
  rejectProb() {
    const r = this.reqs.reduce((a, b) => a + b, 0), a = this.accs.reduce((x, y) => x + y, 0);
    return Math.max(0, (r - this.K * a) / (r + 1));
  }
}
// 매 초: 각 클라이언트가 30회 시도 → rnd() < rejectProb() 면 로컬 거절, 아니면 백엔드로
//        백엔드는 도착분 중 임의의 100건만 수락, 수락된 건 accs 에 기록
```

| 설정 | 백엔드에 도달 | 수락 | 백엔드가 거절 | 로컬 거절 |
| --- | --- | --- | --- | --- |
| 스로틀링 없음 | 300/s | 100/s | 200/s | 0 |
| K = 2 | 199/s | 100/s | 99/s | 101/s |
| K = 1.1 | 59/s | **59/s** | 0 | 241/s |

K = 2 에서는 백엔드로 가는 요청이 수락의 약 2배로 안정되고(백엔드 거절 부담이 200 → 99 로 감소), 수락량은 용량을 꽉 채운다. **K = 1.1 은 거절을 거의 0 으로 만들지만 용량의 59% 만 쓴다.** 너무 공격적이면 백엔드가 놀게 된다. 모의는 균일·독립 클라이언트 가정이라 실제 값은 부하 분포에 따라 달라진다.

## 해법 2: 재시도 예산

재시도는 일시 장애를 가려 주지만 과부하에서는 증폭기다. SRE 책 규칙은 이렇다.

- **요청당 최대 3회 시도.** 그 뒤에는 오류를 호출자에게 돌려준다.
- **클라이언트당 예산**: 재시도가 전체 요청의 **10% 미만**일 때만 재시도한다. 예산이 없으면 최악에 약 3배, 예산이 있으면 약 1.1배로 증가가 제한된다.
- **한 층에서만 재시도**한다. 각 층이 3회씩 재시도하면 호출은 층 수만큼 곱해진다(3층이면 3×3×3 = 27배, 산술).
- **과부하 신호를 구분**한다: "이 태스크가 과부하(다른 곳으로 재시도 가능)"와 "전체가 과부하(재시도 말 것)". 후자를 받으면 재시도하지 않고 오류를 위로 올린다.
- 영구 오류·잘못된 요청은 재시도하지 않는다(cascading failures 장).

구현은 토큰 버킷이 흔하다: 성공 요청마다 0.1 토큰을 적립하고, 재시도 1회마다 1 토큰을 쓴다(일반 구현 패턴이며 책의 코드는 아니다). 토큰이 없으면 재시도 없이 실패한다. 이 구조가 적응형 스로틀링과 합쳐지면 장애 중에는 스로틀링이 요청을 줄이고 예산이 재시도를 막는다.

## 언제 쓰나

- 여러 클라이언트가 공유 백엔드(DB, 내부 RPC 서비스)를 호출하고, 과부하 때 거절 처리만으로 서버가 한계에 닿는 구조.
- 호출 체인이 깊어 재시도 증폭 위험이 있을 때. 이때 **재시도는 가장 바깥이나 한 층에서만** 두고 나머지는 빠르게 실패하게 한다.
- RPC 클라이언트 라이브러리나 사이드카에 한 번 구현해 모든 호출에 적용할 때(서비스마다 흩어 놓지 않는다).

## 주의 (비용)

- **K 와 윈도 튜닝.** 낮은 K 는 용량을 놀리고(위 59%), 높은 K 는 보호가 늦다. 2분 윈도는 회복 감지를 늦춘다. 실험으로 정하고 지표(로컬 거절률)를 노출한다.
- **로컬 거절은 실패다.** 호출자는 오류를 받으므로 사용자에게 보이는 영향이 있다. 대체 응답(캐시·기본값)이나 우선순위 구분과 함께 설계한다 → [우선순위 기반 부하 차단](/develop-wiki/knowledge/performance/priority-load-shedding/).
- 클라이언트가 **적을 때** 통계가 부정확하다. 요청 수가 적으면 `+1` 항의 영향이 크고 확률이 흔들린다.
- **장애 직후 고착.** 한동안 모두 거절당하면 수락이 0 이 되어 확률이 1 근처에 머물 수 있다. 일부 구현은 상한(예: 90%)을 두어 회복 요청이 나가게 한다(구현 선택이며 책의 내용이 아님). 윈도가 지나면 풀리지만 그 사이 회복이 늦어진다.
- 클라이언트 간 **공정성**: 요청이 많은 클라이언트가 먼저 줄고 조용한 클라이언트는 영향이 적다. 서버 쪽 할당과 보완 관계다 → [레이트 리미팅](/develop-wiki/knowledge/performance/rate-limiting/).
- 서버가 **어떤 응답을 "거절"로 세는지** 합의해야 한다. 타임아웃·5xx·전용 과부하 코드 중 무엇을 `accepts` 에서 빼는지 정한다.
- 재시도는 [멱등](/develop-wiki/knowledge/distributed-systems/idempotency/)한 요청에만 한다. 백오프·지터·회로 차단기는 [타임아웃·재시도·회로 차단기](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/)에서 다룬다. 재시도 규칙의 요약표는 [백프레셔와 부하 차단](/develop-wiki/knowledge/performance/backpressure-load-shedding/)에 있다.
