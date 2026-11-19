---
title: UX 지표 (SUS·HEART·과업 성공률·A/B 테스트)
aka: [UX Metrics, System Usability Scale, SUS, HEART Framework, Goals-Signals-Metrics, Task Success Rate, A/B Testing, PULSE]
category: ui-ux
group: research
level: intermediate
summary: 사용성 인식(SUS), 제품 목표 연결형 지표 틀(HEART·GSM), 과업 성공률, A/B 테스트로 UX 를 수치화하는 방법과 각 지표를 잘못 읽는 흔한 함정.
tags: [ux, metrics, sus, heart, ab-testing, analytics, experimentation]
related: [ui-ux/usability-testing-sample-size, ui-ux/ux-research-method-selection, ui-ux/deceptive-design-dark-patterns, ui-ux/journey-map-service-blueprint, engineering-practice/feature-flags, mobile-dev/staged-rollout-remote-config, performance/core-web-vitals]
sources:
  - https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/
  - https://en.wikipedia.org/wiki/System_usability_scale
  - https://measuringu.com/sus/
  - https://www.microsoft.com/en-us/research/publication/a-dirty-dozen-twelve-common-metric-interpretation-pitfalls-in-online-controlled-experiments/
  - https://www.nngroup.com/articles/quantitative-studies-how-many-users/
updatedAt: 2026-11-19
---

## 문제

- 주간 활성 사용자와 페이지뷰가 늘었는데 UX 가 좋아졌다고 할 수 있을까? 사용자가 길을 잃고 이리저리 클릭해도 페이지뷰는 오른다.
- 리디자인 직후 만족도가 떨어지면 되돌려야 할까, 익숙해지기를 기다려야 할까?

## 해법

### 1. SUS (System Usability Scale)

- John Brooke 가 1986년 DEC 에서 만든 10문항 5점 척도 설문(1996년 출판). 홀수 문항은 긍정, 짝수 문항은 부정 문장이다.
- 점수: 홀수 문항은 (응답 − 1), 짝수 문항은 (5 − 응답)을 더해 2.5를 곱한다 → 0~100.
- **백분율이 아니다.** Sauro(MeasuringU, 2011)는 약 500개 연구 기준 평균을 68로 보고, 백분위로 바꿔 해석하라고 권한다.
- 진단 도구가 아니다. 점수는 "얼마나 쓰기 쉽다고 느끼나"만 말하고 "어디가 문제인가"는 말하지 않는다.

```ts
// responses: 1~5 점 10개 (1번 문항부터 순서대로)
function susScore(responses: number[]): number {
  if (responses.length !== 10) throw new Error("SUS 는 10문항");
  const sum = responses.reduce(
    (acc, r, i) => acc + (i % 2 === 0 ? r - 1 : 5 - r), 0);
  return sum * 2.5;
}
```

### 2. HEART 와 Goals-Signals-Metrics (Rodden·Hutchinson·Fu, CHI 2010)

Google 팀이 페이지뷰·가동률·지연·7일 활성 사용자·매출(논문은 PULSE 로 묶음)만으로는 UI 변경 효과를 해석하기 어렵다고 보고 제안한 **범주** 틀이다.

| 범주 | 뜻 | 지표 예 |
| --- | --- | --- |
| Happiness | 태도(만족, 추천 의향, 인지된 사용 편의) | 제품 내 설문 점수 |
| Engagement | 관여의 빈도·강도·깊이 | 사용자당 주간 방문 수(총량 아닌 사용자당) |
| Adoption | 새로 쓰기 시작한 사용자 | 지난 7일 신규 활성 계정 |
| Retention | 계속 쓰는 사용자 | N주 후에도 활성인 비율 |
| Task success | 효율·효과·오류 | 과업 완료율, 소요 시간, 오류율 |

- 모든 범주를 다 쓸 필요는 없다. 논문은 업무용 제품에서는 Engagement 가 의미 없을 수 있다고 예를 든다.
- **목표 → 신호 → 지표** 순서로 정한다. 지표부터 고르면 목표와 무관한 숫자를 쫓게 된다.
- 논문의 사례: 리디자인 후 만족도가 떨어졌다가 회복된 것을 보고 변화 거부감으로 판단해 새 디자인을 유지했다.

### 3. 과업 성공률

- 정해진 과업을 끝낸 비율. 가장 이해하기 쉬운 지표다. 성공 기준(부분 성공 포함 여부)을 미리 정의한다.
- 정량 비교라면 NN/g 는 2006년 글에서 20명, 2021년 갱신 글에서 대부분의 정량 연구에 40명을 권한다. 소표본은 신뢰구간을 함께 보고한다.

### 4. A/B 테스트 주의점

Microsoft 실험 플랫폼 팀(Dmitriev 외, KDD 2017)은 수천 건 실험에서 반복된 지표 해석 함정 12가지를 정리했다. 실무에서 자주 걸리는 것:

- **표본 비율 불일치(SRM)**: 50:50 으로 나눴는데 실제 유입이 어긋나면 할당·로깅 버그다. 결과를 믿지 않는다.
- **중간에 엿보고 멈추기**: 유의해지는 순간 멈추면 거짓 양성이 늘어난다. 기간·표본을 미리 정한다.
- **신기 효과·초두 효과**: 초기 효과가 시간이 지나며 사라지거나 뒤집힌다.
- **너무 좋은 결과**: 놀라운 수치는 먼저 계측 오류를 의심한다.
- **유의하지 않음 ≠ 효과 없음**: 검정력이 부족했을 수 있다.
- **가드레일 지표 없음**: 전환은 오르고 해지·환불·지연이 나빠질 수 있다.

## 언제 쓰나

- SUS: 출시 전후·경쟁 제품과의 인식 비교, 사용성 테스트 마지막 설문.
- HEART: 제품·기능의 UX 대시보드를 설계할 때, A/B 테스트 성공 지표를 정할 때.
- A/B: 트래픽이 충분하고 변경이 작으며 결과를 측정할 행동 지표가 있을 때.

## 체크리스트

- [ ] 지표마다 연결된 목표가 적혀 있다(GSM)
- [ ] 참여 지표는 총량이 아니라 사용자당으로 본다
- [ ] SUS 를 "68점 = 68%"로 보고하지 않는다
- [ ] A/B 는 기간·표본·주지표·가드레일 지표를 시작 전에 고정했다
- [ ] SRM 검사를 자동으로 돌린다
- [ ] 정량 결과의 "왜"를 사용성 테스트로 확인할 계획이 있다

## 흔한 실수·주의

- **허영 지표.** 총 페이지뷰·총 사용자 수는 사용자 기반이 커지면 저절로 오른다.
- **A/B 승자 = 좋은 UX 로 착각.** 다크 패턴은 단기 전환에서 이긴다. [다크 패턴](/develop-wiki/knowledge/ui-ux/deceptive-design-dark-patterns/) 참고.
- **SUS 문항을 임의로 고친다.** 문구를 바꾸면 기존 벤치마크와 비교할 수 없다.
- **트래픽이 적은 서비스에서 A/B 를 고집.** 검정력이 안 나오면 정성 테스트가 더 많은 것을 알려 준다.
- Brooke 의 SUS 원문(1996)과 2013년 회고 논문은 직접 읽지 못했다. SUS 세부는 Wikipedia·MeasuringU 를 근거로 했다. A/B 함정 목록은 KDD 2017 논문 초록과 Kohavi 외 『Trustworthy Online Controlled Experiments』의 2차 요약으로 정리했으며, 12개 함정 원문 목록과 일대일 대응은 아니다.
