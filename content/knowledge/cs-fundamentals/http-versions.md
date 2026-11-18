---
title: HTTP/1.1 · HTTP/2 · HTTP/3 비교
aka: [HTTP/1.1, HTTP/2, HTTP/3, QUIC, Multiplexing, HPACK, QPACK, Head-of-line Blocking, Server Push]
category: cs-fundamentals
group: network
level: intermediate
summary: 같은 HTTP 의미(메서드·헤더·상태 코드)를 서로 다른 방식으로 전송하는 세 버전. 연결 수, 다중화, 헤드 오브 라인 블로킹, 전송 계층(TCP vs QUIC)이 다르다.
tags: [network, http, http2, http3, quic, performance]
related: [cs-fundamentals/tcp-vs-udp, cs-fundamentals/tls-https, cs-fundamentals/load-balancer-l4-l7, cs-fundamentals/http-caching, cs-fundamentals/browser-rendering-pipeline]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP
  - https://www.rfc-editor.org/rfc/rfc9114.html
  - https://www.rfc-editor.org/rfc/rfc9000.html
  - https://developer.chrome.com/blog/removing-push
updatedAt: 2026-11-18
---

## 한눈에

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 전송 | TCP (+TLS) | TCP + TLS (브라우저는 사실상 TLS 필수) | QUIC (UDP 위, TLS 1.3 내장) |
| 형식 | 텍스트 | 바이너리 프레임 | 바이너리 프레임 |
| 동시 요청 | 연결당 1개(파이프라이닝은 사실상 미사용) → 브라우저가 출처당 연결 약 6개 | 한 연결에서 스트림 다중화 | 한 연결에서 스트림 다중화 |
| 헤더 압축 | 없음 | HPACK | QPACK |
| HOL 블로킹 | HTTP 수준(응답 순서) | HTTP 수준은 해결, **TCP 수준은 남음** | 스트림별 독립 → 해결 |
| 핸드셰이크 | TCP 1 + TLS 1 RTT | 같음 | QUIC 1 RTT(재연결 0-RTT 가능) |
| 연결 이동 | 불가 (IP·포트가 바뀌면 끊김) | 불가 | 연결 ID 로 네트워크 변경 후에도 유지 |

## 각 버전이 풀려던 문제

**HTTP/1.1** (MDN): 지속 연결(keep-alive), `Host` 헤더로 한 IP 에 여러 사이트, 청크 전송, 캐시 제어·콘텐츠 협상. 파이프라이닝은 응답 순서를 지켜야 해서 앞 응답이 느리면 뒤가 다 막혔고, 결국 브라우저들은 연결을 여러 개 여는 쪽을 택했다.

**HTTP/2**: 요청을 스트림으로 쪼개 한 연결에 섞는다. 도메인 샤딩·스프라이트·파일 합치기 같은 HTTP/1 시절 최적화가 대부분 불필요해졌다. 하지만 RFC 9114 가 설명하듯, TCP 는 위의 병렬성을 모르므로 **패킷 하나가 손실되면 모든 스트림이 멈춘다**.

**HTTP/3**: HTTP 의미는 그대로 두고 전송을 QUIC 으로 바꿨다. QUIC 은 스트림별로 신뢰성을 관리해 한 스트림의 손실이 다른 스트림을 막지 않는다. HPACK 은 순서대로 도착한다는 가정이 있어 QPACK 으로 바꿨다. 서버는 `Alt-Svc: h3=":443"` 헤더로 HTTP/3 지원을 알리고, 클라이언트는 다음 연결부터 시도한다(HTTPS DNS 레코드로 처음부터 알 수도 있다).

```
HTTP/2 over TCP:  [s1][s2][s3][s1 ✗손실][s2][s3]  → 재전송 올 때까지 s2, s3 도 앱에 전달 안 됨
HTTP/3 over QUIC: [s1][s2][s3][s1 ✗손실][s2][s3]  → s1 만 대기, s2·s3 는 계속 처리
```

## 서버 푸시는 사실상 끝났다

HTTP/2 서버 푸시는 캐시에 이미 있는 리소스까지 밀어 넣는 등 효과가 불분명했다. Chrome 은 106 에서 기본 비활성화했고, 대안으로 **103 Early Hints** 와 `<link rel="preload">` 를 권한다.

## 개발자에게 왜 중요한가

- **손실 많은 모바일 망**에서는 HTTP/3 의 이점이 크고, 안정된 데이터센터 내부에서는 차이가 작다.
- **gRPC 는 HTTP/2 위**에서 동작한다. 한 연결에 요청이 몰리므로 L4 로드 밸런서로는 서버 간 분산이 안 된다 → L7(요청 단위) 분산이 필요. [L4/L7 로드 밸런서](/develop-wiki/knowledge/cs-fundamentals/load-balancer-l4-l7/) 참고.
- HTTP/2 에서는 연결이 하나라 **동시 스트림 수 제한**(서버 설정)이 실질적 동시성 상한이 된다.
- 헤더가 압축되더라도 큰 쿠키는 여전히 매 요청 비용이다.

```shell
curl -sI --http2 https://example.com | head -1      # HTTP/2 협상 확인
curl -sI https://example.com | grep -i alt-svc      # HTTP/3 광고 여부
curl -sI --http3 https://example.com | head -1      # curl 이 HTTP/3 지원으로 빌드된 경우
```

## 언제 무엇을

- 공개 웹: HTTP/2 를 기본으로, CDN·프록시가 지원하면 HTTP/3 를 추가로 켠다(클라이언트는 실패 시 TCP 로 폴백).
- 내부 서비스 간: HTTP/1.1 keep-alive 또는 HTTP/2(gRPC). UDP 가 막히는 환경이면 HTTP/3 이점이 없다.

## 주의 (비용)

- QUIC 은 사용자 공간 구현이라 커널 TCP 보다 CPU 를 더 쓸 수 있고, UDP 를 막는 방화벽이 아직 있다.
- HTTP/2 의 단일 연결은 로드 밸런서·프록시의 연결 단위 정책(타임아웃, 분산)을 다시 생각하게 만든다.
- 버전을 바꾼다고 느린 서버 응답이 빨라지지는 않는다. 먼저 TTFB 와 리소스 수·크기를 본다.
