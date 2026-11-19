---
title: 라이브 영역과 동적 알림
aka: [ARIA Live Region, aria-live, role=status, role=alert, Status Messages, WCAG 4.1.3, 스크린 리더 알림]
category: ui-ux
group: accessibility
level: intermediate
summary: 포커스를 옮기지 않고 화면 일부의 변화(검색 결과 수, 저장 완료, 오류 개수)를 낭독기에 알리는 ARIA 라이브 영역의 종류·사용법·함정.
tags: [accessibility, a11y, aria, live-region, screen-reader, wcag]
related: [ui-ux/screen-reader-accessible-name, ui-ux/toast-notification-banner, ui-ux/loading-states, ui-ux/form-inline-validation, ui-ux/search-filter-sort]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
  - https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
  - https://www.w3.org/TR/wai-aria-1.2/#aria-live
updatedAt: 2026-11-19
---

## 문제

- 화면 낭독기는 **포커스가 있는 곳**을 읽는다. 필터를 바꿔 결과가 갱신되거나, 장바구니에 담겼다는 문구가 구석에 뜨면 시각 사용자는 보지만 낭독기 사용자는 모른다.
- 매번 포커스를 그 문구로 옮기면 작업 흐름이 끊긴다.

WCAG **4.1.3 Status Messages (AA)**: 맥락 변경 없이 나타나는 상태 메시지(작업 결과, 대기 상태, 진행률, 오류 존재)는 역할·속성으로 판별 가능해서, 포커스를 받지 않아도 보조 기술이 전달할 수 있어야 한다.

## 해법

### 1. 종류

| 마크업 | 긴급도 | 쓰임 |
| --- | --- | --- |
| `role="status"` | polite(암묵) | 결과 수, "저장됨", 진행 상태 |
| `role="alert"` | assertive(암묵) | 시간에 민감한 중요 경고, 오류 발생 |
| `role="log"` | polite | 채팅·로그처럼 순서대로 쌓이는 내용 |
| `role="timer"`, `marquee` | off | 바뀌어도 자동으로 읽지 않음 |
| `aria-live="polite"` | 사용자가 쉴 때 읽음 | 일반 기본값 |
| `aria-live="assertive"` | 지금 읽던 것을 끊고 읽음 | 아껴 쓴다 |

보조 속성:

- `aria-atomic="true"`: 바뀐 부분만이 아니라 영역 전체를 다시 읽는다(예: "17:34" 가 "34" 로만 읽히는 것 방지). `role="status"` 는 기본이 true.
- `aria-relevant`: 추가·삭제·텍스트 중 무엇을 알릴지. 기본은 `additions text`.

### 2. 핵심 규칙: 영역을 먼저 두고 내용을 나중에 바꾼다

라이브 영역은 **변경 전에 접근성 트리에 등록돼 있어야** 한다. 내용과 영역을 동시에 삽입하면 읽히지 않는 조합이 많다. 초기 HTML 에 빈 영역을 두는 방법이 가장 안정적이다.

```html
<!-- 페이지 로드 시 이미 존재. 시각적으로 숨겨도 됨 -->
<div id="sr-status" role="status" class="visually-hidden"></div>
```

```ts
// 같은 문장을 연속으로 알릴 때도 다시 읽히도록 비운 뒤 다음 작업에서 채운다
export function announce(message: string, region = document.getElementById('sr-status')!) {
  region.textContent = '';
  setTimeout(() => { region.textContent = message; }, 100);
}

// 사용: 필터 적용 후
announce(`검색 결과 ${count}건`);
```

(jsdom 에서 비우기 → 100ms 후 문구 설정 동작을 확인했다. 비운 뒤 채우는 방식과 지연 시간은 흔히 쓰는 실무 기법이며, 낭독기·브라우저 조합에 따라 결과가 다를 수 있어 실제 환경에서 들어 봐야 한다.)

### 3. 무엇을 라이브 영역으로, 무엇을 포커스 이동으로

| 상황 | 방법 |
| --- | --- |
| 검색·필터 결과 수, "3개 선택됨" | `role="status"` |
| 저장 완료 토스트 | `role="status"` → [토스트](/develop-wiki/knowledge/ui-ux/toast-notification-banner/) |
| 제출 시 폼 오류 여러 개 | 오류 요약으로 **포커스 이동** → [폼 검증](/develop-wiki/knowledge/ui-ux/form-inline-validation/) |
| 필드 이탈 후 인라인 오류 | `aria-describedby` 로 연결(포커스 돌아오면 읽힘) + 필요하면 polite 알림 |
| 세션 만료 임박 | `role="alertdialog"`(포커스 이동, 응답 필요) |
| 로딩 시작·끝 | 영역에 `aria-busy`, 끝나면 status 로 "불러옴" → [로딩 상태](/develop-wiki/knowledge/ui-ux/loading-states/) |

## 언제 쓰나

- 사용자가 일으킨 동작의 결과가 포커스 위치와 떨어진 곳에 나타날 때.
- 비동기 작업(업로드·저장·검색)의 진행·완료·실패를 알릴 때.

## 체크리스트

- 앱 셸에 status 영역 하나, 정말 필요할 때만 alert 영역 하나를 둔다(전역 알림 서비스로 감싸기).
- 알림 문구는 화면 없이도 이해되게 쓴다("완료"가 아니라 "파일 3개 업로드 완료").
- 연속 이벤트(입력마다 결과 수 변경)는 디바운스해 마지막 결과만 알린다.
- NVDA+Firefox/Chrome, VoiceOver+Safari 등 주 사용 조합에서 들어 봤다.

## 흔한 실수·주의

- **모든 것에 `role="alert"`/`assertive`.** 읽던 내용을 끊어 짜증을 유발한다. WCAG 도 중요·시간 민감하지 않은 내용에 쓰는 것을 실패 사례로 든다.
- **라이브 영역 안에 링크·버튼.** 알림은 대개 평문으로만 읽히고, 사용자가 그 버튼까지 찾아가기 어렵다. 행동이 필요하면 포커스 가능한 곳에 따로 둔다.
- **영역을 매번 새로 생성.** 생성과 동시에 채우면 무시될 수 있다.
- **`display: none` 으로 숨긴 영역.** 트리에서 빠져 읽히지 않는다. 시각적 숨김 클래스(clip 방식)를 쓴다.
- iOS VoiceOver 에서 `role="alert"` 에 `aria-live="assertive"` 를 중복으로 달면 두 번 읽힐 수 있다(MDN).
