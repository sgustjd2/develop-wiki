---
name: n8n
url: https://n8n.io
docs: https://docs.n8n.io
repo: https://github.com/n8n-io/n8n
stars: 210818
domain: oss
category: self-hosted
description: 노드를 연결해 API 호출·웹훅·DB 작업·LLM 에이전트를 자동화하는 워크플로 도구. Sustainable Use License(fair-code)라 사내 사용은 자유지만 재판매·SaaS 제공은 제한된다.
pricing: source-available
tags: [workflow-automation, webhook, low-code, ai-agent, fair-code, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
n8n 은 트리거(웹훅, 스케줄, 앱 이벤트) → 노드(HTTP 요청, DB 쿼리, Slack 전송, LLM 호출 등) 를 화면에서 연결해 자동화를 만드는 워크플로 엔진이다. Zapier·Make 와 비슷한 위치지만 직접 띄울 수 있고, Code 노드에서 JavaScript·Python 을 바로 쓸 수 있어 개발자가 "작은 백엔드 잡"을 빠르게 만드는 용도로 많이 쓴다. 2026-11 기준 최신 릴리스는 `n8n@2.48.5`.

**라이선스 주의:** 저장소는 OSI 오픈소스가 아니라 **Sustainable Use License**(n8n 이 "fair-code"라 부름)다. 자기 회사 내부 업무·개인·비상업 용도로는 사용·수정이 가능하지만, n8n 을 제3자에게 유료로 제공하거나 호스팅 서비스로 파는 것은 허용되지 않는다. 파일명·디렉터리명에 `.ee` 가 붙은 코드는 별도 Enterprise 라이선스가 있어야 쓸 수 있다.

## Docker Compose 빠른 시작
로컬 실험용 최소 구성(PostgreSQL 사용). 운영은 공식 문서의 Traefik + HTTPS 구성을 참고한다.
```yaml
# compose.yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: n8n
      POSTGRES_DB: n8n
    volumes:
      - pg_data:/var/lib/postgresql/data
  n8n:
    image: n8nio/n8n:2.48.5          # 버전 고정 권장
    ports:
      - "5678:5678"
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: n8n
      GENERIC_TIMEZONE: Asia/Seoul
      TZ: Asia/Seoul
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}   # openssl rand -hex 32
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on: [postgres]
volumes:
  pg_data:
  n8n_data:
```
```bash
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" > .env
docker compose up -d     # http://localhost:5678 에서 소유자 계정 생성
```
기본 DB 는 SQLite 이며, 위처럼 `DB_TYPE=postgresdb` 와 `DB_POSTGRESDB_*` 로 PostgreSQL 로 바꾼다. PostgreSQL 을 써도 `/home/node/.n8n` 볼륨은 유지하라고 문서가 권한다(암호화 키·로그 저장).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Workflow | 노드를 연결한 자동화 단위. JSON 으로 내보내기·가져오기 가능 |
| Trigger node | 워크플로 시작점. Webhook, Schedule, 앱별 이벤트 트리거 |
| Node | 작업 한 단계. 수백 개의 앱 연동 노드 + HTTP Request + Code |
| Item | 노드 사이를 흐르는 데이터 단위(JSON 객체 배열). 노드는 보통 item 마다 실행 |
| Expression | `{{ $json.email }}` 처럼 이전 노드 출력을 참조하는 식 |
| Credentials | API 키·OAuth 토큰. `N8N_ENCRYPTION_KEY` 로 암호화해 DB 에 저장 |
| AI Agent node | LLM + 도구(다른 노드·워크플로)를 묶은 에이전트 노드 |
| Execution | 실행 이력. 실패한 실행을 다시 돌려 디버깅 |

## 개발에서 쓰는 방법
- **웹훅 백엔드:** Webhook 트리거 → 검증 → DB 저장 → Slack 알림. 폼 수신, 결제 이벤트 처리 같은 작은 엔드포인트를 코드 배포 없이 만든다.
- **운영 자동화:** GitHub 이슈·PR 이벤트를 받아 라벨링, 배포 알림, 일일 리포트 메일.
- **LLM 파이프라인:** 문서 수집 → 요약 → 벡터 DB 저장, 혹은 AI Agent 노드로 사내 도구를 호출하는 챗봇. 모델은 OpenAI·Anthropic API 나 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 를 연결.
- **Code 노드:** 매핑이 복잡하면 JavaScript 로 직접 변환.
```javascript
// Code 노드 (Run Once for All Items)
return $input.all().map((item) => ({
  json: { email: item.json.email.toLowerCase(), source: 'signup-form' },
}));
```
- 워크플로 JSON 을 Git 에 보관하거나 n8n CLI(`n8n export:workflow`)로 백업해 환경 간 이동.

## 운영 주의: 백업·업데이트·보안
- **백업:** DB(PostgreSQL 덤프 또는 SQLite 파일)와 `/home/node/.n8n` 볼륨을 함께 백업한다. 암호화 키를 잃으면 저장된 자격 증명을 복호화할 수 없다.
- **업데이트:** 이미지 태그를 고정하고 릴리스 노트의 breaking change 를 확인한 뒤 올린다. 2.x 로 넘어오며 일부 환경 변수가 바뀌었다(예: 2.30.0 부터 `N8N_WEBHOOK_URL` 이 `WEBHOOK_URL` 을 대체).
- **보안:** 외부에 노출할 때는 반드시 HTTPS 리버스 프록시 뒤에 둔다(공식 예시는 Traefik). Code 노드·Execute Command 류 노드는 서버에서 코드를 실행하므로 편집 권한을 신뢰할 수 있는 사람으로 제한하고, `N8N_RESTRICT_FILE_ACCESS_TO` 로 파일 접근 경로를 좁힌다.
- **라이선스:** 고객에게 n8n 자체를 서비스로 제공하는 사업이라면 사용 전 라이선스 조건을 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 SaaS·API 를 엮는 사내 자동화, 웹훅 처리, 빠른 LLM 워크플로 프로토타입.
- 피할 때(대안): 장시간·대량 처리의 내구성 있는 워크플로는 [Temporal](/develop-wiki/backend/messaging/temporal/), 데이터 파이프라인 스케줄링은 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/)·[Kestra](/develop-wiki/data-ml/orchestration/kestra/). OSI 라이선스가 꼭 필요하면 다른 도구를 고른다.

## 공식 문서
- [Docker Compose 설치](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/) · [Docker 설치](https://docs.n8n.io/hosting/installation/docker/) · [Sustainable Use License](https://docs.n8n.io/sustainable-use-license/)
