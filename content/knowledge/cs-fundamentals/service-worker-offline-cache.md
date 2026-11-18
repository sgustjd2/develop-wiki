---
title: Service Worker 와 오프라인 캐시
aka: [Service Worker, Cache API, Offline First, PWA, Stale-While-Revalidate, Navigation Preload, Workbox]
category: cs-fundamentals
group: web
level: intermediate
summary: 페이지와 네트워크 사이에서 요청을 가로채는 Service Worker 의 생명주기와, Cache API 로 오프라인·빠른 로딩을 만드는 캐싱 전략, 배포 시 함정.
tags: [web, browser, pwa, service-worker, cache, offline]
related: [cs-fundamentals/http-caching, cs-fundamentals/cookies-and-web-storage, cs-fundamentals/event-loop, cs-fundamentals/browser-rendering-pipeline, performance/caching-strategies, performance/core-web-vitals]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
  - https://web.dev/articles/offline-cookbook
updatedAt: 2026-11-18
---

## 문제

- 지하철·비행기에서 앱이 공룡 화면만 띄운다.
- [HTTP 캐시](/develop-wiki/knowledge/cs-fundamentals/http-caching/)는 헤더로 "얼마나 오래"만 정할 수 있다. "네트워크가 3초 안에 안 오면 캐시로", "캐시를 먼저 보여 주고 뒤에서 갱신" 같은 **조건부 로직**은 표현할 수 없다.

## 해법: 프로그래밍 가능한 네트워크 프록시

Service Worker 는 페이지와 분리된 **별도 스레드의 워커 스크립트**로, 자기 범위(scope) 안 페이지의 모든 요청에서 `fetch` 이벤트를 받는다. DOM 에는 접근하지 못하고, 필요할 때 깨어나 일하고 쉬면 종료된다(전역 변수에 상태를 두면 사라진다).

### 생명주기

```
register() ─▶ install ─▶ (waiting) ─▶ activate ─▶ fetch/push/sync 이벤트 처리
               │           │            │
               │           │            └ 옛 캐시 정리, clients.claim()
               │           └ 옛 버전이 아직 열린 탭을 제어 중이면 대기
               └ 정적 자산 미리 캐시(precache). 하나라도 실패하면 설치 실패
```

- **처음 설치**: install → 곧바로 activate. 단, 이미 열린 페이지는 다시 로드해야 제어받는다(`clients.claim()` 으로 즉시 제어 가능).
- **업데이트**: 새 스크립트는 백그라운드에서 설치되지만, 옛 버전을 쓰는 탭이 모두 닫힐 때까지 **waiting** 상태다. `skipWaiting()` 으로 건너뛸 수 있다.
- HTTPS(보안 컨텍스트)에서만 동작. `localhost` 는 예외로 허용된다.
- 범위 기본값은 스크립트가 있는 디렉터리다. `/js/sw.js` 는 `/js/` 아래만 제어하므로 보통 루트에 `/sw.js` 로 둔다.

### 최소 예시

```ts
// sw.ts
const VERSION = 'v3';
const PRECACHE = ['/', '/app.css', '/app.js', '/offline.html'];

self.addEventListener('install', (e: ExtendableEvent) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (e: ExtendableEvent) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
});

self.addEventListener('fetch', (e: FetchEvent) => {
  if (e.request.method !== 'GET') return;            // 기본 네트워크 처리
  e.respondWith((async () => {
    const hit = await caches.match(e.request);
    if (hit) return hit;                               // 캐시 우선
    try { return await fetch(e.request); }
    catch { return (await caches.match('/offline.html'))!; } // 최후 대체
  })());
});
```

## 캐싱 전략 (Offline Cookbook)

| 전략 | 동작 | 맞는 자원 |
| --- | --- | --- |
| Cache only | 설치 때 넣은 것만 캐시에서 | 버전 고정 정적 자산 |
| Network only | 항상 네트워크 | 분석 핑, POST, 결제 |
| Cache first (→ network) | 캐시에 있으면 그것, 없으면 네트워크 | 해시가 붙은 JS/CSS, 폰트, 아이콘 |
| Network first (→ cache) | 네트워크 시도, 실패하면 캐시 | 자주 바뀌는 HTML·API. 느린 망에서는 오래 기다림 → 타임아웃을 둔다 |
| Stale-while-revalidate | 캐시를 즉시 주고 뒤에서 받아 갱신 | 최신성이 조금 늦어도 되는 것: 아바타, 목록 |
| Cache then network | 캐시로 먼저 그리고, 네트워크 결과 오면 다시 그림 (페이지 코드도 협력) | 타임라인, 기사 |
| Generic fallback | 둘 다 실패하면 오프라인 페이지·대체 이미지 | 내비게이션, 보조 이미지 |

직접 짜기보다 Workbox 같은 라이브러리로 라우트별 전략을 선언하는 경우가 많다.

## 언제 쓰나

- 오프라인·불안정한 망에서도 기본 기능이 돌아야 하는 앱(PWA, 현장 업무 앱).
- 반복 방문 로딩을 줄이고 싶을 때(앱 셸 precache).
- 푸시 알림, 백그라운드 동기화가 필요할 때(이벤트를 받을 주체가 Service Worker 다).

**쓰지 않아도 되는 경우**: 콘텐츠 사이트에서 HTTP 캐시 헤더와 CDN 으로 충분하다면, Service Worker 는 장애 지점만 하나 더 늘린다.

## 주의

- **옛 버전이 갇힌다.** 캐시 우선 HTML 을 쓰면 사용자는 새 배포를 못 본다. HTML 은 network-first 로, 자산은 파일명 해시로 관리하고, 새 버전 대기 중이면 "새로고침" 안내를 띄운다.
- `skipWaiting()` 을 무조건 쓰면 **옛 HTML 이 새 JS 를 받는** 버전 혼합이 생긴다. 청크 로딩 실패로 이어질 수 있다.
- Service Worker 스크립트 자체(`/sw.js`)는 길게 캐시하지 않는다(`Cache-Control: no-cache`). 업데이트 확인이 막힌다.
- **킬 스위치를 준비한다.** 잘못된 워커가 배포되면 사용자의 브라우저에 남는다. 같은 경로에 즉시 `unregister()` 하고 캐시를 지우는 워커를 배포할 수 있게 해 둔다.
- **민감 응답을 캐시하지 않는다.** Cache API 는 `Cache-Control: no-store` 를 따르지 않는다. 로그아웃 시 사용자별 캐시를 지운다.
- 저장 공간은 출처 단위로 IndexedDB·Cache 등과 공유하고, 저장 압박 시 브라우저가 지울 수 있다. `navigator.storage.estimate()` 로 확인하고, 꼭 필요하면 `persist()` 를 요청한다.
- 워커 기동 시간이 첫 내비게이션을 늦출 수 있다. 내비게이션 요청에는 **navigation preload** 를 켜 네트워크 요청을 병렬로 시작한다.
- 응답은 한 번만 읽을 수 있다. 캐시에 넣으면서 돌려주려면 `response.clone()` 한다. opaque 응답(no-cors 교차 출처)은 상태 코드를 알 수 없어 오류 응답이 캐시될 수 있다.
