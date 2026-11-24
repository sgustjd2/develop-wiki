---
name: Wolverine
url: https://wolverinefx.net
docs: https://wolverinefx.net/introduction/getting-started.html
repo: https://github.com/JasperFx/wolverine
stars: 2429
domain: backend
category: messaging
description: 메서드 이름 규칙으로 핸들러를 찾는 .NET 메시징·메디에이터 프레임워크. 로컬 큐와 RabbitMQ 등 외부 브로커, 영속 인박스·아웃박스를 한 모델로 다룬다.
pricing: oss
tags: [dotnet, message-bus, mediator, outbox, cqrs]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Wolverine 은 [C#](/develop-wiki/languages/csharp/) 로 작성하는 **메시지 핸들러 프레임워크**다. 핸들러는 마커 인터페이스나 특성 없이 이름 규칙(`Handle` 등)으로 찾고, 첫 인자가 메시지 타입이며 나머지 인자는 IoC 컨테이너에서 주입받는다. 메디에이터(프로세스 안 호출), 로컬 인메모리 큐, 외부 브로커 전송을 같은 핸들러로 다룰 수 있고, 시작할 때 IoC 등록을 읽어 핸들러 어댑터 코드를 생성한다.

라이선스는 MIT 이고 JasperFx 가 유지한다(유료 지원 플랜은 jasperfx.net). 최신 안정 버전은 6.64.2(2026-11-16)이며 NuGet 에 7.0 알파가 올라와 있다. 영속 인박스·아웃박스는 PostgreSQL, SQL Server, MySQL, SQLite, Oracle, RavenDb, CosmosDB 에 저장할 수 있고 Marten·EF Core 와 연동된다.

## 설치
```bash
dotnet new webapi
dotnet add package WolverineFx
dotnet add package WolverineFx.Http          # HTTP 엔드포인트를 쓸 때
dotnet add package WolverineFx.RabbitMQ      # RabbitMQ 전송
dotnet add package WolverineFx.Postgresql    # PostgreSQL 인박스·아웃박스
```
필요한 것만 설치한다. `Program.cs` 에서 `builder.Host.UseWolverine();` 를 호출하면 `IMessageBus` 가 범위(scoped) 서비스로 등록된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 핸들러 | 메서드 이름 규칙으로 발견되는 메서드. 정적 메서드도 가능하고 첫 인자가 메시지 |
| `IMessageBus` | 메시지 호출·발행·예약의 진입점. `InvokeAsync` 는 인라인 실행 |
| 연쇄(cascading) 메시지 | 핸들러가 값을 반환하면 원래 핸들러 성공 뒤 그 값을 메시지로 발행 |
| 엔드포인트 | 리스너·발행 대상 큐/교환기. 로컬 큐와 브로커 전송이 있다 |
| 인박스·아웃박스 | 메시지를 앱 DB 에 같은 트랜잭션으로 저장한 뒤 전달, 재시작 후 복구 |
| 추적 세션 | 테스트에서 연쇄 메시지가 끝날 때까지 기다리고 오간 메시지를 검사 |

## 기본 사용법
핸들러와 메디에이터 호출(공식 시작 가이드 기반):
```csharp
public record CreateIssue(string Title);
public record IssueCreated(Guid Id, string Title);

public static class CreateIssueHandler
{
    // 반환값은 연쇄 메시지로 발행된다
    public static IssueCreated Handle(CreateIssue command)
        => new(Guid.NewGuid(), command.Title);
}

public static class IssueCreatedHandler
{
    // 첫 인자는 메시지, 나머지는 주입된 서비스
    public static void Handle(IssueCreated created, ILogger logger)
        => logger.LogInformation("Issue {Id} created", created.Id);
}
```
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Host.UseWolverine();
var app = builder.Build();

app.MapPost("/issues/create", (CreateIssue body, IMessageBus bus) => bus.InvokeAsync(body));

return await app.RunJasperFxCommands(args);
```
RabbitMQ 로 주고받기:
```csharp
builder.Host.UseWolverine(opts =>
{
    opts.UseRabbitMq(new Uri("amqp://localhost")).AutoProvision();
    opts.ListenToRabbitQueue("pongs");
    opts.PublishMessage<PingMessage>().ToRabbitExchange("pings");
});
```
`AutoProvision()` 은 필요한 큐·교환기·바인딩을 브로커에 선언한다.

## 자주 쓰는 패턴
- **영속 아웃박스(PostgreSQL)**: 아래처럼 저장소를 지정하고, 모든 발신·수신 엔드포인트에 정책을 켠다. 스키마는 `UseResourceSetupOnStartup()` 으로 시작 시 준비한다.
  ```csharp
  builder.Host.UseWolverine(opts =>
  {
      opts.PersistMessagesWithPostgresql(connectionString!);
      opts.Policies.UseDurableOutboxOnAllSendingEndpoints();
      opts.Policies.UseDurableInboxOnAllListeners();
  });
  builder.Host.UseResourceSetupOnStartup();
  ```
  클라우드·Kubernetes 에서는 연결 문자열에 `Keepalive=30;Tcp Keepalive=true` 를 붙이면 리더 선출이 안정된다고 문서가 안내한다.
- **HTTP 엔드포인트**: `WolverineFx.Http` 를 설치하고 `AddWolverineHttp()` 와 `app.MapWolverineEndpoints()` 를 호출한다. 정적 메서드에 `[WolverinePost("/todoitems")]` 를 붙이며 반환 튜플의 첫 값이 HTTP 응답, 나머지는 메시지로 처리된다. 동시에 첫 요청이 몰릴 때 시작 실패를 피하려면 `x.WarmUpRoutes = RouteWarmup.Eager` 를 쓴다.
- **테스트**: `host.InvokeMessageAndWaitAsync(message)` 가 연쇄 메시지까지 기다려 `session.Sent.SingleMessage<T>()` 로 검사할 수 있다. 기본 대기 제한은 5초이며 `TrackActivity().Timeout(...)` 으로 늘린다.
- **명령줄 진단**: `RunJasperFxCommands` 를 쓰면 저장소 관리와 진단 명령을 CLI 로 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: .NET 에서 메디에이터와 메시지 버스를 한 모델로 쓰고 싶을 때, DB 변경과 메시지 발행을 같은 트랜잭션으로 묶는 아웃박스가 필요할 때, CQRS·이벤트 소싱(Marten 연동) 구조를 짤 때.
- 피할 때(대안): 단순 백그라운드·반복 작업이면 [Hangfire](/develop-wiki/backend/messaging/hangfire/) 가 설정이 적다. 대용량 이벤트 스트리밍은 [Apache Kafka](/develop-wiki/backend/messaging/apache-kafka/), 장기 워크플로는 [Temporal](/develop-wiki/backend/messaging/temporal/) 을 고려한다. 메이저 7 알파가 진행 중이므로 업그레이드 시 마이그레이션 가이드를 확인한다.

## 공식 문서
- [시작하기](https://wolverinefx.net/introduction/getting-started.html) · [RabbitMQ](https://wolverinefx.net/guide/messaging/transports/rabbitmq/) · [인박스·아웃박스](https://wolverinefx.net/guide/durability/) · [PostgreSQL](https://wolverinefx.net/guide/durability/postgresql.html) · [HTTP](https://wolverinefx.net/guide/http/) · [테스트](https://wolverinefx.net/guide/testing.html)
