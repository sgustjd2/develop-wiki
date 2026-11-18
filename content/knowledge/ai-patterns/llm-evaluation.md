---
title: LLM 평가 (오프라인 평가셋·LLM-as-judge)
aka: [LLM Evaluation, Evals, LLM-as-a-Judge, Model-based Grading, Regression Evals]
category: ai-patterns
group: evaluation
level: intermediate
summary: 실제 실패에서 뽑은 과제로 오프라인 평가셋을 만들고 코드·모델·사람 채점기를 조합해 LLM 기능의 품질 변화를 재는 방법. LLM 채점의 편향과 보정이 핵심 주의점이다.
tags: [llm, evaluation, llm-as-judge, testing, regression]
related: [ai-patterns/prompt-design-principles, ai-patterns/rag-pipeline, ai-patterns/agent-loop, ai-patterns/guardrails]
sources:
  - https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
  - https://arxiv.org/abs/2306.05685
  - https://www.anthropic.com/engineering/multi-agent-research-system
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide
updatedAt: 2026-11-18
---

## 문제

- 프롬프트·모델·검색 설정을 바꿨을 때 좋아졌는지 "몇 개 돌려 보니 괜찮더라"로 판단한다.
- 출력이 자유 텍스트라 정답 문자열 비교로 채점할 수 없다.
- 같은 입력에도 출력이 매번 달라, 한 번 통과했다고 안정적이라 할 수 없다.

## 해법

### 용어

| 용어 | 뜻 |
| --- | --- |
| 과제(task) | 입력 + 성공 기준 하나 |
| 시도(trial) | 과제 1회 실행. 변동성 때문에 여러 번 |
| 채점기(grader) | 결과의 한 측면을 점수화하는 로직 |
| 트랜스크립트 | 시도의 전체 기록 (출력, 도구 호출, 중간 결과) |
| 결과(outcome) | 시도 후 환경의 최종 상태 (예약이 실제로 DB 에 있나) |

### 채점기 종류

| 종류 | 예 | 장점 | 단점 |
| --- | --- | --- | --- |
| 코드 | 문자열 일치, 단위 테스트, 스키마 검증, 도구 호출 검사 | 빠르고 싸고 재현 가능 | 유효한 변형에 취약, 주관적 품질 못 봄 |
| 모델 (LLM-as-judge) | 루브릭 채점, 쌍대 비교, 참조 답과 비교 | 유연, 열린 출력 채점 | 비결정적, 비용, **사람과 보정 필요** |
| 사람 | 전문가 검토, 샘플 점검, A/B | 기준 품질 | 느리고 비쌈 |

가능하면 코드 채점기, 안 되면 모델 채점기, 그 모델 채점기는 사람 판정으로 보정한다.

```ts
type Case = { id: string; input: string; check: (out: string) => Promise<boolean> };

async function runEval(cases: Case[], system: (i: string) => Promise<string>, trials = 3) {
  const rows = [];
  for (const c of cases) {
    const passes = [];
    for (let t = 0; t < trials; t++) passes.push(await c.check(await system(c.input)));
    rows.push({ id: c.id, passAtK: passes.some(Boolean), passAllK: passes.every(Boolean) });
  }
  const rate = (k: 'passAtK' | 'passAllK') => rows.filter((r) => r[k]).length / rows.length;
  return { passAtK: rate('passAtK'), passAllK: rate('passAllK'), rows };
}
```

- **pass@k**: k 번 중 한 번이라도 성공. 하나만 맞으면 될 때.
- **pass^k**: k 번 모두 성공. 고객 대면처럼 일관성이 중요할 때. 시도당 75% 면 3번 모두 성공은 약 42%.

### 평가셋 만들기

- 수백 개를 기다리지 말고 **실제 실패에서 뽑은 20~50개**로 시작한다. 버그 리포트, 지원 티켓, 이미 손으로 하던 확인을 옮긴다.
- 과제는 모호하지 않게, 참조 답을 붙인다. 모든 시도가 실패하는 과제는 과제가 잘못됐을 가능성이 크다.
- "해야 하는 경우"와 "하면 안 되는 경우"를 모두 넣는다(한쪽으로만 최적화 방지).
- **능력 평가**(낮은 통과율에서 출발해 개선 목표)와 **회귀 평가**(거의 100% 유지, 퇴행 감지)를 나눈다.
- RAG 는 검색 단계(정답 청크 재현율)와 생성 단계(근거 충실성·완전성·관련성)를 따로 잰다.

### LLM-as-judge 주의점

Zheng 등(2023, MT-Bench)은 강한 LLM 채점기가 사람 선호와 80% 넘게 일치해 사람끼리의 일치 수준과 비슷하다고 보고했지만, 다음 편향을 확인했다.

| 편향 | 내용 | 완화 |
| --- | --- | --- |
| 위치 편향 | 쌍대 비교에서 먼저(또는 나중) 나온 답을 선호 | 순서를 바꿔 두 번 채점, 불일치는 무승부 |
| 장황함 편향 | 긴 답을 더 좋게 봄 | 루브릭에 길이와 무관한 기준 명시 |
| 자기 선호 | 자기(같은 계열) 모델의 답을 선호 | 채점 모델을 피평가 모델과 다르게 |
| 추론 한계 | 수학·논리 답의 정오를 잘못 판정 | 참조 답 제공, 코드로 검증 가능한 부분은 코드로 |

- 점수 하나보다 **루브릭 항목별** 판정(사실 정확성, 인용 정확성, 완전성 등)이 사람 판단과 잘 맞았다는 사례가 있다.
- 채점 프롬프트도 평가 대상이다. 사람이 라벨링한 소량 샘플로 일치율을 재고 주기적으로 다시 맞춘다.

## 언제 쓰나

- 프롬프트·모델·검색 설정·도구를 바꿀 때마다 (CI 처럼 회귀 평가 자동 실행)
- 모델 교체·업그레이드 결정, 비용 절감(작은 모델) 검토

## 주의 (비용)

- **트랜스크립트를 직접 읽는다.** 점수만 보면 채점기가 맞는 답을 틀렸다고 하는 경우를 놓친다.
- 평가셋이 포화(거의 100%)되면 개선 신호가 사라진다. 더 어려운 과제를 추가한다.
- 평가셋에 맞춰 프롬프트를 과적합시키지 않도록 별도 보류(held-out) 셋을 둔다.
- 오프라인 평가가 운영 품질을 다 대변하지 않는다. 운영 로그 샘플링, 사용자 피드백과 함께 본다.
- 에이전트는 정해진 경로가 아니라 **최종 결과**를 채점한다. 유효한 경로는 여러 개다.
