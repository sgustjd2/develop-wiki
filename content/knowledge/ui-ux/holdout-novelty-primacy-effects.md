---
title: 홀드아웃과 novelty·primacy 효과 (장기 효과 측정)
aka: [Holdout, Holdback, Novelty Effect, Primacy Effect, Long-term Effect, User Learning, 장기 실험, 신기성 효과]
category: ui-ux
group: research
level: advanced
summary: 짧은 A/B 테스트가 novelty(신기해서 오른 반응)와 primacy(적응 후 오르는 반응)로 장기 효과를 잘못 추정하는 문제와, 소수 사용자를 남겨 두는 홀드아웃으로 장기 효과를 확인하는 방법·비용을 정리한다.
tags: [ux, ab-testing, holdout, novelty-effect, primacy-effect, long-term, experimentation, statistics]
related: [ui-ux/ab-test-statistics-srm-power-sequential, ui-ux/cuped-variance-reduction-guardrail-metrics, ui-ux/multiple-comparison-correction-bonferroni-holm-bh, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/deceptive-design-dark-patterns, engineering-practice/feature-flags, mobile-dev/staged-rollout-remote-config]
sources:
  - https://arxiv.org/abs/2102.12893
  - https://www.unofficialgoogledatascience.com/2015/10/experiment-design-and-modeling-for-long.html
  - https://research.google/pubs/pub43887/
  - https://doi.org/10.1017/9781108653985
updatedAt: 2026-11-19
---

## 문제

- 새 UI 를 2주 돌려 +1% 가 나왔다. 출시 후 석 달 뒤에는 효과가 거의 없다. 처음엔 신기해서 눌렀을 뿐이다(**novelty**).
- 반대로 처음엔 손익이 나쁘다가 적응하면 오르기도 한다(**primacy**: 기존 습관이 방해하다가 새 방식에 익숙해짐).
- Sadeghi 등(Microsoft, 2021 프리프린트)은 이를 "사용자 학습"으로 묶고, 짧은 실험이 장기 효과를 과대·과소 추정할 수 있다고 본다.
- Google 의 장기 실험 연구(Hohnhold·O'Brien·Tang, KDD 2015)는 검색 광고에서 단기 지표가 장기에 해로운 변경을 선호할 수 있고, 사용자가 광고 품질에 따라 시간이 지나며 반응을 바꾼다고 보고한다.

## 해법

### 1. 감쇠 효과가 평균에 미치는 영향 (계산)

가정(내가 정한 장난감 모델): 기준 전환율 10%, 처치 효과 `lift(d) = 0.002 + 0.010·e^(−d/7)` (d 는 일 단위, 장기 수렴값 +0.2%p, 초기 +1.2%p). 기간별 평균 효과(직접 계산):

| 실험 기간 | 평균 효과(%p) |
| --- | --- |
| 7일 | 0.878 |
| 14일 | 0.664 |
| 28일 | 0.463 |
| 56일 | 0.334 |
| 90일 | 0.283 |
| 장기 수렴값 | 0.200 |

- 7일 결과로 의사결정하면 장기 효과의 약 4배를 기대하게 된다. 기간을 늘려도 평균은 천천히 수렴한다.
- 실제 감쇠율은 알 수 없다. 위 값은 방법을 보이는 예이고 현실 수치가 아니다.

### 2. 탐지 방법

- **일자별·가입 주차별 효과 곡선**: 처치-대조 차이를 날짜(또는 노출 후 n일째) 별로 그린다. 감소·증가 추세가 있으면 정상 상태 효과가 아니다.
- **신규 vs 기존 사용자 분리**: 새 UI 에 처음 노출되는 신규 사용자는 학습 효과가 적다(실무자 요약이며 1차 출처로 확인하지 못함).
- **연장·사후 기간**: 처치 종료 뒤 같은 사용자를 A/A 로 돌려 남은 차이를 본다. 결과가 처치 종료 후에야 나오는 단점이 있다(Google 글 요약).
- **Cookie-cookie-day**: 같은 처치를 매일 재배정한 군과 고정 배정군을 비교해 학습 진행을 추적한다(Google 글 요약). 구현 복잡도가 높다.
- Sadeghi 등은 시차 효과를 관측 데이터의 이중차분으로 추정하는 방법을 제안한다. 방법의 세부 가정은 읽지 못했고 한계도 있다고 저자가 명시한다.

### 3. 홀드아웃 (장기 대조군 유지)

- 출시 후에도 소수(예 1~10%)를 구버전/무처치에 남겨, 장기 효과·누적 효과를 측정한다. 기능 단위 홀드아웃과, 분기 동안 여러 출시의 누적 효과를 재는 "팀·분기 단위" 홀드아웃이 있다.
- 구현은 [피처 플래그](/develop-wiki/knowledge/engineering-practice/feature-flags/)의 배정 고정(같은 사용자는 같은 군)이 전제다.

### 4. 홀드아웃 크기와 검출 가능 효과 (계산)

기준 전환율 10%, 홀드아웃 비율 h, 전체 N, 양측 α=0.05·검정력 80% 에서 검출 가능한 최소 차이(MDE) = `(1.96+0.8416)·SE`, `SE=√(p(1−p)(1/n_h+1/n_t))`.

| N | h | MDE(%p) |
| --- | --- | --- |
| 1,000,000 | 5% | 0.386 |
| 1,000,000 | 1% | 0.845 |
| 200,000 | 5% | 0.862 |
| 200,000 | 10% | 0.626 |

- 몬테카를로 확인(N=1,000,000, h=5%, 4,000회): 실제 효과 +0.4%p 에서 검출률 0.83, +0.2%p 에서 0.33.
- 위 장난감 모델의 장기 수렴값 +0.2%p 는 N=100만·5% 홀드아웃으로도 3분의 1만 잡힌다. 작은 서비스는 장기 효과를 통계적으로 못 본다. 홀드아웃 비율과 기간을 사전에 계산한다.

## 언제 쓰나

- 눈에 띄는 UI 변경(새 디자인, 새 내비), 알림·추천처럼 사용자가 학습·피로로 반응이 변하는 기능.
- 단기 지표(클릭)와 장기 지표(재방문·이탈)가 엇갈릴 위험이 있는 변경.
- 여러 번의 작은 승리 합계가 실제 가치인지 확인할 때(누적 홀드아웃).

## 주의·비용

- **홀드아웃 군은 더 나쁜 경험을 받는다.** 안전·접근성·법적 수정은 홀드아웃에 넣지 않는다. 윤리·동의 측면은 [리서치 윤리](/develop-wiki/knowledge/ui-ux/research-ethics-consent-recruiting/)와 별개로 팀 정책이 필요하다(이 연결은 필자 판단).
- 유지 비용: 구 코드 경로를 계속 운영해야 하고, 다음 변경과 상호작용(교란)이 생긴다.
- 장기 대조군은 사용자 이탈·쿠키 삭제·다기기로 오염된다. 로그인 ID 기준 배정이 낫다.
- 시즌·마케팅 변화는 처치·대조 모두 영향을 주므로 차이로는 상쇄되지만 효과 크기가 달라질 수 있다.
- 기간 중 여러 번 확인하면 오탐이 늘어난다 → [A/B 테스트 통계](/develop-wiki/knowledge/ui-ux/ab-test-statistics-srm-power-sequential/)
- 효과 곡선을 날짜별로 많이 보면 다중 비교가 된다 → [다중 비교 교정](/develop-wiki/knowledge/ui-ux/multiple-comparison-correction-bonferroni-holm-bh/)
- Kohavi 등 단행본은 novelty·primacy 를 외적 타당성 위협으로 다루는 것으로 색인만 확인했고 본문은 읽지 못했다.

## 체크리스트

- [ ] 실험 시작 전에 평가 기간과 장기 확인 방식(연장·홀드아웃)을 정함
- [ ] 일자별 효과 곡선과 신규/기존 분리를 기본 리포트에 포함
- [ ] 홀드아웃 비율을 MDE 로 역산, 종료 시점과 해제 책임자를 정함
- [ ] 홀드아웃에서 안전·접근성 수정 제외
