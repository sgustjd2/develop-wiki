---
title: 디자인 시스템 구조 — 아토믹 디자인과 기초·컴포넌트·패턴 계층
aka: [Design System Architecture, Atomic Design, Atoms Molecules Organisms, Foundations, Components, Patterns, Pattern Library]
category: ui-ux
group: design-system
level: intermediate
summary: 디자인 시스템을 기초(토큰·원칙) → 컴포넌트 → 패턴(조합된 해법) 계층으로 나누고, 아토믹 디자인(원자·분자·유기체·템플릿·페이지)을 부분과 전체를 오가는 사고 모델로 쓰는 방법.
tags: [design-system, atomic-design, component-library, architecture]
related: [ui-ux/design-tokens, ui-ux/component-api-variants-slots, ui-ux/design-system-governance, design-patterns/composite, principles/coupling-and-cohesion]
sources:
  - https://atomicdesign.bradfrost.com/chapter-2/
  - https://atomicdesign.bradfrost.com/chapter-5/
  - https://m3.material.io/styles/color/roles
  - https://developer.apple.com/design/human-interface-guidelines/layout
updatedAt: 2026-11-19
---

## 문제

- "디자인 시스템 = Figma 컴포넌트 모음"으로 시작하면 어디까지가 시스템이고 어디부터가 제품 화면인지 경계가 없다.
- 버튼은 잘 통일됐는데 "검색 결과 없음", "폼 오류 표시" 같은 조합된 상황은 팀마다 다르게 만든다.

## 해법

### 1. 세 계층

| 계층 | 담는 것 | 예 | 바뀌는 빈도 |
| --- | --- | --- | --- |
| 기초(Foundations) | 원칙, 디자인 토큰(색·타입·간격·모션·모양), 아이콘, 접근성 기준 | `color.primary`, 타입 스케일 | 드묾 |
| 컴포넌트(Components) | 상태·변형·접근성이 정의된 재사용 UI 부품 + 코드 | Button, TextField, Dialog | 보통 |
| 패턴(Patterns) | 여러 컴포넌트를 조합해 반복 문제를 푸는 해법과 지침 | 폼 검증 표시, 빈 상태, 검색·필터, 온보딩 | 잦음 |

아래 계층은 위 계층을 모른다. 패턴은 컴포넌트를, 컴포넌트는 토큰을 참조하고 그 반대는 없다.

### 2. 아토믹 디자인 (Brad Frost)

화학에서 빌린 다섯 단계:

| 단계 | 의미 | 예 |
| --- | --- | --- |
| 원자(Atoms) | 더 쪼개면 기능을 잃는 기본 요소 | label, input, button |
| 분자(Molecules) | 원자 몇 개가 한 단위로 동작. 단일 책임을 지키면 테스트·재사용이 쉽다 | 검색 폼(label+input+button) |
| 유기체(Organisms) | 분자·원자·다른 유기체로 만든 비교적 큰 영역 | 헤더, 상품 그리드 |
| 템플릿(Templates) | 컴포넌트를 레이아웃에 배치해 콘텐츠 구조를 보여 줌 | 상품 상세 페이지 뼈대 |
| 페이지(Pages) | 템플릿에 실제 대표 콘텐츠를 넣은 것. 시스템이 버티는지 검증 | 장바구니 0개/100개 상태 |

Frost 는 이것이 **순서대로 밟는 공정이 아니라** 부분과 전체를 동시에 보는 사고 모델이라고 강조한다.

```
src/
  tokens/        # 기초: 생성된 CSS 변수·TS 상수
  components/    # Button/, TextField/, Dialog/ (각각 코드·스토리·테스트·문서)
  patterns/      # FormField(라벨+입력+오류), EmptyState, FilterBar
```

## 언제 쓰나

- 여러 제품·팀이 같은 UI 언어를 써야 할 때, 또는 한 제품이라도 화면이 수십 개를 넘어 일관성이 깨지기 시작할 때.
- 아토믹 단계 이름은 팀 내 공통 어휘로 유용하지만, 폴더 구조로 그대로 강제할 필요는 없다.

## 체크리스트

- [ ] 각 컴포넌트에 상태(기본·호버·포커스·눌림·비활성·오류)와 변형이 문서화
- [ ] 컴포넌트 문서에 "언제 쓰지 않나"가 있다
- [ ] 패턴 문서는 실제 제품 사례와 함께 있다
- [ ] 디자인 도구 라이브러리와 코드 라이브러리 이름이 같다
- [ ] 페이지 단계에서 극단값(긴 텍스트, 빈 목록, 오류)으로 검증

## 흔한 실수

- "이게 분자냐 유기체냐" 분류 논쟁에 시간 소모. 분류보다 재사용 경계가 중요하다.
- 한 화면에서만 쓰는 조합까지 시스템 컴포넌트로 승격 → 시스템이 비대해진다. Frost 도 여러 제품에서 반복될 때만 추가하라고 권한다.
- 디자인 라이브러리만 있고 코드가 없음(또는 반대) → 둘이 금방 어긋난다.

## 주의 (비용)

- 디자인 시스템은 프로젝트가 아니라 **제품**으로 다뤄야 한다(Frost, 5장). 전담 시간·예산·사람 없이 만들면 출시 후 유지되지 않는다.
- 계층을 너무 엄격히 하면 제품팀이 시스템을 우회해 로컬 복사본을 만든다. 기여 경로와 예외 절차를 함께 설계한다.
- 기성 UI 키트([MUI](/develop-wiki/frontend/ui-kit/mui/), [shadcn/ui](/develop-wiki/frontend/ui-kit/shadcn-ui/) 등)를 기반으로 하면 초기 비용은 줄지만 키트의 설계 결정을 물려받는다.
