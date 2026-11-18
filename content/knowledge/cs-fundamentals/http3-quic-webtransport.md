---
title: HTTP/3 · QUIC · WebTransport
aka: [QUIC, HTTP/3, WebTransport, RFC 9000, RFC 9114, RFC 9221, Connection Migration, QPACK, 0-RTT, Datagram]
category: cs-fundamentals
group: network
level: advanced
summary: UDP 위에서 스트림·신뢰성·TLS 1.3·연결 이동을 제공하는 QUIC 의 내부, 그 위의 HTTP/3 매핑, 브라우저에서 스트림·데이터그램을 직접 쓰는 WebTransport.
tags: [network, quic, http3, webtransport, udp, tls, streams]
related: [cs-fundamentals/http-versions, cs-fundamentals/tcp-vs-udp, cs-fundamentals/tls-https, cs-fundamentals/websocket-sse-long-polling, cs-fundamentals/load-balancer-l4-l7, cs-fundamentals/network-layers]
sources:
  - https://www.rfc-editor.org/rfc/rfc9000.html
  - https://www.rfc-editor.org/rfc/rfc9114.html
  - https://www.rfc-editor.org/rfc/rfc9221.html
  - https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API
updatedAt: 2026-11-19
---

HTTP/1.1~3 의 비교는 [HTTP 버전](/develop-wiki/knowledge/cs-fundamentals/http-versions/)에 있다. 이 노트는 **HTTP/3 의 바탕인 QUIC 이 어떻게 동작하는지**, 그리고 그 위에서 WebSocket 의 대안으로 나온 WebTransport 를 다룬다.

## 문제

TCP 는 바이트 하나의 흐름이다. HTTP/2 가 한 연결에 여러 스트림을 올려도 TCP 는 그 구분을 모르므로 **패킷 하나가 손실되면 모든 스트림이 기다린다.** 또 TCP 핸드셰이크 뒤에 TLS 핸드셰이크가 따로 붙고, Wi-Fi 에서 LTE 로 바꾸면 IP 가 달라져 연결이 끊긴다. TCP 는 OS 커널과 중간 장비에 굳어 있어 고치기도 어렵다.

## 해법: QUIC (RFC 9000)

UDP 데이터그램 위에, 사용자 공간에서 구현하는 전송 프로토콜. TLS 1.3(RFC 9001)과 손실 복구·혼잡 제어(RFC 9002)가 한 묶음이다.

### 스트림

- 한 연결 안에 스트림 여러 개. **스트림별로 순서·재전송**을 관리해서 한 스트림의 손실이 다른 스트림을 막지 않는다. 스트림 사이의 바이트 순서는 보장하지 않는다.
- 스트림 ID 의 하위 2비트가 종류를 정한다: 클라이언트 시작 양방향(0x00), 서버 시작 양방향(0x01), 클라이언트 시작 단방향(0x02), 서버 시작 단방향(0x03).
- **흐름 제어**가 두 층이다: 스트림별(`MAX_STREAM_DATA`)과 연결 전체(`MAX_DATA`). 동시에 열 수 있는 스트림 수도 `MAX_STREAMS` 로 제한한다.

### 연결 ID 와 이동

- 연결은 IP·포트가 아니라 **Connection ID** 로 식별한다. 네트워크가 바뀌어도(NAT 재바인딩, Wi-Fi→셀룰러) 같은 연결을 이어 간다.
- 새 경로는 `PATH_CHALLENGE`/`PATH_RESPONSE` 로 검증한다. v1 에서는 **클라이언트만** 이동을 시작한다.
- 로드 밸런서는 ID 를 보고 같은 백엔드로 보내야 하므로 ID 에 라우팅 정보를 담는 설계가 쓰인다([L4/L7](/develop-wiki/knowledge/cs-fundamentals/load-balancer-l4-l7/)).

### 핸드셰이크와 보안

- 전송 핸드셰이크와 TLS 1.3 이 합쳐져 신규 연결도 **1-RTT**. 이전에 연결한 서버에는 **0-RTT** 로 첫 요청을 바로 보낼 수 있지만 **재전송 공격에 안전하지 않다**(멱등한 요청만, [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/)).
- 주소 검증 전에 서버는 받은 양의 **3배까지만** 보낸다(증폭 공격 방지). Retry 토큰으로 검증을 강제할 수 있다.
- 헤더 대부분과 페이로드가 암호화돼 중간 장비가 손대기 어렵다. 이는 프로토콜 진화에는 이득이나, 네트워크 관측·디버깅은 어려워진다.
- 유휴 타임아웃은 양쪽이 광고한 `max_idle_timeout` 중 작은 값. 상태를 잃은 서버는 **stateless reset** 으로 상대에게 알린다.

## HTTP/3 (RFC 9114)

- 요청-응답 하나가 **클라이언트 시작 양방향 QUIC 스트림 하나**를 쓴다(스트림 0, 4, 8 …).
- 연결당 단방향 스트림이 제어용으로 쓰인다: 제어 스트림(`SETTINGS` 가 첫 프레임), QPACK 인코더/디코더 스트림, 푸시 스트림.
- **QPACK**: HPACK 은 헤더 블록이 순서대로 도착해야 해서 QUIC 에서 HOL 블로킹을 만든다. QPACK 은 테이블 갱신을 별도 스트림으로 보내고 요청 스트림은 그 상태를 참조만 한다.
- 발견: TLS 의 ALPN `h3`, 또는 기존 연결의 `Alt-Svc: h3=":443"`. **UDP 가 막히면 TCP 로 폴백**해야 한다(표준 권고).
- 서버 UDP 포트는 임의로 정할 수 있다. 종료는 `GOAWAY` 로 우아하게.

## WebTransport

브라우저 API(`new WebTransport(url)`)로 HTTP/3 연결 위에서 **다중 스트림 + 데이터그램**을 직접 쓴다. MDN 은 최신 브라우저 전반에서 사용 가능한(Baseline) 기능으로 표시한다. 단, 일부 기능은 지원이 다를 수 있어 호환성 표를 확인한다.

```ts
const wt = new WebTransport('https://example.com:4433/chat');   // https + 명시적 포트
await wt.ready;

// 신뢰성 있는 양방향 스트림
const s = await wt.createBidirectionalStream();
const w = s.writable.getWriter();
await w.write(new TextEncoder().encode('hello'));
await w.close();

// 신뢰성 없는 데이터그램: 유실·순서 뒤바뀜 허용 (RFC 9221)
const dg = wt.datagrams.writable.getWriter();
await dg.write(new Uint8Array([1, 2, 3]));
```

- 데이터그램은 **재전송하지 않지만 혼잡 제어는 받는다.** 흐름 제어 대상이 아니라 수신 측이 자원이 모자라면 버릴 수 있다(RFC 9221). 최대 크기는 경로 MTU 에 묶인다.
- 스트림마다 우선순위를 줄 수 있고, 워커에서도 쓸 수 있다.

| | WebSocket | WebTransport |
| --- | --- | --- |
| 전송 | TCP (HTTP/1.1·2 업그레이드) | HTTP/3 (QUIC) |
| 스트림 | 연결당 메시지 흐름 1개 | 다중 스트림(단·양방향) |
| 비신뢰 전송 | 없음 | 데이터그램 |
| HOL 블로킹 | 있음(TCP) | 스트림별로 격리 |
| 연결 이동 | 불가 | 가능 |
| 서버 생태계 | 매우 성숙 | 아직 얇음 |

## 언제 쓰나

- **HTTP/3**: 모바일·손실 많은 망의 웹. CDN 에서 켜면 그만이다. 클라이언트는 폴백한다.
- **WebTransport**: 게임 상태, 실시간 미디어 조각, 최신 값만 의미 있는 텔레메트리(데이터그램), 한 연결에서 독립 스트림 여러 개. 단순 채팅·알림은 [WebSocket·SSE](/develop-wiki/knowledge/cs-fundamentals/websocket-sse-long-polling/)로 충분하다.

## 주의 (비용)

- UDP 를 막거나 제한하는 기업망·방화벽이 있다. 폴백 경로를 항상 둔다.
- 사용자 공간 구현이라 CPU 사용량이 TCP 보다 높을 수 있다(대량 송신 최적화가 아직 TCP 만큼 성숙하지 않은 환경도 있다).
- 0-RTT 는 재전송 가능성 때문에 부작용 있는 요청에 쓰지 않는다.
- 로드 밸런서·WAF·관측 도구가 QUIC 을 이해하는지 확인한다. UDP 5-tuple 해시만 쓰는 L4 는 연결 이동 때 다른 서버로 보낼 수 있다.
- WebTransport 는 HTTPS 보안 컨텍스트 전용이고 서버 구현(HTTP/3 + WebTransport 핸드셰이크)을 직접 갖춰야 한다. 자체 서명 인증서 개발 환경은 `serverCertificateHashes` 옵션 지원 여부를 브라우저별로 확인한다(이 노트에서 직접 검증하지 못함).
