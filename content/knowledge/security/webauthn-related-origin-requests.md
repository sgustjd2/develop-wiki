---
title: WebAuthn 관련 출처 요청 (Related Origin Requests, .well-known/webauthn)
aka: [Related Origin Requests, ROR, .well-known/webauthn, Related Origins, relatedOrigins, Registrable Origin Label, 관련 출처 요청, 패스키 다중 도메인]
category: security
level: advanced
summary: 도메인이 여러 개인 서비스가 RP ID 하나의 패스키를 함께 쓰도록, RP ID 도메인의 .well-known/webauthn 에 허용 출처 목록을 공개하고 브라우저가 검증하는 WebAuthn Level 3 기능. 라벨 수 제한과 사용자 혼동이 비용이다.
tags: [webauthn, passkeys, related-origins, rp-id, well-known, fido2, w3c, multi-domain]
related: [security/webauthn-signal-api-passkey-lifecycle, security/mfa-passkeys, security/passkey-recovery-hints, security/cors, security/oauth-authorization-server-metadata-rfc8414, security/threat-modeling-stride, security/webauthn-native-app-origin-asset-links]
sources:
  - https://www.w3.org/TR/webauthn-3/
  - https://www.rfc-editor.org/rfc/rfc8615
updatedAt: 2026-11-19
---

## 문제

패스키(WebAuthn 자격 증명)는 **RP ID** 라는 도메인에 묶인다. 기본 규칙은 RP ID 가 호출한 페이지 출처의 유효 도메인과 같거나, 그 **등록 가능한 도메인 접미사**여야 한다는 것이다. `login.example.com` 에서 RP ID `example.com` 은 되지만, `example.co.uk` 에서 `example.com` 은 안 된다.

명세(5.11)가 드는 곤란한 경우는 세 가지다.

- 국가별 도메인: `example.com`, `example.co.uk`, `example.sg`
- 별도 브랜드 도메인: 한 회사의 여행·크루즈 브랜드가 서로 다른 도메인을 씀
- 모바일 앱 지원에 PaaS 도메인을 쓰는 경우

도메인마다 RP ID 를 따로 두면 사용자는 도메인마다 패스키를 따로 만들어야 하고, 같은 계정인데 한쪽에서 만든 패스키가 다른 쪽에서 보이지 않는다.

## 해법: RP ID 쪽이 허용 목록을 공개한다

1. 모든 관련 출처에서 **하나의 공통 RP ID** 를 쓴다(명세 MUST). 예: `example.com`.
2. RP ID 도메인의 `https://example.com/.well-known/webauthn` 에 JSON 을 둔다(RFC 8615 well-known URI, HTTPS 필수, `Content-Type: application/json`).
3. 최상위 객체에 `origins` 배열(하나 이상의 웹 출처 문자열)을 넣는다.

```json
{ "origins": ["https://example.co.uk", "https://example.de", "https://exampledelivery.com"] }
```

4. 다른 출처(`https://example.co.uk`)에서 `rp.id: "example.com"` 으로 `create()`/`get()` 을 부르면, 기본 규칙에 맞지 않으므로 브라우저가 **관련 출처 검증 절차**(5.11.1)를 돈다.
   - 위 URL 을 **자격 증명(쿠키) 없이, 리퍼러 없이, https 로만** 가져온다. 리다이렉트도 https 여야 한다.
   - 실패, 콘텐츠 타입 불일치, 최종 상태 200 이 아님, JSON 객체 아님, `origins` 가 문자열 배열이 아님 → `SecurityError`.
   - 목록을 앞에서부터 보면서 각 출처의 **등록 가능 출처 라벨**을 센다. 호출 출처와 같은 출처를 만나면 통과.
   - 브라우저가 이 기능을 지원하지 않아도 `SecurityError` 다.
5. 지원 여부는 `PublicKeyCredential.getClientCapabilities()` 의 `relatedOrigins` 로 감지한다(명세 SHOULD).

### 라벨 제한이 핵심 제약이다

- **등록 가능 출처 라벨**은 등록 가능한 도메인의 첫 라벨이다. 명세 예시대로 공개 접미사가 `co.uk`·`de` 이면 `example.co.uk` 와 `www.example.de` 의 라벨은 둘 다 `example` 이다.
- 브라우저는 라벨을 **최소 5개** 지원해야 하고(MUST), 남용 방지를 위해 상한을 정책으로 둔다(SHOULD).
- 제한을 넘는 새 라벨의 출처는 오류 없이 **건너뛴다.** 이미 센 라벨의 출처는 계속 비교한다. 그래서 **출처 수가 아니라 브랜드(라벨) 수**가 제한되고, **목록 순서**가 결과를 바꾼다.

명세 알고리즘을 그대로 옮겨(공개 접미사는 예시용 소집합) 명세의 예시 목록 10개(라벨 4종: example, exampledelivery, myexamplerewards, examplecars)로 돌려 본 결과다.

| 호출 출처 | 상한 5 | 상한 3 | 상한 2 |
| --- | --- | --- | --- |
| `https://example.sg` | 통과 | 통과 | 통과 |
| `https://exampledelivery.de` | 통과 | 통과 | 통과 |
| `https://myexamplerewards.com` | 통과 | 통과 | 실패 |
| `https://examplecars.com`(목록 마지막) | 통과 | **실패** | 실패 |
| `https://evil.com`(목록에 없음) | 실패 | 실패 | 실패 |

`examplecars.com` 을 목록 맨 앞으로 옮기면 상한 3 에서도 통과했다. 서로 다른 라벨 6개 목록에서 6번째는 상한 5 에서 실패했다. 실제 브라우저의 상한값은 확인하지 않았다(명세는 하한 5만 정한다).

## 언제 쓰나

- 국가 도메인·브랜드 도메인이 여럿인데 **계정 체계가 하나**인 서비스. 사용자가 어느 도메인에서 만든 패스키든 다른 도메인에서 쓰게 하려 할 때.
- 기존에 도메인별로 RP ID 를 나눠 둔 서비스가 통합할 때. 단 이미 발급된 패스키의 RP ID 는 바꿀 수 없으므로, 기존 RP ID 중 하나를 공통 RP ID 로 정하고 나머지 도메인의 패스키는 점진적으로 다시 등록받는다. 명세는 자격 증명 레코드에 RP ID 를 저장해 두면 나중에 관련 출처로 확장할 때 도움이 된다고 적는다.

## 주의 (비용)

- **사용자 혼동.** 호출 출처와 RP ID 가 다르면 "누가 내 패스키를 요청하는가"가 흐려진다. 명세 14.5.5 는 브라우저·플랫폼이 선택 화면에 **호출 출처와 RP ID 를 함께** 보여 줘야 한다고 권고한다(예: "exampleA.com 의 패스키로 otherExampleB.com 에 로그인할까요?").
- **목록 = 신뢰 경계.** 목록에 넣은 출처는 공통 RP ID 의 패스키로 서명을 받을 수 있다. 한 도메인의 XSS·하위 도메인 탈취가 다른 브랜드 계정까지 번질 수 있다. 서버는 `clientDataJSON.origin` 을 검증해야 하고(MUST) 예상 밖 값은 받지 않는다(MUST NOT). 관련 출처를 쓰면 보통 well-known 목록과 같은 허용 목록에 정확히 일치하는지로 검증한다(13.4.9 예시).
- **라벨 상한.** 브랜드가 5개를 넘으면 일부 브라우저에서 동작하지 않을 수 있다. 중요한 출처를 목록 앞에 둔다.
- **가용성 의존.** 검증 때마다(또는 캐시 정책에 따라) `.well-known/webauthn` 을 가져온다. 이 파일이 200 이 아니거나 콘텐츠 타입이 틀리면 관련 출처 로그인이 전부 `SecurityError` 가 된다. CDN·리다이렉트 설정을 점검한다. 브라우저 캐시 정책은 명세에 없고 확인하지 않았다.
- **네이티브 앱은 별개.** 앱의 연결(Android Digital Asset Links, Apple associated domains)은 이 메커니즘이 아니다. 그 연동과 앱 출처(`android:apk-key-hash:`) 검증은 [네이티브 앱의 WebAuthn 출처 검증](/develop-wiki/knowledge/security/webauthn-native-app-origin-asset-links/)에 있다.
- [Signal API](/develop-wiki/knowledge/security/webauthn-signal-api-passkey-lifecycle/)도 RP ID 가 현재 출처와 맞지 않으면 이 검증을 거친다.

> 출처 확인 범위: W3C WebAuthn Level 3(Recommendation, 2026-08-25)에서 5.11·5.11.1(형식·가져오기 조건·검증 알고리즘·라벨 하한), 용어 정의의 Registrable Origin Label, 5.8.7(`relatedOrigins` 능력), 14.5.5(교차 출처 사용 시 UI 권고), 13.4.9(출처 검증)를 직접 읽었다. 라벨 실험은 명세 알고리즘을 Node 로 옮긴 모형이며 공개 접미사 목록은 예시용 소집합이다. 미확인: 브라우저별 지원 여부·라벨 상한·응답 캐시, 네이티브 앱 연동.
