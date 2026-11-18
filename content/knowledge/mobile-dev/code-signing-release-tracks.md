---
title: 코드 서명·프로비저닝·릴리스 트랙 (TestFlight·Play 트랙)
aka: [Code Signing, Provisioning Profile, Play App Signing, Upload Key, TestFlight, Release Track]
category: mobile-dev
group: delivery
level: intermediate
summary: 앱 신원을 증명하는 서명 체계(Apple 인증서·프로비저닝, Android 업로드 키·앱 서명 키)와 내부 테스트에서 프로덕션까지 이어지는 배포 트랙의 구조.
tags: [mobile, android, ios, code-signing, provisioning, testflight, play-console, ci-cd]
related: [mobile-dev/staged-rollout-remote-config, mobile-dev/store-review-policy, engineering-practice/ci-cd-pipeline, security/secrets-management, security/supply-chain-security]
sources:
  - https://developer.android.com/studio/publish/app-signing
  - https://developer.apple.com/support/code-signing/
  - https://developer.apple.com/testflight/
updatedAt: 2026-11-18
---

## 문제

- 서명 키를 잃으면 기존 앱을 업데이트할 수 없다. 유출되면 누군가 내 앱인 척하는 앱을 배포할 수 있다.
- iOS 는 인증서, App ID, 프로비저닝 프로파일, 권한(entitlement)이 맞물려 있어 CI 에서 "내 컴퓨터에서는 되는데" 문제가 가장 자주 난다.
- 바로 프로덕션으로 올리면 실제 기기·실제 사용자에서의 첫 검증이 사고가 된다.

## 해법

### Android: 업로드 키와 앱 서명 키

- Android 는 업데이트 시 **새 버전의 인증서가 기존과 같아야** 설치를 허용한다. 다르면 다른 앱(다른 패키지명)으로 취급된다.
- **Play App Signing**: Google 이 **앱 서명 키**를 보관하고 사용자에게 배포되는 APK 에 서명한다. 개발자는 **업로드 키**로 서명한 번들(AAB)만 올린다. 업로드 키를 잃거나 유출되면 Play Console 에서 **업로드 키 재설정**을 요청할 수 있어, 앱 서명 키는 영향받지 않는다. 키 자체를 직접 보관하는 방식은 분실 시 업데이트가 불가능해진다.
- 2021년 8월 이후 새 앱은 Play App Signing 이 필수다(공식 문서 기준). 여러 스토어에 같은 키로 배포하려면 키를 직접 제공해 등록한다.
- 서명 정보(`keystore.properties`)를 소스 저장소에 넣지 않는다. CI 의 시크릿으로 주입한다.

### iOS: 인증서, 프로파일, 배포 방식

| 요소 | 역할 |
| --- | --- |
| 개발/배포 인증서 | 개발자(팀)의 신원. 개인 키는 키체인에 있어 CI 로 옮겨야 함 |
| App ID(번들 ID) + 권한 | 앱 식별과 푸시·딥링크 같은 기능 활성화 |
| 프로비저닝 프로파일 | "이 인증서로, 이 App ID 앱을, (개발/Ad Hoc 은) 이 기기들에서, 이 권한으로" 실행해도 된다는 묶음 |

배포 경로는 개발(Xcode 직접 설치), Ad Hoc(등록 기기), **App Store/TestFlight**, 엔터프라이즈로 나뉜다. 자동 서명(Xcode 관리)이 편하지만 CI 에서는 App Store Connect API 키로 인증서·프로파일을 자동 관리하는 방식(fastlane match 등)을 쓴다. 인증서 만료 시점에 배포가 갑자기 막히므로 만료일을 모니터링한다.

### 릴리스 트랙

| 단계 | Apple | Google Play |
| --- | --- | --- |
| 팀 내부 | TestFlight 내부 테스터(App Store Connect 사용자) | 내부 테스트 트랙(빠르게 배포, 소규모) |
| 제한된 외부 | TestFlight 외부 테스터(첫 빌드는 베타 앱 심사 필요) | 비공개 테스트(초대한 그룹) |
| 공개 베타 | TestFlight 공개 링크 | 공개 테스트 |
| 정식 | App Store 출시 | 프로덕션(단계적 출시 가능) |

TestFlight 빌드는 업로드 후 90일 동안 테스트할 수 있고, 그 뒤에는 테스터가 쓸 수 없다. 테스터는 외부 최대 10,000명, 내부 최대 100명(App Store Connect 사용자)이다. 2023-11-13 이후 만든 Google Play 개인 개발자 계정은 프로덕션 신청 전에 12명 이상이 14일 연속 참여한 비공개 테스트를 해야 한다. 정책은 바뀔 수 있으므로 제출 전 공식 페이지로 다시 확인한다.

```yaml
# CI 파이프라인 뼈대(개념): 같은 커밋이 같은 바이너리로 트랙을 따라 올라가게
build:        # 서명 시크릿은 CI 저장소 비밀 값에서 주입
  - assemble signed AAB / archive IPA
distribute:
  - internal  -> 자동(매 머지)
  - closed    -> 수동 승격
  - production-> 단계적 출시로 시작
```

## 언제 쓰나

- 모든 상용 앱. 처음부터 내부 트랙 자동 배포를 파이프라인에 넣으면 "빌드는 되는데 서명/업로드에서 막힘"을 미리 발견한다.
- 팀원 이직·CI 교체 시 키를 개인 PC 에 두지 않았는지가 이 설계의 핵심 점검이다.

## 주의

- 업로드 키와 앱 서명 키, iOS 인증서 개인 키와 `.p8` API 키는 백업과 접근 통제를 문서화한다. 한 사람의 노트북에만 있으면 안 된다.
- 빌드 번호(`versionCode`, `CFBundleVersion`)는 올라가기만 해야 하고 중복되면 업로드가 거부된다. CI 에서 자동 증가시킨다.
- TestFlight/내부 트랙에서 통과해도 스토어 심사는 별개다. [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/) 참고.
- Debug 서명 빌드는 스토어에서 받지 않는다. 릴리스 빌드와 설정(난독화, 디버그 플래그)이 다르므로 릴리스 변형으로 반드시 테스트한다.
- 공급망 위험: 서명 환경을 침해당하면 정상 서명된 악성 빌드가 나간다. [공급망 보안](/develop-wiki/knowledge/security/supply-chain-security/) 참고.
