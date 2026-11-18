---
name: Apple Human Interface Guidelines
url: https://developer.apple.com/design/human-interface-guidelines
docs: https://developer.apple.com/design/human-interface-guidelines
domain: mobile
category: learning
description: Apple 플랫폼 앱의 디자인 원칙·패턴·컴포넌트 사용법을 정리한 공식 디자인 가이드. iOS 앱 화면을 설계하거나 App Store 심사 전 UI 관례를 확인할 때 기준으로 쓴다.
pricing: free
tags: [design, guidelines, accessibility, apple, hig]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Human Interface Guidelines(HIG)는 Apple이 iOS·iPadOS·macOS·watchOS·tvOS·visionOS 앱을 위해 공개한 디자인 지침이다. "무엇을 어떻게 그릴지"보다 **플랫폼 사용자가 기대하는 동작**(내비게이션, 제스처, 시트·알림의 쓰임, 접근성)을 설명하며, [SwiftUI](/develop-wiki/mobile/ios/swiftui/)·[UIKit](/develop-wiki/mobile/ios/uikit/)의 기본 컴포넌트는 대부분 이 지침을 그대로 구현한다.

- 한 문서에서 모든 Apple 플랫폼을 다루고 항목마다 플랫폼별 고려 사항을 붙인다.
- 영어 외에 **한국어**, 중국어(간체), 일본어 판을 제공한다([한국어 HIG](https://developer.apple.com/kr/design/human-interface-guidelines)).
- iOS 26 세대부터 반투명 소재 **Liquid Glass**를 중심으로 한 디자인 언어가 Materials 항목 등에 반영돼 있다.

## 구성
최상위는 여섯 묶음이다.

| 묶음 | 다루는 내용 |
| --- | --- |
| Getting started | 플랫폼별 디자인 특징(iOS, macOS, visionOS …) |
| Foundations | 접근성, 앱 아이콘, 색, 다크 모드, 레이아웃, 소재(Materials), 모션, 개인정보, SF Symbols, 타이포그래피, 글쓰기(Writing) |
| Patterns | 온보딩, 실행(Launching), 로딩, 검색, 설정, 알림 관리, 데이터 입력, 피드백, 모달리티, 계정 관리 |
| Components | 콘텐츠, 레이아웃·구성, 메뉴·액션, 내비게이션·검색, 프레젠테이션(시트·알림), 선택·입력, 상태, 시스템 경험(위젯 등) 묶음별 개별 컨트롤 |
| Inputs | 제스처, 키보드, 포인팅 기기, Apple Pencil·Scribble, 게임 컨트롤, 시선(Eyes), Digital Crown, Action 버튼 |
| Technologies | Apple Pay, 인앱 결제, Sign in with Apple, HealthKit, Siri, 생성형 AI, VoiceOver, App Clips 등 시스템 기술 |

## 활용법
- **컴포넌트 선택 기준.** 확인을 받을 때 Alert와 Action Sheet 중 무엇을 쓸지, 시트와 전체 화면 모달의 차이 같은 결정을 Components·Patterns 항목으로 확인한다.
- **터치 대상 크기.** 접근성 항목은 iOS·iPadOS 컨트롤의 기본 크기로 44×44pt, 최소 28×28pt를 제시한다.
- **Dynamic Type·다크 모드.** 텍스트는 시스템 텍스트 스타일을 써서 사용자 글자 크기 설정을 따르고, 색은 의미 기반 시스템 색을 써서 다크 모드에 대응한다.
- **SF Symbols.** 아이콘은 SF Symbols를 우선 사용해 굵기·크기가 텍스트와 자동으로 맞게 한다.
- **디자인 리소스.** Figma·Sketch용 iOS UI 키트, SF 폰트, 템플릿을 [Apple Design Resources](https://developer.apple.com/design/resources/)에서 받는다.

## 언제 쓰나
- iOS 앱을 처음 설계하거나 Android 앱을 iOS로 옮길 때 플랫폼 관례 차이(뒤로 가기, 탭 바 위치, 공유 시트)를 확인할 때.
- 크로스플랫폼 앱([Flutter](/develop-wiki/mobile/cross-platform/flutter/)·[React Native](/develop-wiki/mobile/cross-platform/react-native/))에서 iOS다운 동작을 맞출 때.
- App Store 심사 지침과는 별개 문서다. 심사 기준은 [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)를 따로 확인한다.

## 함께 보면 좋은 자료
- Android 쪽 대응 문서: [Material Design 3](/develop-wiki/mobile/learning/material-design-3/)
- [Apple Design Resources](https://developer.apple.com/design/resources/) · [WWDC 디자인 세션](https://developer.apple.com/videos/design/)

## 공식 문서
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) · [한국어판](https://developer.apple.com/kr/design/human-interface-guidelines)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
