---
name: Awesome Docker
url: https://github.com/veggiemonk/awesome-docker
repo: https://github.com/veggiemonk/awesome-docker
stars: 37273
domain: oss
category: awesome-lists
description: Docker 를 위한 프로젝트(빌더, 린터, 이미지 스캐너, 레지스트리, 모니터링)와 학습 자료를 정리한 목록. 컨테이너 빌드·보안·운영 도구를 찾을 때 쓴다.
pricing: oss
tags: [awesome, docker, containers, devops]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
veggiemonk 가 관리하는 목록으로, "Docker 를 쓰는" 프로젝트가 아니라 **Docker 를 위한** 프로젝트만 싣는다는 기준을 README 에 명시한다(Docker 통합을 빼면 가치가 없어지는 프로젝트만). 프로젝트 목록과 학습 자료 두 부분으로 나뉜다. 2026-11 기준 별 약 3.7만, 라이선스 Apache-2.0. 최근 6개월 커밋 51건, 마지막 2026-11-12.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Official Projects · Engine & Runtime | Docker 공식 프로젝트, 엔진·런타임 |
| Building Images | Builder, Base Images, Dockerfile, Linter |
| Image Lifecycle | Registry, Registry CLI, Image Scanning & SBOM, Supply Chain |
| Running Containers | Composition, Orchestration, Deployment & Platforms, Garbage Collection |
| Networking & Proxies · Storage & Data | 네트워킹, 리버스 프록시, 볼륨·데이터 |
| Observability · Security | 모니터링·로그, 런타임 보안 |
| User Interfaces | Desktop, Terminal, Web UI, 에디터 통합 |
| Developer Workflow | API Client, CI/CD, Development Environment, Serverless, Testing, Wrappers |
| Learning Resources | Where to Start, Books & Tutorials, Good Tips, Security Articles, Videos, Communities |

## 이렇게 활용하라
1. **입문이면 Learning Resources → Where to Start 부터.** 공식 튜토리얼과 기본 개념 자료가 모여 있다.
2. **Dockerfile 품질은 Linter 섹션으로 잡는다.** 린터를 CI 에 넣어 흔한 실수를 막는다.
   ```bash
   docker run --rm -i hadolint/hadolint < Dockerfile
   ```
3. **이미지 보안은 Image Scanning & SBOM, Supply Chain 을 본다.** 취약점 스캔과 SBOM 생성 도구를 빌드 파이프라인에 붙인다.
4. **로컬 운영 편의는 User Interfaces → Terminal 을 본다.** 컨테이너·로그를 터미널 UI 로 보는 도구가 있다.
5. **운영 단계는 이 사이트 항목으로 이어 간다.** [Docker](/develop-wiki/backend/infra-devops/docker/) · [Podman](/develop-wiki/backend/infra-devops/podman/) · [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/)

## 주의
- 학습 자료 중 일부 글·영상은 오래돼 현재 Docker 명령·Compose 문법(`docker compose` v2)과 다를 수 있다.
- 한국어 번역은 없다.

## 링크
- [저장소 README](https://github.com/veggiemonk/awesome-docker) · [기여 가이드](https://github.com/veggiemonk/awesome-docker/blob/master/.github/CONTRIBUTING.md)
- 이 사이트: [Awesome Sysadmin](/develop-wiki/oss/awesome-lists/awesome-sysadmin/) · [컨테이너 내부 구조](/develop-wiki/knowledge/cs-fundamentals/container-internals/)
