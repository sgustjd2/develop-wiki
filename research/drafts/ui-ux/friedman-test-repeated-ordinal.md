---
title: Friedman 검정 (Friedman test)
aka: []
category: ui-ux
level: beginner
summary: 동일한 피험자로부터 세 개 이상의 조건 또는 시점에서 측정된 데이터 세트를 비교하는 순위 기반의 일원 배치 반복 측정 분산 분석 방법입니다.
tags:
  - statistics
  - non-parametric
  - repeated-measures
related: []
sources:
  - https://en.wikipedia.org/wiki/Friedman_test
  - https://suchibrata.in/blog/statistical-tests/friedman-test
  - https://statisticsfundamentals.com/tables/friedman-test-table/
updatedAt: 2026-11-22
---

> ⚠ 로컬 모델(gemma4:26b-a4b-64k) 자동 초안 — 2026-11-22 주간 조사. 사이트에 공개되지 않았다. 공개 전 Claude Code `review-drafts` 로 원문 대조·보강이 필요하다.
> 주제(backlog): Friedman 검정 (Friedman test)

## 개요 및 특징

Friedman 검정은 순위를 이용한 일원 배치 반복 측정 분산 분석(one-way repeated measures analysis of variance)에 사용됩니다. 동일한 피험자로부터 세 개 이상의 조건 또는 시점에서 측정된 데이터 세트를 비교하는 방법입니다. (근거 1, 8)

데이터가 정규성을 따르지 않거나 이상치가 있는 경우에도 사용할 수 있는 강건한(robust) 검정입니다. 측정값은 최소한 서열 척도(ordinal data) 이상이어야 합니다. (근거 10, 11)

이 검정은 순위를 사용한다는 점에서 Kruskal–Wallis 일원 배치 분산 분석과 유사합니다. (근거 2)

## 데이터 구성 및 순위 계산

데이터 행렬에서 각 블록 내의 순위를 계산하며, 동순위(tied values)가 있을 경우 해당 순위들의 평균값을 부여합니다. (근거 3)

## 검정 통계량 및 가설 검정

Friedman 검정은 세 개 이상의 조건에서 동일한 순위 분포를 갖는다는 귀무가설을 검정하기 위한 통계적 방법입니다. 검정 통계량 Q는 주어진 수식에 의해 계산됩니다. (근거 4, 13)

데이터에 동순위가 있는 경우 Q의 값은 이를 위해 조정되어야 하며, 동순위(tied ranks)가 발생할 경우 보정 계수 C를 사용하여 검정 통계량을 나누어 주어야 합니다. (근거 5, 16)

계산된 검정 통계량(χ² r)이 임계값보다 크거나 같으면 귀무가설을 기각합니다. (근거 17)

n 또는 k가 작을 경우 카이제곱 근사는 부정확하므로 Friedman 검정용으로 특별히 준비된 Q의 표에서 p-value를 얻어야 합니다. 표본 크기가 커서(n > 15) 정확한 표를 사용할 수 없는 경우, 자유도가 k - 1인 카이제곱 분포 근사치를 사용합니다. (근거 6, 18)

## 사후 검정

p-value가 유의미하다면 적절한 사후 다중 비교 검정(post-hoc multiple comparisons tests)을 수행해야 합니다. 어떤 구체적인 쌍이 다른지 확인하기 위해 Nemenyi 사후 검정을 수행하거나, Wilcoxon tests with Bonferroni correction을 사용할 수 있습니다. (근거 7, 12, 19)

## 검토용 근거 (공개 전 삭제)

1. Friedman 검정은 순위를 이용한 일원 배치 반복 측정 분산 분석에 사용됩니다.
   - "The Friedman test is used for one-way repeated measures analysis of variance by ranks." — https://en.wikipedia.org/wiki/Friedman_test
2. 이 검정은 순위를 사용한다는 점에서 Kruskal–Wallis 일원 배치 분산 분석과 유사합니다.
   - "In its use of ranks it is similar to the Kruskal–Wallis one-way analysis of variance by ranks." — https://en.wikipedia.org/wiki/Friedman_test
3. 데이터 행렬에서 각 블록 내의 순위를 계산하며, 동순위가 있을 경우 해당 순위들의 평균값을 부여합니다.
   - "calculate the ranks within each block. If there are tied values, assign to each tied value the average of the ranks that would have been assigned without ties." — https://en.wikipedia.org/wiki/Friedman_test
4. 검정 통계량 Q는 주어진 수식에 의해 계산됩니다.
   - "The test statistic is given by Q = 12 n k ( k + 1 ) ∑ j = 1 k ( r ¯ ⋅ j − k + 1 2 ) 2 ." — https://en.wikipedia.org/wiki/Friedman_test
5. 데이터에 동순위가 있는 경우 Q의 값은 이를 위해 조정되어야 합니다.
   - "Note that the value of Q does need to be adjusted for tied values in the data." — https://en.wikipedia.org/wiki/Friedman_test
6. n 또는 k가 작을 경우 카이제곱 근사는 부정확하므로 Friedman 검정용으로 특별히 준비된 Q의 표에서 p-value를 얻어야 합니다.
   - "If n or k is small, the approximation to chi-square becomes poor and the p -value should be obtained from tables of Q specially prepared for the Friedman test." — https://en.wikipedia.org/wiki/Friedman_test
7. p-value가 유의미하다면 적절한 사후 다중 비교 검정을 수행해야 합니다.
   - "If the p -value is significant , appropriate post-hoc multiple comparisons tests would be performed." — https://en.wikipedia.org/wiki/Friedman_test
8. Friedman 검정은 동일한 피험자로부터 세 개 이상의 조건 또는 시점에서 측정된 데이터 세트를 비교하는 방법입니다.
   - "The Friedman Test compares three or more sets of measurements taken from the same subjects -across three or more conditions or time points-much like a repeated measures ANOVA." — https://suchibrata.in/blog/statistical-tests/friedman-test
9. 이 검정은 각 피험자의 점수를 순위로 변환하여 각 조건의 순위 합이 균형을 이루는지 확인합니다.
   - "instead of working with the actual magnitude of each subject's scores, it converts the scores within each subject into ranks and asks whether the rank sums for each condition are balanced across subjects, or whether one or more conditions systematically dominate." — https://suchibrata.in/blog/statistical-tests/friedman-test
10. 데이터가 정규성을 따르지 않거나 이상치가 있는 경우에도 사용할 수 있는 강건한(robust) 검정입니다.
   - "By ranking within each subject rather than working with raw values across the whole dataset, the test trades a small amount of statistical power (when the data genuinely are normal and spherical) for considerable robustness to violations of those assumptions." — https://suchibrata.in/blog/statistical-tests/friedman-test
11. 측정값은 최소한 서열 척도(ordinal data) 이상이어야 합니다.
   - "At least ordinal data. The values must be at least rankable-continuous or ordinal measurements both work, unlike repeated measures ANOVA which requires interval or ratio data." — https://suchibrata.in/blog/statistical-tests/friedman-test
12. 검정 결과가 유의미할 경우, 어떤 구체적인 쌍이 다른지 확인하기 위해 Nemenyi 사후 검정을 수행합니다.
   - "To find out which specific pairs of conditions differ, the standard follow-up is the Nemenyi test , which compares every pair of rank sums while controlling the family-wise error rate across all pairwise comparisons." — https://suchibrata.in/blog/statistical-tests/friedman-test
13. Friedman 검정은 세 개 이상의 조건에서 동일한 순위 분포를 갖는다는 귀무가설을 검정하기 위한 통계적 방법이다.
   - "The Friedman Test critical value table lists the minimum value of χ² r = [12/(n·k·(k+1))] × ΣR j ² − 3n(k+1) required to reject the null hypothesis that k related treatment distributions are identical, organized by number of blocks n, number of treatments k, and significance level α." — https://statisticsfundamentals.com/tables/friedman-test-table/
14. 데이터는 n개의 블록(피험자)과 k개의 처치(조건)를 가진 2차원 행렬 형태로 구성되어야 한다.
   - "Arrange observations into an n × k matrix: n rows (one per block or subject) and k columns (one per treatment)." — https://statisticsfundamentals.com/tables/friedman-test-table/
15. 각 행(블록) 내에서 개별적으로 순위를 매겨야 한다.
   - "For each row (block) separately, rank the k observations" — https://statisticsfundamentals.com/tables/friedman-test-table/
16. 동순위(tied ranks)가 발생할 경우 보정 계수 C를 사용하여 검정 통계량을 나누어 주어야 한다.
   - "When tied ranks occur within a block, the correction factor C is applied: C = 1 − [ΣT / (n · k · (k² − 1))] where T = Σ(t³ − t) summed over all tie groups within a block, and t is the number of tied observations in each tie group. Divide the standard χ² r by C." — https://statisticsfundamentals.com/tables/friedman-test-table/
17. 계산된 검정 통계량(χ² r)이 임계값보다 크거나 같으면 귀무가설을 기각한다.
   - "Reject H₀ if χ² r ≥ critical value." — https://statisticsfundamentals.com/tables/friedman-test-table/
18. 표본 크기가 커서(n > 15) 정확한 표를 사용할 수 없는 경우, 자유도가 k - 1인 카이제곱 분포 근사치를 사용한다.
   - "For large samples (n > 15), χ² r approximately follows a chi-square distribution with df = k − 1. Use the chi-square critical value table at df = k − 1 instead of the exact Friedman table." — https://statisticsfundamentals.com/tables/friedman-test-table/
19. 검정 결과가 유의미할 경우, 어떤 쌍이 차이가 나는지 확인하기 위해 사후 검정(post hoc tests)을 수행해야 한다.
   - "If the overall test is significant, proceed to post hoc pairwise comparisons using the Nemenyi test or Wilcoxon tests with Bonferroni correction." — https://statisticsfundamentals.com/tables/friedman-test-table/

## 근거 검증에서 뺀 문장 (공개 전 삭제)

- (근거에 없는 수치 2) 데이터는 n개의 블록(피험자)과 k개의 처치(조건)를 가진 2차원 행렬 형태로 구성되어야 합니다. 각 행(블록) 내에서 개별적으로 k개의 관측치에 대해 순위를 매겨야 합니다.
