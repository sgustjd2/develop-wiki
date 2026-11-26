---
name: WorkManager
url: https://developer.android.com/topic/libraries/architecture/workmanager
docs: https://developer.android.com/topic/libraries/architecture/workmanager
repo: https://github.com/androidx/androidx
stars: 6152
domain: mobile
category: android
description: 앱이 종료되거나 기기가 재부팅돼도 보장되어야 하는 지연 가능한 백그라운드 작업(동기화, 업로드, 정리)을 제약 조건과 함께 예약하는 Jetpack 라이브러리.
pricing: oss
tags: [background, jetpack, scheduling, coroutines]
languages: [kotlin, java]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
WorkManager는 "반드시 언젠가는 끝나야 하는" 비동기 작업을 위한 Jetpack 라이브러리다. 작업과 제약(네트워크·충전 상태 등)을 내부 DB에 저장하므로 프로세스가 죽거나 재부팅되어도 조건이 맞으면 다시 실행된다. API 레벨에 따라 JobScheduler·AlarmManager를 알아서 고른다.

- 이 문서는 `androidx.work:work-runtime` **2.12.0** 기준이다(Google Maven 최신 안정, Apache-2.0).
- 즉시 실행하고 화면과 생명주기를 같이하는 작업은 [Kotlin Coroutines](/develop-wiki/mobile/android/kotlin-coroutines/)로 충분하다. WorkManager는 **앱 수명보다 오래 가야 하는** 작업용이다.

## 설치
```kotlin
dependencies {
    implementation("androidx.work:work-runtime:2.12.0")
    androidTestImplementation("androidx.work:work-testing:2.12.0")
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Worker` / `CoroutineWorker` | 실제 작업 클래스. 코루틴이면 `doWork()`가 `suspend` |
| `WorkRequest` | `OneTimeWorkRequest`(1회), `PeriodicWorkRequest`(주기, 최소 15분) |
| `Constraints` | 네트워크 종류, 충전 중, 저장 공간, 배터리 부족 아님 등 실행 조건 |
| `Data` | 입출력 값(작은 키-값 맵) |
| Unique work | 이름 단위로 중복 방지: `enqueueUniqueWork` + `ExistingWorkPolicy` |
| Chaining | `beginWith(a).then(b).enqueue()`로 순차·병렬 조합 |
| Backoff | 실패 시 `Result.retry()`와 선형/지수 재시도 간격 |
| Expedited | `setExpedited`로 빠른 실행 요청(쿼터 제한) |
| `WorkInfo` | 상태(ENQUEUED, RUNNING, SUCCEEDED …)를 Flow/LiveData로 관찰 |

## 기본 사용법
```kotlin
class UploadWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val path = inputData.getString("path") ?: return Result.failure()
        return try { upload(path); Result.success() }
        catch (e: IOException) { Result.retry() }
    }
}

val request = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workDataOf("path" to "/data/photo.jpg"))
    .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.UNMETERED).build())
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
    .build()

WorkManager.getInstance(context)
    .enqueueUniqueWork("upload-photo", ExistingWorkPolicy.KEEP, request)
```
`upload`는 앱이 정의하는 함수다.

## 자주 쓰는 패턴
- **주기 동기화**: `PeriodicWorkRequestBuilder<SyncWorker>(1, TimeUnit.HOURS)` + `enqueueUniquePeriodicWork`. 정확한 시각은 보장되지 않는다.
- **진행 상태 표시**: `setProgress()`로 진행률을 내보내고 `getWorkInfoByIdFlow`로 UI에서 관찰한다.
- **Hilt 연동**: `@HiltWorker` + `@AssistedInject`로 Worker에 의존성을 주입하고 `HiltWorkerFactory`를 `Configuration`에 등록한다([Hilt](/develop-wiki/mobile/android/hilt/)).
- **장기 실행**: 긴 작업은 `setForeground()`로 포그라운드 서비스 알림을 띄워 계속 실행한다.
- **테스트**: `work-testing`의 `TestListenableWorkerBuilder`로 Worker를 단독 실행하고, `WorkManagerTestInitHelper`로 제약·주기를 시뮬레이션한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 로그·분석 업로드, 오프라인 변경분 동기화, 캐시 정리처럼 지연되어도 되지만 반드시 완료돼야 하는 작업.
- 피할 때(대안): 정확한 시각 알람(`AlarmManager` 정확 알람), 사용자가 보는 즉시 작업(코루틴), 지속 재생·위치 추적(포그라운드 서비스), 서버가 깨우는 작업([FCM](/develop-wiki/mobile/mobile-backend/firebase-cloud-messaging/)).

## 공식 문서
- [WorkManager 개요](https://developer.android.com/topic/libraries/architecture/workmanager) · [작업 정의](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work) · [백그라운드 작업 선택 가이드](https://developer.android.com/develop/background-work/background-tasks)
