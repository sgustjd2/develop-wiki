---
title: WebSocket·SSE·롱 폴링 비교
aka: [WebSocket, Server-Sent Events, SSE, EventSource, Long Polling, HTTP Streaming, Real-time Web, WebTransport]
category: cs-fundamentals
group: network
level: intermediate
summary: 서버가 클라이언트에 먼저 데이터를 보내야 할 때 쓰는 세 방식(롱 폴링, SSE, WebSocket)의 동작, 장단점, 고르는 기준.
tags: [web, network, websocket, sse, realtime, http]
related: [cs-fundamentals/http-versions, cs-fundamentals/tcp-vs-udp, cs-fundamentals/load-balancer-l4-l7, performance/load-balancing, performance/backpressure-load-shedding, security/cors]
sources:
  - https://www.rfc-editor.org/rfc/rfc6202.html
  - https://www.rfc-editor.org/rfc/rfc6455.html
  - https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
  - https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
updatedAt: 2026-11-18
---

## 문제

HTTP 는 클라이언트가 묻고 서버가 답하는 구조다. 채팅 메시지, 알림, 주문 상태, LLM 토큰 스트림처럼 **서버 쪽에서 생긴 일**을 바로 알려야 하면, 단순 폴링(몇 초마다 GET)은 빈 응답이 대부분이고 지연은 폴링 주기만큼 생긴다.

## 세 가지 방식

### 롱 폴링 (RFC 6202)

클라이언트가 요청을 보내면 서버가 **이벤트가 생기거나 타임아웃이 될 때까지 응답을 미룬다.** 응답을 받으면 클라이언트가 곧바로 다음 요청을 보낸다.

```ts
async function poll(cursor: string) {
  for (;;) {
    const res = await fetch(`/events?after=${cursor}`); // 서버는 최대 ~30초 붙잡음
    if (res.status === 200) {
      const { events, next } = await res.json();
      events.forEach(handle);
      cursor = next;
    } // 204(타임아웃)면 바로 재요청
  }
}
```

- 메시지마다 HTTP 헤더 전체가 오간다. 이벤트 직후 다음 요청이 도착하기 전 사이에 생긴 이벤트는 지연된다.
- RFC 6202 는 프록시 타임아웃을 피하려면 대기 시간을 30초 안팎으로 잡는 편이 안전하다고 본다.
- 장점은 **어디서나 동작한다**는 것. 특수한 프록시 설정이 필요 없다.

### SSE (Server-Sent Events)

한 번의 HTTP 응답을 끝내지 않고 `text/event-stream` 형식으로 계속 흘려보낸다. 브라우저는 `EventSource` 로 받는다. **서버 → 클라이언트 단방향**이다.

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

: keep-alive 주석
id: 42
event: order-updated
data: {"id":"o1","status":"paid"}

retry: 5000
```

```ts
const es = new EventSource('/stream', { withCredentials: true });
es.addEventListener('order-updated', (e) => render(JSON.parse(e.data)));
es.onerror = () => { /* 브라우저가 알아서 재연결함 */ };
```

- **자동 재연결**이 내장. 마지막 `id` 를 `Last-Event-ID` 요청 헤더로 보내 주므로, 서버가 그 뒤부터 이어 보낼 수 있다.
- 평범한 HTTP 라서 기존 인증 쿠키, 압축, HTTP/2 다중화를 그대로 쓴다.
- 텍스트(UTF-8)만. 바이너리는 base64 등으로 감싸야 한다.
- **HTTP/1.1 에서는 도메인당 연결 수 제한(브라우저 전체 탭 합산 약 6개)** 에 걸린다. HTTP/2 이상에서는 동시 스트림 수(기본 100 정도)로 완화된다.

### WebSocket (RFC 6455)

HTTP 요청으로 시작해 `101 Switching Protocols` 로 **같은 TCP 연결을 양방향 프레임 프로토콜로 바꾼다.**

```
GET /ws HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: <랜덤 base64>
Sec-WebSocket-Version: 13
Origin: https://app.example.com

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: <key + 고정 GUID 의 SHA-1, base64>
```

- 이후 텍스트·바이너리·ping/pong·close 프레임이 오간다. 메시지당 오버헤드가 몇 바이트로 작다.
- 클라이언트 → 서버 프레임은 반드시 마스킹한다(중간 프록시 캐시를 속이는 공격 방지).
- **재연결, 재전송, 메시지 순번, 하트비트는 직접 만들어야 한다.** 프로토콜이 주는 것은 파이프뿐이다.
- 브라우저 `WebSocket` API 는 백프레셔가 없다. 받는 속도보다 빨리 오면 메모리에 쌓인다. MDN 은 이 문제가 중요하면 WebTransport 를 권한다.

## 비교

| | 롱 폴링 | SSE | WebSocket |
| --- | --- | --- | --- |
| 방향 | 사실상 서버→클라 (보내기는 별도 요청) | 서버→클라 | 양방향 |
| 전송 | 일반 HTTP 요청 반복 | 하나의 긴 HTTP 응답 | HTTP 업그레이드 후 자체 프레임 |
| 데이터 | 아무거나 | UTF-8 텍스트 | 텍스트·바이너리 |
| 재연결·이어받기 | 직접 (커서) | **내장** (`Last-Event-ID`) | 직접 |
| 메시지당 오버헤드 | 큼 (헤더 전체) | 작음 | 가장 작음 |
| 인프라 호환 | 가장 좋음 | 좋음 (버퍼링 프록시 주의) | 업그레이드·긴 연결 지원 필요 |
| 대표 용도 | 오래된 환경, 낮은 빈도 알림 | 알림, 대시보드, LLM 토큰 스트리밍 | 채팅, 협업 편집, 게임, 양방향 RPC |

## 언제 쓰나

- **서버만 말하면 되나?** → SSE 부터 검토. 클라이언트 → 서버는 일반 `fetch` POST 로 충분한 경우가 많다.
- **양쪽이 자주, 낮은 지연으로 말하나?** (커서 위치, 게임 입력, 협업 편집) → WebSocket.
- **프록시·방화벽 환경을 통제할 수 없고 빈도가 낮나?** → 롱 폴링. 많은 라이브러리(Socket.IO 등)가 WebSocket 실패 시 롱 폴링으로 내려가는 이유다.
- 비순서·비신뢰 데이터그램이나 스트림별 백프레셔가 필요하면 WebTransport(HTTP/3 기반)를 본다. [HTTP 버전](/develop-wiki/knowledge/cs-fundamentals/http-versions/) 참고.

## 주의 (운영 비용)

- **긴 연결은 상태다.** 서버 인스턴스마다 연결이 붙어 있어 수평 확장 시 "어느 서버에 그 사용자가 붙어 있나"를 풀어야 한다(Redis pub/sub, 브로커 팬아웃). 배포·재시작 때 연결이 한꺼번에 끊기고 재연결이 몰린다 → 재연결에 지터를 넣는다.
- L7 로드 밸런서·프록시의 idle 타임아웃보다 짧은 주기로 하트비트(SSE 주석 줄, WebSocket ping)를 보낸다. [L4/L7 로드 밸런서](/develop-wiki/knowledge/cs-fundamentals/load-balancer-l4-l7/) 참고.
- SSE 는 Nginx 같은 프록시의 응답 버퍼링을 꺼야 실시간으로 흐른다(`X-Accel-Buffering: no` 등). 압축 미들웨어가 버퍼링하는 경우도 있다.
- **WebSocket 은 CORS 를 적용받지 않는다.** 서버가 핸드셰이크의 `Origin` 을 직접 검사하지 않으면 다른 사이트가 쿠키를 실은 연결을 열 수 있다(Cross-Site WebSocket Hijacking).
- 인증은 연결 시점에만 검사하기 쉽다. 토큰 만료·권한 회수 시 연결을 끊는 로직을 둔다.
- 열린 WebSocket 이 있는 페이지는 bfcache 에 들어가지 못할 수 있다. 페이지를 떠날 때 닫는다.
