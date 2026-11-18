---
title: TCP vs UDP (핸드셰이크·흐름 제어·혼잡 제어)
aka: [TCP, UDP, Three-way Handshake, TIME_WAIT, Congestion Control, CUBIC, BBR, Head-of-line Blocking]
category: cs-fundamentals
group: network
level: intermediate
summary: TCP 는 연결·순서·재전송·혼잡 제어를 제공하는 신뢰성 있는 바이트 스트림, UDP 는 그런 보장 없이 데이터그램을 보내는 얇은 층. 지연·처리량·연결 관리 문제의 뿌리.
tags: [network, tcp, udp, quic, congestion-control, latency]
related: [cs-fundamentals/network-layers, cs-fundamentals/http-versions, cs-fundamentals/tls-https, cs-fundamentals/load-balancer-l4-l7]
sources:
  - https://www.rfc-editor.org/rfc/rfc9293.html
  - https://www.rfc-editor.org/rfc/rfc9438.html
  - https://www.rfc-editor.org/rfc/rfc9000.html
updatedAt: 2026-11-18
---

## 비교

| | TCP | UDP |
| --- | --- | --- |
| 연결 | 3-way 핸드셰이크로 연결 수립 | 없음 (그냥 보냄) |
| 전달 보장 | 재전송으로 보장 | 없음, 손실·중복 가능 |
| 순서 | 보장 (바이트 스트림) | 없음 |
| 메시지 경계 | 없음 (스트림이라 앱이 프레이밍) | 데이터그램 단위로 유지 |
| 흐름·혼잡 제어 | 있음 | 없음 (앱이 알아서) |
| 헤더 | 20바이트 이상 | 8바이트 |
| 쓰임 | HTTP/1.1·2, DB, SSH | DNS, 실시간 음성·게임, QUIC(HTTP/3) |

## TCP 연결의 일생 (RFC 9293)

```
클라이언트                      서버
  SYN (seq=x)        ───────▶          ┐
               ◀───────  SYN+ACK       ├ 1 RTT 후 데이터 전송 가능
  ACK                ───────▶          ┘
  ... 데이터 ...
  FIN                ───────▶  (먼저 닫는 쪽이 active close)
               ◀───────  ACK, FIN
  ACK                ───────▶
  TIME-WAIT 2×MSL 대기 (RFC 9293 은 MSL 을 2분으로 정함)
```

- **TIME-WAIT**: 먼저 닫은 쪽이 마지막 ACK 가 도착했는지 확신하고, 늦게 도착한 옛 연결의 세그먼트가 새 연결에 섞이지 않게 기다린다.
- 짧은 연결을 초당 수천 개 여닫는 클라이언트(서버에 HTTP 호출하는 앱)는 TIME-WAIT 소켓이 쌓여 **임시 포트가 고갈**될 수 있다 → 커넥션 풀·keep-alive 로 연결을 재사용한다.

## 흐름 제어와 혼잡 제어

| | 무엇을 보호 | 방법 |
| --- | --- | --- |
| 흐름 제어 | **수신자** 버퍼 | 수신 윈도(rwnd) 광고 |
| 혼잡 제어 | **네트워크** | 혼잡 윈도(cwnd) 조절, RFC 5681 의 슬로 스타트·혼잡 회피 |

- **슬로 스타트**: 새 연결은 작은 cwnd 로 시작해 ACK 마다 키운다. 그래서 새 연결은 처음 몇 RTT 동안 대역폭을 다 못 쓴다 → 연결 재사용이 중요한 이유.
- **CUBIC**(RFC 9438): 손실 후 윈도를 3차 함수 모양으로 회복한다. RFC 는 Linux·Windows·Apple 스택의 기본값이라고 적고 있다. 고대역·고지연 망에서 Reno 보다 빨리 회복한다.
- BBR 같은 지연 기반 알고리즘도 있다(손실 대신 측정한 대역폭·RTT 로 조절).

## 헤드 오브 라인 블로킹

TCP 는 순서를 보장하므로 앞 세그먼트 하나가 사라지면 뒤에 이미 도착한 데이터도 앱에 못 넘긴다. 한 TCP 연결에 여러 요청을 섞는 HTTP/2 에서 손실 하나가 모든 스트림을 멈추는 이유다. QUIC(RFC 9000)은 UDP 위에서 스트림별로 순서를 관리해 이 문제를 피한다. [HTTP 버전 비교](/develop-wiki/knowledge/cs-fundamentals/http-versions/) 참고.

## 개발자에게 왜 중요한가

```ts
// Node.js: 외부 API 호출 시 연결 재사용 (핸드셰이크·슬로 스타트 비용 절약)
import { Agent, request } from 'node:https';
const agent = new Agent({ keepAlive: true, maxSockets: 50 });
request('https://api.example.com/items', { agent }, (res) => res.resume()).end();
```

- **지연 = RTT 횟수**: TCP 1 RTT + TLS 1.3 1 RTT + 요청 1 RTT. 멀리 있는 서버에 새 연결로 요청하면 최소 3 RTT.
- **Nagle 알고리즘**: 작은 쓰기를 모아 보낸다. 대화형 프로토콜에서는 지연을 만들 수 있어 `TCP_NODELAY`(`socket.setNoDelay(true)`)를 켠다.
- **UDP 를 직접 쓰면** 재전송·순서·혼잡 제어·암호화를 모두 직접 해야 한다. 대부분은 QUIC·WebRTC 같은 검증된 라이브러리를 쓰는 편이 낫다.

## 언제 무엇을

- 기본은 TCP(또는 그 위의 HTTP). 데이터 정확성이 중요하고 구현을 단순하게 유지할 수 있다.
- UDP: 늦게 온 데이터가 쓸모없는 실시간 미디어·게임 상태, 짧은 질의/응답(DNS), 또는 QUIC 처럼 전송 계층을 사용자 공간에서 새로 만들 때.

## 주의 (비용)

- 일부 기업망·공용 Wi-Fi 는 UDP 를 막거나 제한한다. UDP 기반 프로토콜은 TCP 폴백을 준비한다(브라우저의 HTTP/3 도 그렇게 동작).
- 커널 파라미터(`tcp_tw_reuse` 등)를 인터넷 글을 보고 바꾸기 전에 연결 재사용부터 확인한다. 잘못된 튜닝은 NAT 뒤 사용자 연결을 깨기도 한다.
