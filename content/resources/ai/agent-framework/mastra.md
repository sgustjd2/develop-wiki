---
name: Mastra
url: https://mastra.ai
repo: https://github.com/mastra-ai/mastra
stars: 29721
domain: ai
category: agent-framework
description: 에이전트·워크플로·메모리·RAG·평가를 한데 묶은 TypeScript 프레임워크. Node.js나 Next.js 앱에 에이전트를 넣을 때 쓴다.
pricing: oss
tags: [agent, workflow, memory]
languages: [typescript]
docs: https://mastra.ai/docs
addedAt: 2026-11-18
verifiedAt: 2026-11-22
---

## 개요
Mastra 는 TypeScript 로 에이전트, 워크플로, 메모리, RAG, 평가, 관측성을 한 프레임워크 안에서 다루는 AI 애플리케이션 프레임워크다. 모델은 `"공급자/모델"` 문자열 하나로 지정하고(모델 라우터), 도구·워크플로 단계의 입출력은 zod 스키마로 타입을 맞춘다.
로컬 개발 서버를 띄우면 Studio 라는 웹 UI 에서 에이전트와 대화하고 워크플로 실행을 추적할 수 있다. Node.js 백엔드나 Next.js 같은 웹 앱에 에이전트를 넣는 TypeScript 팀에 맞는 위치다.
2026-11 기준 `@mastra/core` 1.84.0, CLI `mastra` 1.40.0.

## 설치
```bash
npm create mastra@latest            # 새 프로젝트 (pnpm/yarn/bunx 도 가능)

# 기존 프로젝트에 추가
npm install @mastra/core@latest zod@latest mastra@latest
npm install -D typescript@latest @types/node@latest
```

공급자 키는 `.env` 에 `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` 처럼 넣고 저장소에는 커밋하지 않는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` | `id`, `name`, `instructions`, `model`, `tools`, `memory` 를 가진 에이전트 (`@mastra/core/agent`) |
| 모델 라우터 | `model: "openai/..."` 처럼 문자열로 공급자·모델 선택, 키는 환경 변수에서 읽음 |
| `createTool` | `id`, `description`, `inputSchema`(zod), `outputSchema`, `execute` 로 도구 정의 |
| `Mastra` | 에이전트·워크플로·저장소를 등록하는 중앙 인스턴스 (`src/mastra/index.ts`) |
| 워크플로 | `createStep` 으로 단계를 만들고 `createWorkflow(...).then(...).commit()` 으로 연결 |
| 메모리 | `@mastra/memory` + 저장소(`@mastra/libsql` 등)로 스레드별 대화 기록 유지 |
| Studio | `mastra dev` 로 띄우는 로컬 UI (`localhost:4111`), REST API 문서는 `/swagger-ui` |

## 기본 사용법
`src/mastra/agents/weather.ts` — 도구 하나를 가진 에이전트:

```typescript
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const weatherTool = createTool({
  id: "get-weather",
  description: "도시의 현재 날씨를 조회한다",
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ city }) => ({ summary: `${city}: 맑음, 18°C` }),
});

export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  instructions: "날씨 질문에는 get-weather 도구를 써서 짧게 답한다.",
  model: process.env.MASTRA_MODEL!, // 예: "openai/<모델명>"
  tools: { weatherTool },
});
```

`src/mastra/index.ts` 에서 등록하고 호출:

```typescript
import { Mastra } from "@mastra/core";
import { weatherAgent } from "./agents/weather";

export const mastra = new Mastra({ agents: { weatherAgent } });

const agent = mastra.getAgentById("weather-agent");
const res = await agent.generate("서울 날씨 알려 줘");
console.log(res.text);
```

`npm run dev`(또는 `mastra dev`) 후 `http://localhost:4111` 의 Studio 에서 같은 에이전트를 테스트할 수 있다.

## 자주 쓰는 패턴
- **스트리밍 응답**: `const stream = await agent.stream("...")` 후 `for await (const t of stream.textStream)` 로 UI 에 흘려보낸다.
- **대화 기억**: 에이전트에 `memory: new Memory({ options: { lastMessages: 20 } })` 를 주고, Mastra 인스턴스에 `storage: new LibSQLStore({ id: "mastra-storage", url: "file:./mastra.db" })` 를 등록한다. 호출 시 `agent.generate(msg, { memory: { thread: "t-1", resource: "user-42" } })`.
- **결정적 워크플로**: LLM 판단이 필요 없는 단계는 `createStep` 으로 코드화하고 `.then()` 으로 잇는다. 실행은 `const run = await wf.createRun(); await run.start({ inputData })`.
- **사람 승인 대기**: 워크플로를 suspend 시킨 뒤 `run.resumeStream({ resumeData })` 로 이어 간다.
- **에이전트는 `getAgentById` 로**: 직접 import 한 객체 대신 Mastra 인스턴스에서 꺼내야 저장소·로거 같은 공유 서비스가 연결된다.

## 언제 쓰나 / 피할 때
- 쓸 때: TypeScript 단일 언어로 백엔드·프런트엔드를 쓰는 팀, Next.js·Node 서비스에 에이전트와 워크플로를 같이 넣을 때, 로컬 Studio 로 빠르게 디버깅하고 싶을 때.
- 피할 때(대안): Python 생태계(데이터·ML 라이브러리)를 써야 하면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/)·[OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/), 모델 호출 한두 번이면 공급자 SDK 를 직접 쓰는 편이 단순하다. JVM 은 [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/), Go 는 [Eino](/develop-wiki/ai/agent-framework/eino/).

## 공식 문서
- [문서 홈](https://mastra.ai/docs) · [에이전트](https://mastra.ai/docs/agents/overview) · [워크플로](https://mastra.ai/docs/workflows/overview) · [메모리](https://mastra.ai/docs/memory/overview)
- [Studio](https://mastra.ai/docs/studio/overview) · [모델 환경 변수](https://mastra.ai/models/environment-variables) · [GitHub](https://github.com/mastra-ai/mastra)
