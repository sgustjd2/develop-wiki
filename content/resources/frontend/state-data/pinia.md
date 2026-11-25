---
name: Pinia
url: https://pinia.vuejs.org
docs: https://pinia.vuejs.org/introduction.html
repo: https://github.com/vuejs/pinia
stars: 14775
domain: frontend
category: state-data
description: Vue 공식 상태 관리 라이브러리. defineStore로 상태·getter·action을 묶은 스토어를 만들고 Vue DevTools로 추적한다.
pricing: oss
tags: [state-management, vue, store]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Pinia는 Vue 팀이 관리하는 공식 상태 관리 라이브러리로, Vuex의 후속이다. `defineStore`로 상태(state)·계산 값(getters)·변경 함수(actions)를 가진 스토어를 정의하고, 컴포넌트에서 `useXxxStore()`를 호출해 쓴다. mutation 개념이 없고 TypeScript 타입 추론이 자동으로 된다. 이 문서는 **Pinia 4** 기준이다(npm `pinia` `latest` 4.1.0). v4는 ESM 전용이며, 개발 도구 연동용 `@vue/devtools-api`를 함께 설치해야 한다(필수 peer dependency).

- 컴포넌트 밖에서 공유해야 하는 Vue 앱의 클라이언트 상태를 담당한다. 서버 데이터 캐시는 TanStack Query(Vue 어댑터) 같은 도구와 나눠 쓰는 경우가 많다.

## 설치
```bash
npm install pinia @vue/devtools-api
```

```ts
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

createApp(App).use(createPinia()).mount('#app');
```

Nuxt에서는 `@pinia/nuxt` 모듈을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `defineStore(id, ...)` | 고유 id를 가진 스토어 정의. `useXxxStore` 함수를 반환 |
| Option 스토어 | `{ state: () => ({}), getters: {}, actions: {} }` 객체 형태 |
| Setup 스토어 | `() => { const n = ref(0); const double = computed(...); function inc() {}; return {...} }` Composition API 형태 |
| `storeToRefs(store)` | 반응성을 유지한 채 state·getter를 구조 분해 (action은 스토어에서 바로 꺼냄) |
| `$patch` / `$reset` | 여러 값을 한 번에 갱신 / Option 스토어 초기화 |
| `$subscribe` / `$onAction` | 상태 변경·액션 호출 감시 |
| 플러그인 | `pinia.use(plugin)`으로 모든 스토어에 속성·동작 추가 (예: 영속화) |

## 기본 사용법
```ts
// stores/cart.ts — Setup 스토어
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  const items = ref<{ id: string; price: number }[]>([]);
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price, 0));
  function add(id: string, price: number) {
    items.value.push({ id, price });
  }
  return { items, total, add };
});
```

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
const { items, total } = storeToRefs(cart);
</script>

<template>
  <button @click="cart.add('book', 12000)">담기</button>
  <p>{{ items.length }}개 · {{ total }}원</p>
</template>
```

## 자주 쓰는 패턴
- **구조 분해는 `storeToRefs`로.** `const { total } = useCartStore()`처럼 바로 꺼내면 반응성이 끊긴다.
- **스토어끼리 참조.** 한 스토어의 action·getter 안에서 다른 `useUserStore()`를 호출해 쓴다(순환 참조는 피한다).
- **Setup 스토어의 전체 반환.** Setup 스토어는 모든 state를 `return`해야 DevTools·SSR·플러그인이 제대로 인식한다.
- **테스트.** `@pinia/testing`의 `createTestingPinia()`로 action을 스텁 처리하고 초기 상태를 주입한다.

## 언제 쓰나 / 피할 때
- 쓸 때: [Vue](/develop-wiki/frontend/framework/vue/)·Nuxt 앱에서 여러 컴포넌트가 공유하는 상태가 있을 때. Vuex를 쓰는 기존 프로젝트의 이전 대상.
- 피할 때(대안): 한 컴포넌트 트리 안에서만 쓰는 상태는 `provide`/`inject`나 composable로 충분하다. 서버 데이터 캐시는 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)의 Vue 어댑터.

## 공식 문서
- [소개](https://pinia.vuejs.org/introduction.html) · [시작하기](https://pinia.vuejs.org/getting-started.html) · [스토어 정의](https://pinia.vuejs.org/core-concepts/)
- [Vuex에서 이전](https://pinia.vuejs.org/cookbook/migration-vuex.html) · [릴리스](https://github.com/vuejs/pinia/releases)
