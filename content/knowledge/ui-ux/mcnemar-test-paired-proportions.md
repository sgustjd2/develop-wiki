---
title: 대응 표본 두 비율 비교 — McNemar 검정
aka: [McNemar Test, McNemar's Test, Paired Proportions, Matched-Pairs Binary Data, Exact McNemar, Mid-p McNemar, 대응 비율 검정]
category: ui-ux
group: research
level: advanced
summary: 같은 참가자가 두 디자인을 모두 쓴 과업 성공률을 비교할 때, 엇갈린 쌍(한쪽만 성공)만으로 검정하는 McNemar 검정의 정확·mid-p·카이제곱 근사 버전과 선택 기준을 계산 예로 정리한다.
tags: [ux, statistics, mcnemar, paired-data, success-rate, within-subjects, binomial, small-sample]
related: [ui-ux/cochrans-q-test-paired-binary, ui-ux/paired-proportion-difference-confidence-interval, ui-ux/within-subjects-counterbalancing-latin-square, ui-ux/quantitative-usability-confidence-intervals, ui-ux/task-time-log-transform-geometric-mean, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/usability-testing-sample-size, ui-ux/ab-test-statistics-srm-power-sequential]
sources:
  - https://doi.org/10.1007/BF02295996
  - https://doi.org/10.1186/1471-2288-13-91
  - https://en.wikipedia.org/wiki/McNemar%27s_test
updatedAt: 2026-11-19
---

## 문제

- 30명이 기존 디자인 A 와 새 디자인 B 로 같은 과업을 모두 했다. A 성공 20명, B 성공 26명. "B 가 낫다"고 할 수 있나?
- 두 비율을 독립 표본처럼 비교(2×2 카이제곱, 두 비율 z 검정)하면 **같은 사람이 두 번 측정됐다는 사실**을 버린다. 개인차가 두 조건에 공통으로 들어간 정보가 사라지고, 독립 가정도 깨진다.
- 소표본 UX 연구에서는 엇갈린 쌍이 10개 안팎이라 근사 검정이 맞는지도 문제다.

## 해법

### 1. 표를 "쌍" 기준으로 다시 짠다

| | B 성공 | B 실패 |
| --- | --- | --- |
| **A 성공** | a = 18 | b = 2 |
| **A 실패** | c = 8 | d = 2 |

- a, d(둘 다 성공·둘 다 실패)는 두 디자인의 차이에 대해 아무 정보도 없다.
- 귀무가설 "두 디자인 성공률이 같다"는 `b` 와 `c` 가 같은 확률로 나온다는 말과 같다. 그래서 검정은 엇갈린 쌍 `b + c` 만 본다(McNemar 1947).
- 효과 크기는 성공률 차이 `(c − b) / N` = 6/30 = **20%p** 로 따로 보고한다.

### 2. 네 가지 계산법

| 방법 | 계산 | 성격 |
| --- | --- | --- |
| 정확(조건부) | `b ~ Binomial(b+c, 0.5)` 의 양쪽 꼬리 | 보수적 |
| mid-p | 한쪽 꼬리에서 관측값 확률의 절반을 빼고 2배 (= 양쪽 정확 p − 관측값 확률) | 정확 검정의 보수성을 줄임 |
| 카이제곱 근사 | `(b − c)² / (b + c)`, 자유도 1 | 가장 검정력 높음, 가끔 유의수준 초과 |
| 연속성 보정(Edwards) | `(|b − c| − 1)² / (b + c)` | 정확 검정과 비슷하게 보수적 |

```ts
const C = (n: number, k: number): number => (k === 0 ? 1 : (C(n, k - 1) * (n - k + 1)) / k);
function mcnemar(b: number, c: number) {
  const n = b + c, k = Math.min(b, c);
  let tail = 0;
  for (let i = 0; i <= k; i++) tail += C(n, i) / 2 ** n;
  const pk = C(n, k) / 2 ** n;
  return {
    exact: Math.min(1, 2 * tail),
    midP: b === c ? 1 - pk / 2 : 2 * (tail - pk / 2), // b=c 는 Fagerland 등의 별도 식
    chi2: (b - c) ** 2 / n, // p 는 자유도 1 카이제곱 상위 확률
  };
}
```

### 3. 계산 예 (Python 으로 직접 계산)

| b, c | 정확 p | mid-p | 카이제곱 (p) | 보정 카이제곱 (p) |
| --- | --- | --- | --- | --- |
| 2, 8 | 0.109 | 0.065 | 3.60 (0.058) | 2.50 (0.114) |
| 1, 9 | 0.021 | 0.012 | 6.40 (0.011) | 4.90 (0.027) |
| 12, 24 | 0.065 | 0.047 | 4.00 (0.046) | 3.36 (0.067) |

- 위 예(2, 8): 어느 방법으로도 5% 수준에서 유의하지 않다. 20%p 차이는 "엇갈린 쌍 10개"로는 확정하기 어렵다.
- (12, 24) 는 방법에 따라 결론이 갈린다. 정확·보정은 비유의, mid-p·카이제곱은 유의. **어떤 방법을 쓸지 분석 전에 정해 둔다.**
- 같은 데이터를 독립 두 비율 z 검정(20/30 vs 26/30)으로 돌리면 p ≈ 0.067. 이 예에서는 숫자가 비슷하게 나왔지만 근거가 되는 모형이 틀렸다.

### 4. 실제 1종 오류율 (정확 계산)

N 쌍, 엇갈린 쌍이 나올 확률 `pd`, 귀무가설 참(b·c 확률 동일)일 때 α=0.05 로 기각할 확률을 열거해 계산했다.

| N | pd | 정확 | mid-p | 카이제곱 | 보정 |
| --- | --- | --- | --- | --- | --- |
| 20 | 0.2 | 0.005 | 0.017 | 0.044 | 0.005 |
| 30 | 0.4 | 0.024 | 0.043 | 0.043 | 0.023 |
| 50 | 0.4 | 0.030 | 0.046 | 0.053 | 0.027 |

- 정확·보정 검정은 명목 5% 보다 훨씬 낮게 기각한다(검정력 손실). 카이제곱은 5% 근처이고 가끔 넘는다(N=50, pd=0.4 에서 0.053).
- Fagerland·Lydersen·Laake(2013)는 N=10~100 시나리오 9,595개를 비교해 같은 경향을 보고했다. 그들의 권고: 정확 조건부와 보정 카이제곱은 어느 상황에서도 권하지 않고, mid-p 를 기본 대안으로, 가끔의 소폭 초과를 받아들일 수 있으면 보정 없는 카이제곱을 쓴다.

## 언제 쓰나

- 같은 참가자가 두 조건을 모두 경험한 이분 결과: 과업 성공/실패, 오류 발생 여부, 첫 클릭 정답 여부, 선호(A/B 중 택1이 아닌, 조건별 "만족 여부").
- 같은 사용자의 전·후 측정(리디자인 전후 같은 패널).
- 셋 이상 조건의 이분 결과는 Cochran's Q 로 넓힌다 → [Cochran's Q 검정](/develop-wiki/knowledge/ui-ux/cochrans-q-test-paired-binary/)

## 주의·비용

- **전통 규칙 "b + c < 25 면 정확 검정"** 은 교과서·Wikipedia 에 널리 실린 기준이다. 위 계산과 Fagerland 등은 정확 검정이 소표본에서 지나치게 보수적임을 보여 준다. 규칙을 기계적으로 따르기보다 mid-p 를 기본으로 두는 편이 근거가 강하다.
- b + c 가 6 미만이면 정확 p 는 항상 0.05 를 넘는다(가장 극단인 0:5 도 2/32 = 0.0625). 이 경우 검정보다 기술 통계로 보고한다.
- **순서 효과.** 같은 사람이 A 다음 B 를 하면 두 번째가 학습으로 유리하다. McNemar 는 순서 효과를 제거하지 못한다. 순서를 역균형한다 → [응답자 내 설계와 순서 효과](/develop-wiki/knowledge/ui-ux/within-subjects-counterbalancing-latin-square/)
- p 값만 보고하지 말고 차이(20%p)와 그 구간을 함께 낸다. 대응 비율 차이의 구간은 Wald 식이 소표본에서 불안정해 별도 방법이 필요하다(아래 검증 범위).
- 과업 여러 개에 각각 McNemar 를 돌리면 다중 비교 문제가 생긴다 → [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/)
- 성공률 하나의 구간은 [정량 사용성 신뢰구간](/develop-wiki/knowledge/ui-ux/quantitative-usability-confidence-intervals/), 시간 비교는 [로그 변환·기하평균](/develop-wiki/knowledge/ui-ux/task-time-log-transform-geometric-mean/)을 쓴다.

## 비교

| 상황 | 검정 |
| --- | --- |
| 같은 사람, 두 조건, 이분 결과 | McNemar |
| 다른 사람(그룹 분리), 두 조건, 이분 결과 | 두 비율 검정·Fisher 정확 검정 |
| 같은 사람, 셋 이상 조건, 이분 결과 | Cochran's Q |
| 같은 사람, 두 조건, 연속 결과(시간) | 대응 t (로그 변환 후) |

## 체크리스트

- [ ] 데이터를 참가자 단위 쌍 표(a, b, c, d)로 정리
- [ ] 분석 방법(mid-p 또는 카이제곱)을 사전에 정함
- [ ] 조건 순서를 역균형
- [ ] 차이(%p)와 엇갈린 쌍 수를 함께 보고

## 검증 범위

- McNemar(1947) 원문은 서지(Psychometrika 12(2), 153–157)와 DOI 만 확인했고 본문은 읽지 않았다. 공식은 Fagerland 등(2013, PMC 공개본)과 Wikipedia 설명을 따랐다.
- 표의 p 값과 1종 오류율은 Python 으로 직접 계산했다. Fagerland 등의 수치는 재현하지 않았다.
- 대응 비율 차이의 신뢰구간은 이 노트에 싣지 않았다. Newcombe(1998) 방법 10 은 [대응 비율 차의 신뢰구간](/develop-wiki/knowledge/ui-ux/paired-proportion-difference-confidence-interval/)에서 원문 표로 검산했다. Bonett–Price 등 다른 방법은 확인하지 않았다.
