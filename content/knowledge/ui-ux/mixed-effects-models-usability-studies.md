---
title: 사용성 연구의 혼합효과 모형 (참가자 무작위 효과)
aka: [Mixed-Effects Models for UX, Linear Mixed Model, LMM, GLMM, lme4, lmer, glmer, Random Intercept, Crossed Random Effects, 혼합효과 모형, 무작위 효과]
category: ui-ux
group: research
level: advanced
summary: 참가자 한 명이 여러 과업·여러 디자인을 수행한 사용성 데이터를 참가자(와 과업) 무작위 효과로 모형화하는 방법을 lme4 문서의 공식 표기와 함께 정리하고, 무시했을 때 표준오차가 어떻게 달라지는지 직접 계산한 예로 보인다.
tags: [ux, statistics, mixed-effects, lme4, glmm, random-effects, within-subjects, task-time, success-rate]
related: [ui-ux/task-time-log-transform-geometric-mean, ui-ux/mcnemar-test-paired-proportions, ui-ux/cochrans-q-test-paired-binary, ui-ux/within-subjects-counterbalancing-latin-square, ui-ux/quantitative-usability-confidence-intervals, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/usability-testing-sample-size]
sources:
  - https://doi.org/10.18637/jss.v067.i01
  - https://cran.r-project.org/web/packages/lme4/vignettes/lmer.pdf
  - https://cran.r-project.org/web/packages/lme4/lme4.pdf
updatedAt: 2026-11-19
---

두 조건 이진 결과는 [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/), 셋 이상은 [Cochran's Q](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/), 시간 변환은 [로그 변환·기하평균](/develop-wiki/knowledge/ui-ux/task-time-log-transform-geometric-mean/)에 있다. 이 노트는 **참가자 × 과업 × 디자인**처럼 반복 구조가 겹친 데이터를 한 모형으로 다루는 방법이다.

## 문제

- 16명이 과업 5개를 디자인 A·B 로 모두 수행했다. 관측은 160개지만 독립인 단위는 16명이다. 빠른 사람은 모든 과업에서 빠르고, 어려운 과업은 모든 사람에게 어렵다.
- 160개를 독립으로 보고 회귀·t 검정을 하면 표준오차가 틀린다. 반대로 참가자별 평균으로 요약하면 과업 정보를 버린다.
- McNemar·Cochran's Q 는 "한 과업 또는 요약값"에만 맞는다.

## 해법

### 1. 모형 표기 (lme4, Bates 등 2015 의 표 2)

| R 수식 | 의미 |
| --- | --- |
| `(1 \| pid)` | 참가자별 무작위 절편 |
| `(1 \| pid) + (1 \| task)` | 참가자와 과업이 교차된 무작위 절편 |
| `(design \| pid)` | 참가자별 절편과 디자인 효과 기울기(상관 있음) |
| `(design \|\| pid)` | 위와 같되 상관 없음 |
| `(1 \| g1/g2)` | g1 안에 g2 가 내포된 구조 |

```r
library(lme4)
# 과업 시간(로그) — 선형 혼합 모형, 기본은 REML 추정
m_time <- lmer(log(time) ~ design + (1 | pid) + (1 | task), data = d)
# 과업 성공 — 로지스틱 혼합 모형, nAGQ 기본 1 = 라플라스 근사
m_ok <- glmer(ok ~ design + (1 | pid) + (1 | task), family = binomial, data = d)
```

- 참가자·과업이 교차된 구조는 lme4 가 지원하는 비내포(non-nested) 무작위 효과의 대표 예다(비네트: 항목반응 이론의 피험자 × 문항 교차).
- `glmer` 의 `nAGQ`: 1 은 라플라스 근사, 1 보다 크면 적응 가우스-에르미트 구적(현재 **무작위 효과가 스칼라 하나인 모형**에서만). 위처럼 무작위 효과가 둘이면 라플라스만 쓸 수 있다.

### 2. 직접 계산한 예 (Python statsmodels 0.15 / scipy, 모의 데이터)

16명 × 5과업 × 2디자인 = 160관측. 참가자 속도 편차(로그 SD 0.45), 과업 난이도, B 의 실제 효과(로그 −0.15, 로짓 +0.8)를 넣어 생성했다. 이 예에서는 과업을 고정효과로 넣었다.

| 모형 (과업 시간, 로그) | B 효과 | 표준오차 |
| --- | --- | --- |
| 일반 회귀 (참가자 무시) | −0.246 | 0.089 |
| 선형 혼합 (참가자 무작위 절편, REML) | −0.246 | **0.038** |

- 계수는 같지만 표준오차가 2배 이상 차이 난다. 응답자 내 비교에서 참가자 차이를 모형이 흡수해 **검정력이 올라간 쪽**이다. 참가자 SD 추정 0.51, 잔차 SD 0.24.
- B/A 시간 비 = exp(−0.246) ≈ 0.78 (기하평균 기준 22% 단축).

| 모형 (과업 성공) | B 로짓 효과 | 표준오차 | 오즈비 |
| --- | --- | --- | --- |
| 로지스틱 회귀 (참가자 무시) | 0.654 | 0.388 | 1.92 |
| GEE (교환 상관, 강건 SE) | 0.654 | 0.405 | 1.92 |
| 로지스틱 혼합 (참가자 무작위 절편, 40점 가우스-에르미트 직접 구현) | 0.742 | 0.416 | 2.10 |

- 혼합 모형의 오즈비는 "같은 참가자 안에서"의 효과(조건부), GEE·일반 로지스틱은 집단 평균(주변) 효과다. 로지스틱에서는 둘이 다르며 조건부 쪽이 0에서 더 멀다. 어느 것을 보고할지 질문에 맞춰 정한다(필자 제안).
- glmer 를 실행한 것이 아니다. 같은 우도를 Python 으로 구현했으며 lme4 결과와 대조하지 않았다.

### 3. p 값과 진단 (lme4 매뉴얼)

- `lmer` 요약은 고정효과 p 값을 주지 않는다. 매뉴얼의 `pvalues` 도움말은 우도비 검정(`anova`), 프로파일 신뢰구간(`confint`), 파라메트릭 부트스트랩(`bootMer`, pbkrtest), Kenward–Roger·Satterthwaite 근사(pbkrtest, lmerTest) 등을 안내한다. **집단 수가 50 미만이면 유한 표본 보정이 중요하다**고 표시한다. 사용성 연구는 대부분 여기에 해당한다.
- `glmer` 요약의 p 값은 점근 Wald 검정이며, 매뉴얼은 그 가정(우도 곡면 모양, 카이제곱 근사)을 경고한다.
- `isSingular`: 분산 추정이 0 이거나 상관이 ±1 인 특이 적합을 검사한다. 매뉴얼은 특이 적합이 과적합·수치 문제·추론 부적절 가능성이 있다고 쓰고, 대처에 합의가 없다고 밝힌다.

## 언제 쓰나

- 한 참가자가 여러 과업을 수행한 사용성 테스트에서 디자인 효과를 추정할 때(시간, 성공, 오류 수, 평점).
- 참가자 간 설계와 응답자 내 설계가 섞인 데이터(일부 과업만 두 디자인).
- 결측이 있는 반복 측정: 혼합 모형은 참가자별 관측 수가 달라도 적합된다.

## 주의·비용

- **집단 수가 적다.** 참가자 8~16명이면 분산 성분 추정이 불안정하고 특이 적합이 잦다. 무작위 기울기까지 넣은 복잡한 모형은 수렴하지 않기 쉽다. 설계 단계에서 모형을 정해 두고 간단한 것부터 시작한다(필자 제안).
- 과업이 3~5개뿐이면 과업을 무작위 효과로 두기보다 고정효과로 넣는 편이 안정적일 수 있다(필자 의견, 문헌 기준 미확인).
- 결과 보고에 효과 크기(시간 비, 오즈비)와 구간, 무작위 효과 분산을 함께 낸다. p 값만 내지 않는다.
- 분석 도구(R lme4, Python statsmodels, SPSS MIXED)마다 기본 추정법·자유도 근사가 다르다. 보고서에 도구·버전·추정법을 적는다.
- 통계 전문가 검토 없이 복잡한 모형을 쓰면 해석 오류 위험이 크다. 기술 통계·그림을 먼저 보고한다.

## 비교

| 방법 | 다루는 구조 | 한계 |
| --- | --- | --- |
| 참가자별 평균 → 대응 t | 참가자 반복 | 과업 정보 손실 |
| McNemar / Cochran's Q | 한 과업, 이진 | 과업 여러 개 불가 |
| 반복측정 분산분석 | 균형 설계 | 결측·불균형에 약함 |
| 선형·로지스틱 혼합 모형 | 참가자 × 과업 교차, 불균형 | 소표본 추정 불안정, 해석 난도 |
| GEE | 집단 평균 효과 | 집단 수가 적으면 강건 SE 가 낙관적일 수 있음(미확인) |

## 검증 범위

- 확인함: 수식 표기·교차 효과 설명은 lme4 비네트(Bates·Mächler·Bolker·Walker, JSS 67(1) 판 원고). `nAGQ`, `isSingular`, `pvalues` 내용은 CRAN lme4 매뉴얼 2.1-0(2026-10-23 게시) 원문. 표 2 는 Python 3.15, statsmodels 0.15.0, scipy 1.18.1 로 직접 계산(시드 고정 모의 데이터).
- 확인 못 함: R 이 설치돼 있지 않아 위 R 코드와 `glmer` 결과를 실행하지 못했다. statsmodels MixedLM 문서는 읽지 않았다. 소표본 GEE 와 과업 수에 대한 문헌 기준은 확인하지 않았다.
