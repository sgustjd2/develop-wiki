---
title: 텍스트 마이닝 — 토큰화·BoW·TF-IDF·토픽 모델
aka: [Text Mining, Tokenization, Bag of Words, BoW, TF-IDF, n-gram, LDA, Word2Vec, Cosine Similarity, 텍스트 분석]
category: machine-learning
group: unstructured
level: intermediate
summary: 텍스트를 수집·전처리·토큰화해 벡터로 바꾸는 절차와 BoW·TF-IDF(정의 식과 scikit-learn 의 smooth idf·L2 정규화 차이)·n-gram·코사인 유사도·LDA·Word2Vec 개념을 직접 계산으로 확인해 정리한다.
tags: [text-mining, nlp, tf-idf, bag-of-words, ngram, lda, word2vec, cosine-similarity, unstructured]
related: [ui-ux/korean-morphological-vs-ngram-indexing, machine-learning/naive-bayes-bayes-theorem, machine-learning/clustering-kmeans-hierarchical-dbscan, machine-learning/social-network-analysis-centrality, ai-patterns/hybrid-search-reranking, machine-learning/deep-learning-architectures-cnn-rnn-transformer-terms]
sources:
  - https://scikit-learn.org/stable/modules/feature_extraction.html#the-bag-of-words-representation
  - https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting
  - https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html
  - https://scikit-learn.org/stable/modules/metrics.html#cosine-similarity
  - https://scikit-learn.org/stable/modules/decomposition.html#latentdirichletallocation
  - https://www.jmlr.org/papers/v3/blei03a.html
  - https://arxiv.org/abs/1301.3781
  - https://arxiv.org/abs/1310.4546
  - https://en.wikipedia.org/wiki/Text_mining
updatedAt: 2026-11-23
---

## 개요

텍스트 마이닝은 문서처럼 구조가 없는 글에서 정보를 뽑는 분석이다. 핵심은 글을 **숫자 벡터로 바꾸는 단계**다. 가장 단순한 표현인 BoW(단어 가방)는 어순을 버리고 단어 등장 횟수만 세며, TF-IDF 는 여러 문서에 흔한 단어의 비중을 낮춘다. 그 위에서 분류·군집·유사도·토픽 추출·감성 분석을 한다. 한국어는 띄어쓰기 단위와 형태소가 달라 토큰화가 따로 중요하다 → [한글 형태소 분석 vs n-gram](/develop-wiki/knowledge/ui-ux/korean-morphological-vs-ngram-indexing/).

## 시험 범위 대응

ADP 데이터분석 "비정형 데이터 마이닝 → 텍스트 마이닝", 빅데이터분석기사 3과목 "고급 분석기법 → 비정형 데이터 분석", 2과목 "비정형 데이터 탐색" 에 대응한다. 사회연결망 분석은 [별도 노트](/develop-wiki/knowledge/machine-learning/social-network-analysis-centrality/).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 말뭉치 | corpus | 분석 대상 문서 전체 |
| 토큰화 | tokenization | 문자열을 분석 단위(단어·형태소·문자 n-gram)로 나누는 일 |
| 불용어 | stop word | "the", "and" 처럼 흔해 의미가 적다고 가정해 제거하는 단어 |
| 어간 추출 | stemming | 접사를 규칙으로 잘라 어간만 남기는 처리. 결과가 실제 단어가 아닐 수 있다 |
| 표제어 추출 | lemmatization | 단어를 사전 기본형으로 되돌리는 처리 |
| 단어 가방 | bag of words (BoW) | 어순을 무시하고 문서를 단어별 빈도 벡터로 표현 |
| 문서-단어 행렬 | document-term matrix (DTM) | 행=문서, 열=단어, 값=빈도(또는 가중치)인 행렬 |
| 단어 빈도 | term frequency (tf) | 문서 d 에서 단어 t 가 나온 횟수 |
| 문서 빈도 | document frequency (df) | 단어 t 가 나온 문서 수 |
| 역문서 빈도 | inverse document frequency (idf) | df 가 클수록 작아지는 가중치. 흔한 단어를 눌러 준다 |
| n-gram | n-gram | 연속한 n 개 토큰(단어 또는 문자) |
| 코사인 유사도 | cosine similarity | 두 벡터의 L2 정규화 내적. 각도의 코사인 |
| 토픽 모델 | topic model | 문서 모음에 숨은 주제를 찾는 확률 모형 |
| 단어 임베딩 | word embedding | 단어를 연속 값의 밀집 벡터로 표현 |

수험서마다 "문서 빈도" 대신 "단어 문서 빈도", TF-IDF 를 "TF×IDF 가중치"로 부르는 식의 표기 차이가 있다. 이 노트는 위 표를 기준으로 쓴다.

## 분석 절차

(일반적 절차이며 수험서·실무에 따라 단계 이름이 다르다.)

1. **수집**: 웹·SNS·문서·로그. 저작권·개인정보 확인.
2. **전처리**: 소문자화, 특수문자·HTML 제거, 정규화.
3. **토큰화**: 단어·형태소·n-gram 으로 분리. scikit-learn 기본은 `\b\w\w+\b` 로 2자 이상만 남기고 구두점은 구분자이므로 한 글자 토큰("a", "I")이 조용히 사라진다.
4. **불용어 제거·어간/표제어**: 불용어 목록은 과제마다 달라야 한다. scikit-learn 문서는 영어 내장 목록에 "computer" 같은 정보성 단어가 있을 수 있고, 문체·성향 분류에서는 오히려 불용어가 단서라고 경고한다.
5. **벡터화**: BoW → TF-IDF 또는 임베딩.
6. **분석**: 분류(→ [나이브 베이즈](/develop-wiki/knowledge/machine-learning/naive-bayes-bayes-theorem/)), 군집(→ [군집분석](/develop-wiki/knowledge/machine-learning/clustering-kmeans-hierarchical-dbscan/)), 유사도, 토픽, 감성.

stemming 과 lemmatization 은 일반적 정의로 적었으며, 공개 1차 출처(Manning IR 책 2장)는 접속이 되지 않아 확인하지 못했다.

## BoW 와 n-gram

- BoW 는 토큰화 → 횟수 세기 → 흔한 토큰의 영향 줄이기(가중치)의 세 단계다(scikit-learn 문서). 문서 수 × 어휘 수의 희소 행렬이 되며 99% 이상이 0 인 경우가 흔해 희소 형식으로 저장한다.
- 어순이 사라진다: "this is the first document" 와 "is this the first document" 는 유니그램 BoW 에서 같다. **바이그램**을 쓰면 일부 국소 순서가 남지만 어휘가 크게 늘어난다.
- 문자 n-gram 은 오타·어형 변화에 더 강하다(scikit-learn 문서의 예: "words" 와 "wprds" 는 문자 2-gram 8 개 중 4 개 공유).

## TF-IDF

**정의.** `tfidf(t, d) = tf(t, d) × idf(t)`. 한 단어가 한 문서에서 자주 나오고(tf 큼) 전체 문서 중 일부에만 나오면(idf 큼) 가중치가 커진다.

**idf 의 변형.** 같은 이름이라도 구현이 다르다(scikit-learn 문서 기준, n=문서 수).

| 이름 | 식 | 비고 |
| --- | --- | --- |
| 교과서형 | `log(n / (1 + df))` (scikit-learn 문서가 "textbook notation" 으로 소개) | 책마다 `log(n/df)` 등 변형이 있고 원문(IR 책 6장)은 읽지 못했다 |
| scikit-learn `smooth_idf=False` | `log(n / df) + 1` | 모든 문서에 나오면 idf = 1 |
| scikit-learn `smooth_idf=True`(기본) | `log((1 + n) / (1 + df)) + 1` | 모든 단어가 한 번씩 든 가상 문서를 더한 효과, 0 나눗셈 방지 |

- scikit-learn 의 "+1" 때문에 모든 문서에 나오는 단어도 가중치가 0 이 아니라 1 이다.
- 기본값은 각 문서 행을 **L2 정규화**(`norm='l2'`)한다. 그래서 같은 문서라도 정규화 전후 값이 다르다.
- (TfidfVectorizer API 문서) `sublinear_tf=True` 는 tf 를 `1 + log(tf)` 로 바꾼다(기본 False).
- 손으로 계산한 "교과서" 값과 scikit-learn 출력이 안 맞는 가장 흔한 이유가 위 세 가지(idf 식, +1, L2)다.

## 코사인 유사도

`cos(x, y) = x·y / (‖x‖‖y‖)`. 문서 길이에 덜 민감하다. TF-IDF 벡터가 이미 L2 정규화되어 있으면 내적과 같다(scikit-learn 문서: `cosine_similarity` 는 `linear_kernel` 과 동일하지만 더 느림). 값은 0(공통 단어 없음)에서 1(방향 동일), 음수 없는 빈도 벡터에서는 음수가 나오지 않는다.

## 토픽 모델·임베딩 개념

- **LDA**(Blei, Ng, Jordan 2003, JMLR): 문서 모음의 생성 확률 모형. 각 문서를 여러 토픽의 혼합, 각 토픽을 단어 분포로 본다(3단계 계층 베이즈). scikit-learn 구현의 생성 과정: 토픽별 단어 분포 ~ Dirichlet(η), 문서별 토픽 비율 ~ Dirichlet(α), 단어마다 토픽 추출 후 단어 추출. 사후분포는 계산이 어려워 변분 베이즈로 근사한다. `components_` 가 토픽-단어, `transform` 이 문서-토픽 행렬이다. 입력은 단어 **횟수**가 자연스럽다(scikit-learn 페이지는 명시하지 않음 — 확인 못 함). 토픽 수 K 는 사람이 정한다.
- **Word2Vec**(Mikolov 등 2013, arXiv 1301.3781; 1310.4546 에서 skip-gram 확장·부표본·네거티브 샘플링): 대규모 말뭉치에서 단어의 연속 벡터 표현을 효율적으로 학습. 의미가 비슷한 단어가 가까운 벡터를 갖도록 학습된다는 점이 BoW(단어마다 독립 차원)와 다르다. 두 논문 초록만 읽었다.
- **감성 분석**: 글의 주관적 의견·감정(긍·부정)을 추정(Wikipedia 보조 확인). 사전 기반과 지도학습 분류기 방식이 있다는 구분은 일반적 설명이며 이 노트에서 1차 출처로 확인하지 않았다.

## 직접 계산

Python 3.15, scikit-learn 1.9.1, numpy 2.5.5. 문서 3개("the cat sat on the mat", "the dog sat on the log", "cats and dogs are pets"), n=3.

- 위 식으로 손(numpy) 계산한 TF-IDF 가 `TfidfVectorizer` 와 일치: `smooth_idf=True` 최대 절댓값 차 5.6e-17, `False` 0.0.
- 문서 1 의 가중치: 교과서형(`tf × ln(n/df)`, 정규화 없음. 위 표에서 sklearn 문서가 'textbook notation' 으로 소개한 `ln(n/(1+df))` 과는 다른 식이다) cat 1.099, the 0.811. scikit-learn 기본(smooth+L2): cat 0.428, the 0.650. 같은 문서·같은 단어라도 값이 완전히 다르다.
- scikit-learn 문서의 예제 첫 행을 재현: `smooth_idf=False` → [0.8194, 0, 0.5732], 기본 → [0.8515, 0, 0.5243].
- 코사인 유사도: 문서 1·2 = 0.6344, 문서 3 과는 0(공통 단어 없음; "cat"/"cats" 는 서로 다른 단어로 취급되어 어간 추출이 필요함을 보여 준다). 손 계산(정규화 벡터의 내적)과 `cosine_similarity` 일치.
- `TfidfVectorizer` 기본으로 "A cat sat on a mat" 를 학습하면 어휘가 [cat, mat, on, sat] 뿐(한 글자 "a" 제외). `ngram_range=(1,2)` 로 "the cat sat" 은 5 개 특성(the, cat, sat, the cat, cat sat).
- LDA·Word2Vec 은 실행하지 않았다.

## 언제 쓰나 / 주의

- TF-IDF + 선형 모형은 소규모 말뭉치 분류·검색 순위의 기본 후보다. 의미(동의어·문맥)는 반영하지 못하므로 필요하면 임베딩 → [하이브리드 검색](/develop-wiki/knowledge/ai-patterns/hybrid-search-reranking/).
- 학습 말뭉치로 구한 idf·어휘를 새 문서에 그대로 적용해야 한다(fit 은 훈련 데이터에만 — [데이터 누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)).
- 불용어·토큰 규칙은 언어·과제마다 달라야 한다. 한국어는 형태소 분석기 선택이 결과를 좌우한다.
- 어휘가 크면 차원이 커진다. `min_df`/`max_df` 로 희귀·초흔한 단어를 거르는 방법이 있다(TfidfVectorizer API 문서가 `max_df` 로 불용어 후보를 자동 탐지할 수 있다고 언급).
- LDA 토픽은 사람이 해석해 이름을 붙여야 하며 K 와 난수 초기값에 따라 달라진다.

## 검증 범위

- scikit-learn 사용자 가이드(BoW, TF-IDF), `TfidfVectorizer`·코사인 유사도·LDA 문서, JMLR LDA 초록, arXiv Word2Vec 초록 2건, Wikipedia(보조)를 읽었다.
- **읽지 못함**: Manning *Introduction to Information Retrieval* 6장(서버 접속 실패 — 교과서 idf 식·벡터 공간 모형의 원문 정의는 미확인), LDA·Word2Vec 본문, stemming/lemmatization 의 1차 출처, 감성 분석 방법론 출처.
- 실행한 것: TF-IDF·코사인·n-gram·토큰 패턴(수식 일치 확인). 실행 안 함: LDA, Word2Vec, 감성 분석, 한국어 형태소 분석.
