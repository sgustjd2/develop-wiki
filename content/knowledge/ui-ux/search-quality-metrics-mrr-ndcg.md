---
title: 검색 품질 지표 — MRR·nDCG
aka: [Search Relevance Metrics, Mean Reciprocal Rank, MRR, Discounted Cumulated Gain, DCG, nDCG, Normalized DCG, Cumulated Gain, 검색 랭킹 평가]
category: ui-ux
group: research
level: advanced
summary: 검색 결과 순위의 품질을 재는 MRR(첫 정답의 역순위 평균)과 nDCG(등급 관련도를 순위로 할인해 이상적 순위와 비교)를 Järvelin·Kekäläinen 2002 원문 정의와 직접 검산한 계산 예로 정리한다.
tags: [ux, search, metrics, information-retrieval, ndcg, mrr, relevance, evaluation]
related: [ui-ux/search-synonyms-typo-correction-ux, ui-ux/search-query-log-analysis-zero-results, ui-ux/search-filter-sort, ui-ux/korean-search-normalization-chosung-jamo, ui-ux/ab-test-statistics-srm-power-sequential, ai-patterns/hybrid-search-reranking, ai-patterns/rag-pipeline]
sources:
  - https://doi.org/10.1145/582415.582418
  - https://trec.nist.gov/data/qa.html
  - https://en.wikipedia.org/wiki/Discounted_cumulative_gain
updatedAt: 2026-11-19
---

## 문제

- 동의어 사전을 넣고 오타 교정을 켰다 → [동의어·오타 교정](/develop-wiki/knowledge/ui-ux/search-synonyms-typo-correction-ux/). 결과가 **좋아졌는지** 어떻게 아나?
- 0결과율은 "아무것도 안 나옴"만 잡는다 → [검색 로그 분석](/develop-wiki/knowledge/ui-ux/search-query-log-analysis-zero-results/). 결과는 나오지만 원하는 문서가 10위에 있는 문제는 못 잡는다.
- 클릭률은 위치 편향(위에 있으니 누름)이 섞인다. 사람이 판정한 관련도로 순위 자체를 채점하는 오프라인 지표가 필요하다.

## 해법

### 1. 준비물: 판정 세트

- 대표 쿼리 표본(로그에서 빈도·0결과·이탈 쿼리를 섞어 뽑음).
- 쿼리마다 문서별 관련도 판정. 이분(관련/무관) 또는 등급(0~3).
- 두 시스템(현재 vs 변경안)의 상위 k 결과를 같은 판정으로 채점한다.

### 2. MRR — 첫 정답이 몇 위인가

- 쿼리 하나의 점수 = `1 / 첫 정답 순위`, 상위 k 안에 정답이 없으면 0.
- MRR = 쿼리 점수의 평균. TREC-8 질의응답 트랙(1999)은 질문당 최대 5개 응답을 받아 이렇게 채점했다(NIST TREC QA 자료 페이지 기준).
- 예: 쿼리 4개의 첫 정답 순위가 1, 3, 없음, 2 → (1 + 0.333 + 0 + 0.5) / 4 = **0.458**

맞는 곳: 정답이 사실상 하나인 검색(특정 문서·상품·설정 화면 찾기, 자동완성 첫 제안). 두 번째 이후 정답과 관련도 등급은 무시한다.

### 3. DCG·nDCG 원문 정의 (Järvelin & Kekäläinen 2002)

원 논문(ACM TOIS 20(4))은 **벡터**로 정의한다. 순위 i 의 이득 `G[i]` 는 관련도 점수(예: 0~3).

- 누적 이득: `CG[1] = G[1]`, `CG[i] = CG[i−1] + G[i]`
- 할인 누적 이득(로그 밑 b): `i < b` 이면 `DCG[i] = CG[i]`, `i ≥ b` 이면 `DCG[i] = DCG[i−1] + G[i] / log_b(i)`
  - 1위는 `log_b 1 = 0` 이라 할인할 수 없고, b 보다 앞 순위는 할인하지 않는다. b 를 키우면 할인이 완만해져 "끈기 있는 사용자"를 모형화한다.
- 이상 벡터: 판정된 관련 문서 전체(검색 결과가 아니라 **해당 쿼리의 관련 문서 모음**)를 등급 내림차순으로 놓은 것.
- 정규화: 실제 (D)CG 벡터를 이상 (D)CG 벡터로 순위별로 나눈다. 1 이면 이상적, [0, 1) 이면 이상의 몇 할.

논문의 예(b=2)를 직접 계산해 검산했다.

| 순위 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G | 3 | 2 | 3 | 0 | 0 | 1 | 2 | 2 | 3 | 0 |
| DCG | 3 | 5 | 6.89 | 6.89 | 6.89 | 7.28 | 7.99 | 8.66 | 9.61 | 9.61 |
| 이상 G | 3 | 3 | 3 | 2 | 2 | 2 | 1 | 1 | 1 | 1 |
| 이상 DCG | 3 | 6 | 7.89 | 8.89 | 9.75 | 10.53 | 10.88 | 11.22 | 11.53 | 11.83 |
| nDCG | 1 | 0.83 | 0.87 | 0.78 | 0.71 | 0.69 | 0.73 | 0.77 | 0.83 | 0.81 |

- DCG 행은 논문 값과 일치한다. 이상 DCG 는 6·8위에서 논문(10.52, 11.21)과 0.01 차이가 나는데, 직접 계산한 10.528·11.217 를 반올림하느냐 자르느냐의 차이로 보인다.

### 4. 오늘 흔히 쓰는 nDCG@k

실무 라이브러리는 대개 순위 k 에서 하나의 숫자를 낸다. 할인과 이득 식이 원문과 다르다.

```ts
type Gain = (rel: number) => number;
const linear: Gain = (r) => r;
const exp2: Gain = (r) => 2 ** r - 1; // 높은 등급을 더 크게 보상
const dcg = (rels: number[], k: number, g: Gain) =>
  rels.slice(0, k).reduce((s, r, i) => s + g(r) / Math.log2(i + 2), 0); // 1위도 log2(2)=1 로 나눔

/** judged: 이 쿼리에 대해 판정된 모든 문서의 등급 (검색 결과 목록이 아님) */
function ndcgAtK(results: number[], judged: number[], k: number, g: Gain = linear) {
  const ideal = [...judged].sort((a, b) => b - a);
  const idcg = dcg(ideal, k, g);
  return idcg === 0 ? 0 : dcg(results, k, g) / idcg;
}
```

같은 결과를 세 정의로 계산(Node 실행). 판정된 문서 등급 {3, 2, 1, 1, 0, 0}, k=5.

| 결과 상위 5 | 원문(b=2) | 선형 이득 | 2^rel−1 이득 |
| --- | --- | --- | --- |
| 2, 3, 0, 1, 0 | 0.897 | 0.833 | 0.799 |
| 3, 2, 1, 0, 0 | 0.918 | 0.917 | 0.956 |

- 정의마다 숫자가 다르다. **같은 정의끼리만 비교**하고, 보고서에 이득 함수·할인·k 를 적는다.
- 지수 이득은 1위의 고관련 문서를 더 크게 보상한다. 첫 행처럼 3 등급 문서가 2위로 밀리면 더 크게 깎인다.

## 언제 쓰나

| 지표 | 맞는 상황 |
| --- | --- |
| MRR | 정답이 하나, 사용자가 첫 정답만 필요 (내비게이션 검색, 자동완성) |
| nDCG@k | 관련 문서가 여럿이고 정도 차이가 있음 (상품·문서 검색, RAG 검색 단계) |
| 0결과율·재검색률 | 판정 세트 없이 로그로 보는 보조 지표 |

- 랭킹 변경(동의어 확장, 오타 교정, 재순위화)의 오프라인 회귀 검사. 배포 전 판정 세트로 점수 하락을 막고, 배포 후 A/B 테스트로 사용자 행동을 확인한다 → [A/B 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)
- RAG 의 검색 단계 평가 → [하이브리드 검색·재순위화](/develop-wiki/knowledge/ai-patterns/hybrid-search-reranking/)

## 주의·비용

- **판정 비용.** 쿼리 수십~수백 개에 문서별 판정이 필요하다. 판정자 간 불일치가 생기므로 기준표를 만든다.
- **판정 안 된 문서.** 새 시스템이 판정 세트에 없는 문서를 올리면 보통 0점 처리돼 새 시스템이 불리해진다. 변경안 결과의 미판정 문서를 추가 판정한다.
- **이상 순위의 기준.** 원문은 쿼리의 관련 문서 모음(recall base)으로 이상 벡터를 만든다. 검색 결과 목록만 재정렬해 이상 순위로 쓰면 관련 문서를 아예 못 찾은 시스템이 만점을 받을 수 있다.
- **쿼리 평균이 가리는 것.** 평균 nDCG 가 올라도 특정 쿼리군(한글 초성·영타 쿼리 등)은 나빠질 수 있다. 쿼리 유형별로 나눠 본다 → [한글 검색 정규화](/develop-wiki/knowledge/ui-ux/korean-search-normalization-chosung-jamo/)
- MRR 은 정답 하나의 순위만 본다. 2위 이하가 엉망이어도 점수는 같다.
- 오프라인 점수 개선이 사용자 성과 개선을 보장하지 않는다. 판정 기준과 실제 의도가 다를 수 있다.

## 체크리스트

- [ ] 쿼리 표본과 관련도 등급 기준 문서화
- [ ] 지표 정의(이득·할인·k·이상 순위 기준)를 보고서에 명시
- [ ] 변경안의 미판정 문서 추가 판정
- [ ] 쿼리 유형별 분할 결과 확인

## 검증 범위

- DCG 원문 식·예시 벡터는 Järvelin & Kekäläinen(2002) PDF 본문에서 확인했다. MRR 정의는 NIST TREC QA 데이터 페이지 기준이며, TREC-8 QA 트랙 보고서 원문(Voorhees 1999)은 읽지 않았다.
- `2^rel − 1` 이득과 `log2(i+1)` 할인 형태를 처음 제안한 문헌(Burges 등 2005 로 흔히 인용)은 직접 확인하지 않았다.
- 판정 세트 규모(쿼리 수)에 대한 권고 수치는 확인하지 않아 적지 않았다.
