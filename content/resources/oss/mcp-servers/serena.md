---
name: Serena
url: https://oraios.github.io/serena/
docs: https://oraios.github.io/serena/02-usage/000_intro.html
repo: https://github.com/oraios/serena
stars: 31554
domain: oss
category: mcp-servers
description: 언어 서버(LSP)로 심볼 단위 코드 검색·참조 찾기·이름 변경·편집을 제공하는 코딩용 MCP 서버. 큰 코드베이스에서 에이전트가 grep·줄 번호 대신 구조로 코드를 다루게 할 때 쓴다.
pricing: oss
tags: [mcp, lsp, code-navigation, refactoring, coding-agent]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Serena 는 Oraios AI 가 만든 MCP 서버로, 에이전트에게 **IDE 같은 의미 기반 코드 도구**를 준다. "이 함수를 참조하는 곳을 모두 찾아 이름 바꾸기"를 텍스트 검색·치환 여러 번이 아니라 한 번의 심볼 작업으로 처리한다. 기본 백엔드는 오픈소스 언어 서버(40개 이상 언어 지원)이고, 유료 JetBrains 플러그인을 백엔드로 쓰면 이동·인라인 같은 리팩터링이 추가된다. 장기 작업용 메모리 기능도 있다.
**2026-11 기준**: 별 약 3.1만, 최신 릴리스 v2.1.0(2026-10-19). 라이선스는 구성 요소별: Serena 애플리케이션 GPL-3.0-or-later, 언어 서버 클라이언트 라이브러리 SolidLSP 는 MIT(GitHub 는 NOASSERTION 으로 표시). v2 에서 REPL 기반 에이전트 인터페이스가 추가됐다.

## 무엇이 들어 있나
| 기능 | 언어 서버 백엔드 | JetBrains 플러그인 |
| --- | --- | --- |
| 심볼 찾기, 파일 개요, 참조 찾기 | 지원 | 지원 |
| 선언·구현으로 이동 | 부분 지원 | 지원 |
| 진단(오류·경고) | 지원 | 지원 |
| 심볼 본문 교체, 앞뒤 삽입 | 지원 | 지원 |
| 이름 변경 | 심볼만 | 심볼·파일·디렉터리 |
| 이동·인라인·미사용 코드 정리 | 미지원 | 지원 |
| 타입 계층, 의존성 안 검색 | 미지원 | 지원 |

## 설치·사용법
README 는 MCP·플러그인 마켓플레이스의 설치 명령이 오래됐을 수 있으니 `uv` 로 직접 설치하라고 안내한다.

```bash
uv tool install -p 3.13 serena-agent
serena init                     # 기본 언어 서버 백엔드로 초기화

# Claude Code — 현재 프로젝트에 등록
claude mcp add serena -- serena start-mcp-server --context claude-code --project "$(pwd)"

# 모든 프로젝트에서 (작업 디렉터리를 프로젝트로 사용)
claude mcp add --scope user serena -- serena start-mcp-server --context claude-code --project-from-cwd
```

`--context` 는 클라이언트 종류(예: `claude-code`, `codex`, `vscode`, `desktop-app`)에 맞춰 노출 도구를 조정한다. Codex 는 `config.toml` 의 `args = ["start-mcp-server", "--project-from-cwd", "--context=codex"]` 형식으로 등록한다. 일부 언어는 해당 언어 서버를 따로 설치해야 한다.

## 언제 쓰나 / 주의
- 쓸 때: 수십만 줄 규모 코드베이스에서 에이전트가 파일 전체를 읽느라 컨텍스트를 낭비할 때, 여러 파일에 걸친 이름 변경·참조 추적이 잦을 때.
- 주의: 작은 프로젝트나 한두 파일 수정에서는 에이전트 기본 도구로 충분하고, 도구 설명이 컨텍스트를 차지한다.
- 주의: 편집 도구는 파일을 직접 바꾼다. Git 으로 변경을 추적하는 저장소에서 쓰고, 처음엔 클라이언트의 도구 승인 프롬프트를 켜 둔다.
- 주의: GPL-3.0 애플리케이션이다. 그대로 써서 내부 도구로 쓰는 데는 제약이 적지만, 수정해 배포할 때는 GPL 조건을 따른다.
- 대안: Claude Code 라면 공식 마켓플레이스의 LSP 플러그인(`typescript-lsp` 등, [claude-plugins-official](/develop-wiki/oss/agent-skills/claude-plugins-official/))이 가벼운 대안이다.

## 링크
- [문서](https://oraios.github.io/serena/) · [클라이언트 설정](https://oraios.github.io/serena/02-usage/030_clients.html) · [도구 목록](https://oraios.github.io/serena/01-about/035_tools.html)
- [저장소](https://github.com/oraios/serena) · [지원 언어](https://oraios.github.io/serena/01-about/020_programming-languages.html)
