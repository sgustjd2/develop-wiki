---
name: Podman
url: https://podman.io
docs: https://docs.podman.io/en/latest/
repo: https://github.com/podman-container-tools/podman
stars: 33323
domain: backend
category: infra-devops
description: 데몬 없이 동작하고 rootless 실행을 기본으로 지원하는 OCI 컨테이너 엔진. Docker 호환 CLI 로 컨테이너·Pod 를 다루고 systemd(Quadlet)로 서비스화할 때 쓴다.
pricing: oss
tags: [container, oci, rootless, daemonless, quadlet, docker-alternative, cncf]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Podman 은 OCI 컨테이너와 이미지를 관리하는 엔진이다. [Docker](/develop-wiki/backend/infra-devops/docker/) 와 달리 상주 데몬이 없고 각 컨테이너가 `podman` 을 실행한 사용자의 자식 프로세스로 뜨며, 일반 사용자 권한(rootless)으로 실행하는 것을 기본 사용 방식으로 삼는다. CLI 는 Docker 와 거의 같아 `alias docker=podman` 으로 대부분 옮겨 갈 수 있다. 여러 컨테이너가 네트워크·IPC 를 공유하는 **Pod** 개념, Kubernetes YAML 로 실행·생성(`podman kube play/generate`), systemd 유닛으로 컨테이너를 관리하는 **Quadlet** 이 특징이다. 이미지 빌드는 Buildah, 레지스트리 복사는 Skopeo 가 같은 계열 도구다.

Apache-2.0. Podman·Buildah·Skopeo 는 CNCF 샌드박스 프로젝트(Podman Container Tools)이며, 6.0 과 함께 저장소가 `containers/` 에서 `podman-container-tools/` 조직으로 옮겨졌다(기존 주소는 리디렉션). 2026-11 기준 최신 릴리스는 v6.2.0(2026-11-10), 5.8 계열(v5.8.10)도 패치가 나온다.

**v6 주요 변경**: cgroups v1·iptables·CNI·slirp4netns·BoltDB 지원 제거(cgroups v2, nftables, Netavark, Pasta, SQLite 사용), Intel Mac·Windows 10 지원 종료, `podman volume prune` 이 Docker 처럼 익명 볼륨만 정리, Go 모듈 경로가 `go.podman.io/podman/v6` 로 변경.

## 설치
```bash
sudo dnf install podman          # Fedora/RHEL
sudo apt install podman          # Debian/Ubuntu (배포판 저장소 버전은 늦을 수 있음)
brew install podman              # macOS (Apple Silicon)

# macOS·Windows 는 Linux VM 이 필요
podman machine init
podman machine start
podman info
```
GUI 가 필요하면 별도 프로젝트인 Podman Desktop 을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Daemonless | 중앙 데몬 없이 fork/exec 로 컨테이너 실행. conmon 이 각 컨테이너를 감시 |
| Rootless | user namespace 로 일반 사용자가 컨테이너 실행. 저장소는 `~/.local/share/containers` |
| Pod | 인프라 컨테이너를 공유하는 컨테이너 묶음 (Kubernetes Pod 와 같은 개념) |
| Quadlet | `.container`·`.pod`·`.volume`·`.kube` 파일을 systemd 유닛으로 변환 |
| podman machine | macOS·Windows 에서 컨테이너를 돌릴 Linux VM 관리 |
| Docker 호환 API | `podman system service` / 소켓으로 Docker API 를 흉내 내 docker-compose 등이 접속 |

## 기본 사용법
```bash
podman run -d --name web -p 8080:80 docker.io/library/nginx:alpine
podman ps
podman logs -f web

podman pod create --name app -p 8080:80
podman run -d --pod app docker.io/library/nginx:alpine
podman run -d --pod app docker.io/library/redis:7

podman kube generate app > app.yaml     # Pod → Kubernetes YAML
podman kube play app.yaml               # YAML → 실행
```
Quadlet 예시 `~/.config/containers/systemd/web.container`:
```ini
[Container]
Image=docker.io/library/nginx:alpine
PublishPort=8080:80
AutoUpdate=registry

[Install]
WantedBy=default.target
```
```bash
systemctl --user daemon-reload && systemctl --user start web
```

## 자주 쓰는 패턴
- **Docker 대체**: `podman-docker` 패키지나 alias 로 기존 스크립트를 그대로 쓰고, Compose 파일은 `podman compose`(외부 compose provider 호출)로 실행한다.
- **서버 서비스화**: Compose 대신 Quadlet 으로 컨테이너를 systemd 서비스로 등록하고 `podman auto-update` 로 이미지 갱신을 자동화한다.
- **이미지 이름 전체 표기**: 짧은 이름은 레지스트리 검색 설정에 의존하므로 `docker.io/library/...` 처럼 전체 경로를 쓴다.
- **CI 빌드**: 데몬·root 없이 `podman build`(내부 Buildah)로 이미지를 만들어 보안 제약이 있는 러너에서 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: RHEL·Fedora 계열 서버, 루트 데몬을 두기 싫은 보안 요구, systemd 로 컨테이너를 운영하는 단일 서버, Kubernetes YAML 을 로컬에서 시험할 때.
- 피할 때(대안): Docker Desktop·Compose 생태계 기능(Compose Watch, Docker 확장)에 깊이 의존하면 [Docker](/develop-wiki/backend/infra-devops/docker/). 여러 노드 오케스트레이션은 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/).
- 주의: rootless 에서는 1024 미만 포트 바인딩, 볼륨 소유권(UID 매핑)에서 Docker 와 다르게 동작한다. v6 로 올릴 때 cgroups v2·nftables 환경인지 먼저 확인한다.

## 공식 문서
- [문서](https://docs.podman.io/en/latest/) · [설치](https://podman.io/docs/installation) · [GitHub 릴리스](https://github.com/podman-container-tools/podman/releases)
