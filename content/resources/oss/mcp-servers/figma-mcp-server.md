---
name: Figma MCP Server
url: https://developers.figma.com/docs/figma-mcp-server/
docs: https://developers.figma.com/docs/figma-mcp-server/
repo: https://github.com/figma/mcp-server-guide
stars: 2207
domain: oss
category: mcp-servers
description: Figma 공식 원격 MCP 서버(mcp.figma.com). 선택한 프레임의 디자인 컨텍스트·변수·Code Connect 매핑을 에이전트에 주고 캔버스 쓰기도 지원한다. 디자인을 코드로 옮길 때 쓴다.
pricing: freemium
tags: [mcp, figma, design-to-code, remote-mcp, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Figma MCP 서버는 Figma 가 운영하는 **원격 MCP 서버**다. 서버 코드는 공개돼 있지 않고, GitHub 의 `figma/mcp-server-guide` 저장소는 설치 가이드와 함께 쓰는 스킬·규칙을 담는다. Figma 링크(노드 id 포함)를 프롬프트에 붙이면 해당 프레임의 구조·스타일·변수를 가져와 코드 생성에 쓴다. 원격 서버 전용 기능으로 에이전트가 Figma 캔버스에 프레임·컴포넌트·변수를 직접 만드는 쓰기 기능(베타)이 있다.
**2026-11 기준**: 가이드 저장소 별 약 2,200, 마지막 푸시 2026-11-18, 저장소 라이선스 표기 없음. 읽기 도구는 요금제·시트별 호출 한도가 있다(Starter 플랜이나 View·Collab 시트는 월 6회).

커뮤니티 대안으로 [Framelink MCP for Figma](https://github.com/GLips/Figma-Context-MCP)(`figma-developer-mcp`, 별 약 1.6만, MIT)가 널리 쓰인다. 개인 액세스 토큰으로 Figma REST API 를 호출해 레이아웃·스타일만 추려 주는 로컬 서버다.

## 무엇이 들어 있나
| 도구 (일부) | 하는 일 |
| --- | --- |
| `get_design_context` | 선택 영역을 React + Tailwind 형태의 구조로 반환 (다른 프레임워크로 바꾸는 출발점) |
| `get_variable_defs` | 선택 영역에 쓰인 색·간격·타이포 변수와 스타일 |
| `get_screenshot` · `get_metadata` | 선택 영역 이미지, 레이어 구조 요약 |
| `get_code_connect_map` 등 | Code Connect 로 Figma 컴포넌트와 코드 컴포넌트 매핑 조회·제안 |
| `use_figma` (원격 전용, 베타) | 캔버스 쓰기: 프레임·컴포넌트·변수·오토 레이아웃 생성·수정 |
| `create_design_system_rules` | 디자인 시스템 규칙 파일 생성 |
| `generate_image` | 자리표시 이미지 생성 (Figma AI 크레딧 사용) |

전체 목록은 [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) 문서에 있다.

## 설치·사용법
Claude Code 는 공식 마켓플레이스의 Figma 플러그인(MCP 설정 + 스킬)을 권장한다.

```bash
claude plugin install figma@claude-plugins-official

# 또는 서버만 수동 등록 (첫 사용 시 OAuth 로그인)
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Streamable HTTP 를 지원하는 다른 클라이언트:

```json
{
  "mcpServers": {
    "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" }
  }
}
```

Framelink 를 쓸 때는 토큰을 환경 변수로 준다.

```json
{
  "mcpServers": {
    "figma-framelink": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": { "FIGMA_API_KEY": "<YOUR_FIGMA_TOKEN>" }
    }
  }
}
```

## 언제 쓰나 / 주의
- 쓸 때: Figma 프레임을 기존 디자인 시스템 컴포넌트로 구현할 때, 디자인 토큰 이름을 코드에 그대로 쓰게 하고 싶을 때.
- 품질: 결과는 Figma 파일 구조에 크게 좌우된다. 컴포넌트·변수·오토 레이아웃·의미 있는 레이어 이름을 쓰고, Code Connect 로 컴포넌트를 연결해 두면 정확도가 오른다.
- 보안: 원격 서버는 OAuth 로 내 Figma 계정 권한을 받는다. 쓰기 기능을 켜면 에이전트가 팀 파일을 수정할 수 있으니 공유 파일에서는 사본으로 시험한다.
- 주의: 캔버스 쓰기는 베타 기간 이후 사용량 기반 유료 기능이 될 예정이라고 가이드에 적혀 있다. Figma 개발자 약관 동의가 전제된다.

## 링크
- [공식 문서](https://developers.figma.com/docs/figma-mcp-server/) · [도구 목록](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) · [가이드 저장소](https://github.com/figma/mcp-server-guide)
- [Framelink MCP for Figma](https://github.com/GLips/Figma-Context-MCP)
