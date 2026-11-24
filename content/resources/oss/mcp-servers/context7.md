---
name: Context7
url: https://context7.com
docs: https://context7.com/docs
repo: https://github.com/upstash/context7
stars: 65394
domain: oss
category: mcp-servers
description: Upstash 의 라이브러리 문서 검색 MCP 서버. 버전별 최신 공식 문서·코드 예제를 에이전트 컨텍스트에 넣어 없는 API 를 지어내는 문제를 줄인다. 무료 키로 쓰고 백엔드는 비공개다.
pricing: freemium
tags: [mcp, documentation, coding-agent, upstash, remote-mcp]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Context7 은 수많은 라이브러리·프레임워크 문서를 색인해 두고, 코딩 에이전트가 "Next.js 16 proxy 설정"처럼 물으면 해당 버전 문서 조각과 코드 예제를 돌려주는 서비스다. 저장소에는 **MCP 서버와 CLI 코드만** 있고, 문서 수집·파싱·검색 백엔드는 비공개다. 색인된 문서는 커뮤니티가 등록한 것이라 정확성을 보증하지 않는다고 README 가 밝힌다.
두 가지 방식으로 쓴다: MCP 서버로 도구를 직접 호출하거나, `ctx7` CLI + 스킬로 MCP 없이 셸 명령으로 조회한다.
**2026-11 기준**: 별 약 6.5만, 마지막 푸시 2026-11-18, MIT(서버·CLI 코드). npm 패키지 `@upstash/context7-mcp`, `ctx7`.

## 무엇이 들어 있나
| 도구 | 하는 일 |
| --- | --- |
| `resolve-library-id` | 라이브러리 이름(`libraryName`)과 질문(`query`)으로 Context7 ID 검색 (예: `/vercel/next.js`) |
| `query-docs` | ID 와 질문으로 관련 문서·예제 조회. `language` 로 코드 예제 언어 우선순위 지정 |

| CLI 명령 | 하는 일 |
| --- | --- |
| `ctx7 setup` | OAuth 로그인, API 키 생성, 에이전트별 스킬 또는 MCP 설정 |
| `ctx7 library <name> <query>` | 라이브러리 ID 검색 |
| `ctx7 docs <libraryId> <query>` | 문서 조회 |

## 설치·사용법
가장 간단한 방법은 설정 도우미다(Node.js 22.13 이상).

```bash
npx ctx7 setup --claude      # Claude Code 용 스킬 또는 MCP 설정
npx ctx7 remove              # 되돌리기
```

수동으로 원격 MCP 서버를 등록할 때는 URL 과 API 키 헤더를 준다.

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp \
  -H "Authorization: Bearer $CONTEXT7_API_KEY"
```

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": { "Authorization": "Bearer <YOUR_API_KEY>" }
    }
  }
}
```

프롬프트에 `use context7` 을 붙이거나 `use library /supabase/supabase` 처럼 ID 를 직접 적으면 매칭 단계를 건너뛴다. 매번 쓰게 하려면 `CLAUDE.md` 에 "라이브러리 API 질문에는 Context7 을 먼저 조회"라는 규칙을 둔다.

## 언제 쓰나 / 주의
- 쓸 때: 학습 컷오프 이후 바뀐 프레임워크 API 를 다룰 때, 버전별 설정 차이가 큰 라이브러리(Next.js, Tailwind 등)를 쓸 때.
- 주의: 질문 내용이 Context7 서버로 전송된다. 사내 코드·비밀 정보가 담긴 문장을 그대로 넘기지 않도록 한다.
- 주의: 색인 문서는 원본과 시차가 있거나 커뮤니티 등록 과정에서 오류가 섞일 수 있다. 중요한 설정은 공식 문서 원문으로 다시 확인한다.
- 주의: 키 없이도 쓸 수 있지만 요청 한도가 낮다. 무료 키를 발급받아 환경 변수로 넘긴다.
- 대안: 특정 GitHub 저장소 문서만 필요하면 공식 문서 사이트의 `llms.txt` 나 [MCP Reference Servers](/develop-wiki/ai/mcp-tooling/mcp-reference-servers/) 의 Fetch 서버로 직접 가져온다.

## 링크
- [context7.com](https://context7.com) · [클라이언트별 설치](https://context7.com/docs/resources/all-clients) · [CLI 레퍼런스](https://context7.com/docs/clients/cli)
- [라이브러리 등록](https://context7.com/docs/adding-libraries) · [저장소](https://github.com/upstash/context7)
