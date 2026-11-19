---
title: 응답자 내 설계와 순서 효과 — 역균형·라틴 방진·Williams 설계
aka: [Within-Subjects Design, Repeated Measures, Order Effects, Carryover Effect, Counterbalancing, Latin Square, Williams Design, Balanced Latin Square, 반복 측정 설계, 역균형화]
category: ui-ux
group: research
level: advanced
summary: 같은 참가자가 여러 디자인을 모두 써 보는 응답자 내 설계에서 학습·피로 같은 순서 효과를 역균형으로 상쇄하는 방법과, 위치와 바로 앞 조건까지 균형을 맞추는 Williams 라틴 방진 구성법을 정리한다.
tags: [ux, research, experiment-design, within-subjects, counterbalancing, latin-square, williams-design, order-effects]
related: [ui-ux/mcnemar-test-paired-proportions, ui-ux/task-time-log-transform-geometric-mean, ui-ux/usability-testing-sample-size, ui-ux/usability-test-tasks-think-aloud, ui-ux/ux-research-method-selection, ui-ux/holdout-novelty-primacy-effects, ui-ux/survey-design-response-bias]
sources:
  - https://www.nngroup.com/articles/between-within-subjects/
  - https://doi.org/10.1071/CH9490149
  - https://cran.r-project.org/package=crossdes
updatedAt: 2026-11-19
---

## 문제

- 디자인 A·B·C·D 를 비교하려 한다. 그룹을 나누면(응답자 간) 조건마다 사람을 따로 모아야 하고, 개인차가 조건 차이를 덮는다.
- 한 사람이 넷을 모두 쓰게 하면(응답자 내) 사람 수가 줄고 개인차가 상쇄된다. 대신 **순서 효과**가 생긴다.
  - 학습·전이: 앞 과업에서 익힌 것이 뒤 조건을 돕는다.
  - 피로·지루함: 뒤로 갈수록 느려지고 대충 한다.
  - 이월(carryover): 바로 앞 조건이 다음 조건 판단에 영향을 준다(예: 복잡한 C 다음에 본 D 가 상대적으로 쉬워 보임).
- 모든 참가자가 A→B 순서로 하면 순서 효과가 디자인 차이와 완전히 섞인다.

## 해법

### 1. 순서 효과가 얼마나 왜곡하나 (시뮬레이션)

두 디자인의 참 차이는 0, 두 번째 과업이 연습 효과로 15% 빨라진다고 두고 12명 실험을 20,000회 반복했다(Python, 시드 고정).

| 배치 | 추정한 B/A 시간 비(기하평균) |
| --- | --- |
| 전원 A→B | 0.852 (B 가 15% 빠르다는 가짜 결론) |
| 절반 A→B, 절반 B→A | 1.003 |

- 순서를 반반 나누면 연습 효과가 두 조건에 똑같이 들어가 상쇄된다. 이것이 **역균형(counterbalancing)** 이다.
- 상쇄는 평균에서만 일어난다. 연습 효과 자체가 분산을 키우므로 검정력은 순서 효과가 없을 때보다 낮다.

### 2. 조건 수에 따른 선택

| 조건 수 k | 방법 | 필요한 순서 수 |
| --- | --- | --- |
| 2 | AB / BA 반반 | 2 |
| 3 | 완전 역균형 (모든 순열) 또는 Williams | 6 |
| 4 이상 | Williams 라틴 방진 | k (짝수) 또는 2k (홀수) |
| 많음 | 참가자마다 무작위 순서 | — |

- 완전 역균형은 k! 개 순서가 필요하다. k=4 면 24, k=5 면 120 으로 참가자 수가 감당이 안 된다.
- 단순 순환 라틴 방진(ABCD, BCDA, CDAB, DABC)은 각 조건이 각 위치에 한 번씩 오지만, **A 바로 다음은 늘 B** 다. 직접 세어 보면 12개 가능한 "앞→뒤" 쌍 중 AB·BC·CD·DA 4개만 3번씩 나온다. 이월 효과가 특정 조건에 몰린다.

### 3. Williams 설계

Williams(1949)는 각 조건이 각 위치에 같은 횟수로 오고, **각 조건이 다른 모든 조건 바로 뒤에 같은 횟수로 오는** 방진을 제시했다. k 가 짝수면 k 행, 홀수면 2k 행이 필요하다.

```ts
// 0..k-1 조건의 Williams 순서 목록. 행 = 참가자 순서
function williams(k: number): number[][] {
  const first = [0];
  let lo = 1, hi = k - 1;
  for (let i = 1; i < k; i++) first.push(i % 2 ? lo++ : hi--); // 0, 1, k-1, 2, k-2, ...
  const rows = Array.from({ length: k }, (_, r) => first.map((x) => (x + r) % k));
  return k % 2 ? [...rows, ...rows.map((r) => [...r].reverse())] : rows; // 홀수는 거울 행 추가
}
```

직접 실행해 균형을 확인했다.

| k | 순서 | 앞→뒤 쌍 |
| --- | --- | --- |
| 3 | ABC BCA CAB CBA ACB BAC | 6쌍 모두 2회 |
| 4 | ABDC BCAD CDBA DACB | 12쌍 모두 1회 |
| 5 | 10행 | 20쌍 모두 2회 |

- k=3, 5, 6 에서도 모든 조건이 각 위치에 같은 횟수로 나오는 것을 확인했다.
- 참가자 수는 행 수의 배수로 모은다(k=4 면 4, 8, 12 …명). 남는 인원이 생기면 균형이 깨진다.
- R 패키지 `crossdes` 의 `williams()` 가 같은 목적의 구현이다(이 노트의 코드와 출력 행 순서는 다를 수 있다).

### 4. 과업과 조건을 함께 돌릴 때

- 조건마다 같은 과업을 반복하면 두 번째부터 정답을 안다. 과업 세트를 조건 수만큼 만들고(난이도 맞춤) **과업 세트도 별도로 역균형**한다.
- 예: 디자인 A·B × 과업 세트 1·2 → A1-B2, B1-A2, A2-B1, B2-A1 네 순서.

## 언제 쓰나

- 참가자 모집이 비싸거나 어려운 정성·소표본 정량 테스트(보조기술 사용자 등).
- 개인차가 큰 측정(과업 시간, 선호 판단)으로 조건 간 차이를 보고 싶을 때.
- 선호를 직접 물을 때. 둘 다 써 봐야 비교 판단이 가능하다.

응답자 간 설계가 나은 경우(NN/g 정리 기준):

- 한 사람이 두 조건에 속할 수 없는 변수(숙련도, 사용자 유형).
- 한 조건 경험이 되돌릴 수 없게 사람을 바꾸는 경우(한 번 배운 절차를 잊게 할 수 없음).
- 세션을 짧게 해야 하는 원격 비진행형 테스트.

## 주의·비용

- 역균형은 **대칭적인** 순서 효과만 상쇄한다. A→B 의 전이가 B→A 의 전이보다 훨씬 크면(비대칭 이월) 평균에도 편향이 남는다. 순서별로 결과를 나눠 확인한다.
- Williams 는 바로 앞 조건(1차 이월)만 균형을 맞춘다. 두 단계 앞의 영향은 보장하지 않는다.
- 세션이 길어진다. 조건 사이에 휴식이나 무관한 과제를 넣는다.
- 분석은 대응 구조를 반영한다: 이분 결과는 [McNemar](/develop-wiki/knowledge/ui-ux/mcnemar-test-paired-proportions/), 시간은 로그 변환 후 대응 비교 → [로그 변환·기하평균](/develop-wiki/knowledge/ui-ux/task-time-log-transform-geometric-mean/). 순서를 모형의 요인으로 넣으면 순서 효과 크기도 본다.
- 순서를 무작위로만 정하면 소표본에서 우연히 한쪽으로 쏠린다. 12명 이하라면 무작위보다 정해진 균형 순서표를 참가자에게 배정한다.
- 신규성 효과(새 디자인이라 일단 더 써 봄)는 순서 효과와 다르다 → [홀드아웃·신규성 효과](/develop-wiki/knowledge/ui-ux/holdout-novelty-primacy-effects/)

## 체크리스트

- [ ] 응답자 내가 맞는지 확인(되돌릴 수 없는 학습, 집단 변수 여부)
- [ ] 조건 수에 맞는 순서표(AB/BA, Williams) 작성, 참가자 수를 행 수 배수로
- [ ] 과업 세트도 역균형
- [ ] 결과를 순서별로 나눠 비대칭 이월 확인

## 검증 범위

- Williams(1949) 원문은 CSIRO 서지·초록(짝수 n 은 n 반복, 홀수는 2n 반복)만 확인했다. 위 구성 알고리즘은 원문 표를 옮긴 것이 아니라 널리 쓰이는 구성법을 직접 구현하고 균형 성질을 스크립트로 검사한 것이다.
- `crossdes` 패키지의 출력과 행 단위로 대조하지는 않았다.
- 시뮬레이션의 연습 효과(15%)는 예시값이다.
