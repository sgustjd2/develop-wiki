---
name: SimpleWebAuthn
url: https://simplewebauthn.dev
docs: https://simplewebauthn.dev/docs/
repo: https://github.com/MasterKale/SimpleWebAuthn
stars: 2399
domain: backend
category: auth
description: 패스키(WebAuthn) 등록·인증을 구현하는 TypeScript 라이브러리. 서버의 옵션 생성·응답 검증과 브라우저 측 호출을 함께 제공해 비밀번호 없는 로그인을 만들 때 쓴다.
pricing: oss
tags: [webauthn, passkeys, fido2, typescript, passwordless]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
WebAuthn 은 브라우저·OS 의 인증기(지문, Face ID, 보안 키, 비밀번호 관리자)가 사이트별 공개키 쌍을 만들어 서명으로 로그인하는 W3C 표준이고, 기기 간 동기화되는 WebAuthn 자격 증명을 **패스키**라 부른다. 피싱에 강하고 서버에는 공개키만 저장된다. SimpleWebAuthn 은 이 흐름의 복잡한 부분(챌린지·attestation·서명 검증, CBOR 파싱)을 감싼 라이브러리로 두 패키지로 나뉜다.
| 패키지 | 역할 |
| --- | --- |
| `@simplewebauthn/server` | 등록·인증 옵션 생성, 응답 검증 (Node 22+, Deno 2.4+) |
| `@simplewebauthn/browser` | `startRegistration`, `startAuthentication` 으로 브라우저 API 호출 |

라이선스 MIT, 2026-11 기준 최신 **14.1.0**. 다른 언어의 대응 라이브러리: py_webauthn(Python), go-webauthn(Go), webauthn-rs(Rust), WebAuthn4J·Spring Security(Java), Fido2NetLib(C#).

## 설치
```bash
npm install @simplewebauthn/server      # 서버
npm install @simplewebauthn/browser     # 프론트엔드
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| RP(Relying Party) | 내 서비스. `rpID` 는 도메인(예 `example.com`), origin 은 전체 URL |
| 챌린지 | 서버가 만든 일회용 난수. 세션에 보관했다가 응답 검증 시 비교 |
| 등록(Registration) | 옵션 생성 → 브라우저에서 키 생성 → 서버가 검증 후 공개키·ID·카운터 저장 |
| 인증(Authentication) | 옵션 생성 → 브라우저에서 서명 → 저장된 공개키로 검증, 카운터 갱신 |
| discoverable credential | `residentKey: 'required'` — 사용자 이름 입력 없이 패스키 선택 |
| 조건부 UI | 입력란 자동완성에 패스키를 띄우는 방식(`useBrowserAutofill`) |

## 기본 사용법
```ts
// 서버 (Express 등) — 세션 저장은 생략
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server'

const rpID = 'localhost'
const origin = 'http://localhost:3000'

// 1) 등록 시작
const regOptions = await generateRegistrationOptions({
  rpName: 'My App', rpID, userName: 'kim@example.com',
  authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
})
// regOptions.challenge 를 세션에 저장하고 regOptions 를 브라우저로 보낸다

// 2) 등록 검증 (body = 브라우저의 startRegistration 결과)
const { verified, registrationInfo } = await verifyRegistrationResponse({
  response: body, expectedChallenge: session.challenge, expectedOrigin: origin, expectedRPID: rpID,
})
// verified 면 registrationInfo.credential 의 id·publicKey·counter 를 사용자와 함께 저장
```
```ts
// 브라우저
import { startRegistration } from '@simplewebauthn/browser'

const options = await fetch('/webauthn/register/options').then((r) => r.json())
const attResp = await startRegistration({ optionsJSON: options })
await fetch('/webauthn/register/verify', { method: 'POST', body: JSON.stringify(attResp) })
```

## 자주 쓰는 패턴
- **로그인 검증**: `generateAuthenticationOptions({ rpID })` 로 챌린지를 만들고, `verifyAuthenticationResponse` 에 저장된 `credential: { id, publicKey, counter, transports }` 를 넘긴 뒤 반환된 새 카운터를 저장한다.
- **공개키 저장**: `publicKey` 는 `Uint8Array` 이므로 DB 에는 바이너리(bytea) 또는 base64url 로 저장한다.
- **중복 등록 방지**: 등록 옵션의 `excludeCredentials` 에 사용자의 기존 자격 증명을 넣는다.
- **여러 도메인**: `expectedOrigin`·`expectedRPID` 에 배열을 넘겨 하위 도메인·앱 origin 을 함께 허용한다.
- **복구 경로**: 패스키를 잃어버린 경우를 대비해 이메일 인증 등 대체 로그인 수단과 여러 패스키 등록을 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 직접 만든 TS 백엔드에 패스키 로그인·2단계 인증을 추가할 때, 인증 흐름의 세부를 직접 통제하고 싶을 때.
- 피할 때(대안): 사용자·세션 관리까지 포함한 완성형이 필요하면 [Better Auth](/develop-wiki/backend/auth/better-auth/) 의 passkey 플러그인, [Keycloak](/develop-wiki/backend/auth/keycloak/) 의 WebAuthn 인증 흐름, Java 는 [Spring Security](/develop-wiki/backend/auth/spring-security/) 의 `webAuthn()`.

## 공식 문서
- [문서](https://simplewebauthn.dev/docs/) · [서버 패키지](https://simplewebauthn.dev/docs/packages/server) · [브라우저 패키지](https://simplewebauthn.dev/docs/packages/browser) · [passkeys.dev](https://passkeys.dev) · [W3C WebAuthn](https://www.w3.org/TR/webauthn-3/)
