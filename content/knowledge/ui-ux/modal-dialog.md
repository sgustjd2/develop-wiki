---
title: 모달·다이얼로그 (WAI-ARIA APG, <dialog>)
aka: [Modal Dialog, Dialog, dialog element, showModal, Alert Dialog, Focus Trap, inert, 모달, 대화상자]
category: ui-ux
group: patterns
level: intermediate
summary: 배경을 막고 사용자의 응답을 받는 모달 다이얼로그를 언제 쓰고, 네이티브 <dialog> 와 APG 패턴으로 포커스·키보드·이름을 어떻게 처리하는지 정리한다.
tags: [ux, modal, dialog, accessibility, apg, html]
related: [ui-ux/keyboard-focus-management, ui-ux/confirmation-vs-undo, ui-ux/semantic-html-first-aria, ui-ux/toast-notification-banner, ui-ux/screen-reader-accessible-name]
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
  - https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element
  - https://www.nngroup.com/articles/modal-nonmodal-dialog/
updatedAt: 2026-11-23
---

## 문제

- 모달은 사용자의 흐름을 끊는다. 필요 없는 곳(안내, 마케팅, 단순 성공 알림)에 쓰면 닫기 버튼 찾기 게임이 된다.
- 직접 만든 모달은 흔히 Tab 이 배경으로 새고, Esc 로 닫히지 않고, 닫은 뒤 포커스가 페이지 맨 위로 튄다. 낭독기는 모달 밖 내용을 계속 읽는다.

## 해법

### 1. 모달이 맞는지 먼저 판단

| 상황 | 권장 |
| --- | --- |
| 계속하려면 꼭 답해야 하는 결정(파괴적 동작 확인, 저장 안 한 변경) | 모달(또는 `alertdialog`) |
| 짧은 입력(이름 바꾸기, 단일 필드) | 모달 또는 인라인 편집 |
| 다른 내용을 보면서 편집해야 하는 상세 편집 | 비모달 사이드 패널·별도 페이지 → [데이터 테이블](/develop-wiki/knowledge/ui-ux/data-table-density/) |
| 완료·정보 알림 | 토스트·배너 → [토스트](/develop-wiki/knowledge/ui-ux/toast-notification-banner/) |
| 긴 폼·여러 단계 | 별도 페이지 |

아래 그림은 위 표의 모달(정보성 1버튼, 확인 2버튼)과 배경을 막지 않는 사이드 패널을 나란히 놓은 것이다.

<figure class="fig" role="group" aria-label="정보성 모달, 확인 모달, 비모달 사이드 패널 비교 도식. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="정보성 모달(버튼 1개)"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="0" y="0" width="120" height="80" rx="5" class="f-scrim"/><rect x="22" y="18" width="76" height="44" rx="4" class="f-card"/><text x="60" y="32" class="f-text" text-anchor="middle" font-size="7.5">세션 만료</text><line x1="32" y1="38" x2="88" y2="38" class="f-line"/><rect x="46" y="46" width="28" height="11" rx="3" class="f-fill-blue"/><text x="60" y="54" class="f-on" text-anchor="middle" font-size="6.5">확인</text></svg><span>정보성 모달(버튼 1개)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="확인 모달(버튼 2개)"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="0" y="0" width="120" height="80" rx="5" class="f-scrim"/><rect x="22" y="18" width="76" height="44" rx="4" class="f-card"/><text x="60" y="32" class="f-text" text-anchor="middle" font-size="7.5">삭제할까요?</text><line x1="32" y1="38" x2="88" y2="38" class="f-line"/><rect x="30" y="46" width="28" height="11" rx="3" class="f-btn"/><text x="44" y="54" class="f-text" text-anchor="middle" font-size="6.5">취소</text><rect x="62" y="46" width="28" height="11" rx="3" class="f-fill-blue"/><text x="76" y="54" class="f-on" text-anchor="middle" font-size="6.5">삭제</text></svg><span>확인 모달(버튼 2개)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="비모달 사이드 패널"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="14" y="10" width="52" height="56" rx="3" class="f-card"/><line x1="20" y1="22" x2="60" y2="22" class="f-line"/><line x1="20" y1="32" x2="56" y2="32" class="f-line"/><line x1="20" y1="42" x2="60" y2="42" class="f-line"/><rect x="72" y="10" width="34" height="56" rx="3" class="f-fill-gray"/><text x="89" y="24" class="f-text" text-anchor="middle" font-size="6">패널</text></svg><span>비모달 사이드 패널</span></div></div><figcaption>모달 두 가지와 배경을 막지 않는 대안. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

### 2. APG 모달 다이얼로그 권고·요구

- 컨테이너 `role="dialog"`(응답이 필요한 경고는 `alertdialog`), `aria-modal="true"`.
- 이름: 보이는 제목을 `aria-labelledby` 로 참조(또는 `aria-label`). 설명은 선택적으로 `aria-describedby` — 내용이 길거나 구조가 있으면 생략.
- **열릴 때 포커스**: 기본은 첫 포커스 가능 요소. 내용이 길면 맨 위 정적 요소(`tabindex="-1"`), **되돌릴 수 없는 동작이면 가장 덜 파괴적인 버튼**, 정보성이면 가장 가능성 높은 동작(확인).
- **Tab/Shift+Tab** 이 다이얼로그 안에서 순환한다. **Esc** 로 닫힌다. 보이는 닫기 버튼을 두는 것을 APG 가 강하게 권장한다.
- **닫힐 때** 연 요소로 포커스 복귀. 그 요소가 사라졌다면 논리적인 다음 위치.

### 3. 네이티브 `<dialog>` 로 대부분 해결

`showModal()` 로 열면 브라우저가 처리한다:

- 최상위 레이어에 표시, 나머지 문서를 inert(조작·낭독 차단), `aria-modal` 노출, `::backdrop` 생성.
- Esc → `cancel` 이벤트 → 닫힘. `closedby` 속성으로 닫힘 방식 지정(`any`: 바깥 클릭 포함, `closerequest`: Esc 등, `none`: 코드로만). 미지정 시 모달은 `closerequest`.
- HTML 표준은 닫을 때 "이전에 포커스된 요소"로 포커스를 되돌리는 단계를 정의한다.
- `<form method="dialog">` 의 제출 버튼 `value` 가 `returnValue` 가 된다.
- `autofocus` 로 첫 포커스 지정. `<dialog>` 자체에 `tabindex` 는 쓰지 않는다.

```html
<dialog id="del" aria-labelledby="del-title">
  <h2 id="del-title">‘2026 예산.xlsx’를 삭제할까요?</h2>
  <p>휴지통에서 30일 뒤 영구 삭제됩니다.</p>
  <form method="dialog">
    <button value="cancel" autofocus>취소</button>
    <button value="delete">파일 삭제</button>
  </form>
</dialog>
```

```ts
// 연 요소가 그사이 사라진 경우(예: 삭제된 행의 버튼)만 직접 처리
export function openModal(dialog: HTMLDialogElement, fallback: HTMLElement) {
  const opener = document.activeElement as HTMLElement | null;
  dialog.addEventListener('close', () => {
    if (!opener?.isConnected) fallback.focus();
  }, { once: true });
  dialog.showModal();
}
// dialog.returnValue === 'delete' 이면 삭제 실행
```

(jsdom 은 `showModal` 을 구현하지 않아 스텁으로 대체 포커스 동작만 확인했다. 실제 포커스 복귀·inert 는 대상 브라우저에서 확인한다.) 직접 구현이 어렵다면 [React Aria](/develop-wiki/frontend/ui-kit/react-aria/), [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/) 의 Dialog 를 쓴다.

## 언제 쓰나

- 응답 없이는 다음으로 진행하면 안 되는 결정, 짧은 집중 입력.
- 쓰지 않을 곳: 정보 알림, 긴 폼, 다른 내용 참조가 필요한 편집, 페이지 진입 즉시 뜨는 홍보.

## 체크리스트

- 제목이 있고 다이얼로그 이름으로 연결된다.
- 키보드만으로 열기 → 조작 → Esc/닫기 → 원래 위치 복귀가 된다.
- 배경 스크롤이 잠기고, 낭독기로 배경 내용이 읽히지 않는다.
- 작은 화면·200% 확대에서 내용이 잘리지 않고 다이얼로그 안에서 스크롤된다.
- 버튼 레이블이 결과를 말한다("파일 삭제" / "취소"). → [확인 vs 실행 취소](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/)

## 흔한 실수·주의

- **모달 위에 모달.** 맥락을 잃는다. 단계를 페이지로 옮긴다.
- **바깥 클릭으로 닫힘 + 입력 내용 유실.** 입력이 있는 모달은 `closedby="closerequest"` 수준으로 두거나 닫기 전 확인한다.
- **`aria-hidden` 으로 배경 숨기기를 수동 관리.** 다이얼로그가 `aria-hidden` 조상 안에 있으면 통째로 사라진다. `inert` 나 `showModal()` 을 쓴다.
- **`closedby`·`requestClose()` 같은 최신 기능의 브라우저 지원 차이.** 쓰기 전에 지원 범위를 확인하고 폴백을 둔다.
