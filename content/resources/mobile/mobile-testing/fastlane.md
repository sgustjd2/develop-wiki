---
name: fastlane
url: https://fastlane.tools
docs: https://docs.fastlane.tools
repo: https://github.com/fastlane/fastlane
stars: 42401
domain: mobile
category: mobile-testing
description: iOS·Android 빌드, 코드 서명, 스크린숏, 테스트, TestFlight·Google Play 업로드를 Ruby DSL 레인으로 자동화하는 오픈소스 도구. 모바일 CI/CD 파이프라인의 배포 단계에 쓴다.
pricing: oss
tags: [ci-cd, release, code-signing, automation]
languages: [ruby]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
fastlane은 앱 배포 과정의 반복 작업(버전 올리기, 인증서·프로파일 설치, 빌드, 테스트, 스토어 업로드, 릴리스 노트·스크린숏 갱신)을 **레인(lane)** 이라는 Ruby 함수로 묶어 한 명령으로 실행하게 한다. 각 단계는 `build_app`, `upload_to_testflight`, `upload_to_play_store` 같은 **액션**으로 제공되고, 플러그인으로 확장된다.

- 최신 **2.242.0**(2026-11-16). MIT. 로컬과 GitHub Actions·Bitrise·Jenkins 등 어떤 CI에서도 같은 레인을 쓴다.
- 레인 파일은 Ruby DSL이다(Ruby 지식이 많이 필요하지는 않다).

## 설치
Bundler로 프로젝트에 버전을 고정하는 방식이 권장된다.

```ruby
# Gemfile
source "https://rubygems.org"
gem "fastlane"
```

```bash
bundle install
bundle exec fastlane init      # ios/ 또는 android/ 디렉터리에서 실행
```

macOS에서는 `brew install fastlane`도 가능하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Fastfile` | 레인 정의 파일 (`fastlane/Fastfile`) |
| `Appfile` | 앱 식별자, Apple ID/팀, Play 패키지명 등 공통 값 |
| Lane | `lane :beta do ... end` 단위 작업. `fastlane ios beta`로 실행 |
| Action | 미리 만들어진 단계. `fastlane actions`로 목록 확인 |
| `match` | 인증서·프로파일을 암호화해 Git/클라우드 저장소에 두고 팀·CI가 공유 |
| `gym` (`build_app`) | iOS 아카이브·IPA 생성 |
| `pilot` (`upload_to_testflight`) | TestFlight 업로드·테스터 관리 |
| `deliver` / `supply` | App Store / Google Play 메타데이터·바이너리 업로드 |
| `scan` (`run_tests`) | iOS 테스트 실행·리포트 |
| `snapshot` / `screengrab` | 여러 기기·언어 스토어 스크린숏 자동 생성 |
| App Store Connect API key | 2FA 없이 CI에서 인증하는 키(`app_store_connect_api_key`) |

## 기본 사용법
```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  lane :beta do
    app_store_connect_api_key(
      key_id: ENV["ASC_KEY_ID"], issuer_id: ENV["ASC_ISSUER_ID"],
      key_content: ENV["ASC_KEY_P8"]
    )
    match(type: "appstore", readonly: true)
    increment_build_number(build_number: latest_testflight_build_number + 1)
    build_app(scheme: "MyApp", export_method: "app-store")
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end
end

platform :android do
  lane :internal do
    gradle(task: "bundle", build_type: "Release")
    upload_to_play_store(track: "internal", json_key: ENV["PLAY_JSON_KEY_PATH"])
  end
end
```

```bash
bundle exec fastlane ios beta
bundle exec fastlane android internal
```

## 자주 쓰는 패턴
- **서명은 `match`로 통일.** CI에서는 `readonly: true`로 받기만 하고, 새 인증서 발급은 담당자 한 명이 로컬에서 수행한다.
- **비밀값은 환경 변수.** API 키·Play 서비스 계정 JSON은 CI 시크릿으로 주입하고 저장소에 두지 않는다.
- **테스트 → 배포 레인 조합.** `lane :release do run_tests; beta; end`처럼 레인이 다른 레인을 호출할 수 있다.
- **GitHub Actions.** macOS 러너에서 `ruby/setup-ruby`로 Bundler 캐시 후 `bundle exec fastlane ...`([GitHub Actions](/develop-wiki/backend/infra-devops/github-actions/)).
- **크로스플랫폼 앱.** Flutter·React Native도 `ios/`·`android/` 폴더에서 같은 방식으로 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 스토어 배포를 사람 손 없이 재현해야 할 때, 여러 앱·플랫폼의 릴리스 절차를 코드로 남길 때.
- 피할 때(대안): Expo 프로젝트는 EAS Build/Submit이 같은 일을 관리형으로 제공한다([Expo](/develop-wiki/mobile/cross-platform/expo/)). Xcode Cloud만으로 충분한 iOS 단일 앱도 있다.

## 공식 문서
- [fastlane 문서](https://docs.fastlane.tools) · [iOS 설정](https://docs.fastlane.tools/getting-started/ios/setup/) · [Android 설정](https://docs.fastlane.tools/getting-started/android/setup/)
- [액션 목록](https://docs.fastlane.tools/actions/) · [match](https://docs.fastlane.tools/actions/match/)
