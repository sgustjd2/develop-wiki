---
title: 모바일 위협 모델과 OWASP MASVS
aka: [Mobile Threat Model, OWASP MASVS, MASTG, Mobile Application Security Verification Standard, 모바일 보안 검증 표준]
category: mobile-dev
group: platform
level: intermediate
summary: 사용자 기기를 공격자 영역으로 보고 자산·공격자·경로를 정리한 뒤, MASVS 8개 그룹으로 설계와 검증의 빠진 곳을 찾는 방법.
tags: [mobile, security, threat-model, masvs, owasp, reverse-engineering]
related: [security/threat-modeling-stride, security/owasp-top-10, mobile-dev/mobile-secure-storage, mobile-dev/mobile-networking, mobile-dev/deep-link-security, mobile-dev/mobile-token-refresh-session, mobile-dev/permissions-privacy, security/secrets-management]
sources:
  - https://mas.owasp.org/MASVS/
  - https://www.rfc-editor.org/rfc/rfc8252
updatedAt: 2026-11-19
---

## 문제

서버는 운영자가 통제하지만 앱은 **사용자 기기에서 실행되는 코드**다. 기기 소유자가 공격자일 수 있고, 같은 기기의 다른 앱이나 분실 상황도 있다. 서버 위협 모델을 그대로 가져오면 저장소, 바이너리, 앱 간 통신 쪽이 비게 된다.

## 해법

### 1. 자산·공격자·경로를 먼저 적는다

| 자산 | 예 |
| --- | --- |
| 자격 증명 | 리프레시 토큰, 세션, 서명 키 |
| 사용자 데이터 | 로컬 DB, 캐시, 스크린샷, 클립보드 |
| 비즈니스 로직 | 유료 기능 판정, 가격·쿠폰 규칙 |
| 서버 API | 앱만 부른다고 가정한 엔드포인트 |

| 공격자 | 능력 |
| --- | --- |
| 기기 분실·도난 | 잠금 화면 뒤 데이터 접근 시도 |
| 같은 기기의 악성 앱 | 링크 가로채기, 다른 앱 노출 컴포넌트 호출 |
| 네트워크 공격자 | 공용 Wi-Fi 에서 도청·변조 |
| 기기 소유자(루팅·탈옥) | 앱 분석, 후킹, 요청 재전송, 로컬 데이터 수정 |
| 침해된 서드파티 SDK | 앱과 같은 권한으로 동작 |

핵심 가정 하나: **클라이언트는 신뢰할 수 없다.** 앱 안의 검사(결제 여부, 권한, 가격)는 서버가 다시 한다. 앱에 넣은 API 키·시크릿은 비밀이 아니다(RFC 8252 8.5절도 배포 앱 내 시크릿을 기밀로 보지 않는다).

### 2. MASVS 그룹으로 빠진 곳을 찾는다

MASVS 는 8개 그룹으로 요구 사항을 묶는다.

| 그룹 | 묻는 것 | 관련 노트 |
| --- | --- | --- |
| STORAGE | 기기에 저장한 민감 데이터가 보호되는가 | [보안 저장소](/develop-wiki/knowledge/mobile-dev/mobile-secure-storage/) |
| CRYPTO | 암호 알고리즘·키·난수를 올바르게 쓰는가 | 같은 노트 |
| AUTH | 인증·인가·로컬 인증(생체)이 맞는가 | [토큰 갱신](/develop-wiki/knowledge/mobile-dev/mobile-token-refresh-session/) |
| NETWORK | 전송 중 데이터가 보호되는가 | [모바일 네트워킹](/develop-wiki/knowledge/mobile-dev/mobile-networking/) |
| PLATFORM | IPC·WebView·링크 등 플랫폼 기능을 안전하게 쓰는가 | [딥링크 보안](/develop-wiki/knowledge/mobile-dev/deep-link-security/) |
| CODE | 코드·의존성이 최신이고 알려진 취약점이 없는가 | [공급망 보안](/develop-wiki/knowledge/security/supply-chain-security/) |
| RESILIENCE | 역공학·변조를 어렵게 하는가 | 아래 주의 |
| PRIVACY | 개인정보를 최소로 다루고 투명한가 | [권한·프라이버시](/develop-wiki/knowledge/mobile-dev/permissions-privacy/) |

(그룹 이름과 한 줄 의미는 MASVS 사이트 목록 기준이다. 세부 통제 항목 번호·프로필 구성은 이 노트 작성 시 확인하지 못했다. 쓰기 전에 현재 버전을 확인한다.)

### 3. 위협을 설계 결정으로 옮긴다

- 토큰 탈취 → 보안 저장소 + 짧은 액세스 토큰 + 회전.
- 링크 가로채기 → 검증된 https 링크 + PKCE.
- 도청·변조 → TLS 강제, 필요한 곳에만 핀닝(운영 부담을 감안).
- 로직 변조 → 판정은 서버, 앱은 표시만.
- 방법론 자체(STRIDE 등)는 [위협 모델링](/develop-wiki/knowledge/security/threat-modeling-stride/) 참고.

## 언제 쓰나

- 결제·금융·의료·계정 데이터를 다루는 앱의 설계 단계, 보안 심사 전 체크리스트, 새 SDK 도입 시.

## 주의·비용

- RESILIENCE(난독화, 루팅 탐지, 무결성 검사)는 시간을 늦추는 수단이지 막는 수단이 아니다. 서버 측 검증을 대체하지 못한다.
- 모든 통제를 다 적용하려 하면 비용이 폭증한다. 자산 가치와 공격자 능력에 맞게 범위를 정한다.
- 인증서 핀닝은 인증서 교체 때 앱이 먹통이 될 위험이 있어 백업 핀·원격 설정 계획이 필요하다.
- 체크리스트 통과가 안전을 보증하지 않는다. 설계 단계의 위협 모델과 실제 테스트가 따로 필요하다.
