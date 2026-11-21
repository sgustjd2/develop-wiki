---
name: GitHub MCP Server
url: https://github.com/github/github-mcp-server
docs: https://github.com/github/github-mcp-server#readme
repo: https://github.com/github/github-mcp-server
stars: 34649
domain: oss
category: mcp-servers
description: GitHub 공식 MCP 서버. 저장소·이슈·PR·Actions·코드 스캔 결과를 에이전트가 읽고 다루게 한다. 원격 서버(api.githubcopilot.com)나 Docker 로컬 서버로 연결한다.
pricing: oss
tags: [mcp, github, pull-request, issues, actions, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GitHub 이 직접 만들고 운영하는 MCP 서버다. 예전 참조 서버(`@modelcontextprotocol/server-github`)는 보관됐고, 이 서버가 대체한다. Go 로 작성돼 있으며 두 가지 방식으로 쓴다.
- **원격 서버**: `https://api.githubcopilot.com/mcp/` 에 HTTP 로 연결. OAuth 또는 PAT 로 인증하고 설치가 필요 없다.
- **로컬 서버**: `ghcr.io/github/github-mcp-server` Docker 이미지나 직접 빌드한 바이너리를 stdio 로 실행. GitHub Enterprise Server 도 지원한다.

**2026-11 기준**: 별 약 3.5만, 최신 릴리스 v2.2.0(2026-11-16), MIT.

## 무엇이 들어 있나
도구는 **toolset** 단위로 켜고 끈다. 지정하지 않으면 `default`(context, repos, issues, pull_requests, users)가 켜진다.

| toolset | 하는 일 |
| --- | --- |
| `repos` | 파일 읽기·검색, 브랜치·커밋, 파일 생성·수정 |
| `issues` · `pull_requests` | 이슈·PR 조회·생성·댓글·리뷰 |
| `actions` | 워크플로 실행 목록·로그 조회, 재실행 |
| `code_security` · `dependabot` · `secret_protection` | 코드 스캔·Dependabot·시크릿 스캔 알림 |
| `discussions` · `gists` · `projects` · `notifications` | 기타 GitHub 기능 |
| `copilot` · `copilot_spaces`·`github_support_docs_search`(원격 전용) | Copilot 코딩 에이전트 위임, Spaces, GitHub 문서 검색 |

## 설치·사용법
Claude Code 에서 원격 서버를 PAT 로 연결:

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp \
  -H "Authorization: Bearer $GITHUB_PAT"
```

로컬 Docker 서버를 읽기 전용, 일부 toolset 만으로 등록하는 일반 `mcpServers` 설정 예:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
        "-e", "GITHUB_READ_ONLY=1",
        "ghcr.io/github/github-mcp-server"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_PAT>" }
    }
  }
}
```

바이너리로 실행할 때는 `github-mcp-server stdio --toolsets repos,issues --read-only` 처럼 플래그로 준다. 환경 변수 `GITHUB_TOOLSETS` 는 플래그보다 우선한다.

## 언제 쓰나 / 주의
- 쓸 때: 에이전트에게 이슈 분류, PR 리뷰 댓글, CI 실패 로그 확인, 보안 알림 정리를 맡길 때.
- 보안: 공개 저장소의 이슈·PR·댓글은 **누구나 쓸 수 있는 입력**이라 프롬프트 인젝션 경로가 된다. `--lockdown-mode` 는 push 권한이 없는 작성자의 공개 저장소 콘텐츠를 걸러 주지만, README 가 밝히듯 권한 경계가 아니라 최선 노력 필터다.
- 보안: PAT 는 fine-grained 토큰으로 필요한 저장소·권한만 준다. 쓰기가 필요 없으면 `--read-only`(Docker 는 `GITHUB_READ_ONLY=1`)로 쓰기 도구를 아예 숨긴다.
- 주의: toolset 을 `all` 로 켜면 도구 설명만으로 컨텍스트를 많이 쓴다. 필요한 toolset 만 켠다.
- 대안: 로컬 Git 작업만 필요하면 [MCP Reference Servers](/develop-wiki/ai/mcp-tooling/mcp-reference-servers/) 의 Git 서버나 `gh` CLI 로 충분하다.

## 링크
- [README](https://github.com/github/github-mcp-server#readme) · [설치 가이드(클라이언트별)](https://github.com/github/github-mcp-server/tree/main/docs/installation-guides) · [서버 설정 가이드](https://github.com/github/github-mcp-server/blob/main/docs/server-configuration.md)
- [릴리스](https://github.com/github/github-mcp-server/releases)
