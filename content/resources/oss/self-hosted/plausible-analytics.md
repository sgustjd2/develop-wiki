---
name: Plausible Analytics
url: https://plausible.io
docs: https://plausible.io/docs
repo: https://github.com/plausible/analytics
stars: 29901
domain: oss
category: self-hosted
description: 쿠키 없이 페이지뷰·유입·이벤트를 집계하는 경량 웹 분석 도구. Google Analytics 대안으로 쓰며 셀프 호스팅판(Community Edition)은 AGPL-3.0, 유료 클라우드도 있다.
pricing: oss
tags: [web-analytics, privacy, clickhouse, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Plausible 은 개인 식별 정보와 쿠키 없이 방문 통계를 수집하는 웹 분석 도구다. 한 페이지짜리 대시보드에 방문자, 페이지뷰, 유입 경로, 국가·기기, 목표(전환)를 보여 주고, 스크립트가 가벼워 페이지 성능 영향이 적다. 셀프 호스팅판 **Plausible Community Edition(CE)** 은 Elixir 앱 + PostgreSQL + ClickHouse 로 구성된다. 2026-11 기준 최신 릴리스는 `v3.2.1`. 앱 저장소는 AGPL-3.0, CE 배포용 compose 저장소(`plausible/community-edition`)는 MIT 다.

## Docker Compose 빠른 시작
공식 `community-edition` 저장소의 compose 를 쓴다. ClickHouse 때문에 CPU 가 SSE 4.2(또는 ARM NEON)를 지원해야 하고 RAM 2GB 정도가 권장된다.
```bash
git clone -b v3.2.1 --single-branch https://github.com/plausible/community-edition plausible-ce
cd plausible-ce
cat > .env <<EOF
BASE_URL=http://localhost:8000
SECRET_KEY_BASE=$(openssl rand -base64 48)
HTTP_PORT=80
EOF
```
```yaml
# compose.override.yml — 로컬 테스트용 포트 노출
services:
  plausible:
    ports:
      - 8000:80
```
```bash
docker compose up -d     # BASE_URL 로 접속해 첫 사용자 생성
```
운영에서는 `BASE_URL=https://plausible.example.com`, `HTTPS_PORT=443` 을 추가하고 80·443 을 노출하면 내장 Let's Encrypt 로 인증서를 받는다(도메인 DNS 가 서버를 가리켜야 함).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Site | 추적할 도메인 단위. 사이트마다 추적 스크립트를 넣는다 |
| Pageview / Visitor | 쿠키 대신 일 단위로 바뀌는 해시로 고유 방문자를 추정 |
| Goal | 특정 페이지 방문이나 커스텀 이벤트를 전환 목표로 정의 |
| Custom event / Props | `plausible('Signup', { props: { plan: 'pro' } })` 처럼 이벤트와 속성 기록 |
| Stats API | 집계 데이터를 조회하는 API (내부 대시보드·리포트 자동화) |
| Events API | 서버 측에서 이벤트를 직접 전송 |
| Shared link | 로그인 없이 볼 수 있는 대시보드 공유 링크 |

## 개발에서 쓰는 방법
- **제품 지표 계측:** 가입·결제 버튼 클릭을 커스텀 이벤트로 보내 전환율 확인.
- **문서 사이트 분석:** [Docusaurus](/develop-wiki/devtools/docs/docusaurus/)·[VitePress](/develop-wiki/devtools/docs/vitepress/) 문서 사이트에 스크립트를 넣어 많이 읽히는 페이지 파악.
- **동의 배너 최소화:** 쿠키를 쓰지 않아 지역 규정에 따라 쿠키 동의 부담을 줄일 수 있다(법적 판단은 서비스별로 확인).
- **리포트 자동화:** Stats API 로 주간 지표를 가져와 Slack 에 게시.

## 운영 주의: 백업·업데이트·보안
- **백업:** PostgreSQL(사용자·사이트 설정)과 ClickHouse(이벤트 데이터) 볼륨을 모두 백업해야 한다. `.env` 의 `SECRET_KEY_BASE` 도 보관.
- **업데이트:** CE 저장소의 새 태그로 체크아웃한 뒤 `docker compose pull && docker compose up -d`. 메이저 업그레이드(예: v2 → v3)는 CE 위키의 업그레이드 안내를 따른다.
- **보안:** 첫 계정 생성 후 회원가입 허용 범위(CE 설정 문서의 registration 항목)를 확인해 아무나 가입하지 못하게 하고, 대시보드 접근은 HTTPS 로만 허용한다.
- 광고 차단기가 기본 스크립트 경로를 막을 수 있어 프록시 경로를 쓰는 방법이 문서에 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 개인정보 부담이 적은 간단한 방문 분석, 블로그·문서·마케팅 사이트.
- 피할 때(대안): 더 가볍게 PostgreSQL 하나로 운영하려면 [Umami](/develop-wiki/oss/self-hosted/umami/), 사용자 단위 퍼널·세션 리플레이 같은 제품 분석이 필요하면 전용 제품 분석 도구.

## 공식 문서
- [Community Edition 저장소](https://github.com/plausible/community-edition) · [문서 홈](https://plausible.io/docs) · [Self-hosting 안내](https://plausible.io/self-hosted-web-analytics)
