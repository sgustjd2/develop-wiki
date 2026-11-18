---
name: ContextForge
url: https://ibm.github.io/mcp-context-forge/
docs: https://ibm.github.io/mcp-context-forge/overview/
repo: https://github.com/IBM/mcp-context-forge
stars: 4848
domain: ai
category: mcp-tooling
description: 여러 MCP 서버·REST·gRPC API 를 하나의 MCP 엔드포인트로 묶는 IBM 의 오픈소스 게이트웨이·레지스트리. 인증, 속도 제한, 관측성을 중앙에서 관리할 때 쓴다.
pricing: oss
tags: [mcp, gateway, proxy, registry, a2a, observability]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
ContextForge(PyPI 패키지 `mcp-contextforge-gateway`, 실행 명령 `mcpgateway`)는 IBM 이 공개한 MCP 게이트웨이다. 흩어진 [MCP](/develop-wiki/ai/mcp-tooling/model-context-protocol/) 서버, REST·gRPC API, A2A 에이전트를 등록해 하나의 카탈로그로 모으고, 그중 필요한 도구만 골라 **가상 서버**(virtual server)라는 MCP 엔드포인트로 다시 내보낸다. 클라이언트는 서버마다 따로 붙는 대신 게이트웨이 하나에 연결하고, 인증·재시도·속도 제한·감사 로그는 게이트웨이에서 처리한다.
Python(FastAPI) 으로 작성됐고 PyPI·컨테이너 이미지로 배포된다. 관리 UI, OpenTelemetry 트레이싱, Redis 기반 다중 인스턴스 페더레이션, 40개 이상의 플러그인을 제공한다.
**v1.1 기준**(2026-11 현재 1.1.1). PyPI 메타데이터상 Python 3.12 이상 3.15 미만이 필요하다(README 의 전제 조건 표기 3.11 보다 엄격하므로 PyPI 기준을 따른다).

## 설치
`JWT_SECRET_KEY` 와 `AUTH_ENCRYPTION_SECRET` 이 없으면 시작하지 않는다(로컬 개발 포함). 패키지에 들어 있는 스크립트로 생성한다.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install mcp-contextforge-gateway
curl -O https://raw.githubusercontent.com/IBM/mcp-context-forge/main/.env.example
cp .env.example .env
python3 -m mcpgateway.scripts.init_secrets --patch-env .env   # 비밀값 생성·주입
mcpgateway --host 127.0.0.1 --port 4444
```

컨테이너는 `ghcr.io/ibm/mcp-context-forge:latest` 이미지를 쓴다. 운영 구성은 저장소의 `docker compose`(PostgreSQL + Redis + Nginx) 를 기준으로 한다. 공식 문서에 따르면 arm64 는 운영 환경 지원 대상이 아니다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Gateway(peer) | 등록된 상위 MCP 서버. `POST /gateways` 로 URL 을 등록하면 도구 목록을 가져온다 |
| Tools / Resources / Prompts 레지스트리 | 등록된 모든 서버의 구성 요소를 모은 통합 카탈로그 |
| 가상 서버 | 카탈로그에서 고른 도구 묶음. `/servers/<id>/mcp` 로 독립 MCP 엔드포인트가 됨 |
| REST·gRPC 가상화 | MCP 가 아닌 API 를 JSON Schema 를 붙인 도구로 감싸 노출 |
| `mcpgateway.translate` | stdio 전용 서버를 SSE·Streamable HTTP 로 바꿔 주는 전송 브리지 |
| `mcpgateway.wrapper` | 반대로 게이트웨이를 stdio 서버처럼 보이게 해 stdio 만 지원하는 클라이언트를 연결 |
| 인증 | 관리 API 는 JWT Bearer 토큰, 상위 서버 호출에는 사용자별 OAuth 토큰·헤더 전달 지원 |
| 플러그인 | 요청·응답 단계에 끼우는 확장(필터링, 변환, 추가 전송 등) |

## 기본 사용법
stdio 서버를 HTTP 로 띄우고 게이트웨이에 등록한 뒤 가상 서버로 묶는 흐름:

```bash
# 1) stdio 서버(mcp-server-git)를 SSE 로 노출 (/sse)
python3 -m mcpgateway.translate --stdio "uvx mcp-server-git" --expose-sse --port 9000

# 2) 관리용 토큰 발급 (.env 의 JWT_SECRET_KEY 사용)
export TOKEN=$(python3 -m mcpgateway.utils.create_jwt_token \
  --username admin@example.com --exp 60 --secret "$JWT_SECRET_KEY")

# 3) 상위 서버 등록 → 도구 카탈로그 확인
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"git","url":"http://localhost:9000/sse"}' http://localhost:4444/gateways
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4444/tools | jq
```

이어서 `POST /servers` 에 `associated_tools`(도구 ID 목록)를 넣어 가상 서버를 만들고, 클라이언트는 `http://localhost:4444/servers/<서버 UUID>/mcp` 에 Bearer 토큰 헤더와 함께 연결한다. 연결 확인에는 [MCP Inspector](/develop-wiki/ai/mcp-tooling/mcp-inspector/) 를 쓴다.

## 자주 쓰는 패턴
- **팀별 도구 묶음**: 같은 상위 서버들에서 팀·에이전트마다 필요한 도구만 고른 가상 서버를 따로 만들어, 모델에 노출되는 도구 수와 권한을 줄인다.
- **stdio 전용 클라이언트 연결**: 클라이언트 설정에서 `python3 -m mcpgateway.wrapper` 를 실행하고 `MCP_SERVER_URL`(가상 서버 URL)과 `MCP_AUTH`(Bearer 토큰)를 환경 변수로 준다.
- **사내 API 의 MCP 화**: 기존 REST 엔드포인트를 도구로 등록하고 재시도·타임아웃·속도 제한 정책을 게이트웨이에서 건다. gRPC 는 서버 리플렉션으로 메서드를 자동 발견한다.
- **관측성**: OTLP 내보내기를 켜서 도구 호출 트레이스를 Phoenix·Jaeger 등으로 보낸다.
- **비밀값 관리**: 토큰·비밀 키는 `.env`·시크릿 매니저로만 다루고, 관리 UI·관리 API(`MCPGATEWAY_UI_ENABLED`, `MCPGATEWAY_ADMIN_API_ENABLED`)는 필요한 환경에서만 켠다.

## 언제 쓰나 / 피할 때
- 쓸 때: 조직에서 MCP 서버가 여러 개로 늘어 인증·감사·접근 제어를 한곳에서 관리해야 할 때, stdio 서버를 원격 HTTP 서버로 공유할 때, 사내 REST·gRPC 서비스를 에이전트 도구로 내보낼 때.
- 피할 때(대안): 개인 개발 환경에서 서버 몇 개를 쓰는 정도라면 클라이언트에 직접 등록하는 편이 단순하다. Python 코드 안에서 서버 몇 개를 합치는 정도라면 [FastMCP](/develop-wiki/ai/mcp-tooling/fastmcp/) 의 `mount()`·프록시로 충분하다. 공개 서버 검색·배포는 [MCP Registry](/develop-wiki/ai/mcp-tooling/mcp-registry/) 의 역할이다. 운영 시 PostgreSQL·Redis 등 구성 요소가 늘어나는 비용을 감안한다.

## 공식 문서
- [문서 홈](https://ibm.github.io/mcp-context-forge/) · [개요](https://ibm.github.io/mcp-context-forge/overview/) · [README Quick Start](https://github.com/IBM/mcp-context-forge#quick-start---pypi)
- [전송 브리지(translate)](https://ibm.github.io/mcp-context-forge/using/mcpgateway-translate/) · [stdio 래퍼](https://ibm.github.io/mcp-context-forge/using/mcpgateway-wrapper/) · [관측성](https://ibm.github.io/mcp-context-forge/manage/observability/)
- [GitHub](https://github.com/IBM/mcp-context-forge) · [PyPI](https://pypi.org/project/mcp-contextforge-gateway/)
