---
name: Marten
url: https://martendb.io
docs: https://martendb.io/getting-started
repo: https://github.com/JasperFx/marten
stars: 3471
domain: backend
category: database
description: PostgreSQL 의 JSONB 위에서 .NET 문서 DB 와 이벤트 스토어 기능을 제공하는 라이브러리. 관계형 DB 하나로 문서 저장과 이벤트 소싱을 함께 쓸 때 쓴다.
pricing: oss
tags: [dotnet, postgresql, document-db, event-sourcing, projections]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Marten 은 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 의 JSON 저장 기능을 이용해 [C#](/develop-wiki/languages/csharp/) 객체를 문서로 저장·조회하는 .NET 라이브러리다. 같은 DB 에서 **문서 데이터베이스**와 **이벤트 스토어**를 모두 제공하며, 이벤트로부터 만든 읽기 모델(프로젝션)을 같은 저장소에 둘 수 있다. 프로젝션은 이벤트를 추가하는 트랜잭션 안(인라인)에서 갱신하거나 비동기로 갱신할 수 있다.

라이선스는 MIT 이고 JasperFx 가 유지한다. 2026-11 기준 최신 릴리스는 V9.62.0(2026-11-16)이다. 같은 조직의 [Wolverine](/develop-wiki/backend/messaging/wolverine/) 과 함께 CQRS·이벤트 소싱 구조에 자주 쓰인다.

## 설치
```bash
dotnet add package Marten
```
PostgreSQL 서버가 필요하다(로컬은 Docker 로 실행). 지원하는 PostgreSQL·.NET 버전은 공식 문서에서 확인한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `IDocumentStore` | 앱 전체에서 공유하는 저장소 객체. `AddMarten` 으로 DI 에 등록 |
| 세션 | 작업 단위. 경량 세션(`UseLightweightSessions`)은 변경 추적 없이 `Store` 후 `SaveChangesAsync` 로 저장 |
| 문서 | `Id` 를 가진 일반 C# 클래스·레코드. 테이블에 JSONB 로 저장 |
| LINQ 쿼리 | `session.Query<T>()` 로 조건·정렬·페이징을 SQL 로 변환 |
| 이벤트 스트림 | `session.Events` 로 이벤트를 스트림 ID 단위로 추가·읽기 |
| 집계(aggregate) | 이벤트를 순서대로 적용해 만든 현재 상태 |
| 프로젝션 | 이벤트로부터 읽기 모델을 만드는 규칙. 인라인 또는 비동기 |

## 기본 사용법
문서 저장·조회(공식 시작 가이드 기반):
```csharp
// Program.cs
builder.Services.AddMarten(options =>
{
    options.Connection(builder.Configuration.GetConnectionString("Marten")!);
}).UseLightweightSessions();

public record User(Guid Id, string Name, bool Internal);

// IDocumentSession session 은 DI 로 주입
session.Store(new User(Guid.NewGuid(), "kim", false));
await session.SaveChangesAsync();

var users = await session.Query<User>()
    .Where(x => x.Internal == false)
    .ToListAsync();
```
이벤트 스트림과 집계(공식 이벤트 퀵스타트 기반):
```csharp
public sealed record QuestStarted(Guid QuestId, string Name);
public sealed record MembersJoined(Guid QuestId, int Day, string Location, string[] Members);

var questId = Guid.NewGuid();
session.Events.StartStream(questId, new QuestStarted(questId, "Destroy the Ring"));
session.Events.Append(questId, new MembersJoined(questId, 1, "Shire", ["Frodo", "Sam"]));
await session.SaveChangesAsync();
```
저장한 이벤트를 `AggregateStreamAsync<QuestParty>(questId)` 로 읽으면 집계 객체가 만들어진다.

## 자주 쓰는 패턴
- **인라인 프로젝션**: `SingleStreamProjection<T, Guid>` 를 상속해 읽기 모델 규칙을 정의하고 `Projections.Add<...>(ProjectionLifecycle.Inline)` 으로 등록한다. 이벤트와 같은 트랜잭션에서 갱신되어 읽기 직후 일관성이 필요할 때 쓴다.
- **비동기 프로젝션**: 같은 프로젝션을 비동기 수명주기로 등록하면 백그라운드 데몬이 처리한다. 쓰기 부하가 큰 읽기 모델에 알맞다.
- **스키마 이름 분리**: `options.DatabaseSchemaName = "other"` 로 Marten 테이블을 별도 스키마에 둔다.
- **Npgsql 데이터 소스**: `UseNpgsqlDataSource()` 로 DI 의 `NpgsqlDataSource` 를 재사용한다.
- **Wolverine 연동**: 아웃박스로 이벤트 저장과 메시지 발행을 같은 트랜잭션에 묶는다.

## 언제 쓰나 / 피할 때
- 쓸 때: PostgreSQL 을 이미 쓰면서 문서 저장이나 이벤트 소싱·CQRS 를 도입할 때, 별도 NoSQL 서버 없이 JSON 문서와 트랜잭션을 함께 쓰고 싶을 때.
- 피할 때(대안): 정규화된 관계형 모델과 복잡한 조인이 중심이면 [Entity Framework Core](/develop-wiki/backend/orm-query/entity-framework-core/) 나 [Dapper](/develop-wiki/backend/orm-query/dapper/) 가 맞다. PostgreSQL 이외 DB 가 필요하거나 JVM·Node 스택이면 [MongoDB](/develop-wiki/backend/database/mongodb/) 같은 문서 DB 를 고려한다.

## 공식 문서
- [소개](https://martendb.io/introduction.html) · [시작하기](https://martendb.io/getting-started) · [이벤트 퀵스타트](https://martendb.io/events/quickstart.html)
