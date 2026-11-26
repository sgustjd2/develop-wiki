---
name: Gitea
url: https://about.gitea.com
docs: https://docs.gitea.com
repo: https://github.com/go-gitea/gitea
stars: 59271
domain: oss
category: self-hosted
description: Go 단일 바이너리로 도는 가벼운 Git 호스팅 서비스. 저장소·이슈·PR·패키지 레지스트리·GitHub Actions 호환 CI 를 제공한다. MIT 라이선스.
pricing: oss
tags: [git, code-hosting, ci, package-registry, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Gitea 는 GitHub·[GitLab](/develop-wiki/devtools/version-control/gitlab/) 과 비슷한 코드 호스팅 기능(저장소, 이슈, Pull Request, 위키, 조직·팀 권한)을 적은 자원으로 제공하는 Go 애플리케이션이다. 라즈베리 파이부터 사내 서버까지 쉽게 띄울 수 있고, Gitea Actions 로 GitHub Actions 문법의 CI 를 돌린다. 2026-11 기준 최신 릴리스는 `v28.4.0`(공식 Docker 문서 예시 태그도 `28.4.0`). MIT 라이선스이며, 커뮤니티 포크로 [Forgejo](/develop-wiki/oss/self-hosted/forgejo/) 가 있다.

## Docker Compose 빠른 시작
```yaml
# compose.yaml
services:
  gitea:
    image: docker.gitea.com/gitea:28.4.0
    environment:
      USER_UID: 1000
      USER_GID: 1000
      GITEA__database__DB_TYPE: postgres
      GITEA__database__HOST: db:5432
      GITEA__database__NAME: gitea
      GITEA__database__USER: gitea
      GITEA__database__PASSWD: change-me
    volumes:
      - ./gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "3000:3000"   # 웹
      - "222:22"      # SSH (git clone ssh://git@host:222/...)
    depends_on: [db]
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: gitea
      POSTGRES_PASSWORD: change-me
      POSTGRES_DB: gitea
    volumes:
      - ./postgres:/var/lib/postgresql
```
```bash
docker compose up -d     # http://localhost:3000 첫 접속 시 설치 화면에서 관리자 생성
```
`app.ini` 의 모든 설정은 `GITEA__<섹션>__<키>` 환경 변수로 덮어쓸 수 있다. 호스트 디렉터리를 마운트하면 `USER_UID/GID` 를 그 디렉터리 소유자와 맞춘다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Repository / Organization / Team | 저장소, 조직, 팀 단위 권한 |
| Issue / Pull Request / Review | GitHub 와 비슷한 흐름. 보호 브랜치, 필수 리뷰, 머지 방식 설정 |
| Gitea Actions | `.gitea/workflows/*.yaml`(또는 `.github/workflows`)에 GitHub Actions 문법으로 작성, `act_runner` 가 실행 |
| Packages | npm, Maven, PyPI, Go, Container(OCI), Helm 등 패키지 레지스트리 |
| Mirror | 외부 저장소를 주기적으로 끌어오거나(pull mirror) 밀어내는(push mirror) 동기화 |
| Webhook | 푸시·PR 이벤트를 외부 CI·채팅으로 전달 |
| `app.ini` | 서버 설정 파일 (`/data/gitea/conf/app.ini`) |

## 개발에서 쓰는 방법
- **사내·개인 Git 서버:** 공개 클라우드에 코드를 올리기 어려운 프로젝트, 홈랩 저장소.
- **GitHub 미러·백업:** 중요한 GitHub 저장소를 pull mirror 로 복제해 두기.
- **경량 CI/CD:** 러너를 등록하고 GitHub Actions 와 같은 문법으로 빌드·테스트.
```yaml
# .gitea/workflows/test.yaml
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
```
- **사설 패키지·컨테이너 레지스트리:** `docker login gitea.example.com` 후 이미지 푸시.

## 운영 주의: 백업·업데이트·보안
- **백업:** `gitea dump` 명령이 저장소·DB·설정을 zip 으로 묶는다(컨테이너 안에서 `git` 사용자로 실행). DB 를 따로 쓰면 DB 덤프도 함께 남긴다.
- **업데이트:** 이미지 태그를 올리고 재시작하면 시작 시 DB 마이그레이션이 돈다. 먼저 백업하고, 메이저 버전은 릴리스 노트의 breaking change 를 확인한다. PostgreSQL 메이저 버전은 데이터 디렉터리를 자동 업그레이드하지 않으므로 `pg_upgrade` 나 덤프/복원이 필요하다.
- **보안:** 공개 인스턴스라면 회원가입(`DISABLE_REGISTRATION`)을 끄거나 승인제로 두고, HTTPS 리버스 프록시 뒤에 둔다. Actions 러너는 PR 코드를 실행하므로 신뢰할 수 없는 포크 PR 실행을 제한한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 자원이 적은 서버에서 GitHub 비슷한 경험이 필요할 때, 사내 코드 호스팅·미러.
- 피할 때(대안): 대규모 조직의 통합 DevSecOps 기능이 필요하면 [GitLab](/develop-wiki/devtools/version-control/gitlab/), 비영리 커뮤니티 거버넌스와 GPL 을 원하면 [Forgejo](/develop-wiki/oss/self-hosted/forgejo/), 운영 부담이 싫으면 [GitHub](/develop-wiki/devtools/version-control/github/).

## 공식 문서
- [Docker 설치](https://docs.gitea.com/installation/install-with-docker) · [Gitea Actions](https://docs.gitea.com/usage/actions/overview) · [백업과 복원](https://docs.gitea.com/administration/backup-and-restore)
