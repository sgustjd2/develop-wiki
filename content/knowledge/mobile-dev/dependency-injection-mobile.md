---
title: 의존성 주입(DI)과 테스트 용이성 (모바일)
aka: [Dependency Injection, DI, Hilt, Dagger, Service Locator, Constructor Injection]
category: mobile-dev
group: architecture
level: intermediate
summary: 클래스가 의존 대상을 직접 만들지 않고 밖에서 받게 해 교체·테스트를 쉽게 하는 기법. 모바일에서는 OS 가 객체를 만드는 진입점 때문에 생성자 주입이 막히는 지점을 다룬다.
tags: [mobile, android, ios, di, hilt, testing, service-locator]
related: [mobile-dev/mvvm-mvi-udf, mobile-dev/clean-architecture-mobile, testing-practice/test-doubles, principles/solid, architecture/hexagonal]
sources:
  - https://developer.android.com/training/dependency-injection
  - https://developer.android.com/topic/architecture
updatedAt: 2026-11-18
---

## 문제

- `Car` 가 `Engine()` 을 직접 만들면 둘이 단단히 묶여 다른 구현으로 바꿀 수 없고, 테스트에서 가짜(test double)를 끼울 수 없다(Android DI 가이드의 예).
- 모바일에서는 Activity, Fragment, ViewController 같은 **OS 가 생성하는 객체**가 있어 생성자에 의존성을 넘길 수 없다.
- 싱글톤·전역 접근자(`Repo.getInstance()`)는 편하지만 테스트 사이에 상태가 새고 의존 관계가 코드에 숨는다.

## 해법

의존 대상을 얻는 방법은 세 가지다: 직접 만든다 / 어딘가에서 꺼낸다(서비스 로케이터, `getSystemService`) / **파라미터로 받는다(DI)**. 공식 가이드는 DI 를 권한다.

```kotlin
// 생성자 주입: 의존이 API 에 드러나고, 테스트에서 가짜로 교체
class ProfileViewModel(private val repo: ProfileRepository) : ViewModel()

class FakeProfileRepository : ProfileRepository {
    override fun profile() = flowOf(Profile("테스트", followed = false))
}
// 테스트: ProfileViewModel(FakeProfileRepository())
```

```swift
// Swift: 프로토콜 + 이니셜라이저 주입
protocol ProfileRepository { func profile() async throws -> Profile }
final class ProfileModel { init(repo: ProfileRepository) { self.repo = repo }; private let repo: ProfileRepository }
```

### 주입 방식

| 방식 | 설명 | 모바일에서의 쓰임 |
| --- | --- | --- |
| 생성자 주입 | 필요한 것을 생성자로 받는다 | 기본값. 직접 만드는 클래스에 사용 |
| 필드/세터 주입 | 생성 후 채운다 | OS 가 만드는 Activity/Fragment 등 |
| 서비스 로케이터 | 전역 레지스트리에서 꺼낸다 | 지양. 의존이 API 에 안 보이고 테스트가 같은 전역을 공유 |

### 수동 DI → 프레임워크

- **수동 DI**: 앱 시작점에서 객체 그래프를 직접 조립하는 컨테이너를 둔다. 작은 앱에는 충분하고 마법이 없다.
- 그래프가 커지면 보일러플레이트와 수명(scope) 관리가 부담이다. Android 는 컴파일 시점에 그래프를 검증하는 **Hilt(Dagger 기반)** 를 권장하고, iOS 는 관례적으로 직접 조립(컴포지션 루트) 또는 별도 DI 라이브러리를 쓴다(공식 단일 표준은 없다).
- 리플렉션 기반(런타임 연결)과 코드 생성 기반(컴파일 타임 검증)이 있다. 모바일은 시작 시간 때문에 컴파일 타임 쪽이 선호된다.

## 언제 쓰나

- 네트워크·DB·시계·권한처럼 **테스트에서 바꿔 끼우고 싶은 경계**가 있을 때는 규모와 상관없이 생성자 주입을 쓴다.
- 객체 수명(앱 전체 / 화면 / 로그인 세션)을 구분해야 할 때 컨테이너나 Hilt 같은 프레임워크가 값을 한다.

## 주의

- DI 프레임워크가 목적이 되면 안 된다. 핵심은 "의존을 밖에서 받는다"이고, 수동 조립으로 시작해도 같은 이득을 얻는다.
- 수명 오류가 흔하다. 화면 수명 객체를 앱 수명 싱글톤이 붙잡으면 Context·View 누수가 된다. 반대로 앱 수명 객체를 화면 단위로 계속 새로 만들면 캐시가 의미가 없다.
- 프레임워크 어노테이션이 도메인 코드에 퍼지지 않게 한다. 조립(모듈, 컨테이너)은 앱·feature 경계에 모은다.
- 인터페이스를 무조건 만들지 않는다. 구현이 하나뿐이고 교체·가짜 필요가 없으면 구체 클래스를 주입해도 된다(단, 외부 I/O 경계는 예외).
- 빌드 시간: 코드 생성형 DI 는 증분 빌드 비용을 늘린다. 모듈 수가 많은 앱에서 측정한다.
