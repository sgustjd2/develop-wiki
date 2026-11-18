---
title: 분산 락과 펜싱 토큰
aka: [Distributed Lock, Fencing Token, Lease, Redlock, Lock with TTL, 분산 잠금]
category: distributed-systems
level: advanced
summary: 만료 시간이 있는 분산 락만으로는 프로세스 정지·지연 때문에 상호 배제가 깨진다. 락을 줄 때마다 증가하는 번호(펜싱 토큰)를 저장소가 검사해야 정확성을 지킬 수 있다.
tags: [distributed-systems, lock, lease, fencing-token, redlock, mutual-exclusion, zookeeper]
related: [distributed-systems/raft-consensus, distributed-systems/paxos-vs-raft, distributed-systems/logical-clocks, distributed-systems/idempotency, data-modeling/optimistic-pessimistic-locking, data-modeling/advisory-locks, cs-fundamentals/race-condition-lock-deadlock]
sources:
  - https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
  - https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/
updatedAt: 2026-11-19
---

## 문제

여러 서버가 같은 자원(파일, 행, 외부 API)을 동시에 고치면 안 될 때 분산 락을 쓴다. 보통 구현은 **만료 시간(TTL, 리스)이 있는 락**이다. 락을 잡은 클라이언트가 죽어도 시간이 지나면 풀려야 하기 때문이다.

그런데 락을 잡았다는 사실을 클라이언트가 **정확히 알 수 없다.** 락 획득 후 쓰기 직전에 GC 정지, 페이지 폴트, CPU 경합, 지연된 패킷이 끼면 클라이언트는 리스가 만료된 줄 모른 채 쓰기를 보낸다. 그 사이 다른 클라이언트가 락을 잡고 이미 썼다면 데이터가 깨진다. "쓰기 직전에 만료를 검사"해도 검사와 쓰기 사이에 정지가 끼면 소용없다. Kleppmann 의 글은 패킷이 90초 정도 지연된 실제 사례도 언급한다.

## 해법: 펜싱 토큰

1. 락 서비스가 락을 **줄 때마다 단조 증가하는 번호**를 같이 발급한다.
2. 클라이언트는 자원에 쓸 때 이 토큰을 함께 보낸다.
3. **자원(저장소)이** 지금까지 본 가장 큰 토큰을 기억하고, 그보다 작은 토큰의 쓰기를 거절한다.

```ts
// 락 서비스: 락을 줄 때마다 단조 증가 토큰을 발급
class LockService {
  private token = 0; private holder: string | null = null; private expires = 0;
  acquire(who: string, now: number, ttl: number): number | null {
    if (this.holder && now < this.expires) return null;
    this.holder = who; this.expires = now + ttl; return ++this.token;
  }
}
// 저장소: 본 적 있는 가장 큰 토큰을 기억하고, 그보다 작은 토큰의 쓰기는 거절
class Storage {
  private maxToken = 0; value = '';
  write(token: number, v: string): boolean {
    if (token < this.maxToken) return false;
    this.maxToken = token; this.value = v; return true;
  }
}

const lock = new LockService(), store = new Storage();
const t1 = lock.acquire('client1', 0, 10)!;        // 토큰 1, 이후 GC 로 멈춤
const t2 = lock.acquire('client2', 11, 10)!;       // 리스 만료 후 토큰 2
console.log(store.write(t2, 'from client2'));      // true
console.log(store.write(t1, 'from client1 (stale)')); // false — 펜싱이 막음
```

핵심은 **검사 주체가 클라이언트가 아니라 저장소**라는 점이다. 클라이언트는 자기 리스가 끝난 것을 모를 수 있기 때문이다. Kleppmann 은 ZooKeeper 의 `zxid` 나 znode 버전을 토큰으로 쓸 수 있다고 설명한다. 저장소가 DB 라면 버전 칼럼을 조건으로 거는 방식(낙관적 잠금)이 같은 역할을 한다 → [낙관적·비관적 잠금](/develop-wiki/knowledge/data-modeling/optimistic-pessimistic-locking/).

## Redlock 논쟁

Redis 문서가 소개하는 **Redlock** 은 독립된 Redis 마스터 N(예: 5)대에 같은 키를 `SET NX PX` 로 잡고, 과반을 잡았고 걸린 시간이 TTL 보다 짧으면 락을 얻은 것으로 본다. 단일 Redis 에 복제본만 붙이면 비동기 복제 때문에 장애 전환 시 두 클라이언트가 락을 가질 수 있어서 만든 설계다.

Kleppmann 의 비판 요지(그리고 Redis 문서가 스스로 달아 둔 경고)는 이렇다.

- Redlock 이 주는 무작위 값에는 **순서가 없어** 펜싱 토큰으로 쓸 수 없다. 여러 노드의 카운터는 어긋날 수 있고, 제대로 만들려면 합의 알고리즘이 필요하다.
- 안전성이 **시간 가정**에 기댄다. 만료 시계가 벽시계(`gettimeofday`)라 NTP 가 시각을 건너뛰면 키가 일찍 사라지고, 지연·프로세스 정지가 TTL 에 비해 충분히 작다는 가정이 필요하다.
- 그래서 락의 **용도**를 나눈다. 중복 작업을 줄이는 효율용이면 단일 Redis 의 간단한 락으로 충분하고(실패해도 손실이 작다), **정확성용**이면 합의 기반 시스템(ZooKeeper 등)이나 트랜잭션 DB 와 펜싱 토큰을 쓰라고 한다.
- Redis 문서도 정확성이 걱정되면 펜싱 토큰을 구현하라고 안내하고, TTL 만료가 단조 시계를 쓰지 않는 점을 알려진 한계로 적는다.

이 논쟁에는 Redlock 저자의 반론도 있다(Redis 문서가 링크). 이 노트는 반론 원문을 직접 읽지 않았으므로 판단은 두 글을 모두 읽고 하길 권한다.

## 선택 기준

| 목적 | 권장 | 이유 |
| --- | --- | --- |
| 중복 실행 방지(이메일 한 번만, 캐시 재계산) | 단일 Redis `SET NX PX` + 값 비교 삭제 | 어쩌다 깨져도 피해가 작음 |
| 데이터 정합성(잔액, 재고, 파일 덮어쓰기) | 저장소가 직접 막는 방식: 버전 조건부 쓰기, DB 행 잠금, 펜싱 토큰 | 락 서비스를 믿지 않아도 안전 |
| 리더 선출·구성 관리 | ZooKeeper 같은 합의 기반 서비스 | 순서 있는 토큰(zxid, znode 버전)을 쓸 수 있음 |
| 같은 DB 안에서 단일 작업자 보장 | [어드바이저리 락](/develop-wiki/knowledge/data-modeling/advisory-locks/) | 자원이 같은 DB 라 락과 데이터가 한 곳에 있음 |

## 언제 쓰나

- 락이 필요한 자원이 **저장소 쪽에서 토큰을 검사해 줄 수 있을 때**(자체 DB, 버전 지원 API).
- 클라이언트가 락을 오래 쥐는 작업(큰 파일 처리)이 있어 정지 가능성이 높을 때.

## 주의 (비용)

- **자원이 토큰을 검사하지 못하면 펜싱은 불가능하다.** 외부 SaaS API 처럼 우리 맘대로 못 바꾸는 자원이면 [멱등성 키](/develop-wiki/knowledge/distributed-systems/idempotency/) 같은 다른 방어가 필요하다.
- 락 서비스를 합의 기반으로 올리면 지연과 운영 부담이 늘어난다.
- 락 대신 **락이 필요 없는 설계**(멱등한 연산, 단일 작성자 파티션, 낙관적 버전 검사)가 가능한지 먼저 본다. 락은 마지막 수단에 가깝다.
- TTL 연장(락 갱신) 로직은 "락이 유지되는 동안 프로세스가 살아 있다"는 가정을 만들어 낸다. Redis 문서도 락이 유지된다고 가정하지 말라고 경고한다.
