---
name: ToolJet
url: https://www.tooljet.com
docs: https://docs.tooljet.com
repo: https://github.com/ToolJet/ToolJet
stars: 41248
domain: oss
category: self-hosted
description: 위젯을 배치하고 90개 이상의 데이터 소스를 연결해 관리자 화면·대시보드를 만드는 로우코드 플랫폼. 커뮤니티 에디션은 AGPL-3.0 이고 AI 앱 생성 등은 엔터프라이즈 기능이다.
pricing: oss
tags: [internal-tools, low-code, admin-panel, dashboard, self-hosted, agpl]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
ToolJet 는 테이블·차트·폼 같은 80개 이상 컴포넌트를 끌어 놓고 DB·REST API·SaaS 쿼리를 연결해 사내 도구를 만드는 플랫폼이다. [Appsmith](/develop-wiki/oss/self-hosted/appsmith/)와 같은 계열이다. 앱 안에서 JavaScript 와 Python 을 실행할 수 있다.
**2026-11 기준**: 별 41,245, 마지막 푸시 2026-11-18, 최신 릴리스 `v3.20.257-lts`(2026-11-12). 저장소 라이선스는 **AGPL-3.0** 이다. 수정한 ToolJet 을 네트워크 서비스로 제공하면 그 소스를 공개해야 하는 조건이라 사내 사용과 외부 서비스 제공을 구분해 검토한다. AI 앱 생성·AI 쿼리 빌더·에이전트 빌더·워크플로·SCIM·GitSync·감사 로그 등은 README 에서 Enterprise 기능으로 구분된다.
README 는 ToolJet MCP 서버(**베타**)로 Claude Code·Codex·Cursor 같은 코딩 에이전트가 ToolJet 앱을 직접 만들고 고치게 한다고 소개한다.

## 무엇이 들어 있나 (Community Edition)
| 기능 | 내용 |
| --- | --- |
| 비주얼 빌더 | 반응형 컴포넌트 80+, 멀티 페이지, 실시간 공동 편집 |
| 데이터 소스 | 90+ (DB·API·클라우드 스토리지·SaaS) |
| ToolJet Database | 내장 노코드 DB |
| 보안 | 자격 증명 AES-256-GCM 암호화, 프록시 경유 데이터 흐름, SSO |
| 확장 | `@tooljet/cli` 로 플러그인·커넥터 개발 |

## 설치·사용법
빠른 체험은 한 줄 Docker 실행이다(README 의 `ee-lts-latest` 체험 이미지이므로 체험용으로만 쓴다).

```bash
docker run --name tooljet --restart unless-stopped -p 80:80 \
  --platform linux/amd64 -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:ee-lts-latest
```

운영 배포는 공식 가이드의 Docker Compose 를 따른다. 내장 PostgreSQL 이나 외부 PostgreSQL 중 고르고, 공식이 제공하는 `.env` 예시와 `internal.sh`(또는 `external.sh`)로 `LOCKBOX_MASTER_KEY`·`SECRET_KEY_BASE` 와 DB 비밀번호를 만든 뒤 `TOOLJET_HOST` 에 접속 주소를 적고 `docker-compose up -d` 로 올린다. 워커 컨테이너를 따로 두거나 여러 인스턴스를 띄우면 외부 Redis 가 필요하다. Kubernetes·Helm·AWS ECS·Cloud Run 등 가이드도 있다. 운영에서는 README 권고대로 최신보다 **LTS** 태그를 쓴다.

## 언제 쓰나 / 주의
- 쓸 때: 운영팀용 관리자 화면, 고객 조회·승인 도구, 지표 대시보드를 빠르게 만들 때.
- 주의: 이 도구에는 DB·API 자격 증명이 모인다. `LOCKBOX_MASTER_KEY`·`SECRET_KEY_BASE` 를 분실하지 않게 백업하고, 외부에 공개하지 말고 SSO 와 VPN 뒤에 둔다. 쿼리 권한은 읽기 전용 DB 계정부터 연결한다.
- 라이선스: AGPL-3.0 과 Enterprise 기능 경계를 도입 전에 확인한다.
- 대안: Apache-2.0 Community Edition 인 [Appsmith](/develop-wiki/oss/self-hosted/appsmith/).

## 링크
- [저장소](https://github.com/ToolJet/ToolJet) · [문서](https://docs.tooljet.com) · [Docker 배포](https://docs.tooljet.com/docs/setup/docker) · [ToolJet MCP 안내](https://docs.tooljet.com/docs/build-with-ai/mcp/overview)
