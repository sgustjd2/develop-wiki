---
name: YARP
url: https://yarp.dot.net
docs: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
repo: https://github.com/dotnet/yarp
stars: 9660
domain: backend
category: infra-devops
description: ASP.NET Core 위에서 동작하는 .NET 리버스 프록시 라이브러리. 설정 파일이나 코드로 라우트·클러스터를 정의하고 로드 밸런싱, 변환, 헬스 체크를 붙인다.
pricing: oss
tags: [dotnet, reverse-proxy, api-gateway, load-balancing, aspnet-core]
languages: [csharp]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
YARP(Yet Another Reverse Proxy)는 Microsoft 가 [오픈소스](https://github.com/dotnet/yarp)로 관리하는 **리버스 프록시 라이브러리**다. 실행 파일이 아니라 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/) 앱에 NuGet 패키지로 추가해 쓰며, 라우팅·로드 밸런싱·TLS 종료·URL 변환 같은 프록시 기능을 C# 코드로 확장할 수 있다. [Nginx](/develop-wiki/backend/infra-devops/nginx/) 나 [Traefik](/develop-wiki/backend/infra-devops/traefik/) 을 따로 운영하지 않고 .NET 앱 안에서 API 게이트웨이나 BFF 를 만들 때 쓴다.

현재 안정 버전은 2.3.0(2025-02, .NET 8 이상 지원)이다. 마지막 안정 릴리스로부터 시간이 지났지만 `main` 브랜치는 계속 커밋이 들어오고 공식 문서도 2026-11 에 갱신됐다. 라이선스는 MIT 다.

## 설치
```bash
dotnet new web -n MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Route | 어떤 요청을 잡을지(경로·호스트·메서드·헤더·쿼리)와 보낼 클러스터를 지정. 가장 구체적인 경로가 우선하고 `Order` 로 명시 가능 |
| Cluster | 요청을 처리할 수 있는 destination 모음과 그 정책(로드 밸런싱, 헬스 체크, 세션 어피니티) |
| Destination | 실제 백엔드 주소 |
| Transform | 경로·헤더·쿼리를 바꾸는 규칙. 요청·응답 본문 변환은 제공하지 않아 미들웨어로 작성 |
| 설정 소스 | `IConfiguration`(JSON 등)이나 메모리, 사용자 정의 `IProxyConfigProvider`. 파일 변경 시 재시작 없이 반영 |

## 기본 사용법
`Program.cs`:
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
`appsettings.json`:
```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": { "Path": "{**catch-all}" }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```
`dotnet run` 으로 실행하면 모든 요청이 `cluster1` 로 전달된다.

## 자주 쓰는 패턴
- **로드 밸런싱**: 클러스터에 `"LoadBalancingPolicy": "RoundRobin"` 처럼 지정한다. 내장 정책은 `FirstAlphabetical`, `Random`, `PowerOfTwoChoices`(기본), `RoundRobin`, `LeastRequests` 이며 `ILoadBalancingPolicy` 를 구현해 직접 추가할 수 있다.
- **능동 헬스 체크**: `HealthCheck.Active` 에 `Enabled`, `Interval`, `Timeout`, `Policy`(`ConsecutiveFailures`), `Path` 를 지정하고 임계값은 클러스터 `Metadata` 의 `ConsecutiveFailuresHealthPolicy.Threshold` 로 정한다. destination 마다 `Health` 주소를 따로 둘 수 있다.
- **변환**: 라우트의 `Transforms` 배열에 `{ "PathPrefix": "/apis" }`, `{ "RequestHeader": "header1", "Append": "bar" }` 등을 넣는다. `X-Forwarded-For`/`-Proto`/`-Host` 변환은 기본으로 켜져 있고 Host 헤더는 대상 서버 주소로 바뀐다.
- **코드로 변환 추가**: `AddReverseProxy().LoadFromConfig(...).AddTransforms(ctx => { ctx.AddPathPrefix("/prefix"); })`.
- **인증·속도 제한**: 라우트에 `AuthorizationPolicy`, `CorsPolicy`, `RateLimiterPolicy` 이름을 지정해 ASP.NET Core 정책을 재사용한다. 속도 제한은 .NET 7 이상에서 가능하고 `app.UseRateLimiter()` 도 필요하다.
- **여러 설정 소스**: `LoadFromConfig` 를 여러 번 부르거나 `LoadFromMemory(routes, clusters)` 와 섞을 수 있다. 같은 라우트·클러스터를 여러 소스에 나눠 병합하는 것은 지원하지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 팀이 .NET 이고 게이트웨이 로직(인증 위임, 헤더 가공, 라우팅 규칙)을 C# 으로 확장해야 할 때, gRPC·WebSocket 을 포함한 요청을 앱 안에서 프록시할 때.
- 피할 때(대안): 정적 파일 서빙과 TLS 설정만 필요하면 [Caddy](/develop-wiki/backend/infra-devops/caddy/)·[Nginx](/develop-wiki/backend/infra-devops/nginx/) 가 더 간단하다. 쿠버네티스 인그레스 컨트롤러가 목적이면 [Traefik](/develop-wiki/backend/infra-devops/traefik/) 을 먼저 검토한다. 설정 변경이 잦은 환경에서 안정 릴리스 주기가 부담이면 `main` 의 활동과 릴리스 노트를 확인하고 도입한다.

## 공식 문서
- [시작하기](https://learn.microsoft.com/ko-kr/aspnet/core/fundamentals/servers/yarp/getting-started) · [개요](https://learn.microsoft.com/ko-kr/aspnet/core/fundamentals/servers/yarp/yarp-overview) · [설정 파일](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files) · [로드 밸런싱](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing) · [변환](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms) · [헬스 체크](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks)
