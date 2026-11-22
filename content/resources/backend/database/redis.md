---
name: Redis
url: https://redis.io
docs: https://redis.io/docs/latest/
repo: https://github.com/redis/redis
stars: 77690
domain: backend
category: database
description: 메모리 기반 키-값 저장소. 캐시, 세션, 랭킹, 레이트 리밋, 큐에 쓴다. Redis 8 부터 AGPLv3·SSPL·RSALv2 중 택일 라이선스이며, BSD 포크로 Valkey 가 있다.
pricing: oss
tags: [nosql, key-value, cache, in-memory, valkey]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
인메모리 키-값(key-value) 데이터 저장소. 모든 데이터를 메모리에 두고 단일 스레드 이벤트 루프로 명령을 처리해 지연이 매우 낮다. 값으로 문자열뿐 아니라 해시·리스트·셋·정렬 셋·스트림 같은 자료구조를 쓸 수 있어 캐시 이상의 용도(랭킹, 큐, 레이트 리밋)에 쓰인다. Redis 8 부터 예전 Redis Stack 의 JSON·검색(Query Engine)·시계열·확률 자료구조가 기본 배포판에 들어갔다. 2026-11 기준 최신 릴리스는 8.10.x.

## 라이선스와 Valkey
| 버전 | 라이선스 |
| --- | --- |
| 7.2 이하 | BSD-3-Clause |
| 7.4 | RSALv2 / SSPLv1 (소스 공개, OSI 오픈소스 아님) |
| 8.0 이후 | **RSALv2 / SSPLv1 / AGPLv3 중 선택** — AGPLv3 를 고르면 OSI 오픈소스 |

- **Valkey**: Redis 의 라이선스 변경 뒤 BSD 시절 코드를 기반으로 만든 포크. Linux Foundation 이 후원하고 BSD-3-Clause 를 유지한다. 2026-11 기준 9.1.x. RESP 프로토콜과 명령이 호환되어 대부분의 Redis 클라이언트로 접속할 수 있고, 여러 클라우드 매니지드 서비스가 Valkey 를 제공한다.
- 선택 기준: AGPL 조건이 문제없고 Redis 8 의 통합 모듈(JSON·검색 등)이 필요하면 Redis, 허용적 라이선스가 필요하면 Valkey.

## 설치·실행
```bash
docker run -d --name redis -p 6379:6379 redis:8
docker exec -it redis redis-cli       # 공식 CLI
```

| redis-cli | 뜻 |
| --- | --- |
| `PING` | 연결 확인 |
| `SCAN 0 MATCH user:* COUNT 100` | 키 탐색 (`KEYS *` 는 운영 금지) |
| `TYPE key` / `TTL key` | 자료형 / 남은 만료 시간 |
| `INFO memory` | 메모리 사용 현황 |

## 데이터 모델
논리 DB(0~15) 안의 평평한 키 공간. 키 이름은 `user:42:profile` 처럼 콜론으로 네임스페이스를 만드는 관례를 쓴다.

| 자료형 | 용도 예 |
| --- | --- |
| String | 캐시 값, 카운터(`INCR`) |
| Hash | 객체 필드 (`HSET user:1 name ...`) |
| List | 간단한 큐 |
| Set / Sorted Set | 고유 집합 / 랭킹·우선순위 |
| Stream | 로그형 이벤트, 소비자 그룹 |
| JSON, 벡터 집합 등 | Redis 8 통합 기능 |

## 기본 사용법 (CRUD)
```text
SET session:abc '{"userId":1}' EX 3600     # 생성 + 1시간 만료
GET session:abc
HSET user:1 email a@example.com plan pro
HGETALL user:1
INCR page:views
ZADD leaderboard 120 alice 95 bob
ZRANGE leaderboard 0 9 REV WITHSCORES      # 상위 10명
EXPIRE user:1 600
DEL session:abc
```

## 인덱스·쿼리 성능
- 기본적으로 **키로만 조회**한다. 값 내용으로 찾으려면 Sorted Set·Set 으로 직접 보조 인덱스를 만들거나, Redis 8 의 Query Engine(`FT.CREATE`, `FT.SEARCH`)을 쓴다.
- 성능 진단: `SLOWLOG GET 10`(느린 명령), `LATENCY DOCTOR`, `--bigkeys` 옵션으로 큰 키 찾기.
- O(N) 명령(`KEYS`, 큰 컬렉션의 `HGETALL`/`SMEMBERS`)은 이벤트 루프를 막으니 `SCAN` 계열로 바꾼다.
- 여러 명령은 파이프라이닝으로 왕복 횟수를 줄인다.

## 트랜잭션·일관성
- 각 명령은 원자적이다. `MULTI`/`EXEC` 는 명령 묶음을 끊김 없이 실행하지만 **롤백은 없다**. 낙관적 잠금은 `WATCH`.
- 여러 단계를 원자적으로 처리하려면 Lua 스크립트 또는 Functions(`FUNCTION LOAD`, `FCALL`)를 쓴다.
- 영속성: RDB 스냅샷, AOF(명령 로그), 둘 다 켜기 가능. 복제는 비동기라 장애 시 최근 쓰기가 유실될 수 있다.
- 고가용성은 Sentinel, 수평 분할은 Redis Cluster(16384 해시 슬롯).

## 애플리케이션 연동
| 언어 | 클라이언트 |
| --- | --- |
| TypeScript | `redis`(node-redis), `ioredis` |
| Python | `redis`(redis-py) |
| Go | `github.com/redis/go-redis/v9` |
| Java | Jedis, Lettuce / Spring Data Redis |

```python
# pip install redis
import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
r.set("session:abc", "user-1", ex=3600)
print(r.get("session:abc"))

pipe = r.pipeline()          # 기본값으로 MULTI/EXEC 트랜잭션
pipe.incr("page:views")
pipe.expire("page:views", 86400)
print(pipe.execute())
```

## 운영 팁
- 메모리 상한 `maxmemory` 와 제거 정책 `maxmemory-policy`(캐시면 `allkeys-lru` 등)를 반드시 정한다.
- 지표: 메모리 사용률, `evicted_keys`, `keyspace_hits/misses`(적중률), 연결 수, 복제 지연.
- 함정: 만료 없는 캐시 키 누적, 거대한 단일 키(hot/big key), 인증·바인딩 없이 외부 노출. 캐시 용도라도 대량 동시 만료(캐시 스탬피드)에 대비해 TTL 에 지터를 준다.

## 언제 쓰나 / 피할 때
- 쓸 때: DB 앞단 캐시, 세션 저장소, 분산 락·레이트 리밋, 실시간 랭킹, 가벼운 메시지 큐/스트림.
- 피할 때(대안): 메모리보다 큰 데이터나 원본 데이터 저장소 → [PostgreSQL](/develop-wiki/backend/database/postgresql/) 등, 내구성이 중요한 메시징 → 전용 메시지 브로커, 허용적 라이선스 필요 → Valkey.

## 공식 문서
- [Redis 문서](https://redis.io/docs/latest/) · [명령 레퍼런스](https://redis.io/docs/latest/commands/) · [Docker 로 실행](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/docker/) · [클라이언트 목록](https://redis.io/docs/latest/develop/clients/) · [라이선스(LICENSE.txt)](https://github.com/redis/redis/blob/unstable/LICENSE.txt) · [Valkey](https://valkey.io/)
