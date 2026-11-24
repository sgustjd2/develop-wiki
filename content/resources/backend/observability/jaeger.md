---
name: Jaeger
url: https://www.jaegertracing.io
docs: https://www.jaegertracing.io/docs/latest/
repo: https://github.com/jaegertracing/jaeger
stars: 23442
domain: backend
category: observability
description: 분산 트레이스를 수집·저장하고 UI 로 조회하는 CNCF 졸업 프로젝트. v2 는 OpenTelemetry Collector 기반 단일 바이너리이며 OTLP 를 직접 받는다.
pricing: oss
tags: [tracing, distributed-tracing, otlp, cncf]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Jaeger 는 Uber 에서 시작해 2019년 CNCF 를 졸업한 분산 트레이싱 백엔드다. 서비스들이 보낸 span 을 받아 저장하고, trace 검색·타임라인(간트 차트)·서비스 의존성 그래프·trace 비교 UI 를 제공한다. 2026-11 기준 최신 릴리스는 v2.23.0(Apache-2.0).

**v2** 는 "OpenTelemetry Collector 의 맞춤 배포판" 으로 다시 만들어졌다. 설정 형식이 Collector 와 같은 YAML(receivers·processors·exporters·extensions)이고, 계측은 Jaeger 전용 클라이언트가 아니라 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) SDK 로 한다. **v1 은 2025-12-31 로 EOL**(마지막 1.76)이라 신규 구축은 v2 로 한다.

## 설치
all-in-one 은 수집기·쿼리·UI·인메모리 저장소를 한 컨테이너로 띄운다(재시작하면 데이터가 사라진다).
```bash
docker run --rm --name jaeger \
  -p 16686:16686 -p 4317:4317 -p 4318:4318 -p 5778:5778 -p 9411:9411 \
  cr.jaegertracing.io/jaegertracing/jaeger:2.23.0
# UI: http://localhost:16686   OTLP: 4317(gRPC) / 4318(HTTP)   Zipkin: 9411
```
운영은 공식 Helm 차트나 OpenTelemetry Operator 로 Kubernetes 에 배포한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Span / Trace | 작업 단위와 그 트리. 시맨틱은 OpenTelemetry 와 같다 |
| 역할(role) | 하나의 바이너리를 설정에 따라 collector·query·all-in-one 등으로 쓴다 |
| `jaeger_storage` 확장 | 저장소 백엔드 정의. Memory, Badger, Cassandra, Elasticsearch, OpenSearch, ClickHouse, (버퍼용) Kafka |
| `jaeger_query` 확장 | UI·조회 API 를 제공하고 어떤 저장소를 읽을지 지정 |
| `jaeger_storage_exporter` | 파이프라인에서 span 을 저장소로 쓰는 exporter |
| Sampling | SDK 쪽 head 샘플링, 원격 샘플링 설정 배포(5778), 적응형 샘플링 지원 |
| SPM | Service Performance Monitoring: span 에서 만든 RED 메트릭을 UI 의 Monitor 탭에 표시 |

## 기본 사용법
OTLP 로 받아 Elasticsearch/OpenSearch 에 저장하는 v2 설정의 뼈대.
```yaml
# jaeger.yaml
service:
  extensions: [jaeger_storage, jaeger_query]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger_storage_exporter]

extensions:
  jaeger_storage:
    backends:
      main_store:
        elasticsearch:
          server_urls: [http://elasticsearch:9200]
  jaeger_query:
    storage:
      traces: main_store

receivers:
  otlp:
    protocols:
      grpc:
      http:
        endpoint: 0.0.0.0:4318
processors:
  batch:
exporters:
  jaeger_storage_exporter:
    trace_storage: main_store
```
```bash
docker run -v ./jaeger.yaml:/jaeger.yaml -p 16686:16686 -p 4317:4317 -p 4318:4318 \
  cr.jaegertracing.io/jaegertracing/jaeger:2.23.0 --config /jaeger.yaml
```
애플리케이션 쪽은 OTel SDK 의 OTLP exporter 엔드포인트만 Jaeger 로 지정한다(`OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318`).

## 자주 쓰는 패턴
- **Collector 앞단**: 앱 → OpenTelemetry Collector(샘플링·속성 정리) → Jaeger 로 두면 백엔드 교체가 쉽다. Jaeger 자체도 Collector 라 직접 받아도 된다.
- **저장소 선택**: 개발은 memory/Badger, 운영은 Elasticsearch·OpenSearch·Cassandra, 대량·분석 쿼리는 ClickHouse.
- **Kafka 버퍼**: 수집 폭주 대비로 collector → Kafka → ingester → 저장소 구성.
- **v1 마이그레이션**: v1 의 agent·collector·query 플래그 구성을 v2 YAML 로 옮긴다. jaeger-agent 대신 OTel SDK 나 Collector 를 쓴다.
- **Grafana 연동**: [Grafana](/develop-wiki/backend/observability/grafana/) 의 Jaeger 데이터 소스로 메트릭·로그 화면에서 trace 로 이동한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈소스로 분산 트레이싱 백엔드를 직접 운영하고 싶을 때, 이미 Elasticsearch·OpenSearch·Cassandra 를 운영 중일 때.
- 피할 때(대안): 오브젝트 스토리지에 싸게 쌓고 Grafana 중심으로 보려면 Grafana Tempo([Loki](/develop-wiki/backend/observability/loki/) 항목 참고), 운영 부담 없이 쓰려면 상용 APM·매니지드 서비스. 에러 추적이 주목적이면 [Sentry](/develop-wiki/backend/observability/sentry/).

## 공식 문서
- [문서 홈](https://www.jaegertracing.io/docs/latest/) · [시작하기](https://www.jaegertracing.io/docs/latest/getting-started/) · [아키텍처](https://www.jaegertracing.io/docs/latest/architecture/) · [다운로드·v1 EOL 안내](https://www.jaegertracing.io/download/) · [설정 예제(GitHub)](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger)
