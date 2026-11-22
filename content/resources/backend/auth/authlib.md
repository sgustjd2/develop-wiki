---
name: Authlib
url: https://authlib.org
docs: https://docs.authlib.org/en/latest/
repo: https://github.com/lepture/authlib
stars: 5461
domain: backend
category: auth
description: OAuth 1.0·OAuth 2.0·OpenID Connect 클라이언트와 서버를 모두 구현하는 Python 라이브러리. Flask·Django·FastAPI 앱에 소셜 로그인을 붙이거나 직접 인가 서버를 만들 때 쓴다.
pricing: oss
tags: [oauth2, oidc, python, social-login, authorization-server]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Authlib 은 OAuth·OIDC 명세를 Python 으로 구현한 라이브러리다. 한 패키지 안에 **클라이언트**(외부 IdP 로그인, API 호출용 OAuth2 세션)와 **서버**(인가 서버·리소스 서버·OIDC 제공자) 구성 요소가 함께 들어 있고, Flask·Django·Starlette/FastAPI 와 requests·httpx 연동 모듈을 제공한다. 프레임워크 연동은 같은 API(`OAuth().register(...)`)를 공유해 프레임워크를 바꿔도 사용법이 거의 같다.

라이선스는 BSD-3-Clause. 2026-11 기준 최신 안정판은 **1.9.9**(2026-11-17)이고 **1.10.0b1** 베타가 진행 중이다(리소스 서버 오류 응답을 RFC 6750 에 맞게 바꾸는 등 서버 쪽 동작 변경 포함). JWT·JWS·JWK 를 다루던 `authlib.jose` 모듈은 1.7.0 부터 deprecated 이며 같은 저자의 **joserfc** 로 옮기라고 안내하고, Authlib 2.0 에서 제거될 예정이다. 개념 배경은 [OAuth 2.0·OIDC](/develop-wiki/backend/auth/oauth-oidc/) 항목을 참고한다.

## 설치
```bash
pip install Authlib            # Python 3.10+
pip install Authlib httpx itsdangerous   # Starlette/FastAPI 클라이언트 (httpx 백엔드 + 세션 미들웨어)
pip install Authlib requests   # Flask·Django 클라이언트 (requests 백엔드)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `OAuth` 레지스트리 | 프레임워크별 `OAuth()` 객체. `register()` 로 원격 IdP 를 이름 붙여 등록 |
| `server_metadata_url` | OIDC 디스커버리 URL. 엔드포인트·JWKS·서명 알고리즘을 자동으로 읽음 |
| `authorize_redirect` / `authorize_access_token` | 로그인 리다이렉트와 콜백의 코드→토큰 교환. `state`·`nonce`·ID 토큰 검증 포함 |
| `OAuth2Session` / `AsyncOAuth2Client` | requests·httpx 기반 OAuth2 HTTP 클라이언트. 토큰 자동 갱신 지원 |
| `AuthorizationServer` | Flask·Django 용 인가 서버. 그랜트 타입(Authorization Code, Client Credentials 등)을 등록해 구성 |
| `ResourceProtector` | Bearer 토큰을 검증해 API 엔드포인트를 보호하는 데코레이터 |
| joserfc | JOSE(JWT·JWS·JWE·JWK) 처리. 신규 코드는 `authlib.jose` 대신 사용 |

## 기본 사용법
FastAPI 에서 OIDC 로그인(예: Google). 임시 `state` 와 `nonce` 를 세션에 저장하므로 `SessionMiddleware` 가 필요하다.
```python
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="change-me")

oauth = OAuth()
oauth.register(
    "google",
    client_id="...", client_secret="...",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@app.get("/login")
async def login(request: Request):
    return await oauth.google.authorize_redirect(request, request.url_for("callback"))

@app.get("/auth/callback")
async def callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    return dict(token["userinfo"])  # 검증된 ID 토큰 클레임
```

서버 간 호출에 쓰는 Client Credentials 토큰 발급:
```python
from authlib.integrations.requests_client import OAuth2Session

client = OAuth2Session("client-id", "client-secret", scope="api.read")
token = client.fetch_token("https://idp.example.com/oauth/token", grant_type="client_credentials")
resp = client.get("https://api.example.com/items")  # Authorization 헤더 자동 첨부
```

## 자주 쓰는 패턴
- **여러 IdP**: `register()` 를 여러 번 호출하고 `oauth.create_client(name)` 으로 라우트 하나에서 분기한다.
- **사용자 세션**: 콜백에서 받은 `userinfo["sub"]` 와 IdP 이름으로 내부 사용자를 찾고, 이후는 앱 자체 세션·쿠키로 관리한다.
- **토큰 갱신 저장**: `update_token` 콜백을 넘기면 자동 갱신된 토큰을 DB 에 저장할 수 있다.
- **로그아웃**: OIDC RP-Initiated Logout 은 저장해 둔 ID 토큰으로 `logout_redirect` 를 호출한다.
- **인가 서버 구축**: Flask/Django 의 `AuthorizationServer` 에 그랜트 클래스와 토큰 저장 함수를 등록한다. 단, 사용자 관리·로그인 UI 까지 직접 만들어야 하므로 범위가 크다.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 웹 앱에 소셜·사내 SSO 로그인을 붙일 때, OAuth2 로 보호된 외부 API 를 호출할 때, 명세 수준까지 제어하는 소규모 인가 서버가 필요할 때.
- 피할 때(대안): 사용자 관리·MFA·관리 콘솔까지 갖춘 IdP 가 필요하면 [Keycloak](/develop-wiki/backend/auth/keycloak/)·[Ory](/develop-wiki/backend/auth/ory/) 를 띄우고 Authlib 은 클라이언트로만 쓴다. JWT 처리만 필요하면 joserfc 를 직접 쓴다.

## 공식 문서
- [문서](https://docs.authlib.org/en/latest/) · [FastAPI 연동](https://docs.authlib.org/en/latest/oauth2/client/web/fastapi.html) · [변경 이력](https://docs.authlib.org/en/latest/upgrades/changelog.html) · [joserfc 마이그레이션](https://docs.authlib.org/en/latest/upgrades/jose.html)
- 언어: [Python](/develop-wiki/languages/python/) · 프레임워크: [FastAPI](/develop-wiki/backend/web-framework/fastapi/) · [Django](/develop-wiki/backend/web-framework/django/)
