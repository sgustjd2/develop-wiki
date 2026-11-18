---
name: Lit
url: https://lit.dev
repo: https://github.com/lit/lit
stars: 21898
docs: https://lit.dev/docs/
domain: frontend
category: framework
description: 표준 Web Components를 적은 코드로 만들게 돕는 라이브러리. 프레임워크에 상관없이 재사용할 디자인 시스템 컴포넌트를 만들 때 쓴다.
pricing: oss
tags: [web-components, custom-elements, ui]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Lit은 브라우저 표준 Web Components(Custom Elements, Shadow DOM)를 만들 때 반복되는 코드를 줄여 주는 작은 라이브러리다. 반응형 속성이 바뀌면 다음 마이크로태스크에 한 번 렌더링하고, `html` 태그드 템플릿 리터럴에서 바뀐 부분만 갱신한다. 이 문서는 **Lit 3** 기준이다(npm `latest` 3.3.3).

- 결과물은 그냥 HTML 커스텀 엘리먼트라서 [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/)·[Angular](/develop-wiki/frontend/framework/angular/)·순수 HTML 어디서든 태그로 쓸 수 있다.
- 앱 전체 프레임워크라기보다는 재사용 컴포넌트·디자인 시스템을 만드는 도구에 가깝다.

## 설치
```bash
npm i lit
```

TypeScript에서 데코레이터를 쓰려면 `tsconfig.json`에 `"experimentalDecorators": true`, `"useDefineForClassFields": false`를 둔다. 표준(TC39) 데코레이터를 쓰는 경우에는 필드에 `accessor` 키워드를 붙인다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `LitElement` | 컴포넌트 기반 클래스 (`lit`에서 import) |
| `html` / `css` | 템플릿·스타일용 태그드 템플릿. 스타일은 `static styles`에 두면 Shadow DOM에 범위가 한정된다 |
| `@customElement('tag-name')` | 클래스를 커스텀 엘리먼트로 등록 (`lit/decorators.js`) |
| `@property()` | 공개 반응형 속성. `type`, `attribute`, `reflect` 옵션으로 HTML 속성과 동기화 |
| `@state()` | 내부 상태. 속성(attribute)은 만들지 않고 렌더링만 다시 일으킴 |
| `static properties` | 데코레이터 없이 JS에서 속성을 선언하는 방법 |
| 업데이트 주기 | 속성 변경 → `willUpdate` → `render` → `firstUpdated`(최초 1회) → `updated` |
| 이벤트 | 템플릿에서 `@click=${this.handler}`, 바깥으로는 `this.dispatchEvent(new CustomEvent(...))` |
| 바인딩 접두사 | `.prop=${}`(프로퍼티), `?attr=${}`(불리언 속성), `@event=${}`(리스너) |
| 디렉티브 | `classMap`, `styleMap`, `repeat`, `ifDefined` 등 (`lit/directives/*.js`) |

## 기본 사용법
```ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-counter')
export class MyCounter extends LitElement {
  static styles = css`button { font: inherit; }`;

  @property({ type: Number }) step = 1;
  @state() private count = 0;

  render() {
    return html`<button @click=${() => (this.count += this.step)}>${this.count}</button>`;
  }
}
```

HTML에서 사용:

```html
<script type="module" src="./my-counter.js"></script>
<my-counter step="5"></my-counter>
```

## 자주 쓰는 패턴
- **바깥에 알리기는 CustomEvent.** `this.dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }))`로 Shadow DOM 경계를 넘겨 보낸다.
- **자식 콘텐츠는 `<slot>`.** 템플릿에 `<slot></slot>`, `<slot name="footer"></slot>`을 두어 사용하는 쪽이 마크업을 넣게 한다.
- **테마는 CSS 사용자 정의 속성.** Shadow DOM 안 스타일에서 `var(--my-color, blue)`를 쓰면 바깥에서 값을 덮어쓸 수 있다.
- **목록은 `repeat` 디렉티브.** 키가 있는 목록은 ``repeat(items, (i) => i.id, (i) => html`<li>${i.name}</li>`)``로 항목과 DOM을 키로 연결해 재정렬 시에도 재사용한다.
- **파생 값 계산은 `willUpdate`.** 렌더 직전에 여러 속성에서 계산한 값을 필드에 저장하면 `render`가 단순해진다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 프레임워크를 쓰는 조직에서 공용 디자인 시스템·위젯을 만들 때, 빌드 체인 없이 표준 HTML 태그로 배포하고 싶을 때.
- 피할 때(대안): 라우팅·데이터 로딩까지 갖춘 앱 전체를 만들 때는 [React](/develop-wiki/frontend/framework/react/)·[Angular](/develop-wiki/frontend/framework/angular/) 같은 앱 프레임워크, 서버 렌더링 HTML에 동작만 얹을 때는 [Alpine.js](/develop-wiki/frontend/framework/alpinejs/). SSR이 중요하면 Shadow DOM 서버 렌더링 지원 범위를 먼저 확인한다.

## 공식 문서
- [문서 홈](https://lit.dev/docs/) · [시작하기](https://lit.dev/docs/getting-started/) · [반응형 속성](https://lit.dev/docs/components/properties/) · [생명주기](https://lit.dev/docs/components/lifecycle/) · [내장 디렉티브](https://lit.dev/docs/templates/directives/)
