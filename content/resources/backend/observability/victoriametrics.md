---
name: VictoriaMetrics
url: https://victoriametrics.com
docs: https://docs.victoriametrics.com/
repo: https://github.com/VictoriaMetrics/VictoriaMetrics
stars: 18183
domain: backend
category: observability
description: Prometheus 호환 시계열 DB. 단일 바이너리 또는 클러스터로 메트릭을 저장하고 MetricsQL 로 조회하며, Prometheus 장기 저장소로 많이 쓴다.
pricing: oss
tags: [metrics, time-series, prometheus, metricsql, monitoring, remote-write]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
VictoriaMetrics 는 메트릭 저장·조회에 특화된 시계열 데이터베이스다. Prometheus remote_write 로 데이터를 받고 Prometheus 쿼리 API(`/api/v1/query`, `/api/v1/query_range`)로 읽을 수 있어 [Grafana](/develop-wiki/backend/observability/grafana/) 데이터 소스를 Prometheus 로 두고 그대로 붙인다. 쿼리 언어 MetricsQL 은 PromQL 과 거의 호환되는 상위 집합이다. InfluxDB line protocol, Graphite, OpenTSDB, DataDog, NewRelic, OpenTelemetry 메트릭 형식으로도 수집한다.

배포는 두 가지다. **단일 노드**(`victoria-metrics`, 기본 포트 8428)는 한 프로세스로 수집·저장·조회를 하고, **클러스터판**은 `vminsert`·`vmstorage`·`vmselect` 로 나뉜다. 곁 구성요소로 수집 에이전트 `vmagent`, 알림·레코딩 규칙 `vmalert`, 인증 프록시 `vmauth`, `vmbackup`/`vmrestore` 가 있다. 오픈소스 코어는 Apache-2.0 이고, 상용 지원과 엔터프라이즈 기능은 별도 제공된다. 최신 릴리스는 **v1.156.0**(2026-11-09)이다.

[Prometheus](/develop-wiki/backend/observability/prometheus/) 의 대안·보완이며, 오브젝트 스토리지 기반 장기 저장을 원하면 [Thanos](/develop-wiki/backend/observability/thanos/) 나 [Grafana Mimir](/develop-wiki/backend/observability/grafana-mimir/) 와 비교한다.

## 설치·실행
```bash
docker run -d --name vm -p 8428:8428 \
  -v "$PWD/vmdata:/vmdata" \
  victoriametrics/victoria-metrics:v1.156.0 \
  -storageDataPath=/vmdata -retentionPeriod=12
```
`-retentionPeriod` 는 단위를 생략하면 개월이며 기본값은 1개월, 최소 24시간이다. `-storageDataPath` 기본값은 실행 디렉터리의 `victoria-metrics-data` 이다. 웹 UI 는 `http://localhost:8428/vmui`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 단일 노드 / 클러스터 | 단일 바이너리(수직 확장) vs vminsert/vmselect/vmstorage(수평 확장) |
| `vmagent` | 스크레이프·수신한 메트릭을 가볍게 전달하는 에이전트. 디스크 버퍼링 지원 |
| `vmalert` | 알림·레코딩 룰 평가 (Prometheus 룰 포맷) |
| MetricsQL | PromQL 호환 + 추가 함수. `/api/v1/query` 로 실행 |
| 보존 기간 | `-retentionPeriod` 로 전체 보존 기간 지정 |
| 스크레이프 | `-promscrape.config=prometheus.yml` 로 단일 노드가 직접 수집 |

## 기본 사용법
Prometheus 에서 쓰기:
```yaml
# prometheus.yml
remote_write:
  - url: http://victoriametrics:8428/api/v1/write
```
직접 수집하려면 VictoriaMetrics 에 `-promscrape.config=/etc/prometheus.yml` 를 주고, 조회는 HTTP API 로 한다.
```bash
curl 'http://localhost:8428/api/v1/query' --data-urlencode 'query=up'
curl 'http://localhost:8428/api/v1/query_range' \
  --data-urlencode 'query=rate(http_requests_total[5m])' \
  --data-urlencode 'start=-1h' --data-urlencode 'step=60s'
```

## 자주 쓰는 패턴
- **Prometheus 장기 저장소**: Prometheus 는 짧은 로컬 보존만 두고 `remote_write` 로 VictoriaMetrics 에 보낸다.
- **Prometheus 대체**: `vmagent` 로 스크레이프하고 `vmalert` 로 룰을 평가해 Prometheus 서버를 없앤다.
- **Grafana 연결**: 데이터 소스 유형은 Prometheus, URL 은 `http://victoriametrics:8428` (클러스터판은 `vmselect` 의 테넌트 경로).
- **다중 테넌트**: 클러스터판에서 URL 경로의 `accountID` 로 테넌트를 나눈다.
- **쿼리 비용 관리**: 단일 노드는 `-search.maxQueryDuration` 등 제한 플래그로 무거운 쿼리를 막는다.

## 언제 쓰나 / 피할 때
- 쓸 때: Prometheus 보다 낮은 메모리·디스크로 많은 시계열을 저장하고 싶을 때, 구성이 단순한 장기 저장소가 필요할 때.
- 피할 때(대안): 객체 스토리지(S3 등) 기반 무제한 보존이 우선이면 [Thanos](/develop-wiki/backend/observability/thanos/) 나 Mimir. 완전한 Prometheus 의미론이 필수이면 MetricsQL 과의 미세한 차이를 사전에 확인한다. 엔터프라이즈 전용 기능은 오픈소스판에 없다.

## 공식 문서
- [단일 노드 문서](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/) · [문서 홈](https://docs.victoriametrics.com/) · [릴리스](https://github.com/VictoriaMetrics/VictoriaMetrics/releases)
