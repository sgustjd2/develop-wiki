---
name: Material UI
url: https://mui.com/material-ui/
docs: https://mui.com/material-ui/getting-started/
repo: https://github.com/mui/material-ui
stars: 99372
domain: frontend
category: ui-kit
description: Google Material Design을 구현한 React 컴포넌트 라이브러리. 디자인이 갖춰진 컴포넌트와 테마 시스템으로 관리 화면·사내 도구를 빠르게 만들 때 쓴다.
pricing: oss
tags: [react, material-design, components, theming, emotion]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Material UI(MUI)는 버튼·폼·테이블·내비게이션 등 수십 개의 스타일 완성형 [React](/develop-wiki/frontend/framework/react/) 컴포넌트를 제공하는 라이브러리다. `createTheme`로 색·타이포그래피·간격을 한곳에서 정하고, 개별 스타일은 `sx` prop으로 덮어쓴다. 이 문서는 **v9** 기준이다(npm `@mui/material` `latest` 9.5.0, 9.0.0은 2026-04 배포).

- 기본 스타일 엔진은 Emotion이다. styled-components로 바꿀 수 있지만 SSR과 호환되지 않아 Emotion이 권장된다.
- 같은 회사의 헤드리스 라이브러리는 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/). 데이터 그리드·날짜 선택기 등 고급 컴포넌트는 별도 MUI X 패키지(일부 유료)다.

## 설치
React 17~19를 지원한다.

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material        # 선택: SVG 아이콘
npm install @fontsource/roboto         # 선택: 기본 폰트 Roboto
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ThemeProvider` + `createTheme` | 팔레트·타이포그래피·breakpoints·컴포넌트 기본값을 전역 지정 |
| `cssVariables: true` | 테마 값을 `--mui-palette-primary-main` 같은 CSS 변수로 출력 |
| `sx` prop | 테마 토큰을 참조하는 인라인 스타일 객체(`sx={{ mt: 2, color: 'primary.main' }}`) |
| `slots` / `slotProps` | 내부 부품(입력, 팝퍼, 전환 등)의 컴포넌트·props 교체. v9에서 옛 `*Props`, `components` API 제거 |
| `styleOverrides` / `variants` | 테마에서 컴포넌트별 기본 스타일·변형 정의 |
| `Grid` / `Stack` | 12열 레이아웃(`size={{ xs: 12, md: 6 }}`)과 1차원 간격 배치 |
| `CssBaseline` | 브라우저 기본 스타일 정규화 |

## 기본 사용법
```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

const theme = createTheme({ cssVariables: true, palette: { primary: { main: '#2f6fed' } } });

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Stack spacing={2} sx={{ p: 3, maxWidth: 360 }}>
        <TextField label="이메일" type="email" />
        <Button variant="contained">가입</Button>
      </Stack>
    </ThemeProvider>
  );
}
```

## 자주 쓰는 패턴
- **반응형 레이아웃.** `<Grid container spacing={2}><Grid size={{ xs: 12, md: 4 }}>…</Grid></Grid>`. v9에서 `item`·`xs` prop과 `GridLegacy`는 제거됐다.
- **내부 부품 props 전달.** `<TextField slotProps={{ htmlInput: { maxLength: 20 } }} />`. 옛 `inputProps`는 v9에서 제거됐다.
- **다크 모드.** `createTheme({ colorSchemes: { dark: true } })`로 라이트·다크 스킴을 함께 정의한다.
- **전역 컴포넌트 기본값.** `components: { MuiButton: { defaultProps: { disableElevation: true } } }`.
- **v8 → v9 업그레이드.** 시스템 props(`<Box mt={2}>`)가 제거돼 `sx`로 옮겨야 한다. 공식 codemod(`v9.0.0/system-props` 등)로 대부분 자동 변환된다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자이너 없이 일관된 화면이 필요한 관리자 페이지·B2B 도구, Material Design을 따르는 제품, 폼·테이블이 많은 앱.
- 피할 때(대안): 고유 브랜드 디자인이 강하면 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)나 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/). 런타임 CSS-in-JS를 피하고 싶으면 CSS 파일 기반인 [Mantine](/develop-wiki/frontend/ui-kit/mantine/). Angular는 [Angular Material](/develop-wiki/frontend/ui-kit/angular-material/).

## 공식 문서
- [설치](https://mui.com/material-ui/getting-started/installation/) · [테마](https://mui.com/material-ui/customization/theming/) · [컴포넌트 API](https://mui.com/material-ui/api/button/)
- [v9 업그레이드](https://mui.com/material-ui/migration/upgrade-to-v9/)
