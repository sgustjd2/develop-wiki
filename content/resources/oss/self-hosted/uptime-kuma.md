---
name: Uptime Kuma
url: https://uptime.kuma.pet
docs: https://github.com/louislam/uptime-kuma/wiki
repo: https://github.com/louislam/uptime-kuma
stars: 94597
domain: oss
category: self-hosted
description: HTTP·TCP·Ping·DNS·Docker 컨테이너 등을 주기적으로 확인하고 장애 시 Slack·Telegram 등으로 알리는 업타임 모니터링 도구. 상태 페이지도 만든다. MIT 라이선스.
pricing: oss
tags: [monitoring, uptime, status-page, alerting, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Uptime Kuma 는 웹 UI 에서 모니터를 등록하면 일정 간격으로 대상에 요청을 보내 응답·지연 시간을 기록하고, 다운되면 알림을 보내는 단일 컨테이너 모니터링 도구다. 외부 SaaS(UptimeRobot 등) 대신 직접 띄우는 블랙박스 모니터링 용도로 쓴다. 2026-11 기준 안정 릴리스는 `2.5.12`, `3.0.0-beta.1` 이 프리릴리스로 나와 있다. MIT 라이선스.

## Docker Compose 빠른 시작
```yaml
# compose.yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```
```bash
docker compose up -d     # http://localhost:3001 에서 관리자 계정 생성
```
데이터 폴더는 POSIX 파일 잠금을 지원하는 로컬 디렉터리나 볼륨이어야 한다. NFS 같은 네트워크 파일시스템에 두면 SQLite DB 가 손상될 수 있다고 공식 위키가 경고한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Monitor | 확인 대상 하나. HTTP(s), 키워드 포함 여부, JSON 쿼리, TCP 포트, Ping, DNS, Docker 컨테이너, DB 등 |
| Push monitor | 반대로 대상이 Uptime Kuma 의 URL 을 주기적으로 호출. 끊기면 장애로 판단(하트비트) |
| Heartbeat interval / Retries | 확인 주기와 장애 판정 전 재시도 횟수 |
| Notification | Slack, Discord, Telegram, 이메일(SMTP), 웹훅 등 알림 채널 |
| Status Page | 모니터를 묶어 공개 상태 페이지로 노출. 사용자 도메인 연결 가능 |
| Maintenance | 점검 시간대에 알림을 멈추고 상태 페이지에 표시 |

## 개발에서 쓰는 방법
- **서비스 헬스체크:** `/healthz` 엔드포인트를 HTTP 모니터로 등록하고, 응답 본문 키워드까지 확인.
- **크론·배치 감시:** Push monitor URL 을 배치 작업 끝에 호출하면 "작업이 안 돌았음"을 잡을 수 있다.
```bash
# 백업 스크립트 마지막 줄
curl -fsS "https://kuma.example.com/api/push/<push-token>?status=up&msg=OK" > /dev/null
```
- **인증서 만료 알림:** HTTPS 모니터의 TLS 인증서 만료 알림 옵션.
- **사이드 프로젝트 상태 페이지:** 여러 서비스를 묶은 공개 상태 페이지를 무료로 운영.

## 운영 주의: 백업·업데이트·보안
- **백업:** `/app/data`(SQLite DB, 업로드 파일) 디렉터리를 컨테이너를 멈춘 상태로 복사하는 게 가장 안전하다.
- **업데이트:** `docker compose pull && docker compose up -d`. 1.x → 2.x 는 DB 마이그레이션이 동반되므로 백업 후 진행하고 릴리스 노트를 확인한다. 3.0 은 아직 베타다.
- **보안:** 관리 화면은 리버스 프록시 + HTTPS 뒤에 두고, 상태 페이지만 공개한다. Docker 컨테이너 모니터링을 위해 Docker 소켓을 마운트하면 컨테이너 전체 제어 권한을 주는 것과 같으니 필요할 때만 쓴다.
- 모니터링 서버 자체가 죽으면 알림도 없다. 감시 대상과 다른 호스트·리전에 두는 것이 원칙.

## 언제 쓰나 / 피할 때
- 쓸 때: 소규모 팀·개인 서비스의 외부 가용성 확인, 크론 하트비트, 간단한 상태 페이지.
- 피할 때(대안): 메트릭 수집·쿼리·대시보드가 필요하면 [Prometheus](/develop-wiki/backend/observability/prometheus/) + [Grafana](/develop-wiki/backend/observability/grafana/), 애플리케이션 오류 추적은 [Sentry](/develop-wiki/backend/observability/sentry/).

## 공식 문서
- [설치 가이드(위키)](https://github.com/louislam/uptime-kuma/wiki/%F0%9F%94%A7-How-to-Install) · [compose.yaml](https://github.com/louislam/uptime-kuma/blob/master/compose.yaml) · [릴리스](https://github.com/louislam/uptime-kuma/releases)
