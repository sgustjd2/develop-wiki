---
name: Dify
url: https://dify.ai
docs: https://docs.dify.ai
repo: https://github.com/langgenius/dify
stars: 161950
domain: oss
category: self-hosted
description: 챗봇·RAG·에이전트·LLM 워크플로를 화면에서 만들고 API 로 배포하는 LLM 앱 플랫폼. 수정된 Apache 2.0 라 멀티테넌트 서비스 운영과 로고 제거는 상용 라이선스가 필요하다.
pricing: source-available
tags: [llm, rag, ai-agent, workflow, low-code, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Dify 는 프롬프트, 지식 베이스(RAG), 도구 호출, 분기·반복을 시각적 캔버스로 조립해 LLM 애플리케이션을 만들고, 만든 앱을 웹 UI·REST API 로 바로 배포하는 플랫폼이다. 모델 공급자(OpenAI, Anthropic, Gemini, 로컬 Ollama 등)는 플러그인으로 연결한다. 2026-11 기준 최신 릴리스는 `1.20.0`.

**라이선스 주의:** 저장소 LICENSE 는 "Apache 2.0 수정판"이다. 상업적 사용은 가능하지만 ① 서면 허가 없이 Dify 소스로 **멀티테넌트 서비스**(워크스페이스 = 테넌트)를 운영할 수 없고 ② 프런트엔드(`web/`, `web` 이미지)의 **로고·저작권 표시를 제거·변경할 수 없다**. 따라서 OSI 오픈소스가 아니며 이 사이트에서는 source-available 로 분류한다.

## Docker Compose 빠른 시작
서비스(API, worker, web, 플러그인 데몬, 샌드박스, PostgreSQL, Redis, 벡터 DB, nginx)가 많아 직접 compose 를 쓰기보다 저장소의 `docker/` 구성을 그대로 쓴다. Docker Compose v2.35.0 이상 필요.
```bash
git clone --depth 1 https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
openssl rand -hex 32   # 출력값을 .env 의 DIFY_AGENT_LOCAL_SANDBOX_AUTH_TOKEN 에 넣는다
docker compose up -d
docker compose ps --all   # init_permissions 는 코드 0 으로 끝나는 게 정상
```
브라우저에서 `http://localhost/install` 로 관리자 계정을 만든다. 기본 `COMPOSE_PROFILES=weaviate,postgresql,collaboration` 로 Weaviate 를 벡터 DB 로 쓴다. 서비스별 설정은 `envs/**/*.defaults` 를 같은 위치의 `.env` 로 복사해 덮어쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| App 유형 | Chatbot, Agent, Chatflow(대화형 워크플로), Workflow(단발 실행), Text Generator |
| Workflow 캔버스 | LLM, 지식 검색, 코드, HTTP, 조건 분기, 반복 노드를 연결 |
| Knowledge | 문서를 업로드해 청크·임베딩·인덱싱. 앱에서 검색 노드로 사용 |
| Plugin | 모델 공급자·도구·에이전트 전략을 플러그인으로 설치 (1.x 의 확장 방식) |
| Sandbox | Code 노드의 Python·JavaScript 를 격리 실행하는 컨테이너 |
| API / Web App | 앱마다 API 키가 발급되고, 공개 웹 앱·임베드 위젯으로 배포 |
| Logs & Annotation | 대화 로그 확인, 답변 교정, 관측 도구(Langfuse 등) 연동 |

## 개발에서 쓰는 방법
- **사내 문서 Q&A:** 위키·PDF 를 Knowledge 로 넣고 Chatflow 로 질의응답 봇을 만든 뒤 Slack 봇이나 사내 웹에서 API 로 호출.
- **LLM 기능 프로토타입:** 프롬프트·검색 파라미터를 화면에서 바꿔 가며 실험하고, 확정되면 앱 API 를 서비스 백엔드에서 호출.
- **배치 Workflow:** 입력 → 분류 → 요약 → 결과 반환 같은 파이프라인을 Workflow 앱으로 만들고 `/v1/workflows/run` 엔드포인트로 실행.
```bash
curl -X POST "http://localhost/v1/chat-messages" \
  -H "Authorization: Bearer app-xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"inputs": {}, "query": "배포 절차 알려줘", "response_mode": "blocking", "user": "dev-1"}'
```
- 평가·트레이싱은 [Langfuse](/develop-wiki/ai/evaluation/langfuse/)·[Arize Phoenix](/develop-wiki/ai/evaluation/arize-phoenix/) 같은 도구와 연결한다.

## 운영 주의: 백업·업데이트·보안
- **백업:** PostgreSQL, 벡터 DB 볼륨, 업로드 파일 저장소(`volumes/` 아래), 그리고 `.env` 와 덮어쓴 `envs/**/*.env` 를 함께 보관한다.
- **업데이트:** `git pull` 또는 새 태그 체크아웃 → `docker compose pull` → `up -d`. 기존 배포는 `.env` 를 새 템플릿으로 덮어쓰지 말고 편집한다. README 의 "업그레이드 후 설정 검토" 절을 따른다.
- **보안:** 운영 전에 번들된 기본 자격 증명을 `envs/security.env.example` 기준으로 교체하고, HTTPS 와 신뢰 프록시(클라이언트 IP) 설정을 맞춘다. 모델 API 키가 DB 에 저장되므로 DB 접근을 제한한다.
- **라이선스:** 고객별 워크스페이스를 나눠 SaaS 로 제공하려면 상용 라이선스가 필요하다.

## 언제 쓰나 / 피할 때
- 쓸 때: 비개발자와 함께 LLM 앱을 반복 개선해야 할 때, RAG 챗봇·워크플로를 빠르게 API 로 내보낼 때.
- 피할 때(대안): 코드로 세밀하게 제어하는 에이전트는 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/)·[Mastra](/develop-wiki/ai/agent-framework/mastra/) 같은 프레임워크, 일반 업무 자동화는 [n8n](/develop-wiki/oss/self-hosted/n8n/).

## 공식 문서
- [문서 홈](https://docs.dify.ai) · [Docker 배포 README](https://github.com/langgenius/dify/blob/main/docker/README.md) · [LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE)
