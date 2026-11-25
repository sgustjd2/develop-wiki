---
name: Grafana Loki
url: https://grafana.com/oss/loki/
docs: https://grafana.com/docs/loki/latest/
repo: https://github.com/grafana/loki
stars: 29250
domain: backend
category: observability
description: 로그 본문 대신 레이블만 색인하고 압축 청크를 오브젝트 스토리지에 저장하는 로그 수집·조회 시스템. 저렴한 대량 로그 보관과 Grafana 연동에 쓴다. AGPLv3.
pricing: oss
tags: [logs, logql, grafana, object-storage, lgtm]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Loki 는 "로그용 Prometheus" 를 표방한 Grafana Labs 의 로그 집계 시스템이다. 로그 내용 전체를 역색인하는 Elasticsearch 와 달리 **스트림 레이블**(`app`, `namespace`, `level` 등)만 색인하고, 본문은 압축 청크로 S3·GCS 같은 오브젝트 스토리지에 둔다. 색인이 작아 저장 비용이 낮은 대신, 본문 검색은 레이블로 범위를 좁힌 뒤 청크를 훑는 방식이다. 쿼리 언어는 PromQL 을 닮은 **LogQL**. 2026-11 기준 최신 릴리스는 v3.7.10, 라이선스는 AGPL-3.0.

같은 계열로 트레이스 저장소 **Grafana Tempo**(v3.1.x), 메트릭 장기 저장소 **Grafana Mimir**(3.2.x)가 있고, 모두 AGPL-3.0 이다. 화면은 [Grafana](/develop-wiki/backend/observability/grafana/) 의 Explore 를 쓴다.

## 설치
```bash
wget https://raw.githubusercontent.com/grafana/loki/v3.7.0/cmd/loki/loki-local-config.yaml -O loki-config.yaml
docker run --name loki -d -v $(pwd):/mnt/config -p 3100:3100 \
  grafana/loki:3.7.0 -config.file=/mnt/config/loki-config.yaml
curl http://localhost:3100/ready
```
배포 모드는 단일 바이너리(monolithic), 고가용 monolithic, microservices 가 있다. Simple Scalable 모드는 deprecated 이며 Loki 4.0 에서 제거 예정이라 공식 문서는 HA monolithic 을 대체로 권한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Stream | 레이블 조합이 같은 로그 줄의 묶음. 색인 단위 |
| Label | 스트림을 구분하는 키-값. 값 종류가 적은 것만 쓴다(사용자 id·요청 id 금지) |
| Structured metadata | 색인하지 않고 줄에 붙여 두는 메타데이터(trace_id 등). 레이블 폭증을 피하는 수단 |
| Chunk / Index | 압축된 로그 본문과 TSDB 형식의 작은 색인 |
| LogQL | 스트림 선택자 `{...}` + 줄 필터 `|=` + 파서 `| json` + 메트릭 함수 `rate()` |
| Tenant | `X-Scope-OrgID` 헤더로 구분하는 멀티테넌시 (`auth_enabled: true` 일 때) |
| 수집 에이전트 | Grafana Alloy 권장. Promtail 은 2026-03-02 로 EOL. OTLP(`/otlp/v1/logs`)로 직접 보내도 된다 |

## 기본 사용법
Alloy 로 Docker 컨테이너 로그를 수집해 Loki 로 보내는 설정.
```alloy
discovery.docker "containers" {
  host = "unix:///var/run/docker.sock"
}

loki.source.docker "containers" {
  host       = "unix:///var/run/docker.sock"
  targets    = discovery.docker.containers.targets
  forward_to = [loki.write.local.receiver]
}

loki.write "local" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
```
LogQL 예.
```logql
# todo-api 의 error 줄
{app="todo-api"} |= "error"

# JSON 로그를 파싱해 5xx 만, 필요한 필드만 출력
{app="todo-api"} | json | status >= 500 | line_format "{{.method}} {{.path}} {{.status}}"

# 분당 에러 로그 수 (메트릭 쿼리 → 대시보드·알림에 사용)
sum by (app) (count_over_time({namespace="prod"} |= "error" [1m]))
```

## 자주 쓰는 패턴
- **레이블은 적게, 필터는 쿼리에서**: 환경·앱·네임스페이스 정도만 레이블로 두고 나머지는 `| json`, `|=` 로 거른다. 레이블이 많으면 스트림이 잘게 쪼개져 성능이 떨어진다.
- **로그→트레이스 이동**: 로그에 trace id 를 남기고(예: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 로그 브리지) Grafana 데이터 소스의 derived field 로 Tempo·[Jaeger](/develop-wiki/backend/observability/jaeger/) 링크를 만든다.
- **보존 기간**: compactor 의 retention 설정과 오브젝트 스토리지 수명 주기 정책으로 관리한다.
- **로그 기반 알림**: Loki ruler 에 LogQL 메트릭 쿼리로 알림 규칙을 두고 Alertmanager 로 보낸다.
- **Kubernetes**: 공식 Helm 차트로 배포하고 Alloy 를 DaemonSet 으로 띄운다.

## 언제 쓰나 / 피할 때
- 쓸 때: 대량의 애플리케이션·컨테이너 로그를 싸게 보관하면서 Grafana 에서 메트릭·트레이스와 같이 보고 싶을 때. 이미 [Prometheus](/develop-wiki/backend/observability/prometheus/) 레이블 체계를 쓰고 있으면 개념이 그대로 이어진다.
- 피할 때(대안): 로그 본문 전체에 대한 빠른 전문 검색·복잡한 집계가 핵심이면 역색인 기반 검색 엔진이 맞다. [Elasticsearch](/develop-wiki/backend/database/elasticsearch/)(2024년 AGPLv3 선택지가 추가되어 현재 AGPL·SSPL·Elastic License 2.0 삼중 라이선스) 또는 Apache-2.0 포크인 OpenSearch 를 검토한다. SQL 로 로그를 분석하려면 [ClickHouse](/develop-wiki/backend/database/clickhouse/) 기반 구성도 쓰인다.

## 공식 문서
- [개요](https://grafana.com/docs/loki/latest/get-started/overview/) · [Docker 설치](https://grafana.com/docs/loki/latest/setup/install/docker/) · [LogQL](https://grafana.com/docs/loki/latest/query/) · [Alloy 로 보내기](https://grafana.com/docs/loki/latest/send-data/alloy/) · [Promtail EOL 안내](https://grafana.com/docs/loki/latest/send-data/promtail/) · [Tempo](https://grafana.com/docs/tempo/latest/) · [Mimir](https://grafana.com/docs/mimir/latest/)
