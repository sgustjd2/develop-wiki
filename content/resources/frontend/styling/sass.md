---
name: Sass
url: https://sass-lang.com
docs: https://sass-lang.com/documentation/
repo: https://github.com/sass/dart-sass
stars: 4238
domain: frontend
category: styling
description: 변수·중첩·믹스인·모듈을 더한 CSS 전처리기. 큰 스타일시트를 파일 단위로 나누고 재사용할 때 쓴다.
pricing: oss
tags: [css, preprocessor, scss]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Sass는 CSS에 변수, 중첩, 믹스인, 함수, 모듈 시스템을 더한 스타일시트 언어로, 빌드 시 일반 CSS로 컴파일된다. CSS와 같은 중괄호 문법의 `.scss`와 들여쓰기 문법의 `.sass` 두 가지가 있고, 실무에서는 대부분 SCSS를 쓴다. 현재 공식 구현은 **Dart Sass** 하나이며(LibSass·Node Sass는 지원 종료), 이 문서는 npm `sass` `latest` 1.108.2 기준이다.

- Tailwind CSS 같은 유틸리티 방식이나 CSS-in-JS와 달리 "CSS 파일을 그대로 쓰되 더 편하게" 쓰는 쪽이다. CSS Modules(`*.module.scss`)와 함께 쓰는 경우가 많다.

## 설치
Vite·Next.js 등 대부분의 번들러는 `sass` 패키지만 설치하면 `.scss` import를 바로 처리한다.

```bash
npm install -D sass            # 순수 JS 배포판
npm install -D sass-embedded   # 네이티브 Dart 실행 파일을 쓰는 더 빠른 배포판(번들러가 지원하면)
npx sass src/main.scss dist/main.css --watch   # CLI 단독 사용
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 변수 `$name` | 컴파일 시 값이 치환되는 변수. 런타임에 바꿀 값은 CSS 사용자 정의 속성(`--x`)을 쓴다 |
| 중첩 / `&` | 선택자를 중첩하고 `&`로 부모 선택자 참조 (`&:hover`, `&--active`) |
| `@mixin` / `@include` | 인자를 받는 스타일 묶음을 정의·삽입 |
| `@function` / `@return` | 값을 계산해 돌려주는 사용자 함수 |
| `@use` | 모듈 로드. 파일 이름이 네임스페이스가 되고(`colors.$primary`), 같은 파일은 한 번만 로드 |
| `@forward` | 다른 모듈의 멤버를 다시 내보내 라이브러리 진입점을 만든다 |
| `!default` + `with` | 모듈 변수를 기본값으로 두고 `@use '...' with ($x: ...)`로 설정 |
| 내장 모듈 | `sass:math`, `sass:color`, `sass:map`, `sass:list`, `sass:string` 등 |
| 부분 파일 `_name.scss` | 단독으로 컴파일되지 않고 다른 파일에서 로드되는 파일 |

## 기본 사용법
```scss
// _tokens.scss
$radius: 8px !default;
$brand: #3b5bdb !default;

@mixin focus-ring($color: $brand) {
  outline: 2px solid $color;
  outline-offset: 2px;
}
```

```scss
// button.scss
@use 'sass:color';
@use 'tokens' as t with ($radius: 6px);

.button {
  border-radius: t.$radius;
  background: t.$brand;
  &:hover { background: color.adjust(t.$brand, $lightness: -8%); }
  &:focus-visible { @include t.focus-ring; }
}
```

## 자주 쓰는 패턴
- **`@import` 대신 `@use`.** `@import`는 Dart Sass 1.80.0부터 deprecated이며 3.0.0에서 제거될 예정이다. `npx sass-migrator module --migrate-deps <entry>.scss`로 자동 변환할 수 있다.
- **CSS Modules와 조합.** `Button.module.scss`로 만들면 Vite·Next.js가 클래스 이름을 지역화하고 `styles.button`처럼 import해 쓴다.
- **디자인 토큰 파일 하나.** 색·간격·브레이크포인트를 `_tokens.scss`에 두고 `@forward`로 묶은 `index.scss`를 진입점으로 쓴다.
- **런타임 테마는 CSS 변수로.** 다크 모드처럼 실행 중 바뀌는 값은 Sass 변수로 CSS 변수를 정의(`--brand: #{$brand}`)하고 컴포넌트는 `var(--brand)`를 쓴다.
- **번들러 옵션.** Vite는 `css.preprocessorOptions.scss.additionalData`로 공통 `@use`를 모든 파일 앞에 주입할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 기존 CSS 자산이 많거나, 디자이너·퍼블리셔와 CSS 파일 단위로 협업할 때, 믹스인·함수로 반복 패턴을 줄이고 싶을 때.
- 피할 때(대안): 중첩·변수만 필요하면 네이티브 CSS 중첩과 사용자 정의 속성으로 충분할 수 있다. 컴포넌트 단위로 타입 안전한 스타일을 원하면 [vanilla-extract](/develop-wiki/frontend/styling/vanilla-extract/), 유틸리티 방식은 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/).

## 공식 문서
- [문서 홈](https://sass-lang.com/documentation/) · [`@use`](https://sass-lang.com/documentation/at-rules/use/) · [내장 모듈](https://sass-lang.com/documentation/modules/)
- [`@import` 폐지 안내](https://sass-lang.com/documentation/breaking-changes/import/) · [Sass Migrator](https://sass-lang.com/documentation/cli/migrator/)
