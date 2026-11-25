---
name: CocoaPods
url: https://cocoapods.org
docs: https://guides.cocoapods.org
repo: https://github.com/CocoaPods/CocoaPods
stars: 14833
domain: mobile
category: ios
description: Xcode 프로젝트용 의존성 관리자. Podfile 에 라이브러리를 적고 pod install 로 워크스페이스를 구성한다. 공식 README 가 유지보수 모드임을 밝히고 있어 신규는 SwiftPM 이 권장된다.
pricing: oss
tags: [dependency-manager, ruby, legacy, xcode]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
CocoaPods 는 Ruby 로 만든 Xcode 의존성 관리자로, `Podfile` 을 읽어 라이브러리를 받고 `.xcworkspace` 를 생성·수정한다. 저장소 README 맨 위에 "유지보수 모드이며 활발히 개발되지 않는다"는 경고가 있다(2026-11 확인). 그래도 저장소는 최근에도 커밋·릴리스(1.17.0, 2026-07-06)가 있어 기존 앱의 빌드는 계속 가능하다. 아직 SwiftPM 을 지원하지 않는 SDK 때문에 남아 있는 경우가 많다.

- 새 프로젝트는 [Swift Package Manager](/develop-wiki/mobile/ios/swift-package-manager/) 를 우선한다.
- 라이선스: MIT(저장소에 일부 구성요소는 별도 라이선스 명시).

## 설치
```bash
sudo gem install cocoapods   # 또는 Bundler: bundle add cocoapods
pod --version
```
팀에서는 Gemfile 로 버전을 고정하고 `bundle exec pod install` 을 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Podfile` | 타깃별 의존성 선언 |
| `Podfile.lock` | 해석된 정확한 버전. 커밋 대상 |
| `.podspec` | 라이브러리 배포 명세 |
| Specs 저장소(Trunk/CDN) | 포드 메타데이터 소스 |
| `Pods/` 프로젝트 | 포드를 빌드하는 별도 Xcode 프로젝트 |
| `use_frameworks!` | 정적/동적 프레임워크 링크 방식 지정 |

## 기본 사용법
```ruby
# Podfile
platform :ios, '16.0'
use_frameworks!

target 'MyApp' do
  pod 'Alamofire', '~> 5.12'
  pod 'Kingfisher'
end
```
```bash
pod install            # Podfile.lock 기준 설치, 이후 .xcworkspace 로 연다
pod update Alamofire   # 특정 포드 갱신
```

## 자주 쓰는 패턴
- **항상 `.xcworkspace` 로 열기.** `.xcodeproj` 로 열면 포드가 링크되지 않는다.
- **`Podfile.lock` 커밋.** 팀·CI 간 버전을 일치시킨다.
- **SwiftPM 이행.** 포드를 하나씩 `Package.swift` 의존성으로 옮기고 `pod deintegrate` 로 정리한다.
- **빌드 설정 보정.** `post_install` 훅에서 포드 타깃의 최소 배포 버전을 맞춘다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 CocoaPods 를 쓰는 기존 앱 유지, SwiftPM 미지원 서드파티 SDK 연동.
- 피할 때(대안): 신규 프로젝트, 순수 Swift 라이브러리 배포는 SwiftPM. 빌드 구성 전반을 코드로 관리하려면 [Tuist](/develop-wiki/mobile/ios/tuist/).

## 공식 문서
- [Guides](https://guides.cocoapods.org) · [Podfile 문법](https://guides.cocoapods.org/syntax/podfile.html) · [GitHub](https://github.com/CocoaPods/CocoaPods)
