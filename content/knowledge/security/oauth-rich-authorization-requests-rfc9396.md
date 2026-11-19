---
title: OAuth 리치 인가 요청 RAR (RFC 9396)
aka: [Rich Authorization Requests, RAR, RFC 9396, authorization_details, authorization_details_types_supported, invalid_authorization_details, 세분화된 인가]
category: security
level: advanced
summary: scope 문자열 대신 type 이 붙은 JSON 객체 배열(authorization_details)로 "어떤 리소스에 어떤 행위를 얼마나" 허락받는지 구조적으로 요청하고, 토큰과 인트로스펙션으로 리소스 서버에 전달하는 규격(RFC 9396).
tags: [oauth2, rfc9396, rar, authorization-details, scope, consent, open-banking, fine-grained-authorization, jwt]
related: [security/oauth-par-rfc9126, security/oauth-jar-rfc9101, security/oauth-resource-indicators-rfc8707, security/jwt-access-token-profile-rfc9068, security/token-revocation-introspection, security/oauth-authorization-server-metadata-rfc8414, security/oauth-protected-resource-metadata-rfc9728, security/oauth-token-exchange-downscoping, security/oauth-security-bcp-rfc9700, security/access-control-design, security/oauth2-oidc-pkce]
sources:
  - https://www.rfc-editor.org/rfc/rfc9396.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
updatedAt: 2026-11-19
---

## 문제

`scope` 는 공백으로 구분한 문자열 목록이다. "읽기", "쓰기" 같은 **종류**는 표현해도 다음은 표현하기 어렵다.

- **누구에게 얼마를**: "이 수취인에게 123.50 EUR 한 번" 같은 트랜잭션 수준 동의.
- **어느 리소스의 어느 항목**: 파일 `/myfiles/A` 읽기, 특정 계좌만.
- 같은 이름의 scope(`read`)가 서로 다른 API(메일, 클라우드)에 모두 해당하는 모호함.

scope 값을 `payment:123.50:EUR:DE02...` 식으로 끼워 넣으면 길어지고 파싱 규칙이 API 마다 달라진다. 오픈 뱅킹과 전자 서명 같은 사례가 이 규격의 출발점이다.

## 해법

인가 요청에 **`authorization_details`** 파라미터를 추가한다. 값은 JSON 객체 **배열**이고 각 객체가 리소스 종류 하나의 요구를 담는다.

```json
[
  { "type": "account_information",
    "actions": ["list_accounts", "read_balances"],
    "locations": ["https://example.com/accounts"] },
  { "type": "payment_initiation",
    "actions": ["initiate", "status"],
    "locations": ["https://example.com/payments"],
    "instructedAmount": { "currency": "EUR", "amount": "123.50" },
    "creditorAccount": { "iban": "DE02100100109307118603" } }
]
```

### 구조 (RFC 9396 2절)

- **`type`**: 객체의 종류를 나타내는 문자열. **REQUIRED**. 허용되는 나머지 필드는 type 이 결정하고, 값은 그 API 를 보호하는 인가 서버(AS) 맥락에서 유일해야 한다. 같은 type 의 객체가 여러 개 있어도 된다(MAY).
- **공통 필드**(이 규격이 제공하는 재사용 부품이며 API 가 쓸 의무는 없다): `locations`(리소스 서버 위치 URI 배열), `actions`, `datatypes`, `identifier`(특정 리소스 하나), `privileges`.
- 공통 필드를 한 객체에 섞으면 요청 권한은 **곱집합**이다. `actions: [read, write]` × `datatypes: [contacts, photos]` 이면 네 조합 모두. 콘택트는 읽기만, 사진은 쓰기만 원하면 **객체를 둘로 나눠야** 한다. 서로 다른 객체의 권한은 합집합으로 읽는 것이 자연스럽다(RFC 는 곱집합과 객체 분리만 설명하며, 합집합이라는 표현은 이 노트의 해석이다).
- API 는 type 별 확장 필드를 정의할 수 있다(`instructedAmount` 등).
- type 값은 복사할 때 모호하지 않은 값을 고르길 **RECOMMENDED**(ASCII 제한은 그 방법의 하나), 여러 서버에 배포되는 API 라면 자신이 관리하는 URI 같은 **충돌 방지 네임스페이스**를 쓰길 RECOMMENDED 한다.

### 흐름

1. **인가 요청**: `scope` 가 쓰이는 어디서든(인가 요청, 디바이스 인가 요청, CIBA 백채널 인증 요청) 쓸 수 있다. 일반 인가 요청에서는 JSON 을 `application/x-www-form-urlencoded` 로 직렬화한다. RFC 는 이 경우 PAR 사용을 고려하라고 한다(MAY).
2. **검증과 동의**: AS 는 unknown type, 알 수 없는 필드, 잘못된 필드 타입, 잘못된 값, 필수 필드 누락 중 **하나라도** 있으면 처리를 중단하고 **`invalid_authorization_details`** 로 응답해야 한다(MUST). 사용자는 요청의 **일부만 승인**할 수도 있다.
3. **토큰 요청**: 클라이언트가 토큰 요청에도 `authorization_details` 를 보내 "이미 동의된 것의 부분집합"을 요청할 수 있다. AS 는 grant(또는 `client_credentials` 라면 클라이언트 정책)가 허용하는지 보고 아니면 `invalid_authorization_details` 로 거부한다(`invalid_scope` 와 비슷).
4. **토큰 응답**: AS 는 부여된 `authorization_details` 를 응답에 **반드시 포함한다(MUST)**. 일부 값은 생략해도 된다(MAY). 클라이언트가 안 보내면 AS 가 재량으로 정한다.
5. **리소스 서버 전달**: AS 는 이 데이터를 RS 에 제공해야 한다(MUST). 아래 둘은 RFC 가 든 예시 경로(MAY)다.
   - **JWT 액세스 토큰**: AS 는 **audience 로 걸러** 최상위 클레임 `authorization_details` 로 넣길 RECOMMENDED.
   - **인트로스펙션**: 응답에 넣을 때는 최상위 멤버 `authorization_details` 로 **반드시(MUST)**, 요청한 RS 에 맞게 걸러지거나 확장될 수 있다.
6. **메타데이터**: AS 는 `authorization_details_types_supported`(RFC 8414), 클라이언트는 등록 메타데이터 `authorization_details_types` 로 쓰려는 type 을 알릴 수 있다(MAY). 리소스 서버 메타데이터([RFC 9728](/develop-wiki/knowledge/security/oauth-protected-resource-metadata-rfc9728/))에도 같은 이름의 지원 목록이 있다.

### 보강(enrichment)

토큰에 붙는 details 는 요청과 다를 수 있다. 사용자가 동의 화면에서 계좌를 **직접 골랐을 때** AS 가 선택된 계좌 식별자를 객체에 채워 응답하는 식이다. 허용 여부와 방식은 type 정의의 일부이고, 클라이언트는 그 type 이 보강될 수 있음을 미리 알아야 한다.

## 직접 실행: 검증과 RS 집행

RFC 가 요구하는 검증 규칙 5 가지와, type 별로 API 가 짜는 RS 쪽 판정을 흉내 낸 TypeScript(Node 24)를 실행했다. `required`·필드 타입 정의는 이 예시가 임의로 정한 것이고 RFC 가 정한 값이 아니다.

```ts
function validate(details: unknown): void { // RFC 9396 5절: 하나라도 어긋나면 invalid_authorization_details
  if (!Array.isArray(details)) throw new Error('invalid_authorization_details');
  for (const d of details as Detail[]) {
    const def = typeof d?.type === 'string' ? TYPES[d.type] : undefined;
    if (!def) throw new Error('invalid_authorization_details: 알 수 없는 type');
    for (const [k, v] of Object.entries(d)) {
      if (k === 'type') continue;
      if (!(k in def.fields)) throw new Error(`알 수 없는 필드 ${k}`);
      if (kind(v) !== def.fields[k]) throw new Error(`필드 ${k} 타입 오류`);
    }
    for (const k of def.required) if (!(k in d)) throw new Error(`필수 필드 ${k} 없음`);
  }
}
```

| 입력 | 결과 |
| --- | --- |
| 정상 객체 | 통과 |
| type 오타(`payment_initiaton`) | 알 수 없는 type 으로 거부 |
| 필드 오타(`creditorNam`) | 알 수 없는 필드로 거부 |
| `actions` 가 문자열 | 필드 타입 오류로 거부 |
| `instructedAmount` 누락 | 필수 필드 누락으로 거부 |
| RS 판정: 동의한 금액·계좌·위치 그대로 | 허용 |
| RS 판정: 금액만, 수취 계좌만, location 만 다르게 | 각각 거부 |

URL 길이도 쟀다. RFC 예시와 같은 두 객체(계좌 정보 + 결제)는 JSON 356 자, URL 인코딩 후 544 자였다. 같은 결제 객체 20 개를 넣으면 인코딩 후 6,663 자로, 브라우저·프록시의 URL 길이 한도 문제가 현실이 된다(구체 한도는 환경에 따라 다르며 측정하지 않았다).

## scope 와의 관계

- `authorization_details` 와 `scope` 를 한 요청에 함께 쓸 수 있다. 기존 앱의 점진적 이행을 위한 것이고, 한 API 는 **한쪽만 쓰길 RECOMMENDED**.
- AS 는 두 요구를 **합쳐서** 처리해야 하고(MUST), 동의 화면에는 **병합된 전체**를 보여 줘야 한다(MUST). 결합 방식 자체는 API 의 몫이다.
- `resource`([RFC 8707](/develop-wiki/knowledge/security/oauth-resource-indicators-rfc8707/))는 scope 가 적용될 리소스를 좁히는 파라미터이고, `authorization_details` 의 처리에는 **영향을 주지 않는다.** RAR 에서는 `locations` 가 비슷한 역할을 한다(RFC 9396 12절은 `locations` 가 audience 제한을 통해 의도치 않은 권한 부여를 막는다고 설명).
- RFC 9700 2.3절은 토큰 권한을 최소화하는 수단으로 scope 또는 `authorization_details` 를 MAY 로 든다. 권한 축소 자체는 SHOULD 다 → [OAuth 보안 BCP](/develop-wiki/knowledge/security/oauth-security-bcp-rfc9700/).

## 언제 쓰나

- **트랜잭션 단위 동의**가 필요한 경우: 결제(금액·수취인), 전자 서명(문서 지정), 데이터 공유(특정 계좌·기록).
- 사용자가 **리소스를 선택**하는 동의(계좌·환자 기록 고르기)를 토큰에 반영할 때(보강).
- scope 이름이 폭발적으로 늘어나거나(`read:project:123`) 파싱 규칙이 API 마다 달라 유지보수가 어려울 때.

## 주의 (비용)

- **표준화된 것은 껍데기**다. `type` 별 필드 의미, 필수 여부, 보강 규칙, 부분집합·상위집합 비교는 **API 가 정의해야** 한다. RFC 도 임의 두 요청을 비교하는 표준 방법이 없고 단순 객체 비교에 기대지 말라고 한다(6.1절). 리프레시로 권한을 줄일 때 `write` 가 `read` 를 포함하는지, `admin` 이 모두 포함하는지는 type 정의에 달렸다.
- **구현 책임이 넓다.** AS 는 type 정의, 동의 화면 렌더링, 저장(grant 에 붙여 저장), 토큰·인트로스펙션 반영을 확장 지점으로 제공해야 하고(RFC 11절), RS 는 매 요청 details 를 해석해 집행해야 한다. 라이브러리·제품이 이 확장을 지원하는지가 도입 가능성을 정한다(특정 제품 지원은 이 노트에서 확인하지 않았다).
- **무결성은 따로 지켜야 한다.** 일반 인가 요청에서 details 는 브라우저를 지나므로 사용자가 바꿀 수 있다. 무결성이 중요하면 클라이언트가 변조·교체로부터 보호해야 한다(MUST). 방법은 서명된 요청 객체([JAR](/develop-wiki/knowledge/security/oauth-jar-rfc9101/)) 또는 JAR `request_uri` + [PAR](/develop-wiki/knowledge/security/oauth-par-rfc9126/)다. 결제 금액을 URL 로만 실으면 금액 변조가 가능해진다.
- **개인정보**: details 에 민감 데이터(계좌, 건강 정보)가 들어가면 Referer·로그로 새지 않게 해야 한다. RFC 13절은 암호화 요청 객체나 PAR 를 선택지로 든다. 암호화해도 공격자가 자기 기기의 인가 요청에 암호문을 주입해 AS 동의 화면에서 평문을 보게 만들 수 있으니 일부만 표시하거나 사용자 컨텍스트를 재확인하라고 한다.
- **인젝션**: AS 는 details 를 정제해야 한다(MUST). 로그·템플릿·쿼리에 그대로 넣지 않는다. 문자열 비교는 RFC 8259 규칙대로이고 추가 정규화를 하지 않는다.
- **토큰 크기**: JWT 에 details 를 넣으면 토큰이 커져 헤더 한도에 걸리거나 민감 정보가 토큰에 담긴다. 이때 참조 토큰 + 인트로스펙션이 낫지만 RS 마다 호출이 늘어난다 → [인트로스펙션](/develop-wiki/knowledge/security/token-revocation-introspection/), [JWT 액세스 토큰 프로파일](/develop-wiki/knowledge/security/jwt-access-token-profile-rfc9068/).
- **type 오타·유니코드 혼동**: 비슷한 문자로 type 을 속이는 위험 때문에 ASCII 로 제한하거나 문서에서 복사해 쓰게 하라고 RFC 가 권한다.
- scope 만으로 충분한 단순한 API 에 RAR 를 넣는 것은 과설계다.

## 비교

| 항목 | scope | `resource` (RFC 8707) | RAR (`authorization_details`) |
| --- | --- | --- | --- |
| 형태 | 공백 구분 문자열 | URI | type 별 JSON 객체 배열 |
| 표현력 | 종류 수준 | 대상 리소스 서버 | 금액·수취인·특정 항목까지 |
| 표준화된 의미 | 없음(API 정의) | audience | 구조만 표준, 의미는 type 정의 |
| 동의 화면 | 문자열 설명 | 서버 이름 | type 별 렌더링 필요 |
| 토큰 반영 | `scope` 클레임 | `aud` | `authorization_details` 클레임·인트로스펙션 |
| 길이 | 짧음 | 짧음 | 길 수 있음 → PAR 권장 |

권한 축소·위임은 [토큰 교환 다운스코핑](/develop-wiki/knowledge/security/oauth-token-exchange-downscoping/), 앱 내부 정책 모델은 [접근 제어 설계](/develop-wiki/knowledge/security/access-control-design/)와 이어서 본다.

## 검증 범위

RFC 9396 본문 전체(2~14절: 구조, 요청·토큰 요청·응답, 오류, 비교, 보강, 리소스 서버, 메타데이터, 구현 고려, 보안·개인정보)를 rfc-editor.org 텍스트로 읽고 MUST/SHOULD 강도를 원문과 대조했다. RFC 9700 은 2.3절을 확인했다. 검증 코드와 URL 길이 수치는 직접 실행한 결과다. 특정 인가 서버 제품의 RAR 지원, 브라우저·프록시의 URL 한도, FAPI 등 프로파일의 RAR 사용 요건은 확인하지 않았다.
