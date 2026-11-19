---
title: 핀 검증 실패 관측과 원격 비활성화(킬 스위치) 설계
aka: [Pinning Failure Telemetry, Pin Kill Switch, Pinning Fail-Open, Pin Bootstrap Problem, 핀 실패 로깅]
category: mobile-dev
group: delivery
level: advanced
summary: 핀닝이 사고를 내기 전에 실패를 사유별로 계측하고, 사고가 나면 원격으로 핀닝을 끌 수 있게 하되 그 신호 자체가 핀에 막혀 도달하지 못하는 순환(부트스트랩)을 피하는 설계.
tags: [mobile, security, tls, pinning, observability, kill-switch, remote-config, operations]
related: [mobile-dev/certificate-pinning-operations, mobile-dev/staged-rollout-remote-config, mobile-dev/crash-performance-monitoring, mobile-dev/mobile-networking, mobile-dev/release-gates-crash-free, engineering-practice/feature-flags, engineering-practice/incident-response-postmortem]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Pinning_Cheat_Sheet.html
  - https://developer.android.com/privacy-and-security/security-config
  - https://developer.apple.com/news/?id=g9ejcf8y
updatedAt: 2026-11-19
---

핀 대상 선택, 백업 핀, 교체 타임라인은 [인증서 핀닝 운영](/develop-wiki/knowledge/mobile-dev/certificate-pinning-operations/)에 있다. 이 노트는 그 뒤 단계, **사고를 빨리 알아채고 빨리 끄는 방법**만 다룬다. 킬 스위치 일반론은 [단계적 출시·원격 설정](/develop-wiki/knowledge/mobile-dev/staged-rollout-remote-config/)을 먼저 본다.

## 문제

- 핀이 어긋나면 사용자는 "네트워크 오류" 한 줄만 본다. 앱 쪽에서 핀 실패를 일반 연결 오류와 구분하지 않으면, 장애가 고객 문의로 먼저 들어온다.
- 서버는 정상(200 응답)이고 앱만 실패하므로 서버 모니터링에는 전혀 잡히지 않는다. 실패한 요청은 서버에 도착하지도 않았다.
- 핀 사고를 끄려고 "원격 설정으로 핀닝을 해제"하는 설계를 하면 순환이 생긴다. 설정을 받아 오는 요청이 같은 핀에 막히면 해제 신호가 도달하지 못한다.

## 해법

### 1. 실패를 사유별로 분류해 기록

핀 검증은 플랫폼 설정이 처리하지만 실패 신호는 앱 계층의 네트워크 에러로 올라온다. 라이브러리별 에러 타입을 한 곳에서 정규화한다.

```ts
type NetFailure =
  | { kind: 'pin_mismatch'; host: string }       // 체인에 핀된 키가 없음
  | { kind: 'untrusted_chain'; host: string }    // 핀 이전 단계: 신뢰 체인 자체가 무효(시계 오류·프록시 등)
  | { kind: 'timeout' | 'offline' | 'dns' | 'other' };

function report(f: NetFailure, ctx: { appVersion: string; os: string; network: 'wifi' | 'cell' | 'unknown' }) {
  if (f.kind === 'pin_mismatch' || f.kind === 'untrusted_chain') {
    telemetry.counter('tls_validation_failure', { ...f, ...ctx }); // 호스트·버전·OS 단위 집계. 사용자 식별자 제외
  }
}
```

- 핀 불일치와 신뢰 체인 불일치를 나눈다. 기기 시계가 크게 틀리면 인증서 날짜 검증이 먼저 실패하는데, 이를 핀 사고로 오해하면 엉뚱한 대응을 한다.
- 집계 단위는 **호스트 × 앱 버전 × OS × 네트워크 종류**다. 한 버전만 오르면 해당 빌드의 핀 목록 문제, 모든 버전이 같은 시각에 오르면 서버 쪽 키 교체 문제다. 특정 통신사·와이파이만 높으면 중간 장비(프록시) 의심이다(추론이며 공식 문서가 규정한 진단 절차는 아니다).
- 실패 요청은 서버에 안 닿으므로, 이 집계는 **클라이언트가 나중에 성공했을 때 모아서 보내는** 방식이어야 한다. 실패 직후 같은 호스트로 보내면 또 실패한다. 별도 호스트(핀 없는 분석 수집 엔드포인트)나 로컬 큐잉 후 재전송을 쓴다.
- 경보는 절대 건수보다 **실패율의 급상승**으로 건다. 일부 사용자는 원래 프록시 환경이라 바닥 수준의 실패가 항상 있다.

### 2. 실패 시 동작: 열지 않는다

OWASP 의 핀닝 가이드는 핀 검증이 실패하면 해당 호출을 실패시키고, 클라이언트에서 기록하고, 사용자에게 알리라고 한다. 사용자가 경고를 무시하고 진행하게 만드는 우회 UI 는 만들지 말라고 한다. 프록시 키를 핀셋에 넣는 것도 위험 수용 결정이 있을 때만이다. 즉 **런타임의 기본 응답은 fail-closed**다. 자동으로 핀을 풀어 재시도하는 코드는 핀닝을 무의미하게 만든다.

### 3. 끄는 수단 세 가지와 한계

| 수단 | 동작 | 한계 |
| --- | --- | --- |
| 핀 만료일 | Android `pin-set` 의 `expiration` 날짜 이후 핀닝을 하지 않는다. iOS `NSPinnedDomains` 설명에서는 대응 속성을 찾지 못했다 | 날짜를 릴리스 때 정한다. Android 문서도 만료 설정이 공격자의 우회 여지를 만들 수 있다고 경고 |
| 앱 업데이트 | 새 핀 목록을 앱 번들로 배포 | 사용자 업데이트 속도에 묶임. Apple 문서도 복구 경로를 앱 업데이트로 제시 |
| 원격 비활성화 | 설정 값으로 핀닝을 끔 | 순환 문제(아래), 그리고 공격자가 이 채널을 조작하면 핀닝 전체가 무력화 |

### 4. 원격 킬 스위치의 부트스트랩 문제

핀이 깨진 호스트와 같은 호스트(`api.example.com`)에서 설정을 받으면 해제 신호가 닿지 않는다. 대안은 다음과 같다.

1. **설정 전용 호스트를 핀 대상에서 제외**하되, 그 응답은 **앱에 내장된 공개키로 서명 검증**한다. 전송 보안이 아니라 메시지 서명이 신뢰의 근거다.
2. 설정 값은 "핀 끄기" 한 가지가 아니라 **좁은 범위**로 한정한다. 예: 특정 호스트 하나, 특정 앱 버전 이하, 최대 N 일 유효. 서명된 값에 만료 시각을 넣어 무기한 해제를 막는다.
3. 앱은 마지막 정상 설정을 캐시하고, 설정 획득이 실패하면 **핀닝을 유지**한다(fail-closed). 설정 서버 장애가 핀닝 해제로 이어지면 안 된다.
4. 핀 해제 상태에서도 TLS 기본 검증은 그대로 둔다. 해제는 "핀 추가 검증을 건너뜀"이지 "인증서 무시"가 아니다. Apple 문서도 핀은 시스템 검증을 더 조일 뿐 느슨하게 하지 못한다고 설명한다.

```ts
// 서명된 비상 설정의 검증 개요 (verify 는 내장 공개키로 서명을 확인하는 함수라고 가정)
interface PinOverride { host: string; maxAppVersion: string; notAfter: number /* epoch ms */; }
function activeOverride(signed: Uint8Array, sig: Uint8Array, now: number): PinOverride | null {
  if (!verify(signed, sig, EMBEDDED_PUBLIC_KEY)) return null;   // 서명 불량이면 무시 = 핀 유지
  const o = JSON.parse(new TextDecoder().decode(signed)) as PinOverride;
  return now < o.notAfter ? o : null;                           // 만료되면 자동 복귀
}
```

OWASP 는 핀셋을 안전하게 갱신할 수 없다면 핀닝하지 말라고 한다. 원격 비활성화 채널을 만들 수 없는 팀은 핀닝 자체를 재검토한다.

### 5. 사고 런북

1. 경보: `tls_validation_failure` 비율 급상승 → 영향 버전·호스트 확인.
2. 서버 측 변경 이력 확인(인증서·키·CA 교체 여부). 서버를 되돌릴 수 있으면 **서버를 먼저 되돌린다**. 가장 빠르고 신호 채널이 필요 없다.
3. 안 되면 서명된 비상 설정을 좁은 범위로 배포하고, 효과를 같은 지표로 확인한다.
4. 사후에 앱 업데이트로 핀 목록을 고치고, 만료 시각이 지난 비상 설정이 자동 복귀하는지 확인한다. [사후 분석](/develop-wiki/knowledge/engineering-practice/incident-response-postmortem/) 절차를 따른다.

## 언제 쓰나

- 이미 핀닝을 운영 중이고, 앱·서버 키 교체를 직접 통제하는 금융·의료·결제 앱.
- 핀닝을 처음 도입하는 단계에서, **계측과 비상 해제 수단을 핀닝보다 먼저** 출시할 때.

## 주의·비용

- 원격 비활성화 채널은 새 공격 표면이다. 서명 검증이 잘못되면 핀닝의 보호 가치가 사라진다. 서명 키 관리가 필요하다.
- 계측 데이터에 호스트·네트워크 정보가 포함되므로 개인정보 범위를 점검한다. 사용자 식별자를 붙이지 않는 집계 카운터로 충분하다.
- 만료일·킬 스위치는 안전망이지 정책이 아니다. 항상 켜 두면 핀닝은 장식이 된다.
- 오탐 비용: 기업 프록시·보안 앱 사용자는 정상 사용에도 실패한다. 이들을 위해 우회를 열면 공격자도 쓴다. 지원 문서로 안내하고 위험 수용 절차로만 예외를 둔다.
- 플랫폼별 차이: iOS 핀 설정은 `Info.plist` 의 `NSPinnedDomains` 이고 Apple 은 핀을 가능하면 쓰지 말고, 쓴다면 CA 키를 여러 개 핀하라고 안내한다. 이 노트의 Android 만료 속성 설명은 Android 문서에 근거하고 iOS 에는 대응 속성을 확인하지 못했다.

> 출처 확인 범위: OWASP Pinning Cheat Sheet, Android Network Security Configuration, Apple 의 Identity Pinning 안내(NSPinnedDomains)를 읽었다. 미확인: Firebase Remote Config 의 fetch 간격·실패 동작 문서(페이지 접근 불가), iOS 네이티브 핀 실패 에러 코드 목록, 서명된 비상 설정의 사례 문서. 4절의 서명·만료·범위 한정과 1절의 집계 축 및 진단 해석은 위 문서에서 이끌어 낸 설계 권고이며 공식 문서가 규정한 방식은 아니다.
