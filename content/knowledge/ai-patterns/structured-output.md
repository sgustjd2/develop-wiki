---
title: 구조화 출력
aka: [Structured Outputs, JSON Mode, JSON Schema Output, Constrained Decoding, Strict Tool Use]
category: ai-patterns
group: prompting
level: intermediate
summary: LLM 응답을 JSON 스키마에 맞게 강제하거나 검증해, 애플리케이션 코드가 자유 텍스트 파싱 없이 타입 있는 데이터로 받게 하는 패턴.
tags: [llm, json-schema, zod, function-calling, extraction]
related: [ai-patterns/agent-loop, ai-patterns/prompt-design-principles, ai-patterns/guardrails]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/structured-outputs
  - https://developers.openai.com/api/docs/guides/structured-outputs
updatedAt: 2026-11-18
---

## 문제

- "JSON 으로 답해"라고 해도 가끔 앞에 설명 문장이 붙거나, 따옴표가 깨지거나, 필드가 빠진다.
- 정규식으로 파싱하고 실패하면 재시도하는 방어 코드가 점점 늘어난다.
- 필드 이름·타입이 문서와 달라 다운스트림에서 런타임 오류가 난다.

## 해법

### 세 단계 수준

| 수준 | 방법 | 보장 |
| --- | --- | --- |
| 프롬프트 지시 | "다음 형식의 JSON 으로만 답하라" + 예시 | 없음. 검증·재시도 필요 |
| JSON 모드 | API 옵션으로 유효한 JSON 만 출력 | 문법적으로 유효한 JSON. **스키마는 보장 안 함** |
| 스키마 강제 (Structured Outputs) | JSON Schema 를 넘기면 **제약 디코딩**으로 스키마에 맞는 토큰만 생성 | 문법 + 필수 필드 + 타입 |

Anthropic·OpenAI 모두 두 갈래를 제공한다.
- **응답 형식 강제**: 모델이 사용자에게 주는 답 자체를 스키마로
- **엄격한 툴 호출**(`strict`): 도구 이름과 입력 인자를 스키마로. 모델이 시스템의 함수·데이터에 연결될 때

```ts
import { z } from 'zod';

const Ticket = z.object({
  category: z.enum(['billing', 'bug', 'account', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  summary: z.string(),
  customerEmail: z.string().nullable(),    // 선택 필드는 "nullable + required" 로 표현
});
type Ticket = z.infer<typeof Ticket>;

// SDK 헬퍼가 Zod → JSON Schema 변환 + 응답 파싱을 해 준다 (이름은 SDK 마다 다름).
// 스키마 강제가 없는 모델이라면 최소한 직접 검증한다:
function parseTicket(raw: string): Ticket {
  const result = Ticket.safeParse(JSON.parse(raw));
  if (!result.success) throw new Error(`스키마 불일치: ${result.error.message}`);
  return result.data;
}
```

### 스키마 작성 요령

- 객체마다 `additionalProperties: false`, 모든 속성을 `required` 에 넣고 선택값은 `null` 허용으로 표현하는 것이 일반적 요구사항이다.
- 분류 값은 자유 문자열 대신 `enum` 으로.
- 필드에 `description` 을 달아 모델에게 의미를 알려 준다. 필드 순서도 영향을 준다: 근거·추론 필드를 결론 필드 앞에 두면 결론이 근거를 따라간다.

## 언제 쓰나

- 정보 추출(이메일 → 리드 정보), 분류·라우팅, 평가 점수, UI 컴포넌트 데이터 생성
- 에이전트의 도구 호출 인자 검증
- LLM 출력이 다른 코드의 입력이 되는 모든 지점

## 주의 (비용)

- **스키마 지원 범위가 제한적**이다. 예: Claude 문서 기준 재귀 스키마, 숫자 범위(`minimum`/`maximum`), 문자열 길이 제약 등은 지원하지 않는다. SDK 헬퍼는 이런 제약을 설명 문구로 옮기고 응답 후 검증한다. 공급자마다 범위가 달라 문서를 확인해야 한다.
- 형식이 맞아도 **내용은 틀릴 수 있다**. 스키마가 표현 못 하는 업무 규칙(합계가 맞는지, 날짜가 미래인지)은 코드로 검증한다.
- 거절(refusal), 출력 토큰 한도 도달로 잘린 응답은 스키마를 만족하지 않을 수 있다. 응답의 종료 사유를 확인한다.
- 새 스키마는 처음 요청 때 컴파일 지연이 생기고, 스키마 설명이 입력 토큰을 늘린다. 스키마를 바꾸면 프롬프트 캐시가 무효화될 수 있다.
- 형식 강제가 추론을 방해할 수 있다. 복잡한 판단은 먼저 자유롭게 생각하게 하고(또는 추론 필드를 두고) 마지막에 구조화한다.
- 최신 Claude 모델은 마지막 assistant 메시지 프리필을 지원하지 않으므로, 프리필로 JSON 을 강제하던 코드는 구조화 출력으로 옮긴다.
