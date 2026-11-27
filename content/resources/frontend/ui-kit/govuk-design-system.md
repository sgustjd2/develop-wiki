---
name: GOV.UK Design System
url: https://design-system.service.gov.uk
docs: https://frontend.design-system.service.gov.uk/
repo: https://github.com/alphagov/govuk-frontend
stars: 1484
domain: frontend
category: ui-kit
description: 영국 정부 디지털 서비스(GDS)가 공개한 디자인 시스템과 코드 패키지 govuk-frontend. 사용자 조사로 검증된 폼·질문 페이지 패턴과 접근성 근거를 참고하거나 공공 서비스 UI를 만들 때 쓴다.
pricing: oss
tags: [design-system, accessibility, forms, patterns, government]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
GOV.UK Design System은 영국 정부 서비스용 **스타일·컴포넌트·패턴** 가이드이고, 실제 코드는 npm 패키지 `govuk-frontend`(Sass·JavaScript·Nunjucks 템플릿)로 배포된다. 컴포넌트마다 "언제 쓰고 언제 쓰지 말지", 사용자 조사에서 확인한 내용, 알려진 접근성 이슈를 함께 적어 두는 것이 특징이다. 코드는 MIT, 문서는 Open Government Licence v3.0. 최신 릴리스 v6.6.0(2026-10-15), npm 월 다운로드 약 114만 건(2026-11 기준).

- README는 govuk-frontend 사용이 WCAG 2.2 AA 충족을 돕지만, 컴포넌트를 확장·수정했다면 서비스 자체 검사가 여전히 필요하다고 밝힌다.
- GDS Transport 서체와 GOV.UK 브랜드(헤더 크라운 로고 등)는 service.gov.uk 서비스용이다. 그 밖의 서비스는 [GOV.UK 브랜드 없이 쓰는 방법](https://frontend.design-system.service.gov.uk/using-govuk-frontend-without-govuk-branding/) 안내대로 일반 헤더와 Helvetica·Arial 계열 서체, 자체 에셋으로 바꿔 쓴다. 일반 개발자에게는 **패턴과 접근성 근거를 배우는 레퍼런스**로 쓸모가 크다.

## 설치
Node.js 12.17 이상, Dart Sass 1.79 이상이 필요하다.

```bash
npm install govuk-frontend --save
```

```scss
// main.scss
@use "node_modules/govuk-frontend/dist/govuk" as *;
```

`dist/govuk/assets` 의 images·fonts·manifest.json 을 앱 assets 로 복사하고, `<body class="govuk-template__body">` 맨 앞에 JS 지원 여부를 표시하는 인라인 스크립트(`js-enabled`, `govuk-frontend-supported` 클래스 추가)를 넣은 뒤 JavaScript를 초기화한다.

```html
<script type="module" src="/javascripts/govuk-frontend.min.js"></script>
<script type="module">
  import { initAll } from '/javascripts/govuk-frontend.min.js'
  initAll()
</script>
```

## 핵심 사용법
| 묶음 | 내용 |
| --- | --- |
| Styles | 레이아웃 그리드, 타이포그래피, 색, 간격, 이미지 |
| Components | 버튼, 텍스트 입력, 라디오·체크박스, 오류 요약(Error summary), 날짜 입력, 탭, 아코디언 등 |
| Patterns | 이름·주소·날짜 묻기, 오류 메시지, "한 페이지에 질문 하나", 계정 만들기, 확인 페이지 |

- **오류 처리 패턴.** 폼 제출 실패 시 페이지 상단의 Error summary 와 필드별 오류 메시지를 함께 쓰고, 요약의 링크로 해당 필드에 포커스를 옮긴다.
- **Nunjucks 매크로.** 각 컴포넌트는 HTML 예시와 `govukButton({ text: "저장" })` 같은 Nunjucks 매크로를 함께 제공한다. React 등 다른 프레임워크에서는 HTML 구조와 클래스를 그대로 옮겨 쓴다.

## 언제 쓰나
- 쓸 때: 공공·행정 서비스처럼 다양한 사용자가 폼을 끝까지 완료해야 하는 서비스를 설계할 때, 또는 폼 패턴·오류 문구의 근거를 찾을 때.
- 피할 때(대안): 브랜드 고유의 UI가 필요한 일반 제품이라면 [React Aria](/develop-wiki/frontend/ui-kit/react-aria/)·[Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/) 같은 헤드리스 라이브러리에 자체 스타일을 입힌다.

## 공식 문서
- [GOV.UK Design System](https://design-system.service.gov.uk) · [npm으로 설치](https://frontend.design-system.service.gov.uk/installing-with-npm/) · [govuk-frontend 저장소](https://github.com/alphagov/govuk-frontend)
