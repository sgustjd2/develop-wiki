---
name: Material Design 3
url: https://m3.material.io
docs: https://m3.material.io/foundations
repo: https://github.com/material-components/material-components-android
stars: 17478
domain: mobile
category: learning
description: Google의 오픈 디자인 시스템 Material 3(Material You) 공식 가이드. 색·타이포그래피·모양 토큰과 컴포넌트 사용 지침을 담으며, Android 앱 UI 설계와 Compose 테마 구성의 기준으로 쓴다.
pricing: free
tags: [design-system, material, tokens, theming, guidelines]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Material Design 3(M3)는 Google이 Android·웹·Flutter용으로 공개한 디자인 시스템의 세 번째 버전이다. 사용자 배경화면 등 **원천 색 하나에서 톤 팔레트와 역할별 색을 생성**하는 동적 색, 디자인 토큰 기반 테마, 접근성을 고려한 대비 규칙이 특징이다. 후속 확장인 **M3 Expressive**는 더 풍부한 모양·모션·컴포넌트 변형을 추가했고, Compose Material 3 라이브러리에 해당 API가 순차 반영되고 있다.

- 구현체: Android [Jetpack Compose](/develop-wiki/mobile/android/jetpack-compose/) `androidx.compose.material3`(안정 1.4.0), Android View용 Material Components for Android, [Flutter](/develop-wiki/mobile/cross-platform/flutter/) `material_ui` 패키지, 웹 [Angular Material](/develop-wiki/frontend/ui-kit/angular-material/) 등.
- 웹 컴포넌트 구현인 Material Web(`@material/web`)은 유지보수 모드다.

## 구성
| 섹션 | 내용 |
| --- | --- |
| Foundations | 접근성, 레이아웃(창 크기 클래스, 캐노니컬 레이아웃), 상호작용 상태, 디자인 토큰, 적응형 디자인 |
| Styles | 색(색 역할, 동적 색, 톤 팔레트), 타이포그래피 스케일, 모양(코너 스케일), 고도, 모션, 아이콘 |
| Components | 버튼·FAB, 내비게이션 바·레일·드로어, 앱 바, 카드, 칩, 대화상자, 시트, 텍스트 필드, 스낵바 등 사용법·해부도·명세 |
| Develop | 플랫폼별 구현 라이브러리 안내 (Android Compose·Views, Flutter, Web) |
| Blog / Resources | Figma Material 3 Design Kit, Material Theme Builder |

## 활용법
- **테마부터 토큰으로.** [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)에서 원천 색을 정하면 라이트·다크 색 체계를 Compose(`Color.kt`, `Theme.kt`) 코드로 내보낼 수 있다.
- **색은 역할 이름으로.** `primary`, `onPrimary`, `surfaceContainer`처럼 역할로 지정하면 동적 색·다크 모드에서도 대비가 유지된다.

```kotlin
@Composable
fun AppTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val context = LocalContext.current
    val colors = when {
        Build.VERSION.SDK_INT >= 31 ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        darkTheme -> darkColorScheme()
        else -> lightColorScheme()
    }
    MaterialTheme(colorScheme = colors, content = content)
}
```

- **창 크기 클래스.** Compact·Medium·Expanded 기준에 따라 내비게이션 바 → 레일 → 드로어로 바꾸는 적응형 레이아웃 지침을 따른다.
- **컴포넌트 선택.** 주요 동작 하나는 FAB, 화면 상단 요약 동작은 앱 바, 필터는 칩처럼 각 컴포넌트의 "언제 쓰나" 항목을 근거로 고른다.

## 언제 쓰나
- Android 앱 UI 설계·리뷰, Compose 디자인 시스템 구축, 디자이너와 개발자가 같은 토큰 이름으로 소통해야 할 때.
- 브랜드 디자인 시스템이 따로 있어도 M3 토큰 구조를 바탕으로 확장하면 Compose 기본 컴포넌트를 그대로 재사용하기 쉽다.

## 함께 보면 좋은 자료
- iOS 쪽 대응 문서: [Apple Human Interface Guidelines](/develop-wiki/mobile/learning/apple-human-interface-guidelines/)
- [Compose의 Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3) · [Material 3 Compose 릴리스 노트](https://developer.android.com/jetpack/androidx/releases/compose-material3)

## 공식 문서
- [m3.material.io](https://m3.material.io) · [Foundations](https://m3.material.io/foundations) · [Components](https://m3.material.io/components) · [색 체계](https://m3.material.io/styles/color/system/overview)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) · [Material Components for Android](https://github.com/material-components/material-components-android)
