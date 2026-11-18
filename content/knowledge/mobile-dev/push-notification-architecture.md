---
title: 푸시 알림 구조 (APNs·FCM·토큰·신뢰성)
aka: [Push Notification, APNs, FCM, Device Token, Silent Push, Data Message]
category: mobile-dev
group: platform
level: advanced
summary: 서버에서 OS 푸시 서비스(APNs, FCM)를 거쳐 기기로 알림이 전달되는 경로, 토큰 수명 관리, 전달이 보장되지 않는다는 전제의 설계 원칙.
tags: [mobile, android, ios, push, apns, fcm, token, reliability]
related: [mobile-dev/background-work-constraints, mobile-dev/permissions-privacy, mobile-dev/navigation-deep-links, mobile-dev/offline-first-sync, distributed-systems/idempotency]
sources:
  - https://firebase.google.com/docs/cloud-messaging/manage-tokens
  - https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-priority
  - https://developer.android.com/training/monitoring-device-state/doze-standby
  - https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server
updatedAt: 2026-11-18
---

## 문제

- 앱이 꺼져 있어도 사용자에게 소식을 전해야 하지만, 앱이 서버와 직접 연결을 유지하면 배터리를 먹고 Doze 등에 막힌다.
- 푸시는 "전달 시도"일 뿐 도착·표시·클릭을 보장하지 않는다. 이를 모르고 푸시를 데이터 전달 수단으로 쓰면 유실이 난다.
- 기기 토큰은 바뀌고 사라진다. 죽은 토큰에 계속 보내면 낭비이고 발송 품질 저하로 이어진다.

## 해법

### 경로

```
앱 서버 ──(HTTP)──> FCM  ──> (Android) 기기의 Google 서비스 연결 ──> 앱
앱 서버 ──(HTTP/2)──> APNs ───────────────────────────────────> iOS 기기
              (FCM 을 쓰는 iOS 앱은 FCM 이 APNs 로 중계)
```

1. 앱이 푸시를 등록하고 OS/FCM 에서 **토큰**을 받는다(iOS 는 `registerForRemoteNotifications` 후 디바이스 토큰).
2. 앱이 토큰을 서버에 올린다(사용자 ID, 기기, 앱 버전, 갱신 시각과 함께).
3. 서버가 토큰으로 메시지를 보낸다. 토큰이 무효하면 오류로 알려 준다.
4. OS 가 알림을 표시하거나 앱에 데이터를 전달한다.

모든 앱이 OS 의 **공유 연결 하나**를 쓰기 때문에 배터리에 유리하다(Android 가이드가 FCM 사용을 강하게 권하는 이유).

### 메시지 종류

| 종류 | 동작 | 용도 |
| --- | --- | --- |
| 알림(notification) 메시지 | 앱이 백그라운드/종료여도 OS 가 표시 | 사용자에게 보여줄 알림 |
| 데이터(data) 메시지 | 앱 코드가 처리 | 동기화 트리거, 앱 내부 갱신 |
| 사일런트/백그라운드 푸시(iOS `content-available`) | 앱을 잠깐 깨움 | 전달 보장 없음, OS 가 제한 |

- **우선순위**: FCM 의 높은 우선순위는 Doze 중에도 즉시 전달을 시도하고, 일반 우선순위는 백그라운드 앱에 지연될 수 있다. 사용자에게 바로 보여야 하는 알림만 높은 우선순위로 한다. Apple 기기에서는 데이터 메시지에 높은 우선순위를 쓸 수 없다(FCM 이 `INVALID_ARGUMENT` 로 거부).
- APNs 는 `apns-push-type`, `apns-priority`(즉시/전력 고려), `apns-expiration`(만료 후 폐기), `apns-collapse-id`(같은 ID 는 교체) 같은 헤더로 전달 성격을 정한다. `apns-priority` 는 10 이 즉시 전달, 5 가 기기 전력을 고려한 전달이며 생략하면 10 이다. `apns-expiration` 은 UNIX 초이고 0 이면 한 번만 시도하고 저장하지 않는다. `apns-collapse-id` 는 64바이트 이하여야 한다. `apns-push-type` 은 페이로드와 일치해야 하며 watchOS 6 이상에서는 필수다. `background` 푸시 타입은 우선순위 5 만 쓸 수 있고 10 은 오류다. 인증은 키 기반 JWT 가 권장되며, 토큰은 20분 이상 간격으로 갱신하되 발급 후 1시간을 넘기면 안 된다(1시간이 지나면 `ExpiredProviderToken` 403, 같은 연결에서 20분 안에 새 토큰을 쓰면 오류).

```ts
// 서버 측 토큰 보관: 마지막으로 앱이 확인한 시각을 같이 기록
interface PushToken { userId: string; token: string; platform: 'ios' | 'android'; refreshedAt: Date }
async function sendTo(t: PushToken, msg: object) {
  const res = await fcm.send({ token: t.token, ...msg });
  if (res.error === 'UNREGISTERED') await tokens.delete(t.token); // 유효한 페이로드일 때만 삭제
}
```

### 토큰 수명 관리 (FCM 문서 기준)

- 서버에 토큰과 함께 **타임스탬프**를 저장하고 앱이 올릴 때마다 갱신한다.
- 보내기 전에 오래된 토큰을 거르고, 정기 작업(예: 매일)으로 오래된 것을 지운다. FCM 은 기본적으로 한 달간 연결되지 않은 등록을 오래된 것으로 본다. 용도에 맞게 기준을 직접 정한다.
- Android 에서는 270일 비활성 등록이 만료된다. iOS 는 APNs 쪽에 그런 만료가 없어 서버가 능동적으로 정리해야 한다.
- `UNREGISTERED`(404)는 무효 등록이다. `INVALID_ARGUMENT`(400)는 페이로드 오류일 수도 있으므로 페이로드가 정상임을 확신할 때만 토큰을 삭제한다.
- 로그아웃·계정 전환 시 토큰과 사용자의 연결을 끊어, 다른 사람 알림이 남의 기기로 가지 않게 한다.

## 언제 쓰나

- 앱이 닫혀 있을 때 알려야 하는 이벤트(메시지, 주문 상태, 보안 알림).
- 데이터가 바뀌었음을 알리는 **트리거**: 알림 후 앱이 최신 데이터를 직접 가져온다(푸시 기반 동기화).

## 주의·비용

- **푸시에 필수 데이터를 싣지 않는다.** 푸시는 유실·중복·순서 뒤바뀜이 가능하다. 알림은 "알림", 진실은 서버 API 로 두고 앱이 열릴 때 따라잡는다. [오프라인 우선 동기화](/develop-wiki/knowledge/mobile-dev/offline-first-sync/) 참고.
- 같은 이벤트가 두 번 올 수 있으므로 처리는 멱등하게 한다. 이벤트 ID 를 담아 중복을 걸러낸다.
- 알림 표시에는 사용자 권한이 필요하다(iOS 알림 권한, Android 13+ 알림 런타임 권한). 요청 시점과 문구는 [권한 모델](/develop-wiki/knowledge/mobile-dev/permissions-privacy/)에서 다룬다.
- 푸시 남발은 알림 권한 해제·앱 삭제로 이어진다. 채널(Android)/카테고리 구분과 빈도 제어를 둔다.
- Doze 에 의존해 푸시로 앱을 깨워 일을 시키려 해도 제한된다. 알림이 없는 사일런트 용도에 "즉시 전달용 높은 우선순위"를 쓰는 것은 공식 문서가 금하는 사용이다.
- 알림 페이로드에 민감 정보를 평문으로 넣지 않는다. 잠금 화면에 노출된다.
