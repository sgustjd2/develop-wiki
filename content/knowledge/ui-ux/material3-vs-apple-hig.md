---
title: Material Design 3 vs Apple HIG
aka: [Material Design 3, M3, Material You, M3 Expressive, Apple Human Interface Guidelines, HIG, Liquid Glass]
category: ui-ux
group: design-system
level: intermediate
summary: 구글 Material Design 3 와 Apple Human Interface Guidelines 를 색·타입·레이아웃·모션·터치 영역·컴포넌트 철학 기준으로 비교하고, 크로스플랫폼 제품에서 어디까지 플랫폼 관례를 따를지 정하는 기준.
tags: [design-system, material-design, apple-hig, mobile, cross-platform]
related: [ui-ux/design-system-structure, ui-ux/color-system-semantic-roles, ui-ux/motion-design-principles, mobile-dev/cross-platform-architecture, mobile-dev/mobile-accessibility-basics, ui-ux/touch-target-size]
sources:
  - https://m3.material.io/styles/color/system/how-the-system-works
  - https://m3.material.io/styles/typography/overview
  - https://m3.material.io/styles/motion/overview/how-it-works
  - https://m3.material.io/foundations/designing/structure
  - https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
  - https://developer.apple.com/design/human-interface-guidelines/typography
  - https://developer.apple.com/design/human-interface-guidelines/materials
  - https://developer.apple.com/design/human-interface-guidelines/accessibility
  - https://developer.apple.com/design/human-interface-guidelines/dark-mode
updatedAt: 2026-11-19
---

## 문제

- iOS·Android·웹을 한 디자인으로 만들면 어느 플랫폼에서도 "남의 앱" 같아진다. 반대로 플랫폼마다 따로 만들면 비용이 두 배다.
- 두 가이드라인은 철학이 달라서, 한쪽 규칙을 다른 쪽에 그대로 옮기면 어긋난다.

## 비교

| 축 | Material Design 3 (Google) | Apple HIG |
| --- | --- | --- |
| 성격 | 디자인 시스템 + 공개 컴포넌트·토큰 명세. 브랜드 테마를 입혀 쓰도록 설계 | 플랫폼 관례 가이드. 시스템 컴포넌트를 쓰면 대부분 자동 적용 |
| 대상 | Android, Flutter, 웹(Material Web), Compose | iOS, iPadOS, macOS, watchOS, tvOS, visionOS |
| 색 | 26개 표준 색 역할, HCT 톤 팔레트. **동적 색**: 배경화면·콘텐츠에서 원천색 추출. 표준·중간·높은 대비 3단계 | 시스템 의미 색(라이트·다크·고대비 변형 내장). 커스텀 색은 라이트/다크 + 고대비 변형을 직접 제공 |
| 다크 모드 | 같은 역할 집합에 다크 톤 자동 배정, surface container 5단계로 깊이 | base/elevated 배경 두 세트로 깊이. 앱 전용 테마 설정은 지양 |
| 타이포 | display·headline·title·body·label × L/M/S = 15개 기본 + 15개 강조 스타일(2025). Roboto 계열, 가변 폰트 활용 | 시스템 폰트 SF·New York, 텍스트 스타일 + **Dynamic Type**. iOS 기본 17pt, 최소 11pt |
| 레이아웃 | 창 크기 클래스(compact <600dp, medium, expanded ≥840dp, large, extra-large), 그리드·rulers, canonical layouts | 안전 영역·레이아웃 가이드, 읽기 순서·정렬·그룹 원칙, 플랫폼별 관례(사이드바·탭 바) |
| 재질·깊이 | 톤(surface 색) 중심 | **Liquid Glass**: 컨트롤·내비게이션을 콘텐츠 위 떠 있는 기능 층으로 분리. 콘텐츠 층에는 쓰지 않음 |
| 모션 | 2025-05 M3 Expressive 부터 스프링 물리 시스템(expressive/standard 스킴, spatial/effects 토큰)을 도입(easing·duration 토큰과 함께 제공, 대체 범위는 미확인) | 목적 있는 짧은 모션, 사용자 제스처를 따르는 사실적 피드백, 취소 가능, Reduce Motion 존중 |
| 터치 영역 | 대부분 플랫폼에서 48×48dp 이상 권장 | iOS 기본 컨트롤 44×44pt(최소 28×28pt), visionOS 60×60pt |
| 대비 | 역할 짝이 최소 3:1, 고대비 테마 7:1 | 17pt 이하 4.5:1, 18pt 이상·굵은 글씨 3:1 |
| 아이콘 | Material Symbols (가변 폰트, Apache 2.0) | SF Symbols (렌더링 모드 4종, Apple 약관) |

## 크로스플랫폼에서의 선택

```
플랫폼 관례를 따른다 (사용자 기대·OS 통합에 직결)
  내비게이션 구조(뒤로 가기·탭 바 위치), 시스템 시트·알림·공유, 글자 크기 설정,
  제스처, 날짜·시간 피커, 터치 영역, 접근성 API
브랜드로 통일한다 (제품 정체성)
  색 역할의 값, 일러스트·아이콘 스타일, 콘텐츠 카드, 문구 톤
```

- 토큰 이름을 공통으로 두고 플랫폼별 값만 다르게 생성하면([디자인 토큰](/develop-wiki/knowledge/ui-ux/design-tokens/)) 브랜드 일관성과 플랫폼 적합성을 함께 얻는다.
- 웹 서비스는 두 가이드 어느 쪽도 규범이 아니다. 접근성 기준은 WCAG 로 판단한다.

## 언제 쓰나

- 새 모바일 앱의 디자인 원칙을 정할 때, Flutter·React Native 처럼 한 코드로 두 플랫폼을 낼 때 플랫폼별 분기 범위를 정하려고.

## 체크리스트

- [ ] 내비게이션·시트·피커는 각 플랫폼 관례를 따른다
- [ ] 글자 크기 설정(Dynamic Type / 글꼴 크기)에 반응한다
- [ ] 터치 영역은 두 플랫폼 기준 중 큰 쪽(48dp/44pt)에 맞춘다
- [ ] 다크 모드·고대비 설정을 둘 다 지원
- [ ] 가이드라인 개편(예: 2025년 M3 Expressive, Liquid Glass) 때마다 커스텀 컴포넌트를 재검토

## 흔한 실수

- iOS 앱에 Android 식 FAB·상단 탭, Android 앱에 iOS 식 뒤로 가기 버튼만 두는 식의 관례 혼용.
- Material 의 dp 와 Apple 의 pt 를 웹 px 와 같은 크기로 착각해 그대로 비교 — 셋 다 밀도 독립 단위지만 플랫폼 문맥이 다르다.
- 오래된 가이드(Material 2, Liquid Glass 이전 HIG) 스크린숏을 기준으로 설계.

## 주의 (비용)

- 두 가이드 모두 해마다 크게 바뀐다(2025년 M3 Expressive, Liquid Glass). 시스템 컴포넌트를 쓰면 OS 업데이트 때 자동으로 따라가지만, 커스텀 컴포넌트는 직접 맞춰야 한다.
- 완전히 플랫폼별로 나누면 디자인·QA 비용이 두 배다. "관례 영역"과 "브랜드 영역"을 먼저 나누고 관례 영역만 분기한다.
