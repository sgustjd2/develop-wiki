---
name: web.dev
url: https://web.dev
docs: https://web.dev/learn
domain: frontend
category: learning
description: Google Chrome 팀이 운영하는 웹 개발 가이드 사이트. 성능(Core Web Vitals)·접근성·HTML·CSS 강좌와 Baseline 정보를 제공한다.
pricing: free
tags: [guide, performance, accessibility, web-vitals, css, baseline]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
web.dev는 Google Chrome 팀이 운영하는 웹 개발 안내 사이트로, 레퍼런스보다는 "어떻게 잘 만드는가"에 초점을 둔 글과 강좌를 제공한다. Core Web Vitals 지표의 정의와 개선 방법, 이미지·폰트 최적화, 접근성, 반응형 디자인, 폼 같은 주제를 다루고, 체계적인 무료 강좌(Learn HTML, Learn CSS, Learn JavaScript, Learn Performance, Learn Accessibility 등)를 운영한다. 웹 기능이 주요 브라우저에서 언제부터 안정적으로 쓸 수 있는지 알려 주는 **Baseline** 정보와 블로그도 이곳에 있다.

- 사이트 소스였던 GitHub 저장소 `GoogleChrome/web.dev`는 archived 상태이며, 사이트 자체는 계속 갱신된다.
- 일부 글은 한국어 등 여러 언어로 제공되지만 번역 범위가 글마다 달라 핵심 강좌는 영어 기준으로 본다.

## 다루는 범위
| 영역 | 내용 |
| --- | --- |
| 성능 | Core Web Vitals(LCP·INP·CLS) 정의·측정·최적화, 로딩·렌더링·캐시 전략 |
| 강좌(Learn) | HTML, CSS, JavaScript, 성능, 접근성, 폼, 이미지, 반응형 디자인 등 단계별 과정 |
| 접근성 | 의미 있는 마크업, 포커스 관리, 명도 대비, ARIA 사용법 |
| Baseline | 기능별 브라우저 지원 상태(Newly / Widely available)와 활용 방법 |
| 패턴·사례 | UI 패턴 예제 코드, 기업 성능 개선 사례 연구 |
| 측정 도구 연계 | [Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/), PageSpeed Insights, [web-vitals](/develop-wiki/frontend/performance-a11y/web-vitals/) 라이브러리 사용 가이드 |

## 활용법
1. **성능 개선의 출발점으로.** 지표가 나쁘게 나오면 해당 지표 문서(예: "Optimize LCP")를 열어 원인별 체크리스트를 따라간다. 각 글이 측정 → 원인 진단 → 개선 순서로 정리돼 있다.
2. **강좌는 순서대로.** Learn CSS나 Learn Accessibility는 모듈이 짧게 나뉘어 있어 하루 한두 모듈씩 진행하기 좋다. 모듈 끝의 확인 문제로 이해도를 점검한다.
3. **새 CSS·HTML 기능 도입 판단.** Baseline 상태를 보고 "Widely available"이면 바로, "Newly available"이면 지원 대상 브라우저를 확인한 뒤 쓴다.
4. **MDN과 나눠 쓰기.** 개념·모범 사례는 web.dev, 정확한 API 문법·호환성 표는 [MDN](/develop-wiki/frontend/learning/mdn/)에서 확인한다.

## 언제 쓰나
- 쓸 때: Core Web Vitals를 개선해야 할 때, 접근성·반응형·이미지 최적화 같은 실무 품질 주제를 공부할 때, 새 웹 플랫폼 기능의 도입 시점을 판단할 때.
- 주의: Chrome 팀 관점의 자료라 Chrome에서 먼저 지원하는 기능 소개가 많다. 다른 브라우저 지원은 Baseline·[Can I use](/develop-wiki/frontend/learning/caniuse/)로 확인한다.

## 링크
- [Learn 강좌 목록](https://web.dev/learn) · [Web Vitals](https://web.dev/articles/vitals) · [INP](https://web.dev/articles/inp)
- [Baseline](https://web.dev/baseline) · [블로그](https://web.dev/blog)
