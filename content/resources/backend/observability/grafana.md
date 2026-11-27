---
name: Grafana
url: https://grafana.com/oss/grafana/
docs: https://grafana.com/docs/grafana/latest/
repo: https://github.com/grafana/grafana
stars: 78223
domain: backend
category: observability
description: Prometheus·Loki·Tempo·SQL DB 등 여러 데이터 소스를 연결해 대시보드와 알림을 만드는 시각화 플랫폼. AGPLv3 오픈소스이며 매니지드 Grafana Cloud 도 있다.
pricing: oss
tags: [dashboard, visualization, alerting, metrics, logs, traces]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Grafana 는 데이터를 직접 저장하지 않고 **데이터 소스**(Prometheus, Loki, Tempo, Jaeger, Elasticsearch, PostgreSQL, MySQL, ClickHouse 등)에 쿼리를 보내 결과를 패널로 그리는 웹 애플리케이션이다. 메트릭·로그·트레이스를 한 화면에서 오가며 볼 수 있고, 같은 쿼리로 알림 규칙도 만든다. 2026-11 기준 최신 릴리스는 v13.3.1, 저장소 라이선스는 AGPL-3.0 이다.

배포판은 두 가지다. `grafana/grafana`(오픈소스 빌드)와 `grafana/grafana-enterprise`(라이선스 없이 쓰면 OSS 기능만 동작, 공식 문서는 이쪽을 기본 권장). 운영 부담 없이 쓰려면 Grafana Cloud(무료 티어 있음)도 선택지다.

## 설치
```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana      # http://localhost:3000
```
첫 로그인은 `admin` / `admin` 이며 바로 비밀번호 변경을 요구한다. 운영에서는 `GF_SECURITY_ADMIN_PASSWORD` 같은 `GF_<섹션>_<키>` 환경 변수나 `grafana.ini` 로 설정한다. 메타데이터 저장소는 기본 SQLite 이고 여러 인스턴스를 띄울 때는 MySQL·PostgreSQL 로 바꾼다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Data source | 쿼리 대상 백엔드 연결 정보. 플러그인으로 확장 |
| Dashboard / Panel | 패널(시계열, 표, 통계, 히트맵, 로그 등)을 배치한 화면. JSON 모델로 저장 |
| Variable | `$service` 같은 드롭다운 변수로 한 대시보드를 여러 대상에 재사용 |
| Explore | 대시보드 없이 쿼리를 바로 실행하는 화면. 로그·트레이스 탐색에 주로 쓴다 |
| Alerting | 데이터 소스 쿼리 기반 알림 규칙, 연락 지점(contact point), 알림 정책 |
| Provisioning | 데이터 소스·대시보드·알림을 YAML/JSON 파일로 선언해 시작 시 자동 등록 |
| Correlations | 메트릭 → 트레이스(exemplar) → 로그로 이동하는 링크 |
| Organization / Folder / Team | 권한 단위 |

## 기본 사용법
데이터 소스를 파일로 등록한다(`/etc/grafana/provisioning/datasources/` 아래).
```yaml
# datasources.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
```
대시보드 JSON 을 폴더에서 읽게 하는 프로바이더.
```yaml
# /etc/grafana/provisioning/dashboards/default.yml
apiVersion: 1
providers:
  - name: dashboards
    type: file
    options:
      path: /var/lib/grafana/dashboards
```
Docker Compose 로 함께 띄우는 예.
```yaml
services:
  grafana:
    image: grafana/grafana
    ports: ['3000:3000']
    environment:
      GF_SECURITY_ADMIN_PASSWORD: change-me
    volumes:
      - ./provisioning:/etc/grafana/provisioning
      - ./dashboards:/var/lib/grafana/dashboards
```
패널 쿼리 예: Prometheus 데이터 소스에서 `sum by (status) (rate(http_requests_total{job="$service"}[$__rate_interval]))` — `$__rate_interval` 은 스크레이프 주기에 맞춰 Grafana 가 채우는 내장 변수다.

## 자주 쓰는 패턴
- **대시보드를 코드로**: UI 에서 만든 대시보드를 JSON 으로 내보내 Git 에 두고 provisioning 으로 배포한다. 더 큰 규모는 Terraform provider 나 Grafana 의 Git 연동 기능을 쓴다.
- **LGTM 스택**: Loki(로그)·Grafana·Tempo(트레이스)·Mimir(메트릭)를 묶어 쓰는 Grafana Labs 의 조합. 수집 에이전트는 Grafana Alloy.
- **공개 대시보드 재사용**: grafana.com 의 커뮤니티 대시보드(node_exporter 등)를 ID 로 가져와 시작점으로 쓴다.
- **트레이스-로그 연결**: 데이터 소스 설정에서 trace id 필드를 링크로 지정해 로그 줄에서 [Jaeger](/develop-wiki/backend/observability/jaeger/)·Tempo 트레이스로 이동한다.

## 언제 쓰나 / 피할 때
- 쓸 때: [Prometheus](/develop-wiki/backend/observability/prometheus/)·[Loki](/develop-wiki/backend/observability/loki/) 등 오픈소스 관측성 백엔드의 공통 화면, 여러 DB 를 한 대시보드에서 보는 운영 현황판.
- 피할 때(대안): AGPL 조건이 문제가 되는 형태로 수정·재배포해야 하면 법무 검토가 필요하다(Grafana 를 그대로 내부 운영하는 데는 영향이 적다). 비즈니스 BI·임의 분석에는 Metabase·Superset 같은 BI 도구가, 단순 에러 추적에는 [Sentry](/develop-wiki/backend/observability/sentry/) 가 맞다.

## 공식 문서
- [문서 홈](https://grafana.com/docs/grafana/latest/) · [Docker 설치](https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/) · [Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/) · [Alerting](https://grafana.com/docs/grafana/latest/alerting/) · [라이선스(GitHub)](https://github.com/grafana/grafana/blob/main/LICENSE)
