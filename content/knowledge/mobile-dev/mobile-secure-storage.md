---
title: 모바일 보안 저장소 (Keychain·Android Keystore·Secure Enclave)
aka: [Keychain, Android Keystore, Secure Enclave, StrongBox, Secure Storage, 생체 인증 키]
category: mobile-dev
group: platform
level: intermediate
summary: 토큰·키 같은 비밀을 앱 파일이 아니라 OS 가 관리하는 키 저장소에 두고, 접근 조건(잠금 상태·사용자 인증)을 키에 붙이는 방법.
tags: [mobile, security, keychain, keystore, secure-enclave, strongbox, biometric]
related: [security/secrets-management, security/session-vs-jwt, security/password-storage, mobile-dev/permissions-privacy, mobile-dev/background-work-constraints, mobile-dev/mobile-networking]
sources:
  - https://developer.android.com/privacy-and-security/keystore
  - https://developer.apple.com/documentation/security/restricting-keychain-item-accessibility
  - https://developer.apple.com/documentation/security/protecting-keys-with-the-secure-enclave
  - https://developer.android.com/topic/security/best-practices
  - https://mas.owasp.org/MASVS/
updatedAt: 2026-11-19
---

## 문제

로그인 토큰, 암호화 키, 사용자 비밀을 SharedPreferences·UserDefaults·일반 파일에 평문으로 두면 백업 추출, 루팅·탈옥 기기, 앱 취약점으로 쉽게 읽힌다. 또한 **앱에 넣은 API 키·시크릿은 비밀이 아니다**. 앱 바이너리는 사용자 손에 있다.

## 해법

### 두 층으로 나눠 생각한다

1. **작은 비밀(토큰, 비밀번호)을 어디에 두는가**: iOS 는 Keychain, Android 는 암호화한 뒤 그 키를 Keystore 에 둔다.
2. **그 비밀을 풀 수 있는 키가 어디서 쓰이는가**: 키 자체를 앱 프로세스 밖(보안 하드웨어)에 둔다.

### iOS: Keychain 과 접근 가능 조건

Keychain 은 작은 데이터를 암호화된 DB 에 저장한다. 항목마다 `kSecAttrAccessible` 로 **기기 상태에 따른 접근 조건**을 정한다. 공식 문서가 제한이 센 순으로 설명하는 값은 다음과 같다.

| 조건 | 의미 |
| --- | --- |
| `WhenPasscodeSetThisDeviceOnly` | 암호가 설정된 기기에서만 저장 가능, 잠금 해제 중에만 접근. 암호를 지우면 항목도 삭제됨 |
| `WhenUnlocked` | 잠금 해제 중에만 접근. 기본값 |
| `AfterFirstUnlock` | 재부팅 후 첫 잠금 해제부터 다음 재부팅까지 접근. 백그라운드 작업에 필요할 때 |
| `Always` | 항상 접근. 문서가 권장하지 않음 |

- 이름이 `ThisDeviceOnly` 로 끝나면 다른 기기로 백업 복원할 때 이전되지 않는다.
- 원칙은 "앱이 허용하는 가장 제한적인 값"이다. 백그라운드 동기화가 토큰을 읽어야 하면 `AfterFirstUnlock` 이 필요하다. [백그라운드 작업 제약](/develop-wiki/knowledge/mobile-dev/background-work-constraints/) 참고.
- 은행 앱처럼 "쓰는 순간 본인 확인"이 필요하면 `SecAccessControl` 로 사용자 존재(생체·암호) 요구를 항목에 붙인다.

### Secure Enclave (iOS)

개인 키를 Secure Enclave 에 만들면 앱은 평문 키를 보지 못하고 서명 등 연산 결과만 받는다. 공식 문서의 제약:

- 지원 하드웨어가 필요하다(A7 이후 iOS 기기 등).
- NIST P-256 타원곡선 키만 가능하고 서명·검증·ECDH 용이다.
- 기존 키를 넣을 수 없다. 반드시 Enclave 안에서 생성해야 한다.

### Android: Keystore

- 키 소재가 **앱 프로세스에 들어오지 않는다.** 앱은 연산을 시스템 프로세스에 맡긴다. 앱이 뚫려도 키를 쓸 수는 있어도 꺼내 가지는 못한다.
- 키를 TEE 나 보안 요소(SE) 같은 보안 하드웨어에 묶을 수 있다. 하드웨어 지원은 알고리즘·모드 조합에 따라 다르므로 `KeyInfo` 로 확인한다.
- StrongBox 는 별도 CPU·보안 저장소를 갖춘 더 강한 격리 구현(Android 9+). 문서는 더 느리고 자원이 제한적이며 지원 알고리즘이 적어 **대부분 앱에는 필요 없다**고 안내한다. 쓰려면 지원 여부를 확인하고 실패 시 일반 키로 폴백한다.
- 키 사용 조건을 생성 시점에 못 박는다(용도, 사용자 인증 필요, 시간 범위). 생성 후에는 바꿀 수 없다.
- 사용자 인증 필요 키는 일정 시간 인증 유효 또는 **연산마다 BiometricPrompt 인증** 방식을 고른다. 생체 전용 키는 기본적으로 새 생체 정보가 등록되면 무효화된다.

```kotlin
// Keystore 에 AES 키 생성, 연산마다 사용자 인증 요구(개념 예시)
val spec = KeyGenParameterSpec.Builder("token_key",
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
    .setUserAuthenticationRequired(true)
    .build()
// 토큰은 이 키로 암호화한 암호문만 파일에 저장
```

### 점검 기준으로 MASVS

OWASP MASVS 는 모바일 보안을 STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE, PRIVACY 그룹으로 나눈다. 저장소 설계는 STORAGE·CRYPTO·AUTH 항목으로 점검한다.

## 언제 쓰나

- 액세스·리프레시 토큰, 로컬 DB 암호화 키, 결제·인증에 쓰는 서명 키.

## 주의·비용

- 사용자 인증을 키에 묶으면 **생체 정보 변경·기기 잠금 해제 방식 변경으로 키가 무효화**될 수 있다. 복구 경로(재로그인)를 설계에 넣는다.
- Keystore 연산은 느릴 수 있어 메인 스레드에서 하지 않는다(공식 권고).
- 하드웨어 보호는 "키 추출 방지"이지 "탈취된 앱 프로세스의 키 사용 방지"가 아니다. 사용 조건(사용자 인증)까지 걸어야 후자가 줄어든다.
- 시계 기반 키 유효 기간은 보안 하드웨어가 신뢰할 시계가 없어 보통 하드웨어가 강제하지 않는다(Android 공식 문서).
- 루팅·탈옥 탐지와 난독화는 MASVS-RESILIENCE 영역의 보조 수단이지 저장소 보호의 대체가 아니다.
- 서버 비밀과 클라이언트 비밀을 구분한다. [시크릿 관리](/develop-wiki/knowledge/security/secrets-management/), [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/) 참고.
