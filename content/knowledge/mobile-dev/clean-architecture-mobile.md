---
title: 클린 아키텍처의 모바일 적용 (레이어·모듈화)
aka: [Clean Architecture for Mobile, UI/Domain/Data Layer, Modularization, Use Case]
category: mobile-dev
group: architecture
level: intermediate
summary: UI·도메인·데이터 계층으로 책임을 나누고 의존 방향을 안쪽으로 모으며, 앱이 커지면 모듈로 경계를 강제하는 모바일 구조 설계.
tags: [mobile, android, ios, clean-architecture, modularization, use-case]
related: [mobile-dev/mvvm-mvi-udf, mobile-dev/dependency-injection-mobile, mobile-dev/offline-first-sync, architecture/layered-clean-hexagonal, architecture/hexagonal, principles/solid]
sources:
  - https://developer.android.com/topic/architecture
  - https://developer.android.com/topic/modularization
  - https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
updatedAt: 2026-11-18
---

## 문제

- OS 프레임워크(Context, UIKit) 코드가 비즈니스 규칙 사이에 섞이면 단위 테스트가 에뮬레이터/시뮬레이터에 묶인다.
- 네트워크 응답 모델이 화면까지 그대로 올라오면 서버 필드 이름이 바뀔 때 화면이 같이 깨진다.
- 한 모듈에 모든 코드가 있으면 빌드가 느리고, 팀이 늘수록 병합 충돌이 잦다.

## 해법

Android 공식 가이드가 권하는 기본형은 **UI 계층 + 데이터 계층, 필요하면 그 사이에 도메인 계층**이다. 화살표(의존)는 UI → (도메인) → 데이터 방향이다.

| 계층 | 책임 | 모바일에서 주의할 점 |
| --- | --- | --- |
| UI | 화면 렌더링, 상태 홀더 | 플랫폼 API 는 이 계층에 가둔다 |
| 도메인(선택) | 여러 화면이 공유하는 복잡한 규칙, 유스케이스 | 가이드도 "필요할 때만" 두라고 한다 |
| 데이터 | Repository 가 데이터 소스(네트워크, DB, 파일)를 숨기고 단일 진실 공급원을 보장 | 모델을 내부용(Entity, NetworkModel)과 외부 노출용으로 분리 |

```kotlin
// 도메인: 플랫폼을 모르는 순수 코틀린
class GetFeedUseCase(private val feeds: FeedRepository, private val blocks: BlockRepository) {
    operator fun invoke(): Flow<List<FeedItem>> =
        combine(feeds.feed(), blocks.blockedIds()) { items, blocked -> items.filter { it.authorId !in blocked } }
}
// 데이터: 내부 모델을 외부 모델로 변환해 노출
fun FeedEntity.asExternalModel() = FeedItem(id, authorId, title)
```

### 모듈화로 경계 강제하기

- 폴더 규칙은 어겨도 컴파일된다. 모듈(Gradle 모듈, Swift Package)로 나누면 **의존 선언이 곧 규칙**이 된다.
- 흔한 분할: `app`(조립) / `feature-*`(화면 묶음) / `core-data`, `core-network`, `core-ui` / `domain`. feature 끼리는 서로 직접 의존하지 않고, 공개 API(인터페이스, 내비게이션 계약)만 본다.
- 공개 범위를 최소로 한다(Kotlin `internal`, Swift `internal`/`package`). 가이드도 "모듈에서 노출하는 것을 최소화"하라고 한다.

## 언제 쓰나

- 팀이 둘 이상이거나 기능이 계속 늘어나는 앱, 오래 유지할 앱.
- 도메인 규칙(가격 계산, 권한, 동기화 정책)이 UI 와 무관하게 테스트되어야 할 때.
- 빌드 시간이 병목이라 증분 빌드·병렬 빌드를 원할 때(모듈화의 직접적 이득).

## 주의·비용

- **도메인 계층을 기계적으로 만들지 않는다.** 저장소 메서드를 그대로 감싸는 유스케이스는 파일만 늘린다. 규칙이 생기거나 두 곳 이상에서 재사용될 때 만든다.
- 매핑(Entity ↔ Network ↔ 외부 모델) 코드가 늘어난다. 변경 격리의 대가이므로 모델이 사실상 같은 소규모 앱에서는 합쳐도 된다.
- 모듈을 너무 잘게 쪼개면 설정·순환 의존·Gradle/SPM 관리 비용이 이득을 넘는다. 빌드 병목이나 팀 경계 같은 **이유가 보일 때** 나눈다.
- "클린"의 동심원을 그대로 옮기려 하기보다, 모바일에서는 플랫폼 코드(UI)와 나머지의 분리, 그리고 단방향 의존을 지키는 데 집중한다.

## 비교

레이어드·헥사고날·클린의 일반론은 [레이어드 vs 헥사고날 vs 클린](/develop-wiki/knowledge/architecture/layered-clean-hexagonal/)과 [헥사고날 아키텍처](/develop-wiki/knowledge/architecture/hexagonal/)에 있다. 모바일에서는 "UI 계층"이 플랫폼 수명(회전, 프로세스 종료)의 영향을 받는다는 점이 서버 아키텍처와 가장 다르다.
