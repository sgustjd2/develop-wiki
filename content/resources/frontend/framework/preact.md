---
name: Preact
url: https://preactjs.com
repo: https://github.com/preactjs/preact
docs: https://preactjs.com/guide/v11/getting-started
domain: frontend
category: framework
description: React와 거의 같은 API를 가진 수 KB 크기의 UI 라이브러리. 번들 크기가 중요한 위젯·임베드나 React 대체로 쓴다.
pricing: oss
tags: [ui, jsx, lightweight, virtual-dom]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Preact는 React와 같은 컴포넌트·Hooks 모델을 훨씬 작은 런타임으로 구현한 UI 라이브러리다. 실제 DOM 이벤트·속성을 그대로 쓰는 쪽에 가깝고, React 생태계 라이브러리는 `preact/compat` 별칭으로 연결한다. 이 문서는 **Preact 11** 기준이다(npm `latest` 11.2.0).

- 11부터 ESM 전용 배포가 되었고, ref가 기본으로 전달되어 `forwardRef`가 필요 없다.
- 반응형 상태는 별도 패키지 `@preact/signals`로 세밀하게 갱신할 수 있다.
- 같은 API의 원본은 [React](/develop-wiki/frontend/framework/react/), 시그널 중심의 다른 선택지는 [Solid](/develop-wiki/frontend/framework/solid/).

## 설치
Vite 기반 프로젝트 생성(TypeScript, 라우팅 `preact-iso`, ESLint 선택 가능):

```bash
npm init preact
cd my-preact-app && npm run dev
```

빌드 없이 브라우저에서 바로 쓰려면 ESM CDN에서 import 한다.

```js
import { h, render } from 'https://esm.sh/preact';
```

시그널을 쓰려면 `npm install @preact/signals`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `h` / JSX | 가상 노드 생성 함수. JSX는 `h` 호출로 컴파일된다 |
| `render(vnode, parent)` | `preact`에서 import. 11에서 세 번째 `replaceNode` 인자는 제거 |
| Hooks | `preact/hooks`에서 import (`useState`, `useEffect`, `useRef` …) |
| `preact/compat` | React API 호환 계층. `react`·`react-dom`을 이 경로로 별칭 지정 |
| Signals | `signal`, `computed`, `effect`, `batch`, 컴포넌트 안에서는 `useSignal`, `useComputed` |
| ref 전달 | 11부터 함수 컴포넌트에 넘긴 `ref`가 기본으로 전달됨 |
| 스타일 `px` | 숫자 스타일 값의 `px` 자동 부착은 11부터 `preact/compat`에서만 |
| `useRef` | 11부터 초기값이 필수 |

## 기본 사용법
Hooks를 쓰는 카운터.

```tsx
import { render } from 'preact';
import { useState } from 'preact/hooks';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

render(<Counter />, document.getElementById('app')!);
```

시그널을 JSX에 그대로 넘기면 컴포넌트를 다시 실행하지 않고 텍스트만 갱신된다.

```tsx
import { signal, computed } from '@preact/signals';

const count = signal(0);
const double = computed(() => count.value * 2);

export function Counter() {
  return (
    <p>
      {count} × 2 = {double}
      <button onClick={() => count.value++}>+1</button>
    </p>
  );
}
```

## 자주 쓰는 패턴
- **React 라이브러리 재사용.** Vite는 `@preact/preset-vite`가 `react`→`preact/compat` 별칭을 자동 처리한다. 다른 번들러는 `resolve.alias`에 `react`, `react-dom`, `react/jsx-runtime`(→`preact/jsx-runtime`)을 지정한다.
- **전역 상태는 시그널로.** 모듈 최상위 `signal()`을 여러 컴포넌트가 import 해서 공유하면 Context 없이도 상태를 나눌 수 있다.
- **위젯·임베드.** 다른 사이트에 끼워 넣는 작은 위젯은 런타임 크기가 작은 Preact로 만들고 `render`로 특정 노드에 붙인다.
- **10 → 11 이전.** `forwardRef` 제거, `useRef(null)` 초기값 지정, 숫자 스타일 단위 명시, 언마운트 시 `useEffect` cleanup이 페인트 이후로 늦춰진 점(테스트 영향)을 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 번들 크기가 중요한 위젯·랜딩 페이지·임베드, React 경험을 그대로 살리면서 가볍게 가고 싶을 때, [Astro](/develop-wiki/frontend/meta-framework/astro/) 아일랜드처럼 작은 상호작용 조각.
- 피할 때(대안): React 전용 기능과 프레임워크(Next.js 등)를 호환 계층 없이 그대로 써야 하면 [React](/develop-wiki/frontend/framework/react/). 서버 렌더링 HTML에 동작만 얹을 거라면 [Alpine.js](/develop-wiki/frontend/framework/alpinejs/)·[htmx](/develop-wiki/frontend/framework/htmx/).

## 공식 문서
- [시작하기 (v11)](https://preactjs.com/guide/v11/getting-started) · [Signals](https://preactjs.com/guide/v11/signals) · [10 → 11 업그레이드 가이드](https://preactjs.com/guide/v11/upgrade-guide)
