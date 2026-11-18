---
title: 모바일 네트워킹 (불안정한 연결·TLS 정책·인증서 핀닝)
aka: [Mobile Networking, ATS, App Transport Security, Network Security Config, Certificate Pinning, waitsForConnectivity]
category: mobile-dev
group: platform
level: intermediate
summary: 끊기고 바뀌는 모바일 네트워크를 전제로 요청을 설계하고, iOS ATS·Android Network Security Config 로 TLS 기본 정책을 지키며 핀닝은 비용을 따져 쓴다.
tags: [mobile, networking, tls, ats, network-security-config, pinning, urlsession]
related: [mobile-dev/offline-first-sync, mobile-dev/background-work-constraints, mobile-dev/mobile-secure-storage, performance/timeout-retry-circuit-breaker, cs-fundamentals/tls-https, distributed-systems/idempotency]
sources:
  - https://developer.apple.com/documentation/security/preventing-insecure-network-connections
  - https://developer.apple.com/documentation/foundation/urlsessionconfiguration/waitsforconnectivity
  - https://developer.apple.com/documentation/foundation/urlsessionconfiguration/isdiscretionary
  - https://developer.android.com/privacy-and-security/security-config
  - https://mas.owasp.org/MASVS/
updatedAt: 2026-11-19
---

## 문제

모바일 연결은 Wi-Fi 와 셀룰러가 오가며 끊기고, 앱은 백그라운드로 가면 요청이 중단된다. 서버 쪽 서비스와 달리 클라이언트는 **사용자 기기·사용자 네트워크**라는 신뢰할 수 없는 환경에서 돈다. 두 가지 문제가 겹친다.

1. 연결 불안정에 대한 요청 설계(재시도, 대기, 큐).
2. 전송 보안 정책(평문 금지, 어떤 인증서를 믿는가).

## 해법

### 1. 연결 불안정 대응

- **요청 시작 시점**: iOS `URLSessionConfiguration.waitsForConnectivity = true` 이면 연결이 없을 때 즉시 실패하는 대신 연결을 기다린다. 이 값은 연결 *수립* 시점에만 적용되고, 맺은 뒤 끊기면 오류가 온다. 백그라운드 세션은 이 값과 무관하게 항상 기다린다.
- **큰 전송**: 백그라운드 세션에서 `isDiscretionary = true` 로 두면 시스템이 충전·Wi-Fi 같은 좋은 시점에 전송을 옮길 수 있다. 앱이 백그라운드에서 시작한 전송은 항상 시스템 재량이다.
- **재시도**: 지수 백오프와 상한, 그리고 **멱등 키**. 모바일은 응답이 유실돼 같은 요청을 다시 보내는 일이 흔하다. [타임아웃·재시도·서킷 브레이커](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/), [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) 참고.
- **쓰기는 큐**: 사용자 입력은 로컬에 먼저 쓰고 네트워크가 돌아오면 비운다. [오프라인 우선 설계](/develop-wiki/knowledge/mobile-dev/offline-first-sync/) 참고.
- 셀룰러 사용 제한(`allowsCellularAccess`, 기본값 true)은 사용자 설정을 존중하는 용도로 쓴다.

### 2. 전송 보안 기본값

**iOS ATS**: 표준 URL 로딩 시스템(`URLSession`)이 연결에 다음을 요구한다(공식 문서).

- 서버 인증서: RSA 2048비트 이상 또는 ECC 256비트 이상, SHA-2 256비트 이상 다이제스트.
- TLS 1.2 이상, AES-128/256, ECDHE 로 전방 비밀성.
- 위 요구를 못 맞추는 서버는 연결이 거부된다. 문서 권고는 **서버를 고치는 것**이고, 예외(`NSAppTransportSecurity`)는 보안을 낮춘다. `NSAllowsArbitraryLoads` 같은 일부 예외는 App Store 제출 시 정당화가 필요하다.
- ATS 는 Network 프레임워크나 CFNetwork 같은 저수준 API 호출에는 적용되지 않는다. 그때는 앱이 직접 안전을 책임진다.

**Android Network Security Config** (`res/xml/network_security_config.xml`, 매니페스트에서 참조):

- API 28(Android 9) 이상을 타깃으로 하면 평문(HTTP)이 기본 차단이다. 필요한 도메인만 `cleartextTrafficPermitted="true"` 로 연다.
- 기본 신뢰 앵커는 시스템 CA. API 23 이하를 타깃으로 하면 사용자가 추가한 CA 도 기본 신뢰한다.
- `debug-overrides` 는 `android:debuggable` 일 때만 적용돼, 개발용 프록시 CA 를 릴리스에 남기지 않게 해 준다.

```xml
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.example.com</domain>
  </domain-config>
</network-security-config>
```

### 3. 인증서 핀닝

공식 문서의 설명: 앱은 보통 사전 설치된 모든 CA 를 신뢰하므로 그중 하나가 위조 인증서를 발급하면 중간자 공격에 노출된다. 핀닝은 공개 키(SPKI)의 해시 집합을 지정해 체인에 그중 하나가 있을 때만 신뢰한다.

- Android 는 `pin-set` 으로 선언한다(SHA-256). 문서는 **반드시 백업 핀을 넣으라**고 한다. 키·CA 를 바꿀 때 앱 업데이트 없이는 연결이 끊긴다.
- `expiration` 날짜를 두면 그 뒤 핀닝을 하지 않아 업데이트 안 한 앱의 연결 단절을 막지만, 공격자가 우회할 여지도 생긴다고 문서가 경고한다.
- iOS 는 ATS 가 신뢰 평가를 *느슨하게* 하는 것은 막지만 *조이는* 것(핀닝)은 허용한다. `URLSession` 델리게이트에서 직접 구현한다.

## 언제 쓰나

- 모든 앱: ATS/NSC 기본값 유지, 평문 금지, 재시도는 멱등하게.
- 핀닝: 금융·의료처럼 위협 모델에 "유효한 CA 가 발급한 위조 인증서"가 들어갈 때. 일반 앱은 기본 신뢰 + HTTPS 로 충분한 경우가 많다.

## 주의·비용

- **핀닝은 운영 부담이다.** 인증서 교체·CA 변경 주기를 서버팀과 맞춰야 하고, 잘못 하면 앱이 서버에 못 붙는 장애가 된다(백업 핀, 만료 정책, 강제 업데이트 경로 필요).
- 개발 편의로 `NSAllowsArbitraryLoads` 나 전역 cleartext 허용을 켠 채 출시하는 실수가 흔하다. 도메인 단위 예외로 좁히고 릴리스 빌드에서 점검한다.
- 사용자 CA 를 신뢰하는 구성은 디버깅 도구로 편하지만 릴리스에는 넣지 않는다.
- Certificate Transparency, Encrypted Client Hello 같은 플랫폼 옵션은 OS 버전별로 기본값이 다르다. 타깃 API 레벨별로 공식 문서를 확인한다.
