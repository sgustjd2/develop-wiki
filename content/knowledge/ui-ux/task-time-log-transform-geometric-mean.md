---
title: 과업 시간 데이터의 로그 변환·기하평균·신뢰구간
aka: [Task Time Analysis, Log Transform, Geometric Mean, Time on Task Confidence Interval, Skewed Time Data, 과업 완료 시간 분석]
category: ui-ux
group: research
level: advanced
summary: 오른쪽으로 치우친 과업 시간을 로그로 바꿔 평균·t 구간을 구한 뒤 되돌려 기하평균 구간으로 보고하는 절차와, 산술평균 구간과의 포괄률 차이를 시뮬레이션으로 확인한다.
tags: [ux, metrics, statistics, time-on-task, log-transform, geometric-mean, confidence-interval, small-sample]
related: [ui-ux/quantitative-usability-confidence-intervals, ui-ux/usability-testing-sample-size, ui-ux/usability-test-tasks-think-aloud, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/ab-test-statistics-srm-power-sequential]
sources:
  - https://measuringu.com/average-times/
  - https://en.wikipedia.org/wiki/Log-normal_distribution
updatedAt: 2026-11-19
---

## 문제

- 과업 완료 시간은 하한이 0 이고 오른쪽 꼬리가 길다. 한 명이 헤매면 평균이 크게 올라간다.
- 10명 시간에 `평균 ± t·SE` 를 그대로 쓰면 구간 하한이 음수가 되거나 "전형적인 사용자"보다 훨씬 큰 값을 중심으로 삼게 된다.
- 성공률 구간은 [정량 사용성 신뢰구간](/develop-wiki/knowledge/ui-ux/quantitative-usability-confidence-intervals/)에서 다뤘다. 이 노트는 연속값인 **시간**이다.

## 해법

### 1. 절차 (로그 정규 가정)

1. 시간 `x_i` 에 자연로그를 취한다: `l_i = ln x_i`. 시간이 0 이하인 값은 없어야 한다.
2. 로그 값의 평균 `m`, 표준편차 `s`, 표본 크기 `n`.
3. `m ± t(n−1, 0.975)·s/√n` 으로 로그 척도 구간을 만든다.
4. `exp` 로 되돌린다. `exp(m)` 이 **기하평균**이고, 구간은 곱셈 구간(`exp(m)` 의 몇 배 안팎)이 된다.

MeasuringU 는 소표본(25명 미만)에서 중앙값보다 기하평균이 중간값 추정에 유리하다고 보고하고, 표본이 크면 중앙값을 권한다. 산술평균은 꼬리 때문에 대표값으로 부적절하다고 본다(그 글의 시뮬레이션 수치는 직접 재현하지 않았다).

```ts
function geoMeanCI(times: number[], t: number): [number, number, number] {
  const l = times.map(Math.log);
  const n = l.length, m = l.reduce((a, b) => a + b) / n;
  const sd = Math.sqrt(l.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
  const h = (t * sd) / Math.sqrt(n); // t = t(n-1, 0.975), n=10 이면 2.262
  return [Math.exp(m), Math.exp(m - h), Math.exp(m + h)];
}
```

### 2. 계산 예 (직접 실행)

10명 시간(초): 34, 41, 52, 38, 95, 47, 60, 44, 38, 210.

| 방식 | 중심 | 95% 구간 |
| --- | --- | --- |
| 산술평균 + t | 65.9 | 27.5 ~ 104.3 |
| 기하평균 (로그 t) | 55.1 | 37.1 ~ 82.0 |
| 중앙값 | 45.5 | (구간은 별도 방법 필요) |

- 210초 한 값이 산술 구간을 넓히고 중심을 끌어올린다. 기하평균은 이 값의 영향이 작다.
- t(9, 0.975)=2.262 는 t 분포 밀도를 수치 적분해 확인했다. TS 함수는 Node 로 실행해 위 기하평균 구간과 일치함을 확인했다.

### 3. 포괄률 시뮬레이션

로그 정규 모집단(`ln x ~ N(ln 60, 0.7²)`, 참 중앙값 60초, 참 산술평균 76.66초)에서 각 n 마다 20,000회 표본을 뽑아 95% 구간이 참값을 포함한 비율을 셌다(난수 시드 고정, Python 직접 실행).

| n | 산술 t 구간이 평균 포함 | 로그 구간이 중앙값 포함 | 로그 구간이 산술평균 포함 | 평균 구간 폭(산술/로그, 초) |
| --- | --- | --- | --- | --- |
| 5 | 0.886 | 0.950 | 0.908 | 125.4 / 120.2 |
| 10 | 0.896 | 0.950 | 0.835 | 77.6 / 62.8 |
| 20 | 0.907 | 0.947 | 0.681 | 53.0 / 40.0 |
| 40 | 0.926 | 0.948 | 0.420 | 37.5 / 27.1 |

- 산술평균 t 구간은 치우친 분포에서 95% 목표에 못 미친다(n=10 에서 0.896). n 이 커져도 천천히 회복한다.
- 로그 구간은 **기하평균(=이 모형에서 중앙값)** 을 0.95 근처로 포함하고 폭도 더 좁다.
- 중요한 경고: 로그 구간은 **산술평균**의 구간이 아니다. n 이 커질수록 산술평균 포함률이 0.42 까지 내려간다. 기하평균 구간을 "평균 시간의 구간"이라 부르면 안 된다.

## 언제 쓰나

- 5~30명 규모 사용성 테스트에서 과업 시간을 보고할 때, 리디자인 전후 시간 비교.
- 두 조건 비교: 로그 변환 값에 대응(paired) t 검정을 쓰고, 차이를 `exp` 하면 "B 는 A 의 약 몇 배" 라는 비율로 말할 수 있다.

## 주의·비용

- **로그 정규 가정.** 시뮬레이션은 로그 정규에서 뽑았기에 잘 맞는다. 실제 분포가 다르면 포괄률은 달라진다. 이 노트는 다른 분포는 시험하지 않았다.
- **시간 상한·포기.** 실패·포기한 과업의 시간을 어떻게 다룰지(제외, 상한값, 생존분석)에 따라 값이 바뀐다. 보통 성공한 시도만 시간을 보고하고 성공률을 따로 낸다.
- **재변환.** 총 시간(예: 사용자 수 × 평균 시간) 을 추정하려면 산술평균이 필요하다. 목적에 맞는 대표값을 고른다.
- 기하평균은 "전형적인 값"이지 "예상 합계"가 아니다. 보고서에 어떤 평균인지 적는다.
- 같은 참가자의 여러 과업은 독립이 아니다. 과업별로 따로 계산하고, 과업 간 비교는 참가자 효과를 고려한다.
- 여러 과업에 각각 검정하면 다중 비교 문제가 생긴다 → [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/)

## 체크리스트

- [ ] 시간 측정 구간(시작·종료 기준)을 사전 정의
- [ ] 성공 시도만 쓸지, 실패 처리 방식을 기록
- [ ] 로그 값 히스토그램으로 대략 대칭인지 확인
- [ ] "기하평균과 95% 구간(곱셈 구간)" 으로 명시, 산술평균과 혼동 금지
- [ ] 표본이 크면(약 25명 이상) 중앙값도 함께 제시
