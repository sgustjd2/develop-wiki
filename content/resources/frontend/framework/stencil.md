---
name: Stencil
url: https://stenciljs.com
docs: https://stenciljs.com/docs/introduction
repo: https://github.com/stenciljs/core
stars: 13154
domain: frontend
category: framework
description: 데코레이터와 JSX로 작성한 컴포넌트를 표준 Web Components로 컴파일하는 도구. 여러 프레임워크에서 공통으로 쓸 디자인 시스템 컴포넌트를 만들 때 쓴다.
pricing: oss
tags: [web-components, compiler, design-system, jsx, custom-elements]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Stencil은 TypeScript 클래스 + 데코레이터(`@Component`, `@Prop`, `@State`) + JSX로 컴포넌트를 쓰면, 이를 프레임워크 없이 동작하는 **표준 Custom Element**로 컴파일하는 도구다. 런타임 라이브러리가 아니라 컴파일러에 가깝고, 지연 로딩 번들·타입 정의·문서·React/Angular/Vue용 래퍼까지 출력 대상(output target)으로 만들어 준다. Ionic 팀이 만들었고 Ionic Framework 컴포넌트가 Stencil로 작성돼 있다. 이 문서는 **v4** 기준이다(npm `@stencil/core` `latest` 4.45.4). **v5가 RC 단계**(5.0.0-rc.x)다.

- 같은 Web Components 계열인 [Lit](/develop-wiki/frontend/framework/lit/)이 작은 런타임 베이스 클래스라면, Stencil은 빌드 도구·출력 대상·테스트 러너를 포함한 툴체인이다.
- 저장소는 `ionic-team/stencil`에서 `stenciljs/core`로 옮겨졌다(이전 주소는 리다이렉트).

## 설치
```bash
npm init stencil        # component 스타터 선택
npm start               # 개발 서버
npm run build           # 프로덕션 빌드
npm test                # 단위·E2E 테스트
```

기존 프로젝트 업데이트: `npm install @stencil/core@latest --save-exact`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@Component({ tag, styleUrl, shadow })` | 커스텀 엘리먼트 정의. 태그 이름에는 하이픈 필수, `shadow: true`면 Shadow DOM |
| `@Prop()` | 외부에서 받는 속성. 바뀌면 다시 렌더링 |
| `@State()` | 내부 상태. 바뀌면 다시 렌더링 |
| `@Event()` / `EventEmitter` | 커스텀 DOM 이벤트 발행 |
| `@Watch('prop')` | 특정 prop·state 변경 감지 |
| `@Element()` | 호스트 엘리먼트 참조 |
| 라이프사이클 | `componentWillLoad`, `componentDidLoad`, `disconnectedCallback` 등 |
| 출력 대상 | `dist`(지연 로드 번들), `dist-custom-elements`(트리 셰이킹용 개별 정의), `www`(앱), 프레임워크 래퍼 |

## 기본 사용법
```tsx
// src/components/my-counter/my-counter.tsx
import { Component, Prop, State, Event, EventEmitter, h } from '@stencil/core';

@Component({ tag: 'my-counter', styleUrl: 'my-counter.css', shadow: true })
export class MyCounter {
  @Prop() label = '카운트';
  @State() count = 0;
  @Event() countChanged: EventEmitter<number>;

  private inc = () => {
    this.count++;
    this.countChanged.emit(this.count);
  };

  render() {
    return <button onClick={this.inc}>{this.label}: {this.count}</button>;
  }
}
```

HTML에서 사용:

```html
<my-counter label="클릭"></my-counter>
<script>
  document.querySelector('my-counter')
    .addEventListener('countChanged', (e) => console.log(e.detail));
</script>
```

## 자주 쓰는 패턴
- **디자인 시스템 배포:** `stencil.config.ts`의 `outputTargets`에 `dist`와 `dist-custom-elements`를 함께 두고, React·Angular·Vue 래퍼 output target으로 각 프레임워크용 패키지를 같이 만든다.
- **`h` import 유지:** JSX 팩토리로 쓰이므로 코드에서 안 보여도 `import { h } from '@stencil/core'`가 필요하다.
- **객체·배열 prop은 불변 갱신:** 내부 변경은 감지되지 않으므로 새 배열·객체를 할당한다.
- **테스트:** `newSpecPage`(단위)와 E2E 테스트 유틸이 내장돼 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 사내 여러 팀이 서로 다른 프레임워크를 쓰는데 같은 UI 컴포넌트를 공유해야 할 때, 프레임워크에 묶이지 않는 디자인 시스템.
- 피할 때(대안): 단일 프레임워크 앱의 UI만 만들면 그 프레임워크의 컴포넌트가 단순하다. 가벼운 Web Component 몇 개면 [Lit](/develop-wiki/frontend/framework/lit/). v5 출시가 임박했으니 새 프로젝트는 마이그레이션 문서를 먼저 확인한다.

## 공식 문서
- [소개](https://stenciljs.com/docs/introduction) · [시작하기](https://stenciljs.com/docs/getting-started) · [컴포넌트 API](https://stenciljs.com/docs/api) · [출력 대상](https://stenciljs.com/docs/output-targets)
- [GitHub 릴리스](https://github.com/stenciljs/core/releases)
