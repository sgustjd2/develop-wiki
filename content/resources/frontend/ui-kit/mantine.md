---
name: Mantine
url: https://mantine.dev
docs: https://mantine.dev/getting-started/
repo: https://github.com/mantinedev/mantine
stars: 31977
domain: frontend
category: ui-kit
description: 컴포넌트·훅·폼·날짜·차트 패키지를 함께 제공하는 React UI 라이브러리. 스타일이 갖춰진 컴포넌트로 대시보드·사내 도구를 빠르게 만들 때 쓴다.
pricing: oss
tags: [react, components, hooks, forms, theming]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Mantine은 120개 이상의 스타일 완성형 컴포넌트(`@mantine/core`)와 70개 이상의 범용 React 훅(`@mantine/hooks`)을 중심으로 폼, 날짜 선택기, 차트, 알림, 리치 텍스트 편집기 등을 별도 패키지로 제공하는 [React](/develop-wiki/frontend/framework/react/) 라이브러리다. 스타일은 런타임 CSS-in-JS가 아니라 **미리 빌드된 CSS 파일 + CSS 변수**로 입힌다. 이 문서는 **v9** 기준이다(npm `@mantine/core` `latest` 9.8.1, 9.0.0은 2026-03-31 배포).

- v9부터 모든 `@mantine/*` 패키지가 React 19.2 이상을 요구한다.
- 같은 위치의 대안은 [Material UI](/develop-wiki/frontend/ui-kit/mui/). 디자인을 직접 소유하는 방식은 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/).

## 설치
```bash
npm install @mantine/core @mantine/hooks
npm install -D postcss postcss-preset-mantine postcss-simple-vars   # 권장 PostCSS 설정
npm install @mantine/form @mantine/dates dayjs                       # 선택 패키지 예
```

`postcss.config.cjs`에 `postcss-preset-mantine`과 `postcss-simple-vars`(breakpoint 변수 `$mantine-breakpoint-*`)를 등록하고, 앱 진입점에서 `import '@mantine/core/styles.css'`를 한 번 불러온다. 다른 패키지(`@mantine/dates` 등)는 해당 패키지 CSS도 따로 import 한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `MantineProvider` + `createTheme` | 색 팔레트, `primaryColor`, `defaultRadius`, 폰트 등 테마를 앱 루트에 주입 |
| `ColorSchemeScript` | SSR에서 `<head>`에 넣어 색 모드 깜빡임·하이드레이션 경고 방지(`mantineHtmlProps`와 함께) |
| 스타일 props | `m`, `p`, `c`, `bg`, `w`, `fz` 등. `w={{ base: 200, sm: 400 }}`처럼 반응형 객체 지원 |
| `classNames` / `styles` | 컴포넌트 내부 부품(root, label, input 등)별 클래스·스타일 지정 |
| CSS 변수 | 테마 값이 `--mantine-color-blue-6` 같은 변수로 노출돼 CSS 모듈에서 참조 |
| `@mantine/hooks` | `useDisclosure`, `useDebouncedValue`, `useMediaQuery` 등 UI와 무관하게 쓸 수 있는 훅 |
| `@mantine/form` | `useForm`으로 값·검증·제출 관리. Standard Schema 리졸버 지원(v9) |

## 기본 사용법
```tsx
import '@mantine/core/styles.css';
import { MantineProvider, createTheme, Button, TextInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';

const theme = createTheme({ primaryColor: 'teal' });

function SignupForm() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: { email: (v) => (/^\S+@\S+$/.test(v) ? null : '이메일 형식이 아닙니다') },
  });
  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <Stack maw={320}>
        <TextInput label="이메일" key={form.key('email')} {...form.getInputProps('email')} />
        <Button type="submit">가입</Button>
      </Stack>
    </form>
  );
}

export const App = () => <MantineProvider theme={theme}><SignupForm /></MantineProvider>;
```

## 자주 쓰는 패턴
- **모달 열림 상태.** `const [opened, { open, close }] = useDisclosure(false)`를 `<Modal opened={opened} onClose={close}>`에 연결한다.
- **CSS 모듈로 세부 스타일.** `Button.module.css`에서 `var(--mantine-color-teal-6)`과 `$mantine-breakpoint-sm` 변수를 써서 덮어쓴다.
- **레이아웃 골격.** `AppShell`로 헤더·내비바·본문 영역을 구성한다.
- **v8 → v9 업그레이드.** 기본 `defaultRadius`가 `sm`→`md`로 바뀌고, `Text`의 `color` prop은 `c`로, `Grid`의 `gutter`는 `gap`으로, `Collapse`의 `in`은 `expanded`로 바뀌었다. 공식 8.x→9.x 가이드를 따라 옮긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 폼·날짜·차트·알림까지 한 생태계로 해결하고 싶은 React 앱, 런타임 CSS-in-JS 없이 테마를 쓰고 싶을 때.
- 피할 때(대안): React 19.2 미만에 묶인 프로젝트는 v9를 쓸 수 없다(v8 유지 또는 [MUI](/develop-wiki/frontend/ui-kit/mui/)). 브랜드 디자인을 처음부터 만들려면 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/)나 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/).

## 공식 문서
- [시작하기](https://mantine.dev/getting-started/) · [use-form](https://mantine.dev/form/use-form/) · [스타일 props](https://mantine.dev/styles/style-props/)
- [9.0 변경 사항](https://mantine.dev/changelog/9-0-0/) · [8.x → 9.x 마이그레이션](https://mantine.dev/guides/8x-to-9x/)
