---
title: CUPED 분산 감소와 가드레일 지표
aka: [CUPED, Controlled-experiment Using Pre-Experiment Data, Variance Reduction, Guardrail Metrics, Covariate Adjustment, 가드레일 지표, 사전 데이터 보정]
category: ui-ux
group: research
level: advanced
summary: 실험 전 기간의 같은 지표를 공변량으로 써서 A/B 테스트 지표의 분산을 줄이는 CUPED 의 원리를 시뮬레이션으로 확인하고, 가드레일 지표를 여러 개 둘 때 생기는 거짓 경보와 설정 원칙을 정리한다.
tags: [ux, ab-testing, cuped, variance-reduction, guardrail-metrics, statistics, experimentation]
related: [ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/quantitative-usability-confidence-intervals, ui-ux/deceptive-design-dark-patterns, engineering-practice/feature-flags]
sources:
  - https://exp-platform.com/cuped/
  - https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/sample-ratio-mismatch-and-other-trustrelated-guardrail-metrics/8DBB0F59AC7729D7BC6B94690DB9CCD5
  - https://www.microsoft.com/en-us/research/publication/a-dirty-dozen-twelve-common-metric-interpretation-pitfalls-in-online-controlled-experiments/
updatedAt: 2026-11-19
---

## 문제

- 사용자당 매출·체류 시간 같은 지표는 사용자 간 편차가 커서, 5% 개선도 몇 주를 돌려야 유의해진다. 트래픽이 적은 서비스는 끝내 못 본다.
- 주지표(전환)가 올랐는데 지연·환불·고객 문의가 나빠졌다. 주지표만 보고 출시했다.
- 기초 개념(SRM·검정력·peeking)은 [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)에 있다.

## 해법

### 1. CUPED 의 원리

- 같은 사용자의 **실험 전 기간** 지표 `X` 는 실험 중 지표 `Y` 와 상관이 있고, 배정 이전이라 처치의 영향을 받지 않는다.
- 보정: `Y_adj = Y − θ(X − mean(X))`, `θ = cov(Y, X) / var(X)`.
- 처치 효과 추정은 보정된 `Y_adj` 의 두 군 평균 차이. `X` 가 처치와 무관하므로 추정은 편향되지 않고, 분산은 대략 `(1 − ρ²)` 배가 된다(ρ = X, Y 의 상관). 이는 통계 표준 결과이며 아래 시뮬레이션으로 확인했다.
- 원 논문(Deng·Xu·Kohavi·Walker, WSDM 2013)은 Bing 실험에서 분산을 약 50% 줄였다고 보고한다(저자 페이지 초록 기준). 이는 같은 검정력을 절반의 사용자·기간으로 얻는 효과다.

### 2. 시뮬레이션 검증 (Node, 군당 1,000명, 2,000회 반복, 실제 효과 +0.1)

| ρ | θ 추정 평균 | 보정 후/전 분산비 | 이론 1−ρ² | 추정 효과(보정 후) |
| --- | --- | --- | --- | --- |
| 0 | 0.000 | 0.999 | 1.000 | 0.104 |
| 0.3 | 0.301 | 0.894 | 0.910 | 0.101 |
| 0.6 | 0.600 | 0.637 | 0.640 | 0.100 |
| 0.8 | 0.799 | 0.366 | 0.360 | 0.099 |
| 0.9 | 0.900 | 0.187 | 0.190 | 0.099 |

- 분산비가 `1 − ρ²` 와 일치하고 효과 추정은 여전히 0.1 근처다(편향 없음).
- ρ=0.6 이면 분산이 약 64% 로 줄어, 표준오차는 약 80%, 필요한 표본은 약 64% 로 줄어든다(표본 ∝ 분산).

```ts
function cuped(y: number[], x: number[]): number[] {
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(x), my = mean(y);
  let cov = 0, vx = 0;
  for (let i = 0; i < x.length; i++) { cov += (x[i]-mx)*(y[i]-my); vx += (x[i]-mx)**2; }
  const theta = cov / vx;                 // 두 군을 합친 데이터로 추정
  return y.map((v, i) => v - theta * (x[i] - mx));
}
```

### 3. 가드레일 지표

- 가드레일은 주지표가 좋아져도 **나빠지면 출시를 막는** 지표다. 조직 가드레일(지연, 오류율, 해지·환불, 고객 문의)과 실험 신뢰성 가드레일(SRM 등)로 나뉜다(Kohavi 외, 책 21장 목차 기준; 본문은 유료라 읽지 못했다).
- 시작 전에 정하고 방향(악화 허용 폭)을 적는다. 결과를 본 뒤 추가하면 거짓 경보·변명이 늘어난다.
- 가드레일이 여럿이면 우연한 경보가 늘어난다. A/A(효과 없음) 상태에서 지표 k 개를 단측 α=0.05 로 보면 하나 이상 경보가 날 확률을 시뮬레이션했다.

| k | 하나 이상 경보 확률 | 이론 1−0.95^k | Bonferroni(α/k) 적용 |
| --- | --- | --- | --- |
| 1 | 0.050 | 0.050 | 0.050 |
| 5 | 0.230 | 0.226 | 0.050 |
| 10 | 0.395 | 0.401 | 0.048 |
| 20 | 0.644 | 0.642 | 0.050 |

- 경보 임계를 두 단계로(조사 필요 / 출시 차단) 두는 방법은 이 노트의 제안이다. 교정 방식 선택은 팀 정책이다.

## 언제 쓰나

- CUPED: 지표가 사용자 단위로 반복 측정되고 실험 전 이력이 있을 때(매출, 사용 시간, 방문 횟수).
- 가드레일: 모든 실험. 특히 전환을 올리는 UI 변경(다크 패턴 위험).

## 체크리스트

- [ ] 공변량은 배정 이전 기간의 값이다
- [ ] 실험 전 기간 길이를 고정했고(예: 직전 N주) 모든 지표에서 일관된다
- [ ] 공변량이 없는 신규 사용자 처리를 정했다(보정 제외 또는 0 대체 — 팀 선택)
- [ ] θ 는 처치군·대조군을 합쳐 추정했다
- [ ] 가드레일 목록과 허용 악화 폭이 시작 전 문서에 있다
- [ ] 가드레일 개수가 많으면 다중 비교 교정을 정했다

## 흔한 실수·주의

- **실험 중 값을 공변량으로 사용.** 처치의 영향을 받으면 효과가 깎이거나 편향된다. 직접 시뮬레이션하지는 않았고 원리상의 경고다.
- **상관이 낮은 공변량에 기대.** ρ=0.3 이면 분산은 약 10%만 준다. 상관을 먼저 계산한다.
- **신규 사용자가 대부분인 제품.** 이력이 없으면 CUPED 효과가 없다.
- **보정으로 SRM·로깅 문제를 해결하려 함.** 분산 감소는 데이터 건전성과 별개다.
- **가드레일 무시: "주지표 승리".** 다크 패턴은 단기 전환에서 이긴다. → [다크 패턴](/develop-wiki/knowledge/ui-ux/deceptive-design-dark-patterns/)
- 위 시뮬레이션은 정규 분포·독립 사용자 가정이다. 매출 같은 긴 꼬리 분포·반복 측정에서는 실측으로 재확인한다. 논문 PDF 는 도구로 본문을 추출하지 못해 수식은 통계 표준 결과와 시뮬레이션에 의존했고, Bing 수치는 저자 페이지 초록 기준이다.
