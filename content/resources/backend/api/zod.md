---
name: Zod
url: https://zod.dev
docs: https://zod.dev/basics
repo: https://github.com/colinhacks/zod
stars: 44436
domain: backend
category: api
description: 스키마를 한 번 정의하면 런타임 검증과 TypeScript 타입 추론을 함께 얻는 스키마 검증 라이브러리. API 요청·환경 변수·폼 입력처럼 외부에서 들어오는 데이터를 검증할 때 쓴다.
pricing: oss
tags: [validation, schema, type-inference, json-schema, standard-schema]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Zod는 `z.object({...})` 같은 스키마로 데이터 형태를 선언하고, 그 스키마로 런타임에 값을 검증하면서 `z.infer`로 정적 타입까지 뽑아 쓰게 하는 TypeScript 우선 검증 라이브러리다. 타입 정의와 검증 로직을 따로 관리하지 않아도 되는 것이 핵심이다. 이 문서는 **Zod 4** 기준이다(npm `zod` `latest` 4.6.7). 4.5에서 스키마를 미리 컴파일해 파싱을 빠르게 하는 `z.compile()`이 추가됐다.

- [Standard Schema](https://standardschema.dev/) 명세를 구현해 [tRPC](/develop-wiki/backend/api/trpc/), [React Hook Form](/develop-wiki/frontend/state-data/react-hook-form/) 리졸버, Hono 등 여러 라이브러리가 검증기로 받는다.
- `z.toJSONSchema()`로 JSON Schema를 만들 수 있어 [OpenAPI](/develop-wiki/backend/api/openapi/) 문서·LLM 구조화 출력 스키마에도 쓴다.
- 번들 크기가 중요한 프런트엔드용으로 함수형 API의 `zod/mini`가 있다. 비슷한 위치의 대안은 Valibot, ArkType.

## 설치
```bash
npm install zod
```

TypeScript 5.5 이상을 기준으로 테스트되며, `tsconfig.json`에 `"strict": true`가 필요하다. 3.x 코드는 `zod/v3` 서브경로로 계속 import 할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 스키마 | `z.string()`, `z.number()`, `z.object()`, `z.array()`, `z.enum()`, `z.union()` 등 |
| 문자열 형식 | `z.email()`, `z.url()`, `z.uuid()`, `z.iso.datetime()` 같은 최상위 함수 (v4) |
| `.parse()` / `.safeParse()` | 실패 시 `ZodError` throw / `{ success, data \| error }` 판별 유니온 반환 |
| `z.infer<typeof S>` | 스키마에서 출력 타입 추출 (`z.input`은 변환 전 입력 타입) |
| `z.coerce.*` | 입력을 해당 타입으로 강제 변환 후 검증 (쿼리 문자열 숫자 등) |
| `.refine()` / `.transform()` | 사용자 정의 검증 / 값 변환 |
| `.extend()` / `.pick()` / `.omit()` / `.partial()` | 객체 스키마 파생 |
| 오류 포맷 | `error.issues`, `z.prettifyError()`, `z.treeifyError()`, `z.flattenError()` |
| `z.compile()` | 스키마를 미리 컴파일해 반복 파싱을 빠르게 (4.5+, 내부적으로 `new Function` 사용) |

## 기본 사용법
```ts
import * as z from 'zod';

const CreateUser = z.object({
  email: z.email(),
  name: z.string().min(1).max(50),
  age: z.coerce.number().int().min(14).optional(),
  role: z.enum(['member', 'admin']).default('member'),
});

type CreateUser = z.infer<typeof CreateUser>;

const result = CreateUser.safeParse({ email: 'a@example.com', name: '민', age: '20' });
if (!result.success) {
  console.error(z.prettifyError(result.error));
} else {
  console.log(result.data.age); // 20 (number)
}
```

환경 변수 검증.

```ts
import * as z from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3000),
  })
  .parse(process.env);
```

## 자주 쓰는 패턴
- **API 경계에서 한 번 검증:** 요청 본문·쿼리·외부 API 응답을 핸들러 입구에서 `safeParse`하고, 이후 코드는 추론된 타입만 믿고 쓴다.
- **폼 검증 공유:** 같은 스키마를 서버 액션과 클라이언트 폼(React Hook Form `zodResolver`)에서 함께 쓴다.
- **비밀번호 확인 같은 교차 필드 검증:** 객체에 `.refine((v) => v.password === v.confirm, { path: ['confirm'] })`.
- **JSON Schema 내보내기:** `z.toJSONSchema(schema)`로 문서·LLM 도구 정의를 생성하고, `.meta({ title, description })`로 설명을 붙인다.
- **핫 패스 최적화:** 초당 수많은 요청을 검증하는 스키마는 `z.compile(schema)` 결과를 재사용한다. CSP로 `eval`이 막힌 환경에서는 자동으로 일반 파서로 돌아간다.

## 언제 쓰나 / 피할 때
- 쓸 때: TypeScript 서버·풀스택 앱의 입력 검증, 설정·환경 변수 검증, 서버와 클라이언트가 같은 스키마를 공유할 때.
- 피할 때(대안): 브라우저 번들 크기가 매우 중요하면 `zod/mini` 또는 Valibot, 언어 중립 계약이 필요하면 JSON Schema·[OpenAPI](/develop-wiki/backend/api/openapi/)·[Protobuf(Buf)](/develop-wiki/backend/api/buf/)를 원천으로 두고 코드를 생성한다.

## 공식 문서
- [기본 사용법](https://zod.dev/basics) · [스키마 API](https://zod.dev/api) · [오류 포맷](https://zod.dev/error-formatting) · [JSON Schema](https://zod.dev/json-schema)
- [AOT 컴파일](https://zod.dev/compile) · [Zod Mini](https://zod.dev/packages/mini) · [Zod 4 변경 사항](https://zod.dev/v4/changelog)
