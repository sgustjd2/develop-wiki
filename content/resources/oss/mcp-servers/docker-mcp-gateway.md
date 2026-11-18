---
name: Docker MCP Gateway
url: https://docs.docker.com/ai/mcp-catalog-and-toolkit/
docs: https://docs.docker.com/ai/mcp-catalog-and-toolkit/
repo: https://github.com/docker/mcp-gateway
stars: 1641
domain: oss
category: mcp-servers
description: Docker 의 MCP Gateway 와 `docker mcp` CLI 플러그인. MCP 서버를 컨테이너로 격리해 띄우고 여러 클라이언트가 하나의 게이트웨이로 쓰게 한다. 신뢰도가 낮은 MCP 서버를 격리 실행할 때 쓴다.
pricing: oss
tags: [mcp, docker, gateway, container, catalog, sandbox]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
개별 MCP 서버가 아니라 **MCP 서버를 실행·관리하는 게이트웨이**다. Docker Desktop 의 MCP Toolkit 이 이 저장소의 `docker-mcp` CLI 플러그인 위에서 동작한다. 카탈로그의 로컬 서버는 각각 격리된 Docker 컨테이너에서 돌고, `npx`·`uvx` 서버는 최소한의 호스트 권한만 받는다고 README 에 적혀 있다. Claude Code·Cursor 등 클라이언트는 같은 게이트웨이 설정을 공유한다.
**2026-11 기준**: 별 1,640, 최신 태그 v0.44.3, 마지막 푸시 2026-10-26. 라이선스 MIT. GitHub 릴리스 페이지는 없고 태그로만 배포된다. 사용하려면 Docker Desktop 4.59 이상(MCP Toolkit 기능)이 기준이다.

## 무엇이 들어 있나
| 기능 | 설명 |
| --- | --- |
| 프로필 | 서버를 묶어 클라이언트에 연결하고 OCI 레지스트리로 공유 |
| 카탈로그 | 기본은 `mcp/docker-mcp-catalog` 이미지. 직접 만든 카탈로그·MCP 커뮤니티 레지스트리 가져오기 지원 |
| 시크릿·OAuth | Docker Desktop 의 시크릿 저장소로 API 키 관리, 서비스 OAuth 흐름 |
| 도구 허용 목록 | 프로필 단위로 서버의 도구를 개별 활성·비활성 |
| 모니터링 | 호출 로그·트레이싱 |

## 설치·사용법
최신 Docker Desktop 에는 이미 포함돼 있다.

```bash
docker mcp catalog pull mcp/docker-mcp-catalog
docker mcp profile create --name dev-tools \
  --server catalog://mcp/docker-mcp-catalog/github \
  --connect cursor
docker mcp profile tools dev-tools --disable github.search_code
docker mcp gateway run --profile dev-tools
```

Docker Desktop 이 없는 환경(Docker CE, WSL2)에서는 `docker mcp feature enable profiles` 로 프로필 기능을 켜야 한다. Claude Code 연결은 `docker mcp client connect claude-code --profile dev-tools --global` 이다.

## 언제 쓰나 / 주의
- 쓸 때: 출처가 다양한 MCP 서버를 호스트에 직접 설치하지 않고 컨테이너로 격리하고 싶을 때, 팀이 같은 서버 구성을 프로필로 공유할 때.
- 주의: 컨테이너 격리가 곧 안전은 아니다. 서버에 주는 시크릿·네트워크·마운트 범위가 위험을 결정한다. 프로필의 도구 허용 목록으로 쓰기 도구를 끄고, 카탈로그 서버도 출처를 확인한다.
- 이 사이트의 [Docker](/develop-wiki/backend/infra-devops/docker/) 지식이 있으면 이해가 빠르다.

## 링크
- [저장소](https://github.com/docker/mcp-gateway) · [MCP Catalog and Toolkit 문서](https://docs.docker.com/ai/mcp-catalog-and-toolkit/) · [Docker MCP 카탈로그](https://hub.docker.com/mcp)
- 이 사이트: [Docker](/develop-wiki/backend/infra-devops/docker/) · [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)
