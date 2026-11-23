---
name: Ember.js
url: https://emberjs.com
docs: https://guides.emberjs.com/release/
repo: https://github.com/emberjs/ember.js
stars: 22570
domain: frontend
category: framework
description: 라우터·데이터 계층·CLI·테스트 규약을 한데 묶은 "설정보다 관례" 방식의 SPA 프레임워크. 오래 유지보수할 대규모 앱을 일관된 구조로 만들 때 쓴다.
pricing: oss
tags: [spa, convention-over-configuration, glimmer, router, vite]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ember는 라우팅, 컴포넌트(Glimmer), 서비스, 데이터 계층(EmberData), 빌드 CLI, 테스트 도구를 공식 패키지로 함께 제공하는 프레임워크다. 파일 위치와 이름 규칙이 정해져 있어 프로젝트 간 구조가 거의 같고, 6주 주기 릴리스와 LTS, 사용 중단(deprecation) 경고 → 메이저에서 제거하는 업그레이드 정책이 특징이다. 이 문서는 **v7** 기준이다(npm `ember-source` `latest` 7.4.1, `lts` 6.12.1).

- 최신 블루프린트는 **Vite** 기반 빌드와 `<template>` 태그를 쓰는 `.gjs`/`.gts` 단일 파일 컴포넌트를 기본으로 한다. 예전 `.hbs` 분리 템플릿 문서도 남아 있다.
- 같은 "올인원" 성격의 대안은 [Angular](/develop-wiki/frontend/framework/angular/), 라이브러리 조합형은 [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/).

## 설치
```bash
npm install -g ember-cli
ember new my-app --lang en --strict
cd my-app
npm start            # http://localhost:4200
```

`npm run build`는 `vite build`를 실행한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Router (`app/router.js`) | `Router.map`에서 `this.route('post', { path: '/post/:post_id' })`로 URL 정의 |
| Route (`app/routes/*.js`) | `model()` 훅에서 데이터를 준비. 템플릿에서는 `@model`로 읽음 |
| 템플릿 (`app/templates/*.gjs`) | 라우트 화면. `{{outlet}}`에 하위 라우트가 렌더 |
| Component (`.gjs`/`.gts`) | `@glimmer/component` 클래스 + `<template>` 태그 |
| `@tracked` | 값이 바뀌면 그 값을 쓰는 템플릿을 갱신하는 반응형 필드 |
| `{{on "click" ...}}` / `(fn ...)` | 이벤트 모디파이어 / 인자 부분 적용 헬퍼 |
| Service | 앱 전역 싱글턴(세션, 장바구니 등). `@service`로 주입 |
| EmberData | 모델·어댑터·직렬화로 API 데이터를 캐시하는 공식 데이터 계층 |

## 기본 사용법
컴포넌트(`app/components/counter.gjs`).

```js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class Counter extends Component {
  @tracked count = 0;

  increment = () => {
    this.count++;
  };

  <template>
    <p>{{@label}}: {{this.count}}</p>
    <button type="button" {{on "click" this.increment}}>+1</button>
  </template>
}
```

라우트와 템플릿.

```js
// app/routes/posts.js
import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  async model() {
    const res = await fetch('/api/posts');
    return res.json();
  }
}
```

```js
// app/templates/posts.gjs
import Counter from '../components/counter';

<template>
  <ul>{{#each @model as |post|}}<li>{{post.title}}</li>{{/each}}</ul>
  <Counter @label="좋아요" />
</template>
```

## 자주 쓰는 패턴
- **전역 상태는 서비스로:** `app/services/cart.js`에 `Service`를 상속해 만들고 컴포넌트에서 `@service cart;`로 주입한다.
- **화살표 함수 필드로 액션 정의:** `this` 바인딩이 고정돼 `{{on "click" this.x}}`에 바로 넘길 수 있다(`@action` 데코레이터 대신).
- **업그레이드:** deprecation 경고를 먼저 없앤 뒤 LTS 버전 단위로 올린다. 메이저 버전은 그 전 버전에서 경고로 예고된 API만 제거한다.
- **테스트:** 블루프린트에 포함된 QUnit 기반 단위·렌더링·애플리케이션 테스트를 `ember generate`가 함께 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 해 유지보수할 대규모 SPA, 구성 선택보다 팀 간 일관된 구조가 중요할 때, 기존 Ember 앱 유지·현대화.
- 피할 때(대안): 생태계 규모와 채용이 우선이면 [React](/develop-wiki/frontend/framework/react/), SSR·SEO 중심 사이트는 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/)·[Nuxt](/develop-wiki/frontend/meta-framework/nuxt/) 같은 메타 프레임워크.

## 공식 문서
- [가이드](https://guides.emberjs.com/release/) · [빠른 시작](https://guides.emberjs.com/release/getting-started/quick-start/) · [컴포넌트 상태와 액션](https://guides.emberjs.com/release/components/component-state-and-actions/) · [라우트 모델](https://guides.emberjs.com/release/routing/specifying-a-routes-model/) · [서비스](https://guides.emberjs.com/release/services/)
- [API 레퍼런스](https://api.emberjs.com) · [릴리스 블로그](https://blog.emberjs.com)
