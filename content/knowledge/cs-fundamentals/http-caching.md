---
title: 웹 캐싱 (HTTP 캐시 헤더·CDN)
aka: [HTTP Caching, Cache-Control, ETag, Conditional Request, 304 Not Modified, Vary, CDN, stale-while-revalidate, Cache Busting]
category: cs-fundamentals
group: web
level: intermediate
summary: 브라우저·CDN·프록시가 HTTP 응답을 저장하고 재사용하는 규칙. Cache-Control 로 신선도를, ETag 로 재검증을, URL 해시로 무효화를 다룬다.
tags: [web, http, cache, cdn, performance, etag]
related: [performance/caching-strategies, cs-fundamentals/http-versions, cs-fundamentals/same-origin-policy, cs-fundamentals/dns]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  - https://www.rfc-editor.org/rfc/rfc9111.html
  - https://www.rfc-editor.org/rfc/rfc5861.html
updatedAt: 2026-11-18
---

> 서버 쪽 애플리케이션 캐시(cache-aside, write-through, 스탬피드)는 [캐싱 전략과 무효화](/develop-wiki/knowledge/performance/caching-strategies/) 에 있다. 여기서는 **HTTP 프로토콜 수준의 캐시**를 다룬다.

## 캐시의 위치

```
브라우저(private cache) ── 프록시 ── CDN 엣지(shared) ── 리버스 프록시(shared) ── 오리진
   사용자 1명 전용                  여러 사용자가 공유 → 개인화 응답 저장 금지
```

## 신선도: 다시 묻지 않고 쓸 수 있는 기간

| 지시어 | 의미 |
| --- | --- |
| `max-age=N` | 생성 후 N초 동안 신선 |
| `s-maxage=N` | 공유 캐시(CDN)에만 적용되는 max-age (RFC 9111) |
| `no-cache` | 저장은 하되, **쓸 때마다 재검증** |
| `no-store` | 저장 금지 (bfcache 등도 꺼짐) |
| `private` | 브라우저만 저장, CDN 저장 금지 |
| `public` | `Authorization` 이 있는 응답도 공유 캐시 저장 허용 (그 경우에만 필요) |
| `immutable` | 내용이 절대 안 바뀜 → 새로고침에도 재검증 안 함 |
| `stale-while-revalidate=N` | 만료 후 N초 동안은 낡은 응답을 주면서 뒤에서 갱신 (RFC 5861) |
| `stale-if-error=N` | 오리진 오류(5xx) 시 N초까지 낡은 응답 사용 (RFC 5861) |

`Cache-Control` 이 없으면 캐시가 **휴리스틱**으로 저장할 수 있다(흔히 `Last-Modified` 이후 경과 시간의 10%). 의도치 않은 캐싱을 막으려면 항상 명시한다.

## 재검증: 바뀌었는지 묻기

```http
GET /app.css
If-None-Match: "v42"          ← 가지고 있던 ETag

HTTP/1.1 304 Not Modified     ← 본문 없음, 캐시본의 신선도만 갱신
ETag: "v42"
Cache-Control: no-cache
```

- `ETag`/`If-None-Match` 가 `Last-Modified`/`If-Modified-Since` 보다 우선한다. 날짜는 서버 간 시계 차이에 약하다.
- 여러 서버가 같은 파일에 서로 다른 ETag 를 만들면(inode 기반 등) 재검증이 매번 실패한다.

## Vary: 캐시 키 넓히기

기본 캐시 키는 URL 이다. `Vary: Accept-Encoding` 이면 gzip/br 버전을 따로 저장한다. MDN 은 `Vary: User-Agent` 는 변형이 너무 많아 피하고, 쿠키로 개인화된 응답은 `Vary: Cookie` 대신 `private` 을 쓰라고 권한다.

## 검증된 기본 전략

| 리소스 | 헤더 | 이유 |
| --- | --- | --- |
| 해시가 붙은 정적 파일 `app.3f9a1c.js` | `public, max-age=31536000, immutable` | 내용이 바뀌면 URL 이 바뀜 (캐시 버스팅) |
| HTML (진입점) | `no-cache` (+ ETag) | URL 을 못 바꾸므로 매번 재검증 |
| 개인화 API 응답 | `private, no-cache` 또는 `no-store` | CDN 에 남으면 다른 사용자에게 노출 |
| 공개 API (목록 등) | `public, s-maxage=60, stale-while-revalidate=300` | CDN 이 흡수, 오리진 부하 감소 |

```ts
// Express 예: 빌드 산출물과 HTML 에 다른 정책
app.use('/assets', express.static('dist/assets', { immutable: true, maxAge: '1y' }));
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile('dist/index.html', { root: '.' });
});
```

## 개발자에게 왜 중요한가

- **배포 후 "옛 화면이 보여요"**: HTML 이 오래 캐시되어 옛 JS 를 가리키는 경우가 대부분이다. HTML 은 `no-cache`, 자산은 해시+장기 캐시.
- **개인정보 사고**: 로그인 사용자 응답이 CDN 에 캐시되면 다른 사용자에게 그대로 나간다. 인증이 필요한 응답의 기본값을 `private` 으로 둔다.
- **CDN 무효화(purge)는 최후 수단**: 전파에 시간이 걸리고 비용이 든다. URL 버전 관리가 먼저다.

## 주의 (비용)

- `no-cache` 는 "캐시 안 함"이 아니다. 저장 금지는 `no-store`. 반대로 `no-store` 는 뒤로 가기 캐시(bfcache)까지 꺼서 체감 성능을 떨어뜨린다.
- CDN 마다 `Cache-Control` 해석, 쿠키·쿼리스트링 처리, 기본 TTL 이 다르다. 공급자 문서로 실제 캐시 키를 확인한다.
- 오래 캐시할수록 잘못된 응답(오류 페이지, 잘못된 CORS 헤더)도 오래 남는다. 오류 응답의 캐시 정책도 정한다.
