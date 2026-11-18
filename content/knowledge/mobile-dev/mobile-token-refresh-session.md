---
title: 모바일 토큰 갱신과 인증 세션 설계
aka: [Token Refresh, Refresh Token Rotation, Single-flight Refresh, Mobile Session, 401 Interceptor]
category: mobile-dev
group: platform
level: intermediate
summary: 짧은 액세스 토큰과 오래 사는 리프레시 토큰을 앱에서 안전하게 보관·갱신하고, 동시 요청·네트워크 실패·로그아웃을 일관되게 처리하는 세션 설계.
tags: [mobile, auth, oauth2, refresh-token, rotation, session, interceptor]
related: [security/oauth2-oidc-pkce, security/session-vs-jwt, security/dpop, security/jwt-key-rotation, mobile-dev/mobile-secure-storage, mobile-dev/mobile-networking, mobile-dev/background-work-constraints, mobile-dev/navigation-deep-links]
sources:
  - https://www.rfc-editor.org/rfc/rfc9700
  - https://www.rfc-editor.org/rfc/rfc8252
  - https://mas.owasp.org/MASVS/
updatedAt: 2026-11-19
---

## 문제

- 모바일 앱은 공개 클라이언트다. 앱에 비밀을 넣어도 비밀이 아니므로(RFC 8252 8.5절), 로그인 후 받은 토큰이 사실상 유일한 자격 증명이다.
- 사용자는 몇 주~몇 달 재로그인 없이 쓰길 기대한다. 그래서 오래 사는 리프레시 토큰이 필요하고, 그만큼 탈취 피해가 크다.
- 화면 여러 개가 동시에 API 를 부르다 만료를 만나면 갱신 요청이 중복 발사된다. 회전(rotation) 방식 서버에서는 이 중복이 "토큰 재사용"으로 보여 세션이 끊길 수 있다.

## 해법

### 토큰 역할 분리

| 토큰 | 수명 | 보관 | 용도 |
| --- | --- | --- | --- |
| 액세스 토큰 | 짧게 | 메모리 우선(필요 시 보안 저장소) | API 호출 |
| 리프레시 토큰 | 길게, 비활동 시 만료 | OS 보안 저장소 | 새 액세스 토큰 발급 |

- 리프레시 토큰은 Keychain·Keystore 같은 보안 저장소에만 둔다. [모바일 보안 저장소](/develop-wiki/knowledge/mobile-dev/mobile-secure-storage/) 참고.
- RFC 9700 은 공개 클라이언트의 리프레시 토큰을 **발신자 제약(mTLS, DPoP)** 또는 **회전** 중 하나로 보호하라고 요구한다. 회전은 갱신마다 새 리프레시 토큰을 주고 이전 것을 무효화하며, 이전 토큰이 다시 쓰이면 탈취로 간주해 활성 토큰을 폐기한다(서버는 누가 공격자인지 모르므로 사용자는 재인증). 발신자 제약은 [DPoP](/develop-wiki/knowledge/security/dpop/) 참고.
- 서버는 비밀번호 변경·서버 측 로그아웃 같은 보안 이벤트 뒤 리프레시 토큰을 폐기할 수 있다(RFC 9700 4.14절). 앱은 언제든 "세션 종료"를 받을 수 있다고 가정한다.

### 갱신은 한 번에 하나만 (single-flight)

```ts
let inflight: Promise<Tokens> | null = null;

async function getValidToken(): Promise<string> {
  const t = await store.read();                 // 보안 저장소/메모리
  if (t && t.expiresAt - Date.now() > 30_000) return t.access;
  inflight ??= refresh(t?.refresh).finally(() => { inflight = null; });
  return (await inflight).access;               // 동시 호출은 같은 Promise 를 기다림
}

async function refresh(rt?: string): Promise<Tokens> {
  if (!rt) throw new SessionExpired();
  const res = await api.token({ grant: 'refresh_token', refresh: rt });
  if (res.kind === 'rejected') { await store.clear(); throw new SessionExpired(); }
  await store.write(res.tokens);                // 새 리프레시 토큰을 먼저 저장
  return res.tokens;
}
```

- 새 리프레시 토큰을 **저장하기 전에 앱이 죽으면** 옛 토큰은 이미 무효다. 저장 순서·원자성에 신경 쓰고, 서버가 짧은 유예(grace) 창을 두는지 확인한다(서버 구현에 따라 다르며 RFC 는 규정하지 않는다).
- 프로세스가 둘이면(앱 + 확장 프로그램·위젯, Android 다중 프로세스) 메모리 락만으로 부족하다. 갱신 주체를 하나로 정하거나 공유 저장소 락을 쓴다.

### 실패를 구분한다

- **서버가 토큰을 거부**(만료·폐기·재사용 탐지): 저장된 토큰을 지우고 로그인 화면으로. 돌아올 화면은 보류 목적지로 저장([딥링크](/develop-wiki/knowledge/mobile-dev/navigation-deep-links/)).
- **네트워크 오류·5xx·타임아웃**: 로그아웃하면 안 된다. 토큰은 유지하고 재시도한다. 오프라인에서 세션을 잃는 것이 가장 흔한 사용성 버그다.
- 401 재시도는 요청당 1회로 제한해 무한 루프를 막는다.

### 로그아웃·기기 분실

- 로그아웃은 로컬 삭제만이 아니라 서버 폐기 호출까지 한다. 호출이 실패해도 로컬은 지운다.
- 로그인한 기기 목록과 원격 폐기를 서버에서 제공하면 분실 대응이 된다.

## 언제 쓰나

- 앱이 자체 또는 외부 IdP 와 OAuth 2 / OIDC 로 로그인하는 모든 경우. 흐름 선택은 [OAuth2·OIDC·PKCE](/develop-wiki/knowledge/security/oauth2-oidc-pkce/), 세션 방식 비교는 [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/).

## 주의·비용

- 회전 + 재사용 탐지는 중복 갱신·응답 유실에 취약하다. 앱의 single-flight 와 서버의 정책이 함께 맞아야 한다.
- 액세스 토큰이 JWT 이면 폐기 전까지 유효하다. 짧은 수명이 폐기 지연의 상한이다. 키 관리는 [JWT 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).
- 백그라운드에서 갱신하려면 보안 저장소 접근 조건(예: 첫 잠금 해제 후 접근)이 필요하다. 조건이 느슨할수록 보호도 약해진다. [백그라운드 작업 제약](/develop-wiki/knowledge/mobile-dev/background-work-constraints/) 참고.
- 생체 인증을 키에 묶으면 생체 정보 변경 시 키가 무효화돼 재로그인 경로가 필수다.
- 기기에 저장된 토큰은 루팅·탈옥 기기나 악성 앱 앞에서 완전하지 않다. 위협 범위는 [모바일 위협 모델](/develop-wiki/knowledge/mobile-dev/mobile-threat-model-masvs/) 참고.
