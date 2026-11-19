---
title: 시맨틱 HTML 우선과 ARIA 사용 규칙
aka: [Semantic HTML, First Rule of ARIA, No ARIA is better than bad ARIA, Using ARIA, WAI-ARIA, 네이티브 요소 우선]
category: ui-ux
group: accessibility
level: beginner
summary: 의미와 동작이 내장된 네이티브 HTML 요소를 먼저 쓰고, ARIA 는 HTML 로 표현할 수 없는 의미를 보충할 때만 쓰며 키보드 동작까지 직접 구현해야 한다는 원칙.
tags: [accessibility, a11y, html, aria, semantics]
related: [ui-ux/wcag-22-overview, ui-ux/screen-reader-accessible-name, ui-ux/keyboard-focus-management, ui-ux/modal-dialog, ui-ux/live-regions-announcements]
sources:
  - https://www.w3.org/TR/using-aria/
  - https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/
  - https://www.w3.org/TR/html-aria/
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
updatedAt: 2026-11-19
---

## 문제

`<div onclick>` 로 만든 버튼은 화면에서는 버튼처럼 보이지만 브라우저가 아는 정보는 "그냥 div" 다.

- 키보드 Tab 으로 도달하지 않는다. Enter/Space 로 눌리지 않는다.
- 화면 낭독기는 역할(버튼)과 상태(눌림·비활성)를 알리지 못한다.
- 이걸 고치려고 `role="button"`, `tabindex`, 키 이벤트를 덧붙이다 보면 네이티브 `<button>` 을 어설프게 다시 만드는 셈이 된다.

## 해법 — ARIA 사용 규칙

W3C 문서 *Using ARIA* 가 정리한 규칙(1~4)을 자기 말로 옮기면 다음과 같다. 이 문서는 2026-02-24 "Discontinued Draft"가 되어 4개 규칙만 역사적 기록으로 남았고, 현재 참고 문서는 [WAI-ARIA APG](/develop-wiki/frontend/learning/wai-aria-apg/)다. 5번은 이전 판에 있던 규칙으로, 지금은 WCAG 4.1.2 의 요구로 보면 된다.

1. **네이티브 우선.** 필요한 의미와 동작을 가진 HTML 요소·속성이 있으면 그것을 쓴다. (흔히 "First rule of ARIA")
2. **네이티브 의미를 바꾸지 않는다.** `<h2 role="tab">` 처럼 덮어쓰지 말고 `<div role="tab"><h2>…</h2></div>` 처럼 감싼다.
3. **ARIA 로 만든 상호작용 요소는 키보드로도 전부 조작 가능해야 한다.** ARIA 는 의미만 알려 줄 뿐 동작을 만들어 주지 않는다.
4. **포커스 가능한 요소에 `role="presentation"`/`aria-hidden="true"` 를 쓰지 않는다.** 사용자가 "아무것도 아닌 곳"에 포커스를 두게 된다.
5. (이전 판의 규칙, WCAG 4.1.2 와 같은 맥락) **모든 상호작용 요소에는 접근 가능한 이름이 있어야 한다.** → [접근 가능한 이름](/develop-wiki/knowledge/ui-ux/screen-reader-accessible-name/)

APG 는 같은 취지를 "나쁜 ARIA 보다 ARIA 가 없는 편이 낫다"로 요약한다. 잘못된 role 은 아무것도 안 한 것보다 낭독기 사용자를 더 헷갈리게 한다.

### 대응표

| 하고 싶은 것 | 네이티브 | ARIA 로 직접 만들면 추가로 필요한 것 |
| --- | --- | --- |
| 버튼 | `<button type="button">` | `role="button"`, `tabindex="0"`, Enter·Space 처리, `aria-disabled` |
| 링크(페이지 이동) | `<a href>` | `role="link"`, Enter 처리, 가운데 클릭·새 탭 열기 불가 |
| 체크박스 | `<input type="checkbox">` | `role="checkbox"`, `aria-checked`, Space 처리 |
| 펼침/접힘 | `<details><summary>` | `aria-expanded`, `aria-controls`, 키 처리 |
| 모달 | `<dialog>` + `showModal()` | 포커스 가두기, 배경 inert, Esc → [모달·다이얼로그](/develop-wiki/knowledge/ui-ux/modal-dialog/) |
| 랜드마크 | `<header> <nav> <main> <aside> <footer>` | `role="banner"` 등 |
| 제목 구조 | `<h1>`~`<h6>` | `role="heading" aria-level` |

```html
<!-- 나쁜 예: 의미도 키보드도 없음 -->
<div class="btn" onclick="save()">저장</div>

<!-- 좋은 예: 역할·포커스·Enter/Space·disabled 가 기본 제공 -->
<button type="button" onclick="save()">저장</button>
```

### ARIA 가 꼭 필요한 경우

- HTML 에 해당 위젯이 없을 때: 탭(`tablist`/`tab`/`tabpanel`), 콤보박스, 트리, 그리드, 메뉴 버튼.
- 동적 상태를 알릴 때: `aria-expanded`, `aria-selected`, `aria-current="page"`, `aria-invalid`, `aria-busy`.
- 관계를 이을 때: `aria-labelledby`, `aria-describedby`, `aria-controls`.
- 변화를 낭독시킬 때: `role="status"`, `aria-live` → [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)

이런 위젯은 [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) 의 패턴(역할·키보드 표)을 따르거나, 이미 구현된 헤드리스 라이브러리([React Aria](/develop-wiki/frontend/ui-kit/react-aria/), [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/), [Headless UI](/develop-wiki/frontend/ui-kit/headless-ui/))를 쓴다.

## 언제 쓰나

- 모든 마크업 작성 시 기본값. 컴포넌트 라이브러리를 만들 때 특히 "루트 요소가 무엇인가"를 먼저 정한다.
- 디자인이 네이티브 컨트롤처럼 보이지 않는다는 이유로 div 를 쓰려 할 때: 대부분 CSS(`appearance: none`, `accent-color`)로 네이티브 요소를 꾸밀 수 있다.

## 체크리스트

- 클릭 가능한 것은 `<button>`(동작) 또는 `<a href>`(이동) 중 하나다.
- 페이지에 `<main>` 이 하나 있고, 제목 수준이 건너뛰지 않는다.
- `role` 을 썼다면 APG 의 해당 패턴 키보드 표를 구현했다.
- `aria-*` 상태는 실제 상태 변화와 함께 갱신된다(열렸는데 `aria-expanded="false"` 인 채로 남지 않는다).
- 자동 검사([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/))로 role·속성 오용을 잡는다.

## 흔한 실수·주의

- **`<a>` 로 버튼 만들기**(`href="#"` + 클릭 핸들러). 낭독기는 "링크"라고 읽고 Space 로 동작하지 않는다.
- **`aria-label` 남발.** 보이는 텍스트가 있으면 그걸로 충분하다. 다르게 붙이면 음성 명령 사용자가 보이는 글자로 호출하지 못한다(WCAG 2.5.3 Label in Name).
- **`aria-hidden="true"` 를 부모에 걸어 포커스 가능한 자식까지 숨김.** 모달 뒤 배경 처리에서 자주 생긴다. 지금은 `inert` 속성이나 `<dialog>` 의 `showModal()` 이 더 안전하다.
- **`role="presentation"` 으로 표를 레이아웃용으로 씀.** 레이아웃은 CSS Grid/Flex 로 한다.
- ARIA 는 시각 표현이나 동작을 바꾸지 않는다. `aria-disabled="true"` 를 붙여도 클릭은 여전히 된다. 핸들러에서 막아야 한다.
