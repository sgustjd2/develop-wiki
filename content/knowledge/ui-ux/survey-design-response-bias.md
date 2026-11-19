---
title: 설문 설계와 응답 편향
aka: [Survey Design, Response Bias, Leading Question, Double-barreled Question, Likert Scale, 설문 문항 설계]
category: ui-ux
group: research
level: intermediate
summary: UX 설문에서 태도만 묻고, 문항을 중립·단일·균형 척도로 쓰며, 유도 질문·이중 질문·무작위 응답 같은 편향을 피하는 방법.
tags: [ux, survey, questionnaire, response-bias, likert, nngroup]
related: [ui-ux/ux-research-method-selection, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/contextual-inquiry-diary-study, ui-ux/usability-test-tasks-think-aloud]
sources:
  - https://www.nngroup.com/articles/survey-best-practices/
  - https://www.nngroup.com/articles/which-ux-research-methods/
updatedAt: 2026-11-19
---

## 문제

- 설문은 만들기 쉬워 보여서 문항 하나가 결과를 뒤집는다는 사실을 놓친다.
- "만족도 조사"처럼 이미 긍정으로 틀을 짠 문구나, 한 문장에 두 질문을 넣은 문항은 데이터를 쓸 수 없게 만든다.

## 해법

### 문항 설계 원칙 (NN/g 요약)

- 연구 질문에 필요한 것만 묻고 짧게. 이미 가진 정보(인구통계 등)는 다시 묻지 않는다.
- 설문은 **태도**용이다. 행동·정성 질문은 응답자가 신뢰성 있게 답하기 어렵다.
- 미래 행동을 예측하게 하지 말고, 구체적이고 최근 행동을 묻는다(대략의 범위 허용).
- 폐쇄형 위주, 마지막에 선택형 개방 질문 하나.
- 중립·쉬운 말, 대상자로 파일럿.
- 균형 척도(긍정·부정 같은 수), 보기는 빠짐없이 겹치지 않게, 모름·해당 없음은 분리해 제공.
- 대부분 선택 응답으로 두어 무작위 응답과 이탈을 줄인다.

### NN/g 가 다룬 편향

| 편향 | 증상 | 고치기 |
| --- | --- | --- |
| 유도 문구 | "우리는 5점을 목표로 합니다" 같은 압박, "만족도" 같은 긍정 프레임 | 목표·기대 문구 제거, 중립 어휘 |
| 이중 질문 | "쉽고 직관적이었나요?" | 질문 분리 |
| 무작위 응답 | 필수 문항에 답할 수 없는 사람이 임의 선택 | 선택 응답, 해당 없음 보기 |
| 긍정 편향 척도 | 긍정 보기가 더 많음 | 균형 척도 |

### 문항 점검 코드

```ts
const doubleBarrel = (q: string) => /(그리고|및|하고|and)\s/.test(q) && q.includes("?");
const leading = (q: string) => /(우수|훌륭|만족스러운|5점)/.test(q);
// 휴리스틱일 뿐이다. 최종 판단은 사람이 하고, 반드시 타깃 사용자 파일럿을 돌린다.
```

## 비교

- 수치로 "얼마나"를 알려면 설문, "왜·어떻게"는 인터뷰·관찰이 맞다([방법 고르기](/develop-wiki/knowledge/ui-ux/ux-research-method-selection/)).
- 척도형 사용성 설문(SUS 등)은 [UX 지표](/develop-wiki/knowledge/ui-ux/ux-metrics-sus-heart-ab-test/) 참고.

## 언제 쓰나

- 이미 쌓인 가설을 넓은 인원에서 태도로 확인할 때, 세그먼트별 비교.
- 사용성 테스트 직후 인상 측정(소수 문항).

## 체크리스트

- [ ] 문항마다 "어느 연구 질문에 쓰이나"를 적을 수 있다
- [ ] 이중 질문·긍정 프레임 문구가 없다
- [ ] 척도가 균형이고 보기가 빠짐·겹침 없다
- [ ] 모름/해당 없음을 별도 보기로 뒀다
- [ ] 파일럿 응답자 2~3명에게 문항을 소리 내어 풀어 보게 했다(권장 인원은 일반 관행, 출처 없음)

## 흔한 실수·주의

- **행동 질문을 설문으로 푼다.** "지난 달 몇 번 쓰셨나요" 같은 회상은 오차가 크다. 로그와 대조한다.
- **필수 문항을 늘린다.** 이탈과 임의 응답이 늘어난다.
- **순서·찬성 편향·사회적 바람직성은 1차 출처에서 확인하지 못했다.** NN/g 해당 글은 이를 논하지 않는다. 문항 순서 효과, 동의 경향(acquiescence), 사회적 바람직성은 설문 방법론의 일반 지식이며 이 노트에서는 1차 출처 미확인으로 남긴다.
