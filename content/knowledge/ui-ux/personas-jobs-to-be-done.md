---
title: 퍼소나와 JTBD
aka: [Persona, Proto Persona, Jobs to Be Done, JTBD, Job Story, 사용자 원형]
category: ui-ux
group: research
level: intermediate
summary: 퍼소나는 리서치로 찾은 사용자 집단을 기억하기 쉬운 인물로 요약하고, JTBD 는 사용자가 특정 상황에서 이루려는 진전(일)을 기술한다. 서로 대체재가 아니라 보완재다.
tags: [ux, persona, jtbd, jobs-to-be-done, user-research, product]
related: [ui-ux/ux-research-method-selection, ui-ux/journey-map-service-blueprint, ui-ux/usability-testing-sample-size, ui-ux/information-architecture-card-sorting]
sources:
  - https://www.nngroup.com/articles/persona-types/
  - https://www.nngroup.com/articles/personas-jobs-be-done/
  - https://www.christenseninstitute.org/theory/jobs-to-be-done/
  - https://hbr.org/2016/09/know-your-customers-jobs-to-be-done
updatedAt: 2026-11-19
---

## 문제

- 팀원마다 머릿속 "사용자"가 달라 기능 우선순위 회의가 끝나지 않는다.
- 반대로 "30대 직장인 김민수, 커피를 좋아함" 같은 인구통계 위주 퍼소나는 설계 결정에 아무 도움이 안 된다.

## 해법

### 퍼소나: 리서치를 기억 가능한 형태로

NN/g 는 퍼소나를 근거에 따라 셋으로 나눈다.

| 종류 | 근거 | 장점 | 한계 |
| --- | --- | --- | --- |
| 프로토 퍼소나 | 새 리서치 없이 워크숍(2~4시간) | 빠름, 팀의 가정을 드러냄 | 자주 틀림. **가설로만** 다룬다 |
| 정성 퍼소나 | 인터뷰 5~30명을 코딩해 패턴으로 묶음 | 대부분 팀에 적합, 비용 대비 정확 | 각 퍼소나의 비율은 모름 |
| 통계 퍼소나 | 정성 조사 → 설문(최소 100명, 가능하면 500+) → 군집 분석 | 비율 파악, 이상치 영향 감소 | 비싸고 통계 역량 필요 |

좋은 퍼소나에는 목표, 동기, 맥락, 멘탈 모델, 불편, 행동 패턴이 들어간다. 나이·직업은 보조 정보다.

### JTBD: 사람이 아니라 "일"

Christensen Institute 는 job 을 **특정 상황에서 사람이 이루려는 진전**으로 정의한다. 사람은 그 일을 해내려고 제품을 "고용"하며, 일에는 기능적·사회적·감정적 측면이 함께 있다. 잘 알려진 밀크셰이크 사례에서, 아침 출근길 고객은 지루한 운전 중 한 손으로 먹을 간식이 필요했고 경쟁자는 다른 밀크셰이크가 아니라 바나나·베이글이었다.

```ts
// Job story 형식: 상황 → 동기 → 기대 결과 (+ 성공 기준)
type JobStory = {
  when: string;      // "월말 정산 마감 하루 전에"
  want: string;      // "누락된 영수증만 빠르게 찾고 싶다"
  soThat: string;    // "제출이 반려되지 않게"
  success: { functional: string; emotional?: string };
};
```

### 함께 쓰기 (NN/g 권고)

- JTBD 가 일의 구조를, 퍼소나가 그 일을 하는 사람의 태도·맥락을 준다.
- 같은 일이라도 집단마다 다른 해법이 필요하고, 같은 집단도 상황마다 다른 일을 한다.
- 퍼소나에 관련 job 을 참조로 달고, 집단별 성공 기준을 덧붙인다.

## 언제 쓰나

- 퍼소나: 사용자 집단이 뚜렷이 다르고, 그 사이 우선순위를 정해야 할 때. 기존 사용자에게 의존하는 제품을 재설계할 때.
- JTBD: 신규 기능·제품 기회를 찾을 때, 경쟁 범위를 넓게 볼 때, 기존 흐름이 정말 목표에 맞는지 의심할 때.

## 체크리스트

- [ ] 퍼소나마다 근거가 된 리서치(인터뷰 수, 날짜)가 적혀 있다
- [ ] 프로토 퍼소나는 "가설"로 표시돼 있고 검증 계획이 있다
- [ ] 퍼소나 수가 팀이 외울 수 있을 만큼 적다
- [ ] Job 은 해법(기능 이름)이 아니라 상황과 원하는 결과로 쓰였다
- [ ] 설계 리뷰에서 "어느 퍼소나의 어느 job 을 위한 변경인가"를 묻는다

## 흔한 실수·주의

- **인구통계·분석 데이터만으로 퍼소나를 만든다.** 분석은 무엇을 했는지는 보여 주지만 왜는 모른다.
- **정성 표본으로 비율을 주장한다.** "사용자의 40%가 이 퍼소나"는 통계 퍼소나에서만 말할 수 있다.
- **JTBD 가 퍼소나를 대체한다는 주장.** NN/g 는 이것을 퍼소나를 좁게 이해한 결과로 본다.
- **만들고 서랍에 넣는다.** 퍼소나·job 은 백로그 우선순위, 테스트 참가자 모집 기준으로 계속 써야 가치가 있다.
- HBR 2016 원문(Christensen 외) 본문은 열람하지 못해 메타 정보만 확인했다. JTBD 정의와 밀크셰이크 사례는 Christensen Institute 페이지를 근거로 했다.
