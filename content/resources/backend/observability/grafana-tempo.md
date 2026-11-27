---
name: Grafana Tempo
url: https://grafana.com/oss/tempo/
docs: https://grafana.com/docs/tempo/latest/
repo: https://github.com/grafana/tempo
stars: 5595
domain: backend
category: observability
description: 분산 트레이스를 오브젝트 스토리지에 저장하고 TraceQL 로 조회하는 트레이싱 백엔드. 샘플링 부담 없이 대량 트레이스를 저렴하게 보관하고 Grafana 에서 볼 때 쓴다. AGPLv3.
pricing: oss
tags: [tracing, traceql, opentelemetry, grafana, object-storage, lgtm]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Tempo 는 Grafana Labs 의 분산 트레이싱 저장소다. 트레이스를 인덱스 DB 없이 Parquet 기반 블록(vParquet)으로 S3·GCS·Azure Blob 같은 오브젝트 스토리지에 저장해, 대량 트레이스를 낮은 비용으로 보관하는 데 초점을 둔다. OTLP·Jaeger·Zipkin 형식으로 받으며, 조회는 스팬 속성으로 트레이스를 찾는 쿼리 언어 **TraceQL** 로 한다. metrics-generator 가 트레이스에서 RED 메트릭과 서비스 그래프를 만들어 Prometheus 호환 저장소로 보낸다.

라이선스 AGPL-3.0. **3.0**(2026-05)에서 기존 ingester 를 새 쓰기 구조(distributor → Kafka → live-store·block-builder)로 대체하고 2.x 의 폐기 컴포넌트를 제거했으며 TraceQL metrics 를 정식(GA)으로 올렸다. 단일 바이너리 모드는 Kafka 없이 동작한다. 2026-11 기준 최신 릴리스는 v3.1.1(2026-10-21)이고, 3.1 부터 새 블록 기본 형식이 vParquet5 다. 3.0.x·2.10.x 도 패치가 나온다.

같은 LGTM 스택의 로그는 [Loki](/develop-wiki/backend/observability/loki/), 메트릭 장기 저장은 [Grafana Mimir](/develop-wiki/backend/observability/grafana-mimir/), 화면은 [Grafana](/develop-wiki/backend/observability/grafana/) 다.

## 설치
```bash
# 로컬 시험: 공식 저장소의 docker-compose 예제(Tempo + Alloy + Prometheus + Grafana)
git clone https://github.com/grafana/tempo.git
cd tempo/example/docker-compose/single-binary   # distributed, multitenant 예제도 있음
docker compose up -d                            # Grafana: http://localhost:3000

# Kubernetes
helm repo add grafana https://grafana.github.io/helm-charts
helm search repo grafana/tempo            # 단일 바이너리·분산 배포 차트 확인
```
2.x 에서 올릴 때는 `tempo-cli migrate config` 로 설정을 변환하고 3.0 마이그레이션 가이드를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Distributor | OTLP(gRPC 4317 / HTTP 4318)·Jaeger·Zipkin 수신 |
| Live-store / Block-builder | 3.x 쓰기 경로. 최근 데이터 조회와 오브젝트 스토리지 블록 생성을 분담 |
| Querier / Query-frontend | 트레이스 ID 조회·TraceQL 검색 분산 실행 (HTTP 3200) |
| Compactor·Backend scheduler | 블록 병합·보존 기간 삭제·리댁션 작업 |
| metrics-generator | 트레이스로부터 span metrics·service graph 생성, remote write 로 전송 |
| TraceQL | `{ span.http.status_code >= 500 }` 형태로 스팬을 선택하는 쿼리 언어 |
| TraceQL metrics | `rate()`, `quantile_over_time()` 등으로 트레이스에서 즉석 메트릭 계산 |

## 기본 사용법
OpenTelemetry Collector 에서 Tempo 로 내보내기:
```yaml
receivers:
  otlp:
    protocols: { grpc: {}, http: {} }
exporters:
  otlp/tempo:
    endpoint: tempo:4317
    tls: { insecure: true }
service:
  pipelines:
    traces: { receivers: [otlp], exporters: [otlp/tempo] }
```
Grafana Explore 에서 TraceQL:
```text
{ resource.service.name = "checkout" && span.http.status_code >= 500 }
{ span.db.system = "postgresql" && duration > 500ms } | select(span.db.statement)
{ resource.service.name = "checkout" } | rate() by (span.http.route)
```

## 자주 쓰는 패턴
- **로그·메트릭과 연결**: 로그의 trace_id 에서 Tempo 로 이동(Loki derived field), 메트릭 exemplar 에서 트레이스로 이동, 트레이스에서 관련 로그로 이동(trace to logs)을 Grafana 데이터소스 설정으로 묶는다.
- **service graph**: metrics-generator 를 켜고 Prometheus 호환 저장소로 보내 서비스 간 호출 지도와 RED 대시보드를 만든다.
- **샘플링**: 저장 비용이 낮아도 수집 비용은 남으므로 OTel Collector 의 tail sampling 으로 오류·느린 요청 위주로 남기는 구성을 함께 쓴다.
- **보존 기간**: compactor 의 `block_retention` 과 버킷 수명 주기 정책을 맞춘다.

## 언제 쓰나 / 피할 때
- 쓸 때: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 로 트레이스를 대량 수집하고 Grafana 에서 로그·메트릭과 함께 보고 싶을 때, 인덱스 DB(Elasticsearch·Cassandra) 운영을 피하고 싶을 때.
- 피할 때(대안): 단순한 단일 노드 트레이싱 UI 면 [Jaeger](/develop-wiki/backend/observability/jaeger/). AGPL 이 조직 정책에 맞지 않거나 운영 부담을 줄이려면 매니지드 Grafana Cloud 또는 다른 APM.
- 주의: 3.x 분산 모드는 Kafka 호환 큐가 필요하다. 2.x 설정은 그대로 쓸 수 없으니 마이그레이션 가이드를 먼저 본다.

## 공식 문서
- [문서 홈](https://grafana.com/docs/tempo/latest/) · [TraceQL](https://grafana.com/docs/tempo/latest/traceql/) · [3.0 마이그레이션](https://grafana.com/docs/tempo/latest/set-up-for-tracing/setup-tempo/migrate-to-3/) · [GitHub 릴리스](https://github.com/grafana/tempo/releases)
