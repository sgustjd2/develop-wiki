---
title: Sign in with Apple 비공개 릴레이 이메일 설계
aka: [Apple Private Email Relay, Hide My Email, Private Relay Email, privaterelay.appleid.com, Sign in with Apple Server-to-Server Notifications, 이메일 가리기]
category: mobile-dev
group: platform
level: intermediate
summary: 사용자가 실제 이메일 대신 Apple 이 만든 중계 주소를 공유할 때 앱 서버가 지켜야 할 발송 등록(SPF·DKIM), 수신 중단 알림 처리, 이메일 식별 금지, 팀 이전 시 주소 취급을 정리한다.
tags: [mobile, ios, sign-in-with-apple, email, privacy, spf, dkim, server-notifications]
related: [mobile-dev/social-login-account-linking-deletion, mobile-dev/native-oauth-login-ux, mobile-dev/permissions-privacy, mobile-dev/store-review-policy, security/oauth2-oidc-pkce, security/token-revocation-introspection, distributed-systems/idempotency]
sources:
  - https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service
  - https://developer.apple.com/help/account/configure-app-capabilities/configure-private-email-relay-service/
  - https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts
  - https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple
  - https://developer.apple.com/documentation/signinwithapple/transferring-your-apps-and-users-to-another-team
updatedAt: 2026-11-19
---

계정 연결·탈퇴·토큰 폐기는 [소셜 로그인 계정 연결·해제·탈퇴](/develop-wiki/knowledge/mobile-dev/social-login-account-linking-deletion/)에 있다. 이 노트는 그 앞 단계, **사용자가 "이메일 가리기"를 골랐을 때 앱이 받는 주소를 다루는 방식**만 다룬다.

## 문제

- 사용자가 실제 이메일을 숨기면 앱은 Apple 이 만든 중계 주소를 받는다. 이 주소로 메일을 보내도 **발신 쪽을 등록하지 않으면 반송**된다.
- 사용자는 언제든 포워딩을 끌 수 있다. 서버가 모르고 계속 보내면 전부 거부되고, 계정 복구·결제 영수증 같은 중요한 메일이 사라진다.
- 같은 사람이 이메일 로그인으로 만든 기존 계정이 있어도 중계 주소는 그 이메일과 **일치하지 않는다**. 이메일로 계정을 찾으면 계정이 쪼개진다.
- 이름·이메일은 첫 인증 때만 앱에 전달된다. 저장에 실패하면 다시 받을 방법이 거의 없다.
- 앱을 다른 개발자 팀으로 이전하면 팀 단위로 부여된 사용자 식별자와 중계 주소가 달라진다.

## 해법

### 1. 중계 주소의 성질 (공식 문서)

- 주소는 `@private.icloud.com`, `@privaterelay.appleid.com`, `@icloud.com` 중 하나로 끝난다.
- Apple 계정의 인증된 이메일 중 하나로 전달한다.
- **같은 개발 팀의 모든 앱에서 같고, 다른 팀의 앱에서는 다르다.** 앱 설치 여부나 기기 로그인 상태와 무관하게 유효하다.
- 사용자는 설정(Apple 계정 > Sign in with Apple)에서 주소를 보고 끌 수 있다.
- 주소 하나당 **하루 100통** 한도가 있고, 개발자→사용자 메일과 사용자의 답장을 합산한다. 대량 발송 용도가 아니다.
- 답장은 중계가 변환한 주소(예: `sales_at_example_com_…@icloud.com`)로 와서, 사용자 주소를 숨긴 채 개발자 주소로 되돌려 보낸다.

### 2. 발송 쪽에서 등록할 것

개발자 계정의 "이메일 통신용 Sign in with Apple" 설정에서 다음을 한다.

1. **이메일 소스 등록**: 보내는 도메인·서브도메인 또는 개별 주소. 개인 계정은 32개, 조직은 100개까지다. 서브도메인은 별개 소스라 `example.com` 만 등록하면 `help.example.com` 은 안 된다.
2. **SPF 필수**: 봉투 발신자(MAIL FROM, Return-Path) 도메인이 등록돼 있고 SPF 를 통과하며, 등록 도메인과 **정확히 일치**해야 한다.
3. **DKIM**: 메일 서비스(ESP)가 봉투 발신자에 자기 도메인을 쓰면 DKIM 서명이 필수다. 서명의 `d=` 도메인과 `From:` 도메인이 같고 등록돼 있어야 한다. Apple 도움말은 "SPF and/or DKIM" 으로 쓰며 SPF 레코드는 필수로 요구한다.
4. 미등록 소스에서 보낸 메일은 반송된다. Apple 이 계정 관리자에게 전달 실패를 주기적으로 알린다.

DNS 예시는 ESP 마다 `include:` 가 다르다(공식 페이지가 SendGrid·SES·Mailchimp 예를 든다). 사내 결제·알림 시스템이 쓰는 모든 발신 도메인을 목록으로 만들어 등록 누락을 막는다.

### 3. 수신 중단·계정 변경은 서버 간 알림으로 받는다

엔드포인트(TLS 1.2 이상)를 등록하면 Apple 이 JWS 서명된 알림을 보낸다. 서명은 Apple 공개키로 검증한다. 이벤트 `events.type` 은 네 가지다.

| type | 의미 | 서버 동작 |
| --- | --- | --- |
| `email-disabled` | 사용자가 포워딩을 끔 | 이메일 발송 대상에서 제외(앱 내 알림·푸시로 대체) |
| `email-enabled` | 사용자가 포워딩을 다시 켬 | 발송 재개 |
| `consent-revoked` | 앱에서 Apple 계정 사용 동의 철회 | 연결 해제, 토큰 폐기, 로그인 수단 재확인 |
| `account-deleted` | Apple 계정 삭제 요청 | 해당 식별자 연결 삭제, 이메일 폐기 |

페이로드에는 사용자 식별자(`sub`)와 `event_time` 이 있고, `email-enabled`·`email-disabled` 예시에만 `email`·`is_private_email` 이 추가로 들어 있다(공식 예시). 같은 알림이 재전송되거나 순서가 뒤바뀔 수 있다는 점은 공식 문서에서 확인하지 못했으므로, 일반적인 웹훅 처리 원칙([멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/))으로 방어한다.

처리 규칙을 직접 작성해 실행했다(서명 검증은 이미 끝났다고 가정).

```ts
function apply(e: Ev) {
  if (seen.has(e.jti)) return; seen.add(e.jti);     // 재전송 무시
  const a = db.get(e.sub); if (!a) return;
  if (e.event_time < a.stamp) return;               // 역순으로 도착한 오래된 알림 무시
  a.stamp = e.event_time;
  if (e.type === 'email-disabled') a.deliverable = false;
  if (e.type === 'email-enabled') a.deliverable = true;
  if (e.type === 'consent-revoked') { a.linked = false; a.deliverable = false; }
  if (e.type === 'account-deleted') { a.deleted = true; a.linked = false; a.deliverable = false; a.email = undefined; }
}
```

중복, 역순(`event_time` 5 가 10 뒤에 도착), 철회 뒤의 오래된 `email-enabled`, 삭제 후 이메일 제거 시나리오의 단언 5 개가 통과했다. 이는 규칙 모형이며 Apple 의 실제 전송 의미(재시도·순서 보장)를 확인한 것은 아니다.

### 4. 데이터 모델과 식별

- 사용자 식별자는 토큰의 `sub`, 이메일은 **속성**으로만 둔다. 이메일로 계정을 찾거나 병합하지 않는다. 공식 문서도 기존 계정을 가진 사용자가 Apple 로 로그인하는 경우를 따로 짚어, 키체인 자격 증명 감지나 "이미 계정이 있나요?" 확인으로 풀라고 권한다.
- 이메일 행에 `isRelay`, `deliverable`, 마지막 변경 시각을 둔다. `deliverable=false` 인 주소는 발송 큐에서 거른다.
- 이름·이메일은 첫 인증에서만 오므로 응답을 받자마자 서버에 저장한다. 이후 요청에서는 이메일이 ID 토큰에는 계속 있으나 이름은 없다.
- 이메일 변경·인증 절차를 만들 때 "이메일 주소를 사용자가 소유한다"는 가정을 중계 주소에는 적용하지 않는다. 중계 주소는 스스로 만든 별칭이다.

### 5. 앱 이전(팀 변경) 때

Apple 은 수신 팀 전용 **전송 식별자**(transfer identifier)를 발급한다. 내보내는 데이터에는 팀 단위 `sub` 와 중계 주소를 **빼고** 전송 식별자만 넣는다고 문서가 요구한다. 수신 팀은 이를 자기 팀의 식별자·주소로 바꾼다. 팀마다 중계 주소가 다르다는 사실로부터, 이전 후에는 사용자의 중계 주소가 바뀌어 발송 등록도 새 팀에서 다시 해야 한다고 **추론**했다(문서에 직접 서술된 문장은 아님).

## 언제 쓰나

- Sign in with Apple 을 지원하고 영수증·보안 알림·계정 복구 메일을 이메일로 보내는 앱.
- 메일 인프라를 여러 ESP·도메인에 걸쳐 쓰는 조직. 등록 누락이 곧 반송이다.

## 주의

- 하루 100통 한도는 주소별이다. 마케팅 메일 폭주가 아니라 트랜잭션 메일 중심으로 설계한다.
- 포워딩 해제는 사용자의 정당한 선택이다. 메일 발송을 우회하거나 실제 이메일을 따로 캐묻지 말고, 중요 알림은 앱 내 경로를 병행한다. 약관·정책 변경 고지처럼 법적 효력이 걸린 안내는 이메일 단독 경로에 의존하지 않는다.
- 서버 간 알림을 놓치면 `deliverable` 이 틀어진다. 발송 반송률과 알림 수신 로그를 함께 감시한다.
- 중계 주소의 포함 도메인 목록(`@icloud.com` 등)은 바뀔 수 있어, 도메인 문자열로 중계 여부를 판정하지 말고 토큰·알림의 `is_private_email` 같은 명시 필드를 쓴다. 단 ID 토큰 클레임의 정의는 이번 조사에서 해당 문서 본문을 못 읽어, 알림 페이로드의 예시에서만 필드를 확인했다.
- 구현 전 [스토어 심사 정책](/develop-wiki/knowledge/mobile-dev/store-review-policy/)의 로그인·계정 삭제 요건과 함께 점검한다.

> 출처 확인 범위: Apple 의 "private email relay 로 통신", "서버 간 알림 처리", "Sign in with Apple 로 사용자 인증", "앱·사용자 팀 이전" 문서는 Apple 문서 데이터(JSON)로 본문을 읽었다. "private email relay 설정" 개발자 도움말은 웹 요약(WebFetch)으로 읽었다. 미확인: ID 토큰 클레임 정의(`is_private_email`, `email_verified`, `real_user_status`)의 공식 본문, 알림의 재시도·순서 의미, 서명 검증용 공개키 엔드포인트의 현재 사양(문서 이름만 확인), 한국 개인정보보호법상 이메일 전송 동의 요건. 위 처리 코드는 직접 작성한 모형이다.
