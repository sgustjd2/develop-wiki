---
name: Style Dictionary
url: https://styledictionary.com
docs: https://styledictionary.com/getting-started/installation/
repo: https://github.com/style-dictionary/style-dictionary
stars: 4899
domain: frontend
category: styling
description: JSON 등으로 정의한 디자인 토큰을 CSS 변수·SCSS·JS·iOS·Android 형식으로 변환해 내보내는 빌드 도구. 색·간격·타이포그래피 값을 여러 플랫폼에 한 원천으로 배포할 때 쓴다.
pricing: oss
tags: [design-tokens, dtcg, css-variables, build-tool, design-system]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Style Dictionary는 **디자인 토큰**(색, 크기, 폰트, 그림자 같은 스타일 값)을 한곳에 정의하고, 설정에 따라 플랫폼별 코드 파일로 변환하는 Node.js 도구다. 토큰 파일을 읽어 → transform(값·이름 변환) → format(출력 형식)을 거쳐 `variables.css`, `_variables.scss`, `tokens.js`, Swift·Kotlin 파일 등을 만든다. Apache-2.0 라이선스, 최신 릴리스 v5.8.0(2026-11-03), npm 월 다운로드 약 1,160만 건(2026-11 기준).

- v4부터 디자인 토큰 커뮤니티 그룹(DTCG) 형식(`$value`, `$type`)을 1급으로 지원한다. 최신 DTCG 형식(2025.10) 전체 지원은 v5에서 진행 중이다([DTCG 문서](https://styledictionary.com/info/dtcg/)).
- v4 이후 API는 ESM·비동기 기반이다. 오래된 예제의 `StyleDictionary.extend()` 는 v3 방식이다.

## 설치
```bash
npm install -D style-dictionary
```

## 기본 사용법
토큰 파일(DTCG 형식 예):

```json
// tokens/color.json
{
  "color": {
    "brand": { "$type": "color", "$value": "#0b5fff" },
    "text":  { "$type": "color", "$value": "{color.brand}" }
  }
}
```

설정 파일과 빌드:

```js
// build.mjs
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{ destination: 'variables.css', format: 'css/variables' }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [{ destination: 'tokens.js', format: 'javascript/es6' }],
    },
  },
});
await sd.buildAllPlatforms();
```

CLI로도 실행할 수 있다: `npx style-dictionary build --config config.json`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| source / include | 토큰 파일 경로. include는 덮어쓸 수 있는 기본 토큰 |
| 참조(alias) | `{color.brand}` 처럼 다른 토큰을 가리켜 시맨틱 토큰을 만든다 |
| transform | 이름(kebab·camel)·값(px→rem, 색 형식) 변환 함수 |
| transformGroup | 플랫폼별 transform 묶음 (`css`, `js`, `ios`, `android` 등) |
| format | 출력 파일 형식. 사용자 정의 format 을 등록할 수 있다 |
| filter | 특정 토큰만 골라 파일에 넣을 때 사용 |

## 언제 쓰나
- 쓸 때: 웹·iOS·Android가 같은 브랜드 값을 써야 하는 디자인 시스템, Figma에서 내보낸 토큰을 코드로 바꾸는 파이프라인([Tokens Studio](/develop-wiki/frontend/styling/tokens-studio/) + `@tokens-studio/sd-transforms`).
- 피할 때(대안): 웹 한 곳에서만 쓰고 값이 적다면 CSS 변수 파일이나 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) 테마 설정으로 충분하다.

## 공식 문서
- [설치](https://styledictionary.com/getting-started/installation/) · [npm 모듈 사용](https://styledictionary.com/getting-started/using_the_npm_module/) · [DTCG 지원](https://styledictionary.com/info/dtcg/) · [v5 마이그레이션](https://styledictionary.com/versions/v5/migration/)
