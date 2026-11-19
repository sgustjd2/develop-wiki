---
name: Orleans
url: https://learn.microsoft.com/dotnet/orleans/overview
docs: https://learn.microsoft.com/dotnet/orleans/quickstarts/build-your-first-orleans-app
repo: https://github.com/dotnet/orleans
stars: 10929
domain: backend
category: messaging
description: .NET 용 가상 액터(Grain) 기반 분산 애플리케이션 프레임워크. 상태를 가진 객체를 클러스터에 자동 배치해, 게임·채팅·세션처럼 엔티티 단위 상태 서비스를 확장할 때 쓴다.
pricing: oss
tags: [dotnet, actor-model, virtual-actor, distributed, stateful]
languages: [csharp]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Orleans 는 .NET 팀이 관리하는 분산 앱 프레임워크로, **가상 액터(virtual actor)** 모델을 쓴다. 액터는 **Grain** 이라 부르며 사용자가 정한 키(Guid·정수·문자열)로 식별한다. Grain 은 항상 존재하는 것처럼 호출할 수 있고, 런타임이 필요할 때 활성화하고 안 쓰면 메모리에서 내린다. 호출하는 쪽은 Grain 이 어느 서버에 있는지 알 필요가 없다.

여러 **사일로(silo)** 가 클러스터를 이루어 Grain 을 나눠 호스팅한다. 라이선스는 MIT 이며 2026-11 기준 최신 릴리스는 v10.4.2(2026-10-30)다. 공식 문서에 따르면 Orleans 10.0 은 .NET 8·9·10 을 대상으로 하고, 내장 대시보드와 Redis 클러스터링·영속성·리마인더 프로바이더를 제공한다.

## 설치
```bash
dotnet add package Microsoft.Orleans.Server   # 사일로(서버) 호스팅
dotnet add package Microsoft.Orleans.Client   # 별도 프로세스의 클라이언트
```
Redis, Azure Storage, ADO.NET 등 클러스터링·저장소 프로바이더는 각각 별도 패키지다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Grain | 식별자·동작·상태를 가진 가상 액터. `Grain` 을 상속하고 `IGrainWithStringKey` 등 키 인터페이스를 구현 |
| 사일로(silo) | Grain 을 호스팅하는 서버 프로세스. 여러 사일로가 클러스터 구성 |
| `IGrainFactory` | 키로 Grain 참조를 얻는 팩토리 (`GetGrain<T>(key)`) |
| 영속 상태 | `IPersistentState<T>` 로 이름 붙은 상태를 읽고 `WriteStateAsync()` 로 저장 |
| 타이머·리마인더 | 타이머는 비영속, 리마인더는 Grain 이 비활성이어도 동작하는 영속 스케줄 |
| 스트림 | 생산자·소비자를 분리한 관리형 스트림 (Event Hubs, Kinesis 등이 뒷받침) |
| 트랜잭션 | 여러 Grain 에 걸친 분산 ACID 트랜잭션 |

## 기본 사용법
공식 퀵스타트(URL 단축기)를 줄인 예다.
```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Host.UseOrleans(static siloBuilder =>
{
    siloBuilder.UseLocalhostClustering();   // 개발용 단일 노드
    siloBuilder.AddMemoryGrainStorage("urls");
});

var app = builder.Build();

app.MapGet("/shorten", static async (IGrainFactory grains, string id, string url) =>
{
    await grains.GetGrain<IUrlShortenerGrain>(id).SetUrl(url);
    return Results.Ok(id);
});
app.Run();

public interface IUrlShortenerGrain : IGrainWithStringKey
{
    Task SetUrl(string fullUrl);
    Task<string> GetUrl();
}

public sealed class UrlShortenerGrain(
    [PersistentState("url", "urls")] IPersistentState<UrlDetails> state)
    : Grain, IUrlShortenerGrain
{
    public async Task SetUrl(string fullUrl)
    {
        state.State = new() { FullUrl = fullUrl };
        await state.WriteStateAsync();
    }

    public Task<string> GetUrl() => Task.FromResult(state.State.FullUrl);
}

[GenerateSerializer]
public sealed record class UrlDetails { [Id(0)] public string FullUrl { get; set; } = ""; }
```
`UseLocalhostClustering` 과 메모리 저장소는 개발용이다. 운영에서는 Redis·Azure Storage 같은 클러스터링·저장소 프로바이더를 쓴다.

## 자주 쓰는 패턴
- **엔티티당 Grain**: 사용자·주문·게임방처럼 키가 있는 엔티티마다 Grain 하나를 두면, 한 Grain 의 호출이 순서대로 처리되어 락 없이 상태를 다룰 수 있다.
- **Aspire 연동**: `AddOrleans("cluster").WithClustering(redis).WithGrainStorage("urls", redis)` 로 클러스터·저장소를 선언하고 사일로 프로젝트에 연결한다(공식 문서의 운영 권장 방식).
- **리마인더**: 몇 시간 뒤 실행처럼 반드시 수행돼야 하는 작업에 쓴다. 고빈도·유실 가능한 작업은 타이머.
- **Stateless worker**: 상태 없는 Grain 을 여러 사일로에 동시에 활성화해 병렬 처리한다.
- **호출 필터**: 인증·로깅·텔레메트리를 Grain 호출 필터로 공통 처리한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 사용자·디바이스·게임 세션처럼 메모리에 상태를 두고 낮은 지연으로 확장해야 하는 .NET 서비스, 직접 샤딩·락 관리를 피하고 싶을 때.
- 피할 때(대안): 단순한 요청-응답 CRUD 는 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/) 와 DB 로 충분하다. 메시지 중심 통합은 [Wolverine](/develop-wiki/backend/messaging/wolverine/), 장기 워크플로는 [Temporal](/develop-wiki/backend/messaging/temporal/) 이 목적에 가깝다. 모든 Grain 호출이 비동기 RPC 라서 .NET 이외 언어가 주력이면 맞지 않는다.

## 공식 문서
- [개요](https://learn.microsoft.com/dotnet/orleans/overview) · [퀵스타트](https://learn.microsoft.com/dotnet/orleans/quickstarts/build-your-first-orleans-app) · [한국어 퀵스타트](https://learn.microsoft.com/ko-kr/dotnet/orleans/quickstarts/build-your-first-orleans-app)
