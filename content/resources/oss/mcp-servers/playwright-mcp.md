---
name: Playwright MCP
url: https://github.com/microsoft/playwright-mcp
docs: https://github.com/microsoft/playwright-mcp#readme
repo: https://github.com/microsoft/playwright-mcp
stars: 39971
domain: oss
category: mcp-servers
description: Microsoft 의 브라우저 자동화 MCP 서버. 스크린샷 대신 접근성 트리 스냅샷으로 페이지를 읽고 클릭·입력·탐색한다. 에이전트로 웹앱을 시험하거나 화면 동작을 확인할 때 쓴다.
pricing: oss
tags: [mcp, browser-automation, playwright, testing, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Playwright MCP 는 [Playwright](/develop-wiki/frontend/testing/playwright/) 를 MCP 도구로 감싼 서버다. 페이지를 픽셀이 아니라 **접근성 스냅샷**(역할·이름·참조 id 가 붙은 트리)으로 돌려주므로, 비전 모델 없이도 "ref_12 버튼 클릭"처럼 결정적으로 조작할 수 있다. Chromium·Firefox·WebKit 을 지원하고, 브라우저 프로필은 기본적으로 디스크에 유지된다.
README 는 코딩 에이전트라면 토큰 효율이 더 좋은 [Playwright CLI + 스킬](https://github.com/microsoft/playwright-cli) 방식을 먼저 고려하라고 권한다. MCP 는 브라우저 상태를 오래 유지하며 탐색·자가 복구 테스트를 하는 루프에 맞다.
**2026-11 기준**: 별 약 4만, 최신 릴리스 v0.0.85(2026-11-09), Apache-2.0. Node.js 20 이상.

## 무엇이 들어 있나
| 도구 (일부) | 하는 일 |
| --- | --- |
| `browser_navigate` · `browser_navigate_back` · `browser_tabs` | 이동, 뒤로, 탭 관리 |
| `browser_snapshot` · `browser_find` | 접근성 스냅샷, 스냅샷 안 텍스트·정규식 검색 |
| `browser_click` · `browser_type` · `browser_fill_form` · `browser_select_option` | 입력 조작 |
| `browser_take_screenshot` · `browser_pdf_save` | 화면·PDF 저장 (`--caps vision,pdf` 로 추가 기능) |
| `browser_console_messages` · `browser_network_requests` | 콘솔·네트워크 확인 |
| `browser_route` · `browser_cookie_*` · `browser_localstorage_*` | 요청 모킹, 쿠키·스토리지 조작 |
| `browser_verify_*` · `browser_generate_locator` | 요소·텍스트 검증, 테스트용 locator 생성 |
| `browser_start_tracing` · `browser_start_video` | 트레이스·동영상 기록 |

## 설치·사용법
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

일반 `mcpServers` 설정에서 격리 프로필·헤드리스·허용 출처를 지정하는 예:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated", "--headless",
               "--allowed-origins", "http://localhost:3000"]
    }
  }
}
```

| 옵션 | 의미 |
| --- | --- |
| `--isolated` | 프로필을 메모리에만 두고 종료 시 버림 |
| `--headless` | 창 없이 실행 (기본은 창 표시) |
| `--caps vision,pdf,devtools` | 좌표 클릭·PDF·DevTools 도구 추가 |
| `--config <file>` | JSON 설정 파일 |
| `--port 8931` | 독립 HTTP 서버로 띄워 여러 클라이언트가 접속 |

Docker 이미지 `mcr.microsoft.com/playwright/mcp` 도 있다(헤드리스 Chromium 만).

## 언제 쓰나 / 주의
- 쓸 때: 에이전트가 만든 UI 를 직접 열어 확인할 때, 로그인 흐름·폼 제출 같은 E2E 시나리오를 탐색하며 테스트 코드를 뽑을 때.
- 보안: README 는 Playwright MCP 가 **보안 경계가 아니라고** 명시한다. `--allowed-origins` 도 경계가 아니다. 에이전트가 읽는 웹 페이지 내용은 프롬프트 인젝션 입력이 될 수 있다.
- 보안: 기본 프로필은 로그인 쿠키를 디스크에 남긴다. 실제 계정이 로그인된 프로필을 쓰지 말고 `--isolated` 를 기본으로 둔다. `browser_evaluate`·`browser_run_code_unsafe` 는 페이지에서 임의 코드를 실행한다.
- 대안: 성능 트레이스·메모리 분석이 목적이면 [Chrome DevTools MCP](/develop-wiki/oss/mcp-servers/chrome-devtools-mcp/).

## 링크
- [README](https://github.com/microsoft/playwright-mcp#readme) · [릴리스](https://github.com/microsoft/playwright-mcp/releases) · [Playwright CLI](https://github.com/microsoft/playwright-cli)
- [MCP 보안 모범 사례](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
