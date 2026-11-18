---
title: OWASP Top 10 (2025)
aka: [OWASP Top 10, OWASP Top 10:2025, 웹 애플리케이션 10대 보안 위험]
category: security
level: beginner
summary: OWASP 가 데이터와 커뮤니티 조사로 뽑은 웹 애플리케이션 10대 보안 위험의 2025년판 목록, 2021년판에서 바뀐 점, 그리고 이 목록을 쓰는 올바른 방법.
tags: [owasp, web-security, appsec, checklist]
related: [security/sql-injection, security/xss, security/csrf, security/session-vs-jwt, security/supply-chain-security, security/secrets-management, security/cors]
sources:
  - https://top10.owasp.org/2025/
  - https://top10.owasp.org/2025/0x00_2025-Introduction/
  - https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/
updatedAt: 2026-11-18
---

OWASP(Open Worldwide Application Security Project)의 Top 10 은 웹 애플리케이션 보안 위험의 **인식 제고용 문서**다. 3~4년 주기로 개정되며, 2026-11 기준 최신판은 **2025년판**이다.

## 2025년판 목록

| ID | 범주 | 한 줄 설명 | 관련 노트 |
| --- | --- | --- | --- |
| A01 | Broken Access Control | 남의 리소스 조회·수정, 권한 상승. 2025년부터 SSRF 포함 | [CSRF](/develop-wiki/knowledge/security/csrf/) |
| A02 | Security Misconfiguration | 기본 계정, 과한 권한, 열린 관리 콘솔, 상세 오류 노출 | [CORS](/develop-wiki/knowledge/security/cors/) |
| A03 | Software Supply Chain Failures | 의존성·빌드·배포 경로의 취약점과 침해 | [공급망 보안](/develop-wiki/knowledge/security/supply-chain-security/) |
| A04 | Cryptographic Failures | 평문 저장·전송, 약한 알고리즘, 잘못된 키 관리 | [비밀 관리](/develop-wiki/knowledge/security/secrets-management/) |
| A05 | Injection | SQL·OS 명령·LDAP 인젝션, XSS | [SQL 인젝션](/develop-wiki/knowledge/security/sql-injection/), [XSS](/develop-wiki/knowledge/security/xss/) |
| A06 | Insecure Design | 설계 단계의 위협 모델링 부재, 비즈니스 로직 결함 | — |
| A07 | Authentication Failures | 크리덴셜 스터핑 허용, 약한 비밀번호 정책, 세션 고정 | [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/) |
| A08 | Software or Data Integrity Failures | 서명 없는 업데이트, 신뢰할 수 없는 역직렬화 | — |
| A09 | Security Logging and Alerting Failures | 침해를 기록·탐지·경보하지 못함 | — |
| A10 | Mishandling of Exceptional Conditions | 오류 처리 결함, 실패 시 열림(fail-open), 논리 오류 | — |

## 2021년판과 달라진 점

- **신설**: A03 공급망 실패(2021 의 "취약하고 오래된 컴포넌트"를 의존성·빌드 시스템·배포 인프라까지 넓힘), A10 예외 상황 처리 미흡.
- **흡수**: SSRF(2021 A10)가 A01 접근 제어 실패에 합쳐졌다.
- **이름 변경**: "Identification and Authentication Failures" → "Authentication Failures", "Security Logging and Monitoring Failures" → "...Alerting Failures"(경보 강조).
- **순위 변동**: 보안 설정 오류 5위 → 2위. 암호화 실패 2 → 4위, 인젝션 3 → 5위, 안전하지 않은 설계 4 → 6위.
- 데이터: 280만 개 이상 애플리케이션, 589개 CWE 를 분석했고 10개 중 8개는 데이터로, 2개(A03, A09)는 커뮤니티 설문으로 뽑았다.

## 언제 쓰나

- 개발자 보안 교육의 출발점, 코드 리뷰·위협 모델링 때 "빠뜨린 범주 없나" 확인.
- 보안 요구를 이야기할 공통 어휘.

## 주의 (비용)

- **표준이나 완전한 체크리스트가 아니다.** OWASP 스스로 Top 10 은 인식 문서이며, 검증 기준이 필요하면 ASVS(Application Security Verification Standard)를 쓰라고 권한다.
- 순위는 "앱 중 몇 %에서 발견됐나" 기반이다. 우리 시스템에서의 위험도와는 다르다. 자체 위협 모델링을 대신하지 않는다.
- 1위가 접근 제어라는 점에 주목한다. 프레임워크가 자동으로 막아 주지 못하는 영역이라 **모든 핸들러에서 "이 사용자가 이 리소스에 권한이 있나"를 서버에서 검사**해야 한다.
- 버전 번호(A05:2025 vs A03:2021)가 판마다 바뀐다. 문서·도구에 범주를 적을 때 연도를 붙인다.
