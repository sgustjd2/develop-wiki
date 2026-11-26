---
name: FastEndpoints
url: https://fast-endpoints.com
docs: https://fast-endpoints.com/docs/get-started
repo: https://github.com/FastEndpoints/FastEndpoints
stars: 6032
domain: backend
category: web-framework
description: ASP.NET Core 위에서 엔드포인트마다 클래스 하나로 요청·응답·검증·처리를 묶는 REPR 패턴 프레임워크. 컨트롤러 대신 쓰는 .NET Web API 도구다.
pricing: oss
tags: [dotnet, aspnet-core, repr, minimal-api, endpoints, validation]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
FastEndpoints 는 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/)의 Minimal API 위에 올라가는 라이브러리다. 엔드포인트 하나를 `Endpoint<TRequest, TResponse>` 를 상속한 클래스로 만들고, `Configure()` 에 라우트·권한을, `HandleAsync()` 에 로직을 쓴다. 컨트롤러가 비대해지는 것을 피하고 기능(vertical slice) 단위로 코드를 모으는 구조다.

- 이 문서는 NuGet 안정판 **9.0.0** / GitHub 릴리스 `v9.0`(2026-11-11) 기준이다. MIT.
- **주의**: v9 는 `net10.0` 과 `net11.0` 만 대상으로 한다. .NET 8/9 앱은 v9 로 올리기 전에 타깃을 바꾸거나 기존 버전을 유지하라고 릴리스 노트에 적혀 있다.
- 대안: 컨트롤러·Minimal API 그대로 쓰는 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/), GraphQL 은 [Hot Chocolate](/develop-wiki/backend/api/hot-chocolate/).

## 설치
```bash
dotnet new web -n MyWebApp
cd MyWebApp
dotnet add package FastEndpoints
```
`Program.cs` 에서 서비스를 등록하고 엔드포인트를 매핑한다.
```csharp
using FastEndpoints;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddFastEndpoints();

var app = builder.Build();
app.UseFastEndpoints();
app.Run();
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Endpoint<TReq, TRes>` | 요청·응답 타입을 지정하는 엔드포인트 기반 클래스 |
| `Configure()` | HTTP 메서드, 경로, 인증(`AllowAnonymous()` 등) 설정 |
| `HandleAsync()` | 요청 처리 로직. `Send.OkAsync()` 등으로 응답 |
| 요청 DTO | JSON 본문 등에서 자동 바인딩 |
| REPR | Request-Endpoint-Response 패턴 |

## 기본 사용법
```csharp
public class CreateUserRequest
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public int Age { get; set; }
}

public class CreateUserResponse
{
    public string FullName { get; set; } = "";
    public bool IsOver18 { get; set; }
}

public class CreateUserEndpoint : Endpoint<CreateUserRequest, CreateUserResponse>
{
    public override void Configure()
    {
        Post("/api/user/create");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CreateUserRequest req, CancellationToken ct)
    {
        await Send.OkAsync(new CreateUserResponse
        {
            FullName = $"{req.FirstName} {req.LastName}",
            IsOver18 = req.Age > 18
        }, ct);
    }
}
```
`/api/user/create` 에 JSON 을 POST 하면 200 응답을 받는다.

## 자주 쓰는 패턴
- **기능별 폴더**: 요청·응답·엔드포인트·검증을 한 폴더에 둔다.
- **DTO 중심 설계**: 도메인 모델을 직접 노출하지 않고 요청·응답 타입을 엔드포인트마다 둔다.
- **업그레이드 점검**: 메이저 버전마다 타깃 프레임워크 요구가 바뀌므로 릴리스 노트의 Breaking Changes 를 먼저 읽는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 컨트롤러 대신 기능 단위로 API 를 구성하고 싶은 .NET 팀.
- 피할 때(대안): .NET 8/9 에 머물러야 하는 프로젝트(v9 는 .NET 10 이상), 표준 컨트롤러·Minimal API 만으로 충분한 작은 서비스.

## 공식 문서
- [시작하기](https://fast-endpoints.com/docs/get-started) · [저장소](https://github.com/FastEndpoints/FastEndpoints)
