---
title: 소프트웨어 공급망 보안 (SBOM·의존성·SLSA)
aka: [Software Supply Chain Security, SBOM, Software Bill of Materials, SLSA, Dependency Management, SCA, VEX]
category: security
level: intermediate
summary: 의존성·빌드 도구·CI·배포 경로를 통해 들어오는 위협을 SBOM 인벤토리, 의존성 고정·검토, 서명된 빌드 출처(SLSA)로 관리하는 방법.
tags: [supply-chain, sbom, slsa, dependencies, ci-cd, owasp, npm]
related: [security/owasp-top-10, security/secrets-management]
sources:
  - https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/
  - https://www.cisa.gov/sbom
  - https://slsa.dev/spec/v1.1/levels
updatedAt: 2026-11-18
---

OWASP Top 10:2025 는 이 주제를 **A03 Software Supply Chain Failures** 로 새로 세웠다. 2021년의 "취약하고 오래된 컴포넌트"보다 범위가 넓어, 의존성뿐 아니라 빌드 시스템·배포 인프라의 침해까지 다룬다.

## 문제

우리 코드보다 남의 코드가 훨씬 많다. 위협은 여러 경로로 온다.

| 경로 | 사례(OWASP A03 이 든 예) |
| --- | --- |
| 알려진 취약점이 있는 컴포넌트 | Apache Struts 2(CVE-2017-5638), Log4Shell(CVE-2021-44228) |
| 신뢰하던 공급자의 업데이트 오염 | SolarWinds(2019) |
| 악성 패키지·탈취된 메인테이너 계정 | npm 자기 전파 웜 Shai-Hulud(2025): 설치 스크립트로 토큰을 훔쳐 다른 패키지에 악성 버전 배포 |
| 특정 대상만 노리는 숨은 코드 | Bybit 지갑 탈취(2025) |

## 해법

### 1. 인벤토리: SBOM

SBOM(Software Bill of Materials)은 소프트웨어를 이루는 구성 요소의 **중첩된 재료 목록**이다(CISA 정의). 직접·전이 의존성, 버전, 출처를 기록한다. 대표 형식은 SPDX 와 CycloneDX. 새 CVE 가 나왔을 때 "우리 어디에 이 버전이 있나"에 몇 분 안에 답할 수 있게 해 준다. VEX 문서는 "이 취약점이 우리 제품에 실제로 영향이 있나"를 알린다.

### 2. 의존성 위생

```ini
# .npmrc — 의존성의 설치 스크립트(postinstall 등) 기본 차단
ignore-scripts=true
```

```bash
# CI: lockfile 과 다르면 실패하는 설치
npm ci
pnpm install --frozen-lockfile
```

- **lockfile 을 커밋**하고 CI 는 lockfile 대로만 설치한다.
- 신뢰할 수 있는 레지스트리에서, 가능하면 서명·출처가 확인된 패키지만.
- 설치 스크립트(postinstall) 실행을 기본 차단하고, 빌드가 꼭 필요한 패키지만 예외로 둔다(패키지 매니저별 옵션이 다르니 확인).
- SCA 도구(Dependabot, Renovate, OWASP Dependency-Check/Dependency-Track, OSV 스캐너)로 CVE·OSV 를 지속 감시.
- 쓰지 않는 의존성은 지운다. 의존성 하나하나가 공격 면이다.
- 업데이트는 자주, 작게, 그리고 **단계적 배포(카나리)**로. 분기마다 몰아서 올리면 노출 기간이 길다.

### 3. 빌드 무결성: SLSA

SLSA(Supply-chain Levels for Software Artifacts) 빌드 트랙 단계:

| 단계 | 요구 | 막는 것 |
| --- | --- | --- |
| L1 | 일관된 빌드 + 출처(provenance) 자동 생성 | 실수, 무엇이 어떻게 빌드됐는지 모름 |
| L2 | 호스팅된 빌드 플랫폼이 출처에 서명 | 빌드 이후 산출물 바꿔치기 |
| L3 | 빌드 간 격리, 서명 키를 사용자 빌드 단계로부터 분리 | 빌드 도중 변조(내부자, 탈취된 자격 증명) |

(SLSA 사양은 v1.2 가 현행이며, 위 단계 정의는 v1.1 기준이다.)

### 4. 파이프라인 강화

- CI/CD 를 운영 시스템만큼 보호한다: 직무 분리, 접근 제어, 환경별 비밀, 변조 방지 로그.
- 한 사람이 코드 작성부터 운영 배포까지 혼자 할 수 없게 리뷰를 강제한다.
- 산출물은 서명하고, 환경마다 다시 빌드하지 말고 **같은 산출물을 승격**한다.
- 개발자 PC·IDE 확장도 공급망이다. MFA, 패치.

## 언제 쓰나

- 외부 의존성이 있는 모든 프로젝트. 규모가 작아도 lockfile·자동 업데이트·취약점 알림은 기본.
- 규제 대상(공공 납품 등)은 SBOM 제출이 요구될 수 있다.

## 주의 (비용)

- SBOM 은 만드는 것보다 **계속 갱신하고 실제로 조회하는 것**이 어렵다. 빌드마다 생성해 저장한다.
- 자동 업데이트 PR 이 쌓이면 무시하게 된다. 묶음 규칙·자동 병합 범위를 정한다.
- 취약점 스캐너 결과의 상당수는 실제로 도달 불가능한 코드다. 도달 가능성·VEX 로 우선순위를 정하지 않으면 경보 피로가 생긴다.
- 버전 고정은 최신 보안 패치도 막는다. 고정 + 자동 업데이트를 함께 써야 의미가 있다.
- 유지보수가 끊긴 패키지는 패치가 안 나온다. 대체하거나 가상 패치(WAF 규칙 등)로 버틴다.
