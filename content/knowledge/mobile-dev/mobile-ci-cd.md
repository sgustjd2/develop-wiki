---
title: 모바일 CI/CD 파이프라인 (빌드·테스트·배포 자동화)
aka: [Mobile CI/CD, Xcode Cloud, fastlane, Play Developer API, Lane, Release Automation]
category: mobile-dev
group: delivery
level: intermediate
summary: 모바일 앱의 빌드·테스트·서명·스토어 업로드를 자동화하는 파이프라인 구조와, 서버 CI/CD 와 달리 신경 써야 할 점.
tags: [mobile, ci-cd, xcode-cloud, fastlane, play-console, testflight, automation]
related: [mobile-dev/code-signing-release-tracks, mobile-dev/staged-rollout-remote-config, mobile-dev/store-review-policy, engineering-practice/ci-cd-pipeline, security/secrets-management, security/supply-chain-security]
sources:
  - https://developer.apple.com/documentation/xcode/xcode-cloud
  - https://developer.apple.com/documentation/xcode/xcode-cloud-workflow-reference
  - https://developer.apple.com/documentation/xcode/writing-custom-build-scripts
  - https://developer.apple.com/documentation/xcode/environment-variable-reference
  - https://developers.google.com/android-publisher/tracks
  - https://docs.fastlane.tools/
updatedAt: 2026-11-19
---

## 문제

모바일 릴리스는 서버 배포와 다르다. 서명 자격 증명이 필요하고, 결과물은 스토어 심사·트랙을 거쳐야 하며, 한 번 나간 버전은 사용자가 업데이트할 때까지 회수되지 않는다. 사람이 로컬 머신에서 아카이브하면 "내 컴퓨터에서만 되는" 빌드, 서명 실수, 버전 번호 충돌이 반복된다.

## 해법: 단계와 책임

일반 CI/CD 단계는 [CI/CD 파이프라인](/develop-wiki/knowledge/engineering-practice/ci-cd-pipeline/)과 같고, 모바일 특화 지점만 덧붙인다.

1. **PR 검증**: 빌드, 단위 테스트, 정적 분석, 린트. 시간이 긴 UI 테스트는 다른 트리거(야간, 릴리스 브랜치)로 분리한다.
2. **서명된 빌드 생성**: 릴리스 키·프로비저닝을 CI 비밀로 주입. 서명 개념은 [코드 서명·릴리스 트랙](/develop-wiki/knowledge/mobile-dev/code-signing-release-tracks/)을 본다.
3. **내부·베타 배포**: TestFlight, Play 내부 테스트 트랙.
4. **스토어 제출·단계 출시**: 심사 제출, 단계적 출시. [단계적 출시·원격 설정](/develop-wiki/knowledge/mobile-dev/staged-rollout-remote-config/) 참고.

### 도구 예시 (공식 문서 기준)

- **Xcode Cloud**: Xcode·TestFlight·App Store Connect 를 묶은 Apple 의 CI/CD. 워크플로는 시작 조건(브랜치 변경, PR, 스케줄, 수동), 액션(빌드·테스트·아카이브), 후속 동작(TestFlight 배포 등)으로 구성한다.
  - 커스텀 스크립트는 프로젝트의 `ci_scripts` 디렉터리에 정해진 이름으로 둔다: `ci_post_clone.sh`(클론 후, 의존성 도구 설치 등), `ci_pre_xcodebuild.sh`, `ci_post_xcodebuild.sh`(xcodebuild 가 실패해도 실행).
  - `CI_XCODEBUILD_ACTION` 같은 사전 정의 환경 변수와, 로그에 가려지는 비밀 환경 변수를 쓸 수 있다.
  - 기본으로 같은 워크플로의 새 빌드가 대기하면 진행 중인 빌드를 자동 취소한다. 캐시된 파생 데이터를 재사용하지만, 외부 테스터 TestFlight 배포 같은 경우는 클린 빌드가 필요하다고 문서가 설명한다.
- **fastlane**: iOS·Android 의 베타 배포와 릴리스를 자동화하는 도구. `Fastfile` 에 `beta`, `release` 같은 **레인**(이름 붙은 작업 흐름)을 정의하고 `fastlane release` 로 실행한다. 서명, 스크린샷, 배포 자동화를 다룬다고 소개한다.
- **Google Play Developer API**: 편집(edit) 단위로 일한다. 편집을 열고 → 아티팩트 업로드(버전 코드 반환) → 트랙에 버전 코드를 할당(상태 `completed`, `inProgress`+`userFraction`, `draft` 등) → 편집 커밋. **커밋 전에는 반영되지 않고** 커밋 뒤에도 반영에 몇 시간 걸릴 수 있다. 트랙은 `alpha`, `beta`, `qa`(내부 테스트), `production` 등이다.

```ruby
# fastlane 레인 구조 예시(개념)
lane :beta do
  build_app(scheme: "App")       # 서명·아카이브
  upload_to_testflight           # 내부 베타 배포
end
```

## 언제 쓰나

- 팀이 둘 이상이거나 릴리스가 주 1회 이상이면 자동화 이득이 크다.
- 플랫폼 공식 CI(Xcode Cloud)는 서명·스토어 연동이 간단하다. 다중 플랫폼이나 자체 러너 요구가 있으면 범용 CI 에 fastlane 을 얹는 식이 흔하다.

## 주의·비용

- **버전 번호 자동화**: 빌드 번호·버전 코드를 CI 빌드 번호에서 만들지, 사람이 올릴지 규칙을 정한다. 스토어별 중복·증가 규칙은 각 스토어 문서를 확인한다(이 노트에서 검증하지 않음).
- **비밀 관리**: 서명 키·API 키를 저장소에 두지 않는다. CI 의 비밀 저장소, 로그 마스킹을 쓴다. [시크릿 관리](/develop-wiki/knowledge/security/secrets-management/), [공급망 보안](/develop-wiki/knowledge/security/supply-chain-security/) 참고.
- 파이프라인은 **빌드 환경 버전**(Xcode, macOS, JDK, Gradle)에 민감하다. 공급자가 도구 버전을 바꾸면 빌드가 깨질 수 있어, 안정판과 베타판 워크플로를 따로 두라는 것이 Apple 문서의 권고다.
- 자동 제출은 심사 거절·정책 변경을 막지 못한다. 심사 전 체크리스트는 [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/)에서 다룬다.
- UI 테스트는 시뮬레이터·에뮬레이터에서 불안정하기 쉽다. 병렬화와 재시도 정책, 실패 아티팩트(스크린샷) 보관을 설계에 넣는다.
- 가격·분 단위 요금·동시 빌드 수 등 CI 서비스별 한도는 이 노트에 싣지 않았다. 각 서비스 요금 페이지를 확인한다.
