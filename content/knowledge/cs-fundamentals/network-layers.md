---
title: OSI 7계층과 TCP/IP 4계층
aka: [OSI Model, TCP/IP Model, Internet Protocol Suite, Encapsulation, MTU]
category: cs-fundamentals
group: network
level: beginner
summary: 네트워크 기능을 층으로 나눠 각 층이 아래 층의 서비스를 쓰도록 한 모델. 장애가 어느 층의 문제인지 좁히고, L4/L7 같은 용어를 해석하는 공통 언어.
tags: [network, osi, tcp-ip, encapsulation, mtu, debugging]
related: [cs-fundamentals/tcp-vs-udp, cs-fundamentals/dns, cs-fundamentals/tls-https, cs-fundamentals/http-versions, cs-fundamentals/load-balancer-l4-l7]
sources:
  - https://www.rfc-editor.org/rfc/rfc1122.html
  - https://www.rfc-editor.org/rfc/rfc9293.html
  - https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
updatedAt: 2026-11-18
---

## 두 모델

| OSI (교과서·용어용) | TCP/IP (RFC 1122, 실제 인터넷) | 단위 | 대표 프로토콜·장비 |
| --- | --- | --- | --- |
| 7 응용 | 응용 | 메시지 | HTTP, DNS, SMTP, gRPC |
| 6 표현 | (응용에 포함) | | 인코딩, TLS 를 여기 두기도 함 |
| 5 세션 | (응용에 포함) | | |
| 4 전송 | 전송 | 세그먼트 / 데이터그램 | TCP, UDP (QUIC 은 UDP 위) |
| 3 네트워크 | 인터넷 | 패킷 | IP, ICMP, 라우터 |
| 2 데이터 링크 | 링크 | 프레임 | Ethernet, Wi-Fi, 스위치, ARP |
| 1 물리 | (링크에 포함) | 비트 | 케이블, 전파 |

RFC 1122 는 인터넷 프로토콜 묶음을 응용·전송·인터넷·링크 4계층으로 설명한다. OSI 의 5·6계층은 실제 인터넷 스택에서 따로 존재하지 않고 응용 프로토콜 안에 녹아 있다. 그래서 TLS 를 몇 계층으로 볼지는 자료마다 다르다(전송 위·응용 아래).

## 캡슐화

```
응용    [ HTTP 요청 ]
전송    [TCP 헤더| HTTP 요청 ]
인터넷  [IP 헤더|TCP 헤더| HTTP 요청 ]
링크    [Eth 헤더|IP 헤더|TCP 헤더| HTTP 요청 |FCS]
        ── 각 층은 위 층 데이터를 내용물로 보고 자기 헤더만 해석 ──
```

라우터는 3계층(IP 헤더)까지만, L4 로드 밸런서는 4계층(포트)까지, L7 프록시는 HTTP 내용까지 본다. "L4/L7" 이라는 말은 이 번호에서 왔다.

## 개발자에게 왜 중요한가: 층별로 장애 좁히기

| 증상 | 의심 층 | 확인 |
| --- | --- | --- |
| 도메인을 못 찾음 | 응용(DNS) | `dig example.com` |
| 연결 자체가 안 됨/타임아웃 | 인터넷·전송 (라우팅, 방화벽, 포트) | `nc -vz host 443`, `traceroute` |
| 연결은 되는데 TLS 오류 | TLS | `openssl s_client -connect host:443 -servername host` |
| 작은 요청은 되는데 큰 응답만 멈춤 | 인터넷 (MTU·PMTUD) | 아래 참고 |
| 상태 코드 4xx/5xx | 응용(HTTP) | 로그, `curl -v` |

```shell
# 아래 층부터 하나씩
dig +short api.example.com
nc -vz api.example.com 443
curl -v https://api.example.com/health
```

### MTU 와 "큰 패킷만 사라지는" 문제

링크마다 한 번에 보낼 수 있는 최대 크기(MTU)가 있다. 인터넷 게이트웨이는 보통 1500바이트다. AWS 문서는 경로 중간 장비가 큰 패킷을 버리면서 ICMP "Fragmentation Needed" 를 돌려주는데, 이것이 방화벽에 막히면 경로 MTU 탐색(PMTUD)이 실패한다고 설명한다. VPN·터널(헤더가 추가됨)을 쓸 때 "핸드셰이크는 되는데 큰 응답에서 멈춤" 증상이 전형적이다.

## 언제 쓰나

- 장애 분석, 네트워크 팀·클라우드 문서와 소통할 때의 공용어.
- 보안 장비(WAF=L7, 보안 그룹=L3/L4)가 무엇을 볼 수 있는지 판단할 때.

## 주의

- OSI 는 설명 모델이지 구현 명세가 아니다. 실제 프로토콜은 층을 깔끔하게 지키지 않는다(QUIC 은 전송 기능을 UDP 위 사용자 공간에서 구현하고, TLS 를 내장한다).
- 층을 건너뛰는 설계(L4 장비가 HTTP 헤더를 보려 함, 앱이 IP 로 사용자 식별)는 프록시·NAT 를 만나면 깨진다.
