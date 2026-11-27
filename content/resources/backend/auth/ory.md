---
name: Ory
url: https://www.ory.com
docs: https://www.ory.com/docs/
repo: https://github.com/ory/kratos
stars: 14000
domain: backend
category: auth
description: Go 로 만든 헤드리스 ID 인프라 모음. Kratos(사용자·로그인), Hydra(OAuth2·OIDC 서버), Keto(권한), Oathkeeper(프록시)를 API 로 조합해 쓴다.
pricing: oss
tags: [iam, oauth2, oidc, headless, zanzibar]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ory 는 인증·인가를 기능별 독립 서버로 나눈 오픈소스 프로젝트 모음이다. UI 를 포함하지 않는 **헤드리스** 설계라, 로그인·가입 화면은 앱이 직접 만들고 Ory 는 API 로 흐름(flow)과 상태를 관리한다.
| 구성 요소 | 역할 |
| --- | --- |
| Kratos | 사용자 ID 관리: 가입·로그인·MFA·패스키·계정 복구·세션 |
| Hydra | OpenID Certified OAuth 2.0·OIDC 인가 서버. 로그인·동의 화면은 외부 앱에 위임 |
| Keto | Google Zanzibar 방식의 관계 기반 권한(ReBAC) 서버 |
| Oathkeeper | 요청을 인증·인가해 업스트림으로 넘기는 ID·접근 프록시 |

**라이선스·버전(2026-11)**: 오픈소스판은 Apache-2.0. 2025-10 부터 모든 구성 요소가 `YY.Q.N` 달력 버전을 함께 쓰며 최신은 **v26.2.0**(2026-03). B2B 조직·멀티테넌시, 일부 Hydra 기능, 보안 패치 SLA 는 상용 **Ory Enterprise License(OEL)** 빌드와 관리형 **Ory Network** 에만 있다. 오픈소스판은 2026-03 이후 새 릴리스가 없으므로 도입 전 저장소 활동을 확인한다.

## 설치
```bash
brew install ory/tap/kratos       # 또는 docker: oryd/kratos
kratos serve -c kratos.yml --dev --watch-courier
```
Kratos 공개 API 는 기본 4433, 관리 API 는 4434 포트를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Identity Schema | 사용자 속성(이메일 등)과 로그인 식별자를 JSON Schema 로 정의 |
| Self-service Flow | 로그인·가입·설정·복구·검증 흐름. 브라우저 흐름과 API(네이티브 앱) 흐름 |
| Session | `ory_kratos_session` 쿠키 또는 세션 토큰. `/sessions/whoami` 로 확인 |
| Login/Consent App | Hydra 가 리다이렉트하는 외부 로그인·동의 화면 |
| Relation Tuple | Keto 의 `namespace:object#relation@subject` 권한 데이터 |
| Ory CLI | 관리형 Ory Network 와 로컬 개발(`ory tunnel`)용 도구 |

## 기본 사용법
```yaml
# kratos.yml (발췌)
dsn: sqlite:///var/lib/sqlite/db.sqlite?_fk=true
serve:
  public: { base_url: http://127.0.0.1:4433/ }
selfservice:
  default_browser_return_url: http://127.0.0.1:3000/
  methods:
    password: { enabled: true }
identity:
  default_schema_id: default
  schemas:
    - id: default
      url: file:///etc/config/kratos/identity.schema.json
```
```bash
# 앱 백엔드에서 현재 세션 확인
curl -H "Cookie: ory_kratos_session=..." http://127.0.0.1:4433/sessions/whoami
```

## 자주 쓰는 패턴
- **UI 구현**: 공식 Ory Elements(React 컴포넌트)나 참조 UI 를 기반으로 로그인 화면을 만든다.
- **OAuth2 제공자 되기**: Kratos 로 사용자를 관리하고 Hydra 의 login/consent 엔드포인트를 Kratos 세션과 연결해 서드파티 앱에 OIDC 를 제공한다.
- **세밀한 권한**: 문서 공유·조직 계층처럼 관계로 표현되는 권한은 Keto 에 튜플로 저장하고 `check` API 로 판정한다.
- **로컬 → 관리형**: 개발은 오픈소스 컨테이너로, 운영은 Ory Network 로 같은 API 를 쓰는 구성도 가능하다.

## 언제 쓰나 / 피할 때
- 쓸 때: 로그인 UI 를 완전히 직접 디자인하고 싶을 때, 인증·OAuth2 서버·권한 서버를 필요한 것만 골라 마이크로서비스로 배치할 때.
- 피할 때(대안): 관리 콘솔과 로그인 화면까지 갖춘 올인원 IdP 가 필요하면 [Keycloak](/develop-wiki/backend/auth/keycloak/), 단일 TS 앱이면 [Better Auth](/develop-wiki/backend/auth/better-auth/), B2B 멀티테넌시를 오픈소스로만 구성해야 하면 OEL 범위를 먼저 확인한다.

## 공식 문서
- [문서](https://www.ory.com/docs/) · [Kratos 퀵스타트](https://www.ory.com/docs/kratos/quickstart) · [Hydra](https://www.ory.com/docs/hydra/) · [Keto](https://www.ory.com/docs/keto/) · [버전 정책](https://www.ory.com/docs/ecosystem/versioning) · [OEL 소개](https://www.ory.com/docs/self-hosted/oel)
