---
title: SSRF(서버 측 요청 위조) 방어
aka: [Server-Side Request Forgery, SSRF, Cloud Metadata, IMDSv2, DNS Rebinding, Egress Filtering]
category: security
level: intermediate
summary: 사용자가 준 URL 로 서버가 요청을 보내는 기능이 내부망·클라우드 메타데이터를 여는 통로가 되는 SSRF 와, 허용 목록·IP 검증·네트워크 분리로 막는 방법.
tags: [owasp, ssrf, web-security, cloud, network, backend]
related: [security/owasp-top-10, security/access-control-design, security/secrets-management, security/csrf, security/threat-modeling-stride, cs-fundamentals/dns]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
  - https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
updatedAt: 2026-11-18
---

SSRF 는 OWASP Top 10:2021 에서 A10 으로 따로 있었고, 2025 판에서는 A01 접근 제어 실패에 합쳐졌다. [OWASP Top 10](/develop-wiki/knowledge/security/owasp-top-10/) 참고.

## 문제

서버가 사용자 입력 URL 을 가져오는 기능은 흔하다: 링크 미리보기, 웹훅, URL 로 이미지 가져오기, PDF 렌더링, OAuth/OIDC 디스커버리, 가져오기(import) 기능.

공격자는 URL 을 서버 **안쪽**으로 돌린다.

```
POST /preview  { "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role" }
→ 서버가 클라우드 메타데이터에서 임시 자격 증명을 가져와 미리보기로 보여 준다
```

- 서버는 방화벽 안쪽에 있으므로 외부에서 못 닿는 관리 콘솔, 내부 API, Redis, DB 에 닿는다.
- 클라우드 메타데이터 엔드포인트(`169.254.169.254`, `metadata.google.internal`, AWS IPv6 `fd00:ec2::254`, ECS `169.254.170.2`)는 자격 증명을 준다.
- 응답을 보여 주지 않아도(blind SSRF) 내부 포트 스캔, 상태 변경 요청은 가능하다.

## 해법

### 경우 1: 갈 곳이 정해져 있다 → 허용 목록

파트너 API, 특정 버킷 등 목적지가 미리 알려져 있으면 **사용자에게 URL 을 받지 않는다.** 식별자만 받고 URL 은 서버가 만든다.

```ts
const PARTNERS = { acme: 'https://api.acme.example', globex: 'https://hooks.globex.example' } as const;
const base = PARTNERS[req.body.partner as keyof typeof PARTNERS];
if (!base) throw new BadRequest();
await fetch(`${base}/v1/notify`, { redirect: 'error' }); // 리다이렉트 따라가지 않음
```

### 경우 2: 아무 외부 주소나 가야 한다 (미리보기, 웹훅) → 해석 후 IP 검증 + 그 IP 로 연결

```ts
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

async function resolvePublic(rawUrl: string) {
  const u = new URL(rawUrl);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('scheme');
  const addrs = await lookup(u.hostname, { all: true });
  for (const { address } of addrs) {
    let ip = ipaddr.parse(address);
    if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress())
      ip = (ip as ipaddr.IPv6).toIPv4Address();              // ::ffff:169.254.169.254 대응
    if (ip.range() !== 'unicast') throw new Error('blocked'); // private, loopback, linkLocal 등
  }
  return { url: u, ip: addrs[0].address };
}
// 그다음 "검증한 그 IP" 로 연결해야 한다 (Host 헤더·SNI·인증서 검증은 원래 호스트명으로).
```

- 이름을 검증한 뒤 HTTP 클라이언트가 **다시 DNS 를 조회하면** 그 사이 답이 내부 IP 로 바뀔 수 있다(**DNS 리바인딩**). 해석한 IP 를 소켓에 고정(커스텀 `lookup`/에이전트)한다. 재시도·폴백 경로도 같은 정책을 따라야 한다.
- 리다이렉트는 끈다. 302 로 내부 주소에 보내는 우회가 가장 흔하다. 따라가야 한다면 홉마다 다시 검증한다.
- 차단 대상(최소): 메타데이터 IP, 루프백(`127.0.0.0/8`, `::1`), RFC1918 사설 대역, 링크 로컬(`169.254.0.0/16`, `fe80::/10`), IPv6 고유 로컬(`fc00::/7`), 멀티캐스트, IPv4 매핑·NAT64(`64:ff9b::/96`) 주소.
- 문자열 비교로 막지 않는다. `0x7f.1`, `2130706433`, `017700000001`, `[::ffff:127.0.0.1]` 은 모두 127.0.0.1 이다. 검증된 파서로 정규화한 결과를 비교한다. 파서 둘이 다른 호스트를 읽어 내는 입력(`http://a.com\@b.com` 류)은 거부한다.
- `file://`, `gopher://`, `dict://` 같은 스킴은 허용하지 않는다. XML 파서의 외부 엔티티(XXE)도 SSRF 경로가 된다.

### 네트워크 계층: 앱 버그가 있어도 막히게

- **외부 요청 전용 프록시·서브넷**(egress proxy)을 두고 그 경로만 인터넷으로 나가게 한다. 이 경로에서는 내부망·메타데이터로 갈 수 없도록 방화벽을 건다. OWASP 는 네트워크 분리를 강하게 권한다.
- AWS 는 **IMDSv2 를 강제**하고 v1 을 끈다(세션 토큰 PUT 이 필요해 단순 GET SSRF 를 막는다). 심층 방어일 뿐, 앱 검증을 대신하지 않는다.
- 서버 역할(IAM)에 최소 권한을 준다. 자격 증명이 새도 피해가 작게.

## 언제 이 노트를 펼치나

- 코드 리뷰에서 `fetch(req.body.url)`, `axios.get(userInput)`, 헤드리스 브라우저에 사용자 URL·HTML 을 넣는 코드를 봤을 때.
- 웹훅 발송, 링크 펼치기(unfurl), 원격 이미지 업로드, SAML/OIDC 메타데이터 URL 설정 기능을 만들 때.

## 주의

- **차단 목록은 우회되기 쉽다.** 가능하면 허용 목록, 안 되면 정규화된 IP 검증 + 네트워크 분리를 겹친다.
- 응답 본문을 그대로 사용자에게 돌려주지 않는다. 필요한 필드(제목, 썸네일)만 추출하고 크기·시간 제한을 둔다.
- 타임아웃·응답 크기 상한이 없으면 SSRF 기능이 DoS 증폭기가 된다.
- 헤드리스 브라우저(PDF 생성 등)는 HTML 안의 `<img src>`, `<iframe>`, 리다이렉트까지 따라간다. 별도 네트워크 샌드박스에서 돌린다.
- 검증 단계에서 DNS 를 조회하는 것 자체가 외부 리졸버에 정보를 흘리거나 공격자가 통제하는 DNS 응답을 받는 일이 될 수 있다. 리졸버도 통제된 것을 쓴다.
