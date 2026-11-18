---
name: Android Developers 가이드
url: https://developer.android.com
docs: https://developer.android.com/guide
domain: mobile
category: learning
description: Google의 공식 Android 개발 문서 사이트. 앱 기본 구성요소, 아키텍처 가이드, Compose UI, 품질 기준, 버전별 변경 사항과 무료 코스를 제공하는 Android 학습의 1차 자료다.
pricing: free
tags: [android, guide, architecture, course, documentation]
languages: [kotlin]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
developer.android.com은 Android 플랫폼 API 레퍼런스, Jetpack 라이브러리 문서, Android Studio·빌드 문서, 디자인·품질 지침을 한곳에 모은 공식 사이트다. Kotlin과 [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/)를 기본 전제로 쓰여 있고, 각 페이지에 Kotlin·Java 예제가 함께 붙는다. 한국어(`?hl=ko`)를 포함한 여러 언어로 제공되며, 상당수는 기계 번역이라 최신 내용은 영어판이 앞설 수 있다.

- 버전 정보 페이지(About → Versions)에서 Android 16, 17 같은 플랫폼 릴리스의 동작 변경·새 API를 정리한다.
- 언어는 [Kotlin](/develop-wiki/languages/kotlin/).

## 구성
| 영역 | 내용 |
| --- | --- |
| Get started / Courses | 코스 **Android Basics with Compose**(입문), Compose·아키텍처 학습 경로, Codelab |
| App fundamentals | Activity, Service, BroadcastReceiver, ContentProvider, Intent, Manifest, 권한 |
| UI | Compose 레이아웃·테마·애니메이션, 적응형(태블릿·폴더블) 레이아웃, View 시스템 |
| App architecture | UI 계층·도메인 계층·데이터 계층 구성, 단방향 데이터 흐름, 권장 사항 체크리스트 |
| Data & files | DataStore, Room, 파일 저장소, 백그라운드 작업(WorkManager) |
| Build | Gradle·AGP 구성, 빌드 변형, 의존성, R8 최적화 |
| Test | 로컬·계측 테스트, Compose 테스트, [Espresso](/develop-wiki/mobile/mobile-testing/espresso/), UI Automator |
| Quality | 핵심 앱 품질 기준, 성능(Baseline Profile, Macrobenchmark), 접근성, 보안 |
| Distribute | Play 출시, App Bundle, 타깃 API 요구 사항 |

## 활용법
- **아키텍처 기준점.** [앱 아키텍처 가이드](https://developer.android.com/topic/architecture)와 [권장 사항](https://developer.android.com/topic/architecture/recommendations)이 ViewModel·Repository·단방향 데이터 흐름 구조를 설명한다. 참고 구현은 [Now in Android](https://github.com/android/nowinandroid) 샘플 앱.
- **버전 업 체크리스트.** 매년 targetSdk를 올릴 때 해당 버전 페이지의 "동작 변경: 모든 앱 / 해당 버전을 타깃팅하는 앱"을 순서대로 확인한다.
- **접근성 기준.** 터치 대상은 최소 48dp×48dp를 권장한다.
- **라이브러리 버전 확인.** Jetpack 각 라이브러리의 릴리스 노트 페이지(`/jetpack/androidx/releases/<이름>`)에 최신 안정·알파 버전과 의존성 선언이 있다.
- **샘플 코드.** 문서의 코드 조각은 GitHub `android/snippets` 저장소에서 컴파일되는 상태로 관리된다.

## 언제 쓰나
- Android를 처음 배울 때(코스), 새 API나 플랫폼 동작 변경을 확인할 때, 팀 아키텍처 규칙의 근거가 필요할 때.
- 블로그·강의 내용이 오래됐는지 의심될 때 1차 출처로 대조한다.

## 함께 보면 좋은 자료
- [Android Studio](/develop-wiki/mobile/android/android-studio/) · [Android Jetpack](/develop-wiki/mobile/android/android-jetpack/) · [Material Design 3](/develop-wiki/mobile/learning/material-design-3/)
- [Android Developers 블로그](https://android-developers.googleblog.com/) · [Now in Android 샘플](https://github.com/android/nowinandroid)

## 공식 문서
- [개발자 가이드](https://developer.android.com/guide) · [코스](https://developer.android.com/courses) · [Android Basics with Compose](https://developer.android.com/courses/android-basics-compose/course)
- [앱 아키텍처](https://developer.android.com/topic/architecture) · [핵심 앱 품질](https://developer.android.com/docs/quality-guidelines/core-app-quality) · [Android 버전](https://developer.android.com/about/versions)
