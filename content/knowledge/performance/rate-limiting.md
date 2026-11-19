---
title: 레이트 리미팅
aka: [Rate Limiting, Throttling, Token Bucket, Leaky Bucket, Sliding Window, 429 Too Many Requests, 처리율 제한]
category: performance
level: intermediate
summary: 클라이언트별로 일정 시간 동안 받을 요청 수를 제한해 남용과 폭주로부터 서비스를 지키는 기법과, 토큰 버킷·윈도 알고리즘, 429 응답 설계.
tags: [rate-limit, throttling, api, redis, token-bucket, http]
related: [performance/backpressure-load-shedding, performance/load-balancing, performance/caching-strategies, distributed-systems/idempotency]
sources:
  - https://stripe.com/blog/rate-limiters
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern
  - https://www.rfc-editor.org/rfc/rfc6585.html
  - https://sre.google/sre-book/handling-overload/
updatedAt: 2026-11-18
simulation: rate-limiting
---

## 문제

API 를 공개하면 누군가는 반드시 너무 많이 부른다. 버그 난 재시도 루프, 스크래퍼, 한 고객의 대량 배치가 다른 모든 고객의 지연을 끌어올린다. 서버를 늘려도 한 사용자가 그만큼 더 부르면 소용없다.

## 해법

**누구에게(키), 얼마나(한도), 어느 기간(윈도)** 을 정하고, 넘으면 거절한다.

| 알고리즘 | 방식 | 장점 | 단점 |
| --- | --- | --- | --- |
| 고정 윈도 | 분 단위 카운터 | 가장 단순 | 경계에서 순간 2배 허용(59초·61초) |
| 슬라이딩 윈도 로그 | 요청 시각 목록 보관 | 정확 | 메모리 많이 씀 |
| 슬라이딩 윈도 카운터 | 이전·현재 윈도 가중 평균 | 정확도·비용 균형 | 근사치 |
| 토큰 버킷 | 일정 속도로 토큰 충전, 요청마다 1개 소비 | **버스트 허용**하며 평균 속도 제한 | 상태(토큰 수, 마지막 충전 시각) 필요 |
| 리키 버킷 | 큐에 넣고 일정 속도로 처리 | 출력이 매끈함 | 버스트가 대기열 지연이 됨 |

Stripe 는 사용자별 토큰 버킷을 Redis 에 두고, 반짝 세일 같은 짧은 폭주는 허용하는 방식을 쓴다고 밝혔다.

```ts
// 토큰 버킷 (단일 프로세스 개념 예시; 분산 환경은 Redis + Lua 로 원자적으로)
class TokenBucket {
  private tokens: number; private last = Date.now();
  constructor(private capacity: number, private refillPerSec: number) { this.tokens = capacity; }
  take(): boolean {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refillPerSec);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1; return true;
  }
}

if (!bucketFor(apiKey).take()) {
  res.set('Retry-After', '1').status(429).json({ error: 'rate_limited', message: '초당 10회를 넘었습니다' });
}
```

## 응답 설계

- 한도 초과는 **429 Too Many Requests**(RFC 6585). `Retry-After` 로 언제 다시 오라고 알릴 수 있다. 429 응답은 캐시하면 안 된다.
- 사용자 한도가 아니라 **서버 전체 용량** 때문에 거절할 때는 503 이 의미상 맞다(Stripe 의 구분).
- 남은 한도를 헤더로 알려 주면 착한 클라이언트가 스스로 속도를 맞춘다.
- 오류 메시지는 고칠 수 있게 쓴다: 어떤 한도를, 얼마나 넘었는지.

## 클라이언트 쪽 레이트 리미팅

호출하는 쪽도 상대의 한도를 지켜야 한다. Azure 의 Rate Limiting 패턴은 "일단 다 보내고 실패하면 재시도"가 같은 데이터를 몇 배로 보내게 만든다고 지적하고, 내구성 있는 큐에 넣은 뒤 정해진 속도로 꺼내 보내라고 권한다. Google SRE 책의 **적응형 클라이언트 스로틀링**은 최근 2분간 "보낸 요청"이 "수락된 요청"의 K배(기본 2)를 넘으면 클라이언트가 스스로 일부를 버린다.

## 언제 쓰나

- 공개 API, 로그인·비밀번호 재설정·OTP 같은 남용 대상 엔드포인트(무차별 대입 방지).
- 멀티테넌트에서 한 테넌트가 다른 테넌트를 굶기지 않게.
- 외부 유료 API 를 부를 때 내 쪽에서 비용 상한을 지킬 때.

## 주의 (비용)

- 분산 카운터(Redis)는 추가 왕복과 새 장애점이다. Stripe 는 리미터가 고장 나면 **허용(fail open)** 하도록 만들라고 권한다. 리미터 장애가 API 장애가 되면 안 된다.
- 새 한도는 바로 강제하지 말고 **다크 런치**로 "막았을 요청"을 먼저 관찰한 뒤 조정한다.
- 한도 키를 IP 로만 잡으면 NAT 뒤 사용자들이 함께 막히고, 공격자는 IP 를 바꾼다. 가능하면 API 키·계정 단위.
- 요청 수 한도는 요청 비용 차이를 못 본다. 무거운 엔드포인트는 동시 실행 수 제한이나 비용 가중치를 따로 둔다.
- 레이트 리미팅은 고객별 공정성 도구다. 서버 전체 과부하는 [부하 차단](/develop-wiki/knowledge/performance/backpressure-load-shedding/)이 맡는다.
