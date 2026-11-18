---
title: MFA와 패스키(WebAuthn)
aka: [Multi-Factor Authentication, 2FA, 다요소 인증, Passkeys, WebAuthn, FIDO2, TOTP, Phishing-resistant MFA, Step-up Authentication]
category: security
level: intermediate
summary: 비밀번호 하나에 의존하지 않도록 두 번째 요소를 더하는 MFA 의 요소별 강도와 우회 공격, 그리고 출처에 묶인 공개키로 피싱을 구조적으로 막는 패스키(WebAuthn)의 동작과 구현 요점.
tags: [authentication, mfa, passkeys, webauthn, fido2, totp, phishing, owasp]
related: [security/password-storage, security/oauth2-oidc-pkce, security/session-vs-jwt, security/owasp-top-10, security/threat-modeling-stride, performance/rate-limiting]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
  - https://www.w3.org/TR/webauthn-3/
  - https://passkeys.dev/docs/intro/what-are-passkeys/
  - https://passkeys.dev/docs/reference/terms/
updatedAt: 2026-11-18
---

구현 라이브러리는 리소스 페이지 [SimpleWebAuthn](/develop-wiki/backend/auth/simplewebauthn/) 참고.

## 문제

- 비밀번호는 재사용되고, 유출 DB 에서 돌고, 피싱 페이지에 그대로 입력된다. 서버가 [안전하게 저장](/develop-wiki/knowledge/security/password-storage/)해도 사용자가 남에게 건네면 끝이다.
- 두 번째 요소를 붙여도 종류에 따라 막는 범위가 크게 다르다. SMS 코드는 SIM 스와핑에, TOTP 코드는 실시간 중계 피싱에 뚫린다.

## 해법 1: 요소의 종류와 강도

요소는 **아는 것**(비밀번호, PIN), **가진 것**(OTP 앱, 보안 키, 기기), **나 자신**(생체)으로 나뉜다. 같은 종류 두 개(비밀번호 + PIN)는 MFA 가 아니다. IP·위치·타이핑 패턴은 위험 신호일 뿐 독립 요소가 아니다.

| 두 번째 요소 | 막는 것 | 뚫리는 경로 |
| --- | --- | --- |
| SMS·음성 코드 | 비밀번호 유출만 | SIM 스와핑, 가로채기, 피싱. 개인정보·금융 앱에는 피한다 |
| 이메일 코드 | 비밀번호 유출만 | 이메일 계정 보안에 종속 |
| TOTP 앱 | 유출, 원격 대입 | 실시간 중계 피싱(리버스 프록시)으로 코드 전달 |
| 푸시 승인 | 유출 | **MFA 피로(push bombing)**: 승인 요청 폭탄에 사용자가 눌러 버림 → 번호 매칭 필요 |
| FIDO2 보안 키·패스키 | 위 전부 + **피싱** | 기기 분실, 복구 절차가 약하면 거기로 우회 |

OWASP 의 기본 입장: MFA 는 없는 것보다 무엇이든 낫고, 가능하면 **피싱 저항형**(FIDO2/패스키)을 고른다.

## 해법 2: 패스키(WebAuthn)가 피싱을 막는 원리

패스키는 FIDO2/WebAuthn 의 **발견 가능한(discoverable) 자격 증명**을 사용자 친화적으로 부르는 이름이다.

- 사이트(RP)마다 **키 쌍**을 만든다. 개인키는 기기(인증기)에만 있고 서버는 **공개키만** 저장한다 → 서버 DB 가 털려도 재사용할 비밀이 없다.
- 브라우저가 서명 대상에 **현재 출처(origin)** 를 넣고, 인증기는 **RP ID** 에 묶인 키만 꺼낸다. `examp1e.com` 피싱 페이지에서는 `example.com` 의 키가 아예 나오지 않는다. 사용자가 주소를 확인할 필요가 없다는 점이 TOTP 와의 결정적 차이.
- 인증기는 쓰기 전에 **사용자 검증(UV)**: 생체·기기 PIN 으로 본인 확인. **사용자 존재(UP)** 는 "누군가 버튼을 눌렀다"만 뜻한다.
- 종류: **동기화 패스키**(플랫폼 계정으로 여러 기기에 동기화)와 **기기 고정 패스키**(보안 키처럼 한 인증기를 벗어나지 않음).
- 로그인 폼에 `autocomplete="username webauthn"` 을 달면 브라우저 자동완성 목록에 패스키가 뜬다(conditional mediation).

## 해법 3: 서버 검증 요점

```ts
// 등록 (요점만). 실제로는 검증된 라이브러리를 쓴다.
const options = {
  challenge: randomBytes(32),                 // 서버가 만들고 세션에 보관, 1회용
  rp: { id: 'example.com', name: 'Example' },
  user: { id: randomBytes(16), name: email, displayName: name }, // user.id 에 이메일 등 PII 금지
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
  authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  excludeCredentials: existingCredsOf(user),  // 같은 인증기 중복 등록 방지
};
// 응답 검증: clientData.type === 'webauthn.create', challenge 일치, origin 허용 목록,
// authData.rpIdHash === SHA-256(rpId), UP=1, UV=1(요구 시), alg ∈ 요청 목록,
// credentialId 가 다른 사용자에 등록되어 있지 않음
await db.credentials.insert({ userId, credentialId, publicKey, signCount, backupEligible, backedUp, transports });
```

- 인증(assertion): `type === 'webauthn.get'`, challenge·origin·rpIdHash·플래그 확인 후, 저장된 공개키로 **authenticatorData ‖ SHA-256(clientDataJSON)** 에 대한 서명을 검증한다.
- `signCount`: 둘 중 하나라도 0 이 아닌데 새 값이 저장값 이하면 복제된 인증기일 수 있다는 신호. 동기화 패스키는 대개 0 을 보내므로 이것만으로 거부하지 말고 위험 신호로 쓴다.
- 플래그 **BE**(백업 가능)는 등록 후 바뀌지 않는다. **BS**(현재 백업됨)는 바뀔 수 있으니 매번 갱신해 둔다. 동기화 여부로 "비밀번호 제거 권유" 같은 UX 를 결정할 수 있다.
- 사용자 식별은 `user.id`(user handle)로. `name`/`displayName` 으로 인가 판단을 하지 않는다.

## 언제 쓰나

- **로그인 시점**: 웹·모바일·API 등 모든 입구에 같은 정책. 한 곳이라도 비밀번호만 받으면 그쪽으로 우회된다.
- **민감 작업 전 재인증(step-up)**: 비밀번호·이메일 변경, MFA 해제, 관리자 권한 상승, 큰 금액 이체.
- **위험 기반**: 새 기기·새 위치에서만 추가 요소를 요구해 평소 마찰을 줄인다.
- 패스키는 비밀번호 + OTP 를 쓰던 일반 소비자 서비스의 **기본 로그인 수단**으로, 보안 키(기기 고정)는 관리자·고위험 계정에.

## 주의 (비용)

- **복구가 진짜 공격면이다.** "MFA 잃어버렸어요" 지원 절차가 이메일 한 통이면 MFA 는 장식이다. 등록 때 1회용 복구 코드 발급, 둘 이상의 요소 등록 권장, 복구는 MFA 우회가 되지 않게 설계.
- 요소 변경·해제는 **기존 요소로 재인증**을 요구하고, 사용자에게 다른 채널로 알린다(시간·브라우저·위치). 고가치 계정은 변경에 지연을 둔다.
- **다운그레이드 금지**: 패스키 사용자를 SMS 로 떨어뜨리는 폴백이 있으면 공격자는 그쪽을 고른다. 레거시 인증(앱 비밀번호, 기본 인증)도 끈다.
- OTP: 짧은 유효 시간, 1회용, 시도 횟수 제한, 로그에 남기지 않음. TOTP 시드는 KMS/HSM 키로 암호화하고 클라이언트에 다시 내주지 않는다. 시간 창은 현재 + 직전 1단계 정도만, 이미 쓴 코드는 거부.
- 푸시 승인은 **번호 매칭**과 요청 빈도 제한, 폭주 모니터링을 함께.
- 동기화 패스키의 안전성은 동기화 제공자 계정 보안에 기대고, 기기 고정 키는 분실 시 복구 비용이 크다. 위협 모델에 맞춰 고른다 → [STRIDE 위협 모델링](/develop-wiki/knowledge/security/threat-modeling-stride/).
- 외부 IdP 를 쓰면 MFA 는 IdP 에서 걸고, 앱은 OIDC ID 토큰의 `acr`/`amr` 로 확인한다 → [OAuth 2·OIDC](/develop-wiki/knowledge/security/oauth2-oidc-pkce/).
