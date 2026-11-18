---
title: 하이브리드 검색과 리랭킹
aka: [Hybrid Search, Reciprocal Rank Fusion, RRF, Reranking, Cross-encoder Reranker, BM25 + Vector]
category: ai-patterns
group: rag
level: intermediate
summary: 키워드 검색(BM25)과 벡터 검색을 함께 돌려 순위 융합(RRF)으로 합치고, 상위 후보를 리랭커로 다시 정렬해 RAG 의 검색 재현율과 정밀도를 높이는 패턴.
tags: [retrieval, bm25, vector-search, rrf, reranker, rag]
related: [ai-patterns/rag-pipeline, ai-patterns/chunking-strategies, ai-patterns/llm-evaluation]
sources:
  - https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking
  - https://www.anthropic.com/news/contextual-retrieval
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide
updatedAt: 2026-11-18
---

## 문제

- 벡터 검색은 의미가 비슷한 문장은 잘 찾지만 **정확한 토큰**(오류 코드 `E-4012`, 제품명, 함수명, 사번)에 약하다.
- 키워드 검색(BM25)은 정확한 단어는 잘 찾지만 표현이 다르면(동의어, 다른 언어) 놓친다.
- 두 검색의 점수는 척도가 달라 그냥 더할 수 없다(BM25 는 상한이 없고, 코사인 유사도는 0~1 근처).
- top-k 를 크게 잡으면 재현율은 오르지만 관련 없는 청크가 프롬프트를 채운다.

## 해법

### 1단계: 병렬 검색 + 순위 융합 (RRF)

점수 대신 **순위**만 쓴다. 각 결과 목록에서 문서의 순위 `r` 에 `1 / (k + r)` 을 주고 합산한다. `k` 는 상수로 보통 60 을 쓴다(Azure AI Search 문서 기준). 여러 목록에서 상위에 있는 문서가 올라온다.

```ts
function rrf(lists: string[][], k = 60): string[] {
  const score = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, i) => score.set(id, (score.get(id) ?? 0) + 1 / (k + i + 1)));
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

const fused = rrf([await bm25.search(q, 50), await vector.search(q, 50)]);
```

필요하면 목록별 가중치를 곱해 한쪽을 더 신뢰할 수 있다.

### 2단계: 리랭킹

융합 결과 상위 수십~백여 개를 **리랭커**(질의와 문서를 함께 입력받아 관련도를 매기는 크로스 인코더 모델, 또는 LLM)로 다시 점수 매기고, 최종 상위 몇 개만 LLM 에 넣는다.

```
질의 ─┬─▶ BM25 top-50 ──┐
      └─▶ 벡터 top-50 ──┴─▶ RRF ─▶ 상위 ~150 ─▶ 리랭커 ─▶ 상위 ~20 ─▶ LLM
```

### 효과의 예

Anthropic 의 Contextual Retrieval 실험(검색 실패율 = 1 − recall@20):
- 기준 5.7% → 문맥 보강 임베딩 3.7% → + 문맥 보강 BM25 2.9% → + 리랭킹 1.9%
- 같은 실험에서 최종 청크 20개를 넣은 경우가 5개·10개보다 나았다.

수치는 그들의 데이터셋 기준이므로, 자기 데이터로 다시 재야 한다.

## 언제 쓰나

- 질의에 고유명사·코드·식별자가 자주 섞이는 도메인(기술 문서, 고객 지원, 법률·의료 용어)
- 벡터 검색만으로 재현율이 부족하다는 것이 평가로 확인됐을 때
- 리랭킹은 후보는 많은데 프롬프트에 넣을 수 있는 양이 제한될 때

## 주의 (비용)

- 리랭커 호출은 **지연과 비용**을 더한다. 후보 수(예: 150 → 50)와 최종 개수를 평가로 조정한다.
- RRF 는 원래 점수의 크기를 버린다. "관련 없음"을 걸러 내는 임계치가 필요하면 리랭커 점수에 건다.
- 키워드 검색은 언어별 형태소 분석이 품질을 좌우한다. 한국어는 분석기 선택이 중요하다.
- 두 색인을 유지해야 하므로 동기화(문서 삭제·갱신)를 양쪽에 반영한다.
- 먼저 [청킹](/develop-wiki/knowledge/ai-patterns/chunking-strategies/)이 망가져 있으면 검색 기법을 바꿔도 효과가 작다. 검색 단계만 따로 평가하는 셋을 만든다.
