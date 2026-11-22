---
name: Awesome Sysadmin
url: https://github.com/awesome-foss/awesome-sysadmin
repo: https://github.com/awesome-foss/awesome-sysadmin
stars: 35793
domain: oss
category: awesome-lists
description: 시스템 관리·운영에 쓰는 자유·오픈소스 소프트웨어를 분야별로 정리한 목록. 모니터링, 백업, 설정 관리, 로그, VPN 같은 운영 도구 후보를 찾을 때 쓴다.
pricing: oss
tags: [awesome, sysadmin, devops, operations, foss]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
awesome-foss 조직이 관리하는 운영 도구 목록으로, [Awesome-Selfhosted](/develop-wiki/oss/awesome-lists/awesome-selfhosted/) 와 같은 형식(라이선스·언어 꼬리표, 독점 서비스 의존 시 `⚠`)을 쓴다. 최종 사용자용 서비스는 awesome-selfhosted 에, **인프라를 운영하는 도구**는 이 목록에 두는 식으로 나뉜다. 2026-11 기준 별 약 3.6만, 라이선스 CC-BY-SA-4.0. 최근 6개월 커밋 27건, 마지막 2026-10-22.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| 자동화·배포 | Automation, Configuration Management, Deployment Automation, Continuous Integration & Continuous Deployment, PaaS, Packaging |
| 관측 | Monitoring & Status Pages, Metrics & Metric Collection, Log Management, Troubleshooting |
| 저장·백업 | Backups, Databases, Distributed Filesystems |
| 네트워크 | DNS(서버·관리), VPN, Router, Network Configuration Management, Service Discovery, Web(서버·프록시) |
| 계정 | Identity Management(LDAP, Single Sign-On, 관리 도구) |
| 컨테이너·가상화 | Software Containers, Virtualization |
| 기타 | ChatOps, Code Review, IT Asset Management, Queuing, Remote Desktop Clients, Version control |
| List of Licenses · Anti-features · External links | 라이선스 설명, `⚠` 의미, 커뮤니티·참고 사이트 |

## 이렇게 활용하라
1. **운영 영역을 먼저 정한다.** 예: 상태 페이지가 필요하면 Monitoring & Status Pages 를 연다.
2. **이 사이트의 운영 도구 항목과 함께 본다.** [Uptime Kuma](/develop-wiki/oss/self-hosted/uptime-kuma/), [Terraform](/develop-wiki/backend/infra-devops/terraform/), [Caddy](/develop-wiki/backend/infra-devops/caddy/) 처럼 이미 정리된 도구가 있다.
3. **언어·배포 꼬리표로 운영 난이도를 본다.** 단일 바이너리(Go, Rust)는 설치가 단순하고, 여러 구성 요소가 필요한 도구는 Docker 배포를 우선 검토한다.
4. **`⚠` 항목은 외부 의존을 확인한다.** 사내망·폐쇄망이면 피한다.

## 주의
- 일부 항목은 활동이 멈췄다. 각 저장소의 최근 릴리스를 확인한다.
- 한국어 번역은 없다.

## 링크
- [저장소 README](https://github.com/awesome-foss/awesome-sysadmin) · [기여 가이드](https://github.com/awesome-foss/awesome-sysadmin/blob/master/.github/CONTRIBUTING.md)
- 이 사이트: [Awesome Docker](/develop-wiki/oss/awesome-lists/awesome-docker/) · [백엔드 인프라·DevOps](/develop-wiki/backend/infra-devops/)
