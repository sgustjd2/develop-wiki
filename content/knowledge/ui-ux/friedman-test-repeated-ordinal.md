---
title: 셋 이상 조건의 반복측정 서열 자료 비교 — Friedman 검정
aka: [Friedman Test, Friedman Two-way Analysis of Variance by Ranks, Friedman ANOVA by Ranks, 프리드먼 검정, Kendall's W]
category: ui-ux
group: research
level: intermediate
summary: 같은 참가자가 디자인 3개 이상을 모두 평가한 리커트 점수를 참가자 안에서 순위로 바꿔 비교하는 Friedman 검정의 통계량·동점 보정·표본 조건·Kendall's W·사후 비교를 직접 계산한 예로 정리한다.
tags: [ux, statistics, friedman, nonparametric, likert, ordinal, within-subjects, repeated-measures, kendalls-w, post-hoc]
related: [ui-ux/cochrans-q-test-paired-binary, ui-ux/mcnemar-test-paired-proportions, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/within-subjects-counterbalancing-latin-square, ui-ux/mixed-effects-models-usability-studies, ui-ux/quantitative-usability-confidence-intervals, ui-ux/ux-metrics-sus-heart-ab-test, data-analytics/nonparametric-tests-rank-based, data-analytics/t-test-anova-f-test]
sources:
  - https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.friedmanchisquare.html
  - https://www.jmlr.org/papers/volume7/demsar06a/demsar06a.pdf
  - https://en.wikipedia.org/wiki/Friedman_test
  - https://en.wikipedia.org/wiki/Kendall%27s_W
  - https://doi.org/10.1080/01621459.1937.10503522
updatedAt: 2026-11-24
---

이진 결과(성공/실패)는 [Cochran's Q](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/), 이 노트는 그 서열·연속 대응판이다. 조건이 둘이면 [Wilcoxon 부호순위(또는 이진이면 McNemar)](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/)로 충분하다.

## 문제

- 12명이 디자인 A·B·C 를 모두 써 보고 7점 리커트(사용 편의성)로 평가했다. "세 디자인의 평점이 다르다"고 말할 수 있나?
- 참가자마다 점수를 후하게/박하게 주는 습관이 달라 점수 수준 자체가 크게 갈린다. 이 개인차가 조건 효과를 가린다.
- 리커트 점수의 간격이 같다고 보기 어렵고 값이 몇 개뿐이라 동점이 많다. 정규성·구형성을 전제하는 반복측정 ANOVA 가 부담스럽다.

## 해법

### 1. 아이디어와 통계량

- 참가자(블록) 한 명 안에서 k 개 조건의 점수에 순위를 매긴다. 동점은 평균 순위. 사람 간 점수 수준은 순위로 바뀌면서 사라진다.
- 귀무가설(scipy 문서): 같은 개체의 반복 표본들이 같은 분포를 가진다. 쉬운 말로 "한 사람 안에서 어느 조건이 체계적으로 높거나 낮지 않다".
- N 명, 조건 k 개, 조건 j 의 순위합 `R_j` 일 때 (scipy 구현 소스·Demšar 와 같은 식):

```
Q0 = 12 / (N·k·(k+1)) · Σ_j R_j²  −  3N(k+1)
C  = 1 − Σ t(t²−1) / (N·k·(k²−1))        // t = 한 참가자 안의 동점 묶음 크기, 모든 묶음 합
Q  = Q0 / C                               // 동점 보정
```

- 근사 분포: Q ~ χ²(k−1). scipy 는 반환 통계량이 동점 보정된 값이고 p 는 이 카이제곱 가정으로 계산한다고 밝힌다. Wikipedia 도 동점 보정이 필요하다고만 쓰고 식은 싣지 않는다. 위 C 는 scipy 소스에서 확인했다.
- Demšar(2006)는 평균 순위로 쓴 같은 식 `χ²_F = 12N/(k(k+1)) · [Σ R̄_j² − k(k+1)²/4]` 와, 이 통계량이 보수적이라는 Iman–Davenport(1980) 보정 `F_F = (N−1)χ²_F / (N(k−1) − χ²_F)` (F 분포, 자유도 k−1 와 (k−1)(N−1))를 소개한다.

```ts
function friedmanQ(x: number[][]): number { // 행 = 참가자, 열 = 조건
  const N = x.length, k = x[0].length;
  const R = new Array(k).fill(0); let tie = 0;
  for (const row of x) {
    const sorted = [...row].sort((a, b) => a - b);
    const groups = new Map<number, number>();
    sorted.forEach((v) => groups.set(v, (groups.get(v) ?? 0) + 1));
    for (const t of groups.values()) tie += t * (t * t - 1);
    row.forEach((v, j) => { // 평균 순위 = 작은 값 수 + (같은 값 수 + 1) / 2
      R[j] += sorted.filter((s) => s < v).length + (groups.get(v)! + 1) / 2;
    });
  }
  const q0 = (12 / (N * k * (k + 1))) * R.reduce((s, r) => s + r * r, 0) - 3 * N * (k + 1);
  return q0 / (1 - tie / (N * k * (k * k - 1))); // 자유도 k−1 카이제곱 상위 확률이 p
}
```

모든 참가자가 모든 조건에서 같은 점수면 보정 계수 C 가 0 이라 통계량이 정의되지 않는다(위 함수는 0 으로 나눈다).

### 2. 직접 계산 예 (고정 데이터, Python scipy 1.18.1·numpy·statsmodels 0.15.0)

12명 × 디자인 3개, 7점 리커트(이 노트를 위해 직접 만든 가상 데이터).

| 참가자 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | 4 | 3 | 5 | 4 | 2 | 5 | 3 | 4 | 5 | 3 | 4 | 2 |
| B | 5 | 5 | 4 | 5 | 4 | 5 | 4 | 5 | 6 | 3 | 5 | 4 |
| C | 5 | 4 | 6 | 6 | 5 | 6 | 4 | 7 | 5 | 5 | 5 | 5 |

- 참가자별 순위(A/B/C)를 매기면 순위합 **R = 14.5 / 25.5 / 32.0**(합 72 = N·k(k+1)/2 = 12·6, 순위가 제대로 매겨졌다는 검산). 평균 순위 1.21 / 2.13 / 2.67.
- 평균 점수는 3.67 / 4.58 / 5.25, 중앙값 4 / 5 / 5.
- 손계산: Q0 = 12/(12·3·4) · (14.5² + 25.5² + 32²) − 3·12·4 = 1884.5/12 − 144 = **13.042**.
- 동점이 있는 참가자 6명(각각 두 값이 같아 t = 2 한 묶음, t(t²−1) = 6) → 합 36, C = 1 − 36/(12·3·8) = **0.875**. Q = 13.042 / 0.875 = **14.905**.
- `scipy.stats.friedmanchisquare` 값: 통계량 14.905, 자유도 2, p = **0.00058**. 손계산과 일치.
- Iman–Davenport F_F = 18.03, p = 2.3×10⁻⁵ (같은 자료를 Demšar 식으로 계산). 이 자료에서는 카이제곱 근사보다 더 작은 p 가 나온다.
- 참가자 안에서 점수를 무작위로 섞는 몬테카를로 순열 검정(20만 회, seed 20261124): p ≈ **0.0001**. 팩트체크에서 순열 분포를 전수 계산한 정확 p 는 0.00016 이다(34,012,224 경우 중 5,424 경우가 관측 이상). 카이제곱 근사 p(0.00058)는 이 자료에서 정확 p 의 약 3.6배로 보수적이었다(한 사례이며 일반화하지 않는다). 결론은 같다.

### 3. 효과 크기: Kendall's W

- Wikipedia(Kendall's W)는 W 를 Friedman 통계량을 0~1 로 정규화한 값이라 설명하고, 완전한 순위에서 `χ² = m(n−1)W` (m = 평가자 수 = 우리의 N, n = 대상 수 = 우리의 k)를 준다. 그러므로 **W = Q / (N(k−1))**.
- 예: W = 14.905 / (12·2) = **0.62**. 같은 자료를 Wikipedia 의 동점 보정 W 식에 넣어도 0.621 이다(동점 보정 Q 와 일치).
- 해석: 0 이면 참가자 간 순위가 서로 무관하고 1 이면 모든 참가자가 같은 순서로 평가한다. 즉 "참가자 사이의 순위 일치도"다. 효과의 크기를 말하는 경계값(작음/중간/큼)은 이번에 읽은 자료에서 확인하지 못했다. 임계 기준 없이 W 와 평균 순위를 같이 보고한다.

### 4. 사후 쌍별 비교

Friedman 이 유의해도 "어느 쌍이 다른가"는 별도 절차다.

| 방법 | 근거 | 이 예의 결과 |
| --- | --- | --- |
| Nemenyi | Demšar: 모든 쌍 비교용. 평균 순위 차가 CD = q_α·√(k(k+1)/(6N)) 이상이면 유의 (k=3, α=0.05 에서 q = 2.343) | CD = 0.957. A–B 0.917 (유의 아님), A–C 1.458 (유의), B–C 0.542 (유의 아님) |
| Wilcoxon 부호순위 + Holm | Demšar 는 Holm 을 통제 조건 비교의 단계적 교정으로 설명. 쌍별 Wilcoxon 에 적용한 것은 필자 제안(원문 근거 아님) | 원 p: A–B 0.0156, A–C 0.00098, B–C 0.0859 → Holm 0.031 / 0.0029 / 0.086 |

- 두 방법의 결론은 A–C 만 유의로 일치하지만, A–B 는 Nemenyi 로는 유의하지 않고 Wilcoxon+Holm 으로는 유의하다. Nemenyi 는 모든 쌍을 순위합 하나로 비교하는 보수적 절차이고, 쌍별 Wilcoxon 은 두 조건 자료만 쓴다. 어느 쪽을 쓸지는 **분석 전에** 정해야 한다.
- Wikipedia 는 평균 순위 차에 기초한 사후검정으로 Schaich–Hamerle(1984)·Conover(1971, 1980)를 언급하고 Nemenyi 구현이 R 패키지(PMCMRplus)에 있다고 쓴다. Conover 원문은 읽지 못했다.
- 쌍별 Wilcoxon 값은 scipy `wilcoxon` 기본 설정, Holm 은 statsmodels `multipletests` 로 계산했다. 교정 방법 비교는 [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/) 참고.
- 전체 검정이 유의한데 사후 비교가 아무 쌍도 못 찾는 경우가 있다. Demšar 는 사후 절차의 검정력이 낮기 때문이며 "일부가 다르다" 외의 결론은 낼 수 없다고 쓴다.

## 언제 쓰나

- 응답자 내 설계에서 3개 이상 시안의 리커트·순위 평가: 사용 편의성, 선호 점수, 인지 부하 설문 문항 하나.
- 같은 사람의 3회 이상 반복 측정(예: 출시 전·직후·한 달 뒤 만족도).
- 점수 분포가 치우치거나 이상값이 있어 반복측정 ANOVA 의 가정이 의심될 때. 단 설문 총점(SUS 등)은 간격 척도로 다루는 관행도 있어 → [UX 지표](/develop-wiki/knowledge/ui-ux/ux-metrics-sus-heart-ab-test/)

## 주의·비용

- **완전한 블록(완전 교차)이 필요하다.** 모든 참가자가 모든 조건을 평가해야 한다. 한 조건이라도 결측이면 그 참가자의 행을 빼야 하며(scipy 는 길이가 같은 배열만 받고 NaN 이 있으면 기본값에서 nan 을 돌려준다. `nan_policy='omit'` 으로 해당 행을 제외할 수 있다), 결측이 많으면 혼합효과 모형이 낫다 → [혼합효과 모형](/develop-wiki/knowledge/ui-ux/mixed-effects-models-usability-studies/)
- **표본 크기 조건.** scipy 문서: 카이제곱 가정 때문에 p 는 n > 10 이고 반복 표본이 6개 초과일 때만 믿을 만하다. Demšar 는 N > 10, k > 5 를 경험칙으로 쓰고 더 작으면 정확한 임계값 표를 쓰라 한다. **UX 연구의 k = 3~4 는 두 기준 모두 못 채운다.** 위 예(k = 3)도 해당하므로, 정확 표 또는 순열 검정으로 확인한다. 정확 순열은 조합 수(`k!^N`)가 빨리 커지므로 N이 크면 몬테카를로를 쓴다(필자 제안). 근사가 얼마나 어긋나는지의 수치는 확인하지 못했다.
- **동점이 많다.** 5~7점 척도에서는 한 참가자 안의 동점이 흔하다. 보정 C 를 쓰지 않으면 Q 가 작아진다. 보정은 scipy 가 자동 적용하지만 직접 구현·스프레드시트에서는 빠뜨리기 쉽다. 모든 조건이 같은 점수인 참가자는 정보가 없다(순위가 모두 같아 Q 에 기여하지 않는다).
- **순서 효과·학습 효과는 검정이 제거하지 않는다.** 시안 제시 순서를 라틴 방격으로 역균형한다 → [응답자 내 설계](/develop-wiki/knowledge/ui-ux/within-subjects-counterbalancing-latin-square/)
- **순위만 본다.** 점수 차의 크기(A가 B보다 0.1점 vs 3점 높음)는 사라진다. 평균·중앙값 같은 기술 통계와 신뢰구간을 따로 보고한다 → [정량 사용성 신뢰구간](/develop-wiki/knowledge/ui-ux/quantitative-usability-confidence-intervals/)
- **참가자×과업 구조.** 한 참가자가 여러 과업을 하면 Friedman 은 과업별 또는 참가자별 요약에만 맞다. 한 번에 다루려면 순서형 혼합효과 모형을 고려한다(미검증).
- 반복측정 ANOVA 와의 선택: Demšar 는 가정이 맞을 때 ANOVA 의 이론적 검정력이 더 높지만 맞지 않으면 그렇지 않으며, Friedman 이 1940년 56개 문제에서 ANOVA 와 대체로 일치했다고 인용한다. 일반 지침은 [t·ANOVA](/develop-wiki/knowledge/data-analytics/t-test-anova-f-test/)

## 비교

| 상황 | 검정 |
| --- | --- |
| 같은 사람, 2조건, 이진 | McNemar |
| 같은 사람, 2조건, 서열·연속 | Wilcoxon 부호순위 |
| 같은 사람, 3조건 이상, 이진 | Cochran's Q |
| 같은 사람, 3조건 이상, 서열·치우친 연속 | **Friedman** |
| 같은 사람, 3조건 이상, 간격 척도·정규성 가능 | 반복측정 ANOVA |
| 다른 사람, 3그룹 이상, 서열 | Kruskal–Wallis |
| 여러 과업×참가자×조건 | 혼합효과 모형 |

→ 개괄은 [비모수·순위 기반 검정](/develop-wiki/knowledge/data-analytics/nonparametric-tests-rank-based/).

## 검증 범위

- 확인함: 통계량·동점 보정·χ²(k−1) 근사는 scipy 1.18.1 `friedmanchisquare` 문서(귀무가설, n>10·반복표본>6 조건, 동점 보정 통계량 반환)와 소스 코드로 확인. Demšar(2006, JMLR 7)의 Friedman 식, Iman–Davenport 보정, Nemenyi CD·q 값, Bonferroni–Dunn·Holm 설명, N>10·k>5 경험칙을 PDF 본문에서 읽고 식을 대조. 서지(Friedman 1937, JASA 32(200):675–701)와 Kendall's W 관계식·동점 보정식은 Wikipedia 로 확인(원 논문은 읽지 않음). 예의 순위·Q·C·W·F_F·Nemenyi 비교·Wilcoxon·Holm·몬테카를로 p 는 Python 으로 직접 계산(위 Q·p 는 손계산과 scipy 일치).
- 확인 못 함: Friedman 1937 원문과 Conover·Hollander–Wolfe 교재 본문(서지만 Wikipedia 로 언급 확인), Kendall's W 의 경계값 해석 기준, k = 3~4 에서 카이제곱 근사가 어긋나는 정도, 쌍별 Wilcoxon+Holm 의 문헌상 권고 여부, 위 TypeScript 함수는 실행하지 않았다(같은 식을 Python 으로 계산해 scipy 와 일치 확인).
- 주의: 예 데이터는 설명용 가상 값이며 실제 연구 결과가 아니다.
