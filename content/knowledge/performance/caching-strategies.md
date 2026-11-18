---
title: 캐싱 전략과 무효화
aka: [Caching Strategies, Cache-Aside, Lazy Loading, Read-Through, Write-Through, Write-Behind, Cache Invalidation, TTL, Cache Stampede]
category: performance
level: intermediate
summary: cache-aside·read-through·write-through·write-behind 의 차이, TTL 과 명시적 무효화로 신선도를 관리하는 법, 그리고 스탬피드 같은 캐시 특유의 장애.
tags: [cache, redis, performance, consistency, ttl]
related: [performance/connection-pool, performance/rate-limiting, data-modeling/normalization, architecture/cqrs, distributed-systems/transactional-outbox]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside
  - https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html
updatedAt: 2026-11-18
---

## 문제

같은 데이터를 반복해서 DB·외부 API 에서 읽으면 느리고 비싸다. 캐시를 두면 빨라지지만, 이제 **같은 사실이 두 곳에 있다.** 언제 채우고, 언제 버리고, 얼마나 오래된 값을 허용할지가 설계의 전부다.

## 해법: 채우는 방식

| 전략 | 읽기 | 쓰기 | 장점 | 단점 |
| --- | --- | --- | --- | --- |
| Cache-aside (lazy loading) | 앱이 캐시 확인 → 없으면 DB 조회 후 캐시에 넣음 | 앱이 DB 갱신 후 캐시 **삭제** | 요청된 것만 캐시, 캐시 장애에도 동작 | 미스 때 왕복 3번, 쓰기~다음 읽기 사이 잠깐 옛 값 |
| Read-through | 캐시 라이브러리가 미스 시 로더 호출 | — | 앱 코드 단순 | 캐시 제품·라이브러리 지원 필요 |
| Write-through | 항상 캐시에 있음 | DB 와 캐시를 함께 갱신 | 읽기가 항상 신선 | 안 읽힐 데이터까지 캐시, 새 노드는 비어 있음 |
| Write-behind | — | 캐시에 쓰고 DB 는 나중에 비동기 반영 | 쓰기 지연 최소 | 캐시 장애 시 데이터 유실 위험 |

가장 흔한 조합은 **cache-aside + TTL**이다(AWS 도 lazy loading 과 write-through 에 TTL 을 더해 양쪽 장점을 얻으라고 권한다).

```ts
async function getProduct(id: string): Promise<Product | null> {
  const key = `product:v1:${id}`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);

  const row = await db.findProduct(id);
  if (row) await redis.set(key, JSON.stringify(row), { EX: 300 + jitter(60) });
  return row;
}

async function updateProduct(p: Product) {
  await db.updateProduct(p);              // 1) 원본 먼저
  await redis.del(`product:v1:${p.id}`);  // 2) 그다음 캐시 삭제
}
```

순서가 중요하다. 캐시를 먼저 지우면, DB 갱신 전 끼어든 읽기가 **옛 값을 다시 캐시에 넣는다**(Azure 문서의 경고).

## 무효화 방법

| 방법 | 설명 | 맞는 곳 |
| --- | --- | --- |
| TTL | 일정 시간 후 자동 만료 | 모든 캐시의 안전망. 약간 오래된 값 허용 |
| 쓰기 시 삭제 | 갱신 경로에서 키 삭제 | 갱신 경로가 한 서비스에 모여 있을 때 |
| 이벤트 기반 | 변경 이벤트(CDC, 아웃박스)를 받아 삭제 | 여러 서비스가 같은 데이터를 캐시 |
| 버전 키 | 키에 버전·해시를 넣어 새 키로 전환 | 스키마 변경, 정적 자원(`app.3f9a.js`) |

## 캐시 특유의 장애

- **스탬피드(thundering herd)**: 인기 키가 만료되는 순간 수많은 요청이 동시에 DB 로 몰린다. 대응: 키별 단일 비행(single-flight) 잠금, 만료 전 백그라운드 갱신, TTL 에 무작위 지터.
- **관통(penetration)**: 존재하지 않는 키를 반복 조회해 매번 DB 까지 간다. 대응: "없음"을 짧은 TTL 로 캐시, 입력 검증.
- **콜드 스타트**: 캐시 재시작 후 미스 폭주. 대응: 주요 키 미리 채우기(priming), 점진적 트래픽 전환.

## 언제 쓰나

- 읽기가 쓰기보다 훨씬 많고, 약간 오래된 값을 허용할 수 있는 데이터.
- 계산·조회 비용이 큰 결과(집계, 외부 API 응답, 렌더링된 조각).

## 주의 (비용)

- **적중률이 낮으면 손해다.** 확인 + 미스 + 채우기 비용만 늘어난다. 적중률을 측정한다.
- 민감 정보·권한별로 다른 데이터를 공유 캐시에 넣을 때는 키에 사용자·권한 범위를 넣거나 캐시하지 않는다.
- 인스턴스 로컬(인메모리) 캐시는 인스턴스마다 값이 달라진다. TTL 을 짧게 하거나 분산 캐시를 쓴다.
- 캐시가 없으면 DB 가 감당 못 하는 구조라면, 캐시는 이미 **필수 인프라**다. 캐시 장애 = 전체 장애가 되지 않도록 용량을 계획한다.
- 캐시로 느린 쿼리를 덮기 전에 [인덱스](/develop-wiki/knowledge/data-modeling/index-design/)·[N+1](/develop-wiki/knowledge/data-modeling/n-plus-one/)부터 고친다. 캐시는 문제를 숨기고 무효화라는 새 문제를 만든다.
