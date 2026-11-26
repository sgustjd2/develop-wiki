---
name: Quartz.NET
url: https://www.quartz-scheduler.net
docs: https://www.quartz-scheduler.net/documentation/quartz-4.x/quick-start.html
repo: https://github.com/quartznet/quartznet
stars: 7115
domain: backend
category: messaging
description: .NET 용 작업 스케줄러 라이브러리. 크론 표현식·반복 트리거로 작업을 예약하고, 데이터베이스 저장소와 클러스터링으로 여러 인스턴스에서 안정적으로 실행한다.
pricing: oss
tags: [dotnet, scheduler, cron, jobs, clustering]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Quartz.NET 은 Java 의 Quartz 스케줄러를 .NET 으로 옮긴 작업 스케줄링 라이브러리다. **작업(Job)** 과 **트리거(Trigger)** 를 분리해, 같은 작업을 여러 일정으로 실행할 수 있다. 프로세스 안에서 동작하는 라이브러리이며 별도 브로커는 필요 없다.

라이선스는 Apache-2.0 이다. 2026-11 기준 최신 릴리스는 v4.7.3(2026-11-09)이다. 4.x 에서는 `IJob.Execute` 가 `ValueTask` 를 반환하고 `CancellationToken` 을 받는다. 저장소는 메모리(기본)와 데이터베이스를 고를 수 있고, 데이터베이스 저장소는 클러스터링을 지원한다.

## 설치
```bash
dotnet add package Quartz
dotnet add package Microsoft.Extensions.Hosting   # 콘솔 앱에서 호스트를 쓸 때
```
`Quartz` 패키지에 DI 연동, 호스팅, 헬스 체크, System.Text.Json 직렬화가 포함돼 있다. Newtonsoft.Json 직렬화, ASP.NET Core HTTP API, Redis 락 등은 별도 패키지다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `IJob` | 실행할 작업. `Execute(IJobExecutionContext, CancellationToken)` 구현 |
| `IJobDetail` | 작업 정의. `JobBuilder` 로 만들고 이름·그룹으로 식별 |
| `ITrigger` | 실행 시점 규칙. 단순 반복, 크론, 달력 간격 등 |
| `IScheduler` | 작업과 트리거를 등록하고 실행을 관리하는 스케줄러 |
| 잡 스토어 | 일정 저장 위치. `UseInMemoryStore()` 또는 `UsePersistentStore(...)` |
| 클러스터링 | `UseClustering()` 으로 같은 DB 를 쓰는 여러 인스턴스가 작업을 나눠 실행 |

## 기본 사용법
호스티드 서비스로 등록하고 작업을 정의한다(공식 퀵스타트 기반):
```csharp
using Quartz;

var builder = Host.CreateApplicationBuilder(args);
builder.AddQuartz();
builder.AddQuartzHostedService(o => o.WaitForJobsToComplete = true);

public sealed class HelloJob : IJob
{
    public ValueTask Execute(IJobExecutionContext context, CancellationToken cancellationToken = default)
    {
        Console.WriteLine("Hello from Quartz");
        return ValueTask.CompletedTask;
    }
}
```
스케줄러를 직접 다룰 때는 빌더로 작업과 트리거를 만든다.
```csharp
var job = JobBuilder.Create<HelloJob>().WithIdentity("job1", "group1").Build();
var trigger = TriggerBuilder.Create()
    .WithIdentity("trigger1", "group1")
    .StartNow()
    .WithSimpleSchedule(x => x.WithIntervalInSeconds(10).RepeatForever())
    .Build();
await scheduler.ScheduleJob(job, trigger);
```

## 자주 쓰는 패턴
- **크론 특성**: 작업 클래스에 `[CronTrigger("0 0 0/6 * * ?")]` 를 붙이면 6시간마다 실행된다. `q.AddDeclaredJobs()` 로 어셈블리의 선언된 작업을 한 번에 등록한다.
- **영속 저장소**: `q.UsePersistentStore(store => store.UseSqlServer("연결 문자열"))` 처럼 DB 를 지정한다. 재시작해도 일정이 유지된다.
- **클러스터링**: 영속 저장소에 `store.UseClustering()` 을 켜면 여러 인스턴스가 같은 일정을 중복 없이 나눠 실행한다.
- **스키마 준비**: `ProvisionSchema()` 는 시작 시 테이블을 만들지만 기본으로 꺼져 있다. 운영 DB 는 공식 DDL 스크립트를 직접 실행하는 편이 일반적이다.
- **종료 대기**: `WaitForJobsToComplete = true` 로 실행 중인 작업이 끝나기를 기다린 뒤 종료한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 크론·달력 기반의 정기 작업, 작업과 트리거를 분리해 관리해야 할 때, 외부 브로커 없이 DB 만으로 클러스터 스케줄링을 하고 싶을 때.
- 피할 때(대안): 즉시 실행하는 백그라운드 작업 큐와 대시보드가 필요하면 [Hangfire](/develop-wiki/backend/messaging/hangfire/), 장기 실행 워크플로와 재시도 보장이 중요하면 [Temporal](/develop-wiki/backend/messaging/temporal/) 이 맞다.

## 공식 문서
- [퀵스타트](https://www.quartz-scheduler.net/documentation/quartz-4.x/quick-start.html) · [문서 홈](https://www.quartz-scheduler.net/documentation/)
