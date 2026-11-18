---
title: 스토어 심사 정책과 흔한 반려 사유
aka: [App Store Review Guidelines, Google Play Developer Policy, App Rejection, App Review]
category: mobile-dev
group: delivery
level: intermediate
summary: App Store 와 Google Play 가 출시 전후에 검사하는 항목과, 완성도·결제·개인정보·메타데이터에서 자주 반려되는 사유 및 사전 점검법.
tags: [mobile, app-store, google-play, review, policy, rejection, privacy]
related: [mobile-dev/permissions-privacy, mobile-dev/code-signing-release-tracks, mobile-dev/staged-rollout-remote-config, mobile-dev/background-work-constraints]
sources:
  - https://developer.apple.com/app-store/review/guidelines/
  - https://play.google.com/about/developer-content-policy/
  - https://developer.android.com/training/monitoring-device-state/doze-standby
updatedAt: 2026-11-18
---

## 문제

- 심사는 일정에 직접 영향을 준다. 반려 한 번이면 며칠이 늘고, 출시일이 걸린 마케팅이 어긋난다.
- 규정은 자주 바뀌고, 앱이 직접 쓴 코드뿐 아니라 서드파티 SDK·광고 네트워크의 행동도 개발자 책임이다.
- 심사자는 앱을 짧게 사용해 본다. 로그인 장벽, 꺼져 있는 백엔드, 안 보이는 기능은 곧 반려다.

## 해법

### Apple App Store Review Guidelines

지침은 크게 **안전, 성능, 비즈니스, 디자인, 법적** 다섯 부문이다(공식 페이지 구성). 반려로 자주 인용되는 조항을 자기 말로 정리한다.

| 조항(번호는 지침 기준) | 요지 | 사전 점검 |
| --- | --- | --- |
| 2.1 앱 완성도 | 제출본은 최종 상태여야 한다. 자리표시 텍스트, 깨진 링크, 크래시는 반려. 심사용 데모 계정을 제공하고 심사 기간 백엔드를 켜 둔다 | 실기기에서 새로 설치해 처음부터 끝까지, 심사 계정으로 확인 |
| 2.3 정확한 메타데이터 | 스크린샷·설명·가격·개인정보 항목이 실제 앱과 일치해야 한다 | 스크린샷이 실제 화면인지, 없는 기능을 말하지 않는지 |
| 4.2 최소 기능 | 웹사이트를 감싼 앱, 링크 모음, 단순 홍보물은 안 된다 | 앱만의 가치(오프라인, 기기 기능 통합)가 있는지 |
| 3.1.1 인앱 결제 | 앱 안에서 쓰는 디지털 기능·콘텐츠·화폐는 Apple 인앱 결제를 써야 한다. 복원 수단 필요 | 외부 결제 안내 문구·버튼 점검(지역별 예외 규정은 별도 확인) |
| 5.1.1 데이터 수집·계정 삭제 | 개인정보 처리방침, 수집 동의, 계정 생성을 지원하면 앱 안에서 삭제 가능해야 한다. 불필요한 정보 요구 금지 | 설정 안에 "계정 삭제" 경로가 있는가 |
| 4.8 로그인 서비스 | 제3자 소셜 로그인을 주 로그인으로 쓰면 개인정보를 제한하는 동등한 로그인 옵션도 제공(예외 있음) | 소셜 로그인만 있는 앱은 예외 해당 여부 검토 |

### Google Play 개발자 정책

- 콘텐츠·개인정보·사용자 데이터, 권한 사용(민감 권한은 핵심 기능일 때만), 광고, 결제, 스팸·최소 기능 등을 다룬다. 정책 위반은 심사 거부뿐 아니라 **출시 후 앱 정지·계정 제재**로 이어질 수 있다.
- 개인정보는 manifest 권한과 Play 콘솔의 **Data safety 양식**이 실제 동작과 일치해야 한다. 배터리 최적화 예외 요청은 핵심 기능이 깨지는 경우에 한정된다(Doze 공식 문서).
- 타깃 API 레벨 요건처럼 정기적으로 올라가는 기술 요건이 있다. 2026-08-31 부터 신규 앱과 업데이트는 Android 16(API 36) 이상을 타깃해야 한다(Wear OS·Automotive 는 API 35, TV·XR 은 API 34). 기존 앱은 API 35 미만이면 새 사용자에게 노출되지 않을 수 있다. 연장 신청 시 한도는 2026-11-01 이었다. 매년 일정을 확인한다.

### 반려 줄이는 운영 습관

1. 제출 전 체크리스트(데모 계정, 백엔드 가동, 권한 문구, 개인정보 항목, 스크린샷, 삭제 경로)를 CI 릴리스 절차에 포함한다.
2. 심사 메모에 비자명한 흐름(결제 테스트 방법, 하드웨어 필요 기능)을 적는다.
3. SDK 를 올리거나 추가할 때 프라이버시 선언을 갱신한다. [권한 모델과 프라이버시](/develop-wiki/knowledge/mobile-dev/permissions-privacy/) 참고.
4. 반려되면 지침 번호를 확인해 근거를 읽고, 모호하면 심사 팀에 답변·재심사 요청을 쓴다. 감정적 반박보다 수정 사항 설명이 빠르다.

## 언제 쓰나

- 기능 설계 초기(결제·로그인·위치·추적 계획 시점)에 한 번, 출시 직전에 한 번 읽는다. 늦게 알면 설계를 바꿔야 한다.

## 주의

- 번호와 세부 문구는 자주 개정된다. 이 노트는 요지를 설명하는 것이며, 제출 전 반드시 현재 공식 문서를 본다.
- 심사 통과는 정책 준수의 증명이 아니다. 출시 후에도 신고·자동 검사로 제재될 수 있다.
- 지역별 규제(앱 외부 결제 허용 등)로 규칙이 갈라진다. 대상 지역별로 확인한다.
- 심사 대기 시간은 변동적이므로 긴급 수정(핫픽스)은 원격 설정·플래그 같은 심사 없는 수단과 병행한다. [단계적 출시·원격 설정](/develop-wiki/knowledge/mobile-dev/staged-rollout-remote-config/) 참고.
