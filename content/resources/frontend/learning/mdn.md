---
name: MDN Web Docs
url: https://developer.mozilla.org
docs: https://developer.mozilla.org/ko/docs/Web
repo: https://github.com/mdn/content
stars: 11157
domain: frontend
category: learning
description: Mozilla가 운영하는 HTML·CSS·JavaScript·Web API 레퍼런스와 학습 가이드. 표준 동작과 브라우저 호환성을 확인하는 기본 문서다.
pricing: oss
tags: [reference, html, css, javascript, web-api, browser-compat]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
MDN Web Docs는 Mozilla가 커뮤니티와 함께 관리하는 웹 플랫폼 문서다. HTML 요소·속성, CSS 속성·선택자, JavaScript 언어와 내장 객체, DOM·Fetch·Canvas 같은 Web API의 레퍼런스와, 초보자용 학습 과정(Learn web development)을 한곳에 담고 있다. 각 페이지 하단의 브라우저 호환성 표는 별도 저장소 `mdn/browser-compat-data`에서 생성되며 Can I use 등 다른 도구도 이 데이터를 쓴다. 본문은 GitHub `mdn/content`(영어 원문)와 `mdn/translated-content`(번역)에서 관리되며, 산문은 CC-BY-SA 2.5 라이선스이고 코드 예제는 별도의 더 자유로운 라이선스로 제공된다.

- 한국어판(`/ko/`)은 커뮤니티 번역으로, JavaScript 안내서·레퍼런스, HTML 요소 레퍼런스 등 핵심 문서가 번역돼 있다. 번역이 영어 원문보다 늦을 수 있어 최신 내용은 영어판과 비교한다.

## 다루는 범위
| 영역 | 내용 |
| --- | --- |
| HTML | 요소·전역 속성 레퍼런스, 폼·이미지·반응형 이미지 가이드 |
| CSS | 속성·선택자·@규칙 레퍼런스, Flexbox·Grid·애니메이션 가이드, 레이아웃 쿡북 |
| JavaScript | 안내서(문법, 함수, 객체, Promise, 모듈), 표준 내장 객체·연산자·문장 레퍼런스 |
| Web API | DOM, Fetch, Storage, Web Workers, Canvas, Intersection Observer 등 |
| 학습 과정 | Learn web development — HTML·CSS·JS 기초부터 접근성·프레임워크 입문까지 |
| 기타 | 용어 사전(Glossary), HTTP 헤더·상태 코드, SVG·MathML, 보안(CSP, CORS) |
| 호환성 | 페이지마다 브라우저·버전별 지원 표, Baseline 표시 |

## 활용법
1. **검색 엔진에 `mdn`을 붙인다.** `mdn array flatMap`, `mdn css container query`처럼 검색하면 블로그 글보다 표준에 맞는 설명이 먼저 나온다. 사이트 안 검색도 빠르다.
2. **레퍼런스 페이지는 구조로 읽는다.** 구문(Syntax) → 매개변수·반환값 → 예제 → 명세(Specifications) → 브라우저 호환성 순서다. 실무 판단은 대개 마지막 호환성 표와 Baseline 표시로 한다.
3. **Baseline 표시 확인.** "Widely available"이면 주요 브라우저에서 충분히 오래 지원된 기능이라 폴리필 없이 쓰기 좋다.
4. **영어·한국어 전환.** 한국어 문서 상단의 언어 선택으로 원문과 비교하고, 번역 오류는 `mdn/translated-content`에 이슈·PR로 기여할 수 있다.
5. **입문자는 Learn 과정부터.** 레퍼런스보다 학습 과정(Learn web development)을 순서대로 따라가며 각 단원의 평가 과제를 직접 푼다.

## 언제 쓰나
- 쓸 때: API의 정확한 동작·인자·반환값을 확인할 때, 기능을 써도 되는지 브라우저 지원을 판단할 때, 웹 기초를 체계적으로 배울 때.
- 함께 보면 좋은 자료: 성능·접근성·모던 패턴 가이드는 [web.dev](/develop-wiki/frontend/learning/web-dev/), JavaScript 언어를 처음부터 차례로 익히려면 [모던 JavaScript 튜토리얼](/develop-wiki/frontend/learning/javascript-info/), 기능별 지원 현황을 한눈에 보려면 [Can I use](/develop-wiki/frontend/learning/caniuse/).

## 링크
- [Web 기술 문서(한국어)](https://developer.mozilla.org/ko/docs/Web) · [JavaScript 안내서(한국어)](https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide) · [Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development)
- [mdn/content](https://github.com/mdn/content) · [mdn/translated-content](https://github.com/mdn/translated-content) · [browser-compat-data](https://github.com/mdn/browser-compat-data)
