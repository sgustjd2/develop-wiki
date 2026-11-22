---
name: Hangfire
url: https://www.hangfire.io
docs: https://docs.hangfire.io/en/latest/
repo: https://github.com/HangfireIO/Hangfire
stars: 10157
domain: backend
category: messaging
description: 별도 메시지 브로커 없이 SQL Server·Redis 같은 저장소에 작업을 저장해 백그라운드·예약·반복 작업을 실행하는 .NET 작업 큐 라이브러리. 대시보드를 내장한다.
pricing: oss
tags: [dotnet, background-jobs, scheduler, cron, dashboard]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Hangfire 는 [C#](/develop-wiki/languages/csharp/) 람다식으로 메서드 호출을 작업(job)으로 저장해 두었다가 서버 프로세스가 꺼내 실행하는 **백그라운드 작업 처리 라이브러리**다. 작업은 저장소에 영속화되므로 앱이 재시작돼도 남아 있고, 실패하면 자동으로 재시도한다. 작업 종류는 즉시 실행(fire-and-forget), 지연 실행, CRON 기반 반복 실행, 부모 작업 완료 후 실행(continuation)이 있고, 작업 묶음(batch)은 유료인 Hangfire Pro 기능이다.

오픈소스 코어의 공식 저장소는 SQL Server 이고, 공식 Redis 저장소(Hangfire.Pro.Redis)는 유료 Hangfire Pro 에 포함된다. 커뮤니티 저장소도 있다. 라이선스는 코어가 LGPL v3 이고, 구독을 구매하면 상용 라이선스로 배포할 수도 있다(저장소 `LICENSE.md`). 최신 안정 버전은 1.8.25(2026-08)다. [RabbitMQ](/develop-wiki/backend/messaging/rabbitmq/)·[Kafka](/develop-wiki/backend/messaging/apache-kafka/) 같은 메시지 브로커와 달리 서비스 간 메시지 전달이 아니라 "한 앱 안에서 요청 밖으로 미룰 일"을 처리하는 데 맞춰져 있다.

## 설치
ASP.NET Core 가이드는 아래 패키지(1.8.*)와 SQL Server 저장소를 쓴다.
```bash
dotnet add package Hangfire.Core
dotnet add package Hangfire.SqlServer
dotnet add package Hangfire.AspNetCore
dotnet add package Microsoft.Data.SqlClient
```
작업 저장용 데이터베이스는 먼저 만들어 두어야 하고, 연결 계정에 테이블 생성 권한이 있어야 첫 실행 때 스키마가 만들어진다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 작업(job) | `BackgroundJob.Enqueue(() => ...)` 로 만든, 메서드 정보와 인자를 직렬화해 저장한 단위 |
| 저장소(storage) | 작업과 상태를 보관하는 곳. SQL Server 등(Redis 는 Pro) |
| 서버(server) | 저장소에서 작업을 꺼내 실행하는 프로세스. `AddHangfireServer()` 로 앱 안에 띄운다 |
| 큐 | 작업이 담기는 이름 있는 큐. 서버가 어떤 큐를 처리할지 지정한다 |
| 상태 | Enqueued → Processing → Succeeded / Failed / Scheduled 등. 실패한 작업은 Failed 에 남아 수동 재시도 가능 |
| 대시보드 | 작업 상태를 보고 재시도·삭제·반복 작업 즉시 실행을 하는 웹 UI (`/hangfire`) |

## 기본 사용법
`Program.cs` (공식 가이드의 설정을 최소 호스팅 모델로 옮긴 형태):
```csharp
using Hangfire;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection")));

builder.Services.AddHangfireServer();

var app = builder.Build();

app.MapHangfireDashboard();   // 기본값은 로컬 요청만 허용
app.MapPost("/signup", (IBackgroundJobClient jobs) =>
{
    jobs.Enqueue(() => Console.WriteLine("Hello world from Hangfire!"));
    return Results.Accepted();
});

app.Run();
```
작업 종류별 호출은 다음과 같다.
```csharp
// 지연 실행: 1일 뒤
BackgroundJob.Schedule(() => Console.WriteLine("Hello, world"), TimeSpan.FromDays(1));

// 반복 실행: 같은 id 로 다시 호출하면 갱신된다
RecurringJob.AddOrUpdate("easyjob", () => Console.Write("Easy!"), Cron.Daily);
RecurringJob.AddOrUpdate("powerfuljob", () => Console.Write("Powerful!"), "0 12 * */2");

// 반복 작업을 지금 실행 / 삭제
RecurringJob.Trigger("easyjob");
RecurringJob.RemoveIfExists("easyjob");
```
부모 작업 뒤에 실행하는 continuation 은 `BackgroundJob.ContinueJobWith(parentId, () => ...)` 로 만든다(옛 이름 `ContinueWith` 는 deprecated, 소스 `BackgroundJob.cs` 기준).

## 자주 쓰는 패턴
- **의존성 주입**: 기본 활성기는 `Activator.CreateInstance` 라 매개변수 없는 생성자가 필요하다. 컨테이너를 쓰려면 `JobActivator` 를 구현해 `GlobalConfiguration.Configuration.UseActivator(...)` 로 등록하고, 요청 단위 수명으로 등록한 서비스는 작업 실행 시 `HttpContext` 가 없어 예외가 난다. 서비스 인터페이스로 호출하는 `BackgroundJob.Enqueue<IService>(x => x.Run())` 형태를 쓴다.
- **재시도**: `AutomaticRetry` 필터가 기본 10회 재시도하며 횟수가 끝나면 Failed 로 간다. 메서드별로 `[AutomaticRetry(Attempts = 0)]` 로 끄거나 `GlobalJobFilters.Filters.Add(new AutomaticRetryAttribute { Attempts = 5 })` 로 전체 기본값을 바꾼다. 재시도되어도 안전하도록 작업을 멱등하게 짜야 한다.
- **취소 토큰**: 작업 메서드에 `CancellationToken` 인자를 받으면(1.7.0 이상) 종료 요청이나 작업 취소 때 토큰이 취소된다. 종료로 중단된 작업은 큐 앞쪽으로 되돌아가 재시작 후 다시 처리된다. 생성할 때는 `CancellationToken.None` 을 넘기면 실행 직전에 교체된다.
- **인자는 작게**: 인자는 직렬화되어 저장소에 들어가므로 엔티티 전체 대신 id 를 넘기고 작업 안에서 다시 조회한다.
- **지연 작업 정확도**: 예약 작업 확인 주기 기본값은 15초이고 `BackgroundJobServerOptions.SchedulePollingInterval` 로 바꾼다. IIS 에서는 앱 풀 유휴 시간 초과를 0 으로 하고 자동 시작을 켜야 제시간에 돈다.
- **대시보드 보호**: 원격 접근을 열 때는 반드시 대시보드 인가 필터를 설정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이메일 발송·리포트 생성처럼 요청 밖으로 미룰 .NET 작업, 별도 큐 서버 없이 이미 쓰는 SQL Server 로 작업 영속성과 대시보드를 얻고 싶을 때, CRON 반복 작업을 앱 안에서 관리할 때.
- 피할 때(대안): 서비스 간 이벤트 전달과 브로커 연동이 중심이면 [Wolverine](/develop-wiki/backend/messaging/wolverine/) 이나 [RabbitMQ](/develop-wiki/backend/messaging/rabbitmq/). 며칠 이어지는 다단계 워크플로와 보상 처리는 [Temporal](/develop-wiki/backend/messaging/temporal/) 이 맞다. LGPL 조건이 배포 방식에 부담이면 라이선스를 먼저 검토한다.

## 공식 문서
- [ASP.NET Core 시작하기](https://docs.hangfire.io/en/latest/getting-started/aspnet-core-applications.html) · [지연 실행](https://docs.hangfire.io/en/latest/background-methods/calling-methods-with-delay.html) · [반복 작업](https://docs.hangfire.io/en/latest/background-methods/performing-recurrent-tasks.html) · [예외 처리](https://docs.hangfire.io/en/latest/background-processing/dealing-with-exceptions.html) · [취소 토큰](https://docs.hangfire.io/en/latest/background-methods/using-cancellation-tokens.html)
