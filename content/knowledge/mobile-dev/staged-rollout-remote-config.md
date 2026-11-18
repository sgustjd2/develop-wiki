---
title: 단계적 출시·원격 설정·킬 스위치
aka: [Staged Rollout, Phased Release, Remote Config, Feature Flag, Kill Switch, Force Update]
category: mobile-dev
group: delivery
level: intermediate
summary: 모바일은 배포 후 회수가 어렵다. 일부 사용자에게만 먼저 내보내고, 원격 설정과 킬 스위치로 앱을 재배포 없이 제어하는 위험 완화 설계.
tags: [mobile, release, staged-rollout, remote-config, feature-flag, kill-switch]
related: [mobile-dev/crash-performance-monitoring, mobile-dev/code-signing-release-tracks, mobile-dev/store-review-policy, engineering-practice/feature-flags, engineering-practice/incident-response-postmortem]
sources:
  - https://support.google.com/googleplay/android-developer/answer/6346149
  - https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases
  - https://firebase.google.com/docs/remote-config
updatedAt: 2026-11-18
---

## 문제

- 웹과 달리 모바일 앱은 사용자가 업데이트하기 전까지 구버전이 남는다. 서버를 즉시 롤백하듯 앱을 되돌릴 수 없다.
- 새 빌드에 심각한 버그가 있으면 사용자 전부가 겪고, 수정본은 심사와 배포를 다시 거쳐야 한다.
- 구버전이 새 서버 API 와 안 맞으면 앱이 깨진다.

## 해법

### 1. 스토어의 단계적 출시

- **Google Play**: 프로덕션 릴리스를 일정 비율의 사용자에게만 노출한다. 비율은 자동으로 오르지 않고 개발자가 직접 올린다. 문제가 보이면 **중단(halt)** 할 수 있으나 이미 받은 사용자는 그대로 유지한다. 최초 게시에는 쓸 수 없고 업데이트에만 쓴다. 문제 수정은 새 빌드를 올리는 방식이다(공식 도움말 기준).
- **App Store**: 버전 업데이트의 **단계적 출시(Phased Release)** 는 자동 업데이트를 켠 사용자에게 며칠에 걸쳐 점진적으로 배포하고, 중간에 일시 중지할 수 있다. 단, 사용자가 App Store 에서 직접 업데이트하면 단계와 무관하게 받을 수 있다. 7일에 걸쳐 1일차 1%, 2일차 2%, 3일차 5%, 4일차 10%, 5일차 20%, 6일차 50%, 7일차 100% 로 늘어난다. 일시 중지는 총 30일까지 가능하다.
- 단계별 관찰 지표(크래시 없는 사용자 비율, ANR, 핵심 퍼널)를 사전에 정하고 기준 미달 시 확대를 멈춘다. [크래시·성능 모니터링](/develop-wiki/knowledge/mobile-dev/crash-performance-monitoring/) 참고.

### 2. 원격 설정과 기능 플래그

앱이 시작 시/주기적으로 서버(Firebase Remote Config 같은 서비스 또는 자체 API)에서 값을 받아 동작을 바꾼다.

```kotlin
data class RemoteFlags(val newCheckout: Boolean = false, val minSupportedVersion: Int = 0)
// 항상 "안전한 기본값"을 코드에 둔다: 네트워크 실패·첫 실행 시에도 동작해야 한다.
val flags = remoteConfig.fetchOrDefault(RemoteFlags())
if (flags.newCheckout) NewCheckout() else LegacyCheckout()
```

- 용도: 점진적 기능 공개(사용자 비율·조건 타기팅), A/B 실험, 문구·임계값 조정.
- 일반적인 플래그 수명 관리는 [피처 플래그](/develop-wiki/knowledge/engineering-practice/feature-flags/)에서 다룬다. 모바일의 차이는 **구버전이 계속 살아 있다**는 점이다.

### 3. 킬 스위치와 강제 업데이트

- **킬 스위치**: 문제 기능을 서버 값 하나로 끈다(결제 SDK 오류, 특정 API 장애). 꺼진 상태의 대체 UI("현재 이용 불가")를 미리 만들어 둔다.
- **최소 지원 버전(강제 업데이트)**: 서버가 `minSupportedVersion` 을 내려 구버전에 업데이트 화면을 띄운다. 보안 결함이나 서버 API 폐기에 대응하는 최후 수단이다. 가능하면 "권장 업데이트"와 "필수 업데이트"를 구분한다.
- API 는 **하위 호환**을 유지하고 필드 추가만 하며, 폐기는 구버전 점유율이 충분히 떨어진 뒤 한다.

| 수단 | 속도 | 대상 정밀도 | 한계 |
| --- | --- | --- | --- |
| 스토어 단계적 출시 | 빌드 단위 | 비율 | 이미 설치된 사용자는 되돌릴 수 없음 |
| 원격 설정/플래그 | 수 분 | 사용자 조건 | 앱에 분기 코드가 이미 있어야 함 |
| 킬 스위치 | 수 분 | 기능 단위 | 사전에 설계된 기능만 끌 수 있음 |
| 강제 업데이트 | 사용자 행동 필요 | 버전 | 사용자 이탈 위험 |

## 언제 쓰나

- 결제·로그인·데이터 마이그레이션처럼 실패 비용이 큰 기능을 처음 내보낼 때.
- 심사 지연과 무관하게 장애를 즉시 완화해야 하는 서비스.

## 주의

- 원격 설정은 **심사를 우회하는 수단이 아니다.** 심사 후에 앱의 핵심 기능을 원격으로 크게 바꾸면 정책 위반이 될 수 있다. [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/) 참고.
- 플래그가 쌓이면 조합 폭발과 죽은 분기가 생긴다. 만료일과 소유자를 정하고 정리한다.
- 원격 값이 앱 시작을 막으면 안 된다. 캐시된 값과 코드 내 기본값으로 먼저 시작하고 백그라운드에서 갱신한다. 값 가져오기 호출 빈도 제한에도 주의한다.
- 원격 설정 값은 클라이언트에 노출된다. 비밀 값·권한 판정을 두지 않는다.
- 단계적 출시 중에는 서로 다른 버전이 공존하므로 서버·DB 스키마 변경은 호환 가능한 순서(확장 후 축소)로 한다.
