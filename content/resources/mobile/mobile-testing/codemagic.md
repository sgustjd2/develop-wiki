---
name: Codemagic
url: https://codemagic.io
docs: https://docs.codemagic.io
domain: mobile
category: mobile-testing
description: 모바일 앱 빌드·테스트·서명·스토어 배포에 특화된 CI/CD 서비스. codemagic.yaml로 Flutter, React Native, 네이티브 iOS·Android 워크플로를 정의하고 macOS 빌드 머신을 분 단위로 제공한다.
pricing: freemium
tags: [ci-cd, mobile, flutter, code-signing, app-store, google-play]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Codemagic은 모바일 CI/CD를 위해 만들어진 호스팅 서비스다. macOS(Apple Silicon Mac mini)·Linux 빌드 머신에서 `codemagic.yaml`에 적은 스크립트를 실행하고, iOS 코드 서명(인증서·프로비저닝 프로필 자동 관리), Android keystore, TestFlight·Google Play 게시까지 한 파이프라인에서 처리한다. 원래 Flutter 중심으로 시작했고 React Native·네이티브·KMP도 지원한다.

- **가격(말로 정리, 확인일 기준)**: 개인용 무료 요금제는 월 정해진 macOS 빌드 분이 제공되고 병렬 빌드·지원이 제한된다. 종량제(pay-as-you-go)는 기본료 없이 사용한 머신 분만큼 과금하고 macOS가 Linux보다 비싸며, 병렬 빌드는 추가 구매한다. 연 단위 고정가 팀 요금제는 무제한 빌드 분을 제공한다. 정확한 수치는 변동이 있어 [가격 페이지](https://codemagic.io/pricing/)에서 확인한다.
- 대안: GitHub Actions(macOS 러너), Bitrise(모바일 특화 SaaS), Xcode Cloud, 직접 구성한 [Fastlane](/develop-wiki/mobile/mobile-testing/fastlane/) 파이프라인.

## 설치
설치할 소프트웨어는 없다. Codemagic에 가입해 저장소(GitHub·GitLab·Bitbucket 등)를 연결하고, 저장소 루트에 `codemagic.yaml`을 커밋한다. 서명 자격 증명은 팀 설정의 **Code signing identities**에 업로드하거나 App Store Connect API 키로 자동 관리하게 한다. 업로드한 keystore는 다시 내려받을 수 없으므로 별도로 보관한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `codemagic.yaml` | 워크플로·환경·스크립트·아티팩트·게시를 선언하는 설정 파일 |
| Workflow | 빌드 단위. 파일 하나에 Android·iOS 워크플로를 함께 둘 수 있음 |
| `instance_type` | 빌드 머신 종류(예: `mac_mini_m2`) |
| `max_build_duration` | 빌드 최대 시간 제한(분) |
| Environment groups | 시크릿·변수 묶음(예: Google Play 서비스 계정 JSON) |
| Code signing | iOS 인증서·프로파일, Android keystore 참조 |
| Artifacts | 빌드 산출물(`.aab`, `.ipa`) 경로 |
| Publishing | 이메일, Google Play, App Store Connect/TestFlight, Slack 등 |
| Codemagic CLI tools | 빌드 번호 계산, 서명 설정 같은 보조 명령 |

## 기본 사용법
Android 앱의 최소 워크플로 뼈대:

```yaml
workflows:
  android-release:
    name: Android Release
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      groups:
        - google_play
      android_signing:
        - my_keystore
    scripts:
      - name: Build AAB
        script: ./gradlew bundleRelease
    artifacts:
      - app/build/outputs/**/*.aab
    publishing:
      google_play:
        credentials: $GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS
        track: internal
```
`instance_type`, 그룹·keystore 이름, 트랙은 프로젝트와 요금제에 맞게 조정한다. 인스턴스 이름은 공식 문서의 현재 목록을 따른다.

## 자주 쓰는 패턴
- **빌드 번호 자동 증가**: Google Play·App Store Connect의 최신 번호를 조회해 +1로 계산한다. 사용 API는 [Google Play Developer API](/develop-wiki/mobile/mobile-backend/google-play-developer-api/), [App Store Connect API](/develop-wiki/mobile/mobile-backend/app-store-connect-api/)다.
- **PR 빌드와 릴리스 분리**: 브랜치·태그 트리거로 테스트 워크플로와 배포 워크플로를 나눈다.
- **테스트 실행**: 단위 테스트는 [Robolectric](/develop-wiki/mobile/mobile-testing/robolectric/), UI 테스트는 [Maestro](/develop-wiki/mobile/mobile-testing/maestro/)·[XCTest](/develop-wiki/mobile/mobile-testing/xctest/) 스크립트를 스텝에 넣는다.
- **캐시**: Gradle·SwiftPM·CocoaPods 캐시로 빌드 분을 줄인다.
- **웹훅·알림**: 빌드 결과를 Slack·이메일로 알린다.

## 언제 쓰나 / 피할 때
- 쓸 때: Flutter·React Native 팀이 서명·스토어 배포까지 설정 부담 없이 CI를 갖추고 싶을 때, macOS 러너를 직접 운영하기 싫을 때.
- 피할 때(대안): 이미 GitHub Actions에 모든 파이프라인이 있는 팀, 빌드 분 비용이 커져 자체 호스팅 러너가 유리한 규모.

## 공식 문서
- [Codemagic 문서](https://docs.codemagic.io) · [Android 빌드 가이드](https://docs.codemagic.io/yaml-quick-start/building-a-native-android-app/) · [가격](https://codemagic.io/pricing/)
