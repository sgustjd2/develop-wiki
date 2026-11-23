---
name: Can I use
url: https://caniuse.com
docs: https://caniuse.com/about
repo: https://github.com/Fyrd/caniuse
stars: 5886
domain: frontend
category: learning
description: HTML·CSS·JavaScript·Web API 기능의 브라우저별 지원 현황과 사용 점유율을 표로 보여 주는 사이트. 새 기능을 써도 되는지 판단할 때 쓴다.
pricing: free
tags: [browser-compat, reference, css, html, javascript]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Can I use는 웹 기능(예: CSS `:has()`, Container Queries, View Transitions, `structuredClone`)을 검색하면 브라우저·버전별 지원 여부, 부분 지원 조건, 알려진 이슈, 그리고 전 세계 또는 국가별 사용자 비율 기준의 지원 점유율을 보여 주는 사이트다. Alexis Deveria가 만들고 관리하며, 자체 지원 데이터는 GitHub `Fyrd/caniuse`(CC BY 4.0)에 공개돼 있고 일부 항목은 MDN의 `browser-compat-data`를 함께 쓴다.

- 같은 데이터가 Browserslist·Autoprefixer 등 빌드 도구의 브라우저 대상 계산에 쓰인다(`caniuse-lite` 패키지).

## 다루는 범위
| 항목 | 내용 |
| --- | --- |
| 지원 표 | 데스크톱·모바일 브라우저 버전별 지원(지원/부분 지원/미지원/플래그 필요) |
| 주석 | 부분 지원 조건, 접두사 필요 여부, 알려진 버그 |
| 사용 점유율 | 전 세계 기준과 국가별(예: 대한민국) 기준 지원 비율 |
| 기준 | 명세 상태와 관련 문서 링크(MDN, 명세) |
| 비교 | 여러 기능 동시 비교, 브라우저 간 비교 |
| 데이터 | `fulldata-json/data-2.0.json`으로 원본 데이터 제공 |

## 활용법
1. **국가별 점유율로 판단.** 설정에서 대상 국가를 대한민국으로 추가하면 국내 사용자 기준 지원 비율이 함께 표시된다. 국내 서비스라면 이 수치로 결정한다.
2. **부분 지원 주석 읽기.** 노란색(부분 지원) 칸의 번호 주석에 "특정 속성만 지원" 같은 조건이 있어, 실제 쓰려는 방식이 되는지 확인한다.
3. **Browserslist와 맞추기.** 프로젝트의 `browserslist` 설정(`> 0.5%, last 2 versions` 등)이 어떤 브라우저를 포함하는지 `npx browserslist`로 보고, 그 브라우저 기준으로 Can I use 표를 확인한다.
4. **Baseline과 교차 확인.** [web.dev](/develop-wiki/frontend/learning/web-dev/)·[MDN](/develop-wiki/frontend/learning/mdn/)의 Baseline 표시로 "주요 브라우저에서 충분히 오래 지원됐는지"를 함께 본다.

## 언제 쓰나
- 쓸 때: 새 CSS·HTML·JS 기능을 도입하기 전, 폴리필·대체 스타일이 필요한지 판단할 때, 브라우저 지원 범위 논의 근거가 필요할 때.
- 주의: 기능의 사용법 설명은 짧다. 문법·예제는 [MDN Web Docs](/develop-wiki/frontend/learning/mdn/)를 본다.

## 링크
- [Can I use](https://caniuse.com) · [소개](https://caniuse.com/about) · [데이터 저장소](https://github.com/Fyrd/caniuse) · [MDN browser-compat-data](https://github.com/mdn/browser-compat-data)
