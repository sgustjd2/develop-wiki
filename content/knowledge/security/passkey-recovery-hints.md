---
title: 패스키 복구 정책과 WebAuthn hints
aka: [Passkey Account Recovery, Credential Loss and Key Mobility, PublicKeyCredentialHint, hints, security-key hint, client-device hint, hybrid hint, Backup Authenticator, 패스키 복구, 백업 인증기]
category: security
level: advanced
summary: WebAuthn 은 개인키 백업 프로토콜 대신 "자격 증명 여러 개 등록"을 복구의 기본으로 둔다. 명세 13.4.6·6.1.3 권고를 계정 정책으로 옮기고, 두 번째 인증기 등록을 hints 로 유도하는 법을 정리한다.
tags: [webauthn, passkeys, account-recovery, hints, backup-eligibility, fido2, w3c, authentication]
related: [security/webauthn-signal-api-passkey-lifecycle, security/webauthn-related-origin-requests, security/mfa-passkeys, security/password-storage, security/session-vs-jwt, security/threat-modeling-stride, mobile-dev/social-login-account-linking-deletion]
sources:
  - https://www.w3.org/TR/webauthn-3/
updatedAt: 2026-11-19
---

## 문제

- 패스키의 개인키는 인증기 안에 있다. 명세 13.4.6 은 이 명세가 **개인키를 백업하거나 인증기끼리 공유하는 프로토콜을 정의하지 않는다**고 밝힌다. 인증기를 잃으면 그 인증기에 묶인 자격 증명을 모두 잃는다.
- 동기화되는 패스키(BE=1)는 기기 하나를 잃어도 살아남지만, 백업이 꺼지거나 오류가 나면 BS 가 1→0 으로 바뀌고 단일 기기 상태가 된다.
- 등록된 자격 증명이 하나뿐인 계정은 그 하나를 잃는 순간 잠긴다. 복구 경로를 별도로 두면, 그 경로가 계정에서 가장 약한 입구가 된다.

## 해법 1: 명세가 권하는 복구의 기본 — 여러 개 등록

명세 13.4.6 의 권고를 요약하면 이렇다.

- RP 는 한 계정에 **자격 증명 여러 개** 등록을 허용하고 권장해야 한다(SHOULD). 예: 자주 쓰는 기기마다 플랫폼 자격 증명, 그리고 백업과 새 기기용으로 로밍 자격 증명(보안 키 등) 하나 이상.
- 서로 다른 인증기에 등록되게 하려고 `excludeCredentials` 와 `user.id` 를 써야 한다(SHOULD). 같은 인증기에 두 번 등록하면 백업이 아니다.

명세 6.1.3 은 BE/BS 플래그로 정책을 움직이는 예시를 든다(자세한 표는 [Signal API 와 수명주기](/develop-wiki/knowledge/security/webauthn-signal-api-passkey-lifecycle/) 노트).

| 신호 | 명세의 예시 정책 |
| --- | --- |
| BE=0 (단일 기기 자격 증명) | 추가 인증기 등록 또는 계정 복구 절차를 갖추게 한다(SHOULD) |
| BS 0→1 | 비밀번호 제거를 권유할 수 있다(MAY) |
| BS 1→0 | 다른 인증 요소를 확인하게 하고, 다른 자격 증명이 없으면 추가 등록을 안내한다(SHOULD) |

명세 1.3.5(해지)는 분실 신고·비활성 정리·사용자의 인증기 쪽 삭제를 모두 **서버 쪽에서 처리할 일**이며 API 지원이 필요 없다고 설명한다.

## 해법 2: hints 로 두 번째 인증기를 유도한다

`create()`·`get()` 옵션의 `hints` 는 RP 가 어떤 인증기를 기대하는지 브라우저에 알려 UI 를 맞추게 하는 값 목록이다(5.8.8).

| 값 | 의미 | 구형 브라우저용 `authenticatorAttachment`(등록 시 권고) |
| --- | --- | --- |
| `security-key` | 물리 보안 키로 완료할 것으로 기대(예: 직원에게 키를 지급한 기업) | `cross-platform` |
| `client-device` | 지금 쓰는 기기의 플랫폼 인증기를 기대 | `platform` |
| `hybrid` | 스마트폰 같은 범용 인증기를 기대. 로컬 플랫폼 인증기를 앞세우지 말라는 뜻도 포함 | `cross-platform` |

- 목록은 **선호 순서**다. 서로 모순되면 앞의 것이 이기고, 더 구체적인 힌트를 앞에 둔다. 반복된 값은 무시한다.
- 힌트는 **구속력이 없다.** 브라우저가 "적절하다고 보는 대로" UI 에 반영한다.
- `transports` 나 `authenticatorAttachment` 와 모순되면 **힌트가 우선**한다. 발견 가능한 자격 증명 요청에는 `transports` 가 없으므로 힌트가 의도를 전할 유일한 수단이다.

백업 인증기 등록 화면의 옵션 예(직접 작성):

```ts
// 이미 플랫폼 패스키가 있는 사용자에게 "백업 보안 키 추가"
const options: PublicKeyCredentialCreationOptions = {
  challenge, rp: { id: 'example.com', name: 'Example' },
  user: { id: userHandle, name: email, displayName },          // 같은 user.id
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
  excludeCredentials: existingIds.map((id) => ({ type: 'public-key', id })), // 같은 인증기 재등록 방지
  authenticatorSelection: { authenticatorAttachment: 'cross-platform', residentKey: 'preferred' },
  hints: ['security-key', 'hybrid'],                           // 보안 키 우선, 다음은 휴대폰
};
await navigator.credentials.create({ publicKey: options });
```

## 계정 정책으로 옮기면

| 상태 | 정책 예 |
| --- | --- |
| 자격 증명 1개, BE=0 | 로그인 직후 두 번째 인증기 등록을 권유(`hints: ['security-key']` 또는 다른 기기) |
| 자격 증명 1개, BE=1·BS=1 | 동기화 계정 하나에 모든 것이 걸려 있음. 그 동기화 계정 밖의 인증기 추가를 권유 |
| BS 1→0 감지 | 다른 요소 확인 후 추가 등록 안내 |
| 마지막 자격 증명 삭제 요청 | 다른 로그인 수단이 없으면 막거나 경고. 삭제 후 [Signal API](/develop-wiki/knowledge/security/webauthn-signal-api-passkey-lifecycle/)로 남은 목록 동기화 |
| 비밀번호 제거 | BS=1 이거나 서로 다른 인증기에 2개 이상일 때만 권유 |

위 표에서 첫 행·셋째 행은 명세 권고를 옮긴 것이고, 둘째·넷째·다섯째 행은 내 설계 제안이다.

## 언제 쓰나

- 패스키를 주 로그인 수단으로 바꾸면서 비밀번호를 없애려 할 때. 복구 경로를 먼저 정하지 않으면 지원 창구가 사실상의 복구 경로(그리고 공격 경로)가 된다.
- 기업 환경에서 보안 키를 지급할 때 등록·로그인 UI 를 보안 키 쪽으로 맞출 때(`security-key` 힌트).
- QR 로 휴대폰을 쓰게 하고 싶은 공용 PC 흐름(`hybrid` 힌트).

## 주의 (비용)

- **복구 경로가 가장 약한 고리다.** 이메일 링크·SMS·상담원 확인으로 복구하면 계정 보안은 그 수준으로 내려간다. 패스키의 피싱 저항성은 복구 경로에는 적용되지 않는다(일반 원칙이며 명세의 문장은 아니다).
- **복구 가능 여부를 노출하지 않는다.** 명세 13.4.7 은 사용자 이름만으로 시작한 인증에서 어떤 계정은 `allowCredentials` 를 돌려주고 어떤 계정은 비밀번호를 요구하면, 공격자가 패스키 없는 약한 계정을 골라낼 수 있다고 경고한다. 복구·로그인 분기 응답을 계정마다 다르게 하지 않는다.
- **힌트는 보장이 아니다.** 브라우저가 무시하거나 일부만 반영할 수 있다. 서버는 등록 응답의 인증기 종류·BE 플래그로 결과를 다시 확인한다.
- 동기화 패스키는 동기화 제공자 계정의 보안에 기댄다. 그 계정이 탈취되면 패스키도 따라간다. BE=1 이 곧 안전을 뜻하지 않는다.
- 사용자에게 인증기를 여러 개 관리하게 하는 것 자체가 부담이다. 권유 빈도와 시점을 조절한다.

> 출처 확인 범위: W3C WebAuthn Level 3(Recommendation, 2026-08-25)에서 13.4.6(자격 증명 분실과 키 이동성), 13.4.7(보호되지 않은 계정 탐지, 비규범), 6.1.3(BE/BS 와 RP 예시 정책), 5.8.8(PublicKeyCredentialHint 세 값·순서·우선순위), 5.1.3·5.1.4.1 의 hints 처리 단계, 1.3.5(해지)를 직접 읽었다. 브라우저별 hints 지원·UI 반영 방식, 동기화 제공자별 복구 절차, NIST 등 외부 인증 지침은 확인하지 않았다. 계정 정책 표의 일부 행은 명세가 아닌 내 제안이며 본문에 구분해 적었다.
