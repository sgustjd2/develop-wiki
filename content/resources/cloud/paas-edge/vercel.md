---
name: Vercel
url: https://vercel.com/
docs: https://vercel.com/docs
repo: https://github.com/vercel/vercel
domain: cloud
category: paas-edge
description: Git 푸시마다 프리뷰 URL 을 만들어 주는 프론트엔드·풀스택 배포 플랫폼. Next.js 를 만든 회사가 운영하며, 프레임워크 기반 웹앱을 서버 관리 없이 CDN·Functions 로 배포할 때 쓴다.
pricing: freemium
tags: [vercel, deploy, preview, serverless, cdn, nextjs]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Vercel 은 저장소를 연결하면 프레임워크를 감지해 빌드하고, 정적 자산은 CDN 에, 서버 코드는 **Vercel Functions** 로 배포하는 플랫폼이다. 브랜치·PR 마다 **프리뷰 배포**가 생기고, 프로덕션 롤백·점진 배포도 지원한다. [Next.js](/develop-wiki/frontend/meta-framework/nextjs/)를 무설정으로 배포하는 것이 대표 사례지만 40개 이상 프레임워크와 Express·FastAPI·[Hono](/develop-wiki/backend/web-framework/hono/) 백엔드도 올릴 수 있다. 플랫폼 자체는 비공개 SaaS 이고, CLI 와 빌더는 Apache-2.0 으로 공개돼 있다.

## 설치
```bash
npm i -g vercel        # 또는 pnpm i -g vercel / bun add -g vercel
vercel login
vercel                 # 현재 디렉터리를 프리뷰로 배포 (처음이면 프로젝트 연결)
```
CI 에서는 대화형 로그인 대신 `VERCEL_TOKEN` 환경 변수를 쓴다(명령줄 `--token` 보다 노출 위험이 적다).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project / Deployment | 저장소 1개 ≈ 프로젝트. 배포는 불변이고 고유 URL 을 가진다 |
| Environments | Local·Preview·Production + 사용자 정의 환경. 환경 변수도 환경별로 분리 |
| Preview Deployment | 브랜치·PR 마다 생성되는 배포. 팀 리뷰·QA 에 사용 |
| Vercel Functions | 서버 코드 실행 단위. Fluid compute 로 한 인스턴스가 여러 요청을 동시 처리 |
| Routing Middleware | 요청 완료 전에 실행돼 리라이트·리디렉션·개인화 처리 |
| ISR / CDN 캐시 | 정적 페이지를 일정 주기나 요청 시 재생성, 캐시 태그로 무효화 |
| Storage | Vercel Blob, Edge Config, 그리고 Marketplace 통합(Postgres·Redis 등 외부 제공자) |
| Instant Rollback / Rolling Releases | 이전 배포로 즉시 복귀 / 트래픽 일부에만 먼저 배포 |

## 기본 사용법
```bash
vercel link                      # 로컬 디렉터리를 기존 프로젝트와 연결
vercel env add DATABASE_URL --environment production
vercel env pull .env.local       # 개발용 환경 변수 내려받기
vercel dev                       # Vercel 런타임을 로컬에서 재현
vercel deploy --prod             # 프로덕션 배포
vercel rollback                  # 직전 프로덕션으로 되돌리기
vercel logs                      # 런타임 로그 조회
```
```ts
// api/hello.ts — 프레임워크 없이 쓰는 Vercel Function (Web 표준 Request/Response)
export default {
  fetch(request: Request) {
    const name = new URL(request.url).searchParams.get("name") ?? "world";
    return Response.json({ hello: name, region: process.env.VERCEL_REGION });
  },
};
```

## 자주 쓰는 패턴
- **PR 프리뷰 리뷰**: Git 연동 후 PR 마다 생기는 프리뷰 URL 에서 기획·디자인 검토, 툴바 코멘트로 피드백.
- **환경 변수 동기화**: 비밀값은 대시보드·`vercel env` 로만 관리하고 로컬은 `vercel env pull` 로 받는다.
- **Cron**: `vercel.json` 의 `crons` 에 경로와 스케줄을 등록해 주기 작업을 실행한다.
- **외부 DB 연결**: Marketplace 통합으로 Postgres·Redis 를 프로비저닝하면 연결 문자열이 환경 변수로 주입된다.
- **보안**: Deployment Protection 으로 프리뷰 접근 제한, WAF·Bot Management 로 트래픽 필터링.

## 언제 쓰나 / 피할 때
- 쓸 때: Next.js 등 프론트엔드 중심 웹앱, PR 마다 프리뷰가 필요한 팀, 인프라 운영 인력 없이 빠르게 배포할 때.
- 피할 때(대안): 장시간 실행 프로세스·상태 있는 서버·자유로운 네트워크 구성이 필요하면 [Fly.io](/develop-wiki/cloud/paas-edge/fly-io/)·[Render](/develop-wiki/cloud/paas-edge/render/)·[Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/). 엣지 런타임·자체 스토리지(KV·R2·D1) 중심이면 [Cloudflare](/develop-wiki/cloud/paas-edge/cloudflare/). 사용량 기반 과금이 예측하기 어렵다면 Spend Management 를 먼저 설정한다.
- 요금: Hobby·Pro·Enterprise 플랜과 사용량 과금. 한도는 [가격 페이지](https://vercel.com/pricing)에서 확인한다.

## 공식 문서
- [문서 홈](https://vercel.com/docs) · [CLI](https://vercel.com/docs/cli) · [Functions](https://vercel.com/docs/functions) · [환경 변수](https://vercel.com/docs/environment-variables) · [Cron Jobs](https://vercel.com/docs/cron-jobs) · [변경 로그](https://vercel.com/changelog)
