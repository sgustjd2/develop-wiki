---
title: 홈 화면 위젯과 Live Activities (갱신 예산·제약)
aka: [WidgetKit, ActivityKit, Live Activities, Dynamic Island, App Widget, Glance, Timeline Provider]
category: mobile-dev
group: platform
level: intermediate
summary: 앱 밖 화면(홈·잠금 화면·Dynamic Island)에 정보를 보여 주는 위젯과 Live Activities 의 갱신 모델, 예산, 데이터 공유 제약.
tags: [mobile, ios, android, widget, widgetkit, live-activities, activitykit, app-widget]
related: [mobile-dev/background-work-constraints, mobile-dev/push-notification-architecture, mobile-dev/navigation-deep-links, mobile-dev/app-lifecycle-process-death, mobile-dev/offline-first-sync]
sources:
  - https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
  - https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities
  - https://developer.android.com/develop/ui/views/appwidgets/advanced
updatedAt: 2026-11-19
---

## 문제

사용자는 앱을 열지 않고도 일정, 배달 진행, 경기 점수를 보고 싶어 한다. 그런데 이 표면들은 **앱 프로세스 밖에서 시스템이 그린다.** 앱이 마음대로 계속 갱신할 수 없고, 갱신 횟수·실행 시간·네트워크 접근이 제한된다. 화면을 "그리는 방식"이 일반 UI 와 다르다.

## 해법

### iOS 위젯(WidgetKit): 타임라인 모델

- 위젯은 SwiftUI 뷰를 **별도 프로세스**에서 시스템이 렌더한다. 위젯 확장은 화면에 떠 있어도 계속 돌지 않는다.
- 갱신 방법은 세 가지다: (1) 예측 가능한 시각에 맞춘 **타임라인**(날짜가 붙은 엔트리 배열 + 새 타임라인 요청 정책 `atEnd`/`after(date)`/`never`), (2) 앱이 데이터 변화 시 시스템에 타임라인 재로드 요청, (3) WidgetKit 푸시 알림(타임라인을 대체하지 않는 추가 수단).
- 가능하면 **미래 시각의 엔트리를 많이** 한 번에 만든다. 엔트리 간격은 약 5분 이상이어야 한다.
- **일일 예산**이 있다. 자주 보는 위젯은 대략 하루 40~70회 갱신이며 15~60분 간격에 해당한다는 것이 공식 설명이다. 위젯 인스턴스마다 예산이 따로다. 앱이 포그라운드일 때, 위젯 버튼의 앱 인텐트 실행, 로케일·접근성 설정 변경 등은 예산에 포함되지 않는다.
- 카운트다운·재생 진행처럼 계속 변하는 표시는 재로드 없이 동적 날짜 표시 기능을 쓰라고 안내한다.

```swift
// 개념 예시: 한 시간 간격 엔트리 4개를 만들고 끝나면 새로 요청
func getTimeline(in ctx: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let now = Date()
    let entries = (0..<4).map { Entry(date: now.addingTimeInterval(Double($0) * 3600), value: load()) }
    completion(Timeline(entries: entries, policy: .atEnd))
}
```

### iOS Live Activities(ActivityKit): 진행 중인 이벤트

- 잠금 화면, Dynamic Island, StandBy, 짝 지은 Apple Watch 등에 **현재 진행 중인 작업**(배달, 운동, 스포츠)을 보여 준다. 위젯 확장 안에서 SwiftUI 로 UI 를 만들지만 위젯 타임라인이 아니라 ActivityKit 으로 요청·갱신·종료한다.
- 모든 표시 형태(잠금 화면, compact, minimal, expanded)를 지원해야 한다.
- 공식 문서의 제약:
  - 최대 **8시간** 활성. 이후 시스템이 종료하고 Dynamic Island 에서는 즉시 사라지며 잠금 화면에는 사용자가 지우거나 최대 4시간 더 남아 **총 12시간**까지 남는다.
  - 정적+동적 데이터 합쳐 **4KB** 를 넘지 못한다.
  - **자체 샌드박스에서 돌며 네트워크 접근과 위치 업데이트를 받을 수 없다.** 갱신은 앱의 ActivityKit 호출이나 ActivityKit 푸시 알림으로 한다.
  - 이미지는 표시 크기 이하여야 하고, 잠금 화면 표현은 높이 160pt 를 넘으면 잘릴 수 있다.

### Android 앱 위젯

- `updatePeriodMillis` 는 **30분 미만을 지원하지 않는다.** 주기 갱신을 끄려면 0 을 쓴다.
- 갱신은 전체 업데이트(RemoteViews 교체, 비용이 가장 큼), 부분 업데이트, 컬렉션 데이터 갱신 세 종류다. 문서는 부분 업데이트로 비트맵·아이콘을 바꾸지 말라고 경고한다(Android 17 이상에서 비트맵 메모리 한도 초과 가능).
- 사용자가 갱신 빈도를 고르게 하려면 `updatePeriodMillis=0` 으로 두고 WorkManager 를 쓴다. 단 앱 대기 버킷 같은 전력 제한이 똑같이 적용된다.
- 브로드캐스트 리시버는 약 10초 뒤 ANR 로 간주되므로 오래 걸리면 `goAsync` 나 WorkManager 로 넘긴다.

## 언제 쓰나

- 위젯: 앱을 열기 전에 보고 싶은 요약 정보(오늘 일정, 잔액 요약, 날씨).
- Live Activities: 시작과 끝이 분명한 **단기 진행 이벤트**. 상시 정보에는 위젯이 맞다.
- 두 표면 모두 탭하면 앱의 해당 화면으로 가는 [딥 링크](/develop-wiki/knowledge/mobile-dev/navigation-deep-links/)를 설계한다.

## 주의·비용

- **예산 때문에 "실시간"은 불가능하다.** 위젯이 항상 최신이라고 기대하는 설계는 깨진다. 표시 시각(마지막 갱신 시각)을 UI 에 넣거나 날짜 기반 표시를 쓴다.
- 위젯 확장은 앱과 **별도 프로세스·샌드박스**다. 앱과 데이터를 공유할 저장 위치(앱 그룹 등)와 동기화 규칙을 따로 설계해야 한다. 공유 위치의 구체 설정은 이 노트에서 다루지 않았다(별도 확인 필요).
- Live Activities 를 서버 푸시로 갱신하면 [푸시 알림 아키텍처](/develop-wiki/knowledge/mobile-dev/push-notification-architecture/)의 토큰·전달 보장 문제를 그대로 가진다. 4KB 제한 안에 담을 상태만 보낸다.
- 플랫폼별로 개념이 다르다. iOS Live Activities 에 정확히 대응하는 Android 기능을 이 노트는 다루지 않았다.
- 크로스플랫폼 프레임워크에서도 위젯·Live Activities 는 보통 네이티브 확장으로 만든다. [크로스플랫폼 비교](/develop-wiki/knowledge/mobile-dev/cross-platform-architecture/) 참고.
