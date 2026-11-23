---
name: Dapper
url: https://github.com/DapperLib/Dapper
docs: https://www.learndapper.com/
repo: https://github.com/DapperLib/Dapper
stars: 18416
domain: backend
category: orm-query
description: ADO.NET DbConnection 에 Query·Execute 확장 메서드를 더해 SQL 결과를 객체로 매핑하는 .NET 마이크로 ORM. SQL 을 직접 쓰되 매핑 코드는 줄이고 싶을 때 쓴다.
pricing: oss
tags: [dotnet, micro-orm, ado-net, sql, mapping]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Dapper 는 `DbConnection` 의 확장 메서드로 동작하는 NuGet 라이브러리다. SQL 을 직접 작성하고 파라미터를 익명 객체로 넘기면 결과 행을 타입에 매핑해 준다. 변경 추적·마이그레이션·LINQ 번역이 없는 대신 가볍고 SQL 을 완전히 통제할 수 있다. 동기·비동기 API 를 모두 제공한다.

- 이 문서는 **2.1.89**(GitHub 릴리스·NuGet, 2026-09-23) 기준이다. 라이선스는 Apache-2.0(저장소 `License.txt`; GitHub 의 SPDX 자동 판별은 비어 있음).
- 대안: 변경 추적·마이그레이션까지 필요하면 [Entity Framework Core](/develop-wiki/backend/orm-query/entity-framework-core/). 둘을 섞어 EF Core 로 쓰기와 Dapper 로 읽기를 나누는 구성도 흔하다.

## 설치
```bash
dotnet add package Dapper
```
추가 패키지로 Dapper.Rainbow, Dapper.SqlBuilder, Dapper.EntityFramework 가 있다(README 기준). DB 드라이버(예: `Npgsql`, `Microsoft.Data.SqlClient`)는 별도로 설치한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Query<T>` | SELECT 결과를 `T` 목록으로 매핑 |
| `Execute` | INSERT·UPDATE·DELETE 를 실행하고 영향받은 행 수 반환. 파라미터 객체 컬렉션을 넘기면 항목마다 실행 |
| 익명 파라미터 | `new { Id = 1 }` 형태로 바인딩해 SQL 인젝션을 방지 |
| `DynamicParameters` | 조건부로 파라미터를 추가할 때 사용 |
| Multi-mapping | `Query<Post, User, Post>` 와 `splitOn`(기본 `Id`)으로 한 행을 여러 객체로 매핑 |

## 기본 사용법
```csharp
using Dapper;
using Npgsql;

public record Dog(int Id, string Name);

await using var conn = new NpgsqlConnection(connectionString);

// 조회
var dogs = (await conn.QueryAsync<Dog>(
    "select id, name from dogs where name like @pattern",
    new { pattern = "B%" })).ToList();

// 변경
var affected = await conn.ExecuteAsync(
    "insert into dogs (name) values (@Name)",
    new { Name = "Bello" });
```
테이블 `dogs` 와 `Dog` 타입은 예시다. 컬럼명과 속성명이 다르면 SQL 에서 `as` 로 별칭을 준다.

## 자주 쓰는 패턴
- **읽기 전용 쿼리**: 목록·리포트 조회에 SQL 을 직접 최적화해 쓴다.
- **일괄 실행**: 파라미터 객체 컬렉션을 `Execute` 에 넘겨 반복 실행한다.
- **조인 매핑**: `splitOn` 으로 열 경계를 지정해 부모-자식 객체를 구성한다.
- **트랜잭션**: `conn.BeginTransaction()` 을 만들고 각 호출에 `transaction:` 인자로 넘긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: SQL 성능과 제어가 중요한 .NET 서비스, 읽기 위주 쿼리, 기존 SQL 자산을 재사용할 때.
- 피할 때(대안): 모델 변경 추적과 마이그레이션을 통합 관리하고 싶으면 EF Core. SQL 을 DB 별로 따로 관리하기 싫은 팀.

## 공식 문서
- [저장소 README](https://github.com/DapperLib/Dapper) · [Learn Dapper](https://www.learndapper.com/)
