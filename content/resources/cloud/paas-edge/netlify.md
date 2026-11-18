---
name: Netlify
url: https://www.netlify.com/
docs: https://docs.netlify.com/
repo: https://github.com/netlify/cli
stars: 1937
domain: cloud
category: paas-edge
description: Git 저장소를 연결해 정적 사이트·프론트엔드 앱을 빌드·배포하고 Functions·Edge Functions·Blobs·Forms 를 붙이는 웹 배포 플랫폼. Jamstack·SSG 사이트와 Deploy Preview 기반 협업에 쓴다.
pricing: freemium
tags: [netlify, deploy, jamstack, serverless, edge-functions, preview]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Netlify 는 저장소를 연결하면 빌드 명령을 실행해 결과물을 전역 CDN 에 배포하고, PR 마다 **Deploy Preview** 를 만들어 주는 웹 플랫폼이다. 서버 코드는 Netlify Functions(서버리스)와 Edge Functions 로, 데이터는 Netlify Blobs·Netlify Database 로 붙인다. 폼 수집(Forms), 이미지 변환(Image CDN), 리디렉션·리라이트 규칙을 설정 파일로 다룰 수 있어 정적 사이트 생성기([Astro](/develop-wiki/frontend/meta-framework/astro/) 등)와 잘 맞는다. CLI 는 MIT 라이선스로 공개돼 있다.

## 설치
```bash
npm install -g netlify-cli          # CI 에서는 devDependency 로 설치 권장
netlify login                       # 브라우저 인증, 토큰은 전역 config.json 에 저장
netlify init                        # 새 사이트 생성 + GitHub 연속 배포 설정
# 또는 기존 사이트와 연결만
netlify link
```
CI 에서는 `NETLIFY_AUTH_TOKEN`·`NETLIFY_SITE_ID` 환경 변수로 비대화형 배포한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Site / Deploy | 프로젝트 단위 / 불변 배포. 배포마다 고유 URL |
| Deploy Preview | PR 마다 생성되는 미리보기 배포 |
| `netlify.toml` | 빌드 명령·게시 디렉터리·함수 디렉터리·리디렉션·헤더를 코드로 관리 |
| Functions | `netlify/functions/` 아래 파일 = 함수. Web 표준 `Request`→`Response` 핸들러 |
| Edge Functions | 엣지에서 실행되는 Deno 기반 함수. 요청 가로채기·개인화 |
| Scheduled / Background | 주기 실행 함수 / 응답 후 오래 도는 비동기 작업 |
| Blobs | 사이트에 붙는 키-값 객체 저장소 |
| Build plugins / Extensions | 빌드 단계 훅 / 외부 서비스 통합 |

## 기본 사용법
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/old-blog/*"
  to = "/blog/:splat"
  status = 301
```
```ts
// netlify/functions/hello.mts
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const name = new URL(req.url).searchParams.get("name") ?? "world";
  return Response.json({ hello: name });
};

export const config: Config = { path: "/api/hello" };
```
```bash
netlify dev                  # 로컬에서 빌드 + 함수 + 리디렉션 재현
netlify deploy               # 드래프트 배포 (고유 미리보기 URL)
netlify deploy --prod        # 프로덕션 배포
netlify env:set API_BASE_URL "$API_BASE_URL"
```

## 자주 쓰는 패턴
- **PR 리뷰 흐름**: Deploy Preview URL 을 PR 에 자동으로 달아 디자인·QA 검토.
- **설정은 `netlify.toml` 로**: UI 설정보다 파일이 우선 적용되므로 리포지토리에서 리뷰 가능한 형태로 관리.
- **폼 백엔드 없이 수집**: HTML 폼에 Netlify Forms 속성을 달아 제출을 수집하고 알림 연결.
- **모노레포**: `netlify dev --filter <site>` 처럼 사이트를 지정해 실행.
- **비밀값**: 환경 변수는 UI·`netlify env:*` 로 관리하고 저장소에 커밋하지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 정적 사이트·문서·마케팅 사이트, SSG 프레임워크 기반 앱, 비개발자도 미리보기로 검토하는 팀.
- 피할 때(대안): Next.js 최신 기능을 우선 지원받고 싶다면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/), 엣지 스토리지·런타임 중심이면 [Cloudflare](/develop-wiki/cloud/paas-edge/cloudflare/), 장시간 실행 서버·백그라운드 워커·DB 를 한곳에서 운영하려면 [Render](/develop-wiki/cloud/paas-edge/render/)·[Fly.io](/develop-wiki/cloud/paas-edge/fly-io/).
- 요금: 무료 플랜과 유료 플랜·사용량 과금. 한도는 [가격 페이지](https://www.netlify.com/pricing/)에서 확인한다.

## 공식 문서
- [문서 홈](https://docs.netlify.com/) · [CLI 시작하기](https://docs.netlify.com/cli/get-started/) · [Functions](https://docs.netlify.com/build/functions/get-started/) · [파일 기반 설정](https://docs.netlify.com/build/configure-builds/file-based-configuration/) · [CLI 저장소](https://github.com/netlify/cli)
