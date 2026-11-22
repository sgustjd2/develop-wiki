---
name: Primer
url: https://primer.style
docs: https://primer.style/product/getting-started/react/
repo: https://github.com/primer/react
stars: 3942
domain: frontend
category: ui-kit
description: GitHub 의 디자인 시스템 Primer 와 React 구현 @primer/react, 디자인 토큰 패키지 @primer/primitives. 개발자 도구 성격의 화면이나 GitHub 앱·확장 UI를 만들 때 쓴다.
pricing: oss
tags: [design-system, react, github, design-tokens, accessibility]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Primer는 GitHub 제품 UI를 만드는 디자인 시스템이다. 가이드(primer.style)와 함께 React 컴포넌트 `@primer/react`, 색·간격·타이포그래피 토큰을 CSS 변수로 제공하는 `@primer/primitives` 를 공개한다. 모두 MIT 라이선스. `@primer/react` 최신 38.46.0(2026-11-13), npm 월 다운로드 약 30만 건(2026-11 기준). 토큰 패키지 `@primer/primitives` 는 [Style Dictionary](/develop-wiki/frontend/styling/style-dictionary/)로 빌드되는 공개 사례이기도 하다.

## 설치
```bash
npm install @primer/react @primer/primitives
```

## 기본 사용법
루트에서 테마 CSS를 불러오고 `BaseStyles` 로 감싼 뒤, `html` 요소에 색 모드 속성을 넣는다.

```tsx
// 사용할 테마 CSS를 불러온다 (예: 라이트)
import '@primer/primitives/dist/css/functional/themes/light.css';
import { BaseStyles, Button } from '@primer/react';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return <BaseStyles>{children}</BaseStyles>;
}

export function SaveButton() {
  return <Button variant="primary">저장</Button>;
}
```

```html
<html data-light-theme="light" data-dark-theme="dark" data-color-mode="auto">
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| @primer/primitives | `--fgColor-default`, `--bgColor-muted` 같은 기능(역할) 기반 CSS 변수 토큰 |
| 색 모드 | `data-color-mode`(light/dark/auto)와 테마 속성으로 라이트·다크·고대비 테마 전환 |
| 컴포넌트 | ActionList, ActionMenu, Dialog, NavList, TreeView, DataTable 등 GitHub UI에 쓰이는 컴포넌트 |
| 접근성 가이드 | 컴포넌트 문서마다 키보드 동작·ARIA 사용 지침을 함께 적는다 |

## 언제 쓰나
- 쓸 때: GitHub App·확장, 개발자 대상 대시보드처럼 GitHub과 비슷한 정보 구조가 어울리는 화면. 토큰·다크 모드·고대비 테마 설계를 참고할 때.
- 피할 때(대안): 범용 서비스 UI라면 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)·[MUI](/develop-wiki/frontend/ui-kit/mui/)가 생태계가 넓다.

## 공식 문서
- [primer.style](https://primer.style) · [@primer/react 저장소](https://github.com/primer/react) · [@primer/primitives](https://github.com/primer/primitives)
