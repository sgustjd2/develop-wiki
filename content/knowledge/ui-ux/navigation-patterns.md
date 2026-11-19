---
title: 내비게이션 패턴 (전역·로컬·브레드크럼·탭)
aka: [Navigation Patterns, Global Navigation, Local Navigation, Breadcrumbs, Tabs, Wayfinding]
category: ui-ux
group: interaction
level: beginner
summary: 사이트 전체를 오가는 전역 메뉴, 현재 영역 안을 오가는 로컬 메뉴, 계층 위치를 보여 주는 브레드크럼, 같은 맥락 안의 보기를 바꾸는 탭을 언제 어떻게 쓰는지 정리한다.
tags: [ux, navigation, breadcrumbs, tabs, wayfinding, information-architecture]
related: [ui-ux/information-architecture-card-sorting, ui-ux/gestalt-principles, ui-ux/fitts-hicks-law, ui-ux/nielsen-usability-heuristics, mobile-dev/navigation-deep-links, mobile-dev/mobile-accessibility-basics, ui-ux/keyboard-focus-management]
sources:
  - https://www.nngroup.com/articles/local-navigation/
  - https://www.nngroup.com/articles/breadcrumbs/
  - https://www.nngroup.com/articles/tabs-used-right/
  - https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
  - https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
updatedAt: 2026-11-19
---

## 문제

- 검색 결과로 깊은 페이지에 바로 들어온 사용자는 "여기가 어디고, 위로 가려면 어떻게 하나"를 모른다.
- 탭을 페이지 이동용과 보기 전환용으로 섞어 쓰면, 클릭했을 때 URL 이 바뀌는지, 입력한 내용이 남는지 예측이 안 된다.
- 메뉴가 두 줄, 세 줄로 늘어나며 무엇이 전역이고 무엇이 지역인지 구분이 안 된다.

## 해법

### 네 패턴의 역할

| 패턴 | 답하는 질문 | NN/g 핵심 지침 |
| --- | --- | --- |
| 전역 내비게이션 | 이 사이트의 큰 영역은 무엇인가 | 정보 구조의 최상위 단계를 보여 주며 사이트 전체에서 같다 |
| 로컬 내비게이션 | 지금 영역 안에 무엇이 더 있나 | 현재 위치의 형제·자식 페이지. 항상 보이게, 전역보다 덜 눈에 띄게 |
| 브레드크럼 | 나는 계층의 어디에 있나 | 방문 기록이 아니라 **계층**. 현재 페이지는 마지막, 링크 아님 |
| 탭 | 같은 맥락의 다른 보기는 무엇인가 | 한 줄, 짧은 레이블, 선택 상태를 두 가지 이상 단서로 표시 |

### 브레드크럼

- 위치: 페이지 상단, 보통 전역 메뉴 바로 아래. 홈에서 시작.
- 구분자는 `>` 또는 `/`. 실제 페이지가 있는 상위 단계만 링크한다.
- 계층이 1~2단계뿐인 평평한 사이트, 순서형 흐름에는 쓰지 않는다.
- 모바일에서 여러 줄로 넘치면 바로 위 단계 한두 개만 보여 줄 수 있다(데스크톱은 전체).

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/">홈</a></li>
    <li><a href="/knowledge/">지식</a></li>
    <li><a href="/knowledge/ui-ux/">UI·UX</a></li>
    <li><span aria-current="page">내비게이션 패턴</span></li>
  </ol>
</nav>
```

### 탭

- **페이지 내 탭**(같은 데이터의 다른 보기)과 **내비게이션 탭**(다른 섹션으로 이동)을 한 컨트롤에서 섞지 않는다. 둘 다 있으면 시각적으로 다르게 만든다.
- 사용자가 탭 사이 내용을 **동시에 비교**해야 하면 탭이 맞지 않는다. 한 페이지에 소제목으로 펼친다.
- 기본 선택 탭에 가장 많이 쓰는 내용을 둔다. 중요한 정보를 기본이 아닌 탭에 숨기지 않는다.
- 모바일에서는 아코디언이 더 나은 경우가 많다.
- 페이지 내 탭은 W3C ARIA APG 의 탭 패턴(`role="tablist"`, `tab`, `tabpanel`, 화살표 키 이동)을 따른다. 페이지 이동용 탭은 링크 목록(`nav`)으로 만들고 `aria-current` 로 현재 항목을 표시한다.

## 언제 쓰나

- 전역: 거의 모든 사이트. 로컬: 페이지가 많고 사용자가 영역 안을 탐색·비교할 때. 작은 사이트에는 불필요.
- 브레드크럼: 3단계 이상 계층, 검색·외부 링크로 깊은 페이지에 들어오는 경우가 많을 때(문서, 쇼핑몰 카테고리).
- 탭: 묶음이 뚜렷하고 동시에 비교할 필요가 없는 긴 콘텐츠.

## 체크리스트

- [ ] 전역 메뉴가 모든 페이지에서 같은 자리, 같은 순서다
- [ ] 현재 위치가 전역·로컬 메뉴에 표시된다(`aria-current`)
- [ ] 브레드크럼이 계층을 따르고, 마지막 항목은 링크가 아니다
- [ ] 탭은 한 줄이고, 선택 상태가 색 외 단서(굵기, 밑줄)로도 보인다
- [ ] 탭 목록이 패널 바로 위에 붙어 있다
- [ ] 키보드로 모든 메뉴·탭을 이동할 수 있다

## 흔한 실수·주의

- **브레드크럼을 방문 기록으로 만든다.** 뒤로 가기 버튼과 중복되고, 깊은 페이지에 바로 들어온 사람에게 쓸모가 없다.
- **두 줄 이상의 탭.** 줄이 바뀌며 선택 탭 위치가 움직여 공간 기억을 깨뜨린다.
- **로컬 메뉴가 전역보다 눈에 띈다.** 사용자가 로컬을 전역으로 착각한다.
- **숨김 메뉴(햄버거)에 핵심 영역을 몰아 넣는다.** 보이지 않는 항목은 덜 쓰인다는 것이 일반적 관찰이다. 데스크톱에서는 주요 항목을 노출한다(이 주장은 이 노트에서 별도 출처로 확인하지 않았다).
- 내비게이션 모양은 정보 구조를 먼저 정한 뒤 고른다. [정보 구조와 카드 소팅](/develop-wiki/knowledge/ui-ux/information-architecture-card-sorting/).
