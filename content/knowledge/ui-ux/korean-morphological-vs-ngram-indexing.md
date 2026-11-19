---
title: 한글 형태소 분석 vs n-gram 색인 (Elasticsearch·OpenSearch nori, ngram tokenizer)
aka: [Korean Morphological Analysis vs N-gram, nori analyzer, nori_tokenizer, decompound_mode, ngram tokenizer, mecab-ko-dic, 한국어 검색 색인, 형태소 분석기]
category: ui-ux
group: interaction
level: advanced
summary: 한국어 검색 색인을 nori 형태소 분석(사전 기반 분해·품사 필터)으로 할지 n-gram 으로 할지, Elasticsearch 공식 문서·Lucene 소스로 확인한 설정과 직접 계산한 토큰 예로 재현율·정밀도·색인 크기·운영 비용을 비교한다.
tags: [ux, search, korean, elasticsearch, opensearch, nori, ngram, tokenizer, morphological-analysis, i18n]
related: [ui-ux/korean-search-normalization-chosung-jamo, ui-ux/search-relevance-judgments-interleaving, ui-ux/search-quality-metrics-mrr-ndcg, ui-ux/search-synonyms-typo-correction-ux, ui-ux/search-query-log-analysis-zero-results, ui-ux/combobox-autocomplete, ai-patterns/hybrid-search-reranking]
sources:
  - https://www.elastic.co/docs/reference/elasticsearch/plugins/analysis-nori
  - https://www.elastic.co/docs/reference/elasticsearch/plugins/analysis-nori-analyzer
  - https://www.elastic.co/docs/reference/elasticsearch/plugins/analysis-nori-tokenizer
  - https://www.elastic.co/docs/reference/elasticsearch/plugins/analysis-nori-speech
  - https://github.com/apache/lucene/blob/main/lucene/analysis/nori/src/java/org/apache/lucene/analysis/ko/KoreanPartOfSpeechStopFilter.java
  - https://www.elastic.co/docs/reference/text-analysis/analysis-ngram-tokenizer
  - https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules
  - https://docs.opensearch.org/latest/install-and-configure/additional-plugins/index/
updatedAt: 2026-11-19
---

입력 단계 정규화(초성, 영타, NFC)는 [한글 검색 정규화](/develop-wiki/knowledge/ui-ux/korean-search-normalization-chosung-jamo/)에 있다. 이 노트는 그다음 단계, **색인을 어떤 단위로 쪼갤지**를 다룬다. 결과 비교는 [판정 세트·인터리빙](/develop-wiki/knowledge/ui-ux/search-relevance-judgments-interleaving/)으로 측정한다.

## 문제

- 한국어는 조사·어미가 붙고(`서비스센터에서`), 복합어를 띄어 쓰지 않는다(`삼성전자서비스센터`). 공백 기준 토큰화로는 `서비스` 를 쳐도 `서비스센터에서` 가 안 나온다.
- 해결책은 크게 둘이다. 사전으로 형태소를 분해하는 nori, 글자 단위로 겹쳐 자르는 n-gram. 각각 놓치는 것과 잘못 찾는 것이 다르다.

## 해법

### 1. nori (형태소 분석)

- Lucene nori 모듈을 붙인 플러그인. 기본 사전은 mecab-ko-dic. Elasticsearch 는 `bin/elasticsearch-plugin install analysis-nori` 로 모든 노드에 설치하고 재시작한다. OpenSearch 추가 플러그인 표에도 `analysis-nori`(최초 1.0.0)가 있다.
- `nori` 분석기 = `nori_tokenizer` + `nori_part_of_speech` + `nori_readingform`(한자→한글) + `lowercase`.
- `decompound_mode`(복합어 처리, 기본 `discard`):

| 값 | `가곡역` 결과 |
| --- | --- |
| `none` | 가곡역 |
| `discard` (기본) | 가곡, 역 |
| `mixed` | 가곡역, 가곡, 역 |

- 사용자 사전: `user_dictionary` 파일 또는 `user_dictionary_rules: ["c++", "세종", "세종시 세종 시"]` 처럼 인라인. 둘째 이후 토큰은 복합어 분해 지정. 문서 예에서 `세종시` 는 세종시(positionLength 2)·세종·시로 나온다.
- `nori_part_of_speech` 기본 제거 품사(Lucene `DEFAULT_STOP_TAGS`): 어미(EP·EF·EC·ETN·ETM), 조사(JKS·JKC·JKG·JKO·JKB·JKV·JKQ·JX·JC), 감탄사 IC, 부사 MAG·MAJ, 관형사 MM, 일부 기호(SP·SSC·SSO·SC·SE), 접두·접미사(XPN·XSA·XSN·XSV), 분석 불가 UNA·NA, VSV.
- 문서 경고: 접두사 XPN 이 기본 제거 대상이라 `비급여` 가 `급여` 로 색인된다. 전체 단어를 지키려면 사용자 사전에 넣거나, 접두사를 전체적으로 남기려면 XPN 을 뺀 `stoptags` 를 직접 지정한다(문서). → (필자 해석) 의미가 반대인 결과가 섞일 수 있다.

### 2. n-gram

- `ngram` 토크나이저 기본값 `min_gram` 1, `max_gram` 2. 두 값 차이는 색인 설정 `index.max_ngram_diff`(기본 1)를 넘을 수 없다. 문서는 두 값을 같게 두는 것을 권하고 3-gram 을 출발점으로 제시한다.
- 토큰 예(ES 문서의 동작대로 직접 구현해 계산, ES 에서 실행하지 않음):

| 입력 | 설정 | 토큰 |
| --- | --- | --- |
| 갤럭시탭 | 1~2 (기본) | 갤 갤럭 럭 럭시 시 시탭 탭 (7개) |
| 갤럭시탭 | 2 | 갤럭 럭시 시탭 |
| 삼성전자서비스센터 | 2 | 삼성 성전 전자 **자서** 서비 비스 스센 센터 |
| 삼성전자서비스센터 | 3 | 삼성전 성전자 전자서 자서비 서비스 비스센 스센터 |

- 오탐 예: 2-gram 색인에서 `자서전` 을 OR 로 찾으면 `자서` 가 겹쳐 `삼성전자서비스센터` 가 걸린다. 경계를 넘는 무의미한 gram(`자서`, `스센`)이 원인이다.

### 3. 비교

| 기준 | nori | n-gram |
| --- | --- | --- |
| 조사·어미 붙은 단어 | 분리해 찾음 | 부분 문자열이라 찾음 |
| 사전에 없는 신조어·상품명 | 잘못 분해하거나 통째로 남음 → 사용자 사전 필요 | 찾음 |
| 단어 경계 오탐 | 적음 | 많음 (위 `자서` 예) |
| 짧은 쿼리 (1~2글자) | 형태소 단위로 매칭 | gram 길이보다 짧으면 못 찾거나(min 3) 과다 매칭(min 1) |
| 색인 크기 | 작음 | 큼 (글자 수만큼 토큰) |
| 운영 | 사전 관리·플러그인 버전 맞춤 | 설정 단순 |
| 순위 품질 | 형태소 단위 점수 | gram 겹침 수에 좌우 |

### 4. 함께 쓰는 구성 (필자 제안)

- 같은 텍스트를 두 필드로 색인: `title.nori`(주 점수) + `title.ngram`(재현율 보완, 낮은 가중치). `multi_match` 로 합친다.
- 자동완성은 접두어 전용(edge n-gram 등)으로 분리한다. 이 노트에서 edge n-gram 문서는 읽지 않았다 → [콤보박스·자동완성](/develop-wiki/knowledge/ui-ux/combobox-autocomplete/)
- 0결과 쿼리 로그를 주기적으로 보고 사용자 사전에 추가한다 → [검색 로그 분석](/develop-wiki/knowledge/ui-ux/search-query-log-analysis-zero-results/)

## 언제 쓰나

- **nori 중심:** 문서·기사·상품 설명처럼 문장이 긴 본문, 정밀도가 중요한 검색.
- **n-gram 중심 또는 보조:** 상품명·모델명·고유명사가 많고 사전 관리 인력이 없을 때, 부분 일치가 기대되는 필드(코드, 주소 일부).
- 어느 쪽이든 바꾸기 전후를 같은 판정 세트로 nDCG 를 비교해 결정한다.

## 주의·비용

- 분석기 변경은 **재색인**이 필요하다. 별칭(alias)으로 새 색인을 만들어 교체하는 절차를 미리 둔다.
- 색인 분석기와 검색 분석기가 다르면 매칭이 깨진다. n-gram 필드는 쿼리 쪽도 같은 gram 으로 자를지, 형태소로 자를지 명시한다.
- nori 기본 품사 필터는 부사·관형사·접두사를 지운다. `안`, `못`, `비-`, `무-` 같은 부정 표현이 사라져 반대 의미 문서가 함께 나올 수 있다(위 `비급여` 경고와 같은 구조에서 필자가 추론한 것이며 실행해 확인하지 않았다).
- mecab-ko-dic 사전 갱신 주기·버전은 이 노트에서 확인하지 않았다. 플러그인 버전은 Elasticsearch·OpenSearch 버전과 맞아야 한다.
- 초성·영타 쿼리는 형태소 분석기가 처리하지 못한다. 정규화 단계에서 따로 다룬다.

## 검증 범위

- 확인함: 설치·분석기 구성·`decompound_mode` 값과 예·사용자 사전 형식·`비급여` 경고는 Elastic 공식 문서(2026-11-19 열람). 기본 제거 품사 목록은 Lucene main 브랜치 소스(ES 문서 요약 페이지에는 일부만 보였음). `ngram` 기본값·권고와 `index.max_ngram_diff` 기본값 1 은 Elastic 문서. OpenSearch 의 플러그인 존재는 추가 플러그인 표.
- 확인 못 함: nori·ngram 을 실제 Elasticsearch/OpenSearch 에서 실행한 출력(Java·클러스터 없음 — 표 2 는 문서 규칙대로 직접 구현해 계산), `삼성전자서비스센터` 등의 nori 분해 결과, OpenSearch nori 세부 문서, 두 방식의 검색 품질·색인 크기 실측.
