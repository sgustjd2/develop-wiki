---
title: 앱·화면 생명주기와 프로세스 종료·상태 복원
aka: [App Lifecycle, Activity Lifecycle, Scene Lifecycle, Process Death, State Restoration, SavedStateHandle]
category: mobile-dev
group: platform
level: intermediate
summary: OS 가 화면과 프로세스를 언제든 만들고 없앨 수 있다는 전제 아래, 각 콜백에서 할 일과 종료 후 복원해야 할 최소 상태를 정리한다.
tags: [mobile, android, ios, lifecycle, process-death, state-restoration]
related: [mobile-dev/mvvm-mvi-udf, mobile-dev/background-work-constraints, mobile-dev/navigation-deep-links, mobile-dev/crash-performance-monitoring, cs-fundamentals/process-thread]
sources:
  - https://developer.android.com/guide/components/activities/activity-lifecycle
  - https://developer.android.com/topic/architecture
  - https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle
updatedAt: 2026-11-18
---

## 문제

- 모바일은 자원이 제한되어, OS 가 사용자 모르게 화면을 재생성하거나(회전, 다크 모드, 접기) 프로세스를 통째로 죽인다.
- 컴포넌트에 데이터를 저장해 두면 재생성 때 사라진다. Android 아키텍처 가이드도 컴포넌트는 따로따로 순서 없이 시작될 수 있고 언제든 파괴되니 상태를 넣지 말라고 한다.
- 개발 중에는 앱이 항상 살아 있어 이 문제가 안 보이다가, 사용자가 다른 앱을 쓰다 돌아온 순간 빈 화면이나 크래시로 나타난다.

## 해법

### Android: 콜백과 프로세스 우선순위

핵심 콜백은 `onCreate`, `onStart`, `onResume`, `onPause`, `onStop`, `onDestroy` 여섯 개다.

| 콜백 | 쓸 만한 일 | 하지 말 것 |
| --- | --- | --- |
| onStart / onStop | 화면에 보이는 동안만 필요한 구독·센서·애니메이션 시작/해제 | - |
| onResume / onPause | 포커스가 필요한 자원(카메라 미리보기)의 시작/해제 | `onPause` 에서 저장·네트워크·DB 트랜잭션(너무 짧아 끝나지 않을 수 있음) |
| onStop | 무거운 정리, 임시 저장 | - |
| onDestroy | 남은 자원 해제. 회전 같은 재생성인지 `isFinishing` 으로 구분 가능 | 상태를 여기서만 저장 |

- 시스템은 Activity 가 아니라 **프로세스**를 죽인다. 보이지 않는(Stopped) 프로세스가 먼저, 포커스를 가진(Resumed) 프로세스가 가장 나중이다.
- Compose 에서는 콜백에 로직을 직접 쓰기보다 `collectAsStateWithLifecycle` 같은 생명주기 인식 수집으로 "보일 때만 수집"한다.

### iOS: 앱 상태와 씬

앱은 Not running / Inactive / Active / Background / Suspended 상태를 오간다. iOS 13+ 는 앱 델리게이트 대신 **씬(Scene) 델리게이트**(`sceneWillResignActive`, `sceneDidEnterBackground`, `sceneWillEnterForeground`)가 화면 단위 전이를 받는다. 백그라운드 진입 시 데이터를 저장하고 공유 자원을 풀며, 복원은 `NSUserActivity`/씬 상태 복원 정보로 한다(복원은 옵트인이며 저장한 것만 돌아온다).

### 상태를 세 층으로 나눈다

| 층 | 살아남는 범위 | 담을 것 |
| --- | --- | --- |
| 화면 메모리(ViewModel, 메모리 객체) | 화면 재생성(회전)까지. **프로세스 종료는 못 넘음** | 화면 상태, 진행 중 작업 결과 |
| 저장 인스턴스 상태(`rememberSaveable`, `SavedStateHandle`, 씬 복원) | 프로세스 종료까지 | 스크롤 위치, 입력 중 텍스트, 열려 있던 항목 ID 같은 **아주 작은 값** |
| 영속 저장소(DB, 파일, DataStore, UserDefaults) | 영구 | 사용자 데이터, 임시 저장본(draft) |

Android 가이드는 인스턴스 상태가 메인 스레드 직렬화와 시스템 프로세스 메모리를 쓰므로 소량에만 쓰라고 한다. 큰 데이터는 영속 저장소에 넣고, 복원 때는 "ID 로 다시 읽기"가 되게 한다.

```kotlin
class DetailViewModel(handle: SavedStateHandle, repo: ItemRepository) : ViewModel() {
    private val itemId: String = checkNotNull(handle["itemId"])        // 프로세스 종료 후에도 남는 최소 정보
    val item = repo.observe(itemId).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
}
```

## 언제 쓰나(점검 습관)

- 입력 폼, 결제·결과 대기, 긴 목록 위치처럼 **사용자가 잃으면 화가 나는 상태**마다 어느 층에 둘지 정한다.
- 개발자 옵션의 "활동 유지 안 함(Don't keep activities)", `adb shell am kill <패키지>`, iOS 시뮬레이터의 백그라운드 후 강제 종료로 복원 경로를 직접 시험한다.

## 주의

- ViewModel 은 회전은 넘기지만 프로세스 종료는 못 넘는다. "ViewModel 에 넣었으니 안전"은 흔한 오해다.
- `onPause`/`sceneDidEnterBackground` 에서 오래 걸리는 저장을 하면 시간 제한에 걸린다. 변경 시점마다 점진적으로 저장하는 편이 안전하다.
- 사용자가 최근 앱 목록에서 직접 종료한 경우는 복원 기대치가 다르다. iOS 는 사용자가 강제 종료한 앱의 백그라운드 실행을 제한한다.
- 복원 데이터가 오래되었거나(스키마 변경, 삭제된 항목) 없을 때의 폴백 화면을 반드시 둔다.
- 백그라운드 작업은 생명주기와 별개로 취급해야 한다. [백그라운드 작업 제약](/develop-wiki/knowledge/mobile-dev/background-work-constraints/) 참고.
