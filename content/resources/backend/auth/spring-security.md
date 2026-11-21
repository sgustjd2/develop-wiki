---
name: Spring Security
url: https://spring.io/projects/spring-security
docs: https://docs.spring.io/spring-security/reference/
repo: https://github.com/spring-projects/spring-security
stars: 9668
domain: backend
category: auth
description: Spring 애플리케이션의 인증·인가 프레임워크. 서블릿 필터 체인으로 폼 로그인, OAuth2 로그인, JWT 리소스 서버, 메서드 권한 검사를 구성할 때 쓴다.
pricing: oss
tags: [java, kotlin, spring, oauth2, jwt]
languages: [java, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Spring Security 는 Spring 기반 애플리케이션의 표준 보안 프레임워크다. 요청이 컨트롤러에 닿기 전에 **SecurityFilterChain**(서블릿 필터 묶음)이 인증 정보를 추출·검증하고, URL·메서드 단위 권한을 검사하며, CSRF·세션 고정·보안 헤더 같은 공격 방어를 기본으로 켠다. OAuth2 클라이언트(소셜·OIDC 로그인), 리소스 서버(JWT·불투명 토큰 검증), 패스키(WebAuthn), 일회용 토큰 로그인을 지원하고, 별도 프로젝트 Spring Authorization Server 로 인가 서버도 만들 수 있다.

**버전(2026-11)**: 최신 안정판은 **7.1.2**(7.0.x 도 패치 유지, 7.2 는 RC). 7.x 는 Spring Framework 7·[Spring Boot](/develop-wiki/backend/web-framework/spring-boot/) 4 와 함께 쓰며, 6.x 에서 경고하던 `and()` 체이닝 등 옛 구성 방식을 제거하고 람다 DSL 만 남겼다.

## 설치
Spring Boot 4(Gradle Kotlin DSL) 기준.
```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server") // JWT API 일 때
}
```
스타터만 추가해도 모든 엔드포인트가 보호되고, 임시 사용자 비밀번호가 로그에 출력된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `SecurityFilterChain` | `HttpSecurity` 로 만드는 필터 체인 빈. 경로별로 여러 개 둘 수 있다 |
| `Authentication` | 인증 주체와 권한(`GrantedAuthority`). `SecurityContextHolder` 에 저장 |
| `AuthenticationManager` / Provider | 자격 증명 검증 담당. `UserDetailsService` + `PasswordEncoder` 조합 |
| `authorizeHttpRequests` | URL 패턴별 접근 규칙(`permitAll`, `hasRole`, `authenticated`) |
| 메서드 보안 | `@EnableMethodSecurity` + `@PreAuthorize("hasRole('ADMIN')")` |
| OAuth2 Login / Resource Server | `oauth2Login()`(브라우저 로그인), `oauth2ResourceServer().jwt()`(API 토큰 검증) |
| `PasswordEncoder` | `PasswordEncoderFactories.createDelegatingPasswordEncoder()` — 기본 bcrypt |

## 기본 사용법
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {
    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health", "/public/**").permitAll()
                .requestMatchers("/admin/**").hasAuthority("SCOPE_admin")
                .anyRequest().authenticated())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
```
```yaml
# application.yml — 발급자(예: Keycloak realm)의 JWKS 로 JWT 서명 검증
spring.security.oauth2.resourceserver.jwt.issuer-uri: http://localhost:8080/realms/myrealm
```

## 자주 쓰는 패턴
- **역할 매핑**: IdP 마다 역할 클레임 위치가 다르므로 `JwtAuthenticationConverter` 로 클레임을 `GrantedAuthority` 로 변환한다([Keycloak](/develop-wiki/backend/auth/keycloak/) 은 `realm_access.roles`).
- **브라우저 앱 vs API**: 세션 기반 웹앱은 CSRF 를 켜 두고, 토큰 기반 무상태 API 는 별도 체인에서 세션을 끈다. `securityMatcher` 로 체인을 경로별로 나눈다.
- **테스트**: `spring-security-test` 의 `@WithMockUser`, MockMvc `jwt()` 요청 후처리기로 인증 상태를 흉내 낸다.
- **패스키**: `http.webAuthn(...)` 로 WebAuthn 등록·로그인 엔드포인트를 켠다(rpId·허용 origin 설정 필요).
- **인가 서버 구축**: 자체 OAuth2 서버가 필요하면 Spring Authorization Server 를 함께 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Spring Boot 기반 모든 서비스의 인증·인가 계층, OIDC 로그인이나 JWT 검증을 표준 방식으로 구성할 때.
- 피할 때(대안): 사용자 관리·SSO 서버 자체가 필요하면 Keycloak 같은 IdP 와 함께 쓰고, 비 Spring JVM(Quarkus, Micronaut)은 각 프레임워크의 보안 모듈을 쓴다.

## 공식 문서
- [레퍼런스](https://docs.spring.io/spring-security/reference/) · [서블릿 아키텍처](https://docs.spring.io/spring-security/reference/servlet/architecture.html) · [OAuth2 리소스 서버(JWT)](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html) · [패스키](https://docs.spring.io/spring-security/reference/servlet/authentication/passkeys.html)
