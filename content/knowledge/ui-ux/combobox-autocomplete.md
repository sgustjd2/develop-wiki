---
title: 콤보박스·자동 완성 (APG Combobox)
aka: [Combobox, Autocomplete, Typeahead, Autosuggest, aria-activedescendant, Listbox Popup]
category: ui-ux
group: patterns
level: advanced
summary: 입력창에 포커스를 둔 채 화살표로 제안 목록을 탐색하게 하는 APG 콤보박스 패턴의 역할·상태·키 조작, 수동·자동 선택 차이와 흔한 함정.
tags: [accessibility, a11y, combobox, autocomplete, aria, apg, forms]
related: [ui-ux/keyboard-focus-management, ui-ux/semantic-html-first-aria, ui-ux/live-regions-announcements, ui-ux/search-filter-sort, ui-ux/screen-reader-accessible-name]
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  - https://www.w3.org/TR/wai-aria-1.2/#combobox
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
updatedAt: 2026-11-19
---

## 문제

- 검색창·주소 입력·태그 입력의 자동 완성은 구현이 쉬워 보이지만, 마우스로만 고르게 만들면 키보드·낭독기 사용자는 제안이 있는지조차 알 수 없다.
- 제안 항목마다 포커스를 옮기면 입력 중이던 커서가 사라져 계속 타이핑할 수 없다.
- `div` 에 이벤트만 붙인 커스텀 드롭다운은 낭독기가 "편집창" 인지 "목록" 인지 알려 주지 못한다.

## 해법

APG 의 구조는 다음과 같다(자기 말로 정리).

| 요소 | 역할·속성 |
| --- | --- |
| 입력창 | `role="combobox"`, `aria-expanded`(팝업 보임 여부), `aria-controls`(팝업 id), `aria-autocomplete`, `aria-activedescendant`(현재 강조 항목) |
| 팝업 | 보통 `role="listbox"`, 항목은 `role="option"` (grid·tree·dialog 도 가능, 그때는 `aria-haspopup` 지정) |
| 현재 항목 | 포커스는 입력창에 그대로 두고 `aria-activedescendant` 로 가리킨다 |

`aria-autocomplete` 값: `none`(입력과 무관한 목록), `list`(입력에 맞춰 걸러진 목록), `both`(목록 + 입력창 안에 나머지 글자를 선택 상태로 인라인 완성).

### 키 조작 (APG)

| 키 | 동작 |
| --- | --- |
| ↓ | 팝업이 닫혀 있으면 열고 첫 항목(이미 자동 선택된 항목이 있으면 다음 항목)으로 |
| ↑ (선택) | 마지막 항목으로 |
| Enter | 강조 항목을 값으로 채택하고 팝업을 닫는다 |
| Esc | 팝업을 닫는다. 이미 닫혀 있으면 입력을 지우도록 할 수도 있다(선택) |
| Alt+↓ (선택) | 포커스 이동 없이 팝업만 연다 |

### 수동 선택 vs 자동 선택

- **수동**: 제안이 떠도 아무것도 선택되지 않는다. 사용자가 고르지 않으면 입력한 문자열이 그대로 값이다. 예측하기 쉽다.
- **자동**: 첫 제안이 자동 강조되고, 포커스가 떠날 때 그것이 값이 된다. 빠르지만 의도치 않은 값 확정 위험이 있다(특히 한글 조합 입력 중).

### 코드: 목록형 수동 선택 (jsdom 으로 동작 확인)

```ts
function combobox(input: HTMLInputElement, list: HTMLElement, data: string[]) {
  let items: HTMLElement[] = [], active = -1;
  const setActive = (i: number) => {
    active = i;
    items.forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
    input.setAttribute('aria-activedescendant', i >= 0 ? items[i].id : '');
  };
  const setOpen = (o: boolean) => {
    list.hidden = !o;
    input.setAttribute('aria-expanded', String(o));
    if (!o) setActive(-1);
  };
  const render = () => {
    const q = input.value.trim().toLowerCase();
    const hit = q ? data.filter((d) => d.toLowerCase().includes(q)) : [];
    list.replaceChildren(...hit.map((d, n) =>
      Object.assign(document.createElement('li'), { id: `opt-${n}`, role: 'option', textContent: d })));
    items = [...list.children] as HTMLElement[];
    setActive(-1); setOpen(items.length > 0);
  };
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(); setActive(Math.min(active + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); input.value = items[active].textContent!; setOpen(false); }
    else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); setOpen(false); }
  });
}
```

- 확인한 동작: "서" 입력 → `aria-expanded=true`·후보 2개, ↓↓ → 둘째 옵션의 id 가 `aria-activedescendant`, Enter → 값 채움·닫힘. 낭독기에서 실제로 어떻게 읽히는지는 이 환경에서 확인하지 못했다.
- 결과 개수 안내(예: "후보 2개")는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 별도 알린다.
- 입력창에는 반드시 보이는 라벨이 있어야 한다([접근 가능한 이름](/develop-wiki/knowledge/ui-ux/screen-reader-accessible-name/)).

## 언제 쓰나

- 선택지가 많고(수십 개 이상) 타이핑으로 좁히는 편이 빠를 때: 국가·주소·사용자 검색·태그.
- 선택지가 적으면(대략 열 개 안쪽) 라디오·`<select>` 가 더 단순하고 접근성도 안정적이다.
- 자유 입력을 허용하되 제안만 돕는 경우 → 수동 선택. 목록에서 반드시 골라야 하는 경우 → 선택 강제 + 오류 안내.

## 주의

- 네이티브 `<datalist>` 는 단순하지만 스타일·낭독기 동작이 브라우저마다 다르다. 요구가 단순하면 먼저 검토한다.
- **한글 IME 조합 중** `input` 이벤트와 Enter 처리가 어긋나기 쉽다. `compositionstart/end` 를 고려하고, 조합 중 Enter 를 선택으로 취급하지 않는다. (이 노트의 예제는 이 부분을 처리하지 않는다.)
- 직접 만들기보다 검증된 라이브러리([React Aria](/develop-wiki/frontend/ui-kit/react-aria/), [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/), [Headless UI](/develop-wiki/frontend/ui-kit/headless-ui/) 등의 콤보박스)를 쓰는 편이 안전하다. 라이브러리별 낭독기 지원 범위는 직접 확인해야 한다.
- 비동기 제안은 요청 경쟁(느린 이전 응답이 나중에 덮어쓰기)과 로딩 상태를 처리해야 한다([로딩 상태](/develop-wiki/knowledge/ui-ux/loading-states/)).

## 체크리스트

- [ ] 입력창에 `role="combobox"`·보이는 라벨·`aria-expanded`·`aria-controls`
- [ ] ↓/↑/Enter/Esc 가 위 표대로 동작하고 Tab 으로 자연스럽게 빠져나간다
- [ ] 포커스는 입력창에 남고 강조는 `aria-activedescendant`
- [ ] 후보 수·"결과 없음"이 낭독기에 알려진다
- [ ] 모바일에서 팝업이 키보드에 가려지지 않는다

## 흔한 실수

- 항목마다 `tabindex` 를 줘서 Tab 이 목록을 순회하게 만든다.
- `aria-expanded` 를 갱신하지 않는다 / 팝업이 닫혀도 `aria-activedescendant` 가 남는다.
- 자동 선택에서 사용자가 모르는 사이 값이 바뀐다.
- 마우스 hover 를 키보드 강조와 같은 스타일로 섞어 혼동시킨다.
