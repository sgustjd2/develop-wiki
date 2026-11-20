---
name: OpenIddict
url: https://openiddict.com
docs: https://documentation.openiddict.com/
repo: https://github.com/openiddict/openiddict-core
stars: 5305
domain: backend
category: auth
description: ASP.NET Core 앱 안에 OAuth 2.0·OpenID Connect 서버를 구현하는 .NET 프레임워크. 별도 IdP 제품 없이 자체 토큰 발급 서버가 필요할 때 쓴다.
pricing: oss
tags: [oauth2, oidc, dotnet, aspnet-core, authorization-server]
languages: [csharp]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
OpenIddict 는 .NET 용 OAuth 2.0·OpenID Connect 스택이다. 완성형 IdP 제품이 아니라 **라이브러리**라서, 기존 ASP.NET Core 앱에 인가 서버(토큰·인가·userinfo 엔드포인트)를 끼워 넣고 로그인 화면·사용자 저장소·동의 화면은 앱이 직접 만든다. 구성 요소는 세 가지다.

- **Server**: 토큰 발급 서버. 엔드포인트와 허용 그랜트를 선택해 켠다.
- **Validation**: API(리소스 서버)에서 OpenIddict 또는 다른 OIDC 서버가 발급한 토큰을 검증한다.
- **Client**: 외부 IdP 로 로그인하는 OIDC 클라이언트. 여러 소셜·기업 IdP 용 Web Providers 를 함께 제공한다.

사용자 계정·비밀번호·2FA 는 보통 **ASP.NET Core Identity** 가 맡고, OpenIddict 는 그 위에서 토큰 프로토콜만 처리하는 조합이 일반적이다(Identity 자체는 OIDC 서버를 제공하지 않는다). 저장소는 Entity Framework Core·MongoDB 어댑터를 제공한다.

라이선스는 Apache-2.0. 2026-11 기준 최신 안정판은 **7.9.0**(2026-11-14)이고 8.0 프리뷰가 병행 중이다.

## 설치
```bash
dotnet add package OpenIddict.AspNetCore
dotnet add package OpenIddict.EntityFrameworkCore
```
공식 가이드는 [openiddict-samples](https://github.com/openiddict/openiddict-samples) 저장소의 샘플에서 시작하길 권한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `AddCore()` | 애플리케이션·권한 부여·스코프·토큰 저장소 설정 (`UseEntityFrameworkCore()`) |
| `AddServer()` | 엔드포인트 URI, 허용 플로(Authorization Code, Client Credentials 등), 서명·암호화 키 |
| Passthrough | `EnableTokenEndpointPassthrough()` 등으로 요청을 앱의 컨트롤러·핸들러로 넘겨 클레임을 직접 구성 |
| `IOpenIddictApplicationManager` | 클라이언트 애플리케이션 등록·조회 (`OpenIddictApplicationDescriptor`) |
| Permissions | 클라이언트별로 허용할 엔드포인트·그랜트·스코프 (`Permissions.GrantTypes.ClientCredentials` 등) |
| Destinations | 각 클레임을 액세스 토큰·ID 토큰 중 어디에 넣을지 지정 (`SetDestinations`) |
| `AddValidation()` | 리소스 서버 쪽 토큰 검증. 같은 앱이면 `UseLocalServer()` |

## 기본 사용법
Client Credentials 토큰 서버의 최소 구성(`ApplicationDbContext` 에서 `options.UseOpenIddict()` 를 호출해 둔 상태).
```csharp
builder.Services.AddOpenIddict()
    .AddCore(o => o.UseEntityFrameworkCore().UseDbContext<ApplicationDbContext>())
    .AddServer(o =>
    {
        o.SetTokenEndpointUris("connect/token");
        o.AllowClientCredentialsFlow();
        o.AddDevelopmentEncryptionCertificate().AddDevelopmentSigningCertificate();
        o.UseAspNetCore().EnableTokenEndpointPassthrough();
    })
    .AddValidation(o => { o.UseLocalServer(); o.UseAspNetCore(); });
```
토큰 엔드포인트 처리(Minimal API). 클라이언트 자격 증명 검증은 OpenIddict 가 먼저 끝낸다.
```csharp
// using static OpenIddict.Abstractions.OpenIddictConstants;  (Claims, Destinations)
app.MapPost("/connect/token", (HttpContext ctx) =>
{
    var request = ctx.GetOpenIddictServerRequest()!;
    if (!request.IsClientCredentialsGrantType()) return Results.BadRequest();

    var identity = new ClaimsIdentity(TokenValidationParameters.DefaultAuthenticationType);
    identity.SetClaim(Claims.Subject, request.ClientId);
    identity.SetDestinations(_ => [Destinations.AccessToken]);
    return Results.SignIn(new ClaimsPrincipal(identity),
        authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
});
```

## 자주 쓰는 패턴
- **클라이언트 시드**: 시작 시(운영은 별도 스크립트) `IOpenIddictApplicationManager.CreateAsync` 로 ClientId·Secret·Permissions 를 등록한다.
- **사용자 로그인 플로**: Authorization Code + PKCE 를 켜고, 인가 엔드포인트 passthrough 에서 ASP.NET Core Identity 로그인 쿠키를 확인한 뒤 사용자 클레임으로 `SignIn` 한다.
- **운영 키**: 개발용 인증서 대신 X.509 인증서를 `AddSigningCertificate`·`AddEncryptionCertificate` 로 등록하고 키 롤오버를 계획한다.
- **토큰 정리**: 만료 토큰·권한 부여 레코드는 Quartz.NET 연동(`OpenIddict.Quartz`)으로 주기 정리한다.
- **API 보호**: 별도 API 프로젝트는 `AddValidation()` 에 발급자 URL 을 설정하고 `[Authorize]` 를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: .NET 앱이 직접 OIDC 제공자가 되어야 할 때, 로그인 UI·사용자 모델을 완전히 통제하고 싶을 때, 외부 IdP 제품을 운영하기 부담스러울 때.
- 피할 때(대안): 관리 콘솔·사용자 관리까지 갖춘 서버가 필요하면 [Keycloak](/develop-wiki/backend/auth/keycloak/), 로그인만 외부 IdP 에 맡기면 ASP.NET Core 기본 `AddOpenIdConnect`·`AddJwtBearer` 로 충분하다.

## 공식 문서
- [문서](https://documentation.openiddict.com/) · [서버 만들기 가이드](https://documentation.openiddict.com/guides/getting-started/creating-your-own-server-instance) · [샘플](https://github.com/openiddict/openiddict-samples) · [릴리스](https://github.com/openiddict/openiddict-core/releases)
- 언어: [C#](/develop-wiki/languages/csharp/) · 프레임워크: [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/) · 저장소: [Entity Framework Core](/develop-wiki/backend/orm-query/entity-framework-core/) · 개념: [OAuth 2.0·OIDC](/develop-wiki/backend/auth/oauth-oidc/)
