---
title: WebAuthn Signal API 와 패스키 수명주기
aka: [WebAuthn Signal API, signalUnknownCredential, signalAllAcceptedCredentials, signalCurrentUserDetails, Passkey Lifecycle, Backup Eligibility, Backup State, BE/BS, getClientCapabilities, 패스키 수명주기, 패스키 동기화 신호]
category: security
level: advanced
summary: 서버에서 지운 패스키가 사용자 기기·비밀번호 관리자에 계속 남는 문제를 RP 가 인증기에 "알려 주는" 세 가지 signal 메서드와, 등록부터 삭제까지 서버가 BE/BS 플래그와 함께 챙길 수명주기 규칙.
tags: [webauthn, passkeys, signal-api, fido2, credential-lifecycle, backup-eligibility, privacy, w3c]
related: [security/mfa-passkeys, mobile-dev/android-credential-manager-passkey-migration, mobile-dev/social-login-account-linking-deletion, mobile-dev/native-oauth-login-ux, security/password-storage, security/session-vs-jwt, security/threat-modeling-stride]
sources:
  - https://www.w3.org/TR/webauthn-3/
  - https://developer.android.com/identity/credential-manager/signal-api-rp
updatedAt: 2026-11-19
---

[MFA와 패스키](/develop-wiki/knowledge/security/mfa-passkeys/) 노트가 등록·로그인 흐름을 다뤘다면, 이 노트는 **등록 이후**를 다룬다. 서버가 자격 증명을 지우거나 사용자 이름을 바꿨을 때 기기 쪽에 남은 사본을 어떻게 맞추는지, 그리고 BE/BS 플래그로 계정 정책을 어떻게 움직이는지다. Android 쪽 API 이름과 요구 버전은 [Android Credential Manager 노트](/develop-wiki/knowledge/mobile-dev/android-credential-manager-passkey-migration/)에 있다.

## 문제

- 패스키의 공개키는 서버에, 개인키는 사용자의 인증기(플랫폼 인증기·비밀번호 관리자·보안 키)에 있다. 서버가 계정 화면에서 패스키를 지워도 **인증기는 그 사실을 모른다.**
- 다음 로그인에서 `allowCredentials` 없이(발견 가능한 자격 증명) 인증을 시작하면 인증기 UI 는 이미 지운 패스키를 후보로 보여 준다. 사용자가 고르면 서버가 거절하고, 사용자는 "왜 안 되지"를 겪는다.
- 사용자 이름·표시 이름을 바꿔도 인증기의 선택 화면에는 옛 이름이 남는다.

## 해법: 서버 → 인증기 방향의 신호

W3C WebAuthn Level 3(2026-08-25 자 Recommendation)의 5.1.10 절이 `PublicKeyCredential` 에 정적 메서드 세 개를 정의한다. 명세는 이를 RP 가 인증기에 자격 증명 상태를 알려 **잘못되거나 폐기된 자격 증명을 갱신·삭제·숨기게 하는** 수단으로 설명한다.

| 메서드 | 입력 | 인증기 쪽 권장 동작 | 언제 |
| --- | --- | --- | --- |
| `signalUnknownCredential` | `rpId`, `credentialId` | 해당 RP 의 그 id 를 지우거나 숨김 | 로그인 시도에서 서버가 모르는 id 를 받았을 때(**미인증 상태**) |
| `signalAllAcceptedCredentials` | `rpId`, `userId`, `allAcceptedCredentialIds[]` | 그 사용자의 자격 증명 중 목록에 **없는 것**은 지우거나 숨기고, 숨겼던 것이 목록에 있으면 되살림 | 사용자가 **인증된 상태**에서(로그인 직후, 패스키 삭제 직후) |
| `signalCurrentUserDetails` | `rpId`, `userId`, `name`, `displayName` | 해당 사용자 자격 증명의 표시 정보를 갱신 | 이름·표시 이름이 바뀐 뒤, 또는 로그인마다 |

세 메서드에 공통인 성질이 설계의 핵심이다.

- **결과를 알려 주지 않는다.** 성공한 promise 는 옵션 객체가 형식에 맞았다는 뜻뿐이다. 인증기가 붙어 있었는지, 실제로 지웠는지는 RP 가 모른다. 명세는 이것이 성공 여부·완료 시간으로 RP 가 사용자의 자격 증명 보유 여부를 몰래 알아내는 것을 막으려는 설계라고 적는다.
- **인증기는 따르지 않아도 된다.** 인증기 동작은 "권장 방식"이고, 사용자 의사에 반한다고 판단하면 무시하거나 사용자에게 물어볼 수 있다(MAY).
- **그 순간 붙어 있는 인증기에만** 전달된다. 보안 키가 뽑혀 있었다면 신호를 놓친다. 명세 주석은 그래서 로그인할 때마다 호출해도 된다고 적는다.
- RP ID 는 현재 origin 의 유효 도메인과 맞아야 하고(등록 가능한 도메인 접미사 또는 동일), 아니면 관련 출처 요청(related origin) 검증을 거친다. 맞지 않으면 `SecurityError`, base64url 형식이 아니면 `TypeError` 다.

### 어느 메서드를 쓰나: 개인정보가 갈림길이다

`signalAllAcceptedCredentials` 는 한 사용자의 **전체 자격 증명 id 목록**을 넘긴다. 미인증 호출자에게 이 목록을 노출하는 것은 개인 식별 정보 유출이다. 명세 14.6.3 절(비규범)은 `allowCredentials` 에 id 를 싣는 흐름이 같은 문제를 가진다고 설명한다. 목록 길이와 id 길이가 사용자 상관관계 지표가 될 수 있고, 인증기에 잠깐 접근한 사람이 신원 추측을 확인할 수도 있다는 것이다. 그래서 규칙은 단순하다.

- 사용자가 로그인돼 있다 → 전체 스냅숏인 `signalAllAcceptedCredentials` 를 우선(명세가 SHOULD). 아직 반영되지 않은 변경도 한꺼번에 정리한다.
- 로그인 실패 화면(미인증)에서 모르는 id 를 만났다 → `signalUnknownCredential` 만. id 하나만 넘기므로 정보가 새지 않는다.

### 호출 코드(브라우저, 직접 작성)

```ts
const caps = await PublicKeyCredential.getClientCapabilities?.();

export async function syncPasskeys(rpId: string, userId: string, ids: string[]) {
  if (!caps?.signalAllAcceptedCredentials) return; // 미지원은 조용히 건너뜀
  await PublicKeyCredential.signalAllAcceptedCredentials({
    rpId, userId, allAcceptedCredentialIds: ids, // base64url
  });
}
export async function dropUnknown(rpId: string, credentialId: string) {
  if (caps?.signalUnknownCredential)
    await PublicKeyCredential.signalUnknownCredential({ rpId, credentialId });
}
```

`getClientCapabilities()` 의 열거형에는 `signalAllAcceptedCredentials`, `signalCurrentUserDetails`, `signalUnknownCredential` 이 있어 기능 감지에 쓴다.

## 서버가 챙길 수명주기

| 단계 | 서버가 할 일 |
| --- | --- |
| 등록 | 공개키·`credentialId`·`userId`(user handle)와 함께 **BE**(백업 가능, 이후 불변)·**BS**(현재 백업됨) 저장 |
| 로그인 | 검증 후 BS 최신값 갱신(명세는 계정과 함께 저장하라고 권고). 변화에 따라 정책 분기 |
| 패스키 삭제 | DB 삭제 → 즉시 `signalAllAcceptedCredentials`(남은 목록) |
| 이름 변경 | `signalCurrentUserDetails` |
| 모르는 id 수신 | 거절 후 `signalUnknownCredential` |
| 계정 삭제 | 빈 목록으로 `signalAllAcceptedCredentials` 를 보내 사본 정리를 요청할 수 있다(명세에 이 용례의 예시는 없고 위 모형에서만 확인한 해석이며, 인증기가 따를지는 보장 없음) |

BE/BS 조합은 (0,0) 단일 기기 자격 증명, (1,0) 백업 가능하지만 현재 백업 안 됨, (1,1) 백업됨이고 (0,1) 은 허용되지 않는다. 명세 6.1.3 절이 예시로 드는 활용은 다음과 같다.

- BE=0: 기기 하나를 잃으면 접근도 잃으므로, 다른 인증기 등록이나 계정 복구 절차를 갖추게 유도.
- BS 0→1: 백업이 생겼으니 비밀번호 제거를 권유할 수 있다.
- BS 1→0: 백업이 끊긴 신호다. 다른 요소를 확인하고, 다른 자격 증명이 없으면 추가하도록 안내.

## 확인한 것: 브라우저 실행과 규칙 모형

- 이 작업 환경의 브라우저(Chromium 계열 156 빌드)에서 `https://example.com` 으로 직접 호출했다. 세 메서드와 `getClientCapabilities` 가 모두 존재했고 `signal*` 능력 값이 true 였다. 올바른 입력은 `undefined` 로 이행됐다.
- 잘못된 base64url 은 `TypeError`, 현재 도메인과 무관한 `rpId` 는 `SecurityError`(메시지에 `.well-known/webauthn` 조회 실패가 언급됨), 필수 멤버 누락은 `TypeError` 였다. 명세의 검증 순서와 일치한다. 이행 값이 `undefined` 뿐이라 **삭제가 일어났는지는 이 방법으로 알 수 없다**는 점도 확인한 셈이다.
- 인증기·RP 를 모형화해 명세의 인증기 동작을 옮겨 실행했다(직접 작성). 붙어 있던 인증기만 즉시 정리되고, 떨어져 있던 인증기는 다음 신호에서 정리됐다. 실수로 빈 목록을 보내면 해당 자격 증명이 숨겨졌고, 올바른 목록을 다시 보내면 되살아났다(숨김 방식 인증기 가정). BE/BS 전이별 정책 함수도 위 표대로 동작했다.

## 언제 쓰나

- 패스키 삭제·이름 변경 UI 가 있는 서비스. 특히 비밀번호 관리자에 동기화되는 패스키는 서버 삭제만으로 사본이 정리되지 않는다.
- 발견 가능한 자격 증명으로 로그인을 시작하는(`allowCredentials` 비움) 흐름. 죽은 후보가 보이는 문제가 가장 직접적으로 드러난다.
- 로그인 직후 한 번 `signalAllAcceptedCredentials` 를 부르는 것을 기본으로 두면, 떨어져 있던 인증기도 다음 접속에서 맞춰진다.

## 주의 (비용)

- **목록 누락은 위험하다.** `signalAllAcceptedCredentials` 의 목록에 유효한 id 가 빠지면 그 자격 증명은 지워지거나 숨겨진다. 명세는 인증기가 가능하면 영구 삭제보다 일정 기간 숨김을 택하라고 권고하고, 실수했다면 곧바로 올바른 목록을 보내 되살리라고 한다. 되살림은 인증기가 지원할 때만 된다. 비동기 삭제와 캐시 불일치로 목록이 낡을 수 있는 서버에서는 신호 전에 DB 를 다시 읽는다.
- **보장이 없다.** 결과 통지 없음, 인증기 재량, 미접속 인증기 누락. 서버 쪽 검증(없는 자격 증명 거절)은 그대로 필요하고, 신호는 사용자 경험 개선이지 보안 통제가 아니다.
- **미인증 상태에서 전체 목록을 보내지 않는다.** 위 개인정보 규칙을 어기면 `allowCredentials` 노출과 같은 유출을 직접 만든다.
- 브라우저·OS 별 지원 시점과 인증기(비밀번호 관리자) 별 반영 방식은 다르다. 지원 현황은 이 노트가 확인하지 못했고, 기능 감지로 분기한다.
- 신호는 기기 쪽 사본을 정리할 뿐 **계정 복구 정책을 대신하지 않는다.** 마지막 패스키를 지울 때의 복구 경로는 별도 설계가 필요하다([소셜 로그인 연결·삭제](/develop-wiki/knowledge/mobile-dev/social-login-account-linking-deletion/) 참고).

> 출처 확인 범위: W3C WebAuthn Level 3(Recommendation, 2026-08-25) 본문에서 5.1.10(세 signal 메서드·비동기 RP ID 검증·인증기 동작·예시), 5.8.7(ClientCapability), 6.1.3(BE/BS), 14.6.3(자격 증명 id 개인정보)을 직접 읽었다. Android 문서는 이전 노트 작성 때 읽은 범위를 따랐다. 브라우저 동작은 이 환경의 브라우저 한 종류에서 직접 호출한 결과이며 실제 인증기에서의 삭제·숨김은 검증하지 못했다. 미확인: Safari·Firefox·각 비밀번호 관리자의 지원·반영 방식, CTAP 의 `authenticatorCredentialManagement` 세부, 명세 14.6.2(사용자 이름 열거)와 관련 출처 요청 절의 본문.
