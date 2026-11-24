---
name: Traefik Proxy
url: https://traefik.io/traefik/
docs: https://doc.traefik.io/traefik/
repo: https://github.com/traefik/traefik
stars: 65680
domain: backend
category: infra-devops
description: Docker·Kubernetes 같은 오케스트레이터를 감시해 라우팅 규칙을 자동으로 구성하는 클라우드 네이티브 리버스 프록시·인그레스 컨트롤러. 컨테이너 라벨로 라우팅과 TLS 를 관리할 때 쓴다.
pricing: oss
tags: [reverse-proxy, ingress, load-balancer, kubernetes, docker, acme]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Traefik Proxy 는 Go 로 작성된 HTTP·TCP·UDP 리버스 프록시다. 설정 파일에 백엔드 목록을 직접 적는 대신 **프로바이더**(Docker, Kubernetes Ingress·Gateway API·CRD, Consul, 파일 등)를 감시해 서비스가 생기고 사라질 때마다 라우팅을 다시 구성한다. Let's Encrypt 자동 인증서, 미들웨어 체인(인증·레이트 리밋·리트라이), 대시보드, Prometheus·OpenTelemetry 연동을 내장한다.

라이선스 MIT. 2026-11 기준 안정 릴리스는 v3.7.19(2026-11-13), v3.8 은 RC 단계이며 v2.11 계열도 보안 패치가 계속 나온다. 상용 제품인 Traefik Hub(API 게이트웨이·API 관리)는 별도다. 정적 설정 중심의 프록시는 [NGINX](/develop-wiki/backend/infra-devops/nginx/), 자동 HTTPS 에 집중한 단순 서버는 [Caddy](/develop-wiki/backend/infra-devops/caddy/) 가 비교 대상이다.

## 설치
```bash
docker run -d -p 80:80 -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock traefik:v3.7 \
  --api.insecure=true --providers.docker=true

# Kubernetes (공식 Helm 차트)
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik -n traefik --create-namespace
```
바이너리는 GitHub 릴리스에서, macOS 는 `brew install traefik` 으로도 받는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 정적 설정(install) | 시작 시 한 번 읽는 설정: EntryPoint, 프로바이더, 인증서 리졸버, 로그. CLI 인자·파일·환경 변수 |
| 동적 설정(routing) | 프로바이더가 실시간으로 공급하는 라우터·서비스·미들웨어 |
| EntryPoint | 수신 포트 (`web: :80`, `websecure: :443`) |
| Router | 규칙(`Host()`, `PathPrefix()`, `Header()`)으로 요청을 서비스에 연결 |
| Service | 실제 백엔드 집합, 로드 밸런싱·헬스 체크·가중치 |
| Middleware | 라우터와 서비스 사이 처리: BasicAuth, ForwardAuth, RateLimit, Headers, StripPrefix 등 |
| certResolver | ACME(HTTP-01/TLS-ALPN-01/DNS-01)로 인증서를 받는 설정 |

## 기본 사용법
Docker Compose 에서 라벨로 라우팅을 선언한다.
```yaml
services:
  traefik:
    image: traefik:v3.7
    command:
      - --providers.docker.exposedbydefault=false
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.tlschallenge=true
      - --certificatesresolvers.le.acme.email=ops@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
    ports: ["443:443"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
  api:
    image: example/api:1.0
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(`api.example.com`)
      - traefik.http.routers.api.entrypoints=websecure
      - traefik.http.routers.api.tls.certresolver=le
```

## 자주 쓰는 패턴
- **Kubernetes 인그레스**: 표준 `Ingress`, Gateway API(`HTTPRoute`), 또는 Traefik CRD `IngressRoute` 중 하나로 라우팅을 정의한다. 새 구성은 Gateway API 를 우선 검토한다.
- **ForwardAuth**: 외부 인증 서비스(OAuth2 Proxy, Authelia 등)에 요청을 먼저 보내 통과한 경우만 백엔드로 넘긴다.
- **미들웨어 체인**: `redirectscheme` 로 HTTP→HTTPS, `stripprefix` 로 경로 접두어 제거, `ratelimit` 로 남용 방지.
- **카나리**: 가중치 서비스(Weighted Round Robin)로 신규 버전에 트래픽 일부만 보낸다.
- **관측**: `--metrics.prometheus=true`, `--tracing.otlp=true` 로 [Prometheus](/develop-wiki/backend/observability/prometheus/)·[OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 로 내보낸다.

## 언제 쓰나 / 피할 때
- 쓸 때: 컨테이너가 자주 생기고 사라지는 Docker·Swarm·[Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/) 환경에서 라우팅을 자동화하고 싶을 때, 소규모 클러스터의 인그레스 컨트롤러.
- 피할 때(대안): 고정된 소수 백엔드에 정적 파일 서빙까지 하는 전통적 서버 구성은 [NGINX](/develop-wiki/backend/infra-devops/nginx/)·[Caddy](/develop-wiki/backend/infra-devops/caddy/) 가 단순하다. 정교한 L7 정책·서비스 메시가 필요하면 Envoy 기반 솔루션.
- 주의: Docker 소켓을 마운트하면 사실상 호스트 권한이 열리므로 읽기 전용 마운트나 소켓 프록시를 쓴다. v2→v3 업그레이드 때는 규칙 문법 변경을 마이그레이션 가이드로 확인한다.

## 공식 문서
- [문서 홈](https://doc.traefik.io/traefik/) · [퀵스타트](https://doc.traefik.io/traefik/getting-started/quick-start/) · [GitHub 릴리스](https://github.com/traefik/traefik/releases)
