---
name: Angular
url: https://angular.dev
repo: https://github.com/angular/angular
docs: https://angular.dev/overview
domain: frontend
category: framework
description: 라우터·폼·HTTP·DI·CLI를 한데 묶은 Google의 웹 프레임워크. 시그널 기반 반응성을 쓰며, 규칙이 정해진 대규모 팀 프로젝트에 쓴다.
pricing: oss
tags: [ui, signals, di, full-featured]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Angular는 컴포넌트, 라우터, 폼, HTTP 클라이언트, 의존성 주입(DI), 테스트·빌드 CLI를 한 저장소에서 함께 버전 관리하는 TypeScript 웹 프레임워크다. 선택지를 줄이고 프로젝트 구조를 통일하는 쪽에 무게를 둔다. 이 문서는 **Angular v22** 기준이다(npm `@angular/core` `latest` 22.2.6).

- 최근 버전의 기본값: 컴포넌트는 standalone(v19부터), 변경 감지는 Zone.js 없는 zoneless(v21부터), 상태는 시그널, 템플릿 흐름 제어는 `@if`/`@for` 블록.
- 라이브러리를 골라 조합하는 쪽의 대안은 [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/).

## 설치
Node.js v22.22.3 이상이 필요하다.

```bash
npm install -g @angular/cli
ng new my-app
cd my-app && npm start        # http://localhost:4200
```

자주 쓰는 CLI: `ng generate component <name>`, `ng build`, `ng test`, `ng update`(버전 업그레이드).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 컴포넌트 | `@Component({ selector, template, styles, imports })`를 붙인 클래스. 기본이 standalone |
| `imports` | 템플릿에서 쓸 다른 컴포넌트·디렉티브·파이프를 컴포넌트에 직접 선언 |
| `signal` / `computed` / `effect` | `@angular/core`의 반응형 원시 타입. 읽을 때 `count()`처럼 호출 |
| `linkedSignal` / `resource` | 다른 시그널에 따라 재설정되는 쓰기 가능 시그널 / 비동기 데이터를 시그널로 노출 |
| `input()` / `input.required()` | 시그널 기반 입력. `@Input()` 데코레이터도 계속 지원 |
| `output()` / `model()` | 이벤트 출력 / 양방향 바인딩용 입력 (`[(value)]`) |
| 흐름 제어 블록 | `@if`·`@else`, `@for (x of xs; track x.id)`·`@empty`, `@switch`·`@case`, `@defer` |
| DI | `inject(Service)`로 서비스 주입, `@Injectable({ providedIn: 'root' })`로 전역 등록 |
| zoneless | v21부터 기본. `provideZoneChangeDetection()`을 넣으면 Zone 기반으로 되돌아간다 |
| 라우터 | `provideRouter(routes)`와 `<router-outlet>`, `loadComponent`로 지연 로딩 |

## 기본 사용법
시그널과 흐름 제어 블록을 쓰는 standalone 컴포넌트.

```ts
import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-todo-list',
  template: `
    <h2>{{ title() }} ({{ remaining() }}개 남음)</h2>
    @for (todo of todos(); track todo.id) {
      <label><input type="checkbox" [checked]="todo.done" (change)="toggle(todo.id)" /> {{ todo.text }}</label>
    } @empty { <p>할 일이 없습니다.</p> }
  `,
})
export class TodoList {
  title = input('할 일');
  todos = signal([{ id: 1, text: '문서 읽기', done: false }]);
  remaining = computed(() => this.todos().filter((t) => !t.done).length);
  toggle(id: number) {
    this.todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
}
```

## 자주 쓰는 패턴
- **서비스 + `inject()`.** 데이터 접근은 `@Injectable({ providedIn: 'root' })` 서비스에 두고 컴포넌트에서 `private api = inject(ApiService)`로 받는다.
- **시그널 상태는 불변 갱신.** 배열·객체는 `update()`에서 새 값을 반환해야 변경이 감지된다.
- **`@defer`로 지연 로딩.** 무거운 컴포넌트를 `@defer (on viewport) { <chart /> } @placeholder { … }`로 감싸 별도 청크로 분리한다.
- **양방향 바인딩 컴포넌트.** 자식에서 `value = model(0)`을 선언하면 부모는 `[(value)]="volume"`으로 묶고, Angular가 `valueChange` 출력을 자동 생성한다.
- **업그레이드는 `ng update`.** 메이저 버전 사이 자동 마이그레이션 스키매틱이 함께 실행된다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 팀이 같은 규칙으로 오래 유지보수할 대규모 업무용 앱, 라우터·폼·HTTP·테스트를 공식 도구 한 벌로 맞추고 싶을 때, TypeScript와 DI 구조에 익숙한 팀.
- 피할 때(대안): 작은 위젯·콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/)·[Preact](/develop-wiki/frontend/framework/preact/), 서버 렌더링 페이지에 상호작용만 더할 때는 [htmx](/develop-wiki/frontend/framework/htmx/), 가벼운 학습 곡선이 우선이면 [Vue](/develop-wiki/frontend/framework/vue/)·[Svelte](/develop-wiki/frontend/framework/svelte/).

## 공식 문서
- [개요](https://angular.dev/overview) · [설치](https://angular.dev/installation) · [컴포넌트](https://angular.dev/guide/components) · [시그널](https://angular.dev/guide/signals)
- [흐름 제어](https://angular.dev/guide/templates/control-flow) · [입력](https://angular.dev/guide/components/inputs) · [zoneless](https://angular.dev/guide/zoneless) · [업데이트 가이드](https://angular.dev/update-guide)
