---
name: Umami
url: https://umami.is
docs: https://docs.umami.is
repo: https://github.com/umami-software/umami
stars: 40278
domain: oss
category: self-hosted
description: PostgreSQL 하나로 운영하는 경량·쿠키리스 웹 분석 도구. 페이지뷰·유입·커스텀 이벤트를 집계하며 Next.js 로 만들어졌다. MIT 라이선스, 유료 Umami Cloud 도 있다.
pricing: oss
tags: [web-analytics, privacy, nextjs, postgresql, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Umami 는 Google Analytics 대신 쓰는 개인정보 친화적 웹 분석 도구로, 추적 스크립트 한 줄을 넣으면 방문자·페이지뷰·유입·기기·국가와 커스텀 이벤트를 대시보드로 보여 준다. 앱은 Next.js, 저장소는 PostgreSQL(최소 v12.14) 하나라서 [Plausible](/develop-wiki/oss/self-hosted/plausible-analytics/) 보다 구성이 단순하다. 2026-11 기준 최신 릴리스는 `v3.5.0`. MIT 라이선스.

## Docker Compose 빠른 시작
```yaml
# compose.yaml (공식 저장소 예시를 줄인 것)
services:
  umami:
    image: ghcr.io/umami-software/umami:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      APP_SECRET: ${APP_SECRET:?set APP_SECRET}   # openssl rand -hex 32
    depends_on:
      db:
        condition: service_healthy
    restart: always
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami"]
      interval: 5s
      retries: 5
volumes:
  umami-db-data:
```
```bash
echo "APP_SECRET=$(openssl rand -hex 32)" > .env
docker compose up -d     # http://localhost:3000
```
기본 계정은 `admin` / `umami` 이며, v3.5.0 부터 첫 로그인 후 비밀번호 변경이 강제된다. 공식 compose 는 2단계 인증용 `TWO_FACTOR_ENCRYPTION_KEY` 도 받는다(2FA 를 쓰면 64자리 hex 로 설정).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Website | 추적 대상. 등록하면 `website-id` 가 발급된다 |
| Tracker script | `<script defer src=".../script.js" data-website-id="...">` 한 줄 |
| Event | `data-umami-event` 속성이나 `umami.track()` 으로 보내는 커스텀 이벤트 |
| Team | 여러 사용자가 웹사이트를 공유하는 단위 |
| Reports | 퍼널, 리텐션, UTM, 목표 등 분석 리포트 |
| API | 통계 조회·이벤트 전송 REST API |

## 개발에서 쓰는 방법
```html
<script defer src="https://umami.example.com/script.js"
        data-website-id="00000000-0000-0000-0000-000000000000"></script>

<button data-umami-event="signup-click" data-umami-event-plan="pro">가입</button>
```
```javascript
// SPA 에서 코드로 이벤트 전송
window.umami?.track('checkout', { plan: 'pro', price: 9 });
```
- **사이드 프로젝트·문서 사이트 분석:** 가볍게 띄워 여러 사이트를 한 인스턴스에서 관리.
- **기능 사용량 계측:** 버튼·기능별 이벤트로 어떤 기능이 쓰이는지 확인.
- **공유 대시보드:** 공개 공유 URL 로 팀·고객에게 통계 노출.

## 운영 주의: 백업·업데이트·보안
- **백업:** 모든 데이터가 PostgreSQL 에 있으므로 `pg_dump` 를 정기 실행하면 된다.
- **업데이트:** `docker compose pull && docker compose up -d`. 시작 시 DB 마이그레이션이 자동 실행되므로 메이저 버전(예: v2 → v3) 전에는 백업하고 릴리스 노트를 확인한다. `latest` 대신 버전 태그 고정을 권장.
- **보안:** 기본 비밀번호를 즉시 바꾸고, `APP_SECRET` 은 고정·비공개로 유지한다. 트래킹 스크립트(`/script.js`, `/api/send`)만 공개하고 관리 화면은 HTTPS 로 보호한다. 광고 차단기 회피가 필요하면 스크립트 이름을 바꾸는 환경 변수가 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: PostgreSQL 하나로 끝나는 단순한 웹 분석, 여러 개의 작은 사이트.
- 피할 때(대안): 트래픽이 매우 많아 분석 DB 성능이 중요하면 ClickHouse 기반 [Plausible](/develop-wiki/oss/self-hosted/plausible-analytics/), 데이터 웨어하우스 수준 분석은 [Metabase](/develop-wiki/data-ml/analytics-bi/metabase/) 같은 BI 도구와 원천 데이터 조합.

## 공식 문서
- [설치](https://docs.umami.is/docs/install) · [이벤트 추적](https://docs.umami.is/docs/track-events) · [API](https://docs.umami.is/docs/api)
