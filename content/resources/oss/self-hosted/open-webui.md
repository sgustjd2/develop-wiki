---
name: Open WebUI
url: https://openwebui.com
docs: https://docs.openwebui.com
repo: https://github.com/open-webui/open-webui
stars: 159157
domain: oss
category: self-hosted
description: Ollama 와 OpenAI 호환 API 에 붙여 쓰는 ChatGPT 형태의 셀프 호스팅 채팅 UI. BSD-3 에 브랜딩 유지 조항이 추가된 자체 라이선스라 50명 초과 배포에서 로고 변경이 제한된다.
pricing: source-available
tags: [llm, chat-ui, ollama, rag, openai-compatible, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Open WebUI 는 로컬 모델([Ollama](/develop-wiki/ai/inference-serving/ollama/), [vLLM](/develop-wiki/ai/inference-serving/vllm/) 등)이나 OpenAI 호환 API 를 연결해 팀이 함께 쓰는 웹 채팅 환경을 만든다. 사용자·권한 관리, 문서 업로드 기반 RAG, 웹 검색, 도구·함수 확장을 한 컨테이너로 제공한다. 2026-11 기준 최신 릴리스는 `v0.13.4`.

**라이선스 주의:** "Open WebUI License" 는 BSD-3-Clause 본문에 4번 조항을 추가했다. 최근 30일 기준 **최종 사용자 50명 이하**인 배포, 서면 허가, 엔터프라이즈 라이선스 중 하나에 해당하지 않으면 "Open WebUI" 이름·로고 등 **브랜딩을 바꾸거나 지울 수 없다**. 이 조항 때문에 OSI 라이선스가 아니며(이전 버전 코드는 `LICENSE_HISTORY` 의 원래 라이선스 유지), 이 사이트에서는 source-available 로 분류한다.

## Docker Compose 빠른 시작
```yaml
# compose.yaml — 호스트에서 Ollama 가 11434 포트로 돌고 있다고 가정
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    environment:
      WEBUI_SECRET_KEY: ${WEBUI_SECRET_KEY}       # openssl rand -hex 32, 고정할 것
      # OLLAMA_BASE_URL: http://ollama-server:11434   # 다른 서버면 지정
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - open-webui:/app/backend/data
    restart: unless-stopped
volumes:
  open-webui:
```
```bash
echo "WEBUI_SECRET_KEY=$(openssl rand -hex 32)" > .env
docker compose up -d     # http://localhost:3000
```
처음 만든 계정이 관리자가 되고, 그 뒤 가입은 꺼진다. 다른 사람을 받으려면 관리자 설정에서 New Sign Ups 를 켜고 대기(Pending) 계정을 승인한다. `OLLAMA_BASE_URL` 을 비워 두면 `host.docker.internal:11434` 를 먼저 찾는다. 이미지 태그는 `:main` 외에 `:cuda`, `:ollama`(Ollama 내장), `:slim` 이 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Connections | Ollama, OpenAI 호환 엔드포인트(여러 개) 등록. 모델 목록이 합쳐져 보인다 |
| Models (워크스페이스) | 기본 모델 + 시스템 프롬프트 + 지식 + 도구를 묶은 사용자 정의 모델 |
| Knowledge | 문서 컬렉션을 임베딩해 채팅에서 `#` 로 참조하는 RAG |
| Tools / Functions | Python 으로 쓰는 확장. Tools 는 모델이 호출, Functions 는 필터·파이프 등 UI 동작 확장 |
| Users / Groups | 역할(admin, user, pending)과 그룹별 모델·지식 접근 권한 |
| API | OpenAI 호환 형태의 API 를 제공해 다른 도구에서 호출 가능 |

## 개발에서 쓰는 방법
- **팀 공용 LLM 게이트웨이:** GPU 서버 한 대에 Ollama/vLLM 을 띄우고 Open WebUI 로 계정·권한을 나눠 공유.
- **사내 문서 질의:** 설계 문서·런북을 Knowledge 로 올려 질의.
- **모델 비교:** 한 화면에서 여러 모델을 동시에 선택해 같은 프롬프트로 답을 비교.
- **도구 확장:** 사내 API 를 호출하는 Python Tool 을 작성해 채팅에서 사용.

## 운영 주의: 백업·업데이트·보안
- **백업:** `/app/backend/data` 볼륨(기본 SQLite DB, 업로드 파일, 벡터 인덱스)을 통째로 백업한다. 외부 PostgreSQL 을 쓰면 DB 덤프도 함께.
- **업데이트:** `docker compose pull && docker compose up -d`. `:main` 은 계속 움직이므로 운영은 버전 태그로 고정하고 릴리스 노트를 확인한다.
- **보안:** `WEBUI_SECRET_KEY` 를 고정하지 않으면 컨테이너를 다시 만들 때마다 모두 로그아웃된다. Tools/Functions 는 서버에서 임의 Python 을 실행하므로 관리자만 설치하게 하고, 외부 공개 시 HTTPS 프록시와 가입 승인 정책을 유지한다.
- **라이선스:** 사용자 50명이 넘는 조직에서 이름·로고를 바꿔 배포하려면 엔터프라이즈 라이선스가 필요하다.

## 언제 쓰나 / 피할 때
- 쓸 때: 로컬·사내 모델을 여러 사람이 브라우저로 쓰게 하고 싶을 때.
- 피할 때(대안): LLM 앱을 만들어 API 로 배포하는 게 목적이면 [Dify](/develop-wiki/oss/self-hosted/dify/), 혼자 데스크톱에서 모델을 돌리는 정도면 [LM Studio](/develop-wiki/ai/inference-serving/lm-studio/).

## 공식 문서
- [Quick Start](https://docs.openwebui.com/getting-started/quick-start/) · [문서 홈](https://docs.openwebui.com) · [LICENSE](https://github.com/open-webui/open-webui/blob/main/LICENSE)
