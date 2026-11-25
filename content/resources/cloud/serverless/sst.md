---
name: SST
url: https://sst.dev/
docs: https://sst.dev/docs/
repo: https://github.com/anomalyco/sst
stars: 26467
domain: cloud
category: serverless
description: TypeScript 설정 파일 하나로 Lambda·API·버킷·DB·프론트엔드를 내 AWS·Cloudflare 계정에 배포하는 오픈소스 IaC 프레임워크. 리소스를 코드에 연결(link)하고 로컬에서 라이브 개발할 때 쓴다.
pricing: oss
tags: [sst, serverless, iac, aws, cloudflare, pulumi, lambda]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SST 는 `sst.config.ts` 에 **컴포넌트**(`sst.aws.Function`, `sst.aws.Bucket`, `sst.aws.Nextjs` 등)를 선언하면 사용자의 AWS·Cloudflare 계정에 인프라를 만들어 주는 프레임워크다. 내부 엔진은 Pulumi 이고 Terraform provider 생태계를 그대로 쓰지만, Pulumi 계정 없이 상태가 사용자 쪽에 저장된다. **링크**로 리소스를 함수·프론트엔드에 연결하면 이름·권한이 자동으로 주입되고, `sst dev` 로 로컬 코드에 실제 클라우드 리소스를 붙여 개발한다. MIT 라이선스이며, 저장소는 `anomalyco/sst` 로 이전됐다(`sst/sst` 에서 리디렉션). 2026-02 에 나온 **v4** 는 AWS provider v7 업그레이드가 핵심이고, 2026-11 기준 최신 릴리스는 v4.17.2.

## 설치
```bash
mkdir my-app && cd my-app && npm init -y
npx sst@latest init          # sst.config.ts 생성, sst 를 로컬 의존성으로 추가
npm install
# JavaScript 프로젝트가 아니면 전역 CLI: curl -fsSL https://sst.dev/install | bash
```
AWS 자격 증명은 SST 가 따로 받지 않고 AWS CLI 프로필(SSO 권장)을 그대로 쓴다. `AWS_PROFILE` 을 지정하거나 설정 파일의 provider 옵션으로 프로필을 고른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `sst.config.ts` | `$config({ app, run })`. `app` 은 이름·삭제 정책·홈 provider, `run` 은 리소스 선언 |
| Component | 상위 수준 리소스 묶음. 예: `Function`, `ApiGatewayV2`, `Bucket`, `Postgres`, `Cron`, `Nextjs`, `StaticSite` |
| Link | `link: [bucket]` 으로 연결하면 런타임에서 `Resource.MyBucket.name` 으로 접근, IAM 권한도 자동 부여 |
| Stage | 환경 이름 공간(dev·개인 스테이지·production). `--stage` 로 지정 |
| removal | 스테이지 삭제 시 리소스 보존 여부(`retain`/`remove`) |
| Transform | 컴포넌트가 만드는 하위 리소스(IAM 역할 등)를 세밀하게 수정 |
| Secret | `sst.Secret` 컴포넌트 + `sst secret set` 으로 스테이지별 비밀값 관리 |
| Live (`sst dev`) | 함수 호출을 로컬 코드로 프록시해 재배포 없이 수정·테스트 |

## 기본 사용법
```ts
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "uploads",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("MyBucket");
    const api = new sst.aws.ApiGatewayV2("MyApi");
    api.route("GET /latest", { link: [bucket], handler: "src/api.latest" });
    return { api: api.url };
  },
});
```
```ts
// src/api.ts — 링크된 리소스는 Resource 로 타입 안전하게 접근
import { Resource } from "sst";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
export async function latest() {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: Resource.MyBucket.name }));
  return { statusCode: 200, body: JSON.stringify(out.Contents?.map((o) => o.Key) ?? []) };
}
```
```bash
npx sst dev                          # 개인 스테이지에 배포 + 로컬 라이브 개발
npx sst deploy --stage production    # 프로덕션 배포
npx sst remove --stage pr-123        # 프리뷰 스테이지 정리
```

## 자주 쓰는 패턴
- **풀스택 한 저장소**: `sst.aws.Nextjs`·`StaticSite` 프론트엔드와 API·DB 를 한 설정에서 링크해 배포.
- **PR 별 스테이지**: CI 에서 `--stage pr-<번호>` 로 배포하고 머지 후 `sst remove`.
- **비밀값**: `sst secret set StripeKey ...` 처럼 스테이지별로 저장하고 `link` 로 함수에 연결(코드·Git 에 비밀 없음).
- **v3 → v4 업그레이드**: 컴포넌트만 쓰면 코드 변경이 거의 없고, transform·Pulumi 리소스를 직접 쓴 경우 AWS provider v7 변경점을 마이그레이션 가이드로 확인한다.
- **Cloudflare 배포**: `home: "cloudflare"` 와 `sst.cloudflare.*` 컴포넌트로 Workers·R2 를 같은 방식으로 다룬다.

## 언제 쓰나 / 피할 때
- 쓸 때: TypeScript 팀이 AWS 서버리스 풀스택 앱을 코드로 관리하고 싶을 때, 프론트엔드·API·DB 를 한 번에 연결·배포할 때, Vercel 같은 경험을 자기 AWS 계정에서 원할 때.
- 피할 때(대안): 다중 클라우드 인프라 전반을 관리하는 플랫폼 팀이면 [Terraform](/develop-wiki/backend/infra-devops/terraform/)·[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/)·Pulumi 직접 사용, AWS 공식 도구가 필요하면 CDK·SAM. Serverless Framework 는 v4 부터 연 매출 200만 달러 초과 조직에 유료 구독과 인증이 필요하므로([v4 업그레이드 가이드](https://www.serverless.com/framework/docs/guides/upgrading-v4)) 조건을 확인한다. 인프라를 직접 다루고 싶지 않다면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/) 같은 PaaS.
- 요금: 프레임워크는 무료(MIT). 비용은 배포한 AWS·Cloudflare 리소스 사용량으로 발생한다.

## 공식 문서
- [문서 홈](https://sst.dev/docs/) · [API 시작하기(AWS)](https://sst.dev/docs/start/aws/api) · [Linking](https://sst.dev/docs/linking) · [Live](https://sst.dev/docs/live) · [CLI](https://sst.dev/docs/reference/cli/) · [v3→v4 마이그레이션](https://sst.dev/docs/migrate-from-v3/) · [저장소](https://github.com/anomalyco/sst)
