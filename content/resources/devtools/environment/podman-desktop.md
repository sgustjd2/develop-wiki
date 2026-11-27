---
name: Podman Desktop
url: https://podman-desktop.io
docs: https://podman-desktop.io/docs
repo: https://github.com/podman-desktop/podman-desktop
stars: 8216
domain: devtools
category: environment
description: Podman 설치·업데이트와 컨테이너·이미지·Pod·Kubernetes 를 GUI 로 관리하는 오픈소스 데스크톱 앱. Docker Desktop 대안으로 로컬 컨테이너 환경을 꾸릴 때 쓴다.
pricing: oss
tags: [podman, container, kubernetes, gui, docker-alternative, cncf]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
Podman Desktop 은 [Podman](/develop-wiki/backend/infra-devops/podman/) 엔진을 설치·구성·업데이트하고, 컨테이너·이미지·Pod·볼륨을 대시보드로 관리하는 데스크톱 앱이다. 트레이 아이콘으로 엔진 상태와 Kubernetes 컨텍스트를 전환하고, OCI 레지스트리·프록시 설정을 한곳에서 다룬다. 로컬 Pod 를 Kubernetes YAML 로 변환해 클러스터에 배포하는 흐름과 확장(extension) 기능을 제공한다. Podman 외에 Lima, crc, Docker 엔진도 지원 대상으로 문서에 올라 있다.

라이선스는 Apache-2.0, 최신 릴리스는 **v1.30.7**(2026-11-13)이며 CNCF 샌드박스 프로젝트다(CNCF Landscape 기준). 윈도우·macOS·Linux 용 설치 파일은 공식 다운로드 페이지에서 받는다.

## 설치
공식 다운로드 페이지(https://podman-desktop.io/downloads)에서 OS 별 설치 파일을 받는다. macOS 는 `.dmg` 설치를 권장하며, Homebrew 는 설치 안정성을 보장하지 않는 대체 수단으로 문서가 안내한다. 이미 Homebrew 로 Podman 을 설치했다면 문서의 안내에 따라 충돌을 정리한 뒤 쓴다. 처음 실행하면 Podman 설치와 Podman machine(가상 머신) 생성을 안내한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Podman machine | macOS·Windows 에서 컨테이너를 돌리는 Linux VM. GUI 에서 생성·시작·중지 |
| Containers / Images / Pods / Volumes | 각 리소스의 목록·로그·터미널·삭제 화면 |
| Kubernetes 컨텍스트 | 트레이에서 kubeconfig 컨텍스트 전환, Pod 를 클러스터에 배포 |
| Extensions | kind, minikube, Compose, Lima 등 기능 확장 |
| 레지스트리 설정 | Docker Hub, Quay, GHCR 등 인증 관리 |
| Docker 호환 | Docker 소켓 호환과 Compose 지원 문서 제공 |

## 기본 사용법
GUI 가 주 사용법이지만 같은 엔진을 CLI 로도 쓴다. 앱에서 만든 Podman machine 은 터미널의 `podman` 명령이 그대로 사용한다.
```bash
podman run -d --name web -p 8080:80 docker.io/library/nginx:alpine
podman ps                      # 앱의 Containers 화면에도 같은 컨테이너가 보인다
podman pod create --name demo  # Pod 도 앱에서 관리
podman kube generate demo > demo.yaml   # Pod 를 Kubernetes YAML 로 내보내기
```
앱에서는 컨테이너를 선택해 로그 보기, 터미널 열기, Kubernetes 로 배포를 실행한다.

## 자주 쓰는 패턴
- **Docker Desktop 에서 이전**: 문서의 "Migrating from Docker" 가이드에 따라 Docker 호환 설정을 켜고 기존 이미지를 옮긴다.
- **로컬 Kubernetes**: kind 나 minikube 확장으로 로컬 클러스터를 만들고 앱에서 Pod 를 배포한다.
- **Podman 업데이트 자동화**: 앱이 Podman 엔진 최신 버전 설치를 안내한다.
- **프록시·사내 레지스트리**: 앱의 Proxy·Registries 설정으로 사내 네트워크 환경을 맞춘다.
- **Compose**: Compose 지원 문서를 따라 compose 파일로 다중 컨테이너를 실행한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Docker Desktop 의 라이선스·구독이 부담되는 팀이 데몬 없는 Podman 을 GUI 로 쓰고 싶을 때, 컨테이너와 Kubernetes 를 한 앱에서 보고 싶을 때.
- 피할 때(대안): macOS 에서 가볍게 Docker 호환 환경을 쓰려면 [OrbStack](/develop-wiki/devtools/environment/orbstack/), 표준 [Docker](/develop-wiki/backend/infra-devops/docker/) 흐름만 필요하면 Docker Desktop. CLI 만으로 충분하면 앱 없이 Podman 만 설치해도 된다.

## 공식 문서
- [문서](https://podman-desktop.io/docs) · [소개](https://podman-desktop.io/docs/intro) · [다운로드](https://podman-desktop.io/downloads) · [릴리스](https://github.com/podman-desktop/podman-desktop/releases)
