---
title: 사용자 리서치 방법 고르기
aka: [UX Research Methods, User Interview, Field Study, Contextual Inquiry, Survey, Usability Testing, 정성·정량 리서치]
category: ui-ux
group: research
level: beginner
summary: 인터뷰·관찰·설문·사용성 테스트·분석 데이터 중 무엇을 쓸지, "말하는 것 vs 하는 것", "왜 vs 얼마나", 개발 단계라는 세 축으로 고르는 방법.
tags: [ux, user-research, interview, survey, field-study, usability-testing, analytics]
related: [ui-ux/usability-testing-sample-size, ui-ux/personas-jobs-to-be-done, ui-ux/journey-map-service-blueprint, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/information-architecture-card-sorting, ui-ux/nielsen-usability-heuristics]
sources:
  - https://www.nngroup.com/articles/which-ux-research-methods/
  - https://www.nngroup.com/articles/interviewing-users/
  - https://www.nngroup.com/articles/usability-testing-101/
updatedAt: 2026-11-19
---

## 문제

- "사용자에게 물어보자"는 결론으로 설문을 돌렸는데, 정작 알고 싶었던 "왜 결제 단계에서 이탈하나"는 답이 안 나온다.
- 인터뷰에서 "이 기능 쓰실 건가요?"에 다들 "네"라고 했는데 출시 후 아무도 안 쓴다.
- 방법을 질문에 맞추지 않으면 시간을 쓰고도 결정을 못 내린다.

## 해법

### 세 축으로 분류한다 (NN/g)

| 축 | 한쪽 끝 | 다른 끝 | 기억할 점 |
| --- | --- | --- | --- |
| 태도 vs 행동 | 말하는 것(설문, 인터뷰, 카드 소팅) | 하는 것(A/B, 분석 로그, 시선 추적) | 사용성 테스트·현장 조사는 중간. 행동 쪽에 무게를 둔다 |
| 정성 vs 정량 | 왜·어떻게 고칠지(관찰, 대화) | 얼마나·몇 명(설문, 분석) | 정성은 원인, 정량은 크기와 우선순위 |
| 사용 맥락 | 실제 사용(분석, 현장) | 제품 없음(콘셉트, 브랜드) | 스크립트 과업, 프로토타입 사용 등이 그 사이 |

### 단계별로 고른다

| 단계 | 질문 | 주로 쓰는 방법 |
| --- | --- | --- |
| 탐색(전략) | 무엇을 만들까, 누가 무엇에 어려움을 겪나 | 현장 조사, 다이어리 스터디, 인터뷰, 설문, 콘셉트 테스트 |
| 설계(형성 평가) | 이 디자인이 쓸 만한가 | 카드 소팅, 트리 테스트, 사용성 테스트(대면·원격) |
| 출시·평가(총괄 평가) | 이전 버전·경쟁사보다 나은가 | 벤치마크 테스트, A/B, 분석, 설문(SUS 등) |

### 방법별 한 줄 요약

- **인터뷰**: 태도·맥락·기억에 남는 극단 사례를 듣는 데 좋다. 실제 행동, 버튼 색 같은 세부 결정, "쓸 건가요" 예측에는 맞지 않다. 일반적 습관 대신 **최근의 구체적 사례**를 묻는다.
- **관찰(현장 조사, contextual inquiry)**: 실제 환경에서 일하는 모습을 본다. 우회 방법·메모지·엑셀 같은 숨은 작업이 드러난다.
- **설문**: 많은 사람의 태도 분포를 잰다. "왜"는 얕게만 답한다. 질문 문구가 결과를 바꾼다.
- **사용성 테스트**: 실제 사용자가 과업을 수행하며 소리 내어 생각하는 것을 관찰한다. NN/g 는 하나만 할 수 있다면 이것을 권한다.
- **분석·A/B**: 대규모 행동의 "무엇이 얼마나"를 보여 주지만 "왜"는 모른다.

```ts
// 리서치 계획을 질문 중심으로 적는다: 질문 → 방법 → 결정
type ResearchPlan = {
  question: string;                       // "신규 사용자는 왜 첫 프로젝트를 안 만드나?"
  decision: string;                       // 이 답으로 바꿀 결정
  method: "interview" | "field" | "survey" | "usability-test" | "analytics" | "ab-test";
  participants: string;                   // 누구를 몇 명
};
```

## 언제 쓰나

- 기능 기획 초기(탐색), 디자인 시안 검증(형성), 출시 후 개선 효과 확인(총괄) 각각에서.
- 개발자도 직접 쓸 수 있다: 사용성 테스트 관찰 참여, 분석 이벤트 설계, A/B 구현.

## 체크리스트

- [ ] 리서치 질문과 그 답으로 바뀔 결정이 먼저 적혀 있다
- [ ] 행동을 알고 싶으면 행동을 보는 방법(관찰, 테스트, 로그)을 골랐다
- [ ] 정량 결과의 "왜"를 정성 방법으로, 정성 발견의 "얼마나"를 정량으로 교차 확인한다(삼각 측량)
- [ ] 참가자가 실제 사용자(또는 비슷한 배경)다
- [ ] 질문·과업 문구가 답을 유도하지 않는지 동료가 검토했다

## 흔한 실수·주의

- **사용자에게 해법을 설계하게 한다.** 사용자는 보지 못한 기능을 쓸지 정확히 예측하지 못한다. 문제를 듣고, 해법은 테스트로 확인한다.
- **좋아요 질문.** "이 기능 좋으세요?"는 질문 효과(묻는 순간 의견이 생김) 때문에 부풀려진다. NN/g 는 존재하지 않는 기능을 섞어 기준선을 재라고 제안한다.
- **인터뷰만으로 큰 변경.** 말한 것만으로 결정하지 않는다.
- **설문 응답자 = 전체 사용자로 가정.** 응답하는 사람은 이미 관여도가 높은 쪽으로 치우친다.
- **리서치를 일회성 이벤트로.** 작은 조사를 자주 반복하는 편이 큰 조사 한 번보다 결정에 도움이 된다.
