---
name: MongoDB
url: https://www.mongodb.com
docs: https://www.mongodb.com/docs/manual/
repo: https://github.com/mongodb/mongo
domain: backend
category: database
description: JSON 형태(BSON) 문서를 컬렉션에 저장하는 문서형 DB. 스키마가 자주 바뀌는 데이터에 쓴다. Community 서버는 SSPL 로 OSI 오픈소스가 아니다.
pricing: source-available
tags: [nosql, document, sspl]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
문서형(document) 데이터베이스. 레코드를 BSON 문서로 저장하고, 문서 안에 배열·하위 문서를 중첩할 수 있어 객체 구조를 그대로 담기 좋다. 질의는 MQL(MongoDB Query Language)과 집계 파이프라인으로 한다. 2026-11 기준 안정 버전은 9.0.

**라이선스:** Community Server 는 Server Side Public License(SSPL) v1 이다. 소스는 공개되지만 OSI 가 승인한 오픈소스 라이선스가 아니며, MongoDB 를 서비스로 제공하는 경우 강한 공개 의무가 붙는다. 사내 앱에서 DB 로 쓰는 것은 무료다. 매니지드 서비스는 MongoDB Atlas.

## 설치·실행
```bash
docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:9.0-ubi9-slim
mongosh                       # 공식 셸, 기본 localhost:27017 접속
```
트랜잭션을 쓰려면 단일 노드라도 레플리카 셋으로 띄운다(`... --replSet rs0` 후 `rs.initiate()`).

| mongosh 명령 | 뜻 |
| --- | --- |
| `show dbs` / `use app` | DB 목록 / 전환(없으면 첫 쓰기 때 생성) |
| `show collections` | 컬렉션 목록 |
| `db.users.getIndexes()` | 인덱스 목록 |

## 데이터 모델
데이터베이스 → 컬렉션 → 문서. 문서마다 고유한 `_id`(기본 `ObjectId`)가 있고 크기 상한은 16MB.

| BSON 타입 | 예 |
| --- | --- |
| 문자열·숫자 | `"a"`, `Int32`, `Long`, `Double`, `Decimal128` |
| 날짜 | `ISODate("2026-11-18T00:00:00Z")` |
| 구조 | 하위 문서 `{}`, 배열 `[]` |
| 식별자 | `ObjectId`, `UUID` |

모델링 원칙: 함께 읽는 데이터는 **임베드**, 독립적으로 커지거나 여러 곳에서 참조되면 **참조(`_id`)**.

## 기본 사용법 (CRUD)
```js
db.users.insertOne({ email: "a@example.com", plan: "pro", tags: ["beta"] })
db.users.find({ plan: "pro" }, { email: 1 })              // 조건, 프로젝션
db.users.find({ tags: "beta", createdAt: { $gte: ISODate("2026-01-01") } })
db.users.updateOne({ email: "a@example.com" }, { $set: { plan: "free" }, $push: { tags: "vip" } })
db.users.updateOne({ email: "b@example.com" }, { $set: { plan: "pro" } }, { upsert: true })
db.users.deleteOne({ email: "a@example.com" })

// 집계 파이프라인
db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }, { $limit: 10 }
])
```

## 인덱스·쿼리 성능
| 인덱스 | 용도 |
| --- | --- |
| 단일·복합 필드 | 등호·범위·정렬 (복합은 ESR 순서: Equality → Sort → Range) |
| 멀티키 | 배열 필드 자동 처리 |
| 텍스트 / 2dsphere | 간단한 텍스트 검색 / 지리 질의 |
| TTL | 일정 시간 뒤 문서 자동 삭제 |
| 고유·부분 | `{ unique: true }`, `partialFilterExpression` |

```js
db.users.createIndex({ plan: 1, createdAt: -1 })
db.users.find({ plan: "pro" }).sort({ createdAt: -1 }).explain("executionStats")
```
`explain` 결과에서 `COLLSCAN`(전체 스캔) 대신 `IXSCAN` 이 나오는지, `totalDocsExamined` 가 반환 수와 비슷한지 본다.

## 트랜잭션·일관성
- 단일 문서 쓰기는 항상 원자적이다. 여러 문서·컬렉션에 걸친 ACID 트랜잭션은 레플리카 셋/샤드 클러스터에서 지원한다.
- 쓰기 확인 수준 `writeConcern`(예: `majority`)과 읽기 수준 `readConcern`, `readPreference` 로 일관성과 지연을 조절한다.
- 고가용성은 레플리카 셋(primary 1 + secondary), 수평 확장은 샤딩(샤드 키 기준 분산).

## 애플리케이션 연동
| 언어 | 공식 드라이버 / ODM |
| --- | --- |
| TypeScript | `mongodb` / Mongoose |
| Python | `pymongo`(동기·비동기 API) |
| Go | `go.mongodb.org/mongo-driver/v2` |
| Java | MongoDB Java Driver / Spring Data MongoDB |

```ts
// npm install mongodb
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
try {
  const users = client.db('app').collection('users');
  await users.insertOne({ email: 'a@example.com', plan: 'pro' });
  const user = await users.findOne({ email: 'a@example.com' });
  console.log(user);
} finally {
  await client.close();
}
```
`MongoClient` 는 내부에 연결 풀을 가지므로 앱 전체에서 하나를 재사용한다.

## 운영 팁
- 백업: `mongodump`/`mongorestore`(논리), 파일 시스템 스냅샷, Atlas 는 자동 백업.
- 지표: 복제 지연(`rs.printSecondaryReplicationInfo()`), 느린 쿼리 프로파일러(`db.setProfilingLevel`), WiredTiger 캐시 사용률.
- 함정: 문서에 무한히 커지는 배열을 두지 않는다(16MB 한계·인덱스 비용). 샤드 키는 나중에 바꾸기 어렵다. 인증 없이 외부에 열지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 필드 구성이 자주 바뀌는 데이터(콘텐츠, 카탈로그, 이벤트), 객체 단위로 읽고 쓰는 앱, 수평 확장이 필요한 쓰기 부하.
- 피할 때(대안): 여러 엔터티를 조인하고 강한 제약조건이 필요하면 [PostgreSQL](/develop-wiki/backend/database/postgresql/)(JSONB 로 문서형도 일부 대체), 라이선스상 OSI 오픈소스가 필요하면 다른 선택지를 검토.

## 공식 문서
- [매뉴얼](https://www.mongodb.com/docs/manual/) · [CRUD](https://www.mongodb.com/docs/manual/crud/) · [집계](https://www.mongodb.com/docs/manual/aggregation/) · [인덱스](https://www.mongodb.com/docs/manual/indexes/) · [Docker 설치](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-community-with-docker/) · [Node.js 드라이버](https://www.mongodb.com/docs/drivers/node/current/get-started/) · [릴리스 노트](https://www.mongodb.com/docs/manual/release-notes/)
