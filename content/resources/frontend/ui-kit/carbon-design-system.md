---
name: Carbon Design System
url: https://carbondesignsystem.com
docs: https://carbondesignsystem.com/developing/frameworks/react/
repo: https://github.com/carbon-design-system/carbon
stars: 9653
domain: frontend
category: ui-kit
description: IBM의 오픈소스 디자인 시스템으로, 가이드라인·디자인 키트와 React·Web Components 구현(@carbon/react 등)을 함께 제공한다. 데이터 테이블이 많은 업무용·엔터프라이즈 화면을 만들 때 쓴다.
pricing: oss
tags: [design-system, react, web-components, enterprise, ibm]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Carbon은 IBM 제품에 쓰이는 디자인 시스템이다. 웹사이트에는 색·타이포그래피·2x 그리드·모션 같은 기초 요소와 컴포넌트·패턴 가이드가 있고, 코드는 [React](/develop-wiki/frontend/framework/react/) 구현 `@carbon/react` 와 Web Components 구현이 공식으로 제공된다. Apache-2.0 라이선스, 모노레포 최신 릴리스 v11.121.0(2026-11-18, `@carbon/react` 1.121.0), `@carbon/react` npm 월 다운로드 약 73만 건(2026-11 기준).

- 테마는 White·Gray 10(라이트)과 Gray 90·Gray 100(다크) 네 가지가 기본이며, Sass 토큰으로 정의된다.
- `@carbon/react` README에 따르면 패키지가 IBM Telemetry로 익명화된 사용 지표를 수집하므로, 사내 정책상 필요하면 문서의 비활성화 방법을 확인한다.

## 설치
```bash
npm install @carbon/react
npm install sass     # Carbon 스타일을 앱에서 컴파일할 때
```

```scss
// 전체 스타일
@use '@carbon/react';
// 또는 필요한 컴포넌트만
@use '@carbon/react/scss/components/button';
```

## 기본 사용법
```tsx
import { Button, TextInput } from '@carbon/react';
import { Add } from '@carbon/react/icons';

export function Toolbar() {
  return (
    <>
      <TextInput id="q" labelText="검색어" />
      <Button renderIcon={Add}>추가</Button>
    </>
  );
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 테마 토큰 | `$background`, `$text-primary` 처럼 역할 기반 토큰. 테마를 바꾸면 값만 바뀐다 |
| 2x Grid | 16열 그리드와 8px 기반 간격 체계 |
| DataTable | 정렬·선택·배치 액션·확장 행을 지원하는 테이블 컴포넌트 |
| 아이콘·픽토그램 | `@carbon/react/icons` 로 아이콘 컴포넌트 사용 |
| Storybook | 전체 컴포넌트 예시는 [Carbon React Storybook](https://react.carbondesignsystem.com/)에서 확인 |

## 언제 쓰나
- 쓸 때: 관리 콘솔·대시보드처럼 정보 밀도가 높은 B2B 화면, 디자인과 코드가 함께 정리된 시스템을 그대로 가져다 쓰고 싶을 때.
- 피할 때(대안): IBM 스타일이 브랜드와 맞지 않으면 테마 커스터마이징 폭이 넓은 [MUI](/develop-wiki/frontend/ui-kit/mui/)나 [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/)를 검토한다.

## 공식 문서
- [React 시작하기](https://carbondesignsystem.com/developing/frameworks/react/) · [@carbon/react README](https://github.com/carbon-design-system/carbon/tree/main/packages/react) · [Storybook](https://react.carbondesignsystem.com/)
