---
title: 모바일 접근성 기본 (VoiceOver·TalkBack)
aka: [Mobile Accessibility, VoiceOver, TalkBack, Dynamic Type, Semantics, a11y]
category: mobile-dev
group: platform
level: beginner
summary: 화면 낭독기와 큰 글씨, 스위치 조작 같은 보조 기능으로도 앱을 끝까지 쓸 수 있게 라벨·역할·상태·동작·터치 영역을 설계하는 기본기.
tags: [mobile, accessibility, a11y, voiceover, talkback, dynamic-type]
related: [mobile-dev/mvvm-mvi-udf, mobile-dev/store-review-policy, mobile-dev/navigation-deep-links]
sources:
  - https://developer.android.com/guide/topics/ui/accessibility/principles
  - https://developer.apple.com/accessibility/
  - https://developer.apple.com/design/human-interface-guidelines/accessibility
updatedAt: 2026-11-18
---

## 문제

- 시각 장애 사용자는 화면 낭독기(iOS VoiceOver, Android TalkBack)가 읽어 주는 요소 순서와 설명으로만 앱을 사용한다. 라벨이 없는 아이콘 버튼은 "버튼"으로만 읽힌다.
- 스와이프·길게 누르기 같은 제스처로만 가능한 동작은 스위치 조작이나 음성 제어 사용자에게 막혀 있다.
- 색으로만 상태를 구분하거나 글자가 고정 크기면 저시력·색각 이상 사용자가 쓸 수 없다.

## 해법

Android 공식 가이드의 다섯 가지 축(라벨, 접근성 동작, 내장 기능 활용, 색 외 단서, 미디어)을 iOS 와 함께 정리한다.

| 원칙 | Android(Compose) | iOS(SwiftUI/UIKit) |
| --- | --- | --- |
| 의미 있는 요소에 라벨 | `contentDescription`, `semantics` | `accessibilityLabel` |
| 장식 요소는 숨김 | 이미지 `contentDescription = null`, `hideFromAccessibility` | `accessibilityHidden(true)` |
| 역할·상태 전달 | `role`, `stateDescription`, 표준 컴포넌트 사용 | `accessibilityTraits`, `accessibilityValue` |
| 관련 요소 묶기 | `semantics(mergeDescendants = true)` | `accessibilityElement(children: .combine)` |
| 제스처 대체 동작 | `customActions`, `onClickLabel` | `accessibilityAction` / 커스텀 액션 |
| 제목(탐색 단위) | `heading()` | `accessibilityAddTraits(.isHeader)` |
| 글자 크기 | `sp` 단위, 레이아웃이 커진 글자에 견딤 | Dynamic Type(시스템 텍스트 스타일) |

```kotlin
// 스와이프 삭제를 낭독기 사용자도 쓸 수 있게 동작으로 노출
SwipeToDismissBox(
    modifier = Modifier.semantics {
        customActions = listOf(CustomAccessibilityAction("기사 삭제") { remove(); true })
    },
    state = rememberSwipeToDismissBoxState(), backgroundContent = {}
) { ArticleRow() }
```

```swift
Button { toggleFavorite() } label: { Image(systemName: "heart.fill") }
    .accessibilityLabel("즐겨찾기")
    .accessibilityValue(isFavorite ? "추가됨" : "추가 안 됨")
```

### 실무 체크리스트

- **라벨은 짧고 고유하게**. 목록 항목 라벨이 모두 같으면 낭독기가 구분하지 못한다. "버튼" 같은 역할 단어는 중복해서 쓰지 않는다(역할은 시스템이 읽는다).
- **표준 컴포넌트를 쓴다.** `Button`, `Switch`, 네이티브 `List` 는 접근성이 기본 내장이다. 커스텀 뷰는 역할·상태를 직접 선언해야 한다.
- **터치 영역**: Android 는 최소 48dp, Apple HIG 는 44pt 가 통상 권장이다(수치는 각 가이드라인에서 확인).
- **색 외 단서**: 아이콘·텍스트·형태를 함께 쓴다. 명암비는 WCAG 기준(본문 4.5:1)을 목표로 한다.
- 시간 제한이나 자동으로 사라지는 알림은 낭독기 사용자가 읽기 전에 사라지지 않게 한다. 동적 변경은 상태 알림(live region/`UIAccessibility.post`)으로 알린다.
- 미디어에는 자막·대본 대체 수단을 제공한다.

## 언제 쓰나

- 처음부터. 접근성 구조(의미 있는 라벨, 표준 컴포넌트, 제스처 대체)는 사후에 덧붙이면 비용이 훨씬 크다. 디자인 단계에서 포커스 순서·터치 영역·색 대비를 정한다.
- 공공·금융·교육 서비스는 법적·계약적 요구가 있을 수 있다(지역별 규정 확인).

## 주의·검증

- 자동 검사(Android Accessibility Scanner, Xcode Accessibility Inspector)는 일부만 잡는다. **실제로 VoiceOver/TalkBack 을 켜고** 핵심 흐름(가입, 결제, 설정)을 눈 감고 끝까지 해본다.
- 큰 글씨(시스템 최대치)와 굵은 글씨, 가로 화면, 다크 모드에서 잘림·겹침을 확인한다.
- `contentDescription` 에 "~버튼", 화면에 이미 보이는 텍스트 반복을 넣으면 오히려 소음이다.
- 접근성은 앱 심사의 직접 반려 사유는 흔치 않지만 사용자 평점과 법적 위험에 영향을 준다. 이 노트의 Apple 수치(44pt 등)는 문서 원문을 열어 확인하지 못했다.
