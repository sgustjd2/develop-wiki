---
name: Outline
url: https://www.getoutline.com
docs: https://docs.getoutline.com
repo: https://github.com/outline/outline
stars: 41383
domain: oss
category: self-hosted
description: 실시간 공동 편집과 검색을 갖춘 팀 지식 베이스·위키. Notion·Confluence 대안으로 쓰며 BSL 1.1 이라 문서 서비스 상업 제공이 금지되고 4년 뒤 Apache 2.0 으로 전환된다.
pricing: source-available
tags: [wiki, knowledge-base, documentation, collaboration, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Outline 은 컬렉션 → 문서 트리 구조의 팀 위키로, 마크다운 단축키를 지원하는 에디터, 실시간 공동 편집, 전문 검색, 권한 관리, Slack 연동, API 를 제공한다. Node.js 앱이며 PostgreSQL 과 Redis 가 필요하다. 2026-11 기준 최신 릴리스는 `v1.13.0`.

**라이선스 주의:** **Business Source License 1.1**. 사내 사용은 자유지만 "Document Service"(제3자가 팀·문서를 만들어 쓰는 상업 서비스)로 제공할 수 없다. 각 버전은 Change Date(1.13.0 은 2030-11-15) 또는 공개 후 4년 중 먼저 오는 날에 Apache 2.0 으로 바뀐다. OSI 오픈소스가 아니므로 source-available 로 분류한다.

## Docker Compose 빠른 시작
Outline 은 **이메일+비밀번호 로그인을 기본 지원하지 않는다.** OIDC·Google·Slack 등 인증 공급자나 SMTP 기반 이메일 로그인 중 하나를 먼저 준비해야 한다. 아래는 [Keycloak](/develop-wiki/backend/auth/keycloak/) 같은 OIDC 공급자를 쓰는 예.
```yaml
# compose.yaml
services:
  outline:
    image: docker.getoutline.com/outlinewiki/outline:1.13.0
    env_file: ./docker.env
    ports:
      - "3000:3000"
    volumes:
      - storage-data:/var/lib/outline/data
    depends_on: [postgres, redis]
  redis:
    image: redis
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: outline
      POSTGRES_PASSWORD: change-me
      POSTGRES_DB: outline
    volumes:
      - database-data:/var/lib/postgresql
volumes:
  storage-data:
  database-data:
```
```bash
# docker.env (저장소의 .env.sample 참고)
URL=https://docs.example.com
SECRET_KEY=<openssl rand -hex 32>
UTILS_SECRET=<openssl rand -hex 32>
DATABASE_URL=postgres://outline:change-me@postgres:5432/outline
REDIS_URL=redis://redis:6379
FILE_STORAGE=local
OIDC_ISSUER_URL=https://sso.example.com/realms/dev
OIDC_CLIENT_ID=outline
OIDC_CLIENT_SECRET=...
```
```bash
docker compose up -d && docker compose logs -f outline
```
DB 마이그레이션은 컨테이너 시작 시 자동 실행된다. 공식 예시는 `https-portal` 컨테이너로 HTTPS 와 WebSocket 프록시를 붙인다(공동 편집에 WebSocket 필요).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Workspace | 팀 하나의 공간. 인증 공급자 도메인으로 가입 범위를 제한 |
| Collection | 문서를 묶는 최상위 폴더. 컬렉션별 권한 |
| Document | 중첩 가능한 문서. 리비전 히스토리, 템플릿, 공개 공유 링크 |
| Search | 전문 검색(PostgreSQL 기반) |
| Integrations | Slack 검색·알림, 임베드(Figma, Loom 등), 웹훅 |
| API | `POST /api/documents.create` 같은 RPC 스타일 API, API 키 인증 |

## 개발에서 쓰는 방법
- **엔지니어링 위키:** 설계 문서, 런북, 온보딩 문서, ADR 를 컬렉션별로 정리.
- **문서 자동 생성:** 배포 파이프라인에서 API 로 릴리스 노트 문서를 만들거나 갱신.
```bash
curl -X POST https://docs.example.com/api/documents.create \
  -H "Authorization: Bearer $OUTLINE_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Release 1.4.0","text":"## 변경 사항\n- ...","collectionId":"<id>","publish":true}'
```
- **마크다운 가져오기·내보내기:** 기존 마크다운·Notion 내보내기 파일을 가져오고, 컬렉션을 마크다운으로 내보내 백업.

## 운영 주의: 백업·업데이트·보안
- **백업:** PostgreSQL 덤프 + 첨부 파일 저장소(`FILE_STORAGE=local` 이면 `/var/lib/outline/data` 볼륨, S3 면 해당 버킷). `SECRET_KEY`·`UTILS_SECRET` 도 보관.
- **업데이트:** 이미지 태그를 올리면 시작 시 마이그레이션이 돈다. 백업 후 진행하고, 자동 마이그레이션을 막고 싶으면 `--no-migrate` 로 띄운 뒤 수동 실행.
- **보안:** HTTPS 필수(`URL` 과 실제 주소가 같아야 로그인 콜백이 동작). 인증 공급자에서 허용 도메인을 제한하고, 공개 공유 링크 사용 정책을 정한다. 일부 SSO(SAML 등)는 Business/Enterprise 판 기능일 수 있으니 문서의 라이선스 제한 항목을 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 사내에 직접 두는 깔끔한 팀 위키, 이미 OIDC/Google Workspace SSO 가 있는 조직.
- 피할 때(대안): 코드 저장소와 함께 버전 관리하는 개발자 문서는 [Docusaurus](/develop-wiki/devtools/docs/docusaurus/)·[MkDocs Material](/develop-wiki/devtools/docs/mkdocs-material/), 인증 공급자를 둘 수 없는 소규모 환경은 로컬 계정을 지원하는 위키.

## 공식 문서
- [Docker 호스팅](https://docs.getoutline.com/s/hosting/doc/docker-7pfeLP5a8t) · [인증](https://docs.getoutline.com/s/hosting/doc/authentication-7ViKRmRY5o) · [OIDC](https://docs.getoutline.com/s/hosting/doc/oidc-8CPBm6uC0I) · [LICENSE](https://github.com/outline/outline/blob/main/LICENSE)
