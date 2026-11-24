---
name: Chrome DevTools MCP
url: https://github.com/ChromeDevTools/chrome-devtools-mcp
docs: https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md
repo: https://github.com/ChromeDevTools/chrome-devtools-mcp
stars: 59173
domain: oss
category: mcp-servers
description: Chrome DevTools 팀의 MCP 서버. 실행 중인 Chrome 을 조작하며 성능 트레이스, 네트워크·콘솔, 힙 스냅샷, Lighthouse 감사를 에이전트에 제공한다. 프론트엔드 디버깅·성능 분석에 쓴다.
pricing: oss
tags: [mcp, chrome, devtools, performance, debugging, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`chrome-devtools-mcp` 는 Google Chrome DevTools 팀이 만든 서버로, 코딩 에이전트가 실제 Chrome 을 열어 **DevTools 수준의 정보**를 얻게 한다. 조작은 Puppeteer 로 하고 결과를 기다려 주며, 성능 트레이스에서 LCP 같은 인사이트를 뽑아 준다. MCP 서버 외에 같은 기능을 쓰는 `chrome-devtools` CLI 와 사용법을 가르치는 스킬도 함께 배포한다.
**2026-11 기준**: 별 약 5.8만, 최신 릴리스 1.13.0(2026-11-11), Apache-2.0. Google Chrome 과 Chrome for Testing 만 공식 지원한다.

## 무엇이 들어 있나
| 분류 | 도구 예 |
| --- | --- |
| 입력 자동화 | `click`, `fill`, `fill_form`, `type_text`, `press_key`, `upload_file`, `handle_dialog` |
| 탐색 | `new_page`, `navigate_page`, `list_pages`, `select_page`, `wait_for` |
| 성능 | `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight` |
| 네트워크 | `list_network_requests`, `get_network_request`, `mock_network` |
| 디버깅 | `take_snapshot`, `take_screenshot`, `list_console_messages`, `evaluate_script`, `lighthouse_audit`, `get_css_styles` |
| 메모리 | `take_heapsnapshot`, `compare_heapsnapshots`, `get_heapsnapshot_retainers` 등 |
| 에뮬레이션 | `emulate`(네트워크·CPU·위치 등), `resize_page` |
| 기타 | 확장 프로그램 설치·재로드, PWA, WebAuthn, WebMCP 도구 |

동봉 스킬: `chrome-devtools`, `chrome-devtools-cli`, `a11y-debugging`, `debug-optimize-lcp`, `memory-leak-debugging`, `cookie-debugging`, `troubleshooting`.

## 설치·사용법
```bash
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest
```

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--isolated", "--no-usage-statistics"]
    }
  }
}
```

MCP 서버와 스킬을 함께 받으려면 Claude Code 플러그인으로 설치한다.

```text
/plugin marketplace add ChromeDevTools/chrome-devtools-mcp
/plugin install chrome-devtools-mcp@chrome-devtools-plugins
```

첫 확인 프롬프트로 "https://developers.chrome.com 의 성능을 확인해 줘"를 보내면 브라우저가 열리고 트레이스를 기록한다. 이미 띄운 Chrome 에 붙으려면 `--browser-url` 또는 `--auto-connect` 를 쓴다.

## 언제 쓰나 / 주의
- 쓸 때: LCP·레이아웃 이동·느린 요청을 원인까지 찾을 때, 메모리 누수를 힙 스냅샷 비교로 추적할 때, 에이전트가 고친 화면을 콘솔 오류까지 확인시키고 싶을 때.
- 보안: 브라우저 안의 모든 데이터를 MCP 클라이언트가 보고 수정할 수 있다. 개인 계정이 로그인된 프로필에 붙이지 말고 `--isolated` 를 쓴다.
- 개인정보: Google 사용 통계 수집이 **기본으로 켜져** 있다(`--no-usage-statistics` 또는 `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS`). 성능 도구는 CrUX 실사용 데이터를 받기 위해 트레이스 URL 을 Google CrUX API 로 보낼 수 있다(`--no-performance-crux`).
- 주의: 스킬은 특정 버전 도구를 설명한다. 서버를 업데이트하면 스킬도 같이 갱신한다.
- 대안: 브라우저 종류를 가리지 않는 기능 테스트는 [Playwright MCP](/develop-wiki/oss/mcp-servers/playwright-mcp/).

## 링크
- [README](https://github.com/ChromeDevTools/chrome-devtools-mcp#readme) · [도구 레퍼런스](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md) · [설정 가이드](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/configuration.md)
- [클라이언트별 설정](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/client-configurations.md) · [CLI 가이드](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/cli.md)
