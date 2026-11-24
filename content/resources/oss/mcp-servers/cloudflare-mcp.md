---
name: Cloudflare MCP Servers
url: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
docs: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
repo: https://github.com/cloudflare/mcp-server-cloudflare
stars: 4496
domain: oss
category: mcp-servers
description: Cloudflare 공식 원격 MCP 서버 모음. 전체 Cloudflare API 를 Code Mode 로 다루는 API 서버와 문서·브라우저·컨테이너 등 제품별 서버가 있다. Workers·DNS·보안 설정을 에이전트로 조회·변경할 때 쓴다.
pricing: freemium
tags: [mcp, cloudflare, workers, remote-mcp, official, code-mode]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
[Cloudflare](/develop-wiki/cloud/paas-edge/cloudflare/) 가 운영하는 원격 MCP 서버들이다. 서버는 `*.mcp.cloudflare.com/mcp` 주소로 Streamable HTTP 연결하며, 구형 `/sse` 주소는 410 을 돌려준다.
2026-11 기준 권장 서버는 별도 저장소 `cloudflare/mcp` 의 **Cloudflare API MCP Server**(`https://mcp.cloudflare.com/mcp`, Apache-2.0, 별 1,101)다. 약 2,500개 엔드포인트를 도구 2,594개로 노출하는 대신 `search`·`execute` 같은 도구 3개로 줄이고, 에이전트가 JavaScript 를 써서 API 명세를 검색·호출하는 Code Mode 방식이다(README 의 비교: 컨텍스트 약 1.1k 토큰 vs 전체 스키마 약 117만 토큰).
이 항목의 `repo`(`cloudflare/mcp-server-cloudflare`, Apache-2.0, 별 4,474, 마지막 푸시 2026-10-22)는 제품별 서버를 담고 있다.

## 무엇이 들어 있나
| 서버 | 주소 | 용도 |
| --- | --- | --- |
| API (권장) | `mcp.cloudflare.com/mcp` | 전체 API 를 코드 실행으로 호출, 문서 검색(`docs`) |
| Documentation | `docs.mcp.cloudflare.com/mcp` | 최신 Cloudflare 문서 참조 |
| Container | `containers.mcp.cloudflare.com/mcp` | 샌드박스 개발 환경 |
| Browser Run | `browser.mcp.cloudflare.com/mcp` | 웹 페이지 Markdown 변환·스크린샷 |
| DEX · CASB · Blog | `dex`·`casb`·`blog` 하위 도메인 | 디지털 경험 모니터링, SaaS 설정 점검, 블로그 검색 |

Observability·Workers Bindings·Radar·AI Gateway 등 기존 제품별 서버는 deprecated 로 표시돼 있고 API 서버로 옮기라고 안내한다.

## 설치·사용법
OAuth 로 연결하면 Cloudflare 로그인 화면에서 권한을 고른다.

```bash
claude mcp add --transport http cloudflare-api https://mcp.cloudflare.com/mcp
```

이후 `/mcp` 로 인증한다. CI 처럼 브라우저가 없으면 API 토큰을 Bearer 로 넘긴다(Client IP Address Filtering 이 켜진 토큰은 미지원). 클라이언트가 이미 Code Mode 를 쓴다면 `?codemode=false` 로 API 메서드별 도구 약 3,000개를 등록할 수 있지만 토큰이 약 24만으로 늘어난다.

## 언제 쓰나 / 주의
- 쓸 때: Worker·D1·R2·DNS 설정을 대화로 점검하거나 변경할 때, 최신 Cloudflare 문서를 근거로 코드를 쓰게 할 때.
- 보안: 권한은 OAuth 동의 화면이나 토큰 범위로 정해진다. 처음에는 읽기 위주 범위로 시작하고, DNS·방화벽·Worker 배포처럼 운영에 바로 영향이 큰 쓰기 권한은 필요할 때만 준다.
- 비용: 서버는 무료지만 일부 기능은 Workers 유료 플랜이 필요하다.

## 링크
- [공식 안내](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/) · [제품별 서버 저장소](https://github.com/cloudflare/mcp-server-cloudflare) · [API 서버 저장소](https://github.com/cloudflare/mcp)
- 이 사이트: [Cloudflare](/develop-wiki/cloud/paas-edge/cloudflare/) · [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)
