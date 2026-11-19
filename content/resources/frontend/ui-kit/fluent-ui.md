---
name: Fluent UI
url: https://fluent2.microsoft.design
docs: https://react.fluentui.dev
repo: https://github.com/microsoft/fluentui
stars: 20418
domain: frontend
category: ui-kit
description: Microsoft 디자인 시스템 Fluent 2 와 그 웹 구현 Fluent UI React v9(@fluentui/react-components). Microsoft 365·Teams 와 어울리는 화면이나 Teams 앱, 사내 업무 도구를 만들 때 쓴다.
pricing: oss
tags: [design-system, react, microsoft, theming, griffel]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Fluent 2는 Microsoft의 디자인 시스템이며 웹(React)·iOS·Android·Windows용 컴포넌트 라이브러리와 Figma UI 키트를 제공한다. 웹 개발자가 주로 쓰는 것은 **Fluent UI React v9** 로, 이전의 `@fluentui/react`(v8)와 `@fluentui/react-northstar` 를 하나로 합친 `@fluentui/react-components` 패키지다. MIT 라이선스, `@fluentui/react-components` 최신 9.75.2, npm 월 다운로드 약 244만 건(2026-11 기준).

- 스타일은 Microsoft의 CSS-in-JS 엔진 Griffel(`makeStyles`)로 작성하고, 디자인 토큰은 `tokens` 객체로 참조한다.
- 테마로 `webLightTheme`·`webDarkTheme`·`teamsLightTheme` 등을 제공한다.

## 설치
```bash
npm install @fluentui/react-components
```

## 기본 사용법
앱 루트 가까이에 `FluentProvider` 와 테마를 두고, 그 하위에서 컴포넌트를 쓴다.

```tsx
import { FluentProvider, webLightTheme, Button, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: { padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground2 },
});

export function App() {
  const s = useStyles();
  return (
    <FluentProvider theme={webLightTheme}>
      <div className={s.root}>
        <Button appearance="primary">저장</Button>
      </div>
    </FluentProvider>
  );
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| FluentProvider | 테마 토큰을 CSS 변수로 주입하는 루트 컴포넌트. 중첩해 영역별 테마도 가능 |
| tokens | `colorBrandBackground`, `spacingHorizontalM` 같은 토큰 이름 |
| makeStyles | Griffel 기반 원자적 CSS-in-JS. 빌드 타임 추출 플러그인을 쓸 수 있다 |
| slots | 컴포넌트 내부 요소(icon, content 등)를 prop으로 교체하는 커스터마이징 방식 |

## 언제 쓰나
- 쓸 때: Teams·Office 애드인, SharePoint 등 Microsoft 365 생태계 앱, Microsoft 제품과 시각적으로 맞춰야 하는 사내 도구.
- 피할 때(대안): Microsoft 스타일이 필요 없다면 [Mantine](/develop-wiki/frontend/ui-kit/mantine/)·[MUI](/develop-wiki/frontend/ui-kit/mui/) 등 범용 키트가 문서·예제가 더 많다.

## 공식 문서
- [Fluent 2 디자인 시스템](https://fluent2.microsoft.design) · [Fluent UI React v9 문서](https://react.fluentui.dev) · [react-components README](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-components)
