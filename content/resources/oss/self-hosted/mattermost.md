---
name: Mattermost
url: https://mattermost.com
docs: https://docs.mattermost.com
repo: https://github.com/mattermost/mattermost
stars: 39685
domain: oss
category: self-hosted
description: 채널·스레드·통화·웹훅·봇을 갖춘 셀프 호스팅 팀 메신저. Slack 대안으로 개발·운영 알림 채널에 많이 쓴다. 소스는 AGPL-3.0, 공식 빌드는 MIT 이며 Enterprise 기능은 유료다.
pricing: oss
tags: [chat, collaboration, chatops, webhook, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Mattermost 는 Slack 과 비슷한 채널 기반 메신저를 직접 운영할 수 있게 해 주는 Go + React 애플리케이션이다. 채팅 외에 Playbooks(장애 대응 체크리스트), Boards, 통화, 플러그인, 웹훅·슬래시 명령·봇 API 를 제공해 ChatOps 허브로 쓰인다. 2026-11 기준 최신 릴리스는 `v12.1.0`(공식 docker 저장소의 `env.example` 기본 태그는 ESR 인 `11.7.0`).

**라이선스:** 소스는 AGPL-3.0(일부 관리 도구·설정 파일·`webapp/` 은 Apache-2.0), Mattermost 가 배포하는 컴파일된 바이너리는 MIT 로 쓸 수 있다. SSO(SAML)·고가용성 클러스터 등은 Enterprise 라이선스가 필요하다.

## Docker Compose 빠른 시작
공식 `mattermost/docker` 저장소(PostgreSQL + Mattermost + 선택적 NGINX)를 쓴다.
```bash
git clone https://github.com/mattermost/docker mattermost-docker
cd mattermost-docker
cp env.example .env
# .env 에서 DOMAIN, POSTGRES_PASSWORD 수정.
# 무료 Team Edition 을 쓰려면 MATTERMOST_IMAGE=mattermost-team-edition
mkdir -p ./volumes/app/mattermost/{config,data,logs,plugins,client/plugins,bleve-indexes}
sudo chown -R 2000:2000 ./volumes/app/mattermost

# NGINX 없이 (http://<도메인>:8065)
docker compose -f docker-compose.yml -f docker-compose.without-nginx.yml up -d
# 내장 NGINX + TLS (.env 의 CERT_PATH/KEY_PATH 설정 후)
# docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
```
첫 접속에서 시스템 관리자 계정을 만든다. 공식 문서는 이 컨테이너 구성이 클러스터·고가용성을 내장하지 않으므로 대규모 운영 환경에는 적합하지 않다고 명시한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Team / Channel | 팀 안에 공개·비공개 채널, DM, 그룹 메시지 |
| Thread | 메시지별 스레드(Collapsed Reply Threads) |
| Incoming webhook | 외부에서 채널로 메시지를 POST 하는 URL |
| Outgoing webhook / Slash command | 채널 메시지·명령을 외부 서버로 전달 |
| Bot account / Personal access token | REST API v4 를 호출하는 자동화 계정 |
| Plugin | 서버(Go)·웹앱(React) 확장. GitHub, GitLab, Jira 등 공식 플러그인 |
| Playbooks | 장애 대응·릴리스 같은 반복 절차를 체크리스트와 채널로 운영 |
| `mmctl` | 서버 관리 CLI |

## 개발에서 쓰는 방법
- **배포·장애 알림 채널:** CI·모니터링에서 incoming webhook 으로 메시지 전송. Slack 형식 페이로드와 호환된다.
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text": "배포 완료: api v1.4.0 (#123)"}' \
  https://chat.example.com/hooks/<webhook-id>
```
- **ChatOps:** 슬래시 명령(`/deploy staging`)을 사내 API 로 연결.
- **GitHub·GitLab 연동:** 공식 플러그인으로 PR·이슈 알림 구독.
- **망분리·규제 환경:** 외부 SaaS 메신저를 쓸 수 없는 조직의 내부 협업 도구.

## 운영 주의: 백업·업데이트·보안
- **백업:** PostgreSQL 덤프 + `./volumes/app/mattermost` 의 `data`(첨부 파일)·`config`·`plugins` 디렉터리. 파일 저장소를 S3 로 두면 버킷도 포함.
- **업데이트:** `.env` 의 `MATTERMOST_IMAGE_TAG` 를 올리고 다시 `up -d`. 시작 시 DB 마이그레이션이 돈다. ESR(장기 지원) 버전을 따라가면 업그레이드 빈도를 줄일 수 있고, 메이저 버전 업그레이드 노트를 꼭 확인한다.
- **보안:** HTTPS 필수, 공개 가입·초대 링크 정책 설정, MFA 활성화 권장. 웹훅 URL 은 비밀 값처럼 다룬다.
- 무료판과 Enterprise 판의 기능·사용 조건은 버전마다 바뀌어 왔으므로 도입 전에 현재 에디션 비교 문서를 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 사내에 메시지 데이터를 두어야 하는 조직, 웹훅·봇 중심의 개발팀 알림 허브.
- 피할 때(대안): 운영 인력이 없으면 Slack 같은 SaaS, 분산 연합 프로토콜이 필요하면 Matrix 기반 서버.

## 공식 문서
- [Docker 배포](https://docs.mattermost.com/deployment-guide/server/deploy-containers.html) · [Incoming webhook](https://developers.mattermost.com/integrate/webhooks/incoming/) · [REST API](https://developers.mattermost.com/api-documentation/)
