---
title: 소셜 로그인 계정 연결·해제·탈퇴 설계
aka: [Account Linking, Account Deletion, Sign in with Apple Token Revocation, Provider Unlinking, 계정 병합, 회원 탈퇴]
category: mobile-dev
group: platform
level: intermediate
summary: 한 사용자가 여러 로그인 수단을 쓸 때 내부 계정 하나에 연결하는 모델과, 앱 안에서 시작하는 탈퇴가 서버 데이터 삭제·Apple 토큰 폐기·구독 안내까지 이어지도록 하는 절차.
tags: [mobile, login, account-deletion, sign-in-with-apple, account-linking, privacy, store-policy]
related: [mobile-dev/native-oauth-login-ux, mobile-dev/store-review-policy, mobile-dev/mobile-token-refresh-session, mobile-dev/in-app-purchase-subscription-design, mobile-dev/permissions-privacy, security/token-revocation-introspection, security/oauth2-oidc-pkce]
sources:
  - https://developer.apple.com/support/offering-account-deletion-in-your-app/
  - https://developer.apple.com/app-store/review/guidelines/
  - https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple
  - https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
  - https://support.google.com/googleplay/android-developer/answer/13327111
  - https://firebase.google.com/docs/auth/ios/account-linking
updatedAt: 2026-11-19
---

로그인 화면을 어떻게 띄우는지는 [네이티브 OAuth 로그인 UX](/develop-wiki/knowledge/mobile-dev/native-oauth-login-ux/)에 있다. 이 노트는 **로그인 이후의 계정 수명주기**, 곧 연결·해제·탈퇴만 다룬다.

## 문제

- 사용자는 Apple 로 가입하고 나중에 Google 로 로그인해 "계정이 두 개"가 된다. 이메일이 같아도 다른 사람일 수 있어서 자동으로 합치면 계정 탈취 경로가 된다.
- 스토어는 앱이 계정 생성을 지원하면 **앱 안에서 삭제를 시작**할 수 있어야 한다고 요구한다. 삭제 버튼이 서버 행 하나만 지우면, 소셜 제공자 쪽 연결은 남는다.
- Sign in with Apple 은 토큰을 폐기하지 않으면 다음 로그인 때 이름·이메일 동의 화면이 다시 나오지 않는다. 사용자에게는 "탈퇴했는데 흔적이 남은" 앱으로 보인다.

## 해법

### 1. 내부 계정 + 연결된 신원(identity) 모델

내부 사용자 ID 하나에 로그인 수단을 N 개 붙이는 구조로 둔다. 제공자가 준 ID(`sub`)가 키이고 이메일은 속성일 뿐이다.

```ts
interface User { id: string; createdAt: Date; }
interface LinkedIdentity {
  userId: string;
  provider: 'apple' | 'google' | 'kakao' | 'password';
  subject: string;          // 제공자의 안정적 사용자 ID. unique(provider, subject)
  email?: string;           // 참고용. 병합 판단 근거로 쓰지 않는다
  appleRefreshToken?: string; // 탈퇴 때 폐기에 필요. 암호화해 보관
}

async function link(me: User, cred: VerifiedCredential, store: IdentityStore) {
  const owner = await store.findBy(cred.provider, cred.subject);
  if (owner && owner.userId !== me.id) throw new IdentityInUse(); // 합치지 말고 사용자에게 선택을 넘긴다
  await store.insert({ userId: me.id, provider: cred.provider, subject: cred.subject, email: cred.email });
}
async function unlink(me: User, provider: string, store: IdentityStore) {
  if ((await store.listFor(me.id)).length <= 1) throw new LastIdentity(); // 마지막 수단은 해제 금지
  await store.remove(me.id, provider);
}
```

- **로그인한 상태에서만 연결**한다. Firebase 문서도 같은 모델이다. 이미 로그인한 사용자가 다른 제공자의 자격 증명을 얻어 현재 사용자에 붙인다.
- 그 자격 증명이 **이미 다른 계정에 속해 있으면 실패**하고, 병합은 앱이 규칙을 정해 직접 해야 한다고 문서가 설명한다(병합 함수는 제공되지 않는다).
- 해제한 제공자로 다시 로그인하면 Firebase 는 새 계정을 만든다. 직접 만든 시스템도 "해제 후 재로그인 = 신규 가입"이 되는지 정해 둔다.
- **이메일이 같다는 이유로 자동 병합하지 않는다.** 제공자가 이메일을 검증했는지, 사용자가 기존 계정에 재인증했는지를 확인한 뒤에만 합친다. (이 규칙은 위 문서들이 규정한 것이 아니라 계정 탈취를 막으려는 설계 권고다.)
- 마지막 로그인 수단을 해제하지 못하게 막는다. 갇힌 계정이 생긴다.

### 2. 탈퇴 요건(스토어)

Apple 안내(계정 삭제 제공 가이드)를 자기 말로 정리하면 다음과 같다.

| 항목 | 요지 |
| --- | --- |
| 시작 위치 | 앱 안에서 찾기 쉬운 곳(보통 계정 설정). 비활성화만 제공하는 것은 불충분 |
| 삭제 범위 | 계정과 그에 딸린 개인정보. 법적으로 보관해야 하는 것은 예외이며 사용자에게 알림 |
| 확인 단계 | 재인증·이메일/전화 코드는 허용. 일부러 어렵게 만들면 반려 |
| 지연 처리 | 즉시 삭제가 아니어도 되지만 걸리는 시간과 완료 확인을 알려야 함 |
| 웹 필요 시 | 앱에서 삭제 페이지로 직접 연결. 일반 앱은 전화·이메일·채팅 문의를 강제할 수 없음 |
| 구독 | 구독 만료일 삭제 예약은 허용하되 즉시 삭제도 가능해야 함. 청구는 Apple 이 계속하므로 해지 안내 필요 |
| 게스트 | 자동 생성 계정도 삭제 가능해야 함 |
| 지역 | GDPR·CCPA 대상이 아니어도 모두에게 제공 |

Google Play 는 계정 생성을 지원하는 앱이면 앱 안 삭제 경로와 함께, Play Console 의 데이터 안전 양식에 **웹 삭제 링크**를 요구한다. 서비스 제공자(결제·분석)에 둔 데이터도 삭제를 요청해야 한다.

### 3. 탈퇴 처리 순서

```ts
async function deleteAccount(user: User, deps: Deps) {
  await deps.reauthenticate(user);                       // 재인증(허용되는 확인 단계)
  const ids = await deps.identities.listFor(user.id);
  const apple = ids.find(i => i.provider === 'apple');
  if (apple?.appleRefreshToken) await revokeAppleToken(apple.appleRefreshToken); // 1) 제공자 쪽 먼저
  await deps.sessions.revokeAll(user.id);                // 2) 우리 세션·리프레시 토큰
  await deps.pushTokens.deleteFor(user.id);              // 3) 푸시 토큰
  await deps.data.eraseOrAnonymize(user.id);             // 4) 개인정보 삭제, 법적 보관분은 분리
  await deps.audit.record('account_deleted', { userId: user.id, at: new Date() }); // ID 외 개인정보 없이
}
```

Apple 쪽은 이렇게 동작한다(TN3194, Revoke tokens 문서).

- 폐기는 `POST https://appleid.apple.com/auth/revoke` 에 `client_id`, `client_secret`, `token`, `token_type_hint` 를 폼으로 보낸다. TN3194 는 이것이 사용자 조작 없이 토큰을 프로그램으로 무효화하는 유일한 방법이라고 설명한다.
- 이를 위해 **가입 때 인가 코드를 서버로 보내 `/auth/token` 으로 검증하고 리프레시 토큰을 저장**해 둬야 한다. 토큰이 없는데 탈퇴를 요청받았다면, 데이터를 지우고 사용자에게 Apple 설정에서 직접 연결 해제를 안내하며, 클라이언트는 폐기 알림을 받으면 로그아웃 상태로 되돌린다(TN3194의 수동 절차).
- 성공하면 200 과 빈 본문이다. 이미 폐기된 토큰에도 200 이다.
- 사용자가 Apple 설정에서 직접 연결을 끊은 경우 앱은 자격 증명 폐기 알림(`credentialRevokedNotification`)이나, 웹 서비스라면 서버 간 알림의 `consent-revoked` 로 알게 된다. 이때도 같은 삭제 절차를 돌린다.
- 한국 개발자는 새 Services ID 등록 시 서버 간 알림 엔드포인트를 제공해야 한다고 Apple 안내에 적혀 있다.

### 4. UX

- 삭제 화면에 **무엇이 지워지고 무엇이 남는지, 얼마나 걸리는지**를 적는다. 구독이 있으면 "구독은 스토어에서 별도로 해지해야 한다"를 먼저 보여 준다. [인앱 결제 설계](/develop-wiki/knowledge/mobile-dev/in-app-purchase-subscription-design/) 참고.
- 복구 유예 기간(예: 30일)은 직접 정하는 정책이다. 다만 Apple 안내는 구독 만료일로 삭제를 예약하는 방식을 허용하는 조건으로 즉시 삭제 선택지를 함께 줄 것을 요구하므로, 유예를 두더라도 즉시 삭제 선택지를 같이 둔다.
- Apple 지침 5.1.1 은 소셜 네트워크 연결을 앱 안에서 해제할 수단을 요구한다. 같은 절에는 소셜 네트워크 자격 증명·토큰을 기기 밖에 저장하지 말라는 조항도 있다. 한편 TN3194 는 Sign in with Apple 의 토큰을 서버에 보관해 폐기에 쓰라고 안내한다. 두 문서가 겹치는 범위(소셜 API 호출용 토큰인지, 로그인 검증·폐기용 토큰인지)는 이 노트에서 확정하지 못했으니, 심사 전에 앱의 토큰 용도를 구분해 점검한다.

## 언제 쓰나

- 둘 이상의 로그인 수단을 지원하거나, 지원할 계획이 있는 앱.
- 계정을 만드는 모든 앱. 스토어 요건이라 선택이 아니다.

## 주의·비용

- **자동 병합은 탈취 경로**다. 이메일 일치만으로 합치지 않는다. 다만 매번 재인증을 강제하면 가입 전환율이 떨어지므로, 위험도에 따라 단계를 나눈다.
- Apple 의 비공개 릴레이 이메일은 사용자가 바꾸거나 끌 수 있어 이메일을 키로 쓸 수 없다. `sub` 를 키로 쓴다.
- 폐기용 리프레시 토큰은 민감 정보다. 서버에서 암호화해 보관하고, 탈퇴 때 함께 삭제한다. TN3194 는 이 리프레시 토큰을 최대 하루 한 번 Apple 서버에 검증하라고 안내한다.
- 법적 보관 의무(결제 기록 등)와 삭제 요구가 충돌한다. 지울 수 없는 데이터는 분리·최소화하고 처리방침에 명시한다. 보관 기간은 지역법을 따르며 이 노트는 법률 자문이 아니다.
- 폐기 API 는 입력이 틀려도 200 이 돌아온다는 개발자 보고가 포럼에 있다(비공식, 확인 못 함). 성공 응답만 믿지 말고 폐기 후 자격 증명 상태를 테스트 계정으로 점검한다.
- 데이터 백업·분석 웨어하우스·로그에 남은 개인정보까지 지워야 "삭제"가 완성된다. 삭제 대상 목록을 데이터 저장소 단위로 관리한다.

> 출처 확인 범위: Apple 의 계정 삭제 안내, 심사 지침(4.8·5.1.1 발췌, 페이지 앞 100,000자까지), TN3194, Revoke tokens 문서, Google Play 계정 삭제 정책 페이지, Firebase 계정 연결 문서(iOS)를 읽었다. 미확인: Apple 지침 전문 중 뒤쪽 14,000자, Android Credential Manager 의 계정 연결 가이드, Google·카카오 등 제3자 제공자별 연결 해제 API, 한국 개인정보보호법 세부. "이메일 자동 병합 금지", "마지막 수단 해제 금지", "복구 유예 기간" 은 위 문서가 아니라 설계 권고다.
