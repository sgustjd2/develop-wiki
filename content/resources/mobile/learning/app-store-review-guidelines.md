---
name: App Store Review Guidelines
url: https://developer.apple.com/app-store/review/guidelines/
docs: https://developer.apple.com/app-store/review/guidelines/
domain: mobile
category: learning
description: Apple이 App Store 심사에서 적용하는 공식 기준. 안전·성능·비즈니스·디자인·법적 요건 5개 영역으로 구성되며, 거절 사유와 제출 전 점검 항목을 파악하는 1차 자료다.
pricing: free
tags: [app-store, review, guidelines, policy, ios]
languages: []
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
App Store Review Guidelines는 iOS·iPadOS 등 Apple 플랫폼 앱이 App Store에 오르기 위해 지켜야 할 규칙이다. 구성은 **1. 안전(Safety), 2. 성능(Performance), 3. 비즈니스(Business), 4. 디자인(Design), 5. 법적(Legal)** 다섯 부분이다. 문서는 수시로 개정되며, 확인 시점에 페이지 하단 개정일은 2026년 10월 16일이었다. 한국어 번역 페이지도 제공된다.

- 심사 상태와 거절 소통은 App Store Connect에서 이뤄지고, 거절 사유에는 위반한 가이드라인 번호가 붙는다. 자동화는 [App Store Connect API](/develop-wiki/mobile/mobile-backend/app-store-connect-api/)로 일부 가능하다.
- 이 항목은 법률 자문이 아니다. 아래 요약은 공식 본문을 확인 시점 기준으로 의역한 것이므로, 제출 전에 원문을 확인한다.

## 설치
설치할 것은 없다. 사전 준비로 Apple Developer Program 계정, [Xcode](/develop-wiki/mobile/ios/xcode/)로 만든 빌드, App Store Connect 앱 레코드를 갖춘다. 제출 절차는 [App Store 제출 안내](https://developer.apple.com/app-store/submitting/)를 따른다.

## 핵심 개념
| 영역 | 보는 것 |
| --- | --- |
| 1. 안전 | 불쾌·유해 콘텐츠, 사용자 생성 콘텐츠, 아동 보호 등 |
| 2. 성능 | 앱 완성도(2.1), 정확한 메타데이터(2.3), 하드웨어 호환 등 |
| 3. 비즈니스 | 결제(3.1 인앱 구입), 광고, 구독 정책 |
| 4. 디자인 | 복제 앱, 최소 기능(4.2), 로그인 서비스(4.8) |
| 5. 법적 | 개인정보(5.1), 지식재산, 도박, 개발자 행동 강령 |
| 심사 노트·데모 계정 | 심사관이 기능을 확인하도록 App Store Connect에 제공 |
| 이의 신청 | 결과에 동의하지 않으면 appeal 가능 |

## 자주 거절되는 원인 (공식 본문 기준)
- **2.1 앱 완성도**: 최종본이어야 하고 기기에서 테스트됐어야 하며 자리표시자 콘텐츠가 없어야 한다. 로그인이 필요하면 **동작하는 데모 계정**이나 데모 모드를 제공하고, 백엔드 서비스는 심사 중에 켜 둬야 한다. 인앱 구입은 완성되어 심사관에게 보이고 작동해야 한다.
- **2.3 정확한 메타데이터**: 이름·설명·스크린샷·프리뷰·개인정보 정보가 실제 앱과 일치해야 한다. 스크린샷은 앱 사용 모습을 보여야 하고, 이름은 30자 이하(2.3.7)이며 키워드 채우기를 하지 않는다.
- **3.1.1 인앱 구입**: 디지털 기능·콘텐츠 잠금 해제는 인앱 구입으로 해야 하며 라이선스 키·QR 코드 등으로 대체할 수 없다. 구매 복원 수단이 필요하고, 구입한 크레딧은 만료되면 안 된다. 일부 지역은 특정 자격(entitlement)이 있을 때 외부 구매 링크가 허용된다([StoreKit 2](/develop-wiki/mobile/mobile-backend/storekit-2/), [RevenueCat](/develop-wiki/mobile/mobile-backend/revenuecat/)).
- **4.2 최소 기능**: 웹사이트를 감싼 것, 마케팅·광고·링크 모음에 가까운 앱은 거절될 수 있다. 다른 앱을 설치해야 동작하는 구조도 안 된다. 큰 다운로드는 크기를 알리고 동의를 받는다.
- **4.8 로그인 서비스**: 제3자·소셜 로그인을 주 계정 로그인으로 쓰면, 이름·이메일만 수집하고 이메일 숨기기를 지원하며 동의 없이 광고에 쓰지 않는 동등한 옵션도 제공해야 한다(자체 계정만 쓰는 앱, 기업·교육용 로그인 등은 예외).
- **5.1.1 데이터 수집·저장**: App Store Connect와 앱 안에 개인정보 처리방침 링크가 있어야 한다. 수집 전 동의를 받고, 필요한 데이터만 요청하며, 목적 문자열(purpose string)을 명확히 쓴다. **계정 생성을 지원하는 앱은 앱 안에서 계정 삭제**를 제공해야 한다.
- **5.1.2 데이터 사용·공유**: 개인 데이터 사용·공유 전 허가를 받고 제3자(AI 제공자 포함) 공유를 공개한다. 추적에는 App Tracking Transparency를 쓰며, 푸시·위치·추적을 켜야만 앱을 쓸 수 있게 만들지 않는다.

## 제출 전 점검 목록
- 릴리스 빌드를 실기기로 테스트했고 충돌·자리표시자가 없는가
- 심사 노트에 데모 계정, 숨은 기능, 하드웨어 요구를 적었는가
- 메타데이터·스크린샷·개인정보 라벨이 실제 동작과 일치하는가([PostHog](/develop-wiki/mobile/mobile-backend/posthog/) 같은 분석 SDK 수집 항목도 포함)
- 인앱 구입 상품이 심사관 계정에서 보이고, 복원 버튼이 있는가
- 계정 생성이 있다면 앱 내 계정 삭제가 있는가
- 권한 요청 문구가 필요한 이유를 설명하는가
- 디자인 규칙은 [Apple Human Interface Guidelines](/develop-wiki/mobile/learning/apple-human-interface-guidelines/)로 점검했는가

## 심사 이후
- 같은 가이드라인을 반복 위반하면 심사가 길어질 수 있다. 상태는 App Store Connect에서 확인한다.
- 긴급 일정에는 expedite 요청을 쓸 수 있으나 남용하면 이후 거절될 수 있다고 안내한다.
- 이미 게시된 앱의 버그 수정은 법적·안전 문제를 제외하면 가이드라인 문제로 지연되지 않을 수 있다(공식 안내).
- 미리 정한 출시일은 승인 후에도 그 날짜까지 노출되지 않고, 전 스토어 반영에 최대 24시간이 걸린다.

## 언제 쓰나 / 피할 때
- 쓸 때: 첫 제출 전, 결제·로그인·개인정보 설계를 정할 때, 거절 통보를 받고 근거 조항을 찾을 때.
- 피할 때: 가이드라인만 보고 법적 판단을 하지 않는다. 지역별 규정(결제 링크 등)은 최신 공식 안내와 전문가 확인이 필요하다. Android 쪽은 [Google Play 개발자 정책](/develop-wiki/mobile/learning/google-play-developer-policy/).

## 공식 문서
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) · [한국어 번역](https://developer.apple.com/kr/app-store/review/guidelines/) · [앱 제출](https://developer.apple.com/app-store/submitting/) · [앱 개인정보](https://developer.apple.com/support/app-privacy/)
