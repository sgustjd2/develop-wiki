---
name: Aspire
url: https://aspire.dev
docs: https://aspire.dev/get-started/what-is-aspire/
repo: https://github.com/microsoft/aspire
stars: 6455
domain: backend
category: infra-devops
description: 서비스·DB·컨테이너 구성을 코드(AppHost)로 정의하고 aspire run 으로 로컬 실행·관측하는 분산 앱 툴체인. C#과 TypeScript 로 정의하며 여러 언어 앱을 오케스트레이션한다.
pricing: oss
tags: [dotnet, orchestration, apphost, dashboard, opentelemetry]
languages: [csharp, typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Aspire 는 분산 애플리케이션의 서비스, 프런트엔드, 데이터베이스, 캐시, 컨테이너와 그 연결을 **코드 한 곳(AppHost)에 선언**하고, CLI 로 전체를 로컬에서 실행하는 툴체인이다. 앱 프레임워크를 대체하지 않고, 클라우드 제공자나 프로덕션 런타임도 아니다. 실행 중에는 로그·트레이스를 보여주는 대시보드가 함께 뜨고, 같은 모델로 Docker Compose·Kubernetes·Azure 배포를 만들 수 있다.

AppHost 는 [C#](/develop-wiki/languages/csharp/) 또는 TypeScript 로 작성하고, 오케스트레이션 대상 워크로드는 C#·JavaScript·Python·Go·Java·Rust 등이다. 라이선스는 MIT 이고 저장소는 `microsoft/aspire` 다. 최신 버전은 17.0.0(2026-11-18)이며 이전에는 13.6.x 였다. 버전이 빠르게 바뀌므로 API 이름이 문서와 다르면 사용 중인 버전의 문서를 확인한다.

## 설치
요구 사항: C# AppHost 는 .NET 10.0 SDK(Aspire 가 실행하는 앱은 .NET 8.0 이상 대상), TypeScript AppHost 는 Node.js 20.19+ / 22.13+ / 24+ 이고, 컨테이너 런타임으로 Docker Desktop(권장) 또는 Podman(`ASPIRE_CONTAINER_RUNTIME=podman`)이 필요하다.
```bash
# macOS / Linux
curl -sSL https://aspire.dev/install.sh | bash
# Windows (PowerShell)
irm https://aspire.dev/install.ps1 | iex

aspire new aspire-starter -n AspireApp -o AspireApp   # C# 스타터
cd AspireApp
aspire run                                             # 개발용 오케스트레이션 시작
```
TypeScript·Go 스타터는 `aspire-ts-starter`, `aspire-go-starter` 템플릿으로 만든다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| AppHost | 리소스와 의존 관계를 선언하는 진입 프로젝트. `DistributedApplication.CreateBuilder(args)` 로 시작 |
| 리소스 | 프로젝트, 컨테이너, DB, 캐시, 클라우드 서비스 등 앱을 이루는 구성 요소 |
| 통합(integration) | DB·메시징·클라우드 연결 패키지. 호스팅 패키지는 `aspire add <이름>` 으로 추가 |
| `WithReference` / `WaitFor` | 리소스 간 연결 정보 주입 / 대상이 준비될 때까지 시작 대기 |
| 서비스 디스커버리 | 연결 정보를 환경 변수로 주입해 로컬과 배포에서 같은 코드가 동작 |
| 대시보드 | 리소스 상태, 로그, 트레이스를 한 화면에서 확인 |

## 기본 사용법
스타터가 만든 AppHost 는 이런 형태다(공식 빠른 시작 기반).
```csharp
var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddDotnetProject("apiservice", "../AspireApp.ApiService/AspireApp.ApiService.csproj");

// 웹 프런트엔드가 API 를 참조하고, API 가 준비된 뒤에 시작
// builder.AddDotnetProject("webfrontend", "../AspireApp.Web/AspireApp.Web.csproj")
//        .WithReference(apiService)
//        .WaitFor(apiService);

builder.Build().Run();
```
PostgreSQL 을 추가하려면 호스팅 패키지를 설치하고 AppHost 에 선언한다.
```bash
aspire add postgres        # Aspire.Hosting.PostgreSQL
dotnet add package Aspire.Npgsql   # 소비하는 서비스 쪽
```
```csharp
var postgres = builder.AddPostgres("postgres").WithPgAdmin();
var postgresdb = postgres.AddDatabase("postgresdb");

builder.AddDotnetProject("apiservice", "../AspireApp.ApiService/AspireApp.ApiService.csproj")
       .WithReference(postgresdb)
       .WaitFor(postgresdb);
```
서비스의 `Program.cs` 에서는 같은 이름으로 연결한다. 이름은 AppHost 의 데이터베이스 리소스 이름과 일치해야 한다.
```csharp
builder.AddNpgsqlDataSource(connectionName: "postgresdb");
```
`Aspire.Npgsql` 은 DI 등록과 헬스 체크, OpenTelemetry 를 함께 설정한다.

## 자주 쓰는 패턴
- **데이터 볼륨**: `.WithDataVolume()` 으로 컨테이너 DB 데이터를 유지한다. 13.4 부터 PostgreSQL 기본 이미지가 18 로 바뀌어 17 에서 만든 볼륨은 쓸 수 없으므로, 17 을 유지하려면 `WithImageTag` 를 `WithDataVolume` 보다 먼저 호출한다.
- **다언어 구성**: C# AppHost 에서 `AddNodeApp`, `AddViteApp` 같은 메서드로 Node 백엔드와 Vite 프런트엔드를 함께 선언할 수 있다(저장소 README 예제).
- **배포**: `aspire publish`, `aspire deploy`, `aspire do` 명령이 있고 대상은 Docker Compose, Kubernetes, Azure 다. 명령별 동작은 배포 문서를 확인한다.
- **에이전트 도구**: `aspire agent init` 과 MCP 서버로 코딩 에이전트가 앱 모델·로그·트레이스를 읽게 할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 서비스와 DB·캐시를 로컬에서 한 번에 띄우고 로그·트레이스를 같이 보고 싶을 때, .NET 서비스와 Node·Python 서비스를 한 모델로 묶을 때.
- 피할 때(대안): 서비스가 하나이고 컨테이너 의존이 단순하면 [Docker](/develop-wiki/backend/infra-devops/docker/) Compose 파일로 충분하다. 프로덕션 오케스트레이션 자체가 목적이면 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) 와 [Helm](/develop-wiki/backend/infra-devops/helm/) 같은 배포 도구를 따로 설계해야 한다. 관측 데이터 수집 표준은 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 를 참고한다.

## 공식 문서
- [Aspire 소개](https://aspire.dev/get-started/what-is-aspire/) · [첫 앱](https://aspire.dev/get-started/first-app/) · [사전 요구 사항](https://aspire.dev/get-started/prerequisites/) · [PostgreSQL 호스팅](https://aspire.dev/integrations/databases/postgres/postgres-host/) · [PostgreSQL 연결](https://aspire.dev/integrations/databases/postgres/postgres-connect/)
