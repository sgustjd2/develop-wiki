---
name: 모던 JavaScript 튜토리얼 (javascript.info)
url: https://ko.javascript.info
docs: https://ko.javascript.info
repo: https://github.com/javascript-tutorial/ko.javascript.info
domain: frontend
category: learning
description: JavaScript 기초 문법부터 프로토타입·비동기·브라우저 DOM·이벤트까지 순서대로 설명하는 무료 온라인 튜토리얼. 한국어 번역판이 있다.
pricing: free
tags: [tutorial, javascript, dom, beginner]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
javascript.info("The Modern JavaScript Tutorial")는 Ilya Kantor가 쓰고 커뮤니티가 여러 언어로 번역하는 JavaScript 튜토리얼이다. 각 단원이 개념 설명 → 짧은 예제 → 직접 풀어 보는 과제(해답 포함) 구조로 되어 있어, 레퍼런스가 아니라 교재처럼 순서대로 읽기 좋다. 한국어판 [ko.javascript.info](https://ko.javascript.info)는 GitHub `javascript-tutorial/ko.javascript.info`에서 번역이 관리되며, 코어 JavaScript와 브라우저 파트의 주요 단원(클로저, 프로토타입, Promise·async/await, DOM, 이벤트 위임, fetch 등)이 번역돼 있다.

- 사이트는 무료로 읽을 수 있고, EPUB/PDF 판은 유료로 판매한다. 원문 저장소의 라이선스 안내에 따르면 읽기 외의 이용(재배포 등)은 저자 허락이 필요하다.

## 다루는 범위
| 파트 | 주요 단원 |
| --- | --- |
| 1. 코어 자바스크립트 | 기본 문법, 함수, 객체, 자료구조, 클로저·스코프, 프로토타입, 클래스, 에러 처리, Promise·async/await, 제너레이터, 모듈, Proxy |
| 2. 브라우저 | DOM 탐색·조작, 요소 크기·스크롤, 이벤트·버블링·위임, 폼, 문서 로딩 단계, MutationObserver |
| 3. 추가 주제 | 네트워크 요청(fetch, CORS, WebSocket), 브라우저 저장소(쿠키, localStorage, IndexedDB), 애니메이션, 웹 컴포넌트, 정규 표현식 |

## 활용법
1. **파트 1을 처음부터.** JavaScript를 다른 언어 경험으로 대충 익힌 상태라면 "객체: 기본", "함수 심화", "프로토타입과 프로토타입 상속" 단원이 특히 도움이 된다.
2. **과제를 꼭 푼다.** 단원 끝 과제는 개념을 잘못 이해한 지점을 드러내도록 짜여 있다. 해답은 직접 풀어 본 뒤 비교한다.
3. **프레임워크 전에 브라우저 파트.** React·Vue를 쓰더라도 이벤트 버블링, 문서 로딩 순서, 레이아웃 계산 같은 DOM 기초를 알면 디버깅이 쉬워진다.
4. **레퍼런스와 병행.** 메서드의 세부 인자·호환성은 [MDN](/develop-wiki/frontend/learning/mdn/)에서 확인한다.
5. **번역 기여.** 오역이나 미번역 단원은 한국어 저장소에 이슈·PR로 기여할 수 있다.

## 언제 쓰나
- 쓸 때: JavaScript를 처음 체계적으로 배우거나, 실무에서 쓰던 문법의 원리(this, 클로저, 이벤트 루프, 프로토타입)를 다시 정리할 때.
- 함께 보면 좋은 자료: 레퍼런스는 [MDN Web Docs](/develop-wiki/frontend/learning/mdn/), 성능·접근성 실무는 [web.dev](/develop-wiki/frontend/learning/web-dev/).

## 링크
- [한국어판](https://ko.javascript.info) · [영어 원문](https://javascript.info) · [한국어 번역 저장소](https://github.com/javascript-tutorial/ko.javascript.info) · [원문 저장소](https://github.com/javascript-tutorial/en.javascript.info)
