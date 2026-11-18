---
title: 커넥션 풀
aka: [Connection Pool, Connection Pooling, Pool Sizing, PgBouncer, HikariCP, DB 커넥션 풀]
category: performance
level: intermediate
summary: DB 연결을 미리 만들어 재사용하는 커넥션 풀의 동작과, "작을수록 빠를 때가 많다"는 크기 산정 원칙, 인스턴스 수와 외부 풀러(PgBouncer)까지 고려한 설계.
tags: [database, connection-pool, postgresql, pgbouncer, hikaricp, scalability]
related: [performance/backpressure-load-shedding, performance/profiling, data-modeling/n-plus-one, data-modeling/transaction-isolation]
sources:
  - https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
  - https://www.pgbouncer.org/features.html
  - https://www.postgresql.org/docs/current/runtime-config-connection.html
updatedAt: 2026-11-18
---

## 문제

DB 연결 하나를 맺으려면 TCP·TLS 핸드셰이크, 인증, 서버 쪽 프로세스(PostgreSQL 은 연결마다 백엔드 프로세스) 생성이 필요하다. 요청마다 새로 연결하면 느리고, DB 에 연결 폭주를 일으킨다. 반대로 풀을 너무 크게 잡으면 DB 가 동시 쿼리에 시달리며 전체가 느려진다.

## 해법

애플리케이션이 연결을 미리 열어 두고 빌려 쓴 뒤 돌려준다.

```ts
import { Pool } from 'pg';

const pool = new Pool({
  max: 10,                        // 인스턴스당 최대 연결
  idleTimeoutMillis: 30_000,      // 놀고 있는 연결 정리
  connectionTimeoutMillis: 2_000, // 풀에서 연결을 못 얻으면 빨리 실패 (무한 대기 금지)
});

// 반드시 반납: 트랜잭션은 try/finally 로
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE account SET balance = balance - $1 WHERE id = $2', [amt, from]);
  await client.query('COMMIT');
} catch (e) { await client.query('ROLLBACK'); throw e; }
finally { client.release(); }
```

## 크기 정하기

직관과 반대로 **작은 풀이 대체로 빠르다.** DB 가 실제로 동시에 처리할 수 있는 일은 코어 수와 디스크에 묶여 있다. 그 이상의 동시 쿼리는 문맥 전환과 잠금 경합만 늘린다. HikariCP 문서가 소개한 Oracle 시연에서는 다른 조건 그대로 풀 크기만 2048 → 96 으로 줄여 응답 시간이 약 100ms → 2ms 로 줄었다.

- 출발점(PostgreSQL 쪽에서 나온 공식): `연결 수 = (코어 수 × 2) + 유효 스핀들 수`. 데이터가 전부 메모리에 있으면 스핀들은 0. 4코어면 대략 10. SSD 에서의 적합성은 검증되지 않았으니 **부하 테스트로 조정**한다.
- 교착 회피 최소값: 한 요청이 동시에 연결 `Cm` 개를 잡고 스레드가 `Tn` 개면 `Tn × (Cm − 1) + 1`. 이것은 최소값이지 최적값이 아니다. 한 요청이 연결을 여러 개 동시에 잡지 않게 코드를 고치는 편이 낫다.
- 수천 명의 사용자도 연결 수십 개면 충분하다. **앱 스레드가 풀 앞에서 기다리는 것이 DB 안에서 다투는 것보다 낫다.**

### 전체를 보고 계산한다

```
DB 가 받는 연결 = 인스턴스당 max × 인스턴스 수 × (서비스 수)
```

오토스케일로 인스턴스가 20개로 늘면 `max: 10` 도 200 연결이다. PostgreSQL `max_connections` 기본값은 보통 100 이고, 늘리면 연결 수에 비례해 공유 메모리 등 자원 할당도 커진다. 서버리스·다수 인스턴스 환경에서는 외부 풀러를 둔다.

## 외부 풀러: PgBouncer

| 모드 | 서버 연결 점유 | 특징 |
| --- | --- | --- |
| 세션 | 클라이언트 연결 동안 | 모든 기능 동작, 절감 효과 작음 |
| 트랜잭션 | 트랜잭션 동안만 | 가장 많이 씀. 일부 세션 기능이 깨짐 |
| 문장 | 문장 하나 동안 | 다중 문장 트랜잭션 불가 |

트랜잭션 모드에서는 `SET`/`RESET`, `LISTEN`, 세션 수준 어드바이저리 잠금, `WITH HOLD` 커서 등이 동작하지 않는다. 프로토콜 수준 prepared statement 는 `max_prepared_statements` 를 0이 아닌 값으로 설정해야 쓸 수 있다.

## 언제 쓰나

- DB 를 쓰는 모든 서버 애플리케이션(드라이버·ORM 기본 풀 사용).
- 인스턴스가 많거나 서버리스 함수처럼 연결이 자주 생겼다 사라지면 PgBouncer·RDS Proxy 같은 외부 풀러.

## 주의 (비용)

- **연결 누수**(반납 누락)는 풀 고갈 → 전체 요청 대기로 번진다. `finally` 반납, 누수 탐지 옵션, 풀 대기 시간 지표를 둔다.
- 트랜잭션을 연 채로 외부 API 를 부르면 그동안 연결을 잡고 있다. 트랜잭션 안에서는 DB 일만 한다.
- 긴 배치 작업과 짧은 실시간 쿼리를 한 풀에 섞으면 튜닝이 어렵다. 풀을 나누는 것을 검토한다.
- 풀이 고갈됐을 때 무한 대기하지 말고 짧은 타임아웃으로 실패시켜 [백프레셔](/develop-wiki/knowledge/performance/backpressure-load-shedding/) 신호로 쓴다.
- 풀 크기를 늘려서 해결되는 문제는 드물다. 느린 쿼리·[N+1](/develop-wiki/knowledge/data-modeling/n-plus-one/)이 연결을 오래 잡고 있는지 먼저 본다.
