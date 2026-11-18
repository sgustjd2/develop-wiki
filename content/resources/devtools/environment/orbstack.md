---
name: OrbStack
url: https://orbstack.dev
docs: https://docs.orbstack.dev/
repo: https://github.com/orbstack/orbstack
stars: 9576
domain: devtools
category: environment
description: macOS에서 Docker 컨테이너와 경량 Linux 머신을 실행하는 가벼운 런타임. Docker Desktop 대신 빠르고 자원을 적게 쓰는 로컬 컨테이너 환경이 필요할 때 쓴다.
pricing: freemium
tags: [docker, container, macos, linux-vm, colima]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
macOS는 Linux 커널이 없으므로 컨테이너를 돌리려면 가상 머신이 필요하다. OrbStack은 그 VM을 가볍게 관리하면서 Docker 엔진·Docker Compose·Kubernetes와 Ubuntu 같은 Linux 머신을 함께 제공한다. 표준 `docker` CLI가 그대로 동작한다. 개인 비상업 용도는 무료, 업무용은 Pro(사용자당 월 $8)다. 2026-11 기준 최신 **v2.2.5**(2026-10-23). 앱 자체는 비공개 소스이고 GitHub 저장소는 이슈 트래커 용도다.

- 같은 역할의 도구:
  - **Docker Desktop**: Docker 공식 제품. Windows·macOS·Linux 지원. 일정 규모 이상 기업은 유료 구독 필요.
  - **Colima**: macOS·Linux용 오픈소스(MIT) 컨테이너 런타임 CLI, Lima VM 기반(2026-11 기준 v0.10.3).

## 설치
```bash
brew install orbstack        # 설치 후 앱을 한 번 실행해 초기 설정
docker run --rm hello-world  # docker CLI 가 OrbStack 엔진을 사용

# 오픈소스 대안 Colima
brew install colima docker
colima start --cpu 4 --memory 8
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Docker 엔진 | `docker` / `docker compose`가 그대로 동작 |
| docker context | OrbStack 설치 시 `orbstack` 컨텍스트 사용. `docker context ls`로 확인 |
| Linux machines | Ubuntu·Debian·Fedora 등 전체 Linux 환경을 VM처럼 생성 |
| `orb` / `orbctl` | Linux 머신·설정 관리 CLI |
| 도메인 | 컨테이너에 `*.orb.local` 형식 로컬 도메인 제공 |
| Kubernetes | 설정에서 켜는 단일 노드 클러스터 |

## 기본 사용법
```bash
orb create ubuntu dev       # Ubuntu 머신 생성
orb -m dev                  # 해당 머신 셸로 접속 (또는 ssh dev@orb)
orb list                    # 머신 목록
docker compose up -d        # 평소처럼 Compose 사용
docker context use orbstack # 다른 런타임과 오갈 때 명시 전환
```

## 자주 쓰는 패턴
- **런타임 전환.** Docker Desktop·Colima·OrbStack을 함께 설치했다면 `docker context use <이름>`으로 어느 엔진을 쓸지 정한다.
- **x86 이미지.** Apple Silicon에서 `--platform linux/amd64` 이미지는 Rosetta 에뮬레이션으로 실행된다(네이티브보다 느림).
- **Linux 전용 도구 테스트.** 컨테이너가 아닌 systemd까지 있는 환경이 필요하면 Linux 머신을 쓴다.
- **팀 표준.** [Dev Containers](/develop-wiki/devtools/environment/dev-containers/)는 Docker 호환 런타임이면 어느 것이든 동작한다.

## 언제 쓰나 / 피할 때
- 쓸 때: macOS에서 컨테이너를 매일 쓰며 배터리·메모리 사용을 줄이고 싶을 때.
- 피할 때(대안): 회사 라이선스 정책상 유료 도구가 어렵거나 오픈소스가 필요하면 Colima, Windows·Linux를 함께 지원하는 공식 도구가 필요하면 Docker Desktop. 컨테이너 개념은 [Docker](/develop-wiki/backend/infra-devops/docker/) 항목 참고.

## 공식 문서
- [OrbStack 문서](https://docs.orbstack.dev/) · [릴리스 노트](https://docs.orbstack.dev/release-notes) · [요금](https://orbstack.dev/pricing)
- [Docker Desktop](https://docs.docker.com/desktop/) · [Colima](https://github.com/abiosoft/colima)
