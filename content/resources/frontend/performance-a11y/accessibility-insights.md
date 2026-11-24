---
name: Accessibility Insights
url: https://accessibilityinsights.io
docs: https://accessibilityinsights.io/docs/web/overview/
repo: https://github.com/microsoft/accessibility-insights-web
stars: 966
domain: frontend
category: performance-a11y
description: Microsoft 가 만든 오픈소스 접근성 점검 도구. 웹용은 Chrome·Edge 확장으로 자동 검사와 탭 순서 시각화, WCAG 2.1 AA 단계별 수동 평가 가이드를 제공해 배포 전 접근성 점검에 쓴다.
pricing: oss
tags: [accessibility, wcag, a11y-testing, manual-testing, chrome-extension]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Accessibility Insights는 웹(Chrome·새 Microsoft Edge 확장)과 Windows 데스크톱 앱용 두 제품이 있다. 프론트엔드 개발자가 주로 쓰는 것은 **Accessibility Insights for Web** 으로, 자동 규칙 검사에 더해 사람이 직접 확인해야 하는 항목을 단계별로 안내하는 것이 [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/) 단독 사용과의 차이다. MIT 라이선스, 웹 확장 최신 릴리스 2.49.0(2026-09-08).

## 설치
Chrome 웹 스토어 또는 Microsoft Edge 애드온에서 "Accessibility Insights for Web" 을 설치한 뒤, 검사할 페이지에서 확장 아이콘을 눌러 기능을 고른다.

## 핵심 사용법
| 기능 | 내용 |
| --- | --- |
| FastPass | 2단계 빠른 점검. ① 약 50개 요구 사항 자동 검사 ② Tab stops: 탭 순서를 화면에 번호로 표시해 누락·키보드 트랩·잘못된 순서를 찾는다 |
| Assessment | WCAG 2.1 AA 준수 평가. 자동 검사 + 약 20개의 안내형 수동 테스트(대상 요소 표시·시각 보조 포함), 결과 보고서 내보내기 |
| Quick Assess | WCAG 2.1 AA 일부를 10개 요구 사항(자동·보조·수동)으로 빠르게 측정하는 축약 평가 |

- **권장 흐름.** 기능 개발이 끝나면 FastPass 로 자동 검사 + 탭 순서를 확인하고, 릴리스 전 핵심 화면은 Assessment 로 수동 항목까지 기록한다.
- **결과 공유.** Export result 로 결과를 HTML 보고서로 저장해 이슈에 첨부할 수 있다.

## 언제 쓰나
- 쓸 때: 자동 검사만으로는 잡히지 않는 키보드 접근성·포커스 순서를 체계적으로 확인하고 싶을 때, 접근성 전문가 없이 팀이 기본 점검을 해야 할 때.
- 피할 때(대안): CI 에서 자동 회귀 검사를 돌리려면 [axe-core](/develop-wiki/frontend/performance-a11y/axe-core/)·[Pa11y](/develop-wiki/frontend/performance-a11y/pa11y/)를 테스트 코드에 넣는다. 이 도구는 브라우저에서 사람이 쓰는 점검용이다.

## 공식 문서
- [Web 개요](https://accessibilityinsights.io/docs/web/overview/) · [accessibility-insights-web 저장소](https://github.com/microsoft/accessibility-insights-web)
