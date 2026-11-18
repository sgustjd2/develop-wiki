---
name: Firecrawl MCP Server
url: https://www.firecrawl.dev
docs: https://github.com/firecrawl/firecrawl-mcp-server#readme
repo: https://github.com/firecrawl/firecrawl-mcp-server
stars: 7852
domain: oss
category: mcp-servers
description: Firecrawl 공식 MCP 서버. 웹 검색, URL 을 마크다운으로 긁기, 사이트 크롤·맵, PDF 파싱, 페이지 상호작용을 에이전트 도구로 제공한다. 웹 조사·자료 수집에 쓴다.
pricing: freemium
tags: [mcp, web-scraping, crawling, search, markdown]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Firecrawl 은 웹 페이지를 LLM 이 읽기 좋은 마크다운·구조화 데이터로 바꾸는 API 서비스이고, 이 저장소는 그 API 를 MCP 도구로 노출하는 공식 서버다. 클라우드 API(유료, 키리스 무료 구간 있음) 또는 직접 띄운 Firecrawl 인스턴스(`FIRECRAWL_API_URL`)에 연결한다. 재시도·요청 제한 처리가 내장돼 있다.
**2026-11 기준**: 별 약 7,900, 최신 릴리스 v3.36.1(2026-11-03), MIT. 기본 설정에서 도구 34개를 등록한다.

## 무엇이 들어 있나
| 도구 | 언제 쓰나 |
| --- | --- |
| `firecrawl_scrape` | URL 하나를 마크다운으로 |
| `firecrawl_search` | 질의로 웹 검색, 필요하면 결과 페이지 본문까지 |
| `firecrawl_map` | 사이트의 URL 목록만 수집 |
| `firecrawl_crawl` | 사이트 여러 페이지 본문 수집 (`limit`·`includePaths` 로 범위 제한) |
| `firecrawl_parse` | PDF·문서 파싱 |
| `firecrawl_interact` | 클릭·입력이 필요한 동적 페이지 조작 |
| `firecrawl_agent` | 여러 출처를 조사해 구조화 JSON 으로 반환 |
| `firecrawl_monitor_*` | 페이지 변경을 주기적으로 감시하고 diff 알림 |
| `firecrawl_credit_usage` | 남은 크레딧·사용 내역 |

개발자 자료(GitHub 이슈·README·문서), 미국 법령, 논문(arXiv·PubMed 등) 전용 검색 도구도 있다.

## 설치·사용법
원격 호스팅 서버(설치 없음). 키 없이는 scrape·search·parse 만 요청 제한 하에 쓸 수 있고, 나머지는 API 키나 OAuth 가 필요하다.

```bash
claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY"
```

로컬 stdio 실행:

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "<fc-YOUR_API_KEY>" }
    }
  }
}
```

셀프 호스팅 Firecrawl 을 쓰면 `FIRECRAWL_API_URL=https://firecrawl.example.com` 을 추가하고, 인스턴스가 인증을 요구할 때만 키를 준다. Docker 이미지 `ghcr.io/firecrawl/firecrawl-mcp-server` 도 있다.

## 언제 쓰나 / 주의
- 쓸 때: 에이전트가 경쟁 서비스 조사, 문서 사이트 수집, 가격·변경 모니터링처럼 여러 페이지를 읽어야 할 때. 단순히 페이지 하나만 읽으면 클라이언트 내장 웹 fetch 로 충분하다.
- 보안: 수집한 웹 콘텐츠는 그대로 모델 입력이 되므로 프롬프트 인젝션 경로다. 수집 결과를 근거로 파일 수정·명령 실행을 자동 승인하지 않는다.
- 비용: crawl·agent 는 크레딧을 많이 쓴다. `limit`·`maxDiscoveryDepth` 를 꼭 걸고 `firecrawl_credit_usage` 로 확인한다.
- 주의: 로컬 HTTP 모드를 `HOST=0.0.0.0` 으로 열면 포트에 닿는 모든 클라이언트가 서버의 API 키로 요청한다. 외부에 노출하지 않는다.
- 주의: 대상 사이트의 이용 약관·robots 정책을 지킨다.

## 링크
- [README](https://github.com/firecrawl/firecrawl-mcp-server#readme) · [릴리스](https://github.com/firecrawl/firecrawl-mcp-server/releases)
- [Firecrawl 문서](https://docs.firecrawl.dev) · [Firecrawl 본체(셀프 호스팅)](https://github.com/firecrawl/firecrawl)
