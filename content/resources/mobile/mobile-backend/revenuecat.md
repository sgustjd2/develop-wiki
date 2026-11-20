---
name: RevenueCat
url: https://www.revenuecat.com
docs: https://www.revenuecat.com/docs/getting-started/quickstart
repo: https://github.com/RevenueCat/purchases-ios
stars: 3095
domain: mobile
category: mobile-backend
description: iOS·Android 인앱 구독과 결제를 SDK 하나와 서버로 통합 관리하는 서비스. 영수증 검증, 권한(entitlement), 페이월, 구독 분석을 대신해 주며 월 추적 매출 구간까지 무료다.
pricing: freemium
tags: [in-app-purchase, subscription, paywall, entitlement, storekit]
languages: [swift, kotlin, dart, typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
RevenueCat은 앱 스토어(StoreKit)와 Google Play Billing 위에 얹는 구독 관리 레이어다. SDK가 구매를 처리하고, RevenueCat 서버가 영수증을 검증·저장하며, 앱은 "사용자가 `pro` 권한(entitlement)을 가졌는가"만 물으면 된다. 같은 사용자의 iOS·Android·웹 구독 상태를 한 곳에서 보고, 서버 웹훅으로 백엔드에 전달한다.

- 클라이언트 SDK는 오픈소스(MIT)다. iOS `purchases-ios` 5.103.1, Android `purchases-android` 11.4.0(GitHub 최신 릴리스 기준). Flutter·React Native·KMP·Unity 래퍼도 있다.
- 서비스 자체는 상용이다. 가격은 **월 추적 매출(MTR)이 약 2,500달러 미만이면 무료, 그 이상이면 MTR의 1%**(공식 가격 페이지, 확인일 기준). 기존 요금제는 신규 Pro로 이전 중이며 엔터프라이즈는 별도 협의다. 변동이 잦으므로 가입 전 페이지를 확인한다.
- 대안: 직접 구현([StoreKit 2](/develop-wiki/mobile/mobile-backend/storekit-2/) + [Google Play Billing](/develop-wiki/mobile/mobile-backend/google-play-billing/) + 자체 서버), Adapty·Qonversion 같은 유사 SaaS.

## 설치
```swift
// Swift Package Manager: https://github.com/RevenueCat/purchases-ios
```
```kotlin
dependencies {
    implementation("com.revenuecat.purchases:purchases:11.4.0")
    implementation("com.revenuecat.purchases:purchases-ui:11.4.0") // 페이월 UI(선택)
}
```
대시보드에서 프로젝트를 만들고 앱(App Store·Play)을 연결한 뒤 플랫폼별 **공개 API 키**를 받는다. 스토어 쪽에서 상품(구독·일회성)을 먼저 등록해야 한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Product | 스토어에 등록한 상품 ID |
| Entitlement | 사용자가 얻는 접근 권한(`pro`). 앱은 상품이 아니라 권한을 검사 |
| Offering / Package | 판매 구성 묶음. 대시보드에서 바꾸면 앱 업데이트 없이 노출 상품 교체 |
| `CustomerInfo` | 사용자의 현재 권한·구독 상태 스냅샷 |
| App User ID | 사용자 식별자. 로그인 시 `logIn`으로 익명 ID와 병합 |
| Paywall | 대시보드에서 구성하고 SDK(`purchases-ui`)로 표시하는 구매 화면 |
| Webhook | 구독 이벤트(갱신·취소·결제 실패)를 백엔드로 전송 |

## 기본 사용법
Android(Kotlin):

```kotlin
Purchases.configure(PurchasesConfiguration.Builder(this, "goog_xxx_public_key").build())

suspend fun buy(activity: Activity) {
    val pkg = Purchases.sharedInstance.awaitOfferings().current?.monthly ?: return
    val result = Purchases.sharedInstance.awaitPurchase(PurchaseParams.Builder(activity, pkg).build())
    val isPro = result.customerInfo.entitlements["pro"]?.isActive == true
}
```

iOS(Swift):

```swift
Purchases.configure(withAPIKey: "appl_xxx_public_key")

func buy() async throws -> Bool {
    guard let pkg = try await Purchases.shared.offerings().current?.monthly else { return false }
    let result = try await Purchases.shared.purchase(package: pkg)
    return result.customerInfo.entitlements["pro"]?.isActive == true
}
```
키 값은 예시이며, 공개 SDK 키만 앱에 넣는다(시크릿 키는 서버 전용).

## 자주 쓰는 패턴
- **로그인 연동**: 가입·로그인 직후 `logIn(appUserID)`로 계정에 구독을 묶고, 로그아웃은 `logOut`.
- **권한 확인 캐싱**: `CustomerInfo`는 SDK가 캐시하므로 화면 진입 때마다 `customerInfo()`를 불러도 부담이 작다. 변경은 리스너로 받는다.
- **복원**: `restorePurchases()` 버튼(앱 심사에서 복원 수단이 요구된다 → [App Store 심사 가이드라인](/develop-wiki/mobile/learning/app-store-review-guidelines/)).
- **실험·가격 변경**: Offering·Experiments로 앱 배포 없이 가격·페이월을 테스트한다.
- **서버 동기화**: 웹훅 또는 REST API로 백엔드의 사용자 플랜을 갱신한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 구독 앱을 빠르게 출시하고 양쪽 스토어를 한 모델로 다루고 싶을 때, 영수증 검증 서버를 직접 운영하기 싫을 때.
- 피할 때: 결제 데이터를 완전히 자체 소유해야 하는 규제 환경, 매출이 커져 1% 수수료가 부담되는 경우(직접 구현·서버 알림 처리 검토), 스토어 외 복잡한 결제 흐름.

## 공식 문서
- [빠른 시작](https://www.revenuecat.com/docs/getting-started/quickstart) · [문서 홈](https://docs.revenuecat.com) · [가격](https://www.revenuecat.com/pricing/)
