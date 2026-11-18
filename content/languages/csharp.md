---
name: C#
summary: Microsoft가 만든 .NET 플랫폼의 정적 타입 언어. 웹 API, 데스크톱·모바일 앱, Unity 게임, 클라우드 서비스까지 폭넓게 쓰는 범용 언어다.
paradigms: [객체지향, 함수형, 명령형, 제네릭]
typing: static
execution: vm
firstAppeared: 2000
officialSite: https://dotnet.microsoft.com/languages/csharp
docs: https://learn.microsoft.com/dotnet/csharp/
useCases: [웹 API·백엔드(ASP.NET Core), 게임(Unity), Windows 데스크톱, 크로스플랫폼 모바일·데스크톱(.NET MAUI), 클라우드·Azure 서비스]
sources:
  - https://dotnet.microsoft.com/en-us/download/dotnet
  - https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-11/overview
  - https://learn.microsoft.com/en-us/dotnet/core/sdk/file-based-apps
  - https://learn.microsoft.com/dotnet/csharp/
updatedAt: 2026-11-18
---

## 개요
C#은 Anders Hejlsberg가 설계해 2000년 공개한 언어로, .NET 런타임 위에서 동작한다. 지금의 .NET(구 .NET Core)은 오픈소스·크로스플랫폼이라 Windows 뿐 아니라 Linux·macOS 에서도 서버를 운영한다.

- 2026-11 기준 최신은 **.NET 11**(2026-11-10 GA, STS)과 그 기본 언어 버전 **C# 15**. 장기 지원(LTS) 최신은 **.NET 10**. 매년 11월 새 .NET 이 나오며 짝수 버전이 LTS(3년), 홀수 버전이 STS(2년)다.
- 이 사이트의 `csharp` 분류는 C# 과 .NET 생태계 전체를 대표한다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 정적·명목적 타입, `var` 추론, 실체화된(reified) 제네릭, `record`, 패턴 매칭, 널 가능 참조 타입(`string?`) 분석 |
| 새 기능(C# 15) | 유니언 타입, 닫힌 계층(closed hierarchies), 컬렉션 식 인수, 확장 인덱서, 레이블 붙은 `break`/`continue` 등 |
| 메모리 관리 | 가비지 컬렉션. `struct`·`Span<T>` 로 힙 할당을 줄이는 저수준 최적화 가능 |
| 동시성 | `Task` + `async`/`await`(C# 이 대중화한 모델), `Parallel`, 채널. .NET 11 은 런타임 수준 async 를 기본 지원 |
| 실행 | IL 로 컴파일 → CLR 이 JIT 컴파일해 실행. Native AOT 로 단일 네이티브 실행 파일도 가능 |
| 에러 처리 | 예외(검사 예외 없음) |

## 개발 환경 시작하기
1. [.NET SDK](https://dotnet.microsoft.com/download/dotnet) 를 설치한다(LTS 를 원하면 .NET 10, 최신 기능은 .NET 11). 확인: `dotnet --version`.
2. 편집기는 Visual Studio, VS Code + C# Dev Kit, JetBrains Rider 중 선택.
3. 패키지 저장소는 **NuGet**. `dotnet` CLI 하나로 생성·빌드·테스트·패키지 관리를 한다.

```bash
dotnet new console -o Hello      # 콘솔 프로젝트 생성
cd Hello
dotnet run
dotnet add package Serilog       # NuGet 패키지 추가
dotnet new webapi -o Api         # ASP.NET Core Web API 템플릿
dotnet test
```

4. 프로젝트 파일 없이 `.cs` 파일 하나만으로 실행하는 **파일 기반 앱**(.NET 10 SDK+)도 지원된다.

```csharp
// hello.cs
#:package Humanizer@*
using Humanizer;

Console.WriteLine("file_based_app".Humanize());
```

```bash
dotnet run hello.cs              # 또는: dotnet hello.cs
```

## 문법 한눈에 보기
```csharp
// 최상위 문(top-level statements): Main 메서드 없이 시작
var users = new List<User> { new(1, "Kim"), new(2, "Lee", "lee@example.com") };

// LINQ
var withEmail = users.Where(u => u.Email is not null).Select(u => u.Name);
Console.WriteLine(string.Join(", ", withEmail));

// 패턴 매칭 switch 식
static double Area(Shape s) => s switch
{
    Circle c => Math.PI * c.R * c.R,
    Rect { W: var w, H: var h } => w * h,
    _ => throw new ArgumentException("unknown shape"),
};
Console.WriteLine(Area(new Rect(2, 3)));

// 비동기 + 예외 처리
try
{
    using var http = new HttpClient();
    var body = await http.GetStringAsync("https://example.com");
    Console.WriteLine(body.Length);
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"요청 실패: {ex.Message}");
}

// 타입 선언은 파일 아래쪽에
record User(int Id, string Name, string? Email = null);
abstract record Shape;
record Circle(double R) : Shape;
record Rect(double W, double H) : Shape;
```

## 생태계
**백엔드**
- [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/) — 웹 API·MVC·Blazor·SignalR 을 포함한 .NET 웹 프레임워크.
- ORM: Entity Framework Core, Dapper. 관측성: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) .NET SDK.

**AI**
- 에이전트: [Microsoft Agent Framework](/develop-wiki/ai/agent-framework/microsoft-agent-framework/)
- 도구 연동: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) C# SDK

**테스트**: xUnit, NUnit, MSTest, [Playwright](/develop-wiki/frontend/testing/playwright/) .NET 바인딩.

**앱·게임**: Unity(게임 스크립트 언어), .NET MAUI(크로스플랫폼 앱), WPF·WinForms(Windows 데스크톱), Blazor(브라우저에서 C# 실행, WebAssembly).

## 언제 쓰나 / 약점
- **쓸 때**
  - 성능과 생산성을 함께 원하는 웹 API·백엔드 — ASP.NET Core 는 처리량이 높은 편이다.
  - Unity 기반 게임, Windows 데스크톱 앱.
  - Azure·Microsoft 365 등 Microsoft 생태계와 긴밀히 연동하는 서비스.
- **약점**
  - 매년 새 언어 기능이 추가되어 버전에 따라 관용구가 크게 달라진다(오래된 자료와 차이).
  - 오픈소스 라이브러리 생태계가 npm·PyPI·Maven 보다 작고 Microsoft 제공 라이브러리 비중이 크다.
  - STS 버전은 지원 기간이 2년이라 운영 환경은 LTS 주기에 맞춰 업그레이드 계획이 필요하다.
  - Native AOT 는 리플렉션·동적 코드 생성에 제약이 있다.

## 공식 문서·학습 자료
- [C# 문서](https://learn.microsoft.com/dotnet/csharp/) · [C# 15 새 기능](https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-15)
- [.NET 다운로드·지원 정책](https://dotnet.microsoft.com/en-us/download/dotnet) · [.NET 11 새 기능](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-11/overview)
- [파일 기반 앱](https://learn.microsoft.com/en-us/dotnet/core/sdk/file-based-apps) · [dotnet CLI](https://learn.microsoft.com/dotnet/core/tools/)
- [NuGet 갤러리](https://www.nuget.org/) · [ASP.NET Core 문서](https://learn.microsoft.com/aspnet/core/)
