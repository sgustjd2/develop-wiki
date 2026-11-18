---
name: Google Play Billing Library
url: https://developer.android.com/google/play/billing
docs: https://developer.android.com/google/play/billing/integrate
domain: mobile
category: mobile-backend
description: Google Play에서 앱 내 상품과 구독을 판매하는 공식 Android 결제 라이브러리. 상품 조회, 구매 흐름 실행, 구매 승인(acknowledge)과 서버 검증 절차를 제공한다.
pricing: free
tags: [in-app-purchase, subscription, google-play, android, billing]
languages: [kotlin, java]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Play Billing Library는 앱이 Google Play 결제 시스템과 통신하는 클라이언트 SDK다. 흐름은 (1) 판매 상품 표시 → (2) 구매 흐름 시작 → (3) **서버에서 구매 검증** → (4) 콘텐츠 지급 → (5) **구매 승인(acknowledge)**, 소모성이면 소비(consume) 순이다. 구독은 활성·취소·유예 기간·보류·일시중지·만료 상태를 거친다.

- 이 문서는 `com.android.billingclient:billing`/`billing-ktx` **9.1.0**(Google Maven 최신) 기준이다. 라이브러리 사용에 별도 비용은 없고, 판매에는 Google Play 수수료 정책이 적용된다(정책 페이지 확인).
- 통합 구독 관리를 서비스에 맡기려면 [RevenueCat](/develop-wiki/mobile/mobile-backend/revenuecat/). iOS 대응은 [StoreKit 2](/develop-wiki/mobile/mobile-backend/storekit-2/).

## 설치
```kotlin
dependencies {
    implementation("com.android.billingclient:billing-ktx:9.1.0")
}
```
Play Console에서 앱을 등록하고 앱 내 상품·구독을 만든 뒤, 해당 앱 서명 키로 업로드된 빌드(내부 테스트 트랙 이상)로 테스트한다. 라이선스 테스터 계정을 지정하면 실제 결제 없이 시험할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `BillingClient` | Play와의 연결 객체. 동시에 하나만 열어 두는 것이 권장 |
| `PurchasesUpdatedListener` | 구매 결과(성공·취소·오류)를 수신 |
| `ProductDetails` | 상품 정보. 구독은 base plan·offer 단위의 `offerToken` 포함 |
| `BillingFlowParams` | 구매 UI를 띄울 때의 상품·오퍼 지정 |
| `Purchase` / `purchaseToken` | 구매 기록과 서버 검증용 토큰 |
| Acknowledge | 구매를 승인해야 환불 자동 처리를 피함. **3일 이내**(문서 기준) |
| Consume | 소모성 상품을 소비해 재구매 가능하게 함 |
| Pending purchase | 현금 결제 등 지연 결제. 승인 대기 상태 |
| `enableAutoServiceReconnection` | 서비스 연결 끊김 시 자동 재연결 |

## 기본 사용법
```kotlin
val client = BillingClient.newBuilder(context)
    .setListener { result, purchases ->
        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
            purchases?.forEach { handle(it) }
        }
    }
    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
    .enableAutoServiceReconnection()
    .build()

// startConnection(...)으로 연결한 뒤
val params = QueryProductDetailsParams.newBuilder().setProductList(listOf(
    QueryProductDetailsParams.Product.newBuilder()
        .setProductId("pro_monthly")
        .setProductType(BillingClient.ProductType.SUBS)
        .build()
)).build()
val details = client.queryProductDetails(params) // KTX 확장, 코루틴 중단 함수

// 구매 시작 (productDetails, selectedOfferToken은 위 결과에서 선택)
val flow = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(
    BillingFlowParams.ProductDetailsParams.newBuilder()
        .setProductDetails(productDetails).setOfferToken(selectedOfferToken).build()
)).build()
client.launchBillingFlow(activity, flow)
```
`handle`과 상품 ID는 앱이 정의하는 부분이다. 연결(`startConnection`)과 결과 코드 처리는 공식 가이드의 전체 예제를 따른다.

## 자주 쓰는 패턴
- **서버 검증 후 승인**: 구매 토큰을 백엔드에 보내 Play Developer API로 확인하고 서버에서 acknowledge한다([Google Play Developer API](/develop-wiki/mobile/mobile-backend/google-play-developer-api/)). 클라이언트만 있는 앱은 `acknowledgePurchase()`를 쓰되 `isAcknowledged`를 먼저 확인한다.
- **앱 시작 시 미처리 구매 확인**: `queryPurchasesAsync`로 승인 안 된 구매를 복구한다. 3일 안에 처리하지 못하면 자동 환불된다.
- **계정 연결**: 구매에 난독화된 사용자 ID를 붙여 부정 사용 탐지와 계정 매핑에 쓴다.
- **구독 상태 동기화**: 서버에서 실시간 개발자 알림(RTDN)을 받아 갱신·취소·유예를 반영한다.
- **오류 재시도**: `SERVICE_DISCONNECTED` 등은 재연결 후 재시도한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Google Play로 배포하는 Android 앱에서 디지털 상품·구독을 판매할 때(Play 정책상 대부분 필수 → [Google Play 정책](/develop-wiki/mobile/learning/google-play-developer-policy/)).
- 피할 때(대안): 양쪽 스토어를 통합 관리해야 하면 RevenueCat, 실물 상품·서비스(Play 결제 대상이 아님)는 별도 결제 수단.

## 공식 문서
- [Play Billing 개요](https://developer.android.com/google/play/billing) · [통합 가이드](https://developer.android.com/google/play/billing/integrate) · [Play Developer API](https://developers.google.com/android-publisher)
