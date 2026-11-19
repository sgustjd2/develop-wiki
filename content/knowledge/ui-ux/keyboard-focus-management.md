---
title: 키보드 내비게이션·포커스 관리·포커스 표시
aka: [Keyboard Navigation, Focus Management, Focus Visible, Focus Indicator, Roving tabindex, aria-activedescendant, Skip Link]
category: ui-ux
group: accessibility
level: intermediate
summary: 마우스 없이 Tab·화살표·Enter·Esc 만으로 모든 기능을 쓰게 하고, 포커스 위치가 늘 보이며 화면이 바뀌어도 포커스가 길을 잃지 않게 설계하는 방법.
tags: [accessibility, a11y, keyboard, focus, wcag, apg]
related: [ui-ux/semantic-html-first-aria, ui-ux/modal-dialog, ui-ux/wcag-22-overview, ui-ux/screen-reader-accessible-name, ui-ux/pagination-vs-infinite-scroll, ui-ux/color-contrast-wcag-apca]
sources:
  - https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
  - https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
updatedAt: 2026-11-19
---

## 문제

키보드 사용자에는 시각 장애인(낭독기는 키보드로 조작), 운동 장애로 마우스를 못 쓰는 사람, 스위치·음성 제어 사용자, 단축키를 선호하는 파워 유저가 모두 포함된다. 흔한 장애물은 다음과 같다.

- 커스텀 드롭다운·슬라이더가 Tab 으로 도달하지 않거나, 들어가면 빠져나오지 못한다(키보드 함정).
- `outline: none` 으로 포커스 링을 지워 지금 어디 있는지 보이지 않는다.
- 모달이 닫히거나 목록 항목을 삭제하면 포커스가 `<body>` 로 떨어져 처음부터 다시 Tab 해야 한다.
- 고정 헤더·쿠키 배너가 포커스된 요소를 덮는다.

## 해법

### 1. 관련 WCAG 기준

| SC | 수준 | 요지 |
| --- | --- | --- |
| 2.1.1 Keyboard | A | 모든 기능을 키보드로(경로 의존 동작 제외) |
| 2.1.2 No Keyboard Trap | A | 들어간 곳에서 키보드로 나올 수 있다 |
| 2.1.4 Character Key Shortcuts | A | 한 글자 단축키는 끄기·재지정·포커스 시에만 동작 중 하나 |
| 2.4.1 Bypass Blocks | A | 반복 블록 건너뛰기(건너뛰기 링크, 랜드마크) |
| 2.4.3 Focus Order | A | 포커스 순서가 의미·조작을 보존 |
| 2.4.7 Focus Visible | AA | 키보드 포커스 표시가 보인다 |
| 2.4.11 Focus Not Obscured (Minimum) | AA | 포커스 요소가 작성자 콘텐츠에 완전히 가려지지 않는다 |
| 1.4.11 Non-text Contrast | AA | 포커스 표시도 인접 색과 3:1 |
| 2.4.13 Focus Appearance | AAA | 2 CSS px 둘레 이상 면적, 포커스 전후 3:1 변화 |

### 2. Tab 은 컴포넌트 사이, 화살표는 컴포넌트 안

APG 의 핵심 규칙: 탭 목록·라디오 그룹·메뉴·그리드 같은 **복합 위젯은 Tab 순서에 한 칸만** 차지하고, 내부 이동은 화살표 키로 한다. 구현 방법은 두 가지다.

- **Roving tabindex**: 활성 항목만 `tabindex="0"`, 나머지는 `-1`. 화살표로 0 을 옮기고 실제 DOM 포커스를 이동한다. 스크롤도 브라우저가 맞춰 준다.
- **`aria-activedescendant`**: 컨테이너가 포커스를 유지하고 활성 자식의 id 를 가리킨다. 콤보박스처럼 입력창에 포커스를 남겨야 할 때 쓴다.

```ts
// 탭 목록용 roving tabindex (좌우 순환, Home/End)
export function rovingTabindex(container: HTMLElement, selector = '[role="tab"]') {
  const items = [...container.querySelectorAll<HTMLElement>(selector)];
  items.forEach((el, i) => { el.tabIndex = i === 0 ? 0 : -1; });
  container.addEventListener('keydown', (e: KeyboardEvent) => {
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const moves: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = items[(moves[e.key] + items.length) % items.length];
    items[i].tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  });
}
```

(jsdom 에서 좌측 순환·Home·우측 이동과 tabindex 이동을 확인했다. 실제 탭 위젯은 `aria-selected` 와 패널 전환도 함께 처리한다.)

### 3. 포커스 표시

```css
/* 마우스 클릭에는 링을 숨기고 키보드 포커스에만 보이게 */
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* 고정 헤더 높이만큼 스크롤 여유 → 2.4.11 충분한 기법 C43 */
html { scroll-padding-top: var(--header-height); }
```

- `outline: none` 을 쓰려면 반드시 대체 표시를 준다. 색 변화만으로는 1.4.11 과 색각 이상 사용자에게 부족할 수 있다.
- 포커스와 선택(selected)은 다르게 보여야 한다.
- 고대비 모드(Windows 강제 색상)에서는 `box-shadow` 가 사라진다. `outline` 이 더 안전하다.

### 4. 포커스가 길을 잃지 않게

| 상황 | 포커스 이동 대상 |
| --- | --- |
| 모달 열림 | 다이얼로그 안 첫 요소·제목·가장 안전한 버튼 → [모달](/develop-wiki/knowledge/ui-ux/modal-dialog/) |
| 모달 닫힘 | 연 요소. 사라졌다면 논리적으로 다음 위치 |
| 목록 항목 삭제 | 다음 항목(없으면 이전 항목·목록 제목) |
| SPA 라우트 전환 | 새 페이지 `<h1>`(`tabindex="-1"`) 또는 본문 시작 |
| "더 보기" 로드 | 새로 추가된 첫 항목 → [페이지네이션](/develop-wiki/knowledge/ui-ux/pagination-vs-infinite-scroll/) |
| 폼 제출 실패 | 오류 요약 → [폼 검증](/develop-wiki/knowledge/ui-ux/form-inline-validation/) |

## 언제 쓰나

- 커스텀 위젯(탭, 콤보박스, 메뉴, 캐러셀, 드래그 정렬)을 만들 때마다.
- SPA 에서 화면 일부를 교체하는 모든 상호작용.
- 단축키를 추가할 때(2.1.4).

## 체크리스트

- 마우스를 치우고 Tab/Shift+Tab/Enter/Space/Esc/화살표만으로 핵심 흐름을 끝까지 해 본다.
- 페이지 첫 Tab 에 "본문으로 건너뛰기" 링크가 나온다(또는 랜드마크로 대체).
- `tabindex` 에 양수 값이 없다. 0 과 -1 만 쓴다.
- 포커스 링이 모든 배경색 위에서 보인다.
- 고정 헤더·하단 바·채팅 버튼이 포커스 요소를 완전히 덮지 않는다.
- 끌어서 정렬하는 기능에 "위로/아래로 이동" 버튼 같은 대안이 있다(2.5.7).

## 흔한 실수·주의

- **양수 `tabindex`** 로 순서 조정. DOM 순서와 시각 순서를 맞추는 게 정답이다. CSS `order`·`flex-direction: row-reverse` 로 시각 순서만 바꿔도 같은 문제가 생긴다.
- **모든 요소에 `tabindex="0"`.** 문단·카드 전체에 포커스를 주면 Tab 횟수만 늘어난다. 상호작용 요소만 Tab 순서에 둔다.
- **단축키가 낭독기·브라우저 키와 충돌.** 단축키는 표준 내비게이션을 보완할 뿐 대체하지 않는다.
- **포커스 이동 남발.** 사용자가 요청하지 않은 포커스 이동은 방향 감각을 잃게 한다. 단순 상태 알림은 포커스 대신 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)을 쓴다.
