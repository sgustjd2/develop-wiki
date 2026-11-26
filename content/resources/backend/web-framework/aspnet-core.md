---
name: ASP.NET Core
url: https://dotnet.microsoft.com/apps/aspnet
repo: https://github.com/dotnet/aspnetcore
stars: 38547
docs: https://learn.microsoft.com/aspnet/core/
domain: backend
category: web-framework
description: .NET의 크로스 플랫폼 웹 프레임워크. Minimal API·MVC·Blazor·SignalR을 포함하며 C#으로 웹 API나 웹 앱을 만들 때 쓴다.
pricing: oss
tags: [dotnet, minimal-api, mvc]
languages: [csharp]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
ASP.NET Core 는 .NET 의 크로스 플랫폼 웹 프레임워크로, 내장 서버 Kestrel 위에서 HTTP API(Minimal API·컨트롤러), 서버 렌더링(Razor Pages·MVC), Blazor, 실시간 통신(SignalR)을 한 런타임에서 제공한다. DI 컨테이너·설정·로깅이 호스트에 기본으로 들어 있고, 새 HTTP API 프로젝트에는 Minimal API 가 권장된다.

현재 .NET 은 **.NET 11**(STS, 2026-11 출시)과 **.NET 10**(LTS)이 함께 지원된다(둘 다 2028-11 지원 종료). 아래 예제는 .NET 10 이상 기준이다.

## 설치
[.NET SDK](https://dotnet.microsoft.com/download) 를 설치한 뒤 템플릿으로 프로젝트를 만든다.
```bash
dotnet new web -o TodoApi      # 빈 Minimal API 프로젝트
cd TodoApi
dotnet run                     # 개발 중에는 dotnet watch 로 핫 리로드
```
컨트롤러 기반은 `dotnet new webapi --use-controllers` 템플릿을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `WebApplication` | `WebApplication.CreateBuilder(args)` → 서비스 등록 → `Build()` → 파이프라인 구성 → `Run()` |
| 서비스 / DI | `builder.Services.AddScoped<T>()` 등으로 등록하고 핸들러 매개변수·생성자로 주입 |
| Minimal API | `app.MapGet/MapPost(...)` 에 람다를 연결. 매개변수는 경로·쿼리·본문·DI 에서 자동 바인딩 |
| `TypedResults` | `Ok`, `Created`, `NotFound` 등 구체 타입 결과. 테스트·OpenAPI 메타데이터에 유리 |
| 라우트 그룹 | `app.MapGroup("/todos")` 로 접두사·인증·필터를 묶는다. 중첩 가능 |
| 미들웨어 | `app.Use...()` 순서대로 실행되는 요청 파이프라인(인증, CORS, 예외 처리 등) |
| 엔드포인트 필터 | `AddEndpointFilter` 로 특정 엔드포인트·그룹에만 전후 처리를 붙인다 |
| 검증(.NET 10+) | `builder.Services.AddValidation()` 후 DataAnnotations 속성으로 자동 400 응답 |

## 기본 사용법
```csharp
// Program.cs
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddValidation();
var app = builder.Build();

var todos = new ConcurrentDictionary<int, Todo>();

app.MapGet("/todos/{id}", (int id) =>
    todos.TryGetValue(id, out var todo) ? Results.Ok(todo) : Results.NotFound());

app.MapPost("/todos", (NewTodo input) =>
{
    var todo = new Todo(todos.Count + 1, input.Title);
    todos[todo.Id] = todo;
    return TypedResults.Created($"/todos/{todo.Id}", todo);
});

app.Run();

record NewTodo([Required, MaxLength(200)] string Title);
record Todo(int Id, string Title);
```
`Title` 이 없으면 검증 단계에서 400 과 오류 상세가 반환된다.

## 자주 쓰는 패턴
- **라우트 그룹**: `var todos = app.MapGroup("/todos").WithTags("Todos").RequireAuthorization();` 처럼 공통 설정을 묶고, 확장 메서드로 파일을 나눈다.
- **미들웨어·필터**: 전역 처리는 `app.UseExceptionHandler()`, `app.UseCors()` 등 미들웨어로, 특정 엔드포인트만 필요한 처리는 `.AddEndpointFilter(...)` 로 붙인다. 필터는 바깥 그룹에서 안쪽 순으로 실행된다.
- **검증**: .NET 10 부터 Minimal API 도 `AddValidation()` 으로 DataAnnotations 검증을 지원한다. 소스 생성기 기반이라 호출한 어셈블리의 타입만 발견한다. 특정 엔드포인트는 `.DisableValidation()` 으로 끈다.
- **DB 연동**: EF Core 의 `DbContext` 를 `builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(...))` 로 등록하고 핸들러 매개변수로 주입한다. [PostgreSQL](/develop-wiki/backend/database/postgresql/) 은 Npgsql 공급자를 쓴다.
- **OpenAPI**: `builder.Services.AddOpenApi()` + `app.MapOpenApi()` 로 문서를 노출한다. .NET 10 부터 기본 문서 버전은 OpenAPI 3.1 이다.
- **테스트**: `Microsoft.AspNetCore.Mvc.Testing` 의 `WebApplicationFactory<Program>` 으로 메모리 내 서버를 띄우고 `CreateClient()` 로 HTTP 호출을 검증한다. 핸들러를 메서드로 분리하면 `TypedResults` 반환값을 단위 테스트로 바로 확인할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: C#·.NET 조직의 웹 API·웹 앱, Azure 등 Microsoft 생태계와의 통합, 높은 처리량과 정적 타입이 함께 필요한 서비스, Blazor·SignalR 까지 한 스택으로 가져갈 때.
- 피할 때(대안): JVM 생태계가 표준인 조직은 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/), 작은 스크립트성 API 는 [FastAPI](/develop-wiki/backend/web-framework/fastapi/) 나 [Hono](/develop-wiki/backend/web-framework/hono/) 가 가볍다. 운영 수명이 긴 서비스는 STS 보다 LTS(.NET 10)를 고른다.

## 공식 문서
- [ASP.NET Core 문서](https://learn.microsoft.com/aspnet/core/) · [API 개요](https://learn.microsoft.com/aspnet/core/fundamentals/apis) · [Minimal API 빠른 참조](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis) · [.NET 10 새 기능](https://learn.microsoft.com/aspnet/core/release-notes/aspnetcore-10.0) · [지원 정책](https://dotnet.microsoft.com/platform/support/policy/dotnet-core)
