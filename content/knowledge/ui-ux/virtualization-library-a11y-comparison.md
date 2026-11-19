---
title: 가상화 라이브러리별 접근성 지원 비교 (TanStack Virtual·react-window·react-virtuoso)
aka: [Virtualization Library Accessibility, react-window ariaAttributes, TanStack Virtual a11y, react-virtuoso a11y, 가상 스크롤 라이브러리 접근성]
category: ui-ux
group: accessibility
level: advanced
summary: TanStack Virtual·react-window·react-virtuoso 가 aria-setsize·posinset·rowcount, 포커스 유지, 브라우저 찾기를 어디까지 대신해 주는지 소스·공식 문서로 확인하고, 앱이 직접 메워야 할 부분을 정리한다.
tags: [accessibility, virtualization, aria, react, tanstack-virtual, react-window, react-virtuoso, focus]
related: [ui-ux/virtualized-list-accessibility, ui-ux/accessible-table-vs-grid, ui-ux/keyboard-focus-management, ui-ux/search-filter-sort, ui-ux/live-regions-announcements, ui-ux/screen-reader-manual-test-script-chart-grid, ui-ux/voiceover-manual-testing-keys]
sources:
  - https://tanstack.com/virtual/latest/docs/introduction
  - https://tanstack.com/virtual/latest/docs/api/virtualizer
  - https://github.com/TanStack/virtual/blob/main/packages/virtual-core/src/index.ts
  - https://github.com/bvaughn/react-window/blob/main/lib/components/list/List.tsx
  - https://github.com/bvaughn/react-window/blob/main/lib/components/grid/Grid.tsx
  - https://github.com/petyosi/react-virtuoso/blob/main/packages/react-virtuoso/src/Virtuoso.tsx
  - https://virtuoso.dev/react-virtuoso/virtuoso/keyboard-navigation/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility
updatedAt: 2026-11-19
---

원리(속성 의미, 포커스 항목 유지, 찾기 한계)는 [가상화 리스트 접근성](/develop-wiki/knowledge/ui-ux/virtualized-list-accessibility/)에 있다. 이 노트는 **라이브러리가 그중 무엇을 해 주는지**만 다룬다. 확인 기준은 2026-11-19 의 각 저장소 기본 브랜치 소스와 npm 최신판(`@tanstack/virtual-core` 3.19.11, `react-window` 2.5.3, `react-virtuoso` 4.18.23)이다.

## 문제

- "접근성 지원" 여부를 README 만 보고 판단하기 어렵다. 실제로 어떤 속성을 붙이는지는 소스를 봐야 안다.
- 라이브러리가 일부 속성을 붙여 줘도 **포커스 유지와 찾기(Ctrl+F)는 어느 라이브러리도 대신하지 않는다.** 이걸 모르고 "라이브러리가 처리한다"고 가정하기 쉽다.

## 해법: 라이브러리별 확인 결과

| 항목 | TanStack Virtual | react-window 2.x | react-virtuoso 4.x |
| --- | --- | --- | --- |
| 마크업 생성 | 안 함(헤드리스) | 함 | 함 |
| 목록 역할·크기 | 없음. 앱이 직접 | 컨테이너 `role="list"`, 행에 `role="listitem"`·`aria-posinset`(index+1)·`aria-setsize`(rowCount) | `Virtuoso` 소스에 aria 속성 없음 |
| 그리드 | 없음 | `role="grid"`·`aria-rowcount`·`aria-colcount`, 행 `role="row"`·`aria-rowindex`, 셀 `role="gridcell"`·`aria-colindex` | `TableVirtuoso` 는 기본 요소가 `table`·`tbody`·`tr` (네이티브 표 의미) |
| 포커스 관리 | 없음 | 소스에 focus·tabIndex 처리 없음 | 스크롤러에 `tabIndex={0}` 만. 공식 키보드 예제는 DOM 포커스를 옮기지 않고 상태의 "현재 인덱스" + `scrollIntoView` |
| 창 밖 항목 유지 | `rangeExtractor` 로 임의 인덱스 추가 가능 | 렌더 범위는 overscan 구간뿐. 소스상 추가 지정 수단 없음 | 확인 못 함 |

### TanStack Virtual

- 공식 문서가 스스로를 "headless UI utility" 로 부른다. 코어 소스에 `aria`·`role`·`focus` 관련 코드가 없다. **모든 의미 속성은 앱이 붙인다.**
- `rangeExtractor` 는 보이는 범위를 받아 렌더할 인덱스 배열을 돌려준다. 문서는 sticky 항목 같은 "보이지 않아도 렌더할 항목"에 쓰라고 설명한다. 같은 방법으로 **포커스 항목을 창 밖에서도 유지**할 수 있다.

```ts
import { defaultRangeExtractor, type Range } from '@tanstack/virtual-core';

// 포커스 항목을 렌더 목록에 항상 포함 (실행 확인하지 않은 예시)
const keepFocused = (focused: number | null) => (range: Range) => {
  const idx = defaultRangeExtractor(range);
  if (focused !== null && !idx.includes(focused)) idx.push(focused);
  return idx.sort((a, b) => a - b);
};
// useVirtualizer({ count, getScrollElement, estimateSize, rangeExtractor: keepFocused(activeIndex) })
// 각 항목에 role="option" aria-setsize={count} aria-posinset={item.index + 1} 를 직접 붙인다
```

### react-window 2.x

- `List` 는 각 행 컴포넌트에 `ariaAttributes` 객체를 넘긴다. README 는 이를 행 요소에 펼쳐(`{...ariaAttributes}`) 붙이라고 안내한다. **펼치지 않으면 속성이 빠진다.**
- 기본 역할은 `list`/`listitem` 이다. 리스트박스(`option`)나 피드가 필요하면 `tagName`·나머지 props 와 행 컴포넌트에서 역할을 바꿔야 한다. 컨테이너 props 는 기본 `role` 뒤에 펼쳐지므로 덮어쓸 수 있다.
- `Grid` 가 `role="grid"` 를 붙이지만 소스에 키보드 이동·포커스 처리가 없다. APG 의 grid 패턴은 화살표 키 이동을 전제로 하므로, **키보드 처리를 직접 만들지 않을 거면 역할을 `table` 계열로 바꾸는 편이 의미가 맞다**([테이블 vs 그리드](/develop-wiki/knowledge/ui-ux/accessible-table-vs-grid/)).
- 크기 측정용 요소에는 `aria-hidden` 이 붙어 있다.

### react-virtuoso 4.x

- `Virtuoso`·`VirtuosoGrid` 소스에 aria 속성이 없다. 항목 요소에는 `data-index`·`data-item-index` 같은 데이터 속성만 붙는다. 크기·위치는 `itemContent` 에서 앱이 직접 붙인다.
- `TableVirtuoso` 는 네이티브 `<table>` 구조를 쓰고 위아래 여백을 `<tr>` 채움 행으로 만든다. 채움 행이 낭독기에 빈 행으로 읽히는지는 확인하지 않았다.
- 공식 키보드 예제는 "현재 항목"을 테두리로만 표시한다. 낭독기에 그 항목을 알리려면 `aria-activedescendant` 나 실제 포커스 이동을 앱이 추가해야 한다.

### 찾기(Ctrl+F)는 셋 다 해결하지 않는다

- 세 라이브러리 모두 범위 밖 항목을 DOM 에서 제거한다. 브라우저 찾기와 낭독기 전체 탐색에 잡히지 않는다.
- 대안 1: 제품 안 검색 → 해당 인덱스로 스크롤(`scrollToIndex` 류 API).
- 대안 2: 항목 수가 수천 개 이하라면 가상화 대신 CSS `content-visibility: auto`. MDN 은 이 값으로 건너뛴 내용이 DOM 과 접근성 트리에 남고 찾기·탭 이동에도 쓰인다고 설명한다(`hidden` 값은 반대로 찾기·포커스에서 빠진다). Baseline 2024. DOM 노드 수 자체는 줄지 않으므로 메모리 병목에는 효과가 없다.

## 언제 쓰나

- 라이브러리를 고를 때: 기본 의미 속성이 필요하면 react-window, 마크업을 완전히 통제하려면 TanStack Virtual, 가변 높이·채팅형 목록 기능이 필요하면 react-virtuoso 를 후보로 두되, **세 경우 모두 포커스·찾기 대책은 앱 몫**으로 계획한다.
- 기존 코드 점검: 행 컴포넌트가 `ariaAttributes` 를 펼치는지, 커스텀 rangeExtractor 가 포커스 항목을 포함하는지.

## 주의·비용

- 이 표는 특정 버전 소스 기준이다. 업그레이드 때 다시 grep 해야 한다(`aria-`, `role`, `focus`, `tabIndex`).
- 라이브러리가 붙인 속성이 실제 낭독기에서 어떻게 들리는지는 확인하지 않았다. [낭독기 수동 테스트](/develop-wiki/knowledge/ui-ux/screen-reader-manual-test-script-chart-grid/)로 조합별 기록을 남긴다.
- `role="grid"` 를 붙여 놓고 키보드 처리를 안 하면 역할 없는 것보다 나쁠 수 있다(사용자가 그리드 키를 기대한다).

## 검증 범위

- 확인함: 위 표의 속성·역할은 각 저장소 기본 브랜치 소스에서 grep 으로 확인. TanStack 의 헤드리스 설명과 rangeExtractor 용도는 공식 문서, react-virtuoso 키보드 예제 동작은 공식 문서 페이지.
- 확인 못 함: react-virtuoso 에서 창 밖 항목을 강제로 유지하는 공식 수단, `TableVirtuoso` 채움 행의 낭독 결과, 각 라이브러리의 NVDA·VoiceOver 실제 출력, react-window 1.x 와의 차이. 위 TanStack 코드 예시는 실행하지 않았다.
