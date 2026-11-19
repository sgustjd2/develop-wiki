---
name: How to Meet WCAG (Quick Reference)
url: https://www.w3.org/WAI/WCAG22/quickref/
docs: https://www.w3.org/WAI/standards-guidelines/wcag/
repo: https://github.com/w3c/wai-wcag-quickref
stars: 85
domain: frontend
category: learning
description: W3C 의 WCAG 2.2·2.1·2.0 성공 기준과 충족 기법을 버전·수준(A/AA/AAA)·기술별로 필터링해 보는 공식 빠른 참조. 접근성 요구 사항을 확인하거나 감사 결과의 근거를 찾을 때 쓴다.
pricing: free
tags: [accessibility, wcag, reference, w3c, compliance]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
"How to Meet WCAG (Quick Reference)"는 W3C WAI가 제공하는 WCAG 2 맞춤형 참조 페이지다. WCAG 본문은 법률 문서처럼 길고 추상적이어서, 실무에서는 이 페이지에서 성공 기준(Success Criterion)을 찾고 각 기준의 **Understanding**(취지 설명)과 **Techniques**(충족·실패 기법)로 들어가는 방식으로 쓴다.

- WCAG 2.2는 2023-10-05 W3C 권고안이 됐다. 2.1 대비 성공 기준 9개가 추가되고 4.1.1 Parsing은 폐기(obsolete)됐다.
- 2.2 신규 기준: 2.4.11 Focus Not Obscured (Minimum, AA), 2.4.12 (Enhanced, AAA), 2.4.13 Focus Appearance (AAA), 2.5.7 Dragging Movements (AA), 2.5.8 Target Size (Minimum, AA), 3.2.6 Consistent Help (A), 3.3.7 Redundant Entry (A), 3.3.8 Accessible Authentication (Minimum, AA), 3.3.9 (Enhanced, AAA).

## 사용법
1. 상단 필터에서 **WCAG 버전**(2.2/2.1/2.0, 또는 2.2·2.1에서 새로 추가된 기준만)과 **수준**(A·AA·AAA)을 고른다. 대부분의 법·조달 요구는 AA다.
2. 기술 필터로 해당 없는 기법(예: Flash, PDF)을 숨긴다.
3. 기준을 펼쳐 Sufficient Techniques(충족 기법), Advisory Techniques(권장), Failures(대표 실패 사례)를 확인한다.
4. 필터 상태는 URL에 남으므로 팀 체크리스트 링크로 공유한다.

## 자주 찾는 기준
| 기준 | 수준 | 실무 포인트 |
| --- | --- | --- |
| 1.1.1 Non-text Content | A | 의미 있는 이미지에 대체 텍스트, 장식 이미지는 `alt=""` |
| 1.4.3 Contrast (Minimum) | AA | 본문 4.5:1, 큰 글자 3:1 — [WebAIM Contrast Checker](/develop-wiki/frontend/performance-a11y/webaim-contrast-checker/)로 확인 |
| 2.1.1 Keyboard | A | 모든 기능을 키보드로 사용 가능 |
| 2.4.7 Focus Visible | AA | 포커스 표시를 없애지 않는다 |
| 2.5.8 Target Size (Minimum) | AA | 포인터 대상 최소 24×24 CSS px(예외 있음) |
| 4.1.2 Name, Role, Value | A | 커스텀 컨트롤에 이름·역할·상태 제공 — [APG](/develop-wiki/frontend/learning/wai-aria-apg/) 참고 |

## 언제 쓰나
- 접근성 요구 사항을 기획·QA 체크리스트로 옮길 때, 자동 검사 도구([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/))가 보고한 규칙의 근거 기준을 확인할 때.
- 체크리스트 형태로 가볍게 보려면 [The A11Y Project 체크리스트](/develop-wiki/frontend/learning/a11y-project/)가 더 읽기 쉽다.

## 공식 문서
- [Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) · [WCAG 2.2의 새 기준](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) · [WCAG 개요](https://www.w3.org/WAI/standards-guidelines/wcag/)
