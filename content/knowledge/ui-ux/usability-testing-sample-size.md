---
title: 사용성 테스트 설계와 표본 크기 논쟁
aka: [Usability Testing, Think Aloud, 5 Users, Sample Size, Moderated Testing, Unmoderated Testing, 5명 규칙]
category: ui-ux
group: research
level: intermediate
summary: 실제 사용자에게 과업을 주고 관찰하는 사용성 테스트를 설계하는 방법과, "5명이면 충분하다"는 주장이 어떤 조건에서 맞고 어디서 반박되는지 정리한다.
tags: [ux, usability-testing, sample-size, think-aloud, research, nngroup]
related: [ui-ux/ux-research-method-selection, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/nielsen-usability-heuristics, ui-ux/information-architecture-card-sorting, ui-ux/personas-jobs-to-be-done]
sources:
  - https://www.nngroup.com/articles/usability-testing-101/
  - https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
  - https://www.nngroup.com/articles/quantitative-studies-how-many-users/
  - https://doi.org/10.3758/BF03195514
  - https://dblp.uni-trier.de/rec/conf/chi/SpoolS01.html
updatedAt: 2026-11-19
---

## 문제

- "몇 명을 테스트해야 하나"에 대한 답이 5명, 20명, 수백 명으로 엇갈린다. 숫자만 외우면 목적에 맞지 않는 테스트를 하게 된다.
- 과업 문구에 화면 메뉴 이름을 넣으면 참가자는 단어를 찾아 클릭할 뿐이라 실제 문제를 못 본다.

## 해법

### 테스트의 구성 요소 (NN/g)

- **진행자**: 지시를 주고 후속 질문을 하되, 참가자 행동에 영향을 주지 않는다.
- **과업**: 실제 사용자가 할 법한 현실적인 일. 화면의 레이블을 그대로 쓰지 않는다(priming 방지).
- **참가자**: 실제 사용자 또는 비슷한 배경. 소리 내어 생각하기(think-aloud)를 요청한다.
- 형태: 정성(문제 발견) vs 정량(성공률·시간 같은 지표), 대면·원격 진행형(moderated)·원격 비진행형(unmoderated).

```ts
// 과업 카드: 목표와 성공 기준을 미리 정해야 결과를 비교할 수 있다
const task = {
  id: "T2",
  scenario: "다음 주 금요일 팀 회식을 위해 6명 자리를 예약해 보세요.", // '예약하기' 메뉴명 노출 안 함
  success: "확인 화면에서 날짜·인원이 맞음",
  maxMinutes: 5,
};
```

### "5명이면 충분하다" — 원래 주장과 조건

Nielsen(2000)의 글은 Nielsen·Landauer 모형 `N(1 − (1 − L)^n)` 에 기대며, 한 사용자가 전체 문제의 평균 31%(`L`)를 찾는다고 보면 5명이 약 85%를 찾는다고 계산한다. 하지만 같은 글이 붙인 조건이 핵심이다.

- **반복을 전제로 한다.** 15명 한 번보다 5명씩 세 번, 고치고 다시 테스트.
- **사용자 집단이 비슷할 때.** 집단이 다르면 집단마다 3~4명 이상.
- **정성 테스트에 한정.** 정량 지표는 NN/g 의 2006년 글이 20명(시간 측정 오차 범위 근거)을 제시했지만, 2021년 갱신 글은 대부분의 정량 연구에 40명을 권한다, 카드 소팅은 15명 이상을 권한다.

### 반론

- **발견 확률 `L` 은 제품·과업·참가자마다 다르다.** 31%는 평균일 뿐이다. 문제가 드물게 나타나거나 제품이 복잡하면 5명으로 찾는 비율이 크게 떨어진다.
- Faulkner(2003)는 실제 데이터에서 5명 표본을 반복 추출하는 시뮬레이션으로, 평균은 85% 안팎이지만 표본에 따라 55% 정도까지 내려갈 수 있음을 보였다고 요약된다(원문 미확인, 2차 요약 기준).
- Spool·Schroeder(CHI 2001 확장 초록)는 참가자가 스스로 목표를 정하는 대형 웹사이트 테스트에서 처음 5명이 전체 문제의 일부만 찾았다고 보고했다(원문 미확인).

정리하면 **5명 규칙은 "작게, 자주 반복하라"는 운영 조언**이지 "5명이면 문제의 85%를 반드시 찾는다"는 보장이 아니다.

## 언제 쓰나

- 시안·프로토타입 단계마다 짧게(정성, 5명 안팎).
- 출시 전후 수치 비교가 필요할 때(정량, NN/g 2021 기준 약 40명, 신뢰구간 보고).

## 체크리스트

- [ ] 테스트 목표와 과업별 성공 기준이 적혀 있다
- [ ] 과업 문구에 UI 레이블이 들어 있지 않다
- [ ] 파일럿(동료 1명)으로 과업·도구를 먼저 점검했다
- [ ] 사용자 집단이 여럿이면 집단별로 모집했다
- [ ] 개발자·PM 이 최소 한 세션을 직접 관찰한다
- [ ] 다음 반복 일정을 미리 잡았다

## 흔한 실수·주의

- **5명 정성 테스트 결과를 퍼센트로 보고한다.** "5명 중 3명 실패 = 60% 실패율"은 오차가 너무 커 의미가 약하다. 정성은 문제 목록과 근거로 보고한다.
- **진행자가 도와준다.** "거기 오른쪽에 있어요"라고 말하는 순간 그 과업 데이터는 버린다.
- **참가자가 동료·지인뿐이다.** 도메인 지식이 달라 실제 문제를 놓친다.
- **찾은 문제를 다시 테스트하지 않는다.** 수정이 새 문제를 만들 수 있다.
- 파일럿 테스트 권장은 일반적 연구 관행으로 적었으며 이 노트가 인용한 NN/g 글에는 나오지 않는다.
