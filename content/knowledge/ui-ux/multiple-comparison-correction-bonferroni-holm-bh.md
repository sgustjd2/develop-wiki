---
title: 다중 비교 교정 (Bonferroni·Holm·Benjamini–Hochberg)
aka: [Multiple Comparisons Correction, Bonferroni, Holm-Bonferroni, Benjamini-Hochberg, FWER, FDR, 다중 검정 보정]
category: ui-ux
group: research
level: advanced
summary: 한 실험에서 여러 지표·변형·세그먼트를 검정할 때 FWER 을 통제하는 Bonferroni·Holm 과 FDR 을 통제하는 Benjamini–Hochberg 의 절차·차이를 예제와 시뮬레이션으로 정리한다.
tags: [ux, ab-testing, statistics, multiple-comparisons, bonferroni, holm, benjamini-hochberg, fdr, fwer]
related: [ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/cuped-variance-reduction-guardrail-metrics, ui-ux/quantitative-usability-confidence-intervals, ui-ux/task-time-log-transform-geometric-mean, ui-ux/ux-metrics-sus-heart-ab-test]
sources:
  - https://doi.org/10.1111/j.2517-6161.1995.tb02031.x
  - https://www.jstor.org/stable/4615733
  - https://en.wikipedia.org/wiki/False_discovery_rate
  - https://doi.org/10.1214/aos/1013699998
updatedAt: 2026-11-19
simulation: multiple-comparison
---

## 문제

- 지표 20개를 α=0.05 로 각각 검정하면 모두 효과가 없어도 하나 이상 "유의"할 확률이 약 64%다(시뮬레이션 0.641). 기초는 [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)에 있다.
- 지표·세그먼트·변형을 늘릴수록 "우연히 유의한 결과"를 보고하기 쉽다.
- 이 노트는 보정 방법 세 가지의 **절차와 선택 기준**이다.

## 해법

### 1. 두 가지 오류율

- **FWER**: 참인 귀무가설을 하나라도 기각할 확률. 출시 결정처럼 한 번의 오탐도 곤란할 때.
- **FDR**: 기각한 것 중 거짓 기각의 기대 비율. 탐색 단계에서 후보를 추릴 때.

### 2. 절차 (p 를 오름차순 정렬 `p(1) ≤ … ≤ p(m)`)

| 방법 | 규칙 | 통제 |
| --- | --- | --- |
| Bonferroni | `p ≤ α/m` 인 것 기각 | FWER, 의존성 가정 불필요 |
| Holm | `p(k) ≤ α/(m−k+1)` 를 k=1 부터 확인, 처음 실패한 곳에서 중단 | FWER, 의존성 가정 불필요. Bonferroni 보다 같거나 더 많이 기각 |
| Benjamini–Hochberg | `p(k) ≤ (k/m)·α` 를 만족하는 **가장 큰** k 를 찾아 1..k 모두 기각 | FDR (독립 또는 양의 의존 등 조건에서) |

- 의존성이 임의일 때 FDR 통제용으로 Benjamini–Yekutieli(기준에 조화수 `Σ1/i` 로 나눔)가 있다. 이 노트는 BY 를 시뮬레이션하지 않았다.
- BH 의 FDR 보장은 "무조건"이 아니다. 독립·양의 상관 등 조건 아래의 결과다(Wikipedia 요약으로 확인; 원 논문 본문은 읽지 못했다).

```ts
const sortIdx = (p: number[]) => p.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);

function holm(p: number[], a = 0.05): boolean[] {
  const o = sortIdx(p), r = p.map(() => false);
  for (let k = 0; k < o.length; k++) {
    if (o[k][0] <= a / (o.length - k)) r[o[k][1]] = true; else break;
  }
  return r;
}
function bh(p: number[], a = 0.05): boolean[] {
  const m = p.length, o = sortIdx(p); let K = 0;
  o.forEach(([v], k) => { if (v <= (a * (k + 1)) / m) K = k + 1; });
  const r = p.map(() => false);
  o.slice(0, K).forEach(([, i]) => (r[i] = true));
  return r;
}
```

### 3. 계산 예 (Node 로 실행)

p = [0.001, 0.008, 0.012, 0.021, 0.040, 0.300], m=6, α=0.05.

| 방법 | 기각 | 이유 |
| --- | --- | --- |
| 보정 없음 | 1~5번 | p ≤ 0.05 |
| Bonferroni (0.05/6 = 0.00833) | 1, 2번 | 0.012 > 0.00833 |
| Holm | 1, 2, 3번 | 0.012 ≤ 0.05/4 = 0.0125, 0.021 > 0.05/3 = 0.0167 에서 중단 |
| BH | 1~5번 | k=5 에서 0.040 ≤ 5/6·0.05 = 0.0417 |

### 4. 시뮬레이션 (Python, 각 20,000회)

가설 20개 중 15개는 효과 0, 5개는 z 통계량이 평균 3 만큼 이동한 참 효과(정규 근사, 양측 검정, α=0.05).

| 방법 | 하나 이상 거짓 기각(FWER) | 참 효과 검출률 | FDR |
| --- | --- | --- | --- |
| 보정 없음 | 0.533 | 0.852 | 0.130 |
| Bonferroni | 0.035 | 0.492 | 0.012 |
| Holm | 0.041 | 0.505 | 0.013 |
| BH | 0.149 | 0.654 | 0.036 |

- 20개 모두 효과 0 이면 FWER: 보정 없음 0.641, Bonferroni·Holm 0.048, BH 0.049 (전부 귀무일 때 BH 도 FWER 를 통제).
- 보정은 거짓 경보를 줄이는 대신 참 효과 검출률(검정력)을 깎는다. Holm 은 Bonferroni 보다 약간 높다.
- BH 는 검출률이 더 높지만 참 효과가 섞여 있을 때 FWER 는 0.149 로 5% 를 넘는다. FDR 은 약 3.6% 로 5% 이하다.

## 언제 쓰나

- 출시 판단에 쓰는 지표·변형이 여러 개이고 한 번의 오탐도 곤란: Holm(또는 Bonferroni).
- 세그먼트·지표를 훑는 탐색 분석에서 후속 검증 후보를 추림: BH.
- 가장 먼저 할 일은 **주지표 1개와 가드레일 목록을 사전에 정하는 것**이다. 보정은 그 뒤의 수단이다.

## 주의·비용

- 가설 "집합"을 사후에 정하면 m 이 의미가 없다. 본 지표 수·세그먼트 수는 분석 전에 확정한다.
- 가드레일은 "나빠지지 않았다"를 확인하는 용도라 거짓 경보와 놓침 중 무엇이 더 비싼지에 따라 α 를 달리한다. 일률적으로 α/m 을 적용하면 놓침이 늘어난다 → [CUPED·가드레일](/develop-wiki/knowledge/ui-ux/cuped-variance-reduction-guardrail-metrics/)
- BH 로 "FDR 5%" 를 얻어도 **개별 결과가 95% 참**이라는 뜻이 아니다. 기각 집합 전체의 기대 비율이다.
- p 값 대신 보정된 구간(simultaneous CI)을 쓰는 방법도 있으나 이 노트는 다루지 않았다.
- 정규 근사 시뮬레이션이다. 지표 간 상관이 큰 현실 데이터는 별도 확인이 필요하다.
- 소표본 사용성 테스트의 과업별 검정에도 같은 문제가 있다 → [정량 사용성 신뢰구간](/develop-wiki/knowledge/ui-ux/quantitative-usability-confidence-intervals/), [과업 시간 로그 변환](/develop-wiki/knowledge/ui-ux/task-time-log-transform-geometric-mean/)
