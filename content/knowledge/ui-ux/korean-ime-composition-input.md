---
title: 한글 IME 조합 입력 처리
aka: [IME Composition, compositionstart, compositionend, isComposing, 한글 조합, 입력기 조합 중 Enter]
category: ui-ux
group: patterns
level: intermediate
summary: 한글 같은 조합형 입력에서 조합 중 Enter·실시간 검색·검증이 오동작하는 원인과, composition 이벤트·isComposing 으로 안전하게 처리하는 방법.
tags: [ime, korean, composition, input, keyboard, i18n, search]
related: [ui-ux/combobox-autocomplete, ui-ux/form-inline-validation, ui-ux/search-filter-sort, ui-ux/i18n-ux, ui-ux/korean-ui-writing-guide, ui-ux/keyboard-focus-management, ui-ux/korean-search-normalization-chosung-jamo]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event
  - https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
  - https://w3c.github.io/uievents/#events-composition-types
updatedAt: 2026-11-19
---

## 문제

한글은 자모를 쳐서 글자를 **조합**하는 입력이다. 'ㅎ' → '하' → '한' 처럼 확정되기 전의 글자가 입력창에 임시로 들어 있다. 영문 기준으로 만든 핸들러가 이 중간 상태를 확정값으로 오해한다.

- 조합 중 Enter 가 "글자 확정"인데 폼이 제출되거나 콤보박스 항목이 선택된다.
- `input` 이벤트마다 검색 API 를 호출해 'ㅎ', '하', '한' 을 모두 검색한다.
- 조합 중간값('ㅎ')을 "한글이 아닙니다/너무 짧습니다"로 즉시 검증해 오류가 깜빡인다.
- 조합 중 글자 수 제한·마스킹이 글자를 잘라 조합이 끊긴다.

## 해법

### 1. 이벤트 모델 (UI Events)

- `compositionstart` → `compositionupdate`(1회 이상) → `compositionend` 순서. 입력기 후보 창이 뜨는 구간이다.
- `KeyboardEvent.isComposing` 과 `InputEvent.isComposing` 은 조합 구간 안의 이벤트에서 `true`.
- `compositionend` 의 `data` 가 확정된 문자열.
- 브라우저별로 마지막 키(예: 조합을 끝내는 Enter)의 `keydown` 과 `compositionend` 의 **도착 순서**가 다를 수 있다. 예전부터 Safari 는 `compositionend` 가 먼저 와서 그 `keydown` 의 `isComposing` 이 `false` 라고 알려져 있다. 이 노트는 그 순서를 실기기에서 확인하지 못했고, MDN 페이지에도 해당 설명이 없다(일반 지식 + 방어적 코딩).
- 레거시 `keyCode === 229`(입력기가 처리 중)는 보조 방어로만 쓴다. `keyCode` 는 폐기 예정 속성이다.

### 2. 규칙

1. 조합 중(`isComposing` 또는 추적한 `composing`)에는 Enter·화살표·Esc 단축키를 **가로채지 않는다**.
2. `compositionend` 직후 같은 틱의 `keydown` 도 조합 소속으로 취급한다(Safari 대비).
3. 검색·자동완성·유효성 검사는 **조합이 끝난 값**으로. `input` 에서 `isComposing` 이면 무시하고, `compositionend` 에서 한 번 처리한다.
4. 조합 중에는 값을 코드로 덮어쓰지 않는다(자르기·마스킹·정규화는 확정 후).
5. 디바운스는 보조일 뿐 해결책이 아니다. 조합이 길어지면 중간값이 새어 나간다.

### 3. 코드 (jsdom 에서 **합성 이벤트**로 확인)

```ts
function imeSafe(el: HTMLInputElement, h: { onEnter(): void; onQuery(v: string): void }) {
  let composing = false, justEnded = false;
  el.addEventListener('compositionstart', () => { composing = true; });
  el.addEventListener('compositionend', () => {
    composing = false; justEnded = true;
    setTimeout(() => { justEnded = false; }, 0); // 같은 틱의 keydown 은 조합 소속
    h.onQuery(el.value);                          // 확정 시점에 1회
  });
  el.addEventListener('input', (e) => {
    if (!(e as InputEvent).isComposing && !composing) h.onQuery(el.value);
  });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.isComposing || composing || justEnded || e.keyCode === 229) return;
    h.onEnter();
  });
}
```

- 확인한 시나리오(Node 24 + jsdom, 이벤트를 직접 만들어 발생):
  - A(Chrome 계열 순서 가정): 조합 중 `input` 2회 → Enter(`isComposing`, 229) → `compositionend` ⇒ 검색 1회('한'), 제출 0회.
  - B(Safari 순서 가정): `compositionend` → Enter(`isComposing=false`) ⇒ 제출되지 않음. 틱이 지난 뒤의 Enter 는 제출됨.
- **확인하지 못한 것**: 실제 한글 입력기(macOS·Windows·iOS·Android 키보드)와 실제 브라우저에서의 이벤트 순서. jsdom 은 IME 를 구현하지 않으므로 위 결과는 "내 핸들러가 가정한 순서를 처리한다"는 뜻일 뿐, 실제 순서가 그렇다는 증명이 아니다. 릴리스 전에 실기기 수동 테스트가 필요하다.

### 4. 적용 위치별 메모

| 위치 | 처리 |
| --- | --- |
| 검색창 | 확정값으로 검색. 조합 중 Enter 는 검색 실행 아님 ([검색·필터·정렬](/develop-wiki/knowledge/ui-ux/search-filter-sort/)) |
| 콤보박스 | 조합 중 ↑↓Enter 로 항목을 고르지 않음. 제안 갱신도 확정 후 ([콤보박스](/develop-wiki/knowledge/ui-ux/combobox-autocomplete/)) |
| 인라인 검증 | 조합 중에는 검증·오류 표시 보류, `compositionend`/blur 에서 ([인라인 검증](/develop-wiki/knowledge/ui-ux/form-inline-validation/)) |
| 글자 수 제한 | `maxlength` 속성 vs 직접 자르기의 동작 차이를 실기기로 확인. 직접 자르기는 확정 후 |
| 채팅 입력 | Enter 전송 + Shift+Enter 줄바꿈이면 조합 중 Enter 가 전송되는 사고가 가장 흔함 |

## 언제 쓰나

- 한국어·일본어·중국어 사용자가 쓰는 모든 텍스트 입력의 Enter/실시간 처리.
- 영문 전용 서비스라도 한글 사용자가 들어올 수 있다면 최소한 Enter 처리는 넣는다.

## 주의

- 프레임워크의 `onChange` 가 조합 중에도 발생하는 경우가 많다(React 의 `onChange` 는 `input` 기반). 직접 이벤트를 확인한다.
- 제어 컴포넌트에서 조합 중 값을 상태로 되돌려 쓰면 조합이 끊기는 사례가 있다. 증상은 라이브러리·버전마다 달라 실기기로 확인해야 한다(이 노트는 미확인).
- 모바일 가상 키보드는 데스크톱과 이벤트 순서가 다를 수 있다. 자동완성 학습/예측 입력은 `compositionupdate` 를 빈번히 일으킨다.
- 라이브러리가 이미 처리하는지 확인하고, 처리하면 중복 구현하지 않는다([React Aria](/develop-wiki/frontend/ui-kit/react-aria/) 등 — 처리 범위는 문서·테스트로 직접 확인).

## 체크리스트

- [ ] 조합 중 Enter 가 제출·선택·전송을 일으키지 않는다
- [ ] `compositionend` 직후 Enter 처리(Safari 순서)를 고려했다
- [ ] 검색·자동완성 호출이 확정값 기준이다
- [ ] 조합 중 검증 오류가 깜빡이지 않는다
- [ ] 값 자르기·마스킹은 조합 중에 하지 않는다
- [ ] 한글 입력기로 최소 Chrome·Safari·모바일 1종 이상 수동 테스트

## 흔한 실수

- `e.keyCode === 13` 만 보고 Enter 처리.
- `input` 이벤트마다 API 호출 후 디바운스로 때우기.
- 영어로만 테스트하고 배포.
- 조합 중 Esc 를 "입력 지우기"로 처리해 조합 취소와 충돌.
