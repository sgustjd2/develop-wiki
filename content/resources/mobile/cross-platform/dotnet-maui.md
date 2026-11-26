---
name: .NET MAUI
url: https://dotnet.microsoft.com/apps/maui
docs: https://learn.microsoft.com/dotnet/maui/
repo: https://github.com/dotnet/maui
stars: 23316
domain: mobile
category: cross-platform
description: C#과 XAML로 Android·iOS·macOS(Mac Catalyst)·Windows 앱을 하나의 프로젝트에서 만드는 Microsoft의 크로스플랫폼 UI 프레임워크. Xamarin.Forms의 후속이다.
pricing: oss
tags: [cross-platform, xaml, dotnet, mvvm]
languages: [csharp]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
.NET Multi-platform App UI(.NET MAUI)는 하나의 프로젝트에서 C# 코드와 XAML 마크업으로 화면을 정의하고, **핸들러**가 각 플랫폼의 네이티브 컨트롤로 매핑하는 프레임워크다. Xamarin.Forms를 대체하며 [.NET](/develop-wiki/backend/runtime-language/dotnet/) SDK의 워크로드로 배포된다.

- 현재: **.NET 11**(2026-11-10 정식, STS) 대응 MAUI **11.0.10**. 장기 지원이 필요하면 .NET 10(LTS) 대응 MAUI 10.0.x.
- .NET 11 변경점: 모든 MAUI 플랫폼에서 **CoreCLR이 기본 런타임**(Mono는 선택, NativeAOT는 옵트인), Android 기본 컨트롤 Material 3 스타일, Shell 경로 템플릿, Passkeys API, `Microsoft.Maui.Controls.Compatibility` 패키지 제거.
- learn.microsoft.com 문서는 한국어 번역(ko-kr)을 제공한다. MIT. 언어는 [C#](/develop-wiki/languages/csharp/).

## 설치
```bash
dotnet workload install maui     # MAUI 워크로드
dotnet new maui -n MyApp
cd MyApp
dotnet build -t:Run -f net11.0-android
dotnet build -t:Run -f net11.0-ios      # macOS + Xcode 필요
```

Visual Studio(Windows), VS Code + .NET MAUI 확장에서도 만들고 실행할 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Single project | 한 `.csproj`에 `net11.0-android;net11.0-ios;...` 다중 타깃. 리소스(아이콘·폰트) 공유 |
| `MauiProgram.CreateMauiApp` | 앱 빌더. DI 등록·폰트·핸들러 구성 |
| XAML | UI 선언 마크업. C# 코드만으로도 작성 가능 |
| Layout | `VerticalStackLayout`, `Grid`, `FlexLayout`, `CollectionView` |
| Data binding | `{Binding Name}`으로 ViewModel 속성 연결, `x:DataType`으로 컴파일 타임 바인딩 |
| Handler | 크로스플랫폼 컨트롤 ↔ 네이티브 뷰 매핑. `Mapper`로 커스터마이즈 |
| Shell | URI 기반 내비게이션, 플라이아웃·탭 구조 |
| Platform APIs | 센서·연락처·보안 저장소 등 `Microsoft.Maui.*` 네임스페이스 |
| Blazor Hybrid | `BlazorWebView`로 Razor 컴포넌트를 네이티브 앱 안에 렌더링 |

## 기본 사용법
```xml
<!-- MainPage.xaml -->
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MyApp.MainPage">
    <VerticalStackLayout Padding="24" Spacing="12">
        <Label x:Name="CountLabel" Text="탭 0회" FontSize="24" />
        <Button Text="더하기" Clicked="OnAddClicked" />
    </VerticalStackLayout>
</ContentPage>
```

```csharp
// MainPage.xaml.cs
namespace MyApp;

public partial class MainPage : ContentPage
{
    int count;
    public MainPage() => InitializeComponent();

    void OnAddClicked(object? sender, EventArgs e)
    {
        count++;
        CountLabel.Text = $"탭 {count}회";
    }
}
```

## 자주 쓰는 패턴
- **MVVM.** CommunityToolkit.Mvvm의 `[ObservableProperty]`·`[RelayCommand]` 소스 생성기로 ViewModel 보일러플레이트를 줄이는 구성이 흔하다.
- **DI.** `builder.Services.AddSingleton<MainViewModel>()` 후 페이지 생성자에서 주입받는다.
- **컴파일된 바인딩.** XAML에 `x:DataType`을 지정하면 바인딩 오류를 빌드 시 잡고 트리밍·AOT와도 호환된다.
- **플랫폼별 코드.** `Platforms/Android`, `Platforms/iOS` 폴더나 `#if ANDROID` 조건부 컴파일.
- **Xamarin.Forms 이전.** .NET 11에서 Compatibility 패키지가 빠졌으므로 남은 렌더러를 핸들러로 옮긴 뒤 올린다.

## 언제 쓰나 / 피할 때
- 쓸 때: C#·.NET 백엔드([ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/))와 모델·로직을 공유하는 사내 앱, Windows 데스크톱까지 한 코드로 낼 때, 기존 Xamarin 앱 이전.
- 피할 때(대안): 모바일 커뮤니티 라이브러리 폭이 중요하면 [Flutter](/develop-wiki/mobile/cross-platform/flutter/)·[React Native](/develop-wiki/mobile/cross-platform/react-native/). Linux 데스크톱은 공식 지원 대상이 아니다.

## 공식 문서
- [.NET MAUI 문서](https://learn.microsoft.com/dotnet/maui/) · [.NET 11의 새로운 기능](https://learn.microsoft.com/dotnet/maui/whats-new/dotnet-11)
- [지원 플랫폼](https://learn.microsoft.com/dotnet/maui/supported-platforms) · [GitHub 릴리스](https://github.com/dotnet/maui/releases)
