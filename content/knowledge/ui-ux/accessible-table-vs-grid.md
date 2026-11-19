---
title: 접근 가능한 테이블과 그리드 (table vs grid)
aka: [APG Grid Pattern, ARIA table vs grid, role=grid, aria-rowcount, 가상 스크롤 표 접근성, 데이터 그리드 키보드]
category: ui-ux
group: accessibility
level: advanced
summary: 읽기 전용 표는 네이티브 table 로, 셀 안 컨트롤이 많은 편집형 표만 APG grid(탭 정지점 1개 + 화살표 이동)로 만들고, 가상 스크롤 시 rowcount·rowindex 를 맞추는 방법.
tags: [accessibility, table, grid, apg, aria, keyboard, virtual-scroll]
related: [ui-ux/data-table-density, ui-ux/keyboard-focus-management, ui-ux/semantic-html-first-aria, ui-ux/screen-reader-accessible-name, ui-ux/live-regions-announcements, ui-ux/a11y-testing-strategy, ui-ux/pagination-vs-infinite-scroll]
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/grid/
  - https://www.w3.org/WAI/ARIA/apg/patterns/table/
  - https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/
updatedAt: 2026-11-19
---

[데이터 테이블과 정보 밀도](/develop-wiki/knowledge/ui-ux/data-table-density/)는 표의 **레이아웃·밀도·과업**을 다룬다. 이 노트는 그 표를 **table 로 낼지 grid 로 낼지**, 키보드와 ARIA 를 어떻게 맞출지에 집중한다.

## 문제

- 읽기만 하는 표에 `role="grid"` 를 붙이면 상호작용 복합 위젯으로 취급돼 키보드 계약을 구현해야 한다(APG 는 grid 를 복합 위젯으로 설명하고 네이티브 `<table>` 을 권한다. 낭독기 안내 문구는 제품마다 다르며 APG 에서 확인하지 못했다).
- 행마다 버튼·입력이 있는 표는 탭 정지점이 수백 개가 되어 키보드 사용자가 표를 빠져나오기 어렵다.
- 가상 스크롤로 일부 행만 DOM 에 있으면 낭독기가 전체 크기를 알 수 없고, 행 번호가 틀어진다.

## 해법

### 1. 고르는 기준 (APG)

| | table | grid |
| --- | --- | --- |
| 성격 | 정적 정보. 위젯이 아니다 | 상호작용하는 복합 위젯 |
| 셀 포커스 | 셀 자체는 포커스 대상이 아님 | 셀(또는 셀 안 위젯)이 포커스 대상 |
| 탭 순서 | 셀 안 컨트롤이 각각 탭 정지점 | 표 전체가 탭 정지점 1개, 안은 화살표 |
| 포커스 관리 코드 | 필요 없음 | 직접 작성해야 함 |
| 마크업 | 네이티브 `<table>` 강하게 권장 | `<table>` 에 role 을 얹거나 div 격자 |

- 기본값은 **native `<table>`**. 정렬·필터 컨트롤은 표 바깥/헤더 안의 버튼으로 두어도 충분하다.
- grid 는 "셀 안에 편집 가능한 값이나 위젯이 많아 탭 정지점이 폭증할 때" 쓴다. 탭 정지점을 줄이는 대신 키보드 계약을 직접 구현·유지하는 비용을 진다.

### 2. grid 키보드 계약 (APG 데이터 그리드)

| 키 | 동작 |
| --- | --- |
| 화살표 | 한 칸 이동, 가장자리에서 멈춤 |
| Home / End | 현재 행의 첫/끝 셀 |
| Ctrl+Home / Ctrl+End | 첫 행 첫 셀 / 마지막 행 마지막 셀 |
| Page Up / Down | 작성자가 정한 행 수만큼 이동 |
| Enter 또는 F2 | 그리드 탐색을 끄고 셀 안(입력·컨트롤)으로 |
| Esc | 그리드 탐색 복귀 |
| 문자 입력 | 편집 가능한 셀이면 편집 시작 |

- 셀에 위젯이 하나뿐이고 화살표를 쓰지 않으면 그 위젯에 포커스, 텍스트·그래픽만 있으면 셀에 포커스한다.
- 포커스 방식(roving tabindex vs `aria-activedescendant`)은 APG 가 지정하지 않는다. 아래 예제는 roving tabindex.

### 3. 가상 스크롤·숨은 열: 개수와 위치를 ARIA 로

DOM 에서 알 수 없는 정보는 ARIA 로 알려야 한다.

- `aria-rowcount`/`aria-colcount`: 전체 행·열 수(헤더 행 포함). 모르면 `-1`.
- `aria-rowindex`/`aria-colindex`: 각 행·셀의 1 기준 위치. 값은 증가해야 하고 전체 범위 안이어야 한다. 누락·불일치는 낭독기의 표 탐색을 건너뛰게 만들 수 있다(APG).
- `aria-sort`: 정렬 중인 헤더 하나에. ARIA 는 다단계 정렬을 표현하지 못한다.
- HTML `<table>` 의 병합은 네이티브 `rowspan`/`colspan`, 그 외는 `aria-rowspan`/`aria-colspan`.

### 4. 코드: roving tabindex grid (jsdom 으로 키 동작 확인)

```ts
function gridNav(grid: HTMLElement, pageSize = 10) {
  const rows = () => [...grid.querySelectorAll<HTMLElement>('[role=row]')];
  const cells = (r: HTMLElement) => [...r.children] as HTMLElement[];
  let r = 0, c = 0, editing = false;
  const focus = () => {
    grid.querySelectorAll('[tabindex]').forEach((e) => e.setAttribute('tabindex', '-1'));
    const cell = cells(rows()[r])[c];
    cell.setAttribute('tabindex', '0'); cell.focus();
  };
  grid.addEventListener('keydown', (e) => {
    if (editing) { if (e.key === 'Escape') { editing = false; focus(); } return; }
    const R = rows().length, C = cells(rows()[r]).length;
    const moves: Record<string, () => void> = {
      ArrowRight: () => (c = Math.min(c + 1, C - 1)), ArrowLeft: () => (c = Math.max(c - 1, 0)),
      ArrowDown: () => (r = Math.min(r + 1, R - 1)), ArrowUp: () => (r = Math.max(r - 1, 0)),
      PageDown: () => (r = Math.min(r + pageSize, R - 1)), PageUp: () => (r = Math.max(r - pageSize, 0)),
      Home: () => { if (e.ctrlKey) r = 0; c = 0; }, End: () => { if (e.ctrlKey) r = R - 1; c = C - 1; },
    };
    if (moves[e.key]) { e.preventDefault(); moves[e.key](); focus(); }
    else if (e.key === 'Enter' || e.key === 'F2') {
      editing = true; cells(rows()[r])[c].querySelector<HTMLElement>('button,input')?.focus();
    }
  });
  focus();
}
```

- 확인한 동작(jsdom, 3행 격자에 `aria-rowcount="101"`·`aria-rowindex` 41/42): 화살표가 가장자리에서 멈춤, Ctrl+End 가 마지막 행으로, `tabindex="0"` 는 항상 1개, Enter 로 셀 안 버튼에 포커스·Esc 로 셀 복귀.
- 확인하지 못한 것: 실제 낭독기(NVDA·VoiceOver)가 이 마크업을 어떻게 읽는지, 가상 스크롤로 행이 교체될 때 포커스 유지. 이 예제는 스크롤·행 교체를 구현하지 않았다.

## 언제 쓰나

- 읽기 전용 목록·비교표·리포트 → `<table>` + `<caption>` + `scope`. grid 불필요.
- 행마다 편집 입력·메뉴·체크박스가 있는 관리 화면 → grid 를 검토. 단, "행 클릭 → 상세 패널에서 편집"으로 설계를 바꿔 table 로 해결되는지 먼저 본다.
- 스프레드시트처럼 셀 단위 탐색·선택이 본질일 때 → grid.
- 직접 구현이 부담이면 검증된 헤드리스 라이브러리를 쓰되, 낭독기 지원 범위는 직접 확인한다([React Aria](/develop-wiki/frontend/ui-kit/react-aria/) 등).

## 주의

- grid 는 "더 접근성 좋은 table" 이 아니다. 키보드 계약을 안 지키면 table 보다 나쁘다.
- 화살표 키가 낭독기의 탐색 모드와 충돌할 수 있어, 낭독기 사용자에게는 grid 가 오히려 낯설 수 있다(실사용 테스트가 필요; 이 노트는 실기기 미확인).
- 정렬·필터 결과 변화는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알린다("이름순 오름차순 정렬, 42건").
- 가상 스크롤은 브라우저 찾기(Ctrl+F)와 낭독기 전체 탐색에서 화면 밖 행이 빠진다. 페이지 나누기가 가능하면 그쪽이 안전하다([페이지네이션 vs 무한 스크롤](/develop-wiki/knowledge/ui-ux/pagination-vs-infinite-scroll/)).

## 체크리스트

- [ ] 읽기 전용이면 네이티브 `<table>`·`<caption>`·`<th scope>`
- [ ] grid 를 쓴다면 이유(탭 정지점 폭증 등)가 기록돼 있다
- [ ] 탭 정지점 1개, 화살표/Home/End/Page/Ctrl+Home·End/Enter·F2/Esc 계약 구현
- [ ] 가상화 시 `aria-rowcount`·`aria-rowindex` 가 서로 일치
- [ ] 정렬 헤더 한 곳에만 `aria-sort`
- [ ] 편집 기능이 있는 그리드에서 편집 불가 셀·그리드에 `aria-readonly`(APG 는 편집 기능이 있는 grid 에 한정)
- [ ] 키보드만으로 표 진입·탈출·모든 컨트롤 사용 가능([키보드·포커스](/develop-wiki/knowledge/ui-ux/keyboard-focus-management/))
- [ ] [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/) 자동 검사 + 낭독기 수동 확인([접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/))

## 흔한 실수

- 읽기 전용 표에 습관적으로 `role="grid"`.
- div 격자에 role 없이 스타일만 입혀 행·열 관계가 사라짐.
- `aria-rowindex` 를 화면 내 순번(1부터)으로 매겨 전체 위치와 어긋남.
- grid 안 모든 셀에 `tabindex="0"` 을 주어 탭 정지점이 줄지 않음.
- Enter 로 셀 편집에 들어간 뒤 Esc 로 돌아오는 경로가 없음.
