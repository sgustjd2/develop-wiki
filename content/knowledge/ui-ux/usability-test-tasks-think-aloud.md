---
title: 사용성 테스트 과업·스크립트 작성과 think-aloud 진행법
aka: [Task Scenario, Test Script, Think Aloud Protocol, Moderator Script, 과업 시나리오, 소리 내어 생각하기]
category: ui-ux
group: research
level: intermediate
summary: 사용성 테스트에서 단서를 노출하지 않는 현실적 과업 시나리오를 쓰고, 진행자가 think-aloud 를 유도하되 행동을 오염시키지 않도록 스크립트를 짜는 방법.
tags: [ux, usability-testing, task-scenario, think-aloud, moderation, nngroup]
related: [ui-ux/usability-testing-sample-size, ui-ux/ux-research-method-selection, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/nielsen-usability-heuristics, ui-ux/heuristic-evaluation-severity]
sources:
  - https://www.nngroup.com/articles/task-scenarios-usability-testing/
  - https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/
  - https://www.nngroup.com/articles/usability-testing-101/
updatedAt: 2026-11-19
---

## 문제

- 과업이 "설정 메뉴에서 알림을 끄세요"처럼 화면 레이블을 포함하면, 참가자는 글자를 찾아 클릭할 뿐이라 레이블이 이해되는지 알 수 없다.
- 진행자가 막힌 참가자를 도우려고 한마디 하는 순간, 그 구간의 행동은 실제 사용을 대표하지 못한다.
- 표본 수는 [사용성 테스트 설계와 표본 크기 논쟁](/develop-wiki/knowledge/ui-ux/usability-testing-sample-size/)이 다룬다. 이 노트는 "한 세션을 어떻게 짜고 진행하나"에 집중한다.

## 해법

### 과업 시나리오 세 원칙 (NN/g)

1. **현실적**: 참가자가 실제로 할 법한 일, 본인 기준으로 판단할 여지가 있는 목표. 가능하면 그 일을 실제로 맡는 사람을 모집한다.
2. **행동 가능**: "어떻게 하겠는지 설명하라"가 아니라 화면에서 직접 하게 한다. 말로 하는 답은 행동 관찰보다 신뢰가 낮다.
3. **해법 단서 없음**: 단계 지시·UI 레이블을 쓰지 않고 목표를 평범한 말로 적는다. 단, 완수에 필요한 맥락(날짜·인원 등)은 모두 준다. 모호한 과업은 별개의 실패다.

```ts
type Task = { id: string; scenario: string; successCriteria: string; stopRule: string };

const bad: Task["scenario"] = "상단 '마이페이지 > 알림 설정'에서 마케팅 알림을 끄세요."; // 레이블 노출
const good: Task = {
  id: "T3",
  scenario: "프로모션 문자가 너무 자주 와서 더는 받고 싶지 않습니다. 이 서비스에서 해결해 보세요.",
  successCriteria: "마케팅 수신 항목이 꺼진 저장 완료 상태",
  stopRule: "참가자가 포기를 말하거나 5분 경과",
};
```

### 세션 스크립트 뼈대

- 도입: 목적(제품을 평가하지 참가자를 평가하지 않음), 녹화 동의, 언제든 중단 가능.
- 시연 또는 예시로 think-aloud 요청.
- 과업 반복 제시. 과업 카드는 종이·채팅으로 주고 진행자가 읽어 주기만 하는 방식 모두 가능.
- 종료: 전반 인상 질문, 사후 설문(SUS 등)은 [UX 지표](/develop-wiki/knowledge/ui-ux/ux-metrics-sus-heart-ab-test/) 참고.

### think-aloud 운영 (NN/g 요약)

- 말하며 하는 일이 부자연스러워 진행자가 계속 말하게 유도해야 한다.
- 참가자는 정리된 뒤에야 말하거나 잘해 보이려 말을 걸러낼 수 있다. 날것의 생각을 요청한다.
- 훈련되지 않은 질문·유도는 행동을 바꾼다. 영향 받은 구간은 표시해 분석에서 제외한다. 더 큰 위험은 편향 자체를 알아채지 못하는 것이다.
- 정성 방법이라 정밀한 통계에는 맞지 않는다.
- 유도 문구의 구체 예시는 NN/g 해당 글에 없다. 아래 예시는 일반 관행이며 출처 없음: 침묵 시 "지금 무슨 생각을 하고 계세요?", 질문을 받으면 "어떻게 하실 것 같으세요?"로 되돌리기.

## 언제 쓰나

- 프로토타입·출시 전 화면의 막히는 지점을 찾을 때(정성).
- 지표 비교 전에 과업 성공 기준을 고정해야 할 때.

## 체크리스트

- [ ] 과업별 성공 기준·중단 규칙을 사전에 적었다
- [ ] 과업 문구에서 UI 레이블을 전부 지웠다
- [ ] 맥락 정보(날짜·금액 등)는 모두 줬다
- [ ] 첫 과업은 쉬운 워밍업으로 둔다 (일반 관행, 출처 없음)
- [ ] 파일럿 1회로 과업 문구와 녹화 도구를 점검했다
- [ ] 진행자가 개입한 구간을 메모해 분석에서 구분한다

## 흔한 실수·주의

- **화면 용어로 과업을 쓴다.** 찾기 테스트로 변질된다. 널리 쓰이는 표준 용어는 예외적으로 써도 된다.
- **설명하게 한다.** "어디를 누르실 건가요?"는 행동 관찰이 아니다.
- **침묵을 못 견디고 힌트를 준다.** 포기 신호를 기다리고, 그때 중단 규칙을 따른다.
- **think-aloud 를 소요 시간 측정에 그대로 쓴다.** 말하는 행위가 시간을 바꿀 수 있으니 시간 지표는 별도 비진행형 세션으로 잰다(일반적 연구 관행, 이 글의 NN/g 출처에는 없음).
