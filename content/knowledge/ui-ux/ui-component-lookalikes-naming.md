---
title: 비슷해 보이는 UI 컴포넌트 구분 사전
aka: [UI Component Lookalikes, Switch vs Checkbox vs Radio, Toast vs Snackbar vs Banner, Modal vs Sheet vs Popover, 컴포넌트 용어 정리]
category: ui-ux
group: patterns
level: intermediate
summary: 스위치·체크박스·라디오·세그먼티드 컨트롤, 토스트·스낵바·배너, 모달·바텀시트·팝오버·툴팁처럼 헷갈리는 컴포넌트를 공식 문서의 정의로 구분하고 플랫폼별 용어 차이를 정리한다.
tags: [ux, components, switch, checkbox, radio, toast, snackbar, modal, popover, naming]
related: [ui-ux/modal-dialog, ui-ux/toast-notification-banner, ui-ux/confirmation-vs-undo, ui-ux/semantic-html-first-aria, ui-ux/tabs-and-accordion, ui-ux/live-regions-announcements, ui-ux/material3-vs-apple-hig]
sources:
  - https://developer.android.com/guide/topics/ui/notifiers/toasts
  - https://www.w3.org/WAI/ARIA/apg/patterns/switch/
  - https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
  - https://www.w3.org/WAI/ARIA/apg/patterns/radio/
  - https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
  - https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
  - https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
  - https://developer.apple.com/design/human-interface-guidelines/toggles
  - https://developer.apple.com/design/human-interface-guidelines/segmented-controls
  - https://developer.apple.com/design/human-interface-guidelines/alerts
  - https://developer.apple.com/design/human-interface-guidelines/popovers
  - https://developer.apple.com/design/human-interface-guidelines/sheets
  - https://github.com/material-components/material-components-android/blob/master/docs/components/Switch.md
  - https://github.com/material-components/material-components-android/blob/master/docs/components/Snackbar.md
  - https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md
  - https://github.com/material-components/material-components-android/blob/master/docs/components/ToggleButtonGroup.md
updatedAt: 2026-11-23
---

## 문제

화면에서 비슷하게 보이는 컴포넌트를 같은 것으로 부르면 설계와 구현이 어긋난다.

- 설정 화면에 체크박스를 두고 누르자마자 저장하면, 사용자는 "저장" 버튼이 따로 있다고 기대한다.
- "토스트"라고 부른 것이 어떤 팀에서는 자동으로 사라지는 알림, 다른 팀에서는 동작 버튼이 달린 스낵바다.
- "시트", "팝오버", "모달"이 같은 말인지 다른 말인지 디자이너와 개발자의 뜻이 다르다.

이 노트는 공식 문서(WAI-ARIA APG, MDN, Apple HIG, Material Components 문서)가 각 컴포넌트를 어떻게 정의하는지 모아 구분 기준을 정리한다. 각 컴포넌트의 구현 세부는 이미 있는 노트로 보낸다.

## 핵심 용어

| 한국어 | 영어 | 정의(출처 서술을 필자 말로 정리) |
| --- | --- | --- |
| 스위치 | switch | 켜짐/꺼짐 두 값만 갖는 컨트롤. APG role `switch`, `aria-checked` |
| 체크박스 | checkbox | 선택/해제. 부분 선택(`mixed`)을 가질 수 있다 |
| 라디오 | radio (group) | 묶음 안에서 최대 하나만 선택 |
| 세그먼티드 컨트롤 | segmented control / segmented button | 가까운 선택지를 한 덩어리로 묶은 컨트롤 |
| 토스트·스낵바 | toast / snackbar | 방금 일어난 일을 잠깐 알리는 메시지 |
| 배너 | banner | 화면 위쪽에 머무르는 메시지(이 노트 출처 중 Material 쪽 규격은 못 읽음) |
| 모달 대화상자 | modal dialog | 뒤 화면을 막고 응답을 받는 창 |
| 알럿 대화상자 | alert dialog | 중요한 메시지로 끊고 응답을 받는 모달. APG role `alertdialog` |
| 시트 | sheet | 부모 화면 위에 올라오는 보조 화면(모달·비모달 모두 있다) |
| 팝오버 | popover | 요소에 붙어 잠깐 뜨는 작은 비모달 영역 |
| 툴팁 | tooltip | 요소 설명을 보여 주는 작은 팝업, 포커스를 받지 않는다 |

## 선택 컨트롤 네 가지

아래 그림은 네 컨트롤을 나란히 그린 것이다. 이름은 그림 밑 글자와 같다: 스위치(켜짐), 체크박스, 라디오 버튼, 세그먼티드 컨트롤.

<figure class="fig" role="group" aria-label="선택 컨트롤 네 가지. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스위치(켜짐)"><rect x="35" y="30" width="50" height="22" rx="11" class="f-fill-blue"/><circle cx="74" cy="41" r="8" class="f-knob"/><text x="60" y="66" class="f-muted" text-anchor="middle" font-size="7">켜짐</text></svg><span>스위치(켜짐)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="체크박스"><rect x="46" y="26" width="28" height="28" rx="5" class="f-fill-blue"/><path d="M52 40 l6 6 l11 -13" class="f-tick"/><text x="60" y="68" class="f-muted" text-anchor="middle" font-size="7">선택</text></svg><span>체크박스</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="라디오 버튼"><circle cx="24" cy="20" r="7" class="f-ring"/><text x="38" y="23" class="f-text" text-anchor="start" font-size="7">옵션 A</text><circle cx="24" cy="40" r="7" class="f-ring-blue"/><circle cx="24" cy="40" r="3.5" class="f-fill-blue"/><text x="38" y="43" class="f-text" text-anchor="start" font-size="7">옵션 B</text><circle cx="24" cy="60" r="7" class="f-ring"/><text x="38" y="63" class="f-text" text-anchor="start" font-size="7">옵션 C</text></svg><span>라디오 버튼</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="세그먼티드 컨트롤"><rect x="18" y="28" width="84" height="24" rx="12" class="f-seg"/><rect x="48" y="30" width="24" height="20" rx="10" class="f-fill-blue"/><text x="32" y="43" class="f-text" text-anchor="middle" font-size="7">일간</text><text x="60" y="43" class="f-on" text-anchor="middle" font-size="7">주간</text><text x="88" y="43" class="f-text" text-anchor="middle" font-size="7">월간</text></svg><span>세그먼티드 컨트롤</span></div></div><figcaption>선택 컨트롤 네 가지. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

구분 축은 두 가지다. (1) 선택지가 몇 개이고 몇 개를 고르는가, (2) 바꾸자마자 적용되는가.

| 컨트롤 | 값 | 공식 근거 |
| --- | --- | --- |
| 스위치 | 단일 설정의 켬/끔 | APG: 두 값만 가능. Material 문서: 효과가 저장 없이 즉시 시작되어야 한다 |
| 체크박스 | 항목 하나의 선택/해제, 또는 목록에서 여러 개 | APG: 이중 상태·삼중 상태(`aria-checked="mixed"`). Material 문서: 목록에서 하나 이상을 고르거나 항목을 켜고 끈다 |
| 라디오 | 여러 선택지 중 정확히 하나 | APG: 묶음에서 하나만 체크. HIG: 보통 2~5개 |
| 세그먼티드 | 가까운 선택지 중 하나(macOS HIG는 여러 개도) | HIG: iPhone 기준 약 5개 이하 권장 |

### 즉시 적용 vs 제출 시 적용

- **스위치는 즉시 적용**이 Material 문서의 서술이다. HIG 의 toggles 페이지는 켜짐/꺼짐 같은 상반된 두 값의 상태를 다룬다고 설명하지만, "즉시 적용"이라는 문구를 이 노트에서 확인하지는 못했다.
- APG 스위치 페이지는 상태 변경이 즉시 적용되는지 별도 확인 단계가 필요한지 **말하지 않는다**. 즉시/제출 구분을 APG 의 요구라고 쓰면 안 된다.
- 필자 정리: 폼 제출 전에 여러 값을 모아 한 번에 보낼 때는 체크박스·라디오, 눌렀을 때 바로 효과가 나는 설정은 스위치로 나누면 사용자 기대와 맞는다. 이는 출처 원문이 아니라 위 두 서술을 합친 설계 지침이다.

### 헷갈리는 쌍

- **스위치 vs 체크박스.** APG 는 둘이 같은 일을 할 수 있다고 하면서 시각 디자인과 낭독기 문장("조명 스위치 켜짐" 대 "조명 체크박스 선택됨")에 맞춰 고르라고 한다. 체크 목록 항목에는 체크박스가 어울린다고 예시한다. HIG 의 macOS 지침은 이미 쓰는 체크박스를 스위치로 바꾸지 말라고 하고, 설정 묶음을 강조할 때 스위치를 권한다. iOS 에서는 스위치를 목록 행 안에서만 쓰고, 목록 밖에서는 토글처럼 동작하는 버튼을 쓰라고 한다.
- **체크박스 vs 라디오.** 여러 개를 고르면 체크박스, 정확히 하나면 라디오. HIG 는 켜고 끄는 단일 설정에는 라디오 하나보다 체크박스를 권한다.
- **라디오 vs 세그먼티드.** 둘 다 단일 선택이 가능하다. HIG 는 세그먼티드 컨트롤을 객체·상태·뷰에 영향을 주는 가까운 선택, 또는 관련 하위 뷰 전환에 쓰고, 완전히 다른 섹션 이동에는 탭 바를 쓰라고 한다. 탭 구현은 [탭과 아코디언](/develop-wiki/knowledge/ui-ux/tabs-and-accordion/)을 본다.
- **토글 버튼.** APG 의 토글 버튼은 `button` 에 `aria-pressed` 를 쓰는 별개 패턴이다. HIG 의 "toggle" 은 스위치·체크박스 스타일을 포함하는 더 넓은 말이다. 용어가 겹치니 문서에서 어느 쪽 뜻인지 밝힌다. 토글 버튼 쪽은 [좋아요·저장·공유·별점 UI](/develop-wiki/knowledge/ui-ux/like-bookmark-share-rating-ui/)에서 다룬다.

### 접근성 이름 규칙

APG 는 스위치·토글 버튼의 이름을 상태가 바뀌어도 그대로 두라고 한다. 상태만 `aria-checked` 가 바꾼다. 네이티브 `<input type="checkbox">` 나 `<button>` 으로 되는 것은 ARIA 를 덧붙이지 않는다([시맨틱 HTML 먼저](/develop-wiki/knowledge/ui-ux/semantic-html-first-aria/)).

## 일시 피드백 계열

아래 그림은 토스트, 스낵바(동작 1개), 배너를 같은 순서로 그렸다.

<figure class="fig" role="group" aria-label="일시 피드백 계열. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="토스트"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="20" y="54" width="80" height="14" rx="7" class="f-dark"/><text x="60" y="63.5" class="f-on" text-anchor="middle" font-size="6.5">저장했어요</text></svg><span>토스트</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="스낵바(동작 1개)"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="14" y="54" width="92" height="16" rx="3" class="f-dark"/><text x="20" y="64" class="f-on" text-anchor="start" font-size="6.5">삭제했어요</text><text x="100" y="64" class="f-blue-on-dark" text-anchor="end" font-size="6.5">실행 취소</text></svg><span>스낵바(동작 1개)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="배너"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="8" y="4" width="104" height="16" rx="5" class="f-fill-amber"/><text x="16" y="14.5" class="f-text" text-anchor="start" font-size="6.5">점검 안내</text><line x1="20" y1="34" x2="100" y2="34" class="f-line"/><line x1="20" y1="46" x2="100" y2="46" class="f-line"/><line x1="20" y1="58" x2="80" y2="58" class="f-line"/></svg><span>배너</span></div></div><figcaption>일시 피드백 계열. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

| 이름 | 공식 서술 | 사라지는 방식 |
| --- | --- | --- |
| 스낵바 | Material 문서: 앱이 수행했거나 수행할 처리를 짧게 알린다. 화면 아래쪽에 잠깐 나타나고 사용자 입력이 필요 없다. "실행 취소"·"재시도" 같은 동작을 줄 수 있다 | 시간 초과, 다른 곳 조작, 밀어서 치우기. 지속 시간 상수로 짧게·길게·무기한이 있다 |
| 토스트 | 이 허브의 [토스트·알림 배너](/develop-wiki/knowledge/ui-ux/toast-notification-banner/) 노트가 다룬다. Android 공식 문서에서는 작업 결과를 작은 팝업으로 알리고 시간 초과로 사라지는 컴포넌트(`Toast`)이고, 같은 문서가 동작이 필요하면 스낵바를 쓰라고 안내한다. 웹·iOS 용어 기준은 읽은 규격에 없다 | 구현마다 다르다 |
| 배너 | GOV.UK 등 서비스·페이지 단위 공지(토스트 노트 참조) | GOV.UK 는 닫기 기능 없이 페이지 이동 시 제거(닫기 허용 여부는 연구 중이라고 함) |

- **토스트와 스낵바의 경계는 용어 문제다.** Material 은 "snackbar" 라는 이름과 동작 한 개를 규정한다. Android 문서(developer.android.com/guide/topics/ui/notifiers/toasts)는 동작이 필요하면 토스트 대신 스낵바를 쓰라고 한다. 웹 쪽에서는 같은 모양을 toast 라고 부르는 경우가 많으므로 팀 용어집에 기준을 적어 두면 된다(웹·iOS 기준은 팀이 정한다).
- 낭독기에 알리려면 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)이 필요하다. MDN 은 `role="status"` 를 중요도가 낮은 안내용 live region 으로 설명한다(암묵적 `aria-live="polite"`).
- 사라지는 메시지에 실패를 싣지 않는다. "실행 취소" 설계는 [확인 vs 실행 취소](/develop-wiki/knowledge/ui-ux/confirmation-vs-undo/).

## 오버레이 계열

아래 그림은 모달 대화상자, 바텀 시트, 툴팁이다. 팝오버는 그림에 없고 아래 표에만 있다.

<figure class="fig" role="group" aria-label="오버레이 계열. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="모달 대화상자"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="0" y="0" width="120" height="80" rx="5" class="f-scrim"/><rect x="22" y="18" width="76" height="44" rx="4" class="f-card"/><text x="60" y="32" class="f-text" text-anchor="middle" font-size="7.5">삭제할까요?</text><line x1="32" y1="38" x2="88" y2="38" class="f-line"/><rect x="30" y="46" width="28" height="11" rx="3" class="f-btn"/><text x="44" y="54" class="f-text" text-anchor="middle" font-size="6.5">취소</text><rect x="62" y="46" width="28" height="11" rx="3" class="f-fill-blue"/><text x="76" y="54" class="f-on" text-anchor="middle" font-size="6.5">삭제</text></svg><span>모달 대화상자</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="바텀 시트(모달)"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="0" y="0" width="120" height="80" rx="5" class="f-scrim"/><rect x="8" y="36" width="104" height="40" rx="6" class="f-card"/><rect x="50" y="40" width="20" height="3" rx="1.5" class="f-fill-gray"/><line x1="18" y1="54" x2="100" y2="54" class="f-line"/><line x1="18" y1="64" x2="80" y2="64" class="f-line"/></svg><span>바텀 시트(모달)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="툴팁"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="30" y="16" width="60" height="14" rx="3" class="f-dark"/><path d="M56 30 l4 5 l4 -5 z" class="f-dark"/><rect x="44" y="36" width="32" height="14" rx="7" class="f-fill-blue"/><text x="60" y="46" class="f-on" text-anchor="middle" font-size="6.5">버튼</text><text x="60" y="25.5" class="f-on" text-anchor="middle" font-size="6.5">설명</text></svg><span>툴팁</span></div></div><figcaption>오버레이 계열. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

| 이름 | 모달 여부 | 공식 서술 |
| --- | --- | --- |
| 모달 대화상자 | 모달 | MDN: `showModal()` 로 열면 바깥이 inert 가 되고 Esc 로 닫힌다. [모달 다이얼로그](/develop-wiki/knowledge/ui-ux/modal-dialog/) 노트 참조 |
| 알럿 대화상자 | 모달 | APG: 중요한 메시지로 사용자를 끊고 응답을 받는다. role `alertdialog`, 제목은 `aria-labelledby`, 메시지는 `aria-describedby` |
| 바텀 시트(표준) | 비모달 | Material 문서: 주 영역과 함께 보이고 동시에 조작할 수 있다. 스크림 없음 |
| 바텀 시트(모달) | 모달 | Material 문서: 스크림 위에서 선택지를 보여 주며 나머지 화면 조작을 막는다. 모바일에서 인라인 메뉴·단순 대화상자의 대안 |
| 시트(HIG) | 모달 또는 비모달 | HIG: iOS·iPadOS 에서는 둘 다 가능. 모달 시트는 부모 뷰 조작을 막는다 |
| 팝오버 | 비모달 | MDN Popover API: 항상 비모달. HIG: 소량의 정보·기능을 잠깐 보여 주고 경고에는 쓰지 않는다 |
| 툴팁 | 비모달 | APG: 포커스·호버 시 나타나고 Esc 로 닫힌다. 포커스를 받지 않는다(포커스 가능한 요소가 든 호버는 비모달 다이얼로그로 만든다). 이 패턴은 APG 에서 작업 중으로 표시되어 있다 |

### 용어 충돌

- **sheet.** Material 의 "bottom sheet" 는 아래쪽에 붙은 표면이고, HIG 의 "sheet" 는 방향과 무관한 부모 위의 보조 뷰다. HIG 는 iOS 에서 시트가 크기 구간(detent)에 머물 수 있다고 하며, 공유 시트(activity view)는 시트나 팝오버로 나타날 수 있다고 한다.
- **dialog.** HTML `<dialog>` 는 모달(`showModal()`)과 비모달(`show()`)을 모두 만든다. "다이얼로그 = 모달"이라는 가정은 HTML 에서는 틀린다. Material 의 dialog 는 Basic·Full-screen 두 종류다.
- **popover.** HIG 의 popover 는 화살표가 요소를 가리키는 뷰, HTML 의 `popover` 속성은 최상위 레이어에 띄우는 비모달 요소다. 같은 이름이지만 규격이 다르다. HIG 는 compact 화면에서는 시트 같은 전체 화면 모달로 바꾸라고 한다.
- **alert.** HIG 의 alert 는 제목·선택 설명·버튼 최대 3개의 모달이고, ARIA 의 `role="alert"` 는 즉시 읽어 주는 live region 이다. 같은 철자, 다른 개념이다.

### 고르는 흐름

1. 응답이 필수이고 뒤 화면을 막아야 하는가: 모달·알럿 대화상자. HIG 는 알럿을 정보 전달만을 위해 쓰지 말고, 되돌릴 수 있는 흔한 동작에는 쓰지 말라고 한다.
2. 방금 한 일을 알리면 되는가: 스낵바·토스트.
3. 페이지 단위 상태인가: 배너.
4. 요소 옆에서 짧은 설명이면 툴팁, 작은 기능이나 정보면 팝오버.
5. 작은 화면에서 선택지·작은 과업이면 시트.

## 언제 쓰나

- 팀 디자인 시스템의 컴포넌트 이름을 정할 때, 위 표로 이름·모달 여부·사라지는 방식을 문서화한다.
- 플랫폼이 다른 앱(웹·Android·iOS)에서 같은 기능을 부를 이름을 맞출 때.

## 주의

- 이 표는 서로 다른 출처의 서술을 모은 것이다. 출처끼리 완전히 같은 기준이 아니다. 특히 즉시/제출 구분, "동작 있으면 스낵바" 같은 기준은 필자 정리다.
- 그림은 개념을 구분하기 위해 직접 그린 도식이다. 실제 제품 화면이 아니고, 그림에만 있는 정보는 없다.
- Material 쪽은 규격 사이트(m3.material.io)가 스크립트로 그려져 직접 읽지 못해, 같은 구성요소의 공식 Android 문서(저장소의 docs/components)를 읽었다. 그 문서는 Material 3 개요 페이지를 링크하며 같은 용어를 쓴다.
- 그 문서에는 세그먼티드 버튼이 M3 Expressive 에서 폐기되는 중이고 connected button group 으로 대체한다는 문구가 있다. 새 프로젝트의 이름 선택에 반영한다.

## 검증 범위

- 읽음: APG switch·checkbox·radio·alertdialog·tooltip, MDN dialog·Popover API·status role, HIG toggles(스위치·체크박스·라디오 포함)·segmented controls·alerts·popovers·sheets·activity views, Material Components Android 문서의 Switch·Checkbox·RadioButton·Snackbar·BottomSheet·Dialog·ToggleButtonGroup.
- 못 읽음: m3.material.io 규격 본문(스크립트 렌더링), Material 의 Banner·Tooltip 문서(Android 저장소에서는 미완성 안내만 있음), APG dialog-modal 직접 열람(기존 [모달](/develop-wiki/knowledge/ui-ux/modal-dialog/) 노트에 의존), HIG 의 Toggles 페이지 외 별도 Checkboxes 페이지(없음; toggles 안에 포함).
- 미확인: Material 스낵바의 구체 지속 시간(ms), HIG 의 스위치 즉시 적용 문구, 브라우저별 Popover·`closedby` 지원 현황.
