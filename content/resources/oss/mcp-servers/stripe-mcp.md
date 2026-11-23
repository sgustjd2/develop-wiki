---
name: Stripe MCP
url: https://docs.stripe.com/mcp
docs: https://docs.stripe.com/mcp
repo: https://github.com/stripe/ai
stars: 2084
domain: oss
category: mcp-servers
description: Stripe 공식 원격 MCP 서버(mcp.stripe.com). 고객·결제·구독·청구서 API 호출과 문서 검색을 OAuth 로 에이전트에 연결한다. 결제 연동 코드 작성과 샌드박스 데이터 점검에 쓴다.
pricing: free
tags: [mcp, stripe, payments, billing, remote-mcp, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Stripe 가 호스팅하는 MCP 서버로, Stripe API 와 문서·지원 글 검색을 에이전트 도구로 준다. `stripe/ai` 저장소는 이 서버가 아니라 **에이전트 플러그인·스킬·벤치마크**를 담는다(MIT, 별 2,072, 마지막 푸시 2026-11-18). 서버 자체는 Stripe 가 운영하며 오픈소스가 아니다. MCP 사용에 별도 요금은 문서에 없고, API 사용에 따른 Stripe 의 일반 요금이 그대로 적용된다.
예전 로컬 패키지(`@stripe/agent-toolkit`, `@stripe/mcp` 등)는 **deprecated 이며 보안 수정도 없다**고 README 에 적혀 있다. 호스팅 서버를 쓴다.

## 무엇이 들어 있나
| 도구 | 설명 |
| --- | --- |
| `stripe_api_search` · `stripe_api_details` | API 메서드 검색, 파라미터 확인 |
| `stripe_api_read` · `stripe_api_write` | GET 계열 읽기, POST·PATCH·PUT·DELETE 쓰기를 임의 API 메서드에 수행 |
| `get_stripe_account_info` | 계정 정보 조회 |
| `search_stripe_documentation` · `stripe_implementation_planner` | 문서 검색, 결제 연동 설계 안내 |
| `stripe_analytics`(프리뷰) | 지표·보고서 질의 |
| Treasury(공개 프리뷰) | `send_money` · `transfer_money` · `convert_currency` 등 (사람 확인 필요) |

환불 생성 같은 일부 동작에는 대시보드에서 사람이 승인해야 하는 Human confirmation 절차가 붙는다. 이는 `stripe_api_write` 한 도구 안에서 동작별로 다르게 적용된다.

## 설치·사용법
```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
```

실행 후 `/mcp` 로 OAuth 인증한다. 동의 화면에서 라이브 계정과 샌드박스를 나눠 권한을 줄 수 있다. 플러그인을 쓰면 서버 설정과 스킬 설치가 한 번에 된다(`claude plugin install stripe@claude-plugins-official`, 또는 Stripe CLI 의 `stripe agent setup`).
OAuth 가 불가능한 자율 에이전트는 환경 변수에 둔 **에이전트 API 키**를 Bearer 로 보낸다. 문서에 따르면 2026-11-30 까지 옮겨야 하며, 12월부터는 에이전트 표시가 없는 전체 권한 시크릿 키와 제한 키를 받지 않는다.

## 언제 쓰나 / 주의
- 쓸 때: 결제·구독 연동 코드를 최신 문서에 맞춰 쓰게 할 때, 샌드박스에서 고객·상품·가격을 만들어 흐름을 시험할 때.
- 보안: **돈이 움직이는 서버**다. 처음에는 샌드박스에만 연결하고, 클라이언트의 도구 승인 설정을 켠다. 다른 MCP 서버와 함께 쓰면 프롬프트 주입 위험이 커진다고 Stripe 가 직접 경고한다. 키는 설정 파일에 직접 적지 말고 환경 변수로 참조한다.
- 관리자는 대시보드에서 팀의 MCP 접근을 라이브·샌드박스별로 끄고, 사용자별 OAuth 세션을 철회할 수 있다.

## 링크
- [Stripe MCP 문서](https://docs.stripe.com/mcp) · [에이전트 스킬](https://docs.stripe.com/skills.md) · [저장소](https://github.com/stripe/ai)
- 이 사이트: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)
