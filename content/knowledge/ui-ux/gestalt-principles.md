---
title: 게슈탈트 원칙 (시각적 그룹핑)
aka: [Gestalt Principles, Proximity, Similarity, Common Region, Closure, 근접성, 유사성, 공통 영역]
category: ui-ux
group: principles
level: beginner
summary: 사람은 가까이 있거나, 닮았거나, 같은 테두리 안에 있는 요소를 한 묶음으로 본다는 지각 원리. 여백·색·카드로 관계를 표현할 때 근거가 된다.
tags: [ux, gestalt, visual-hierarchy, layout, perception]
related: [ui-ux/cognitive-load-progressive-disclosure, ui-ux/fitts-hicks-law, ui-ux/nielsen-usability-heuristics, ui-ux/navigation-patterns, ui-ux/visual-hierarchy, ui-ux/grid-spacing-system]
sources:
  - https://www.nngroup.com/articles/gestalt-proximity/
  - https://www.nngroup.com/articles/gestalt-similarity/
  - https://www.nngroup.com/articles/common-region/
updatedAt: 2026-11-19
---

## 문제

- 레이블과 입력 칸 간격이 위아래로 같으면 어떤 레이블이 어떤 칸의 것인지 헷갈린다.
- "추가" 버튼을 "다음·임시 저장·취소" 무리 속에 두면 사용자는 그 묶음 전체를 "흐름 제어 버튼"으로 읽고 추가 버튼을 못 찾는다.
- 장식용 텍스트에 링크 색을 쓰면 클릭되는 줄 안다.

## 해법

게슈탈트 원칙은 20세기 초 게슈탈트 심리학자들이 정리한 지각 법칙이다. UI 에서 자주 쓰는 것만 추린다.

| 원칙 | 내용 | UI 적용 |
| --- | --- | --- |
| 근접성(proximity) | 가까운 것은 한 묶음 | 레이블은 자기 필드에 붙이고, 그룹 사이 여백을 그룹 안 여백보다 크게 |
| 유사성(similarity) | 색·모양·크기가 같으면 관련 있음 | 링크 색은 클릭 가능한 요소에만, 같은 기능 버튼은 같은 모양 |
| 공통 영역(common region) | 같은 테두리·배경 안은 한 묶음 | 카드, 표의 행 배경, 탭과 패널 연결 |
| 폐쇄성(closure) | 끊긴 도형도 완성된 형태로 봄 | 아이콘 단순화, 잘린 카드로 "옆에 더 있음" 암시 |

NN/g 는 근접성과 공통 영역이 유사성보다 강하게 작용하는 경우가 많다고 설명한다. 공통 영역은 원래 목록에 나중에 추가된 원칙으로, Palmer(1992)를 출처로 든다.

```css
/* 여백 토큰으로 근접성을 일관되게 표현: 묶음 안 < 묶음 사이 */
.field        { display: grid; gap: var(--space-1); }   /* 레이블 ↔ 입력 */
.field-group  { display: grid; gap: var(--space-3); }   /* 필드 ↔ 필드 */
.form-section { margin-block-end: var(--space-6); }      /* 섹션 ↔ 섹션 */
```

## 언제 쓰나

- 폼, 설정 화면, 대시보드, 카드 목록처럼 요소가 많아 관계를 보여 줘야 할 때.
- 디자인 시스템의 간격 토큰을 정할 때(단계가 분명해야 근접성이 읽힌다).

## 체크리스트

- [ ] 레이블과 그 입력 사이 간격이 다른 필드와의 간격보다 좁다
- [ ] 클릭 가능한 텍스트와 아닌 텍스트가 색·밑줄로 구분된다
- [ ] 같은 역할의 버튼은 모양·크기가 같고, 주 행동은 한 개만 강조된다
- [ ] 반응형으로 열이 쌓일 때 관련 요소가 떨어지지 않는다
- [ ] 테두리·배경 없이 여백만으로도 묶음이 읽히는지 먼저 시도했다

## 흔한 실수·주의

- **모든 묶음에 테두리를 친다.** 공통 영역을 남용하면 화면이 칸막이로 가득 차 오히려 복잡해진다. 여백으로 충분하면 여백을 쓴다.
- **전체 폭 색 띠로 섹션을 나눈다.** 색 띠가 페이지 끝처럼 보여 스크롤을 멈추게 할 수 있다(NN/g 의 "가짜 바닥" 사례).
- **광고처럼 생긴 크기·위치.** 유사성 때문에 실제 콘텐츠가 광고로 무시될 수 있다.
- **원칙은 경향이지 보장이 아니다.** 여러 원칙이 서로 다른 묶음을 가리키면 결과를 예측하기 어렵다. 중요한 화면은 사용성 테스트로 확인한다.
- 연속성(continuity)·전경-배경(figure-ground)도 게슈탈트 원칙에 포함되지만 이 노트가 참고한 NN/g 글에서는 다루지 않아 생략했다.
