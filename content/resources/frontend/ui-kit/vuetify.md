---
name: Vuetify
url: https://vuetifyjs.com
docs: https://vuetifyjs.com/en/getting-started/installation/
repo: https://github.com/vuetifyjs/vuetify
domain: frontend
category: ui-kit
description: Material Design 기반의 Vue 3 컴포넌트 프레임워크. 레이아웃·폼·데이터 테이블까지 갖춘 컴포넌트로 Vue 관리 화면과 업무 앱을 만들 때 쓴다.
pricing: oss
tags: [vue, material-design, components, theming]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Vuetify는 [Vue](/develop-wiki/frontend/framework/vue/) 3용 UI 컴포넌트 프레임워크로, `v-app`·`v-navigation-drawer` 같은 레이아웃부터 폼 입력, `v-data-table`, 날짜 선택기까지 Material Design 스타일 컴포넌트를 제공한다. 테마·기본 props(defaults)·아이콘 세트를 `createVuetify` 하나로 설정한다. 이 문서는 **v4** 기준이다(npm `vuetify` `latest` 4.3.4, 4.0.0은 2026-02 배포). 라이선스는 MIT.

- v4는 Vue 3.5 이상을 요구한다.
- Vue 생태계의 다른 선택지와 달리 디자인이 갖춰진 완성형이다. 같은 Material 계열은 React의 [MUI](/develop-wiki/frontend/ui-kit/mui/), Angular의 [Angular Material](/develop-wiki/frontend/ui-kit/angular-material/).

## 설치
새 프로젝트는 스캐폴딩 도구로 만든다(Vite 기반, TypeScript 선택 가능).

```bash
npm create vuetify@latest
```

기존 Vite 프로젝트에 추가:

```bash
npm i vuetify
npm i -D vite-plugin-vuetify      # 사용한 컴포넌트만 자동 import, SASS 변수 설정
npm i @mdi/font @fontsource/roboto # 아이콘 폰트, 기본 폰트(Roboto)는 직접 넣어야 함
```

Nuxt에서는 `vuetify`와 `vite-plugin-vuetify`를 설치해 Nuxt의 Vite 설정에 플러그인으로 등록한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `createVuetify` | 컴포넌트·디렉티브·테마·아이콘·defaults·display(breakpoints)를 담은 Vue 플러그인 생성 |
| `v-app` / 레이아웃 | `v-app-bar`, `v-navigation-drawer`, `v-main`이 서로의 크기를 계산해 배치 |
| 테마 | `theme.themes`에 색 정의, `defaultTheme`(v4 기본값 `system` = OS 설정 따름) |
| defaults | `defaults: { VBtn: { variant: 'tonal' } }`로 컴포넌트 기본 props 전역 지정, `v-defaults-provider`로 범위 지정 |
| 그리드 | `v-container` > `v-row` > `v-col`. v4는 CSS `gap` 기반(`gap` prop, `density="compact"`) |
| CSS 레이어 | v4는 모든 스타일이 `@layer vuetify-core`, `vuetify-components` 등에 들어가 레이어 없는 앱 CSS가 항상 우선 |
| 유틸리티 클래스 | `pa-4`, `d-flex`, `justify-center`, `text-h5` 같은 간격·플렉스·타이포 클래스 |

## 기본 사용법
`src/main.ts`:

```ts
import { createApp } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import App from './App.vue';

const vuetify = createVuetify({ components, directives, theme: { defaultTheme: 'light' } });
createApp(App).use(vuetify).mount('#app');
```

`App.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
const email = ref('');
const rules = [(v: string) => /.+@.+/.test(v) || '이메일 형식이 아닙니다'];
</script>

<template>
  <v-app>
    <v-main class="pa-6">
      <v-text-field v-model="email" label="이메일" :rules="rules" />
      <v-btn color="primary" prepend-icon="mdi-send">보내기</v-btn>
    </v-main>
  </v-app>
</template>
```

모든 컴포넌트를 등록하는 위 방식은 번들이 커진다. 실무에서는 `vite-plugin-vuetify`의 자동 import를 쓴다.

## 자주 쓰는 패턴
- **폼 검증.** `v-form`으로 감싸고 각 입력의 `rules`(값 → `true` 또는 오류 메시지) 배열로 검증한다.
- **서버 페이지네이션 테이블.** `v-data-table-server`에 `items-length`와 `@update:options`를 연결해 정렬·페이지 변경 시 API를 호출한다.
- **반응형 분기.** `useDisplay()`의 `mobile`, `mdAndUp` 등으로 화면 크기별 레이아웃을 바꾼다.
- **v3 → v4 업그레이드.** breakpoint가 작아졌고(md 960→840px 등), 전역 CSS 리셋 대부분이 제거됐으며, 타이포그래피가 MD3로 바뀌었다. `v-row`의 `dense`·`align`·`justify` prop은 `density`/유틸리티 클래스로 대체됐다. 공식 `vuetify-codemods`와 호환 CSS 스니펫으로 단계적으로 옮길 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vue 3로 관리자 화면·사내 업무 앱을 빠르게 만들 때, 데이터 테이블·날짜 선택기 같은 무거운 컴포넌트가 바로 필요할 때.
- 피할 때(대안): Material 스타일이 아닌 고유 디자인이 필요하면 헤드리스 라이브러리 + [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) 조합이 더 맞다. React·Angular 프로젝트에는 쓸 수 없다.

## 공식 문서
- [설치](https://vuetifyjs.com/en/getting-started/installation/) · [테마](https://vuetifyjs.com/en/features/theme/) · [v4 업그레이드 가이드](https://vuetifyjs.com/en/getting-started/upgrade-guide/)
- [컴포넌트 API](https://vuetifyjs.com/en/api/v-btn/) · [GitHub 릴리스](https://github.com/vuetifyjs/vuetify/releases)
