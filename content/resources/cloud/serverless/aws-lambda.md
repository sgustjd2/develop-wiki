---
name: AWS Lambda
url: https://aws.amazon.com/lambda/
docs: https://docs.aws.amazon.com/lambda/latest/dg/welcome.html
domain: cloud
category: serverless
description: 이벤트나 API 호출이 올 때만 코드를 실행하고 자동 확장하는 AWS 서버리스 컴퓨팅. S3·SQS·API Gateway 등 AWS 이벤트 처리와 짧은 API 백엔드에 쓴다.
pricing: freemium
tags: [aws, lambda, serverless, faas, event-driven]
languages: [typescript, python, java, csharp, go, rust]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Lambda 는 서버 프로비저닝 없이 **핸들러 함수**를 올리면 트리거(API Gateway, S3, SQS, EventBridge 등 200개 이상 AWS 서비스)가 발생할 때 실행 환경을 만들어 호출하는 서비스다. 확장·패치·장애 조치는 AWS 가 맡고, 과금은 요청 수와 실행 시간·메모리 기준이다. 2026-11 기준 문서는 Lambda 를 세 가지 컴퓨팅 형태로 설명한다: 기존 함수인 **Event Functions**, Node.js HTTP 서버를 어댑터 없이 올리는 **Web Functions**, 사용자·작업별 격리 환경인 **MicroVMs**. 이 문서는 가장 널리 쓰는 Event Functions 를 기준으로 한다.

## 설치·준비
```bash
# AWS CLI v2 와 SSO 프로필은 AWS 항목 참고
export AWS_PROFILE=dev
aws lambda list-functions --query 'Functions[].FunctionName'
```
실무에서는 콘솔·CLI 직접 배포보다 SAM, CDK, [SST](/develop-wiki/cloud/serverless/sst/), [Terraform](/develop-wiki/backend/infra-devops/terraform/) 같은 IaC 도구로 함수·권한·트리거를 함께 정의한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Handler | 이벤트와 컨텍스트를 받아 결과를 반환하는 진입 함수 |
| Runtime | 관리형 런타임 ID. 2026-11 기준 최신 예: `nodejs24.x`, `python3.14`, `java25`, `dotnet10`, OS 전용 `provided.al2023` |
| 실행 역할 | 함수가 다른 AWS 서비스를 호출할 때 쓰는 IAM 역할 |
| 트리거 / 이벤트 소스 매핑 | 푸시형(API Gateway·S3) / 풀링형(SQS·Kinesis·DynamoDB Streams) 연결 |
| 메모리·타임아웃 | 메모리 128MB~10,240MB(CPU 비례 할당), 최대 900초(15분) |
| 패키지 | zip(직접 업로드 50MB, 더 크면 S3 경유) 또는 컨테이너 이미지 |
| Function URL | API Gateway 없이 함수에 HTTPS 엔드포인트 부여 |
| 동시성 | 예약 동시성(상한·보장) / 프로비저닝된 동시성(콜드 스타트 완화) |
| 콜드 스타트 | 새 실행 환경 초기화 지연. SnapStart(Java 11+, Python 3.12+, .NET 8+) 등으로 완화 |

## 기본 사용법
```js
// index.mjs — Node.js 핸들러 (ES 모듈)
export const handler = async (event) => {
  const name = event.queryStringParameters?.name ?? "world";
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hello: name, table: process.env.TABLE_NAME }),
  };
};
```
```bash
zip function.zip index.mjs
aws lambda create-function --function-name hello \
  --runtime nodejs24.x --handler index.handler \
  --role "$LAMBDA_ROLE_ARN" --zip-file fileb://function.zip \
  --environment "Variables={TABLE_NAME=todos}"
aws lambda create-function-url-config --function-name hello --auth-type AWS_IAM
aws lambda update-function-code --function-name hello --zip-file fileb://function.zip
```

## 자주 쓰는 패턴
- **SQS 비동기 처리**: 요청은 큐에 넣고 Lambda 가 배치로 소비, 실패 메시지는 DLQ 로 보낸다.
- **S3 이벤트 파이프라인**: 업로드 시 썸네일 생성·메타데이터 추출.
- **초기화는 핸들러 밖에서**: SDK 클라이언트·DB 연결은 모듈 최상단에서 만들어 실행 환경 재사용 시 다시 쓴다.
- **비밀값**: 환경 변수에 평문 비밀을 넣지 말고 Secrets Manager·Parameter Store 에서 읽는다.
- **관측성**: CloudWatch Logs 에 구조화 로그(JSON)를 남기고 X-Ray·OpenTelemetry 로 추적.

## 언제 쓰나 / 피할 때
- 쓸 때: AWS 서비스 이벤트 처리, 트래픽 변동이 큰 짧은 API, 배치·스케줄 작업(EventBridge Scheduler), 글루 코드.
- 피할 때(대안): 15분을 넘는 작업·상시 연결(WebSocket 서버)·GPU 가 필요하면 ECS/Fargate·[Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/)·[Fly.io](/develop-wiki/cloud/paas-edge/fly-io/). 일정한 고부하 트래픽이면 컨테이너가 비용상 유리할 수 있다. 다른 클라우드면 [Azure Functions](/develop-wiki/cloud/serverless/azure-functions/).
- 요금: 프리 티어와 요청·실행 시간 기반 과금. 수치는 [가격 페이지](https://aws.amazon.com/lambda/pricing/)에서 확인한다.

## 공식 문서
- [개발자 가이드](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) · [런타임 목록](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) · [할당량](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) · [Node.js 핸들러](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html) · [Function URL](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html) · [한국어 가이드](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/welcome.html)
