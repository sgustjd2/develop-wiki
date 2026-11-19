---
title: 인증서 핀닝 운영 (백업 핀·교체·실패 대응)
aka: [Certificate Pinning Operations, SPKI Pinning, Backup Pin, Pin Rotation, pin-set, 핀 교체]
category: mobile-dev
group: delivery
level: advanced
summary: 핀닝을 켠 뒤 서버 키·CA 교체 때 앱이 먹통이 되지 않도록 무엇을 핀할지 고르고, 백업 핀·만료·원격 설정·실패 관측까지 운영 절차로 다루는 방법.
tags: [mobile, security, tls, pinning, operations, network-security-config, spki]
related: [mobile-dev/mobile-networking, mobile-dev/mobile-threat-model-masvs, mobile-dev/staged-rollout-remote-config, mobile-dev/store-review-policy, cs-fundamentals/tls-https, security/mtls-certificate-bound-tokens]
sources:
  - https://developer.android.com/privacy-and-security/security-config
  - https://cheatsheetseries.owasp.org/cheatsheets/Pinning_Cheat_Sheet.html
updatedAt: 2026-11-19
---

핀닝이 무엇이고 선언 위치가 어디인지는 [모바일 네트워킹](/develop-wiki/knowledge/mobile-dev/mobile-networking/)에 짧게 있다. 이 노트는 **켠 뒤의 운영**이다.

## 문제

- 핀닝은 "서버가 바뀌면 앱도 바뀌어야 한다"는 약속이다. 인증서 갱신·CA 변경·키 유출 대응이 모두 앱 배포와 엮인다.
- 앱 배포는 사용자 업데이트 속도에 묶인다. 핀이 어긋난 구버전은 서버에 아예 붙지 못한다. 서버는 정상인데 앱만 죽는 장애다.
- 일부 인증서 발급 주체는 갱신 때마다 새 키를 만든다. OWASP 는 이러면 새 키를 미리 확보해 둘 수 없다고 경고한다.

## 해법

### 1. 무엇을 핀할지

OWASP 가이드의 정리를 따르면 다음 순서로 범위를 좁힌다.

| 대상 | 평가 |
| --- | --- |
| 루트 CA | 권장하지 않음. 그 아래 모든 중간 CA 를 신뢰하게 됨 |
| 중간(발급) CA | 범위는 좁지만 그 CA 가 발급하는 모든 인증서를 신뢰 |
| 리프 | 가장 정밀. 단, 백업 핀 필수 |
| 인증서 전체 vs 공개 키 | 인증서 해시는 갱신마다 깨짐. 공개 키(SPKI)는 키를 유지하면 갱신을 견디고, 인증서 발급 전에 미리 핀할 수 있음 |

Android 의 `pin-set` 은 SPKI 의 SHA-256 해시를 쓰며, 체인에 핀된 키가 하나라도 있으면 유효하다. 현재 지원 digest 는 SHA-256 뿐이라고 문서에 적혀 있다.

### 2. 백업 핀을 반드시 둔다

- 현재 키 + **아직 서버에 배포하지 않은 다음 키**(오프라인 보관)를 함께 핀한다. 키를 교체해도 구버전 앱이 계속 붙는다.
- 또는 리프 핀 뒤에 중간 CA 핀을 백업으로 둔다. 대신 그 CA 전체를 신뢰하게 되는 대가를 치른다(OWASP).
- Android 문서도 백업 키를 항상 넣으라고 하며, 없으면 앱 업데이트로만 연결을 복구할 수 있다고 한다.

```xml
<network-security-config>
  <domain-config>
    <domain includeSubdomains="true">api.example.com</domain>
    <pin-set expiration="2027-06-30">
      <pin digest="SHA-256"><!-- 현재 서버 키 SPKI 해시 --></pin>
      <pin digest="SHA-256"><!-- 다음 키(미배포) SPKI 해시 --></pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

### 3. 교체 절차(타임라인)

1. 다음 키를 만들고 해시를 **앱 릴리스에 먼저** 넣는다(백업 핀).
2. 해당 앱 버전이 사용자 대부분에게 퍼질 때까지 기다린다. [단계적 출시](/develop-wiki/knowledge/mobile-dev/staged-rollout-remote-config/)의 채택률 지표로 판단한다.
3. 서버를 새 키로 교체한다.
4. 다음 릴리스에서 폐기된 핀을 빼고 새 백업 핀을 추가한다.

핵심은 **앱이 서버보다 먼저 간다**는 순서다.

### 4. 만료·킬스위치

- `expiration` 을 두면 그 날짜 뒤에는 핀닝을 하지 않아, 업데이트하지 않은 앱의 연결 단절을 막는다. 문서는 같은 이유로 공격자가 우회할 여지도 생긴다고 경고한다. 안전망이지 정책이 아니다.
- 핀 목록을 원격 설정으로 내려받는 설계는 업데이트 부담을 줄이지만, 그 설정을 전달하는 채널 자체를 신뢰할 수 있어야 한다(OWASP 는 "핀셋을 안전하게 갱신할 수 없다면 핀닝하지 말라"고 한다). 최초 핀은 앱에 내장하고, 갱신 채널은 서명 검증을 거친다.

### 5. 실패 관측

- 핀 검증 실패는 일반 네트워크 오류와 분리해 기록한다(호스트, 앱 버전, OS, 체인 요약).
- 사용자가 핀 실패를 넘기게 하는 우회 UI 를 만들지 않는다(OWASP). 로그를 남기고 연결을 거부한다.
- 실패율이 특정 앱 버전·통신사 한정으로 오르면 사설 프록시·기업 보안 장비를 의심한다. 단, 장비를 예외로 풀어 주는 결정은 위험 수용 절차로 한다.
- 디버그 빌드에서만 프록시 CA 를 허용한다. Android 는 `debug-overrides` 가 `android:debuggable` 일 때만 적용되고 그 CA 에는 핀닝이 적용되지 않는다고 설명한다. 릴리스에는 들어가지 않는다.

## 언제 쓰나

- 위협 모델에 "유효한 CA 가 발급한 위조 인증서"가 있고(금융·의료·결제), 클라이언트와 서버를 **둘 다 직접 운영**하며, 인증서 교체 절차를 지킬 팀이 있을 때.
- OWASP 는 거의 모든 경우 핀닝하지 말라는 입장이다. 기본 신뢰 + HTTPS + 짧은 수명 토큰으로 충분한지 먼저 판단한다. 대안으로 신뢰 CA 를 줄이는 `trust-anchors` 가 있다.

## 주의·비용

- 직접 구현한 검증 코드는 실수 가능성이 높다. 플랫폼 선언 설정이나 검증된 네트워크 라이브러리의 핀 기능을 쓰고 직접 검증은 피하라는 것이 OWASP 의 모바일 권고다.
- 제3자 API(결제사·지도 등)는 키를 우리가 통제하지 못하므로 핀하지 않는다.
- 강제 업데이트 경로가 없으면 사고 시 복구가 사용자 행동에 달린다. [출시 게이트](/develop-wiki/knowledge/mobile-dev/release-gates-crash-free/)에 "핀 만료일·백업 핀 유효성 점검"을 넣는다.
- 핀닝은 TLS 구간 보호일 뿐 토큰 탈취 자체를 막지 않는다. 토큰 보호는 [mTLS·인증서 바인딩 토큰](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/)·[DPoP](/develop-wiki/knowledge/security/dpop/) 영역이다.
- 루팅·후킹 환경에서는 런타임에 핀 검증이 우회될 수 있다. 핀닝은 네트워크 공격자 대응이지 기기 장악 대응이 아니다. [위협 모델](/develop-wiki/knowledge/mobile-dev/mobile-threat-model-masvs/) 참고.

> 출처 확인 범위: Android Network Security Configuration 문서와 OWASP Pinning Cheat Sheet 를 읽었다. iOS 쪽 핀닝(Apple 문서의 서버 트러스트 평가, `NSPinnedDomains`) 의 원문은 이번에 읽지 못해 iOS 세부는 적지 않았다. 위 4번의 "원격 핀 갱신 채널 서명 검증" 은 OWASP 의 안전한 갱신 요구에서 이끌어 낸 설계 권고이며 공식 문서가 특정 방식을 규정하지는 않는다.
