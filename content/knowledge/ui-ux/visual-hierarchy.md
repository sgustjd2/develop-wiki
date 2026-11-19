---
title: 시각적 위계
aka: [Visual Hierarchy, 시각 계층, Emphasis]
category: ui-ux
group: visual
level: beginner
summary: 크기·대비·간격·위치로 "무엇을 먼저 보고 무엇을 나중에 볼지" 순서를 정하는 비주얼 디자인의 기본기. 모든 것을 강조하면 아무것도 강조되지 않는다.
tags: [visual-design, layout, typography, color, gestalt]
related: [ui-ux/typography-scale-rhythm, ui-ux/color-system-semantic-roles, ui-ux/grid-spacing-system, ui-ux/gestalt-principles]
sources:
  - https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
  - https://developer.apple.com/design/human-interface-guidelines/layout
  - https://m3.material.io/foundations/layout/grids-spacing/spacing
  - https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
updatedAt: 2026-11-19
---

## 문제

- 화면의 모든 요소가 같은 무게로 보이면 사용자는 어디서 시작할지 모른다. 결국 훑어보다 핵심 버튼이나 경고를 놓친다.
- 반대로 굵게·빨강·대문자를 여기저기 쓰면 강조끼리 경쟁해 위계가 평평해진다.

## 해법 — 위계를 만드는 도구

| 도구 | 어떻게 | 주의 |
| --- | --- | --- |
| 크기(scale) | 중요한 것을 크게 | 크기 단계는 적게. NN/g 는 대·중·소 3단계 이내를 권한다 |
| 대비(contrast) | 주변과 명도·채도 차이 | 눈길을 끄는 건 색 자체가 아니라 **주변과의 차이** |
| 굵기·서체 | 제목 Semibold, 본문 Regular | 너무 얇은 굵기는 작은 글씨에서 읽기 어렵다(Apple HIG) |
| 간격·그룹 | 가까우면 한 묶음, 멀면 다른 묶음 | 경계선·카드는 꼭 필요할 때만 |
| 위치·정렬 | 읽는 순서(위→아래, leading→trailing) 앞쪽에 중요한 것 | RTL 언어는 방향이 뒤집힌다 |
| 들여쓰기 | 들여쓴 항목은 앞 항목의 하위로 읽힌다 | |

```css
/* 위계를 토큰으로 고정해 두면 화면마다 흔들리지 않는다 */
.page-title   { font: 600 2rem/2.5rem var(--font-sans); }
.section-title{ font: 600 1.375rem/1.75rem var(--font-sans); }
.body         { font: 400 1rem/1.5rem var(--font-sans); color: var(--color-text); }
.meta         { font: 400 0.875rem/1.25rem var(--font-sans); color: var(--color-text-subtle); }
```

한 화면에서 주 행동(primary action)은 하나, 많아야 둘로 둔다. Apple HIG 는 눈에 띄는(prominent) 버튼을 한 뷰에 1~2개로 제한하라고 권한다.

## 점검 방법

- **스퀸트(블러) 테스트**: 눈을 가늘게 뜨거나 스크린숏을 흐리게 해서 덩어리와 첫 시선이 의도대로인지 본다.
- **실제 콘텐츠로 확인**: 긴 제목, 큰 사진이 들어오면 템플릿에서 설계한 위계가 뒤집힌다.
- **회색조로 보기**: 색을 빼도 순서가 읽혀야 한다. 색만으로 정보를 전달하면 WCAG 1.4.1(색 사용, A) 위반이다.

## 언제 쓰나

- 새 화면·랜딩 페이지를 설계할 때 첫 단계로 "이 화면의 1·2·3순위"를 적는다.
- 리뷰에서 "어수선하다", "버튼을 못 찾겠다"는 피드백이 나올 때.

## 체크리스트

- [ ] 1순위 요소가 가장 크거나 가장 대비가 높다
- [ ] 강조 수단(크기·색·굵기)을 한 요소에 몰아주지 않고, 화면 전체에서 2~3단계만 쓴다
- [ ] 관련 항목 사이 간격 < 무관한 그룹 사이 간격
- [ ] 회색조에서도 순서가 읽힌다

## 흔한 실수

- 모든 것을 강조 → 아무것도 강조되지 않음.
- 장식용 이미지·배너가 채도가 높아 정작 주 행동보다 먼저 보임.
- 전체를 대문자로 써서 개별 강조가 묻힘.
- 위계를 색으로만 표현(예: 빨간 글씨 = 필수) → 색각 이상 사용자에게 전달 안 됨.

## 주의 (비용)

- 위계는 콘텐츠 우선순위가 정해져야 만들 수 있다. 우선순위 합의가 없으면 디자인으로 해결되지 않는다.
- 데이터가 많은 업무용 화면은 위계를 강하게 줄수록 스캔이 느려질 수 있다. 밀도와 강조의 균형을 화면 유형별로 다르게 잡는다.
