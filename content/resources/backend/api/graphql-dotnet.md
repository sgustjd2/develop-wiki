---
name: GraphQL.NET
url: https://graphql-dotnet.github.io
docs: https://graphql-dotnet.github.io/docs/getting-started/introduction/
repo: https://github.com/graphql-dotnet/graphql-dotnet
stars: 5984
domain: backend
category: api
description: .NET 용 GraphQL 실행 엔진. 코드 우선·스키마 우선·타입 우선 방식을 모두 지원하며 ASP.NET Core 서버 패키지와 함께 GraphQL API 를 만들 때 쓴다.
pricing: oss
tags: [graphql, dotnet, csharp, aspnet-core, schema-first, code-first]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
GraphQL.NET 은 GraphQL 명세를 .NET 에서 구현한 라이브러리로, 쿼리 파싱·검증·실행을 담당하는 코어(`GraphQL` NuGet 패키지)와 직렬화기, ASP.NET Core 전송 계층(`GraphQL.Server.*`)으로 나뉜다. 스키마는 세 가지 방식으로 만든다. SDL 문자열에서 만드는 스키마 우선(`Schema.For`), `ObjectGraphType` 을 상속해 정의하는 코드 우선, 일반 C# 클래스를 그대로 노출하는 타입 우선(`AddAutoSchema`)이다. 라이선스는 MIT, 최신 안정판은 **8.8.5**(2026-08-18)이고 서버 패키지(`GraphQL.Server.Transports.AspNetCore`)는 8.3.3 이다.

대안으로 [Hot Chocolate](/develop-wiki/backend/api/hot-chocolate/) 가 있다. Hot Chocolate 는 프레임워크가 더 많은 기능(스키마 스티칭, 필터·정렬 자동화)을 내장하고, GraphQL.NET 은 코어가 얇고 확장 지점이 명시적이다.

## 설치
```bash
dotnet add package GraphQL
dotnet add package GraphQL.SystemTextJson               # 직렬화기 (System.Text.Json)
dotnet add package GraphQL.Server.Transports.AspNetCore # ASP.NET Core 엔드포인트
dotnet add package GraphQL.Server.Ui.GraphiQL           # 개발용 GraphiQL (선택)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Schema` | 쿼리·뮤테이션·구독 루트 타입을 묶은 객체 |
| `ObjectGraphType<T>` | 코드 우선 방식의 객체 타입. 생성자에서 `Field(...)` 로 필드 선언 |
| `Schema.For(sdl)` | SDL 문자열로 스키마를 만드는 스키마 우선 진입점 |
| `AddAutoSchema<TQuery>()` | C# 클래스의 public 멤버를 필드로 자동 노출하는 타입 우선 방식 |
| `IGraphQLSerializer` | 요청·응답 JSON 직렬화 (SystemTextJson / NewtonsoftJson) |
| `DocumentExecuter` | 쿼리 문서를 실행해 `ExecutionResult` 를 반환 |
| DataLoader | 배치·캐시로 N+1 문제를 줄이는 `IDataLoader` 지원 |

## 기본 사용법
코드 우선으로 최소 스키마를 만들고 직접 실행하는 예제다.
```csharp
using GraphQL;
using GraphQL.SystemTextJson;
using GraphQL.Types;

public class Query : ObjectGraphType
{
    public Query()
    {
        Field<StringGraphType>("hello").Resolve(_ => "world");
    }
}

var schema = new Schema { Query = new Query() };
var json = await schema.ExecuteAsync(new GraphQLSerializer(), opts =>
{
    opts.Query = "{ hello }";
});
Console.WriteLine(json);   // {"data":{"hello":"world"}}
```
ASP.NET Core 에 올릴 때는 타입 우선 방식이 가장 짧다.
```csharp
using GraphQL;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGraphQL(b => b
    .AddAutoSchema<Query>()
    .AddSystemTextJson());

var app = builder.Build();
app.UseGraphQL("/graphql");
app.Run();

public class Query { public static string Hello() => "world"; }
```

## 자주 쓰는 패턴
- **DI 연동**: 리졸버 안에서 `context.RequestServices` 로 서비스를 얻거나 `.Resolve()` 대신 DI 로 주입한 서비스를 쓴다. 스코프 서비스는 `.ResolveScopedAsync` 를 쓴다.
- **DataLoader**: `IDataLoaderContextAccessor` 와 `LoadAsync` 로 같은 요청 안의 조회를 묶는다.
- **인증·인가**: `GraphQL.Authorization` 계열 정책 또는 ASP.NET Core 정책을 필드·타입에 붙인다.
- **구독**: `app.UseWebSockets()` 후 `UseGraphQL` 로 WebSocket 전송을 쓴다(서버 패키지가 `graphql-ws` 계열 프로토콜을 제공).
- **복잡도 제한**: `ComplexityConfiguration` 으로 깊이·복잡도를 제한해 비용이 큰 쿼리를 막는다.

## 언제 쓰나 / 피할 때
- 쓸 때: ASP.NET Core 위에서 GraphQL 엔진을 직접 제어하고 싶을 때, 기존 C# 모델을 거의 그대로 노출하고 싶을 때.
- 피할 때(대안): 필터링·정렬·페이징·스티칭을 기본 제공받고 싶으면 [Hot Chocolate](/develop-wiki/backend/api/hot-chocolate/). 스키마·리졸버 모양이 REST 로 충분하면 GraphQL 자체를 재검토한다.

## 공식 문서
- [시작하기](https://graphql-dotnet.github.io/docs/getting-started/introduction/) · [설치](https://graphql-dotnet.github.io/docs/getting-started/installation/) · [서버 저장소](https://github.com/graphql-dotnet/server)
- 언어: [C#](/develop-wiki/languages/csharp/)
