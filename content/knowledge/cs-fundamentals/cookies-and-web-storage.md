---
title: 쿠키·세션·웹 스토리지
aka: [Cookie, Session, localStorage, sessionStorage, IndexedDB, SameSite, HttpOnly, Storage Quota]
category: cs-fundamentals
group: web
level: beginner
summary: 브라우저가 상태를 기억하는 방법들. 쿠키는 요청마다 서버로 자동 전송되고, Web Storage·IndexedDB 는 스크립트만 읽는다. 전송 범위·수명·용량·보안 속성이 서로 다르다.
tags: [web, browser, cookie, session, storage, indexeddb, security]
related: [cs-fundamentals/same-origin-policy, cs-fundamentals/tls-https, security/session-vs-jwt, security/csrf, security/xss]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
  - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
  - https://web.dev/articles/samesite-cookies-explained
updatedAt: 2026-11-18
---

> 로그인 상태를 서버 세션으로 둘지 JWT 로 둘지는 [서버 세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/) 에서 다룬다. 여기서는 **브라우저 저장소 자체의 동작**을 정리한다.

## 비교

| | 쿠키 | localStorage | sessionStorage | IndexedDB |
| --- | --- | --- | --- | --- |
| 서버로 자동 전송 | **예** (조건 맞는 모든 요청) | 아니오 | 아니오 | 아니오 |
| JS 접근 | 가능 (`HttpOnly` 면 불가) | 가능 | 가능 | 가능 |
| 범위 | 도메인·경로 (출처보다 넓을 수 있음) | 출처 | 출처 + 탭 | 출처 |
| 수명 | `Max-Age`/`Expires`, 없으면 세션 | 지울 때까지 | 탭 닫으면 삭제 | 지울 때까지(축출 가능) |
| 용량 | 쿠키당 약 4KB | 출처당 약 5MiB | 출처당 약 5MiB | 디스크 비율 기반 (수 GB) |
| API | 헤더 / `document.cookie` | 동기 | 동기 | 비동기, 트랜잭션 |

## 쿠키 속성 (MDN)

| 속성 | 의미 | 권장 |
| --- | --- | --- |
| `Max-Age` / `Expires` | 수명. 둘 다 있으면 `Max-Age` 우선 | `Max-Age` 사용 |
| `Domain` | 지정하면 하위 도메인에도 전송, 생략하면 설정한 호스트만 | 꼭 필요할 때만 지정 |
| `Path` | 경로 일치 시 전송 | **보안 경계가 아님** |
| `Secure` | HTTPS 에서만 전송 | 항상 |
| `HttpOnly` | JS 에서 못 읽음 → XSS 로 세션 탈취를 어렵게 | 세션 쿠키는 항상 |
| `SameSite` | 교차 사이트 요청에 보낼지: `Strict` / `Lax` / `None`(`Secure` 필수) | 기본 `Lax` |
| `__Host-` 접두사 | `Secure` + `Path=/` + `Domain` 없음을 강제 → 한 호스트에 고정 | 세션 쿠키에 권장 |

```http
Set-Cookie: __Host-sid=3f9a…; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
```

`SameSite` 를 생략했을 때 `Lax` 로 취급하는 브라우저도 있지만(Chrome 80 부터) 모든 브라우저가 그런 것은 아니다. **명시한다.**

## 세션이란

HTTP 는 상태가 없다. "세션"은 서버가 상태를 기억하고, 브라우저는 그 열쇠(세션 ID)만 쿠키로 들고 다니는 방식이다.

```
1. POST /login        ──▶ 서버: 세션 저장소에 {sid: abc, user: 42} 저장
2. ◀── Set-Cookie: __Host-sid=abc; HttpOnly; Secure; SameSite=Lax
3. GET /me (Cookie: __Host-sid=abc) ──▶ 서버: abc 로 조회 → user 42
```

## 개발자에게 왜 중요한가

- **토큰을 localStorage 에 두면** XSS 한 번으로 그대로 읽힌다. `HttpOnly` 쿠키는 읽히지 않지만 자동 전송되므로 CSRF 를 고려해야 한다(`SameSite`, CSRF 토큰). [CSRF](/develop-wiki/knowledge/security/csrf/), [XSS](/develop-wiki/knowledge/security/xss/) 참고.
- **쿠키는 매 요청 비용**: 이미지·정적 파일 요청에도 붙는다. 큰 쿠키를 넣지 말고, 정적 리소스는 쿠키 없는 도메인으로 분리하기도 한다.
- **localStorage 는 동기 API**: 큰 데이터를 자주 읽고 쓰면 메인 스레드를 막는다. 구조화된 큰 데이터는 IndexedDB.
- **용량 초과**: 쓰기에서 `QuotaExceededError` 가 난다. `try/catch` 로 감싼다.

```ts
function saveDraft(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // 오래된 초안을 지우거나 IndexedDB 로 옮긴다
    } else throw e;
  }
}
```

## 축출 (MDN)

- 기본은 **best-effort**: 디스크 압박이 오면 브라우저가 가장 오래 안 쓴 출처의 데이터를 통째로 지운다(LRU).
- `navigator.storage.persist()` 로 **persistent** 를 요청하면 사용자가 지우지 않는 한 유지된다.
- Safari 는 추적 방지가 켜져 있으면 7일간 사용자 상호작용이 없는 출처의 스크립트 저장 데이터를 지운다(서버가 설정한 쿠키는 예외).

## 언제 무엇을

- 인증 상태: `HttpOnly; Secure; SameSite` 쿠키.
- UI 설정(테마, 접힘 상태) 같은 작은 비민감 값: localStorage.
- 탭별 임시 상태(폼 단계): sessionStorage.
- 오프라인 데이터·큰 캐시: IndexedDB(+ Cache API).

## 주의

- 클라이언트 저장소에 있는 값은 사용자가 바꿀 수 있다. 권한·가격 같은 판단은 서버에서 다시 한다.
- 서드파티 쿠키는 브라우저마다 차단 정책이 다르고 계속 바뀐다. 임베드 위젯·SSO 흐름이 의존한다면 브라우저별로 확인한다.
- 같은 사이트의 다른 하위 도메인이 `Domain` 이 넓은 쿠키를 덮어쓸 수 있다(쿠키 토싱). `__Host-` 접두사가 이를 막는다.
