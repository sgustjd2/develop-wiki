---
name: Genkit
url: https://genkit.dev/
docs: https://genkit.dev/docs/get-started/
repo: https://github.com/genkit-ai/genkit
stars: 6605
domain: ai
category: agent-framework
description: Google이 만든 AI 앱·에이전트 프레임워크(TypeScript·Go·Python·Dart). 타입 있는 flow, 도구 호출, 로컬 Developer UI를 갖춰 기존 웹·서버 앱에 생성형 AI 기능을 넣을 때 쓴다.
pricing: oss
tags: [agent, flow, google, gemini, firebase, devtools-ui]
languages: [typescript, go, python, dart]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-21
---

## 개요
Genkit 은 Google 이 자사 프로덕션에서 쓰며 공개한 오픈소스 프레임워크로, 모델 호출·구조화 출력·도구 호출·RAG·에이전트를 **flow** 라는 타입 있는 함수 단위로 묶는다. 플러그인 방식이라 Gemini·Vertex AI 외에 Anthropic, OpenAI, Ollama, OpenRouter, Bedrock, OpenAI 호환 엔드포인트 등 여러 모델과 벡터 저장소를 같은 API 로 쓴다. 로컬 **Developer UI** 에서 flow 실행, 프롬프트 실험, 트레이스 확인을 할 수 있는 것이 다른 프레임워크와 구별되는 점이다.
저장소는 `firebase/genkit` 에서 `genkit-ai/genkit` 으로 옮겨졌다(옛 URL 리다이렉트). 2026-11-18 기준 JS `genkit` **1.44.0**(1.0 부터 GA), Go **1.14.0**, Python **0.13.0**(Preview), CLI `genkit-cli` 1.45.0 이며 Apache-2.0 이다. Dart SDK 도 있다.
Next.js·Express·Hono·FastAPI·Flask·Gin 등 앱 프레임워크 연동 가이드와 Cloud Run·Firebase·Lambda·Azure Functions 배포 가이드를 제공한다.

## 설치
```bash
npm install genkit @genkit-ai/google-genai   # 코어 + Gemini 플러그인
npm install -g genkit-cli                   # Developer UI·CLI
export GEMINI_API_KEY="..."                 # 키는 환경 변수로
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `genkit({ plugins, model })` | 인스턴스(`ai`) 생성. 플러그인으로 모델·벡터 저장소 공급자 등록, 기본 모델 지정 |
| `ai.generate()` | 모델 호출. `prompt`, `tools`, `output: { schema }` 로 구조화 출력 |
| Flow | `ai.defineFlow({ name, inputSchema, outputSchema }, fn)` — 입출력이 zod 로 검증되고 트레이스되는 함수. HTTP 엔드포인트로 노출 가능 |
| Tool | `ai.defineTool({ name, description, inputSchema, outputSchema }, fn)` |
| Dotprompt | 프롬프트·모델 설정·스키마를 `.prompt` 파일로 분리해 관리 |
| Agents | 상태·세션 저장소·인터럽트(사람 승인)·멀티 에이전트를 지원하는 에이전트 정의 |
| Developer UI | `genkit start` 로 여는 로컬 웹 UI. flow 실행·트레이스·평가 |
| 관측성 | OpenTelemetry 기반 트레이스, Google Cloud 로 내보내기 가능 |

## 기본 사용법
구조화 출력을 돌려주는 flow:

```typescript
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const ai = genkit({ plugins: [googleAI()], model: googleAI.model("gemini-flash-latest") });

const Recipe = z.object({ title: z.string(), steps: z.array(z.string()) });

export const recipeFlow = ai.defineFlow(
  { name: "recipeFlow", inputSchema: z.object({ dish: z.string() }), outputSchema: Recipe },
  async ({ dish }) => {
    const { output } = await ai.generate({
      prompt: `${dish} 레시피를 5단계 이내로 알려줘`,
      output: { schema: Recipe },
    });
    if (!output) throw new Error("스키마에 맞지 않는 응답");
    return output;
  },
);
```
개발 중에는 `genkit start -- npx tsx --watch src/index.ts` 로 Developer UI 를 띄워 flow 를 실행해 본다.

## 자주 쓰는 패턴
- **도구 호출**: `ai.defineTool(...)` 로 만든 도구를 `ai.generate({ prompt, tools: [getWeather] })` 에 넘긴다.
- **모델 교체**: 플러그인만 바꿔 Ollama(로컬)·Anthropic·OpenAI 모델을 같은 `generate` 코드로 쓴다.
- **앱 연동**: flow 를 Express·Next.js 라우트나 Firebase Functions 로 노출하고, 클라이언트 라이브러리로 스트리밍 호출한다.
- **RAG**: 임베더·리트리버 플러그인(pgvector, Chroma, LanceDB, Firestore 등)으로 검색 결과를 `docs` 로 넘긴다.
- **MCP**: MCP 플러그인으로 외부 MCP 서버의 도구를 flow·에이전트에 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: Firebase·Google Cloud·Gemini 를 쓰는 웹/모바일 백엔드, TypeScript·Go·Dart(Flutter) 팀이 같은 개념으로 AI 기능을 넣을 때, 로컬 UI 로 프롬프트·트레이스를 보며 개발하고 싶을 때.
- 피할 때(대안): React UI 스트리밍 훅 중심이면 [Vercel AI SDK](/develop-wiki/ai/agent-framework/vercel-ai-sdk/), 에이전트 워크플로·메모리 중심 TS 프레임워크는 [Mastra](/develop-wiki/ai/agent-framework/mastra/), Google 에이전트 전용 툴킷은 [Google ADK](/develop-wiki/ai/agent-framework/google-adk/), Python 이 주력이면 아직 Preview 이므로 [Pydantic AI](/develop-wiki/ai/agent-framework/pydantic-ai/) 등을 먼저 검토한다.

## 공식 문서
- [시작하기](https://genkit.dev/docs/get-started/) · [Flows](https://genkit.dev/docs/js/flows/) · [도구 호출](https://genkit.dev/docs/js/tool-calling/) · [에이전트](https://genkit.dev/docs/agents/overview/)
- [Developer UI](https://genkit.dev/docs/devtools/) · [모델 공급자](https://genkit.dev/docs/integrations/model-providers/) · [API 안정성](https://genkit.dev/docs/api-stability/) · [릴리스](https://github.com/genkit-ai/genkit/releases)
