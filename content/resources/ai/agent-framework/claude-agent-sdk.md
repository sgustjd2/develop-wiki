---
name: Claude Agent SDK
url: https://code.claude.com/docs/en/agent-sdk/overview
docs: https://code.claude.com/docs/en/agent-sdk/overview
repo: https://github.com/anthropics/claude-agent-sdk-python
stars: 8649
domain: ai
category: agent-framework
description: Claude Code의 에이전트 루프·내장 도구·권한·훅을 Python·TypeScript 라이브러리로 가져다 쓰는 Anthropic SDK. 파일·셸을 다루는 자율 에이전트를 자체 앱에 넣을 때 쓴다.
pricing: free
tags: [agent, anthropic, claude, mcp, hooks, subagents]
languages: [python, typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-19
---

## 개요
Claude Agent SDK(옛 이름 Claude Code SDK)는 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/)를 움직이는 에이전트 루프, 내장 도구(Read·Edit·Bash·Glob·Grep·WebSearch 등), 컨텍스트 관리, 권한, 세션, 훅을 라이브러리로 제공한다. 직접 도구 실행 루프를 짜는 일반 API 클라이언트와 달리, SDK 가 Claude Code 바이너리를 실행해 **도구 실행까지 대신 처리**한다는 점이 다르다.
2026-11-18 기준 Python 판 `claude-agent-sdk` **0.2.184**(Python 3.10+), TypeScript 판 `@anthropic-ai/claude-agent-sdk` **0.3.327**(Node.js 18.14+)이며 둘 다 거의 매일 릴리스된다. 두 패키지 모두 플랫폼별 Claude Code 네이티브 바이너리를 함께 설치한다.
**라이선스 주의**: Python 저장소 코드는 MIT 지만 TypeScript 저장소에는 소스가 없고 "© Anthropic PBC. All rights reserved." 로 표기되며, 공식 문서는 SDK 사용이 Anthropic Commercial Terms of Service 를 따른다고 명시한다(단, 구성요소의 LICENSE 파일에 다른 라이선스가 표시된 경우는 예외). 그래서 이 항목은 `oss` 가 아니라 `free`(무료지만 비공개)로 분류했다. 실행에는 유료 Claude API 키(또는 Bedrock·Vertex·Foundry 자격 증명)가 필요하며, 제3자 제품에 claude.ai 로그인을 제공하는 것은 허용되지 않는다.

## 설치
```bash
pip install claude-agent-sdk                 # 또는 uv add claude-agent-sdk
npm install @anthropic-ai/claude-agent-sdk   # TypeScript
export ANTHROPIC_API_KEY="..."               # SDK 는 .env 를 자동으로 읽지 않는다
# 클라우드 경유: CLAUDE_CODE_USE_BEDROCK=1 / CLAUDE_CODE_USE_VERTEX=1 / CLAUDE_CODE_USE_FOUNDRY=1
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `query()` | 단발 실행 진입점. 비동기 이터레이터로 메시지(추론, 도구 호출, 결과)를 스트리밍 |
| `ClaudeSDKClient` (Python) | `async with` 로 여는 대화형 클라이언트. `query()` → `receive_response()` 를 반복해 멀티턴 |
| 옵션 | Python `ClaudeAgentOptions`(snake_case), TS `options`(camelCase): `allowed_tools`, `permission_mode`, `system_prompt`, `cwd`, `max_turns`, `mcp_servers`, `agents`, `hooks`, `resume` 등 |
| `tools` vs `allowed_tools` | `tools` 는 모델에 보이는 내장 도구 집합, `allowed_tools` 는 승인 없이 실행할 도구(사전 승인) |
| 권한 모드 | `default`, `acceptEdits`, `plan` 등. allow/deny 규칙·`can_use_tool` 콜백과 함께 평가 |
| 커스텀 도구 | `@tool`(Py) / `tool()`+zod(TS)로 정의해 `create_sdk_mcp_server` 로 프로세스 내 MCP 서버로 등록. 이름은 `mcp__서버__도구` |
| 훅 | `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop` 등에서 콜백 실행. 차단·입력 수정·로그 |
| 서브에이전트 | `agents={"이름": AgentDefinition(description, prompt, tools, model)}` |
| 세션 | `resume=<session_id>`, `fork_session` 으로 이어가기·분기 |
| 설정 로드 | `setting_sources` 로 `.claude/` 의 스킬·명령·CLAUDE.md·훅 설정을 읽을지 결정 |

## 기본 사용법
읽기·편집 도구만 허용한 코드 수정 에이전트(Python):

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

async def main():
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Glob", "Grep"],
        permission_mode="acceptEdits",   # 파일 편집 자동 승인
        cwd="./my-project",
    )
    async for msg in query(prompt="utils.py 에서 빈 리스트 입력 시 터지는 버그를 고쳐줘",
                           options=options):
        if isinstance(msg, ResultMessage):
            print(msg.subtype, msg.result)

asyncio.run(main())
```

같은 일을 TypeScript 로:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "utils.py 에서 빈 리스트 입력 시 터지는 버그를 고쳐줘",
  options: { allowedTools: ["Read", "Edit", "Glob", "Grep"], permissionMode: "acceptEdits" },
})) {
  if (msg.type === "result") console.log(msg.subtype);
}
```

## 자주 쓰는 패턴
- **커스텀 도구**: `@tool("lookup", "주문 조회", {"order_id": str})` 로 정의한 async 함수를 `create_sdk_mcp_server(name="shop", version="1.0.0", tools=[lookup])` 로 묶고 `mcp_servers={"shop": server}`, `allowed_tools=["mcp__shop__lookup"]` 로 넘긴다.
- **위험 명령 차단 훅**: `hooks={"PreToolUse": [HookMatcher(matcher="Bash", hooks=[guard])]}`. 콜백이 `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "..."}}` 를 돌려주면 실행이 막힌다. 허용은 `{}`.
- **읽기 전용 분석기**: `tools=["Read", "Glob", "Grep"]` 로 내장 도구 자체를 제한해 코드 리뷰·감사 봇을 만든다.
- **외부 MCP 서버**: `mcp_servers={"github": {"command": "...", "args": [...]}}` 처럼 stdio·HTTP MCP 서버를 연결한다. ([MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/))
- **CI 에서 실행**: 셸만 있으면 되는 환경에서는 SDK 대신 `claude -p ... --output-format json` 으로 같은 루프를 서브프로세스로 돌릴 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 파일 시스템·셸·웹 검색을 직접 다루는 자율 에이전트(코드 수정 봇, 리서치·운영 자동화)를 자체 서비스에 넣고, 도구 실행·컨텍스트 압축·권한을 직접 구현하고 싶지 않을 때.
- 피할 때(대안): Claude 외 모델이 필요하거나 OSS 라이선스가 필수면 [Pydantic AI](/develop-wiki/ai/agent-framework/pydantic-ai/)·[LangGraph](/develop-wiki/ai/agent-framework/langgraph/)·[OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/). 도구 실행 루프를 직접 통제하려면 [Anthropic API](/develop-wiki/ai/model-platform/anthropic-api/) 클라이언트 SDK 를 쓴다. 에이전트 호스팅까지 맡기려면 Anthropic 의 Managed Agents 가 별도로 있다.

## 공식 문서
- [개요](https://code.claude.com/docs/en/agent-sdk/overview) · [Quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart) · [Python 레퍼런스](https://code.claude.com/docs/en/agent-sdk/python) · [TypeScript 레퍼런스](https://code.claude.com/docs/en/agent-sdk/typescript)
- [커스텀 도구](https://code.claude.com/docs/en/agent-sdk/custom-tools) · [훅](https://code.claude.com/docs/en/agent-sdk/hooks) · [권한](https://code.claude.com/docs/en/agent-sdk/permissions) · [TS 저장소](https://github.com/anthropics/claude-agent-sdk-typescript)
