---
title: 청킹 전략
aka: [Chunking, Text Splitting, Document Chunking, Contextual Chunking]
category: ai-patterns
group: rag
level: intermediate
summary: RAG 색인을 위해 문서를 검색 단위로 자르는 방법. 고정 크기·문장·구조 기반·의미 기반 등 방식과 크기·겹침·문맥 보강의 트레이드오프를 다룬다.
tags: [rag, retrieval, text-splitting, embedding]
related: [ai-patterns/rag-pipeline, ai-patterns/hybrid-search-reranking, ai-patterns/llm-evaluation]
sources:
  - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-chunking-phase
  - https://www.anthropic.com/news/contextual-retrieval
updatedAt: 2026-11-18
---

## 문제

- 문서 통째로는 임베딩 하나에 여러 주제가 섞여 검색이 흐려지고, 프롬프트에 넣기에도 크고 비싸다.
- 너무 잘게 자르면 답에 필요한 문맥이 여러 청크로 흩어진다.
- 잘린 청크는 앞뒤 맥락을 잃는다. "매출이 3% 늘었다"만 남으면 어느 회사·어느 분기인지 알 수 없다.
- 표·목록·코드 블록을 중간에서 자르면 의미가 깨진다.

## 해법

### 방식 비교

Azure Architecture Center 의 정리를 바탕으로 했다(공수·비용은 상대 비교).

| 방식 | 방법 | 공수 | 처리 비용 | 맞는 문서 |
| --- | --- | --- | --- | --- |
| 문장 기반 | 완결된 문장 단위로 묶음 | 낮음 | 낮음 | 비정형 산문 (리뷰, 이메일, 메모) |
| 고정 크기 + 겹침 | N 토큰씩, 앞뒤 일부 겹침 | 낮음 | 낮음 | 비정형, 문서 유형이 너무 다양할 때 |
| 구조 기반 (커스텀 코드) | 제목·조항 번호·마크다운 헤더 등 패턴으로 분할 | 중간 | 낮음 | 구조를 추론할 수 있는 문서 (법령, 논문, 매뉴얼) |
| 레이아웃 분석 | OCR + 모델로 제목·표·그림을 인식해 분할 | 중간 | 중간 | 반정형 (웹 페이지, 이력서, PDF) |
| LLM 보강 | 표·이미지를 LLM 으로 텍스트 요약·설명 후 청크화 | 중간 | 높음 | 표, 그림, 회의록 |
| 의미 기반 | 임베딩 유사도로 주제가 바뀌는 지점에서 분할 | 높음 | 높음 | 주제가 섞여 있는 긴 문서 |

```ts
// 구조 우선, 크기 제한, 겹침을 둔 단순 분할기
function chunkMarkdown(doc: string, source: string, maxChars = 1500, overlap = 200) {
  const sections = doc.split(/\n(?=#{1,3} )/);        // 헤더 경계 우선
  const chunks: { text: string; source: string; heading: string }[] = [];
  for (const sec of sections) {
    const heading = sec.match(/^#{1,3} (.+)/)?.[1] ?? '';
    for (let i = 0; i < sec.length; i += maxChars - overlap) {
      chunks.push({ text: sec.slice(i, i + maxChars), source, heading });
    }
  }
  return chunks;
}
```

### 문맥 보강

- **메타데이터**: 문서 제목, 섹션 경로, 날짜, 권한 정보를 필드로 저장해 필터와 표시에 쓴다. 이미지 설명을 여러 청크로 나누면 각 청크에 원본 이미지 URL 을 넣는다.
- **문맥 접두어(Contextual Retrieval)**: LLM 으로 "이 청크가 전체 문서에서 어떤 맥락인지" 한두 문장을 만들어 청크 앞에 붙인 뒤 임베딩·BM25 색인한다. Anthropic 실험에서 검색 실패율을 크게 줄였다. 문서 전체를 매번 넣으므로 프롬프트 캐싱으로 비용을 줄인다.
- 단순한 대안: 청크 앞에 `문서 제목 > 섹션 제목` 경로만 붙여도 효과가 있는 경우가 많다.

## 언제 쓰나

- RAG 색인을 만들 때는 항상 결정해야 한다. 시작점은 **구조 기반 + 크기 상한 + 약간의 겹침**, 비정형 텍스트는 고정 크기 + 겹침.
- 문서 유형별로 다른 전략을 쓰되, 유형 수만큼 구현·유지 비용이 든다는 점을 감안한다.

## 주의 (비용)

- 청킹 방식은 **반영구적 결정**이다. 바꾸면 재색인과 하위 단계 조정이 필요하다. 운영 전에 평가셋으로 여러 방식을 비교한다.
- 크기 단위는 문자보다 **토큰**이 낫다. 임베딩 모델의 최대 입력 길이를 넘으면 뒤가 잘린다.
- 겹침은 경계 손실을 줄이지만 색인 크기와 중복 검색 결과를 늘린다. 같은 문서의 인접 청크가 top-k 를 독점하지 않게 중복 제거한다.
- 의미 기반·LLM 보강은 품질을 올릴 수 있지만 문서 수 × 호출 비용이 든다. 신규·갱신 문서의 증분 처리 비용까지 계산한다.
- 시각화 도구로 실제 잘린 결과를 눈으로 확인한다. 표가 반으로 잘려 있는 경우가 흔하다.
