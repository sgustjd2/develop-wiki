---
name: Docker
url: https://www.docker.com
docs: https://docs.docker.com/
repo: https://github.com/moby/moby
stars: 72321
domain: backend
category: infra-devops
description: 애플리케이션과 실행 환경을 이미지로 묶어 컨테이너로 실행하는 도구. 로컬 개발 환경 통일, CI 빌드, 서버 배포의 기본 단위로 쓴다.
pricing: oss
tags: [container, dockerfile, compose, image, oci]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Docker 는 애플리케이션 코드와 런타임·라이브러리·설정을 **이미지**로 빌드하고, 그 이미지를 격리된 프로세스인 **컨테이너**로 실행하는 도구다. 이미지는 OCI 표준 형식이라 Docker 로 만든 이미지를 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/)·Podman 등 다른 런타임에서도 그대로 쓴다. 2026-11 기준 Docker Engine 최신 릴리스는 29.10.0.

라이선스 구분이 중요하다.
- **Docker Engine·CLI**(moby/moby, docker/cli): Apache-2.0 오픈소스.
- **Docker Desktop**(macOS·Windows GUI 앱): 직원 250명 미만이면서 연매출 1천만 달러 미만인 조직·개인·교육·비상업 오픈소스는 무료, 그 밖의 업무 사용은 유료 구독이 필요하다.

## 설치
```bash
# Linux: 공식 편의 스크립트 (운영 서버는 배포판별 apt/dnf 저장소 설치 권장)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # sudo 없이 docker 실행 (재로그인 필요)

docker version
docker run --rm hello-world
```
macOS·Windows 는 Docker Desktop 을 설치하거나, 라이선스가 문제되면 Colima·Podman Desktop·OrbStack(유료) 같은 대안을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Image | 읽기 전용 레이어를 쌓은 파일시스템 + 실행 메타데이터. 태그(`name:1.2`)나 digest 로 식별 |
| Container | 이미지로 띄운 격리 프로세스. 쓰기 레이어는 컨테이너가 지워지면 사라진다 |
| Dockerfile | 이미지 빌드 절차(`FROM`, `RUN`, `COPY`, `CMD` …)를 적은 파일 |
| BuildKit / buildx | 기본 빌드 엔진. 병렬 빌드, 캐시 마운트, 멀티 플랫폼(amd64·arm64) 빌드 |
| Registry | 이미지 저장소. Docker Hub, GHCR, ECR, Harbor 등 |
| Volume / bind mount | 컨테이너 밖에 데이터를 보존하는 방법 |
| Network | 컨테이너 간 통신. 같은 사용자 정의 네트워크에서는 서비스 이름으로 DNS 조회 |
| Compose | 여러 컨테이너를 `compose.yaml` 하나로 정의·실행 (`docker compose`) |

## 기본 사용법
Node.js API 를 멀티 스테이지로 빌드하는 Dockerfile.
```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```
```bash
docker build -t todo-api:0.1 .
docker run -d --name api -p 3000:3000 todo-api:0.1
docker logs -f api
docker exec -it api sh       # 실행 중인 컨테이너에 접속
docker rm -f api
```

로컬 개발용 API + PostgreSQL 을 Compose 로 묶는 예.
```yaml
# compose.yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:18
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: secret, POSTGRES_DB: app }
    volumes: [pgdata:/var/lib/postgresql]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app"]
      interval: 5s
volumes:
  pgdata:
```
```bash
docker compose up -d --build
docker compose logs -f api
docker compose down          # -v 를 붙이면 볼륨까지 삭제
```

## 자주 쓰는 패턴
- **멀티 스테이지 빌드**: 빌드 도구는 앞 단계에만 두고 최종 이미지는 런타임만 남겨 크기와 공격 면을 줄인다.
- **레이어 캐시 순서**: 의존성 매니페스트(`package.json`, `requirements.txt`, `go.mod`)를 먼저 `COPY` 하고 설치한 뒤 소스를 복사한다. `.dockerignore` 로 `node_modules`, `.git` 을 뺀다.
- **멀티 플랫폼 이미지**: `docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/me/api:1.0 --push .`
- **비루트 실행·헬스체크**: `USER` 로 일반 사용자 지정, `HEALTHCHECK` 나 Compose `healthcheck` 로 준비 상태 확인.
- **비밀값 분리**: 이미지에 비밀값을 굽지 않고 실행 시 환경 변수·시크릿 파일로 주입한다. 빌드 중 필요하면 `RUN --mount=type=secret` 을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 개발·CI·운영 환경을 같은 이미지로 맞출 때, 로컬에 DB·브로커를 빠르게 띄울 때, Kubernetes·서버리스 컨테이너(Cloud Run, ECS 등) 배포 단위가 필요할 때.
- 피할 때(대안): 여러 노드에 걸친 스케줄링·자가 복구가 필요하면 Docker 만으로는 부족하다 → [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/). 데몬 없이 rootless 로 돌리고 싶으면 Podman. 단일 정적 바이너리 배포(Go 등)만이라면 컨테이너 없이 systemd 로도 충분하다.

## 공식 문서
- [시작하기](https://docs.docker.com/get-started/) · [Engine 설치](https://docs.docker.com/engine/install/) · [Dockerfile 레퍼런스](https://docs.docker.com/reference/dockerfile/) · [Compose 파일 레퍼런스](https://docs.docker.com/reference/compose-file/) · [빌드 모범 사례](https://docs.docker.com/build/building/best-practices/) · [Docker Desktop 라이선스](https://docs.docker.com/subscription/desktop-license/)
