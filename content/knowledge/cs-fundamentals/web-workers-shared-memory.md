---
title: Web Worker · SharedArrayBuffer · Atomics
aka: [Web Workers, Dedicated Worker, Shared Worker, SharedArrayBuffer, Atomics, Transferable, structuredClone, Cross-Origin Isolation, Atomics.wait, Atomics.waitAsync]
category: cs-fundamentals
group: web
level: advanced
summary: 브라우저에서 메인 스레드 밖의 스레드로 계산을 돌리는 Web Worker 와, 복사 대신 메모리를 공유하는 SharedArrayBuffer·Atomics 의 사용법·격리 조건·비용.
tags: [web, worker, sharedarraybuffer, atomics, concurrency, cross-origin-isolation, performance]
related: [cs-fundamentals/event-loop, cs-fundamentals/memory-model-atomics, cs-fundamentals/process-thread, cs-fundamentals/csp-security-headers, cs-fundamentals/webassembly-execution-model, cs-fundamentals/service-worker-offline-cache, cs-fundamentals/browser-rendering-pipeline]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync
updatedAt: 2026-11-19
---

## 문제

JavaScript 는 메인 스레드 하나에서 스크립트, 스타일, 레이아웃, 입력 처리를 같이 한다. 100ms 짜리 계산(이미지 처리, 파싱, 암호화)이 돌면 그동안 화면이 멈추고 클릭이 먹지 않는다. [이벤트 루프](/develop-wiki/knowledge/cs-fundamentals/event-loop/)에서 `async` 로 쪼개도 **CPU 작업은 줄지 않는다.** 다른 스레드가 필요하다.

## 해법 1: Web Worker (메시지 전달)

워커는 별도 스레드·별도 전역 객체에서 도는 스크립트다. 메인과는 `postMessage` 로만 대화한다.

```ts
// main.ts
const w = new Worker(new URL('./hash.worker.ts', import.meta.url), { type: 'module' });
w.onmessage = (e: MessageEvent<string>) => console.log('hash', e.data);
w.onerror = (e) => console.error(e.message);
w.postMessage(bigBuffer, [bigBuffer]);   // 두 번째 인자: 소유권 이전(transfer)

// hash.worker.ts
self.onmessage = async (e: MessageEvent<ArrayBuffer>) => {
  const d = await crypto.subtle.digest('SHA-256', e.data);
  self.postMessage(Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join(''));
};
```

MDN 기준 핵심:

- 워커에는 **DOM 이 없고** `window` 대신 `self` 를 쓴다. 화면 갱신은 메인에 메시지로 부탁한다.
- 메시지는 **구조화 복제(structured clone)** 로 복사된다. 순환 참조는 되지만 함수·DOM 노드는 못 보낸다.
- `ArrayBuffer` 같은 **Transferable** 은 복사 없이 소유권만 넘긴다(보낸 쪽은 사용 불가). 큰 데이터는 이게 핵심.
- 워커에서 `fetch`, WebSocket, IndexedDB, 타이머를 쓸 수 있다. 메인에서 `terminate()`, 에러는 `onerror`.

| 종류 | 누가 쓰나 | 용도 |
| --- | --- | --- |
| Dedicated | 만든 스크립트 1개 | CPU 작업 분리 |
| Shared | 같은 출처의 여러 탭·프레임 | 탭 간 공유 연결/상태(포트로 통신) |
| Service Worker | 출처 전체, 네트워크 프록시 | 오프라인·푸시. [서비스 워커](/develop-wiki/knowledge/cs-fundamentals/service-worker-offline-cache/) |

## 해법 2: SharedArrayBuffer + Atomics (메모리 공유)

메시지 복사조차 아까운 경우(게임, 비디오, WASM 스레드) 같은 메모리를 여러 스레드가 본다.

```ts
// main: 공유 버퍼를 만들어 워커에 전달 (복제가 아니라 같은 블록을 가리킴)
const sab = new SharedArrayBuffer(8);
const view = new Int32Array(sab);
worker.postMessage(sab);

// worker
self.onmessage = (e) => {
  const v = new Int32Array(e.data);
  Atomics.add(v, 0, 1);          // 원자적 증가
  Atomics.store(v, 1, 1);        // 플래그 올리기
  Atomics.notify(v, 1);          // 기다리는 쪽 깨우기
};

// main: 메인 스레드는 블로킹 wait 대신 waitAsync
const r = Atomics.waitAsync(view, 1, 0);        // view[1] 이 0 인 동안 대기
if (r.async) await r.value;                      // 'ok' | 'timed-out'
console.log(Atomics.load(view, 0));
```

- 일반 읽기·쓰기는 **레이스**다. 카운터·플래그는 `Atomics.*` 로 다룰 것. 이유는 [메모리 모델](/develop-wiki/knowledge/cs-fundamentals/memory-model-atomics/) 참고.
- `Atomics.wait` 는 스레드를 **블로킹**하므로 워커에서만 쓴다. 메인에서는 `Atomics.waitAsync` 가 Promise 를 돌려준다(MDN 은 2025년 기준 Baseline 으로 표시).
- `SharedArrayBuffer` 는 `postMessage` 로 보내도 `Transferable` 이 **아니다**. 양쪽이 같은 데이터 블록을 가리키는 별개의 객체를 갖는다.
- 크기 변경이 가능한 growable SAB(`maxByteLength`, `grow()`)가 있다. 늘리기만 하고 줄이지는 못한다.
- WebAssembly 스레드는 `new WebAssembly.Memory({ shared: true })` 로 같은 방식의 공유 메모리를 쓴다.

### 교차 출처 격리(cross-origin isolation)가 필요하다

Spectre(2018) 이후 공유 메모리는 막혔다가, 격리된 페이지에서만 다시 허용됐다. 요구 조건은 **보안 컨텍스트(HTTPS) + 격리 헤더**다.

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp      # 또는 credentialless
```

```ts
if (!crossOriginIsolated) { /* SharedArrayBuffer 불가: ArrayBuffer 복사 방식으로 폴백 */ }
```

격리되지 않으면 생성자가 숨겨지거나 `postMessage` 가 예외를 던진다. COEP 는 CORP/CORS 를 안 주는 서드파티 리소스를 막으므로 광고·위젯이 있는 사이트는 도입 비용이 크다. [CSP·보안 헤더](/develop-wiki/knowledge/cs-fundamentals/csp-security-headers/) 참고.

## 언제 쓰나

| 상황 | 선택 |
| --- | --- |
| 한 번의 무거운 계산(파싱, 압축, 해시) | Worker + transfer |
| 계산 결과를 수시로 주고받는 파이프라인 | Worker + 메시지(배치로 묶기) |
| 수 MB 를 초당 수십 번 공유(오디오, 프레임, WASM 멀티스레드) | SharedArrayBuffer + Atomics |
| 여러 탭이 한 연결·상태를 공유 | Shared Worker (또는 BroadcastChannel/Web Locks) |
| 렌더링 부담 | OffscreenCanvas 를 워커로 이전(지원 확인) |

## 주의 (비용)

- **워커는 공짜가 아니다.** 시작 비용과 스레드당 메모리가 있고, 작은 작업은 메시지 오버헤드가 더 크다. 워커 풀을 재사용한다.
- 구조화 복제는 큰 객체에서 느리다. 전송 가능 형식으로 바꿔 transfer 한다.
- 공유 메모리는 데이터 레이스·데드락을 JS 에 들여온다. 락은 `Atomics.compareExchange` 로 직접 짜야 하고, 순서 버그는 재현이 어렵다. 가능하면 메시지 방식으로 시작한다.
- 격리 헤더를 켜면 서드파티 임베드, 팝업 OAuth 흐름(opener 관계)이 깨질 수 있다. 도입 전에 영향 범위를 점검한다.
- 워커 코드는 같은 출처 정책과 자기 CSP 를 따른다(`blob:`/`data:` 워커는 생성 문서의 CSP 를 상속).
