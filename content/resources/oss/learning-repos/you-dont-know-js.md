---
name: You Don't Know JS Yet
url: https://github.com/getify/You-Dont-Know-JS
repo: https://github.com/getify/You-Dont-Know-JS
stars: 184867
domain: oss
category: learning-repos
description: JavaScript 언어의 동작 원리(스코프, 클로저, this, 객체, 타입 변환)를 깊이 파고드는 Kyle Simpson 의 책 시리즈를 무료로 읽을 수 있는 저장소. 문법을 아는 개발자가 언어를 제대로 이해하려 할 때 쓴다.
pricing: free
tags: [javascript, book, closures, scope, language-internals]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Kyle Simpson(getify)의 JavaScript 책 시리즈 원고 저장소로, 책 전체를 GitHub 에서 무료로 읽을 수 있다. 문법 사용법보다 **엔진이 실제로 어떻게 동작하는지**(렉시컬 스코프, 호이스팅, 클로저, 프로토타입, 강제 형변환)를 설명하는 데 초점이 있다. 2026-11 기준 별 약 18.5만. 라이선스는 **CC BY-NC-ND 4.0**(비영리·변경 금지)이라 오픈소스 라이선스가 아니므로 `pricing: free` 로 둔다.

기본 브랜치는 **2판(You Don't Know JS Yet)** 이다. 2판 계획 중 일부만 완성됐다: Get Started, Scope & Closures 는 출간, Objects & Classes 는 "draft stable", Types & Grammar 는 "rough draft", Sync & Async 와 ES.Next & Beyond 는 취소됐다(README 표기). 1판 6권은 `1st-ed` 브랜치에 그대로 있다. 저장소는 archived 아니며 마지막 커밋은 2026-10-31(최근 6개월 2건)이다.

## 무엇이 들어 있나
| 책 | 상태(2판) | 내용 |
| --- | --- | --- |
| Get Started | 출간 | JS 의 성격, 프로그램 구조, 시리즈 읽는 법 |
| Scope & Closures | 출간 | 렉시컬 스코프, 스코프 체인, 호이스팅, 모듈 패턴, 클로저 |
| Objects & Classes | draft stable | 객체, `this`, 프로토타입, `class` |
| Types & Grammar | rough draft | 원시 타입, 강제 형변환, 문법 세부 |
| 1판(`1st-ed` 브랜치) | 완결 | Up & Going, Scope & Closures, this & Object Prototypes, Types & Grammar, Async & Performance, ES6 & Beyond |

## 이렇게 활용하라
1. **2판 Get Started → Scope & Closures 순서로 읽는다.** README 가 권하는 순서다.
2. **예제를 브라우저 콘솔이나 Node.js REPL 에서 직접 실행한다.** 특히 호이스팅·TDZ·클로저 예제는 결과를 예측한 뒤 실행해 본다.
   ```js
   for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 3 3 3
   for (let j = 0; j < 3; j++) setTimeout(() => console.log(j));  // 0 1 2
   ```
3. **2판에 없는 비동기 주제는 1판으로 보완한다.** `1st-ed` 브랜치의 Async & Performance 를 읽되, `async/await` 이후 변화는 [javascript.info](/develop-wiki/frontend/learning/javascript-info/) 와 [MDN](/develop-wiki/frontend/learning/mdn/) 으로 확인한다.
4. **이 사이트의 [이벤트 루프](/develop-wiki/knowledge/cs-fundamentals/event-loop/) 노트와 연결한다.** 클로저·비동기 동작을 런타임 관점에서 다시 정리한다.

## 주의
- 2판은 완결되지 않았다. 일부 권은 초안이고 두 권은 취소됐다.
- 1판은 ES6(2015) 시점 기준이라 최신 문법은 다루지 않는다.
- 저장소에 한국어 번역은 없다.

## 링크
- [저장소 README(2판)](https://github.com/getify/You-Dont-Know-JS) · [1판 브랜치](https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/README.md)
- 이 사이트: [freeCodeCamp](/develop-wiki/oss/learning-repos/freecodecamp/)(입문) · [TypeScript 언어](/develop-wiki/languages/typescript/)
