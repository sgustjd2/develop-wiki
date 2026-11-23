---
name: MariaDB
url: https://mariadb.org
docs: https://mariadb.com/kb/en/documentation/
repo: https://github.com/MariaDB/server
stars: 8650
domain: backend
category: database
description: MySQL 에서 갈라져 나온 오픈소스 관계형 DB(GPLv2). MySQL 과 호환되는 프로토콜·SQL 에 벡터 검색, 시간 테이블, ColumnStore 같은 기능을 더했다.
pricing: oss
tags: [rdbms, sql, mysql-compatible, vector, temporal]
languages: [sql]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
MariaDB 는 MariaDB Foundation 이 이끄는 오픈소스 RDBMS다. MySQL 클라이언트·커넥터로 접속하는 구성이 많고 InnoDB 기반 OLTP 에 쓴다. 공식 문서가 내세우는 기능은 `VECTOR` 컬럼과 유사도 검색, JSON, 시간 테이블(과거 시점 조회), CTE·윈도 함수·시퀀스, 분석용 ColumnStore 다. 라이선스는 GPL-2.0 이다.

- 이 문서는 [다운로드 REST API](https://downloads.mariadb.org/rest-api/mariadb/) 기준으로 **12.3**(LTS, 지원 종료 2029-06-12), **11.8**(LTS, 2030-02-13), 11.4(LTS, 2029-05-29)가 안정 LTS 이고 13.0 이 롤링 안정판, 13.1 이 RC 인 시점이다. Docker `mariadb:lts` 태그는 현재 LTS 를 가리킨다. GitHub 저장소 최신 태그는 `mariadb-13.0.2`(2026-09-15)다.
- 대안: 기능과 생태계가 가장 가까운 [MySQL](/develop-wiki/backend/database/mysql/), 확장성과 표준 준수가 중요하면 [PostgreSQL](/develop-wiki/backend/database/postgresql/).

## 설치·실행
```bash
docker run -d --name mariadb -p 3306:3306 \
  -e MARIADB_ROOT_PASSWORD=changeme \
  mariadb:lts
docker exec -it mariadb mariadb -uroot -pchangeme
```
시작 후 몇 초는 접속이 거부될 수 있다. 비밀번호는 예시이며 실제 환경에서는 비밀 관리 도구로 주입한다.

## 데이터 모델
테이블·인덱스·뷰·저장 프로시저를 쓰는 관계형 모델이다. 문서형 데이터는 JSON 컬럼에, 임베딩은 `VECTOR` 컬럼에 같은 테이블로 저장할 수 있다. 스토리지 엔진은 기본 InnoDB 이고 분석용으로 ColumnStore 를 쓴다.

## 기본 사용법 (CRUD)
```sql
CREATE DATABASE shop;
USE shop;
CREATE TABLE items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL);

INSERT INTO items (name) VALUES ('pen');
SELECT id, name FROM items WHERE name LIKE 'p%';
UPDATE items SET name = 'pencil' WHERE id = 1;
DELETE FROM items WHERE id = 1;
```

## 인덱스·쿼리 성능
기본 인덱스는 InnoDB B-tree 다. 느린 쿼리는 `EXPLAIN SELECT ...` 로 실행 계획을 확인하고 인덱스 사용 여부를 본다. 벡터 유사도 검색의 인덱스 방식은 사용 버전의 공식 문서에서 확인한다.

## 트랜잭션·일관성
InnoDB 에서 ACID 트랜잭션과 행 단위 잠금을 지원한다. 시간 테이블로 한 행의 과거 버전을 보존하고 특정 시점 기준으로 조회할 수 있다. 복제 구성(비동기·Galera 등)은 요구사항에 맞게 [공식 문서](https://mariadb.com/kb/en/documentation/)에서 선택한다.

## 애플리케이션 연동
공식 커넥터가 Python, Node.js, Java, PHP, C#/.NET, C++ 에 제공된다. 예(Python):
```python
import mariadb  # pip install mariadb

conn = mariadb.connect(host="127.0.0.1", user="root", password="changeme", database="shop")
cur = conn.cursor()
cur.execute("SELECT id, name FROM items WHERE name LIKE ?", ("p%",))
print(cur.fetchall())
conn.close()
```
MySQL 드라이버로도 접속되는 경우가 많지만 버전별 호환은 도입 전에 시험한다.

## 운영 팁
- LTS 를 기본으로 고르고 지원 종료일을 업그레이드 계획에 적는다.
- MySQL 에서 옮길 때는 공식 문서의 마이그레이션(차이점) 절을 먼저 확인한다.
- 백업·모니터링 방식은 사용 중인 버전의 도구(`mariadb-backup` 등)를 공식 문서에서 확인해 선택한다.

## 언제 쓰나 / 피할 때
- 쓸 때: MySQL 호환 RDBMS 가 필요하고 오픈소스 거버넌스를 선호할 때, 한 DB 에서 관계형·JSON·벡터를 함께 다룰 때.
- 피할 때(대안): 확장 생태계(PostGIS 등)가 핵심이면 PostgreSQL, Oracle 지원·MySQL HeatWave 가 필요하면 MySQL.

## 공식 문서
- [MariaDB 문서](https://mariadb.com/kb/en/documentation/) · [다운로드·릴리스](https://mariadb.org/download/) · [저장소](https://github.com/MariaDB/server)
