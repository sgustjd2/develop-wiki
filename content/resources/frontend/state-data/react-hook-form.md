---
name: React Hook Form
url: https://react-hook-form.com
docs: https://react-hook-form.com/get-started
repo: https://github.com/react-hook-form/react-hook-form
stars: 44927
domain: frontend
category: state-data
description: 비제어 입력과 ref 기반으로 리렌더를 줄이는 React 폼 상태·검증 라이브러리. Zod 같은 스키마 검증 라이브러리와 연결해 쓴다.
pricing: oss
tags: [form, validation, react]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
React Hook Form(RHF)은 입력 값을 React 상태가 아니라 DOM과 내부 저장소에 두고(비제어 방식) `register`로 연결해, 타이핑할 때마다 폼 전체가 리렌더되지 않게 하는 폼 라이브러리다. 필드 등록·검증·오류 메시지·제출 상태를 `useForm` 하나로 다루고, HTML 표준 검증 규칙이나 스키마 검증 라이브러리(Zod, Valibot, Yup 등)를 리졸버로 붙인다. 이 문서는 **v7** 기준이다(npm `react-hook-form` `latest` 7.92.0). v8은 beta 태그로 개발 중이다.

## 설치
```bash
npm install react-hook-form
npm install @hookform/resolvers zod   # 선택: 스키마 검증 (resolvers 5.x는 Zod 3.25+/4 지원)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `useForm<T>(options)` | 폼 인스턴스. `defaultValues`, `resolver`, `mode`(검증 시점) 설정 |
| `register(name, rules)` | 네이티브 입력을 폼에 연결하는 props(`name`, `ref`, `onChange`, `onBlur`) 반환. `required`, `min`, `pattern`, `validate` 규칙 |
| `handleSubmit(onValid, onInvalid?)` | 검증 통과 시에만 `onValid(data)` 호출 |
| `formState` | `errors`, `isSubmitting`, `isDirty`, `isValid` 등. 읽은 속성만 구독됨 |
| `Controller` / `useController` | 제어 컴포넌트(UI 라이브러리 Select, DatePicker 등) 연결 |
| `watch` / `useWatch` | 특정 필드 값 구독 |
| `useFieldArray` | 동적으로 추가·삭제되는 필드 목록 |
| `setValue` / `reset` / `setError` | 값 설정, 초기화, 서버 오류를 필드에 표시 |

## 기본 사용법
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.email('이메일 형식이 아닙니다'),
  age: z.coerce.number().min(14, '14세 이상만 가입할 수 있습니다'),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

export function SignupForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormOut) => { await fetch('/api/signup', { method: 'POST', body: JSON.stringify(data) }); };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} placeholder="이메일" />
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <input {...register('age')} inputMode="numeric" />
      {errors.age && <p role="alert">{errors.age.message}</p>}
      <button disabled={isSubmitting}>가입</button>
    </form>
  );
}
```

## 자주 쓰는 패턴
- **`defaultValues` 지정.** 모든 필드의 초기값을 주면 `reset`, `isDirty` 계산이 정확해진다. 서버 데이터로 채울 때는 데이터를 받은 뒤 `reset(data)`.
- **UI 라이브러리 컴포넌트.** `ref`를 받지 않는 컴포넌트는 `<Controller name="country" control={control} render={({ field }) => <Select {...field} />} />`로 연결한다.
- **서버 오류 표시.** 제출 응답이 중복 이메일이면 `setError('email', { message: '이미 가입된 이메일' })`.
- **큰 폼 나누기.** `FormProvider` + `useFormContext`로 하위 컴포넌트에서 `register`를 꺼낸다.
- **검증 시점.** 기본은 제출 시 검증, 이후 변경 시 재검증. 즉시 피드백이 필요하면 `mode: 'onBlur'`나 `'onChange'`.

## 언제 쓰나 / 피할 때
- 쓸 때: 필드가 많거나 입력이 잦아 리렌더 비용이 신경 쓰이는 React 폼, 클라이언트·서버가 같은 Zod 스키마로 검증하고 싶을 때.
- 피할 때(대안): 입력 한두 개짜리 폼은 `useState`나 React 19의 폼 액션(`useActionState`)으로 충분하다. 프레임워크 독립적이고 타입 추론을 더 강하게 원하면 TanStack Form.

## 공식 문서
- [시작하기](https://react-hook-form.com/get-started) · [`useForm`](https://react-hook-form.com/docs/useform) · [`register`](https://react-hook-form.com/docs/useform/register)
- [`Controller`](https://react-hook-form.com/docs/usecontroller/controller) · [`useFieldArray`](https://react-hook-form.com/docs/usefieldarray) · [Resolvers](https://github.com/react-hook-form/resolvers)
