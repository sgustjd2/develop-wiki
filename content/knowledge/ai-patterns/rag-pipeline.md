---
title: RAG 기본 파이프라인
aka: [Retrieval-Augmented Generation, 검색 증강 생성, RAG]
category: ai-patterns
group: rag
level: beginner
summary: 질문과 관련된 문서를 먼저 검색해 프롬프트에 넣고 LLM 이 그 근거로 답하게 하는 패턴. 색인(청킹·임베딩·저장)과 질의(검색·조립·생성) 두 흐름으로 나뉜다.
tags: [llm, retrieval, embedding, vector-search, grounding]
related: [ai-patterns/chunking-strategies, ai-patterns/hybrid-search-reranking, ai-patterns/llm-evaluation, ai-patterns/agent-loop, ai-patterns/guardrails]
sources:
  - https://arxiv.org/abs/2005.11401
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide
  - https://www.anthropic.com/news/contextual-retrieval
updatedAt: 2026-11-18
---

이름은 Lewis 등(2020)의 논문에서 왔다. 논문은 사전학습 생성 모델(파라메트릭 기억)에 위키백과 밀집 벡터 색인(비파라메트릭 기억)을 붙여 지식 집약 과제의 정확도와 근거 제시를 개선했다. 지금은 "검색 결과를 컨텍스트로 넣어 생성"하는 애플리케이션 패턴 전반을 가리킨다.

## 문제

- LLM 은 학습 이후의 정보, 사내 문서, 개인 데이터를 모른다.
- 모르는 것을 그럴듯하게 지어낸다(환각). 답의 출처를 보여 줄 수 없다.
- 지식을 갱신하려고 모델을 다시 학습시키는 것은 느리고 비싸다.

## 해법

```
[색인 흐름 — 오프라인]
문서 ─▶ 로딩·정제 ─▶ 청킹 ─▶ 메타데이터 보강 ─▶ 임베딩 ─▶ 검색 색인(벡터 + 키워드)

[질의 흐름 — 요청마다]
질문 ─▶ (질의 재작성) ─▶ 검색 top-N ─▶ (리랭킹) ─▶ 프롬프트 조립 ─▶ LLM ─▶ 답 + 출처
```

```ts
interface Chunk { id: string; text: string; source: string }
interface Retriever { search(q: string, k: number): Promise<Chunk[]> }
interface LLM { complete(prompt: string): Promise<string> }

async function answer(question: string, retriever: Retriever, llm: LLM) {
  const chunks = await retriever.search(question, 8);
  const context = chunks
    .map((c, i) => `<doc id="${i + 1}" source="${c.source}">\n${c.text}\n</doc>`)
    .join('\n');
  const prompt = `${context}\n\n위 문서만 근거로 답하라. 근거가 없으면 "문서에서 찾지 못함"이라고 답하라.
인용한 문서 id 를 [1] 형식으로 표시하라.\n\n질문: ${question}`;
  return { text: await llm.complete(prompt), sources: chunks.map((c) => c.source) };
}
```

핵심 설계 지점:
- **청킹** — 의미 단위로 자르기 → [청킹 전략](/develop-wiki/knowledge/ai-patterns/chunking-strategies/)
- **검색** — 벡터만이 아니라 키워드(BM25)와 섞고 리랭킹 → [하이브리드 검색과 리랭킹](/develop-wiki/knowledge/ai-patterns/hybrid-search-reranking/)
- **프롬프트** — 긴 문서는 앞에, 질문은 끝에. 문서마다 출처 태그. "근거 없으면 모른다고" 지시.
- **평가** — 검색 단계(재현율)와 생성 단계(근거 충실성)를 따로 잰다 → [LLM 평가](/develop-wiki/knowledge/ai-patterns/llm-evaluation/)

### 표준 RAG vs 에이전틱 RAG

표준 RAG 는 "질의 → 검색 1회 → 생성"의 고정 순서다. 검색할지, 어느 색인을 볼지, 몇 번 찾을지를 설계자가 정한다. 여러 단계 추론이나 질의 분해가 필요하면 검색을 도구로 주고 모델이 판단하게 하는 [에이전트 루프](/develop-wiki/knowledge/ai-patterns/agent-loop/)로 확장한다.

## 언제 쓰나

- 사내 문서 Q&A, 고객 지원, 정책·매뉴얼 검색처럼 **근거가 있는 답**과 출처가 필요할 때
- 지식이 자주 바뀌어 재학습으로 따라갈 수 없을 때
- 문서마다 접근 권한이 달라 질의 시점에 필터링해야 할 때

## 주의 (비용)

- **작으면 검색하지 마라.** Anthropic 은 지식 베이스가 약 20만 토큰 이하라면 전부 프롬프트에 넣고 프롬프트 캐싱을 쓰는 편이 단순하다고 안내한다.
- 답 품질의 상한은 검색 품질이다. 생성 프롬프트를 고치기 전에 "정답 청크가 top-k 에 들어왔나"부터 확인한다.
- 검색된 문서는 **신뢰할 수 없는 입력**이다. 문서 안의 지시문(간접 프롬프트 인젝션)을 따르지 않도록 → [가드레일](/develop-wiki/knowledge/ai-patterns/guardrails/)
- 권한 필터는 검색 단계에서 강제한다. 프롬프트로 "권한 없는 내용은 말하지 마"라고 하는 것은 보안 경계가 아니다.
- 색인 갱신(문서 수정·삭제 반영), 임베딩 모델 교체 시 전체 재색인 비용을 계획한다.
- 파인튜닝과 혼동하지 않는다: RAG 는 **지식**을, 파인튜닝은 주로 **형식·스타일·행동**을 바꾸는 데 맞다.
