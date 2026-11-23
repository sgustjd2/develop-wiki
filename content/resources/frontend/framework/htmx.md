---
name: htmx
url: https://htmx.org
repo: https://github.com/bigskysoftware/htmx
stars: 49653
docs: https://htmx.org/docs/
domain: frontend
category: framework
description: HTML 속성만으로 AJAX 요청과 부분 화면 교체를 하는 라이브러리. 서버 렌더링 앱에 SPA 없이 상호작용을 더할 때 쓴다.
pricing: oss
tags: [hypermedia, html, ajax, server-rendered]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
htmx는 HTML 속성(`hx-get`, `hx-target` 등)만으로 어떤 요소든 HTTP 요청을 보내고, 서버가 돌려준 **HTML 조각**으로 페이지 일부를 교체하게 해 주는 라이브러리다. 상태와 렌더링을 서버에 두고 JSON API·클라이언트 렌더링 없이 상호작용을 만드는 하이퍼미디어 방식이다. 이 문서는 **htmx 2.x** 기준이다(npm `htmx.org` `latest` 2.0.11). htmx 4.0은 정식 출시됐지만 2.x 사용자가 실수로 올라가지 않도록 npm `latest`가 아닌 `next` 태그(4.0.2)로만 배포되며, htmx.org 문서는 2.x 기준이다.

- 서버는 어떤 언어든 HTML만 응답하면 된다. [Django](/develop-wiki/backend/web-framework/django/), [Laravel](/develop-wiki/backend/web-framework/laravel/), [FastAPI](/develop-wiki/backend/web-framework/fastapi/), [Express](/develop-wiki/backend/web-framework/express/) 등과 조합한다.
- 클라이언트 쪽 작은 상태(드롭다운 열림 등)는 [Alpine.js](/develop-wiki/frontend/framework/alpinejs/)와 함께 쓰는 경우가 많다.

## 설치
CDN(운영에서는 버전 고정과 `integrity` 속성 사용 권장):

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.11/dist/htmx.min.js"></script>
```

npm + 번들러:

```bash
npm install htmx.org@2.0.11
```

```js
import 'htmx.org';
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `hx-get` / `hx-post` / `hx-put` / `hx-patch` / `hx-delete` | 해당 메서드로 URL에 요청 |
| `hx-trigger` | 요청 시점. 기본은 요소 종류에 따름(버튼 `click`, 폼 `submit`, 입력 `change`) |
| 트리거 수식어 | `changed`, `delay:500ms`, `throttle:1s`, `once`, `from:<selector>` |
| 특수 트리거 | `load`, `revealed`(스크롤로 보일 때), `intersect`, `every 2s`(폴링) |
| `hx-target` | 응답을 넣을 요소. CSS 선택자 또는 `this`, `closest tr`, `next`, `find` 같은 확장 선택자 |
| `hx-swap` | 교체 방식: `innerHTML`(기본), `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none` |
| `hx-select` / `hx-swap-oob` | 응답 일부만 골라 넣기 / 응답 안 다른 요소를 id 기준으로 함께 교체 |
| `hx-indicator` | 요청 중 `htmx-request` 클래스를 붙일 로딩 표시 요소 |
| `hx-boost` | 일반 링크·폼을 AJAX로 바꿔 body만 교체 |
| `hx-push-url` | 요청 URL을 브라우저 히스토리에 기록 |
| `hx-vals` / `hx-include` / `hx-confirm` | 추가 값 전송 / 다른 입력 포함 / 요청 전 확인 창 |
| 헤더 | 요청에 `HX-Request: true`. 응답 헤더 `HX-Trigger`, `HX-Redirect` 등으로 클라이언트 동작 지시 |
| 이벤트 | `htmx:beforeRequest`, `htmx:afterSwap` 등으로 JS에서 흐름에 끼어들기 |

## 기본 사용법
검색창 입력이 멈추면 결과 목록을 서버에서 받아 교체한다.

```html
<input type="search" name="q"
       hx-get="/search"
       hx-trigger="input changed delay:300ms, search"
       hx-target="#results"
       hx-indicator="#spinner">
<span id="spinner" class="htmx-indicator">검색 중…</span>
<ul id="results"></ul>
```

서버 `/search`는 `<li>` 목록 HTML만 돌려주면 된다. 행 삭제 예:

```html
<tr id="row-7">
  <td>항목 7</td>
  <td><button hx-delete="/items/7" hx-target="closest tr" hx-swap="outerHTML"
              hx-confirm="삭제할까요?">삭제</button></td>
</tr>
```

서버가 빈 본문(200)을 돌려주면 해당 행이 사라진다.

## 자주 쓰는 패턴
- **같은 뷰가 전체 페이지와 조각을 함께 처리.** 요청 헤더 `HX-Request`가 있으면 조각 템플릿만, 없으면 레이아웃 포함 전체 페이지를 렌더링한다.
- **여러 곳 동시 갱신.** 응답에 `<div id="cart-count" hx-swap-oob="true">3</div>`를 덧붙이면 대상 외의 요소도 함께 바뀐다.
- **무한 스크롤.** 마지막 행에 `hx-get="/page/2" hx-trigger="revealed" hx-swap="afterend"`를 둔다.
- **사이트 전체 점진적 향상.** `<body hx-boost="true">`로 기존 링크·폼을 그대로 둔 채 페이지 전환을 AJAX로 바꾼다.
- **오류 응답 처리.** 기본 설정에서 4xx·5xx 응답은 교체하지 않고 오류 이벤트로 처리하므로, 검증 오류 폼을 보여 주려면 `htmx:beforeSwap` 이벤트나 `responseHandling` 설정을 조정한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서버 템플릿(Django, Rails, Laravel, Go 템플릿 등)으로 만든 CRUD·관리 화면에 SPA 없이 상호작용을 더할 때, 프론트엔드 빌드 체인을 두고 싶지 않을 때.
- 피할 때(대안): 오프라인 동작, 드래그 편집기처럼 클라이언트 상태가 큰 앱은 [React](/develop-wiki/frontend/framework/react/)·[Svelte](/develop-wiki/frontend/framework/svelte/) 같은 컴포넌트 프레임워크. 서버 요청 없이 화면 안에서만 바뀌는 동작은 [Alpine.js](/develop-wiki/frontend/framework/alpinejs/).

## 공식 문서
- [문서](https://htmx.org/docs/) · [속성 레퍼런스](https://htmx.org/reference/) · [예제 모음](https://htmx.org/examples/)
