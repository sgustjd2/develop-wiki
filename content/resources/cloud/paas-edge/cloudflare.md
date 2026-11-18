---
name: Cloudflare Developer Platform (Workers·Pages·R2)
url: https://workers.cloudflare.com/
docs: https://developers.cloudflare.com/workers/
repo: https://github.com/cloudflare/workers-sdk
stars: 4735
domain: cloud
category: paas-edge
description: Cloudflare 전 세계 네트워크에서 코드를 실행하는 Workers 와 정적 자산·R2 객체 스토리지·KV·D1 을 묶은 개발 플랫폼. 지연이 짧은 엣지 API·웹앱과 S3 호환 스토리지가 필요할 때 쓴다.
pricing: freemium
tags: [cloudflare, workers, pages, r2, edge, wrangler, kv, d1]
languages: [typescript, python, rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Cloudflare Workers 는 V8 isolate 기반 런타임에서 코드를 Cloudflare 네트워크 전역에 배포하는 서버리스 플랫폼이다. 코드는 JavaScript·TypeScript 가 기본이고 Python·Rust(그 외 WebAssembly)도 지원한다. 스토리지·상태는 **바인딩**(`env.X`)으로 연결한다: R2(객체), KV(키-값), D1(SQLite 기반 SQL), Durable Objects(상태 있는 객체), Queues, Hyperdrive(외부 DB 연결 가속), Workers AI 등. 2026-11 기준 공식 문서는 **새 프로젝트는 Pages 대신 Workers(정적 자산 포함)로 시작**하라고 안내하며, Pages 에서 Workers 로 옮기는 마이그레이션 가이드를 제공한다.

## 설치
```bash
npm create cloudflare@latest -- my-worker   # C3: 템플릿 생성 + 의존성 설치
cd my-worker
npx wrangler dev        # http://localhost:8787 로컬 실행
npx wrangler deploy     # *.workers.dev 또는 사용자 도메인에 배포
```
CLI 는 Wrangler 이며, 설정 파일은 새 프로젝트 기준 `wrangler.jsonc` 를 권장한다(`wrangler.toml` 도 지원). `name`·`main`·`compatibility_date` 가 최소 필수 키다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Worker | `fetch(request, env, ctx)` 핸들러를 가진 ES 모듈. 요청마다 가까운 위치에서 실행 |
| Binding | 리소스를 `env` 에 주입하는 선언. 코드에 키·비밀번호가 필요 없다 |
| Static Assets | `assets.directory` 의 파일을 Worker 와 함께 업로드·서빙. SPA·정적 사이트 호스팅 |
| R2 | S3 API 호환 객체 스토리지. 이그레스(외부 전송) 요금이 없는 것이 특징 |
| KV / D1 | 읽기 위주 전역 키-값 / SQLite 기반 서버리스 SQL DB |
| Durable Objects | 고유 ID 별 단일 인스턴스 + 저장소. 채팅방·협업·레이트 리밋 같은 조정 작업 |
| compatibility_date | 런타임 동작을 고정하는 날짜. 올리면 새 동작이 적용된다 |
| Pages | 기존 Git 연동 정적·풀스택 호스팅. 새 기능은 Workers 쪽에 집중 |

## 기본 사용법
```jsonc
// wrangler.jsonc
{
  "name": "uploads-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-11-18",
  "assets": { "directory": "./public" },
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "my-uploads" }]
}
```
```ts
// src/index.ts — R2 에 파일 저장/조회
export default {
  async fetch(request: Request, env: { BUCKET: R2Bucket }): Promise<Response> {
    const key = new URL(request.url).pathname.slice(1);
    if (request.method === "PUT") {
      await env.BUCKET.put(key, request.body);
      return new Response(`saved ${key}`, { status: 201 });
    }
    const obj = await env.BUCKET.get(key);
    if (!obj) return new Response("not found", { status: 404 });
    return new Response(obj.body, { headers: { etag: obj.httpEtag } });
  },
};
```
```bash
npx wrangler r2 bucket create my-uploads
npx wrangler secret put API_TOKEN      # 비밀값은 secret 으로 (설정 파일에 쓰지 않음)
npx wrangler types                     # 바인딩 타입(Env) 생성
```

## 자주 쓰는 패턴
- **풀스택 앱**: 프레임워크 빌드 결과를 Static Assets 로, API 는 같은 Worker 의 `fetch` 로 처리한다. Vite 사용 시 `@cloudflare/vite-plugin` 으로 로컬 개발.
- **R2 를 S3 대체로**: 기존 S3 SDK 의 엔드포인트만 R2 로 바꿔 쓰거나, Worker 바인딩으로 직접 접근. 지원 연산은 S3 호환성 표에서 확인.
- **D1 + Drizzle 등 ORM**: 소규모 SQL 데이터는 D1, 외부 PostgreSQL 은 Hyperdrive 로 연결 풀링.
- **엣지 미들웨어**: 인증 토큰 검증·A/B 라우팅·헤더 조작을 오리진 앞단 Worker 에서 처리.
- **[Hono](/develop-wiki/backend/web-framework/hono/)**: Workers 위 라우팅 프레임워크로 자주 함께 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 전 세계 사용자 대상 저지연 API, 이그레스 비용이 큰 파일 배포(R2), 이미 Cloudflare DNS·CDN 을 쓰는 서비스.
- 피할 때(대안): Node.js 전체 API·네이티브 모듈·장시간 CPU 작업이 필요하면 컨테이너 기반 [Fly.io](/develop-wiki/cloud/paas-edge/fly-io/)·[Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/). Next.js 기능을 무설정으로 쓰려면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/). Workers 는 Node 호환 계층이 있지만 모든 npm 패키지가 동작하지는 않는다.
- 요금: Workers Free/Paid 와 제품별 사용량 과금. 한도는 각 제품의 Pricing 문서에서 확인한다.

## 공식 문서
- [Workers](https://developers.cloudflare.com/workers/) · [시작하기](https://developers.cloudflare.com/workers/get-started/guide/) · [Wrangler 설정](https://developers.cloudflare.com/workers/wrangler/configuration/) · [Static Assets](https://developers.cloudflare.com/workers/static-assets/) · [Pages](https://developers.cloudflare.com/pages/) · [R2](https://developers.cloudflare.com/r2/) · [R2 S3 호환성](https://developers.cloudflare.com/r2/api/s3/api/)
