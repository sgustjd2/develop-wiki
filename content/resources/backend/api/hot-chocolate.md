---
name: Hot Chocolate
url: https://chillicream.com/docs/hotchocolate/
docs: https://chillicream.com/docs/hotchocolate/v16/get-started-with-graphql-in-net-core
repo: https://github.com/ChilliCream/graphql-platform
stars: 5765
domain: backend
category: api
description: ChilliCream 이 만든 .NET 용 GraphQL 서버 라이브러리. ASP.NET Core 에서 C# 클래스로 GraphQL 스키마를 정의하고 API 를 제공할 때 쓴다.
pricing: oss
tags: [graphql, dotnet, aspnet-core, code-first, dataloader]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hot Chocolate 는 ChilliCream GraphQL Platform 의 서버 구성 요소로, ASP.NET Core 위에서 [GraphQL](/develop-wiki/backend/api/graphql/) 명세를 구현한다. 기본은 **구현 우선(implementation-first)** 방식으로, C# 클래스와 메서드에 `[QueryType]` 같은 특성을 붙이면 소스 생성기가 빌드 시점에 타입 등록 코드를 만든다. 코드로 타입을 기술하는 code-first(`ObjectType<T>`)와 SDL 을 먼저 쓰는 schema-first 도 지원한다. 같은 저장소에 DataLoader 라이브러리 **GreenDonut**, .NET GraphQL 클라이언트 **Strawberry Shake**, GraphQL IDE **Nitro**, 분산 스키마 게이트웨이 **Fusion** 이 함께 있다.

라이선스는 MIT(코드에 한함, 이름·로고는 별도 상표). 2026-11 기준 최신 안정판은 **16.7.6**(2026-11-17)이고 16.8 프리뷰가 진행 중이다. 15.x·14.x·13.x 도 보안·버그 수정 릴리스가 함께 나온다. Nitro 클라우드 등 일부 상용 서비스가 있지만 서버 라이브러리는 오픈소스다.

## 설치
```bash
dotnet new install HotChocolate.Templates
dotnet new graphql --name MyApi        # 서버 템플릿
# 기존 프로젝트라면
dotnet add package HotChocolate.AspNetCore
dotnet add package HotChocolate.Types.Analyzers   # [QueryType] 소스 생성기
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `AddGraphQL()` / `AddGraphQLServer()` | 스키마 빌더 등록. 템플릿은 `builder.AddGraphQL().AddTypes()` |
| `AddTypes()` | 소스 생성기가 만든 확장 메서드. 특성이 붙은 타입을 한 번에 등록 |
| `[QueryType]`, `[MutationType]`, `[SubscriptionType]` | 루트 타입 확장. `partial` 클래스여야 함 |
| `[ObjectType<T>]` | 기존 엔티티 타입에 필드(리졸버)를 추가하는 확장 |
| `MapGraphQL()` | 기본 `/graphql` 엔드포인트와 Nitro IDE 연결 |
| DataLoader | `[DataLoader]` 메서드에서 배치 로더를 생성해 N+1 을 막음 |
| Projections / Filtering / Sorting | `[UseProjection]`, `[UseFiltering]`, `[UseSorting]` 으로 `IQueryable` 에 반영 |
| Paging | `[UsePaging]` 으로 Relay 커서 페이지네이션 |

## 기본 사용법
템플릿이 만드는 구조와 같은 최소 서버:
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.AddGraphQL().AddTypes();
var app = builder.Build();
app.MapGraphQL();                     // http://localhost:<port>/graphql
app.RunWithGraphQLCommands(args);     // 스키마 내보내기 등 CLI 명령 지원
```
```csharp
// Types/Query.cs
public record Book(string Title, string Author);

[QueryType]
public static partial class Query
{
    public static Book GetBook() => new("C# in Depth", "Jon Skeet");   // 필드 이름: book
}

[MutationType]
public static partial class Mutation
{
    public static Book AddBook(string title, string author) => new(title, author);
}
```
조회: `{ book { title author } }`. `Get` 접두사는 필드 이름에서 빠진다.

## 자주 쓰는 패턴
- **EF Core 연동**: 리졸버 파라미터로 `DbContext` 를 주입받고 `IQueryable` 을 반환한 뒤 `[UsePaging] [UseProjection] [UseFiltering] [UseSorting]` 을 붙여 필요한 컬럼만 조회한다.
- **DataLoader**: `[DataLoader] static Task<Dictionary<int, Author>> GetAuthorByIdAsync(IReadOnlyList<int> ids, AppDbContext db, CancellationToken ct)` 같은 메서드로 배치 로더를 생성한다.
- **인증·인가**: `AddAuthorization()` 후 필드에 `[Authorize]`(HotChocolate.Authorization)를 붙이고 ASP.NET Core 인증(JWT Bearer 등)을 그대로 쓴다.
- **스키마 파일 관리**: `dotnet run -- schema export` 로 SDL 을 내보내 CI 에서 변경을 검토한다.
- **구독**: `[SubscriptionType]` 과 인메모리·Redis 구독 프로바이더, `app.UseWebSockets()` 를 함께 설정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/) 기반 GraphQL API, EF Core 데이터에 필터·정렬·페이징을 빠르게 붙일 때, 여러 서비스를 Fusion 게이트웨이로 묶을 때.
- 피할 때(대안): 클라이언트가 하나뿐이고 단순한 CRUD 면 REST(+[OpenAPI](/develop-wiki/backend/api/openapi/))나 서비스 간 통신이면 [gRPC](/develop-wiki/backend/api/grpc/) 가 더 단순하다. 다른 .NET 구현으로는 GraphQL.NET 이 있다.

## 공식 문서
- [시작하기(v16)](https://chillicream.com/docs/hotchocolate/v16/get-started-with-graphql-in-net-core) · [문서](https://chillicream.com/docs/hotchocolate/) · [릴리스](https://github.com/ChilliCream/graphql-platform/releases) · [GraphQL 워크숍](https://github.com/ChilliCream/graphql-workshop)
- 언어: [C#](/develop-wiki/languages/csharp/) · ORM: [Entity Framework Core](/develop-wiki/backend/orm-query/entity-framework-core/)
