---
title: 멀티 에이전트와 오케스트레이터 패턴
aka: [Multi-Agent, Orchestrator-Workers, Lead Agent and Subagents, Agentic Workflows, Prompt Chaining, Routing]
category: ai-patterns
group: agent
level: advanced
summary: 오케스트레이터 LLM 이 작업을 동적으로 나눠 하위 에이전트에 맡기고 결과를 종합하는 패턴과, 그보다 단순한 체이닝·라우팅·병렬화·평가자-최적화 워크플로를 비교한다.
tags: [llm, agent, orchestration, workflow, subagent]
related: [ai-patterns/agent-loop, ai-patterns/llm-evaluation, ai-patterns/prompt-design-principles, design-patterns/mediator]
sources:
  - https://www.anthropic.com/engineering/building-effective-agents
  - https://www.anthropic.com/engineering/multi-agent-research-system
updatedAt: 2026-11-18
---

## 문제

- 조사할 방향이 여러 갈래인데 에이전트 하나가 순서대로 처리하면 느리고, 한 컨텍스트 창에 모든 중간 결과가 쌓여 넘친다.
- 한 프롬프트가 분류·작성·검증을 다 맡으면 각 단계의 품질이 떨어진다.
- 반대로 "에이전트 여러 개"를 먼저 설계하면 필요 없는 복잡도와 비용이 생긴다.

## 해법

Anthropic 의 "Building effective agents" 는 **워크플로**(코드가 정한 경로로 LLM 을 조율)와 **에이전트**(LLM 이 스스로 과정과 도구 사용을 정함)를 구분하고, 단순한 것부터 쓰라고 권한다.

| 패턴 | 구조 | 언제 |
| --- | --- | --- |
| 프롬프트 체이닝 | 단계별 호출을 순서대로, 사이에 코드 검사 | 고정된 하위 단계로 깔끔히 나뉠 때 (지연 ↔ 정확도 교환) |
| 라우팅 | 입력을 분류해 전용 프롬프트·모델로 보냄 | 입력 유형이 뚜렷이 다를 때 (쉬운 질의 → 작은 모델) |
| 병렬화 | 독립 하위 작업 동시 실행(분할) 또는 같은 작업 여러 번(투표) | 속도가 필요하거나 여러 관점·신뢰도가 필요할 때 |
| **오케스트레이터-워커** | 중앙 LLM 이 입력을 보고 하위 작업을 **동적으로** 정해 위임, 결과 종합 | 하위 작업을 미리 알 수 없을 때 (여러 파일 수정, 다출처 조사) |
| 평가자-최적화 | 생성 LLM 과 평가 LLM 이 피드백 루프 | 평가 기준이 명확하고 반복 개선이 측정 가능할 때 |

### 오케스트레이터-워커 (멀티 에이전트)

```ts
type SubTask = { objective: string; outputFormat: string; tools: string[]; boundaries: string };
interface Agent { run(task: SubTask): Promise<string> }
interface Planner { plan(q: string): Promise<SubTask[]>; synthesize(q: string, r: string[]): Promise<string> }

async function research(question: string, lead: Planner, spawn: () => Agent) {
  const tasks = await lead.plan(question);                    // 입력에 따라 개수·내용이 달라짐
  const results = await Promise.all(tasks.map((t) => spawn().run(t))); // 각자 별도 컨텍스트
  return lead.synthesize(question, results);                   // 요약된 결과만 리드에게
}
```

Anthropic 리서치 시스템 사례에서 얻은 교훈:
- 하위 에이전트마다 **목표, 출력 형식, 쓸 도구, 범위 경계**를 구체적으로 줘야 한다. 모호하면 서로 같은 일을 중복했다.
- 질의 복잡도에 맞춰 노력을 조절하는 규칙을 프롬프트에 넣는다(단순 질의는 에이전트 1개·도구 호출 몇 번, 복잡한 조사는 여러 하위 에이전트).
- 내부 평가에서 멀티 에이전트(리드 + 하위)가 단일 에이전트보다 크게 나았지만, 토큰 사용량은 일반 채팅의 약 15배였다(단일 에이전트는 약 4배).

## 언제 쓰나

- **병렬화가 많고**, 정보량이 한 컨텍스트 창을 넘는 가치 높은 작업 (광범위한 조사, 여러 출처 비교)
- 하위 작업이 서로 독립적이고 결과를 요약해 넘길 수 있을 때

## 주의 (비용)

- 맞지 않는 경우: 모든 에이전트가 **같은 맥락을 공유**해야 하거나 에이전트 간 의존이 많은 작업. Anthropic 은 대부분의 코딩 작업이 여기 해당한다고 봤다.
- 토큰 비용이 몇 배로 뛴다. 작업의 가치가 그 비용을 정당화하는지 먼저 따진다.
- 오류가 상태와 함께 누적된다. 처음부터 재시작하지 말고 체크포인트에서 재개하고, 전체 트레이싱으로 결정 흐름을 본다.
- 리드가 하위 에이전트 묶음을 동기적으로 기다리면 병목이 생긴다. 비동기로 바꾸면 조율·일관성 문제가 새로 생긴다.
- 오케스트레이터가 모든 것을 아는 "신 객체"가 되기 쉽다는 점은 [중재자 패턴](/develop-wiki/knowledge/design-patterns/mediator/)의 주의점과 같다.
- 평가는 정해진 경로가 아니라 최종 결과를 본다. 소수(약 20개)의 실제 질의로 시작해도 초기에는 변화가 크게 보인다.
