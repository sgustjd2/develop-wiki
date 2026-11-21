---
name: Serverless Framework
url: https://www.serverless.com/
docs: https://www.serverless.com/framework/docs
repo: https://github.com/serverless/serverless
stars: 46932
domain: cloud
category: serverless
description: serverless.yml 하나로 AWS Lambda 함수와 이벤트·리소스를 정의해 배포하는 CLI. v4 부터 로그인이 필요하고 연 매출 200만 달러 초과 조직은 유료 구독 대상이다.
pricing: freemium
tags: [serverless, aws-lambda, iac, cloudformation, yaml, faas]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Serverless Framework 는 `serverless.yml` 에 함수, 이벤트(HTTP API, SQS, S3, 스케줄 등), IAM 권한, 추가 리소스를 선언하면 AWS CloudFormation 스택으로 변환해 배포하는 CLI 다. 2015년부터 이어진 AWS Lambda 배포 도구의 원조 격이며, 방대한 플러그인 생태계(serverless-offline 등)가 있다.

**v4 라이선스·요금 변경(2026-11 serverless.com 확인):**
- npm 의 `serverless` v4 패키지에는 독점(proprietary) 소프트웨어가 포함된다. GitHub 저장소 루트 `LICENSE` 는 Serverless 고객 약관을 가리키고, 기존 프레임워크 코드(`packages/serverless`)만 MIT 다. v3 이하는 MIT 였다.
- CLI 사용에 **로그인(또는 License Key)이 필요**하다.
- 직전 회계연도 연 매출 **200만 달러 미만** 조직과 개인은 무료(자기 신고 방식). 그 이상인 조직은 **Serverless Subscription** 이 필요하고 크레딧으로 과금된다.
- 크레딧 단위: Service Instance(서비스 × 스테이지 × 리전 = CloudFormation 스택 1개) 1개당 월 1 크레딧, 트레이스 5만 건 또는 메트릭 400만 건당 1 크레딧. 종량제는 크레딧당 $4, 연 약정 시 할인. 대시보드 무료 티어는 Service Instance 2개 포함.
- v4 는 AWS 외 provider(Azure·GCP 등) 지원을 중단했다.

2026-11 기준 최신 릴리스는 `serverless` 4.46.0(sf-core, 2026-10-28). 무료 오픈소스를 원하면 v3(MIT, 신규 기능 없음)나 [SST](/develop-wiki/cloud/serverless/sst/), AWS SAM·CDK 같은 대안을 검토한다.

## 설치
```bash
npm i -g serverless       # Node.js 필요
serverless                # 대화형: 로그인, 템플릿 선택, 서비스 생성
serverless login          # 대시보드 로그인 (CI 는 대시보드의 Access Key 또는 License Key 를 환경 변수로 지정)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Service | `serverless.yml` 하나가 정의하는 배포 단위 |
| Stage / Region | 같은 서비스의 환경(dev, prod)과 리전. 조합마다 별도 CloudFormation 스택 |
| Function | Lambda 함수 정의(handler, runtime, memory, timeout) |
| Event | 함수 트리거: `httpApi`, `http`(REST API), `sqs`, `s3`, `schedule`, `stream` 등 |
| resources | 추가 CloudFormation 리소스(DynamoDB 테이블 등) |
| Variables | `${env:X}`, `${ssm:/path}`, `${self:custom.x}`, `${sls:stage}` 로 값 주입 |
| Plugins | 명령·라이프사이클 훅을 확장하는 npm 패키지 |
| Dev Mode | `serverless dev` 로 클라우드의 이벤트를 로컬 코드로 프록시해 개발 |

## 기본 사용법
```yaml
service: todo-api
frameworkVersion: "4"

provider:
  name: aws
  runtime: nodejs22.x
  region: ap-northeast-2
  environment:
    TABLE: ${self:service}-${sls:stage}

functions:
  list:
    handler: src/list.handler
    events:
      - httpApi: { path: /todos, method: get }
  worker:
    handler: src/worker.handler
    events:
      - sqs: { arn: !GetAtt Queue.Arn }

resources:
  Resources:
    Queue: { Type: AWS::SQS::Queue }
```
```bash
serverless deploy --stage dev         # 전체 스택 배포
serverless deploy function -f list    # 함수 코드만 빠르게 갱신
serverless invoke -f list --log
serverless logs -f list --tail
serverless remove --stage dev
```

## 자주 쓰는 패턴
- **TypeScript 핸들러**: v4 는 esbuild 기반 빌드를 내장해 `.ts` 핸들러를 별도 플러그인 없이 번들한다.
- **스테이지별 설정**: `params` 블록이나 `${ssm:...}` 로 스테이지마다 다른 값·비밀을 주입한다.
- **서비스 분리**: 큰 앱을 여러 서비스로 나누고 Compose(`serverless-compose.yml`)로 의존 순서·출력 공유를 관리한다.
- **로컬 개발**: `serverless dev` 또는 커뮤니티 플러그인 serverless-offline 으로 HTTP 이벤트를 로컬에서 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Serverless Framework 로 만든 AWS Lambda 서비스가 있을 때, YAML 몇 줄로 Lambda + 이벤트를 빠르게 구성하고 싶을 때, 조직 매출이 무료 기준 이하일 때.
- 피할 때(대안): 매출 기준을 넘는 조직에서 비용·약관이 부담되거나 완전한 오픈소스가 필요하면 [SST](/develop-wiki/cloud/serverless/sst/), AWS SAM, AWS CDK. AWS 외 클라우드는 각 사 도구나 [Terraform](/develop-wiki/backend/infra-devops/terraform/)/[Pulumi](/develop-wiki/backend/infra-devops/pulumi/). 런타임 자체는 [AWS Lambda](/develop-wiki/cloud/serverless/aws-lambda/) 문서를 참고한다.
- 주의: v3→v4 업그레이드 시 로그인 요구, 라이선스, 비 AWS provider 폐기를 먼저 확인한다. 매출 기준은 자기 신고 방식이므로 조직 법무 검토가 필요할 수 있다.

## 공식 문서
- [문서 홈](https://www.serverless.com/framework/docs) · [시작하기](https://www.serverless.com/framework/docs/getting-started) · [v4 업그레이드](https://www.serverless.com/framework/docs/guides/upgrading-v4) · [요금](https://www.serverless.com/pricing) · [GitHub](https://github.com/serverless/serverless)
