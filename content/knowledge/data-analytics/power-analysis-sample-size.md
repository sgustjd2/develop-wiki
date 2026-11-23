---
title: 검정력 분석과 표본 크기 (Power Analysis & Sample Size)
aka: [Power Analysis, Sample Size Determination, Effect Size, Cohen's d, Minimum Detectable Effect, Post hoc Power, 검정력 분석, 표본 수 산정]
category: data-analytics
group: statistics
level: intermediate
summary: α·검정력(1−β)·효과 크기·표본 크기 중 셋을 정하면 나머지가 정해지는 관계를 해석해와 모의실험으로 계산하고, Cohen 0.2/0.5/0.8 이 관례인 이유와 사후 검정력 분석의 한계를 정리한다.
tags: [statistics, power-analysis, sample-size, effect-size, cohen-d, type-2-error, statsmodels]
related: [data-analytics/estimation-hypothesis-testing-errors-pvalue, data-analytics/t-test-anova-f-test, data-analytics/bootstrap-permutation-test, data-analytics/shapiro-wilk-normality-test-qq-plot, ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/usability-testing-sample-size, ui-ux/multiple-comparison-correction-bonferroni-holm-bh]
sources:
  - https://www.itl.nist.gov/div898/handbook/prc/section2/prc222.htm
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.power.TTestIndPower.html
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.power.TTestIndPower.solve_power.html
  - https://www.statsmodels.org/stable/generated/statsmodels.stats.power.NormalIndPower.html
  - https://bpb-us-w2.wpmucdn.com/sites.gsu.edu/dist/2/9558/files/2023/03/Cohen-on-small-medium-and-large-effect-sizes.pdf
  - https://en.wikipedia.org/wiki/Effect_size
  - https://ideas.repec.org/a/bes/amstat/v55y2001mfebruaryp19-24.html
updatedAt: 2026-11-23
---

## 개요

- 검정력 분석은 **자료를 모으기 전에** "이 크기의 효과가 실제로 있다면 내 검정이 그것을 잡아낼 확률"을 계산하는 일이다. 가장 흔한 용도는 필요한 표본 크기를 정하는 것이다.
- 오류와 검정력의 정의, p-값의 의미는 [추정·검정·p-값](/develop-wiki/knowledge/data-analytics/estimation-hypothesis-testing-errors-pvalue/)에서 다뤘다. 이 노트는 거기서 한 줄로 지나간 검정력을 **네 양의 관계, 계산 방법, 효과 크기 선택, 한계**로 확장한다.
- 이 노트의 계산은 모두 직접 실행한 값이다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 유의수준 | α (significance level) | 귀무가설이 참일 때 기각할 확률(제1종 오류율). statsmodels 문서: 참인 귀무가설을 잘못 기각할 확률 |
| 제2종 오류율 | β | 대립가설이 참인데 기각하지 못할 확률 |
| 검정력 | power = 1−β | 대립가설이 참일 때 귀무가설을 기각할 확률 |
| 표준화 효과 크기 | standardized effect size | 평균 차이를 표준편차로 나눈 값. statsmodels `TTestIndPower` 의 `effect_size`(양수여야 함) |
| Cohen's d | Cohen's d | 두 평균의 차이 / 표준편차. 독립 두 표본이면 합동 표준편차를 쓴다 |
| 최소 검출 효과 | minimum detectable effect (MDE) | 주어진 α·검정력·n 에서 검출 가능한 가장 작은 효과 |
| 사전 분석 | a priori power analysis | 자료 수집 전, 필요한 n 을 구함 |
| 사후(관측) 검정력 | post hoc / observed power | 이미 얻은 결과의 효과 크기로 계산한 검정력 |

## 네 양의 관계

- α, 검정력, 효과 크기, 표본 크기 **중 하나를 모르는 값으로 두고 나머지 셋을 정하면** 풀린다. statsmodels `solve_power` 는 정확히 하나만 `None` 으로 둬야 한다고 명시한다(`effect_size`, `nobs1`, `alpha`, `power`, `ratio` 중).
- 방향(직접 계산으로 확인, 아래 표):
  - 효과가 작을수록 n 이 급격히 늘어난다(n 은 d² 에 반비례: d 0.5→0.2 에서 집단당 64→394, 정확 t 기준).
  - α 를 엄격히 할수록 n 이 늘어난다.
  - 검정력을 높일수록 n 이 늘어난다.
  - 한쪽 검정은 양측보다 n 이 적다.

### 해석해(정규 근사)

NIST 핸드북은 σ 를 아는 평균 검정의 필요 표본을 N = (z₁₋α/₂ + z₁₋β)² (σ/δ)² 로 준다(양측; 한쪽이면 z₁₋α). σ 를 모르면 z 대신 t 를 쓰며 자유도가 N 에 의존하므로 반복 계산(NIST 예: 9 → 약 11)한다.

독립 두 집단(집단당 n, 같은 σ)에서는 평균 차이의 분산이 2σ²/n 이므로 위 식의 σ² 에 2 를 곱해 집단당

**n ≈ 2 (z₁₋α/₂ + z₁₋β)² / d²**

가 된다(이 전개는 NIST 식에서 필자가 유도한 것이며 NIST 페이지에 두 표본 식이 있는 것은 아니다). α=0.05(양측), 검정력 0.8 이면 z=1.960, 0.842 이므로 n ≈ 15.7 / d² 이다.

### 직접 계산: 집단당 표본 크기(양측, α=0.05, 검정력 0.8)

| d | 정규 근사 식 | `NormalIndPower` | `TTestIndPower`(정확 t) |
| --- | --- | --- | --- |
| 0.2 | 392.4 → 393 | 392.4 | 393.4 |
| 0.5 | 62.8 → 63 | 62.8 | 63.8 |
| 0.8 | 24.5 → 25 | 24.5 | 25.5 |
| 1.0 | 15.7 → 16 | 15.7 | 16.7 |

- 식과 `NormalIndPower` 가 일치한다. t 분포를 쓰면 약 1 명 더 필요하다(꼬리가 두꺼워서). 표본이 작을수록 차이가 크다 — 정수로는 올림한다.
- 결과를 **각 집단 인원**(nobs1)으로 읽는지 총인원으로 읽는지 헷갈리기 쉽다. d=0.5 면 집단당 64, 총 128.

### 직접 계산: 다른 설정에서(d=0.5, 양측 t, 집단당)

| 변경 | 필요 n |
| --- | --- |
| 기준: α=0.05, 검정력 0.8 | 63.8 |
| 검정력 0.9 | 85.0 |
| α=0.01 | 95.1 |
| α=0.10 | 50.1 |
| 한쪽 검정(`alternative='larger'`) | 50.2 |
| 두 번째 집단이 2 배(`ratio=2`) | 47.7 + 95.5 = 약 143(총) |

- 집단 크기를 불균등하게 하면 총인원이 늘어난다(128 → 약 143). 이 한 가지 설정에서는 균형 설계가 인원이 가장 적었다(일반 증명은 확인하지 않음).
- 한쪽 검정을 쓰려면 방향을 **사전에** 정당화해야 한다. 결과를 보고 고르면 제1종 오류가 커진다.

### 직접 계산: n 을 정해 놓고 검정력/MDE 보기

d=0.5, 양측 t, α=0.05:

| 집단당 n | 10 | 20 | 30 | 50 | 64 | 100 |
| --- | --- | --- | --- | --- | --- | --- |
| 검정력 | 0.185 | 0.338 | 0.478 | 0.697 | 0.801 | 0.940 |

- n=30 이면 d=0.5 효과가 있어도 절반 남짓 놓친다. 같은 n=30 에서 검정력 0.8 로 검출할 수 있는 최소 효과는 d ≈ 0.74(MDE).

### 모의실험 확인

`ttest_ind` 를 20000 번 반복(seed 7):

| 조건 | 기각 비율 | 해석해 |
| --- | --- | --- |
| d=0.5, n=63 | 0.793 | 약 0.79 |
| d=0.5, n=64 | 0.802 | 0.801 |
| d=0.5, n=30 | 0.483 | 0.478 |
| d=0 (귀무 참), n=64 | 0.047 | α=0.05 |

## 효과 크기를 어떻게 정하나

- 가장 어려운 입력이다. 나머지(α, 검정력)는 관례가 있지만 효과 크기는 **연구 맥락**에서 나온다.
- **Cohen 관례(d = 0.2 / 0.5 / 0.8)**: Cohen 이 통계 검정마다 "작음·중간·큼"을 조작적으로 정의해 제안한 값이다. 이 노트는 Cohen 1988 *Statistical Power Analysis for the Behavioral Sciences* 2판을 직접 읽지 못하고, 그 인용을 담은 Bakeman(조지아주립대) 메모를 통해 확인했다. 메모가 전하는 Cohen 의 입장(필자 요약):
  - 이 정의는 **임의적**이며 "큼" 같은 말이 절대적 기준으로 오해될 위험이 있다는 것을 Cohen 자신이 인정했다.
  - 더 나은 근거가 없을 때만 쓰라고 권했다(마지막 수단).
  - 행동과학에서 만나는 효과 크기의 주관적 평균을 반영해 골랐다.
- 그러므로 0.2/0.5/0.8 은 **관례이지 법칙이 아니다.** 분야·측정 도구에 따라 d=0.2 가 중대할 수도, d=0.8 이 시시할 수도 있다. Wikipedia Effect size 항목은 다른 컷오프를 제안한 연구(예: 중간 0.41, 큼 0.63)와 고정 기준에 대한 비판도 소개한다(보조 출처).
- 대안(필자 정리): (1) 사전 연구·파일럿의 추정값(단, 추정 오차를 감안해 보수적으로), (2) **최소한 의미 있는 효과**(실무적으로 의미 있는 가장 작은 차이)를 도메인 기준으로 먼저 정하고 그것을 MDE 로 삼기, (3) 여러 효과 크기에 대해 표를 만들어 민감도 보기.
- 원자료 단위로 환산: 평균 차이 5, 표준편차 10 이면 d=0.5 다. d 는 단위가 없어 비교가 쉽지만 σ 추정이 부정확하면 d 도 흔들린다.

## 사후(관측) 검정력의 한계

- 검정이 끝난 뒤 얻은 효과 크기로 검정력을 계산해 "유의하지 않은 이유가 검정력 부족"이라고 설명하는 방식이 **사후 검정력 분석**이다.
- Hoenig & Heisey, "The Abuse of Power", *The American Statistician* 55권(2001) 19~24쪽은 이 관행을 비판하는 대표 문헌으로 알려져 있다. 이 노트는 서지만 RePEc 목록에서 확인했고 본문은 읽지 못했다(유료). 논지는 검색 요약에 의존한다: 관측 검정력은 p-값의 단조 함수라 p-값에 더하는 정보가 없다.
- 직접 계산으로 그 관계를 확인했다(두 표본 t, 집단당 30, 자유도 58, 관측 t 에서 검정력 계산):

| 관측 p | 0.05 | 0.20 | 0.50 |
| --- | --- | --- | --- |
| 사후 검정력 | 0.503 | 0.247 | 0.102 |

- p 가 클수록 사후 검정력이 작다. 즉 "p>0.05 이고 사후 검정력이 낮다"는 p>0.05 를 다시 말한 것이다. 비유의 결과 해석에는 신뢰구간(어떤 효과 크기까지 배제되는지)을 쓴다.

### 직접 계산: 유의한 결과만 보면 효과가 부풀려진다

참 효과 d=0.5, 집단당 n=30, 20000 회 모의(seed 7): 검정력 0.478. 전체 반복의 추정 d̂ 평균 0.505, 그러나 **p<0.05 인 반복만** 모으면 평균 0.726.

- 검정력이 낮은 연구에서 "유의했다"는 결과만 보고하면 효과를 과대 추정한다. 사전 분석이 중요한 또 하나의 이유다. (모의 결과이며 이 현상을 다룬 1차 출처는 읽지 못했다.)

## 헷갈리는 구분

| 구분 | 내용 |
| --- | --- |
| 사전 vs 사후 | 사전은 설계 도구, 사후는 해석 도구로 쓰면 오용 |
| 검정력 vs 신뢰구간 폭 | 검정력은 "특정 효과를 잡나", 구간 폭은 "추정 정밀도". 정밀도 기준으로 n 을 정하는 방법도 있다(NIST: N ≥ (1.96/δ)² σ²) |
| 통계적 유의 vs 실무적 의미 | 큰 n 은 사소한 효과도 유의하게 한다 |
| 다중 비교 | 검정이 여러 개면 α 를 보정해야 하고 그만큼 n 이 늘어난다 → [다중 비교 보정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/) |

## 언제 쓰나 / 주의

- 실험·설문 설계 단계, 연구 계획서·사전 등록. A/B 테스트에서는 [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)를, 사용성 평가 인원은 [사용성 테스트 표본](/develop-wiki/knowledge/ui-ux/usability-testing-sample-size/)을 본다.
- 위 계산은 **정규성·등분산·독립성**이 맞다는 가정의 값이다. 가정이 깨지면(예: 비정규 → [순열검정](/develop-wiki/knowledge/data-analytics/bootstrap-permutation-test/)) 해석해가 맞지 않으므로 모의실험으로 직접 확인한다.
- 결측·탈락이 있으면 계획 n 에서 줄어든다. 탈락 예상분을 더해 모집한다(필자 제안).
- 이 노트는 두 표본·일표본 평균 검정만 다뤘다. ANOVA(f), 상관, 비율(h) 검정의 효과 크기와 관례는 다루지 않았다. 비율 두 개 12% vs 15% 의 h(proportion_effectsize)=0.088 에서 집단당 약 2031 명(`NormalIndPower`)이 나오는 정도만 계산했다.
- statsmodels `TTestIndPower` 는 합동 분산만 쓴다고 문서에 있다. 분산이 크게 다르면(Welch) 결과가 달라질 수 있다.

## 검증 범위

- 읽은 것: NIST 핸드북 prc222(평균 검정 표본 크기), statsmodels `TTestIndPower`·`solve_power`·`NormalIndPower` 문서, Bakeman 메모(Cohen 1988 인용 포함, 2차 자료), Wikipedia Effect size(보조), RePEc 서지 목록(Hoenig & Heisey).
- 직접 계산: Python 3.15, statsmodels 0.15.0, scipy 1.18.1 (스크래치 `r12/ra/n3.py`). 모의실험 seed 7 단일 실행.
- 미확인: Cohen 1988·1992 원문(접속 불가·직접 열람 못 함), Hoenig & Heisey 본문, 두 표본 n 식의 NIST 1차 출처(필자 유도), statsmodels 가 쓰는 검정력 식의 문서 서술(noncentral t 사용 여부는 문서에서 확인 못 함), 다른 검정(ANOVA·상관·비율)의 효과 크기 관례, 사후 검정력 비판의 본문 논거.
