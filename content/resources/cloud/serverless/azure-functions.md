---
name: Azure Functions
url: https://azure.microsoft.com/products/functions/
docs: https://learn.microsoft.com/en-us/azure/azure-functions/
repo: https://github.com/Azure/azure-functions-core-tools
stars: 1465
domain: cloud
category: serverless
description: 트리거와 바인딩으로 HTTP·큐·타이머·Blob·Cosmos DB 이벤트에 반응하는 Azure 서버리스 함수 서비스. Azure 리소스 이벤트 처리와 .NET·Node.js·Python 백엔드 작업에 쓴다.
pricing: freemium
tags: [azure, functions, serverless, faas, triggers, bindings]
languages: [csharp, typescript, python, java]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Azure Functions 는 **트리거**(함수를 실행시키는 이벤트)와 **바인딩**(입출력 연결)을 선언해, 다른 서비스 접근 코드를 줄이는 서버리스 실행 환경이다. 함수들은 **함수 앱** 단위로 묶여 배포·확장되고, 호스팅 플랜에 따라 확장 방식과 실행 시간 한도가 달라진다. 2026-11 기준 새 서버리스 앱에는 **Flex Consumption** 플랜이 권장되며, 기존 Consumption 플랜은 레거시로 분류되고 Linux Consumption 은 은퇴 일정이 공지돼 있다. 지원 언어는 C#(.NET 격리 워커), JavaScript/TypeScript, Python, Java, PowerShell, 그리고 사용자 지정 핸들러(Go·Rust 등)다.

## 설치
```bash
# 로컬 개발 도구 (Core Tools v4)
brew tap azure/functions
brew install azure-functions-core-tools@4
# 또는: npm i -g azure-functions-core-tools@4 --unsafe-perm true
func --version

func init my-func --worker-runtime node --language typescript
cd my-func
func new --name HttpExample --template "HTTP trigger" --authlevel "function"
func start                 # 로컬 실행 (Azurite 등 스토리지 에뮬레이터가 필요한 트리거도 있음)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Function App | 함수 묶음 = 배포·확장·설정 단위. 하나의 언어 런타임 |
| Trigger | 함수당 정확히 하나. HTTP, Timer, Queue, Service Bus, Event Hubs, Blob, Cosmos DB 등 |
| Binding | 입력·출력 연결. 예: 큐 메시지를 받아 Cosmos DB 에 쓰기 |
| 호스팅 플랜 | Flex Consumption(권장 서버리스), Premium, Dedicated(App Service), Container Apps, Consumption(레거시) |
| 프로그래밍 모델 | Node.js 는 **v4 모델**(`app.http()` 등 코드로 등록, `@azure/functions` 패키지)을 새 프로젝트에 권장 |
| .NET 격리 워커 | 함수가 별도 프로세스에서 실행. in-process 모델은 .NET 8 까지만 지원 |
| Durable Functions | 오케스트레이션·상태 있는 워크플로를 코드로 작성하는 확장 |
| 앱 설정 | 환경 변수. 비밀값은 Key Vault 참조로 연결 |

## 기본 사용법
```ts
// src/functions/hello.ts — Node.js v4 프로그래밍 모델
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

app.http("hello", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const name = req.query.get("name") ?? "world";
    ctx.log(`hello called for ${name}`);
    return { jsonBody: { hello: name } };
  },
});
```
```bash
az group create --name rg-func --location koreacentral
az storage account create --name "$AZURE_STORAGE_ACCOUNT" --resource-group rg-func --sku Standard_LRS
az functionapp list-flexconsumption-locations
az functionapp create --resource-group rg-func --name "$FUNC_APP_NAME" \
  --storage-account "$AZURE_STORAGE_ACCOUNT" --flexconsumption-location koreacentral \
  --runtime node --runtime-version 24
func azure functionapp publish "$FUNC_APP_NAME"
```
(Flex Consumption 지원 리전은 `list-flexconsumption-locations` 결과로 먼저 확인한다.)

## 자주 쓰는 패턴
- **큐 기반 비동기 처리**: HTTP 함수는 요청을 Storage Queue·Service Bus 에 넣고, 큐 트리거 함수가 처리.
- **Timer 트리거**: CRON 식으로 정기 정리·리포트 작업.
- **관리 ID 로 연결**: 바인딩 연결에 연결 문자열 대신 관리 ID 기반 설정을 쓰고 Key Vault 로 비밀 관리.
- **Durable Functions**: 팬아웃/팬인, 사람 승인 대기, 장기 워크플로.
- **Application Insights**: 로그·의존성 호출·실패 추적을 기본 연결.

## 언제 쓰나 / 피할 때
- 쓸 때: [Azure](/develop-wiki/cloud/hyperscaler/azure/) 리소스(Blob·Cosmos DB·Service Bus) 이벤트 처리, .NET 팀의 서버리스 백엔드, 워크플로가 필요한 작업(Durable).
- 피할 때(대안): 컨테이너 단위로 자유롭게 실행하려면 Azure Container Apps 나 [Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/), AWS 중심이면 [AWS Lambda](/develop-wiki/cloud/serverless/aws-lambda/). 플랜별 실행 시간·콜드 스타트 특성이 달라 지연 민감 API 는 Premium·Flex 의 상시 대기 인스턴스를 검토한다.
- 요금: 플랜별로 실행·메모리·상시 인스턴스 과금이 다르다. [가격 페이지](https://azure.microsoft.com/pricing/details/functions/)에서 확인한다.

## 공식 문서
- [문서 홈](https://learn.microsoft.com/en-us/azure/azure-functions/) · [호스팅 플랜](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale) · [Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) · [Node.js 개발자 가이드](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node) · [트리거·바인딩](https://learn.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings) · [지원 언어](https://learn.microsoft.com/en-us/azure/azure-functions/supported-languages) · [한국어 문서](https://learn.microsoft.com/ko-kr/azure/azure-functions/)
