---
title: 오프라인 outbox 큐와 Background Sync API
aka: [Offline Outbox Queue, Background Synchronization API, SyncManager, SyncEvent, Workbox Background Sync, 오프라인 전송 대기열]
category: ui-ux
group: patterns
level: advanced
summary: 오프라인에서 만든 변경을 클라이언트 outbox 에 쌓았다가 연결되면 순서대로 보내는 설계와, 이를 서비스 워커에서 깨워 주는 Background Sync API 의 동작·브라우저 지원 범위(Chromium 계열만)·대체 경로.
tags: [offline, pwa, service-worker, background-sync, outbox, idempotency, patterns]
related: [ui-ux/offline-conflict-resolution-ux, ui-ux/multi-tab-sync-draft-restore, ui-ux/loading-states, ui-ux/toast-notification-banner, ui-ux/error-messages, mobile-dev/offline-first-sync, mobile-dev/optimistic-ui-eventual-consistency, distributed-systems/idempotency]
sources:
  - https://wicg.github.io/background-sync/spec/
  - https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
  - https://github.com/mdn/browser-compat-data/blob/main/api/SyncManager.json
  - https://developer.chrome.com/docs/workbox/modules/workbox-background-sync
updatedAt: 2026-11-19
---

충돌이 났을 때의 화면은 [오프라인 충돌 해결 UX](/develop-wiki/knowledge/ui-ux/offline-conflict-resolution-ux/)에 있다. 이 노트는 그 앞 단계, **보내지 못한 변경을 어디에 두고 언제 다시 보내는가**를 다룬다. 모바일 네이티브 쪽은 [오프라인 우선 동기화](/develop-wiki/knowledge/mobile-dev/offline-first-sync/) 참고.

## 문제

- 오프라인에서 "저장"을 누르면 요청이 실패한다. 실패를 그대로 보여 주면 사용자가 다시 입력해야 한다.
- 탭을 닫으면 메모리에 있던 재시도 로직도 사라진다.
- 재시도가 겹치면 같은 생성 요청이 두 번 들어가 중복 레코드가 생긴다.

## 해법

### 1. outbox: 보낼 변경을 영속 큐에 쌓는다

- 변경마다 `{ id(멱등 키), 요청, base 버전, 시도 횟수, 상태 }` 를 IndexedDB 에 저장한다. 화면은 로컬 상태로 즉시 반영한다(낙관적 UI).
- 서버는 `id` 를 멱등 키로 받아 같은 요청을 한 번만 처리한다([멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/)). 재시도 중복은 이걸로 막는다.
- **앞 항목이 네트워크 오류면 뒤 항목도 멈춘다.** 같은 레코드에 대한 생성→수정 순서가 뒤집히지 않게 하기 위해서다.
- 4xx(검증 실패 등)는 재시도해도 같은 결과이므로 `failed` 로 빼고 사용자에게 보여 준다. 408·429·5xx·네트워크 오류만 재시도.

```ts
type Item = { id: string; url: string; method: string; body: unknown; attempts: number; status: 'pending' | 'done' | 'failed' };

async function flush(queue: Item[], send: (i: Item) => Promise<Response>): Promise<boolean> {
  for (const item of queue.filter((i) => i.status === 'pending')) {
    item.attempts++;
    try {
      const res = await send(item);                     // Idempotency-Key: item.id 헤더 포함
      if (res.ok) item.status = 'done';
      else if (res.status >= 400 && res.status < 500 && ![408, 429].includes(res.status)) item.status = 'failed';
      else return false;                                // 일시 오류: 순서 유지 위해 여기서 멈춤
    } catch { return false; }                           // 네트워크 오류
  }
  return true;
}
```

- 확인한 동작(Node 24, 메모리 큐와 가짜 `send`): a·b·c 세 항목에서 b 가 네트워크 오류면 1차 flush 는 `a:done b:pending c:pending(시도 0)` 으로 멈추고, 2차 flush 에서 b 는 성공, c 는 422 로 `failed`. IndexedDB 저장은 이 확인에 포함하지 않았다.

### 2. Background Sync API: 서비스 워커를 깨워 flush

```ts
// 페이지: 큐에 넣은 뒤 등록 (같은 tag 는 하나로 합쳐진다)
const reg = await navigator.serviceWorker.ready;
if ('sync' in reg) await reg.sync.register('outbox');
else window.addEventListener('online', () => flushFromPage(), { once: true });

// 서비스 워커
self.addEventListener('sync', (e: any) => {
  if (e.tag === 'outbox') e.waitUntil(flushOrThrow()); // false 면 throw → UA 가 나중에 재시도
});
```

WICG 사양에서 확인한 동작:

- 상태는 pending → firing → (실패 시) waiting → pending. **재시도 시점과 횟수는 브라우저가 정한다**(사양 표현: user agent defined heuristics). 앱이 간격을 지정할 수 없다.
- `waitUntil` 프라미스가 거부되거나 워커가 종료되면 실패로 보고 재시도한다. `SyncEvent.lastChance` 가 true 인 시도가 실패하면 등록이 삭제된다. 이때는 큐를 지우지 말고 "보내지 못함" 상태를 남긴다.
- 같은 tag 를 다시 `register()` 하면 새로 만들지 않고 기존 등록을 갱신한다.
- 활성 워커가 없으면 `InvalidStateError`, 권한("background-sync")이 꺼져 있으면 `NotAllowedError` 로 거부된다. 사양은 사용자가 끌 수 있게 하되 기본은 켜짐으로 둔다.
- 사양은 W3C 표준 트랙이 아닌 WICG 커뮤니티 그룹 초안(2021-11-10판)이다. MDN 은 "Limited availability"로 표시한다. 보안 컨텍스트(HTTPS)에서만 동작한다.

### 3. 브라우저 지원 (MDN browser-compat-data, 2026-11-19 확인)

| 환경 | `SyncManager` |
| --- | --- |
| Chrome·Edge·Opera·Samsung Internet (데스크톱·Android) | 지원 (Chrome 49부터) |
| Firefox (데스크톱·Android) | 미지원 |
| Safari (macOS·iOS) | 미지원 |
| Android WebView | 미지원 |

**지원 브라우저가 일부뿐이므로 Background Sync 는 "있으면 빨라지는 보조 수단"으로만 쓴다.** 기본 경로는 페이지에서의 flush 다.

- 대체 트리거: 앱 시작, `online` 이벤트, 탭이 다시 보일 때(`visibilitychange`), 사용자의 "다시 시도" 버튼.
- Workbox `workbox-background-sync` 는 요청을 IndexedDB 큐에 넣고, 미지원 브라우저에서는 서비스 워커가 시작될 때 재생한다. 문서는 이 대체 경로가 네이티브보다 덜 효과적이라고 밝힌다. `maxRetentionTime`(분 단위)을 넘긴 항목은 버린다.

### 4. 화면

- 항목별 상태 표시: "전송 대기 3건", 항목 옆 대기 아이콘. 저장 완료처럼 보이게 하지 않는다.
- 대기 중 탭을 닫으려 하면 경고할지 결정한다(Background Sync 미지원 환경에서는 탭을 닫으면 다음 방문까지 전송되지 않는다).
- `failed` 항목은 이유와 함께 "수정 후 다시 보내기 / 버리기"를 준다([에러 메시지](/develop-wiki/knowledge/ui-ux/error-messages/)).
- 전송 완료·실패는 [토스트·배너](/develop-wiki/knowledge/ui-ux/toast-notification-banner/)와 라이브 영역으로 알린다.
- 서버 응답이 412(버전 충돌)면 [충돌 해결 UX](/develop-wiki/knowledge/ui-ux/offline-conflict-resolution-ux/)로 넘긴다.

## 언제 쓰나

- 현장 입력, 메시지·댓글 작성, 체크리스트처럼 **쓰기**가 오프라인에서도 이어져야 하는 웹 앱.
- 읽기만 오프라인이면 캐시로 충분하다. outbox 는 필요 없다.

## 주의·비용

- 큐·멱등 키·순서·실패 처리·저장소 정리까지 구현량이 크다. 서버도 멱등 키를 저장해야 한다.
- 오래 쌓인 변경은 서버 상태와 크게 어긋난다. 보존 기한과 그 뒤 처리(폐기 또는 수동 확인)를 정한다.
- 개인정보가 담긴 요청 본문이 IndexedDB 에 남는다. 로그아웃 시 큐를 어떻게 할지(전송 후 삭제, 즉시 삭제) 정한다.
- 사양의 프라이버시 절: 사용자가 페이지를 떠난 뒤 전송되면 서버가 그 시점의 IP 를 알게 된다. 브라우저는 재시도 횟수·시간을 제한해야 한다(SHOULD).
- 테스트: Workbox 문서는 DevTools 의 Offline 체크박스가 서비스 워커 요청에는 적용되지 않으니 실제 네트워크를 끄라고 안내한다. DevTools Application 탭에서 sync 이벤트를 수동으로 보낼 수 있다.

## 검증 범위

- 확인함: 상태 전이·tag 병합·lastChance·오류 종류는 WICG 사양, 지원 범위는 MDN browser-compat-data 의 `SyncManager.json`, Workbox 대체 동작·테스트 주의는 Chrome for Developers 문서. flush 로직은 Node 에서 메모리 큐로 실행.
- 확인 못 함: Chrome 의 실제 재시도 간격·최대 횟수(사양상 구현 정의), Periodic Background Sync, 서비스 워커 예시 코드의 실기 동작.
