---
name: go-oidc
url: https://github.com/coreos/go-oidc
docs: https://pkg.go.dev/github.com/coreos/go-oidc/v3/oidc
repo: https://github.com/coreos/go-oidc
stars: 2505
domain: backend
category: auth
description: golang.org/x/oauth2 에 OpenID Connect 디스커버리와 ID 토큰 검증을 더하는 Go 클라이언트 라이브러리. Go 서비스에서 외부 IdP 로그인이나 OIDC 토큰 검증이 필요할 때 쓴다.
pricing: oss
tags: [oidc, oauth2, go, jwt, id-token]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
go-oidc 는 Go 의 표준 OAuth2 패키지(`golang.org/x/oauth2`)를 **OIDC 클라이언트**로 확장한다. 발급자(issuer) URL 하나로 디스커버리 문서를 읽어 인가·토큰 엔드포인트와 JWKS 를 알아내고, 받은 ID 토큰의 서명·발급자·대상(aud)·만료를 검증한다. 서명 키는 JWKS 에서 가져와 캐시하고 키가 바뀌면 다시 받는다. 토큰을 **발급**하는 서버 기능은 없다.

사용자 로그인(Google, Microsoft Entra ID, Okta, [Keycloak](/develop-wiki/backend/auth/keycloak/) 등)뿐 아니라 GitHub Actions·Kubernetes 서비스 계정처럼 **워크로드 ID 토큰**을 검증하는 용도로도 쓰인다. 원래 CoreOS 프로젝트로 시작했고 저장소 이름이 그대로 남아 있다.

라이선스는 Apache-2.0. 2026-11 기준 최신은 **v3.21.0**(2026-09-01, 지원하지 않는 키 타입의 JWK 를 실패 대신 무시하도록 변경). 모듈 경로는 `/v3` 이다.

## 설치
```bash
go get github.com/coreos/go-oidc/v3/oidc
go get golang.org/x/oauth2
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `oidc.NewProvider(ctx, issuer)` | 디스커버리(`/.well-known/openid-configuration`)를 읽어 `Provider` 생성 |
| `provider.Endpoint()` | `oauth2.Config` 에 넣을 인가·토큰 엔드포인트 |
| `provider.Verifier(&oidc.Config{...})` | ID 토큰 검증기. `ClientID` 로 aud 확인 |
| `IDToken` | 검증된 토큰. `Subject`, `Expiry`, `Nonce`, `Claims(&v)` 로 클레임 언마셜 |
| `oidc.ScopeOpenID` | OIDC 플로에 필수인 `openid` 스코프 상수 |
| `provider.UserInfo` | userinfo 엔드포인트 호출 |
| `oidc.NewRemoteKeySet` | 디스커버리 없이 JWKS URL 로 직접 검증기 구성 |

## 기본 사용법
Authorization Code 로그인 콜백에서 ID 토큰을 검증하는 핵심 흐름.
```go
ctx := context.Background()
provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
if err != nil { log.Fatal(err) }

conf := oauth2.Config{
	ClientID: clientID, ClientSecret: clientSecret, RedirectURL: "http://localhost:8080/callback",
	Endpoint: provider.Endpoint(),
	Scopes:   []string{oidc.ScopeOpenID, "email", "profile"},
}
verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
	// state 쿠키 비교는 생략
	tok, err := conf.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil { http.Error(w, err.Error(), 400); return }
	raw, _ := tok.Extra("id_token").(string)
	idt, err := verifier.Verify(r.Context(), raw)
	if err != nil { http.Error(w, err.Error(), 401); return }
	var c struct{ Email string `json:"email"` }
	_ = idt.Claims(&c)
	fmt.Fprintf(w, "sub=%s email=%s", idt.Subject, c.Email)
})
```

## 자주 쓰는 패턴
- **state·nonce**: 로그인 시작 때 난수 `state` 와 `nonce` 를 쿠키에 저장하고, 콜백에서 쿼리의 state 와 `idt.Nonce` 를 비교한다(`oauth2.SetAuthURLParam("nonce", n)` 으로 전달).
- **PKCE**: `oauth2.GenerateVerifier()` 와 `oauth2.S256ChallengeOption(v)`, 교환 때 `oauth2.VerifierOption(v)` 를 함께 쓴다.
- **API 미들웨어**: `Authorization: Bearer` 의 JWT 를 `verifier.Verify` 로 검사하는 미들웨어를 만들어 [Gin](/develop-wiki/backend/web-framework/gin/) 등 라우터에 건다. 액세스 토큰이 JWT 가 아닌 IdP 도 있으니 확인한다.
- **CI 워크로드 인증**: GitHub Actions OIDC 토큰을 발급자 `https://token.actions.githubusercontent.com` 로 검증하고 `repository` 클레임으로 허용 범위를 제한한다.
- **Provider 재사용**: `NewProvider` 는 네트워크 호출이므로 시작 시 한 번 만들고 공유한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Go 서비스가 OIDC 로 로그인하거나 외부에서 발급된 ID·워크로드 토큰을 검증할 때.
- 피할 때(대안): Go 로 토큰을 **발급**하는 서버가 필요하면 [Ory](/develop-wiki/backend/auth/ory/)(Hydra)나 [Keycloak](/develop-wiki/backend/auth/keycloak/) 같은 IdP 를 쓰고, 일반 JWT 서명·검증만 필요하면 범용 JWT 라이브러리로 충분하다.

## 공식 문서
- [README](https://github.com/coreos/go-oidc) · [API 문서(pkg.go.dev)](https://pkg.go.dev/github.com/coreos/go-oidc/v3/oidc) · [예제](https://github.com/coreos/go-oidc/tree/v3/example) · [x/oauth2](https://pkg.go.dev/golang.org/x/oauth2)
- 언어: [Go](/develop-wiki/languages/go/) · 개념: [OAuth 2.0·OIDC](/develop-wiki/backend/auth/oauth-oidc/)
