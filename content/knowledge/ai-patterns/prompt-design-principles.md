---
title: 프롬프트 설계 원칙
aka: [Prompt Engineering, Prompt Design, Few-shot Prompting, System Prompt]
category: ai-patterns
group: prompting
level: beginner
summary: 성공 기준과 평가를 먼저 정한 뒤, 명확한 지시·맥락·예시·구조 태그·역할·문서 배치로 LLM 이 의도대로 동작하게 프롬프트를 쓰고 고치는 원칙.
tags: [llm, prompt, few-shot, system-prompt]
related: [ai-patterns/structured-output, ai-patterns/llm-evaluation, ai-patterns/rag-pipeline, ai-patterns/multi-agent-orchestration]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - https://www.anthropic.com/engineering/building-effective-agents
updatedAt: 2026-11-18
---

## 문제

- 프롬프트를 감으로 고치다 보면 한 사례는 좋아지고 다른 사례는 나빠지는데, 아무도 모른다.
- "간결하게", "전문적으로" 같은 모호한 지시는 사람마다·모델마다 다르게 해석된다.
- 지시, 참고 문서, 예시, 사용자 입력이 한 덩어리로 섞여 모델이 어디까지가 지시인지 헷갈린다.

## 해법

### 0. 먼저 성공 기준과 평가

Anthropic 문서는 프롬프트를 고치기 전에 세 가지를 갖추라고 한다: **명확한 성공 기준**, 그 기준을 **실험적으로 측정할 방법**, 개선할 **초안 프롬프트**. 지연·비용 문제처럼 모델 교체가 더 쉬운 해결책인 경우도 있다. → [LLM 평가](/develop-wiki/knowledge/ai-patterns/llm-evaluation/)

### 1. 명확하고 직접적으로

- 모델을 "똑똑하지만 우리 팀 맥락을 모르는 신입"으로 생각한다. 맥락 없는 동료가 읽고 따라 할 수 있으면 좋은 프롬프트다.
- 원하는 출력 형식과 제약을 구체적으로 쓴다. 순서가 중요하면 번호 목록으로.
- 기대 이상을 원하면 명시적으로 요청한다.

### 2. 이유를 알려 준다

"절대 말줄임표 쓰지 마"보다 "TTS 엔진이 읽으므로 말줄임표를 쓰지 마"가 낫다. 모델이 이유에서 일반화한다.

### 3. 하지 말 것보다 할 것을

"마크다운 쓰지 마" 대신 "자연스러운 문단으로 써". 프롬프트 자체의 형식도 출력 형식에 영향을 준다.

### 4. 예시 (few-shot)

관련성 있고, 다양하고(경계 사례 포함), 지시와 구분되게 태그로 감싼 예시 3~5개가 형식·어조를 맞추는 가장 확실한 방법 중 하나다.

### 5. 구조 태그로 구획

```ts
function buildPrompt(docs: { source: string; text: string }[], question: string) {
  const documents = docs
    .map((d, i) => `<document index="${i + 1}"><source>${d.source}</source>\n<document_content>${d.text}</document_content></document>`)
    .join('\n');
  return [
    `<documents>\n${documents}\n</documents>`,            // 긴 자료는 위에
    `<instructions>\n- 문서에 근거해 답한다.\n- 근거 문장의 index 를 인용한다.\n</instructions>`,
    `<question>${question}</question>`,                    // 질문은 맨 끝에
  ].join('\n\n');
}
```

- 긴 문서(수만 토큰)는 **프롬프트 위쪽**에, 질문·지시는 **끝**에 둔다. Anthropic 문서는 이 배치로 복잡한 다문서 입력에서 품질이 최대 30% 좋아졌다고 밝힌다.
- 태그 이름은 일관되게, 계층이 있으면 중첩한다.

### 6. 역할과 시스템 프롬프트

시스템 프롬프트에 역할 한 문장만 줘도 행동과 어조가 맞춰진다.

### 7. 복잡한 일은 쪼갠다

한 프롬프트에 분류·추출·작성·검증을 다 넣지 말고 체인으로 나눈다 → [멀티 에이전트와 오케스트레이터 패턴](/develop-wiki/knowledge/ai-patterns/multi-agent-orchestration/)의 프롬프트 체이닝.

## 언제 쓰나

- LLM 을 쓰는 모든 기능. 파인튜닝·모델 교체·RAG 를 검토하기 전에 가장 싸게 시도할 수 있는 수단이다.

## 주의 (비용)

- 프롬프트는 **코드처럼** 다룬다: 버전 관리, 리뷰, 평가셋으로 회귀 확인.
- 모델 세대가 바뀌면 같은 프롬프트의 동작이 달라진다. 이전 세대용 기법(대문자 강조, 과한 "반드시")이 새 모델에서는 과잉 반응을 낳을 수 있다. 공급자의 마이그레이션 가이드를 확인한다.
- 예시가 한쪽으로 치우치면 모델이 그 표면 패턴을 베낀다.
- 프롬프트에 넣은 "비밀 지시"는 노출될 수 있다고 가정한다. 보안 통제는 프롬프트 밖에서 → [가드레일](/develop-wiki/knowledge/ai-patterns/guardrails/)
- 형식 요구가 엄격하면 프롬프트보다 [구조화 출력](/develop-wiki/knowledge/ai-patterns/structured-output/)을 쓴다.
