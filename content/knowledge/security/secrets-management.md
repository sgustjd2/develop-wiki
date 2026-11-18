---
title: 비밀 관리
aka: [Secrets Management, Secret Rotation, Envelope Encryption, Vault, KMS, 시크릿 관리]
category: security
level: intermediate
summary: API 키·DB 비밀번호·서명 키 같은 비밀값을 코드와 분리해 중앙 저장소에서 최소 권한으로 배포하고, 짧은 수명과 자동 회전으로 유출 피해를 줄이는 방법.
tags: [secrets, vault, kms, ci-cd, rotation, owasp]
related: [security/supply-chain-security, security/session-vs-jwt, security/owasp-top-10]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
  - https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/
updatedAt: 2026-11-18
---

## 문제

비밀값은 쉽게 새고, 새면 오래 간다.

- 저장소에 커밋된 키는 지워도 Git 이력·포크·CI 로그에 남는다.
- `.env` 파일이 개발자 노트북, 슬랙, 위키를 돌아다닌다.
- 같은 DB 비밀번호를 몇 년째 모든 서비스가 공유해, 누가 언제 썼는지 알 수 없다.
- 유출을 알아도 "바꾸면 뭐가 깨질지 몰라" 회전을 못 한다.

## 해법

| 원칙 | 실천 |
| --- | --- |
| 중앙화 | 비밀 관리 도구(HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault 등) 한 곳에 모으고 목록을 문서화 |
| 최소 권한 | 서비스별 정책. 서비스 A 는 자기 DB 비밀만 읽는다 |
| 짧은 수명 | 동적 비밀: 요청 시 발급하고 짧은 임대 기간 후 자동 폐기 |
| 자동 회전 | 정적 비밀은 정기 회전을 자동화. 신·구 값이 잠시 공존하는 단계적 회전 |
| 감사 | 누가 언제 어떤 비밀을 읽었는지·거부됐는지 기록, 로그 변조 방지 |
| 탐지 | IDE·pre-commit·CI 에서 비밀 스캐너 실행 |

### 애플리케이션에 전달하기

```ts
// 시작 시 비밀 관리자에서 가져오고, 메모리에만 둔다
const secret = await secrets.get('orders-api/db');
const pool = new Pool({ ...dbConfig, password: secret.password });

// 회전 대응: 인증 실패 시 한 번 새로 받아 재연결
pool.on('error', async (e) => {
  if (isAuthError(e)) await reloadCredentials();
});
```

OWASP 는 환경 변수가 같은 호스트의 다른 프로세스, 로그, 메모리 덤프로 샐 수 있다고 경고한다. 가능하면 마운트된 파일이나 메모리 전달을 쓰고, Docker `ENV`/`ARG` 에 비밀을 넣지 않는다(이미지 레이어에 남는다).

### CI/CD

- CI 변수에 장기 고가치 키를 두지 말고, **OIDC 연동으로 짧은 수명 자격 증명**을 받는다(작업 단위 TTL).
- 포크 PR 이 비밀에 접근하지 못하게 한다.
- 런타임 비밀은 파이프라인을 거치지 않고 배포된 서비스가 직접 가져오게 한다.

### 암호화 키: 봉투 암호화

KMS 의 마스터 키(KEK)로 데이터 키(DEK)를 암호화하고, DEK 로 실제 데이터를 암호화한다. 마스터 키는 KMS 밖으로 나오지 않고, 암호화된 DEK 만 데이터 옆에 저장한다.

## 유출 대응 순서

1. **즉시 폐기(revoke)**. 저장소에서 지우는 것보다 먼저다.
2. 새 값으로 **회전**하고 배포.
3. 코드·로그 등 노출 위치에서 제거(로그 무결성은 유지).
4. 접근 기록을 검토해 실제 악용 여부 확인.

## 언제 쓰나

- 서비스가 둘 이상이거나, 운영 환경이 있거나, 외부 API 키를 다루는 모든 프로젝트.
- 혼자 하는 작은 프로젝트라도 pre-commit 비밀 스캔과 `.gitignore` 는 처음부터.

## 주의 (비용)

- 비밀 관리 도구 자체가 최고 가치 표적이다. 그 도구의 루트 자격 증명은 별도로 보호한다.
- 동적 비밀·자동 회전은 애플리케이션이 재연결·재로드를 지원해야 한다. 지원 없이 회전을 켜면 장애가 난다.
- 비밀 스캐너는 오탐·미탐이 있다. 여러 도구를 겹쳐 쓰는 것을 OWASP 도 권한다.
- 애플리케이션 재시작은 탈취된 자격 증명을 무효화하지 않는다. 폐기는 발급처에서 해야 한다.
- BYOK 같은 고급 키 관리 옵션은 복잡도가 크다. 규제·위협 모델이 요구할 때만.
