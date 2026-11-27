---
name: Vue
url: https://vuejs.org
repo: https://github.com/vuejs/core
stars: 55177
docs: https://vuejs.org/guide/introduction.html
domain: frontend
category: framework
description: 템플릿과 반응형 상태를 중심으로 한 점진적 UI 프레임워크. 기존 페이지에 일부만 붙이거나 SPA 전체를 만들 때 쓴다.
pricing: oss
tags: [ui, component, reactivity, sfc]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Vue는 HTML 기반 템플릿과 반응형 상태를 묶어 컴포넌트를 만드는 UI 프레임워크다. CDN 스크립트 하나로 기존 페이지 일부에 붙일 수도 있고, 빌드 도구와 단일 파일 컴포넌트(SFC, `.vue`)로 SPA·SSR 앱 전체를 만들 수도 있어 "점진적"이라고 부른다. 이 문서는 **Vue 3.5** 기준이다(npm `latest` 3.5.45, 3.6은 RC 단계).

- 라우터(Vue Router), 상태 관리(Pinia), 테스트(Vitest)는 공식 프로젝트로 따로 있다.
- 템플릿 대신 JSX 중심의 대안은 [React](/develop-wiki/frontend/framework/react/), 컴파일러 중심 대안은 [Svelte](/develop-wiki/frontend/framework/svelte/).

## 설치
공식 스캐폴딩 `create-vue`(TypeScript, Router, Pinia, Vitest, E2E, ESLint 선택). Node `^22.18.0 || >=24.12.0` 필요.

```bash
npm create vue@latest
cd <project> && npm install && npm run dev
```

빌드 없이 쓰기(SFC는 사용 불가):

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| SFC | `<script setup>` + `<template>` + `<style scoped>`를 한 `.vue` 파일에 |
| `<script setup>` | 최상위 변수·함수·import가 템플릿에서 바로 쓰이는 권장 문법 |
| `ref()` | 권장 상태 API. 스크립트에선 `.value`, 템플릿 최상위에선 자동 언래핑 |
| `reactive()` | 객체 자체를 프록시로. 원시값 불가, 구조 분해·통째 교체 시 반응성 상실 |
| `computed()` | 의존성이 바뀔 때만 다시 계산되는 캐시된 파생 값 |
| `watch` / `watchEffect` | 상태 변화에 반응해 부수 효과 실행 |
| 디렉티브 | `v-if`, `v-for`, `v-bind`(`:`), `v-on`(`@`), `v-model` |
| `defineProps` / `defineEmits` / `defineModel` | `<script setup>` 안의 컴파일러 매크로. import 불필요 |
| 슬롯 | 부모가 자식 컴포넌트 안에 마크업을 끼워 넣는 방법 |
| `nextTick()` | 상태 변경 후 DOM 갱신이 끝날 때까지 기다림 |

## 기본 사용법
`Counter.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ step?: number }>()
const count = ref(0)
const double = computed(() => count.value * 2)

function increment() {
  count.value += props.step ?? 1
}
</script>

<template>
  <button @click="increment">{{ count }} (두 배 {{ double }})</button>
</template>
```

앱 마운트:

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

## 자주 쓰는 패턴
- **목록 렌더링은 `:key`와 함께.** `<li v-for="item in items" :key="item.id">`처럼 안정적인 키를 준다.
- **양방향 바인딩 컴포넌트.** 자식에서 `const model = defineModel<string>()`을 선언하면 부모가 `v-model="name"`으로 바로 묶을 수 있다.
- **로직 재사용은 컴포저블로.** `useXxx()` 함수 안에서 `ref`·`computed`·`watch`를 조합해 반환하고 여러 컴포넌트에서 import 한다.
- **비동기 감시.** 검색어 같은 입력이 바뀔 때 요청을 보내려면 `watch(query, async (q) => { ... })`를 쓰고, 즉시 한 번 실행하려면 `{ immediate: true }`.
- **전역 상태는 Pinia.** 여러 페이지에서 공유하는 상태는 Pinia store로 분리한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 템플릿 문법이 익숙한 팀, 서버 렌더링 페이지에 일부만 붙이다가 점차 SPA로 키우는 경우, 공식 라우터·상태 관리가 한 세트로 필요할 때(SSR이 필요하면 Nuxt).
- 피할 때(대안): 정적 문서·블로그는 [Astro](/develop-wiki/frontend/meta-framework/astro/), 페이지에 작은 상호작용만 필요하면 [Alpine.js](/develop-wiki/frontend/framework/alpinejs/), 프레임워크 무관 컴포넌트 라이브러리는 [Lit](/develop-wiki/frontend/framework/lit/).

## 공식 문서
- [소개](https://vuejs.org/guide/introduction.html) · [빠른 시작](https://vuejs.org/guide/quick-start.html) · [반응성 기초](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) · [API 레퍼런스](https://vuejs.org/api/)
- 한국어 문서: [ko.vuejs.org](https://ko.vuejs.org)
