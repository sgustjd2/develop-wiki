---
name: Railway
url: https://railway.com
docs: https://docs.railway.com/
repo: https://github.com/railwayapp/cli
stars: 635
domain: cloud
category: paas-edge
description: 저장소나 Docker 이미지를 연결하면 빌드·배포하고 Postgres·Redis 같은 DB 를 같은 프로젝트에 붙여 주는 사용량 과금형 PaaS. 서비스 여러 개로 된 앱을 빠르게 올릴 때 쓴다.
pricing: freemium
tags: [railway, paas, deploy, postgres, usage-based, heroku-alternative]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Railway 는 GitHub 저장소·Docker 이미지·로컬 디렉터리를 서비스로 배포하는 PaaS 다. **프로젝트** 캔버스에 웹 서비스·워커·크론과 Postgres·MySQL·Redis·MongoDB 같은 데이터베이스(템플릿)를 함께 놓고, 서비스 간에는 사설 네트워크와 변수 참조로 연결한다. 빌드는 기본적으로 자체 빌더 **Railpack** 이 언어를 감지해 이미지를 만들고, 저장소에 Dockerfile 이 있으면 그것을 쓴다. 요금은 초 단위로 측정한 CPU·메모리·볼륨·egress 사용량 기준이다.

플랫폼 자체는 상용 서비스이고, CLI(`railwayapp/cli`, Rust, MIT)만 오픈소스다. 2026-11 기준 CLI 최신 릴리스는 v5.75.0(2026-11-17). 비슷한 위치의 PaaS 로 [Render](/develop-wiki/cloud/paas-edge/render/)·[Fly.io](/develop-wiki/cloud/paas-edge/fly-io/) 가 있다.

**요금(2026-11 확인):**
| 플랜 | 월 요금 | 포함 사용량 |
| --- | --- | --- |
| Free Trial | $0 | 30일 동안 쓰는 $5 일회성 크레딧 |
| Free | $0 | 월 $1 |
| Hobby | $5 | 월 $5 |
| Pro | 워크스페이스당 $20 | 월 $20 |
| Enterprise | 협의 | 협의 |

사용량 단가는 메모리 약 $10/GB·월, CPU 약 $20/vCPU·월, 볼륨 약 $0.15/GB·월, 서비스 egress $0.05/GB 수준이다(공식 요금 페이지 기준, 변동 가능).

## 설치
```bash
brew install railway            # macOS
npm i -g @railway/cli           # Node.js
bash <(curl -fsSL railway.com/install.sh)

railway login                   # SSH 환경은 --browserless
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project | 서비스·DB·환경을 담는 단위, 캔버스로 표시 |
| Service | 배포 단위. 저장소·이미지·로컬 코드 소스 |
| Environment | production·staging·PR 환경. 환경별 변수와 설정 |
| Variables | 서비스 환경 변수. `${{Postgres.DATABASE_URL}}` 처럼 다른 서비스 값을 참조 |
| Private networking | `<서비스>.railway.internal` 로 서비스 간 내부 통신 |
| Volume | 서비스에 붙이는 영속 디스크 |
| Railpack | 기본 빌더. Dockerfile 이 있으면 Dockerfile 우선 |
| Infrastructure as Code | `.railway/railway.ts` 로 프로젝트 구성을 선언하고 plan/apply |

## 기본 사용법
```bash
railway init                     # 새 프로젝트 생성 (기존 프로젝트는 railway link)
railway add --database postgres  # Postgres 서비스 추가
railway up                       # 현재 디렉터리를 빌드·배포 (--detach 로 로그 스트리밍 생략)
railway variable set NODE_ENV=production
railway run npm run migrate      # Railway 변수를 주입해 로컬에서 명령 실행
railway logs
railway domain                   # *.up.railway.app 도메인 생성 (커스텀 도메인도 가능)
```
코드로 구성을 관리하려면 `railway config init` 으로 `.railway/railway.ts` 를 만들고 `railway config plan` → `railway config apply` 로 반영한다. 기존 프로젝트는 `railway config pull` 로 가져온다.
```ts
import { defineRailway, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("web");
  return project("my-project", { resources: [web] });
});
```

## 자주 쓰는 패턴
- **GitHub 자동 배포**: 서비스에 저장소·브랜치를 연결하면 푸시마다 배포되고, PR 환경을 켜면 PR 별 임시 환경이 생긴다.
- **변수 참조**: DB 접속 정보를 복사하지 말고 `${{Postgres.DATABASE_URL}}` 참조로 연결해 비밀번호 교체 시 자동 반영되게 한다.
- **마이그레이션**: 배포 전 명령(pre-deploy command)에 DB 마이그레이션을 걸어 둔다.
- **CI 배포**: 프로젝트 토큰을 `RAILWAY_TOKEN` 으로 넣고 `railway up --ci`(빌드 로그만 스트리밍 후 종료)나 IaC `railway config apply --yes` 를 실행한다.
- **템플릿**: 공개 템플릿으로 오픈소스 앱(예: 자체 호스팅 도구)을 한 번에 배포한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 사이드 프로젝트·스타트업 초기에 웹 서비스와 DB 를 한곳에서 빠르게 올리고 싶을 때, 서비스가 여러 개인 앱을 인프라 지식 없이 운영할 때.
- 피할 때(대안): 비용 상한·예측이 중요하면 고정 요금형 플랜이나 [Render](/develop-wiki/cloud/paas-edge/render/), 지역 분산 VM·엣지 근처 배치는 [Fly.io](/develop-wiki/cloud/paas-edge/fly-io/), 프런트엔드 중심은 [Vercel](/develop-wiki/cloud/paas-edge/vercel/)·[Netlify](/develop-wiki/cloud/paas-edge/netlify/). 규제·대규모 트래픽은 하이퍼스케일러 직접 운영.
- 주의: 기존 `railway.json`/`railway.toml`(Config as Code)은 폐기(deprecated)됐고 IaC 가 대체한다. 공식 문서에 따르면 기존(레거시) 서비스에서만 배포 시 읽히고 새 서비스에는 쓸 수 없으며, 2026-12-01 부터는 읽지 않는다(하드 컷오프). 사용량 과금이라 사용량 한도(usage limit)를 설정해 둔다.

## 공식 문서
- [문서 홈](https://docs.railway.com/) · [CLI](https://docs.railway.com/guides/cli) · [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code) · [요금](https://railway.com/pricing) · [CLI 저장소](https://github.com/railwayapp/cli)
