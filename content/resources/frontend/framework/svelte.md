---
name: Svelte
url: https://svelte.dev
repo: https://github.com/sveltejs/svelte
stars: 89907
docs: https://svelte.dev/docs/svelte/overview
domain: frontend
category: framework
description: 컴포넌트를 빌드 시점에 컴파일하는 UI 프레임워크. Svelte 5는 runes로 반응성을 선언하며, 런타임을 줄인 가벼운 앱에 쓴다.
pricing: oss
tags: [ui, compiler, runes, reactivity]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Svelte는 `.svelte` 컴포넌트를 빌드 시점에 일반 JavaScript로 컴파일하는 UI 프레임워크다. 반응성을 런타임 라이브러리 호출이 아니라 컴파일러가 이해하는 기호(runes, `$state` 등)로 선언하고, 상태가 바뀐 곳만 DOM을 갱신한다. 이 문서는 **Svelte 5** 기준이다(npm `latest` 5.57.3). 라우팅·SSR·배포 어댑터는 공식 앱 프레임워크 SvelteKit이 맡는다.

- runes는 Svelte 5에서 도입됐고, 4의 `let` 자동 반응성·`$:`·`on:` 등은 레거시 API로 분류된다.
- 비슷하게 시그널 기반으로 세밀하게 갱신하는 대안은 [Solid](/develop-wiki/frontend/framework/solid/), 템플릿 기반 대안은 [Vue](/develop-wiki/frontend/framework/vue/).

## 설치
공식 CLI `sv`로 SvelteKit 프로젝트를 만든다(권장).

```bash
npx sv create myapp
cd myapp && npm install && npm run dev
```

라우팅이 필요 없는 SPA라면 `npm create vite@latest`에서 `svelte` 템플릿을 고를 수도 있다. 타입·문법 검사는 `npx sv check`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| runes | `$`로 시작하는 컴파일러 기호. import 없이 `.svelte`, `.svelte.js/.ts`에서만 사용 |
| `$state` | 반응형 상태. 객체·배열은 깊은 프록시가 되어 `arr.push()`도 추적 |
| `$state.raw` | 깊은 프록시 없이 재할당으로만 갱신되는 상태 |
| `$derived` / `$derived.by` | 파생 값(식 / 함수 본문) |
| `$effect` | 마운트 후·의존 상태 변경 후 브라우저에서만 실행. 반환 함수가 cleanup |
| `$props` / `$bindable` | 컴포넌트 입력을 구조 분해로 받기 / 부모와 양방향 바인딩 허용 |
| `$inspect` | 개발 중 상태 변화를 로그로 확인 |
| 이벤트 | 엘리먼트 속성처럼 `onclick={...}`으로 지정 (`on:click`은 레거시) |
| snippet | `{#snippet name()}…{/snippet}`로 마크업 조각을 정의하고 `{@render name()}`으로 출력 (슬롯 대체) |
| 블록 | `{#if}`, `{#each items as item (item.id)}`, `{#await promise}` |
| `{@attach}` | 엘리먼트가 마운트될 때와 안에서 읽은 상태가 바뀔 때 effect로 실행되는 함수를 붙이는 문법(5.29+). 반환 함수는 cleanup |

## 기본 사용법
`Counter.svelte`:

```svelte
<script lang="ts">
  let { step = 1 }: { step?: number } = $props();
  let count = $state(0);
  let double = $derived(count * 2);

  $effect(() => {
    document.title = `count: ${count}`;
  });
</script>

<button onclick={() => (count += step)}>
  {count} (두 배 {double})
</button>
```

목록과 snippet:

```svelte
<script lang="ts">
  let todos = $state([{ id: 1, text: '문서 읽기', done: false }]);
</script>

{#snippet row(todo: { id: number; text: string; done: boolean })}
  <label>
    <input type="checkbox" checked={todo.done} onchange={() => (todo.done = !todo.done)} />
    {todo.text}
  </label>
{/snippet}

{#each todos as todo (todo.id)}
  {@render row(todo)}
{/each}
```

## 자주 쓰는 패턴
- **공유 상태는 `.svelte.ts` 모듈로.** runes는 `.svelte.ts` 파일에서도 동작하므로 클래스 필드에 `$state`를 두고 여러 컴포넌트가 import 해 쓴다.
- **파생은 `$derived`, 부수 효과만 `$effect`.** `$effect` 안에서 다른 상태를 대입해 값을 맞추는 대신 `$derived`로 계산한다.
- **자식→부모 통신은 콜백 prop.** `let { onsave } = $props()`로 받고 자식에서 `onsave(data)`를 호출한다.
- **컴포넌트 안 `await` (실험적).** 5.36부터 `svelte.config.js`의 `compilerOptions.experimental.async`를 켜면 템플릿·스크립트에서 `await`를 직접 쓸 수 있다. 정식 기능이 아니므로 운영 코드에는 신중히.
- **Svelte 4 이전.** `npx sv migrate svelte-5`로 상당 부분을 자동 변환하고, 나머지는 공식 마이그레이션 가이드로 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 적은 코드량과 작은 번들이 중요할 때, HTML·CSS에 가까운 문법을 선호하는 팀, SvelteKit으로 SSR·정적 생성까지 한 번에 할 때.
- 피할 때(대안): 서드파티 UI 컴포넌트·채용 풀이 결정적이면 [React](/develop-wiki/frontend/framework/react/)·[Vue](/develop-wiki/frontend/framework/vue/), 콘텐츠 사이트는 [Astro](/develop-wiki/frontend/meta-framework/astro/)에 Svelte 아일랜드만 쓰는 구성도 가능하다.

## 공식 문서
- [개요](https://svelte.dev/docs/svelte/overview) · [시작하기](https://svelte.dev/docs/svelte/getting-started) · [runes 소개](https://svelte.dev/docs/svelte/what-are-runes) · [`$effect`](https://svelte.dev/docs/svelte/$effect)
- [await 표현식](https://svelte.dev/docs/svelte/await-expressions) · [Svelte 5 마이그레이션](https://svelte.dev/docs/svelte/v5-migration-guide) · [SvelteKit](https://svelte.dev/docs/kit)
