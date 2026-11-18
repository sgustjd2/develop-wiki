---
name: Render
url: https://render.com/
docs: https://render.com/docs
repo: https://github.com/render-oss/cli
stars: 141
domain: cloud
category: paas-edge
description: 웹 서비스·백그라운드 워커·크론·정적 사이트와 관리형 Postgres·Key Value 를 한 대시보드에서 운영하는 PaaS. Heroku 같은 git push 배포로 풀스택 앱 전체를 올릴 때 쓴다.
pricing: freemium
tags: [render, paas, deploy, postgres, blueprint, heroku-alternative]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Render 는 Git 저장소나 Docker 이미지를 연결하면 빌드·배포·TLS·스케일링을 맡아 주는 PaaS 다. 상시 실행되는 웹 서비스, 내부 전용 Private Service, 큐를 처리하는 Background Worker, Cron Job, 정적 사이트를 같은 방식으로 만들고, 관리형 **Render Postgres** 와 Redis 호환 **Render Key Value** 를 함께 붙인다. 여러 서비스를 `render.yaml`(**Blueprint**)로 코드화할 수 있어 Heroku 대안으로 많이 거론된다. 별도 Railway 도 비슷한 위치의 플랫폼이다.

## 설치 (Render CLI, 선택)
```bash
brew update && brew install render
render login                 # 브라우저 인증
render workspace set         # 작업 공간 선택
render services              # 서비스 목록 (대화형)
```
대시보드에서 저장소를 연결하는 것만으로도 배포할 수 있으며, CLI 는 배포 트리거·로그·`psql` 접속 등에 쓴다(Apache-2.0).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Web Service | 공개 HTTP 트래픽을 받는 상시 실행 서비스 |
| Private Service | 같은 네트워크의 다른 서비스만 접근 가능한 내부 서비스 |
| Background Worker / Cron Job | 요청 밖에서 도는 작업 / 스케줄 실행 작업 |
| Static Site | 빌드 결과물을 CDN 에서 서빙 |
| Render Postgres / Key Value | 관리형 PostgreSQL / Redis 호환 저장소 |
| Blueprint (`render.yaml`) | 서비스·DB·환경 변수를 선언하는 IaC 파일 |
| Environment Group | 여러 서비스가 공유하는 환경 변수 묶음 |
| Preview Environments | PR 마다 Blueprint 전체를 복제한 미리보기 환경 |

## 기본 사용법
```yaml
# render.yaml — 웹 서비스 + Postgres
services:
  - type: web
    name: todo-api
    runtime: node              # 예전 필드 env 는 deprecated → runtime 사용
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: todo-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true

databases:
  - name: todo-db
```
```bash
render blueprints validate             # render.yaml 검증
render deploys create "$RENDER_SERVICE_ID" --output json --confirm   # CI 에서 배포 트리거
render psql todo-db                    # DB 접속
```
`plan` 을 생략하면 유료 기본 인스턴스가 선택되므로, 원하는 플랜은 명시하거나 대시보드에서 확인한다.

## 자주 쓰는 패턴
- **Blueprint 로 전체 스택 관리**: 웹·워커·크론·DB 를 한 파일에 선언하고 저장소와 동기화.
- **Private Service 로 내부 API 분리**: 공개 웹 서비스만 인터넷에 노출하고 나머지는 내부 네트워크로 통신.
- **Deploy Hook / CLI 배포**: 테스트 통과 후에만 배포하도록 자동 배포를 끄고 CI 에서 트리거.
- **무료 인스턴스 주의**: 무료 웹 서비스는 유휴 시 정지(spin down)됐다가 요청 시 다시 켜지므로 첫 응답이 느리다. 운영 서비스는 유료 인스턴스 사용.
- **DB 연결**: `fromDatabase` 로 연결 문자열을 주입해 비밀값을 파일에 쓰지 않는다. [PostgreSQL](/develop-wiki/backend/database/postgresql/) 참고.

## 언제 쓰나 / 피할 때
- 쓸 때: 웹·워커·크론·DB 로 이뤄진 일반적인 풀스택 앱을 운영 인력 없이 올릴 때, Heroku 에서 옮길 때.
- 피할 때(대안): 프론트엔드·엣지 중심이면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/)·[Cloudflare](/develop-wiki/cloud/paas-edge/cloudflare/), 다중 리전 VM 제어가 필요하면 [Fly.io](/develop-wiki/cloud/paas-edge/fly-io/), 세밀한 네트워크·IAM 이 필요하면 [AWS](/develop-wiki/cloud/hyperscaler/aws/) 등 하이퍼스케일러.
- 요금: 무료 인스턴스와 인스턴스 크기별 과금. 단가·한도는 [가격 페이지](https://render.com/pricing)에서 확인한다.

## 공식 문서
- [문서 홈](https://render.com/docs) · [Blueprint 스펙](https://render.com/docs/blueprint-spec) · [CLI](https://render.com/docs/cli) · [무료 인스턴스](https://render.com/docs/free) · [Preview Environments](https://render.com/docs/preview-environments)
