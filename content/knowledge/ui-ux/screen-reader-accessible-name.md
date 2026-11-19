---
title: 스크린 리더 동작과 접근 가능한 이름
aka: [Screen Reader, Accessible Name, Accessible Name Computation, accname, Accessibility Tree, aria-label, aria-labelledby, aria-describedby, 대체 텍스트]
category: ui-ux
group: accessibility
level: intermediate
summary: 화면 낭독기가 접근성 트리에서 요소의 이름·역할·상태를 읽는 방식과, 이름이 어떤 우선순위(aria-labelledby → aria-label → 네이티브 라벨 → 내용)로 계산되는지 정리한다.
tags: [accessibility, a11y, screen-reader, aria, accname, alt-text]
related: [ui-ux/semantic-html-first-aria, ui-ux/live-regions-announcements, ui-ux/keyboard-focus-management, ui-ux/wcag-22-overview, mobile-dev/mobile-accessibility-basics]
sources:
  - https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/
  - https://www.w3.org/TR/accname-1.2/
  - https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
  - https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html
  - https://www.w3.org/WAI/tutorials/images/decision-tree/
updatedAt: 2026-11-19
---

## 문제

- 낭독기 사용자는 화면을 보지 않고 **"이름, 역할, 상태"** 로 요소를 이해한다. 예: "장바구니, 버튼, 3개 항목". 아이콘 버튼에 이름이 없으면 "버튼"만 들린다.
- 낭독기는 DOM 을 직접 읽지 않는다. 브라우저가 DOM·CSS·ARIA 로 만든 **접근성 트리**를 플랫폼 API(Windows UIA, macOS/iOS AX, Android 접근성)를 통해 읽는다. CSS 로 숨긴 요소, `aria-hidden` 요소는 트리에서 빠진다.

## 해법

### 1. 낭독기 사용 방식 이해하기

- **훑기 모드(브라우즈/가상 커서)**: 제목(H), 랜드마크, 링크 목록, 표 단위로 건너뛴다. → 제목 구조와 랜드마크가 곧 목차다.
- **포커스 모드**: 폼·위젯 안에서 키 입력을 페이지에 그대로 넘긴다.
- 모바일 낭독기(VoiceOver, TalkBack)는 스와이프로 요소를 하나씩 이동하고 로터·메뉴로 제목 단위 이동을 한다. → [모바일 접근성 기본](/develop-wiki/knowledge/mobile-dev/mobile-accessibility-basics/)

### 2. 접근 가능한 이름 계산 우선순위 (APG 요약)

1. `aria-labelledby` — 다른 요소의 텍스트를 참조. 모든 것보다 우선.
2. `aria-label` — 화면에 안 보이는 문자열.
3. 네이티브 라벨 — `<label>`, `alt`, `<legend>`, `<caption>`, `<figcaption>`.
4. 내용 — button, link, heading, tab, option, cell 등 "내용으로 이름 짓기"가 허용된 역할.
5. 대체 수단 — `title`, 일부 입력의 `placeholder`. 신뢰할 수 없으니 의존하지 않는다.

```html
<button><svg aria-hidden="true">…</svg></button>                   <!-- 이름 "" → 실패 -->
<button aria-label="닫기"><svg aria-hidden="true">…</svg></button> <!-- "닫기" -->
<label for="q">검색어</label><input id="q" placeholder="예: 서울">  <!-- "검색어" -->
<input placeholder="이메일">                                       <!-- 라벨 없음: 신뢰 불가 -->
<h2 id="t">배송지</h2><section aria-labelledby="t">…</section>    <!-- region "배송지" -->
<table><caption>주문 목록</caption>…</table>                       <!-- table "주문 목록" -->
<img src="divider.png" alt="">                                     <!-- 장식: 트리에서 무시 -->
```

(`dom-accessibility-api` 의 `computeAccessibleName` 으로 jsdom 에서 위 결과를 확인했다. placeholder 만 있는 입력은 이 구현에서 이름이 비었고, 브라우저마다 다르게 처리될 수 있다.)

### 3. 이름 짓기 규칙

- 생김새가 아니라 **기능**을 쓴다: "X" 아이콘 → "닫기", 돋보기 → "검색".
- 짧게(대개 1~3단어), 구별되는 단어를 앞에: 목록의 "삭제" 버튼이 10개면 "‘보고서.pdf’ 삭제"처럼 대상까지.
- 역할 이름을 넣지 않는다: "닫기 버튼"(×) — 역할은 낭독기가 읽는다.
- **보이는 텍스트를 이름에 포함**한다(WCAG 2.5.3 Label in Name). 버튼에 "파일 지우기"가 보이는데 `aria-label="삭제"` 면 음성 제어 사용자가 "파일 지우기 클릭"으로 누를 수 없다.
- 부가 설명은 이름이 아니라 `aria-describedby` 로: 이름 → 역할 다음에(때로 지연되어) 읽힌다. 입력 형식 안내, 오류 메시지에 쓴다.

### 4. 대체 텍스트(alt)

| 이미지 성격 | alt |
| --- | --- |
| 정보 전달(사진·도표) | 전달하려는 정보를 요약 |
| 기능(링크·버튼 안 아이콘) | 동작: "홈으로" |
| 장식 | `alt=""` (속성 자체는 둔다) |
| 복잡한 차트 | 짧은 alt + 본문·표로 상세 데이터 |

## 언제 쓰나

- 아이콘 전용 버튼, 이미지, 폼 입력, 랜드마크·표·다이얼로그처럼 **이름이 필요한 역할**을 만들 때.
- 같은 문구의 링크·버튼이 반복되는 목록·카드(“자세히 보기” × 20)를 만들 때.

## 체크리스트

- 브라우저 개발자 도구의 Accessibility 패널에서 핵심 요소의 Name/Role 을 확인했다.
- 모든 입력에 보이는 `<label>` 이 있다(placeholder 는 라벨이 아니다).
- 아이콘 버튼 이름이 기능을 말한다.
- 반복되는 링크는 문맥 없이도 구별된다(숨김 텍스트로 대상 보충 가능).
- 실제 낭독기(NVDA·JAWS·VoiceOver·TalkBack 중 주 사용 환경)로 핵심 흐름을 들어 봤다.

## 흔한 실수·주의

- **`aria-label` 을 내용 있는 요소에 덧씌움.** 버튼 안 보이는 텍스트가 낭독에서 사라진다. APG 도 유지보수·번역에 유리하다는 이유로 보이는 텍스트를 이름의 원천으로 쓰라고 권한다.
- **`<div aria-label="…">`.** `generic` 역할은 이름이 금지돼 있어 무시되는 경우가 많다. `paragraph`, `strong` 등도 마찬가지.
- **`title` 속성에 의존.** 터치·키보드 사용자는 볼 수 없고 낭독기 지원도 일관되지 않다.
- **alt 에 "이미지", "사진" 붙이기.** 역할은 이미 읽힌다.
- 낭독기·브라우저 조합마다 결과가 다르다. 자동 검사([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/))는 "이름 없음"은 잡지만 "이름이 적절한가"는 판단하지 못한다.
