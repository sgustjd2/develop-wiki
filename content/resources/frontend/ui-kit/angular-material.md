---
name: Angular Material
url: https://material.angular.dev
docs: https://material.angular.dev/guide/getting-started
repo: https://github.com/angular/components
stars: 25049
domain: frontend
category: ui-kit
description: Angular 팀이 관리하는 Material Design 3 컴포넌트 라이브러리와 CDK. Angular 앱에 공식 지원되는 폼·테이블·다이얼로그 컴포넌트가 필요할 때 쓴다.
pricing: oss
tags: [angular, material-design, components, cdk, theming]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Angular Material은 Google Angular 팀이 `angular/components` 저장소에서 관리하는 [Angular](/develop-wiki/frontend/framework/angular/)용 UI 컴포넌트 라이브러리다. 버튼·폼 필드·테이블·다이얼로그 같은 Material Design 3 컴포넌트와, 스타일 없이 동작만 제공하는 **CDK(Component Dev Kit)**(오버레이, 드래그 앤 드롭, 가상 스크롤, 접근성 유틸)를 함께 배포한다. 이 문서는 **v22** 기준이다(npm `@angular/material` `latest` 22.2.7).

- 메이저 버전이 Angular 코어와 함께 움직인다. v22는 `@angular/core` 22~23을 peer로 요구한다.
- 테마는 v19부터 `mat.theme` Sass 믹스인이 CSS 변수(`--mat-sys-*`)를 출력하는 방식이다. 그 이전 `define-*-theme` API 문서는 v18 사이트에 남아 있다.

## 설치
Angular CLI 프로젝트에서 실행한다.

```bash
ng add @angular/material
ng serve
```

`ng add`가 `@angular/material`·`@angular/cdk` 설치, 프리빌트 또는 커스텀 테마 선택, 전역 타이포그래피, `index.html`의 Roboto·Material Symbols 폰트, 기본 전역 스타일을 한 번에 설정한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| standalone import | 필요한 컴포넌트·디렉티브(`MatButton`, `MatFormField`, `MatInput`…)를 컴포넌트의 `imports`에 직접 추가 |
| 버튼 디렉티브 | 네이티브 `<button>`/`<a>`에 `matButton="filled"`(text·filled·tonal·outlined·elevated), `matIconButton`, `matFab` 부여 |
| `mat-form-field` | 라벨·힌트·에러·접두/접미 아이콘을 감싸는 입력 컨테이너. `matInput`, `mat-select`가 안에 들어감 |
| `mat.theme` | 색 팔레트·타이포그래피·밀도를 받아 디자인 토큰 CSS 변수를 생성. `light-dark()`로 라이트/다크 전환 |
| CDK | `@angular/cdk`의 Overlay, DragDrop, ScrollingModule(가상 스크롤), a11y(포커스 트랩) 등 스타일 없는 빌딩 블록 |
| 컴포넌트 하네스 | `MatButtonHarness` 등 테스트용 API로 DOM 구조에 의존하지 않고 컴포넌트를 조작 |
| 스키매틱 | `ng generate @angular/material:table` 등으로 미리 구성된 컴포넌트 생성 |

## 기본 사용법
테마 파일(`styles.scss`):

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((color: mat.$violet-palette, typography: Roboto, density: 0));
}
body { background: var(--mat-sys-surface); color: var(--mat-sys-on-surface); }
```

컴포넌트:

```ts
import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-search',
  imports: [MatButton, MatFormField, MatLabel, MatInput],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>검색어</mat-label>
      <input matInput #q />
    </mat-form-field>
    <button matButton="filled" (click)="keyword.set(q.value)">검색</button>
  `,
})
export class Search { keyword = signal(''); }
```

## 자주 쓰는 패턴
- **다이얼로그.** `inject(MatDialog).open(EditComponent, { data })`로 열고, 반환된 `afterClosed()`로 결과를 받는다.
- **데이터 테이블.** `mat-table` + `MatSort` + `MatPaginator` 조합. `ng generate @angular/material:table <이름>`으로 뼈대를 만든다.
- **커스텀 디자인에 CDK만.** Material 스타일이 맞지 않으면 `@angular/cdk/overlay`, `@angular/cdk/drag-drop`만 가져와 동작을 재사용한다.
- **테스트.** `TestbedHarnessEnvironment.loader(fixture)`로 로더를 만들고 `loader.getHarness(MatButtonHarness)`로 클릭·상태 확인.
- **브랜드 색 생성.** `ng generate @angular/material:theme-color`로 기준 색에서 M3 팔레트를 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: Angular 앱에서 Angular 버전과 함께 업데이트되는 공식 컴포넌트가 필요할 때, 사내 업무 시스템·관리자 화면.
- 피할 때(대안): Material Design과 거리가 먼 브랜드 디자인이면 CDK만 쓰거나 다른 헤드리스 라이브러리를 고려한다. React는 [MUI](/develop-wiki/frontend/ui-kit/mui/), Vue는 [Vuetify](/develop-wiki/frontend/ui-kit/vuetify/)가 같은 Material 계열이다.

## 공식 문서
- [시작하기](https://material.angular.dev/guide/getting-started) · [테마](https://material.angular.dev/guide/theming) · [컴포넌트 목록](https://material.angular.dev/components/categories)
- [CDK](https://material.angular.dev/cdk/categories) · [스키매틱](https://material.angular.dev/guide/schematics) · [하네스 테스트](https://material.angular.dev/guide/using-component-harnesses)
