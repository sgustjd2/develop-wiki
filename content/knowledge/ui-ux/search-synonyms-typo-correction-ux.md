---
title: 검색 동의어·오타 교정 UX
aka: [Search Synonyms, Spelling Correction, Did You Mean, Fuzzy Matching, Edit Distance, Query Rewriting, 동의어 사전, 오타 보정]
category: ui-ux
group: interaction
level: intermediate
summary: 0건 검색의 흔한 원인인 용어 불일치와 오타를 동의어 사전과 편집 거리 기반 교정으로 줄이되, 자동 교정과 제안(Did you mean)을 어떻게 나누고 짧은 단어의 오교정을 어떻게 막는지 정리한다.
tags: [ux, search, synonyms, spelling-correction, fuzzy-matching, edit-distance, findability]
related: [ui-ux/search-query-log-analysis-zero-results, ui-ux/search-filter-sort, ui-ux/empty-states, ui-ux/combobox-autocomplete, ui-ux/korean-ime-composition-input, ui-ux/information-scent-foraging, ai-patterns/hybrid-search-reranking, ui-ux/search-quality-metrics-mrr-ndcg, ui-ux/korean-search-normalization-chosung-jamo]
sources:
  - https://norvig.com/spell-correct.html
  - https://www.elastic.co/docs/reference/elasticsearch/rest-apis/common-options
  - https://www.nngroup.com/articles/search-log-analysis/
updatedAt: 2026-11-19
---

## 문제

- 사용자는 "환불"을 찾는데 문서는 "결제 취소"라고 쓴다(용어 불일치). 혹은 "hating pad" 처럼 오타를 낸다. 둘 다 0건 또는 엉뚱한 결과로 끝난다.
- 로그에서 0결과 쿼리를 찾는 방법은 [검색 로그 분석](/develop-wiki/knowledge/ui-ux/search-query-log-analysis-zero-results/)에 있다. 이 노트는 **찾은 뒤 고치는 장치**다.
- 무조건 교정하면 틀린 교정이 생긴다. 특히 짧은 단어와 고유명사.

## 해법

### 1. 동의어와 오타는 다른 문제

| | 동의어 | 오타 교정 |
| --- | --- | --- |
| 원인 | 어휘 불일치 (정상 철자) | 철자·입력 실수 |
| 해법 | 사람이 큐레이션한 사전·질의 확장 | 편집 거리 + 사전·로그 빈도 |
| 위험 | 과확장으로 정밀도 하락, 방향성(상위어/하위어) 혼동 | 정상 어휘(브랜드)를 오교정 |
| 데이터 원천 | 0결과·재검색 로그, 고객 용어 | 쿼리 로그, 문서 어휘 |

- 벤더 문서들은 동의어를 모든 질의에, 철자 교정은 결과가 없을 때 보조로 쓰라는 식으로 나눈다(검색 결과로 확인한 벤더 문서 요약; 개별 문서는 직접 읽지 못했다). 오타 질의에 동의어를 먼저 적용하면 오류가 커지므로 교정이 먼저라는 의견도 있다.

### 2. 동의어 운영

- 0결과·저클릭 쿼리를 빈도순으로 보고 "사용자 용어 → 문서 용어" 쌍을 만든다.
- **단방향/양방향**을 구분한다. "노트북 → 랩톱" 은 양방향 가능하나 "폰 → 아이폰" 은 단방향(상위어를 하위어로 좁히면 결과가 줄어든다).
- 사전은 코드가 아니라 데이터로 두고 변경 이력·소유자·검토 주기를 둔다(필자 제안).
- 확장 결과가 적절한지 샘플로 확인한다. 동의어가 늘수록 무관한 결과가 섞인다.

### 3. 편집 거리와 임계값

- Norvig 의 단순 교정기: 단어에서 편집 한 번(삭제·전치·치환·삽입)으로 만든 후보 중 사전에 있는 것을 고르고, 여럿이면 코퍼스 빈도가 높은 것을 택한다. 길이 n 의 단어는 중복 제거 전 후보 `54n+25` 개다. 개발 세트 270개 중 3개, 최종 세트 400개 중 23개만 편집 거리 2 를 넘었다고 한다(저자 보고).
- Elasticsearch `fuzziness: AUTO` 는 길이 0~2 글자는 정확 일치, 3~5 글자는 편집 1회, 5글자 초과는 편집 2회까지 허용한다(공식 문서). 이는 **짧은 단어일수록 허용치를 줄이는** 설계다.

### 4. 짧은 단어는 왜 모호한가 (직접 실행)

macOS `/usr/share/dict/words`(Webster's 2nd 계열, 알파벳 소문자 단어 234,454개)를 사전으로, 길이별 최대 1,500 단어를 무작위 표본으로 뽑았다. 이웃 수는 편집 거리 1(삭제·전치·치환·삽입) 이내의 사전 단어 수다. 오타 실험은 임의 위치를 임의 다른 글자로 치환해, 결과가 사전 단어가 아닌 경우만 세고, 편집 거리 1 후보가 원래 단어 하나뿐인지 확인했다(빈도 가중 없음).

| 길이 | 평균 이웃 수 | 이웃이 1개 이상인 비율 | 오타에서 후보가 원 단어 하나로 확정된 비율 |
| --- | --- | --- | --- |
| 3 | 27.6 | 1.000 | 0.021 |
| 4 | 15.07 | 0.994 | 0.080 |
| 5 | 6.47 | 0.957 | 0.304 |
| 6 | 3.57 | 0.843 | 0.587 |
| 8 | 1.07 | 0.565 | 0.870 |
| 10 | 0.51 | 0.369 | 0.942 |

- 짧은 단어는 이웃이 많아, 오타가 나도 후보가 많이 남는다. 반대로 정상 단어도 쉽게 다른 단어로 오교정된다.
- 이 사전은 희귀어를 대량 포함해 실제 서비스 어휘보다 이웃이 많다. 서비스 어휘로는 수치가 다르다. 경향(짧을수록 모호)만 근거로 삼는다.
- 영어 알파벳 실험이다. 한글은 음절·자모 단위 편집 거리와 입력기 조합 특성이 다르며 이 노트는 검증하지 않았다 → [한글 IME](/develop-wiki/knowledge/ui-ux/korean-ime-composition-input/)

### 5. UX 패턴

| 상황 | 패턴 |
| --- | --- |
| 결과 0건, 교정 후보 확신 높음 | 교정 결과를 보여 주고 "○○ 검색 결과입니다. 원래 입력(△△)으로 검색" 링크 |
| 결과는 있으나 적음, 후보 있음 | 결과 위에 "혹시 ○○?" 제안 (Did you mean) |
| 후보 확신 낮음·짧은 단어 | 자동 교정 하지 않음. 제안만, 또는 0건 안내 + 대안 |
| 고유명사·브랜드·코드 | 교정 제외 목록(화이트리스트) |

- 한 UX 글(검색으로 확인, 직접 읽지 못함)은 0건이면 자동 교정, 결과가 일정 수 이하면 제안으로 나눈다. 임계값(예: 20건)은 서비스마다 달라야 하며 근거 데이터로 정해야 한다.
- 자동 교정 시 **원 입력으로 되돌리는 링크**를 항상 둔다.
- 입력 중 자동완성은 별도 패턴이다 → [콤보박스 자동완성](/develop-wiki/knowledge/ui-ux/combobox-autocomplete/)
- 0건 화면 설계 → [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/), 의미 검색과 결합 → [하이브리드 검색](/develop-wiki/knowledge/ai-patterns/hybrid-search-reranking/)

## 언제 쓰나

- 사이트 검색 0결과율이 높고 상위 0결과 쿼리가 철자·용어 불일치일 때.
- 상품·문서 검색처럼 사용자 어휘와 내부 어휘가 다른 도메인.

## 주의·비용

- **오교정 비용이 크다.** 자동 교정은 정상 쿼리를 바꿔 신뢰를 깎는다. 짧은 단어는 제안으로만.
- 동의어 사전은 시간이 지나면 낡는다. 소유자·검토 주기가 없으면 방치된다.
- 편집 거리는 의미를 모른다. "there/their" 처럼 빈도만으로 틀리는 사례가 있다(Norvig). 문맥 모델·로그 학습이 필요하면 비용이 급증한다.
- 교정 후 성과(클릭률·재검색률)를 A/B 로 확인한다. 여러 지표를 보면 [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/)을 고려한다.
- 쿼리 로그에는 개인정보가 들어 있을 수 있어 사전 수집 시 익명화한다.

## 체크리스트

- [ ] 0결과 쿼리를 빈도순으로 분류(용어 불일치 / 오타 / 콘텐츠 없음)
- [ ] 동의어 사전: 방향성·소유자·검토 주기
- [ ] 교정 허용 편집 거리를 길이별로 제한
- [ ] 자동 교정에 원 입력 복귀 링크, 브랜드·고유명사 제외
- [ ] 교정 전후 0결과율·재검색률 측정
