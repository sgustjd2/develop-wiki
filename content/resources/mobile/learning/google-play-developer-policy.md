---
name: Google Play Developer Policy Center
url: https://support.google.com/googleplay/android-developer/topic/9858052
docs: https://support.google.com/googleplay/android-developer/topic/9858052
domain: mobile
category: learning
description: Google Play에 앱을 게시할 때 따라야 하는 개발자 프로그램 정책 모음. 제한 콘텐츠, 개인정보·기만, 수익화, 스토어 등록정보, 타깃 API 레벨, 데이터 보안 양식 등 정책 위반과 거절 사유를 확인하는 1차 자료다.
pricing: free
tags: [google-play, policy, review, data-safety, compliance]
languages: []
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Policy Center는 Play Console 개발자가 지켜야 할 정책을 주제별로 모아 둔 도움말 허브다. 확인 시점의 주제는 제한된 콘텐츠, 지식재산, **개인정보·기만·기기 악용**, SDK 사용, 악성코드, 사칭, 모바일 원치 않는 소프트웨어, **수익화·광고**, **스토어 등록정보·홍보**, 스팸·기능·사용자 환경, 기타 프로그램(Auto·TV·Wear OS 등), 가족, 집행, 업데이트·리소스, Google Play 작동 방식 등이다. 정책은 자주 바뀌므로 정책 상태 페이지와 업데이트 공지를 확인한다. 한국어 번역(`hl=ko`)이 제공된다.

- 앱 업로드와 자동화는 [Google Play Developer API](/develop-wiki/mobile/mobile-backend/google-play-developer-api/)로 해도 정책 심사는 동일하게 적용된다.
- 이 항목은 법률 자문이 아니며, 아래 요약은 확인 시점의 공식 도움말을 의역한 것이다.

## 설치
설치할 것은 없다. Play Console 개발자 계정과 앱을 만들고, 앱 콘텐츠 섹션(콘텐츠 등급, 광고 포함 여부, 데이터 보안, 타깃 연령 등)을 작성한다. 빌드는 보통 [Android Studio](/develop-wiki/mobile/android/android-studio/)에서 AAB로 만든다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 개발자 프로그램 정책 | 앱 콘텐츠·행동 전반의 규칙 |
| 정책 상태 페이지 | Play Console에서 위반·경고·마감 확인 |
| 데이터 보안(Data safety) 양식 | 수집·공유하는 사용자 데이터를 공개하는 필수 양식 |
| 타깃 API 레벨 | 신규 앱·업데이트가 맞춰야 하는 `targetSdk` 최소값 |
| 테스트 요건 | 신규 개인 개발자 계정은 비공개 테스트 후 프로덕션 신청 |
| 집행 | 앱 거절, 업데이트 차단, 게시 중단, 계정 정지 |
| 이의 신청 | Play Console에서 정책 결정에 이의 제기 |

## 자주 거절되는 원인 (공식 도움말 기준)
- **타깃 API 레벨 미준수**: 공식 안내에 따르면 2026년 8월 31일부터 신규 앱과 업데이트는 **Android 16(API 36)** 을 타깃해야 한다(Wear OS·Automotive는 API 35, TV·XR은 34). 기존 앱은 신규 사용자에게 계속 노출되려면 API 35 이상이 필요하며, 11월 1일까지의 연장 신청 제도가 있었다. 조직 내부용 비공개 앱은 예외다. 현재 값은 반드시 정책 페이지에서 확인한다.
- **데이터 보안 양식 불일치**: 비공개·내부 테스트 외 트랙의 모든 앱이 양식을 작성해야 하고, 수집이 없는 앱도 마찬가지다. 기기 밖으로 전송되는 데이터는 제3자 SDK와 WebView가 보내는 것까지 공개 대상이다. 개인정보 처리방침이 필요하며, 정확성은 개발자 책임이고 불일치가 발견되면 업데이트 차단·삭제 같은 집행을 받을 수 있다. 분석·결제 SDK를 쓰면 그 수집 항목도 반영한다([PostHog](/develop-wiki/mobile/mobile-backend/posthog/), [Firebase Crashlytics](/develop-wiki/mobile/mobile-backend/firebase-crashlytics/)).
- **계정 삭제 경로 누락**: 앱에서 계정을 만들 수 있다면 앱 안에서 삭제를 시작할 수 있어야 하고, 앱 설치 없이 삭제를 요청할 수 있는 웹 링크도 제공해야 한다. 보안·사기 방지·법적 이유로 남기는 데이터는 공개한다.
- **결제·수익화 위반**: 디지털 상품 판매는 Play 결제 규칙을 따라야 하고, 구독 조건을 명확히 보여야 한다([Google Play Billing Library](/develop-wiki/mobile/mobile-backend/google-play-billing/)).
- **스토어 등록정보·사칭·스팸**: 오해를 부르는 설명, 타 브랜드 사칭, 최소한의 기능·품질이 없는 앱.
- **SDK·권한**: 사용하지 않는 민감 권한, 정책에 맞지 않는 SDK 동작. 앱의 책임은 포함된 SDK에도 미친다.

## 신규 개인 개발자 계정의 테스트 요건
공식 도움말은 신규 개인 계정이 프로덕션 접근을 신청하기 전에 비공개 테스트를 거치도록 한다. 확인 시점의 기준은 **12명의 테스터가 14일 동안 옵트인**이다. 조건은 변경될 수 있으니 Play Console 안내를 따른다.

## 제출 전 점검 목록
- `targetSdk`가 현재 요구 수준인가
- 데이터 보안 양식, 개인정보 처리방침 링크, 계정 삭제 링크가 실제 동작과 같은가
- 광고·결제·콘텐츠 등급 신고가 정확한가
- 스토어 등록정보(스크린샷·설명)가 과장 없이 실제 기능을 보여 주는가
- 품질 기준은 [Android 앱 품질 체크리스트](/develop-wiki/mobile/learning/android-app-quality-checklist/)로 점검했는가
- 정책 상태 페이지에 경고가 없는가

## 언제 쓰나 / 피할 때
- 쓸 때: 앱 설계 단계(결제·데이터·계정), 출시 직전 점검, 정책 위반 통보 대응.
- 피할 때: 요약만 보고 판단하지 말 것. 지역·카테고리별 추가 정책(가족, 금융, 건강 등)이 별도로 있다. iOS는 [App Store 심사 가이드라인](/develop-wiki/mobile/learning/app-store-review-guidelines/).

## 공식 문서
- [Policy Center](https://support.google.com/googleplay/android-developer/topic/9858052) · [한국어](https://support.google.com/googleplay/android-developer/topic/9858052?hl=ko) · [데이터 보안 양식](https://support.google.com/googleplay/android-developer/answer/10787469) · [타깃 API 레벨](https://support.google.com/googleplay/android-developer/answer/11926878) · [계정 삭제](https://support.google.com/googleplay/android-developer/answer/13327111)
