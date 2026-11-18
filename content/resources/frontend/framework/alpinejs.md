---
name: Alpine.js
url: https://alpinejs.dev
repo: https://github.com/alpinejs/alpine
docs: https://alpinejs.dev/start-here
domain: frontend
category: framework
description: HTML 속성에 상태와 동작을 직접 적는 경량 반응형 라이브러리. 서버 렌더링 페이지에 드롭다운·모달 같은 작은 인터랙션을 붙일 때 쓴다.
pricing: oss
tags: [html, reactivity, lightweight, server-rendered]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Alpine.js는 HTML 마크업에 `x-data`로 상태를 선언하고 `x-on`, `x-show`, `x-model` 같은 속성으로 동작을 붙이는 작은 반응형 라이브러리다. 빌드 단계 없이 `<script>` 한 줄로 시작하고, 이미 서버가 렌더링한 HTML 위에서 동작한다. 이 문서는 **Alpine.js 3** 기준이다(npm `latest` 3.17.5).

- 서버 요청 없는 화면 안 상호작용(토글, 탭, 모달, 폼 상태)에 맞는다. 서버와 HTML 조각을 주고받는 일은 [htmx](/develop-wiki/frontend/framework/htmx/)와 역할이 겹치지 않아 함께 쓰기 좋다.
- [Laravel](/develop-wiki/backend/web-framework/laravel/) 생태계(Livewire)에서도 클라이언트 쪽 동작을 맡는다.

## 설치
CDN(`defer` 필수, `<head>`에 둔다. 운영에서는 `3.x.x` 대신 정확한 버전으로 고정):

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

npm 모듈로:

```bash
npm install alpinejs
```

```js
import Alpine from 'alpinejs';
window.Alpine = Alpine; // 선택: 개발자 도구에서 접근용
Alpine.start();         // 페이지당 한 번만 호출
```

플러그인·`Alpine.data` 등록은 `import`와 `Alpine.start()` 사이에 한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `x-data` | 요소와 그 하위의 상태 객체 선언. 다른 디렉티브가 동작하는 범위 |
| `x-on:click` / `@click` | 이벤트 리스너. `.prevent`, `.outside`, `.window`, `.debounce` 같은 수식어 |
| `x-bind:attr` / `:attr` | 속성 바인딩. `:class`는 객체 문법 지원 |
| `x-model` | 입력값과 상태 양방향 바인딩 |
| `x-show` / `x-if` | CSS로 숨기기 / DOM에서 추가·제거 (`x-if`는 `<template>`에) |
| `x-for` | 반복 렌더링. 반드시 `<template>`에 쓰고 루트 요소는 하나만. 재정렬이 있으면 `:key` 지정 (`<template x-for="item in items" :key="item.id">`) |
| `x-text` / `x-html` | 텍스트 / HTML 내용 설정 |
| `x-init` / `x-effect` | 초기화 시 실행 / 의존 상태가 바뀔 때마다 재실행 |
| `x-transition` | 표시·숨김 전환 애니메이션 |
| `x-cloak` | 초기화 전 깜빡임 방지 (`[x-cloak]{display:none}` CSS와 함께) |
| `x-ref` / `$refs` | 요소 참조 |
| 매직 | `$el`, `$watch`, `$dispatch`, `$nextTick`, `$store` |
| `Alpine.data` / `Alpine.store` | 재사용 컴포넌트 등록 / 전역 상태 저장소 |

## 기본 사용법
바깥을 클릭하면 닫히는 드롭다운.

```html
<div x-data="{ open: false }">
  <button @click="open = !open" :aria-expanded="open">메뉴</button>
  <ul x-show="open" x-transition @click.outside="open = false">
    <li><a href="/profile">프로필</a></li>
    <li><a href="/logout">로그아웃</a></li>
  </ul>
</div>
```

입력 필터와 목록 반복.

```html
<div x-data="{ q: '', items: ['React', 'Vue', 'Svelte'] }">
  <input x-model="q" placeholder="검색">
  <ul>
    <template x-for="item in items.filter(i => i.toLowerCase().includes(q.toLowerCase()))" :key="item">
      <li x-text="item"></li>
    </template>
  </ul>
</div>
```

## 자주 쓰는 패턴
- **로직이 길어지면 `Alpine.data`로 분리.** `document.addEventListener('alpine:init', () => { Alpine.data('dropdown', () => ({ open: false, toggle() { this.open = !this.open } })) })` 후 `x-data="dropdown"`.
- **`init()` / `destroy()`.** `Alpine.data` 객체에 두면 초기화·정리 시 자동 호출되어 타이머·구독 해제에 쓴다.
- **컴포넌트 간 통신.** `$dispatch('saved', { id })`로 커스텀 이벤트를 올리고 다른 곳에서 `@saved.window="..."`로 받는다.
- **전역 상태.** `Alpine.store('cart', { count: 0 })` 후 마크업에서 `$store.cart.count`.
- **htmx와 함께.** htmx가 교체해 넣은 HTML의 `x-data`도 Alpine이 자동으로 초기화하므로, 서버 조각 안에 작은 상호작용을 그대로 넣을 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서버 렌더링 페이지(Rails, Django, Laravel, 정적 사이트)에 드롭다운·탭·모달 같은 작은 동작을 붙일 때, 빌드 도구 없이 바로 쓰고 싶을 때.
- 피할 때(대안): 상태가 많은 단일 페이지 앱이나 복잡한 컴포넌트 트리는 [Vue](/develop-wiki/frontend/framework/vue/)·[React](/develop-wiki/frontend/framework/react/). 엄격한 CSP 환경에서는 식을 문자열로 평가하는 기본 빌드 대신 공식 CSP 빌드를 검토한다.

## 공식 문서
- [시작하기](https://alpinejs.dev/start-here) · [설치](https://alpinejs.dev/essentials/installation) · [`Alpine.data`](https://alpinejs.dev/globals/alpine-data) · [CSP 빌드](https://alpinejs.dev/advanced/csp)
