---
name: MySQL
url: https://www.mysql.com
docs: https://dev.mysql.com/doc/refman/8.4/en/
repo: https://github.com/mysql/mysql-server
domain: backend
category: database
description: Oracle 이 개발하는 오픈소스 관계형 DB(Community Edition, GPLv2). 웹 서비스 OLTP 와 읽기 복제 구성에 널리 쓴다.
pricing: oss
tags: [rdbms, sql, innodb]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
관계형(RDBMS) 데이터베이스. 기본 스토리지 엔진 InnoDB 가 행 단위 잠금·MVCC·크래시 복구를 담당한다. 운영 도구와 호스팅 선택지가 많아 웹 서비스 OLTP 에 오래 쓰여 왔다. 커뮤니티 포크로 MariaDB 가 있다.

**릴리스 트랙(2026-11 기준):** LTS(8.4, 9.7)와 Innovation 으로 나뉜다. 9.7 이후로는 `YY.M.P` 달력 버전(26.7, 26.10 …)을 쓰며, 번호만으로는 LTS 여부를 알 수 없으니 릴리스 정보에서 확인한다. 운영 환경은 LTS 를 기본으로 고른다.

## 설치·실행
```bash
docker run --name mysql -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 -d mysql:8.4
docker exec -it mysql mysql -uroot -p     # 공식 CLI mysql 로 접속
```
Oracle 컨테이너 레지스트리 이미지(`container-registry.oracle.com/mysql/community-server`)도 있다. 이 이미지는 생성된 임시 root 비밀번호를 `docker logs` 로 확인한 뒤 바꿔야 한다.

| 명령 | 뜻 |
| --- | --- |
| `SHOW DATABASES;` / `USE db;` | DB 목록 / 전환 |
| `SHOW TABLES;` / `DESCRIBE users;` | 테이블 목록 / 구조 |
| `SHOW CREATE TABLE users\G` | 생성 DDL 보기 |

## 데이터 모델
서버 → 데이터베이스(= 스키마) → 테이블. 주요 자료형:

| 분류 | 타입 |
| --- | --- |
| 정수·숫자 | `INT`, `BIGINT`, `DECIMAL(p,s)` |
| 문자열 | `VARCHAR(n)`, `TEXT` (문자셋 기본 `utf8mb4`) |
| 시간 | `DATETIME`, `TIMESTAMP`(UTC 저장, 2038 한계) |
| 반정형 | `JSON` |

## 기본 사용법 (CRUD)
```sql
CREATE TABLE users (
  id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  meta  JSON
);
INSERT INTO users (email, meta) VALUES ('a@example.com', '{"plan":"pro"}');
SELECT id, email FROM users WHERE meta->>'$.plan' = 'pro';
UPDATE users SET meta = JSON_SET(meta, '$.plan', 'free') WHERE id = 1;
DELETE FROM users WHERE id = 1;
-- UPSERT
INSERT INTO users (email, meta) VALUES ('a@example.com', '{}') AS new
ON DUPLICATE KEY UPDATE meta = new.meta;   -- VALUES() 함수 형태는 deprecated
```

## 인덱스·쿼리 성능
- InnoDB 테이블은 **기본 키 순서로 저장(클러스터드 인덱스)** 된다. 보조 인덱스는 기본 키를 가리키므로 PK 는 짧고 단조 증가하는 값이 유리하다.
- B-tree(기본), `FULLTEXT`, 공간(`SPATIAL`) 인덱스, 함수 기반 인덱스(`((LOWER(email)))`)를 지원.
- 복합 인덱스는 왼쪽 컬럼부터 쓰일 때만 효과가 있다(leftmost prefix).

```sql
CREATE INDEX idx_users_email_lower ON users ((LOWER(email)));
EXPLAIN ANALYZE SELECT * FROM users WHERE LOWER(email) = 'a@example.com';
```

## 트랜잭션·일관성
- InnoDB 기본 격리 수준은 `REPEATABLE READ`. 범위 조건 쓰기에는 gap/next-key 잠금이 걸려 데드락이 생길 수 있다.
- DDL 은 암묵적 커밋을 일으켜 트랜잭션 안에서 롤백되지 않는다.
- 복제: binlog 기반 비동기·반동기 복제, Group Replication / InnoDB Cluster(다중 노드 HA).

```sql
START TRANSACTION;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
```

## 애플리케이션 연동
| 언어 | 드라이버 / ORM |
| --- | --- |
| TypeScript | `mysql2` / [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/), Prisma |
| Python | `mysql-connector-python`(공식), PyMySQL / SQLAlchemy |
| Go | `go-sql-driver/mysql` (+ `database/sql`) |
| Java | MySQL Connector/J / JPA(Hibernate) |

```ts
// npm install mysql2
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'localhost', user: 'root', password: 'secret', database: 'app',
});
const [rows] = await conn.execute('SELECT id, email FROM users WHERE id = ?', [1]);
console.log(rows);
await conn.end();
```

## 운영 팁
- 백업: 논리 백업 `mysqldump` 또는 MySQL Shell 의 dump 유틸리티, 물리 백업은 Percona XtraBackup 같은 도구.
- 지표: 슬로 쿼리 로그(`slow_query_log`), `performance_schema`·`sys` 스키마, 복제 지연, InnoDB 버퍼 풀 적중률.
- 함정: `utf8`(utf8mb3)이 아니라 `utf8mb4` 를 쓴다. 큰 테이블 `ALTER` 는 온라인 DDL(`ALGORITHM=INPLACE/INSTANT`) 지원 여부를 먼저 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 단순하고 읽기 많은 웹 OLTP, 읽기 복제본으로 수평 확장할 때, 운영 경험·호스팅 선택지가 중요할 때.
- 피할 때(대안): 고급 SQL·확장·JSON 질의가 많다면 [PostgreSQL](/develop-wiki/backend/database/postgresql/), 분석 집계는 [ClickHouse](/develop-wiki/backend/database/clickhouse/).

## 공식 문서
- [레퍼런스 매뉴얼 8.4 LTS](https://dev.mysql.com/doc/refman/8.4/en/) · [릴리스 모델(LTS/Innovation)](https://dev.mysql.com/doc/refman/26.10/en/mysql-releases.html) · [Docker 로 시작하기](https://dev.mysql.com/doc/refman/8.4/en/docker-mysql-getting-started.html) · [문서 목록](https://dev.mysql.com/doc/)
