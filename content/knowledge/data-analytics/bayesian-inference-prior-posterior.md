---
title: 베이지안 추론 — 사전·가능도·사후분포 (Bayesian Inference)
aka: [Bayes' Theorem, Prior, Likelihood, Posterior, Conjugate Prior, Beta-Binomial, Credible Interval, MAP, Posterior Predictive, 베이즈 추론, 신용구간]
category: data-analytics
group: statistics
level: intermediate
summary: 베이즈 정리로 사전분포를 자료로 갱신해 사후분포를 얻는 과정, 베타-이항 켤레 예 직접 계산, 신뢰구간과 신용구간의 해석 차이, MAP·사후 예측의 개념을 정리한다.
tags: [statistics, bayesian, bayes-theorem, prior, posterior, conjugate-prior, beta-binomial, credible-interval, map, posterior-predictive]
related: [data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/descriptive-statistics-probability-distributions, data-analytics/categorical-data-contingency-chi-square, machine-learning/naive-bayes-bayes-theorem, ui-ux/ab-test-statistics-srm-power-sequential]
sources:
  - https://allendowney.github.io/ThinkBayes2/chap01.html
  - https://allendowney.github.io/ThinkBayes2/chap04.html
  - https://allendowney.github.io/ThinkBayes2/chap18.html
  - https://en.wikipedia.org/wiki/Credible_interval
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.beta.html
  - https://sites.stat.columbia.edu/gelman/book/
updatedAt: 2026-11-23
---

## 개요

- 빈도주의 추론은 모수를 고정된 미지의 상수로 보고 "표본을 반복해서 뽑으면 어떻게 되는가"로 말한다. **베이지안 추론**은 모수에 대한 불확실성을 **확률분포**로 표현하고, 자료를 본 뒤 그 분포를 갱신한다.
- 결과는 사후분포 하나다. 점추정, 구간, 예측, 가설 비교가 모두 사후분포에서 나온다.
- 사전분포를 어떻게 정하는지가 결과에 영향을 주는 것이 가장 큰 쟁점이자 도구다. 자료가 많으면 서로 다른 사전분포도 비슷한 사후로 모인다(Think Bayes 4장의 균등·삼각 사전 비교).

## 시험 범위 대응

- 빅데이터분석기사 3과목 "고급 분석기법 – 베이지안 기법"에 대응한다(공식 출제범위 항목명).
- 베이즈 정리를 분류에 쓰는 나이브 베이즈는 공식 출제범위의 항목명에 직접 나오지 않는다. 이 노트는 모수 추론 쪽이다 → [나이브 베이즈](/develop-wiki/knowledge/machine-learning/naive-bayes-bayes-theorem/).
- 켤레 사전·MAP 등 세부 용어의 시험 포함 여부는 확인되지 않았다(미확인).

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 사전분포 | prior | 자료를 보기 전 모수에 대한 믿음의 분포 P(θ) |
| 가능도 | likelihood | 모수 θ 를 고정했을 때 관측 자료가 나올 확률 P(D\|θ). θ 의 함수로 본다 |
| 사후분포 | posterior | 자료를 본 뒤 모수의 분포 P(θ\|D) |
| 주변가능도(증거) | marginal likelihood / evidence | P(D) = ΣP(D\|θ)P(θ) (연속이면 적분). 사후를 합이 1 이 되게 하는 정규화 상수 |
| 켤레 사전분포 | conjugate prior | 사후가 사전과 같은 분포족이 되는 사전. 갱신이 모수 덧셈이 된다 |
| 신용구간 | credible interval | 사후분포에서 모수가 들어갈 확률이 지정 수준인 구간 |
| MAP | maximum a posteriori | 사후분포의 최빈값(최댓값 위치) |
| 사후 예측분포 | posterior predictive | 사후를 반영해 새 관측값이 어떻게 나올지의 분포 |

## 베이즈 정리

P(A|B) = P(A)·P(B|A) / P(B). P(B) 는 전확률의 법칙으로 ΣP(Bᵢ)P(A|Bᵢ)(Think Bayes 1장). 모수 추론으로 옮기면:

**사후 ∝ 사전 × 가능도**, 즉 P(θ|D) = P(θ)P(D|θ) / P(D).

- P(D) 는 θ 에 의존하지 않으므로 모양만 볼 때는 "사전 × 가능도"를 정규화하면 된다.

### 직접 계산: 진단 검사

유병률 1%, 민감도 90%, 특이도 95% 인 검사에서 양성일 때 실제 환자일 확률 = 0.01·0.9 / (0.01·0.9 + 0.99·0.05) = **0.154**. 사전(유병률)이 낮으면 양성이어도 사후가 낮다. 수치는 필자 가정 예이며 위 식으로 직접 계산했다.

## 켤레 사전분포: 베타-이항

- 성공확률 p 에 사전 Beta(α, β), 자료는 n 번 중 k 번 성공(이항 가능도)이면 사후는 **Beta(α+k, β+n−k)**. 갱신이 "성공 수는 α 에, 실패 수는 β 에 더하기"다(Think Bayes 18장). Beta(1,1)은 균등분포다. 베타 밀도: f(x) = Γ(a+b) x^(a−1) (1−x)^(b−1) / (Γ(a)Γ(b)) (scipy).
- 사후 평균 (α+k)/(α+β+n), 최빈값(MAP) (α+k−1)/(α+β+n−2). 이 두 식은 표준 공식이며 아래 수치로 확인했다.
- 켤레는 풀기 쉬운 몇 가지 경우에 한정된다. 그 밖의 모형은 격자 근사나 MCMC 가 필요하다(Think Bayes 18장도 켤레의 한계를 지적).
- 다른 켤레 쌍(Think Bayes 18장): 감마-포아송(사후 Gamma(α+k, β+t)), 디리클레-다항.

### 직접 계산: 20 번 중 7 번 성공

| 사전 | 사후 | 평균 | MAP | 95% 신용구간(등꼬리) |
| --- | --- | --- | --- | --- |
| Beta(1,1) 균등 | Beta(8, 14) | 0.3636 | 0.35 | [0.181, 0.570] |
| Beta(10,10) (0.5 쪽으로 강함) | Beta(17, 23) | 0.425 | | [0.278, 0.579] |

- 사후 표준편차(균등 사전)는 0.100. MLE k/n = 0.35 와 균등 사전의 MAP 는 같다(사전이 평평하면 MAP = MLE).
- 사전이 0.5 로 강하면 사후 평균이 0.364 → 0.425 로 끌려간다. 자료 20 개로는 사전의 영향이 남는다.
- 격자(0~1 을 100,001 점으로 나눠 사전×가능도 정규화)로 직접 구한 평균 0.3636, 최댓값 위치 0.35 가 켤레 공식과 일치했다.

## 신뢰구간 vs 신용구간

| 구분 | 빈도주의 신뢰구간 | 베이지안 신용구간 |
| --- | --- | --- |
| 무엇이 확률적인가 | 구간의 끝점(표본마다 달라짐), 모수는 고정 | 모수(사후분포), 끝점은 고정 |
| 95% 의 뜻 | 같은 절차를 반복했을 때 약 95% 의 구간이 참값 포함 | 관측 자료와 사전 하에서 모수가 구간에 있을 확률이 95% |
| 사전분포 | 쓰지 않음 | 필요 |
| 종류 | Wald, Wilson, Clopper–Pearson 등 | 등꼬리(equal-tailed), 최고사후밀도(HPD, 가장 짧은 구간) |

(요약 근거: Wikipedia credible interval. 이 둘이 일치하는 것으로 알려진 대표 경우는 위치 모수와 평평한 사전이다.)

### 직접 계산: 같은 자료(7/20)의 구간들

| 방법 | 95% 구간 |
| --- | --- |
| Clopper–Pearson(정확, `binomtest.proportion_ci`) | [0.154, 0.592] |
| Wilson | [0.181, 0.567] |
| 베이지안 균등 사전 등꼬리 | [0.181, 0.570] |

- 균등 사전 신용구간이 Wilson 구간과 비슷하고, 정확 구간이 더 넓다.
- p=0.1, n=20 에서 20,000 번 시뮬레이션한 **빈도주의 포함률**: Clopper–Pearson 0.9888, 균등 사전 신용구간 0.9573(seed 5). 신용구간도 빈도 성질을 계산할 수 있으나 신용수준과 같지 않을 수 있다(특정 p 한 점의 값일 뿐이며 p 에 따라 달라진다).
- HPD 구간은 직접 계산하지 않았다.

## 사후 예측

새 관측값의 분포는 θ 에 대해 사후로 평균낸 것: P(ỹ|D) = ∫P(ỹ|θ)P(θ|D)dθ. 베타-이항에서는 **베타-이항분포**가 된다.

- 위 사후 Beta(8,14)로 다음 10 번 시행의 성공 수: 기대값 3.64, P(성공 5번) = 0.153 (scipy `betabinom`).
- 점추정 p̂=0.35 를 그대로 넣은 B(10, 0.35)는 모수 불확실성을 무시한다. 사후 예측은 불확실성을 반영해 더 퍼진 분포를 준다(분산 비교는 계산하지 않음).

## 언제 쓰나 / 주의

- 사전 정보가 있고 표본이 작을 때, 매 시점 갱신해야 할 때(A/B 테스트 순차 관측), 모수에 대한 확률적 서술이 필요할 때 쓴다 → [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)
- 사전분포를 반드시 공개하고, 사전을 바꿔 보는 민감도 분석을 한다. 자료가 적으면 결과가 사전에 좌우된다.
- "사전을 모른다"고 균등 분포가 중립인 것은 아니다(모수 변환에 따라 달라짐). 이 주장의 출처는 읽지 못했다(미확인).
- 베이지안은 "p-값이 없다"가 아니라 질문이 다르다. H₀ 의 사후확률을 구하려면 사전확률이 필요하다 → [p-값과 오해](/develop-wiki/knowledge/data-analytics/estimation-hypothesis-testing-errors-pvalue/)
- 계산 비용: 켤레 밖에서는 MCMC·근사 추론이 필요하다. 이 노트는 해석적으로 풀리는 경우만 다룬다.

## 검증 범위

- Think Bayes 2 판 1·4·18 장(베이즈 정리, 격자 갱신과 사전 민감도, 켤레 갱신), Wikipedia credible interval, scipy beta 문서, Gelman 홈페이지(BDA3 무료 PDF 안내)를 읽었다.
- BDA3 본문 PDF 는 크기 제한(10MB 초과)으로 가져오지 못해 **읽지 못했다**. McElreath 도 읽지 않았다. 따라서 BDA3 의 정의·표기와 대조하지 않았고, 신용구간 vs 신뢰구간은 Wikipedia(보조) 수준의 근거다.
- Beta 평균·MAP 식, 베타-이항 예측분포, scipy `betabinom` 문서는 읽지 않고 값만 직접 계산으로 확인했다. 베타-이항 사후 공식은 Think Bayes 18 장을 근거로 했다.
- 수치는 Python 3.15.0, scipy 1.18.1 로 직접 계산(스크래치 `w3/e.py`). 포함률 시뮬레이션만 seed 5 의존이고 나머지는 결정적.
