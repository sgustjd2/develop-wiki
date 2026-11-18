---
title: MVVM·MVI·단방향 데이터 흐름(UDF)과 상태 관리
aka: [MVVM, MVI, Unidirectional Data Flow, UDF, UiState, State Holder]
category: mobile-dev
group: architecture
level: intermediate
summary: 화면 상태를 한 곳(상태 홀더)에서 만들고 UI 는 그 상태만 그리며, 사용자 이벤트는 반대 방향으로 올려보내는 모바일 UI 구조 패턴과 그 변형.
tags: [mobile, android, ios, mvvm, mvi, udf, state-management]
related: [mobile-dev/clean-architecture-mobile, mobile-dev/app-lifecycle-process-death, mobile-dev/dependency-injection-mobile, architecture/layered-clean-hexagonal, principles/coupling-and-cohesion]
sources:
  - https://developer.android.com/topic/architecture
  - https://developer.android.com/topic/architecture/ui-layer/stateholders
  - https://martinfowler.com/eaaDev/uiArchs.html
updatedAt: 2026-11-18
---

## 문제

- 화면 코드(Activity, ViewController)에 네트워크 호출·상태·분기 로직이 뒤섞이면 테스트가 어렵고, 화면이 재생성될 때(회전, 프로세스 종료) 상태가 사라진다.
- 상태가 여러 곳(뷰 필드, 전역 변수, 콜백 지역 변수)에 흩어지면 "지금 화면이 왜 이 모양인가"를 추적할 수 없다.
- 이벤트와 상태가 양방향으로 얽히면(뷰가 모델을 직접 고치고 모델이 뷰를 직접 고침) 버그 재현 경로가 길다.

## 해법

핵심은 **상태는 아래로, 이벤트는 위로**(UDF)다. Android 공식 가이드는 이를 단일 진실 공급원(SSOT)과 묶어 설명한다. 데이터를 소유한 쪽만 값을 바꾸고, 바깥에는 읽기 전용 타입으로만 노출한다.

| 구성 | 역할 |
| --- | --- |
| UI(View, Composable, SwiftUI View) | 상태를 그리고, 사용자 동작을 이벤트로 올린다. 판단하지 않는다 |
| 상태 홀더(ViewModel 등) | 이벤트를 받아 비즈니스 로직을 호출하고 **화면 상태(UiState)** 를 만든다 |
| 데이터 계층(Repository) | 실제 데이터의 소유자. 변경은 여기서만 |

```kotlin
// 화면이 알아야 할 모든 것을 하나의 타입으로
sealed interface ProfileUiState {
    data object Loading : ProfileUiState
    data class Success(val name: String, val followed: Boolean) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

class ProfileViewModel(private val repo: ProfileRepository) : ViewModel() {
    val uiState: StateFlow<ProfileUiState> = repo.profile()          // 아래로: 상태
        .map<Profile, ProfileUiState> { ProfileUiState.Success(it.name, it.followed) }
        .catch { emit(ProfileUiState.Error("불러오지 못했습니다")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ProfileUiState.Loading)

    fun onFollowClick() { viewModelScope.launch { repo.toggleFollow() } } // 위로: 이벤트
}
```

```swift
// SwiftUI 에서도 같은 모양: 상태 하나 + 이벤트 함수
@MainActor final class ProfileModel: ObservableObject {
    @Published private(set) var state: State = .loading
    enum State { case loading, success(name: String), failure(String) }
    func followTapped() async { /* repo 호출 후 state 갱신 */ }
}
```

### MVVM 과 MVI 의 차이

- **MVVM**: 상태 홀더가 여러 개의 관찰 가능한 속성(또는 하나의 UiState)을 노출하고, 뷰가 메서드를 호출한다. 이벤트는 "함수 호출"이다.
- **MVI**: 모든 입력을 하나의 `Intent`(또는 Action) 타입으로 모으고, `(현재 상태, Intent) -> 새 상태`를 **리듀서**가 계산한다. 이벤트가 데이터가 되므로 로깅·재생·되돌리기가 쉽다.
- 둘은 배타적이지 않다. UiState 하나 + `onEvent(event)` 하나만 두면 MVVM 형태의 MVI 가 된다.

| 구분 | MVVM(UiState 노출) | MVI(리듀서) |
| --- | --- | --- |
| 이벤트 표현 | 메서드 호출 | 불변 Intent/Action 객체 |
| 상태 전이 | 홀더 내부 자유 | 리듀서 한 곳 |
| 디버깅·재현 | 호출 로그 필요 | 이벤트 열 그대로 재생 |
| 보일러플레이트 | 적음 | 많음 |

## 언제 쓰나

- 비동기 데이터·로딩·오류가 얽힌 화면이 있는 대부분의 앱: 최소한 "UiState 하나 + 이벤트 함수"는 기본으로 둔다.
- 폼, 결제 흐름처럼 상태 전이가 복잡하고 "어떤 이벤트가 어떤 순서로 왔는지"가 중요한 화면: MVI 식 리듀서를 고려한다.
- 상태는 **소비하는 곳에 가장 가깝게** 둔다. 화면 단위 비즈니스 상태는 ViewModel, 스크롤·드로어 같은 UI 요소 상태는 UI 쪽 일반 클래스나 컴포저블 안에 둔다.

## 주의

- **일회성 이벤트**(토스트, 화면 이동)를 상태에 넣으면 회전 때 다시 실행된다. 소비되었음을 상태에 기록하거나, 이벤트가 곧 상태 변화(예: `navigateTo` 필드를 null 로 되돌림)가 되게 설계한다.
- ViewModel 인스턴스를 하위 컴포저블에 내려보내지 않는다. 필요한 상태와 콜백만 넘기는 편이 재사용·프리뷰·테스트에 낫다(Android 가이드의 경고).
- UiState 를 너무 잘게 쪼개면 화면 일관성이 깨지고(로딩 중인데 데이터가 보이는 등), 한 덩어리로 키우면 불필요한 갱신이 생긴다. "한 화면 = 한 상태 + 하위 UI 요소 상태" 정도가 출발점이다.
- ViewModel 이 살아남는 범위(화면 재생성)와 프로세스 종료는 다르다. 프로세스가 죽으면 ViewModel 도 사라지므로 복원 가능한 최소 정보는 따로 저장해야 한다. [앱·화면 생명주기와 프로세스 종료](/develop-wiki/knowledge/mobile-dev/app-lifecycle-process-death/) 참고.
- 패턴 이름 논쟁보다 "상태의 소유자가 한 곳인가"가 본질이다. 과설계(작은 화면에 MVI 풀세트)를 경계한다.
