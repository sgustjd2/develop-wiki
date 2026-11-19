---
title: Android Credential Manager 와 패스키 이전 (Restore Credentials·Credential Exchange)
aka: [Android Credential Manager, Restore Credentials, Restore Key, Passkey Migration, Credential Exchange Format, CXF, CXP, Signal API, 패스키 이전, 기기 변경 자동 로그인]
category: mobile-dev
group: platform
level: advanced
summary: 새 기기·새 비밀번호 관리자로 옮길 때 로그인이 이어지는 세 경로(제공자 동기화, Restore Credentials, 제공자 간 자격 증명 교환)와 앱·서버가 각 경로에서 맡는 일을 구분한다.
tags: [mobile, android, credential-manager, passkey, restore-credentials, webauthn, fido, cxf, device-migration]
related: [security/mfa-passkeys, mobile-dev/native-oauth-login-ux, mobile-dev/social-login-account-linking-deletion, mobile-dev/mobile-token-refresh-session, mobile-dev/mobile-secure-storage, mobile-dev/deep-link-security, security/oauth2-oidc-pkce]
sources:
  - https://developer.android.com/identity/sign-in/credential-manager
  - https://developer.android.com/identity/credential-manager/prerequisites
  - https://developer.android.com/identity/passkeys
  - https://developer.android.com/identity/passkeys/create-passkeys
  - https://developer.android.com/identity/passkeys/manage-passkeys
  - https://developer.android.com/identity/sign-in/restore-credentials
  - https://developer.android.com/identity/sign-in/restore-credentials-implementation
  - https://developer.android.com/identity/credential-manager/signal-api-rp
  - https://fidoalliance.org/specs/cx/cxf-v1.0-ps-20250814.html
  - https://fidoalliance.org/specs/cx/cxp-v1.0-wd-20241003.html
  - https://developer.apple.com/documentation/authenticationservices/ascredentialexportmanager
updatedAt: 2026-11-19
---

패스키가 무엇이고 서버가 무엇을 검증하는지는 [MFA와 패스키](/develop-wiki/knowledge/security/mfa-passkeys/)에 있다. 이 노트는 **Android 앱에서 Credential Manager 로 패스키를 다루는 방식**과, 기기·제공자가 바뀔 때 로그인이 이어지게 하는 세 경로를 구분한다.

## 문제

"새 폰에서도 로그인이 된다"는 한 문장 뒤에 서로 다른 메커니즘이 셋 있고, 각자 주체와 한계가 다르다.

- 패스키를 비밀번호 관리자(예: Google Password Manager)가 **자기 계정으로 동기화**해 주는 경우. 앱은 동기화를 제어하지 못한다.
- 앱이 **복원용 키(restore key)** 를 따로 만들어 두고, 새 기기 설정 중 조용히 로그인하는 경우. 앱과 서버가 설계해야 한다.
- 사용자가 비밀번호 관리자를 **다른 제품으로 갈아타며** 자격 증명을 내보내는 경우. 표준(FIDO CXF/CXP)이 진행 중이다.
- 셋을 섞어 생각하면 "패스키를 만들었으니 기기 변경은 해결"이라는 가정이나, 복원 키를 일반 패스키처럼 사용자 화면에 노출하는 실수가 난다.

## 해법

### 1. Credential Manager 는 입구를 하나로 합친다

공식 문서가 설명하는 Credential Manager 는 패스키, 비밀번호, 연합 로그인(Google 로 로그인 등), 디지털 자격 증명을 같은 시스템 UI(바텀 시트)로 처리하는 Jetpack API 다. 앱(Relying Party 클라이언트), 앱 서버(Relying Party 서버), 자격 증명 제공자(Credential Provider) 세 역할이 있다.

- 패스키 구현은 Android 9(API 28) 이상에서 동작한다고 문서가 밝힌다.
- 웹과 앱이 같은 패스키를 쓰려면 도메인에 Digital Asset Links(`assetlinks.json`)를 올리고 `delegate_permission/common.get_login_creds` 관계를 선언한다.
- 생성 요청의 `excludeCredentials` 는 같은 제공자에 중복 패스키가 생기는 것을 막고, `isConditional = true` 는 비밀번호 로그인 직후 UI 없이 패스키를 자동 생성한다(알림은 제공자 책임).
- `preferImmediatelyAvailableCredentials = true` 는 즉시 쓸 수 있는 자격 증명이 없으면 UI 없이 실패시켜, 앱 첫 실행 같은 기회적 호출에 쓴다.

### 2. 경로 A: 제공자 동기화 (앱이 제어하지 못함)

앱·서버가 할 일은 동기화를 "일으키는" 것이 아니라 **동기화돼도 문제가 없게** 만드는 것이다.

- 사용자가 패스키를 **여러 개**(제공자별로) 등록할 수 있게 하고, 서버 DB 도 사용자당 여러 자격 증명을 저장한다. 한 제공자가 접근 불가가 돼도 잠기지 않게 하려는 권고다.
- 설정 화면에는 제공자 이름·생성일·마지막 사용일·동기화 지원 여부를 보여 준다. 제공자 식별에 쓰는 AAGUID 는 **서명된 증명(attestation)이 없으면 조작될 수 있으니 표시용으로만** 쓰라고 문서가 경고한다.
- 마지막 패스키를 지울 때는 대체 로그인 수단을 먼저 안내한다.
- 서버에서 자격 증명을 삭제하거나 사용자 이름이 바뀌면 제공자 쪽에 남은 정보와 어긋난다. **Signal API**(`SignalUnknownCredentialRequest`, `SignalAllAcceptedCredentialIdsRequest`, `SignalCurrentUserDetailsRequest`)가 이를 알린다. 문서 기준 Android 15 이상, `androidx.credentials` 1.6.0-beta03 이상이다.
- 제공자가 서버 쪽 관리 경로를 알 수 있게 `/.well-known/passkey-endpoints` 를 노출하라는 권고도 있다.

### 3. 경로 B: Restore Credentials (앱·서버가 설계)

새 기기 설정 중 앱이 열리기 전에도 로그인을 되살리는 기능이다. 원리는 **패스키와 같은 WebAuthn 서버를 쓰되, 사용자에게 보이지 않는 별도 키쌍**을 쓰는 것이다.

흐름은 세 단계다.

1. **이전 기기**: 로그인 직후(그리고 이미 로그인된 상태의 다음 실행)에 서버에서 등록 옵션을 받아 `CreateRestoreCredentialRequest` 로 키를 만든다. 키는 Android 백업 서비스를 타고 기기에 저장되며, 조건(Google 계정, 데이터 백업 켜짐, 화면 잠금)을 만족하면 종단간 암호화로 클라우드에도 올라간다. 조건이 안 되면 `E2eeUnavailableException` 이 나므로 `isCloudBackupEnabled = false` 로 다시 만들어 기기 간 전송(D2D)만이라도 되게 한다.
2. **새 기기**: 이 사용자가 누구인지 모르므로 챌린지 엔드포인트는 **비인증**이어야 하고, `allowCredentials` 는 비운다. `GetRestoreCredentialOption` 으로 받은 응답의 `userHandle` 로 서버가 사용자를 찾는다. 다른 `CredentialOption` 과 한 요청에 섞으면 `IllegalArgumentException` 이다.
3. **로그아웃·세션 무효화**: 기본 `ClearCredentialStateRequest()` 는 복원 키를 지우지 않는다. `TYPE_CLEAR_RESTORE_CREDENTIAL` 요청으로 따로 지우고(문서의 "이중 정리"), 로컬 동기화 플래그도 지운다.

문서가 짚는 구현 포인트는 이렇다.

- 사용자 화면 없이 조용히 실행되므로 UV(사용자 검증)가 못 일어난다. 서버 검증기가 **복원 키에 한해 `uv = false` 를 받아들여야** 한다.
- 복원 키는 DB 에서 일반 패스키와 **구분 표시**해 설정 화면에 안 나오게 한다.
- 사용자가 폰·태블릿 등 기기를 여럿 쓰므로 **사용자당 여러 복원 키**를 허용한다. 앱 삭제는 서버에 알려지지 않으니 비활동 TTL 이나 개수 상한으로 정리한다.
- 2단 복원: 백업을 켠 앱은 `BackupAgent.onRestoreFinished()` 에서 조용히 로그인하고(푸시 토큰도 다시 등록), 그렇지 않거나 오프라인이었으면 첫 실행 `Activity.onCreate()` 에서 한 번 더 시도한다. 푸시 알림은 복원되지 않으므로 새 FCM 토큰을 직접 서버에 등록한다고 문서가 강조한다.
- "이미 만들었다"는 로컬 플래그가 Auto Backup 에 실려 새 기기로 복사되면 새 기기가 자기 키를 안 만든다. `data_extraction_rules` 로 제외한다.
- 한계: 앱당 계정 하나, 폼팩터를 넘는 복원(폰→Wear OS 등) 불가, Android 9+ 와 Google Play 서비스 `242200000` 이상(`androidx.credentials` 1.5.0 이상).

서버 쪽 정책을 직접 작성해 실행해 보았다(서명 검증은 제외하고 정책만).

```ts
// 어서션 서명·챌린지 검증 뒤에 적용하는 정책
accept(id: string, uv: boolean, now: number) {
  const c = this.creds.get(id);
  if (!c || c.revoked) return { ok: false, why: 'unknown' };
  if (c.kind === 'passkey' && !uv) return { ok: false, why: 'uv-required' }; // 일반 패스키는 UV 필수
  c.lastUsed = now;                                                         // 복원 키(kind='restore')는 uv=false 허용
  return { ok: true, userId: c.userId };
}
```

단언(assert) 5개를 돌린 결과: 패스키+`uv=false` 거절, 복원 키+`uv=false` 허용, 설정 화면용 조회에 복원 키 미포함, 기기별 복원 키 2개 공존, TTL 정리 후 오래된 키만 삭제. 이것은 정책 모형이지 Credential Manager 의 동작 검증이 아니다.

### 4. 경로 C: 제공자 간 이전 (표준 진행 중)

다른 비밀번호 관리자로 옮길 때 지금까지는 CSV 같은 비정형 내보내기가 흔했다. FIDO Alliance 의 Credential Exchange 가 이를 표준화한다.

- **CXF(Credential Exchange Format)**: 내보낼 자격 증명의 데이터 구조(패스키, 비밀번호 등)를 정한다. 확인한 목록에서 v1.0 이 **Proposed Standard(2025-08-14)** 이며 2026-03-09 정오표가 있다.
- **CXP(Credential Exchange Protocol)**: 전송 프로토콜이다. 가져오는 쪽이 챌린지·암호화 방식(HPKE 등)을 담은 내보내기 요청을 만들고, 사용자 승인을 받은 내보내는 쪽이 암호화한 CXF 데이터를 응답으로 보낸다. 내가 확인한 FIDO 디렉터리에는 **2024-10-03 Working Draft** 까지만 있고, 그 문서는 구현의 근거로 삼지 말라고 스스로 밝힌다.
- Apple 은 iOS 26 등에서 `ASCredentialExportManager`·`ASCredentialImportManager` 로 이 교환을 지원하며, 제공자 확장이 `SupportsCredentialExchange` 와 지원 버전(현재 `1.0`)을 선언한다.
- Android 쪽 가져오기·내보내기 API 는 위 Credential Manager·패스키 문서에서 **찾지 못했다**(없다는 뜻이 아니라 이 조사에서 확인 못 했다는 뜻).
- 일반 앱 개발자가 직접 구현할 대상이 아니라 **제공자(비밀번호 관리자) 쪽 기능**이다. 앱은 사용자가 패스키를 다른 제공자로 옮겨도 로그인이 되게(서버가 자격 증명 ID 로만 식별) 만들어 두면 된다.

## 비교

| 쟁점 | A. 제공자 동기화 | B. Restore Credentials | C. 제공자 간 교환 |
| --- | --- | --- | --- |
| 주체 | 비밀번호 관리자 | 앱 + 서버 | 두 관리자(OS 가 중개) |
| 사용자에게 보임 | 보임(패스키) | 안 보임(조용한 복원) | 보임(내보내기 승인) |
| 사용자 검증(UV) | 요구 가능 | `uv=false` | 제공자 정책 |
| 앱의 할 일 | 다중 패스키·관리 화면·Signal API | 키 생성·복원·삭제·서버 보관 정책 | 거의 없음 |
| 성숙도 | 널리 쓰임 | 공식 가이드 있음(Android 9+, GMS 조건) | CXF 제안 표준, CXP 는 초안(확인 범위) |

## 언제 쓰나

- 이미 패스키를 쓰는 앱이 **기기 교체 이탈**을 줄이고 싶을 때 경로 B 를 더한다. 서버 구현을 공유한다고 문서가 권한다.
- 패스키 도입 앱은 경로 A 때문에 "사용자당 다중 자격 증명"과 "삭제·갱신 신호"를 처음부터 설계한다.

## 주의

- 복원 키는 **UV 없이 서명하는 장기 자격 증명**이다. 기기·백업이 탈취되면 조용한 로그인 수단이 된다. 서버에서 세션 위험을 따로 평가하고(새 기기 알림, 민감 작업 재인증), 사용자 로그아웃·비밀번호 변경·서버 세션 폐기 때 반드시 삭제·폐기한다(`401` 응답을 받은 클라이언트도 삭제). 이 위험 평가 권고는 문서의 직접 문장이 아니라 작성자의 해석이다.
- 클라우드 백업 없이 만든 복원 키는 클라우드 복원에서 못 쓴다. 문서는 첫 호출을 클라우드 허용으로 하고 예외일 때만 로컬로 내리라고 한다.
- 계정을 여러 개 쓰는 앱도 한 계정만 복원된다. 업무·개인 프로필이 나뉜 기기에서는 IT 정책이 복원을 막을 수 있어 일반 로그인 폴백이 필요하다.
- CXP 는 초안 단계였으니, 구현·지원 현황은 시점별로 달라진다.

> 출처 확인 범위: Android 개발자 문서(Credential Manager 개요, 패스키 개요·생성·관리, Restore Credentials 개요·구현, Signal API)를 본문 텍스트로 읽었다. FIDO CXF v1.0 Proposed Standard 와 CXP Working Draft(2024-10-03) 본문 앞부분(소개·용어·프로토콜 개요·요청 구조)을 직접 읽었고, 명세 디렉터리 목록으로 버전 현황을 확인했다. Apple `ASCredentialExportManager` 문서는 Apple 의 문서 데이터(JSON)로 읽었다. 미확인: CXP 의 최신(2024-10 이후) 개정 존재 여부, Android 플랫폼 수준의 자격 증명 가져오기·내보내기 API, 실제 기기에서의 복원 동작(코드·정책 모형만 실행), 기기 제조사별 백업 차이.
