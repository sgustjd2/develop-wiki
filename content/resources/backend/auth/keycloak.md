---
name: Keycloak
url: https://www.keycloak.org
docs: https://www.keycloak.org/documentation
repo: https://github.com/keycloak/keycloak
stars: 38014
domain: backend
category: auth
description: OIDC·OAuth 2.0·SAML 을 지원하는 오픈소스 ID·접근 관리(IAM) 서버. 자체 호스팅 SSO, 사용자 관리, 소셜·LDAP 연동이 필요할 때 쓴다.
pricing: oss
tags: [iam, sso, oidc, saml, identity-provider]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Keycloak 은 CNCF 인큐베이팅 프로젝트인 Java(Quarkus) 기반 IAM 서버다. 애플리케이션은 로그인 화면·비밀번호 저장·MFA 를 직접 만들지 않고 Keycloak 에 OIDC/SAML 로 위임하며, Keycloak 이 사용자 저장소, 로그인·등록 UI, 소셜 로그인(Google, GitHub 등), LDAP/AD 연동, 역할·그룹 기반 권한, 토큰 발급을 맡는다. 관리 콘솔과 Admin REST API, Kubernetes 오퍼레이터를 제공한다.

라이선스는 Apache-2.0. 2026-11 기준 최신은 **26.8.2**(2026-11-05). Red Hat 은 이를 기반으로 상용 지원판(Red Hat build of Keycloak)을 낸다.

## 설치
```bash
docker run -p 127.0.0.1:8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.8.2 start-dev
# 관리 콘솔: http://localhost:8080/admin
```
`start-dev` 는 개발 모드(내장 DB, HTTP)다. 운영은 `start` + 외부 PostgreSQL 등 DB, TLS, 호스트 이름 설정이 필요하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Realm | 사용자·클라이언트·설정을 격리하는 테넌트 단위. `master` 는 관리 전용으로 둔다 |
| Client | Keycloak 에 등록된 앱. OIDC 클라이언트 ID·리다이렉트 URI·공개/기밀 여부 |
| Users / Groups | 사용자 계정과 그룹. 속성(attributes) 확장 가능 |
| Roles | Realm 역할과 Client 역할. 토큰의 `realm_access`/`resource_access` 클레임으로 전달 |
| Identity Provider | 외부 IdP(소셜, 다른 OIDC/SAML) 연동 |
| User Federation | LDAP·Active Directory 를 사용자 저장소로 연결 |
| Authentication Flow | 로그인 단계(비밀번호, OTP, WebAuthn 등)를 조합하는 흐름 |
| Organizations | B2B 다중 조직 관리 기능 |

## 기본 사용법
1. 관리 콘솔에서 Realm(`myrealm`) 생성 → 사용자 추가·비밀번호 설정.
2. Clients 에서 OpenID Connect 클라이언트(`myclient`) 생성, Standard flow 활성화, Valid redirect URI 등록.
3. 앱에서 디스커버리 URL 로 OIDC 클라이언트 설정:
```text
issuer:     http://localhost:8080/realms/myrealm
discovery:  http://localhost:8080/realms/myrealm/.well-known/openid-configuration
```
```yaml
# Spring Boot 리소스 서버 예 (application.yml)
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/myrealm
```

## 자주 쓰는 패턴
- **설정을 코드로**: Realm 설정을 JSON 으로 내보내 `--import-realm` 으로 가져오거나, Terraform 프로바이더·keycloak-config-cli 로 관리한다.
- **운영 배포**: Kubernetes 는 공식 Keycloak Operator 와 `Keycloak` CR 을 쓰고, 여러 인스턴스는 분산 캐시로 세션을 공유한다.
- **테마**: 로그인·이메일 화면은 테마(FreeMarker) 또는 Keycloakify 같은 도구로 바꾼다.
- **확장**: 사용자 저장소·인증 단계·이벤트 리스너는 SPI(Java)로 확장한다.
- **패스키**: 인증 흐름에 WebAuthn Passwordless 단계를 추가해 패스키 로그인을 지원한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 사내 앱의 SSO, 데이터 주권 때문에 IdP 를 자체 호스팅해야 할 때, LDAP/AD 와 OIDC 를 연결할 때.
- 피할 때(대안): 단일 앱의 로그인만 필요하면 [Better Auth](/develop-wiki/backend/auth/better-auth/)·[Spring Security](/develop-wiki/backend/auth/spring-security/) 같은 앱 내 라이브러리, 헤드리스 API 중심·Go 기반 경량 구성이 좋으면 [Ory](/develop-wiki/backend/auth/ory/).

## 공식 문서
- [문서](https://www.keycloak.org/documentation) · [Docker 시작하기](https://www.keycloak.org/getting-started/getting-started-docker) · [서버 설정 가이드](https://www.keycloak.org/guides#server) · [OIDC 앱 보안](https://www.keycloak.org/securing-apps/oidc-layers)
