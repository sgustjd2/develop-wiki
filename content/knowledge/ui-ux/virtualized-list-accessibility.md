---
title: 가상화 리스트 접근성 (aria-setsize·posinset, 포커스, 검색)
aka: [Virtualized List Accessibility, Windowing a11y, aria-posinset, aria-setsize, 가상 스크롤 접근성, react-window a11y]
category: ui-ux
group: accessibility
level: advanced
summary: 화면에 보이는 항목만 DOM 에 두는 가상화 목록에서, 전체 크기·위치를 aria-setsize/posinset 으로 알리고 포커스 항목을 유지하며 브라우저 찾기·낭독기 탐색의 빈틈을 다루는 방법.
tags: [accessibility, virtualization, aria, listbox, focus, virtual-scroll]
related: [ui-ux/accessible-table-vs-grid, ui-ux/pagination-vs-infinite-scroll, ui-ux/keyboard-focus-management, ui-ux/combobox-autocomplete, ui-ux/search-filter-sort, ui-ux/live-regions-announcements, ui-ux/a11y-testing-strategy, ui-ux/semantic-html-first-aria, ui-ux/virtualization-library-a11y-comparison]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-setsize
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-posinset
  - https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
  - https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/
updatedAt: 2026-11-19
---

표 쪽(`aria-rowcount`·`aria-rowindex`)은 [테이블 vs 그리드](/develop-wiki/knowledge/ui-ux/accessible-table-vs-grid/) 노트에 있다. 이 노트는 **목록·리스트박스·트리형** 가상화와, 표에도 공통인 포커스·검색 문제를 다룬다.

## 문제

가상화는 수천 개 항목 중 화면에 보이는 수십 개만 DOM 에 둔다. 낭독기와 브라우저는 DOM 을 기준으로 동작하므로 다음이 생긴다.

- 브라우저가 항목 수를 DOM 에서 세기 때문에 "5개 중 1번째"처럼 **실제보다 작은 크기**가 전달된다(MDN: 부분 로딩 목록에서 자동 계산이 과소 집계).
- 스크롤하면 항목 노드가 교체된다. **포커스 중인 노드가 사라지면** 포커스가 body 로 떨어지거나 위치를 잃는다.
- 화면 밖 항목은 DOM 에 없어 **Ctrl+F 와 낭독기의 전체 탐색**에 잡히지 않는다.

## 해법

### 1. 크기·위치를 속성으로 직접 알린다

- `aria-setsize`: 집합의 전체 항목 수. **컨테이너가 아니라 각 항목**에 둔다. 전체 수를 모르거나 계속 변하면 `-1`.
- `aria-posinset`: 전체 안에서의 위치. **1 기준 정수**, setsize 와 함께 쓴다.
- 적용 역할(MDN 목록): `listitem`, `option`, `treeitem`, `menuitem`, `row`, `tab`, `radio`, `article` 등. 모든 항목이 DOM 에 있으면 브라우저가 계산하므로 불필요하다.
- APG 리스트박스 문서도 부분 로딩 시 option 에 두 속성을 쓰라고 설명한다.
- 흔한 오류: `posinset` 을 "현재 렌더된 창 안의 순번"으로 매기는 것. 항상 **전체 목록 기준 인덱스 + 1**.
- 필터·검색으로 전체 크기가 바뀌면 모든 렌더된 항목의 `aria-setsize` 도 함께 갱신한다.

### 2. 포커스 항목은 창 밖이어도 마운트를 유지한다

두 방식이 있다(APG 는 어느 쪽이 낫다고 정하지 않는다).

| 방식 | 포커스 위치 | 가상화와의 관계 |
| --- | --- | --- |
| 실제 포커스 이동(roving tabindex) | 항목 DOM | 스크롤로 노드가 언마운트되면 포커스 소실. 해당 항목을 계속 렌더해야 한다 |
| `aria-activedescendant` | 컨테이너 | 가리키는 id 가 DOM 에 있어야 한다. 마찬가지로 유지 필요 |

```ts
function render(from: number, to: number, active: number | null) {
  const idx = new Set<number>();
  for (let i = from; i < to; i++) idx.add(i);
  if (active !== null) idx.add(active);          // 포커스 항목은 창 밖이어도 유지
  list.replaceChildren(...[...idx].sort((a, b) => a - b).map((i) => {
    const li = document.createElement('li');
    li.id = `opt-${i}`; li.setAttribute('role', 'option');
    li.setAttribute('aria-setsize', String(TOTAL));
    li.setAttribute('aria-posinset', String(i + 1)); // 전체 기준, 1 시작
    li.textContent = `항목 ${i + 1}`; return li;
  }));
  active !== null ? list.setAttribute('aria-activedescendant', `opt-${active}`)
                  : list.removeAttribute('aria-activedescendant');
}
```

- 확인한 동작(jsdom, TOTAL=5000): 창 100~104 + 활성 102 → posinset 101~105; 창을 300~304 로 옮겨도 활성 항목이 남아 `103,301..305` 로 렌더되고 `aria-activedescendant="opt-102"` 의 대상이 DOM 에 존재; 활성 해제 후에는 속성이 제거됨.
- 확인하지 못한 것: NVDA·VoiceOver 가 이 속성을 실제로 어떻게 읽는지, 노드 교체 시 낭독기 가상 커서가 어디에 놓이는지, 가상화 라이브러리(react-window 등)의 내부 동작(라이브러리별 소스 확인 결과는 [가상화 라이브러리별 접근성 비교](/develop-wiki/knowledge/ui-ux/virtualization-library-a11y-comparison/)). 이 노트의 낭독 결과 서술은 **명세·MDN 설명 기준이며 실기기 관찰이 아니다**.
- 포커스 항목이 화면 밖으로 밀려난 뒤 돌아오는 경로: Home/End·Page 키로 창을 이동시키고 활성 항목을 새 창 안으로 옮긴다([키보드·포커스](/develop-wiki/knowledge/ui-ux/keyboard-focus-management/)).

### 3. 검색(Ctrl+F)·전체 탐색의 빈틈

DOM 에 없는 텍스트는 브라우저 찾기에 안 잡힌다. 속성으로는 해결되지 않으므로 **제품 안에 검색을 둔다**.

- 목록 위에 자체 검색·필터 입력을 두고, 결과를 서버/메모리 데이터에서 찾아 해당 위치로 스크롤한다([검색·필터·정렬](/develop-wiki/knowledge/ui-ux/search-filter-sort/)).
- 결과 수·상태는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알린다("검색 결과 42건").
- 낭독기 사용자에게 "이 목록은 일부만 로드됨"을 알릴 텍스트 안내를 목록 앞에 둔다. 낭독기마다 setsize 를 읽는 방식이 다를 수 있어 속성에만 의존하지 않는다.
- 가능하면 페이지 나누기로 대체한다([페이지네이션 vs 무한 스크롤](/develop-wiki/knowledge/ui-ux/pagination-vs-infinite-scroll/)).

## 언제 쓰나

- 수천 건 이상이고 항목 높이가 가벼워 DOM 이 성능 병목일 때(먼저 페이지 나누기·서버 필터링으로 줄일 수 있는지 본다).
- 콤보박스 옵션이 아주 많을 때([콤보박스](/develop-wiki/knowledge/ui-ux/combobox-autocomplete/)).

## 주의·비용

- 가상화는 접근성 비용이 큰 최적화다. 수백 개 수준은 일반 렌더로도 충분한 경우가 많다(측정 후 결정).
- 항목 안에 입력·메뉴가 있으면 노드 교체 때 입력값·열린 메뉴 상태가 사라진다. 상태는 데이터 쪽에 둔다.
- 높이가 가변이면 스크롤바 위치와 posinset 이 어긋나기 쉽다.
- 자동 도구는 이 문제를 못 잡는다. 수동 낭독기 시나리오가 필요하다([낭독기 수동 테스트 스크립트](/develop-wiki/knowledge/ui-ux/screen-reader-manual-test-script-chart-grid/)).

## 체크리스트

- [ ] 각 항목에 `aria-setsize`(전체 또는 -1)와 `aria-posinset`(전체 기준 1 시작)
- [ ] 필터·정렬 변경 시 setsize·posinset 재계산
- [ ] 포커스/활성 항목은 창 밖이어도 마운트 유지
- [ ] 제품 내 검색과 결과 수 안내
- [ ] 스크롤·Page 키·Home/End 후 포커스가 사라지지 않음
- [ ] NVDA·VoiceOver 수동 확인 기록
