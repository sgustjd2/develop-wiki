---
title: L4 vs L7 로드 밸런서
aka: [Layer 4 Load Balancer, Layer 7 Load Balancer, Reverse Proxy, Network Load Balancer, Application Load Balancer, TLS Termination, X-Forwarded-For]
category: cs-fundamentals
group: network
level: intermediate
summary: L4 는 IP·포트만 보고 연결 단위로, L7 은 HTTP 내용을 해석해 요청 단위로 트래픽을 나눈다. 이 차이가 클라이언트 IP 전달, TLS 종료 위치, gRPC 분산을 좌우한다.
tags: [network, load-balancer, proxy, tls, http2, grpc, aws]
related: [cs-fundamentals/network-layers, cs-fundamentals/tcp-vs-udp, cs-fundamentals/http-versions, cs-fundamentals/tls-https, performance/load-balancing]
sources:
  - https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
  - https://www.rfc-editor.org/rfc/rfc1122.html
updatedAt: 2026-11-18
---

> 분배 알고리즘(라운드 로빈, 최소 연결, 해시)과 헬스 체크 운영은 [로드 밸런싱](/develop-wiki/knowledge/performance/load-balancing/) 노트에서 다룬다. 여기서는 **어느 계층에서 동작하느냐**가 만드는 차이에 집중한다.

## 비교

| | L4 | L7 |
| --- | --- | --- |
| 보는 것 | IP, 포트, 프로토콜(TCP/UDP) | + HTTP 메서드·경로·헤더·쿠키·호스트 |
| 분산 단위 | **연결**(흐름) | **요청** |
| 동작 방식 | 패킷 전달(NAT/DSR) 또는 TCP 프록시 | 클라이언트 연결을 끝내고 백엔드에 새 연결(풀)로 요청 |
| TLS | 보통 통과(passthrough), 선택적으로 종료 | 종료가 기본 → 내용 확인 가능 |
| 라우팅 | 포트별 | 경로·호스트·헤더별 (`/api` → A, `/static` → B) |
| 부가 기능 | 적음, 빠름, 고정 IP | 재시도, 리다이렉트, 인증, WAF, 헤더 추가, 압축 |
| 프로토콜 | 무엇이든 (DB, MQTT, 게임 UDP) | HTTP/1.1, HTTP/2, gRPC, WebSocket |
| AWS 예 | NLB | ALB |

## 문서에 나온 실제 동작 (AWS ELB)

- **NLB**: 프로토콜·출발지 IP/포트·목적지 IP/포트·TCP 시퀀스 번호로 만든 **흐름 해시**로 대상을 고르고, 그 TCP 연결은 끝날 때까지 같은 대상으로 간다.
- **ALB**: 리스너 규칙을 우선순위대로 평가해 대상 그룹을 고르고, 그룹 안에서는 기본 라운드 로빈. 여러 클라이언트 요청을 하나의 백엔드 연결로 보내는 **연결 다중화**를 한다.
- ALB 는 `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Port` 를 자동으로 붙인다.
- WebSocket 으로 업그레이드되면 ALB 의 리스너 라우팅 규칙과 WAF 는 더 이상 적용되지 않는다.

```
L4 (연결 단위)                          L7 (요청 단위)
client ──TCP──▶ LB ──같은 연결──▶ B1     client ──TCP+TLS──▶ LB ─┬─ req1 ─▶ B1
   (연결이 끝날 때까지 B1 고정)                                   ├─ req2 ─▶ B2
                                                                 └─ req3 ─▶ B3
```

## 개발자에게 왜 중요한가

### 1. 클라이언트 IP

L7 뒤의 앱은 TCP 상대가 로드 밸런서다. 진짜 IP 는 `X-Forwarded-For`(또는 표준 `Forwarded`) 헤더에 있다. 이 헤더는 클라이언트가 위조할 수 있으므로 **신뢰하는 프록시가 붙인 마지막 값**만 쓴다.

```ts
// Express: 앞단 프록시 1단계만 신뢰 → req.ip 가 XFF 의 올바른 값을 사용
app.set('trust proxy', 1);
app.get('/whoami', (req, res) => res.json({ ip: req.ip }));
```

L4 프록시 모드에서는 PROXY protocol 이나 클라이언트 IP 보존 옵션으로 전달한다.

### 2. HTTP/2·gRPC 분산

gRPC 클라이언트는 연결 하나를 오래 유지하며 모든 요청을 그 위에 다중화한다. L4 는 연결 단위로 분산하므로 **한 백엔드에 모든 요청이 몰린다**. L7(요청 단위) 로드 밸런서, 서비스 메시, 또는 클라이언트 측 분산을 쓴다.

### 3. TLS 종료 위치

| 방식 | 장점 | 비용 |
| --- | --- | --- |
| LB 에서 종료 | 인증서 한곳 관리, L7 기능 사용 | LB↔백엔드 구간 평문 (필요하면 재암호화) |
| 통과(passthrough) | 종단 간 암호화, 백엔드가 mTLS 검증 | L7 라우팅 불가 |

### 4. 타임아웃과 keep-alive

L7 은 앞뒤 연결을 따로 관리한다. 백엔드의 keep-alive 타임아웃이 LB 의 유휴 타임아웃보다 **짧으면** LB 가 막 닫힌 연결에 요청을 보내 간헐적 502 가 난다. 백엔드 쪽을 더 길게 둔다.

## 언제 무엇을

- **L7**: 웹·API, 경로 기반 라우팅, gRPC, 인증·WAF 를 앞단에서 하고 싶을 때.
- **L4**: HTTP 가 아닌 프로토콜, 고정 IP 가 필요할 때, 초당 연결이 매우 많고 기능이 필요 없을 때, 종단 간 TLS.
- 흔한 조합: L4(고정 IP·DDoS 흡수) → L7(라우팅) → 서비스.

## 주의 (비용)

- L7 은 요청을 해석하므로 지연과 CPU 가 더 들고, 헤더 크기 제한(ALB 는 요청 헤더 전체 64K 등) 같은 새 제약이 생긴다.
- 스티키 세션은 분산을 망가뜨리고 배포를 어렵게 한다. 상태는 외부 저장소로 뺀다.
- 로드 밸런서의 IP 는 바뀔 수 있다(ELB 는 DNS TTL 60초). DNS 이름으로 접근한다.
