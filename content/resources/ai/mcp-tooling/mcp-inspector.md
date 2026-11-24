---
name: MCP Inspector
url: https://modelcontextprotocol.io/docs/tools/inspector
docs: https://github.com/modelcontextprotocol/inspector#readme
repo: https://github.com/modelcontextprotocol/inspector
stars: 11355
domain: ai
category: mcp-tooling
description: MCP 서버에 직접 붙어 도구·리소스·프롬프트를 호출해 보는 공식 디버깅 도구. 웹 UI, 스크립트용 CLI, 터미널 UI 를 한 패키지로 제공한다.
pricing: oss
tags: [mcp, debugging, testing, cli]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
MCP Inspector 는 [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 프로젝트가 직접 관리하는 서버 점검 도구다. LLM 호스트 없이 서버에 연결해 `tools/list`, `tools/call`, `resources/read` 같은 요청을 직접 보내고 응답·알림·OAuth 흐름을 확인한다. 서버를 어떤 언어·SDK 로 만들었든 상관없다.
**v2.15 기준**(npm `@modelcontextprotocol/inspector` 2.15.0). v2 는 하나의 패키지에 웹 UI, CLI, TUI(Ink 기반 터미널 UI), 실험적 연결 CLI `mcpdo` 를 묶었다. 구 v1 은 보안 수정만 받는다(`@v1-latest` 태그).

## 설치
설치 없이 `npx` 로 실행하는 것이 기본이다. Node.js 가 필요하며 지원 범위는 `^22.23.4 || ^24.22.1 || >=26.12.1` 이다.

```bash
npx @modelcontextprotocol/inspector            # 웹 UI (기본, http://127.0.0.1:6274)
npx @modelcontextprotocol/inspector --cli ...  # CLI
npx @modelcontextprotocol/inspector --tui      # 터미널 UI
```

CI 에서는 `npx --yes @modelcontextprotocol/inspector@2.15.0 --cli …` 처럼 정확한 버전을 고정한다(`@2` 는 고정이 아니다).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 대상(target) | stdio 서버라면 실행할 명령(`node build/index.js`), 원격 서버라면 URL |
| 전송 | stdio, Streamable HTTP(`--transport http`), SSE. URL 경로가 `/mcp`·`/sse` 로 끝나면 자동 추론 |
| `--method` | CLI 에서 보낼 MCP 메서드 (`tools/list`, `tools/call`, `resources/list`, `prompts/list` 등) |
| `--catalog` | Inspector 가 쓰고 고치는 자기 서버 목록 (기본 `~/.mcp-inspector/mcp.json`) |
| `--config` | 남이 만든 설정 파일을 읽기 전용으로 사용. 파일을 절대 수정하지 않음 |
| 비밀값 저장소 | OAuth 토큰·stdio `env` 값은 OS 키체인에, 키체인이 없으면 `~/.mcp-inspector/secrets.json` 에 저장 |
| `--format json` | 결과를 JSON 한 개로 출력해 `jq` 로 검증하기 쉽게 함 |

## 기본 사용법
로컬 stdio 서버를 웹 UI 로 열기 — 서버 인자로 넘길 플래그가 Inspector 플래그와 겹치면 `--` 뒤에 둔다.

```bash
npx @modelcontextprotocol/inspector uv run server.py
npx @modelcontextprotocol/inspector node build/index.js -- --config ./server.conf
```

CLI 로 도구 목록과 호출을 확인하기:

```bash
# 도구 목록
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list

# 도구 호출 (key=value, JSON 값도 가능)
npx @modelcontextprotocol/inspector --cli node build/index.js \
  --method tools/call --tool-name add --tool-arg a=1 --tool-arg b=2

# 원격 Streamable HTTP 서버
npx @modelcontextprotocol/inspector --cli https://mcp.example.com/mcp --method tools/list
```

## 자주 쓰는 패턴
- **CI 스모크 테스트**: 서버가 살아 있는지 → 필요한 도구가 있는지 → 호출 결과가 맞는지를 한 줄씩 확인한다.

  ```bash
  INSPECT="npx --yes @modelcontextprotocol/inspector@2.15.0 --cli"
  $INSPECT node build/index.js --method initialize --connect-timeout 10000
  $INSPECT node build/index.js --method tools/list --format json \
    | jq -e '.result.tools | map(.name) | index("add")'
  ```
  `--method initialize` 는 연결과 서버 정보 확인만 하고 끊는 가장 가벼운 검사다. `--connect-timeout` 을 꼭 지정해 CI 가 멈추지 않게 한다.
- **설정 파일로 서버 선택**: `--config ./mcp.json --server my-server` 로 전송 세부 사항을 스크립트에서 빼낸다.
- **인증 헤더**: `--header "Authorization: Bearer $TOKEN"` 처럼 환경 변수로 넘기고 스크립트에 토큰을 적지 않는다.
- **스키마 이식성 점검**: `tools/list` 에 `--strict` 를 주면 다른 클라이언트에서 문제가 될 JSON Schema 를 `schemaFindings` 로 알려 준다.
- **공식 SDK·FastMCP 와 연동**: 공식 Python SDK 의 `mcp dev server.py` 가 Inspector 를 띄운다. [FastMCP](/develop-wiki/ai/mcp-tooling/fastmcp/) 서버는 대상 명령으로 `fastmcp run server.py` 를 주면 된다.

## 언제 쓰나 / 피할 때
- 쓸 때: MCP 서버를 개발하면서 도구 스키마·응답·에러를 눈으로 확인할 때, OAuth 흐름을 디버깅할 때, 배포 파이프라인에 연결 확인 단계를 넣을 때, 다른 사람이 만든 서버가 무엇을 노출하는지 미리 볼 때.
- 피할 때(대안): 서버 로직 단위 테스트는 SDK 의 메모리 내 클라이언트(예: FastMCP `Client(mcp)`)로 pytest 에서 돌리는 편이 빠르다. 실제 모델이 도구를 어떻게 고르는지 보려면 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 같은 실제 호스트에서 시험한다. 키체인이 없는 컨테이너·SSH 환경에서는 비밀값이 평문 파일로 저장될 수 있으니 저장 방식을 먼저 확인한다.

## 공식 문서
- [Inspector 소개 (modelcontextprotocol.io)](https://modelcontextprotocol.io/docs/tools/inspector) · [README](https://github.com/modelcontextprotocol/inspector#readme)
- [CLI 레퍼런스](https://github.com/modelcontextprotocol/inspector/blob/main/clients/cli/README.md) · [서버 설정](https://github.com/modelcontextprotocol/inspector/blob/main/docs/mcp-server-configuration.md) · [CLI 스모크 테스트](https://github.com/modelcontextprotocol/inspector/blob/main/docs/cli-smoke-testing.md)
- [v1 → v2 마이그레이션](https://github.com/modelcontextprotocol/inspector/blob/main/docs/v1-to-v2-migration.md) · [비밀값 저장 위치](https://github.com/modelcontextprotocol/inspector/blob/main/docs/secret-storage.md)
