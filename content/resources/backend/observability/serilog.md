---
name: Serilog
url: https://serilog.net
docs: https://github.com/serilog/serilog/wiki/Getting-Started
repo: https://github.com/serilog/serilog
stars: 8072
domain: backend
category: observability
description: 메시지 템플릿으로 속성을 보존하는 구조적 로그를 남기는 .NET 로깅 라이브러리. 싱크(sink)를 붙여 콘솔·파일·로그 서버로 보내며 ASP.NET Core 와 통합된다.
pricing: oss
tags: [dotnet, logging, structured-logging, sink, aspnet-core]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Serilog 는 로그를 문자열이 아니라 **속성이 있는 이벤트**로 기록하는 .NET 로깅 라이브러리다. `Log.Debug("Dividing {A} by {B}", a, b)` 처럼 메시지 템플릿에 값을 넣으면 `A`, `B` 가 속성으로 남아 검색·집계에 쓸 수 있다. 출력 대상은 별도 패키지인 싱크로 추가한다.

- 이 문서는 Serilog **4.4.0**(GitHub 릴리스 2026-07-10, NuGet 최신 안정판 동일)과 **Serilog.AspNetCore 11.0.0**(NuGet 안정판) 기준이다. Apache-2.0.
- 위치: 로그 수집·검색 백엔드는 [Loki](/develop-wiki/backend/observability/loki/), 표준 계측 API 는 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/), 에러 추적은 [Sentry](/develop-wiki/backend/observability/sentry/) 와 함께 쓴다.

## 설치
코어에 싱크를 따로 추가한다. 콘솔 출력 예:
```bash
dotnet add package Serilog
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.AspNetCore   # ASP.NET Core 통합
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `LoggerConfiguration` | 최소 레벨, enricher, 싱크를 조립해 로거를 만드는 빌더 |
| 메시지 템플릿 | `{Name}` 자리표시자로 속성을 보존하는 로그 문자열 |
| Sink | 로그 이벤트를 콘솔·파일·서버 등으로 내보내는 출력 패키지 |
| Enricher | 모든 이벤트에 속성(요청 ID 등)을 붙임. `Enrich.FromLogContext()` |
| 부트스트랩 로거 | 호스트 구성 전 시작 오류를 남기기 위해 먼저 만드는 임시 로거 |

## 기본 사용법
**콘솔 앱**
```csharp
using var log = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

log.Information("Hello, Serilog!");
```
정적 `Log.Logger` 를 쓰는 앱은 종료 시 `await Log.CloseAndFlushAsync();` 로 버퍼를 비운다.

**ASP.NET Core**
```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();      // 최종 로거가 등록되면 이것을 대체

builder.Services.AddSerilog((services, lc) => lc
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// ...
app.UseSerilogRequestLogging();    // 핸들러(MVC 등)보다 앞에 배치
```
최종 로거가 부트스트랩 로거를 완전히 대체하므로, 콘솔 출력이 필요하면 양쪽 모두 `WriteTo.Console()` 이 있어야 한다.

## 자주 쓰는 패턴
- **구조적 속성 유지**: 문자열 보간(`$"..."`) 대신 템플릿과 인자를 분리해 속성이 남게 한다.
- **설정 파일 구성**: `ReadFrom.Configuration` 으로 레벨·싱크를 `appsettings.json` 에서 조정한다.
- **요청 로그 한 줄 요약**: `UseSerilogRequestLogging()` 으로 요청당 완료 이벤트 하나를 남긴다.
- **시작 오류 포착**: 부트스트랩 로거로 호스트 빌드 중 예외를 기록한다.

## 언제 쓰나 / 피할 때
- 쓸 때: .NET 서비스에서 검색·집계 가능한 구조적 로그가 필요할 때.
- 피할 때(대안): 로그 대신 트레이스·메트릭 중심으로 가려면 OpenTelemetry 를 우선하고, 단순 콘솔 로그면 `Microsoft.Extensions.Logging` 기본 제공자로 충분하다.

## 공식 문서
- [Getting Started](https://github.com/serilog/serilog/wiki/Getting-Started) · [Serilog.AspNetCore](https://github.com/serilog/serilog-aspnetcore) · [저장소](https://github.com/serilog/serilog)
