---
name: Vercel AI SDK
url: https://ai-sdk.dev/
docs: https://ai-sdk.dev/docs/introduction
repo: https://github.com/vercel/ai
stars: 28235
domain: ai
category: agent-framework
description: 여러 모델 공급자를 같은 API로 호출하고 도구 루프 에이전트·채팅 UI 훅까지 제공하는 TypeScript 툴킷(npm 패키지 ai). Next.js·React 등 웹 앱에 스트리밍 AI 기능을 넣을 때 쓴다.
pricing: oss
tags: [agent, typescript, streaming, react, nextjs, tool-calling]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-23
---

## 개요
AI SDK 는 Vercel 이 만든 TypeScript 용 AI 툴킷으로, 공급자마다 다른 API 를 공통 언어 모델 명세로 감싸 `generateText`/`streamText` 한 벌로 OpenAI·Anthropic·Google·Bedrock·Mistral·Groq 등을 바꿔 쓰게 한다. 구성은 세 부분이다.
- **AI SDK Core**: 텍스트·구조화 데이터 생성, 도구 호출, 에이전트(`ToolLoopAgent`)
- **AI SDK UI**: React·Vue·Svelte 등에서 쓰는 `useChat` 같은 채팅·생성형 UI 훅
- **AI SDK Harnesses**: Claude Code·Codex 같은 외부 에이전트 하네스를 `HarnessAgent` 라는 같은 API 로 실행
2026-11-18 기준 최신 버전은 `ai` **7.0.176**(Apache-2.0)이다. 7.0.0 은 2026-06-25 에 나왔고, 6.x(`ai-v6` 태그)도 병행 패치된다. 모델은 공급자 패키지 함수(`anthropic("...")`) 또는 Vercel AI Gateway 경유 문자열(`"anthropic/..."`)로 지정한다.

## 설치
```bash
npm install ai zod @ai-sdk/anthropic    # 코어 + 공급자 패키지 + 스키마
npm install @ai-sdk/react               # React 채팅 훅이 필요하면
export ANTHROPIC_API_KEY="..."          # 공급자 키는 환경 변수로
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `generateText` / `streamText` | 단발·스트리밍 생성. `tools`, `stopWhen` 을 주면 여러 단계 도구 호출 |
| 구조화 출력 | `generateText({ output: Output.object({ schema }) })` 로 zod 스키마에 맞는 객체 생성 |
| `tool()` | `description`, `inputSchema`(zod), `execute` 로 도구 정의 |
| `stopWhen` | 루프 종료 조건. `isStepCount(n)` 등. `generateText` 기본은 1단계 |
| `ToolLoopAgent` | 모델·지시문·도구를 묶은 재사용 에이전트. `agent.generate()` / `agent.stream()`, 기본 최대 20단계 |
| 도구 승인 | 특정 도구 호출에 사람 승인 단계를 두는 흐름 |
| `useChat` | `@ai-sdk/react` 등의 채팅 훅. 서버 스트림을 메시지 상태로 관리 |
| `createAgentUIStreamResponse` | 에이전트 실행 결과를 UI 메시지 스트림 응답으로 변환(라우트 핸들러용) |
| 공급자 | 공식 `@ai-sdk/*` 패키지, OpenAI 호환 공급자, 커뮤니티 공급자(Ollama, OpenRouter 등) |

## 기본 사용법
도구 하나를 가진 에이전트:

```typescript
import { ToolLoopAgent, tool, isStepCount } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const agent = new ToolLoopAgent({
  model: anthropic("claude-sonnet-4-5"),
  instructions: "환율 질문에는 도구를 써서 한국어로 답한다.",
  tools: {
    getRate: tool({
      description: "두 통화 간 환율 조회",
      inputSchema: z.object({ base: z.string(), target: z.string() }),
      execute: async ({ base, target }) => ({ base, target, rate: 1380 }),
    }),
  },
  stopWhen: isStepCount(5),
});

const result = await agent.generate({ prompt: "100달러는 몇 원이야?" });
console.log(result.text);
```
모델 id 는 공급자 문서의 현재 목록에서 확인한다.

## 자주 쓰는 패턴
- **Next.js 채팅 라우트**: `app/api/chat/route.ts` 에서 `return createAgentUIStreamResponse({ agent, uiMessages: messages })`, 클라이언트는 `useChat()`. `InferAgentUIMessage<typeof agent>` 로 도구 결과까지 타입이 맞는 메시지를 쓴다.
- **에이전트 없이 다단계 도구 호출**: `generateText({ model, tools, stopWhen: isStepCount(5), prompt })`.
- **구조화 추출**: `const { output } = await generateText({ model, output: Output.object({ schema }), prompt })`.
- **스트리밍 출력**: `const r = await agent.stream({ prompt }); for await (const t of r.textStream) process.stdout.write(t);`
- **로컬 모델**: OpenAI 호환 공급자로 LM Studio·[vLLM](/develop-wiki/ai/inference-serving/vllm/) 서버를, 커뮤니티 공급자로 [Ollama](/develop-wiki/ai/inference-serving/ollama/)를 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: Next.js·React·Svelte 웹 앱에 스트리밍 채팅·생성형 UI 를 넣을 때, 공급자 교체가 잦은 TypeScript 서버 코드, 가벼운 도구 루프 에이전트.
- 피할 때(대안): 메모리·워크플로·평가까지 묶인 TS 에이전트 프레임워크가 필요하면 [Mastra](/develop-wiki/ai/agent-framework/mastra/), 로컬 개발 UI 와 Go·Dart 지원이 필요하면 [Genkit](/develop-wiki/ai/agent-framework/genkit/), Python 백엔드면 [Pydantic AI](/develop-wiki/ai/agent-framework/pydantic-ai/).

## 공식 문서
- [소개](https://ai-sdk.dev/docs/introduction) · [Next.js 시작하기](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) · [텍스트 생성](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) · [도구 호출](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [에이전트 만들기](https://ai-sdk.dev/docs/agents/building-agents) · [useChat](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) · [공급자와 모델](https://ai-sdk.dev/docs/foundations/providers-and-models) · [Harnesses](https://ai-sdk.dev/docs/ai-sdk-harnesses/overview)
