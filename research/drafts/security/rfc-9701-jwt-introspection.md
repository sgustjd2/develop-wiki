---
title: "RFC 9701 JWT 인트로스펙션 (RFC 9701: JWT Introspection)"
aka: []
category: security
level: intermediate
summary: OAuth 2.0 토큰 인트로스펙션 응답을 JWT로 반환할 수 있도록 확장하는 사양으로, 보안이 유지된 추가적인 응답 방식을 제공한다.
tags:
  - oauth-2.0
  - jwt
  - token-introspection
related: []
sources:
  - https://www.rfc-editor.org/rfc/rfc9701.txt
  - https://datatracker.ietf.org/doc/rfc9701/
  - https://www.rfc-editor.org/info/rfc9701/
  - https://rfcinfo.com/rfc-9701/
  - https://www.rfc-editor.org/rfc/rfc9701.html
updatedAt: 2026-11-22
---

> ⚠ 로컬 모델(gemma4:26b-a4b-64k) 자동 초안 — 2026-11-22 주간 조사. 사이트에 공개되지 않았다. 공개 전 Claude Code `review-drafts` 로 원문 대조·보강이 필요하다.
> 주제(backlog): RFC 9701 JWT 인트로스펙션 (RFC 9701: JWT Introspection)

## 개요

이 명세는 인증 서버(authorization server)가 응답을 JWT로 반환할 수 있는 기능을 제공하기 위해 토큰 인트로스펙션 엔드포인트를 확장한다. (근거 1, 15)

JWT는 RFC 7519에 명시된 대로 암호학적으로 보호되어야 한다. (근거 10, 12)

JWT가 서명 및 암호화된 경우, 이는 JWT [RFC 7519]에서 정의된 Nested JWT여야 한다. (근거 13, 14)

## 인증 서버의 역할

인증 서버는 리소스 서버(resource server)를 식별하고, 인증하며, 인가(authorization)할 수 있어야 한다. (근거 2)

인증 서버는 특정 액세스 토큰에 대해 리소스 서버가 데이터를 받을 권한이 있는지 여부를 결정할 수 있어야 한다. (근거 3)

인증 서버는 토큰 인트로스펙션 엔드포인트에서 호출자를 반드시 인증해야 한다. (근거 5, 16)

인증 서버는 호출자를 인증하지 않는 인트로스펙션 요청을 거부하고 HTTP 상태 코드 400을 반환해야 한다. (근거 11)

## 리소스 서버의 요청 및 응답

리소스 서버는 Accept HTTP 헤더 필드를 'application/token-introspection+jwt'로 설정하여 JWT 인트로스펙션 응답을 요청한다. (근거 4, 8)

인증 서버는 토큰 인트로스펙션 엔드포인트에서 JWT 응답을 보낼 때, Content-Type HTTP 헤더 필드를 'application/token-introspection+jwt'로, JWT typ 헤더 파라미터를 'token-introspection+jwt'로 설정해야 한다. (근거 6)

액세스 토큰이 유효하지 않거나 만료된 경우, 인증 서버는 token_introspection 클레임의 active 멤버 값을 false로 설정해야 하며, 다른 멤버는 포함해서는 안 된다. (근거 7, 9)

## 검토용 근거 (공개 전 삭제)

1. 이 명세는 인증 서버가 응답을 JWT로 반환할 수 있는 기능을 제공하기 위해 토큰 인트로스펙션 엔드포인트를 확장한다.
   - "This specification extends the token introspection endpoint with the capability to return responses as JWTs." — https://www.rfc-editor.org/rfc/rfc9701.txt
2. 인증 서버는 리소스 서버를 식별하고, 인증하며, 권한을 부여할 수 있어야 한다.
   - "In order to process the introspection requests in a secure and privacy-preserving manner, the authorization server MUST be able to identify, authenticate, and authorize resource servers." — https://www.rfc-editor.org/rfc/rfc9701.txt
3. 인증 서버는 특정 액세스 토큰에 대해 리소스 서버가 데이터를 받을 권한이 있는지 여부를 결정할 수 있어야 한다.
   - "The AS MUST be able to determine whether an RS is the audience for a particular access token and what data it is entitled to receive; otherwise, the RS is not authorized to obtain data for the access token." — https://www.rfc-editor.org/rfc/rfc9701.txt
4. 리소스 서버는 Accept HTTP 헤더 필드를 'application/token-introspection+jwt'로 설정하여 JWT 인트로스펙션 응답을 요청한다.
   - "An RS requests a JWT introspection response by sending an introspection request with an Accept HTTP header field set to "application/token-introspection+jwt"." — https://www.rfc-editor.org/rfc/rfc9701.txt
5. 인증 서버는 토큰 인트로스펙션 엔드포인트에서 호출자를 반드시 인증해야 한다.
   - "The AS MUST authenticate the caller at the token introspection endpoint." — https://www.rfc-editor.org/rfc/rfc9701.txt
6. JWT 응답은 'application/token-introspection+jwt'라는 Content-Type과 'token-introspection+jwt'라는 typ 헤더 파라미터를 설정해야 한다.
   - "The introspection endpoint responds with a JWT, setting the Content- Type HTTP header field to "application/token-introspection+jwt" and the JWT typ ("type") header parameter to "token-introspection+jwt"." — https://www.rfc-editor.org/rfc/rfc9701.txt
7. 액세스 토큰이 유효하지 않거나 만료된 경우, 인증 서버는 token_introspection 클레임의 active 멤버 값을 false로 설정해야 한다.
   - "If the access token is invalid, expired, revoked, or not intended for the calling resource server (audience), the authorization server MUST set the value of the active member in the token_introspection claim to false and MUST NOT include other members." — https://www.rfc-editor.org/rfc/rfc9701.txt
8. 리소스 서버는 'application/token-introspection+jwt' HTTP 헤더 필드를 사용하여 JWT 인트로스펙션 응답을 요청해야 한다.
   - "An RS requests a JWT introspection response by sending an introspection request with an Accept HTTP header field set to "application /token- introspec tion+jwt"." — https://www.rfc-editor.org/info/rfc9701/
9. 액세스 토큰이 유효하지 않거나 만료된 경우, 인증 서버는 token_introspection 클레임의 active 멤버 값을 false로 설정해야 한다.
   - "If the access token is invalid, expired, revoked, or not intended for the calling resource server (audience), the authorization server MUST set the value of the active member in the token_ introspection claim to false and MUST NOT include other members." — https://www.rfc-editor.org/info/rfc9701/
10. JWT는 RFC 7519에 명시된 대로 암호학적으로 보호되어야 한다.
   - "The JWT is cryptographically secured as specified in [ RFC7519 ] ." — https://www.rfc-editor.org/info/rfc9701/
11. 인증 서버는 호출자를 인증하지 않는 인트로스펙션 요청을 거부하고 HTTP 상태 코드 400을 반환해야 한다.
   - "An AS compliant with this specification MUST refuse to serve introspection requests that don't authenticate the caller and return an HTTP status code 400." — https://www.rfc-editor.org/info/rfc9701/
12. JWT는 [RFC7519]에 명시된 대로 암호학적으로 보호되어야 한다.
   - "The JWT is cryptographically secured as specified in [RFC7519]." — https://rfcinfo.com/rfc-9701/
13. JWT가 서명 및 암호화된 경우, 이는 JWT [RFC7519]에서 정의된 Nested JWT여야 한다.
   - "If the JWT is signed and encrypted, it MUST be a Nested JWT, as defined in JWT [RFC7519]." — https://rfcinfo.com/rfc-9701/
14. JWT가 서명과 암호화가 모두 적용된 경우, 반드시 Nested JWT 형식을 따라야 한다.
   - "If the JWT is signed and encrypted, it MUST be a Nested JWT, as defined in JWT [ RFC7519 ] ." — https://www.rfc-editor.org/rfc/rfc9701.html
15. 이 사양은 OAuth 2.0 토큰 인트로스펙션에 대해 JWT로 보안이 유지되는 추가적인 응답 방식을 제안한다.
   - "This specification proposes an additional response secured by JSON Web Token (JWT) for OAuth 2.0 Token Introspection." — https://datatracker.ietf.org/doc/rfc9701/
16. 인증 서버는 호출자를 인증해야 하며, 이는 클라이언트 인증 방법이나 RS를 주체로 식별하는 별도의 액세스 토큰을 사용할 수 있다.
   - "The AS MUST authenticate the caller at the token introspection endpoint. Authentication can utilize client authentication methods or a separate access token that is issued to the RS and identifies the RS as the subject." — https://datatracker.ietf.org/doc/rfc9701/
