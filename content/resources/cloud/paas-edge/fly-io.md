---
name: Fly.io
url: https://fly.io/
docs: https://docs.fly.io/
repo: https://github.com/superfly/flyctl
stars: 1726
domain: cloud
category: paas-edge
description: Docker 이미지를 빠르게 켜고 끄는 VM(Fly Machines)으로 여러 리전에 배포하는 앱 호스팅 플랫폼. 장시간 실행 서버·WebSocket·사용자 가까운 리전 배치가 필요한 앱에 쓴다.
pricing: paid
tags: [fly, flyctl, machines, docker, multi-region, paas]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Fly.io 는 컨테이너 이미지를 **Fly Machines** 라는 경량 VM 으로 실행하는 플랫폼이다. Machine 은 REST API 로 생성·시작·정지할 수 있고 시작이 보통 1초 미만이라, 트래픽이 없으면 멈췄다가 요청이 오면 다시 켜는 구성이 쉽다. 함수가 아니라 일반 서버 프로세스를 그대로 돌리므로 WebSocket·장시간 연결·백그라운드 작업에 제약이 적고, 여러 리전에 Machine 을 두어 사용자 가까이 배치할 수 있다. CLI `flyctl` 은 Apache-2.0 오픈소스다.

## 설치
```bash
brew install flyctl                       # macOS
curl -L https://fly.io/install.sh | sh    # Linux
fly auth login
```
Windows 는 PowerShell 설치 스크립트(`install.ps1`)를 쓴다. `fly` 와 `flyctl` 은 같은 명령이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| App | 배포 단위. 이름이 기본 호스트명(`<app>.fly.dev`)이 된다 |
| Machine | 앱을 구성하는 VM. 생성 → 시작 → 정지 → 삭제 상태를 가진다 |
| `fly.toml` | 앱 설정: 빌드 방식, 서비스 포트, 자동 정지/시작, VM 크기 |
| primary_region | `fly deploy` 가 새 Machine 을 만드는 기본 리전 |
| auto stop/start | 유휴 Machine 을 `stop`/`suspend` 하고 요청 시 다시 시작 |
| Volume | Machine 에 붙는 영속 디스크. 붙이지 않으면 루트 파일시스템은 재시작 때 초기화 |
| Secrets | 런타임 환경 변수로 주입되는 비밀값 |

## 기본 사용법
```bash
cd my-app
fly launch          # 언어·프레임워크 감지 → Dockerfile·fly.toml 생성 → (선택) 배포
fly deploy          # 변경 후 재배포
fly status          # 앱과 Machine 상태
fly logs
fly secrets set DATABASE_URL="$DATABASE_URL"   # 설정 시 Machine 재시작
fly scale count 2   # Machine 수 조정
fly ssh console     # 실행 중인 Machine 에 접속
```
```toml
# fly.toml
app = "my-api"
primary_region = "nrt"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"
```

## 자주 쓰는 패턴
- **Scale to zero**: `auto_stop_machines`·`auto_start_machines` 를 함께 켜고 `min_machines_running` 으로 대기 Machine 수를 정한다(공식 문서는 둘을 같이 켜거나 같이 끄기를 권장).
- **다중 리전**: 주 리전에 쓰기 DB 를 두고, 읽기 위주 앱 Machine 을 다른 리전에 추가 배치.
- **영속 데이터**: SQLite·업로드 파일은 Volume 에 저장하고 백업 전략을 따로 둔다.
- **CI 배포**: `fly deploy` 를 CI 에서 실행하고 토큰은 `FLY_API_TOKEN` 시크릿으로 주입.
- **Dockerfile 기반**: 기존 [Docker](/develop-wiki/backend/infra-devops/docker/) 이미지를 거의 그대로 옮길 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: WebSocket·실시간 서버, 장시간 실행 워커, 여러 리전에 가까이 배치해야 하는 API, VM 수준 제어가 필요한 컨테이너 앱.
- 피할 때(대안): 정적·프론트엔드 중심이면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/)·[Netlify](/develop-wiki/cloud/paas-edge/netlify/), 관리형 DB·워커·크론을 한 대시보드에서 단순하게 쓰려면 [Render](/develop-wiki/cloud/paas-edge/render/), 대기업 규정·IAM 통합이 필요하면 [Cloud Run](/develop-wiki/cloud/serverless/google-cloud-run/)·[AWS](/develop-wiki/cloud/hyperscaler/aws/).
- 요금: 사용량 기반 과금이며 신규 조직용 무료 체험이 있다. 조건과 단가는 [가격 문서](https://fly.io/docs/about/pricing/)에서 확인한다.

## 공식 문서
- [문서 홈](https://docs.fly.io/) · [flyctl 설치](https://docs.fly.io/flyctl/install/) · [앱 배포 시작하기](https://docs.fly.io/getting-started/launch) · [fly.toml 레퍼런스](https://docs.fly.io/reference/configuration/) · [Machines 개요](https://docs.fly.io/machines/overview/)
