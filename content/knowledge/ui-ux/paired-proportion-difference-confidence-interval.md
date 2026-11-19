---
title: 대응 비율 차의 신뢰구간 — Newcombe 방법 10 과 Wald 비교
aka: [Confidence Interval for Paired Proportion Difference, Newcombe Method 10, Newcombe Hybrid Score Interval, Wald Interval Paired, 대응 성공률 차이 구간]
category: ui-ux
group: research
level: advanced
summary: 같은 참가자의 두 디자인 성공률 차이에 신뢰구간을 붙일 때, Wald 식의 문제와 Newcombe(1998) 방법 10(윌슨 구간 결합, φ 연속성 보정)을 논문 표로 검산한 계산과 직접 계산한 포함확률로 비교한다.
tags: [ux, statistics, confidence-interval, paired-data, newcombe, wilson-score, success-rate, within-subjects]
related: [ui-ux/mcnemar-test-paired-proportions, ui-ux/cochrans-q-test-paired-binary, ui-ux/quantitative-usability-confidence-intervals, ui-ux/within-subjects-counterbalancing-latin-square, ui-ux/usability-testing-sample-size, ui-ux/ab-test-statistics-srm-power-sequential]
sources:
  - https://doi.org/10.1002/(SICI)1097-0258(19981130)17:22%3C2635::AID-SIM954%3E3.0.CO;2-C
  - https://www.site.uottawa.ca/~nat/Courses/csi5388/Newcombe.1998.pdf
  - https://statsdirect.co.uk/help/proportions/paired.htm
updatedAt: 2026-11-19
---

검정(p 값)은 [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/)에, 성공률 하나의 구간은 [정량 사용성 신뢰구간](/develop-wiki/knowledge/ui-ux/quantitative-usability-confidence-intervals/)에 있다. 이 노트는 그 사이, **대응된 두 성공률의 차이**에 구간을 붙이는 방법이다.

## 문제

- 30명이 A·B 를 모두 썼다. B 만 성공 8명, A 만 성공 2명, 둘 다 성공 18명, 둘 다 실패 2명. 차이는 +20%p. 이 20%p 는 얼마나 불확실한가?
- 교과서 Wald 식(차이 ± z·SE)은 소표본에서 구간이 [−1, 1] 을 넘거나, 엇갈린 쌍이 0이면 폭이 0인 구간이 나온다(Newcombe 1998).
- p 값만 보고하면 효과의 크기와 불확실성을 전달하지 못한다.

## 해법

### 1. 표기 (Newcombe 1998 표 I)

| | 둘째 + | 둘째 − |
| --- | --- | --- |
| **첫째 +** | e | f |
| **첫째 −** | g | h |

- 차이 θ̂ = (f − g)/n. "첫째"를 B, "둘째"를 A 로 두면 θ̂ = B 성공률 − A 성공률.

### 2. 두 방법

**Wald (논문의 방법 1)**: θ̂ ± z·SE, SE = √(f + g − (f − g)²/n) / n.

**방법 10 (윌슨 구간 결합 + φ 연속성 보정)**:

1. 두 주변 성공률 p₁ = (e+f)/n, p₂ = (e+g)/n 각각의 윌슨 점수 구간 (l₂, u₂), (l₃, u₃) 을 구한다.
2. φ̂ = (eh − fg) / √((e+f)(g+h)(e+g)(f+h)), 분모가 0 이면 0. **방법 10은 eh > fg 일 때 분자를 max(eh − fg − n/2, 0) 으로 바꾼다.**
3. δ = √(dl₂² − 2φ̂·dl₂·du₃ + du₃²), ε = √(du₂² − 2φ̂·du₂·dl₃ + dl₃²). (dl = p − l, du = u − p)
4. 구간 = [θ̂ − δ, θ̂ + ε].

```ts
const Z = 1.959964;
function wilson(x: number, n: number): [number, number] {
  const p = x / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d;
  const h = (Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n))) / d;
  return [c - h, c + h];
}
function newcombe10(e: number, f: number, g: number, h: number): [number, number] {
  const n = e + f + g + h, t = (f - g) / n, p2 = (e + f) / n, p3 = (e + g) / n;
  const [l2, u2] = wilson(e + f, n), [l3, u3] = wilson(e + g, n);
  const den = (e + f) * (g + h) * (e + g) * (f + h);
  let num = e * h - f * g;
  if (num > 0) num = Math.max(num - n / 2, 0); // φ 연속성 보정
  const phi = den === 0 ? 0 : num / Math.sqrt(den);
  const [dl2, du2, dl3, du3] = [p2 - l2, u2 - p2, p3 - l3, u3 - p3];
  return [t - Math.sqrt(dl2 ** 2 - 2 * phi * dl2 * du3 + du3 ** 2),
          t + Math.sqrt(du2 ** 2 - 2 * phi * du2 * dl3 + dl3 ** 2)];
}
```

### 3. 논문 표로 검산 (Python 으로 같은 식 구현)

| (e, f, g, h) | 직접 계산 방법 10 | 논문 표 III |
| --- | --- | --- |
| 36, 12, 2, 0 | 0.0569, 0.3404 | 0.0569, 0.3404 |
| 20, 12, 2, 16 | 0.0562, 0.3292 | 0.0562, 0.3292 |
| 35, 14, 0, 1 | 0.1461, 0.4175 | 0.1461, 0.4175 |
| 54, 0, 0, 0 | −0.0664, 0.0664 | −0.0664, 0.0664 |
| 1, 97, 1, 1 | 0.8737, 0.9850 | 0.8736, 0.9850 |

- 마지막 행 하한이 넷째 자리에서 0.0001 다르다. 논문 표 III 에서 같은 행의 방법 8 은 0.8737 이고, 이 행은 eh < fg 라 방법 10 이 방법 8 과 같아야 하므로 논문 쪽 반올림·인쇄 차이로 보인다.
- Wald 는 표 II 의 (e+h=36, f=12, g=2) 0.0642, 0.3358 과 일치했다.

### 4. UX 예 (직접 계산)

| (e, f, g, h) | θ̂ | Wald 95% | 방법 10 95% |
| --- | --- | --- | --- |
| 18, 8, 2, 2 (n=30) | 0.200 | 0.006, 0.394 | **−0.012**, 0.394 |
| 25, 4, 0, 1 (n=30) | 0.133 | 0.012, 0.255 | **−0.016**, 0.300 |
| 8, 3, 0, 1 (n=12) | 0.250 | 0.005, 0.495 | **−0.066**, 0.527 |

- 세 예 모두 Wald 는 0을 제외하고 방법 10은 0을 포함한다. 첫 예는 McNemar 정확 p 0.109, mid-p 0.065 와 같은 방향의 결론이다.
- 엇갈린 쌍이 한쪽으로만 있을 때(g = 0) Wald 의 상한이 특히 좁다.

### 5. 포함확률 (정확 열거로 직접 계산, 명목 95%)

| n | (π₁, π₂, π₃, π₄) | Wald | 방법 10 |
| --- | --- | --- | --- |
| 12 | 0.70, 0.15, 0.05, 0.10 | 0.841 | 0.990 |
| 20 | 0.55, 0.15, 0.05, 0.25 | 0.937 | 0.960 |
| 30 | 0.60, 0.20, 0.05, 0.15 | 0.932 | 0.963 |
| 30 | 0.45, 0.05, 0.05, 0.45 | 0.967 | 0.991 |

- 4칸 다항분포의 모든 표를 열거해 참값 θ 를 포함하는 확률을 더했다. 몇 개 점일 뿐이며 논문의 전체 평가(수천 개 모수 점)를 대신하지 않는다.
- 논문 결론: 방법 10은 계산이 간단하면서 포함확률이 방법 6(무조건 mid-p 프로파일)과 비슷하고 더 좁을 수 있다. Wald·조건부 정확 방법은 포함확률과 이상 구간(경계 초과, 폭 0) 문제가 있다.

## 언제 쓰나

- 응답자 내 설계에서 두 디자인의 성공률 차이를 보고할 때, McNemar p 값과 함께.
- 리디자인 전후 같은 패널의 성공률 변화.
- 동등성 판단(차이가 ±Δ 안인가)에도 구간을 쓸 수 있다(논문 논의 절).

## 주의·비용

- 방법 10은 일치 쌍의 나뉨(e 와 h)에 따라 구간이 달라진다. 같은 f, g 라도 e:h 가 다르면 결과가 다르다(표 III 의 의도된 성질).
- 소표본에서 방법 10은 보수적인 경우가 있다(위 n=12 예 0.990). 폭이 넓은 건 표본이 작아서이지 방법 탓만은 아니다. 표본 크기 계획은 [사용성 표본 크기](/develop-wiki/knowledge/ui-ux/usability-testing-sample-size/).
- 셋 이상 조건이면 쌍별 구간마다 다중성 문제가 생긴다 → [Cochran's Q](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/)
- 이 노트는 Bonett–Price, Tango 점수 구간 등 다른 방법을 비교하지 않았다.

## 검증 범위

- 확인함: 방법 1·10 의 식, φ̂ 처리 규칙, 표 II·III 수치, 논문 결론은 Newcombe(1998) PDF 사본 원문. Python 구현으로 표 III 다섯 행과 표 II 한 행을 검산. 표 4·5 는 직접 계산. StatsDirect 도움말의 예(Armitage·Berry, 20/12/2/16, n=50)가 제시한 0.056156~0.329207 도 위 둘째 행과 일치한다.
- 확인 못 함: 표 III 마지막 행 0.0001 차이의 확정 원인, 논문 이후 비교 연구(Fagerland 등 2014 의 대응 비율 구간 권고)의 결론, 위 TypeScript 함수 실행(같은 식을 Python 으로 검산).
