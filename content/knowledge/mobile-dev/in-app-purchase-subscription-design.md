---
title: 인앱 결제·구독 설계 (스토어 결제 + 서버 검증)
aka: [In-App Purchase, IAP, Subscription, Google Play Billing, StoreKit 2, Entitlement, RTDN, App Store Server Notifications]
category: mobile-dev
group: architecture
level: advanced
summary: 스토어 결제 결과를 앱이 믿지 않고 서버가 검증해 권한(entitlement)을 부여하며, 갱신·환불·유예 같은 구독 수명주기를 서버 알림으로 동기화하는 설계.
tags: [mobile, iap, subscription, billing, storekit, play-billing, entitlement, idempotency]
related: [mobile-dev/store-review-policy, mobile-dev/push-notification-architecture, mobile-dev/offline-first-sync, distributed-systems/idempotency, security/threat-modeling-stride, security/secrets-management]
sources:
  - https://developer.android.com/google/play/billing/integrate
  - https://developer.android.com/google/play/billing/subscriptions
  - https://developer.apple.com/documentation/storekit/transaction/updates
  - https://developer.apple.com/documentation/storekit/transaction/currententitlements
  - https://developer.apple.com/documentation/storekit/transaction/finish()
  - https://developer.apple.com/documentation/storekit/verificationresult
  - https://developer.apple.com/documentation/appstoreserverapi
  - https://developer.apple.com/documentation/appstoreservernotifications
updatedAt: 2026-11-19
---

## 문제

디지털 상품을 앱에서 팔 때 결제는 스토어가 처리하지만, "이 사용자가 지금 프리미엄인가"는 결국 앱과 서버가 판단해야 한다. 구독은 갱신·결제 실패·환불·취소가 앱이 꺼져 있는 동안에도 일어난다. 클라이언트의 결제 성공 콜백만 믿으면 위조, 중복 지급, 상태 불일치가 생긴다.

> 스토어 결제 의무 범위와 수수료율은 정책 문서에 따르며 자주 바뀐다. 이 노트는 다루지 않는다. [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/) 참고.

## 해법

### 구매 한 번의 수명 (Google Play 기준 5단계)

1. 살 수 있는 상품을 보여 준다.
2. 구매 흐름을 띄워 사용자가 수락한다.
3. **서버에서 구매를 검증한다.**
4. 콘텐츠를 지급한다.
5. 전달을 확인(acknowledge)한다. 소모성 상품은 소비(consume) 처리해 다시 살 수 있게 한다.

Play 는 확인(acknowledge)을 **3일 안에** 하지 않으면 구매가 자동 환불되고 권한이 회수된다고 명시한다. 따라서 "지급 후 확인"은 반드시 실패 재시도가 있는 서버 작업이어야 한다.

iOS(StoreKit 2)에서는 같은 역할을 이렇게 맡는다.

- `product.purchase()` 결과는 검증 결과(`VerificationResult`)로 감싸져 온다. 검증된 값만 쓴다.
- 지급을 마친 뒤 `transaction.finish()` 를 호출한다.
- `Transaction.updates` 는 앱 밖에서 발생한 거래(구매 승인 대기 해제, 코드 사용, 다른 기기 구매 등)를 받는다. **앱 시작 직후 리스너를 띄워야** 끝나지 않은 거래를 놓치지 않는다.
- `Transaction.currentEntitlements` 로 지금 보유 중인 권한을 구한다. 환불·취소된 상품과 소모성 상품은 나오지 않는다.

```ts
// 서버: 구매 토큰 하나당 한 번만 지급(멱등). 개념 예시
async function grant(userId: string, purchaseToken: string, productId: string) {
  const info = await store.verify(purchaseToken);            // 스토어 API 로 검증
  if (info.state !== "PURCHASED") return;                    // 보류(PENDING) 는 지급 금지
  await db.tx(async (t) => {
    const done = await t.insertIfAbsent("grants", { purchaseToken });
    if (done.inserted) await t.upsertEntitlement(userId, productId, info.expiresAt);
  });
  await store.acknowledge(purchaseToken);                    // 이미 확인됐으면 무시
}
```

### 서버가 진실 공급원

- **검증**: Apple 은 서명된(JWS) 거래·갱신 정보를 서버에서 검증할 수 있고, App Store Server Library 의 검증 함수를 안내한다. Google 은 서버에서 구매 토큰을 조회해 검증하고, 구매 시 `obfuscatedAccountId` 로 계정을 묶어 남용을 막으라고 권한다.
- **상태 동기화**: 클라이언트 조회만으로는 앱이 꺼진 동안의 변화를 모른다. Google 은 실시간 개발자 알림(RTDN), Apple 은 App Store Server Notifications V2 로 갱신·환불·결제 실패를 서버가 받는다. 놓친 알림은 Apple 의 Get Notification History(문서상 180일, 샌드박스 30일)로 보충한다.
- **앱은 서버의 권한 상태를 읽는다.** 오프라인에서는 마지막으로 받은 만료 시각까지 허용하는 식으로 [오프라인 우선 설계](/develop-wiki/knowledge/mobile-dev/offline-first-sync/)와 맞춘다.

### 구독 상태 모델 (Google Play 문서의 상태)

| 상태 | 접근 | 비고 |
| --- | --- | --- |
| Active | 허용 | 정상 |
| Cancelled | 만료 전까지 허용 | 갱신만 중단됨 |
| In grace period | 허용 | 결제 문제, 스토어가 재시도 중 |
| On hold | 차단 | 결제 문제가 이어져 접근 중지, 재시도 중 |
| Paused | 차단 | 사용자가 일시중지 |
| Expired | 차단 | 이탈(churn) 로 간주 |

유예 기간·보류 기간 길이는 Play Console 에서 베이스 플랜마다 설정한다. iOS 는 구독 상태에 `inGracePeriod` 등이 있어 `currentEntitlements` 가 `subscribed`·`inGracePeriod` 구독을 포함한다.

## 언제 쓰나

- 구독·프리미엄·소모성 재화를 앱에서 파는 모든 앱.  Play 는 베이스 플랜과 오퍼로 같은 구독의 여러 구성(첫 구독자용 소개 오퍼 등)을 만든다.
- 플랫폼이 두 개면 서버에 **플랫폼 중립 entitlement 모델**을 두고 스토어별 어댑터가 채우게 한다(`userId, productId, expiresAt, source`).

## 주의·비용

- 보류(PENDING) 구매는 지급하지 않는다. Play 문서는 사용자가 결제를 나중에 마칠 수 있고 앱이 꺼진 사이에도 완료될 수 있다고 설명한다. 서버 알림으로 처리한다.
- 같은 구매 토큰이 여러 번 도착할 수 있다(재시도, 복원, 알림 중복). 지급은 **멱등**이어야 한다. [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) 참고.
- 계정 연결 없이 구매하는 경우(설치 전 구매, 로그인 전 구매)를 처리하는 흐름이 필요하다. Play 는 처리하지 않은 구매가 3일 뒤 환불된다고 경고한다.
- 플랫폼 간 구독 공유, 가족 공유, 복원, 업/다운그레이드 교체 모드는 각각 문서화된 규칙이 달라 테스트 케이스가 많다. 샌드박스·테스트 트랙에서 검증한다.
- 환불에 대응하는 별도 흐름(Apple 의 소비 정보 전송 등)이 있다. 상품을 이미 소비했다면 회수 정책을 미리 정한다.
- 가격·수수료·세금·지역별 정책은 공식 정책 페이지를 확인한다. 이 노트에는 수치를 싣지 않았다.
