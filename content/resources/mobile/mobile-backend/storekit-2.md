---
name: StoreKit 2
url: https://developer.apple.com/storekit/
docs: https://developer.apple.com/documentation/storekit
domain: mobile
category: mobile-backend
description: Apple 플랫폼의 인앱 결제·구독 프레임워크. async/await 기반 Swift API(Product, Transaction)와 SwiftUI 구독 뷰를 제공하며, 서버 검증은 App Store Server API로 보완한다.
pricing: free
tags: [in-app-purchase, subscription, apple, swift, storekit]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
StoreKit 2는 iOS 15 이상에서 쓰는 Swift 네이티브 결제 API다. 상품 조회(`Product`), 구매(`product.purchase()`), 거래 내역(`Transaction`)이 모두 `async/await`이며, 거래는 기기에서 **서명 검증된 JWS**(`VerificationResult`)로 전달된다. 기존 StoreKit 1(`SKPaymentQueue`)의 영수증 파싱 없이 로컬에서 권한을 판단할 수 있다.

- 프레임워크 사용 자체에 비용은 없다. Apple Developer Program 가입과 앱 스토어 수수료 정책은 Apple 공식 안내를 확인한다.
- 서버 쪽은 **App Store Server API**와 **App Store Server Notifications V2**, 그리고 Apple 공식 서버 라이브러리(Swift `app-store-server-library-swift` v6.0.0, MIT 등)가 담당한다.
- 구독 분석·서버 상태 관리를 대신 맡기려면 [RevenueCat](/develop-wiki/mobile/mobile-backend/revenuecat/). Android 쪽 대응은 [Google Play Billing](/develop-wiki/mobile/mobile-backend/google-play-billing/).

## 설치
별도 설치는 없다. `import StoreKit`만 하면 된다. 개발 중에는 Xcode에서 **StoreKit Configuration File**을 만들어 로컬로 상품·구독을 시뮬레이션한다([Xcode](/develop-wiki/mobile/ios/xcode/)). 실제 상품은 App Store Connect에서 등록한다. 앱에는 In-App Purchase capability가 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Product` | 상품 정보(가격 표시용 `displayPrice`, 타입). `Product.products(for:)`로 조회 |
| `product.purchase()` | 구매 시작. `.success` / `.userCancelled` / `.pending` 결과 |
| `VerificationResult` | 거래의 서명 검증 결과(`.verified`/`.unverified`) |
| `Transaction` | 거래. `finish()`로 처리 완료 알림 |
| `Transaction.currentEntitlements` | 현재 유효한 권한(구독 활성, 비소모성 구매) 스트림 |
| `Transaction.updates` | 앱 밖(가족 공유, 갱신, 환불)에서 생긴 거래 수신. 앱 시작 때 구독 필요 |
| `Product.SubscriptionInfo` | 구독 그룹, 갱신 상태, 프로모션·무료 체험 정보 |
| `SubscriptionStoreView` / `StoreView` | SwiftUI로 구독·상품 UI를 선언적으로 표시 |
| `AppStore.sync()` | 구매 복원(필요할 때만 호출) |

## 기본 사용법
```swift
import StoreKit

func loadAndBuy() async throws {
    let products = try await Product.products(for: ["pro.monthly"])
    guard let product = products.first else { return }

    switch try await product.purchase() {
    case .success(let verification):
        guard case .verified(let transaction) = verification else { return }
        // 권한 부여 ...
        await transaction.finish()
    case .userCancelled, .pending:
        break
    @unknown default:
        break
    }
}

// 앱 시작 시 한 번: 갱신·환불 등 외부 거래 수신
func listen() -> Task<Void, Never> {
    Task.detached {
        for await result in Transaction.updates {
            if case .verified(let t) = result { await t.finish() }
        }
    }
}
```
상품 ID `pro.monthly`는 예시다.

## 자주 쓰는 패턴
- **권한 계산**: 시작 시 `for await r in Transaction.currentEntitlements`를 돌려 활성 상품 집합을 만들고 UI 상태로 보관한다.
- **SwiftUI 구독 화면**: `SubscriptionStoreView(groupID:)`로 약관·복원 버튼이 포함된 구독 화면을 빠르게 구성한다.
- **서버 검증**: 기기에서 검증한 거래의 `originalID`/JWS를 백엔드로 보내 App Store Server API로 교차 확인하고, Notifications V2로 갱신·환불을 받는다.
- **사용자 연결**: `appAccountToken`(UUID)을 구매에 지정해 자체 사용자와 거래를 연결한다.
- **복원**: 일반적으로 `Transaction.currentEntitlements`로 충분하고, 명시적 복원 버튼에서 `AppStore.sync()`를 호출한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Apple 플랫폼 네이티브 앱의 구독·일회성 결제를 직접 제어하고 싶을 때, 서버 비용 없이 로컬 검증으로 권한을 처리하고 싶을 때.
- 피할 때(대안): iOS·Android·웹 구독을 한 곳에서 통합 관리해야 하면 RevenueCat 같은 서비스, iOS 14 이하 지원이 필요한 앱(StoreKit 1).

## 공식 문서
- [StoreKit 문서](https://developer.apple.com/documentation/storekit) · [인앱 구매](https://developer.apple.com/documentation/storekit/in-app-purchase) · [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi) · [서버 라이브러리](https://github.com/apple/app-store-server-library-swift)
