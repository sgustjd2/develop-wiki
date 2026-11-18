---
title: DNS
aka: [Domain Name System, Recursive Resolver, Authoritative Name Server, TTL, Negative Caching, CNAME]
category: cs-fundamentals
group: network
level: beginner
summary: 도메인 이름을 IP 주소 등으로 바꾸는 계층형 분산 데이터베이스. 캐시와 TTL 때문에 "바꿨는데 반영이 안 되는" 문제와 배포 전환 전략에 직결된다.
tags: [network, dns, ttl, caching, deployment]
related: [cs-fundamentals/network-layers, cs-fundamentals/load-balancer-l4-l7, cs-fundamentals/http-caching]
sources:
  - https://www.rfc-editor.org/rfc/rfc1034.html
  - https://www.rfc-editor.org/rfc/rfc2308.html
  - https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
updatedAt: 2026-11-18
---

## 구조

이름 공간은 트리이고, 트리를 **존(zone)** 단위로 잘라 각 존을 다른 조직이 운영한다. 상위 존은 하위 존의 네임서버를 NS 레코드로 **위임**한다(RFC 1034).

```
브라우저/OS 캐시 → 재귀 리졸버(ISP, 8.8.8.8, 사내 DNS)
                      │ 캐시에 없으면 반복 질의
                      ├─▶ 루트 서버: ".com 은 저 서버들에 물어봐" (NS)
                      ├─▶ .com TLD 서버: "example.com 은 저기" (NS + glue)
                      └─▶ example.com 권한 서버: "api.example.com A 203.0.113.10, TTL 300"
                      ◀── 결과를 TTL 동안 캐시하고 클라이언트에 응답
```

| 역할 | 하는 일 |
| --- | --- |
| 스텁 리졸버 | OS 에 있는 클라이언트. 재귀 리졸버에 "끝까지 알아봐 줘"(재귀 질의) |
| 재귀 리졸버 | 루트부터 따라 내려가며 반복 질의, 결과 캐시 |
| 권한(authoritative) 서버 | 존 데이터를 가진 원본. RFC 1034 는 존마다 최소 2대를 요구 |

## 자주 쓰는 레코드

| 타입 | 뜻 |
| --- | --- |
| A / AAAA | IPv4 / IPv6 주소 |
| CNAME | 다른 이름의 별칭 (존 꼭짓점 `example.com` 에는 표준상 못 둠 → 공급자별 ALIAS/플래트닝) |
| MX | 메일 서버 |
| TXT | 도메인 소유 확인, SPF·DKIM 등 |
| NS / SOA | 위임 / 존 메타데이터 |

## TTL 과 캐시

- 각 레코드의 TTL(초)만큼 리졸버가 캐시한다. TTL 0 은 캐시 금지(RFC 1034).
- **네거티브 캐싱**(RFC 2308): "그런 이름 없음(NXDOMAIN)" 응답도 캐시된다. 기간은 SOA 레코드의 TTL 과 SOA MINIMUM 필드 중 작은 값. 레코드를 만들기 전에 한 번 조회해 버리면 생성 후에도 한동안 "없음"이 보인다.
- AWS ELB 는 노드 IP 가 바뀔 수 있어 DNS TTL 을 60초로 둔다고 문서에 적고 있다. 즉 클라우드 로드 밸런서의 IP 를 하드코딩하면 안 된다.

## 개발자에게 왜 중요한가

- **배포 전환**: DNS 로 트래픽을 옮기려면 며칠 전에 TTL 을 낮춰 두고(예: 3600 → 60), 전환 후 다시 올린다. TTL 을 낮춘 시점 이전에 캐시된 값은 옛 TTL 만큼 남는다.
- **장수 프로세스의 DNS 캐시**: JVM 은 보안 관리자 설정에 따라 DNS 결과를 오래 캐시할 수 있고, 커넥션 풀은 이미 맺은 연결을 계속 쓴다. 대상 IP 가 바뀌어도 앱이 따라가지 못하는 흔한 원인이다.
- **Node.js**: `dns.lookup`(기본, `http` 가 사용)은 OS 리졸버를 libuv 스레드 풀에서 호출한다. DNS 가 느리면 풀이 막혀 파일 I/O 까지 느려질 수 있다.

```shell
dig api.example.com +noall +answer      # 응답과 남은 TTL
dig api.example.com @ns1.example.com    # 권한 서버에 직접 (캐시 우회)
dig +trace api.example.com              # 루트부터 위임 경로 확인
```

```ts
// 서비스 디스커버리용 간단 조회 (OS 캐시를 거치지 않는 resolve*)
import { resolve4 } from 'node:dns/promises';
const ips = await resolve4('api.internal.example.com', { ttl: true });
// [{ address: '10.0.1.12', ttl: 30 }, ...]
```

## 언제 쓰나

- 서비스 주소 추상화, 지역별 라우팅(GeoDNS), 간단한 장애 조치, 블루그린 전환.

## 주의 (비용)

- DNS 기반 장애 조치는 캐시 때문에 **즉시가 아니다**. 초 단위 전환은 로드 밸런서·Anycast 로 한다.
- 일반 DNS 는 평문이라 경로에서 보이고 변조될 수 있다. DNSSEC(무결성), DoH/DoT(기밀성)가 각각 다른 문제를 푼다.
- 내부 서비스 이름이 외부 리졸버로 새지 않게 사내 존과 검색 도메인 설정을 확인한다.
