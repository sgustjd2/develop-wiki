---
name: WAI-ARIA Authoring Practices Guide (APG)
url: https://www.w3.org/WAI/ARIA/apg/
docs: https://www.w3.org/WAI/ARIA/apg/patterns/
repo: https://github.com/w3c/aria-practices
stars: 1365
domain: frontend
category: learning
description: W3C WAI 가 만든 접근성 위젯 구현 가이드. 탭·콤보박스·모달 같은 30개 패턴의 키보드 동작, ARIA 역할·속성, 동작하는 예제를 제공해 커스텀 컴포넌트를 만들 때 기준으로 쓴다.
pricing: free
tags: [accessibility, aria, keyboard, patterns, w3c]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
APG(ARIA Authoring Practices Guide)는 W3C Web Accessibility Initiative가 ARIA 명세를 실제 UI에 적용하는 방법을 정리한 문서다. 명세가 "역할과 속성의 의미"를 정의한다면, APG는 "탭 컴포넌트라면 화살표 키로 탭을 옮기고 `aria-selected` 를 바꾼다" 같은 **구현 관례**를 패턴별로 보여 준다. 문서는 W3C Software and Document License로 GitHub(`w3c/aria-practices`)에서 관리되며 2026-11 현재도 커밋이 이어지고 있다.

## 구성
| 섹션 | 내용 |
| --- | --- |
| Patterns | 30개 패턴: Accordion, Alert, Alert and Message Dialogs, Breadcrumb, Button, Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Landmarks, Link, Listbox, Menu and Menubar, Menu Button, Meter, Radio Group, Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View, Treegrid, Window Splitter |
| Practices | 랜드마크, 접근 가능한 이름·설명 제공, 키보드 인터페이스 설계 같은 공통 원칙 |
| Index | 예제에 쓰인 ARIA 역할·속성별 색인 |

각 패턴 페이지는 **설명 → 예제 링크 → Keyboard Interaction(키 동작 표) → WAI-ARIA Roles, States, and Properties** 순서로 되어 있다.

## 활용법
1. 만들려는 컴포넌트와 가장 가까운 패턴을 고른다(예: 자동완성 입력 → Combobox, 펼침 메뉴 → Menu Button 또는 Disclosure).
2. Keyboard Interaction 표를 그대로 테스트 케이스로 옮긴다(`Escape` 로 닫힘, `Home`/`End` 이동 등).
3. 역할·속성 목록으로 마크업을 검토하고, 예제 페이지를 [NVDA](/develop-wiki/frontend/performance-a11y/nvda/)·[VoiceOver](/develop-wiki/frontend/performance-a11y/voiceover/)로 직접 들어 본다.

- **네이티브 요소 우선.** 버튼·체크박스처럼 HTML 요소로 해결되면 ARIA를 덧붙이기보다 네이티브 요소를 쓰는 것이 APG 전반의 전제다.
- **예제는 참고용.** APG 예제는 패턴 설명용이라 그대로 제품 코드로 쓰기보다, [React Aria](/develop-wiki/frontend/ui-kit/react-aria/)·[Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/) 같은 검증된 헤드리스 라이브러리의 동작을 비교하는 기준으로 쓰는 편이 안전하다.

## 언제 쓰나
- 디자인 시스템에서 커스텀 드롭다운·탭·트리를 직접 구현하거나, 라이브러리 컴포넌트의 키보드 동작이 표준 관례와 맞는지 리뷰할 때.

## 공식 문서
- [APG 홈](https://www.w3.org/WAI/ARIA/apg/) · [Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) · [Practices](https://www.w3.org/WAI/ARIA/apg/practices/) · [GitHub](https://github.com/w3c/aria-practices)
