---
title: 백그라운드 작업 제약 (Doze·BGTaskScheduler·WorkManager)
aka: [Background Work, Doze, App Standby, WorkManager, BGTaskScheduler, Foreground Service]
category: mobile-dev
group: platform
level: advanced
summary: 모바일 OS 는 배터리를 위해 백그라운드 실행을 제한한다. 작업 성격별로 올바른 API 를 고르고 "제때 실행되지 않을 수 있음"을 전제로 설계하는 방법.
tags: [mobile, android, ios, background, doze, workmanager, bgtaskscheduler]
related: [mobile-dev/push-notification-architecture, mobile-dev/offline-first-sync, mobile-dev/app-lifecycle-process-death, mobile-dev/permissions-privacy, performance/timeout-retry-circuit-breaker]
sources:
  - https://developer.android.com/guide/background
  - https://developer.android.com/training/monitoring-device-state/doze-standby
  - https://developer.apple.com/documentation/backgroundtasks
updatedAt: 2026-11-18
---

## 문제

- 서버 감각으로 "주기적으로 돌리는 작업"을 만들면 모바일에서는 제때 돌지 않거나 아예 안 돈다. 앱이 보이지 않으면 OS 가 실행을 미루고 줄인다.
- 반대로 백그라운드에서 계속 도는 앱은 배터리를 먹어 사용자가 제한하거나 삭제하고, 스토어 정책 위반이 될 수 있다.
- 앱이 종료되어도 끝나야 하는 업로드·동기화가 있다.

## 해법: 작업 성격으로 도구 고르기

Android 공식 가이드는 크게 세 범주로 나눈다.

| 성격 | Android | iOS |
| --- | --- | --- |
| 앱이 보이는 동안만 의미 있는 비동기 작업 | 코루틴, 스레드. 앱이 백그라운드로 가면 끝난다는 보장 없음 | Swift concurrency, GCD. 같음 |
| 미뤄져도 되지만 반드시 끝나야 함(동기화, 업로드) | **WorkManager**(제약 조건, 재시도, 체인, 앱 재시작 후에도 유지) | `BGAppRefreshTask`(짧은 갱신), `BGProcessingTask`(긴 작업, 충전·네트워크 조건 요청), 백그라운드 `URLSession`(전송을 OS 가 대신 수행) |
| 즉시, 사용자에게 보이게 지속(내비게이션, 음악, 운동 기록) | **Foreground Service**(알림 필수, 유형 선언, 시작 제한) | 백그라운드 모드(오디오, 위치 등) 선언 |
| 서버가 알려줌 | FCM 메시지 수신 후 짧게 처리하거나 WorkManager 로 넘김 | 알림/사일런트 푸시(보장 없음) |

```kotlin
// 네트워크가 연결될 때 실행되고, 실패하면 백오프로 재시도하는 영속 작업
val request = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
    .build()
WorkManager.getInstance(context).enqueueUniqueWork("sync", ExistingWorkPolicy.KEEP, request)
```

```swift
// Info.plist 의 BGTaskSchedulerPermittedIdentifiers 에 식별자 등록 필요
let req = BGAppRefreshTaskRequest(identifier: "com.example.refresh")
req.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)   // "이 시각 이후"일 뿐 정시 보장 아님
try? BGTaskScheduler.shared.submit(req)
```

### Android 전원 관리(Doze, App Standby)

- **Doze**: 기기가 충전 중이 아니고 정지한 채 화면이 꺼진 시간이 길어지면 진입한다. 네트워크 접근 중단, 웨이크락 무시, 일반 알람·JobScheduler(WorkManager 포함) 지연, Wi-Fi 스캔 중단. 주기적인 **유지보수 창(maintenance window)** 에서 밀린 작업을 처리하고, 비활동이 길수록 창 간격이 늘어난다.
- **App Standby**: 사용자가 한동안 쓰지 않은 앱의 백그라운드 네트워크를 지연시킨다. 사용자가 앱을 열거나, 포그라운드 프로세스가 있거나, 사용자에게 보이는 알림이 있으면 대기 상태가 되지 않는다.
- `setExactAndAllowWhileIdle` 같은 예외 알람은 앱당 9분에 한 번 이상 울리지 않는다.
- 즉시 전달이 필요하면 직접 연결을 유지하지 말고 FCM 을 쓴다. 사용자에게 보이는 시급한 알림은 높은 우선순위(RemoteNotification), 데이터 동기화처럼 급하지 않은 것은 낮은 우선순위(BackgroundSync)로 구분한다. [푸시 알림 구조](/develop-wiki/knowledge/mobile-dev/push-notification-architecture/) 참고.
- 배터리 최적화 예외 요청은 앱의 핵심 기능이 깨지는 경우 등으로 제한되며, Google Play 정책이 그 외 요청을 금지한다.

### iOS: 시스템 재량

시스템이 배터리, 저전력 모드, 네트워크, 사용자의 앱 사용 빈도로 실행 시점을 정한다. 사용자가 백그라운드 앱 새로 고침을 끄거나 앱을 강제 종료하면 백그라운드 실행이 크게 제한된다. 작업은 만료 핸들러를 처리하고 끝나면 즉시 완료를 알려야 한다.

## 언제 쓰나

- 동기화·업로드·정리: WorkManager / BGProcessingTask / 백그라운드 URLSession.
- 사용자가 인지하는 지속 작업만 Foreground Service. 대체 API(지오펜스, 사용자 시작 데이터 전송, PiP)가 있으면 그쪽을 쓴다.

## 주의

- **정시 실행을 가정하지 않는다.** "15분마다"는 하한일 뿐이다. 마지막 동기화 시각을 저장하고, 앱이 열릴 때 따라잡기(catch-up) 동기화를 항상 넣는다.
- 작업은 **멱등**하고 중단·재시작에 안전해야 한다. 한 번의 실행 시간이 짧아야 한다(Android 공식 가이드는 약 10분 넘는 작업은 중단 가능성이 높다고 안내한다).
- 포그라운드 서비스를 "앱이 죽지 않게" 하려는 목적으로 쓰지 않는다(공식 문서가 명시적으로 경고).
- 백그라운드 위치·배터리 최적화 예외 등은 심사·정책 이슈와 연결된다. [권한 모델과 프라이버시](/develop-wiki/knowledge/mobile-dev/permissions-privacy/), [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/) 참고.
- 제조사별 추가 절전 정책(일부 Android 기기)은 공식 문서 범위 밖이며 실기기 테스트가 필요하다.
- 테스트: `adb shell dumpsys deviceidle force-idle` 로 Doze 를 강제하고 앱이 복귀 후 정상 동작하는지 본다(공식 가이드의 절차).
