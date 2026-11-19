---
title: 어포던스·시그니파이어·멘탈 모델·피드백 (Norman)
aka: [Affordance, Signifier, Mental Model, Conceptual Model, Feedback, Don Norman, The Design of Everyday Things]
category: ui-ux
group: principles
level: intermediate
summary: 무엇을 할 수 있는가(어포던스), 그것을 어떻게 알아채는가(시그니파이어), 사용자가 시스템을 어떻게 이해하는가(멘탈 모델), 행동 결과를 어떻게 알려 주는가(피드백)를 구분하는 설계 어휘.
tags: [ux, norman, affordance, signifier, mental-model, feedback, flat-design]
related: [ui-ux/nielsen-usability-heuristics, ui-ux/response-time-feedback, ui-ux/microinteractions, ui-ux/cognitive-load-progressive-disclosure, ui-ux/information-architecture-card-sorting, graphics-xr/hand-eye-tracking-interaction]
sources:
  - https://jnd.org/signifiers-not-affordances/
  - https://jnd.org/preface-design-of-everyday-things-revised-edition/
  - https://www.nngroup.com/articles/mental-models/
updatedAt: 2026-11-19
---

## 문제

- 평평한 디자인에서 버튼과 텍스트가 똑같이 생기면, 클릭할 수 있는데도 사용자가 그걸 모른다.
- 개발자는 "저장은 자동"이라는 걸 알지만 사용자는 저장 버튼을 찾는다. 만든 사람과 쓰는 사람의 머릿속 모형이 다르다.
- "어포던스가 없다"는 말이 리뷰에서 "눈에 안 띈다", "기능이 없다", "직관적이지 않다"를 모두 뜻하는 말로 섞여 쓰인다.

## 해법

### 네 용어를 구분한다

| 용어 | 뜻 | UI 예 |
| --- | --- | --- |
| 어포던스(affordance) | 대상과 행위자 사이에서 **가능한 행동** | 요소가 실제로 클릭·드래그 가능함 |
| 시그니파이어(signifier) | 그 가능성을 **알아채게 하는 지각 가능한 단서** | 버튼 모양, 밑줄 링크, 드래그 핸들, 커서 변화, 스크롤바 |
| 멘탈 모델(mental model) | 사용자가 **시스템이 어떻게 동작한다고 믿는가** | "장바구니는 실제 카트처럼 담아 두는 곳" |
| 피드백(feedback) | 행동의 **결과·진행을 알려 주는 응답** | 눌림 상태, 저장됨 표시, 오류 메시지 |

Norman 은 2008년 ACM Interactions 칼럼에서, 어포던스라는 말은 Gibson 이 만든 개념이며 자신이 1988년 디자인에 들여온 것은 "지각된 어포던스"였다고 정리한다. 그리고 설계자가 다뤄야 할 것은 **시그니파이어**라고 주장한다. 2013년 개정판 『The Design of Everyday Things』 1장에 시그니파이어가 추가됐다. 가상 인터페이스에서는 어포던스 개념이 특히 혼란스럽다는 것이 그 이유다.

멘탈 모델은 사실이 아니라 믿음이고, 사용자는 시간 대부분을 **다른** 서비스에서 보내므로 그쪽 관례가 기대를 만든다(NN/g).

```tsx
// 시그니파이어 + 피드백을 함께: 클릭 가능함을 보이고, 눌렀음을 알린다
<button
  className="btn"               // 모양·대비로 버튼임을 드러냄
  aria-busy={saving}
  disabled={saving}
  onClick={save}
>
  {saving ? "저장 중…" : saved ? "저장됨" : "저장"}
</button>
```

### 멘탈 모델 간극을 줄이는 두 방향

1. **시스템을 사용자 모델에 맞춘다**: 사용자가 기대하는 위치에 기능을 두고, 카드 소팅으로 분류 방식을 배운다.
2. **사용자 모델을 고친다**: 명확한 레이블, 짧은 설명, 처음 쓸 때 핵심 개념 안내.

## 언제 쓰나

- 디자인 리뷰에서 "왜 못 찾았나"를 진단할 때: 기능이 없나(어포던스), 안 보이나(시그니파이어), 예상과 다르게 동작하나(멘탈 모델), 결과를 몰랐나(피드백).
- 새로운 상호작용(제스처, 드래그, 인라인 편집)을 도입할 때.

## 체크리스트

- [ ] 클릭 가능한 요소는 모양·색·커서로 구분된다. 일반 텍스트에 링크 색을 쓰지 않는다
- [ ] 제스처 전용 동작(스와이프 삭제 등)에 보이는 대체 수단이 있다
- [ ] 모든 행동에 즉각적인 피드백이 있다(눌림, 진행, 결과)
- [ ] 업계 관례와 다르게 동작하는 부분은 명확히 알린다
- [ ] 사용성 테스트에서 소리 내어 생각하기(think-aloud)로 사용자의 예측을 들어 봤다

## 흔한 실수·주의

- **"어포던스를 추가하자"를 "그림자를 넣자"로 쓴다.** 필요한 것은 시그니파이어다. 단서는 그림자 말고도 레이블, 아이콘, 위치, 커서, 마이크로인터랙션 등으로 줄 수 있다.
- **혁신 비용을 무시한다.** 사용자는 익숙한 방식을 고수한다. 새 방식은 확실히 더 나을 때만, 익숙한 비유와 함께 도입한다.
- **피드백 과잉.** 모든 클릭에 토스트를 띄우면 중요한 알림이 묻힌다. 결과가 화면에 바로 보이면 그 자체가 피드백이다.
- 『The Design of Everyday Things』 본문은 직접 읽지 못했다. 피드백·매핑·제약 같은 개정판의 다른 원칙은 저자 사이트의 개정판 서문과 칼럼 범위에서만 확인했다.
