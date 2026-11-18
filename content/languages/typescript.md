---
name: TypeScript
summary: JavaScript에 정적 타입을 더한 언어. 컴파일 시 타입을 검사한 뒤 JavaScript로 변환되어 브라우저·Node.js 등 JS가 도는 곳이면 어디서나 실행된다.
paradigms: [객체지향, 함수형, 명령형, 이벤트 기반]
typing: static
execution: transpiled
firstAppeared: 2012
officialSite: https://www.typescriptlang.org/
docs: https://www.typescriptlang.org/docs/
useCases: [웹 프론트엔드, 서버·API(Node.js·Deno·Bun), 풀스택 웹 앱, CLI·개발 도구, AI 에이전트·LLM 앱]
sources:
  - https://www.typescriptlang.org/download/
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7.0/
  - https://nodejs.org/api/typescript.html
  - https://www.typescriptlang.org/docs/
updatedAt: 2026-11-18
---

## 개요
TypeScript는 Microsoft가 만든 JavaScript의 상위 집합(superset)이다. JavaScript 문법에 타입 표기를 얹고, 컴파일러(`tsc`)가 타입을 검사한 뒤 타입을 지운 JavaScript를 내보낸다. 실행 시점에는 순수 JavaScript이므로 런타임 성능이나 실행 환경은 JavaScript와 같다.

- 현재 안정 버전은 **TypeScript 7.0**(2026-07 발표). 컴파일러가 Go로 다시 작성된 네이티브 구현으로 바뀌어 빌드 속도가 크게 빨라졌다. 6.0과 같은 타입 검사 결과를 내는 것을 목표로 한다.
- 이 사이트의 언어 분류에서 `typescript` 는 JavaScript 생태계 전체(TypeScript/JS)를 대표한다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 구조적 타입(이름이 아니라 모양이 같으면 호환), 타입 추론, 유니언·교차 타입, 제네릭, 조건부·매핑 타입 |
| 타입 안전성 | `any` 로 검사를 끌 수 있는 점진적 성격이 있음. 7.0부터 `strict` 가 기본값 `true` |
| 실행 | `tsc` 로 JS 변환 후 실행, 또는 Node.js 의 타입 제거(type stripping)로 `.ts` 를 바로 실행 |
| 메모리 관리 | JS 엔진의 가비지 컬렉션 |
| 동시성 | 싱글 스레드 이벤트 루프 + `Promise`/`async`·`await`. 병렬 처리는 Worker |
| 모듈 | ES 모듈(`import`/`export`). 7.0 기본 `module` 은 `esnext` |

7.0에서 정리된 옵션: `target: es5`, `moduleResolution: node`(node10)·`classic`, `module: amd/umd/systemjs`, `baseUrl` 등은 이제 오류가 난다. 오래된 tsconfig 를 쓰는 프로젝트는 업그레이드 전에 확인이 필요하다.

## 개발 환경 시작하기
1. [Node.js](https://nodejs.org/) LTS 설치 (npm 포함). pnpm·yarn·Bun 같은 다른 패키지 매니저도 쓸 수 있다.
2. 프로젝트별로 TypeScript 를 개발 의존성으로 설치한다(전역 설치보다 권장 — 잠금 파일로 버전 고정).

```bash
mkdir hello-ts && cd hello-ts
npm init -y
npm install -D typescript
npx tsc --version        # 7.x 확인
```

3. 최소 `tsconfig.json` (7.0 은 `strict`·`module: esnext` 가 기본이라 짧아도 된다)

```json
{
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

4. 빌드와 실행

```bash
npx tsc                  # src/*.ts → dist/*.js
node dist/index.js
node src/index.ts        # Node 22.18+/23.6+ 는 타입 제거로 바로 실행 (타입 검사는 안 함)
```

Node 의 타입 제거는 `enum`, 런타임 코드가 있는 `namespace`, 생성자 매개변수 프로퍼티처럼 JS 코드 생성이 필요한 문법을 지원하지 않고 `tsconfig.json` 도 읽지 않는다. 타입 검사는 따로 `npx tsc --noEmit` 으로 돌린다.

## 문법 한눈에 보기
```ts
// 변수·타입 추론
const name = "dev.hub";          // string 으로 추론
let count: number = 0;

// 객체 타입과 함수
type User = { id: number; name: string; email?: string };

function greet(user: User): string {
  return `안녕하세요, ${user.name}님`;
}

// 제네릭
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// 판별 유니언으로 결과 표현
type Result = { ok: true; value: number } | { ok: false; error: string };

function parse(s: string): Result {
  const n = Number(s);
  return Number.isNaN(n) ? { ok: false, error: `숫자 아님: ${s}` } : { ok: true, value: n };
}
```

```ts
// 클래스·인터페이스·비동기·에러 처리
interface Store { get(key: string): Promise<string | null> }

class MemoryStore implements Store {
  private data = new Map<string, string>();
  async get(key: string) { return this.data.get(key) ?? null; }
}

try {
  const res = await fetch("https://example.com/api");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (err: unknown) {
  if (err instanceof Error) console.error(err.message);
}
```

## 생태계
**프론트엔드 UI**
- [React](/develop-wiki/frontend/framework/react/) · [Vue](/develop-wiki/frontend/framework/vue/) · [Angular](/develop-wiki/frontend/framework/angular/) · [Svelte](/develop-wiki/frontend/framework/svelte/) · [Solid](/develop-wiki/frontend/framework/solid/) · [Preact](/develop-wiki/frontend/framework/preact/) · [Lit](/develop-wiki/frontend/framework/lit/)
- 가벼운 상호작용: [Alpine.js](/develop-wiki/frontend/framework/alpinejs/) · [htmx](/develop-wiki/frontend/framework/htmx/)
- 메타 프레임워크: [Astro](/develop-wiki/frontend/meta-framework/astro/)
- 서버 상태: [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/) · 스타일: [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/)
- E2E 테스트: [Playwright](/develop-wiki/frontend/testing/playwright/)

**백엔드**
- 웹 프레임워크: [Express](/develop-wiki/backend/web-framework/express/) · [Hono](/develop-wiki/backend/web-framework/hono/)
- ORM·쿼리 빌더: [Drizzle ORM](/develop-wiki/backend/orm-query/drizzle-orm/)
- 관측성: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/)

**AI**
- 에이전트: [Mastra](/develop-wiki/ai/agent-framework/mastra/) · [LangChain](/develop-wiki/ai/agent-framework/langchain/) · [LangGraph](/develop-wiki/ai/agent-framework/langgraph/) · [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/) · [Google ADK](/develop-wiki/ai/agent-framework/google-adk/)
- 도구 연동: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)

**런타임·도구**: Node.js, Deno, Bun(셋 다 `.ts` 실행 지원), 패키지 매니저 npm·pnpm·yarn, 번들러 Vite·esbuild.

## 언제 쓰나 / 약점
- **쓸 때**
  - 브라우저에서 도는 코드 — 사실상 유일한 선택지(JS)이며, 규모가 커지면 타입이 리팩터링 안전망이 된다.
  - 프론트와 백엔드를 한 언어로 맞추고 타입을 공유하고 싶을 때.
  - npm 생태계의 라이브러리를 그대로 활용하는 서버·CLI.
- **약점**
  - 타입은 컴파일 시점에만 존재한다. 외부 입력(API 응답 등)은 Zod 같은 런타임 검증이 따로 필요하다.
  - `any`, 타입 단언(`as`)으로 검사를 우회할 수 있어 팀 규율에 따라 안전성이 달라진다.
  - CPU 집약 작업·멀티코어 병렬 처리는 Go·Rust·JVM 계열보다 불리하다.
  - 빌드 설정(tsconfig, 모듈 형식, 번들러) 조합이 복잡하다. 7.0은 오래된 옵션을 제거했으므로 마이그레이션 시 확인 필요.

## 공식 문서·학습 자료
- [TypeScript 문서](https://www.typescriptlang.org/docs/) · [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) · [TSConfig 레퍼런스](https://www.typescriptlang.org/tsconfig/)
- [다운로드·설치 안내](https://www.typescriptlang.org/download/) · [Playground](https://www.typescriptlang.org/play)
- [TypeScript 7.0 발표 글](https://devblogs.microsoft.com/typescript/announcing-typescript-7.0/)
- [Node.js 의 TypeScript 실행 지원](https://nodejs.org/api/typescript.html)
- [MDN JavaScript 가이드](https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide)
