---
title: 탭과 아코디언 (APG Tabs·Accordion)
aka: [Tabs, Tablist, Accordion, Disclosure, Collapsible Section, Roving tabindex, Manual Activation]
category: ui-ux
group: patterns
level: intermediate
summary: 콘텐츠를 나눠 보여 주는 두 패턴. 탭은 한 번에 하나의 패널을 화살표로 전환하고, 아코디언은 제목 버튼으로 각 패널을 접고 편다. 역할·키 조작·선택 기준을 비교한다.
tags: [accessibility, a11y, tabs, accordion, aria, apg, disclosure]
related: [ui-ux/keyboard-focus-management, ui-ux/semantic-html-first-aria, ui-ux/navigation-patterns, ui-ux/cognitive-load-progressive-disclosure, ui-ux/screen-reader-accessible-name]
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
  - https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
updatedAt: 2026-11-19
---

## 문제

- 한 화면에 정보가 많을 때 "숨기고 필요할 때 펼치기"는 흔한 해법이지만, 어떤 패턴을 쓰느냐에 따라 키보드·낭독기 경험이 크게 달라진다.
- 탭 모양인데 실제로는 페이지 이동인 링크(내비게이션)를 `role="tab"` 으로 만들거나, 아코디언 제목을 `div` 클릭으로 만드는 일이 흔하다.

## 해법

### 탭 (APG)

| 요소 | 속성 |
| --- | --- |
| 컨테이너 | `role="tablist"` (+ 라벨, 세로면 `aria-orientation="vertical"`) |
| 탭 | `role="tab"`, `aria-selected`, `aria-controls`(패널 id) |
| 패널 | `role="tabpanel"`, `aria-labelledby`(탭 id) |

- **Tab 키는 선택된 탭 하나에만 멈추고**(roving tabindex), 탭 사이 이동은 ←/→(세로면 ↑/↓), Home/End 로 한다. 다시 Tab 을 누르면 패널로 간다.
- 활성화 방식: **자동**(포커스가 닿으면 바로 전환)은 패널이 즉시 나타날 때만 권장, **수동**(Enter/Space 로 전환)은 로딩이 있을 때 적합하다.
- 패널 안에 포커스 가능한 요소가 없거나 첫 내용이 포커스 불가면 패널에 `tabindex="0"` 을 준다.

### 아코디언 (APG)

- 제목은 **`<h3>` 같은 heading 안의 `<button>`** 이다. 버튼만 heading 안에 둔다.
- 버튼에 `aria-expanded`(true/false)와 `aria-controls`(패널 id). 패널에는 선택적으로 `role="region"` + `aria-labelledby` 를 쓰되, 한꺼번에 열릴 수 있는 패널이 많으면(APG 는 대략 6개 초과) 랜드마크가 넘치므로 생략한다.
- 키: Enter/Space 로 펼침·접힘, 나머지는 일반 Tab 순서. 화살표 키 이동은 선택 사항이다.
- 단순한 경우 네이티브 `<details><summary>` 로 충분할 수 있다. 브라우저·낭독기별 동작은 직접 확인한다.

### 코드: 수동 활성화 탭 (jsdom 으로 확인)

```ts
const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')];
const select = (t: HTMLElement) => tabs.forEach((x) => {
  const on = x === t;
  x.setAttribute('aria-selected', String(on));
  x.tabIndex = on ? 0 : -1;
  document.getElementById(x.getAttribute('aria-controls')!)!.hidden = !on;
});
tablist.addEventListener('keydown', (e: KeyboardEvent) => {
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  const to = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length,
               Home: 0, End: tabs.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  tabs[to].focus();            // 포커스만 이동. 전환은 Enter/Space(= button click)
});
tabs.forEach((t) => t.addEventListener('click', () => select(t)));
```

- 확인한 동작: 첫 탭에서 ← 로 마지막 탭에 포커스(순환), `aria-selected` 는 그대로, Enter 에 해당하는 click 후 세 번째 패널만 표시되고 tabindex 가 `[-1, -1, 0]`.

## 비교

| 기준 | 탭 | 아코디언 |
| --- | --- | --- |
| 동시에 보이는 패널 | 하나 | 여러 개 가능 |
| 사용자의 목표 | 같은 층위의 대안 중 하나 보기 | 긴 내용을 훑고 필요한 것만 열기 |
| 키 이동 | 화살표(복합 위젯) | Tab 순서 그대로 |
| 모바일 | 탭이 많으면 가로 스크롤 필요 | 세로로 자연스럽다 |
| 오용 | 페이지 이동에 사용 | 필수 정보를 접어 둠 |

## 언제 쓰나

- 탭: 같은 대상의 동등한 보기(개요/사양/리뷰). 패널 간 비교가 필요 없을 때.
- 아코디언: FAQ, 설정 그룹, 긴 문서의 개요. 모바일 우선 화면.
- 다른 페이지로 이동하면 탭이 아니라 링크 목록([내비게이션 패턴](/develop-wiki/knowledge/ui-ux/navigation-patterns/)).

## 체크리스트

- [ ] 탭: Tab 은 선택 탭에만, 화살표/Home/End 로 이동, `aria-selected` 갱신
- [ ] 아코디언: heading > button 구조, `aria-expanded` 가 실제 상태와 일치
- [ ] 접힌 패널은 `hidden`/`display:none` 으로 포커스·낭독 대상에서 제외
- [ ] 보이는 포커스 링과 선택 표시가 모두 있다
- [ ] URL 해시·딥링크로 특정 탭·섹션을 열 수 있다(필요하면)

## 흔한 실수

- 모든 탭에 `tabindex="0"` 을 줘서 Tab 이 탭마다 멈춘다.
- 접힌 패널을 `opacity:0`/화면 밖 이동만 해서 포커스가 보이지 않는 곳으로 간다.
- 중요한 오류 메시지·필수 입력을 닫힌 아코디언 안에 둔다. 제출 시 해당 섹션을 열고 포커스를 옮긴다.
- 모든 것을 접어 "숨은 콘텐츠"가 늘어난다. 발견성이 떨어지고 검색(Ctrl+F)에도 걸리지 않을 수 있다([점진적 공개](/develop-wiki/knowledge/ui-ux/cognitive-load-progressive-disclosure/)).
