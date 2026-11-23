---
name: Polly
url: https://www.pollydocs.org
docs: https://www.pollydocs.org/getting-started.html
repo: https://github.com/App-vNext/Polly
stars: 14255
domain: backend
category: api
description: 재시도·타임아웃·서킷 브레이커·폴백 같은 복원력 전략을 파이프라인으로 조합하는 .NET 라이브러리. 외부 API 호출과 HttpClient 의 일시적 장애 처리에 쓴다.
pricing: oss
tags: [dotnet, resilience, retry, circuit-breaker, httpclient]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Polly 는 외부 호출이 일시적으로 실패하거나 느릴 때 앱이 버티도록 **복원력(resilience) 전략**을 코드로 조합하는 [C#](/develop-wiki/languages/csharp/) 라이브러리다. 전략을 `ResiliencePipelineBuilder` 로 이어 붙여 하나의 파이프라인으로 만들고, 호출 코드를 `ExecuteAsync` 로 감싸 실행한다. 전략은 두 종류다.

- 반응형: 예외·결과에 반응. Retry, Circuit Breaker, Fallback, Hedging
- 선제형: 실행 전후에 끊거나 거절. Timeout, Rate Limiter

라이선스는 BSD-3-Clause 이고 최신 안정 버전은 8.9.1(2026-11-07)이다. .NET 의 `Microsoft.Extensions.Http.Resilience` 패키지가 Polly 위에 만들어져 있어, `HttpClient` 에는 이 패키지의 표준 핸들러를 쓰는 편이 간단하다.

## 설치
```bash
dotnet add package Polly.Core            # 파이프라인 직접 구성
dotnet add package Polly.Extensions      # DI 등록(AddResiliencePipeline)
dotnet add package Microsoft.Extensions.Http.Resilience   # HttpClient 표준 핸들러
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ResiliencePipeline` | 전략을 순서대로 겹친 실행 단위. 먼저 추가한 전략이 바깥쪽 |
| Retry | 일시적 오류에 재시도. 기본 3회, 지연 2초 상수 백오프, 지터 꺼짐 |
| Circuit Breaker | 실패 비율이 임계를 넘으면 한동안 호출을 차단. 상태는 Closed/Open/HalfOpen/Isolated |
| Timeout | 기본 30초. 초과하면 `TimeoutRejectedException` (표준 `TimeoutException` 이 아님) |
| Fallback | 실패 시 대체 값이나 대체 동작 반환 |
| Hedging | 느릴 때 병렬로 추가 요청을 보내 가장 빠른 결과 사용 |
| Rate Limiter | 실행 속도·동시 수 제한 |

## 기본 사용법
```csharp
using Polly;
using Polly.Retry;

ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true,          // 지연에 무작위 값을 더해 재시도 쏠림 방지
        MaxRetryAttempts = 4,
        Delay = TimeSpan.FromSeconds(3),
    })
    .AddTimeout(TimeSpan.FromSeconds(10))
    .Build();

var response = await pipeline.ExecuteAsync(
    async ct => await httpClient.GetAsync(endpoint, ct),
    cancellationToken);
```
콜백은 받은 `CancellationToken` 을 호출에 전달해야 타임아웃이 제때 동작한다. 서킷 브레이커 기본값은 실패 비율 0.1, 최소 처리량 100, 샘플링 30초, 차단 5초이고 최소 처리량에 못 미치면 모두 실패해도 열리지 않는다.
```csharp
var pipeline = new ResiliencePipelineBuilder()
    .AddCircuitBreaker(new CircuitBreakerStrategyOptions
    {
        FailureRatio = 0.1,
        MinimumThroughput = 100,
        SamplingDuration = TimeSpan.FromSeconds(30),
        BreakDuration = TimeSpan.FromSeconds(5),
    })
    .Build();
```

## 자주 쓰는 패턴
- **DI 등록**: `services.AddResiliencePipeline("my-key", builder => builder.AddTimeout(TimeSpan.FromSeconds(10)));` 로 등록하고 `ResiliencePipelineProvider<string>.GetPipeline("my-key")` 로 꺼낸다. Polly 8.3.0 이상, .NET 8 이상이면 `[FromKeyedServices("my-key")] ResiliencePipeline` 으로 생성자 주입한다.
- **HttpClient 표준 핸들러**: `httpClientBuilder.AddStandardResilienceHandler();` 한 줄로 속도 제한 → 전체 타임아웃(30초) → 재시도(3회, 지수 백오프, 지터) → 서킷 브레이커 → 시도별 타임아웃(10초) 순서의 기본 구성이 붙는다. 5xx, 408, 429 와 `HttpRequestException`, `TimeoutRejectedException` 이 재시도·차단 대상이다. 핸들러는 하나만 붙이고 쌓지 않는다.
- **비멱등 요청 재시도 끄기**: 기본은 모든 HTTP 메서드를 재시도하므로 중복 생성이 문제되면 `options.Retry.DisableForUnsafeHttpMethods()`(POST, PATCH, PUT, DELETE, CONNECT 제외) 또는 `DisableFor(HttpMethod.Post)` 를 쓴다.
- **사용자 정의**: `AddResilienceHandler("CustomPipeline", builder => { builder.AddRetry(...); builder.AddCircuitBreaker(...); builder.AddTimeout(...); })`. 재시도의 `ShouldHandle` 을 직접 지정할 때는 타임아웃 예외를 포함할지 확인한다.
- **설정 변경 반영**: `ResilienceHandlerContext.EnableReloads<T>("name")` 로 옵션 변경 시 파이프라인을 재구성한다.
- **순서**: 재시도를 바깥, 시도별 타임아웃을 안쪽에 두면 시도마다 제한이 걸린다. 표준 핸들러가 이 순서를 따른다.

## 언제 쓰나 / 피할 때
- 쓸 때: 외부 REST·gRPC·DB 호출의 일시 장애, 느린 의존성이 전체를 막는 상황을 줄일 때, HttpClient 에 검증된 기본 정책을 한 번에 붙일 때.
- 피할 때(대안): 재시도로 해결되지 않는 영구 오류나 멱등하지 않은 작업은 재시도를 끄고 [Wolverine](/develop-wiki/backend/messaging/wolverine/) 의 아웃박스나 [Hangfire](/develop-wiki/backend/messaging/hangfire/) 같은 영속 작업으로 넘긴다. 서비스 메시나 게이트웨이 수준(예: [YARP](/develop-wiki/backend/infra-devops/yarp/))에서 이미 재시도하면 이중 재시도로 부하가 증폭되지 않는지 확인한다.

## 공식 문서
- [시작하기](https://www.pollydocs.org/getting-started.html) · [전략 개요](https://www.pollydocs.org/strategies/index.html) · [Retry](https://www.pollydocs.org/strategies/retry.html) · [Circuit Breaker](https://www.pollydocs.org/strategies/circuit-breaker.html) · [Timeout](https://www.pollydocs.org/strategies/timeout.html) · [DI](https://www.pollydocs.org/advanced/dependency-injection.html) · [HTTP 복원력(Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience)
