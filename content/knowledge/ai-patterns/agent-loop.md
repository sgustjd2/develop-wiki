---
title: 에이전트 루프 (ReAct·툴 호출)
aka: [Agent Loop, ReAct, Tool Use, Function Calling, Augmented LLM]
category: ai-patterns
group: agent
level: intermediate
summary: LLM 이 추론하고 도구를 호출한 뒤 그 결과를 보고 다음 행동을 정하는 과정을 종료 조건까지 반복하는 패턴. 단계 수를 미리 정할 수 없는 열린 작업에 쓴다.
tags: [llm, agent, tool-calling, react, function-calling]
related: [ai-patterns/multi-agent-orchestration, ai-patterns/structured-output, ai-patterns/guardrails, ai-patterns/rag-pipeline, ai-patterns/llm-evaluation]
sources:
  - https://arxiv.org/abs/2210.03629
  - https://www.anthropic.com/engineering/building-effective-agents
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
  - https://www.anthropic.com/engineering/writing-tools-for-agents
updatedAt: 2026-11-18
---

## 문제

- "이 버그 고쳐 줘", "이 주제 조사해 줘" 같은 일은 몇 단계가 필요할지 미리 알 수 없다. 고정된 프롬프트 체인으로는 표현이 안 된다.
- LLM 혼자 추론만 하면(chain-of-thought) 틀린 사실 위에 추론을 쌓아 오류가 커진다.
- 반대로 도구 호출만 나열하면 왜 그 행동을 했는지, 언제 멈춰야 하는지 판단이 없다.

## 해법

**ReAct**(Yao 등, 2022)는 추론(Reason)과 행동(Act)을 번갈아 하게 했다. 추론은 계획을 세우고 진행을 추적하며, 행동은 외부(검색 API, 환경)에서 새 정보를 가져와 추론을 바로잡는다. 논문은 위키백과 API 를 쓰는 질의응답에서 chain-of-thought 의 환각과 오류 전파를 줄였다고 보고했다.

오늘날 모델 API 의 **툴 호출(function calling)** 이 이 루프의 구현 수단이다. 모델이 "이 도구를 이 인자로 불러라"를 구조화된 블록으로 내고, 애플리케이션이 실행해 결과를 돌려준다.

```ts
type ToolCall = { id: string; name: string; input: unknown };
type ModelTurn = { text?: string; toolCalls: ToolCall[] };
interface Model { next(history: unknown[]): Promise<ModelTurn> }
type Tool = (input: any) => Promise<string>;

async function runAgent(goal: string, model: Model, tools: Record<string, Tool>, maxSteps = 20) {
  const history: unknown[] = [{ role: 'user', content: goal }];
  for (let step = 0; step < maxSteps; step++) {
    const turn = await model.next(history);
    history.push({ role: 'assistant', content: turn });
    if (turn.toolCalls.length === 0) return turn.text;          // 도구 호출이 없으면 종료
    const results = await Promise.all(turn.toolCalls.map(async (c) => {
      const tool = tools[c.name];
      const output = tool ? await tool(c.input).catch((e) => `오류: ${e.message}`) : `없는 도구: ${c.name}`;
      return { toolCallId: c.id, output };                      // 오류도 결과로 돌려줘 모델이 수정하게
    }));
    history.push({ role: 'tool', content: results });
  }
  throw new Error('최대 단계 초과');                              // 종료 조건은 필수
}
```

### 도구 설계 (에이전트-컴퓨터 인터페이스)

Anthropic 은 도구 정의를 사람용 UI 만큼 신경 써야 한다고 강조한다.
- 도구는 API 엔드포인트를 1:1 로 감싸기보다, 자주 하는 **작업 단위**로 적게 만든다.
- 이름과 파라미터를 명확히(`user` 보다 `user_id`), 설명에 사용 예·경계 조건·다른 도구와의 차이를 쓴다.
- 결과는 UUID 나열보다 사람이 읽는 이름과 핵심 필드 위주로. 큰 결과는 페이지네이션·필터·자르기 + "다음엔 이렇게 좁혀라" 같은 안내를 준다.
- 실수하기 어렵게(poka-yoke) 만든다. 예: 상대 경로 대신 절대 경로만 받기.

## 언제 쓰나

- 단계 수를 예측할 수 없고, 환경에서 매 단계 결과(테스트 통과 여부, 검색 결과)를 확인할 수 있는 작업
- 코딩 에이전트, 조사·리서치, 여러 시스템을 오가는 운영 작업
- **먼저 더 단순한 것을 시도한다**: 단일 LLM 호출 + 검색 → 고정 워크플로(프롬프트 체이닝, 라우팅) → 그래도 부족할 때 에이전트

## 주의 (비용)

- 비용·지연이 크고 오류가 **누적**된다. 최대 단계, 예산(토큰·시간), 사람 확인 지점을 둔다.
- 도구 결과(웹 페이지, 파일, 이메일)는 신뢰할 수 없는 입력이다. 쓰기·삭제·송금 같은 부작용 있는 도구는 권한을 최소로 하고 사람 승인을 받는다 → [가드레일](/develop-wiki/knowledge/ai-patterns/guardrails/)
- 같은 입력에도 경로가 매번 달라 디버깅이 어렵다. 전체 트랜스크립트(모델 출력, 도구 입출력)를 남기고 [평가](/develop-wiki/knowledge/ai-patterns/llm-evaluation/)는 경로가 아니라 **최종 결과**를 본다.
- 프레임워크는 편하지만 프롬프트와 응답을 가려 디버깅을 어렵게 할 수 있다. 몇 줄이면 되는 루프는 API 로 직접 짜 보고, 프레임워크를 쓰면 내부 동작을 이해한다. 예: [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/)
- 도구 정의가 많아지면 컨텍스트를 차지하고 선택 정확도가 떨어진다. 도구를 네임스페이스로 묶고 필요한 것만 노출한다. 외부 도구 연결 표준으로는 [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/)가 있다.
