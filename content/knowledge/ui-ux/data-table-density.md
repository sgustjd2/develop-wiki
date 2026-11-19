---
title: 데이터 테이블과 정보 밀도
aka: [Data Table, Data Grid, Information Density, Table Density, Sortable Table, aria-sort, 데이터 그리드, 표 설계]
category: ui-ux
group: patterns
level: intermediate
summary: 업무용 화면의 표를 찾기·비교·단건 편집·일괄 작업이라는 네 과업에 맞춰 설계하고, 밀도·정렬·고정 열·접근 가능한 마크업을 정하는 방법.
tags: [ux, data-table, density, enterprise, accessibility, apg]
related: [ui-ux/search-filter-sort, ui-ux/pagination-vs-infinite-scroll, ui-ux/touch-target-size, ui-ux/keyboard-focus-management, ui-ux/empty-states]
sources:
  - https://www.nngroup.com/articles/data-tables/
  - https://www.w3.org/WAI/tutorials/tables/
  - https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
  - https://www.w3.org/WAI/ARIA/apg/patterns/grid/
updatedAt: 2026-11-19
---

## 문제

- 열이 30개인 표에서 오른쪽으로 스크롤하면 이 값이 어느 행·어느 열인지 잃는다.
- 행마다 버튼 5개를 넣어 표가 버튼 숲이 된다.
- 행 편집을 모달로 열어 옆 행을 참고하며 고칠 수 없다.
- `<div>` 격자로 만든 표는 낭독기가 행·열 관계를 알 수 없다.

## 해법

### 1. 네 가지 과업 (NN/g, Laubheimer 2022)

| 과업 | 설계 |
| --- | --- |
| **조건에 맞는 레코드 찾기** | 첫 열은 사람이 읽는 식별자(자동 생성 코드 ×), 중요도 순으로 열 배치·관련 열은 인접, 필터는 찾기 쉽게 + 적용 중임을 표시 |
| **비교** | 머리글 행·핵심 열 고정, 구분선·줄무늬·호버 강조, 열 숨기기·순서 변경(드래그만으로 하지 않기), 정렬 |
| **단건 보기·편집·추가** | 좁은 표는 인라인 편집(편집 모드가 눈에 띄게), 넓은 표는 **비모달 사이드 패널**. 모달은 옆 레코드를 가려 비권장 |
| **레코드에 동작** | 행 동작이 1~2개면 인라인, 그 이상은 행 선택(체크박스) + 표 위 일괄 동작 바. "모두 선택" 제공 |

### 2. 밀도

- 밀도는 사용 빈도와 사용자 숙련도로 정한다. 매일 쓰는 운영 화면은 촘촘하게, 가끔 쓰는 화면은 여유 있게.
- 밀도 전환(기본·조밀)을 제공할 때 조밀 모드에서도 행 안의 체크박스·아이콘 버튼이 타깃 크기 기준(WCAG 2.5.8, 24px 또는 간격 예외)을 만족하는지 계산한다. → [터치 타깃 크기](/develop-wiki/knowledge/ui-ux/touch-target-size/)
- 숫자는 오른쪽 정렬 + 고정폭 숫자(`font-variant-numeric: tabular-nums`)로 자릿수를 맞춘다. 텍스트는 왼쪽(RTL 에서는 시작 방향) 정렬. *(타이포그래피 관행. NN/g 원문은 정렬을 다루지 않는다.)*
- 긴 텍스트는 말줄임 + 전체 보기 수단(툴팁만으로는 키보드·터치 접근이 어려움).

### 3. 접근 가능한 마크업

```html
<table>
  <caption>주문 목록 <span class="visually-hidden">(열 머리글 버튼으로 정렬)</span></caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="descending">
        <button type="button">주문일 <span aria-hidden="true">▼</span></button>
      </th>
      <th scope="col"><button type="button">금액</button></th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">2026-11-18</th><td class="num">₩15,000</td></tr>
  </tbody>
</table>
```

- `<caption>` 이 표의 이름, `<th scope>` 가 머리글 관계.
- 정렬: APG 예제처럼 **현재 정렬된 열 하나에만** `aria-sort`, 머리글 안에 `<button>`, 방향 기호는 `aria-hidden`.
- 셀 단위 키보드 이동·편집이 필요한 스프레드시트형은 `role="grid"` 패턴(화살표 이동, 단일 Tab 정지)을 따른다. 읽기 전용 표에 grid 를 쓰면 오히려 탐색이 어려워진다.

## 언제 쓰나

- 여러 속성을 가진 동질 레코드를 비교·선별·일괄 처리하는 업무 화면(관리자, 주문, 로그, 재고).
- 모바일에서는 열을 줄이고 카드 목록으로 바꾸는 것이 나은 경우가 많다. 비교가 핵심이면 첫 열 고정 + 가로 스크롤.

## 체크리스트

- 머리글 행과 첫 열이 스크롤해도 보인다.
- 정렬 상태가 시각·`aria-sort` 로 모두 표시된다.
- 필터·정렬·페이지가 URL 에 남아 새로고침·공유해도 유지된다. → [검색·필터·정렬](/develop-wiki/knowledge/ui-ux/search-filter-sort/)
- 빈 결과·로딩·오류 상태가 표 안에서 구분된다. → [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/)
- 일괄 선택 후 몇 개가 선택됐는지 보이고 낭독된다.

## 흔한 실수·주의

- **div 격자로 표 구현.** 가상 스크롤 때문이라면 ARIA `table`/`row`/`cell` 역할과 `aria-rowcount`·`aria-rowindex` 를 함께 준다.
- **호버에만 나타나는 행 동작.** 터치·키보드 사용자는 발견하지 못한다.
- **모든 열을 기본 노출.** 기본 열은 과업에 필요한 최소로, 나머지는 열 설정에서 켠다.
- **정렬·필터 후 선택 상태가 조용히 유지.** 화면에 안 보이는 선택 항목에 일괄 삭제가 적용되는 사고가 난다. 숨은 선택 수를 표시하거나 초기화한다.
