---
name: Awesome JavaScript
url: https://github.com/sorrycc/awesome-javascript
repo: https://github.com/sorrycc/awesome-javascript
stars: 35039
domain: oss
category: awesome-lists
description: 브라우저용 JavaScript 라이브러리를 기능별(날짜, 차트, 폼, 애니메이션, 테이블 등)로 모은 목록. 특정 UI 기능을 구현할 라이브러리 후보를 찾을 때 쓴다.
pricing: oss
tags: [awesome, javascript, browser, libraries]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
sorrycc 가 관리하는 목록으로, 패키지 매니저·번들러 같은 빌드 도구부터 날짜·문자열·정규식 유틸리티, 슬라이더·모달·테이블 같은 UI 위젯까지 **브라우저 JavaScript 라이브러리**를 아주 잘게 분류한다. 2026-11 기준 별 약 3.5만, 라이선스 CC0(README 표기). 최근 6개월 커밋 14건, 마지막 2026-11-10.

## 무엇이 들어 있나
| 영역 | 대표 섹션 |
| --- | --- |
| 빌드·품질 | Package Managers, Loaders, Transpilers, Bundlers, Minimizers, Type Checkers, Testing Frameworks, QA Tools |
| 프레임워크 | MVC Frameworks and Libraries, Frameworks, Boilerplates, Templating Engines |
| 데이터·유틸 | Data Structure, Date, String, Number, Storage, RegExp, I18n And L10n, Validation, Full Text Search |
| UI 위젯 | Form Widgets, Modals and Popups, Sliders, Table/Grid, Notifications, Tours And Guides, Menu, Scroll |
| 시각화·미디어 | Data Visualization, Maps, Video/Audio, Animations, Image Processing, Typography |
| 기타 | Web Worker, WebSockets, Generative AI, Worth Reading(읽을거리) |

## 이렇게 활용하라
1. **구현할 UI 기능 이름으로 검색한다.** 예: "Table/Grid", "Date", "Animations".
2. **번들 크기와 유지보수를 확인한다.** bundlephobia 등에서 크기를, GitHub 에서 마지막 릴리스를 본다.
3. **프레임워크 전용 대안이 있는지 본다.** React·Vue 를 쓰면 [Awesome React](/develop-wiki/oss/awesome-lists/awesome-react/) 쪽 라이브러리가 더 자연스럽게 맞을 수 있다.
4. **브라우저 내장 기능으로 되는지 먼저 따진다.** `Intl`(날짜·숫자 포맷), `<dialog>`, CSS 애니메이션·스크롤 스냅은 라이브러리 없이 가능하다.

## 주의
- 역사가 긴 목록이라 Bower, Grunt, jQuery 시절 항목이 일부 남아 있다. 마지막 커밋이 몇 년 전인 라이브러리는 피한다.
- 한국어 번역은 없다.

## 링크
- [저장소 README](https://github.com/sorrycc/awesome-javascript)
- 이 사이트: [Vite](/develop-wiki/frontend/build-tooling/vite/) · [Awesome Node.js](/develop-wiki/oss/awesome-lists/awesome-nodejs/) · [javascript.info](/develop-wiki/frontend/learning/javascript-info/)
