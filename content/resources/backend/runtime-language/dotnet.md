---
name: .NET
url: https://dotnet.microsoft.com
docs: https://learn.microsoft.com/dotnet/core/
repo: https://github.com/dotnet/runtime
stars: 18466
domain: backend
category: runtime-language
description: C#·F# 코드를 실행하는 Microsoft 의 크로스 플랫폼 런타임(CLR)과 SDK. ASP.NET Core 웹 서버, 워커 서비스, Native AOT 실행 파일을 만들 때 쓴다.
pricing: oss
tags: [csharp, clr, runtime, sdk, native-aot]
languages: [csharp]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
.NET 은 CLR(공통 언어 런타임: JIT·GC), 기본 클래스 라이브러리, `dotnet` CLI·SDK 로 이루어진 MIT 라이선스 플랫폼이다. Windows·Linux·macOS 에서 동작하고, 주 언어는 [C#](/develop-wiki/languages/csharp/)이다. 웹 서버는 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/), DB 접근은 [EF Core](/develop-wiki/backend/orm-query/entity-framework-core/) 가 표준 조합이다.

**릴리스 현황(2026-11 기준)**: 매년 11월 메이저가 나오며 짝수는 LTS(3년), 홀수는 STS(24개월)다.
| 버전 | 지원 | 최신 |
| --- | --- | --- |
| .NET 11 | STS, 2026-11-10 출시, C# 15 기본 | 11.0.0 |
| .NET 10 | LTS | 10.0.15 |
| .NET 9 / 8 | 지원 종료 | 9.0.23 / 8.0.34 |

## 설치
```bash
# macOS (Homebrew) — 또는 dotnet.microsoft.com 설치 파일, dotnet-install 스크립트
brew install --cask dotnet-sdk
dotnet --list-sdks
```
`global.json` 으로 저장소별 SDK 버전을 고정할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| SDK / 런타임 | SDK = 빌드 도구 포함, 배포 서버에는 런타임(또는 ASP.NET Core 런타임)만 |
| TFM | 대상 프레임워크 `net10.0`, `net11.0`. `.csproj` 의 `<TargetFramework>` |
| NuGet | 패키지 저장소. `dotnet add package <이름>` |
| JIT / Tiered PGO | 실행 중 프로파일을 보고 재컴파일해 최적화 |
| Native AOT | `<PublishAot>true</PublishAot>` 로 JIT 없는 네이티브 실행 파일 생성. 리플렉션 제약 있음 |
| 파일 기반 앱 | .NET 10+ 에서 `.csproj` 없이 `dotnet run app.cs` 로 단일 파일 실행 |

## 기본 사용법
```bash
dotnet new console -n Hello && cd Hello
dotnet run
dotnet new webapi -n TodoApi       # ASP.NET Core 웹 API 템플릿
dotnet test                         # xUnit/NUnit/MSTest 프로젝트 실행
dotnet publish -c Release           # 배포 산출물
```
```csharp
// app.cs — dotnet run app.cs (.NET 10+)
var tasks = Enumerable.Range(1, 5)
    .Select(async i =>
    {
        await Task.Delay(100 * i);
        return i * i;
    });

int[] results = await Task.WhenAll(tasks);
Console.WriteLine(string.Join(", ", results));
```

## 자주 쓰는 패턴
- **LTS 기준 운영**: 수명이 긴 서비스는 .NET 10 LTS, 최신 기능이 필요하면 .NET 11 을 쓰고 2년 내 업그레이드 계획을 세운다.
- **컨테이너 게시**: `dotnet publish /t:PublishContainer` 로 Dockerfile 없이 OCI 이미지를 만든다.
- **Native AOT**: 시작 시간·메모리가 중요한 CLI·서버리스에 적용한다. 소스 생성기 기반 JSON 직렬화(`JsonSerializerContext`)를 함께 쓴다.
- **중앙 패키지 관리**: `Directory.Packages.props` 로 솔루션 전체 NuGet 버전을 한 곳에서 관리한다.
- **관측성**: `System.Diagnostics` 의 `ActivitySource`·`Meter` 가 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 와 바로 연결된다.

## 언제 쓰나 / 피할 때
- 쓸 때: C# 팀, Windows·Azure 연계 엔터프라이즈, 높은 처리량의 웹 API, 단일 언어로 서버·데스크톱·게임(Unity)까지 다루는 조직.
- 피할 때(대안): JVM 생태계 의존이 큰 조직은 [OpenJDK](/develop-wiki/backend/runtime-language/openjdk/), 매우 작은 정적 바이너리가 우선이면 Go.

## 공식 문서
- [.NET 문서](https://learn.microsoft.com/dotnet/core/) · [.NET 11 새 기능](https://learn.microsoft.com/dotnet/core/whats-new/dotnet-11/overview) · [지원 정책](https://dotnet.microsoft.com/platform/support/policy/dotnet-core) · [Native AOT](https://learn.microsoft.com/dotnet/core/deploying/native-aot/)
