---
title: 검색 판정 세트(qrels) 구축과 인터리빙 평가
aka: [Relevance Judgments, qrels, Pooling, Test Collection, Team-Draft Interleaving, Balanced Interleaving, Online Search Evaluation, 검색 정답 세트, 인터리빙]
category: ui-ux
group: research
level: advanced
summary: 검색 순위 품질을 재기 위한 두 축, 사람이 판정한 정답 세트(qrels·풀링)와 실제 사용자 클릭으로 두 랭커를 직접 비교하는 인터리빙을 TREC 문서·Zobel 1998·Radlinski 등 2008 원문과 직접 실행한 시뮬레이션으로 정리한다.
tags: [ux, search, evaluation, information-retrieval, qrels, pooling, interleaving, team-draft, online-experiment]
related: [ui-ux/search-quality-metrics-mrr-ndcg, ui-ux/search-query-log-analysis-zero-results, ui-ux/search-synonyms-typo-correction-ux, ui-ux/korean-morphological-vs-ngram-indexing, ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/mcnemar-test-paired-proportions, ai-patterns/llm-evaluation, ai-patterns/hybrid-search-reranking]
sources:
  - https://trec.nist.gov/data/qrels_eng/
  - https://trec.nist.gov/data/reljudge_eng.html
  - https://www-nlpir.nist.gov/projects/irlib/pubs/sp500215/sp500215_text/01_006.txt
  - https://www.cs.cornell.edu/courses/cs574/2002fa/assignments.org/zobel-sigir98.pdf
  - https://www.cs.cornell.edu/people/tj/publications/radlinski_etal_08b.pdf
  - https://www.microsoft.com/en-us/research/?p=162219
updatedAt: 2026-11-19
---

지표 계산(MRR·nDCG)은 [검색 품질 지표](/develop-wiki/knowledge/ui-ux/search-quality-metrics-mrr-ndcg/)에 있다. 지표는 **무엇이 정답인지**가 있어야 계산된다. 이 노트는 그 정답 세트를 만드는 법과, 정답 세트 없이 사용자 클릭으로 두 랭커를 비교하는 인터리빙을 다룬다.

## 문제

- nDCG 를 재려면 쿼리별로 "어떤 문서가 얼마나 관련 있는가" 판정이 필요하다. 색인 문서가 수십만 개면 전부 판정할 수 없다.
- 판정하지 않은 문서는 보통 "관련 없음"으로 취급된다. 새 랭커가 판정 안 된 좋은 문서를 올리면 점수가 오히려 떨어진다.
- 클릭률·이탈률 같은 절대 지표로 A/B 테스트를 하면 차이가 작을 때 표본이 매우 많이 든다.

## 해법

### 1. 판정 세트(qrels) 형식

TREC qrels 파일은 한 줄에 4열이다.

```
<쿼리ID> <반복(거의 항상 0)> <문서ID> <관련도>
101 0 doc-8812 1
101 0 doc-0457 0
```

- TREC 영어 qrels 는 관련(1)/무관(0) 이진이며, 문서 일부라도 관련 있으면 관련으로 판정했다. 파일에 없는 문서는 판정되지 않았고 평가에서 무관으로 가정된다(TREC 페이지).
- 제품 검색이라면 등급(0~3)을 쓰는 편이 nDCG 에 맞는다. 등급 정의서를 먼저 쓰고 판정자 간 일치도를 확인한다(필자 제안).

### 2. 풀링(pooling): 무엇을 판정할지 고르기

- TREC-2 방식: 참가 시스템마다 쿼리별 상위 100개를 모아 중복을 없앤 "풀"만 판정한다. 모든 시스템이 순위 검색이므로 관련 문서가 위에 몰린다는 가정이다. 한 주제는 한 판정자가 판정했다(TREC-2 개요).
- Zobel(1998)의 확인:
  - 판정 풀에 기여하지 않은 시스템을 빼고 다시 평가했을 때 TREC-5 평균 점수 하락은 0.5%(최대 3.5%)로 작았지만, 정답이 많은 상위 10개 쿼리에서는 평균 7%였다. TREC-3 은 평균 2.2%, 그 10개 쿼리에서 19%.
  - 풀 깊이 10 이면 이 하락이 더 커졌다(TREC-5 2.3%, TREC-3 14%).
  - 풀 기여 효과는 대체로 작아 상대 비교에는 신뢰할 만하다고 보면서도, 관련 문서의 50~70% 정도만 찾았을 것으로 추정했고, "판정 안 됨 = 무관" 가정은 의심스럽다고 결론지었다.
- 제품 적용(필자 제안): 현재 랭커, 후보 랭커, 단순 키워드(BM25 류) 결과의 상위 k 를 합쳐 풀을 만든다. 새 랭커가 나오면 **판정 안 된 상위 문서 비율**을 함께 보고하고, 높으면 추가 판정한다.

### 3. 인터리빙: 두 랭커를 한 결과 목록에 섞기

Radlinski·Kurup·Joachims(2008, arXiv.org 검색 실험):

- 절대 지표 8개(클릭 수, 재질의 빈도, 이탈 등)는 그들의 표본 크기에서 알려진 품질 순서를 안정적으로 반영하지 못했다.
- 두 랭커 결과를 섞어 보여 주고 클릭이 어느 쪽 결과에 갔는지 세는 **쌍 비교**는 6개 비교 쌍 모두에서 방향이 맞았고, 24개 조건 중 20개가 95% 수준에서 유의했다.

**Team-Draft Interleaving(TDI)**: 두 주장이 번갈아 선수를 뽑는 방식.

```ts
// 직접 작성. 논문 Algorithm 2 를 따름
function teamDraft(A: string[], B: string[], rnd = Math.random) {
  const I: string[] = [], team = new Map<string, 'A' | 'B'>(); let na = 0, nb = 0;
  const next = (L: string[]) => L.find((d) => !team.has(d));
  while (next(A) !== undefined && next(B) !== undefined) {
    const pickA = na < nb || (na === nb && rnd() < 0.5); // 같으면 동전 던지기
    const d = next(pickA ? A : B)!;
    team.set(d, pickA ? 'A' : 'B'); I.push(d); pickA ? na++ : nb++;
  }
  return { I, team }; // 클릭된 문서의 team 으로 A·B 점수를 센다
}
```

- 쿼리마다 클릭 수가 많은 팀이 승. 승패 수에 이항 부호 검정을 한다(논문).
- 이전 방식인 Balanced Interleaving 은 두 순위가 거의 같고 한 칸 밀린 경우 편향될 수 있다. 논문의 예 A=(a,b,c,d), B=(b,c,d,a) 로 무작위 클릭 사용자를 20만 번 시뮬레이션했다.

| 방법 | A 승 | B 승 |
| --- | --- | --- |
| Team-Draft | 99,896 | 100,104 |
| Balanced | 49,895 | 150,105 |

- 무작위로 클릭해도 Balanced 는 B 를 3배 더 선호한다. TDI 는 반반이다. 논문은 실제 데이터에서는 이 문제가 드러나지 않았다고 보고했다.
- 후속 대규모 검증: Chapelle·Joachims·Radlinski·Yue(2012, ACM TOIS 30권)는 상용 검색 엔진 두 곳과 학술 검색 데이터로 인터리빙과 사람 판정의 일치, 통계 효율을 비교하고, 클릭 점수 배분 함수를 학습해 민감도를 높이는 방법도 제안했다(Microsoft Research 소개 페이지의 초록만 확인).

## 언제 쓰나

- **판정 세트:** 오프라인 회귀 테스트. 동의어 사전·형태소 분석기·랭킹 변경 전후를 같은 쿼리 세트로 비교([동의어·오타 교정](/develop-wiki/knowledge/ui-ux/search-synonyms-typo-correction-ux/), [형태소 vs n-gram](/develop-wiki/knowledge/ui-ux/korean-morphological-vs-ngram-indexing/)).
- **인터리빙:** 트래픽이 있는 서비스에서 두 랭커 중 어느 쪽이 나은지 빠르게 판단. 오프라인 지표로 거른 후보를 온라인에서 확인하는 단계.
- 둘 다 정성 신호(검색 로그의 0결과, 재질의)와 함께 쓴다 → [검색 로그 분석](/develop-wiki/knowledge/ui-ux/search-query-log-analysis-zero-results/)

## 주의·비용

- 판정 비용: 쿼리 50개 × 풀 100문서면 5,000 판정이다. 쿼리 샘플은 로그 빈도 상위만이 아니라 롱테일도 섞는다(필자 제안).
- 판정자 기준이 흔들리면 지표 차이가 판정 잡음에 묻힌다. 판정 지침과 이중 판정 샘플을 둔다.
- 인터리빙은 "어느 쪽이 나은가"만 답한다. 얼마나 나은지(전환율 몇 %p)는 A/B 테스트가 필요하다 → [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)
- TDI 는 클릭이 하나뿐인 쿼리도 항상 승패를 낸다. 두 랭커가 거의 같으면 분산이 커질 수 있다고 논문이 지적했다.
- 클릭은 위치 편향·제목 매력도에 영향을 받는다. 인터리빙은 두 랭커를 같은 위치 분포로 섞어 이를 줄이지만 없애지는 않는다.
- 결과 목록을 섞어 보여 주므로 UI 에 "추천 이유" 같은 랭커별 표시가 있으면 쓸 수 없다.

## 검증 범위

- 확인함: qrels 형식·판정 기준·미판정 처리는 TREC 데이터 페이지, 상위 100개 풀링·단일 판정자는 TREC-2 개요 원문, 풀 기여 효과 수치와 재현율 추정은 Zobel(SIGIR 1998) PDF 원문, TDI 알고리즘·실험 결과·부호 검정은 Radlinski 등(CIKM 2008) PDF 원문. 시뮬레이션 표는 Node.js 로 직접 실행.
- 확인 못 함: Chapelle 등(2012) 본문(초록·서지만 확인), 최근 TREC 트랙의 등급 판정 방식, 다중 랭커 인터리빙(multileaving), LLM 판정자 사용의 타당성.
