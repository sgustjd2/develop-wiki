---
name: Forgejo
url: https://forgejo.org
docs: https://forgejo.org/docs/latest/
repo: https://codeberg.org/forgejo/forgejo
domain: oss
category: self-hosted
description: Gitea 에서 갈라져 나온 커뮤니티 주도 Git 호스팅 서비스. 저장소·이슈·PR·패키지·Forgejo Actions 를 제공하며 Codeberg 를 운영하는 비영리 단체가 관리한다. GPL-3.0 라이선스.
pricing: oss
tags: [git, code-hosting, ci, package-registry, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Forgejo 는 2022년 Gitea 운영 주체가 영리 회사로 넘어간 뒤 커뮤니티가 만든 포크로, 비영리 단체 Codeberg e.V. 산하에서 개발된다. 기능은 [Gitea](/develop-wiki/oss/self-hosted/gitea/) 와 비슷하지만(저장소, 이슈, PR, 패키지, Actions) 독자적으로 발전하고 있으며, 저장소는 GitHub 가 아니라 Codeberg 에 있다. 2026-11 기준 최신 릴리스는 `v17.0.1`, 저장소 LICENSE 는 GPL-3.0(Codeberg 기준 별 약 5.8천 개, GitHub 별 수 필드는 해당 없음).

## Docker Compose 빠른 시작
```yaml
# compose.yaml
services:
  forgejo:
    image: codeberg.org/forgejo/forgejo:17
    environment:
      USER_UID: 1000
      USER_GID: 1000
      FORGEJO__database__DB_TYPE: postgres
      FORGEJO__database__HOST: db:5432
      FORGEJO__database__NAME: forgejo
      FORGEJO__database__USER: forgejo
      FORGEJO__database__PASSWD: change-me
    volumes:
      - ./forgejo:/data
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "3000:3000"
      - "222:22"
    depends_on: [db]
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: forgejo
      POSTGRES_PASSWORD: change-me
      POSTGRES_DB: forgejo
    volumes:
      - ./postgres:/var/lib/postgresql/data
```
```bash
docker compose up -d     # http://localhost:3000 설치 화면
```
Codeberg 에 접속이 안 되면 이미지 호스트를 `data.forgejo.org` 로 바꿔도 된다. 루트 없이 도는 `17-rootless` 이미지는 볼륨 경로가 `/var/lib/gitea`, SSH 포트가 2222 로 다르다. 마운트한 디렉터리의 소유자는 `USER_UID/GID` 와 맞아야 컨테이너가 뜬다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Repository / Organization / Team | 저장소·조직·팀 권한 |
| Issue / Pull Request | 리뷰, 보호 브랜치, 라벨, 마일스톤 |
| Forgejo Actions | GitHub Actions 와 비슷한 문법의 워크플로(`.forgejo/workflows`), Forgejo Runner 가 실행 |
| Packages | 컨테이너, npm, Maven, PyPI 등 레지스트리 |
| Mirror | 외부 저장소 pull/push 미러 |
| `FORGEJO__섹션__키` | `app.ini` 설정을 환경 변수로 덮어쓰기 |

## 개발에서 쓰는 방법
- **셀프 호스팅 Git:** 개인·소규모 팀 코드 호스팅, GitHub 저장소 미러.
- **CI:** Forgejo Runner 를 등록하고 GitHub Actions 와 비슷한 YAML 로 빌드·테스트. 기존 GitHub Action 을 상당수 그대로 쓸 수 있지만 호환은 완전하지 않으니 확인이 필요하다.
- **Codeberg 사용:** 직접 운영하지 않고 Codeberg.org(Forgejo 기반 공개 호스팅)에 오픈소스 프로젝트를 올리는 선택지도 있다.

## 운영 주의: 백업·업데이트·보안
- **백업:** `/data` 볼륨과 DB 덤프를 함께 백업한다. `forgejo dump` 로 한 번에 묶을 수도 있다.
- **업데이트:** 메이저 버전을 건너뛰지 말고 릴리스 노트의 업그레이드 안내를 확인한다. Gitea 에서 옮겨 오는 경우 Gitea 버전에 따라 직접 전환이 안 될 수 있으니 공식 마이그레이션 문서를 따른다.
- **보안:** 가입 제한, HTTPS 리버스 프록시, 러너의 포크 PR 실행 제한은 Gitea 와 같다. 보안 릴리스가 자주 나오므로 알림을 구독한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Gitea 와 같은 경량 Git 서버를 원하면서 비영리 거버넌스·GPL 라이선스를 중시할 때.
- 피할 때(대안): GitHub 저장소 기반 생태계·별 수 지표가 중요하면 [Gitea](/develop-wiki/oss/self-hosted/gitea/), 대규모 통합 플랫폼은 [GitLab](/develop-wiki/devtools/version-control/gitlab/).

## 공식 문서
- [Docker 설치](https://forgejo.org/docs/latest/admin/installation/docker/) · [문서 홈](https://forgejo.org/docs/latest/) · [저장소(Codeberg)](https://codeberg.org/forgejo/forgejo)
