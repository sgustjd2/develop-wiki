---
name: Coolify
url: https://coolify.io
docs: https://coolify.io/docs
repo: https://github.com/coollabsio/coolify
stars: 66457
domain: oss
category: self-hosted
description: 내 서버에 설치해 Git 저장소·Docker Compose 앱·DB 를 배포하고 도메인·HTTPS·백업을 관리하는 셀프 호스팅 PaaS. Heroku·Vercel 대안으로 쓴다. Apache-2.0 라이선스.
pricing: oss
tags: [paas, deployment, docker, self-hosted, reverse-proxy]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Coolify 는 VPS·베어메탈 서버에 설치하면 웹 대시보드에서 애플리케이션 배포, 데이터베이스 생성, 도메인 연결과 Let's Encrypt 인증서, 예약 백업을 관리해 주는 셀프 호스팅 PaaS 다. 여러 서버를 SSH 로 연결해 한 대시보드에서 관리할 수 있다. 2026-11 기준 최신 릴리스는 `v4.7.5`. Apache-2.0 라이선스이며, 운영을 맡기는 유료 Coolify Cloud 도 있다.

## 설치 (공식 스크립트)
Coolify 자체는 compose 파일을 직접 쓰기보다 설치 스크립트로 띄운다. 스크립트가 Docker 설치와 Coolify 컨테이너 구성을 처리한다.
```bash
# Linux 서버(root 또는 sudo), 최소 2코어 / 2GB RAM / 디스크 10GB, amd64·arm64
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
설치가 끝나면 `http://<서버 IP>:8000` 에 **바로** 접속해 관리자 계정을 만든다. 등록 화면에 먼저 도달한 사람이 관리자가 되기 때문이다. 설정과 데이터는 `/data/coolify` 아래, 인스턴스 설정은 `/data/coolify/source/.env` 에 있다.

Coolify 로 배포하는 앱 쪽에서는 Docker Compose 를 그대로 쓸 수 있다.
```yaml
# 저장소의 docker-compose.yaml — Coolify 에서 "Docker Compose" 빌드팩으로 배포
services:
  api:
    build: .
    environment:
      DATABASE_URL: ${DATABASE_URL}   # Coolify UI 에서 값 입력
    expose:
      - "8080"                        # 도메인은 Coolify 가 프록시로 연결
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Server | 배포 대상 머신. Coolify 가 SSH 로 접속해 Docker 로 실행 |
| Project / Environment | 리소스를 묶는 단위와 production·staging 같은 환경 |
| Resource | Application(Git 저장소), Database, Service(원클릭 템플릿) |
| Build pack | Nixpacks, Dockerfile, Docker Compose, 정적 사이트 중 선택 |
| Proxy | 서버마다 리버스 프록시(Traefik 또는 Caddy)를 띄워 도메인·HTTPS 처리 |
| Preview deployment | PR 마다 임시 환경을 띄우는 미리보기 배포 |
| Scheduled backup | DB 를 주기적으로 덤프해 로컬·S3 호환 저장소에 저장 |

## 개발에서 쓰는 방법
- **사이드 프로젝트 호스팅:** 월 몇 달러 VPS 하나에 프런트엔드·API·PostgreSQL·[Redis](/develop-wiki/backend/database/redis/) 를 함께 운영.
- **Git 푸시 배포:** GitHub App 이나 웹훅을 연결해 main 브랜치 푸시 시 자동 빌드·배포, PR 미리보기.
- **원클릭 서비스:** Uptime Kuma, n8n, Plausible 같은 셀프 호스팅 도구를 템플릿으로 바로 설치.
- **스테이징 서버:** 클라우드 PaaS 비용 없이 팀 공용 스테이징 환경 구성.

## 운영 주의: 백업·업데이트·보안
- **백업:** `/data/coolify/source/.env` 를 반드시 따로 보관한다. 여기 있는 `APP_KEY` 가 Coolify DB 의 값을 암호화하므로 없으면 백업에서 복구할 수 없다. 첫 설치 후 이 값들을 다시 생성하면 설치가 깨질 수 있다. 앱 DB 는 Scheduled backup 을 S3 로 보내도록 설정.
- **업데이트:** 대시보드의 업데이트 기능이나 설치 스크립트 재실행으로 올린다. 자동 업데이트는 설정에서 끌 수 있으니 운영 서버라면 릴리스 노트를 보고 수동으로 올리는 편이 안전하다.
- **보안:** Coolify 는 관리 대상 서버에 root 수준 SSH 접근을 가지므로 대시보드를 2FA·강한 비밀번호로 보호하고, 8000 포트 대신 도메인 + HTTPS 로 접속하게 한 뒤 방화벽을 정리한다.
- 단일 서버 구성은 그 서버가 장애점이다. 중요한 서비스는 DB 백업을 다른 위치에 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: Heroku·[Vercel](/develop-wiki/cloud/paas-edge/vercel/) 같은 배포 경험을 내 서버에서 원할 때, 여러 개의 작은 서비스를 저비용으로 운영할 때.
- 피할 때(대안): 운영을 아예 맡기려면 [Railway](/develop-wiki/cloud/paas-edge/railway/)·[Render](/develop-wiki/cloud/paas-edge/render/)·[Fly.io](/develop-wiki/cloud/paas-edge/fly-io/), 대규모·멀티 노드 오케스트레이션은 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/).

## 공식 문서
- [설치](https://coolify.io/docs/get-started/installation) · [문서 홈](https://coolify.io/docs) · [릴리스](https://github.com/coollabsio/coolify/releases)
