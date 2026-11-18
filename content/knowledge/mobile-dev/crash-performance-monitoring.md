---
title: 크래시·성능 모니터링과 앱 크기·시작 시간 최적화
aka: [Crash Reporting, ANR, App Startup, Cold Start, TTID, TTFD, App Size, Baseline Profile, Crashlytics]
category: mobile-dev
group: delivery
level: advanced
summary: 현장에서 일어나는 크래시·ANR·느린 시작을 수집해 우선순위를 정하고, 시작 시간과 앱 크기를 측정 기반으로 줄이는 운영 방법.
tags: [mobile, crash, anr, performance, startup, app-size, crashlytics, observability]
related: [mobile-dev/staged-rollout-remote-config, mobile-dev/app-lifecycle-process-death, performance/profiling, engineering-practice/observability-basics, engineering-practice/incident-response-postmortem]
sources:
  - https://developer.android.com/topic/performance/appstartup/analysis-optimization
  - https://firebase.google.com/docs/crashlytics
  - https://developer.android.com/topic/performance/vitals
  - https://developer.apple.com/documentation/xcode/analyzing-the-performance-of-your-app
updatedAt: 2026-11-18
---

## 문제

- 모바일 기기는 종류·OS 버전·메모리·네트워크가 다양해 개발 환경에서 안 보이던 크래시가 현장에서 터진다.
- 크래시 로그가 난독화되어 있으면(R8, 심볼 없는 iOS) 스택트레이스를 읽을 수 없다.
- 시작이 느리거나 앱이 크면 첫 인상, 설치 전환율, 이탈에 직접 영향이 있다.

## 해법

### 1. 수집: 크래시, ANR, 성능 지표

- **크래시 리포터**(Firebase Crashlytics 등, 플랫폼 자체 도구 포함)를 앱에 넣어 비정상 종료와 로그·기기 정보를 모은다. 릴리스 빌드마다 **매핑 파일(Android 난독화)·dSYM(iOS)** 을 업로드해 스택트레이스를 복원한다. CI 에 업로드 단계를 넣지 않으면 "읽을 수 없는 로그"가 쌓인다.
- Android 는 크래시 외에 **ANR**(메인 스레드가 오래 막혀 응답 없음)이 중요하다. Play Console 의 Android vitals 가 스토어 관점의 크래시·ANR 비율을 보여 준다.
- 크래시와 함께 **breadcrumb**(직전 화면·이벤트)와 사용자 비식별 ID, 앱 버전·빌드를 남겨 재현 단서를 만든다. 개인정보는 로그에 넣지 않는다.
- **크래시 없는 사용자 비율**(버전별)을 릴리스 건강 지표로 삼고 단계적 출시 확대의 관문으로 쓴다.

### 2. 우선순위화

- 건수보다 **영향 사용자 수 × 핵심 흐름 차단 여부**로 정렬한다. 새 버전에서 처음 나타난 이슈(회귀)를 가장 먼저 본다.
- 임계치를 넘으면 단계적 출시를 멈추고 킬 스위치를 검토한다. [단계적 출시·원격 설정](/develop-wiki/knowledge/mobile-dev/staged-rollout-remote-config/) 참고.

### 3. 시작 시간 최적화 (Android 공식 가이드 기준)

- 콜드/웜/핫 스타트를 구분한다. 지표는 **TTID**(첫 프레임까지)와 **TTFD**(사용할 수 있게 완전히 그려질 때까지; `reportFullyDrawn` 으로 보고)다. 둘 다 본다.
- **측정부터**: Macrobenchmark 로 시작 시간을 측정하고 Perfetto/Android Studio 프로파일러 트레이스로 큰 구간(`bindApplication`, `activityStart`, 첫 composition)과 메인 스레드 블로킹을 찾는다.
- 줄이는 방법: 시작에 불필요한 초기화(특히 서드파티 SDK) 제거·지연, 메인 스레드의 파일·네트워크 I/O 제거(디버그 빌드에서 `StrictMode`), 초기 화면의 구성(composition) 최소화, 비트맵 크기 축소, 시작 프로파일/Baseline Profile 적용, 라이브러리 초기화를 App Startup 라이브러리로 정리.
- iOS 도 같은 원칙이다: 앱 실행 전(동적 라이브러리 로딩)과 `didFinishLaunching` 이후의 작업을 Instruments 와 MetricKit 으로 측정하고, 시작 경로에서 무거운 일을 지연시킨다(세부 지표 이름은 Apple 문서에서 확인).

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) StrictMode.setThreadPolicy(
            StrictMode.ThreadPolicy.Builder().detectAll().penaltyLog().build()) // 메인 스레드 I/O 탐지
        // 분석 SDK 등은 첫 프레임 이후로 미룬다(예: 화면이 그려진 뒤 초기화)
    }
}
```

### 4. 앱 크기

- 크기는 다운로드 전환율·저사양 기기 설치 실패와 연결된다. Android 는 App Bundle 로 기기별 배포를 받고, 코드·리소스 축소(R8), 사용하지 않는 라이브러리·큰 에셋 제거로 줄인다. iOS 는 App Thinning(스토어가 기기별로 분할)과 에셋 카탈로그를 활용한다.
- 릴리스마다 크기를 CI 에서 측정해 **기준선 대비 증가를 경고**한다. 한 번 커진 크기는 되돌리기 어렵다.

## 언제 쓰나

- 출시 전부터 크래시 리포터와 심볼 업로드를 넣는다. 성능 예산(시작 시간, 크기)은 팀이 정해 CI 에서 확인한다.

## 주의

- 모니터링 SDK 자체가 시작 시간과 크기를 늘린다. 도입 후 영향을 측정한다.
- 수집 데이터는 개인정보 이슈다. 동의·익명화·Privacy Manifest/Data safety 선언과 맞아야 한다. [권한 모델과 프라이버시](/develop-wiki/knowledge/mobile-dev/permissions-privacy/) 참고.
- 평균은 거짓말한다. 시작 시간·ANR 은 p50 보다 p90/p95, 저사양 기기 구간을 본다.
- 개발 기기·디버그 빌드에서 잰 시작 시간은 의미가 없다. 릴리스 빌드(난독화·프로파일 적용)로 실기기에서 측정한다.
- 크래시를 숨기려고 예외를 삼키는(catch 후 무시) 방식은 상태 손상을 만든다. 복구 가능한 오류와 치명적 오류를 구분한다.
