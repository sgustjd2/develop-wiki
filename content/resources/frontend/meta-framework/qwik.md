---
name: Qwik
url: https://qwik.dev
docs: https://qwik.dev/docs/
repo: https://github.com/QwikDev/qwik
stars: 22073
domain: frontend
category: meta-framework
description: 하이드레이션 대신 서버에서 직렬화한 상태를 이어받아(resumability) 필요한 코드만 지연 로드하는 프레임워크와 라우터(Qwik City). 초기 JS를 최소화해야 하는 사이트에 쓴다.
pricing: oss
tags: [resumability, ssr, lazy-loading, jsx, vite]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Qwik은 서버 렌더링 결과에 애플리케이션 상태와 이벤트 리스너 위치를 직렬화해 두고, 브라우저에서는 사용자가 실제로 상호작용한 부분의 코드만 내려받아 실행하는 **resumability** 방식의 JSX 프레임워크다. 컴포넌트 전체를 다시 실행하는 하이드레이션 단계가 없다. 라우팅·데이터 로딩·폼 액션은 메타 프레임워크인 **Qwik City**(v2에서 Qwik Router로 개명)가 맡는다.

| 계열 | npm 패키지 | 상태 (2026-11-18) |
| --- | --- | --- |
| v1 (이 문서 기준) | `@builder.io/qwik`, `@builder.io/qwik-city` | `latest` 1.20.4 |
| v2 | `@qwik.dev/core`, `@qwik.dev/router` | **RC** 2.0.0-rc.5, 문서는 next.qwik.dev |

- `$` 접미사(`component$`, `onClick$`, `routeLoader$`)가 붙은 곳이 지연 로드 경계다. 옵티마이저가 그 지점을 별도 청크로 쪼갠다.
- 같은 "JS 적게 보내기" 목표의 대안은 [Astro](/develop-wiki/frontend/meta-framework/astro/)(아일랜드)지만, Qwik은 앱 전체가 하나의 컴포넌트 트리로 동작한다는 점이 다르다.

## 설치
```bash
npm create qwik@latest
npm run dev
```

v2 RC를 써 보려면 `npm create qwik@rc`(npm `create-qwik`의 `rc` 태그)로 만들거나, v1 프로젝트에서 `npx @qwik.dev/core@latest migrate-v2`로 이전한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `component$` | 컴포넌트 정의. 옵티마이저가 지연 로드 가능한 단위로 분리 |
| `useSignal` / `useStore` | 반응형 상태(`.value`) / 중첩 객체 상태 |
| `useComputed$` / `useTask$` | 파생 값 / 상태 변화·서버 실행 작업 |
| `useVisibleTask$` | 브라우저에서 요소가 보일 때만 실행(꼭 필요할 때만) |
| `routeLoader$` | 라우트 렌더 전에 서버에서 실행되는 데이터 로더. `use…` 훅으로 export |
| `routeAction$` + `<Form>` | 폼 제출을 서버 액션으로 처리, JS 없이도 동작 |
| `server$` | 클라이언트에서 호출하는 서버 전용 함수 |
| `src/routes/**/index.tsx` | Qwik City 파일 라우팅. `layout.tsx`로 레이아웃 |

## 기본 사용법
v1 기준 라우트 하나에 로더·액션·상태를 함께 둔 예.

```tsx
// src/routes/todo/index.tsx
import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';

const todos: string[] = [];

export const useTodos = routeLoader$(() => todos);
export const useAddTodo = routeAction$((data) => {
  todos.push(String(data.text));
  return { ok: true };
});

export default component$(() => {
  const list = useTodos();
  const add = useAddTodo();
  const open = useSignal(true);
  return (
    <section>
      <button onClick$={() => (open.value = !open.value)}>목록 토글</button>
      {open.value && <ul>{list.value.map((t) => <li key={t}>{t}</li>)}</ul>}
      <Form action={add}><input name="text" /><button>추가</button></Form>
    </section>
  );
});
```

## 자주 쓰는 패턴
- **이벤트 핸들러에 큰 라이브러리를 직접 import 하지 않는다.** `$` 경계 안에서 쓰면 클릭 시점에만 로드된다.
- **`useVisibleTask$` 최소화:** 브라우저 즉시 실행 코드가 늘어나면 resumability 이점이 줄어든다. 서버에서 가능한 일은 `useTask$`·`routeLoader$`로.
- **폼 검증:** `routeAction$(fn, zod$({...}))`처럼 Qwik City의 `zod$`로 입력 스키마를 붙인다.
- **v2 이전 체크:** 패키지명 변경, `useResource$` → async `useComputed$`, `<QwikCityProvider>` → `useQwikRouter()` 등은 공식 Upgrade 문서의 목록을 따른다.

## 언제 쓰나 / 피할 때
- 쓸 때: 전자상거래·랜딩처럼 첫 로딩 속도와 초기 JS 양이 중요한데 상호작용도 많은 사이트.
- 피할 때(대안): React 컴포넌트 생태계를 그대로 써야 하면 [Next.js](/develop-wiki/frontend/meta-framework/nextjs/), 대부분 정적인 콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/). v2는 아직 RC라 새 프로젝트에서 어느 쪽으로 시작할지 릴리스 일정을 확인한다.

## 공식 문서
- [시작하기 (v1)](https://qwik.dev/docs/getting-started/) · [라우트 로더](https://qwik.dev/docs/route-loader/) · [액션](https://qwik.dev/docs/action/)
- [v2 문서](https://next.qwik.dev/docs/) · [v1 → v2 업그레이드](https://next.qwik.dev/docs/upgrade/)
