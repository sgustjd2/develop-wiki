---
title: 모바일 릴리스 게이트 (단계적 출시·크래시 프리 기준)
aka: [Release Gate, Go/No-Go, Crash-free Rate, Halt Criteria, Android vitals Threshold, Bad Behavior Threshold]
category: mobile-dev
group: delivery
level: intermediate
summary: 단계적 출시의 각 단계마다 "다음으로 넘어갈 조건"과 "멈출 조건"을 지표 숫자로 미리 정해 두는 릴리스 운영 방식.
tags: [mobile, release, quality-gate, crash-free, anr, android-vitals, staged-rollout]
related: [mobile-dev/staged-rollout-remote-config, mobile-dev/crash-performance-monitoring, mobile-dev/mobile-ci-cd, mobile-dev/code-signing-release-tracks, mobile-dev/store-review-policy, engineering-practice/ci-cd-pipeline, engineering-practice/incident-response-postmortem]
sources:
  - https://support.google.com/googleplay/android-developer/answer/9844486
updatedAt: 2026-11-19
---

[단계적 출시·원격 설정](/develop-wiki/knowledge/mobile-dev/staged-rollout-remote-config/)이 "수단"이라면 이 노트는 그 수단을 움직이는 **판단 기준**이다.

## 문제

- 단계적 출시를 켜도 기준이 없으면 "괜찮아 보여서" 비율을 올리게 된다. 담당자 감에 따라 결정이 달라지고, 문제 신호를 놓친다.
- 표본이 작은 초기 단계에서는 비율 지표가 크게 흔들린다. 1000명 중 5건과 100만 명 중 5천 건은 같은 0.5% 라도 의미가 다르다.

## 해법

### 게이트를 3겹으로 둔다

1. **빌드 게이트(CI)**: 단위·UI 테스트, 정적 분석, 서명, 앱 크기 상한. [모바일 CI/CD](/develop-wiki/knowledge/mobile-dev/mobile-ci-cd/).
2. **내부·베타 게이트**: 내부 테스트 트랙에서 직원이 쓰고, 크래시·핵심 흐름을 확인한 뒤에만 프로덕션으로.
3. **출시 단계 게이트**: 프로덕션 비율을 올릴 때마다 지표를 본다. 아래 표처럼 단계별로 "진행/보류/중단" 기준을 문서로 정한다.

| 단계 | 진행 조건 | 중단 조건 |
| --- | --- | --- |
| 낮은 비율 | 최소 관찰 시간·최소 세션 수 충족, 기준 미초과 | 신규 크래시 시그니처가 상위권에 등장, 핵심 퍼널 급락 |
| 중간 비율 | 이전 단계와 비교해 악화 없음 | 크래시 프리 사용자 비율 하락폭 초과 |
| 전체 | 구버전 대비 동등 이상 | 사후 핫픽스·롤포워드 |

위 표의 구체 수치는 팀이 서비스 특성에 맞게 정한다(공식 값이 아님).

### 비교 기준은 "이전 버전"과 "스토어 임계값"

- 절대값만 보지 말고 **직전 안정 버전의 같은 기간 지표**와 비교한다. 새 버전만의 회귀를 가려낸다.
- Google Play 의 Android vitals 는 나쁜 동작 임계값을 공개한다. 사용자 체감 크래시율은 일일 사용자 기준 1.09% 이상, 사용자 체감 ANR 비율은 0.47% 이상이 전체 기준이고, 기기 모델별로는 각각 8% 이상이 기준이다. 초과하면 Play 에서 노출이 줄 수 있고 기기별 초과 시 해당 기기 사용자에게 다른 앱을 권하는 등의 영향이 있다. 평가는 보통 최근 28일 데이터를 보되 급증하면 더 빨리 조치될 수 있다(Play Console 도움말 기준). 이 임계값은 "넘으면 안 되는 하한선"이므로 내부 게이트는 이보다 훨씬 엄격하게 둔다.
- 지표 정의(사용자 체감, 포그라운드 기준)를 확인하고 자체 크래시 수집 도구의 수치와 혼동하지 않는다. [크래시·성능 모니터링](/develop-wiki/knowledge/mobile-dev/crash-performance-monitoring/).

### 멈춘 뒤의 행동을 정해 둔다

- Play 단계적 출시는 중단해도 이미 받은 사용자는 유지된다. 수정은 새 빌드로 한다. App Store 단계적 출시도 중지할 수 있으나 직접 업데이트하는 사용자는 받을 수 있다(기존 노트 참고).
- 따라서 **킬 스위치·원격 설정으로 즉시 완화**하는 길과 **핫픽스 빌드의 심사 경로**를 사전에 준비한다. [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/), [장애 대응](/develop-wiki/knowledge/engineering-practice/incident-response-postmortem/).
- 누가 중단 권한을 갖는지(당직자 단독 결정 가능 여부)를 명시한다.

## 언제 쓰나

- 사용자 수가 많거나 결제·로그인 같은 핵심 흐름이 있는 앱, 릴리스를 여러 사람이 승인하는 조직.

## 주의·비용

- 게이트가 많으면 릴리스가 느려지고 우회 압력이 생긴다. 자동으로 판정 가능한 것부터 자동화한다.
- 초기 단계의 표본 부족으로 오탐·미탐이 난다. 비율과 함께 절대 건수·최소 표본을 조건에 넣는다.
- 크래시가 없어도 로그인 실패·결제 오류 같은 **조용한 실패**는 크래시 지표에 안 보인다. 비즈니스 지표를 게이트에 포함한다.
- 단계적 출시 중에는 구버전과 신버전이 공존하므로 서버 호환성이 전제다.
- 임계값을 한 번 정하고 방치하지 않는다. 사후 검토 때 기준을 조정한다.
