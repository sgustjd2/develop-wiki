---
title: FAPI 2.0 Implementation Advice - 헤더·토큰 크기·DPoP 대 mTLS 구현 조언
aka: [FAPI 2.0 Implementation Advice, FAPI 2.0 Implementation and Deployment Advice(비공식 별칭, 별개 문서의 제목과 혼동 주의), x-fapi-interaction-id, x-fapi-end-user-present, fapi-2_0-implementation_advice, FAPI 구현 조언]
category: security
level: advanced
summary: FAPI 2.0 규격이 열어 둔 선택지에 대한 OpenID FAPI WG 의 비규범 실무 조언 초안. x-fapi-interaction-id·x-fapi-end-user-present 헤더, DPoP 대 mTLS 선택, 토큰 크기, 키 관리, WAF 오탐을 다룬다.
tags: [fapi, openid, implementation-advice, x-fapi-interaction-id, x-fapi-end-user-present, dpop, mtls, token-size, waf, draft]
related: [security/fapi-2-security-profile, security/fapi-2-message-signing-rfc9421, security/oauth-par-rfc9126, security/dpop, security/mtls-certificate-bound-tokens, security/kms-hsm-signing-keys, security/jwt-key-rotation, performance/rate-limiting]
sources:
  - https://openid.bitbucket.io/fapi/fapi-2_0-implementation_advice.html
  - https://bitbucket.org/openid/fapi/raw/master/FAPI_2_0_Implementation_Advice.md
  - https://openid.net/wg/fapi/specifications/
  - https://openid.bitbucket.io/fapi/fapi-implementation-deployment-advice.html
updatedAt: 2026-11-23
---

## 문제

[FAPI 2.0 Security Profile](/develop-wiki/knowledge/security/fapi-2-security-profile/)은 선택지를 최소화했지만, 구현자가 정해야 할 일이 남는다. 송신자 제약을 DPoP 로 할지 mTLS 로 할지, 장애 추적용 헤더를 어떻게 맞출지, 큰 토큰이 프록시에서 막히면 어떻게 찾을지 같은 것이다. 이 문서는 그런 결정에 대한 **작업 그룹 구성원의 경험을 담은 조언**이다. 규격의 요구사항을 늘리는 문서가 아니다.

## 문서 지위 (2026-11-23 확인)

| 항목 | 내용 |
| --- | --- |
| 이름 | "FAPI 2.0 Implementation Advice" (HTML 제목). "Implementation and Deployment Advice" 는 아래 별개 문서의 제목이다 |
| 판 | 마크다운 원본의 seriesInfo 는 `fapi-2_0-implementation_advice-01`, 저자 D. Tonge(Moneyhub), HTML 작업본 표기 "Published: 26 June 2026" |
| 지위 | **작업본(working draft)**. openid.net/wg/fapi/specifications 의 Final·Implementer's Draft 목록에 없고, 본문도 "OIDF 국제 표준이 아니며 예고 없이 바뀔 수 있다"고 밝힌다 |
| 마지막 변경 | Bitbucket 저장소 커밋 기록 기준 2026-03-03(DPoP 대 mTLS 조언, 의심 요청 조항 병합), 키 관리 절은 2026-01-28 |
| 용어 | ISO Directives Part 2 의 shall/should/may/can. 대문자 BCP 14 가 아님 |
| 미완성 부분 | 마크다운 원본의 감사의 글 절이 "todo..." 상태 |

**주의: 이름이 겹치는 문서가 둘이다.** 다른 제목(Financial-grade API)의 "Financial-grade API: Implementation and Deployment Advice"(J. Heenan, Authlete; 같은 작업본 사이트에 있음)는 공개 클라이언트·화면 스크래핑 대체 같은 다른 주제를 다룬다. 이 노트는 2.0 문서만 다룬다. 두 문서는 구조가 다르다.

## 규범이 아니라 "채택하면 적용되는" 조항

문서는 헤더 두 개를 "생태계가 채택한다면" 이라는 조건으로 shall 을 건다. 즉 FAPI 2.0 적합성 요건이 아니라 **생태계(예: 오픈뱅킹 거버넌스)가 고르는 옵션**이다.

### x-fapi-interaction-id (2.2.1)

| 주체 | 조항(shall) |
| --- | --- |
| 클라이언트 | 요청에 `x-fapi-interaction-id` 를 보내고 값은 RFC 4122 UUID |
| AS·RS | 요청 값을 응답 헤더에 그대로 돌려주고, 요청에 없었으면 UUID 를 새로 만들어 응답에 설정 |
| 모두 | 이 값을 로그 항목에 남김 |

보조 설명(NOTE): 한 인가 코드 흐름 안의 PAR 요청·토큰 요청·직후 API 호출에서 같은 값을 재사용해도 되고, 브라우저 리다이렉트로 가는 인가 요청 자체에는 헤더를 못 싣는다. 재사용 규칙은 생태계가 정할 수 있다고만 쓴다. 목적은 "AS·RS·클라이언트가 문제를 더 잘 추적·디버깅"하는 것이다. [PAR](/develop-wiki/knowledge/security/oauth-par-rfc9126/) 요청은 서버 간 호출이라 헤더를 실을 수 있다는 점이 연결되지만, 그 연결 자체는 필자 정리다.

```ts
import { randomUUID } from "node:crypto";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// 필자 예시. 형식이 잘못된 값을 새 UUID 로 바꾸는 선택은 문서에 없는 구현 판단이다.
export function interactionId(req: Headers): string {
  const v = req.get("x-fapi-interaction-id");
  return v && UUID.test(v) ? v : randomUUID();
}
```

이 코드는 Node 24 에서 실행해 유효 값 유지, 없음·잘못된 값은 36자 UUID 생성임을 확인했다.

### x-fapi-end-user-present (2.2.2)

- 클라이언트는 사용자가 세션에 실제로 있으면 `true`, 배치·자동 작업이면 `false` 를 shall 로 보낸다. 값은 불리언. 헤더가 없으면 서버는 `false` 로 간주하는 것이 should.
- 쓰임: 사용자 있음/없음에 따른 **다른 속도 제한**(사용자 있는 쪽은 초당 한도는 높고 일일 한도는 낮은 식)과, 고부하 시 사용자 있는 요청 우선 처리. 이 부분은 [레이트 리미팅](/develop-wiki/knowledge/performance/rate-limiting/)과 이어진다.
- 문서가 먼저 못 박는 점: **보안 장치가 아니다.** AS 는 클라이언트가 값을 정직하게 채운다고 믿을 뿐 독립 검증이 안 된다. 모든 호출을 `true` 로 표기하는 오남용은 생태계 거버넌스와 모니터링으로 잡아야 하고, 이 헤더는 위반 클라이언트에 대한 구제 수단이 있는 생태계에서만 쓸모가 있다고 쓴다.
- 이전 사양의 `x-fapi-customer-ip-address`(PII 노출·프라이버시 문제), `x-fapi-auth-date`(구현 오류와 날짜 파싱 부담), 클라이언트 헤더 통과를 대체하는 접근이라고 설명한다.

## DPoP 대 mTLS (2.3)

[Security Profile](/develop-wiki/knowledge/security/fapi-2-security-profile/)이 두 방식을 모두 허용한다. 이 절은 고르는 관점을 준다. 원문 항목을 필자가 줄여 표로 정리했다.

| 관점 | DPoP ([노트](/develop-wiki/knowledge/security/dpop/)) | mTLS ([노트](/develop-wiki/knowledge/security/mtls-certificate-bound-tokens/)) |
| --- | --- | --- |
| 계층 | 애플리케이션 계층 | 전송 계층 |
| 보호 범위 | 요청의 일부(HTTP 메서드·URL)만 | 요청 전체 |
| 암호 연산 | 요청마다 서명 | TLS 핸드셰이크에서 한 번, 연결 재사용으로 분산 |
| 복잡도 | URL 정규화, 선택적 서버 제공 nonce | 대규모 운영 시 전송 계층 통합이 어렵고 인증서 별칭·IP/SAN 협상·DN 일치 상호운용 문제 가능 |
| 성숙도 | 라이브러리 지원이 덜 성숙, 배포 경험 제한적 | 비교적 성숙 |
| 클라이언트 인증 | 별도 필요(필자 추론) | 인증과 송신자 제약을 동시에 처리 |
| 브라우저 클라이언트 | 사실상 유일한 선택 | 서버 간 통신에서만 실용적 |

선택 지침: 기존 PKI 가 있는 폐쇄형 생태계, 클라이언트 구현의 단순함, 요청 전체 보호, 성숙한 라이브러리가 중요하면 mTLS 가 맞을 수 있고, 브라우저 클라이언트를 지원해야 하거나 mTLS 전송 통합이 비현실적이면 DPoP 가 맞을 수 있다고 한다. **둘을 동시에 송신자 제약에 쓰는 것은 should not.** mTLS 구현에는 RFC 9440 의 추가 지침을 참조하라고 한다(`Client-Cert` 헤더 쪽 문서로 보이나 본문은 읽지 않았다).

## 토큰 크기와 장애 증상 (2.4, 2.6.1)

- 키가 커지고 클레임이 늘면 `Authorization` 헤더와 다른 헤더의 합이 웹 인프라의 요청 버퍼를 넘을 수 있다. 문서는 많은 표준 웹 서버가 기본값으로 8KB 를 넘는 헤더를 거부한다고 쓴다(구체 제품·수치는 미확인).
- 위험: 헤더 기반 DDoS 위험 증가, 지연·자원 소모 증가. AS 는 데이터 최소화로 필요한 클레임만 넣는 것이 should.
- 증상 목록(원문): HTTP 431, 연결 리셋·타임아웃, 어떤 요청은 되고 어떤 요청은 안 되는 비일관성, 잘린 `Authorization` 헤더 로그. 헤더 크기를 로깅해 조기에 잡으라고 권한다.

## 키 관리 (2.5)

상세 지침은 FAPI 범위 밖이라며, 정책으로 갖출 항목 여섯 가지를 든다(생성, 저장·보호, 회전·수명주기, 침해 대응, 접근 통제, 백업·복구). 참고로 NIST SP 800-57 Part 1 Rev.5 와 OWASP Key Management Cheat Sheet 를 가리킨다. 고가치 용도의 운영에는 HSM 등 보안 키 저장소를 "강하게 권장"하는 NOTE 가 붙는다. 상세는 [KMS·HSM 서명 키](/develop-wiki/knowledge/security/kms-hsm-signing-keys/)와 [키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/) 노트.

## 의심 요청 처리와 WAF (2.7)

WAF 가 `state`·`nonce` 의 무작위 값을 XSS 패턴으로 오인해 막는 문제를 다룬다.

- AS 는 의심 값을 포함한 인가 요청을 거부할 수 있다(may). 그러나 `<` 같은 문자를 일괄 차단하는 것은 should not, 규격에 맞는 임의의 `state`/`nonce` 는 수용하는 것이 should.
- 거부할 때는 OAuth 2.0 등이 정한 오류 응답을 쓴다(should).
- 클라이언트는 `state`·`nonce` 에 URL 안전 문자를 쓰고(should), 안전하지 않은 문자가 필요하면 base64url 로 인코딩한다(should).
- 무엇이 의심스러운지는 위협 모델마다 다르며 문서는 일부러 차단 패턴 목록을 주지 않는다. 낡기 쉽고 거짓 안심을 줄 수 있다는 이유다.

## 헷갈리는 구분

- **규격과 조언.** Security Profile 의 shall 은 적합성 시험 대상이다. 이 문서의 shall 은 "생태계가 채택하면"이라는 조건부이고 문서 자체가 작업본이다.
- **Message Signing 과의 관계.** 서명은 [FAPI 2.0 Message Signing](/develop-wiki/knowledge/security/fapi-2-message-signing-rfc9421/)이 다룬다. 이 문서는 서명 절차를 정의하지 않는다.
- **프레임워크 구성.** 1절 격인 2.1 은 FAPI 2.0 프레임워크가 Attacker Model, Security Profile, Message Signing, CIBA, Grant Management, RAR 로 이루어지고 모두 Security Profile 위에 서 있다고 정리한다. 이는 문서 작성 시점 기준이다.

## 언제 쓰나

- FAPI 2.0 생태계(오픈뱅킹 등)의 API 규약을 설계하면서 공통 헤더·송신자 제약 정책을 정할 때.
- 구현 후 운영 중 "일부 요청만 실패"하는 프록시 거부, WAF 오탐을 진단할 때.

## 주의·비용

- 작업본이라 항목이 바뀌거나 삭제될 수 있다. 인용하려면 판·커밋 시점을 적어라.
- `x-fapi-end-user-present` 는 신뢰 기반이다. 속도 제한이나 우선순위를 이 값에만 의존하면 오남용에 열린다.
- `x-fapi-interaction-id` 를 로그에 남기는 것은 PII 가 아닌 UUID 지만, 값을 여러 요청에 재사용하면 서로 다른 사용자의 흐름이 같은 ID 로 엮이지 않게 주의해야 한다(필자 의견, 문서 근거 없음).

## 검증 범위

작업본 HTML(openid.bitbucket.io, 목차와 1~2절 전체)과 Bitbucket 저장소의 마크다운 원본(seriesInfo `-01`)을 읽었다. FAPI WG 명세 목록 페이지에서 이 문서가 Final·Implementer's Draft 어느 쪽에도 없음을 확인했다. 목록에서 "Implementation and Deployment Advice"라는 제목의 2.0 문서는 찾지 못했다. FAPI 1.0 쪽 같은 이름 문서는 목차만 읽었다. RFC 9440, NIST SP 800-57, 8KB 기본 한도의 제품별 근거는 읽지 않았다. 헤더 중 필자 예시 코드만 직접 실행했다.
